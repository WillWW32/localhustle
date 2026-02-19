# X/Twitter OAuth 2.0 PKCE Flow Setup Guide

This document outlines the X OAuth 2.0 PKCE flow implementation for the recruitment agent.

## Overview

The implementation uses the **OAuth 2.0 Authorization Code Flow with PKCE** (Proof Key for Code Exchange), which is the recommended approach for public clients without a backend (or with a backend that cannot keep secrets safe). However, since we have a Next.js backend, we're using PKCE for added security.

## Architecture

### Key Components

1. **`lib/x-oauth.ts`** - Core OAuth utility functions
2. **`api/auth/x/authorize/route.ts`** - Initiates the OAuth flow
3. **`api/auth/x/callback/route.ts`** - Handles the callback from X
4. **`api/auth/x/refresh/route.ts`** - Refreshes expired access tokens

### Database Schema

You'll need to create the following tables in Supabase:

#### `x_oauth_tokens` Table
```sql
CREATE TABLE x_oauth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL REFERENCES athletes(id) ON DELETE CASCADE UNIQUE,
  x_user_id TEXT NOT NULL,
  x_username TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  scope TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_x_oauth_tokens_athlete_id ON x_oauth_tokens(athlete_id);
CREATE INDEX idx_x_oauth_tokens_x_user_id ON x_oauth_tokens(x_user_id);
```

#### Updates to `athletes` Table
```sql
ALTER TABLE athletes ADD COLUMN x_handle TEXT UNIQUE;
ALTER TABLE athletes ADD COLUMN x_profile_url TEXT;
```

## Setup Instructions

### 1. Register Your App with X Developer Portal

