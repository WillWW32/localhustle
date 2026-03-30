import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseClient'

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id')
  if (!id) {
    return NextResponse.json({ error: 'Missing athlete id' }, { status: 400 })
  }

  // Load athlete
  const { data: athleteRow, error: athleteErr } = await supabaseAdmin
    .from('athletes')
    .select('*')
    .eq('id', id)
    .single()

  if (athleteErr || !athleteRow) {
    return NextResponse.json({ error: 'Athlete not found' }, { status: 404 })
  }

  // Get slug from athlete_profiles if not on athletes table
  let slug = athleteRow.slug || ''
  if (!slug) {
    const { data: ap } = await supabaseAdmin
      .from('athlete_profiles')
      .select('slug')
      .eq('athlete_id', id)
      .limit(1)
      .single()
    if (ap?.slug) slug = ap.slug
  }

  // Load campaign
  const { data: campaign } = await supabaseAdmin
    .from('campaigns')
    .select('*')
    .eq('athlete_id', id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  // Load send counts from messages table
  const { count: totalCount } = await supabaseAdmin
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('athlete_id', id)

  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString()
  const { count: weekCount } = await supabaseAdmin
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('athlete_id', id)
    .gte('sent_at', weekAgo)

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const { count: todayCount } = await supabaseAdmin
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('athlete_id', id)
    .gte('sent_at', todayStart.toISOString())

  const stats = athleteRow.stats || {}

  // Check if X is connected via OAuth tokens table (in addition to x_handle on athlete)
  let xConnected = !!athleteRow.x_handle
  if (!xConnected) {
    const { data: xToken } = await supabaseAdmin
      .from('x_oauth_tokens')
      .select('id')
      .eq('athlete_id', id)
      .limit(1)
      .single()
    xConnected = !!xToken
  }

  return NextResponse.json({
    athlete: {
      id: athleteRow.id,
      firstName: athleteRow.first_name,
      lastName: athleteRow.last_name,
      email: athleteRow.email || '',
      sport: athleteRow.sport || '',
      position: athleteRow.position || '',
      height: athleteRow.height || '',
      weight: athleteRow.weight || '',
      highSchool: athleteRow.high_school || '',
      city: athleteRow.city || '',
      state: athleteRow.state || '',
      gradYear: athleteRow.grad_year || '',
      bio: athleteRow.bio || '',
      highlightUrl: athleteRow.highlight_url || '',
      xConnected,
      slug,
      instagramReels: athleteRow.instagram_reels || [],
      profileImageUrl: athleteRow.profile_image_url || '',
      ppg: stats.ppg || '',
      rpg: stats.rpg || '',
      threePtPct: stats.three_pt_pct || stats.threePct || '',
      fgPct: stats.fg_pct || stats.two_pt_pct || stats.fgPct || '',
      mpg: stats.mpg || '',
      parentName: athleteRow.parent_name || '',
      parentEmail: athleteRow.parent_email || '',
      photos: athleteRow.photos || [],
    },
    campaign: campaign ? {
      id: campaign.id,
      status: campaign.status === 'paused' ? 'paused' : 'active',
    } : null,
    sendCount: {
      total: totalCount || 0,
      thisWeek: weekCount || 0,
      today: todayCount || 0,
    },
  })
}
