import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/session'
import { AuthProvider } from '@/lib/auth-context'
import { Header } from '@/components/header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Building2, LandPlot, Briefcase, Package, Users, 
  Phone, MessageCircle, ExternalLink, ArrowLeft, Calendar, Eye
} from 'lucide-react'
import { LISTING_TYPE_LABELS, LISTING_STATUS_LABELS } from '@/lib/types'
import type { Listing, ListingCTA } from '@/lib/types'

export const dynamic = 'force-dynamic'

const typeIcons: Record<string, React.ReactNode> = {
  property: <Building2 className="h-5 w-5" />,
  land: <LandPlot className="h-5 w-5" />,
  project: <Briefcase className="h-5 w-5" />,
  custom_offer: <Package className="h-5 w-5" />,
  buyer_request: <Users className="h-5 w-5" />,
}

function CTAButton({ cta }: { cta: ListingCTA }) {
  if (cta.cta_type === 'whatsapp') {
    return (
      <Button size="lg" className="w-full gap-2 bg-green-600 hover:bg-green-700" asChild>
        <a href={`https://wa.me/${cta.value.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">
          <Phone className="h-5 w-5" />
          Contact via WhatsApp
        </a>
      </Button>
    )
  }
  
  if (cta.cta_type === 'telegram') {
    return (
      <Button size="lg" className="w-full gap-2 bg-[var(--telegram)] hover:bg-[var(--telegram)]/90" asChild>
        <a href={`https://t.me/${cta.value.replace('@', '')}`} target="_blank" rel="noopener noreferrer">
          <MessageCircle className="h-5 w-5" />
          Contact via Telegram
        </a>
      </Button>
    )
  }
  
  return (
    <Button size="lg" variant="outline" className="w-full gap-2" asChild>
      <a href={cta.value} target="_blank" rel="noopener noreferrer">
        <ExternalLink className="h-5 w-5" />
        {cta.label || 'Visit Website'}
      </a>
    </Button>
  )
}

async function incrementViewCount(listingId: string) {
  const supabase = await createClient()
  
  // Check if stats exist
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
  
  if (!listing || (listing.status !== 'published' && listing.user_id !== profile?.id && !profile?.is_admin)) {
    notFound()
  }

  // Increment view count
  await incrementViewCount(id)

  const user = listing.user

  return (
    <AuthProvider initialProfile={profile}>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <Button variant="ghost" asChild className="mb-6">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Listings
            </Link>
          </Button>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* Image */}
              <div className="relative aspect-video overflow-hidden rounded-xl bg-muted">
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

              {/* Title and Meta */}
              <div className="mt-6">
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

              {/* Description */}
              <Card className="mt-6">
                <CardContent className="pt-6">
                  <h2 className="mb-4 text-lg font-semibold">Description</h2>
                  <p className="whitespace-pre-wrap text-muted-foreground">{listing.description}</p>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Contact Card */}
              <Card>
                <CardContent className="pt-6">
                  <h2 className="mb-4 text-lg font-semibold">Contact</h2>
                  <div className="space-y-3">
                    {listing.listing_cta?.map((cta) => (
                      <CTAButton key={cta.id} cta={cta} />
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Owner Card */}
              {user && (
                <Card>
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
      </div>
    </AuthProvider>
  )
}
