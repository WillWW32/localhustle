-- Seed Big Sky Conference full coaching staffs with X handles
-- Updates existing coaches with handles, adds missing assistants/video coordinators

-- First update existing head coaches with X handles
UPDATE coaches SET x_handle = 'CoachDMonson' WHERE school = 'Eastern Washington University' AND title = 'Head Coach' AND x_handle IS NULL;
UPDATE coaches SET x_handle = 'coachlooneyisu' WHERE school = 'Idaho State University' AND title = 'Head Coach' AND x_handle IS NULL;
UPDATE coaches SET x_handle = 'CoachLogie' WHERE school = 'Montana State University' AND title = 'Head Coach' AND x_handle IS NULL;
UPDATE coaches SET x_handle = 'CoachDeCuire' WHERE school = 'University of Montana' AND title = 'Head Coach' AND x_handle IS NULL;
UPDATE coaches SET x_handle = 'NAUCoachBurcar' WHERE school = 'Northern Arizona University' AND title = 'Head Coach' AND x_handle IS NULL;
UPDATE coaches SET x_handle = 'coach_smiley' WHERE school = 'Northern Colorado University' AND title = 'Head Coach' AND x_handle IS NULL;
UPDATE coaches SET x_handle = 'JaseCoburn' WHERE school = 'Portland State University' AND title = 'Head Coach' AND x_handle IS NULL;
UPDATE coaches SET x_handle = 'mikebibbycom' WHERE school = 'Sacramento State University' AND title = 'Head Coach' AND x_handle IS NULL;
UPDATE coaches SET x_handle = 'ericduft' WHERE school = 'Weber State University' AND title = 'Head Coach' AND x_handle IS NULL;
UPDATE coaches SET x_handle = 'CoachPribble' WHERE school = 'University of Idaho' AND title = 'Head Coach' AND x_handle IS NULL;

-- Also handle alternate school names in DB
UPDATE coaches SET x_handle = 'CoachDMonson' WHERE school ILIKE '%Eastern Washington%' AND title = 'Head Coach' AND x_handle IS NULL;
UPDATE coaches SET x_handle = 'coachlooneyisu' WHERE school ILIKE '%Idaho State%' AND title = 'Head Coach' AND x_handle IS NULL;
UPDATE coaches SET x_handle = 'CoachLogie' WHERE school ILIKE '%Montana State%' AND title = 'Head Coach' AND first_name = 'Matt' AND x_handle IS NULL;
UPDATE coaches SET x_handle = 'CoachDeCuire' WHERE school ILIKE '%University of Montana%' AND title = 'Head Coach' AND first_name = 'Travis' AND x_handle IS NULL;
UPDATE coaches SET x_handle = 'CoachPribble' WHERE school ILIKE '%University of Idaho%' AND title = 'Head Coach' AND x_handle IS NULL;

-- ── Eastern Washington University ──────────────────────────────────
INSERT INTO coaches (first_name, last_name, name, email, school, division, state, title, sport, x_handle)
VALUES
  ('Alex',    'Hobbs',  'Alex Hobbs - Eastern Washington',  NULL, 'Eastern Washington University', 'D1', 'WA', 'Assistant Coach', 'basketball', 'Ahoopshobbs'),
  ('Chris',   'Martin', 'Chris Martin - Eastern Washington', NULL, 'Eastern Washington University', 'D1', 'WA', 'Assistant Coach', 'basketball', 'chrisdmartin_'),
  ('Richie',  'Frahm',  'Richie Frahm - Eastern Washington', NULL, 'Eastern Washington University', 'D1', 'WA', 'Special Assistant', 'basketball', NULL),
  ('Rhys',    'McVay',  'Rhys McVay - Eastern Washington',  NULL, 'Eastern Washington University', 'D1', 'WA', 'Video Coordinator', 'basketball', NULL)
ON CONFLICT DO NOTHING;

