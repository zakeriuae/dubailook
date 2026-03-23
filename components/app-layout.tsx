'use client'

import { Sidebar } from '@/components/sidebar'
import { Header } from '@/components/header'
import { MobileNav } from '@/components/mobile-nav'
import { useAuth } from '@/lib/auth-context'
import { Spinner } from './ui/spinner'

import { usePathname } from 'next/navigation'

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { isLoading, isAuthenticated } = useAuth()
  const pathname = usePathname()

  if (pathname === '/login') {
    return <>{children}</>
  }

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Spinner className="h-8 w-8 text-primary" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Sidebar - Desktop Only */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col relative pb-16 md:pb-0">
        <Header />
        <main className="flex-1 overflow-x-hidden p-4 md:p-6 lg:p-8">
          <div className="container mx-auto max-w-7xl animate-in fade-in slide-in-from-bottom-2 duration-500">
            {children}
          </div>
        </main>
        
        {/* Mobile Navigation - Mobile Only */}
        <MobileNav />
      </div>
    </div>
  )
}
