import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseClient'

export async function GET(request: NextRequest) {
  try {
    const athleteId = request.nextUrl.searchParams.get('athleteId')
    if (!athleteId) {
      return NextResponse.json({ error: 'athleteId is required' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('recruit_activities')
      .select('*')
      .eq('athlete_id', athleteId)
      .order('activity_date', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const activities = (data || []).map((a: any) => ({
      id: a.id,
      athleteId: a.athlete_id,
      coachId: a.coach_id,
      coachName: null,
      activityType: a.activity_type,
      school: a.school,
      title: a.title,
      description: a.description,
      activityDate: a.activity_date,
      status: a.status,
      outcome: a.outcome,
      createdAt: a.created_at,
      updatedAt: a.updated_at,
    }))

    return NextResponse.json({ success: true, activities })
  } catch (err: any) {
    console.error('Activities GET error:', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { athleteId, coachId, activityType, school, title, description, activityDate, status } = body

    if (!athleteId || !activityType || !title || !activityDate) {
      return NextResponse.json({ error: 'athleteId, activityType, title, and activityDate are required' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('recruit_activities')
      .insert({
        athlete_id: athleteId,
        coach_id: coachId || null,
        activity_type: activityType,
        school: school || null,
        title,
        description: description || null,
        activity_date: activityDate,
        status: status || 'planned',
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, activity: data })
  } catch (err: any) {
    console.error('Activities POST error:', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, status, outcome, description, title, school, activityType, activityDate } = body

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    const updates: Record<string, any> = { updated_at: new Date().toISOString() }
    if (status !== undefined) updates.status = status
    if (outcome !== undefined) updates.outcome = outcome
    if (description !== undefined) updates.description = description
    if (title !== undefined) updates.title = title
    if (school !== undefined) updates.school = school
    if (activityType !== undefined) updates.activity_type = activityType
    if (activityDate !== undefined) updates.activity_date = activityDate

    const { data, error } = await supabaseAdmin
      .from('recruit_activities')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, activity: data })
  } catch (err: any) {
    console.error('Activities PUT error:', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const activityId = request.nextUrl.searchParams.get('id')
    if (!activityId) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('recruit_activities')
      .delete()
      .eq('id', activityId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Activities DELETE error:', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}
