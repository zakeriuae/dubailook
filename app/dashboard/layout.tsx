import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { AuthProvider } from '@/lib/auth-context'
import { Header } from '@/components/header'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const profile = await getSession()
  
  if (!profile) {
    redirect('/login?redirect=/dashboard')
  }

  return (
    <AuthProvider initialProfile={profile}>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          {children}
        </main>
      </div>
    </AuthProvider>
  )
}
