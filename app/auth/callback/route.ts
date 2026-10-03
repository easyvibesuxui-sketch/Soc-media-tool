import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url)
  const code = searchParams.get('code')
  // Only same-site paths: `${origin}${next}` with next="@evil.com" or
  // "//evil.com" would otherwise redirect off-site (open redirect).
  const rawNext = searchParams.get('next') ?? '/'
  const next = /^\/(?![/\\])/.test(rawNext) ? rawNext : '/'

  if (code) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      const admin = createAdminClient()
      const today = new Date().toISOString().split('T')[0]

      await admin.from('users').upsert(
        {
          id: data.user.id,
          email: data.user.email,
          daily_count: 0,
          last_reset: today,
          is_paid: false,
        },
        { onConflict: 'id', ignoreDuplicates: true }
      )

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/error`)
}
