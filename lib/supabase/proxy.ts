import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  // Check for telegram session cookie
  const telegramSession = request.cookies.get('telegram_session')?.value
  
  // Protected routes that require authentication
  const protectedPaths = ['/dashboard', '/admin', '/listings/new']
  const isProtectedPath = protectedPaths.some(path => 
    request.nextUrl.pathname.startsWith(path)
  )

  if (isProtectedPath && !telegramSession) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    url.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  // Admin routes require admin check
  if (request.nextUrl.pathname.startsWith('/admin') && telegramSession) {
    try {
      const session = JSON.parse(telegramSession)
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('telegram_id', session.telegram_id)
        .single()
      
      if (!profile?.is_admin) {
        const url = request.nextUrl.clone()
        url.pathname = '/dashboard'
        return NextResponse.redirect(url)
      }
    } catch {
      // Continue without admin check if parsing fails
    }
  }

  return supabaseResponse
}
