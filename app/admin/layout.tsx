import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const profile = await getSession()
  
  if (!profile) {
    redirect('/login?redirect=/admin')
  }

  if (!profile.is_admin) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}
