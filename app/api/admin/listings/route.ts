import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/session'

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin()
    const { listingId, action, reason } = await request.json()

    if (!listingId || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = await createClient()

    // Enforce daily limit for the 'repost' action
    if (action === 'repost') {
      const adminClient = await createAdminClient()
      const { data: publishedToday } = await adminClient
        .rpc('was_published_today', { p_listing_id: listingId })

      if (publishedToday) {
        return NextResponse.json({ 
          error: 'This listing has already been published today. You can only repost once per day.' 
        }, { status: 429 })
      }
    }

    let newStatus: string
    switch (action) {
      case 'approve':
        newStatus = 'published'
        break
      case 'reject':
        newStatus = 'rejected'
        break
      case 'publish':
      case 'repost':
      case 'activate':
        newStatus = 'published'
        break
      case 'deactivate':
        newStatus = 'deactivated'
        break
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    // Update listing status
    const { error: updateError } = await supabase
      .from('listings')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', listingId)

    if (updateError) {
      console.error('Error updating listing:', updateError)
      return NextResponse.json({ error: 'Failed to update listing' }, { status: 500 })
    }

    // Log admin action
    await supabase.from('admin_actions').insert({
      admin_id: admin.id,
      listing_id: listingId,
      action: action,
      reason: reason || null,
    })

    // If publishing OR approving OR reposting, send to Telegram
    let publishError = null
    if (action === 'publish' || action === 'approve' || action === 'repost') {
      try {
        const origin = request.headers.get('origin') || ''
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || origin || 'http://localhost:3000'
        
        const publishRes = await fetch(`${baseUrl}/api/telegram/publish`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ listingId, force: action === 'repost' }),
        })
        
        if (!publishRes.ok) {
          const errorData = await publishRes.json().catch(() => ({ error: 'Unknown publishing error' }))
          publishError = errorData.error || 'Failed to send to Telegram'
          console.error('Telegram publish API failed:', errorData)
        }
      } catch (e) {
        publishError = 'Connection error to publishing service'
        console.error('Failed to trigger Telegram publish:', e)
      }
    }

    if (publishError && action === 'repost') {
      return NextResponse.json({ error: publishError }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      status: newStatus,
      warning: publishError // Include as warning if it was part of an approve action
    })
  } catch (error) {
    console.error('Admin action error:', error)
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if ((error as Error).message === 'Forbidden') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
