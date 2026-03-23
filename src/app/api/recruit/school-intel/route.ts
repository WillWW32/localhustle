import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseClient'

// GET /api/recruit/school-intel?school=University of Montana
export async function GET(request: NextRequest) {
  try {
    const school = request.nextUrl.searchParams.get('school')

    if (!school) {
      // Return all school intel records
      const { data, error } = await supabaseAdmin
        .from('school_intel')
        .select('*')
        .order('school')

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }

      return NextResponse.json({ success: true, count: data.length, schools: data })
    }

    // Look up by exact school name
    const { data, error } = await supabaseAdmin
      .from('school_intel')
      .select('*')
      .eq('school', school)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'School intel not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, intel: data })
  } catch (err: any) {
    console.error('School intel GET error:', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}

// POST /api/recruit/school-intel
// Upserts school intel data
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { school } = body

    if (!school) {
      return NextResponse.json({ error: 'school is required' }, { status: 400 })
    }

    const record = {
      school: body.school,
      division: body.division || null,
      conference: body.conference || null,
      recent_record: body.recent_record || null,
      tournament_appearance: body.tournament_appearance || false,
      key_departures: body.key_departures || null,
      roster_needs: body.roster_needs || null,
      program_style: body.program_style || null,
      coach_tenure: body.coach_tenure || null,
      fun_fact: body.fun_fact || null,
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabaseAdmin
      .from('school_intel')
      .upsert(record, { onConflict: 'school' })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, intel: data })
  } catch (err: any) {
    console.error('School intel POST error:', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}
