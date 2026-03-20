CREATE TABLE IF NOT EXISTS email_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  resend_id TEXT NOT NULL,
  message_id UUID REFERENCES messages(id),
  event_type TEXT NOT NULL CHECK (event_type IN ('delivered', 'opened', 'clicked', 'bounced', 'failed', 'complained')),
  recipient TEXT,
  bounce_type TEXT,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_email_events_message ON email_events(message_id);
CREATE INDEX idx_email_events_resend ON email_events(resend_id);
CREATE INDEX idx_email_events_type ON email_events(event_type);
