import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/session'

export async function POST(request: NextRequest) {
  try {
    const profile = await requireAuth()
    const { listingId } = await request.json()

    if (!listingId) {
      return NextResponse.json({ error: 'Missing listingId' }, { status: 400 })
    }

    const supabase = await createAdminClient()

    // 1. Verify ownership and status
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('id, user_id, status')
      .eq('id', listingId)
      .eq('user_id', profile.id)
      .single()

    if (listingError || !listing) {
      return NextResponse.json({ error: 'Listing not found or access denied' }, { status: 404 })
    }

    if (listing.status !== 'published' && listing.status !== 'approved') {
      return NextResponse.json({ error: 'Only published or approved listings can be reposted' }, { status: 400 })
    }

    // 2. Check daily limit (Look at listing_schedules as the master record)
    const { data: publishedToday, error: checkError } = await supabase
      .rpc('was_published_today', { p_listing_id: listingId })

    if (publishedToday) {
      return NextResponse.json({ 
        error: 'This listing has already been published today. You can only repost once per day.' 
      }, { status: 429 })
    }

    // 3. Trigger Telegram Publish
    const origin = request.headers.get('origin') || ''
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || origin || 'http://localhost:3000'
    
    const publishRes = await fetch(`${baseUrl}/api/telegram/publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listingId, force: true }),
    })

    if (!publishRes.ok) {
      const errorData = await publishRes.json().catch(() => ({ error: 'Telegram publishing failed' }))
      return NextResponse.json({ error: errorData.error || 'Failed to repost to Telegram' }, { status: 500 })
    }

    // 4. Log the repost
    const { error: logError } = await supabase
      .from('listing_reposts')
      .insert({
        listing_id: listingId,
        user_id: profile.id,
      })

    if (logError) {
      console.error('Error logging repost:', logError)
      // We don't fail the request because the TG publish was successful
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Repost action error:', error)
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
