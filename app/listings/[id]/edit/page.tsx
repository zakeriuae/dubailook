import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/session'
import { ListingForm } from '@/components/listing-form'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import type { Listing, ListingCTA } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function EditListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const profile = await getSession()
  
  if (!profile) {
    redirect('/login')
  }

  const supabase = await createClient()

  const { data: listing } = await supabase
    .from('listings')
    .select(`
      *,
      listing_cta (*)
    `)
    .eq('id', id)
    .single() as { data: (Listing & { listing_cta: ListingCTA[] }) | null }

  if (!listing) {
    notFound()
  }

  // Security check: Only owner or admin can edit
  const isOwner = listing.user_id === profile.id
  const isAdmin = profile.is_admin

  if (!isOwner && !isAdmin) {
    notFound()
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4">
          <Link href={isAdmin ? '/admin' : '/dashboard'}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to {isAdmin ? 'Admin' : 'Dashboard'}
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Edit Listing</h1>
        <p className="text-muted-foreground">Modify your listing details below.</p>
      </div>

      <ListingForm listing={listing} />
    </div>
  )
}
