import { createClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/session'
import { AuthProvider } from '@/lib/auth-context'
import { Header } from '@/components/header'
import { ListingsGrid } from '@/components/listings-grid'
import { ListingsFilters } from '@/components/listings-filters'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const profile = await getSession()
  const supabase = await createClient()
  
  // Fetch published listings
  const { data: listings } = await supabase
    .from('listings')
    .select(`
      *,
      listing_cta (*),
      listing_stats (*),
      user:profiles (*)
    `)
    .eq('status', 'published')
    .order('created_at', { ascending: false })

  return (
    <AuthProvider initialProfile={profile}>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Property Listings
            </h1>
            <p className="mt-2 text-muted-foreground">
              Browse our latest properties, land, and real estate projects
            </p>
          </div>
          
          <ListingsFilters />
          
          <ListingsGrid listings={listings || []} />
        </main>
      </div>
    </AuthProvider>
  )
}
