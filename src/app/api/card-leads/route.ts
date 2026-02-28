import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseClient'

export async function POST(request: NextRequest) {
  try {
    const { email, playerName, sport } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 })
    }

    // Try to save lead — table may not exist yet, that's fine
    try {
      await supabaseAdmin
        .from('card_leads')
        .insert({ email, player_name: playerName || null, sport: sport || null })
    } catch {
      // Table may not exist — log instead
      console.log('Card download lead:', email, playerName, sport)
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
