-- Create school_intel table for program-specific recruiting data
-- Used to personalize outreach emails and DMs with real program details

CREATE TABLE IF NOT EXISTS school_intel (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school TEXT NOT NULL UNIQUE,
  division TEXT,
  conference TEXT,
  recent_record TEXT,
  tournament_appearance BOOLEAN DEFAULT FALSE,
  key_departures TEXT,
  roster_needs TEXT,
  program_style TEXT,
  coach_tenure TEXT,
  fun_fact TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index on school name for fast lookups during template rendering
CREATE INDEX IF NOT EXISTS idx_school_intel_school ON school_intel (school);
