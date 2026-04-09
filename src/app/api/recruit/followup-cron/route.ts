import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseClient'
import { resend } from '@/lib/resend'
import { textToHtml } from '@/lib/recruit/template-engine'

// Follow-up email templates by step number
function getFollowUpBody(
  step: number,
  athlete: any,
  coach: any
): string {
  const athleteFirst = athlete.first_name
  const athleteLast = athlete.last_name
  const athleteEmail = athlete.email
  const coachLast = coach.last_name
  const school = coach.school
  const highlightUrl = athlete.highlight_url || athlete.hudl_link || ''

  switch (step) {
    case 1:
      return `Coach ${coachLast},\n\nJust circling back. I'm in the gym 6 days a week this spring putting up 300 shots a day. Still very interested in ${school} and would love to connect when you have a moment.\n\nRespectfully,\n${athleteFirst} ${athleteLast}\n${athleteEmail}`
    case 2:
      return `Coach ${coachLast},\n\nPlanning to come back next season with 15 lbs of extra muscle and a tighter handle. Have you had a chance to check my film?\n\nFilm: ${highlightUrl}\n\nRespectfully,\n${athleteFirst} ${athleteLast}\n${athleteEmail}`
    case 3:
      return `Coach ${coachLast},\n\nJust wrapped up a week of open runs against college guys in Missoula. Held my own. Still here, still grinding, still interested in ${school}.\n\n${athleteFirst} ${athleteLast}\n${athleteEmail}`
    case 4:
      return `Coach ${coachLast},\n\nLast one from me for now. I'll let my work speak. But if you need a gym rat who plays bigger than 6'4 (and I think I'm still growing) and will outwork your whole roster, I'm your guy.\n\nRespectfully,\n${athleteFirst} ${athleteLast}\n${athleteEmail}`
    default:
      return ''
  }
}

// GET /api/recruit/followup-cron
// Cron endpoint: finds due follow-ups and sends them automatically
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for Vercel cron jobs
    const authHeader = request.headers.get('authorization')
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()

    // Find all outreach that is due for a follow-up
    const { data: dueOutreach, error: fetchError } = await supabaseAdmin
      .from('custom_outreach')
      .select('*')
      .eq('status', 'sent')
      .lte('next_send_at', now.toISOString())
      .lte('followup_step', 4)

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    if (!dueOutreach || dueOutreach.length === 0) {
      return NextResponse.json({ success: true, message: 'No follow-ups due', sent: 0 })
    }

    // Collect all unique athlete and coach IDs
    const athleteIds = [...new Set(dueOutreach.map((o: any) => o.athlete_id))]
    const coachIds = [...new Set(dueOutreach.map((o: any) => o.coach_id))]

    const { data: athletes } = await supabaseAdmin
      .from('athletes')
      .select('*')
      .in('id', athleteIds)

    const { data: coaches } = await supabaseAdmin
      .from('coaches')
      .select('*')
      .in('id', coachIds)

    const athleteMap = new Map((athletes || []).map((a: any) => [a.id, a]))
    const coachMap = new Map((coaches || []).map((c: any) => [c.id, c]))

    const results: any[] = []

    for (const outreach of dueOutreach) {
      const athlete = athleteMap.get(outreach.athlete_id)
      const coach = coachMap.get(outreach.coach_id)

      if (!athlete || !coach) {
        results.push({ outreachId: outreach.id, error: 'Athlete or coach not found', sent: false })
        continue
      }

      const step = outreach.followup_step
      const followUpBody = getFollowUpBody(step, athlete, coach)
      const followUpSubject = `Re: ${outreach.subject}`

      if (!followUpBody) {
        results.push({ outreachId: outreach.id, error: `Invalid step ${step}`, sent: false })
        continue
      }

      try {
        // Send via Resend from athlete's @localhustle.org email
        const fromName = `${athlete.first_name} ${athlete.last_name}`
        const senderEmail = athlete.email.endsWith('@localhustle.org')
          ? athlete.email
          : `${athlete.first_name.toLowerCase()}.${athlete.last_name.toLowerCase()}@localhustle.org`

        const sendResult = await resend.emails.send({
          from: `${fromName} <${senderEmail}>`,
          reply_to: athlete.parent_email || athlete.email,
          to: coach.email,
          subject: followUpSubject,
          text: followUpBody,
          html: textToHtml(followUpBody),
        })

        const nextStep = step + 1
        const isFinalStep = step >= 4
        const nextSendAt = isFinalStep
          ? null
          : new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()

        // Update outreach record
        await supabaseAdmin
          .from('custom_outreach')
          .update({
            status: isFinalStep ? 'stopped' : 'sent',
            followup_step: nextStep,
            last_sent_at: now.toISOString(),
            next_send_at: nextSendAt,
            updated_at: now.toISOString(),
          })
          .eq('id', outreach.id)

        // Log to messages table
        await supabaseAdmin.from('messages').insert({
          campaign_id: outreach.campaign_id || null,
          coach_id: outreach.coach_id,
          athlete_id: outreach.athlete_id,
          type: 'follow_up',
          channel: 'resend',
          to_address: coach.email,
          subject: followUpSubject,
          body: followUpBody,
          status: 'sent',
          resend_id: sendResult.data?.id,
          sent_at: now.toISOString(),
        })

        results.push({
          outreachId: outreach.id,
          coachName: `${coach.first_name} ${coach.last_name}`,
          school: coach.school,
          step,
          nextStep: isFinalStep ? null : nextStep,
          status: isFinalStep ? 'stopped' : 'sent',
          sent: true,
        })
      } catch (sendErr: any) {
        console.error(`Follow-up send error for outreach ${outreach.id}:`, sendErr)
        results.push({ outreachId: outreach.id, error: sendErr.message, sent: false })
      }
    }

    const sentCount = results.filter((r) => r.sent).length
    const failedCount = results.filter((r) => !r.sent).length

    return NextResponse.json({
      success: true,
      sent: sentCount,
      failed: failedCount,
      total: dueOutreach.length,
      results,
    })
  } catch (err: any) {
    console.error('Follow-up cron error:', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}
