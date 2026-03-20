import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseClient'

// GET /api/recruit/dm/queue?athleteId=xxx
// List all DM outreach items for an athlete
export async function GET(request: NextRequest) {
  try {
    const athleteId = request.nextUrl.searchParams.get('athleteId')

    if (!athleteId) {
      return NextResponse.json({ error: 'athleteId is required' }, { status: 400 })
    }

    // Query messages table for DM-type messages for this athlete
    const { data: dms, error: dmError } = await supabaseAdmin
      .from('messages')
      .select('*, coaches:coach_id(id, first_name, last_name, school, division, x_handle)')
      .eq('athlete_id', athleteId)
      .eq('type', 'dm')
      .eq('channel', 'x')
      .order('created_at', { ascending: false })

    if (dmError) {
      return NextResponse.json({ error: dmError.message }, { status: 400 })
    }

    // Also check custom_outreach for any queued DM outreach
    const { data: queuedOutreach, error: queueError } = await supabaseAdmin
      .from('custom_outreach')
      .select('*, coaches:coach_id(id, first_name, last_name, school, division, x_handle)')
      .eq('athlete_id', athleteId)
      .eq('channel', 'dm')
      .order('created_at', { ascending: false })

    if (queueError) {
      // If channel column doesn't exist, just return DMs from messages table
      console.warn('custom_outreach channel query failed (column may not exist):', queueError.message)
    }

    return NextResponse.json({
      success: true,
      sentDMs: dms || [],
      queuedDMs: queuedOutreach || [],
      totalSent: dms?.length || 0,
      totalQueued: queuedOutreach?.length || 0,
    })
  } catch (err: any) {
    console.error('DM queue GET error:', err)
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/recruit/dm/queue
// Queue a new DM outreach
export async function POST(request: NextRequest) {
  try {
    const { athleteId, coachId, coachXHandle, message } = await request.json()

    if (!athleteId || !coachId || !coachXHandle || !message) {
      return NextResponse.json(
        { error: 'athleteId, coachId, coachXHandle, and message are required' },
        { status: 400 }
      )
    }

    // Verify athlete exists
    const { data: athlete, error: athleteError } = await supabaseAdmin
      .from('athletes')
      .select('id, first_name, last_name')
      .eq('id', athleteId)
      .single()

    if (athleteError || !athlete) {
      return NextResponse.json({ error: 'Athlete not found' }, { status: 404 })
    }

    // Verify coach exists and has the X handle
    const { data: coach, error: coachError } = await supabaseAdmin
      .from('coaches')
      .select('id, first_name, last_name, school, x_handle')
      .eq('id', coachId)
      .single()

    if (coachError || !coach) {
      return NextResponse.json({ error: 'Coach not found' }, { status: 404 })
    }

    // Check for duplicate queued DM to same coach
    const { data: existing } = await supabaseAdmin
      .from('messages')
      .select('id')
      .eq('athlete_id', athleteId)
      .eq('coach_id', coachId)
      .eq('type', 'dm')
      .eq('channel', 'x')
      .not('status', 'eq', 'failed')
      .limit(1)

    if (existing && existing.length > 0) {
      return NextResponse.json(
        { error: 'DM already sent or queued for this coach', messageId: existing[0].id },
        { status: 409 }
      )
    }

    // Insert queued DM into messages table
    const { data: messageRecord, error: insertError } = await supabaseAdmin
      .from('messages')
      .insert({
        coach_id: coachId,
        athlete_id: athleteId,
        type: 'dm',
        channel: 'x',
        to_address: coachXHandle,
        subject: null,
        body: message,
        status: 'queued',
      })
      .select()
      .single()

    if (insertError || !messageRecord) {
      return NextResponse.json(
        { error: insertError?.message || 'Failed to queue DM' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      messageId: messageRecord.id,
      coachName: `${coach.first_name} ${coach.last_name}`,
      school: coach.school,
      coachXHandle,
    }, { status: 201 })
  } catch (err: any) {
    console.error('DM queue POST error:', err)
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