1. Go to [X Developer Portal](https://developer.twitter.com/en/portal/apps)
2. Create a new app (or use an existing one)
3. Go to **Settings** → **Authentication Settings**
4. Enable **OAuth 2.0**
5. Set **App Permissions** to **Read and write** (for DMs and tweets)
6. Add **Redirect URLs** (your callback URL):
   - Development: `http://localhost:3000/api/auth/x/callback`
   - Production: `https://yourdomain.com/api/auth/x/callback`

### 2. Configure Environment Variables

Create a `.env.local` file in your Next.js project root:

```env
# X/Twitter OAuth Configuration
X_CLIENT_ID=your_client_id_from_developer_portal
X_CLIENT_SECRET=your_client_secret_from_developer_portal

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

### 3. Set Up Database Tables

Run the SQL migrations above in your Supabase dashboard.

## OAuth 2.0 PKCE Flow Explanation

The flow follows these steps:

### Step 1: Authorization Request
```
GET /api/auth/x/authorize?athleteId=<uuid>
```

This endpoint:
- Generates a PKCE `code_verifier` (random 32-byte string)
- Creates a `code_challenge` by hashing the verifier with SHA-256
- Stores both values + athleteId in a secure HTTP-only cookie (expires in 10 minutes)
- Redirects to X's authorization URL with the `code_challenge`

**User Flow:**
- User clicks "Connect X" on the dashboard
- Redirected to X's login/authorization page
- User approves the requested scopes (dm.write, dm.read, tweet.read, users.read, offline.access)
- X redirects back to your callback URL with `code` and `state` (athleteId)

### Step 2: Authorization Callback
```
GET /api/auth/x/callback?code=<auth_code>&state=<athlete_id>
```

This endpoint:
- Validates the state parameter matches the stored athleteId (CSRF protection)
- Retrieves the `code_verifier` from the cookie
- Exchanges the code + verifier for tokens at X's token endpoint
- Fetches the user's X profile using the access token
- Saves tokens to the `x_oauth_tokens` table
- Updates the athlete's `x_handle` and `x_profile_url`
- Clears the PKCE cookie
- Redirects to the dashboard with `connected=true` parameter

**Database State After Callback:**
- `x_oauth_tokens` table contains encrypted access + refresh tokens
- `athletes` table updated with X handle and profile URL

### Step 3: Token Refresh (Optional)
```
POST /api/auth/x/refresh
{
  "athleteId": "<uuid>"
}
```

This endpoint:
- Takes an athleteId
- Looks up the refresh token from the database
- Exchanges the refresh token for a new access token
- Updates the database with the new tokens
- Returns the new access token to the client

## Security Features

1. **PKCE (Proof Key for Code Exchange)**
   - Prevents authorization code interception attacks
   - Uses SHA-256 challenge method (S256)

2. **State Parameter**
   - Stored as athleteId in the state parameter
   - Validated on callback to prevent CSRF attacks

3. **Secure Cookies**
   - Code verifier stored in HTTP-only cookie
   - `Secure` flag enabled in production
   - `SameSite=Lax` prevents cross-site attacks
   - 10-minute expiration

4. **Token Storage**
   - Refresh tokens should be encrypted at rest (Supabase Row Level Security)
   - Access tokens are short-lived (typically 2 hours)
   - Refresh tokens can be long-lived

## Usage Examples

### Client-Side: Initiating OAuth

```typescript
// components/x-connect-button.tsx
async function handleXConnect(athleteId: string) {
  // Redirect to authorization endpoint
  window.location.href = `/api/auth/x/authorize?athleteId=${athleteId}`;
}
```

### Client-Side: Handling Callback

```typescript
// pages/dashboard/athletes/[id].tsx
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  if (params.get('connected') === 'true') {
    toast.success('X account connected successfully!');
  }
  if (params.get('error')) {
    toast.error(`Connection failed: ${params.get('error')}`);
  }
}, []);
```

### Server-Side: Refreshing Token

```typescript
// lib/x-api.ts
async function refreshXToken(athleteId: string): Promise<string> {
  const response = await fetch('/api/auth/x/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ athleteId }),
  });

  if (!response.ok) {
    throw new Error('Failed to refresh token');
  }

  const data = await response.json();
  return data.access_token;
}
```

## Scopes Explained

The implementation requests these scopes:

- **`tweet.read`** - Read tweets from the user's feed and timeline
- **`users.read`** - Read user profile information
- **`dm.write`** - Send direct messages
- **`dm.read`** - Read direct messages
- **`offline.access`** - Issue a refresh token (allows offline access)

## Error Handling

### Common Errors

1. **"PKCE state not found in cookie"**
   - User took longer than 10 minutes before clicking through
   - Cookie was cleared or expired
   - Solution: Restart the OAuth flow

2. **"State mismatch - potential CSRF attack"**
   - The state parameter doesn't match the stored athleteId
   - May indicate a CSRF attack or cookie mismatch
   - Solution: Log the incident and deny the request

3. **"Failed to exchange code for token"**
   - Invalid authorization code
   - Code verifier doesn't match the challenge
   - Client credentials are incorrect
   - Solution: Check X Developer Portal settings and credentials

## Testing

### Manual Testing

1. Start your development server: `npm run dev`
2. Navigate to the athlete dashboard
3. Click "Connect X Account"
4. Authorize the app on X's authorization page
5. Should be redirected back with `connected=true` in the URL

### Testing Token Refresh

```bash
curl -X POST http://localhost:3000/api/auth/x/refresh \
  -H "Content-Type: application/json" \
  -d '{"athleteId": "your-athlete-id"}'
```

## Production Checklist

- [ ] Set `NEXT_PUBLIC_APP_URL` to your production domain
- [ ] Ensure `NODE_ENV=production` for secure cookies
- [ ] Add production redirect URL to X Developer Portal
- [ ] Enable Row Level Security on x_oauth_tokens table
- [ ] Set up token encryption at rest (consider Supabase Secrets)
- [ ] Monitor OAuth failure rates and logs
- [ ] Set up alerts for suspicious activity (multiple failures, unusual IP addresses)
- [ ] Test token refresh flow in production
- [ ] Implement token rotation strategy

## Troubleshooting

### Tokens Not Saving to Database

1. Verify Supabase connection string is correct
2. Check that `x_oauth_tokens` table exists
3. Ensure `SUPABASE_SERVICE_ROLE_KEY` is set (not anon key)
4. Check Supabase RLS policies aren't blocking inserts

### Callback URL Mismatch Error

1. Check that redirect URL in X Developer Portal exactly matches your callback URL
2. Include the protocol (http:// or https://)
3. Callback must be `/api/auth/x/callback`

### PKCE Cookie Issues

1. Verify cookies are enabled in the browser
2. Check browser dev tools for cookie storage
3. Ensure `sameSite=lax` is compatible with your setup

## References

- [X OAuth 2.0 Documentation](https://developer.twitter.com/en/docs/authentication/oauth-2-0)
- [PKCE RFC 7636](https://tools.ietf.org/html/rfc7636)
- [OAuth 2.0 Security Best Practices](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics)
