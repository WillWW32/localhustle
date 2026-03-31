import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseClient'

export async function POST(request: NextRequest) {
  try {
    const { athleteId } = await request.json()
    if (!athleteId) return NextResponse.json({ error: 'athleteId required' }, { status: 400 })

    await supabaseAdmin.from('x_oauth_tokens').delete().eq('athlete_id', athleteId)

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
