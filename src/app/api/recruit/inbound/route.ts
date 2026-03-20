import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseClient'
import { resend } from '@/lib/resend'

// POST /api/recruit/inbound
// Handles inbound emails from Resend — when a coach replies to an athlete's @localhustle.org email
// Parses the sender, matches to a coach, stores the reply, and forwards to the account holder
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Resend inbound webhook payload
    const {
      from: senderEmail,
      to: recipientEmail,
      subject,
      text,
      html,
    } = body

    console.log('Inbound email received:', { from: senderEmail, to: recipientEmail, subject })

    // Extract the athlete's localhustle email from the "to" field
    // Could be "josiah.boone@localhustle.org" or in an array
    const toAddress = Array.isArray(recipientEmail) ? recipientEmail[0] : recipientEmail

    // Find the athlete by their localhustle email
    const { data: athlete } = await supabaseAdmin
      .from('athletes')
      .select('id, first_name, last_name, email, parent_email')
      .eq('email', toAddress)
      .single()

    if (!athlete) {
      console.log('No athlete found for inbound email to:', toAddress)
      return NextResponse.json({ received: true, forwarded: false, reason: 'no matching athlete' })
    }

    // Try to match sender to a coach
    const senderAddr = typeof senderEmail === 'string' ? senderEmail : senderEmail?.address || senderEmail
    const { data: coach } = await supabaseAdmin
      .from('coaches')
      .select('id, first_name, last_name, school, email')
      .eq('email', senderAddr)
      .single()

    // Store the reply in messages table
    const { data: campaign } = await supabaseAdmin
      .from('campaigns')
      .select('id')
      .eq('athlete_id', athlete.id)
      .eq('status', 'active')
      .single()

    await supabaseAdmin.from('messages').insert({
      campaign_id: campaign?.id || null,
      coach_id: coach?.id || null,
      athlete_id: athlete.id,
      type: 'email',
      channel: 'resend',
      to_address: toAddress,
      subject: subject || '(no subject)',
      body: text || html || '',
      status: 'received',
      sent_at: new Date().toISOString(),
    })

    // If coach matched, update any custom_outreach to 'responded'
    if (coach) {
      await supabaseAdmin
        .from('custom_outreach')
        .update({ status: 'responded', updated_at: new Date().toISOString() })
        .eq('athlete_id', athlete.id)
        .eq('coach_id', coach.id)
        .in('status', ['sent', 'queued'])
    }

    // Forward to the account holder (parent_email or a forwarding address)
    const forwardTo = athlete.parent_email
    if (forwardTo) {
      const coachInfo = coach
        ? `${coach.first_name} ${coach.last_name} (${coach.school})`
        : senderAddr

      await resend.emails.send({
        from: `LocalHustle <notifications@localhustle.org>`,
        to: forwardTo,
        subject: `[Coach Reply] ${subject || '(no subject)'} — from ${coachInfo}`,
        text: `A coach replied to ${athlete.first_name}'s outreach email.\n\nFrom: ${senderAddr}\nCoach: ${coachInfo}\n\n---\n\n${text || html || '(no body)'}`,
      })

      console.log('Forwarded inbound email to:', forwardTo)
    }

    // Also store in responses table if coach matched
    if (coach) {
      await supabaseAdmin.from('responses').insert({
        campaign_id: campaign?.id || null,
        coach_id: coach.id,
        athlete_id: athlete.id,
        type: 'email_reply',
        from_address: senderAddr,
        subject: subject || '',
        body: text || html || '',
        sentiment: 'neutral',
        received_at: new Date().toISOString(),
      }).catch(() => {}) // ignore if responses table schema doesn't match
    }

    return NextResponse.json({
      received: true,
      forwarded: !!forwardTo,
      athleteId: athlete.id,
      coachId: coach?.id || null,
    })
  } catch (err: any) {
    console.error('Inbound email error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
