import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/session'
import { ListingsGrid } from '@/components/listings-grid'
import { ListingsFilters } from '@/components/listings-filters'
import { Spinner } from '@/components/ui/spinner'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const profile = await getSession()
  const supabase = await createClient()
  
  // Fetch published listings
  const { data: listings } = await supabase
    .from('listings')
    .select(`
      *,
      listing_cta (*),
      listing_stats (*),
      user:profiles (*)
    `)
    .in('status', ['published', 'approved'])
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
          Property Listings
        </h1>
        <p className="mt-2 text-muted-foreground">
          Browse our latest properties, land, and real estate projects
        </p>
      </div>
      
      <Suspense fallback={<div className="flex justify-center py-4"><Spinner /></div>}>
        <ListingsFilters />
      </Suspense>
      
      <ListingsGrid listings={listings || []} />
    </div>
  )
}
