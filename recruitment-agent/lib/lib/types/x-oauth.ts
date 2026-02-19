/**
 * X OAuth 2.0 Types for the Recruitment Agent
 */

/**
 * X OAuth Token Response from the token endpoint
 */
export interface XTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

/**
 * X User Profile Response from the /2/users/me endpoint
 */
export interface XUserProfile {
  data: {
    id: string;
    name: string;
    username: string;
  };
}

/**
 * Stored X OAuth tokens in the database
 */
export interface XOAuthTokens {
  id: string;
  athlete_id: string;
  x_user_id: string;
  x_username: string;
  access_token: string;
  refresh_token: string | null;
  expires_at: string;
  scope: string;
  created_at: string;
  updated_at: string;
}

/**
 * PKCE parameters for OAuth code exchange
 */
export interface PKCEParams {
  codeVerifier: string;
  codeChallenge: string;
}

/**
 * Request body for token refresh endpoint
 */
export interface RefreshTokenRequest {
  athleteId: string;
}

/**
 * Response from token refresh endpoint
 */
export interface RefreshTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

/**
 * Athlete record with X OAuth information
 */
export interface Athlete {
  id: string;
  name: string;
  email: string;
  x_handle?: string;
  x_profile_url?: string;
  created_at: string;
  updated_at: string;
}

/**
 * OAuth error response
 */
export interface OAuthErrorResponse {
  error: string;
  error_description?: string;
  error_uri?: string;
}

/**
 * OAuth authorization URL parameters
 */
export interface OAuthAuthorizationParams {
  response_type: string;
  client_id: string;
  redirect_uri: string;
  scope: string;
  state: string;
  code_challenge: string;
  code_challenge_method: 'S256' | 'plain';
}
