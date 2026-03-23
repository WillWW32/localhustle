import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseClient'
import { refreshAccessToken } from '@/lib/recruit/x-oauth'

const MAX_ENGAGEMENTS_PER_HOUR = 10
const MAX_DMS_PER_DAY = 20

// Basketball-specific reply comments for warm engagement
const REPLY_COMMENTS = [
  'Great win! That defense was locked in',
  'Love how your guys compete every night',
  'Your squad is playing with real energy right now',
  'That was a tough win, love the grit from your team',
  'Programs built the right way. Respect',
  'Love seeing that ball movement, coaching shows',
  'Your players play hard every possession, says a lot about the culture',
  'Great game! The effort on the boards was impressive',
  'That team chemistry is real. Fun to watch',
  'Strong finish to that game, your guys never quit',
]

function getRandomReply(): string {
  return REPLY_COMMENTS[Math.floor(Math.random() * REPLY_COMMENTS.length)]
}

interface XApiError {
  errors?: Array<{ message: string }>
  detail?: string
}

interface TokenRow {
  athlete_id: string
  access_token: string
  refresh_token: string | null
  token_expires_at: string
  expires_at: string
  x_user_id: string
}

interface QueueEntry {
  id: string
  athlete_id: string
  coach_x_handle: string
  status: string
  engage_at: string
  dm_at: string
  dm_message: string | null
}

/**
 * Get a valid access token for the athlete, refreshing if needed.
 * Returns the access token and authenticated user ID, or null on failure.
 */
async function getValidToken(athleteId: string): Promise<{ accessToken: string; userId: string } | null> {
  const { data: tokenRow, error: tokenError } = await supabaseAdmin
    .from('x_oauth_tokens')
    .select('*')
    .eq('athlete_id', athleteId)
    .single()

  if (tokenError || !tokenRow) return null

  const row = tokenRow as TokenRow
  let accessToken = row.access_token
  const userId = row.x_user_id

  if (!userId) return null

  // Refresh if expired
  const now = new Date()
  const expiresAt = new Date(row.token_expires_at || row.expires_at)
  if (now >= expiresAt) {
    if (!row.refresh_token) return null

    try {
      const refreshed = await refreshAccessToken(row.refresh_token)
      accessToken = refreshed.access_token

      const newExpiresAt = new Date(Date.now() + refreshed.expires_in * 1000).toISOString()
      await supabaseAdmin
        .from('x_oauth_tokens')
        .update({
          access_token: refreshed.access_token,
          refresh_token: refreshed.refresh_token || row.refresh_token,
          token_expires_at: newExpiresAt,
          expires_at: newExpiresAt,
          last_refreshed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('athlete_id', athleteId)
    } catch (err) {
      console.error(`Failed to refresh token for athlete ${athleteId}:`, err)
      return null
    }
  }

  return { accessToken, userId }
}

/**
 * Perform warm engagement: like a recent tweet + optionally reply
 */
async function warmEngage(
  accessToken: string,
  authenticatedUserId: string,
  coachXHandle: string,
  athleteId: string
): Promise<{ success: boolean; error?: string }> {
  // Resolve coach user ID
  const lookupRes = await fetch(`https://api.x.com/2/users/by/username/${coachXHandle}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'User-Agent': 'LocalHustle/1.0',
    },
  })

  if (!lookupRes.ok) {
    return { success: false, error: `Could not resolve @${coachXHandle}` }
  }

  const lookupData = (await lookupRes.json()) as { data?: { id: string } }
  const coachUserId = lookupData.data?.id
  if (!coachUserId) {
    return { success: false, error: `No user ID for @${coachXHandle}` }
  }

  // Fetch recent tweets
  const tweetsRes = await fetch(
    `https://api.x.com/2/users/${coachUserId}/tweets?max_results=5`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'User-Agent': 'LocalHustle/1.0',
      },
    }
  )

  if (!tweetsRes.ok) {
    return { success: false, error: `Could not fetch tweets for @${coachXHandle}` }
  }

  const tweetsData = (await tweetsRes.json()) as { data?: Array<{ id: string; text: string }> }
  const tweets = tweetsData.data || []

  if (tweets.length === 0) {
    return { success: false, error: `No recent tweets for @${coachXHandle}` }
  }

  // Look up coach_id
  const { data: coach } = await supabaseAdmin
    .from('coaches')
    .select('id')
    .or(`x_handle.eq.${coachXHandle},x_handle.eq.@${coachXHandle}`)
    .limit(1)
    .single()

  const coachId = coach?.id || null

  // Like the most recent tweet
  const tweetToLike = tweets[0]
  const likeRes = await fetch(`https://api.x.com/2/users/${authenticatedUserId}/likes`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'User-Agent': 'LocalHustle/1.0',
    },
    body: JSON.stringify({ tweet_id: tweetToLike.id }),
  })

  if (likeRes.ok) {
    await supabaseAdmin.from('x_engagements').insert({
      athlete_id: athleteId,
      coach_id: coachId,
      target_x_handle: coachXHandle,
      target_x_user_id: coachUserId,
      action_type: 'like',
      engagement_type: 'like',
      tweet_id: tweetToLike.id,
      status: 'completed',
    })
  }

  // Reply to a tweet (optional, don't fail if this doesn't work)
  const tweetToReply = tweets.length > 1 ? tweets[1] : tweets[0]
  const replyText = getRandomReply()

  const replyRes = await fetch('https://api.x.com/2/tweets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'User-Agent': 'LocalHustle/1.0',
    },
    body: JSON.stringify({
      text: replyText,
      reply: { in_reply_to_tweet_id: tweetToReply.id },
    }),
  })

  if (replyRes.ok) {
    await supabaseAdmin.from('x_engagements').insert({
      athlete_id: athleteId,
      coach_id: coachId,
      target_x_handle: coachXHandle,
      target_x_user_id: coachUserId,
      action_type: 'reply',
      engagement_type: 'reply',
      tweet_id: tweetToReply.id,
      reply_text: replyText,
      status: 'completed',
    })
  }

  return { success: true }
}

