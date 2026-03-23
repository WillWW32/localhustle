-- Seed school_intel with real 2025-26 program data for all schools in the coaches table
-- Data sourced from ESPN, Sports Reference, Big Sky Conference, Frontier Conference, NJCAA, and team sites
-- Updated March 2026

INSERT INTO school_intel (school, division, conference, recent_record, tournament_appearance, key_departures, roster_needs, program_style, coach_tenure, fun_fact, updated_at)
VALUES

-- ══════════════════════════════════════════════════════════════════════
-- BIG SKY CONFERENCE (D1)
-- ══════════════════════════════════════════════════════════════════════

('University of Montana', 'D1', 'Big Sky', '25-10', TRUE,
 'Graduated key seniors from back-to-back tourney runs',
 'Need perimeter depth and frontcourt scoring',
 'Physical half-court offense, strong defensive identity, disciplined',
 '12th year (Travis DeCuire)',
 'Missoula is Montana''s second-largest city, home of the Griz and right off the Clark Fork River',
 NOW()),

('Montana State University', 'D1', 'Big Sky', '18-13', FALSE,
 'Losing rotation pieces after 3 straight NCAA tourney bids (2022-24)',
 'Need guard depth and perimeter shooting',
 'Motion offense, physical defense, Jed Miller led team at 14.8 ppg and 41% from three',
 '5th year (Matt Logie)',
 'Bozeman is one of the fastest-growing cities in the West, 90 minutes from Yellowstone',
 NOW()),

('Eastern Washington University', 'D1', 'Big Sky', '10-22', FALSE,
 'Rebuilding after multiple losing seasons',
 'Need scoring at every position, building through transfers',
 'Up-tempo, push pace, shoot threes, high-volume offense',
 '2nd year (Dan Monson)',
 'Cheney is just 16 miles from Spokane — big-city access with small-town campus feel',
 NOW()),

('Idaho State University', 'D1', 'Big Sky', '13-20', FALSE,
 'Lost key contributors from prior .500 squad',
 'Need consistent scoring guard and rim protection',
 'Half-court oriented, defensive-minded, physical Big Sky style',
 '7th year (Ryan Looney)',
 'Pocatello sits at the crossroads of I-15 and I-86 — gateway to Sun Valley and Yellowstone',
 NOW()),

('Northern Arizona University', 'D1', 'Big Sky', '14-18', FALSE,
 'Retooling roster after middling conference finish',
 'Need frontcourt size and consistent 3-point shooting',
 'Balanced offense, motion-based sets, competitive defensive effort',
 '7th year (Shane Burcar)',
 'Flagstaff sits at 7,000 feet elevation with skiing at Snowbowl — great outdoor lifestyle',
 NOW()),

('Northern Colorado University', 'D1', 'Big Sky', '19-11', FALSE,
 'Lost key pieces from 25-10 co-championship squad in 2024-25',
 'Need to replace scoring depth, guard play',
 'High-scoring offense averaging 82+ ppg, push tempo, space the floor',
 '6th year (Steve Smiley)',
 'Greeley is an hour north of Denver — easy access to Front Range recruiting and facilities',
 NOW()),

('Portland State University', 'D1', 'Big Sky', '20-11', FALSE,
 'Terri Miller Jr. (Big Sky MVP) and key seniors graduating',
 'Need to replace All-Conference talent, frontcourt and guard scoring',
 'Physical defense, Tre-Vaughn Minott was 2x Defensive POY, balanced scoring',
 '3rd year (Jase Coburn)',
 'Portland State is in downtown Portland — the only D1 program in Oregon''s largest city',
 NOW()),

('Sacramento State University', 'D1', 'Big Sky', '12-20', FALSE,
 'Transitioning to Big West in 2026-27, roster in flux',
 'Need scoring at all positions, program rebuild under Bibby',
 'Uptempo, guard-oriented offense, Mike Bibby bringing NBA pedigree',
 '2nd year (Mike Bibby)',
 'Sacramento State is leaving Big Sky for the Big West in July 2026 — last year to recruit in conference',
 NOW()),

('Weber State University', 'D1', 'Big Sky', '16-16', FALSE,
 'Improved massively from 12-22 in 2024-25',
 'Need frontcourt depth and consistent 3-point shooting',
 'Balanced attack, improved defense, opened season with 130-point game',
 '4th year (Eric Duft)',
 'Ogden is 35 miles north of Salt Lake City with world-class skiing at Snowbasin nearby',
 NOW()),

('University of Idaho', 'D1', 'Big Sky', '21-14', TRUE,
 'Kolton Mitchell and key seniors graduating after historic tourney run',
 'Need to replace 3-point shooting (set school record with 312 threes)',
 'Three-point heavy offense, up-tempo, shoot-first mentality',
 '3rd year (Alex Pribble)',
 'Moscow, Idaho is just 8 miles from Pullman, WA (WSU) — the Palouse is a tight-knit college community',
 NOW()),

