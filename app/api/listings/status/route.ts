import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/session'
import type { ListingStatus } from '@/lib/types'

export async function POST(request: NextRequest) {
  try {
    const profile = await requireAuth()
    const { listingId, status } = await request.json()

    if (!listingId || !status) {
      return NextResponse.json({ error: 'Missing listingId or status' }, { status: 400 })
    }

    const validStatuses: ListingStatus[] = ['pending', 'approved', 'rejected', 'published', 'deactivated']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const supabase = await createAdminClient()

    // 1. Fetch listing to check ownership (unless admin)
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('id, user_id')
      .eq('id', listingId)
      .single()

    if (listingError || !listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    const isOwner = listing.user_id === profile.id
    const isAdmin = profile.is_admin

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Update status
    const { error: updateError } = await supabase
      .from('listings')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', listingId)

    if (updateError) {
      console.error('Status update error:', updateError)
      return NextResponse.json({ error: 'Failed to update status' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Status action error:', error)
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
