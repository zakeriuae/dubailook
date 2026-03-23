import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { TelegramLogin } from '@/components/telegram-login'
import Link from 'next/link'
import { Home } from 'lucide-react'
import { Suspense } from 'react'

export default async function LoginPage() {
  const profile = await getSession()
  
  if (profile) {
    redirect('/dashboard')
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <Link href="/" className="mb-8 flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary shadow-lg shadow-primary/20">
          <Home className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className="text-xl font-bold text-foreground">Dubilook</span>
      </Link>
      
      <Suspense fallback={<div>Loading...</div>}>
        <TelegramLogin />
      </Suspense>
    </div>
  )
}
