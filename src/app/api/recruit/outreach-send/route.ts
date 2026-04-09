import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseClient'
import { resend } from '@/lib/resend'
import { renderTemplate, buildContext, textToHtml } from '@/lib/recruit/template-engine'

// POST /api/recruit/outreach-send
// Send a specific queued outreach email
export async function POST(request: NextRequest) {
  try {
    const { outreachId } = await request.json()

    if (!outreachId) {
      return NextResponse.json({ error: 'outreachId is required' }, { status: 400 })
    }

    // Fetch the outreach record
    const { data: outreach, error: outreachError } = await supabaseAdmin
      .from('custom_outreach')
      .select('*')
      .eq('id', outreachId)
      .single()

    if (outreachError || !outreach) {
      return NextResponse.json({ error: 'Outreach not found' }, { status: 404 })
    }

    if (outreach.status !== 'queued') {
      return NextResponse.json(
        { error: `Cannot send outreach with status '${outreach.status}'. Only 'queued' outreach can be sent.` },
        { status: 400 }
      )
    }

    // Fetch athlete and coach
    const { data: athlete } = await supabaseAdmin
      .from('athletes')
      .select('*')
      .eq('id', outreach.athlete_id)
      .single()

    if (!athlete) {
      return NextResponse.json({ error: 'Athlete not found' }, { status: 404 })
    }

    const { data: coach } = await supabaseAdmin
      .from('coaches')
      .select('*')
      .eq('id', outreach.coach_id)
      .single()

    if (!coach) {
      return NextResponse.json({ error: 'Coach not found' }, { status: 404 })
    }

    // Personalize template variables with coach data
    const context = buildContext(athlete, coach)
    const personalizedSubject = renderTemplate(outreach.subject, context)
    const personalizedBody = renderTemplate(outreach.body, context)

    // Send via Resend from athlete's @localhustle.org email
    const fromName = `${athlete.first_name} ${athlete.last_name}`
    const senderEmail = athlete.email.endsWith('@localhustle.org')
      ? athlete.email
      : `${athlete.first_name.toLowerCase()}.${athlete.last_name.toLowerCase()}@localhustle.org`

    const replyTo = athlete.parent_email || athlete.email

    const result = await resend.emails.send({
      from: `${fromName} <${senderEmail}>`,
      reply_to: replyTo,
      to: coach.email,
      subject: personalizedSubject,
      text: personalizedBody,
      html: textToHtml(personalizedBody),
    })

    const now = new Date()
    const nextSendAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // 7 days from now

    // Update outreach record: status='sent', followup_step=1, next_send_at=7 days
    const { error: updateError } = await supabaseAdmin
      .from('custom_outreach')
      .update({
        status: 'sent',
        followup_step: 1,
        last_sent_at: now.toISOString(),
        next_send_at: nextSendAt.toISOString(),
        updated_at: now.toISOString(),
      })
      .eq('id', outreachId)

    if (updateError) {
      console.error('Failed to update outreach record:', updateError)
    }

    // Log to messages table
    await supabaseAdmin.from('messages').insert({
      campaign_id: outreach.campaign_id || null,
      coach_id: outreach.coach_id,
      athlete_id: outreach.athlete_id,
      type: 'email',
      channel: 'resend',
      to_address: coach.email,
      subject: personalizedSubject,
      body: personalizedBody,
      status: 'sent',
      resend_id: result.data?.id,
      sent_at: now.toISOString(),
    })

    return NextResponse.json({
      success: true,
      outreachId,
      coachName: `${coach.first_name} ${coach.last_name}`,
      school: coach.school,
      resendId: result.data?.id,
      nextFollowUp: nextSendAt.toISOString(),
    })
  } catch (err: any) {
    console.error('Outreach send error:', err)
    return NextResponse.json({ error: err.message || 'Failed to send' }, { status: 500 })
  }
}
