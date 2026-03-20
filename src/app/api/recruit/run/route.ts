import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseClient'
import { renderTemplate, buildContext } from '@/lib/recruit/template-engine'
import { sendRecruitmentEmail } from '@/lib/recruit/email-sender'

interface RunRequest {
  campaignId: string
  maxEmails?: number
  maxDms?: number
}

export async function POST(request: NextRequest) {
  try {
    const body: RunRequest = await request.json()
    const { campaignId, maxEmails = 10, maxDms = 0 } = body

    if (!campaignId) {
      return NextResponse.json({ error: 'campaignId is required' }, { status: 400 })
    }

    const { data: campaign, error: campaignError } = await supabaseAdmin
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .single()

    if (campaignError || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    const { data: athlete, error: athleteError } = await supabaseAdmin
      .from('athletes')
      .select('*')
      .eq('id', campaign.athlete_id)
      .single()

    if (athleteError || !athlete) {
      return NextResponse.json({ error: 'Athlete not found' }, { status: 404 })
    }

    const { data: emailTemplate, error: templateError } = await supabaseAdmin
      .from('templates')
      .select('*')
      .eq('campaign_id', campaignId)
      .eq('type', 'email')
      .single()

    if (templateError || !emailTemplate) {
      return NextResponse.json({ error: 'Email template not found for this campaign' }, { status: 404 })
    }

    const today = new Date().toISOString().split('T')[0]

    let { data: dailyLog, error: dailyLogError } = await supabaseAdmin
      .from('daily_log')
      .select('emails_sent, dms_sent')
      .eq('campaign_id', campaignId)
      .eq('date', today)
      .single()

    if (dailyLogError) {
      await supabaseAdmin
        .from('daily_log')
        .insert({ campaign_id: campaignId, date: today, emails_sent: 0, dms_sent: 0 })
      dailyLog = { emails_sent: 0, dms_sent: 0 }
    }

    const emailsSentToday = dailyLog?.emails_sent || 0
    const emailsRemaining = Math.max(0, campaign.daily_email_limit - emailsSentToday)
    const emailsToSend = Math.min(maxEmails, emailsRemaining)

    // Fetch un-contacted coaches
    const { data: allCoachesForFilter } = await supabaseAdmin
      .from('coaches')
      .select('id, first_name, last_name, email, school, title, division, state')

    const { data: contactedIdsForFilter } = await supabaseAdmin
      .from('messages')
      .select('coach_id')
      .eq('campaign_id', campaignId)

    const contactedSetForFilter = new Set(contactedIdsForFilter?.map((m: any) => m.coach_id) || [])
    const uncontactedCoaches = (allCoachesForFilter || [])
      .filter((c: any) => !contactedSetForFilter.has(c.id))
      .slice(0, emailsToSend)

    const emailsSentList: Array<{ id: string; name: string; school: string; division: string }> = []
    const errors: Array<{ coach: string; name: string; error: string }> = []

    if (uncontactedCoaches && uncontactedCoaches.length > 0) {
      for (const coach of uncontactedCoaches) {
        await new Promise((resolve) => setTimeout(resolve, 1000))

        try {
          const context = buildContext(athlete, coach)
          const subject = renderTemplate(emailTemplate.subject || 'Recruitment Opportunity', context)
          const emailBody = renderTemplate(emailTemplate.body || '', context)

          const sendResult = await sendRecruitmentEmail({
            campaignId,
            coachId: coach.id,
            athleteId: athlete.id,
            fromEmail: athlete.email,
            fromName: athlete.first_name + ' ' + athlete.last_name,
            toEmail: coach.email,
            subject,
            body: emailBody,
          })

          if (sendResult.success) {
            emailsSentList.push({ id: coach.id, name: `${coach.first_name} ${coach.last_name}`, school: coach.school, division: coach.division || '' })
          } else {
            errors.push({ coach: coach.id, name: `${coach.first_name} ${coach.last_name}`, error: sendResult.error || 'Unknown error' })
          }
        } catch (err: any) {
          errors.push({ coach: coach.id, name: 'Unknown', error: err.message || 'Failed to send email' })
        }

        if (emailsSentList.length >= emailsToSend) break
      }
    }

    // Get remaining uncontacted coaches (next in queue)
    const { data: allCoachesPost } = await supabaseAdmin
      .from('coaches')
      .select('id, first_name, last_name, school, division')

    const { data: contactedIdsPost } = await supabaseAdmin
      .from('messages')
      .select('coach_id')
      .eq('campaign_id', campaignId)

    const contactedSetPost = new Set(contactedIdsPost?.map((m: any) => m.coach_id) || [])
    const remainingCoaches = (allCoachesPost || [])
      .filter((c: any) => !contactedSetPost.has(c.id))

    // Return next 10 upcoming coaches so the UI can show "up next"
    const upNext = remainingCoaches.slice(0, 10).map((c: any) => ({
      id: c.id,
      name: `${c.first_name} ${c.last_name}`,
      school: c.school,
      division: c.division || '',
    }))

    return NextResponse.json({
      success: true,
      emailsSent: emailsSentList.length,
      sentCoaches: emailsSentList,
      errors,
      remaining: remainingCoaches.length,
      upNext,
    })
  } catch (err: any) {
    console.error('Recruitment run error:', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}
