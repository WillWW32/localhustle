// Email sending via Resend — sends FROM the athlete's address
import { resend } from '@/lib/resend'
import { supabaseAdmin } from '@/lib/supabaseClient'

interface SendEmailParams {
  campaignId: string
  coachId: string
  athleteId: string
  fromEmail: string
  fromName: string
  toEmail: string
  subject: string
  body: string
}

export async function sendRecruitmentEmail(params: SendEmailParams) {
  const { campaignId, coachId, athleteId, fromEmail, fromName, toEmail, subject, body } = params

  // Check daily limit
  const today = new Date().toISOString().split('T')[0]
  const { data: dailyLog } = await supabaseAdmin
    .from('daily_log')
    .select('emails_sent')
    .eq('campaign_id', campaignId)
    .eq('date', today)
    .single()

  const { data: campaign } = await supabaseAdmin
    .from('campaigns')
    .select('daily_email_limit')
    .eq('id', campaignId)
    .single()

  if (dailyLog && campaign && dailyLog.emails_sent >= campaign.daily_email_limit) {
    return { success: false, error: 'Daily email limit reached', sent_today: dailyLog.emails_sent }
  }

  // Check if we already emailed this coach for this campaign
  const { data: existing } = await supabaseAdmin
    .from('messages')
    .select('id')
    .eq('campaign_id', campaignId)
    .eq('coach_id', coachId)
    .eq('type', 'email')
    .not('status', 'eq', 'failed')
    .limit(1)

  if (existing && existing.length > 0) {
    return { success: false, error: 'Already emailed this coach', messageId: existing[0].id }
  }

  // Create message record first (queued)
  const { data: message, error: insertError } = await supabaseAdmin
    .from('messages')
    .insert({
      campaign_id: campaignId,
      coach_id: coachId,
      athlete_id: athleteId,
      type: 'email',
      channel: 'resend',
      to_address: toEmail,
      subject,
      body,
      status: 'queued',
    })
    .select()
    .single()

  if (insertError || !message) {
    return { success: false, error: insertError?.message || 'Failed to create message record' }
  }

  try {
    // Send via Resend
    const result = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: toEmail,
      subject,
      text: body,
    })

    // Update message status
    await supabaseAdmin
      .from('messages')
      .update({
        status: 'sent',
        resend_id: result.data?.id,
        sent_at: new Date().toISOString(),
      })
      .eq('id', message.id)

    // Update daily log
    await supabaseAdmin.rpc('increment_daily_emails', {
      p_campaign_id: campaignId,
      p_date: today,
    })

    // Update campaign total
    await supabaseAdmin.rpc('increment_campaign_emails', {
      p_campaign_id: campaignId,
    })

    return { success: true, messageId: message.id, resendId: result.data?.id }
  } catch (err: any) {
    // Mark as failed
    await supabaseAdmin
      .from('messages')
      .update({ status: 'failed', error: err.message })
      .eq('id', message.id)

    return { success: false, error: err.message, messageId: message.id }
  }
}
