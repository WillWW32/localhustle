import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseClient'

export async function GET(request: NextRequest) {
  try {
    const athleteId = request.nextUrl.searchParams.get('athleteId')

    if (!athleteId) {
      return NextResponse.json({ error: 'athleteId is required' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('coach_favorites')
      .select('coach_id')
      .eq('athlete_id', athleteId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    const coachIds = (data || []).map((row: any) => row.coach_id)
    return NextResponse.json({ success: true, coachIds })
  } catch (err: any) {
    console.error('Coach favorites GET error:', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { athleteId, coachId, favorite } = body

    if (!athleteId || !coachId || typeof favorite !== 'boolean') {
      return NextResponse.json({ error: 'athleteId, coachId, and favorite (boolean) are required' }, { status: 400 })
    }

    if (favorite) {
      const { error } = await supabaseAdmin
        .from('coach_favorites')
        .upsert(
          { athlete_id: athleteId, coach_id: coachId },
          { onConflict: 'athlete_id,coach_id' }
        )

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }
    } else {
      const { error } = await supabaseAdmin
        .from('coach_favorites')
        .delete()
        .eq('athlete_id', athleteId)
        .eq('coach_id', coachId)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }
    }

    return NextResponse.json({ success: true, favorite })
  } catch (err: any) {
    console.error('Coach favorites PUT error:', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}
