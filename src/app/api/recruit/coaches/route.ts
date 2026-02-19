import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseClient'

export async function GET(request: NextRequest) {
  try {
    const division = request.nextUrl.searchParams.get('division')
    const state = request.nextUrl.searchParams.get('state')
    const campaignId = request.nextUrl.searchParams.get('campaignId')
    const contacted = request.nextUrl.searchParams.get('contacted')

    let query = supabaseAdmin.from('coaches').select('*')

    if (division) query = query.eq('division', division)
    if (state) query = query.eq('state', state)

    let { data: coaches, error: coachError } = await query

    if (coachError) {
      return NextResponse.json({ error: coachError.message }, { status: 400 })
    }

    if (campaignId) {
      const { data: contactedIds } = await supabaseAdmin
        .from('messages')
        .select('coach_id')
        .eq('campaign_id', campaignId)

      const contactedSet = new Set(contactedIds?.map((m: any) => m.coach_id) || [])

      if (contacted === 'true') {
        coaches = (coaches || []).filter((c: any) => contactedSet.has(c.id))
      } else if (contacted === 'false') {
        coaches = (coaches || []).filter((c: any) => !contactedSet.has(c.id))
      }
    }

    coaches = (coaches || []).sort((a: any, b: any) => {
      if (a.state !== b.state) return a.state.localeCompare(b.state)
      return a.last_name.localeCompare(b.last_name)
    })

    return NextResponse.json({ success: true, count: coaches?.length || 0, coaches })
  } catch (err: any) {
    console.error('Coaches GET error:', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { first_name, last_name, email, school, division, state } = body

    if (!first_name || !last_name || !email || !school) {
      return NextResponse.json({ error: 'first_name, last_name, email, and school are required' }, { status: 400 })
    }

    const { data: existing } = await supabaseAdmin
      .from('coaches')
      .select('id')
      .eq('email', email)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Coach with this email already exists', coachId: existing.id }, { status: 409 })
    }

    const { data: coach, error: insertError } = await supabaseAdmin
      .from('coaches')
      .insert({
        first_name,
        last_name,
        email,
        school,
        division: division || null,
        state: state || null,
        title: body.title || null,
        phone: body.phone || null,
      })
      .select()
      .single()

    if (insertError || !coach) {
      return NextResponse.json({ error: insertError?.message || 'Failed to create coach' }, { status: 500 })
    }

    return NextResponse.json({ success: true, coach }, { status: 201 })
  } catch (err: any) {
    console.error('Coaches POST error:', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}
