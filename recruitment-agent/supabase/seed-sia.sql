-- ============================================
-- SEED: Josiah "Sia" Boone — Test Athlete
-- ============================================

INSERT INTO athletes (
  first_name, last_name, email, sport, position,
  height, weight, grad_year, high_school, city, state,
  stats, highlight_url, x_handle, x_profile_url,
  parent_name, parent_email, bio
) VALUES (
  'Josiah', 'Boone', 'josiah@localhustle.org', 'basketball', 'Guard/Wing',
  '6''4"', '185', 2026, 'Big Sky High School', 'Missoula', 'MT',
  '{"ppg": 19.6, "rpg": 6.8, "spg": 3.7, "mpg": 32, "description": "Athletic 3-level scorer with high efficiency numbers"}',
  'https://www.hudl.com/video/3/25464634/698cfa0a6c260ff59d273b34',
  '@Josiah_Boone26',
  'https://x.com/Josiah_Boone26',
  'WJ Boone', 'jesse@entreartists.com',
  'Josiah "Sia" Boone is a 6''4" athletic guard out of Big Sky High School in Missoula, Montana. A true 3-level scorer averaging 19.6 points, 6.8 rebounds, and 3.7 steals per game while playing 32 minutes. Elite efficiency, high motor, and a versatile defender who disrupts passing lanes. Class of 2026.'
);

-- Create his campaign
INSERT INTO campaigns (athlete_id, name, target_divisions)
SELECT id, 'Sia Boone — 2026 Recruitment Push', ARRAY['D1','D2','NAIA','JUCO']
FROM athletes WHERE email = 'josiah@localhustle.org';

-- Email template
INSERT INTO templates (campaign_id, type, name, subject, body, variables)
SELECT c.id, 'email', 'Coach Introduction',
  '{{athlete_first}} {{athlete_last}} — {{grad_year}} {{position}} | {{height}} | {{ppg}} PPG, {{rpg}} RPG, {{spg}} SPG',
  'Coach {{coach_last}},

My name is {{athlete_first}} {{athlete_last}}, a {{grad_year}} {{position}} from {{high_school}} in {{city}}, {{state}}.

I am reaching out because I am very interested in {{school}} and your basketball program. I believe my game would be a strong fit for what you are building.

Here is a quick snapshot of my season:
• {{height}}, {{weight}} — athletic, versatile guard/wing
• {{ppg}} points per game
• {{rpg}} rebounds per game
• {{spg}} steals per game
• {{mpg}} minutes per game
• 3-level scorer with high efficiency

I would love for you to check out my highlight film:
{{highlight_url}}

You can also find me on X: {{x_profile_url}}

I am a strong student and a high-character teammate. I would love the opportunity to learn more about your program and visit campus. Please feel free to contact me at {{athlete_email}} or my father, {{parent_name}}, at {{parent_email}}.

Thank you for your time, Coach. I look forward to hearing from you.

Respectfully,
{{athlete_first}} {{athlete_last}}
{{high_school}} — Class of {{grad_year}}
{{highlight_url}}',
  '["athlete_first","athlete_last","grad_year","position","height","weight","high_school","city","state","ppg","rpg","spg","mpg","highlight_url","x_profile_url","athlete_email","parent_name","parent_email","school","coach_last"]'::jsonb
FROM campaigns c
JOIN athletes a ON c.athlete_id = a.id
WHERE a.email = 'josiah@localhustle.org';

-- X DM template
INSERT INTO templates (campaign_id, type, name, subject, body, variables)
SELECT c.id, 'dm', 'Coach DM Introduction',
  NULL,
  'Coach {{coach_last}} — I''m {{athlete_first}} {{athlete_last}}, a {{grad_year}} {{position}} from {{high_school}} ({{city}}, {{state}}). {{height}}, {{ppg}} PPG / {{rpg}} RPG / {{spg}} SPG. Very interested in {{school}}. Here''s my highlight film: {{highlight_url}} Would love to connect. Thank you!',
  '["athlete_first","athlete_last","grad_year","position","height","high_school","city","state","ppg","rpg","spg","highlight_url","school","coach_last"]'::jsonb
FROM campaigns c
JOIN athletes a ON c.athlete_id = a.id
WHERE a.email = 'josiah@localhustle.org';
