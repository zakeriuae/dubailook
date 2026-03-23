'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { cn } from '@/lib/utils'
import { 
  Home, 
  LayoutDashboard, 
  Plus, 
  Shield, 
  User, 
  MessageSquare,
  Building2,
  Map as MapIcon
} from 'lucide-react'

const navItems = [
  { name: 'Listings', href: '/', icon: Home },
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'New Listing', href: '/listings/new', icon: Plus },
  { name: 'Map View', href: '/map', icon: MapIcon },
  { name: 'My Profile', href: '/profile', icon: User },
]

export function Sidebar() {
  const pathname = usePathname()
  const { isAdmin, isAuthenticated } = useAuth()

  if (!isAuthenticated) return null

  return (
    <aside className="hidden w-64 flex-col border-r border-border bg-card p-4 transition-all md:flex lg:w-72">
      <div className="mb-8 flex items-center gap-2 px-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/20">
          <Building2 className="h-6 w-6 text-primary-foreground" />
        </div>
        <span className="text-xl font-bold tracking-tight text-foreground">Dubilook</span>
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors",
              pathname === item.href
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <item.icon className="h-5 w-5" />
            {item.name}
          </Link>
        ))}

        {isAdmin && (
          <div className="mt-8">
            <p className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
              Administration
            </p>
            <Link
              href="/admin"
              className={cn(
                "mt-2 flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors",
                pathname === '/admin'
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Shield className="h-5 w-5" />
              Admin Panel
            </Link>
          </div>
        )}
      </nav>

      <div className="mt-auto rounded-xl bg-muted/50 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10 text-blue-500">
            <MessageSquare className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-bold">Need Help?</p>
            <Link href="https://t.me/thezakeri" target="_blank" className="text-xs text-muted-foreground hover:underline">
              Contact Support
            </Link>
          </div>
        </div>
      </div>
    </aside>
  )
}
