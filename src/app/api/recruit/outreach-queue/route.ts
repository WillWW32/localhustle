import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseClient'

// GET /api/recruit/outreach-queue?athleteId=...
// List all custom outreach for an athlete, joined with coach name/school
export async function GET(request: NextRequest) {
  try {
    const athleteId = request.nextUrl.searchParams.get('athleteId')

    if (!athleteId) {
      return NextResponse.json({ error: 'athleteId is required' }, { status: 400 })
    }

    const { data: outreach, error } = await supabaseAdmin
      .from('custom_outreach')
      .select('*')
      .eq('athlete_id', athleteId)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Fetch coach details for all unique coach IDs
    const coachIds = [...new Set((outreach || []).map((o: any) => o.coach_id))]

    const { data: coaches } = await supabaseAdmin
      .from('coaches')
      .select('id, first_name, last_name, email, school, division, state, title')
      .in('id', coachIds.length > 0 ? coachIds : ['00000000-0000-0000-0000-000000000000'])

    const coachMap = new Map((coaches || []).map((c: any) => [c.id, c]))

    const results = (outreach || []).map((o: any) => {
      const coach = coachMap.get(o.coach_id)
      return {
        ...o,
        coach_name: coach ? `${coach.first_name} ${coach.last_name}` : 'Unknown',
        coach_email: coach?.email || '',
        school: coach?.school || '',
        division: coach?.division || '',
      }
    })

    return NextResponse.json({ success: true, outreach: results })
  } catch (err: any) {
    console.error('Outreach queue GET error:', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}

// POST /api/recruit/outreach-queue
// Add new custom outreach to the queue
export async function POST(request: NextRequest) {
  try {
    const { athleteId, coachId, subject, body, campaignId } = await request.json()

    if (!athleteId || !coachId || !subject || !body) {
      return NextResponse.json(
        { error: 'athleteId, coachId, subject, and body are required' },
        { status: 400 }
      )
    }

    const { data: outreach, error } = await supabaseAdmin
      .from('custom_outreach')
      .insert({
        athlete_id: athleteId,
        coach_id: coachId,
        campaign_id: campaignId || null,
        subject,
        body,
        status: 'queued',
        followup_step: 0,
        next_send_at: null,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, outreach })
  } catch (err: any) {
    console.error('Outreach queue POST error:', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/recruit/outreach-queue
// Update a queued outreach (only if status is 'queued')
export async function PUT(request: NextRequest) {
  try {
    const { id, subject, body } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    // Verify the outreach exists and is still queued
    const { data: existing } = await supabaseAdmin
      .from('custom_outreach')
      .select('id, status')
      .eq('id', id)
      .single()

    if (!existing) {
      return NextResponse.json({ error: 'Outreach not found' }, { status: 404 })
    }

    if (existing.status !== 'queued') {
      return NextResponse.json(
        { error: `Cannot edit outreach with status '${existing.status}'. Only 'queued' outreach can be edited.` },
        { status: 400 }
      )
    }

    const updates: any = { updated_at: new Date().toISOString() }
    if (subject !== undefined) updates.subject = subject
    if (body !== undefined) updates.body = body

    const { data: outreach, error } = await supabaseAdmin
      .from('custom_outreach')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, outreach })
  } catch (err: any) {
    console.error('Outreach queue PUT error:', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/recruit/outreach-queue
// Remove from queue by setting status to 'stopped'
export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    const { data: outreach, error } = await supabaseAdmin
      .from('custom_outreach')
      .update({ status: 'stopped', updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!outreach) {
      return NextResponse.json({ error: 'Outreach not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, outreach })
  } catch (err: any) {
    console.error('Outreach queue DELETE error:', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}
