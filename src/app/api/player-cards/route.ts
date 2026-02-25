import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - fetch cards for an athlete
export async function GET(req: NextRequest) {
  const athleteId = req.nextUrl.searchParams.get('athleteId')
  if (!athleteId) return NextResponse.json({ error: 'athleteId required' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('player_cards')
    .select('*')
    .eq('athlete_id', athleteId)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ cards: data })
}

// POST - create or update a card
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { id, athlete_id, template, card_data, main_photo_url, secondary_photo_url, logo_image_url } = body

  if (!athlete_id) return NextResponse.json({ error: 'athlete_id required' }, { status: 400 })

  const record = {
    athlete_id,
    template: template || 'fleer86',
    card_data: card_data || {},
    main_photo_url: main_photo_url || null,
    secondary_photo_url: secondary_photo_url || null,
    logo_image_url: logo_image_url || null,
    updated_at: new Date().toISOString(),
  }

  let error
  if (id) {
    const result = await supabaseAdmin.from('player_cards').update(record).eq('id', id)
    error = result.error
  } else {
    const result = await supabaseAdmin.from('player_cards').insert(record)
    error = result.error
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

// DELETE - remove a card
export async function DELETE(req: NextRequest) {
  const cardId = req.nextUrl.searchParams.get('id')
  if (!cardId) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const { error } = await supabaseAdmin.from('player_cards').delete().eq('id', cardId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
