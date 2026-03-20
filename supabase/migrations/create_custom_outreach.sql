CREATE TABLE IF NOT EXISTS custom_outreach (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  athlete_id UUID NOT NULL REFERENCES athletes(id),
  coach_id UUID NOT NULL REFERENCES coaches(id),
  campaign_id UUID REFERENCES campaigns(id),
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT DEFAULT 'queued' CHECK (status IN ('queued', 'sent', 'responded', 'stopped')),
  followup_step INT DEFAULT 0,
  last_sent_at TIMESTAMPTZ,
  next_send_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_custom_outreach_athlete ON custom_outreach(athlete_id);
CREATE INDEX idx_custom_outreach_next_send ON custom_outreach(next_send_at) WHERE status IN ('queued', 'sent');