-- ── Idaho State University ─────────────────────────────────────────
INSERT INTO coaches (first_name, last_name, name, email, school, division, state, title, sport, x_handle)
VALUES
  ('Ryan',    'Looney', 'Ryan Looney - Idaho State',        NULL, 'Idaho State University', 'D1', 'ID', 'Head Coach', 'basketball', 'coachlooneyisu'),
  ('Joe',     'White',  'Joe White - Idaho State',          NULL, 'Idaho State University', 'D1', 'ID', 'Associate Head Coach', 'basketball', 'CoachWhiteISU'),
  ('Tim',     'Walsh',  'Tim Walsh - Idaho State',          NULL, 'Idaho State University', 'D1', 'ID', 'Assistant Head Coach', 'basketball', 'TimWalsh44'),
  ('Devin',   'Kastrup','Devin Kastrup - Idaho State',      NULL, 'Idaho State University', 'D1', 'ID', 'Assistant Coach', 'basketball', 'CoachDev_32')
ON CONFLICT DO NOTHING;

-- ── Montana State University ───────────────────────────────────────
INSERT INTO coaches (first_name, last_name, name, email, school, division, state, title, sport, x_handle)
VALUES
  ('Zach',    'Payne',  'Zach Payne - Montana State',       NULL, 'Montana State University', 'D1', 'MT', 'Assistant Coach', 'basketball', 'ZachRPayne'),
  ('Sam',     'Scholl', 'Sam Scholl - Montana State',       NULL, 'Montana State University', 'D1', 'MT', 'Assistant Coach', 'basketball', 'coachsamscholl'),
  ('Xavier',  'Bishop', 'Xavier Bishop - Montana State',    NULL, 'Montana State University', 'D1', 'MT', 'Assistant Coach', 'basketball', 'XaTheeGreaat5'),
  ('Shamrock','Campbell','Shamrock Campbell - Montana State',NULL, 'Montana State University', 'D1', 'MT', 'Director of Ops', 'basketball', NULL)
ON CONFLICT DO NOTHING;

-- ── University of Montana ──────────────────────────────────────────
INSERT INTO coaches (first_name, last_name, name, email, school, division, state, title, sport, x_handle)
VALUES
  ('Chris',   'Cobb',   'Chris Cobb - Montana',             NULL, 'University of Montana', 'D1', 'MT', 'Associate Head Coach', 'basketball', 'CoachCCobb'),
  ('Jay',     'Flores', 'Jay Flores - Montana',             NULL, 'University of Montana', 'D1', 'MT', 'Assistant Coach', 'basketball', 'coachflo10'),
  ('Rachi',   'Wortham','Rachi Wortham - Montana',          NULL, 'University of Montana', 'D1', 'MT', 'Assistant Coach', 'basketball', 'KoachRW'),
  ('Ryan',    'Frazer', 'Ryan Frazer - Montana',            NULL, 'University of Montana', 'D1', 'MT', 'Assistant Coach', 'basketball', NULL)
ON CONFLICT DO NOTHING;

-- ── Northern Arizona University ────────────────────────────────────
INSERT INTO coaches (first_name, last_name, name, email, school, division, state, title, sport, x_handle)
VALUES
  ('Shane',   'Burcar', 'Shane Burcar - Northern Arizona',  NULL, 'Northern Arizona University', 'D1', 'AZ', 'Head Coach', 'basketball', 'NAUCoachBurcar'),
  ('Gary',    'Bell Jr.','Gary Bell Jr. - Northern Arizona', NULL, 'Northern Arizona University', 'D1', 'AZ', 'Associate Head Coach', 'basketball', 'GaryBellJr_'),
  ('Tim',     'Russo',  'Tim Russo - Northern Arizona',     NULL, 'Northern Arizona University', 'D1', 'AZ', 'Assistant Coach', 'basketball', 'CoachTimRusso'),
  ('Jack',    'Mitchell','Jack Mitchell - Northern Arizona', NULL, 'Northern Arizona University', 'D1', 'AZ', 'Assistant Coach', 'basketball', NULL),
  ('Mitch',   'Wilson', 'Mitch Wilson - Northern Arizona',  NULL, 'Northern Arizona University', 'D1', 'AZ', 'Assistant Coach', 'basketball', NULL)
ON CONFLICT DO NOTHING;

