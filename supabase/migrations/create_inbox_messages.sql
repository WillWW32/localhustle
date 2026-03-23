CREATE TABLE IF NOT EXISTS inbox_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL REFERENCES athletes(id),
  coach_id UUID REFERENCES coaches(id),
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  channel TEXT NOT NULL CHECK (channel IN ('email', 'dm')),
  from_address TEXT,
  to_address TEXT,
  subject TEXT,
  body TEXT NOT NULL,
  html_body TEXT,
  is_read BOOLEAN DEFAULT false,
  resend_email_id TEXT,
  x_message_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_inbox_athlete ON inbox_messages(athlete_id, created_at DESC);
CREATE INDEX idx_inbox_coach ON inbox_messages(coach_id);
CREATE INDEX idx_inbox_unread ON inbox_messages(athlete_id, is_read) WHERE is_read = false;
