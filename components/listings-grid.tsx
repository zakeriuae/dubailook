'use client'

import { ListingCard } from './listing-card'
import { Empty, EmptyTitle, EmptyDescription } from '@/components/ui/empty'
import type { Listing } from '@/lib/types'

interface ListingsGridProps {
  listings: Listing[]
  showStatus?: boolean
  showStats?: boolean
  emptyMessage?: string
}

export function ListingsGrid({ 
  listings, 
  showStatus = false, 
  showStats = false,
  emptyMessage = "No listings found"
}: ListingsGridProps) {
  if (listings.length === 0) {
    return (
      <Empty className="py-16">
        <EmptyTitle>{emptyMessage}</EmptyTitle>
        <EmptyDescription>
          Check back later for new listings or adjust your filters.
        </EmptyDescription>
      </Empty>
    )
  }

  return (
    <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 [column-fill:_balance]">
      {listings.map((listing) => (
        <div key={listing.id} className="break-inside-avoid-column mb-6">
          <ListingCard 
            listing={listing} 
            showStatus={showStatus}
            showStats={showStats}
          />
        </div>
      ))}
    </div>
  )
}
