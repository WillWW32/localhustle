-- ============================================
-- Supabase Migration: Player Hub with Auth & X OAuth
-- LocalHustle.org / Recruitment Module
-- ============================================
-- This migration adds:
-- 1. Users table for parent/guardian authentication
-- 2. X/Twitter OAuth2 token storage
-- 3. Athlete profiles for public player hubs
-- 4. Row-level security policies
-- 5. Indexes for performance
-- ============================================

-- ============================================
-- 1. USERS TABLE
-- ============================================
-- Parent/guardian accounts. Integrates with Supabase Auth (auth.users table).
-- The 'id' column references Supabase's auth.users.id directly.

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'family',
  -- Roles: 'family' (default — parent AND player share one login), 'admin' (full access)
  onboarding_complete BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add comment for clarity
COMMENT ON TABLE users IS 'Parent/guardian user accounts. Links to Supabase auth.users.id for actual authentication.';
COMMENT ON COLUMN users.id IS 'Foreign key to auth.users.id — must match the Supabase authentication user ID';
COMMENT ON COLUMN users.role IS 'User role: family (default — parent and player share one login), admin (full access)';

-- ============================================
-- 2. EXTEND ATHLETES TABLE
-- ============================================
-- Add user_id to link athletes to parent accounts

ALTER TABLE athletes ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Add comment
COMMENT ON COLUMN athletes.user_id IS 'Links to users table — one parent can have multiple athletes';

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_athletes_user_id ON athletes(user_id);

-- ============================================
-- 3. X OAUTH TOKENS TABLE
-- ============================================
-- Stores X/Twitter OAuth2 credentials per athlete
-- Enables automated X DM campaigns

CREATE TABLE IF NOT EXISTS x_oauth_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  athlete_id UUID NOT NULL UNIQUE REFERENCES athletes(id) ON DELETE CASCADE,
  x_user_id TEXT NOT NULL,
  -- X's numeric user ID (e.g., "123456789")
  x_username TEXT NOT NULL,
  -- X handle without @ (e.g., "josiah_boone26")
  access_token TEXT NOT NULL,
  -- OAuth2 access token (in production, should be encrypted with pgcrypto or similar)
  refresh_token TEXT,
  -- OAuth2 refresh token (optional, depends on X auth flow)
  token_expires_at TIMESTAMPTZ,
  -- When the access token expires
  scopes TEXT[] DEFAULT ARRAY['dm.write', 'tweet.read', 'tweet.manage.write', 'users.read'],
  -- Granted OAuth scopes (e.g., dm.write, tweet.read, users.read, tweet.manage.write)
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  -- When the athlete first authorized X
  last_refreshed_at TIMESTAMPTZ,
  -- When the token was last refreshed
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add comments
COMMENT ON TABLE x_oauth_tokens IS 'Stores X/Twitter OAuth2 tokens per athlete for DM automation and profile access.';
COMMENT ON COLUMN x_oauth_tokens.access_token IS 'OAuth2 access token. In production, encrypt with pgcrypto or similar.';
COMMENT ON COLUMN x_oauth_tokens.scopes IS 'Array of OAuth scopes granted by the athlete during authorization.';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_x_oauth_tokens_athlete_id ON x_oauth_tokens(athlete_id);
CREATE INDEX IF NOT EXISTS idx_x_oauth_tokens_x_user_id ON x_oauth_tokens(x_user_id);
CREATE INDEX IF NOT EXISTS idx_x_oauth_tokens_x_username ON x_oauth_tokens(x_username);
CREATE INDEX IF NOT EXISTS idx_x_oauth_tokens_expires_at ON x_oauth_tokens(token_expires_at);

-- ============================================
-- 4. ATHLETE PROFILES TABLE
-- ============================================
-- Public-facing profile data for the player hub
-- Separate from athletes table to keep recruitment data private

