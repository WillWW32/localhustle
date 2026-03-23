-- Add reply_text and engagement_type to existing x_engagements table
ALTER TABLE x_engagements
  ADD COLUMN IF NOT EXISTS reply_text TEXT,
  ADD COLUMN IF NOT EXISTS engagement_type TEXT;

-- Update action_type check constraint to include 'reply'
ALTER TABLE x_engagements DROP CONSTRAINT IF EXISTS x_engagements_action_type_check;
ALTER TABLE x_engagements ADD CONSTRAINT x_engagements_action_type_check
  CHECK (action_type IN ('follow', 'like', 'retweet', 'reply'));

-- Engagement queue: tracks warm-then-DM pipeline
CREATE TABLE IF NOT EXISTS x_engagement_queue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  athlete_id UUID NOT NULL,
  coach_x_handle TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'engaged', 'dm_sent', 'failed')),
  engage_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  dm_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
  dm_message TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_x_engagement_queue_athlete ON x_engagement_queue(athlete_id);
CREATE INDEX idx_x_engagement_queue_status ON x_engagement_queue(status);
CREATE INDEX idx_x_engagement_queue_engage_at ON x_engagement_queue(status, engage_at);
CREATE INDEX idx_x_engagement_queue_dm_at ON x_engagement_queue(status, dm_at);
