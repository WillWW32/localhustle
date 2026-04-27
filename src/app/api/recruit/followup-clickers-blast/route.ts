import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseClient'
import { resend } from '@/lib/resend'
import { textToHtml } from '@/lib/recruit/template-engine'

export const maxDuration = 300

// POST /api/recruit/followup-clickers-blast
// Sends a personalised follow-up to coaches who clicked in the first campaign.

const FOLLOW_UP_SUBJECT = 'Following up — Josiah "Siah" Boone'

function buildBody(coachFirst: string, profileUrl: string): string {
  const salutation = coachFirst ? `Coach ${coachFirst},` : 'Coach,'
  return `${salutation}

Following up on my message from a few weeks ago about Josiah "Siah" Boone — 6'3" shooting guard/SF out of Montana, Class of 2026, 48% FG and 36% from three.

Since the season ended, Siah has been in the gym every single day and has added 15 lbs of muscle. He has a few options on the table and will be making a decision soon, but your program is at the top of our list.

His full profile with highlight video and AI scouting report is live at ${profileUrl}

Feel free to reach me directly — Jesse, 406-926-9950 | jesse@entreartists.com`
}

export async function GET(request: NextRequest) {
  const athleteId = request.nextUrl.searchParams.get('athleteId')
  if (!athleteId) return NextResponse.json({ error: 'athleteId required' }, { status: 400 })

  // Find coaches who clicked
  const clickerIds = await getClickerCoachIds(athleteId)

  // Find which ones already got this follow-up
  const { data: alreadySent } = await supabaseAdmin
    .from('messages')
    .select('coach_id')
    .eq('athlete_id', athleteId)
    .eq('subject', FOLLOW_UP_SUBJECT)

  const alreadySentIds = new Set((alreadySent || []).map((m: { coach_id: string }) => m.coach_id))
  const eligible = clickerIds.filter(id => !alreadySentIds.has(id))

  return NextResponse.json({
    totalClickers: clickerIds.length,
    alreadySent: alreadySentIds.size,
    eligibleToContact: eligible.length,
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { athleteId, dryRun = false } = body
    if (!athleteId) return NextResponse.json({ error: 'athleteId required' }, { status: 400 })

    // Load athlete
    const { data: athlete } = await supabaseAdmin
      .from('athletes')
      .select('*')
      .eq('id', athleteId)
      .single()
    if (!athlete) return NextResponse.json({ error: 'Athlete not found' }, { status: 404 })

    // Get profile slug for URL
    const { data: profileRow } = await supabaseAdmin
      .from('athlete_profiles')
      .select('slug')
      .eq('athlete_id', athleteId)
      .single()
    const profileUrl = profileRow?.slug
      ? `https://app.localhustle.org/recruit/${profileRow.slug}`
      : 'https://app.localhustle.org/recruit'

    const fromEmail = athlete.email?.endsWith('@localhustle.org')
      ? athlete.email
      : `${athlete.first_name.toLowerCase()}.${athlete.last_name.toLowerCase()}@localhustle.org`
    const fromName = `${athlete.first_name} ${athlete.last_name}`
    const replyTo = 'jesse@entreartists.com'

    // Get campaign id (for message logging)
    const { data: campaign } = await supabaseAdmin
      .from('campaigns')
      .select('id')
      .eq('athlete_id', athleteId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    // Find coaches who clicked
    const clickerIds = await getClickerCoachIds(athleteId)

    // Exclude already sent this follow-up
    const { data: alreadySent } = await supabaseAdmin
      .from('messages')
      .select('coach_id')
      .eq('athlete_id', athleteId)
      .eq('subject', FOLLOW_UP_SUBJECT)

    const alreadySentIds = new Set((alreadySent || []).map((m: { coach_id: string }) => m.coach_id))
    const eligibleIds = clickerIds.filter(id => !alreadySentIds.has(id))

    if (eligibleIds.length === 0) {
      return NextResponse.json({ success: true, emailsSent: 0, emailsFailed: 0, message: 'All clickers already received follow-up' })
    }

    // Load coach details
    const { data: coaches } = await supabaseAdmin
      .from('coaches')
      .select('id, first_name, last_name, email, school, division')
      .in('id', eligibleIds)
      .not('email', 'is', null)
      .neq('email', '')

    const results = { emailsSent: 0, emailsFailed: 0, coaches: [] as string[] }
    const now = new Date()

    for (const coach of coaches || []) {
      const bodyText = buildBody(coach.first_name, profileUrl)

      if (!dryRun) {
        try {
          const sent = await resend.emails.send({
            from: `${fromName} <${fromEmail}>`,
            replyTo,
            to: coach.email,
            subject: FOLLOW_UP_SUBJECT,
            text: bodyText,
            html: textToHtml(bodyText),
          })

          await supabaseAdmin.from('messages').insert({
            campaign_id: campaign?.id || null,
            coach_id: coach.id,
            athlete_id: athleteId,
            type: 'email',
            channel: 'resend',
            to_address: coach.email,
            subject: FOLLOW_UP_SUBJECT,
            body: bodyText,
            status: 'sent',
            resend_id: sent.data?.id || null,
            sent_at: now.toISOString(),
          })

          results.emailsSent++
          results.coaches.push(`${coach.first_name} ${coach.last_name} — ${coach.school}`)
        } catch (err: any) {
          results.emailsFailed++
          console.error(`Failed to email ${coach.school}:`, err.message)
        }

        await new Promise(r => setTimeout(r, 100))
      } else {
        results.coaches.push(`${coach.first_name} ${coach.last_name} — ${coach.school} <${coach.email}>`)
      }
    }

    return NextResponse.json({
      success: true,
      dryRun,
      emailsSent: dryRun ? eligibleIds.length : results.emailsSent,
      emailsFailed: dryRun ? 0 : results.emailsFailed,
      eligibleCount: eligibleIds.length,
      coaches: results.coaches,
    })
  } catch (err: any) {
    console.error('Followup clickers blast error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// ── helpers ──────────────────────────────────────────────────────────────────

async function getClickerCoachIds(athleteId: string): Promise<string[]> {
  // Get all email message IDs for this athlete
  const { data: messages } = await supabaseAdmin
    .from('messages')
    .select('id, coach_id')
    .eq('athlete_id', athleteId)
    .eq('type', 'email')

  if (!messages || messages.length === 0) return []

  const messageIds = messages.map((m: { id: string }) => m.id)
  const messageToCoach: Record<string, string> = {}
  for (const m of messages) {
    if (m.coach_id) messageToCoach[m.id] = m.coach_id
  }

  // Get click events — chunk to avoid URL length limit
  const CHUNK = 100
  const clickedMessageIds = new Set<string>()
  for (let i = 0; i < messageIds.length; i += CHUNK) {
    const chunk = messageIds.slice(i, i + CHUNK)
    const { data: events } = await supabaseAdmin
      .from('email_events')
      .select('message_id')
      .in('message_id', chunk)
      .eq('event_type', 'clicked')
    for (const ev of events || []) {
      if (ev.message_id) clickedMessageIds.add(ev.message_id)
    }
  }

  // Map back to unique coach IDs
  const coachIds = new Set<string>()
  for (const msgId of clickedMessageIds) {
    const coachId = messageToCoach[msgId]
    if (coachId) coachIds.add(coachId)
  }

  return Array.from(coachIds)
}
