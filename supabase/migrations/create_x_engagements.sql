CREATE TABLE IF NOT EXISTS x_engagements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  athlete_id UUID NOT NULL,
  coach_id UUID,
  target_x_handle TEXT NOT NULL,
  target_x_user_id TEXT,
  action_type TEXT NOT NULL CHECK (action_type IN ('follow', 'like', 'retweet')),
  tweet_id TEXT,
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_x_engagements_athlete ON x_engagements(athlete_id);
CREATE INDEX idx_x_engagements_date ON x_engagements(created_at);
