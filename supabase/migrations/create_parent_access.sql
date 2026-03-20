-- Parent/Guardian access: allows multiple emails to log in and view an athlete's dashboard
CREATE TABLE IF NOT EXISTS parent_access (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  athlete_id UUID NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  relationship TEXT, -- 'mother', 'father', 'guardian', 'coach', 'trainer', etc.
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(athlete_id, email)
);

CREATE INDEX IF NOT EXISTS idx_parent_access_athlete ON parent_access(athlete_id);
CREATE INDEX IF NOT EXISTS idx_parent_access_email ON parent_access(email);
