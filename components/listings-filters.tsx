'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { LISTING_TYPE_LABELS } from '@/lib/types'
import type { ListingType } from '@/lib/types'

const listingTypes: (ListingType | 'all')[] = ['all', 'property', 'land', 'project', 'custom_offer', 'buyer_request']

export function ListingsFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeType = searchParams.get('type') || 'all'

  const handleFilterChange = (type: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (type === 'all') {
      params.delete('type')
    } else {
      params.set('type', type)
    }
    router.push(`?${params.toString()}`)
  }

  return (
    <div className="mb-6 flex flex-wrap gap-2">
      {listingTypes.map((type) => (
        <Button
          key={type}
          variant={activeType === type ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleFilterChange(type)}
        >
          {type === 'all' ? 'All' : LISTING_TYPE_LABELS[type]}
        </Button>
      ))}
    </div>
  )
}
