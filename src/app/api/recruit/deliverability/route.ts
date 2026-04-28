import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseClient'

// GET /api/recruit/deliverability?athleteId=xxx
// Returns email deliverability stats for an athlete's campaigns
export async function GET(request: NextRequest) {
  try {
    const athleteId = request.nextUrl.searchParams.get('athleteId')
    if (!athleteId) {
      return NextResponse.json({ error: 'athleteId required' }, { status: 400 })
    }

    // Get all email messages for this athlete directly (avoids large campaign_id IN query)
    const { data: messages, error: msgError } = await supabaseAdmin
      .from('messages')
      .select('id, coach_id, to_address, status, sent_at, type')
      .eq('athlete_id', athleteId)
      .eq('type', 'email')
      .order('sent_at', { ascending: false })

    if (msgError) {
      return NextResponse.json({ error: msgError.message }, { status: 500 })
    }

    const allMessages = messages || []

    if (allMessages.length === 0) {
      return NextResponse.json({
        stats: {
          totalSent: 0, delivered: 0, opened: 0, clicked: 0,
          bounced: 0, failed: 0, complained: 0,
          deliveryRate: 0, openRate: 0, clickRate: 0,
        },
        recentIssues: [],
      })
    }

    // Compute stats from message statuses
    const totalSent = allMessages.filter(
      (m: { status: string }) => m.status !== 'queued'
    ).length
    const delivered = allMessages.filter(
      (m: { status: string }) => ['delivered', 'opened', 'replied'].includes(m.status)
    ).length
    const opened = allMessages.filter(
      (m: { status: string }) => ['opened', 'replied'].includes(m.status)
    ).length
    const failedMessages = allMessages.filter(
      (m: { status: string }) => m.status === 'failed'
    )

    // Get event-level detail for clicks, bounces, complaints from email_events
    let clicked = 0
    let bounced = 0
    let complained = 0
    let recentIssues: Array<{
      type: string
      recipient: string | null
      error: string | null
      date: string
      coachName: string | null
    }> = []

    // Fetch email events in chunks of 100 to avoid PostgREST URL length limits
    const allMessageIds = allMessages.map((m: { id: string }) => m.id)
    const CHUNK = 100
    const allEvents: Array<{
      event_type: string
      recipient: string | null
      error_message: string | null
      bounce_type: string | null
      created_at: string
      message_id: string | null
    }> = []

    for (let i = 0; i < allMessageIds.length; i += CHUNK) {
      const chunk = allMessageIds.slice(i, i + CHUNK)
      const { data: chunkEvents } = await supabaseAdmin
        .from('email_events')
        .select('event_type, recipient, error_message, bounce_type, created_at, message_id')
        .in('message_id', chunk)
      if (chunkEvents) allEvents.push(...chunkEvents)
    }

    if (allEvents.length > 0) {
      // Count unique messages per event type
      const clickedMessageIds = new Set<string>()
      const bouncedMessageIds = new Set<string>()
      const complainedMessageIds = new Set<string>()

      for (const ev of allEvents) {
        if (ev.event_type === 'clicked' && ev.message_id) clickedMessageIds.add(ev.message_id)
        if (ev.event_type === 'bounced' && ev.message_id) bouncedMessageIds.add(ev.message_id)
        if (ev.event_type === 'complained' && ev.message_id) complainedMessageIds.add(ev.message_id)
      }

      clicked = clickedMessageIds.size
      bounced = bouncedMessageIds.size
      complained = complainedMessageIds.size

      // Recent bounces, failures, complaints
      const issueEvents = allEvents.filter(
        (ev: { event_type: string }) =>
          ['bounced', 'failed', 'complained'].includes(ev.event_type)
      )
      issueEvents.sort(
        (a: { created_at: string }, b: { created_at: string }) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      recentIssues = issueEvents.slice(0, 20).map(
        (ev: {
          event_type: string
          recipient: string | null
          error_message: string | null
          bounce_type: string | null
          created_at: string
        }) => ({
          type: ev.event_type,
          recipient: ev.recipient,
          error: ev.error_message || ev.bounce_type || null,
          date: ev.created_at,
          coachName: null,
        })
      )
    }

    // If no email_events data yet, derive bounced count from message status
    if (bounced === 0) {
      bounced = failedMessages.length
    }

    // Also add failed messages to recent issues if no email_events
    if (recentIssues.length === 0 && failedMessages.length > 0) {
      // Get coach details for failed messages
      const failedCoachIds = [
        ...new Set(failedMessages.map((m: { coach_id: string }) => m.coach_id).filter(Boolean)),
      ]
      let coachMap: Record<string, string> = {}
      if (failedCoachIds.length > 0) {
        const { data: coaches } = await supabaseAdmin
          .from('coaches')
          .select('id, first_name, last_name')
          .in('id', failedCoachIds)
        if (coaches) {
          for (const c of coaches) {
            coachMap[c.id] = `${c.first_name} ${c.last_name}`
          }
        }
      }

      recentIssues = failedMessages.slice(0, 20).map(
        (m: { to_address: string; sent_at: string; coach_id: string }) => ({
          type: 'failed',
          recipient: m.to_address,
          error: null,
          date: m.sent_at,
          coachName: coachMap[m.coach_id] || null,
        })
      )
    }

    const deliveryRate = totalSent > 0 ? Math.round((delivered / totalSent) * 100) : 0
    const openRate = totalSent > 0 ? Math.round((opened / totalSent) * 100) : 0
    const clickRate = totalSent > 0 ? Math.round((clicked / totalSent) * 100) : 0

    return NextResponse.json({
      stats: {
        totalSent,
        delivered,
        opened,
        clicked,
        bounced,
        failed: failedMessages.length,
        complained,
        deliveryRate,
        openRate,
        clickRate,
      },
      recentIssues,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('Deliverability fetch error:', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