/**
 * Send a DM to a coach using the same logic as /api/recruit/dm/send
 */
async function sendDM(
  accessToken: string,
  coachXHandle: string,
  message: string,
  athleteId: string
): Promise<{ success: boolean; error?: string; xMessageId?: string }> {
  // Resolve coach's X user ID
  const lookupRes = await fetch(`https://api.x.com/2/users/by/username/${coachXHandle}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'User-Agent': 'LocalHustle/1.0',
    },
  })

  if (!lookupRes.ok) {
    return { success: false, error: `Could not resolve @${coachXHandle}` }
  }

  const lookupData = (await lookupRes.json()) as { data?: { id: string } }
  const recipientId = lookupData.data?.id
  if (!recipientId) {
    return { success: false, error: `No user ID for @${coachXHandle}` }
  }

  // Send DM
  const dmUrl = `https://api.twitter.com/2/dm_conversations/with/${recipientId}/messages`
  const dmRes = await fetch(dmUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'User-Agent': 'LocalHustle/1.0',
    },
    body: JSON.stringify({ text: message }),
  })

  if (!dmRes.ok) {
    const errData = (await dmRes.json().catch(() => ({}))) as XApiError
    const errorMsg = errData.errors?.[0]?.message || errData.detail || `HTTP ${dmRes.status}`
    return { success: false, error: errorMsg }
  }

  const dmData = (await dmRes.json()) as { data?: { dm_event_id: string } }
  const xMessageId = dmData.data?.dm_event_id

  // Log to messages table
  const { data: coach } = await supabaseAdmin
    .from('coaches')
    .select('id')
    .or(`x_handle.eq.${coachXHandle},x_handle.eq.@${coachXHandle}`)
    .limit(1)
    .single()

  await supabaseAdmin.from('messages').insert({
    coach_id: coach?.id || null,
    athlete_id: athleteId,
    type: 'dm',
    channel: 'x',
    to_address: coachXHandle,
    subject: null,
    body: message,
    status: xMessageId ? 'sent' : 'failed',
    x_message_id: xMessageId || null,
    sent_at: new Date().toISOString(),
  })

  return { success: true, xMessageId: xMessageId || undefined }
}

