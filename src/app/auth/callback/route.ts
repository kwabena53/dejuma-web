import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )
    
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('Error exchanging code for session:', error)
      return NextResponse.redirect(`${requestUrl.origin}/login?error=auth_callback_error`)
    }

    // Check if user has completed onboarding
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      // Check if user profile exists and is complete
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('full_name, phone_number')
        .eq('id', user.id)
        .single()

      // Check if user has a company
      const { data: company } = await supabase
        .from('companies')
        .select('id')
        .eq('owner_id', user.id)
        .single()

      // Redirect to appropriate page based on onboarding status
      if (!profile || !profile.full_name || !company) {
        return NextResponse.redirect(`${requestUrl.origin}/welcome`)
      } else {
        return NextResponse.redirect(`${requestUrl.origin}/dashboard`)
      }
    }
  }

  // If no code or other error, redirect to login
  return NextResponse.redirect(`${requestUrl.origin}/login`)
}