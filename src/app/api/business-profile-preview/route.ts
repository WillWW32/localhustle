import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const athleteId = searchParams.get('athlete_id')

  if (!athleteId) {
    return NextResponse.json({ error: 'Missing athlete_id' }, { status: 400 })
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('full_name, school, sport, profile_pic, highlight_link, social_followers, bio, selected_gigs')
    .eq('id', athleteId)
    .single()

  if (error || !profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  return NextResponse.json(profile)
}