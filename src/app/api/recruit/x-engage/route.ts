import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseClient'
import { refreshAccessToken } from '@/lib/recruit/x-oauth'

// POST /api/recruit/x-engage
// Perform an X engagement action (follow or like) using the athlete's OAuth tokens
export async function POST(request: NextRequest) {
  try {
    const { athleteId, action, targetXHandle, tweetId, coachId } = await request.json()

    if (!athleteId || !action || !targetXHandle) {
      return NextResponse.json(
        { error: 'athleteId, action, and targetXHandle are required' },
        { status: 400 }
      )
    }

    if (!['follow', 'like'].includes(action)) {
      return NextResponse.json(
        { error: 'action must be "follow" or "like"' },
        { status: 400 }
      )
    }

    if (action === 'like' && !tweetId) {
      return NextResponse.json(
        { error: 'tweetId is required for like action' },
        { status: 400 }
      )
    }

    // Rate limit: max 10 total actions per athlete per day
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const { count: todayCount, error: countError } = await supabaseAdmin
      .from('x_engagements')
      .select('*', { count: 'exact', head: true })
      .eq('athlete_id', athleteId)
      .gte('created_at', todayStart.toISOString())

    if (countError) {
      console.error('Failed to check daily engagement count:', countError)
    }

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
      } catch (refreshErr: unknown) {
        console.error('Failed to refresh X token:', refreshErr)
        return NextResponse.json(
          { error: 'Failed to refresh X token. Please reconnect X account.' },
          { status: 401 }
        )
      }
    }

    const cleanHandle = targetXHandle.startsWith('@') ? targetXHandle.slice(1) : targetXHandle

    if (action === 'follow') {
      return await handleFollow(accessToken, sourceUserId, cleanHandle, athleteId, coachId)
    } else {
      return await handleLike(accessToken, sourceUserId, cleanHandle, tweetId, athleteId, coachId)
    }
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : 'Failed to perform engagement action'
    console.error('X engage error:', err)
    return NextResponse.json(
      { error: errMsg },
      { status: 500 }
    )
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

    if (!response.ok) {
      console.error(`Failed to resolve X handle ${handle}:`, response.status)
      return null
    }

    const data = (await response.json()) as { data?: { id: string } }
    return data.data?.id || null
  } catch (err) {
    console.error(`Error resolving X handle ${handle}:`, err)
    return null
  }
}

async function handleFollow(
  accessToken: string,
  sourceUserId: string,
  targetHandle: string,
  athleteId: string,
  coachId?: string
): Promise<NextResponse> {
  // Check if already followed
  const { data: existing } = await supabaseAdmin
    .from('x_engagements')
    .select('id')
    .eq('athlete_id', athleteId)
    .eq('target_x_handle', targetHandle)
    .eq('action_type', 'follow')
    .eq('status', 'completed')
    .limit(1)

  if (existing && existing.length > 0) {
    return NextResponse.json(
      { success: true, alreadyDone: true, message: `Already following @${targetHandle}` }
    )
  }

  // Resolve target handle to user ID
  const targetUserId = await resolveXUserIdWithBearer(targetHandle, accessToken)
  if (!targetUserId) {
    return NextResponse.json(
      { error: `Could not resolve X handle: @${targetHandle}` },
      { status: 400 }
    )
  }

  // Follow via X API v2
  const followUrl = `https://api.x.com/2/users/${sourceUserId}/following`
  const followResponse = await fetch(followUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'User-Agent': 'LocalHustle/1.0',
    },
    body: JSON.stringify({ target_user_id: targetUserId }),
  })

  if (!followResponse.ok) {
    const errorData = (await followResponse.json().catch(() => ({}))) as {
      errors?: Array<{ message: string }>
      detail?: string
    }

    // Handle "already following" gracefully
    const errorMsg = errorData.errors?.[0]?.message || errorData.detail || `X API error: ${followResponse.status}`
    if (followResponse.status === 429) {
      return NextResponse.json({ error: 'X API rate limited. Try again later.' }, { status: 429 })
    }

    return NextResponse.json({ error: errorMsg }, { status: followResponse.status })
  }

  // Log engagement
  await supabaseAdmin
    .from('x_engagements')
    .insert({
      athlete_id: athleteId,
      coach_id: coachId || null,
      target_x_handle: targetHandle,
      target_x_user_id: targetUserId,
      action_type: 'follow',
      status: 'completed',
    })

  return NextResponse.json({
    success: true,
    action: 'follow',
    targetHandle,
    targetUserId,
  })
}

async function handleLike(
  accessToken: string,
  sourceUserId: string,
  targetHandle: string,
  tweetId: string,
  athleteId: string,
  coachId?: string
): Promise<NextResponse> {
  // Check if already liked this tweet
  const { data: existing } = await supabaseAdmin
    .from('x_engagements')
    .select('id')
    .eq('athlete_id', athleteId)
    .eq('tweet_id', tweetId)
    .eq('action_type', 'like')
    .eq('status', 'completed')
    .limit(1)

  if (existing && existing.length > 0) {
    return NextResponse.json(
      { success: true, alreadyDone: true, message: `Already liked this tweet` }
    )
  }

  // Like via X API v2
  const likeUrl = `https://api.x.com/2/users/${sourceUserId}/likes`
  const likeResponse = await fetch(likeUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'User-Agent': 'LocalHustle/1.0',
    },
    body: JSON.stringify({ tweet_id: tweetId }),
  })

  if (!likeResponse.ok) {
    const errorData = (await likeResponse.json().catch(() => ({}))) as {
      errors?: Array<{ message: string }>
      detail?: string
    }
    const errorMsg = errorData.errors?.[0]?.message || errorData.detail || `X API error: ${likeResponse.status}`

    if (likeResponse.status === 429) {
      return NextResponse.json({ error: 'X API rate limited. Try again later.' }, { status: 429 })
    }

    return NextResponse.json({ error: errorMsg }, { status: likeResponse.status })
  }

  // Log engagement
  await supabaseAdmin
    .from('x_engagements')
    .insert({
      athlete_id: athleteId,
      coach_id: coachId || null,
      target_x_handle: targetHandle,
      target_x_user_id: null,
      action_type: 'like',
      tweet_id: tweetId,
      status: 'completed',
    })

  return NextResponse.json({
    success: true,
    action: 'like',
    targetHandle,
    tweetId,
  })
}

// GET /api/recruit/x-engage — fetch engagement status for an athlete's coaches
export async function GET(request: NextRequest) {
  const athleteId = request.nextUrl.searchParams.get('athleteId')
  if (!athleteId) {
    return NextResponse.json({ error: 'athleteId is required' }, { status: 400 })
  }

  const { data: engagements, error } = await supabaseAdmin
    .from('x_engagements')
    .select('target_x_handle, action_type, tweet_id, created_at, status')
    .eq('athlete_id', athleteId)
    .eq('status', 'completed')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Build a map of handle -> actions
  const engagementMap: Record<string, { followed: boolean; likedTweets: string[] }> = {}
  for (const e of engagements || []) {
    const handle = e.target_x_handle.toLowerCase()
    if (!engagementMap[handle]) {
      engagementMap[handle] = { followed: false, likedTweets: [] }
    }
    if (e.action_type === 'follow') {
      engagementMap[handle].followed = true
    }
    if (e.action_type === 'like' && e.tweet_id) {
      engagementMap[handle].likedTweets.push(e.tweet_id)
    }
  }

  return NextResponse.json({ success: true, engagements: engagementMap })
}
