import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseClient'
import { resend } from '@/lib/resend'
import { refreshAccessToken } from '@/lib/recruit/x-oauth'

// POST /api/recruit/inbox/reply
// Send a reply from the athlete's inbox (email or DM) and store in inbox_messages
export async function POST(request: NextRequest) {
  try {
    const { athleteId, coachId, message, channel } = await request.json()

    if (!athleteId || !coachId || !message || !channel) {
      return NextResponse.json(
        { error: 'athleteId, coachId, message, and channel are required' },
        { status: 400 }
      )
    }

    if (channel !== 'email' && channel !== 'dm') {
      return NextResponse.json({ error: 'channel must be "email" or "dm"' }, { status: 400 })
    }

    // Fetch athlete info
    const { data: athlete, error: athleteError } = await supabaseAdmin
      .from('athletes')
      .select('id, first_name, last_name, email')
      .eq('id', athleteId)
      .single()

    if (athleteError || !athlete) {
      return NextResponse.json({ error: 'Athlete not found' }, { status: 404 })
    }

    // Fetch coach info
    const { data: coach, error: coachError } = await supabaseAdmin
      .from('coaches')
      .select('id, first_name, last_name, school, email, x_handle')
      .eq('id', coachId)
      .single()

    if (coachError || !coach) {
      return NextResponse.json({ error: 'Coach not found' }, { status: 404 })
    }

    let resendEmailId: string | null = null
    let xMessageId: string | null = null

    if (channel === 'email') {
      // Send email via Resend
      const fromAddress = `${athlete.first_name.toLowerCase()}.${athlete.last_name.toLowerCase()}@localhustle.org`
      const fromName = `${athlete.first_name} ${athlete.last_name}`

      if (!coach.email) {
        return NextResponse.json({ error: 'Coach has no email address' }, { status: 400 })
      }

      const { data: emailData, error: emailError } = await resend.emails.send({
        from: `${fromName} <${fromAddress}>`,
        to: coach.email,
        subject: `Re: ${athlete.first_name} ${athlete.last_name} — ${coach.school || 'Recruiting'}`,
        text: message,
      })

      if (emailError) {
        console.error('Resend send error:', emailError)
        return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
      }

      resendEmailId = emailData?.id || null

      // Store in inbox_messages
      const { error: insertError } = await supabaseAdmin
        .from('inbox_messages')
        .insert({
          athlete_id: athleteId,
          coach_id: coachId,
          direction: 'outbound',
          channel: 'email',
          from_address: fromAddress,
          to_address: coach.email,
          subject: `Re: ${athlete.first_name} ${athlete.last_name} — ${coach.school || 'Recruiting'}`,
          body: message,
          is_read: true,
          resend_email_id: resendEmailId,
        })

      if (insertError) {
        console.error('Failed to store outbound email in inbox:', insertError)
      }

      return NextResponse.json({
        success: true,
        channel: 'email',
        resendEmailId,
      })
    }

    // DM channel
    if (!coach.x_handle) {
      return NextResponse.json({ error: 'Coach has no X handle for DM' }, { status: 400 })
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
          { error: 'X token expired. Please reconnect X account.' },
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
      } catch {
        return NextResponse.json(
          { error: 'Failed to refresh X token. Please reconnect X account.' },
          { status: 401 }
        )
      }
    }

    // Resolve coach's X user ID
    const cleanHandle = coach.x_handle.startsWith('@') ? coach.x_handle.slice(1) : coach.x_handle
    const lookupRes = await fetch(`https://api.twitter.com/2/users/by/username/${cleanHandle}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'User-Agent': 'LocalHustle/1.0',
      },
    })

    if (!lookupRes.ok) {
      return NextResponse.json(
        { error: `Could not resolve X handle @${cleanHandle}` },
        { status: 400 }
      )
    }

    const lookupData = (await lookupRes.json()) as { data?: { id: string } }
    const recipientId = lookupData.data?.id
    if (!recipientId) {
      return NextResponse.json(
        { error: `Could not resolve X handle @${cleanHandle}` },
        { status: 400 }
      )
    }

    // Send DM
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
        `X API error: ${dmResponse.status}`
      return NextResponse.json({ error: errorMsg }, { status: dmResponse.status })
    }

    const dmData = (await dmResponse.json()) as { data?: { dm_event_id: string } }
    xMessageId = dmData.data?.dm_event_id || null

    // Store in inbox_messages
    const { error: insertError } = await supabaseAdmin
      .from('inbox_messages')
      .insert({
        athlete_id: athleteId,
        coach_id: coachId,
        direction: 'outbound',
        channel: 'dm',
        from_address: `@${athlete.first_name.toLowerCase()}${athlete.last_name.toLowerCase()}`,
        to_address: coach.x_handle,
        body: message,
        is_read: true,
        x_message_id: xMessageId,
      })

    if (insertError) {
      console.error('Failed to store outbound DM in inbox:', insertError)
    }

    return NextResponse.json({
      success: true,
      channel: 'dm',
      xMessageId,
    })
  } catch (err: unknown) {
    console.error('Inbox reply error:', err)
    const message = err instanceof Error ? err.message : 'Failed to send reply'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
