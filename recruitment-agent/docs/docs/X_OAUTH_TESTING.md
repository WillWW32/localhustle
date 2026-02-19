# X OAuth Testing Guide

This guide covers testing the X OAuth 2.0 PKCE implementation.

## Prerequisites

1. X Developer Account with an app configured
2. Local development environment running
3. Postman or curl for API testing
4. Test athlete record in the database

## Unit Tests

### Testing PKCE Generation

```typescript
// lib/__tests__/x-oauth.test.ts
import { generatePKCE } from '@/lib/x-oauth';

describe('PKCE Generation', () => {
  it('should generate valid PKCE parameters', () => {
    const { codeVerifier, codeChallenge } = generatePKCE();

    // Code verifier should be 43-128 characters
    expect(codeVerifier.length).toBeGreaterThanOrEqual(43);
    expect(codeVerifier.length).toBeLessThanOrEqual(128);

    // Code challenge should be base64url encoded
    expect(/^[A-Za-z0-9_-]+$/.test(codeChallenge)).toBe(true);

    // Each call should generate different values
    const { codeVerifier: verifier2 } = generatePKCE();
    expect(codeVerifier).not.toBe(verifier2);
  });

  it('should generate valid authorization URL', () => {
    const { codeChallenge } = generatePKCE();
    const athleteId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

    const url = getAuthorizationUrl(athleteId, codeChallenge);

    expect(url).toContain('https://twitter.com/i/oauth2/authorize');
    expect(url).toContain(`state=${athleteId}`);
    expect(url).toContain(`code_challenge=${codeChallenge}`);
    expect(url).toContain('code_challenge_method=S256');
    expect(url).toContain('response_type=code');
  });
});
```

## Integration Tests

### Testing Authorization Flow

```typescript
// app/api/auth/x/authorize/__tests__/route.test.ts
import { GET } from '@/app/api/auth/x/authorize/route';
import { NextRequest } from 'next/server';

describe('Authorization Endpoint', () => {
  it('should return 400 for missing athleteId', async () => {
    const request = new NextRequest(
      new URL('http://localhost:3000/api/auth/x/authorize'),
    );

    const response = await GET(request);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toContain('athleteId');
  });

  it('should return 400 for invalid athleteId format', async () => {
    const request = new NextRequest(
      new URL('http://localhost:3000/api/auth/x/authorize?athleteId=invalid'),
    );

    const response = await GET(request);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toContain('Invalid');
  });

  it('should redirect to X authorization URL with valid athleteId', async () => {
    const athleteId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
    const request = new NextRequest(
      new URL(
        `http://localhost:3000/api/auth/x/authorize?athleteId=${athleteId}`,
      ),
    );

    const response = await GET(request);
    expect(response.status).toBe(307); // Redirect

    const redirectUrl = response.headers.get('location');
    expect(redirectUrl).toContain('twitter.com/i/oauth2/authorize');
    expect(redirectUrl).toContain(`state=${athleteId}`);

    // Check cookie was set
    const cookieHeader = response.headers.get('set-cookie');
    expect(cookieHeader).toContain('x_oauth_pkce');
    expect(cookieHeader).toContain('HttpOnly');
  });
});
```

### Testing Callback Flow

```typescript
// app/api/auth/x/callback/__tests__/route.test.ts
import { GET } from '@/app/api/auth/x/callback/route';
import { NextRequest } from 'next/server';

