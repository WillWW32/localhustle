export interface CardData {
  playerName: string;
  position: string;
  jerseyNumber: string;
  school: string;
  year: string;
  sport: string;
  height: string;
  weight: string;
  hometown: string;
  stat1Label: string;
  stat1Value: string;
  stat2Label: string;
  stat2Value: string;
  stat3Label: string;
  stat3Value: string;
  stat4Label: string;
  stat4Value: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  textColor: string;
  mainPhoto: string | null;
  secondaryPhoto: string | null;
  logoImage: string | null;
  highlight1: string;
  highlight2: string;
  highlight3: string;
}

export type TemplateName = 'fleer86' | 'topps80bball' | 'donruss84' | 'topps83' | 'topps80baseball' | 'henderson80';

export const TEMPLATE_INFO: Record<TemplateName, { name: string; year: string; description: string }> = {
  fleer86: { name: "1986 Fleer", year: "1986", description: "Clean bordered action shot" },
  topps80bball: { name: "1980 Topps BBall", year: "1980", description: "Tri-panel scoring leaders" },
  donruss84: { name: "1984 Donruss", year: "1984", description: "Borderless with bold waves" },
  topps83: { name: "1983 Topps", year: "1983", description: "Dual-photo with circular inset" },
  topps80baseball: { name: "Jordan RC", year: "1986", description: "Five-band horizontal color design" },
  henderson80: { name: "1980 Henderson", year: "1980", description: "Bold banner & badge" },
};

export const SPORT_PRESETS: Record<string, { s1: string; s2: string; s3: string; s4: string }> = {
  Basketball: { s1: 'PTS/32', s2: 'REB/32', s3: 'AST/32', s4: 'FG%' },
  Baseball: { s1: 'AVG', s2: 'HR', s3: 'RBI', s4: 'OPS' },
  Football: { s1: 'Pass YDS', s2: 'TDs', s3: 'Tackles', s4: 'INT' },
  Soccer: { s1: 'Goals', s2: 'Assists', s3: 'Saves', s4: 'Mins' },
  Volleyball: { s1: 'Kills', s2: 'Aces', s3: 'Blocks', s4: 'Digs' },
  Track: { s1: '100m', s2: '200m', s3: 'Long Jump', s4: 'High Jump' },
};

export const STAT_OPTIONS: Record<string, string[]> = {
  Basketball: ['PTS/32', 'REB/32', 'AST/32', 'FG%', '3PT%', 'FT%', 'STL/GM', 'BLK/GM', 'AST/GM', 'PPG', 'RPG', 'APG', 'MPG', 'TO/GM'],
  Baseball: ['AVG', 'HR', 'RBI', 'OPS', 'ERA', 'SO', 'SB', 'OBP', 'SLG', 'WAR', 'WHIP', 'BB'],
  Football: ['Pass YDS', 'TDs', 'Tackles', 'INT', 'Rush YDS', 'Rec YDS', 'Sacks', 'QBR', 'Comp%', 'FF'],
  Soccer: ['Goals', 'Assists', 'Saves', 'Mins', 'Shots', 'Pass%', 'Tackles', 'Clean Sheets'],
  Volleyball: ['Kills', 'Aces', 'Blocks', 'Digs', 'Assists', 'Hit%', 'Errors', 'Sets'],
  Track: ['100m', '200m', 'Long Jump', 'High Jump', '400m', '800m', 'Shot Put', 'Discus', '110H'],
};

export const COLOR_PRESETS = [
  { name: 'Classic Red', p: '#cc0000', s: '#1a3a6b', a: '#f5c518' },
  { name: 'Royal Blue', p: '#003da5', s: '#c41e3a', a: '#ffd700' },
  { name: 'Forest Green', p: '#154734', s: '#f0e68c', a: '#c8a415' },
  { name: 'Purple & Gold', p: '#4b0082', s: '#ffd700', a: '#e6c200' },
  { name: 'Orange & Black', p: '#f57d1f', s: '#222222', a: '#ffffff' },
  { name: 'Maroon & White', p: '#7b1113', s: '#333333', a: '#d4a843' },
];

export const DEFAULT_CARD_DATA: CardData = {
  playerName: "",
  position: "",
  jerseyNumber: "",
  school: "",
  year: "",
  sport: "Basketball",
  height: "",
  weight: "",
  hometown: "",
  stat1Label: "PTS/32",
  stat1Value: "",
  stat2Label: "REB/32",
  stat2Value: "",
  stat3Label: "AST/32",
  stat3Value: "",
  stat4Label: "FG%",
  stat4Value: "",
  primaryColor: "#cc0000",
  secondaryColor: "#1a3a6b",
  accentColor: "#f5c518",
  textColor: "#ffffff",
  mainPhoto: null,
  secondaryPhoto: null,
  logoImage: null,
  highlight1: "",
  highlight2: "",
  highlight3: "",
};
