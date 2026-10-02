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
    _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  }
  return _supabase
}

// Server-side admin client — only use in API routes
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
