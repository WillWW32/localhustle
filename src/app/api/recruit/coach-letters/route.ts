import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseClient'

export async function GET(request: NextRequest) {
  const athleteId = request.nextUrl.searchParams.get('athleteId')
  if (!athleteId) {
    return NextResponse.json({ error: 'athleteId required' }, { status: 400 })
  }

  const { data: letters, error } = await supabaseAdmin
    .from('coach_letters')
    .select('*')
    .eq('athlete_id', athleteId)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(letters || [])
}

export async function POST(request: NextRequest) {
  try {
    const { athleteId, coachName, school, letterText } = await request.json()

    if (!athleteId || !coachName || !letterText) {
      return NextResponse.json({ error: 'athleteId, coachName, and letterText are required' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('coach_letters')
      .insert({
        athlete_id: athleteId,
        coach_name: coachName,
        school: school || '',
        letter_text: letterText,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Coach letter error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save letter' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  const letterId = request.nextUrl.searchParams.get('id')
  if (!letterId) {
    return NextResponse.json({ error: 'id required' }, { status: 400 })
  }

  const { error } = await supabaseAdmin
    .from('coach_letters')
    .delete()
    .eq('id', letterId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
