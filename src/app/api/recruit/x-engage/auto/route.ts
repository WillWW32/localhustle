import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseClient'
import { refreshAccessToken } from '@/lib/recruit/x-oauth'

interface TokenRow {
  athlete_id: string
  access_token: string
  refresh_token: string | null
  expires_at: string
  x_user_id: string
}

interface CoachRow {
  id: string
  name: string
  x_handle: string
}

// GET /api/recruit/x-engage/auto
// Cron-style endpoint: auto-follows coaches and likes their recent tweets
export async function GET(request: Request) {
  try {
    // Verify cron secret for Vercel cron jobs
    const authHeader = request.headers.get('authorization')
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find all athletes with connected X accounts
    const { data: tokens, error: tokenError } = await supabaseAdmin
      .from('x_oauth_tokens')
      .select('athlete_id, access_token, refresh_token, expires_at, x_user_id')

    if (tokenError || !tokens || tokens.length === 0) {
      return NextResponse.json({ message: 'No athletes with X tokens found', actions: [] })
    }

    const results: Array<{
      athleteId: string
      follows: Array<{ handle: string; success: boolean; error?: string }>
      likes: Array<{ handle: string; tweetId: string; success: boolean; error?: string }>
    }> = []

    for (const tokenRow of tokens as TokenRow[]) {
      const athleteId = tokenRow.athlete_id
      const sourceUserId = tokenRow.x_user_id

      if (!sourceUserId) continue

      // Refresh token proactively — always refresh on cron run to keep refresh token alive
      let accessToken = tokenRow.access_token
      const now = new Date()
      const expiresAt = new Date(tokenRow.expires_at || tokenRow.token_expires_at || 0)
      const shouldRefresh = now >= expiresAt || (expiresAt.getTime() - now.getTime()) < 30 * 60 * 1000 // refresh if <30min left

      if (shouldRefresh) {
        if (!tokenRow.refresh_token) {
          console.error(`No refresh token for athlete ${athleteId} — re-auth required`)
          continue
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
              token_expires_at: newExpiresAt,
              last_refreshed_at: now.toISOString(),
              updated_at: now.toISOString(),
            })
            .eq('athlete_id', athleteId)
        } catch (err) {
          console.error(`Failed to refresh token for athlete ${athleteId}:`, err)
          continue
        }
      }

      // Check today's engagement counts for this athlete
      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)

      const { data: todayEngagements } = await supabaseAdmin
        .from('x_engagements')
        .select('action_type')
        .eq('athlete_id', athleteId)
        .gte('created_at', todayStart.toISOString())

      const todayFollows = (todayEngagements || []).filter((e: { action_type: string }) => e.action_type === 'follow').length
      const todayLikes = (todayEngagements || []).filter((e: { action_type: string }) => e.action_type === 'like').length

      const followsRemaining = Math.max(0, 5 - todayFollows)
      const likesRemaining = Math.max(0, 5 - todayLikes)

      if (followsRemaining === 0 && likesRemaining === 0) continue

      // Get coaches associated with this athlete that have X handles
      // Coaches who were emailed (have messages) or are in target list but not yet followed
      const { data: coaches } = await supabaseAdmin
        .from('coaches')
        .select('id, name, x_handle')
        .not('x_handle', 'is', null)
        .not('x_handle', 'eq', '')

      if (!coaches || coaches.length === 0) continue

      // Get already-followed handles
      const { data: existingFollows } = await supabaseAdmin
        .from('x_engagements')
        .select('target_x_handle')
        .eq('athlete_id', athleteId)
        .eq('action_type', 'follow')
        .eq('status', 'completed')

      const followedHandles = new Set(
        (existingFollows || []).map((e: { target_x_handle: string }) => e.target_x_handle.toLowerCase())
      )

      // Filter to coaches not yet followed, prioritize those recently emailed
      const { data: recentlyEmailed } = await supabaseAdmin
        .from('messages')
        .select('coach_id')
        .eq('athlete_id', athleteId)
        .eq('type', 'email')
        .eq('status', 'sent')
        .order('sent_at', { ascending: false })
        .limit(50)

      const emailedCoachIds = new Set(
        (recentlyEmailed || []).map((m: { coach_id: string }) => m.coach_id)
      )

      // Sort coaches: emailed ones first, then others
      const unfollowedCoaches = (coaches as CoachRow[])
        .filter(c => {
          const handle = c.x_handle.startsWith('@') ? c.x_handle.slice(1).toLowerCase() : c.x_handle.toLowerCase()
          return !followedHandles.has(handle)
        })
        .sort((a, b) => {
          const aEmailed = emailedCoachIds.has(a.id) ? 0 : 1
          const bEmailed = emailedCoachIds.has(b.id) ? 0 : 1
          return aEmailed - bEmailed
        })

      const athleteResult: (typeof results)[number] = {
        athleteId,
        follows: [],
        likes: [],
      }

      // Auto-follow up to 5 coaches
      const toFollow = unfollowedCoaches.slice(0, followsRemaining)
      for (const coach of toFollow) {
        const cleanHandle = coach.x_handle.startsWith('@') ? coach.x_handle.slice(1) : coach.x_handle
        try {
          const targetUserId = await resolveXUserIdWithBearer(cleanHandle, accessToken)
          if (!targetUserId) {
            athleteResult.follows.push({ handle: cleanHandle, success: false, error: 'Could not resolve handle' })
            continue
          }

          const followUrl = `https://api.x.com/2/users/${sourceUserId}/following`
          const followRes = await fetch(followUrl, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
              'User-Agent': 'LocalHustle/1.0',
            },
            body: JSON.stringify({ target_user_id: targetUserId }),
          })

          if (followRes.ok || followRes.status === 200) {
            await supabaseAdmin.from('x_engagements').insert({
              athlete_id: athleteId,
              coach_id: coach.id,
              target_x_handle: cleanHandle,
              target_x_user_id: targetUserId,
              action_type: 'follow',
              status: 'completed',
            })
            athleteResult.follows.push({ handle: cleanHandle, success: true })
          } else {
            const errData = (await followRes.json().catch(() => ({}))) as { detail?: string; errors?: Array<{ message: string }> }
            athleteResult.follows.push({
              handle: cleanHandle,
              success: false,
              error: errData.errors?.[0]?.message || errData.detail || `HTTP ${followRes.status}`,
            })
          }
        } catch (err: unknown) {
          const errMsg = err instanceof Error ? err.message : 'Unknown error'
          athleteResult.follows.push({ handle: cleanHandle, success: false, error: errMsg })
        }

        // Small delay between actions to be respectful of rate limits
        await new Promise(resolve => setTimeout(resolve, 1000))
      }

      // Like recent tweets from coaches (prioritize recently emailed coaches)
      if (likesRemaining > 0) {
        const coachesForLikes = (coaches as CoachRow[])
          .filter(c => emailedCoachIds.has(c.id))
          .slice(0, likesRemaining)

        for (const coach of coachesForLikes) {
          const cleanHandle = coach.x_handle.startsWith('@') ? coach.x_handle.slice(1) : coach.x_handle
          try {
            const targetUserId = await resolveXUserIdWithBearer(cleanHandle, accessToken)
            if (!targetUserId) continue

            // Get recent tweets
            const tweetsUrl = `https://api.x.com/2/users/${targetUserId}/tweets?max_results=5`
            const tweetsRes = await fetch(tweetsUrl, {
              method: 'GET',
              headers: {
                Authorization: `Bearer ${accessToken}`,
                'User-Agent': 'LocalHustle/1.0',
              },
            })

            if (!tweetsRes.ok) continue

            const tweetsData = (await tweetsRes.json()) as { data?: Array<{ id: string; text: string }> }
            const tweets = tweetsData.data || []
            if (tweets.length === 0) continue

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

            // Like the most recent un-liked tweet
            const tweetToLike = tweets.find(t => !likedTweetIds.has(t.id))
            if (!tweetToLike) continue

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

            if (likeRes.ok) {
              await supabaseAdmin.from('x_engagements').insert({
                athlete_id: athleteId,
                coach_id: coach.id,
                target_x_handle: cleanHandle,
                target_x_user_id: targetUserId,
                action_type: 'like',
                tweet_id: tweetToLike.id,
                status: 'completed',
              })
              athleteResult.likes.push({ handle: cleanHandle, tweetId: tweetToLike.id, success: true })
            } else {
              const errData = (await likeRes.json().catch(() => ({}))) as { detail?: string; errors?: Array<{ message: string }> }
              athleteResult.likes.push({
                handle: cleanHandle,
                tweetId: tweetToLike.id,
                success: false,
                error: errData.errors?.[0]?.message || errData.detail || `HTTP ${likeRes.status}`,
              })
            }
          } catch (err: unknown) {
            const errMsg = err instanceof Error ? err.message : 'Unknown error'
            athleteResult.likes.push({ handle: cleanHandle, tweetId: '', success: false, error: errMsg })
          }

          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }

      results.push(athleteResult)
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      results,
    })
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : 'Auto-engage failed'
    console.error('Auto-engage error:', err)
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
