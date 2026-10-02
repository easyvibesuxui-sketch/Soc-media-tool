import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createAdminClient, isSupabaseConfigured } from '@/lib/supabase'
import { FREE_DAILY_LIMIT } from '@/lib/groq'

export type GuardResult =
  | { ok: true; userId: string | null; isPaid: boolean; remaining: number }
  | { ok: false; response: NextResponse }

/**
 * Verifies the caller's Supabase JWT (sent as `Authorization: Bearer <token>`)
 * and enforces the free daily generation limit server-side.
 *
 * The user id is derived from the *verified token*, never from the request body —
 * clients cannot spoof another user or opt out of the limit.
 *
 * When Supabase is not configured (local dev) the guard is a no-op.
 */
export async function guardRequest(req: NextRequest): Promise<GuardResult> {
  const supabaseReady = isSupabaseConfigured() && !!process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseReady) {
    // FAIL CLOSED in production. If the Supabase env vars are missing on a
    // deployed instance, every AI route would otherwise be wide open to the
    // internet and bill our API keys. Refuse instead.
    if (process.env.NODE_ENV === 'production') {
      console.error(
        '[api-guard] Supabase env vars missing in production — refusing unauthenticated AI requests. ' +
        'Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY.'
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
    return { ok: true, userId: null, isPaid: false, remaining: FREE_DAILY_LIMIT }
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

  // Verify the token against Supabase — this is the only trusted source of identity.
  const anon = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { data: userData, error: userErr } = await anon.auth.getUser(token)

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
  const admin = createAdminClient()
  const today = new Date().toISOString().split('T')[0]

  const { data: row } = await admin
    .from('users')
    .select('is_paid, daily_count, last_reset')
    .eq('id', userId)
    .single()

  // First time we see this user — create the row.
  if (!row) {
    await admin.from('users').insert({
      id: userId,
      email: userData.user.email,
      daily_count: 0,
      last_reset: today,
      is_paid: false,
    })
    return { ok: true, userId, isPaid: false, remaining: FREE_DAILY_LIMIT }
  }

  if (row.is_paid) {
    return { ok: true, userId, isPaid: true, remaining: Number.POSITIVE_INFINITY }
  }

  const usedToday = row.last_reset === today ? (row.daily_count ?? 0) : 0
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

  return { ok: true, userId, isPaid: false, remaining }
}

/** Increments the caller's daily usage. Call only after a generation succeeds. */
export async function recordUsage(userId: string | null, isPaid: boolean) {
  if (!userId || isPaid) return
  if (!isSupabaseConfigured() || !process.env.SUPABASE_SERVICE_ROLE_KEY) return

  try {
    const admin = createAdminClient()
    const today = new Date().toISOString().split('T')[0]

    const { data: row } = await admin
      .from('users')
      .select('daily_count, last_reset')
      .eq('id', userId)
      .single()

    const next = row && row.last_reset === today ? (row.daily_count ?? 0) + 1 : 1

    await admin
      .from('users')
      .update({ daily_count: next, last_reset: today })
      .eq('id', userId)
  } catch (err) {
    // Never fail the user's request because usage bookkeeping failed.
    console.error('recordUsage error:', err)
  }
}