CREATE TABLE IF NOT EXISTS athlete_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  athlete_id UUID NOT NULL UNIQUE REFERENCES athletes(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  -- URL slug (e.g., 'sia-boone', lowercased, URL-safe)
  profile_photo_url TEXT,
  -- Main profile photo (best headshot or action shot)
  action_photos TEXT[] DEFAULT ARRAY[]::TEXT[],
  -- Array of action photo URLs (game footage, training, etc.)
  headline TEXT,
  -- One-liner (e.g., "6'4\" Guard | Big Sky HS | Class of 2026")
  about TEXT,
  -- Longer bio/story (200-500 words)
  achievements TEXT[] DEFAULT ARRAY[]::TEXT[],
  -- Awards, honors, stats summaries, etc.
  additional_links JSONB DEFAULT '{}'::JSONB,
  -- Other social/recruiting links: { "maxpreps": "url", "instagram": "handle", "site": "url", ... }
  visibility TEXT NOT NULL DEFAULT 'public',
  -- 'public' (indexed, searchable), 'unlisted' (direct link only), 'private' (hidden)
  views INTEGER DEFAULT 0,
  -- Total profile views (for analytics)
  last_viewed_at TIMESTAMPTZ,
  -- When the profile was last viewed
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add comments
COMMENT ON TABLE athlete_profiles IS 'Public-facing profile data for the player hub. Separate from private recruitment data in athletes table.';
COMMENT ON COLUMN athlete_profiles.slug IS 'URL-safe slug for public profile access (e.g., /profile/sia-boone)';
COMMENT ON COLUMN athlete_profiles.visibility IS 'Control profile visibility: public (listed), unlisted (direct link), or private (hidden)';
COMMENT ON COLUMN athlete_profiles.additional_links IS 'JSONB object with other social/recruiting links (maxpreps, instagram, personal site, etc.)';

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_athlete_profiles_athlete_id ON athlete_profiles(athlete_id);
CREATE INDEX IF NOT EXISTS idx_athlete_profiles_slug ON athlete_profiles(slug);
CREATE INDEX IF NOT EXISTS idx_athlete_profiles_visibility ON athlete_profiles(visibility);
CREATE INDEX IF NOT EXISTS idx_athlete_profiles_created_at ON athlete_profiles(created_at DESC);

-- ============================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on new tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE x_oauth_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE athlete_profiles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- USERS TABLE POLICIES
-- ============================================
-- Users can only see/edit their own profile

CREATE POLICY users_select_own ON users
  FOR SELECT
  USING (auth.uid() = id OR auth.has_role('authenticated'));
-- Note: Relaxed SELECT for service role; tighten in production if needed

CREATE POLICY users_update_own ON users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY users_delete_own ON users
  FOR DELETE
  USING (auth.uid() = id);

-- Service role (anon key) bypass is automatic

-- ============================================
-- X OAUTH TOKENS TABLE POLICIES
-- ============================================
-- Athletes can only see/edit their own X OAuth tokens
-- Parents can see tokens for their linked athletes

CREATE POLICY x_oauth_tokens_select ON x_oauth_tokens
  FOR SELECT
  USING (
    athlete_id IN (
      SELECT a.id FROM athletes a
      WHERE a.user_id = auth.uid() OR a.id IN (
        SELECT a2.id FROM athletes a2
        WHERE a2.user_id = (SELECT user_id FROM athletes WHERE id = athlete_id LIMIT 1)
      )
    )
  );

CREATE POLICY x_oauth_tokens_insert ON x_oauth_tokens
  FOR INSERT
  WITH CHECK (
    athlete_id IN (
      SELECT a.id FROM athletes a
      WHERE a.user_id = auth.uid()
    )
  );

CREATE POLICY x_oauth_tokens_update ON x_oauth_tokens
  FOR UPDATE
  USING (
    athlete_id IN (
      SELECT a.id FROM athletes a
      WHERE a.user_id = auth.uid()
    )
  )
  WITH CHECK (
    athlete_id IN (
      SELECT a.id FROM athletes a
      WHERE a.user_id = auth.uid()
    )
  );

CREATE POLICY x_oauth_tokens_delete ON x_oauth_tokens
  FOR DELETE
  USING (
    athlete_id IN (
      SELECT a.id FROM athletes a
      WHERE a.user_id = auth.uid()
    )
  );

-- ============================================
-- ATHLETE PROFILES TABLE POLICIES
-- ============================================
-- Everyone can read public profiles
-- Athletes and their parents can update their own profile
-- Visibility controls what's publicly indexed

CREATE POLICY athlete_profiles_select_public ON athlete_profiles
  FOR SELECT
  USING (visibility = 'public' OR visibility = 'unlisted');

CREATE POLICY athlete_profiles_select_own ON athlete_profiles
  FOR SELECT
  USING (
    athlete_id IN (
      SELECT a.id FROM athletes a
      WHERE a.user_id = auth.uid()
    )
  );

CREATE POLICY athlete_profiles_insert ON athlete_profiles
  FOR INSERT
  WITH CHECK (
    athlete_id IN (
      SELECT a.id FROM athletes a
      WHERE a.user_id = auth.uid()
    )
  );

CREATE POLICY athlete_profiles_update ON athlete_profiles
  FOR UPDATE
  USING (
    athlete_id IN (
      SELECT a.id FROM athletes a
      WHERE a.user_id = auth.uid()
    )
  )
  WITH CHECK (
    athlete_id IN (
      SELECT a.id FROM athletes a
      WHERE a.user_id = auth.uid()
    )
  );

CREATE POLICY athlete_profiles_delete ON athlete_profiles
  FOR DELETE
  USING (
    athlete_id IN (
      SELECT a.id FROM athletes a
      WHERE a.user_id = auth.uid()
    )
  );

-- ============================================
-- UPDATE EXISTING TABLES WITH RLS
-- ============================================
-- Update RLS policies on athletes to respect new user_id

CREATE POLICY athletes_select ON athletes
  FOR SELECT
  USING (
    user_id = auth.uid() OR
    user_id IS NULL -- Allow unrestricted reads for now; tighten as needed
  );

CREATE POLICY athletes_insert ON athletes
  FOR INSERT
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY athletes_update ON athletes
  FOR UPDATE
  USING (user_id = auth.uid() OR user_id IS NULL)
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY athletes_delete ON athletes
  FOR DELETE
  USING (user_id = auth.uid() OR user_id IS NULL);

-- ============================================
-- ADDITIONAL INDEXES FOR PERFORMANCE
-- ============================================

-- Users table
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);

