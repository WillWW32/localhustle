import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseClient'
import { refreshAccessToken } from '@/lib/recruit/x-oauth'

// POST /api/recruit/x-engage/latest-tweet
// Fetches a coach's latest tweet and likes it in one operation
export async function POST(request: NextRequest) {
  try {
    const { athleteId, targetXHandle, coachId } = await request.json()

    if (!athleteId || !targetXHandle) {
      return NextResponse.json(
        { error: 'athleteId and targetXHandle are required' },
        { status: 400 }
      )
    }

    // Rate limit: max 10 total actions per athlete per day
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const { count: todayCount } = await supabaseAdmin
      .from('x_engagements')
      .select('*', { count: 'exact', head: true })
      .eq('athlete_id', athleteId)
      .gte('created_at', todayStart.toISOString())

    if ((todayCount ?? 0) >= 10) {
      return NextResponse.json(
        { error: 'Daily engagement limit reached (10 actions per day). Try again tomorrow.' },
        { status: 429 }
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
    const sourceUserId = tokenRow.x_user_id

    if (!sourceUserId) {
      return NextResponse.json(
        { error: 'X user ID not found. Please reconnect X account.' },
        { status: 400 }
      )
    }

    // Refresh token if expired
    const now = new Date()
    const expiresAt = new Date(tokenRow.expires_at)
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
            expires_at: newExpiresAt,
            updated_at: new Date().toISOString(),
          })
          .eq('athlete_id', athleteId)
      } catch {
        return NextResponse.json(
          { error: 'Failed to refresh X token. Please reconnect X account.' },
          { status: 401 }
        )
      }
    }

    const cleanHandle = targetXHandle.startsWith('@') ? targetXHandle.slice(1) : targetXHandle

    // Resolve coach's X user ID
    const targetUserId = await resolveXUserIdWithBearer(cleanHandle, accessToken)
    if (!targetUserId) {
      return NextResponse.json(
        { error: `Could not resolve X handle: @${cleanHandle}` },
        { status: 400 }
      )
    }

    // Fetch recent tweets
    const tweetsUrl = `https://api.x.com/2/users/${targetUserId}/tweets?max_results=5`
    const tweetsRes = await fetch(tweetsUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'User-Agent': 'LocalHustle/1.0',
      },
    })

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

    // Check which tweets we've already liked
    const { data: existingLikes } = await supabaseAdmin
      .from('x_engagements')
      .select('tweet_id')
      .eq('athlete_id', athleteId)
      .eq('action_type', 'like')
      .in('tweet_id', tweets.map(t => t.id))

    const likedTweetIds = new Set(
      (existingLikes || []).map((e: { tweet_id: string }) => e.tweet_id)
    )

    const tweetToLike = tweets.find(t => !likedTweetIds.has(t.id))
    if (!tweetToLike) {
      return NextResponse.json({
        success: true,
        alreadyDone: true,
        message: 'Already liked all recent tweets',
      })
    }

    // Like the tweet
    const likeUrl = `https://api.x.com/2/users/${sourceUserId}/likes`
    const likeRes = await fetch(likeUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'User-Agent': 'LocalHustle/1.0',
      },
      body: JSON.stringify({ tweet_id: tweetToLike.id }),
    })

    if (!likeRes.ok) {
      const errData = (await likeRes.json().catch(() => ({}))) as { detail?: string; errors?: Array<{ message: string }> }
      const errorMsg = errData.errors?.[0]?.message || errData.detail || `X API error: ${likeRes.status}`
      if (likeRes.status === 429) {
        return NextResponse.json({ error: 'X API rate limited. Try again later.' }, { status: 429 })
      }
      return NextResponse.json({ error: errorMsg }, { status: likeRes.status })
    }

    // Log engagement
    await supabaseAdmin.from('x_engagements').insert({
      athlete_id: athleteId,
      coach_id: coachId || null,
      target_x_handle: cleanHandle,
      target_x_user_id: targetUserId,
      action_type: 'like',
      tweet_id: tweetToLike.id,
      status: 'completed',
    })

    return NextResponse.json({
      success: true,
      action: 'like',
      targetHandle: cleanHandle,
      tweetId: tweetToLike.id,
    })
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : 'Failed to like latest tweet'
    console.error('Like latest tweet error:', err)
    return NextResponse.json({ error: errMsg }, { status: 500 })
  }
}

async function resolveXUserIdWithBearer(handle: string, accessToken: string): Promise<string | null> {
  try {
    const url = `https://api.x.com/2/users/by/username/${handle}`
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'User-Agent': 'LocalHustle/1.0',
      },
    })

    if (!response.ok) return null

    const data = (await response.json()) as { data?: { id: string } }
    return data.data?.id || null
  } catch {
    return null
  }
}
