// X (Twitter) DM sending — sends recruitment messages via X API v2 or browser automation fallback
import crypto from 'crypto';
import { supabaseAdmin } from './supabase';

/**
 * OAuth 1.0a signature generation for X API authentication
 */
function generateOAuth1Header(
  method: string,
  url: string,
  apiKey: string,
  apiSecret: string,
  accessToken: string,
  accessSecret: string,
  additionalParams?: Record<string, string>
) {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = crypto.randomBytes(32).toString('hex');

  const oauthParams: Record<string, string> = {
    oauth_consumer_key: apiKey,
    oauth_token: accessToken,
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: timestamp,
    oauth_nonce: nonce,
    oauth_version: '1.0',
  };

  // Combine all params for signature base string
  const allParams = { ...oauthParams, ...(additionalParams || {}) };
  const paramString = Object.keys(allParams)
    .sort()
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(allParams[key])}`)
    .join('&');

  const signatureBaseString = `${method.toUpperCase()}&${encodeURIComponent(url)}&${encodeURIComponent(paramString)}`;
  const signingKey = `${encodeURIComponent(apiSecret)}&${encodeURIComponent(accessSecret)}`;

  const signature = crypto
    .createHmac('sha1', signingKey)
    .update(signatureBaseString)
    .digest('base64');

  oauthParams.oauth_signature = signature;

  const authHeader = `OAuth ${Object.keys(oauthParams)
    .sort()
    .map((key) => `${key}="${encodeURIComponent(oauthParams[key])}"`)
    .join(', ')}`;

  return authHeader;
}

/**
 * Resolve X handle to user ID using X API v2
 * This is needed because X API requires user IDs for DM endpoints
 */
export async function resolveXUserId(handle: string): Promise<string | null> {
  const apiKey = process.env.X_API_KEY;
  const apiSecret = process.env.X_API_SECRET;
  const accessToken = process.env.X_ACCESS_TOKEN;
  const accessSecret = process.env.X_ACCESS_SECRET;

  if (!apiKey || !apiSecret || !accessToken || !accessSecret) {
    console.warn('X API credentials not configured');
    return null;
  }

  // Normalize handle (remove @ if present)
  const cleanHandle = handle.startsWith('@') ? handle.slice(1) : handle;

  try {
    const url = `https://api.twitter.com/2/users/by/username/${cleanHandle}`;
    const authHeader = generateOAuth1Header(
      'GET',
      url,
      apiKey,
      apiSecret,
      accessToken,
      accessSecret
    );

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: authHeader,
        'User-Agent': 'RecruitmentAgent/1.0',
      },
    });

    if (!response.ok) {
      console.error(`Failed to resolve X handle ${cleanHandle}:`, response.status);
      return null;
    }

    const data = (await response.json()) as { data?: { id: string } };
    return data.data?.id || null;
  } catch (err) {
    console.error(`Error resolving X handle ${cleanHandle}:`, err);
    return null;
  }
}

interface SendRecruitmentDMParams {
  campaignId: string;
  coachId: string;
  athleteId: string;
  fromHandle: string; // @Josiah_Boone26
  toHandle: string; // coach's X handle
  message: string;
}

interface SendRecruitmentDMResult {
  success: boolean;
  error?: string;
  messageId?: string;
  xMessageId?: string;
}

/**
 * Send recruitment DM to coach via X API v2 with fallback to browser automation
 */
export async function sendRecruitmentDM(
  params: SendRecruitmentDMParams
): Promise<SendRecruitmentDMResult> {
  const { campaignId, coachId, athleteId, fromHandle, toHandle, message } = params;

  // Check daily limit
  const today = new Date().toISOString().split('T')[0];
  const { data: dailyLog } = await supabaseAdmin
    .from('daily_log')
    .select('dms_sent')
    .eq('campaign_id', campaignId)
    .eq('date', today)
    .single();

  const { data: campaign } = await supabaseAdmin
    .from('campaigns')
    .select('daily_dm_limit')
    .eq('id', campaignId)
    .single();

  if (dailyLog && campaign && dailyLog.dms_sent >= campaign.daily_dm_limit) {
    return { success: false, error: 'Daily DM limit reached' };
  }

  // Check if we already DM'd this coach for this campaign
  const { data: existing } = await supabaseAdmin
    .from('messages')
    .select('id')
    .eq('campaign_id', campaignId)
    .eq('coach_id', coachId)
    .eq('type', 'dm')
    .eq('channel', 'x')
    .not('status', 'eq', 'failed')
    .limit(1);

  if (existing && existing.length > 0) {
    return { success: false, error: 'Already DM\'d this coach', messageId: existing[0].id };
  }

  // Create message record first (queued)
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
    .single();

  if (insertError || !messageRecord) {
    return { success: false, error: insertError?.message || 'Failed to create message record' };
  }

  try {
    // Try X API v2 method first
    const result = await sendViaXAPI(fromHandle, toHandle, message);

    if (result.success) {
      // Update message status with X message ID
      await supabaseAdmin
        .from('messages')
        .update({
          status: 'sent',
          x_message_id: result.xMessageId,
          sent_at: new Date().toISOString(),
        })
        .eq('id', messageRecord.id);

      // Update daily log
      await supabaseAdmin.rpc('increment_daily_dms', {
        p_campaign_id: campaignId,
        p_date: today,
      });

      // Update campaign total
      await supabaseAdmin.rpc('increment_campaign_dms', {
        p_campaign_id: campaignId,
      });

      return { success: true, messageId: messageRecord.id, xMessageId: result.xMessageId };
    } else {
      // API failed, could fall back to browser automation here
      console.warn(`X API DM failed: ${result.error}, considering browser fallback`);
      // TODO: Implement browser automation fallback using Playwright
      // For now, mark as failed
      throw new Error(result.error || 'X API DM failed');
    }
  } catch (err: any) {
    // Mark as failed
    await supabaseAdmin
      .from('messages')
      .update({ status: 'failed', error: err.message })
      .eq('id', messageRecord.id);

    return { success: false, error: err.message, messageId: messageRecord.id };
  }
}

