import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseClient'

export async function POST(request: NextRequest) {
  try {
    const { athleteId } = await request.json()

    if (!athleteId) {
      return NextResponse.json({ error: 'athleteId is required' }, { status: 400 })
    }

    // Check if campaign already exists
    const { data: existing } = await supabaseAdmin
      .from('campaigns')
      .select('id')
      .eq('athlete_id', athleteId)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ campaignId: existing.id })
    }

    // Get athlete name for campaign name
    const { data: athlete } = await supabaseAdmin
      .from('athletes')
      .select('first_name, last_name')
      .eq('id', athleteId)
      .single()

    const { data: campaign, error } = await supabaseAdmin
      .from('campaigns')
      .insert({
        athlete_id: athleteId,
        name: athlete ? `${athlete.first_name} ${athlete.last_name} Campaign` : 'Campaign',
        status: 'active',
        daily_email_limit: 25,
        target_divisions: ['D1', 'D2', 'NAIA'],
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ campaignId: campaign.id })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
