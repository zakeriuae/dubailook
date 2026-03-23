import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { ListingForm } from '@/components/listing-form'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function NewListingPage() {
  const profile = await getSession()
  
  if (!profile) {
    redirect('/login?redirect=/listings/new')
  }

  return (
    <div className="flex flex-col">
      {/* Mobile-only Header */}
      <div className="sticky top-0 z-50 flex h-14 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-md md:hidden">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <span className="font-semibold text-lg">Create New Listing</span>
      </div>

      <div className="mx-auto w-full max-w-2xl px-4 py-6 md:px-0 md:py-8">
        <div className="hidden md:block">
          <h1 className="mb-2 text-2xl font-bold text-foreground md:text-3xl">
            Create New Listing
          </h1>
          <p className="mb-8 text-muted-foreground">
            Fill out the form below to create a new listing. It will be reviewed by an admin before publishing.
          </p>
        </div>
        
        {/* Mobile-only description (shorter) */}
        <div className="md:hidden">
            <p className="mb-6 text-sm text-muted-foreground">
            Fill out the details below. Our team will review your ad before it goes live.
            </p>
        </div>
        
        <ListingForm />
      </div>
    </div>
  )
}
