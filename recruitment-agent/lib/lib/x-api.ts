/**
 * Server-side X API utilities for the recruitment agent
 */

import { createClient } from '@supabase/supabase-js';
import { refreshAccessToken } from '@/lib/x-oauth';
import { XOAuthTokens } from '@/lib/types/x-oauth';

/**
 * Get a valid X access token for an athlete, refreshing if necessary
 */
export async function getValidXAccessToken(
  athleteId: string,
): Promise<string | null> {
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

  const { data: tokenData, error } = await supabase
    .from('x_oauth_tokens')
    .select('*')
    .eq('athlete_id', athleteId)
    .single();

  if (error || !tokenData) {
    console.error('Failed to fetch X OAuth token:', error);
    return null;
  }

  const expiresAt = new Date(tokenData.expires_at);
  const now = new Date();

  // Check if token is expired or about to expire (within 5 minutes)
  if (expiresAt.getTime() - now.getTime() < 5 * 60 * 1000) {
    // Token is expired or expiring soon, refresh it
    if (!tokenData.refresh_token) {
      console.error('No refresh token available for athlete:', athleteId);
      return null;
    }

    try {
      const refreshResponse = await refreshAccessToken(
        tokenData.refresh_token,
      );

      const newExpiresAt = new Date(
        Date.now() + refreshResponse.expires_in * 1000,
      ).toISOString();

      const { error: updateError } = await supabase
        .from('x_oauth_tokens')
        .update({
          access_token: refreshResponse.access_token,
          refresh_token:
            refreshResponse.refresh_token || tokenData.refresh_token,
          expires_at: newExpiresAt,
          scope: refreshResponse.scope,
          updated_at: new Date().toISOString(),
        })
        .eq('athlete_id', athleteId);

      if (updateError) {
        console.error('Failed to update X tokens:', updateError);
        return null;
      }

      return refreshResponse.access_token;
    } catch (error) {
      console.error('Failed to refresh X access token:', error);
      return null;
    }
  }

  return tokenData.access_token;
}

/**
 * Get X OAuth token data for an athlete
 */
export async function getXOAuthTokenData(
  athleteId: string,
): Promise<XOAuthTokens | null> {
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

  const { data, error } = await supabase
    .from('x_oauth_tokens')
    .select('*')
    .eq('athlete_id', athleteId)
    .single();

  if (error) {
    console.error('Failed to fetch X OAuth token data:', error);
    return null;
  }

  return data;
}

/**
 * Check if an athlete has connected their X account
 */
export async function isXAccountConnected(athleteId: string): Promise<boolean> {
  const tokenData = await getXOAuthTokenData(athleteId);
  return !!tokenData && !!tokenData.access_token;
}

/**
 * Get X user info for an athlete
 */
export async function getXUserInfo(athleteId: string) {
  const tokenData = await getXOAuthTokenData(athleteId);

  if (!tokenData) {
    return null;
  }

  return {
    id: tokenData.x_user_id,
    username: tokenData.x_username,
    connectedAt: tokenData.created_at,
    lastUpdated: tokenData.updated_at,
  };
}

/**
 * Revoke X OAuth access (for athlete account disconnection)
 */
export async function revokeXOAuthAccess(athleteId: string): Promise<boolean> {
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

  // Delete the OAuth token record
  const { error: deleteError } = await supabase
    .from('x_oauth_tokens')
    .delete()
    .eq('athlete_id', athleteId);

  if (deleteError) {
    console.error('Failed to delete X OAuth tokens:', deleteError);
    return false;
  }

  // Clear X handle and profile URL from athlete record
  const { error: updateError } = await supabase
    .from('athletes')
    .update({
      x_handle: null,
      x_profile_url: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', athleteId);

  if (updateError) {
    console.error('Failed to update athlete:', updateError);
    return false;
  }

  return true;
}
