import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseClient'

// GET /api/recruit/engagement?athleteId=xxx
// Returns all coaches with engagement scores for an athlete
export async function GET(request: NextRequest) {
  try {
    const athleteId = request.nextUrl.searchParams.get('athleteId')
    if (!athleteId) {
      return NextResponse.json({ error: 'athleteId required' }, { status: 400 })
    }

    // Get all campaigns for this athlete
    const { data: campaigns, error: campError } = await supabaseAdmin
      .from('campaigns')
      .select('id')
      .eq('athlete_id', athleteId)

    if (campError) {
      return NextResponse.json({ error: campError.message }, { status: 500 })
    }

    const campaignIds = (campaigns || []).map((c: { id: string }) => c.id)

    if (campaignIds.length === 0) {
      return NextResponse.json({ coaches: [], summary: { totalEngaged: 0, hottestLead: null, averageScore: 0 } })
    }

    // Get all messages for these campaigns
    const { data: messages, error: msgError } = await supabaseAdmin
      .from('messages')
      .select('id, coach_id, status, sent_at, type')
      .in('campaign_id', campaignIds)
      .eq('type', 'email')

    if (msgError) {
      return NextResponse.json({ error: msgError.message }, { status: 500 })
    }

    const allMessages = messages || []
    const messageIds = allMessages.map((m: { id: string }) => m.id)

    // Get email events for all messages
    let allEvents: Array<{
      event_type: string
      message_id: string | null
      created_at: string
    }> = []

    if (messageIds.length > 0) {
      const { data: events } = await supabaseAdmin
        .from('email_events')
        .select('event_type, message_id, created_at')
        .in('message_id', messageIds)

      allEvents = events || []
    }

    // Get responses for these campaigns
    const { data: responses } = await supabaseAdmin
      .from('responses')
      .select('coach_id, sentiment, created_at')
      .in('campaign_id', campaignIds)

    const allResponses = responses || []

    // Build a map of coach_id -> message ids
    const coachMessageMap: Record<string, string[]> = {}
    const coachLastInteraction: Record<string, Date> = {}

    for (const m of allMessages) {
      if (!m.coach_id) continue
      if (!coachMessageMap[m.coach_id]) coachMessageMap[m.coach_id] = []
      coachMessageMap[m.coach_id].push(m.id)
      if (m.sent_at) {
        const d = new Date(m.sent_at)
        if (!coachLastInteraction[m.coach_id] || d > coachLastInteraction[m.coach_id]) {
          coachLastInteraction[m.coach_id] = d
        }
      }
    }

    // Build event map: message_id -> events
    const messageEventMap: Record<string, Array<{ event_type: string; created_at: string }>> = {}
    for (const ev of allEvents) {
      if (!ev.message_id) continue
      if (!messageEventMap[ev.message_id]) messageEventMap[ev.message_id] = []
      messageEventMap[ev.message_id].push(ev)
    }

    // Build response map: coach_id -> responses
    const coachResponseMap: Record<string, Array<{ sentiment: string; created_at: string }>> = {}
    for (const r of allResponses) {
      if (!r.coach_id) continue
      if (!coachResponseMap[r.coach_id]) coachResponseMap[r.coach_id] = []
      coachResponseMap[r.coach_id].push(r)
      const d = new Date(r.created_at)
      if (!coachLastInteraction[r.coach_id] || d > coachLastInteraction[r.coach_id]) {
        coachLastInteraction[r.coach_id] = d
      }
    }

    // Get unique coach IDs
    const allCoachIds = [...new Set([
      ...Object.keys(coachMessageMap),
      ...Object.keys(coachResponseMap),
    ])]

    if (allCoachIds.length === 0) {
      return NextResponse.json({ coaches: [], summary: { totalEngaged: 0, hottestLead: null, averageScore: 0 } })
    }

    // Fetch coach details
    const { data: coachData } = await supabaseAdmin
      .from('coaches')
      .select('id, first_name, last_name, school, division, email')
      .in('id', allCoachIds)

    const coachMap: Record<string, { first_name: string; last_name: string; school: string; division: string; email: string }> = {}
    for (const c of coachData || []) {
      coachMap[c.id] = c
    }

    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    // Calculate engagement score per coach
    const coachScores = allCoachIds.map((coachId) => {
      const msgIds = coachMessageMap[coachId] || []
      const coachResponses = coachResponseMap[coachId] || []
      const coach = coachMap[coachId]

      let rawScore = 0
      let opens = 0
      let clicks = 0
      let delivered = 0
      let replied = coachResponses.length > 0

      // Process events per message
      for (const msgId of msgIds) {
        const events = messageEventMap[msgId] || []

        let msgDelivered = false
        let msgOpenCount = 0
        let msgClicked = false

        for (const ev of events) {
          const isRecent = new Date(ev.created_at) >= sevenDaysAgo

          if (ev.event_type === 'delivered' && !msgDelivered) {
            msgDelivered = true
            delivered++
            rawScore += isRecent ? 5 * 1.5 : 5
          }
          if (ev.event_type === 'opened') {
            msgOpenCount++
            if (msgOpenCount === 1) {
              opens++
              rawScore += isRecent ? 15 * 1.5 : 15
            } else {
              // Multiple opens: +5 per additional, cap at +20 total bonus
              const additionalBonus = Math.min((msgOpenCount - 1) * 5, 20)
              const prevBonus = Math.min((msgOpenCount - 2) * 5, 20)
              const delta = additionalBonus - prevBonus
              if (delta > 0) {
                rawScore += isRecent ? delta * 1.5 : delta
              }
            }
          }
          if (ev.event_type === 'clicked' && !msgClicked) {
            msgClicked = true
            clicks++
            rawScore += isRecent ? 25 * 1.5 : 25
          }
        }

        // If message status is delivered but no delivered event, count it
        const msg = allMessages.find((m: { id: string }) => m.id === msgId)
        if (msg && ['delivered', 'opened', 'replied'].includes(msg.status) && !msgDelivered) {
          delivered++
          const sentDate = msg.sent_at ? new Date(msg.sent_at) : now
          const isRecent = sentDate >= sevenDaysAgo
          rawScore += isRecent ? 5 * 1.5 : 5
        }
      }

      // Process responses
      for (const resp of coachResponses) {
        const isRecent = new Date(resp.created_at) >= sevenDaysAgo
        rawScore += isRecent ? 50 * 1.5 : 50
        if (resp.sentiment === 'positive' || resp.sentiment === 'interested') {
          rawScore += isRecent ? 30 * 1.5 : 30
        }
      }

      const score = Math.round(rawScore)
      const lastInteraction = coachLastInteraction[coachId] || null
      const tier: 'Hot' | 'Warm' | 'Cold' = score >= 60 ? 'Hot' : score >= 20 ? 'Warm' : 'Cold'

      // Build breakdown string
      const parts: string[] = []
      if (opens > 0) parts.push(`${opens} open${opens > 1 ? 's' : ''}`)
      if (clicks > 0) parts.push(`${clicks} click${clicks > 1 ? 's' : ''}`)
      if (replied) parts.push('replied')
      if (delivered > 0 && opens === 0 && clicks === 0 && !replied) parts.push(`${delivered} delivered`)
      const breakdown = parts.join(', ') || 'sent'

      return {
        coachId,
        coachName: coach ? `${coach.first_name} ${coach.last_name}` : 'Unknown',
        school: coach?.school || '',
        division: coach?.division || '',
        email: coach?.email || '',
        score,
        tier,
        breakdown,
        opens,
        clicks,
        replied,
        delivered,
        lastInteraction: lastInteraction ? lastInteraction.toISOString() : null,
      }
    })

    // Sort by score descending
    coachScores.sort((a, b) => b.score - a.score)

    // Summary stats
    const totalEngaged = coachScores.filter(c => c.score > 0).length
    const hottestLead = coachScores.length > 0 ? coachScores[0] : null
    const averageScore = coachScores.length > 0
      ? Math.round(coachScores.reduce((sum, c) => sum + c.score, 0) / coachScores.length)
      : 0

    return NextResponse.json({
      coaches: coachScores,
      summary: {
        totalEngaged,
        hottestLead: hottestLead ? { name: hottestLead.coachName, school: hottestLead.school, score: hottestLead.score } : null,
        averageScore,
      },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('Engagement fetch error:', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
