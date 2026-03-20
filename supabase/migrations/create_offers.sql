CREATE TABLE IF NOT EXISTS offers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  athlete_id UUID NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
  coach_id UUID REFERENCES coaches(id),
  school TEXT NOT NULL,
  division TEXT,
  offer_type TEXT DEFAULT 'interest' CHECK (offer_type IN ('interest', 'preferred_walk_on', 'partial_scholarship', 'full_scholarship', 'verbal_offer', 'official_offer', 'committed')),
  scholarship_amount TEXT,
  notes TEXT,
  interest_level INT DEFAULT 3 CHECK (interest_level BETWEEN 1 AND 5), -- 1=low, 5=high (athlete's interest)
  coach_interest_level INT DEFAULT 3 CHECK (coach_interest_level BETWEEN 1 AND 5), -- coach's apparent interest
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'declined', 'committed', 'expired')),
  received_at TIMESTAMPTZ DEFAULT NOW(),
  decision_deadline TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_offers_athlete ON offers(athlete_id);
