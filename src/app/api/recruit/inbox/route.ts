import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseClient'
import { resend } from '@/lib/resend'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (body.type !== 'email.inbound') {
      return NextResponse.json({ received: true, message: 'Webhook acknowledged but not an inbound email' })
    }

    const { from_email, to_email, subject, body: emailBody, in_reply_to } = body.data || {}

    if (!from_email || !to_email || !emailBody) {
      return NextResponse.json({ error: 'Missing required email fields' }, { status: 400 })
    }

    let campaignId: string | null = null
    let athleteId: string | null = null

    if (in_reply_to) {
      const { data: originalMessage } = await supabaseAdmin
        .from('messages')
        .select('campaign_id, athlete_id, coach_id')
        .eq('resend_id', in_reply_to)
        .single()

      if (originalMessage) {
        campaignId = originalMessage.campaign_id
        athleteId = originalMessage.athlete_id
      }
    }

    if (!campaignId || !athleteId) {
      const { data: recentMessage } = await supabaseAdmin
        .from('messages')
        .select('campaign_id, athlete_id, coach_id')
        .eq('to_address', from_email)
        .eq('type', 'email')
        .eq('status', 'sent')
        .order('sent_at', { ascending: false })
        .limit(1)
        .single()

      if (recentMessage) {
        campaignId = recentMessage.campaign_id
        athleteId = recentMessage.athlete_id
      }
    }

    if (!campaignId || !athleteId) {
      return NextResponse.json({ error: 'Could not match inbound email to a campaign' }, { status: 400 })
    }

    const { data: athlete } = await supabaseAdmin
      .from('athletes')
      .select('parent_email, first_name, last_name, email')
      .eq('id', athleteId)
      .single()

    if (!athlete) {
      return NextResponse.json({ error: 'Athlete not found' }, { status: 404 })
    }

    const { data: coach } = await supabaseAdmin
      .from('coaches')
      .select('id, first_name, last_name, school')
      .eq('email', from_email)
      .single()

    if (!coach) {
      return NextResponse.json({ error: 'Coach not found' }, { status: 404 })
    }

    const coachName = `${coach.first_name} ${coach.last_name}`

    const { data: response, error: insertError } = await supabaseAdmin
      .from('responses')
      .insert({
        campaign_id: campaignId,
        coach_id: coach.id,
        athlete_id: athleteId,
        from_email,
        from_name: coachName,
        subject,
        body: emailBody,
      })
      .select()
      .single()

    if (insertError || !response) {
      return NextResponse.json({ error: insertError?.message || 'Failed to record response' }, { status: 500 })
    }

    if (athlete.parent_email) {
      try {
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'noreply@localhustle.org',
          to: athlete.parent_email,
          subject: `[${coach.school || 'Coach'}] ${subject}`,
          text: `Inbound Coach Response for ${athlete.first_name} ${athlete.last_name}:\n\nFrom: ${coachName} <${from_email}>\nSchool: ${coach.school || 'N/A'}\n\n---\n\n${emailBody}\n\n---\nForwarded by Recruitment Agent`,
        })

        await supabaseAdmin
          .from('responses')
          .update({ forwarded_at: new Date().toISOString(), forwarded_to: athlete.parent_email })
          .eq('id', response.id)
      } catch (forwardError: any) {
        console.error('Failed to forward response to parent:', forwardError)
      }
    }

    return NextResponse.json({ success: true, responseId: response.id, message: 'Response recorded and forwarded to parent' })
  } catch (err: any) {
    console.error('Inbox webhook error:', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}