-- ══════════════════════════════════════════════════════════════════════
-- MONTANA NAIA (Frontier Conference)
-- ══════════════════════════════════════════════════════════════════════

('Montana Tech', 'NAIA', 'Frontier', '22-8', TRUE,
 'Hayden Diekhans and seniors graduating after 4 straight conf titles',
 'Need to reload scoring and defensive identity after losing all-conference talent',
 'Defensive-first, physical half-court game, 3-point shooting, beat D1 Montana in exhibition',
 '10th year (Adam Hiatt)',
 'Butte is a historic mining town — the Copper City has deep roots and passionate fans',
 NOW()),

('Carroll College', 'NAIA', 'Frontier', '19-8', TRUE,
 'Isaiah Crane (Frontier MVP, 19.6 ppg) exhausted eligibility',
 'Need to replace MVP-level guard scoring',
 'Guard-driven offense, half-court sets, competitive defensive effort',
 '8th year (Kurt Paulson)',
 'Helena is Montana''s capital city — Carroll is a Catholic liberal arts college with strong academics',
 NOW()),

('Rocky Mountain College', 'NAIA', 'Frontier', '31-4', TRUE,
 'Lost key seniors after historic 31-win season and NAIA quarterfinal run',
 'Need to replace depth after deep postseason run, frontcourt pieces',
 'Balanced scoring, clutch shooting (Omari Nesbit 60-ft buzzer beater), physical defense',
 '1st year (Danny Neville) — but returning for 2nd season',
 'Billings is Montana''s largest city — Rocky won the 2009 NAIA national championship',
 NOW()),

('University of Providence', 'NAIA', 'Frontier', '15-15', FALSE,
 'Lost Jamil Bowles and Antoine Boyd Jr. from tournament run',
 'Need scoring guards and frontcourt help',
 'Guard-oriented offense, up-tempo when possible, competitive in Frontier',
 '5th year (Steve Keller)',
 'Great Falls is central Montana — the Argos play in the McLaughlin Center on the Missouri River',
 NOW()),

('Montana State-Northern', 'NAIA', 'Frontier', '17-12', FALSE,
 'Lost tournament run contributors after Cinderella conference tourney',
 'Need to build on upset momentum, guard depth',
 'Physical, defensive-minded, pulled upsets of #2 and #3 seeds in conference tourney',
 '6th year (Shawn Huse)',
 'Havre is on the Hi-Line in north-central Montana — small-town grit and toughness',
 NOW()),

('University of Montana Western', 'NAIA', 'Frontier', '14-16', FALSE,
 'Kyle Gruhler and key seniors graduating',
 'Need scoring wings and interior depth',
 'Physical half-court play, strong home-court advantage at 7-3 home record',
 '3rd year (Pat Jensen)',
 'Dillon is a small ranching town in southwest Montana — gateway to Big Hole Valley fishing',
 NOW()),

-- ══════════════════════════════════════════════════════════════════════
-- IDAHO SCHOOLS
-- ══════════════════════════════════════════════════════════════════════

('College of Idaho', 'NAIA', 'Cascade', '21-11', TRUE,
 'Lost 6 rotation players from back-to-back national championship team',
 'Rebuilding around Samaje Morgan, need scoring and defense everywhere',
 'Up-tempo, guard-driven, championship pedigree, won NAIA titles in 2023 and 2025',
 '17th year (Jake Holzheimer) — replaced by new coach',
 'Caldwell is 30 miles west of Boise — the Yotes are the premier NAIA program in the country',
 NOW()),

('Northwest Nazarene', 'D2', 'GNAC', '18-12', FALSE,
 'Lost key pieces from 20-win D2 regional appearance squad',
 'Need perimeter shooting and inside scoring depth',
 'Disciplined half-court offense, strong 3-point shooting (56% game opener), physical defense',
 '12th year (Michael Younger)',
 'Nampa is in the Boise metro area — NNU is a private Christian university with strong community',
 NOW()),

('Lewis-Clark State', 'NAIA', 'Cascade', '20-10', FALSE,
 'Lost key seniors after conference championship and NAIA tourney trip',
 'Need guard depth and defensive consistency',
 'Elite defense (7th nationally in scoring defense at 66.9 ppg allowed), half-court grind',
 '8th year (Austin Johnson)',
 'Lewiston is at the confluence of the Snake and Clearwater rivers — lowest elevation city in Idaho',
 NOW()),

-- ══════════════════════════════════════════════════════════════════════
-- EASTERN OREGON (NAIA)
-- ══════════════════════════════════════════════════════════════════════

('Eastern Oregon', 'NAIA', 'Cascade', '18-14', TRUE,
 'Lost contributors after NAIA tournament at-large bid',
 'Need scoring depth and perimeter shooting',
 'Balanced offense, competitive in Cascade Conference, earned NAIA at-large bid',
 '5th year (Chris Walsh)',
 'La Grande is in the Blue Mountains of eastern Oregon — just 4 hours from Missoula via I-90',
 NOW()),