describe('Callback Endpoint', () => {
  beforeEach(() => {
    // Mock environment variables
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
  });

  it('should return 400 for missing code parameter', async () => {
    const request = new NextRequest(
      new URL('http://localhost:3000/api/auth/x/callback'),
    );

    const response = await GET(request);
    expect(response.status).toBe(400);
  });

  it('should return 400 for state mismatch', async () => {
    const athleteId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
    const storedAthleteId = '12345678-1234-1234-1234-123456789012';

    // Create request with mismatched state
    const url = new URL('http://localhost:3000/api/auth/x/callback');
    url.searchParams.set('code', 'test-code');
    url.searchParams.set('state', athleteId);

    const request = new NextRequest(url);

    // Set cookie with different athleteId
    const cookieValue = Buffer.from(
      `${storedAthleteId}:test-verifier`,
    ).toString('base64');
    request.cookies.set('x_oauth_pkce', cookieValue);

    const response = await GET(request);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toContain('State mismatch');
  });
});
```

## End-to-End Tests

### Manual Testing Flow

1. **Setup Test Athlete**

   ```sql
   INSERT INTO athletes (id, name, email)
   VALUES ('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'Test Athlete', 'test@example.com');
   ```

2. **Start Authorization**

   Navigate to:
   ```
   http://localhost:3000/api/auth/x/authorize?athleteId=f47ac10b-58cc-4372-a567-0e02b2c3d479
   ```

   Expected:
   - Redirected to X authorization page
   - Cookie `x_oauth_pkce` set in browser
   - State parameter contains athleteId

3. **Complete Authorization**

   - Log in with X credentials on X's page
   - Grant permissions to the app
   - Should be redirected back to callback

4. **Verify Callback**

   - Should see `?connected=true` in URL
   - Athlete record updated with `x_handle` and `x_profile_url`
   - `x_oauth_tokens` table has new record

5. **Verify Database State**

   ```sql
   -- Check tokens were saved
   SELECT * FROM x_oauth_tokens
   WHERE athlete_id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

   -- Check athlete was updated
   SELECT x_handle, x_profile_url FROM athletes
   WHERE id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
   ```

## API Testing with curl/Postman

### Test Token Refresh

```bash
# First, get the athleteId and ensure they have tokens
ATHLETE_ID="f47ac10b-58cc-4372-a567-0e02b2c3d479"

# Refresh token
curl -X POST http://localhost:3000/api/auth/x/refresh \
  -H "Content-Type: application/json" \
  -d "{\"athleteId\": \"$ATHLETE_ID\"}"

# Expected response:
# {
#   "access_token": "new_token_here",
#   "expires_in": 7200,
#   "token_type": "Bearer"
# }
```

### Test Authorization with Invalid State

```bash
curl -X GET "http://localhost:3000/api/auth/x/callback?code=invalid&state=invalid-id" \
  -H "Cookie: x_oauth_pkce=$(echo 'f47ac10b-58cc-4372-a567-0e02b2c3d479:verifier' | base64)"
```

## Performance Testing

### Load Testing Authorization Endpoint

```bash
# Using Apache Bench
ab -n 100 -c 10 \
  "http://localhost:3000/api/auth/x/authorize?athleteId=f47ac10b-58cc-4372-a567-0e02b2c3d479"

# Using wrk
wrk -t4 -c100 -d30s \
  "http://localhost:3000/api/auth/x/authorize?athleteId=f47ac10b-58cc-4372-a567-0e02b2c3d479"
```

## Security Testing

### CSRF Attack Simulation

```bash
# Attempt to use valid PKCE cookie with different state
VALID_COOKIE=$(echo 'original-athlete-id:original-verifier' | base64)
ATTACK_ATHLETE_ID="attacker-athlete-id"

curl -X GET "http://localhost:3000/api/auth/x/callback?code=stolen-code&state=$ATTACK_ATHLETE_ID" \
  -H "Cookie: x_oauth_pkce=$VALID_COOKIE"

# Should return 400 "State mismatch"
```

### Code Injection Test

Verify that authorization codes cannot be reused:

1. Complete OAuth flow successfully
2. Get the authorization code from network logs
3. Try to use it again:

   ```bash
   curl -X GET "http://localhost:3000/api/auth/x/callback?code=already-used-code&state=athlete-id"
   ```

   Expected: X API should reject with "Invalid authorization code"

## Monitoring & Debugging

### Enable Request Logging

Create a middleware to log OAuth requests:

```typescript
// lib/middleware/log-oauth-requests.ts
export function logOAuthRequests(request: NextRequest) {
  const url = new URL(request.url);
  const isOAuthEndpoint = url.pathname.includes('/api/auth/x');

  if (isOAuthEndpoint) {
    console.log('[OAuth]', {
      timestamp: new Date().toISOString(),
      method: request.method,
      path: url.pathname,
      query: Object.fromEntries(url.searchParams),
      cookies: {
        hasPKCE: !!request.cookies.get('x_oauth_pkce'),
      },
    });
  }
}
```

### Browser DevTools

1. **Network Tab**
   - Check redirect URLs
   - Verify query parameters
   - Check response headers

2. **Storage Tab**
   - View `x_oauth_pkce` cookie contents
   - Verify HttpOnly flag
   - Check expiration time

3. **Console**
   - Check for JavaScript errors
   - Log hook states
   - Monitor network requests

## Common Test Scenarios

### Scenario 1: Happy Path

- Athlete clicks "Connect X"
- Redirected to X authorization
- User grants permissions
- Redirected back with tokens saved
- Dashboard shows connected status

### Scenario 2: Expired Token Refresh

- Athlete already connected
- Token exists but is expired
- Call `/api/auth/x/refresh`
- Verify new token is valid and saved

### Scenario 3: Denied Authorization

- Athlete clicks "Connect X"
- Redirected to X authorization
- User denies permissions
- Redirected back with error
- Dashboard shows error message

### Scenario 4: Network Error During Token Exchange

- Interrupt network request to X token endpoint
- Verify callback returns appropriate error
- Verify database not updated
- Verify user can retry

### Scenario 5: Multiple Concurrent Requests

- Rapid clicks on "Connect X" button
- Verify only first request succeeds
- Verify second request shows appropriate state

## Automated Testing Script

```bash
#!/bin/bash
# test-oauth-flow.sh

ATHLETE_ID="f47ac10b-58cc-4372-a567-0e02b2c3d479"
BASE_URL="http://localhost:3000"

echo "Testing X OAuth Flow..."
echo "====================="

# Test 1: Valid Authorization Request
echo "Test 1: Valid Authorization Request"
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET \
  "$BASE_URL/api/auth/x/authorize?athleteId=$ATHLETE_ID")
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
if [ "$HTTP_CODE" = "307" ]; then
  echo "✓ Authorization endpoint returns 307 redirect"
