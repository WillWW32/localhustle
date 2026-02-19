// X (Twitter) DM sending via X API v2
import crypto from 'crypto'
import { supabaseAdmin } from '@/lib/supabaseClient'

function generateOAuth1Header(
  method: string,
  url: string,
  apiKey: string,
  apiSecret: string,
  accessToken: string,
  accessSecret: string,
  additionalParams?: Record<string, string>
) {
  const timestamp = Math.floor(Date.now() / 1000).toString()
  const nonce = crypto.randomBytes(32).toString('hex')

  const oauthParams: Record<string, string> = {
    oauth_consumer_key: apiKey,
    oauth_token: accessToken,
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: timestamp,
    oauth_nonce: nonce,
    oauth_version: '1.0',
  }

  const allParams = { ...oauthParams, ...(additionalParams || {}) }
  const paramString = Object.keys(allParams)
    .sort()
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(allParams[key])}`)
    .join('&')

  const signatureBaseString = `${method.toUpperCase()}&${encodeURIComponent(url)}&${encodeURIComponent(paramString)}`
  const signingKey = `${encodeURIComponent(apiSecret)}&${encodeURIComponent(accessSecret)}`

  const signature = crypto
    .createHmac('sha1', signingKey)
    .update(signatureBaseString)
    .digest('base64')

  oauthParams.oauth_signature = signature

  const authHeader = `OAuth ${Object.keys(oauthParams)
    .sort()
    .map((key) => `${key}="${encodeURIComponent(oauthParams[key])}"`)
    .join(', ')}`

  return authHeader
}

export async function resolveXUserId(handle: string): Promise<string | null> {
  const apiKey = process.env.X_API_KEY
  const apiSecret = process.env.X_API_SECRET
  const accessToken = process.env.X_ACCESS_TOKEN
  const accessSecret = process.env.X_ACCESS_SECRET

  if (!apiKey || !apiSecret || !accessToken || !accessSecret) {
    console.warn('X API credentials not configured')
    return null
  }

  const cleanHandle = handle.startsWith('@') ? handle.slice(1) : handle

  try {
    const url = `https://api.twitter.com/2/users/by/username/${cleanHandle}`
    const authHeader = generateOAuth1Header('GET', url, apiKey, apiSecret, accessToken, accessSecret)

    const response = await fetch(url, {
      method: 'GET',
      headers: { Authorization: authHeader, 'User-Agent': 'RecruitmentAgent/1.0' },
    })

    if (!response.ok) {
      console.error(`Failed to resolve X handle ${cleanHandle}:`, response.status)
      return null
    }

    const data = (await response.json()) as { data?: { id: string } }
    return data.data?.id || null
  } catch (err) {
    console.error(`Error resolving X handle ${cleanHandle}:`, err)
    return null
  }
}

interface SendRecruitmentDMParams {
  campaignId: string
  coachId: string
  athleteId: string
  fromHandle: string
  toHandle: string
  message: string
}

export async function sendRecruitmentDM(params: SendRecruitmentDMParams) {
  const { campaignId, coachId, athleteId, fromHandle, toHandle, message } = params

  const today = new Date().toISOString().split('T')[0]
  const { data: dailyLog } = await supabaseAdmin
    .from('daily_log')
    .select('dms_sent')
    .eq('campaign_id', campaignId)
    .eq('date', today)
    .single()

  const { data: campaign } = await supabaseAdmin
    .from('campaigns')
    .select('daily_dm_limit')
    .eq('id', campaignId)
    .single()

  if (dailyLog && campaign && dailyLog.dms_sent >= campaign.daily_dm_limit) {
    return { success: false, error: 'Daily DM limit reached' }
  }

  const { data: existing } = await supabaseAdmin
    .from('messages')
    .select('id')
    .eq('campaign_id', campaignId)
    .eq('coach_id', coachId)
    .eq('type', 'dm')
    .eq('channel', 'x')
    .not('status', 'eq', 'failed')
    .limit(1)

  if (existing && existing.length > 0) {
    return { success: false, error: 'Already DM\'d this coach', messageId: existing[0].id }
  }

  const { data: messageRecord, error: insertError } = await supabaseAdmin
    .from('messages')
    .insert({
      campaign_id: campaignId,
      coach_id: coachId,
      athlete_id: athleteId,
      type: 'dm',
      channel: 'x',
      to_address: toHandle,
      subject: null,
      body: message,
      status: 'queued',
    })
    .select()
    .single()

  if (insertError || !messageRecord) {
    return { success: false, error: insertError?.message || 'Failed to create message record' }
  }

  try {
    const result = await sendViaXAPI(fromHandle, toHandle, message)

    if (result.success) {
      await supabaseAdmin
        .from('messages')
        .update({ status: 'sent', x_message_id: result.xMessageId, sent_at: new Date().toISOString() })
        .eq('id', messageRecord.id)

      await supabaseAdmin.rpc('increment_daily_dms', { p_campaign_id: campaignId, p_date: today })
      await supabaseAdmin.rpc('increment_campaign_dms', { p_campaign_id: campaignId })

      return { success: true, messageId: messageRecord.id, xMessageId: result.xMessageId }
    } else {
      throw new Error(result.error || 'X API DM failed')
    }
  } catch (err: any) {
    await supabaseAdmin
      .from('messages')
      .update({ status: 'failed', error: err.message })
      .eq('id', messageRecord.id)

    return { success: false, error: err.message, messageId: messageRecord.id }
  }
}

async function sendViaXAPI(
  fromHandle: string,
  toHandle: string,
  message: string
): Promise<{ success: boolean; error?: string; xMessageId?: string }> {
  const apiKey = process.env.X_API_KEY
  const apiSecret = process.env.X_API_SECRET
  const accessToken = process.env.X_ACCESS_TOKEN
  const accessSecret = process.env.X_ACCESS_SECRET

  if (!apiKey || !apiSecret || !accessToken || !accessSecret) {
    return { success: false, error: 'X API credentials not configured' }
  }

  try {
    const recipientId = await resolveXUserId(toHandle)
    if (!recipientId) {
      return { success: false, error: `Could not resolve X handle: ${toHandle}` }
    }

    const dmBody = {
      conversation_type: 'DM',
      message_type: 'MessageCreate',
      participant_ids: [recipientId],
      message: { text: message },
    }

    const url = `https://api.twitter.com/2/dm_conversations/with/${recipientId}/messages`
    const authHeader = generateOAuth1Header('POST', url, apiKey, apiSecret, accessToken, accessSecret)

    const response = await fetch(url, {
      method: 'POST',
      headers: { Authorization: authHeader, 'Content-Type': 'application/json', 'User-Agent': 'RecruitmentAgent/1.0' },
      body: JSON.stringify(dmBody),
    })

    if (!response.ok) {
      const errorData = (await response.json()) as { errors?: Array<{ message: string }> }
      const errorMsg = errorData.errors?.[0]?.message || `X API error: ${response.status} ${response.statusText}`

      if (response.status === 429) {
        const retryAfter = response.headers.get('x-rate-limit-reset')
        return { success: false, error: `Rate limited. Retry after: ${retryAfter || 'unknown time'}` }
      }

      return { success: false, error: errorMsg }
    }

    const data = (await response.json()) as { data?: { dm_event_id: string } }
    const xMessageId = data.data?.dm_event_id

    if (!xMessageId) {
      return { success: false, error: 'No message ID returned from X API' }
    }

    return { success: true, xMessageId }
  } catch (err: any) {
    return { success: false, error: `X API request failed: ${err.message}` }
  }
}
