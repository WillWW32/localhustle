CREATE TABLE IF NOT EXISTS recruit_activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  athlete_id UUID NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
  coach_id UUID REFERENCES coaches(id),
  activity_type TEXT NOT NULL CHECK (activity_type IN ('campus_visit', 'camp', 'phone_call', 'video_call', 'unofficial_visit', 'official_visit', 'combine', 'showcase', 'meeting', 'other')),
  school TEXT,
  title TEXT NOT NULL,
  description TEXT,
  activity_date TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'completed', 'cancelled')),
  outcome TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_recruit_activities_athlete ON recruit_activities(athlete_id);
CREATE INDEX idx_recruit_activities_date ON recruit_activities(activity_date);
