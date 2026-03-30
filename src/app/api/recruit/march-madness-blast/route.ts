import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseClient'
import { resend } from '@/lib/resend'

export const maxDuration = 300 // 5 min — needed for large batch sends

// POST /api/recruit/march-madness-blast
// Sends a March Madness congrats email + queues DM to D1 coaches at tournament schools
// who haven't been contacted yet by this athlete.
//
// Body: { athleteId: string, maxEmails?: number, dryRun?: boolean }

// 2026 NCAA Tournament — 68-team field
// Each entry is a keyword/phrase that uniquely identifies a tournament school.
// Matched case-insensitively as a substring against the coach's school name.
const TOURNAMENT_2026_PATTERNS: RegExp[] = [
  // East Region
  /\bduke\b/,
  /\b(uconn|connecticut)\b/,
  /michigan state/,
  /\bkansas\b(?! state)/,
  /st\.?\s*john'?s/,
  /\blouisville\b/,
  /\bucla\b/,
  /ohio state/,
  /\btcu\b|texas christian/,
  /\bucf\b|central florida/,
  /south florida/,
  /northern iowa/,
  /cal baptist|california baptist/,
  /north dakota state/,
  /\bfurman\b/,
  /\bsiena\b/,
  // West Region
  /\barizona\b(?! state)/,
  /\bpurdue\b/,
  /\bgonzaga\b/,
  /\darkansas\b/,
  /\bwisconsin\b/,
  /\bbyu\b|brigham young/,
  /\bmiami\b/,
  /\bvillanova\b/,
  /utah state/,
  /\bmissouri\b/,
  /\btexas\b(?! a&m| tech| state| southern| pan| rio| el paso| arlington| san antonio| dallas| permian)/,
  /high point/,
  /\bhawaii\b/,
  /kennesaw state/,
  /\bqueens\b/,
  /\bliu\b|long island university/,
  // South Region
  /\bflorida\b(?! state| atlantic| gulf| international| a&m| southern)/,
  /\bhouston\b/,
  /\billinois\b/,
  /\bnebraska\b/,
  /\bvanderbilt\b/,
  /north carolina(?! state| a&t| central| a&m)/,
  /saint mary'?s|st\.?\s*mary'?s/,
  /\bclemson\b/,
  /\biowa\b(?! state)/,
  /texas a&m/,
  /\bvcu\b|virginia commonwealth/,
  /\bmcneese\b/,
  /\btroy\b/,
  /\bpenn\b(?!sylvania state| state)/,
  /university of idaho|\bidaho\b(?! state)/,
  /prairie view/,
  /\blehigh\b/,
  // Midwest Region
  /university of michigan(?! state)|\bmichigan\b(?! state)/,
  /iowa state/,
  /university of virginia|\bvirginia\b(?! tech| military| commonwealth| state)/,
  /\balabama\b(?! a&m| state)/,
  /texas tech/,
  /\btennessee\b/,
  /\bkentucky\b/,
  /university of georgia|\bgeorgia\b(?! tech| state| southern)/,
  /saint louis university|st\.?\s*louis university/,
  /santa clara/,
  /\bakron\b/,
  /\bhofstra\b/,
  /wright state/,
  /tennessee state/,
  /\bumbc\b/,
  /\bhoward\b/,
]

function isTournamentSchool(school: string): boolean {
  const s = school.toLowerCase()
  return TOURNAMENT_2026_PATTERNS.some(p => p.test(s))
}

const EMAIL_SUBJECT = (coachLast: string, school: string) =>
  `Coach ${coachLast} — what a run, ${school}`

const EMAIL_BODY = (
  coachFirst: string,
  coachLast: string,
  school: string,
  athleteFirstName: string,
  profileUrl: string
) => `Coach ${coachLast},

What a tournament run. I've been watching ${school} compete and the toughness your team plays with is something I genuinely admire.

My name is Josiah "Siah" Boone — a 6'4", 185 lb SG/SF from Missoula, Montana, Class of 2026. I averaged 11.6 PPG, 4.1 RPG, and 20 MPG this season, shooting 48% from the field and 36% from three. I led Big Sky High School to the Montana Class AA State Tournament (3rd place finish). I'm a coach's son — grew up in the gym, competing against college players from age 12.

I'd love to be considered for your program. I'm open to a call or campus visit whenever works for you.

Film + full profile: ${profileUrl}

Josiah "Siah" Boone
josiah.boone@localhustle.org
(406) available on request`

const DM_BODY = (coachLast: string, school: string, profileUrl: string) =>
  `Coach ${coachLast} — incredible tournament run at ${school}. I'm Josiah Boone, 6'4" SG/SF, Class of 2026, Missoula MT. 11.6 PPG, 48% FG, 36% 3PT, coach's son. Would love to connect: ${profileUrl}`

const PROFILE_URL = 'https://app.localhustle.org/recruit/josiah-boone-26'

