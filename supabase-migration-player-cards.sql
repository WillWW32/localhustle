-- Player Cards table for LocalHustle
-- Run this in Supabase SQL Editor (one-time setup)

CREATE TABLE IF NOT EXISTS player_cards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  athlete_id UUID NOT NULL,
  template TEXT NOT NULL DEFAULT 'fleer86',
  card_data JSONB NOT NULL DEFAULT '{}',
  main_photo_url TEXT,
  secondary_photo_url TEXT,
  logo_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_player_cards_athlete ON player_cards(athlete_id);

-- Row Level Security
ALTER TABLE player_cards ENABLE ROW LEVEL SECURITY;

-- Anyone can view cards (for public profiles)
CREATE POLICY "Public can view cards"
  ON player_cards FOR SELECT
  USING (true);

-- Athletes can manage their own cards
CREATE POLICY "Athletes can insert own cards"
  ON player_cards FOR INSERT
  WITH CHECK (athlete_id = auth.uid());

CREATE POLICY "Athletes can update own cards"
  ON player_cards FOR UPDATE
  USING (athlete_id = auth.uid());

CREATE POLICY "Athletes can delete own cards"
  ON player_cards FOR DELETE
  USING (athlete_id = auth.uid());
