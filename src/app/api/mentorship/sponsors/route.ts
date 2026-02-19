import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseClient'

export async function GET(request: NextRequest) {
  const businessId = request.nextUrl.searchParams.get('businessId')
  if (!businessId) {
    return NextResponse.json({ error: 'businessId required' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('mentorship_sponsors')
    .select('*')
    .eq('business_id', businessId)
    .single()

  if (error) return NextResponse.json({ sponsor: null })
  return NextResponse.json({ sponsor: data })
}

export async function POST(request: NextRequest) {
  try {
    const { businessId, businessName, sessionCount } = await request.json()

    if (!businessId || !sessionCount) {
      return NextResponse.json({ error: 'businessId and sessionCount required' }, { status: 400 })
    }

    // Upsert sponsor record
    const { data: existing } = await supabaseAdmin
      .from('mentorship_sponsors')
      .select('*')
      .eq('business_id', businessId)
      .single()

    if (existing) {
      const { data, error } = await supabaseAdmin
        .from('mentorship_sponsors')
        .update({ sessions_funded: existing.sessions_funded + sessionCount })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json(data)
    } else {
      const { data, error } = await supabaseAdmin
        .from('mentorship_sponsors')
        .insert({
          business_id: businessId,
          business_name: businessName || '',
          sessions_funded: sessionCount,
          sessions_used: 0,
        })
        .select()
        .single()

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json(data)
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fund sessions' },
      { status: 500 }
    )
  }
}
