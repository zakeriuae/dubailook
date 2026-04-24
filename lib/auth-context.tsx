'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Profile } from './types'

interface AuthContextType {
  profile: Profile | null
  isLoading: boolean
  isAuthenticated: boolean
  isAdmin: boolean
  refresh: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children, initialProfile }: { children: ReactNode; initialProfile: Profile | null }) {
  const [profile, setProfile] = useState<Profile | null>(initialProfile)
  const [isLoading, setIsLoading] = useState(false)

  // Sync state with prop if it changes (e.g. after router.refresh())
  useEffect(() => {
    setProfile(initialProfile)
  }, [initialProfile])

  const refresh = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/auth/session')
      if (res.ok) {
        const data = await res.json()
        setProfile(data.profile)
      } else {
        setProfile(null)
      }
    } catch {
      setProfile(null)
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    setProfile(null)
    window.location.href = '/'
  }

  useEffect(() => {
    let mounted = true
    
    const refreshSession = async () => {
      if (!initialProfile) {
        setIsLoading(true)
        try {
          const res = await fetch('/api/auth/session')
          if (res.ok && mounted) {
            const data = await res.json()
            setProfile(data.profile)
          } else if (mounted) {
            setProfile(null)
          }
        } catch {
          if (mounted) setProfile(null)
        } finally {
          if (mounted) setIsLoading(false)
        }
      }
    }

    refreshSession()
    return () => { mounted = false }
  }, [initialProfile])

  return (
    <AuthContext.Provider
      value={{
        profile,
        isLoading,
        isAuthenticated: !!profile,
        isAdmin: profile?.is_admin ?? false,
        refresh,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
