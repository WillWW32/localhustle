import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { refreshAccessToken } from '@/lib/x-oauth';

interface RefreshTokenRequest {
  athleteId: string;
}

/**
 * POST /api/auth/x/refresh
 *
 * Refreshes an expired X access token using the refresh token.
 * Updates the token in the database and returns the new access token.
 *
 * Request body:
 * {
 *   athleteId: string (UUID of the athlete)
 * }
 *
 * Response:
 * {
 *   access_token: string,
 *   expires_in: number,
 *   token_type: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body: RefreshTokenRequest = await request.json();
    const { athleteId } = body;

    if (!athleteId) {
      return NextResponse.json(
        { error: 'Missing athleteId in request body' },
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

    // Fetch the current refresh token from the database
    const { data: tokenData, error: fetchError } = await supabase
      .from('x_oauth_tokens')
      .select('refresh_token')
      .eq('athlete_id', athleteId)
      .single();

    if (fetchError || !tokenData) {
      console.error('Failed to fetch refresh token:', fetchError);
      return NextResponse.json(
        { error: 'No X OAuth token found for this athlete' },
        { status: 404 },
      );
    }

    if (!tokenData.refresh_token) {
      return NextResponse.json(
        { error: 'No refresh token available' },
        { status: 400 },
      );
    }

    // Refresh the access token
    const refreshResponse = await refreshAccessToken(tokenData.refresh_token);

    // Calculate new token expiration time
    const expiresAt = new Date(
      Date.now() + refreshResponse.expires_in * 1000,
    ).toISOString();

    // Update the tokens in the database
    const { error: updateError } = await supabase
      .from('x_oauth_tokens')
      .update({
        access_token: refreshResponse.access_token,
        refresh_token: refreshResponse.refresh_token || tokenData.refresh_token,
        expires_at: expiresAt,
        scope: refreshResponse.scope,
        updated_at: new Date().toISOString(),
      })
      .eq('athlete_id', athleteId);

    if (updateError) {
      console.error('Failed to update tokens:', updateError);
      return NextResponse.json(
        { error: 'Failed to update tokens in database' },
        { status: 500 },
      );
    }

    // Return the new access token
    return NextResponse.json({
      access_token: refreshResponse.access_token,
      expires_in: refreshResponse.expires_in,
      token_type: refreshResponse.token_type,
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Token refresh failed',
      },
      { status: 500 },
    );
  }
}
