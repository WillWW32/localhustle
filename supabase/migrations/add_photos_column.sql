-- Add photos JSONB column to athletes table for photo gallery
ALTER TABLE athletes ADD COLUMN IF NOT EXISTS photos JSONB DEFAULT '[]';
