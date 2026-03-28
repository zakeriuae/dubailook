import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/session'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Plus, Eye, Users, FileText, Clock, CheckCircle, XCircle, Send } from 'lucide-react'
import { DashboardListingTable } from '@/components/dashboard/listing-table'
import type { Listing } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const profile = await getSession()
  const supabase = await createClient()
  
  if (!profile) return null

  // Fetch user's listings with stats
  const { data: listings } = await supabase
    .from('listings')
    .select(`
      *,
      listing_cta (*),
      listing_stats (*),
      listing_schedules (published_at, is_completed)
    `)
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false }) as { data: Listing[] | null }

  const userListings = listings || []

  // Calculate stats
  const totalListings = userListings.length
  const pendingListings = userListings.filter(l => l.status === 'pending').length
  const approvedListings = userListings.filter(l => l.status === 'approved').length
  const publishedListings = userListings.filter(l => l.status === 'published').length
  const totalViews = userListings.reduce((acc, l) => acc + (l.listing_stats?.page_views || 0), 0)
  const totalImpressions = userListings.reduce((acc, l) => acc + (l.listing_stats?.list_impressions || 0), 0)

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={profile.photo_url || undefined} />
            <AvatarFallback className="bg-primary text-primary-foreground text-xl">
              {profile.first_name?.[0] || 'U'}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold text-foreground md:text-3xl">
              Welcome, {profile.first_name}!
            </h1>
            <p className="text-muted-foreground">
              {profile.telegram_username ? `@${profile.telegram_username}` : `ID: ${profile.telegram_id}`}
            </p>
          </div>
        </div>
        <Button asChild size="lg">
          <Link href="/listings/new">
            <Plus className="mr-2 h-5 w-5" />
            Create New Listing
          </Link>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-2 lg:grid-cols-4 md:gap-4">
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-1 md:p-6 md:pb-2">
            <CardTitle className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground md:text-sm md:normal-case md:tracking-normal">Total Listings</CardTitle>
            <FileText className="h-3 w-3 text-muted-foreground md:h-4 md:w-4" />
          </CardHeader>
          <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
            <div className="text-xl font-bold md:text-2xl">{totalListings}</div>
          </CardContent>
        </Card>
        
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-1 md:p-6 md:pb-2">
            <CardTitle className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground md:text-sm md:normal-case md:tracking-normal">Total Views</CardTitle>
            <Eye className="h-3 w-3 text-muted-foreground md:h-4 md:w-4" />
          </CardHeader>
          <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
            <div className="text-xl font-bold md:text-2xl">{totalViews}</div>
          </CardContent>
        </Card>
        
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-1 md:p-6 md:pb-2">
            <CardTitle className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground md:text-sm md:normal-case md:tracking-normal">Impressions</CardTitle>
            <Users className="h-3 w-3 text-muted-foreground md:h-4 md:w-4" />
          </CardHeader>
          <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
            <div className="text-xl font-bold md:text-2xl">{totalImpressions}</div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-1 md:p-6 md:pb-2">
            <CardTitle className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground md:text-sm md:normal-case md:tracking-normal">Published</CardTitle>
            <Send className="h-3 w-3 text-muted-foreground md:h-4 md:w-4" />
          </CardHeader>
          <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
            <div className="text-xl font-bold md:text-2xl">{publishedListings}</div>
          </CardContent>
        </Card>
      </div>

      {/* Status Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Listing Status Summary</CardTitle>
          <CardDescription>Overview of your listings by status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" />
              <span className="text-muted-foreground">Pending:</span>
              <Badge variant="outline" className="bg-amber-50 text-amber-700">
                {pendingListings}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-emerald-500" />
              <span className="text-muted-foreground">Approved:</span>
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700">
                {approvedListings}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              <span className="text-muted-foreground">Rejected:</span>
              <Badge variant="outline" className="bg-red-50 text-red-700">
                {userListings.filter(l => l.status === 'rejected').length}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Send className="h-5 w-5 text-primary" />
              <span className="text-muted-foreground">Published:</span>
              <Badge variant="outline" className="bg-primary/10 text-primary">
                {publishedListings}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User's Listings */}
      <div>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">Your Listings</h2>
          <Button variant="outline" asChild>
            <Link href="/listings/new">
              <Plus className="mr-2 h-4 w-4" />
              Add New
            </Link>
          </Button>
        </div>
        
        <DashboardListingTable 
          listings={userListings} 
        />
      </div>
    </div>
  )
}
