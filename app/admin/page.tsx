import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { FileText, Clock, CheckCircle, XCircle, Send, Users, Eye } from 'lucide-react'
import { AdminListingTable } from '@/components/admin/listing-table'
import type { Listing } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const supabase = await createClient()
  
  // Fetch all listings with user info
  const { data: listings } = await supabase
    .from('listings')
    .select(`
      *,
      listing_cta (*),
      listing_stats (*),
      user:profiles (*)
    `)
    .order('created_at', { ascending: false }) as { data: Listing[] | null }

  const allListings = listings || []

  // Calculate stats
  const totalListings = allListings.length
  const pendingListings = allListings.filter(l => l.status === 'pending')
  const rejectedListings = allListings.filter(l => l.status === 'rejected')
  const publishedListings = allListings.filter(l => l.status === 'published' || l.status === 'approved')
  
  const totalViews = allListings.reduce((acc, l) => acc + (l.listing_stats?.page_views || 0), 0)
  const totalImpressions = allListings.reduce((acc, l) => acc + (l.listing_stats?.list_impressions || 0), 0)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">Admin Dashboard</h1>
        <p className="mt-1 text-muted-foreground">
          Manage listings, review submissions, and monitor platform activity
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-5 md:gap-4">
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-1 md:p-6 md:pb-2">
            <CardTitle className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground md:text-sm md:normal-case md:tracking-normal">Total</CardTitle>
            <FileText className="h-3 w-3 text-muted-foreground md:h-4 md:w-4" />
          </CardHeader>
          <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
            <div className="text-xl font-bold md:text-2xl">{totalListings}</div>
          </CardContent>
        </Card>
        
        <Card className="overflow-hidden border-amber-200 bg-amber-50/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-1 md:p-6 md:pb-2">
            <CardTitle className="text-[10px] font-medium uppercase tracking-wider text-amber-700 md:text-sm md:normal-case md:tracking-normal">Pending</CardTitle>
            <Clock className="h-3 w-3 text-amber-500 md:h-4 md:w-4" />
          </CardHeader>
          <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
            <div className="text-xl font-bold text-amber-700 md:text-2xl">{pendingListings.length}</div>
          </CardContent>
        </Card>
        
        {/* Approved and Published are now treated as one state in calculations */}

        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-1 md:p-6 md:pb-2">
            <CardTitle className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground md:text-sm md:normal-case md:tracking-normal">Views</CardTitle>
            <Eye className="h-3 w-3 text-muted-foreground md:h-4 md:w-4" />
          </CardHeader>
          <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
            <div className="text-xl font-bold md:text-2xl">{totalViews}</div>
          </CardContent>
        </Card>

        <Card className="hidden lg:block overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-1 md:p-6 md:pb-2">
            <CardTitle className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground md:text-sm md:normal-case md:tracking-normal">Impressions</CardTitle>
            <Users className="h-3 w-3 text-muted-foreground md:h-4 md:w-4" />
          </CardHeader>
          <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
            <div className="text-xl font-bold md:text-2xl">{totalImpressions}</div>
          </CardContent>
        </Card>
      </div>

      {/* Listings Tabs */}
      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList className="grid h-auto w-full grid-cols-2 gap-2 bg-transparent p-0 lg:flex lg:w-auto lg:grid-cols-none lg:bg-muted lg:p-1">
          <TabsTrigger value="pending" className="flex items-center justify-center gap-2 rounded-lg border bg-card py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground lg:border-none lg:bg-transparent lg:py-1.5">
            <Clock className="h-4 w-4 shrink-0" />
            <span className="text-xs font-medium sm:text-sm">Pending</span>
            <Badge variant="secondary" className="ml-0.5 h-5 px-1.5 text-[10px]">{pendingListings.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="published" className="flex items-center justify-center gap-2 rounded-lg border bg-card py-2.5 data-[state=active]:bg-emerald-600 data-[state=active]:text-white lg:border-none lg:bg-transparent lg:py-1.5">
            <Send className="h-4 w-4 shrink-0" />
            <span className="text-xs font-medium sm:text-sm">Published</span>
            <Badge variant="secondary" className="ml-0.5 h-5 px-1.5 text-[10px]">{publishedListings.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="rejected" className="flex items-center justify-center gap-2 rounded-lg border bg-card py-2.5 data-[state=active]:bg-destructive data-[state=active]:text-destructive-foreground lg:border-none lg:bg-transparent lg:py-1.5">
            <XCircle className="h-4 w-4 shrink-0" />
            <span className="text-xs font-medium sm:text-sm">Rejected</span>
            <Badge variant="secondary" className="ml-0.5 h-5 px-1.5 text-[10px]">{rejectedListings.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Pending Review</CardTitle>
              <CardDescription>Listings awaiting admin approval</CardDescription>
            </CardHeader>
            <CardContent>
              <AdminListingTable listings={pendingListings} showActions />
            </CardContent>
          </Card>
        </TabsContent>


        <TabsContent value="published">
          <Card>
            <CardHeader>
              <CardTitle>Published Listings</CardTitle>
              <CardDescription>Currently live listings</CardDescription>
            </CardHeader>
            <CardContent>
              <AdminListingTable listings={publishedListings} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rejected">
          <Card>
            <CardHeader>
              <CardTitle>Rejected Listings</CardTitle>
              <CardDescription>Listings that were not approved</CardDescription>
            </CardHeader>
            <CardContent>
              <AdminListingTable listings={rejectedListings} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