export async function GET(request: NextRequest) {
  const athleteId = request.nextUrl.searchParams.get('athleteId')
  if (!athleteId) return NextResponse.json({ error: 'athleteId required' }, { status: 400 })

  // All D1 coaches with emails
  const { data: d1Coaches } = await supabaseAdmin
    .from('coaches')
    .select('id, school')
    .eq('division', 'D1')
    .not('email', 'is', null)
    .neq('email', '')

  const { data: contacted } = await supabaseAdmin
    .from('messages')
    .select('coach_id')
    .eq('athlete_id', athleteId)
    .eq('type', 'email')
    .not('status', 'eq', 'failed')

  const contactedIds = new Set((contacted || []).map((m: { coach_id: string }) => m.coach_id))

  // Only tournament schools
  const tournamentCoaches = (d1Coaches || []).filter((c: { id: string; school: string }) =>
    isTournamentSchool(c.school)
  )
  const eligible = tournamentCoaches.filter((c: { id: string; school: string }) => !contactedIds.has(c.id))

  const schoolCounts: Record<string, number> = {}
  for (const c of eligible) {
    schoolCounts[c.school] = (schoolCounts[c.school] || 0) + 1
  }

  // Delivery stats for previously sent blast messages
  const { data: blastMessages } = await supabaseAdmin
    .from('messages')
    .select('status')
    .eq('athlete_id', athleteId)
    .like('subject', 'Coach % — what a run, %')

  const blastStats = {
    sent: blastMessages?.length || 0,
    delivered: blastMessages?.filter((m: { status: string }) => ['delivered', 'opened', 'replied'].includes(m.status)).length || 0,
    opened: blastMessages?.filter((m: { status: string }) => ['opened', 'replied'].includes(m.status)).length || 0,
    replied: blastMessages?.filter((m: { status: string }) => m.status === 'replied').length || 0,
  }

  return NextResponse.json({
    totalD1Coaches: d1Coaches?.length || 0,
    tournamentCoaches: tournamentCoaches.length,
    alreadyContacted: contactedIds.size,
    eligibleToContact: eligible.length,
    uniqueSchools: Object.keys(schoolCounts).length,
    schools: Object.keys(schoolCounts).sort(),
    blastStats,
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { athleteId, maxEmails = 50, dryRun = false } = body

    if (!athleteId) return NextResponse.json({ error: 'athleteId required' }, { status: 400 })

    // Load athlete
    const { data: athlete } = await supabaseAdmin
      .from('athletes')
      .select('id, first_name, last_name, email, parent_email')
      .eq('id', athleteId)
      .single()

    if (!athlete) return NextResponse.json({ error: 'Athlete not found' }, { status: 404 })

    const fromEmail = athlete.email?.endsWith('@localhustle.org')
      ? athlete.email
      : `${athlete.first_name.toLowerCase()}.${athlete.last_name.toLowerCase()}@localhustle.org`
    const fromName = `${athlete.first_name} ${athlete.last_name}`
    const replyTo = athlete.parent_email || fromEmail

    // Get active campaign for logging
    const { data: campaign } = await supabaseAdmin
      .from('campaigns')
      .select('id')
      .eq('athlete_id', athleteId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    // Load D1 coaches at tournament schools with emails
    const { data: d1Coaches } = await supabaseAdmin
      .from('coaches')
      .select('id, first_name, last_name, email, school, title, x_handle, division')
      .eq('division', 'D1')
      .not('email', 'is', null)
      .neq('email', '')

    // Filter to tournament schools only, then remove already-contacted
    const { data: contacted } = await supabaseAdmin
      .from('messages')
      .select('coach_id')
      .eq('athlete_id', athleteId)
      .eq('type', 'email')
      .not('status', 'eq', 'failed')

    const contactedIds = new Set((contacted || []).map((m: { coach_id: string }) => m.coach_id))
    const eligible = (d1Coaches || [])
      .filter((c: { id: string; school: string }) => isTournamentSchool(c.school))
      .filter((c: { id: string; school: string }) => !contactedIds.has(c.id))
      .slice(0, maxEmails)

    if (eligible.length === 0) {
      return NextResponse.json({ success: true, emailsSent: 0, emailsFailed: 0, dmQueued: 0, message: 'No eligible tournament coaches remaining' })
    }

    const results = { emailsSent: 0, emailsFailed: 0, dmQueued: 0, coaches: [] as string[] }

    for (const coach of eligible) {
      const subject = EMAIL_SUBJECT(coach.last_name, coach.school)
      const bodyText = EMAIL_BODY(
        coach.first_name,
        coach.last_name,
        coach.school,
        athlete.first_name,
        PROFILE_URL
      )

      if (!dryRun) {
        try {
          const sent = await resend.emails.send({
            from: `${fromName} <${fromEmail}>`,
            replyTo: replyTo,
            to: coach.email,
            subject,
            text: bodyText,
          })

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
            resend_id: sent.data?.id || null,
            sent_at: new Date().toISOString(),
          })

          results.emailsSent++
          results.coaches.push(`${coach.first_name} ${coach.last_name} — ${coach.school}`)
        } catch (err: any) {
          results.emailsFailed++
          console.error(`Failed to email ${coach.school}:`, err.message)
        }

        // Queue DM if they have an X handle
        if (coach.x_handle) {
          const dmText = DM_BODY(coach.last_name, coach.school, PROFILE_URL)
          await supabaseAdmin.from('x_engagement_queue').insert({
            athlete_id: athleteId,
            coach_id: coach.id,
            coach_x_handle: coach.x_handle,
            dm_text: dmText,
            engagement_type: 'dm_only',
            dm_at: new Date().toISOString(),
            status: 'pending',
          }).catch(() => {}) // skip if already queued

          results.dmQueued++
        }

        // Brief pause to avoid rate limiting
        await new Promise(r => setTimeout(r, 100))
      } else {
        results.coaches.push(`${coach.first_name} ${coach.last_name} — ${coach.school} <${coach.email}>`)
      }
    }

    return NextResponse.json({
      success: true,
      dryRun,
      emailsSent: dryRun ? 0 : results.emailsSent,
      emailsFailed: dryRun ? 0 : results.emailsFailed,
      dmQueued: dryRun ? 0 : results.dmQueued,
      eligibleCount: eligible.length,
      coaches: results.coaches,
    })
  } catch (err: any) {
    console.error('March Madness blast error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