// POST /api/recruit/x-engage/process
// Cron endpoint: processes queued warm engagements and scheduled DMs
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization')
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()
    const results = {
      engagements: { processed: 0, succeeded: 0, failed: 0, skipped: 0 },
      dms: { processed: 0, succeeded: 0, failed: 0, skipped: 0 },
      errors: [] as string[],
    }

    // --- Phase 1: Process warm engagements ---
    // Find entries where status='queued' and engage_at <= now
    const { data: engageQueue, error: engageError } = await supabaseAdmin
      .from('x_engagement_queue')
      .select('*')
      .eq('status', 'queued')
      .lte('engage_at', now.toISOString())
      .order('engage_at', { ascending: true })
      .limit(MAX_ENGAGEMENTS_PER_HOUR)

    if (engageError) {
      console.error('Failed to fetch engage queue:', engageError)
      results.errors.push(`Engage queue fetch error: ${engageError.message}`)
    }

    // Check hourly engagement rate
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
    const { count: recentEngagements } = await supabaseAdmin
      .from('x_engagements')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', oneHourAgo.toISOString())

    const engagementsRemaining = Math.max(0, MAX_ENGAGEMENTS_PER_HOUR - (recentEngagements || 0))

    for (const entry of (engageQueue as QueueEntry[] || []).slice(0, engagementsRemaining)) {
      results.engagements.processed++

      const token = await getValidToken(entry.athlete_id)
      if (!token) {
        results.engagements.failed++
        await supabaseAdmin
          .from('x_engagement_queue')
          .update({ status: 'failed', error_message: 'No valid X token', updated_at: now.toISOString() })
          .eq('id', entry.id)
        continue
      }

      const result = await warmEngage(
        token.accessToken,
        token.userId,
        entry.coach_x_handle,
        entry.athlete_id
      )

      if (result.success) {
        results.engagements.succeeded++
        await supabaseAdmin
          .from('x_engagement_queue')
          .update({ status: 'engaged', updated_at: now.toISOString() })
          .eq('id', entry.id)
      } else {
        results.engagements.failed++
        await supabaseAdmin
          .from('x_engagement_queue')
          .update({ status: 'failed', error_message: result.error || 'Unknown error', updated_at: now.toISOString() })
          .eq('id', entry.id)
      }

      // Delay between actions to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 2000))
    }

    // Count skipped due to rate limit
    if (engageQueue && engageQueue.length > engagementsRemaining) {
      results.engagements.skipped = engageQueue.length - engagementsRemaining
    }

    // --- Phase 2: Process DMs for engaged coaches ---
    // Find entries where status='engaged' and dm_at <= now
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const { count: dmsSentToday } = await supabaseAdmin
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('type', 'dm')
      .eq('channel', 'x')
      .eq('status', 'sent')
      .gte('sent_at', todayStart.toISOString())

    const dmsRemaining = Math.max(0, MAX_DMS_PER_DAY - (dmsSentToday || 0))

    const { data: dmQueue, error: dmError } = await supabaseAdmin
      .from('x_engagement_queue')
      .select('*')
      .eq('status', 'engaged')
      .lte('dm_at', now.toISOString())
      .order('dm_at', { ascending: true })
      .limit(dmsRemaining)

    if (dmError) {
      console.error('Failed to fetch DM queue:', dmError)
      results.errors.push(`DM queue fetch error: ${dmError.message}`)
    }

    for (const entry of (dmQueue as QueueEntry[] || [])) {
      results.dms.processed++

      if (!entry.dm_message) {
        results.dms.skipped++
        results.errors.push(`No DM message for @${entry.coach_x_handle}, skipping`)
        continue
      }

      const token = await getValidToken(entry.athlete_id)
      if (!token) {
        results.dms.failed++
        await supabaseAdmin
          .from('x_engagement_queue')
          .update({ status: 'failed', error_message: 'No valid X token for DM', updated_at: now.toISOString() })
          .eq('id', entry.id)
        continue
      }

      const dmResult = await sendDM(
        token.accessToken,
        entry.coach_x_handle,
        entry.dm_message,
        entry.athlete_id
      )

      if (dmResult.success) {
        results.dms.succeeded++
        await supabaseAdmin
          .from('x_engagement_queue')
          .update({ status: 'dm_sent', updated_at: now.toISOString() })
          .eq('id', entry.id)
      } else {
        results.dms.failed++
        await supabaseAdmin
          .from('x_engagement_queue')
          .update({ status: 'failed', error_message: dmResult.error || 'DM send failed', updated_at: now.toISOString() })
          .eq('id', entry.id)
      }

      // Delay between DMs
      await new Promise(resolve => setTimeout(resolve, 3000))
    }

    return NextResponse.json({
      success: true,
      processedAt: now.toISOString(),
      results,
    })
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : 'Process failed'
    console.error('Engagement process error:', err)
    return NextResponse.json(
      { error: errMsg },
      { status: 500 }
    )
  }
}
