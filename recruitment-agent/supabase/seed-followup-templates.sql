-- ============================================
-- SEED: Follow-Up Templates for Sia Boone's Campaign
-- ============================================

-- Follow-up template for coaches who responded positively
INSERT INTO templates (campaign_id, type, name, subject, body, variables)
SELECT c.id, 'follow_up', 'Follow-Up — Positive Response',
  'Following Up — {{athlete_first}} {{athlete_last}} | {{grad_year}} {{position}}',
  'Coach {{coach_last}},

Thank you for your response and interest. I am very excited about the opportunity at {{school}}.

I wanted to follow up and see if there are any next steps, whether that is a phone call, campus visit, or additional film you would like to see.

I have continued to work hard and improve my game. Here is my highlight film again for reference:
{{highlight_url}}

You can also find me on X: {{x_profile_url}}

Please feel free to reach out anytime. I look forward to hearing from you.

Respectfully,
{{athlete_first}} {{athlete_last}}
{{high_school}} — Class of {{grad_year}}
{{highlight_url}}',
  '["athlete_first","athlete_last","grad_year","position","height","weight","high_school","city","state","ppg","rpg","spg","mpg","highlight_url","x_profile_url","athlete_email","parent_name","parent_email","school","coach_last"]'::jsonb
FROM campaigns c
JOIN athletes a ON c.athlete_id = a.id
WHERE a.email = 'josiah@localhustle.org';

-- Follow-up template for coaches who responded neutrally
INSERT INTO templates (campaign_id, type, name, subject, body, variables)
SELECT c.id, 'follow_up', 'Follow-Up — Neutral Response',
  'Following Up — {{athlete_first}} {{athlete_last}} | {{grad_year}} {{position}}',
  'Coach {{coach_last}},

Thank you for getting back to me. I understand you have many athletes to evaluate.

I wanted to follow up and share that I am still very interested in {{school}}. I have been putting in work and believe I can contribute to your program.

Here is my updated highlight film:
{{highlight_url}}

I would love the opportunity to speak with you or visit campus. Please let me know if there is anything else I can provide.

Respectfully,
{{athlete_first}} {{athlete_last}}
{{high_school}} — Class of {{grad_year}}',
  '["athlete_first","athlete_last","grad_year","position","height","high_school","city","state","highlight_url","school","coach_last"]'::jsonb
FROM campaigns c
JOIN athletes a ON c.athlete_id = a.id
WHERE a.email = 'josiah@localhustle.org';

-- Follow-up template for coaches who did NOT respond
INSERT INTO templates (campaign_id, type, name, subject, body, variables)
SELECT c.id, 'follow_up', 'Follow-Up — No Response',
  'Following Up — {{athlete_first}} {{athlete_last}} | {{grad_year}} {{position}} | {{height}} | {{ppg}} PPG',
  'Coach {{coach_last}},

I hope this message finds you well. I reached out a few weeks ago about my interest in {{school}} and your basketball program.

I wanted to follow up in case my original email was missed. I am a {{grad_year}} {{position}} from {{high_school}} in {{city}}, {{state}} — {{height}}, averaging {{ppg}} PPG, {{rpg}} RPG, and {{spg}} SPG.

Here is my highlight film:
{{highlight_url}}

I would love to learn more about your program and what you look for in recruits. Please feel free to contact me at {{athlete_email}} or my father, {{parent_name}}, at {{parent_email}}.

Thank you for your time, Coach.

Respectfully,
{{athlete_first}} {{athlete_last}}
{{high_school}} — Class of {{grad_year}}
{{highlight_url}}',
  '["athlete_first","athlete_last","grad_year","position","height","weight","high_school","city","state","ppg","rpg","spg","mpg","highlight_url","x_profile_url","athlete_email","parent_name","parent_email","school","coach_last"]'::jsonb
FROM campaigns c
JOIN athletes a ON c.athlete_id = a.id
WHERE a.email = 'josiah@localhustle.org';
