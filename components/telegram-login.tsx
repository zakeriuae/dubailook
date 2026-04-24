'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { toast } from 'sonner'
import type { TelegramUser } from '@/lib/types'

declare global {
  interface Window {
    TelegramLoginWidget?: {
      dataOnauth: (user: TelegramUser) => void
    }
  }
}

import { useAuth } from '@/lib/auth-context'

export function TelegramLogin() {
  const router = useRouter()
  const { refresh } = useAuth()
  const searchParams = useSearchParams()
  const containerRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(false)
  const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME

  const handleAuth = async (user: TelegramUser) => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/auth/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user),
      })

      const data = await res.json()

      if (res.ok) {
        toast.success('Login successful!')
        await refresh() // Update auth state immediately
        const redirect = searchParams.get('redirect') || data.redirect || '/dashboard'
        router.push(redirect)
        router.refresh()
      } else {
        toast.error(data.error || 'Login failed')
      }
    } catch {
      toast.error('An error occurred during login')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!containerRef.current || !botUsername) return

    // Set up callback
    window.TelegramLoginWidget = {
      dataOnauth: handleAuth,
    }

    // Create script
    const script = document.createElement('script')
    script.src = 'https://telegram.org/js/telegram-widget.js?22'
    script.setAttribute('data-telegram-login', botUsername)
    script.setAttribute('data-size', 'large')
    script.setAttribute('data-onauth', 'TelegramLoginWidget.dataOnauth(user)')
    script.setAttribute('data-request-access', 'write')
    script.async = true

    containerRef.current.appendChild(script)

    return () => {
      if (containerRef.current) {
        const existingScript = containerRef.current.querySelector('script')
        if (existingScript) {
          containerRef.current.removeChild(existingScript)
        }
      }
    }
  }, [botUsername])

  if (!botUsername) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Configuration Required</CardTitle>
          <CardDescription>
            Telegram bot username is not configured. Please set NEXT_PUBLIC_TELEGRAM_BOT_USERNAME environment variable.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Welcome Back</CardTitle>
        <CardDescription>
          Sign in with your Telegram account to access your dashboard
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        {isLoading ? (
          <div className="flex items-center gap-2">
            <Spinner className="h-5 w-5" />
            <span>Signing in...</span>
          </div>
        ) : (
          <div ref={containerRef} className="flex justify-center" />
        )}
        <p className="text-center text-sm text-muted-foreground">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </CardContent>
    </Card>
  )
}
