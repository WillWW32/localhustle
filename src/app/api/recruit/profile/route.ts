import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseClient'

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get('slug')
  if (!slug) {
    return NextResponse.json({ error: 'Missing slug' }, { status: 400 })
  }

  // Load athlete profile by slug
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('athlete_profiles')
    .select('*')
    .eq('slug', slug)
    .single()

  if (profileError || !profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  // Load athlete data
  const { data: athleteRow, error: athleteError } = await supabaseAdmin
    .from('athletes')
    .select('*')
    .eq('id', profile.athlete_id)
    .single()

  if (athleteError || !athleteRow) {
    return NextResponse.json({ error: 'Athlete not found' }, { status: 404 })
  }

  // Increment view count
  await supabaseAdmin
    .from('athlete_profiles')
    .update({ views: (profile.views || 0) + 1 })
    .eq('id', profile.id)

  // Gather reels
  let reels: string[] = athleteRow.instagram_reels || []
  if (athleteRow.profile_id) {
    const { data: linkedProfile } = await supabaseAdmin
      .from('profiles')
      .select('instagram_reels')
      .eq('id', athleteRow.profile_id)
      .single()

    if (linkedProfile?.instagram_reels) {
      const merged = [...reels, ...linkedProfile.instagram_reels]
      reels = [...new Set(merged)].slice(0, 3)
    }
  }

  // Load scouting report summary
  const { data: scoutingRow } = await supabaseAdmin
    .from('scouting_reports')
    .select('overall_score, division_projection, stars')
    .eq('athlete_id', athleteRow.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  // Load coach letters
  const { data: letters } = await supabaseAdmin
    .from('coach_letters')
    .select('*')
    .eq('athlete_id', athleteRow.id)
    .order('created_at', { ascending: false })

  return NextResponse.json({
    profile: {
      slug: profile.slug,
      firstName: athleteRow.first_name,
      lastName: athleteRow.last_name,
      sport: athleteRow.sport,
      position: athleteRow.position,
      height: athleteRow.height,
      weight: athleteRow.weight,
      gradYear: athleteRow.grad_year,
      highSchool: athleteRow.high_school,
      city: athleteRow.city,
      state: athleteRow.state,
      bio: profile.about || '',
      stats: athleteRow.stats || {},
      achievements: profile.achievements || [],
      highlightUrl: athleteRow.highlight_url || '',
      viewCount: (profile.views || 0) + 1,
      isPrivate: profile.visibility === 'private',
      athleteId: athleteRow.id,
      instagramReels: reels,
    },
    scoutingReport: scoutingRow || null,
    coachLetters: (letters || []).map((l: Record<string, unknown>) => ({
      id: l.id,
      coachName: l.coach_name,
      school: l.school,
      letterText: l.letter_text,
      uploadedAt: l.created_at,
    })),
  })
}
