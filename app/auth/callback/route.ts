import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const errorParam = requestUrl.searchParams.get('error')
  const next = requestUrl.searchParams.get('next') || '/'

  // Handle OAuth errors
  if (errorParam) {
    console.error('OAuth error:', errorParam)
    return NextResponse.redirect(
      new URL(`/auth?error=${encodeURIComponent(errorParam)}`, requestUrl.origin)
    )
  }

  if (code) {
    const requestHeaders = new Headers(request.headers)
    const response = NextResponse.redirect(new URL(next, requestUrl.origin))
    
    try {
      const cookieStore = await cookies()
      
      // Create server client with proper cookie handling for PKCE
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return cookieStore.getAll()
            },
            setAll(cookiesToSet) {
              try {
                cookiesToSet.forEach(({ name, value, options }) => {
                  cookieStore.set(name, value, options)
                  // Also set in response headers
                  response.cookies.set(name, value, options)
                })
              } catch (error) {
                // Ignore errors in server components
              }
            },
          },
        }
      )
      
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('Error exchanging code for session:', error)
        return NextResponse.redirect(
          new URL(`/auth?error=${encodeURIComponent(error.message || 'Could not authenticate')}`, requestUrl.origin)
        )
      }

      if (data.session) {
        return response
      } else {
        console.error('No session created after code exchange')
        return NextResponse.redirect(
          new URL('/auth?error=Could not create session', requestUrl.origin)
        )
      }
    } catch (err: any) {
      console.error('Unexpected error in callback:', err)
      return NextResponse.redirect(
        new URL(`/auth?error=${encodeURIComponent(err.message || 'Could not authenticate')}`, requestUrl.origin)
      )
    }
  }

  // If there's no code, redirect to auth page
  return NextResponse.redirect(
    new URL('/auth?error=No authorization code provided', requestUrl.origin)
  )
}
