-- Seed Northwest small-school basketball coaches
-- Montana NAIA, Idaho (all divisions), Eastern Oregon NAIA, Northwest JUCO
-- Each school gets a Head Coach and Assistant Coach placeholder entry.
-- Uses ON CONFLICT DO NOTHING to skip duplicates if run multiple times.

-- First, add sport column if it doesn't exist yet
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'coaches' AND column_name = 'sport'
  ) THEN
    ALTER TABLE coaches ADD COLUMN sport TEXT;
  END IF;
END $$;

-- ── Montana NAIA ────────────────────────────────────────────────────

INSERT INTO coaches (first_name, last_name, name, email, school, division, state, title, sport, x_handle)
VALUES
  ('Head',      'Coach', 'Head Coach - Montana Tech',               NULL, 'Montana Tech',               'NAIA', 'MT', 'Head Coach',      'basketball', NULL),
  ('Assistant', 'Coach', 'Assistant Coach - Montana Tech',           NULL, 'Montana Tech',               'NAIA', 'MT', 'Assistant Coach',  'basketball', NULL),
  ('Head',      'Coach', 'Head Coach - Carroll College',             NULL, 'Carroll College',            'NAIA', 'MT', 'Head Coach',      'basketball', NULL),
  ('Assistant', 'Coach', 'Assistant Coach - Carroll College',        NULL, 'Carroll College',            'NAIA', 'MT', 'Assistant Coach',  'basketball', NULL),
  ('Head',      'Coach', 'Head Coach - Rocky Mountain College',      NULL, 'Rocky Mountain College',     'NAIA', 'MT', 'Head Coach',      'basketball', NULL),
  ('Assistant', 'Coach', 'Assistant Coach - Rocky Mountain College',  NULL, 'Rocky Mountain College',     'NAIA', 'MT', 'Assistant Coach',  'basketball', NULL),
  ('Head',      'Coach', 'Head Coach - University of Providence',    NULL, 'University of Providence',   'NAIA', 'MT', 'Head Coach',      'basketball', NULL),
  ('Assistant', 'Coach', 'Assistant Coach - University of Providence', NULL, 'University of Providence',   'NAIA', 'MT', 'Assistant Coach',  'basketball', NULL),
  ('Head',      'Coach', 'Head Coach - Montana State-Northern',      NULL, 'Montana State-Northern',     'NAIA', 'MT', 'Head Coach',      'basketball', NULL),
  ('Assistant', 'Coach', 'Assistant Coach - Montana State-Northern',  NULL, 'Montana State-Northern',     'NAIA', 'MT', 'Assistant Coach',  'basketball', NULL),
  ('Head',      'Coach', 'Head Coach - University of Montana Western', NULL, 'University of Montana Western', 'NAIA', 'MT', 'Head Coach',  'basketball', NULL),
  ('Assistant', 'Coach', 'Assistant Coach - University of Montana Western', NULL, 'University of Montana Western', 'NAIA', 'MT', 'Assistant Coach', 'basketball', NULL)
ON CONFLICT DO NOTHING;

-- ── Idaho Schools ───────────────────────────────────────────────────

INSERT INTO coaches (first_name, last_name, name, email, school, division, state, title, sport, x_handle)
VALUES
  ('Head',      'Coach', 'Head Coach - College of Idaho',            NULL, 'College of Idaho',           'NAIA', 'ID', 'Head Coach',      'basketball', NULL),
  ('Assistant', 'Coach', 'Assistant Coach - College of Idaho',       NULL, 'College of Idaho',           'NAIA', 'ID', 'Assistant Coach',  'basketball', NULL),
  ('Head',      'Coach', 'Head Coach - Northwest Nazarene',          NULL, 'Northwest Nazarene',         'D2',   'ID', 'Head Coach',      'basketball', NULL),
  ('Assistant', 'Coach', 'Assistant Coach - Northwest Nazarene',     NULL, 'Northwest Nazarene',         'D2',   'ID', 'Assistant Coach',  'basketball', NULL),
  ('Head',      'Coach', 'Head Coach - Lewis-Clark State',           NULL, 'Lewis-Clark State',          'NAIA', 'ID', 'Head Coach',      'basketball', NULL),
  ('Assistant', 'Coach', 'Assistant Coach - Lewis-Clark State',      NULL, 'Lewis-Clark State',          'NAIA', 'ID', 'Assistant Coach',  'basketball', NULL),
  ('Head',      'Coach', 'Head Coach - Idaho State',                 NULL, 'Idaho State',                'D1',   'ID', 'Head Coach',      'basketball', NULL),
  ('Assistant', 'Coach', 'Assistant Coach - Idaho State',            NULL, 'Idaho State',                'D1',   'ID', 'Assistant Coach',  'basketball', NULL)
