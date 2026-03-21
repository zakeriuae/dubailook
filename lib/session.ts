'use server'

import { cookies } from 'next/headers'
import { createClient } from './supabase/server'
import { parseSessionToken } from './auth'
import type { Profile } from './types'

const SESSION_COOKIE = 'session_token'

export async function getSession(): Promise<Profile | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  
  if (!token) return null
  
  const payload = parseSessionToken(token)
  if (!payload) return null
  
  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', payload.id)
    .single()
  
  return profile
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: '/',
  })
}

export async function clearSession() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
}

export async function requireAuth(): Promise<Profile> {
  const profile = await getSession()
  if (!profile) {
    throw new Error('Unauthorized')
  }
  return profile
}

export async function requireAdmin(): Promise<Profile> {
  const profile = await requireAuth()
  if (!profile.is_admin) {
    throw new Error('Forbidden')
  }
  return profile
}
