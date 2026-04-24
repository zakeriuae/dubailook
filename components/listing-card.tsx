'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Building2, LandPlot, Briefcase, Package, Users, Eye, MessageCircle, ExternalLink, Phone, Clock } from 'lucide-react'
import type { Listing, ListingCTA } from '@/lib/types'
import { LISTING_TYPE_LABELS, LISTING_STATUS_LABELS } from '@/lib/types'
import { FormattedText } from '@/components/formatted-text'
import { formatRelativeDate } from '@/lib/utils'
import { getOptimizedImageUrl } from '@/lib/storage'

interface ListingCardProps {
  listing: Listing
  showStatus?: boolean
  showStats?: boolean
}

const typeIcons: Record<string, React.ReactNode> = {
  property: <Building2 className="h-4 w-4" />,
  land: <LandPlot className="h-4 w-4" />,
  project: <Briefcase className="h-4 w-4" />,
  custom_offer: <Package className="h-4 w-4" />,
  buyer_request: <Users className="h-4 w-4" />,
}

const statusColors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  approved: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-red-100 text-red-800',
  published: 'bg-primary/10 text-primary',
}

function CTAButton({ cta }: { cta: ListingCTA }) {
  if (cta.cta_type === 'whatsapp') {
    return (
      <Button size="sm" variant="outline" className="gap-2" asChild>
        <a href={`https://wa.me/${cta.value.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">
          <Phone className="h-4 w-4" />
          WhatsApp
        </a>
      </Button>
    )
  }
  
  if (cta.cta_type === 'telegram') {
    return (
      <Button size="sm" variant="outline" className="gap-2 border-[var(--telegram)] text-[var(--telegram)]" asChild>
        <a href={`https://t.me/${cta.value.replace('@', '')}`} target="_blank" rel="noopener noreferrer">
          <MessageCircle className="h-4 w-4" />
          Telegram
        </a>
      </Button>
    )
  }
  
  return (
    <Button size="sm" variant="outline" className="gap-2" asChild>
      <a href={cta.value} target="_blank" rel="noopener noreferrer">
        <ExternalLink className="h-4 w-4" />
        {cta.label || 'Visit'}
      </a>
    </Button>
  )
}

export function ListingCard({ listing, showStatus = false, showStats = false }: ListingCardProps) {
  return (
    <Card className="group overflow-hidden transition-all hover:shadow-lg p-0">
      {listing.image_url ? (
        <Link href={`/listings/${listing.id}`}>
          <div className="relative aspect-video overflow-hidden bg-muted">
            <Image
              src={getOptimizedImageUrl(listing.image_url, { width: 400 })}
              alt={listing.title}
              fill
              className="object-cover transition-transform duration-500 scale-105 group-hover:scale-110"
            />
            <Badge className="absolute left-3 top-3 gap-1">
              {typeIcons[listing.listing_type]}
              {LISTING_TYPE_LABELS[listing.listing_type]}
            </Badge>
            {showStatus && (
              <Badge className={`absolute right-3 top-3 ${statusColors[listing.status]}`}>
                {LISTING_STATUS_LABELS[listing.status]}
              </Badge>
            )}
          </div>
        </Link>
      ) : null}
      
      <CardHeader className="p-3 pb-0">
        {!listing.image_url && (
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <Badge variant="secondary" className="gap-1 text-[10px] h-4 px-1.5">
              {typeIcons[listing.listing_type]}
              {LISTING_TYPE_LABELS[listing.listing_type]}
            </Badge>
            {showStatus && (
              <Badge variant="outline" className={`text-[10px] h-4 px-1.5 ${statusColors[listing.status]}`}>
                {LISTING_STATUS_LABELS[listing.status]}
              </Badge>
            )}
          </div>
        )}
        <Link href={`/listings/${listing.id}`}>
          <h3 className="line-clamp-2 text-sm md:text-base font-bold transition-colors hover:text-primary break-words leading-tight">
            {listing.title}
          </h3>
        </Link>
        <div className="flex items-center gap-1 text-[9px] text-muted-foreground mt-0.5">
          <Clock className="h-2.5 w-2.5" />
          {formatRelativeDate(listing.created_at)}
        </div>
      </CardHeader>
      
      <CardContent className="px-3 pb-1 pt-1.5">
        <div className="line-clamp-2 text-[11px] text-muted-foreground leading-snug break-words">
          {listing.description.replace(/\n+/g, ' ')}
        </div>
        
        {showStats && listing.listing_stats && (
          <div className="mt-1.5 flex items-center gap-3 text-[9px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <Eye className="h-2.5 w-2.5" />
              {listing.listing_stats.page_views}
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-2.5 w-2.5" />
              {listing.listing_stats.list_impressions}
            </span>
          </div>
        )}
      </CardContent>
      
      {listing.listing_cta && listing.listing_cta.length > 0 && (
        <CardFooter className="flex flex-wrap gap-1.5 px-3 pb-3 pt-1">
          {listing.listing_cta.map((cta) => (
            <CTAButton key={cta.id} cta={cta} />
          ))}
        </CardFooter>
      )}
    </Card>
  )
}
