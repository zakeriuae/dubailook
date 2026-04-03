'use client'

import { useState, useEffect } from 'react'
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
  const [isScrolled, setIsScrolled] = useState(false)

  const isListingDetail = pathname.startsWith('/listings/') && pathname.length > 10 && !pathname.includes('/new')
  const isNewListing = pathname === '/listings/new'
  const isSimpleLayout = isListingDetail || isNewListing

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  if (pathname === '/login') {
    return <>{children}</>
  }

  if (isLoading) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-background gap-8">
        <img 
          src="/splash-logo.png" 
          alt="Dubilook" 
          className="h-16 md:h-24 w-auto object-contain animate-in fade-in zoom-in duration-1000"
        />
        <Spinner className="h-8 w-8 text-primary" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground pb-32 md:pb-0">
      {/* Sidebar - Desktop Only */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col relative pb-safe-offset-20 md:pb-0">
        {!isSimpleLayout && <Header />}
        <main className="flex-1 w-full max-w-full">
          <div className={cn(
            "mx-auto w-full max-w-7xl px-4 md:px-6 lg:px-8 py-6 md:py-8",
            !isSimpleLayout && "animate-in fade-in slide-in-from-bottom-1 duration-500",
            isSimpleLayout && "px-0 py-0 md:px-6 md:py-8 md:max-w-7xl"
          )}>
            {children}
          </div>
        </main>
        
        {!isSimpleLayout && <MobileNav />}
      </div>
    </div>
  )
}
