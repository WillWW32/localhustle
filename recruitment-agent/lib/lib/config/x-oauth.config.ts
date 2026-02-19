/**
 * X OAuth Configuration
 */

export const X_OAUTH_CONFIG = {
  // OAuth Endpoints
  AUTHORIZATION_URL: 'https://twitter.com/i/oauth2/authorize',
  TOKEN_URL: 'https://api.twitter.com/2/oauth2/token',

  // X API Endpoints
  API_BASE_URL: 'https://api.twitter.com/2',
  USER_PROFILE_ENDPOINT: '/users/me',

  // OAuth Scopes
  // See: https://developer.twitter.com/en/docs/authentication/oauth-2-0/oauth-scopes
  SCOPES: [
    'tweet.read', // Read tweets
    'users.read', // Read user information
    'dm.read', // Read direct messages
    'dm.write', // Send direct messages
    'offline.access', // Issue refresh token for offline use
  ] as const,

  // PKCE Configuration
  PKCE: {
    // Code verifier: 43-128 characters from unreserved characters [A-Z] [a-z] [0-9] - . _ ~
    CODE_VERIFIER_LENGTH: 128,
    // Code challenge method: S256 (SHA256) or plain
    CODE_CHALLENGE_METHOD: 'S256' as const,
  },

  // Cookie Configuration
  COOKIE: {
    NAME: 'x_oauth_pkce',
    MAX_AGE: 10 * 60, // 10 minutes in seconds
    PATH: '/api/auth/x',
  },

  // Token Configuration
  TOKEN: {
    REFRESH_THRESHOLD: 5 * 60, // Refresh if token expires within 5 minutes (in seconds)
  },

  // Validation
  VALIDATION: {
    // UUID v4 pattern for athleteId
    ATHLETE_ID_REGEX:
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  },
} as const;

/**
 * Get X OAuth scope string for authorization URL
 */
export function getOAuthScopeString(): string {
  return X_OAUTH_CONFIG.SCOPES.join(' ');
}

/**
 * Validate athlete ID format
 */
export function isValidAthleteId(athleteId: unknown): athleteId is string {
  return (
    typeof athleteId === 'string' &&
    X_OAUTH_CONFIG.VALIDATION.ATHLETE_ID_REGEX.test(athleteId)
  );
}
