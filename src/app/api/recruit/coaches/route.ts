import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseClient'

export async function GET(request: NextRequest) {
  try {
    const division = request.nextUrl.searchParams.get('division')
    const state = request.nextUrl.searchParams.get('state')
    const campaignId = request.nextUrl.searchParams.get('campaignId')
    const contacted = request.nextUrl.searchParams.get('contacted')
    const athleteId = request.nextUrl.searchParams.get('athleteId')

    let query = supabaseAdmin.from('coaches').select('*')

    if (division) query = query.eq('division', division)
    if (state) query = query.eq('state', state)

    let { data: coaches, error: coachError } = await query

    if (coachError) {
      return NextResponse.json({ error: coachError.message }, { status: 400 })
    }

    // Build outreach status map when athleteId is provided
    let statusMap = new Map<string, { emailed: boolean; dmd: boolean; responded: boolean; sentAt: string | null }>()
    let outreachMap = new Map<string, string>()

    // Fetch favorites when athleteId is provided
    let favoriteSet = new Set<string>()
    if (athleteId) {
      const { data: favorites } = await supabaseAdmin
        .from('coach_favorites')
        .select('coach_id')
        .eq('athlete_id', athleteId)
      for (const fav of favorites || []) {
        favoriteSet.add(fav.coach_id)
      }
    }

    if (athleteId) {
      const { data: messages } = await supabaseAdmin
        .from('messages')
        .select('coach_id, status, type, sent_at')
        .eq('athlete_id', athleteId)
        .in('type', ['email', 'follow_up', 'dm'])
        .not('status', 'eq', 'failed')

      for (const msg of messages || []) {
        const existing = statusMap.get(msg.coach_id) || { emailed: false, dmd: false, responded: false, sentAt: null }
        if (msg.type === 'email' || msg.type === 'follow_up') existing.emailed = true
        if (msg.type === 'dm') existing.dmd = true
        if (msg.status === 'received') existing.responded = true
        if (msg.sent_at && (!existing.sentAt || msg.sent_at > existing.sentAt)) existing.sentAt = msg.sent_at
        statusMap.set(msg.coach_id, existing)
      }

      const { data: outreach } = await supabaseAdmin
        .from('custom_outreach')
        .select('coach_id, status')
        .eq('athlete_id', athleteId)

      for (const o of outreach || []) {
        outreachMap.set(o.coach_id, o.status)
      }
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
      const stateA = a.state || ''
      const stateB = b.state || ''
      if (stateA !== stateB) return stateA.localeCompare(stateB)
      return (a.last_name || '').localeCompare(b.last_name || '')
    })

    // Enrich with status if athleteId was provided
    const enriched = (coaches || []).map((c: any) => {
      const msgs = statusMap.get(c.id)
      const oStatus = outreachMap.get(c.id)
      let outreachStatus: 'responded' | 'emailed' | 'queued' | 'not_contacted' = 'not_contacted'
      if (msgs?.responded || oStatus === 'responded') outreachStatus = 'responded'
      else if (msgs?.emailed) outreachStatus = 'emailed'
      else if (oStatus === 'queued' || oStatus === 'sent') outreachStatus = 'queued'

      return {
        ...c,
        outreach_status: outreachStatus,
        emailed: msgs?.emailed || false,
        dmd: msgs?.dmd || false,
        responded: msgs?.responded || oStatus === 'responded',
        last_contact_at: msgs?.sentAt || null,
        is_favorite: favoriteSet.has(c.id),
      }
    })

    const stats = athleteId ? {
      total: enriched.length,
      emailed: enriched.filter((c: any) => c.emailed).length,
      responded: enriched.filter((c: any) => c.responded).length,
      notContacted: enriched.filter((c: any) => c.outreach_status === 'not_contacted').length,
    } : null

    return NextResponse.json({ success: true, count: enriched.length, coaches: enriched, stats })
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
