import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseClient'
import { resend } from '@/lib/resend'

// POST /api/recruit/custom-send
// Sends a fully custom one-off email to a specific coach
// Used for personalized outreach that doesn't use the campaign template
export async function POST(request: NextRequest) {
  try {
    const { athleteId, coachId, subject, body: emailBody } = await request.json()

    if (!athleteId || !coachId || !subject || !emailBody) {
      return NextResponse.json({ error: 'athleteId, coachId, subject, and body required' }, { status: 400 })
    }

    const { data: athlete } = await supabaseAdmin
      .from('athletes')
      .select('*')
      .eq('id', athleteId)
      .single()

    if (!athlete) {
      return NextResponse.json({ error: 'Athlete not found' }, { status: 404 })
    }

    const { data: coach } = await supabaseAdmin
      .from('coaches')
      .select('*')
      .eq('id', coachId)
      .single()

    if (!coach) {
      return NextResponse.json({ error: 'Coach not found' }, { status: 404 })
    }

    const fromName = `${athlete.first_name} ${athlete.last_name}`
    const senderEmail = athlete.email.endsWith('@localhustle.org') ? athlete.email : 'notifications@localhustle.org'

    const result = await resend.emails.send({
      from: `${fromName} <${senderEmail}>`,
      reply_to: athlete.email,
      to: coach.email,
      subject,
      text: emailBody,
    })

    // Log to messages table
    const { data: campaign } = await supabaseAdmin
      .from('campaigns')
      .select('id')
      .eq('athlete_id', athleteId)
      .eq('status', 'active')
      .single()

    if (campaign) {
      await supabaseAdmin.from('messages').insert({
        campaign_id: campaign.id,
        coach_id: coachId,
        athlete_id: athleteId,
        type: 'email',
        channel: 'resend',
        to_address: coach.email,
        subject,
        body: emailBody,
        status: 'sent',
        resend_id: result.data?.id,
        sent_at: new Date().toISOString(),
      })
    }

    return NextResponse.json({
      success: true,
      coachName: `${coach.first_name} ${coach.last_name}`,
      school: coach.school,
      resendId: result.data?.id,
    })
  } catch (err: any) {
    console.error('Custom send error:', err)
    return NextResponse.json({ error: err.message || 'Failed to send' }, { status: 500 })
  }
}
