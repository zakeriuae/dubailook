import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Listing, PublishingMode } from '@/lib/types'

// This endpoint should be called by a cron job (e.g., every hour)
// Vercel Cron: Add to vercel.json or use Vercel dashboard

function shouldPublish(publishingMode: PublishingMode, lastPublishDate: Date | null): boolean {
  const now = new Date()
  const hour = now.getHours()

  if (!lastPublishDate) return true

  const timeSinceLastPublish = now.getTime() - lastPublishDate.getTime()
  const hoursSinceLastPublish = timeSinceLastPublish / (1000 * 60 * 60)

  switch (publishingMode) {
    case 'one_time':
      return false // Already published once

    case 'ten_times_daily':
      // Publish every ~2.4 hours (10 times in 24 hours)
      // Also check we haven't exceeded 10 publishes today
      return hoursSinceLastPublish >= 2.4

    case 'ten_times_every_other_day':
      // 10 times every 48 hours = every ~4.8 hours
      return hoursSinceLastPublish >= 4.8

    case 'five_times_weekly':
      // 5 times in 7 days = every ~33.6 hours
      return hoursSinceLastPublish >= 33.6

    default:
      return false
  }
}

async function countTodayPublishes(supabase: any, listingId: string): Promise<number> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const { count } = await supabase
    .from('listing_schedules')
    .select('*', { count: 'exact', head: true })
    .eq('listing_id', listingId)
    .gte('published_at', today.toISOString())
    .eq('is_completed', true)

  return count || 0
}

export async function GET(request: NextRequest) {
  // Verify cron secret (optional but recommended)
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = await createClient()

    // Fetch all approved listings (not one_time that's already published)
    const { data: listings, error } = await supabase
      .from('listings')
      .select('*')
      .in('status', ['approved', 'published'])
      .neq('publishing_mode', 'one_time')

    if (error || !listings) {
      console.error('Error fetching listings:', error)
      return NextResponse.json({ error: 'Failed to fetch listings' }, { status: 500 })
    }

    const results: { listingId: string; success: boolean; reason?: string }[] = []

    for (const listing of listings as Listing[]) {
      // Get last publish date
      const { data: lastSchedule } = await supabase
        .from('listing_schedules')
        .select('published_at')
        .eq('listing_id', listing.id)
        .eq('is_completed', true)
        .order('published_at', { ascending: false })
        .limit(1)
        .single()

      const lastPublishDate = lastSchedule?.published_at 
        ? new Date(lastSchedule.published_at) 
        : null

      // Check if should publish
      if (!shouldPublish(listing.publishing_mode, lastPublishDate)) {
        results.push({ listingId: listing.id, success: false, reason: 'Not time yet' })
        continue
      }

      // Check daily limits for ten_times_daily
      if (listing.publishing_mode === 'ten_times_daily') {
        const todayCount = await countTodayPublishes(supabase, listing.id)
        if (todayCount >= 10) {
          results.push({ listingId: listing.id, success: false, reason: 'Daily limit reached' })
          continue
        }
      }

      // Publish to Telegram
      try {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://dubilook.ae'
        const publishRes = await fetch(`${baseUrl}/api/telegram/publish`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ listingId: listing.id }),
        })

        if (publishRes.ok) {
          results.push({ listingId: listing.id, success: true })
        } else {
          const data = await publishRes.json()
          results.push({ listingId: listing.id, success: false, reason: data.error })
        }
      } catch (e) {
        results.push({ listingId: listing.id, success: false, reason: 'Publish request failed' })
      }
    }

    return NextResponse.json({ 
      processed: listings.length, 
      results 
    })
  } catch (error) {
    console.error('Cron publish error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Also support POST for manual triggering
export { GET as POST }
