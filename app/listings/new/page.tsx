import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { AuthProvider } from '@/lib/auth-context'
import { Header } from '@/components/header'
import { ListingForm } from '@/components/listing-form'

export const dynamic = 'force-dynamic'

export default async function NewListingPage() {
  const profile = await getSession()
  
  if (!profile) {
    redirect('/login?redirect=/listings/new')
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-2 text-2xl font-bold text-foreground md:text-3xl">
        Create New Listing
      </h1>
      <p className="mb-8 text-muted-foreground">
        Fill out the form below to create a new listing. It will be reviewed by an admin before publishing.
      </p>
      
      <ListingForm />
    </div>
  )
}
