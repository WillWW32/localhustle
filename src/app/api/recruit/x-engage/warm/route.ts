import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseClient'
import { refreshAccessToken } from '@/lib/recruit/x-oauth'

// Basketball-specific reply comments that sound genuine and natural
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

// POST /api/recruit/x-engage/warm
// Warm-engage a coach's X account: like a recent tweet + optionally reply
export async function POST(request: NextRequest) {
  try {
    const { athleteId, coachXHandle } = await request.json()

    if (!athleteId || !coachXHandle) {
      return NextResponse.json(
        { error: 'athleteId and coachXHandle are required' },
        { status: 400 }
      )
    }

    // Fetch athlete's X OAuth tokens
    const { data: tokenRow, error: tokenError } = await supabaseAdmin
      .from('x_oauth_tokens')
      .select('*')
      .eq('athlete_id', athleteId)
      .single()

    if (tokenError || !tokenRow) {
      return NextResponse.json(
        { error: 'Athlete has not connected their X account' },
        { status: 404 }
      )
    }

    let accessToken = tokenRow.access_token

    // Refresh token if expired
    const now = new Date()
    const expiresAt = new Date(tokenRow.token_expires_at || tokenRow.expires_at)
    if (now >= expiresAt) {
      if (!tokenRow.refresh_token) {
        return NextResponse.json(
          { error: 'X token expired and no refresh token available. Please reconnect X account.' },
          { status: 401 }
        )
      }

      try {
        const refreshed = await refreshAccessToken(tokenRow.refresh_token)
        accessToken = refreshed.access_token

        const newExpiresAt = new Date(Date.now() + refreshed.expires_in * 1000).toISOString()
        await supabaseAdmin
          .from('x_oauth_tokens')
          .update({
            access_token: refreshed.access_token,
            refresh_token: refreshed.refresh_token || tokenRow.refresh_token,
            token_expires_at: newExpiresAt,
            expires_at: newExpiresAt,
            last_refreshed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('athlete_id', athleteId)
      } catch (refreshErr: unknown) {
        console.error('Failed to refresh X token:', refreshErr)
        return NextResponse.json(
          { error: 'Failed to refresh X token. Please reconnect X account.' },
          { status: 401 }
        )
      }
    }

    const cleanHandle = coachXHandle.startsWith('@') ? coachXHandle.slice(1) : coachXHandle

    // Get authenticated user ID for like/reply actions
    const meRes = await fetch('https://api.x.com/2/users/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'User-Agent': 'LocalHustle/1.0',
      },
    })

    if (!meRes.ok) {
      return NextResponse.json(
        { error: 'Could not verify authenticated X user' },
        { status: 401 }
      )
    }

    const meData = (await meRes.json()) as { data?: { id: string } }
    const authenticatedUserId = meData.data?.id
    if (!authenticatedUserId) {
      return NextResponse.json(
        { error: 'Could not get authenticated user ID' },
        { status: 401 }
      )
    }

    // Resolve coach's X user ID from handle
    const lookupRes = await fetch(`https://api.x.com/2/users/by/username/${cleanHandle}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'User-Agent': 'LocalHustle/1.0',
      },
    })

    if (!lookupRes.ok) {
      const lookupErr = (await lookupRes.json().catch(() => ({}))) as XApiError
      return NextResponse.json(
        { error: `Could not resolve X handle @${cleanHandle}: ${lookupErr.errors?.[0]?.message || lookupRes.status}` },
        { status: 400 }
      )
    }

    const lookupData = (await lookupRes.json()) as { data?: { id: string } }
    const coachUserId = lookupData.data?.id
    if (!coachUserId) {
      return NextResponse.json(
        { error: `Could not resolve X handle: @${cleanHandle}` },
        { status: 400 }
      )
    }

    // Fetch coach's recent tweets
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
      return NextResponse.json(
        { error: `Could not fetch tweets for @${cleanHandle}` },
        { status: 400 }
      )
    }

    const tweetsData = (await tweetsRes.json()) as { data?: Array<{ id: string; text: string }> }
    const tweets = tweetsData.data || []

    if (tweets.length === 0) {
      return NextResponse.json(
        { error: `No recent tweets found for @${cleanHandle}` },
        { status: 404 }
      )
    }

    // Look up coach in DB to get coach_id
    const { data: coach } = await supabaseAdmin
      .from('coaches')
      .select('id')
      .or(`x_handle.eq.${cleanHandle},x_handle.eq.@${cleanHandle}`)
      .limit(1)
      .single()

    const coachId = coach?.id || null
    const engagements: Array<{ type: string; tweetId: string; replyText?: string }> = []

    // 1. Like the most recent tweet
    const tweetToLike = tweets[0]
    const likeUrl = `https://api.x.com/2/users/${authenticatedUserId}/likes`
    const likeRes = await fetch(likeUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'User-Agent': 'LocalHustle/1.0',
      },
      body: JSON.stringify({ tweet_id: tweetToLike.id }),
    })

    if (likeRes.ok) {
      // Store the like engagement
      await supabaseAdmin.from('x_engagements').insert({
        athlete_id: athleteId,
        coach_id: coachId,
        target_x_handle: cleanHandle,
        target_x_user_id: coachUserId,
        action_type: 'like',
        engagement_type: 'like',
        tweet_id: tweetToLike.id,
        status: 'completed',
      })
      engagements.push({ type: 'like', tweetId: tweetToLike.id })
    } else {
      const likeErr = (await likeRes.json().catch(() => ({}))) as XApiError
      console.error('Like failed:', likeErr.errors?.[0]?.message || likeRes.status)
    }

    // 2. Reply to a tweet (pick a different one if available, otherwise use the same)
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
      // Store the reply engagement
      await supabaseAdmin.from('x_engagements').insert({
        athlete_id: athleteId,
        coach_id: coachId,
        target_x_handle: cleanHandle,
        target_x_user_id: coachUserId,
        action_type: 'reply',
        engagement_type: 'reply',
        tweet_id: tweetToReply.id,
        reply_text: replyText,
        status: 'completed',
      })
      engagements.push({ type: 'reply', tweetId: tweetToReply.id, replyText })
    } else {
      const replyErr = (await replyRes.json().catch(() => ({}))) as XApiError
      console.error('Reply failed:', replyErr.errors?.[0]?.message || replyRes.status)
      // Reply is optional, don't fail the whole operation
    }

    return NextResponse.json({
      success: true,
      coachXHandle: cleanHandle,
      coachUserId,
      engagements,
      tweetsFound: tweets.length,
    })
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : 'Failed to warm-engage'
    console.error('Warm engage error:', err)
    return NextResponse.json(
      { error: errMsg },
      { status: 500 }
    )
  }
}
