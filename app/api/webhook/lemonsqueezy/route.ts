export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'crypto'
import { createAdminClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()
    const signature = req.headers.get('x-signature') ?? ''
    const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET!

    // Verify webhook signature
    const hmac = createHmac('sha256', secret)
    hmac.update(rawBody)
    const digest = hmac.digest('hex')

    if (digest !== signature) {
      console.error('Invalid webhook signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const payload = JSON.parse(rawBody)
    const eventName = payload.meta?.event_name

    if (eventName === 'order_created') {
      const userEmail = payload.data?.attributes?.user_email

      if (!userEmail) {
        return NextResponse.json({ error: 'No user email in payload' }, { status: 400 })
      }

      const supabase = createAdminClient()

      // Find user by email and upgrade them
      const { data: authUsers } = await supabase.auth.admin.listUsers()
      const authUser = authUsers?.users?.find((u) => u.email === userEmail)

      if (authUser) {
        await supabase
          .from('users')
          .update({ is_paid: true })
          .eq('id', authUser.id)

        console.log(`User ${userEmail} upgraded to paid ✅`)
      } else {
        console.warn(`User ${userEmail} not found in auth — will upgrade on next login`)
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
