# X OAuth 2.0 Quick Start Guide

Get X OAuth 2.0 PKCE flow up and running in 5 minutes.

## 1. Register Your App (2 minutes)

1. Go to [X Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. Create a new app (or select existing)
3. Go to **Settings** → **Authentication Settings**
4. Enable **OAuth 2.0**
5. Set **Redirect URLs** to your callback:
   - Dev: `http://localhost:3000/api/auth/x/callback`
   - Prod: `https://yourdomain.com/api/auth/x/callback`
6. Copy your **Client ID** and **Client Secret**

## 2. Set Environment Variables (1 minute)

Create `.env.local` in project root:

```env
X_CLIENT_ID=paste_your_client_id
X_CLIENT_SECRET=paste_your_client_secret
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

## 3. Create Database Tables (1 minute)

Run in Supabase SQL editor:

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

ALTER TABLE athletes ADD COLUMN x_handle TEXT UNIQUE;
ALTER TABLE athletes ADD COLUMN x_profile_url TEXT;
```

## 4. Add UI Component (1 minute)

In your athlete profile page:

```typescript
import { XOAuthButton } from '@/components/x-oauth-button';

export default function AthleteProfile({ athlete }) {
  return (
    <div>
      <h1>{athlete.name}</h1>
      <XOAuthButton
        athleteId={athlete.id}
        onConnected={() => {
          // Refresh page or show success message
          window.location.reload();
        }}
        onError={(error) => {
          // Show error toast
          console.error('OAuth error:', error);
        }}
      />
    </div>
  );
}
```

## 5. Test It (Start your app and test)

```bash
npm run dev
# Visit http://localhost:3000
# Click "Connect X Account"
# Complete authorization on X
# Should redirect back with tokens saved
```

## Using the Tokens

### Check if Connected

```typescript
import { isXAccountConnected } from '@/lib/x-api';

const connected = await isXAccountConnected(athleteId);
```

### Get Access Token (Auto-Refresh)

```typescript
import { getValidXAccessToken } from '@/lib/x-api';

const token = await getValidXAccessToken(athleteId);
// Use token for X API calls
```

### Get User Info

```typescript
import { getXUserInfo } from '@/lib/x-api';

const userInfo = await getXUserInfo(athleteId);
// { id, username, connectedAt, lastUpdated }
```

### Disconnect Account

```typescript
import { revokeXOAuthAccess } from '@/lib/x-api';

await revokeXOAuthAccess(athleteId);
// Clears tokens and X fields from athlete record
```

## Making X API Calls

```typescript
import { getValidXAccessToken } from '@/lib/x-api';

const token = await getValidXAccessToken(athleteId);

// Example: Send DM
const response = await fetch('https://api.twitter.com/2/direct_messages', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    conversation_type: 'Direct Message',
    message_data: {
      text: 'Hello from recruitment bot!',
    },
    recipient_id: 'x_user_id',
  }),
});
```

## Common Issues

### "PKCE state not found in cookie"
- User took too long (>10 minutes) - restart OAuth flow
- Cookies disabled - check browser settings
- Different domain - verify `NEXT_PUBLIC_APP_URL` matches your domain

### "State mismatch - potential CSRF attack"
- Browser cookies cleared mid-flow - restart
- Multiple tabs with different athleteIds - use single tab

### "Failed to exchange code for token"
- Check X credentials are correct
- Verify redirect URI matches exactly in X Developer Portal
- Check X app status is active

### Tokens not saving to database
- Verify Supabase connection is correct
- Check `x_oauth_tokens` table exists
- Ensure using `SUPABASE_SERVICE_ROLE_KEY` (not anon key)
- Check Supabase RLS policies

## What Gets Saved

In `x_oauth_tokens` table:
- `athlete_id` - Links to athlete
- `x_user_id` - X internal user ID
- `x_username` - X handle (e.g., "elonmusk")
- `access_token` - Short-lived token for API calls
- `refresh_token` - Long-lived token to get new access_token
- `expires_at` - When access_token expires
- `scope` - What permissions were granted

In `athletes` table:
- `x_handle` - X username
- `x_profile_url` - Link to X profile

## File Structure

```
recruitment-agent/
├── lib/
│   ├── x-oauth.ts              # Core OAuth functions
│   ├── x-api.ts                # Server-side utilities
│   ├── types/x-oauth.ts        # TypeScript types
│   ├── config/x-oauth.config.ts # Configuration
│   └── hooks/use-x-oauth.ts    # React hook
├── app/api/auth/x/
│   ├── authorize/route.ts      # Start OAuth flow
│   ├── callback/route.ts       # Handle callback
│   └── refresh/route.ts        # Refresh tokens
├── components/
│   └── x-oauth-button.tsx      # UI components
├── docs/
│   ├── X_OAUTH_SETUP.md        # Detailed setup
│   ├── X_OAUTH_TESTING.md      # Testing guide
│   └── X_OAUTH_QUICKSTART.md   # This file
└── .env.example
```

## Next: Advanced Features

- [Full Setup Guide](./X_OAUTH_SETUP.md)
- [Testing Guide](./X_OAUTH_TESTING.md)
- [Implementation Details](./X_OAUTH_IMPLEMENTATION.md)

## Support

For issues:
1. Check the error message in browser console
2. Review troubleshooting in `X_OAUTH_SETUP.md`
3. Check X Developer Portal app settings
4. Verify environment variables are set
5. Check Supabase tables exist and are accessible
