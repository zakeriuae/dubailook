import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/session'

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin()
    const { listingId, action, reason } = await request.json()

    if (!listingId || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = await createClient()

    let newStatus: string
    switch (action) {
      case 'approve':
        newStatus = 'approved'
        break
      case 'reject':
        newStatus = 'rejected'
        break
      case 'publish':
        newStatus = 'published'
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

    // If publishing OR approving, send to Telegram
    if (action === 'publish' || action === 'approve') {
      try {
        // Use a relative URL or full URL if available
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (request.headers.get('origin') || '')
        await fetch(`${baseUrl}/api/telegram/publish`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ listingId }),
        })
      } catch (e) {
        console.error('Failed to publish to Telegram:', e)
      }
    }

    return NextResponse.json({ success: true, status: newStatus })
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
