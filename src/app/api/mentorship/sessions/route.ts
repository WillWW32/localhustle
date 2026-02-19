import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseClient'

export async function GET(request: NextRequest) {
  const mentorId = request.nextUrl.searchParams.get('mentorId')
  const athleteId = request.nextUrl.searchParams.get('athleteId')

  let query = supabaseAdmin
    .from('mentorship_sessions')
    .select('*, mentors(name, sport, college)')
    .order('scheduled_at', { ascending: true })

  if (mentorId) query = query.eq('mentor_id', mentorId)
  if (athleteId) query = query.eq('athlete_id', athleteId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || [])
}

export async function POST(request: NextRequest) {
  try {
    const { mentorId, athleteId, sponsorId, scheduledAt, notes } = await request.json()

    if (!mentorId || !athleteId) {
      return NextResponse.json({ error: 'mentorId and athleteId are required' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('mentorship_sessions')
      .insert({
        mentor_id: mentorId,
        athlete_id: athleteId,
        sponsor_id: sponsorId || null,
        scheduled_at: scheduledAt || null,
        status: 'requested',
        notes: notes || '',
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // If sponsored, increment sessions_used
    if (sponsorId) {
      await supabaseAdmin.rpc('increment_sessions_used', { sponsor_uuid: sponsorId })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Session create error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create session' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { sessionId, status } = await request.json()
    if (!sessionId || !status) {
      return NextResponse.json({ error: 'sessionId and status required' }, { status: 400 })
    }

    const validStatuses = ['requested', 'confirmed', 'completed', 'cancelled']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('mentorship_sessions')
      .update({ status })
      .eq('id', sessionId)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update session' },
      { status: 500 }
    )
  }
}
