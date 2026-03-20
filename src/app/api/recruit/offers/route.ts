import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseClient'

export async function GET(request: NextRequest) {
  try {
    const athleteId = request.nextUrl.searchParams.get('athleteId')
    if (!athleteId) {
      return NextResponse.json({ error: 'athleteId is required' }, { status: 400 })
    }

    const { data: offers, error } = await supabaseAdmin
      .from('recruit_offers')
      .select('*')
      .eq('athlete_id', athleteId)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Fetch coach names for offers that have coach_id
    const coachIds = [...new Set((offers || []).filter((o: any) => o.coach_id).map((o: any) => o.coach_id))]
    let coachMap = new Map()
    if (coachIds.length > 0) {
      const { data: coaches } = await supabaseAdmin
        .from('coaches')
        .select('id, first_name, last_name, email')
        .in('id', coachIds)
      for (const c of coaches || []) {
        coachMap.set(c.id, c)
      }
    }

    const enriched = (offers || []).map((o: any) => {
      const coach = coachMap.get(o.coach_id)
      return {
        ...o,
        coach_name: coach ? `${coach.first_name} ${coach.last_name}` : null,
        coach_email: coach?.email || null,
      }
    })

    return NextResponse.json({ success: true, offers: enriched })
  } catch (err: any) {
    console.error('Offers GET error:', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { athlete_id, school } = body

    if (!athlete_id || !school) {
      return NextResponse.json({ error: 'athlete_id and school are required' }, { status: 400 })
    }

    const { data: offer, error } = await supabaseAdmin
      .from('recruit_offers')
      .insert({
        athlete_id: body.athlete_id,
        coach_id: body.coach_id || null,
        school: body.school,
        division: body.division || null,
        offer_type: body.offer_type || 'interest',
        scholarship_amount: body.scholarship_amount || null,
        notes: body.notes || null,
        interest_level: body.interest_level ?? 3,
        coach_interest_level: body.coach_interest_level ?? 3,
        status: body.status || 'active',
        received_at: body.received_at || new Date().toISOString(),
        decision_deadline: body.decision_deadline || null,
      })
      .select()
      .single()

    if (error || !offer) {
      return NextResponse.json({ error: error?.message || 'Failed to create offer' }, { status: 500 })
    }

    return NextResponse.json({ success: true, offer }, { status: 201 })
  } catch (err: any) {
    console.error('Offers POST error:', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id } = body

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    const updates: Record<string, any> = { updated_at: new Date().toISOString() }
    if (body.offer_type !== undefined) updates.offer_type = body.offer_type
    if (body.interest_level !== undefined) updates.interest_level = body.interest_level
    if (body.coach_interest_level !== undefined) updates.coach_interest_level = body.coach_interest_level
    if (body.status !== undefined) updates.status = body.status
    if (body.notes !== undefined) updates.notes = body.notes
    if (body.scholarship_amount !== undefined) updates.scholarship_amount = body.scholarship_amount
    if (body.decision_deadline !== undefined) updates.decision_deadline = body.decision_deadline
    if (body.school !== undefined) updates.school = body.school
    if (body.division !== undefined) updates.division = body.division
    if (body.coach_id !== undefined) updates.coach_id = body.coach_id

    const { data: offer, error } = await supabaseAdmin
      .from('recruit_offers')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error || !offer) {
      return NextResponse.json({ error: error?.message || 'Failed to update offer' }, { status: 500 })
    }

    return NextResponse.json({ success: true, offer })
  } catch (err: any) {
    console.error('Offers PUT error:', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const offerId = request.nextUrl.searchParams.get('id')
    if (!offerId) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('recruit_offers')
      .delete()
      .eq('id', offerId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Offers DELETE error:', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}
