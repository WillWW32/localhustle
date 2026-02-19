import { NextRequest, NextResponse } from 'next/server';
import { generatePKCE, getAuthorizationUrl } from '@/lib/x-oauth';

/**
 * GET /api/auth/x/authorize
 *
 * Initiates the X OAuth 2.0 PKCE flow.
 * Generates code_verifier and code_challenge, stores code_verifier in a cookie,
 * and redirects to X authorization URL.
 *
 * Query parameters:
 * - athleteId: The athlete's ID (stored in state for callback)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const athleteId = searchParams.get('athleteId');

    if (!athleteId) {
      return NextResponse.json(
        { error: 'Missing athleteId parameter' },
        { status: 400 },
      );
    }

    // Validate athleteId is a valid UUID
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(athleteId)) {
      return NextResponse.json(
        { error: 'Invalid athleteId format' },
        { status: 400 },
      );
    }

    // Generate PKCE parameters
    const { codeVerifier, codeChallenge } = generatePKCE();

    // Get authorization URL
    const authorizationUrl = getAuthorizationUrl(athleteId, codeChallenge);

    // Create response with redirect
    const response = NextResponse.redirect(authorizationUrl);

    // Store code_verifier and athleteId in a secure HTTP-only cookie
    // The cookie format is: base64(athleteId:codeVerifier)
    const cookieValue = Buffer.from(`${athleteId}:${codeVerifier}`).toString(
      'base64',
    );

    response.cookies.set('x_oauth_pkce', cookieValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 10 * 60, // 10 minutes
      path: '/api/auth/x',
    });

    return response;
  } catch (error) {
    console.error('Authorization error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Authorization failed',
      },
      { status: 500 },
    );
  }
}
