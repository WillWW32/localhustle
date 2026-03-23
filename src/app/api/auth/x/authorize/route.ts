import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseClient'
import { generatePKCE, getAuthorizationUrl } from '@/lib/recruit/x-oauth'

export async function GET(request: NextRequest) {
  try {
    const athleteId = request.nextUrl.searchParams.get('athleteId')

    if (!athleteId) {
      return NextResponse.json({ error: 'Missing athleteId parameter' }, { status: 400 })
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(athleteId)) {
      return NextResponse.json({ error: 'Invalid athleteId format' }, { status: 400 })
    }

    const { codeVerifier, codeChallenge } = generatePKCE()
    const authorizationUrl = getAuthorizationUrl(athleteId, codeChallenge)

    // Store PKCE verifier in Supabase (cookies get lost across serverless functions)
    await supabaseAdmin
      .from('x_oauth_tokens')
      .upsert({
        athlete_id: athleteId,
        pkce_verifier: codeVerifier,
      }, { onConflict: 'athlete_id' })

    return NextResponse.redirect(authorizationUrl)
  } catch (error) {
    console.error('Authorization error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Authorization failed' },
      { status: 500 }
    )
  }
}
