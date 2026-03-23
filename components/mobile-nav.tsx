'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, LayoutDashboard, Plus, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/auth-context'

export function MobileNav() {
  const pathname = usePathname()
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated) return null

  const items = [
    { icon: Home, label: 'Home', href: '/' },
    { icon: LayoutDashboard, label: 'Dash', href: '/dashboard' },
    { icon: Plus, label: 'Post', href: '/listings/new', isCta: true },
    { icon: User, label: 'Profile', href: '/profile' },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 pb-safe backdrop-blur md:hidden">
      <div className="flex h-16 items-center justify-around px-2">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center gap-1 transition-colors",
              pathname === item.href
                ? "text-primary"
                : "text-muted-foreground"
            )}
          >
            <div className={cn(
              "flex h-10 w-10 items-center justify-center rounded-xl",
              item.isCta && "bg-primary text-primary-foreground shadow-lg shadow-primary/20 -translate-y-1"
            )}>
              <item.icon className={cn("h-6 w-6", item.isCta && "h-7 w-7")} />
            </div>
            {!item.isCta && <span className="text-[10px] font-medium leading-none">{item.label}</span>}
          </Link>
        ))}
      </div>
    </div>
  )
}
