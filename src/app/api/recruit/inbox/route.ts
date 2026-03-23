import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseClient'
import { resend } from '@/lib/resend'

// GET /api/recruit/inbox?athleteId=...
// Returns inbox_messages for an athlete, grouped by coach (thread view)
export async function GET(request: NextRequest) {
  try {
    const athleteId = request.nextUrl.searchParams.get('athleteId')
    if (!athleteId) {
      return NextResponse.json({ error: 'athleteId is required' }, { status: 400 })
    }

    // Fetch all inbox messages for this athlete, joining coach info
    const { data: messages, error } = await supabaseAdmin
      .from('inbox_messages')
      .select(`
        id,
        athlete_id,
        coach_id,
        direction,
        channel,
        from_address,
        to_address,
        subject,
        body,
        html_body,
        is_read,
        resend_email_id,
        x_message_id,
        created_at,
        updated_at
      `)
      .eq('athlete_id', athleteId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Inbox fetch error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Collect unique coach IDs from messages
    const coachIds = [...new Set((messages || []).map((m: { coach_id: string | null }) => m.coach_id).filter(Boolean))]

    // Fetch coach details
    let coachMap: Record<string, { first_name: string; last_name: string; school: string; email: string }> = {}
    if (coachIds.length > 0) {
      const { data: coaches } = await supabaseAdmin
        .from('coaches')
        .select('id, first_name, last_name, school, email')
        .in('id', coachIds)

      if (coaches) {
        for (const c of coaches) {
          coachMap[c.id] = { first_name: c.first_name, last_name: c.last_name, school: c.school, email: c.email }
        }
      }
    }

    // Group messages by coach_id into threads
    const threadMap: Record<string, {
      coachId: string
      coachName: string
      school: string
      coachEmail: string
      messages: typeof messages
      lastMessage: (typeof messages)[number] | null
      unreadCount: number
      lastActivity: string
    }> = {}

    for (const msg of (messages || [])) {
      const key = msg.coach_id || `unknown-${msg.from_address}`
      if (!threadMap[key]) {
        const coach = msg.coach_id ? coachMap[msg.coach_id] : null
        threadMap[key] = {
          coachId: msg.coach_id || '',
          coachName: coach ? `${coach.first_name} ${coach.last_name}` : (msg.from_address || 'Unknown'),
          school: coach?.school || '',
          coachEmail: coach?.email || msg.from_address || '',
          messages: [],
          lastMessage: null,
          unreadCount: 0,
          lastActivity: msg.created_at,
        }
      }
      threadMap[key].messages.push(msg)
      if (!msg.is_read && msg.direction === 'inbound') {
        threadMap[key].unreadCount++
      }
    }

    // Build threads array, sorted by most recent activity
    const threads = Object.values(threadMap).map((thread) => {
      // Messages are already sorted desc from the query; reverse for chronological display
      const sorted = [...thread.messages].reverse()
      const lastMsg = thread.messages[0] // first in desc order = most recent
      return {
        coachId: thread.coachId,
        coachName: thread.coachName,
        school: thread.school,
        coachEmail: thread.coachEmail,
        lastMessagePreview: lastMsg?.body?.substring(0, 100) || '',
        lastMessageSubject: lastMsg?.subject || '',
        lastMessageDirection: lastMsg?.direction || '',
        lastMessageChannel: lastMsg?.channel || '',
        unreadCount: thread.unreadCount,
        lastActivity: lastMsg?.created_at || thread.lastActivity,
        messages: sorted,
      }
    })

    // Sort: unread threads first, then by last activity
    threads.sort((a, b) => {
      if (a.unreadCount > 0 && b.unreadCount === 0) return -1
      if (a.unreadCount === 0 && b.unreadCount > 0) return 1
      return new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
    })

    const totalUnread = threads.reduce((sum, t) => sum + t.unreadCount, 0)

    return NextResponse.json({ threads, totalUnread })
  } catch (err: unknown) {
    console.error('Inbox GET error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// POST /api/recruit/inbox (existing webhook handler for inbound emails)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (body.type !== 'email.inbound') {
      return NextResponse.json({ received: true, message: 'Webhook acknowledged but not an inbound email' })
    }

    const { from_email, to_email, subject, body: emailBody, in_reply_to } = body.data || {}

    if (!from_email || !to_email || !emailBody) {
      return NextResponse.json({ error: 'Missing required email fields' }, { status: 400 })
    }

    let campaignId: string | null = null
    let athleteId: string | null = null

    if (in_reply_to) {
      const { data: originalMessage } = await supabaseAdmin
        .from('messages')
        .select('campaign_id, athlete_id, coach_id')
        .eq('resend_id', in_reply_to)
        .single()

      if (originalMessage) {
        campaignId = originalMessage.campaign_id
        athleteId = originalMessage.athlete_id
      }
    }

    if (!campaignId || !athleteId) {
      const { data: recentMessage } = await supabaseAdmin
        .from('messages')
        .select('campaign_id, athlete_id, coach_id')
        .eq('to_address', from_email)
        .eq('type', 'email')
        .eq('status', 'sent')
        .order('sent_at', { ascending: false })
        .limit(1)
        .single()

      if (recentMessage) {
        campaignId = recentMessage.campaign_id
        athleteId = recentMessage.athlete_id
      }
    }

    if (!campaignId || !athleteId) {
      return NextResponse.json({ error: 'Could not match inbound email to a campaign' }, { status: 400 })
    }

    const { data: athlete } = await supabaseAdmin
      .from('athletes')
      .select('parent_email, first_name, last_name, email')
      .eq('id', athleteId)
      .single()

    if (!athlete) {
      return NextResponse.json({ error: 'Athlete not found' }, { status: 404 })
    }

    const { data: coach } = await supabaseAdmin
      .from('coaches')
      .select('id, first_name, last_name, school')
      .eq('email', from_email)
      .single()

    if (!coach) {
      return NextResponse.json({ error: 'Coach not found' }, { status: 404 })
    }

    const coachName = `${coach.first_name} ${coach.last_name}`

    const { data: response, error: insertError } = await supabaseAdmin
      .from('responses')
      .insert({
        campaign_id: campaignId,
        coach_id: coach.id,
        athlete_id: athleteId,
        from_email,
        from_name: coachName,
        subject,
        body: emailBody,
      })
      .select()
      .single()

    if (insertError || !response) {
      return NextResponse.json({ error: insertError?.message || 'Failed to record response' }, { status: 500 })
    }

    if (athlete.parent_email) {
      try {
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'noreply@localhustle.org',
          to: athlete.parent_email,
          subject: `[${coach.school || 'Coach'}] ${subject}`,
          text: `Inbound Coach Response for ${athlete.first_name} ${athlete.last_name}:\n\nFrom: ${coachName} <${from_email}>\nSchool: ${coach.school || 'N/A'}\n\n---\n\n${emailBody}\n\n---\nForwarded by Recruitment Agent`,
        })

        await supabaseAdmin
          .from('responses')
          .update({ forwarded_at: new Date().toISOString(), forwarded_to: athlete.parent_email })
          .eq('id', response.id)
      } catch (forwardError: unknown) {
        console.error('Failed to forward response to parent:', forwardError)
      }
    }

    return NextResponse.json({ success: true, responseId: response.id, message: 'Response recorded and forwarded to parent' })
  } catch (err: unknown) {
    console.error('Inbox webhook error:', err)
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// PATCH /api/recruit/inbox — mark messages as read
export async function PATCH(request: NextRequest) {
  try {
    const { messageIds, athleteId } = await request.json()
    if (!athleteId || !messageIds?.length) {
      return NextResponse.json({ error: 'athleteId and messageIds required' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('inbox_messages')
      .update({ is_read: true, updated_at: new Date().toISOString() })
      .in('id', messageIds)
      .eq('athlete_id', athleteId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    console.error('Inbox PATCH error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
