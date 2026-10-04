import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

// Returns true if Supabase is configured
export const isSupabaseConfigured = () => !!(SUPABASE_URL && SUPABASE_ANON_KEY)

// Lazy client — only created when env vars are present
let _supabase: ReturnType<typeof createClient> | null = null

export function getSupabase() {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local')
  }
  if (!_supabase) {
    // PKCE: OAuth / email links come back as `?code=`, which /auth/callback
    // exchanges in the browser (the verifier lives in this browser's storage).
    _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { flowType: 'pkce' },
    })
  }
  return _supabase
}

// Server-side client that acts AS the caller: anon key + their JWT, so RLS
// applies. API routes use this instead of a service-role key.
export function createUserClient(accessToken: string) {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

// Server-side admin client — bypasses RLS. Only the LemonSqueezy webhook
// needs it (to set is_paid); requires SUPABASE_SERVICE_ROLE_KEY.
export function createAdminClient() {
  return createClient(
    SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string | null
          is_paid: boolean
          daily_count: number
          last_reset: string
          created_at: string
        }
        Insert: {
          id: string
          email?: string | null
          is_paid?: boolean
          daily_count?: number
          last_reset?: string
          created_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          is_paid?: boolean
          daily_count?: number
          last_reset?: string
          created_at?: string
        }
      }
    }
  }
}
