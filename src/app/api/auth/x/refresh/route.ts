import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseClient'
import { refreshAccessToken } from '@/lib/recruit/x-oauth'

export async function POST(request: NextRequest) {
  try {
    const { athleteId } = await request.json()

    if (!athleteId) {
      return NextResponse.json({ error: 'Missing athleteId in request body' }, { status: 400 })
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(athleteId)) {
      return NextResponse.json({ error: 'Invalid athleteId format' }, { status: 400 })
    }

    const { data: tokenData, error: fetchError } = await supabaseAdmin
      .from('x_oauth_tokens')
      .select('refresh_token')
      .eq('athlete_id', athleteId)
      .single()

    if (fetchError || !tokenData) {
      return NextResponse.json({ error: 'No X OAuth token found for this athlete' }, { status: 404 })
    }

    if (!tokenData.refresh_token) {
      return NextResponse.json({ error: 'No refresh token available' }, { status: 400 })
    }

    const refreshResponse = await refreshAccessToken(tokenData.refresh_token)
    const expiresAt = new Date(Date.now() + refreshResponse.expires_in * 1000).toISOString()

    await supabaseAdmin
      .from('x_oauth_tokens')
      .update({
        access_token: refreshResponse.access_token,
        refresh_token: refreshResponse.refresh_token || tokenData.refresh_token,
        expires_at: expiresAt,
        scope: refreshResponse.scope,
        updated_at: new Date().toISOString(),
      })
      .eq('athlete_id', athleteId)

    return NextResponse.json({
      access_token: refreshResponse.access_token,
      expires_in: refreshResponse.expires_in,
      token_type: refreshResponse.token_type,
    })
  } catch (error) {
    console.error('Token refresh error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Token refresh failed' },
      { status: 500 }
    )
  }
}
