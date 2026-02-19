import { NextRequest, NextResponse } from 'next/server'
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
    const response = NextResponse.redirect(authorizationUrl)

    const cookieValue = Buffer.from(`${athleteId}:${codeVerifier}`).toString('base64')
    response.cookies.set('x_oauth_pkce', cookieValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 10 * 60,
      path: '/api/auth/x',
    })

    return response
  } catch (error) {
    console.error('Authorization error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Authorization failed' },
      { status: 500 }
    )
  }
}
