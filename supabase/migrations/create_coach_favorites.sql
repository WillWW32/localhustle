-- Coach favorites: allows athletes to star/prioritize target coaches
CREATE TABLE IF NOT EXISTS coach_favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  athlete_id UUID NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
  coach_id UUID NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(athlete_id, coach_id)
);

CREATE INDEX IF NOT EXISTS idx_coach_favorites_athlete ON coach_favorites(athlete_id);
CREATE INDEX IF NOT EXISTS idx_coach_favorites_coach ON coach_favorites(coach_id);
