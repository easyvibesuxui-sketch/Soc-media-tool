import { NextRequest, NextResponse } from 'next/server'
import { createUserClient, isSupabaseConfigured } from '@/lib/supabase'
import { FREE_DAILY_LIMIT } from '@/lib/groq'

export type GuardOk = {
  ok: true
  userId: string | null
  /** The caller's verified access token — reused to record usage as that user. */
  token: string | null
  isPaid: boolean
  remaining: number
}

export type GuardResult = GuardOk | { ok: false; response: NextResponse }

const todayUtc = () => new Date().toISOString().split('T')[0]

/**
 * Verifies the caller's Supabase JWT (sent as `Authorization: Bearer <token>`)
 * and enforces the free daily generation limit server-side.
 *
 * The user id is derived from the *verified token*, never from the request body —
 * clients cannot spoof another user or opt out of the limit.
 *
 * Runs entirely as the caller (anon key + their JWT, RLS applies): the app needs
 * no service-role key. `users` is read-only to clients, so `is_paid` can't be
 * self-granted; the only write is `increment_my_usage()`, which can only raise
 * the caller's own counter.
 *
 * When Supabase is not configured (local dev) the guard is a no-op.
 */
export async function guardRequest(req: NextRequest): Promise<GuardResult> {
  if (!isSupabaseConfigured()) {
    // FAIL CLOSED in production. If the Supabase env vars are missing on a
    // deployed instance, every AI route would otherwise be wide open to the
    // internet and bill our API keys. Refuse instead.
    if (process.env.NODE_ENV === 'production') {
      console.error(
        '[api-guard] Supabase env vars missing in production — refusing unauthenticated AI requests. ' +
        'Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
      )
      return {
        ok: false,
        response: NextResponse.json(
          { error: 'Service temporarily unavailable.', code: 'AUTH_NOT_CONFIGURED' },
          { status: 503 }
        ),
      }
    }
    // Local dev only: allow through so the tool is usable without Supabase.
    return { ok: true, userId: null, token: null, isPaid: false, remaining: FREE_DAILY_LIMIT }
  }

  const authHeader = req.headers.get('authorization') ?? ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!token) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Sign in to generate content.', code: 'UNAUTHENTICATED' },
        { status: 401 }
      ),
    }
  }

  const sb = createUserClient(token)

  // Verify the token against Supabase — this is the only trusted source of identity.
  const { data: userData, error: userErr } = await sb.auth.getUser(token)

  if (userErr || !userData?.user) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Your session expired. Please sign in again.', code: 'INVALID_SESSION' },
        { status: 401 }
      ),
    }
  }

  const userId = userData.user.id

  // RLS limits this to the caller's own row. A missing row (created by the
  // sign-up trigger, so rare) just means no usage yet.
  const { data: row } = await sb
    .from('users')
    .select('is_paid, daily_count, last_reset')
    .eq('id', userId)
    .maybeSingle()

  if (row?.is_paid) {
    return { ok: true, userId, token, isPaid: true, remaining: Number.POSITIVE_INFINITY }
  }

  const usedToday = row && row.last_reset === todayUtc() ? (row.daily_count ?? 0) : 0
  const remaining = FREE_DAILY_LIMIT - usedToday

  if (remaining <= 0) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: `You've used all ${FREE_DAILY_LIMIT} free generations for today. Upgrade to Pro for unlimited.`,
          code: 'LIMIT_REACHED',
          remaining: 0,
        },
        { status: 429 }
      ),
    }
  }

  return { ok: true, userId, token, isPaid: false, remaining }
}

/** Increments the caller's daily usage. Call only after a generation succeeds. */
export async function recordUsage(guard: GuardOk) {
  if (!guard.token || guard.isPaid) return

  try {
    const { error } = await createUserClient(guard.token).rpc('increment_my_usage')
    if (error) throw error
  } catch (err) {
    // Never fail the user's request because usage bookkeeping failed.
    console.error('recordUsage error:', err)
  }
}