-- ── Northern Colorado University ───────────────────────────────────
INSERT INTO coaches (first_name, last_name, name, email, school, division, state, title, sport, x_handle)
VALUES
  ('Steve',   'Smiley', 'Steve Smiley - Northern Colorado', NULL, 'Northern Colorado University', 'D1', 'CO', 'Head Coach', 'basketball', 'coach_smiley'),
  ('Dorian',  'Green',  'Dorian Green - Northern Colorado', NULL, 'Northern Colorado University', 'D1', 'CO', 'Assistant Head Coach', 'basketball', 'DorianGreen22'),
  ('Houston', 'Reed',   'Houston Reed - Northern Colorado', NULL, 'Northern Colorado University', 'D1', 'CO', 'Assistant Head Coach', 'basketball', 'coachhreed'),
  ('Brett',   'Cloepfil','Brett Cloepfil - Northern Colorado',NULL,'Northern Colorado University','D1', 'CO', 'Assistant Coach', 'basketball', 'Coach_Cloep'),
  ('Dondrale','Campbell','Dondrale Campbell - Northern Colorado',NULL,'Northern Colorado University','D1','CO','Director of Player Development','basketball','Coach_DCampbell')
ON CONFLICT DO NOTHING;

-- ── Portland State University ──────────────────────────────────────
INSERT INTO coaches (first_name, last_name, name, email, school, division, state, title, sport, x_handle)
VALUES
  ('Jase',    'Coburn', 'Jase Coburn - Portland State',    NULL, 'Portland State University', 'D1', 'OR', 'Head Coach', 'basketball', 'JaseCoburn'),
  ('Caden',   'Hoffman','Caden Hoffman - Portland State',  NULL, 'Portland State University', 'D1', 'OR', 'Assistant Coach', 'basketball', 'cadenhoffman3'),
  ('Jamaal',  'Williams','Jamaal Williams - Portland State',NULL, 'Portland State University', 'D1', 'OR', 'Assistant Coach', 'basketball', 'JWXXIV'),
  ('Gabe',    'Palmquist-Clark','Gabe Palmquist-Clark - Portland State',NULL,'Portland State University','D1','OR','Assistant Coach','basketball','_CoachPC')
ON CONFLICT DO NOTHING;

-- ── Sacramento State University ────────────────────────────────────
INSERT INTO coaches (first_name, last_name, name, email, school, division, state, title, sport, x_handle)
VALUES
  ('Mike',    'Bibby',  'Mike Bibby - Sacramento State',    NULL, 'Sacramento State University', 'D1', 'CA', 'Head Coach', 'basketball', 'mikebibbycom'),
  ('Michael', 'Bibby Jr.','Michael Bibby Jr. - Sacramento State',NULL,'Sacramento State University','D1','CA','Associate Head Coach','basketball','bibby_michael')
ON CONFLICT DO NOTHING;

-- ── Weber State University ─────────────────────────────────────────
INSERT INTO coaches (first_name, last_name, name, email, school, division, state, title, sport, x_handle)
VALUES
  ('Eric',    'Duft',   'Eric Duft - Weber State',          NULL, 'Weber State University', 'D1', 'UT', 'Head Coach', 'basketball', 'ericduft'),
  ('Dan',     'Russell','Dan Russell - Weber State',        NULL, 'Weber State University', 'D1', 'UT', 'Associate Head Coach', 'basketball', 'CoachDanRussell'),
  ('Shaun',   'Vandiver','Shaun Vandiver - Weber State',    NULL, 'Weber State University', 'D1', 'UT', 'Assistant Coach', 'basketball', 'shaun_vandiver'),
  ('Jorge',   'Ruiz',   'Jorge Ruiz - Weber State',         NULL, 'Weber State University', 'D1', 'UT', 'Assistant Coach', 'basketball', '_RuizJorge1')
ON CONFLICT DO NOTHING;

-- ── University of Idaho ────────────────────────────────────────────
INSERT INTO coaches (first_name, last_name, name, email, school, division, state, title, sport, x_handle)
VALUES
  ('Alex',    'Pribble','Alex Pribble - Idaho',             NULL, 'University of Idaho', 'D1', 'ID', 'Head Coach', 'basketball', 'CoachPribble'),
  ('Brandon', 'Laird',  'Brandon Laird - Idaho',            NULL, 'University of Idaho', 'D1', 'ID', 'Associate Head Coach', 'basketball', 'CoachBLaird'),
  ('Matt',    'Jones',  'Matt Jones - Idaho',               NULL, 'University of Idaho', 'D1', 'ID', 'Assistant Coach', 'basketball', 'MattJones2418'),
  ('Adam',    'Ellis',  'Adam Ellis - Idaho',               NULL, 'University of Idaho', 'D1', 'ID', 'Assistant Coach', 'basketball', 'CoachAEllis')
ON CONFLICT DO NOTHING;