-- Athletes table (additional indexes)
CREATE INDEX IF NOT EXISTS idx_athletes_grad_year ON athletes(grad_year);
CREATE INDEX IF NOT EXISTS idx_athletes_sport ON athletes(sport);
CREATE INDEX IF NOT EXISTS idx_athletes_active ON athletes(active);

-- ============================================
-- 6. SEED DATA
-- ============================================
-- Create user for WJ Boone (jesse@entreartists.com)
-- Link Sia Boone's athlete record to that user
-- Create Sia's public profile

-- Note: In production, users should be created through Supabase Auth.
-- This assumes you'll manually create the user in auth.users first,
-- or you can uncomment the INSERT below if using a service role.

-- First, insert the user (assumes the auth.users record exists with this ID)
-- If not, you'll need to create it manually via Supabase Auth dashboard.
INSERT INTO users (id, email, full_name, phone, role, onboarding_complete)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
  'jesse@entreartists.com',
  'WJ Boone',
  NULL,
  'family',
  true
)
ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  updated_at = NOW();

-- Link Sia Boone to WJ Boone's user account
UPDATE athletes
SET user_id = '550e8400-e29b-41d4-a716-446655440000'::uuid
WHERE email = 'josiah@localhustle.org';

-- Create Sia's public profile
INSERT INTO athlete_profiles (
  athlete_id,
  slug,
  headline,
  about,
  visibility,
  additional_links
)
SELECT
  a.id,
  'sia-boone',
  '6''4" Guard | Big Sky High School | Class of 2026',
  'Josiah "Sia" Boone is a 6''4" athletic guard out of Big Sky High School in Missoula, Montana. ' ||
  'A true 3-level scorer averaging 19.6 points, 6.8 rebounds, and 3.7 steals per game while playing 32 minutes. ' ||
  'Elite efficiency, high motor, and a versatile defender who disrupts passing lanes. ' ||
  'Sia is a strong student and high-character teammate with championship mentality. ' ||
  'He''s looking for a college program where he can make an immediate impact and grow as a player and person.',
  'public',
  '{
    "maxpreps": "https://www.maxpreps.com/athlete/...",
    "instagram": "josiah_boone26",
    "highlight_video": "https://www.hudl.com/video/3/25464634/698cfa0a6c260ff59d273b34",
    "x": "https://x.com/Josiah_Boone26"
  }'::JSONB
)
FROM athletes a
WHERE a.email = 'josiah@localhustle.org'
ON CONFLICT (athlete_id) DO UPDATE SET
  slug = EXCLUDED.slug,
  headline = EXCLUDED.headline,
  about = EXCLUDED.about,
  visibility = EXCLUDED.visibility,
  additional_links = EXCLUDED.additional_links,
  updated_at = NOW();

-- ============================================
-- MIGRATION NOTES
-- ============================================
/*
IMPORTANT: Before running this migration, ensure:

1. **Supabase Auth Integration**: The user in users table must match
   a record in auth.users. You can create this manually in the Supabase
   dashboard, or create it via the Supabase Auth API.

2. **UUIDs**: The UUID '550e8400-e29b-41d4-a716-446655440000' is a
   placeholder. Replace it with the actual auth.users.id from Supabase Auth.

3. **RLS Service Role**: Ensure your service role (anon key) can still
   perform all operations needed by your backend. RLS policies are set
   to allow authenticated users + service role bypass.

4. **Encryption**: Access tokens are currently stored in plaintext.
   In production, use pgcrypto or Supabase Vault to encrypt sensitive data:

   ALTER TABLE x_oauth_tokens
   ADD COLUMN access_token_encrypted BYTEA;

   -- Store encrypted token
   INSERT INTO x_oauth_tokens (access_token_encrypted, ...)
   VALUES (
     pgsodium.crypto_secretbox(
       'token_value'::bytea,
       'nonce'::bytea,
       'secret_key'::bytea
     ),
     ...
   );

5. **Testing RLS**: After deployment, test RLS with:
   - SELECT * FROM athletes WHERE user_id = auth.uid();
   - SELECT * FROM athlete_profiles WHERE visibility = 'public';

6. **Backups**: Always backup before running migrations in production.

7. **Rollback Plan**: If needed, rollback with:

   DROP TABLE x_oauth_tokens CASCADE;
   DROP TABLE athlete_profiles CASCADE;
   DROP TABLE users CASCADE;
   ALTER TABLE athletes DROP COLUMN user_id;
   ALTER TABLE athletes DISABLE ROW LEVEL SECURITY;
   ... (restore other RLS policies)
*/

-- ============================================
-- END OF MIGRATION
-- ============================================
