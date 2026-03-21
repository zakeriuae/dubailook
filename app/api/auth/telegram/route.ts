import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyTelegramAuth, isAuthDateValid, createSessionToken } from '@/lib/auth'
import { setSessionCookie } from '@/lib/session'
import type { TelegramUser } from '@/lib/types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as TelegramUser
    
    // Verify Telegram auth
    if (!verifyTelegramAuth(body)) {
      return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 })
    }
    
    // Check auth date
    if (!isAuthDateValid(body.auth_date)) {
      return NextResponse.json({ error: 'Authentication expired' }, { status: 401 })
    }
    
    const supabase = await createClient()
    
    // Check if profile exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('telegram_id', body.id)
      .single()
    
    let profile = existingProfile
    
    if (!profile) {
      // Create new profile
      const { data: newProfile, error } = await supabase
        .from('profiles')
        .insert({
          telegram_id: body.id,
          telegram_username: body.username || null,
          first_name: body.first_name,
          last_name: body.last_name || null,
          photo_url: body.photo_url || null,
        })
        .select()
        .single()
      
      if (error) {
        console.error('Error creating profile:', error)
        return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 })
      }
      
      profile = newProfile
    } else {
      // Update existing profile
      const { data: updatedProfile, error } = await supabase
        .from('profiles')
        .update({
          telegram_username: body.username || profile.telegram_username,
          first_name: body.first_name,
          last_name: body.last_name || profile.last_name,
          photo_url: body.photo_url || profile.photo_url,
          updated_at: new Date().toISOString(),
        })
        .eq('telegram_id', body.id)
        .select()
        .single()
      
      if (!error && updatedProfile) {
        profile = updatedProfile
      }
    }
    
    // Create session token
    const token = createSessionToken(profile)
    await setSessionCookie(token)
    
    return NextResponse.json({ 
      success: true, 
      profile,
      redirect: profile.is_admin ? '/admin' : '/dashboard'
    })
  } catch (error) {
    console.error('Auth error:', error)
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 })
  }
}