-- ══════════════════════════════════════════════════════════════════════
-- NORTHWEST JUCO
-- ══════════════════════════════════════════════════════════════════════

('North Idaho College', 'JUCO', 'SWAC (NJCAA)', '16-13', FALSE,
 'Returning key pieces including NJCAA scoring leader Vaughn Weems (27.9 ppg)',
 'Need defensive consistency and frontcourt rebounding',
 'High-scoring guard play, Weems led NJCAA in scoring, up-tempo attack',
 '3rd year (Corey Symons)',
 'Coeur d''Alene is one of Idaho''s most beautiful lake towns — 30 minutes from Spokane',
 NOW()),

('Dawson Community College', 'JUCO', 'Mon-Dak (NJCAA)', '27-5', TRUE,
 'Seth Amunrud (Region XIII MVP) transferred to Denver, lost key seniors',
 'Need to replace 100+ ppg scoring attack, guard and wing scoring',
 'Highest-scoring JUCO in the nation at 101.4 ppg, run-and-gun, press defense, shoot threes',
 '6th year (Joe Peterson)',
 'Glendive is in eastern Montana ranch country — Dawson is one of only two JUCOs in the state',
 NOW()),

('Flathead Valley Community College', 'JUCO', 'Mon-Dak (NJCAA)', '12-18', FALSE,
 'Rebuilding program in the Flathead Valley',
 'Need scoring and roster depth at all positions',
 'Developing program, competitive in Mon-Dak conference',
 '3rd year',
 'Kalispell is the gateway to Glacier National Park — stunning mountain campus in northwest Montana',
 NOW()),

('Miles Community College', 'JUCO', 'Mon-Dak (NJCAA)', '13-17', FALSE,
 'Returning core pieces, Azenio Cossa earned Mon-Dak Player of the Week',
 'Need consistent scoring and defensive rebounding',
 'Physical, blue-collar style, competitive in Mon-Dak',
 '4th year',
 'Miles City is in the heart of eastern Montana cattle country — home of the famous Bucking Horse Sale',
 NOW()),

('Treasure Valley Community College', 'JUCO', 'NWAC', '14-16', FALSE,
 'Roster turnover typical of 2-year program',
 'Need guards and wing scorers',
 'Up-tempo community college style, developing talent for 4-year programs',
 '5th year',
 'Ontario, Oregon is on the Idaho border — easy access to Boise-area recruiting',
 NOW()),

('Blue Mountain Community College', 'JUCO', 'NWAC', '10-18', FALSE,
 'Rebuilding roster after graduation losses',
 'Need scoring at all positions, program building',
 'Developmental program focused on preparing players for 4-year transfers',
 '4th year',
 'Pendleton, Oregon is home of the famous Pendleton Round-Up rodeo — 4 hours from Missoula',
 NOW()),

('Walla Walla Community College', 'JUCO', 'NWAC', '16-14', FALSE,
 'Typical JUCO roster turnover',
 'Need guard play and inside scoring',
 'Balanced offense, competitive in NWAC conference',
 '6th year',
 'Walla Walla is a wine country destination in southeast Washington — 5 hours from Missoula',
 NOW()),

('Spokane Community College', 'JUCO', 'NWAC', '18-12', FALSE,
 'Lost key sophomores to 4-year transfers',
 'Need to replace backcourt scoring and rebounding',
 'Fast-paced offense, strong guard development program, feeds D1 and D2 programs',
 '5th year',
 'Spokane is the largest city between Seattle and Minneapolis — great exposure for recruits',
 NOW()),

('Big Bend Community College', 'JUCO', 'NWAC', '12-16', FALSE,
 'Typical roster turnover at 2-year level',
 'Need scoring depth and athletic wings',
 'Physical style, developing talent in central Washington',
 '4th year',
 'Moses Lake is in central Washington — small town with a giant community college following',
 NOW())

-- ══════════════════════════════════════════════════════════════════════
-- ALTERNATE SCHOOL NAMES (as they appear in bigsky seed coaches table)
-- These match the exact school names used in the coaches table
-- ══════════════════════════════════════════════════════════════════════

('Idaho State University', 'D1', 'Big Sky', '13-20', FALSE,
 'Lost key contributors from prior .500 squad',
 'Need consistent scoring guard and rim protection',
 'Half-court oriented, defensive-minded, physical Big Sky style',
 '7th year (Ryan Looney)',
 'Pocatello sits at the crossroads of I-15 and I-86 — gateway to Sun Valley and Yellowstone',
 NOW())

ON CONFLICT (school) DO UPDATE SET
  division = EXCLUDED.division,
  conference = EXCLUDED.conference,
  recent_record = EXCLUDED.recent_record,
  tournament_appearance = EXCLUDED.tournament_appearance,
  key_departures = EXCLUDED.key_departures,
  roster_needs = EXCLUDED.roster_needs,
  program_style = EXCLUDED.program_style,
  coach_tenure = EXCLUDED.coach_tenure,
  fun_fact = EXCLUDED.fun_fact,
  updated_at = NOW();