else
  echo "✗ Authorization endpoint returned $HTTP_CODE (expected 307)"
fi

# Test 2: Invalid athleteId
echo "Test 2: Invalid athleteId"
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET \
  "$BASE_URL/api/auth/x/authorize?athleteId=invalid")
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
if [ "$HTTP_CODE" = "400" ]; then
  echo "✓ Invalid athleteId returns 400"
else
  echo "✗ Invalid athleteId returned $HTTP_CODE (expected 400)"
fi

# Test 3: Missing athleteId
echo "Test 3: Missing athleteId"
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET \
  "$BASE_URL/api/auth/x/authorize")
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
if [ "$HTTP_CODE" = "400" ]; then
  echo "✓ Missing athleteId returns 400"
else
  echo "✗ Missing athleteId returned $HTTP_CODE (expected 400)"
fi

echo ""
echo "OAuth flow tests completed!"
```

Run the script:

```bash
chmod +x test-oauth-flow.sh
./test-oauth-flow.sh
```

## Debugging Checklist

When tests fail, check:

- [ ] Environment variables are set correctly
- [ ] Supabase tables exist and are accessible
- [ ] X Developer App credentials are correct
- [ ] Redirect URI matches exactly in X Developer Portal
- [ ] Browser cookies are enabled
- [ ] Network requests aren't being blocked by CORS
- [ ] Database RLS policies allow inserts
- [ ] Token storage encryption is working (if enabled)
- [ ] System clock is synchronized (important for PKCE)
