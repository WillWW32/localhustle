import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseClient'

export async function GET(request: NextRequest) {
  const sport = request.nextUrl.searchParams.get('sport')
  const status = request.nextUrl.searchParams.get('status') || 'approved'

  let query = supabaseAdmin
    .from('mentors')
    .select('*')
    .eq('status', status)
    .order('created_at', { ascending: false })

  if (sport) query = query.eq('sport', sport)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || [])
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, sport, college, bio, userId } = body

    if (!name || !email || !sport || !college) {
      return NextResponse.json({ error: 'name, email, sport, and college are required' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('mentors')
      .insert({
        user_id: userId || null,
        name,
        email,
        sport,
        college,
        bio: bio || '',
        session_rate: 3500,
        status: 'pending',
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (error) {
    console.error('Mentor create error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create mentor' },
      { status: 500 }
    )
  }
}
