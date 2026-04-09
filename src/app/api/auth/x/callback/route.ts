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

    // Retrieve PKCE verifier from Supabase (cookies get lost across serverless functions)
    const { data: tokenRow } = await supabaseAdmin
      .from('x_oauth_tokens')
      .select('pkce_verifier')
      .eq('athlete_id', state)
      .single()

    const codeVerifier = tokenRow?.pkce_verifier
    if (!codeVerifier) {
      return NextResponse.json({ error: 'PKCE verifier not found. Please try connecting again.' }, { status: 400 })
    }

    const tokenResponse = await exchangeCodeForToken(code, codeVerifier)
    const userProfile = await getXUserProfile(tokenResponse.access_token)

    const expiresAt = new Date(Date.now() + tokenResponse.expires_in * 1000).toISOString()

    const { error: upsertError } = await supabaseAdmin
      .from('x_oauth_tokens')
      .upsert({
        athlete_id: state,
        x_user_id: userProfile.data.id,
        x_username: userProfile.data.username,
        access_token: tokenResponse.access_token,
        refresh_token: tokenResponse.refresh_token || null,
        token_expires_at: expiresAt,
        expires_at: expiresAt,
        last_refreshed_at: new Date().toISOString(),
        scopes: tokenResponse.scope ? tokenResponse.scope.split(' ') : [],
        connected_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'athlete_id' })

    if (upsertError) {
      console.error('Failed to save X tokens:', upsertError)
      throw new Error(`Token save failed: ${upsertError.message}`)
    }

    await supabaseAdmin
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
  } catch (error: any) {
    console.error('Callback error:', error?.message || error)
    console.error('Full error:', JSON.stringify(error, Object.getOwnPropertyNames(error || {})))
    const athleteId = new URL(request.url).searchParams.get('state')
    const redirectUrl = athleteId
      ? `${process.env.NEXT_PUBLIC_APP_URL}/recruit/dashboard/athletes/${athleteId}?error=${encodeURIComponent('Authorization failed')}`
      : `${process.env.NEXT_PUBLIC_APP_URL}/recruit/dashboard?error=${encodeURIComponent('Authorization failed')}`
    return NextResponse.redirect(redirectUrl)
  }
}
