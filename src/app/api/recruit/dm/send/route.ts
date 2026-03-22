import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseClient'
import { refreshAccessToken } from '@/lib/recruit/x-oauth'
import { resolveXUserId } from '@/lib/recruit/x-dm-sender'

// POST /api/recruit/dm/send
// Send a DM via X API v2 using the athlete's OAuth tokens
export async function POST(request: NextRequest) {
  try {
    const { athleteId, coachXHandle, message } = await request.json()

    if (!athleteId || !coachXHandle || !message) {
      return NextResponse.json(
        { error: 'athleteId, coachXHandle, and message are required' },
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
            last_refreshed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('athlete_id', athleteId)
      } catch (refreshErr: any) {
        console.error('Failed to refresh X token:', refreshErr)
        return NextResponse.json(
          { error: 'Failed to refresh X token. Please reconnect X account.' },
          { status: 401 }
        )
      }
    }

    // Resolve coach's X user ID from handle
    const recipientId = await resolveXUserId(coachXHandle)
    if (!recipientId) {
      return NextResponse.json(
        { error: `Could not resolve X handle: ${coachXHandle}` },
        { status: 400 }
      )
    }

    // Send DM via X API v2 using athlete's OAuth2 Bearer token
    const dmUrl = `https://api.twitter.com/2/dm_conversations/with/${recipientId}/messages`
    const dmResponse = await fetch(dmUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'User-Agent': 'LocalHustle/1.0',
      },
      body: JSON.stringify({ text: message }),
    })

    if (!dmResponse.ok) {
      const errorData = (await dmResponse.json().catch(() => ({}))) as {
        errors?: Array<{ message: string }>
        detail?: string
      }
      const errorMsg =
        errorData.errors?.[0]?.message ||
        errorData.detail ||
        `X API error: ${dmResponse.status} ${dmResponse.statusText}`

      if (dmResponse.status === 429) {
        const retryAfter = dmResponse.headers.get('x-rate-limit-reset')
        return NextResponse.json(
          { error: `Rate limited. Retry after: ${retryAfter || 'unknown time'}` },
          { status: 429 }
        )
      }

      return NextResponse.json({ error: errorMsg }, { status: dmResponse.status })
    }

    const dmData = (await dmResponse.json()) as { data?: { dm_event_id: string } }
    const xMessageId = dmData.data?.dm_event_id

    // Look up coach by x_handle to get coach_id
    const cleanHandle = coachXHandle.startsWith('@') ? coachXHandle.slice(1) : coachXHandle
    const { data: coach } = await supabaseAdmin
      .from('coaches')
      .select('id')
      .or(`x_handle.eq.${cleanHandle},x_handle.eq.@${cleanHandle}`)
      .limit(1)
      .single()

    // Log to messages table
    const sentAt = new Date().toISOString()
    const { data: messageRecord, error: insertError } = await supabaseAdmin
      .from('messages')
      .insert({
        coach_id: coach?.id || null,
        athlete_id: athleteId,
        type: 'dm',
        channel: 'x',
        to_address: coachXHandle,
        subject: null,
        body: message,
        status: xMessageId ? 'sent' : 'failed',
        x_message_id: xMessageId || null,
        sent_at: sentAt,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Failed to log DM to messages table:', insertError)
    }

    return NextResponse.json({
      success: true,
      messageId: messageRecord?.id,
      xMessageId,
      coachXHandle,
    })
  } catch (err: any) {
    console.error('DM send error:', err)
    return NextResponse.json(
      { error: err.message || 'Failed to send DM' },
      { status: 500 }
    )
  }
}
