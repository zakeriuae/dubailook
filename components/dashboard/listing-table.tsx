'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Empty, EmptyTitle, EmptyDescription } from '@/components/ui/empty'
import { Spinner } from '@/components/ui/spinner'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'
import { Eye, ExternalLink, Clock, CheckCircle, XCircle, Send } from 'lucide-react'
import { LISTING_TYPE_LABELS, LISTING_STATUS_LABELS } from '@/lib/types'
import type { Listing } from '@/lib/types'
import { getOptimizedImageUrl } from '@/lib/storage'
import { formatRelativeDate } from '@/lib/utils'

interface DashboardListingTableProps {
  listings: Listing[]
}

const statusColors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
  approved: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  rejected: 'bg-red-100 text-red-800 border-red-200',
  published: 'bg-primary/10 text-primary border-primary/20',
  deactivated: 'bg-slate-100 text-slate-800 border-slate-200',
}

const statusIcons: Record<string, React.ReactNode> = {
  pending: <Clock className="h-3 w-3" />,
  approved: <CheckCircle className="h-3 w-3" />,
  rejected: <XCircle className="h-3 w-3" />,
  published: <Send className="h-3 w-3" />,
  deactivated: <XCircle className="h-3 w-3" />,
}

export function DashboardListingTable({ listings }: DashboardListingTableProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState<string | null>(null)

  const handleRepost = async (listingId: string) => {
    setIsLoading(listingId)
    try {
      const res = await fetch('/api/listings/repost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId }),
      })

      const data = await res.json()

      if (res.ok) {
        toast.success('Listing reposted successfully to Telegram!')
        router.refresh()
      } else {
        toast.error(data.error || 'Failed to repost')
      }
    } catch {
      toast.error('An error occurred during repost')
    } finally {
      setIsLoading(null)
    }
  }

  const handleStatusChange = async (listingId: string, status: string) => {
    setIsLoading(listingId)
    try {
      const res = await fetch('/api/listings/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId, status }),
      })

      if (res.ok) {
        toast.success(`Listing ${status === 'deactivated' ? 'deactivated' : 'activated'} successfully`)
        router.refresh()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to update status')
      }
    } catch {
      toast.error('An error occurred')
    } finally {
      setIsLoading(null)
    }
  }

  if (listings.length === 0) {
    return (
      <Empty className="py-12">
        <EmptyTitle>No listings found</EmptyTitle>
        <EmptyDescription>You haven&apos;t created any listings yet.</EmptyDescription>
        <Button asChild className="mt-4">
          <Link href="/listings/new">Create Your First Listing</Link>
        </Button>
      </Empty>
    )
  }

  return (
    <div className="space-y-4">
      {/* Desktop Table View */}
      <div className="hidden rounded-xl border bg-card md:block overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[350px]">Listing</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Views</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Last Post</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {listings.map((listing) => (
              <TableRow key={listing.id} className="hover:bg-muted/30 transition-colors">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted border">
                      {listing.image_url ? (
                        <Image
                          src={getOptimizedImageUrl(listing.image_url, { width: 100 })}
                          alt={listing.title}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-[10px] text-muted-foreground text-center px-1">
                          No img
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-sm text-foreground">{listing.title}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {listing.description.slice(0, 45)}...
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-[10px] font-medium py-0 h-5">
                    {LISTING_TYPE_LABELS[listing.listing_type]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant="outline" 
                    className={`gap-1 text-[10px] font-medium py-0 h-5 whitespace-nowrap ${statusColors[listing.status]}`}
                  >
                    {statusIcons[listing.status]}
                    {LISTING_STATUS_LABELS[listing.status]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                    <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                    {listing.listing_stats?.page_views || 0}
                  </div>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {new Date(listing.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-xs font-medium">
                  {(() => {
                    const latest = listing.listing_schedules
                      ?.filter(s => s.is_completed && s.published_at)
                      .reduce((acc, s) => !acc || new Date(s.published_at!) > new Date(acc) ? s.published_at : acc, null as string | null);
                    return formatRelativeDate(latest);
                  })()}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button size="sm" variant="outline" className="h-8 gap-1.5" asChild>
                      <Link href={`/listings/${listing.id}`}>
                        <ExternalLink className="h-3.5 w-3.5" />
                        Details
                      </Link>
                    </Button>

                    {(listing.status === 'published' || listing.status === 'approved') && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 gap-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        onClick={() => handleRepost(listing.id)}
                        disabled={
                          isLoading === listing.id || 
                          listing.listing_schedules?.some(s => s.is_completed && s.published_at?.startsWith(new Date().toISOString().split('T')[0]))
                        }
                      >
                        {isLoading === listing.id ? (
                          <Spinner className="h-3.5 w-3.5" />
                        ) : (
                          <Send className="h-3.5 w-3.5" />
                        )}
                        {listing.listing_schedules?.some(s => s.is_completed && s.published_at?.startsWith(new Date().toISOString().split('T')[0])) 
                          ? 'Reposted' 
                          : 'Repost'}
                      </Button>
                    )}

                    {listing.status !== 'deactivated' ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 gap-1.5 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                        onClick={() => handleStatusChange(listing.id, 'deactivated')}
                        disabled={isLoading === listing.id}
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        Deactivate
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 gap-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                        onClick={() => handleStatusChange(listing.id, 'pending')}
                        disabled={isLoading === listing.id}
                      >
                        <CheckCircle className="h-3.5 w-3.5" />
                        Re-activate
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card List View (consistent with admin table style) */}
      <div className="grid gap-4 md:hidden">
        {listings.map((listing) => (
          <Card key={listing.id} className="overflow-hidden border-none shadow-sm ring-1 ring-border">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted border">
                  {listing.image_url ? (
                    <Image
                      src={getOptimizedImageUrl(listing.image_url, { width: 100 })}
                      alt={listing.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-[10px] text-muted-foreground text-center px-1">
                      No image
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-bold text-sm leading-tight text-foreground line-clamp-2">
                      {listing.title}
                    </p>
                    <Badge variant="outline" className="shrink-0 text-[10px] bg-muted/50 uppercase font-bold tracking-tighter scale-90 origin-top-right">
                      {LISTING_TYPE_LABELS[listing.listing_type]}
                    </Badge>
                  </div>
                  
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Badge 
                        variant="outline" 
                        className={`gap-1 text-[10px] font-bold py-0 h-5 ${statusColors[listing.status]}`}
                    >
                        {statusIcons[listing.status]}
                        {LISTING_STATUS_LABELS[listing.status]}
                    </Badge>
                    
                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground ml-1">
                      <Eye className="h-3 w-3" />
                      {listing.listing_stats?.page_views || 0}
                    </div>
                    
                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Send className="h-2.5 w-2.5" />
                      {(() => {
                        const latest = listing.listing_schedules
                          ?.filter(s => s.is_completed && s.published_at)
                          .reduce((acc, s) => !acc || new Date(s.published_at!) > new Date(acc) ? s.published_at : acc, null as string | null);
                        return formatRelativeDate(latest);
                      })()}
                    </div>
                    
                    <div className="text-[11px] text-muted-foreground ml-auto">
                      {new Date(listing.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between gap-2 border-t pt-3">
                <Button variant="outline" size="sm" className="h-9 flex-1 gap-1.5" asChild>
                  <Link href={`/listings/${listing.id}`}>
                    <ExternalLink className="h-4 w-4" />
                    Details
                  </Link>
                </Button>

                {(listing.status === 'published' || listing.status === 'approved') && (
                  <Button
                    size="sm"
                    className="h-9 flex-1 gap-1.5 bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                    onClick={() => handleRepost(listing.id)}
                    disabled={
                      isLoading === listing.id || 
                      listing.listing_schedules?.some(s => s.is_completed && s.published_at?.startsWith(new Date().toISOString().split('T')[0]))
                    }
                  >
                    {isLoading === listing.id ? (
                      <Spinner className="h-4 w-4" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    {listing.listing_schedules?.some(s => s.is_completed && s.published_at?.startsWith(new Date().toISOString().split('T')[0])) 
                      ? 'Posted Today' 
                      : 'Repost'}
                  </Button>
                )}

                {listing.status !== 'deactivated' ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-9 flex-1 gap-1.5 border-orange-200 text-orange-600 hover:bg-orange-50"
                    onClick={() => handleStatusChange(listing.id, 'deactivated')}
                    disabled={isLoading === listing.id}
                  >
                    <XCircle className="h-4 w-4" />
                    Deactivate
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-9 flex-1 gap-1.5 border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                    onClick={() => handleStatusChange(listing.id, 'pending')}
                    disabled={isLoading === listing.id}
                  >
                    <CheckCircle className="h-4 w-4" />
                    Re-activate
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
