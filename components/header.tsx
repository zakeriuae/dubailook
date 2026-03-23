'use client'

import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LayoutDashboard, Shield, LogOut, User, Menu, Bell } from 'lucide-react'
import { useState } from 'react'

export function Header() {
  const { profile, isAuthenticated, isAdmin, logout } = useAuth()
  const [isScrolled, setIsScrolled] = useState(false)

  // Add scroll handler for glassmorphism effect if needed
  if (typeof window !== 'undefined') {
    window.addEventListener('scroll', () => {
      setIsScrolled(window.scrollY > 20)
    })
  }

  return (
    <header className={`sticky top-0 z-40 w-full transition-all duration-300 ${
      isScrolled ? 'bg-card/80 backdrop-blur-md shadow-sm border-b' : 'bg-transparent'
    }`}>
      <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 flex h-16 items-center justify-between">
        {/* Logo: Always show on mobile. Show on desktop only if Sidebar is hidden (not authenticated) */}
        <div className={`flex items-center gap-2 ${isAuthenticated ? 'md:hidden' : ''}`}>
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary md:h-9 md:w-9">
              <LogOut className="h-4 w-4 text-primary-foreground -rotate-90" /> {/* Temporary icon until I find Building2 if needed */}
            </div>
            <span className="text-xl font-bold tracking-tight text-primary md:text-2xl">Dubilook</span>
          </Link>
        </div>

        <div className="hidden md:block flex-1 ml-8">
          {/* Search bar could go here */}
        </div>

        {/* Right side: Notifications & Profile */}
        <div className="flex items-center gap-2 lg:gap-4">
          {isAuthenticated && (
            <>
              <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:text-foreground">
                <Bell className="h-5 w-5" />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative flex items-center gap-2 rounded-full border border-border p-1 pr-3 hover:bg-muted/50">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={profile?.photo_url || undefined} alt="Profile" />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {profile?.first_name?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden text-sm font-medium lg:inline-block">
                      {profile?.first_name || 'My Account'}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64 p-2" align="end">
                  <div className="flex items-center gap-3 p-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={profile?.photo_url || undefined} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                        {profile?.first_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <p className="font-bold text-foreground">
                        {profile?.first_name} {profile?.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        @{profile?.telegram_username || 'user'}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuSeparator className="my-2" />
                  
                  <DropdownMenuItem asChild className="rounded-lg p-2.5 cursor-pointer">
                    <Link href="/dashboard" className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
                        <LayoutDashboard className="h-4 w-4" />
                      </div>
                      <span className="font-medium">Dashboard</span>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild className="rounded-lg p-2.5 cursor-pointer">
                    <Link href="/profile" className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600">
                        <User className="h-4 w-4" />
                      </div>
                      <span className="font-medium">My Profile</span>
                    </Link>
                  </DropdownMenuItem>

                  {isAdmin && (
                    <DropdownMenuItem asChild className="rounded-lg p-2.5 cursor-pointer text-amber-600">
                      <Link href="/admin" className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10">
                          <Shield className="h-4 w-4" />
                        </div>
                        <span className="font-medium text-foreground">Admin Panel</span>
                      </Link>
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuSeparator className="my-2" />
                  
                  <DropdownMenuItem 
                    onClick={logout} 
                    className="rounded-lg p-2.5 cursor-pointer text-destructive hover:bg-destructive/10 focus:bg-destructive/10"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/10">
                        <LogOut className="h-4 w-4" />
                      </div>
                      <span className="font-medium">Log out</span>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}

          {!isAuthenticated && (
            <Button asChild className="rounded-full shadow-lg shadow-primary/20">
              <Link href="/login">Login</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
