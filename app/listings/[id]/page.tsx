import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/session'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Building2, LandPlot, Briefcase, Package, Users, 
  ArrowLeft, Calendar, Eye, Share2
} from 'lucide-react'
import { LISTING_TYPE_LABELS, LISTING_STATUS_LABELS } from '@/lib/types'
import type { Listing } from '@/lib/types'
import { ContactButtons } from '@/components/contact-buttons'

export const dynamic = 'force-dynamic'

const typeIcons: Record<string, React.ReactNode> = {
  property: <Building2 className="h-5 w-5" />,
  land: <LandPlot className="h-5 w-5" />,
  project: <Briefcase className="h-5 w-5" />,
  custom_offer: <Package className="h-5 w-5" />,
  buyer_request: <Users className="h-5 w-5" />,
}

async function incrementViewCount(listingId: string) {
  const supabase = await createClient()
  
  const { data: stats } = await supabase
    .from('listing_stats')
    .select('id, page_views')
    .eq('listing_id', listingId)
    .single()
  
  if (stats) {
    await supabase
      .from('listing_stats')
      .update({ page_views: stats.page_views + 1, updated_at: new Date().toISOString() })
      .eq('id', stats.id)
  } else {
    await supabase
      .from('listing_stats')
      .insert({ listing_id: listingId, page_views: 1 })
  }
}

export default async function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const profile = await getSession()
  const supabase = await createClient()
  
  const { data: listing } = await supabase
    .from('listings')
    .select(`
      *,
      listing_cta (*),
      listing_stats (*),
      user:profiles (*)
    `)
    .eq('id', id)
    .single() as { data: Listing | null }
  
  if (!listing) {
    notFound()
  }

  // Security check: Only allow viewing published/approved listings, or own listings, or if admin
  const isPubliclyVisible = ['published', 'approved'].includes(listing.status)
  const isOwner = profile && listing.user_id === profile.id
  const isAdmin = profile?.is_admin

  if (!isPubliclyVisible && !isOwner && !isAdmin) {
    notFound()
  }

  // Increment view count
  await incrementViewCount(id)

  const user = listing.user

  return (
    <div className="relative pb-24 md:pb-0">
      {/* Mobile-Only Header */}
      <div className="sticky top-0 z-50 flex h-14 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-md md:hidden">
        <Button variant="ghost" size="icon" asChild className="h-9 w-9">
          <Link href="/">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <span className="text-sm font-bold truncate max-w-[200px]">{listing.title}</span>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Share2 className="h-5 w-5" />
        </Button>
      </div>

      <main className="container mx-auto max-w-7xl md:py-8">
        <Button variant="ghost" asChild className="mb-6 hidden md:inline-flex">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Listings
          </Link>
        </Button>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="relative aspect-video overflow-hidden bg-muted md:rounded-xl">
              {listing.image_url ? (
                <Image
                  src={listing.image_url}
                  alt={listing.title}
                  fill
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  {typeIcons[listing.listing_type]}
                  <span className="ml-2 text-lg text-muted-foreground">
                    {LISTING_TYPE_LABELS[listing.listing_type]}
                  </span>
                </div>
              )}
            </div>

            <div className="mt-6 px-4 md:px-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="gap-1">
                  {typeIcons[listing.listing_type]}
                  {LISTING_TYPE_LABELS[listing.listing_type]}
                </Badge>
                {listing.status !== 'published' && (
                  <Badge variant="outline">
                    {LISTING_STATUS_LABELS[listing.status]}
                  </Badge>
                )}
              </div>
              
              <h1 className="mt-4 text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                {listing.title}
              </h1>

              <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {new Date(listing.created_at).toLocaleDateString()}
                </span>
                {listing.listing_stats && (
                  <span className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    {listing.listing_stats.page_views} views
                  </span>
                )}
              </div>
            </div>

            <Card className="mt-6 border-x-0 rounded-none md:border-x md:rounded-xl shadow-none md:shadow-sm">
              <CardContent className="pt-6">
                <h2 className="mb-4 text-lg font-semibold">Description</h2>
                <p className="whitespace-pre-wrap text-muted-foreground">{listing.description}</p>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6 px-4 md:px-0">
            {/* Contact Card - Hidden on Mobile sticky footer covers it */}
            <Card className="hidden md:block">
              <CardContent className="pt-6">
                <h2 className="mb-4 text-lg font-semibold">Contact Details</h2>
                <ContactButtons ctas={listing.listing_cta || []} />
              </CardContent>
            </Card>

            {user && (
              <Card className="mb-8 md:mb-0">
                <CardContent className="pt-6">
                  <h2 className="mb-4 text-lg font-semibold">Listed By</h2>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={user.photo_url || undefined} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {user.first_name?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{user.first_name} {user.last_name}</p>
                      {user.telegram_username && (
                        <p className="text-sm text-muted-foreground">@{user.telegram_username}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      {/* Mobile Sticky Footer */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card/95 p-4 backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-md items-center gap-3">
          <div className="flex-1">
            <ContactButtons ctas={listing.listing_cta || []} />
          </div>
        </div>
      </div>
    </div>
  )
}
