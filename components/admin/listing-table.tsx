'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { CheckCircle, XCircle, Send, Eye, ExternalLink, Clock } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { LISTING_TYPE_LABELS } from '@/lib/types'
import type { Listing } from '@/lib/types'
import { getOptimizedImageUrl } from '@/lib/storage'
import { formatRelativeDate, getAvatarColor, getInitials, cn } from '@/lib/utils'

interface AdminListingTableProps {
  listings: Listing[]
  showActions?: boolean
  showPublishAction?: boolean
}

export function AdminListingTable({ listings, showActions = false, showPublishAction = false }: AdminListingTableProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  const handleAction = async (listingId: string, action: 'approve' | 'reject' | 'publish' | 'repost' | 'deactivate' | 'activate', reason?: string) => {
    setIsLoading(listingId)
    try {
      const res = await fetch('/api/admin/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId, action, reason }),
      })

      const data = await res.json()

      if (res.ok) {
        toast.success(`Listing ${action}ed successfully`)
        router.refresh()
      } else {
        toast.error(data.error || `Failed to ${action} listing`)
      }
    } catch {
      toast.error('An error occurred')
    } finally {
      setIsLoading(null)
      setRejectDialogOpen(false)
      setSelectedListing(null)
      setRejectReason('')
    }
  }

  const openRejectDialog = (listing: Listing) => {
    setSelectedListing(listing)
    setRejectDialogOpen(true)
  }

  if (listings.length === 0) {
    return (
      <Empty className="py-8">
        <EmptyTitle>No listings found</EmptyTitle>
        <EmptyDescription>There are no listings in this category.</EmptyDescription>
      </Empty>
    )
  }

  return (
    <>
      {/* Desktop Table View */}
      <div className="hidden border-t md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">Listing</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Stats</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Last Post</TableHead>
              <TableHead className="text-center">Active</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {listings.map((listing) => (
              <TableRow key={listing.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-muted">
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
                      <p className="truncate font-medium text-sm">{listing.title}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {listing.description.slice(0, 40)}...
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-[10px] py-0 h-5">
                    {LISTING_TYPE_LABELS[listing.listing_type]}
                  </Badge>
                </TableCell>
                <TableCell>
                  {listing.user && (
                    <div className="flex items-center gap-2">
                       <Avatar className="h-6 w-6 ring-1 ring-border">
                        <AvatarImage src={listing.user.photo_url || undefined} />
                        <AvatarFallback className={cn(
                          "text-white font-bold text-[10px] bg-gradient-to-tr",
                          getAvatarColor(listing.user.first_name || 'User')
                        )}>
                          {getInitials(listing.user.first_name, listing.user.last_name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs truncate max-w-[80px]">{listing.user.first_name}</span>
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Eye className="h-3 w-3" />
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
                <TableCell className="text-center">
                  <Switch 
                    checked={listing.status !== 'deactivated'}
                    onCheckedChange={(checked) => handleAction(listing.id, checked ? 'activate' : 'deactivate')}
                    disabled={isLoading === listing.id}
                  />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0" asChild>
                      <Link href={`/listings/${listing.id}`}>
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </Button>
                    
                    {showActions && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 gap-1 border-emerald-200 px-2 text-emerald-600 hover:bg-emerald-50"
                          onClick={() => handleAction(listing.id, 'approve')}
                          disabled={isLoading === listing.id}
                        >
                          {isLoading === listing.id ? (
                            <Spinner className="h-4 w-4" />
                          ) : (
                            <CheckCircle className="h-4 w-4" />
                          )}
                          <span className="hidden lg:inline">Approve</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 gap-1 border-red-200 px-2 text-red-600 hover:bg-red-50"
                          onClick={() => openRejectDialog(listing)}
                          disabled={isLoading === listing.id}
                        >
                          <XCircle className="h-4 w-4" />
                          <span className="hidden lg:inline">Reject</span>
                        </Button>
                      </>
                    )}

                    {showPublishAction && (
                      <Button
                        size="sm"
                        className="h-8 gap-1 px-3"
                        onClick={() => handleAction(listing.id, 'publish')}
                        disabled={isLoading === listing.id}
                      >
                        {isLoading === listing.id ? (
                          <Spinner className="h-4 w-4" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                        Publish
                      </Button>
                    )}

                    {listing.status === 'published' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 gap-1 border-blue-200 px-2 text-blue-600 hover:bg-blue-50"
                        onClick={() => handleAction(listing.id, 'repost')}
                        disabled={isLoading === listing.id}
                      >
                        {isLoading === listing.id ? (
                          <Spinner className="h-3 w-3" />
                        ) : (
                          <Send className="h-3 w-3" />
                        )}
                        <span className="hidden lg:inline">Repost</span>
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card List View */}
      <div className="space-y-3 md:hidden">
        {listings.map((listing) => (
          <Card key={listing.id} className="overflow-hidden border-none shadow-sm ring-1 ring-border rounded-xl">
            <CardContent className="p-3">
              <div className="flex items-start gap-3">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-muted border">
                  {listing.image_url ? (
                    <Image
                      src={getOptimizedImageUrl(listing.image_url, { width: 100 })}
                      alt={listing.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-[8px] text-muted-foreground text-center px-1">
                      No img
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1 flex flex-col justify-between min-h-[56px]">
                  <div>
                    <div className="flex items-start justify-between gap-1">
                      <p className="font-bold text-[13px] leading-tight text-foreground line-clamp-2 pr-1">
                        {listing.title}
                      </p>
                      <Badge variant="outline" className="shrink-0 text-[10px] lowercase font-medium px-1.5 py-0 h-4 border-emerald-200 text-emerald-700 bg-emerald-50">
                        {LISTING_TYPE_LABELS[listing.listing_type]}
                      </Badge>
                    </div>
                    
                    <div className="mt-1.5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {listing.user && (
                          <div className="flex items-center gap-1">
                            <Avatar className="h-4 w-4">
                              <AvatarImage src={listing.user.photo_url || undefined} />
                              <AvatarFallback className={cn(
                                "text-white font-bold text-[6px] bg-gradient-to-tr",
                                getAvatarColor(listing.user.first_name || 'User')
                              )}>
                                {getInitials(listing.user.first_name, listing.user.last_name)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-[10px] text-muted-foreground font-medium truncate max-w-[60px]">{listing.user.first_name}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Eye className="h-2.5 w-2.5" />
                          {listing.listing_stats?.page_views || 0}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Label className="text-[9px] text-muted-foreground uppercase font-bold">Active</Label>
                        <Switch 
                          checked={listing.status !== 'deactivated'}
                          onCheckedChange={(checked) => handleAction(listing.id, checked ? 'activate' : 'deactivate')}
                          disabled={isLoading === listing.id}
                          className="scale-75 origin-right"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-2.5 flex items-center justify-between text-[10px] text-muted-foreground bg-muted/30 p-1.5 rounded-lg border border-border/50">
                <div className="flex items-center gap-1.5">
                  <Send className="h-3 w-3" />
                  <span className="font-medium">
                    {(() => {
                      const latest = listing.listing_schedules
                        ?.filter(s => s.is_completed && s.published_at)
                        .reduce((acc, s) => !acc || new Date(s.published_at!) > new Date(acc) ? s.published_at : acc, null as string | null);
                      return formatRelativeDate(latest);
                    })()}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3 w-3" />
                  {new Date(listing.created_at).toLocaleDateString()}
                </div>
              </div>

              {/* Mobile Actions */}
              <div className="mt-3 flex items-center justify-between gap-2 border-t pt-2.5">
                <Button variant="ghost" size="sm" className="h-8 gap-1 text-[11px] text-blue-600 px-2" asChild>
                  <Link href={`/listings/${listing.id}`}>
                    <Eye className="h-3.5 w-3.5" />
                    Preview
                  </Link>
                </Button>

                <div className="flex-1 flex items-center justify-end gap-1.5">
                  {showActions && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 gap-1 border-emerald-200 text-emerald-600 bg-emerald-50 text-[11px] px-2.5"
                        onClick={() => handleAction(listing.id, 'approve')}
                        disabled={isLoading === listing.id}
                      >
                        {isLoading === listing.id ? (
                          <Spinner className="h-3 w-3" />
                        ) : (
                          <CheckCircle className="h-3.5 w-3.5" />
                        )}
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 gap-1 border-red-200 text-red-600 bg-red-50 text-[11px] px-2.5"
                        onClick={() => openRejectDialog(listing)}
                        disabled={isLoading === listing.id}
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        Reject
                      </Button>
                    </>
                  )}

                  {showPublishAction && (
                    <Button
                      size="sm"
                      className="h-8 gap-1.5 px-4 text-[11px] font-bold"
                      onClick={() => handleAction(listing.id, 'publish')}
                      disabled={isLoading === listing.id}
                    >
                      {isLoading === listing.id ? (
                        <Spinner className="h-3.5 w-3.5" />
                      ) : (
                        <Send className="h-3.5 w-3.5" />
                      )}
                      Publish Now
                    </Button>
                  )}

                  {listing.status === 'published' && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 gap-1.5 border-blue-200 text-blue-600 bg-blue-50 text-[11px] px-4 font-bold flex-1 max-w-[120px]"
                      onClick={() => handleAction(listing.id, 'repost')}
                      disabled={isLoading === listing.id}
                    >
                      {isLoading === listing.id ? (
                        <Spinner className="h-3.5 w-3.5" />
                      ) : (
                        <Send className="h-3.5 w-3.5" />
                      )}
                      Repost
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Listing</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting &quot;{selectedListing?.title}&quot;
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Enter rejection reason (optional)"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedListing && handleAction(selectedListing.id, 'reject', rejectReason)}
              disabled={isLoading === selectedListing?.id}
            >
              {isLoading === selectedListing?.id ? (
                <Spinner className="mr-2 h-4 w-4" />
              ) : null}
              Reject Listing
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
