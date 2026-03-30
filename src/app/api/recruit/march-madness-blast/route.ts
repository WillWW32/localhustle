import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseClient'
import { resend } from '@/lib/resend'

// POST /api/recruit/march-madness-blast
// Sends a March Madness congrats email + queues DM to all D1 coaches in the database
// who haven't been contacted yet by this athlete.
//
// Body: { athleteId: string, maxEmails?: number, dryRun?: boolean }

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

  // Count D1 coaches with emails, not yet contacted
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
  const eligible = (d1Coaches || []).filter((c: { id: string; school: string }) => !contactedIds.has(c.id))

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

    // Load all D1 coaches with emails
    const { data: d1Coaches } = await supabaseAdmin
      .from('coaches')
      .select('id, first_name, last_name, email, school, title, x_handle, division')
      .eq('division', 'D1')
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
    const eligible = (d1Coaches || []).filter((c: { id: string; school: string }) => !contactedIds.has(c.id)).slice(0, maxEmails)

    if (eligible.length === 0) {
      return NextResponse.json({ success: true, emailsSent: 0, emailsFailed: 0, dmQueued: 0, message: 'No eligible coaches remaining' })
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
            dm_at: new Date().toISOString(), // immediate
            status: 'pending',
          }).catch(() => {}) // skip if already queued

          results.dmQueued++
        }

        // Brief pause to avoid rate limiting
        await new Promise(r => setTimeout(r, 500))
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