ON CONFLICT DO NOTHING;

-- ── Eastern Oregon (NAIA, close to NW region) ───────────────────────

INSERT INTO coaches (first_name, last_name, name, email, school, division, state, title, sport, x_handle)
VALUES
  ('Head',      'Coach', 'Head Coach - Eastern Oregon',              NULL, 'Eastern Oregon',             'NAIA', 'OR', 'Head Coach',      'basketball', NULL),
  ('Assistant', 'Coach', 'Assistant Coach - Eastern Oregon',         NULL, 'Eastern Oregon',             'NAIA', 'OR', 'Assistant Coach',  'basketball', NULL)
ON CONFLICT DO NOTHING;

-- ── Northwest JUCO (Community Colleges) ─────────────────────────────

INSERT INTO coaches (first_name, last_name, name, email, school, division, state, title, sport, x_handle)
VALUES
  ('Head',      'Coach', 'Head Coach - North Idaho College',         NULL, 'North Idaho College',        'JUCO', 'ID', 'Head Coach',      'basketball', NULL),
  ('Assistant', 'Coach', 'Assistant Coach - North Idaho College',    NULL, 'North Idaho College',        'JUCO', 'ID', 'Assistant Coach',  'basketball', NULL),
  ('Head',      'Coach', 'Head Coach - Dawson Community College',    NULL, 'Dawson Community College',   'JUCO', 'MT', 'Head Coach',      'basketball', NULL),
  ('Assistant', 'Coach', 'Assistant Coach - Dawson Community College', NULL, 'Dawson Community College',   'JUCO', 'MT', 'Assistant Coach',  'basketball', NULL),
  ('Head',      'Coach', 'Head Coach - Flathead Valley Community College', NULL, 'Flathead Valley Community College', 'JUCO', 'MT', 'Head Coach', 'basketball', NULL),
  ('Assistant', 'Coach', 'Assistant Coach - Flathead Valley Community College', NULL, 'Flathead Valley Community College', 'JUCO', 'MT', 'Assistant Coach', 'basketball', NULL),
  ('Head',      'Coach', 'Head Coach - Miles Community College',     NULL, 'Miles Community College',    'JUCO', 'MT', 'Head Coach',      'basketball', NULL),
  ('Assistant', 'Coach', 'Assistant Coach - Miles Community College', NULL, 'Miles Community College',    'JUCO', 'MT', 'Assistant Coach',  'basketball', NULL),
  ('Head',      'Coach', 'Head Coach - Treasure Valley Community College', NULL, 'Treasure Valley Community College', 'JUCO', 'OR', 'Head Coach', 'basketball', NULL),
  ('Assistant', 'Coach', 'Assistant Coach - Treasure Valley Community College', NULL, 'Treasure Valley Community College', 'JUCO', 'OR', 'Assistant Coach', 'basketball', NULL),
  ('Head',      'Coach', 'Head Coach - Blue Mountain Community College', NULL, 'Blue Mountain Community College', 'JUCO', 'OR', 'Head Coach', 'basketball', NULL),
  ('Assistant', 'Coach', 'Assistant Coach - Blue Mountain Community College', NULL, 'Blue Mountain Community College', 'JUCO', 'OR', 'Assistant Coach', 'basketball', NULL),
  ('Head',      'Coach', 'Head Coach - Walla Walla Community College', NULL, 'Walla Walla Community College', 'JUCO', 'WA', 'Head Coach', 'basketball', NULL),
  ('Assistant', 'Coach', 'Assistant Coach - Walla Walla Community College', NULL, 'Walla Walla Community College', 'JUCO', 'WA', 'Assistant Coach', 'basketball', NULL),
  ('Head',      'Coach', 'Head Coach - Spokane Community College',   NULL, 'Spokane Community College',  'JUCO', 'WA', 'Head Coach',      'basketball', NULL),
  ('Assistant', 'Coach', 'Assistant Coach - Spokane Community College', NULL, 'Spokane Community College',  'JUCO', 'WA', 'Assistant Coach',  'basketball', NULL),
  ('Head',      'Coach', 'Head Coach - Big Bend Community College',  NULL, 'Big Bend Community College', 'JUCO', 'WA', 'Head Coach',      'basketball', NULL),
  ('Assistant', 'Coach', 'Assistant Coach - Big Bend Community College', NULL, 'Big Bend Community College', 'JUCO', 'WA', 'Assistant Coach', 'basketball', NULL)
ON CONFLICT DO NOTHING;