/**
 * Send DM via X API v2
 * Requires recipient user ID, so we resolve the handle first
 */
async function sendViaXAPI(
  fromHandle: string,
  toHandle: string,
  message: string
): Promise<{ success: boolean; error?: string; xMessageId?: string }> {
  const apiKey = process.env.X_API_KEY;
  const apiSecret = process.env.X_API_SECRET;
  const accessToken = process.env.X_ACCESS_TOKEN;
  const accessSecret = process.env.X_ACCESS_SECRET;

  if (!apiKey || !apiSecret || !accessToken || !accessSecret) {
    return { success: false, error: 'X API credentials not configured' };
  }

  try {
    // First, resolve the recipient's user ID
    const recipientId = await resolveXUserId(toHandle);
    if (!recipientId) {
      return { success: false, error: `Could not resolve X handle: ${toHandle}` };
    }

    // Prepare DM request body
    const dmBody = {
      conversation_type: 'DM',
      message_type: 'MessageCreate',
      participant_ids: [recipientId],
      message: {
        text: message,
      },
    };

    const url = 'https://api.twitter.com/2/dm_conversations/with/:participant_id/messages';
    const urlWithId = url.replace(':participant_id', recipientId);

    const authHeader = generateOAuth1Header(
      'POST',
      urlWithId,
      apiKey,
      apiSecret,
      accessToken,
      accessSecret
    );

    const response = await fetch(urlWithId, {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
        'User-Agent': 'RecruitmentAgent/1.0',
      },
      body: JSON.stringify(dmBody),
    });

    if (!response.ok) {
      const errorData = (await response.json()) as { errors?: Array<{ message: string }> };
      const errorMsg =
        errorData.errors?.[0]?.message || `X API error: ${response.status} ${response.statusText}`;

      // Handle rate limiting
      if (response.status === 429) {
        const retryAfter = response.headers.get('x-rate-limit-reset');
        return {
          success: false,
          error: `Rate limited. Retry after: ${retryAfter || 'unknown time'}`,
        };
      }

      return { success: false, error: errorMsg };
    }

    const data = (await response.json()) as { data?: { dm_conversation_id: string; dm_event_id: string } };
    const xMessageId = data.data?.dm_event_id;

    if (!xMessageId) {
      return { success: false, error: 'No message ID returned from X API' };
    }

    return { success: true, xMessageId };
  } catch (err: any) {
    return { success: false, error: `X API request failed: ${err.message}` };
  }
}

/**
 * Browser automation fallback (Playwright)
 * PLACEHOLDER: Full implementation would:
 * 1. Launch browser with Playwright
 * 2. Navigate to X login page or use cookies if available
 * 3. Search for coach's profile
 * 4. Open DM conversation
 * 5. Type and send message
 * 6. Handle rate limiting and captchas
 * 7. Close browser
 *
 * This approach is slower and less reliable than API but works when API is unavailable
 *
 * Env vars needed:
 * - X_USERNAME: athlete's X username
 * - X_PASSWORD: athlete's X password (or use OAuth tokens)
 * - Optional: X_SESSION_COOKIES: JSON stringified browser cookies
 */
async function sendViaPlaywrightFallback(
  fromHandle: string,
  toHandle: string,
  message: string
): Promise<{ success: boolean; error?: string; xMessageId?: string }> {
  // TODO: Implement using Playwright
  // const { chromium } = require('playwright');
  // const browser = await chromium.launch({ headless: true });
  // const context = await browser.newContext();
  // const page = await context.newPage();
  // ... navigate to X, login, open DM, send message ...
  // await browser.close();

  console.warn('Playwright fallback not yet implemented');
  return {
    success: false,
    error: 'Browser automation fallback not implemented. Configure X API credentials to send DMs.',
  };
}
