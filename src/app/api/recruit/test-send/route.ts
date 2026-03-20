import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseClient'
import { renderTemplate, buildContext } from '@/lib/recruit/template-engine'
import { resend } from '@/lib/resend'

// POST /api/recruit/test-send
// Sends a test email to a specified address using the campaign template
// Uses a fake coach context so you can see how the real email will look
export async function POST(request: NextRequest) {
  try {
    const { campaignId, testEmail, subject, bodyText } = await request.json()

    if (!campaignId || !testEmail) {
      return NextResponse.json({ error: 'campaignId and testEmail required' }, { status: 400 })
    }

    // Get campaign + athlete
    const { data: campaign } = await supabaseAdmin
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .single()

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    const { data: athlete } = await supabaseAdmin
      .from('athletes')
      .select('*')
      .eq('id', campaign.athlete_id)
      .single()

    if (!athlete) {
      return NextResponse.json({ error: 'Athlete not found' }, { status: 404 })
    }

    // Save template if provided
    if (subject && bodyText) {
      const { data: existing } = await supabaseAdmin
        .from('templates')
        .select('id')
        .eq('campaign_id', campaignId)
        .eq('type', 'email')
        .single()

      if (existing) {
        await supabaseAdmin
          .from('templates')
          .update({ subject, body: bodyText })
          .eq('id', existing.id)
      } else {
        await supabaseAdmin
          .from('templates')
          .insert({ campaign_id: campaignId, type: 'email', subject, body: bodyText })
      }
    }

    // Get template
    const templateSubject = subject || 'Test — Recruitment Opportunity'
    const templateBody = bodyText || 'No template set'

    // Build context with a sample coach
    const sampleCoach = {
      first_name: 'John',
      last_name: 'Smith',
      school: 'Sample University',
      title: 'Head Coach',
      email: testEmail,
      division: 'D1',
      state: 'WA',
    }

    const context = buildContext(athlete, sampleCoach)
    const renderedSubject = renderTemplate(templateSubject, context)
    const renderedBody = renderTemplate(templateBody, context)

    // Send via Resend (not through the email-sender to skip duplicate checks / logging)
    const fromName = `${athlete.first_name} ${athlete.last_name}`
    const fromEmail = `notifications@localhustle.org`

    const result = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: testEmail,
      subject: `[TEST] ${renderedSubject}`,
      text: renderedBody,
    })

    return NextResponse.json({
      success: true,
      testEmail,
      subject: `[TEST] ${renderedSubject}`,
      resendId: result.data?.id,
      preview: renderedBody,
    })
  } catch (err: any) {
    console.error('Test send error:', err)
    return NextResponse.json({ error: err.message || 'Failed to send test' }, { status: 500 })
  }
}
