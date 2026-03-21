import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'

export async function GET() {
  const profile = await getSession()
  
  if (!profile) {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }
  
  return NextResponse.json({ authenticated: true, profile })
}
