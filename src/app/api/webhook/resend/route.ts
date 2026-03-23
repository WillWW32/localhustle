import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseClient'

// Resend webhook — tracks email delivery, opens, bounces, clicks, complaints
// Also handles inbound emails (email.received) for the inbox messaging system
// Set up in Resend dashboard: https://resend.com/webhooks
// URL: https://app.localhustle.org/api/webhook/resend

async function handleInboundEmail(data: Record<string, unknown>) {
  try {
    const fromRaw = data.from as string | undefined
    const toRaw = data.to as string | string[] | undefined
    const subject = (data.subject as string) || '(no subject)'
    const emailId = data.email_id as string | undefined

    // Resend webhook only sends metadata — fetch the actual email body via API
    let textBody = (data.text as string) || ''
    let htmlBody = (data.html as string) || ''

    if (emailId && !textBody && !htmlBody) {
      try {
        const emailRes = await fetch(`https://api.resend.com/emails/${emailId}`, {
          headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` }
        })
        if (emailRes.ok) {
          const emailData = await emailRes.json() as { text?: string; html_body?: string; body?: string }
          textBody = emailData.text || emailData.body || ''
          htmlBody = emailData.html_body || ''
          console.log('Fetched email body via API:', { emailId, bodyLength: textBody.length })
        }
      } catch (fetchErr) {
        console.error('Failed to fetch email body:', fetchErr)
      }
    }

    // If still no body, use subject as fallback
    if (!textBody && !htmlBody) {
      textBody = `(Email received - body not available. Subject: ${subject})`
    }

    const fromAddress = typeof fromRaw === 'string' ? fromRaw : ''
    const toAddress = Array.isArray(toRaw) ? toRaw[0] : (typeof toRaw === 'string' ? toRaw : '')

    if (!fromAddress || !toAddress) {
      console.log('Inbound email missing from/to:', { fromAddress, toAddress })
      return
    }

    console.log('Resend inbound email:', { from: fromAddress, to: toAddress, subject })

    // Match the "to" address to an athlete
    // Supports both exact match on email and pattern match on firstname.lastname@localhustle.org
    let athlete: { id: string; first_name: string; last_name: string; email: string } | null = null

    // Try exact match first
    const { data: exactMatch } = await supabaseAdmin
      .from('athletes')
      .select('id, first_name, last_name, email')
      .eq('email', toAddress)
      .single()

    if (exactMatch) {
      athlete = exactMatch
    } else {
      // Try matching by firstname.lastname pattern
      const localPart = toAddress.split('@')[0]?.toLowerCase()
      if (localPart && localPart.includes('.')) {
        const [first, last] = localPart.split('.')
        const { data: patternMatch } = await supabaseAdmin
          .from('athletes')
          .select('id, first_name, last_name, email')
          .ilike('first_name', first)
          .ilike('last_name', last)
          .limit(1)
          .single()

        if (patternMatch) {
          athlete = patternMatch
        }
      }
    }

    if (!athlete) {
      console.log('No athlete found for inbound email to:', toAddress)
      return
    }

    // Match the "from" address to a coach
    const { data: coach } = await supabaseAdmin
      .from('coaches')
      .select('id, first_name, last_name, school, email')
      .eq('email', fromAddress)
      .single()

    // Store in inbox_messages
    await supabaseAdmin.from('inbox_messages').insert({
      athlete_id: athlete.id,
      coach_id: coach?.id || null,
      direction: 'inbound',
      channel: 'email',
      from_address: fromAddress,
      to_address: toAddress,
      subject,
      body: textBody || htmlBody,
      html_body: htmlBody || null,
      is_read: false,
    })

    // If coach matched, mark the outreach sequence as 'responded' to stop follow-ups
    if (coach) {
      // Update custom_outreach status
      await supabaseAdmin
        .from('custom_outreach')
        .update({ status: 'responded', updated_at: new Date().toISOString() })
        .eq('athlete_id', athlete.id)
        .eq('coach_id', coach.id)
        .in('status', ['sent', 'queued'])

      // Update messages table status to 'replied'
      await supabaseAdmin
        .from('messages')
        .update({ status: 'replied' })
        .eq('athlete_id', athlete.id)
        .eq('coach_id', coach.id)
        .in('status', ['sent', 'delivered', 'opened'])
    }

    console.log('Inbound email stored in inbox_messages for athlete:', athlete.id)
  } catch (err) {
    console.error('Error handling inbound email:', err)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, data } = body

    // Handle inbound emails for the inbox messaging system
    if (type === 'email.received') {
      await handleInboundEmail(data || {})
      return NextResponse.json({ received: true })
    }

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
