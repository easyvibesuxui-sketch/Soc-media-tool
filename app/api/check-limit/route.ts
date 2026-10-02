export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { FREE_DAILY_LIMIT } from '@/lib/groq'

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId')

    if (!userId) {
      // Not logged in — check via session cookie or return anonymous limit
      return NextResponse.json({ canGenerate: true, remaining: FREE_DAILY_LIMIT, isPaid: false })
    }

    const supabase = createAdminClient()
    const today = new Date().toISOString().split('T')[0]

    const { data: user, error } = await supabase
      .from('users')
      .select('is_paid, daily_count, last_reset')
      .eq('id', userId)
      .single()

    if (error || !user) {
      // User not in DB yet — create them
      await supabase.from('users').insert({
        id: userId,
        daily_count: 0,
        last_reset: today,
        is_paid: false,
      })
      return NextResponse.json({ canGenerate: true, remaining: FREE_DAILY_LIMIT, isPaid: false })
    }

    if (user.is_paid) {
      return NextResponse.json({ canGenerate: true, remaining: Infinity, isPaid: true })
    }

    // Reset daily count if it's a new day
    let dailyCount = user.daily_count
    if (user.last_reset !== today) {
      await supabase
        .from('users')
        .update({ daily_count: 0, last_reset: today })
        .eq('id', userId)
      dailyCount = 0
    }

    const remaining = FREE_DAILY_LIMIT - dailyCount
    return NextResponse.json({
      canGenerate: remaining > 0,
      remaining: Math.max(0, remaining),
      isPaid: false,
    })
  } catch (error) {
    console.error('check-limit error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  // Increment daily count after a generation
  try {
    const { userId } = await req.json()
    if (!userId) return NextResponse.json({ ok: true })

    const supabase = createAdminClient()
    const today = new Date().toISOString().split('T')[0]

    const { data: user } = await supabase
      .from('users')
      .select('daily_count, last_reset, is_paid')
      .eq('id', userId)
      .single()

    if (!user || user.is_paid) return NextResponse.json({ ok: true })

    const newCount = user.last_reset === today ? user.daily_count + 1 : 1

    await supabase
      .from('users')
      .update({ daily_count: newCount, last_reset: today })
      .eq('id', userId)

    return NextResponse.json({ ok: true, daily_count: newCount })
  } catch (error) {
    console.error('increment-limit error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
