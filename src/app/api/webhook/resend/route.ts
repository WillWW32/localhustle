import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseClient'

// Resend webhook — tracks email delivery, opens, bounces, clicks, complaints
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

    // Map Resend event types to our internal event type
    const eventTypeMap: Record<string, string> = {
      'email.delivered': 'delivered',
      'email.opened': 'opened',
      'email.clicked': 'clicked',
      'email.bounced': 'bounced',
      'email.failed': 'failed',
      'email.complained': 'complained',
    }

    const eventType = eventTypeMap[type]
    if (!eventType) {
      // Event we don't track (e.g. email.sent)
      return NextResponse.json({ received: true })
    }

    // Look up the message by resend_id
    const { data: message } = await supabaseAdmin
      .from('messages')
      .select('id, status')
      .eq('resend_id', resendId)
      .single()

    // Store the raw event in email_events table
    const eventRecord: Record<string, unknown> = {
      resend_id: resendId,
      message_id: message?.id || null,
      event_type: eventType,
      recipient: data?.to?.[0] || data?.to || null,
      metadata: {
        raw_type: type,
        subject: data?.subject || null,
        timestamp: data?.created_at || new Date().toISOString(),
      },
    }

    // Add bounce/failure details
    if (eventType === 'bounced') {
      eventRecord.bounce_type = data?.bounce?.type || 'unknown'
      eventRecord.error_message = data?.bounce?.message || data?.bounce?.description || null
    }
    if (eventType === 'failed') {
      eventRecord.error_message = data?.error?.message || data?.error?.name || null
    }
    if (eventType === 'complained') {
      eventRecord.error_message = 'Recipient marked as spam'
    }

    await supabaseAdmin.from('email_events').insert(eventRecord)

    // Update message status if the message exists
    if (message) {
      // Map event type to message status
      const statusMap: Record<string, string> = {
        delivered: 'delivered',
        opened: 'opened',
        clicked: 'opened', // clicked implies opened
        bounced: 'failed',
        failed: 'failed',
        complained: 'failed',
      }

      const newStatus = statusMap[eventType]
      if (!newStatus) {
        return NextResponse.json({ received: true })
      }

      // Status progression: queued -> sent -> delivered -> opened
      const statusPriority: Record<string, number> = {
        queued: 0,
        sent: 1,
        delivered: 2,
        opened: 3,
        replied: 4,
        failed: -1,
      }

      const currentPriority = statusPriority[message.status] ?? 0
      const newPriority = statusPriority[newStatus] ?? 0

      // Only update if new status is higher priority (don't downgrade)
      // Exception: failed always updates (unless already replied)
      if (
        (newStatus === 'failed' && message.status !== 'replied') ||
        newPriority > currentPriority
      ) {
        const updateData: Record<string, unknown> = { status: newStatus }
        if (newStatus === 'delivered') updateData.delivered_at = new Date().toISOString()
        if (newStatus === 'opened') updateData.opened_at = new Date().toISOString()

        await supabaseAdmin
          .from('messages')
          .update(updateData)
          .eq('id', message.id)
      }
    }

    return NextResponse.json({ received: true })
  } catch (err: unknown) {
    console.error('Resend webhook error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
