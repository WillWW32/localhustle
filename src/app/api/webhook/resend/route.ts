import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseClient'

// Resend webhook — tracks email delivery, opens, bounces, complaints
// Set up in Resend dashboard: https://resend.com/webhooks
// URL: https://app.localhustle.org/api/webhook/resend

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, data } = body

    // Resend sends email_id in data
    const resendId = data?.email_id
    if (!resendId) {
      return NextResponse.json({ received: true })
    }

    // Map Resend event types to our status
    const statusMap: Record<string, string> = {
      'email.delivered': 'delivered',
      'email.opened': 'opened',
      'email.bounced': 'failed',
      'email.complained': 'failed',
    }

    const newStatus = statusMap[type]
    if (!newStatus) {
      // Event we don't track (e.g. email.sent, email.clicked)
      return NextResponse.json({ received: true })
    }

    // Only update if the message exists and status should progress forward
    // Status progression: queued -> sent -> delivered -> opened
    const statusPriority: Record<string, number> = {
      queued: 0,
      sent: 1,
      delivered: 2,
      opened: 3,
      replied: 4,
      failed: -1,
    }

    const { data: message } = await supabaseAdmin
      .from('messages')
      .select('id, status')
      .eq('resend_id', resendId)
      .single()

    if (!message) {
      return NextResponse.json({ received: true })
    }

    // Only update if new status is higher priority (don't downgrade)
    // Exception: failed always updates
    const currentPriority = statusPriority[message.status] ?? 0
    const newPriority = statusPriority[newStatus] ?? 0

    if (newStatus === 'failed' || newPriority > currentPriority) {
      const updateData: Record<string, any> = { status: newStatus }
      if (newStatus === 'delivered') updateData.delivered_at = new Date().toISOString()
      if (newStatus === 'opened') updateData.opened_at = new Date().toISOString()

      await supabaseAdmin
        .from('messages')
        .update(updateData)
        .eq('id', message.id)
    }

    return NextResponse.json({ received: true })
  } catch (err: any) {
    console.error('Resend webhook error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
