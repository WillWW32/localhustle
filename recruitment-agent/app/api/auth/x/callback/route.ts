import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  exchangeCodeForToken,
  getXUserProfile,
} from '@/lib/x-oauth';

/**
 * GET /api/auth/x/callback
 *
 * Handles the OAuth callback from X after user authorization.
 * Exchanges the authorization code for tokens, fetches the user profile,
 * and saves the tokens to the database.
 *
 * Query parameters:
 * - code: The authorization code from X
 * - state: The athlete ID (set in authorization URL)
 * - error: Error code if authorization failed
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // athleteId
    const error = searchParams.get('error');

    // Handle authorization errors from X
    if (error) {
      console.error('X OAuth error:', error);
      const errorDescription = searchParams.get('error_description');
      return NextResponse.redirect(
        `/dashboard/athletes/${state}?error=${encodeURIComponent(
          errorDescription || error,
        )}`,
      );
    }

    if (!code || !state) {
      return NextResponse.json(
        { error: 'Missing code or state parameter' },
        { status: 400 },
      );
    }

    // Retrieve PKCE state from cookie
    const cookieValue = request.cookies.get('x_oauth_pkce')?.value;
    if (!cookieValue) {
      return NextResponse.json(
        { error: 'PKCE state not found in cookie' },
        { status: 400 },
      );
    }

    // Decode the cookie to get athleteId and codeVerifier
    const decodedValue = Buffer.from(cookieValue, 'base64').toString('utf-8');
    const [storedAthleteId, codeVerifier] = decodedValue.split(':');

    // Validate that the state matches the stored athleteId
    if (state !== storedAthleteId) {
      return NextResponse.json(
        { error: 'State mismatch - potential CSRF attack' },
        { status: 400 },
      );
    }

    // Exchange code for tokens
    const tokenResponse = await exchangeCodeForToken(code, codeVerifier);

    // Fetch X user profile
    const userProfile = await getXUserProfile(tokenResponse.access_token);

    // Initialize Supabase admin client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );

    // Calculate token expiration time
    const expiresAt = new Date(
      Date.now() + tokenResponse.expires_in * 1000,
    ).toISOString();

    // Save tokens to x_oauth_tokens table
    const { error: insertError } = await supabase
      .from('x_oauth_tokens')
      .upsert(
        {
          athlete_id: state,
          x_user_id: userProfile.data.id,
          x_username: userProfile.data.username,
          access_token: tokenResponse.access_token,
          refresh_token: tokenResponse.refresh_token || null,
          expires_at: expiresAt,
          scope: tokenResponse.scope,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'athlete_id',
        },
      );

    if (insertError) {
      console.error('Database error:', insertError);
      return NextResponse.json(
        { error: 'Failed to save tokens' },
        { status: 500 },
      );
    }

    // Update athlete's X handle and profile URL
    const { error: updateError } = await supabase
      .from('athletes')
      .update({
        x_handle: userProfile.data.username,
        x_profile_url: `https://twitter.com/${userProfile.data.username}`,
        updated_at: new Date().toISOString(),
      })
      .eq('id', state);

    if (updateError) {
      console.error('Failed to update athlete:', updateError);
      // Don't fail completely if athlete update fails - tokens are already saved
    }

    // Clear the PKCE cookie
    const response = NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/athletes/${state}?connected=true`,
    );

    response.cookies.delete('x_oauth_pkce');

    return response;
  } catch (error) {
    console.error('Callback error:', error);

    const athleteId = new URL(request.url).searchParams.get('state');
    const redirectUrl = athleteId
      ? `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/athletes/${athleteId}?error=${encodeURIComponent(
          'Authorization failed',
        )}`
      : `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=${encodeURIComponent(
          'Authorization failed',
        )}`;

    return NextResponse.redirect(redirectUrl);
  }
}
