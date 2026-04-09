import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseClient'
import { resend } from '@/lib/resend'
import { renderTemplate, buildContext, textToHtml } from '@/lib/recruit/template-engine'

export const maxDuration = 300

// POST /api/recruit/full-db-blast
// Sends the initial campaign email to all D1/D2/D3/NAIA coaches in the DB
// who haven't been contacted yet. Creates custom_outreach records so the
// follow-up cron handles follow-ups automatically.
//
// Body: { athleteId: string, maxEmails?: number, dryRun?: boolean }

const TARGET_DIVISIONS = ['D1', 'D2', 'D3', 'NAIA']

export async function GET(request: NextRequest) {
  const athleteId = request.nextUrl.searchParams.get('athleteId')
  if (!athleteId) return NextResponse.json({ error: 'athleteId required' }, { status: 400 })

  const { data: coaches } = await supabaseAdmin
    .from('coaches')
    .select('id, school, division')
    .in('division', TARGET_DIVISIONS)
    .not('email', 'is', null)
    .neq('email', '')

  const { data: contacted } = await supabaseAdmin
    .from('messages')
    .select('coach_id')
    .eq('athlete_id', athleteId)
    .eq('type', 'email')
    .not('status', 'eq', 'failed')

  const contactedIds = new Set((contacted || []).map((m: { coach_id: string }) => m.coach_id))
  const eligible = (coaches || []).filter((c: { id: string }) => !contactedIds.has(c.id))

  // Count by division
  const byDivision: Record<string, number> = {}
  for (const c of eligible) {
    byDivision[(c as any).division] = (byDivision[(c as any).division] || 0) + 1
  }

  return NextResponse.json({
    totalCoaches: coaches?.length || 0,
    alreadyContacted: contactedIds.size,
    eligibleToContact: eligible.length,
    byDivision,
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { athleteId, maxEmails = 999, dryRun = false } = body

    if (!athleteId) return NextResponse.json({ error: 'athleteId required' }, { status: 400 })

    // Load athlete
    const { data: athlete } = await supabaseAdmin
      .from('athletes')
      .select('*')
      .eq('id', athleteId)
      .single()

    if (!athlete) return NextResponse.json({ error: 'Athlete not found' }, { status: 404 })

    const fromEmail = athlete.email?.endsWith('@localhustle.org')
      ? athlete.email
      : `${athlete.first_name.toLowerCase()}.${athlete.last_name.toLowerCase()}@localhustle.org`
    const fromName = `${athlete.first_name} ${athlete.last_name}`
    const replyTo = athlete.parent_email || fromEmail

    // Get active campaign + template
    const { data: campaign } = await supabaseAdmin
      .from('campaigns')
      .select('id')
      .eq('athlete_id', athleteId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    let template: { subject: string; body: string } | null = null
    if (campaign?.id) {
      const { data: t } = await supabaseAdmin
        .from('templates')
        .select('subject, body')
        .eq('campaign_id', campaign.id)
        .eq('type', 'email')
        .eq('active', true)
        .order('created_at', { ascending: true })
        .limit(1)
        .single()
      template = t
    }

    if (!template) {
      return NextResponse.json({ error: 'No active email template found for this athlete' }, { status: 400 })
    }

    // Load all target coaches with emails
    const { data: coaches } = await supabaseAdmin
      .from('coaches')
      .select('id, first_name, last_name, email, school, division, title, x_handle')
      .in('division', TARGET_DIVISIONS)
      .not('email', 'is', null)
      .neq('email', '')

    // Filter out already-contacted
    const { data: contacted } = await supabaseAdmin
      .from('messages')
      .select('coach_id')
      .eq('athlete_id', athleteId)
      .eq('type', 'email')
      .not('status', 'eq', 'failed')

    const contactedIds = new Set((contacted || []).map((m: { coach_id: string }) => m.coach_id))
    const eligible = (coaches || [])
      .filter((c: any) => !contactedIds.has(c.id))
      .slice(0, maxEmails)

    if (eligible.length === 0) {
      return NextResponse.json({ success: true, emailsSent: 0, emailsFailed: 0, message: 'No eligible coaches remaining' })
    }

    const results = { emailsSent: 0, emailsFailed: 0, coaches: [] as string[] }
    const now = new Date()
    const nextFollowUp = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    for (const coach of eligible) {
      const context = buildContext(athlete, coach)
      const subject = renderTemplate(template.subject, context)
      const bodyText = renderTemplate(template.body, context)

      if (!dryRun) {
        try {
          const sent = await resend.emails.send({
            from: `${fromName} <${fromEmail}>`,
            replyTo,
            to: coach.email,
            subject,
            text: bodyText,
            html: textToHtml(bodyText),
          })

          const resendId = sent.data?.id || null

          // Log to messages
          await supabaseAdmin.from('messages').insert({
            campaign_id: campaign?.id || null,
            coach_id: coach.id,
            athlete_id: athleteId,
            type: 'email',
            channel: 'resend',
            to_address: coach.email,
            subject,
            body: bodyText,
            status: 'sent',
            resend_id: resendId,
            sent_at: now.toISOString(),
          })

          // Create custom_outreach record so follow-up cron picks it up
          await supabaseAdmin.from('custom_outreach').upsert({
            campaign_id: campaign?.id || null,
            athlete_id: athleteId,
            coach_id: coach.id,
            subject,
            body: bodyText,
            status: 'sent',
            followup_step: 1,
            last_sent_at: now.toISOString(),
            next_send_at: nextFollowUp.toISOString(),
          }, { onConflict: 'athlete_id,coach_id' })

          results.emailsSent++
          results.coaches.push(`${coach.first_name} ${coach.last_name} — ${coach.school} (${coach.division})`)
        } catch (err: any) {
          results.emailsFailed++
          console.error(`Failed to email ${coach.school}:`, err.message)
        }

        await new Promise(r => setTimeout(r, 100))
      } else {
        results.coaches.push(`${coach.first_name} ${coach.last_name} — ${coach.school} (${coach.division}) <${coach.email}>`)
      }
    }

    return NextResponse.json({
      success: true,
      dryRun,
      emailsSent: dryRun ? eligible.length : results.emailsSent,
      emailsFailed: dryRun ? 0 : results.emailsFailed,
      eligibleCount: eligible.length,
      coaches: results.coaches,
    })
  } catch (err: any) {
    console.error('Full DB blast error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
