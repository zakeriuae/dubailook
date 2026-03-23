'use client'

import { Sidebar } from '@/components/sidebar'
import { Header } from '@/components/header'
import { MobileNav } from '@/components/mobile-nav'
import { useAuth } from '@/lib/auth-context'
import { Spinner } from './ui/spinner'

import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { isLoading } = useAuth()
  const pathname = usePathname()

  const isListingDetail = pathname.startsWith('/listings/') && pathname.length > 10 && !pathname.includes('/new')

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
        {!isListingDetail && <Header />}
        <main className="flex-1 overflow-x-hidden">
          <div className={cn(
            "mx-auto max-w-7xl px-4 md:px-6 lg:px-8 py-6 md:py-8",
            !isListingDetail && "animate-in fade-in slide-in-from-bottom-1 duration-500",
            isListingDetail && "px-0 py-0 md:px-6 md:py-8 md:max-w-7xl"
          )}>
            {children}
          </div>
        </main>
        
        {!isListingDetail && <MobileNav />}
      </div>
    </div>
  )
}
