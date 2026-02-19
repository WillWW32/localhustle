import crypto from 'crypto';

const X_AUTHORIZATION_URL = 'https://twitter.com/i/oauth2/authorize';
const X_TOKEN_URL = 'https://api.twitter.com/2/oauth2/token';
const X_USER_PROFILE_URL = 'https://api.twitter.com/2/users/me';

// Scopes required for the recruitment agent
const SCOPES = ['dm.write', 'dm.read', 'tweet.read', 'users.read', 'offline.access'];

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

interface XUserProfile {
  data: {
    id: string;
    name: string;
    username: string;
  };
}

interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

/**
 * Generate PKCE code_verifier and code_challenge
 */
export function generatePKCE(): {
  codeVerifier: string;
  codeChallenge: string;
} {
  const codeVerifier = crypto
    .randomBytes(32)
    .toString('base64url')
    .replace(/[^a-zA-Z0-9_-]/g, '');

  const codeChallenge = crypto
    .createHash('sha256')
    .update(codeVerifier)
    .digest('base64url')
    .replace(/[^a-zA-Z0-9_-]/g, '');

  return {
    codeVerifier,
    codeChallenge,
  };
}

/**
 * Get the X authorization URL with PKCE
 */
export function getAuthorizationUrl(
  athleteId: string,
  codeChallenge: string,
): string {
  const config = getOAuthConfig();

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: SCOPES.join(' '),
    state: athleteId,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });

  return `${X_AUTHORIZATION_URL}?${params.toString()}`;
}

/**
 * Exchange authorization code for access token using PKCE
 */
export async function exchangeCodeForToken(
  code: string,
  codeVerifier: string,
): Promise<TokenResponse> {
  const config = getOAuthConfig();

  const response = await fetch(X_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: config.redirectUri,
      code_verifier: codeVerifier,
    }).toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to exchange code for token: ${error}`);
  }

  return response.json();
}

/**
 * Refresh an expired access token
 */
export async function refreshAccessToken(
  refreshToken: string,
): Promise<TokenResponse> {
  const config = getOAuthConfig();

  const response = await fetch(X_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: config.clientId,
      client_secret: config.clientSecret,
    }).toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to refresh access token: ${error}`);
  }

  return response.json();
}

/**
 * Fetch X user profile
 */
export async function getXUserProfile(accessToken: string): Promise<XUserProfile> {
  const response = await fetch(X_USER_PROFILE_URL, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to fetch X user profile: ${error}`);
  }

  return response.json();
}

/**
 * Get OAuth configuration from environment variables
 */
function getOAuthConfig(): OAuthConfig {
  const clientId = process.env.X_CLIENT_ID;
  const clientSecret = process.env.X_CLIENT_SECRET;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!clientId || !clientSecret || !appUrl) {
    throw new Error(
      'Missing required environment variables: X_CLIENT_ID, X_CLIENT_SECRET, NEXT_PUBLIC_APP_URL',
    );
  }

  return {
    clientId,
    clientSecret,
    redirectUri: `${appUrl}/api/auth/x/callback`,
  };
}
