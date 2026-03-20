import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseClient'

// GET /api/recruit/results?campaignId=xxx
// Returns email open/delivery stats and per-coach status
export async function GET(request: NextRequest) {
  try {
    const campaignId = request.nextUrl.searchParams.get('campaignId')
    if (!campaignId) {
      return NextResponse.json({ error: 'campaignId required' }, { status: 400 })
    }

    // Get all messages for this campaign
    const { data: messages, error } = await supabaseAdmin
      .from('messages')
      .select('id, coach_id, to_address, subject, status, sent_at, type')
      .eq('campaign_id', campaignId)
      .eq('type', 'email')
      .order('sent_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get coach details for sent messages
    const coachIds = [...new Set((messages || []).map(m => m.coach_id).filter(Boolean))]
    let coaches: Record<string, any> = {}

    if (coachIds.length > 0) {
      const { data: coachData } = await supabaseAdmin
        .from('coaches')
        .select('id, first_name, last_name, school, division, email')
        .in('id', coachIds)

      if (coachData) {
        for (const c of coachData) {
          coaches[c.id] = c
        }
      }
    }

    // Build results with coach info
    const results = (messages || []).map(m => ({
      id: m.id,
      coachId: m.coach_id,
      coachName: coaches[m.coach_id]
        ? `${coaches[m.coach_id].first_name} ${coaches[m.coach_id].last_name}`
        : 'Unknown',
      school: coaches[m.coach_id]?.school || '',
      division: coaches[m.coach_id]?.division || '',
      email: m.to_address,
      status: m.status,
      sentAt: m.sent_at,
      deliveredAt: (m as any).delivered_at || null,
      openedAt: (m as any).opened_at || null,
    }))

    // Summary stats
    const total = results.length
    const sent = results.filter(r => r.status !== 'queued' && r.status !== 'failed').length
    const delivered = results.filter(r => ['delivered', 'opened', 'replied'].includes(r.status)).length
    const opened = results.filter(r => ['opened', 'replied'].includes(r.status)).length
    const replied = results.filter(r => r.status === 'replied').length
    const failed = results.filter(r => r.status === 'failed').length

    return NextResponse.json({
      summary: {
        total,
        sent,
        delivered,
        opened,
        replied,
        failed,
        openRate: sent > 0 ? Math.round((opened / sent) * 100) : 0,
        deliveryRate: sent > 0 ? Math.round((delivered / sent) * 100) : 0,
      },
      results,
    })
  } catch (err: any) {
    console.error('Results fetch error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
