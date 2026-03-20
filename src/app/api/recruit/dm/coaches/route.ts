import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseClient'

// GET /api/recruit/dm/coaches?athleteId=xxx
// List coaches that have an X handle, with DM status per coach
export async function GET(request: NextRequest) {
  try {
    const athleteId = request.nextUrl.searchParams.get('athleteId')

    if (!athleteId) {
      return NextResponse.json({ error: 'athleteId is required' }, { status: 400 })
    }

    // Fetch all coaches that have an x_handle set
    const { data: coaches, error: coachError } = await supabaseAdmin
      .from('coaches')
      .select('id, first_name, last_name, school, division, state, x_handle, x_handle_program')
      .not('x_handle', 'is', null)
      .neq('x_handle', '')
      .order('state', { ascending: true })
      .order('last_name', { ascending: true })

    if (coachError) {
      return NextResponse.json({ error: coachError.message }, { status: 400 })
    }

    if (!coaches || coaches.length === 0) {
      return NextResponse.json({ success: true, coaches: [], count: 0 })
    }

    // Get all DM messages for this athlete to determine status per coach
    const coachIds = coaches.map((c: any) => c.id)
    const { data: dmMessages, error: dmError } = await supabaseAdmin
      .from('messages')
      .select('coach_id, status, sent_at')
      .eq('athlete_id', athleteId)
      .eq('type', 'dm')
      .eq('channel', 'x')
      .in('coach_id', coachIds)

    if (dmError) {
      console.error('Error fetching DM messages:', dmError)
    }

    // Build a map of coach_id -> DM status
    const dmStatusMap: Record<string, { status: string; sentAt: string | null }> = {}
    for (const msg of dmMessages || []) {
      const existing = dmStatusMap[msg.coach_id]
      // Prioritize 'sent' over 'queued' over 'failed'
      if (!existing || msg.status === 'sent' || (msg.status === 'queued' && existing.status === 'failed')) {
        dmStatusMap[msg.coach_id] = {
          status: msg.status,
          sentAt: msg.sent_at,
        }
      }
    }

    // Merge DM status into coaches
    const coachesWithStatus = coaches.map((coach: any) => ({
      id: coach.id,
      name: `${coach.first_name} ${coach.last_name}`,
      firstName: coach.first_name,
      lastName: coach.last_name,
      school: coach.school,
      division: coach.division,
      state: coach.state,
      x_handle: coach.x_handle,
      x_handle_program: coach.x_handle_program,
      dmStatus: dmStatusMap[coach.id]?.status || 'not_sent',
      dmSentAt: dmStatusMap[coach.id]?.sentAt || null,
    }))

    return NextResponse.json({
      success: true,
      count: coachesWithStatus.length,
      coaches: coachesWithStatus,
    })
  } catch (err: any) {
    console.error('DM coaches GET error:', err)
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
