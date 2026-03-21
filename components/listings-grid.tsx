'use client'

import { ListingCard } from './listing-card'
import { Empty } from '@/components/ui/empty'
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
        <Empty.Title>{emptyMessage}</Empty.Title>
        <Empty.Description>
          Check back later for new listings or adjust your filters.
        </Empty.Description>
      </Empty>
    )
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {listings.map((listing) => (
        <ListingCard 
          key={listing.id} 
          listing={listing} 
          showStatus={showStatus}
          showStats={showStats}
        />
      ))}
    </div>
  )
}
