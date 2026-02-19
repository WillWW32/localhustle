-- ============================================
-- RECRUITMENT AGENT — Supabase Schema
-- LocalHustle.org / Recruitment Module
-- ============================================

-- Athletes (the kids being recruited)
CREATE TABLE athletes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  sport TEXT NOT NULL DEFAULT 'basketball',
  position TEXT,
  height TEXT,
  weight TEXT,
  grad_year INTEGER NOT NULL,
  high_school TEXT,
  city TEXT,
  state TEXT,
  gpa NUMERIC(3,2),
  stats JSONB DEFAULT '{}',        -- { ppg: 19.6, rpg: 6.8, spg: 3.7, mpg: 32, ... }
  highlight_url TEXT,               -- HUDL, YouTube, etc.
  x_handle TEXT,                    -- Twitter/X handle
  x_profile_url TEXT,
  parent_name TEXT,
  parent_email TEXT,
  parent_phone TEXT,
  bio TEXT,                         -- Short player bio for email/DM personalization
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Coaches (the targets for outreach)
CREATE TABLE coaches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  x_handle TEXT,
  title TEXT,                       -- Head Coach, Assistant Coach, Recruiting Coordinator
  school TEXT NOT NULL,
  conference TEXT,
  division TEXT NOT NULL,           -- D1, D2, NAIA, JUCO
  city TEXT,
  state TEXT,
  school_url TEXT,
  athletics_url TEXT,
  roster_url TEXT,
  program_notes TEXT,               -- Anything relevant about the program
  scraped_at TIMESTAMPTZ,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Outreach campaigns (one per athlete, tracks the whole effort)
CREATE TABLE campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  athlete_id UUID REFERENCES athletes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'active',     -- active, paused, completed
  daily_email_limit INTEGER DEFAULT 100,
  daily_dm_limit INTEGER DEFAULT 100,
  email_template_id UUID,
  dm_template_id UUID,
  target_divisions TEXT[] DEFAULT ARRAY['D1','D2','NAIA','JUCO'],
  target_states TEXT[],             -- NULL = all states
  total_emails_sent INTEGER DEFAULT 0,
  total_dms_sent INTEGER DEFAULT 0,
  total_responses INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  paused_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Message templates (email and DM templates)
CREATE TABLE templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  type TEXT NOT NULL,               -- 'email' or 'dm'
  name TEXT NOT NULL,
  subject TEXT,                     -- email subject line (supports {{variables}})
  body TEXT NOT NULL,               -- body content (supports {{variables}})
  variables JSONB DEFAULT '[]',     -- list of available variables
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Individual outreach messages (every email and DM sent)
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  coach_id UUID REFERENCES coaches(id) ON DELETE SET NULL,
  athlete_id UUID REFERENCES athletes(id) ON DELETE CASCADE,
  type TEXT NOT NULL,               -- 'email' or 'dm'
  channel TEXT,                     -- 'resend' or 'x'
  to_address TEXT,                  -- email address or X handle
  subject TEXT,
  body TEXT,
  status TEXT DEFAULT 'queued',     -- queued, sent, delivered, opened, replied, bounced, failed
  resend_id TEXT,                   -- Resend message ID for tracking
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  replied_at TIMESTAMPTZ,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Responses (inbound replies from coaches)
CREATE TABLE responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  coach_id UUID REFERENCES coaches(id) ON DELETE SET NULL,
  athlete_id UUID REFERENCES athletes(id) ON DELETE CASCADE,
  type TEXT NOT NULL,               -- 'email_reply', 'dm_reply', 'inbound_email'
  from_address TEXT,
  subject TEXT,
  body TEXT,
  sentiment TEXT,                   -- 'positive', 'neutral', 'negative', 'interested'
  forwarded BOOLEAN DEFAULT false,  -- has it been forwarded to parent/athlete?
  forwarded_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily send log (tracks daily limits)
CREATE TABLE daily_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  emails_sent INTEGER DEFAULT 0,
  dms_sent INTEGER DEFAULT 0,
  emails_opened INTEGER DEFAULT 0,
  replies_received INTEGER DEFAULT 0,
  UNIQUE(campaign_id, date)
);

-- Indexes for performance
CREATE INDEX idx_coaches_division ON coaches(division);
CREATE INDEX idx_coaches_state ON coaches(state);
CREATE INDEX idx_coaches_email ON coaches(email);
CREATE INDEX idx_coaches_x_handle ON coaches(x_handle);
CREATE INDEX idx_messages_campaign ON messages(campaign_id);
CREATE INDEX idx_messages_status ON messages(status);
CREATE INDEX idx_messages_type ON messages(type);
CREATE INDEX idx_responses_campaign ON responses(campaign_id);
CREATE INDEX idx_daily_log_campaign_date ON daily_log(campaign_id, date);

-- RLS Policies (basic — expand based on auth needs)
ALTER TABLE athletes ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaches ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_log ENABLE ROW LEVEL SECURITY;
