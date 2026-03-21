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
  const approvedListings = allListings.filter(l => l.status === 'approved')
  const rejectedListings = allListings.filter(l => l.status === 'rejected')
  const publishedListings = allListings.filter(l => l.status === 'published')
  
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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalListings}</div>
          </CardContent>
        </Card>
        
        <Card className="border-amber-200 bg-amber-50/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-amber-700">Pending</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-700">{pendingListings.length}</div>
          </CardContent>
        </Card>
        
        <Card className="border-emerald-200 bg-emerald-50/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-emerald-700">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-700">{approvedListings.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalViews}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Impressions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalImpressions}</div>
          </CardContent>
        </Card>
      </div>

      {/* Listings Tabs */}
      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-none">
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">Pending</span>
            <Badge variant="secondary" className="ml-1">{pendingListings.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="approved" className="gap-2">
            <CheckCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Approved</span>
            <Badge variant="secondary" className="ml-1">{approvedListings.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="published" className="gap-2">
            <Send className="h-4 w-4" />
            <span className="hidden sm:inline">Published</span>
            <Badge variant="secondary" className="ml-1">{publishedListings.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="rejected" className="gap-2">
            <XCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Rejected</span>
            <Badge variant="secondary" className="ml-1">{rejectedListings.length}</Badge>
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

        <TabsContent value="approved">
          <Card>
            <CardHeader>
              <CardTitle>Approved Listings</CardTitle>
              <CardDescription>Listings ready for publishing</CardDescription>
            </CardHeader>
            <CardContent>
              <AdminListingTable listings={approvedListings} showPublishAction />
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
