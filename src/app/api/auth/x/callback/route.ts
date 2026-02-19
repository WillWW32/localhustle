import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseClient'
import { exchangeCodeForToken, getXUserProfile } from '@/lib/recruit/x-oauth'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state') // athleteId
    const error = searchParams.get('error')

    if (error) {
      const errorDescription = searchParams.get('error_description')
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/recruit/dashboard/athletes/${state}?error=${encodeURIComponent(errorDescription || error)}`
      )
    }

    if (!code || !state) {
      return NextResponse.json({ error: 'Missing code or state parameter' }, { status: 400 })
    }

    const cookieValue = request.cookies.get('x_oauth_pkce')?.value
    if (!cookieValue) {
      return NextResponse.json({ error: 'PKCE state not found in cookie' }, { status: 400 })
    }

    const decodedValue = Buffer.from(cookieValue, 'base64').toString('utf-8')
    const [storedAthleteId, codeVerifier] = decodedValue.split(':')

    if (state !== storedAthleteId) {
      return NextResponse.json({ error: 'State mismatch - potential CSRF attack' }, { status: 400 })
    }

    const tokenResponse = await exchangeCodeForToken(code, codeVerifier)
    const userProfile = await getXUserProfile(tokenResponse.access_token)

    const expiresAt = new Date(Date.now() + tokenResponse.expires_in * 1000).toISOString()

    await (supabaseAdmin as any)
      .from('x_oauth_tokens')
      .upsert({
        athlete_id: state,
        x_user_id: userProfile.data.id,
        x_username: userProfile.data.username,
        access_token: tokenResponse.access_token,
        refresh_token: tokenResponse.refresh_token || null,
        expires_at: expiresAt,
        scope: tokenResponse.scope,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'athlete_id' })

    await (supabaseAdmin as any)
      .from('athletes')
      .update({
        x_handle: userProfile.data.username,
        x_profile_url: `https://twitter.com/${userProfile.data.username}`,
        updated_at: new Date().toISOString(),
      })
      .eq('id', state)

    const response = NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/recruit/dashboard/athletes/${state}?connected=true`
    )
    response.cookies.delete('x_oauth_pkce')

    return response
  } catch (error) {
    console.error('Callback error:', error)
    const athleteId = new URL(request.url).searchParams.get('state')
    const redirectUrl = athleteId
      ? `${process.env.NEXT_PUBLIC_APP_URL}/recruit/dashboard/athletes/${athleteId}?error=${encodeURIComponent('Authorization failed')}`
      : `${process.env.NEXT_PUBLIC_APP_URL}/recruit/dashboard?error=${encodeURIComponent('Authorization failed')}`
    return NextResponse.redirect(redirectUrl)
  }
}
