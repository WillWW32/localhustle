import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import * as cheerio from 'cheerio';

// Types
interface Coach {
  firstName?: string;
  lastName?: string;
  fullName: string;
  title: string;
  email?: string;
  phone?: string;
  twitterHandle?: string;
}

interface SchoolResult {
  schoolId: string;
  schoolName: string;
  division: string;
  conference: string;
  state: string;
  athleticsUrl: string;
  coaches: Coach[];
  scrapedAt: string;
  error?: string;
}

interface School {
  id: string;
  name: string;
  division: string;
  conference: string;
  state: string;
  athleticsUrl: string;
}

// Setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const RATE_LIMIT_MS = 2000; // 1 request per 2 seconds
const OUTPUT_FILE = join(__dirname, 'coaches-database.json');
const SCHOOLS_FILE = join(__dirname, 'schools.json');

// Utility: Rate limiting
async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Utility: Safe fetch with timeout
async function fetchWithTimeout(
  url: string,
  timeoutMs = 10000
): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.text();
  } finally {
    clearTimeout(timeoutId);
  }
}

// Parse coaches from HTML
function parseCoaches(html: string): Coach[] {
  const $ = cheerio.load(html);
  const coaches: Coach[] = [];

  // Strategy 1: Look for staff directory tables/lists
  // Common patterns: data-role="coach", class contains "staff", "coach", "directory"
  const staffSelectors = [
    '[data-role="coach"]',
    '.staff-member',
    '.coach-profile',
    '.coach-item',
    '[class*="coach"]',
    '[class*="staff"]',
    'tr:has(td)', // Tables with rows
  ];

  for (const selector of staffSelectors) {
    $(selector).each((_, element) => {
      const $elem = $(element);
      const text = $elem.text();

      // Extract potential coach information
      const names = extractNames(text);
      const titles = extractTitles(text);
      const email = extractEmail(text);
      const phone = extractPhone(text);

      if ((names.length > 0 || email) && titles.length > 0) {
        for (const title of titles) {
          const coach: Coach = {
            fullName: names.length > 0 ? names[0] : email || 'Unknown',
            title: title,
            email: email,
            phone: phone,
          };

          // Try to parse first/last name
          if (names.length > 0) {
            const parts = names[0].split(' ');
            if (parts.length >= 2) {
              coach.firstName = parts[0];
              coach.lastName = parts.slice(1).join(' ');
            } else if (parts.length === 1) {
              coach.lastName = parts[0];
            }
          }

          coaches.push(coach);
        }
      }
    });

    if (coaches.length > 0) break;
  }

  // Strategy 2: Parse text patterns directly from page
  if (coaches.length === 0) {
    const coachPatterns = parseCoachPatternsFromText($('body').text());
    coaches.push(...coachPatterns);
  }

  // Remove duplicates
  const seen = new Set<string>();
  return coaches.filter(coach => {
    const key = `${coach.fullName}|${coach.title}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function extractNames(text: string): string[] {
  // Look for capitalized words that could be names
  const namePattern = /[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*/g;
  const matches = text.match(namePattern) || [];
  return matches
    .filter(
      name =>
        name.length > 2 &&
        !titleKeywords.some(kw => name.toLowerCase().includes(kw.toLowerCase()))
    )
    .slice(0, 1);
}

function extractTitles(text: string): string[] {
  const titles: string[] = [];
  for (const keyword of titleKeywords) {
    if (text.toLowerCase().includes(keyword.toLowerCase())) {
      titles.push(keyword);
    }
  }
  return titles.length > 0 ? titles : [];
}

function extractEmail(text: string): string | undefined {
  const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const match = text.match(emailPattern);
  return match ? match[0] : undefined;
}

function extractPhone(text: string): string | undefined {
  const phonePattern = /(?:\+?1[-.]?)?\(?([0-9]{3})\)?[-.]?([0-9]{3})[-.]?([0-9]{4})/;
  const match = text.match(phonePattern);
  return match ? match[0] : undefined;
}

function parseCoachPatternsFromText(text: string): Coach[] {
  const coaches: Coach[] = [];
  const lines = text.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const titles = extractTitles(line);

    if (titles.length > 0) {
      const names = extractNames(line);
      const email = extractEmail(line);
      const phone = extractPhone(line);

      if (names.length > 0 || email) {
        const coach: Coach = {
          fullName: names.length > 0 ? names[0] : email || 'Unknown',
          title: titles[0],
          email: email,
          phone: phone,
        };

        if (names.length > 0) {
          const parts = names[0].split(' ');
          if (parts.length >= 2) {
            coach.firstName = parts[0];
            coach.lastName = parts.slice(1).join(' ');
          } else if (parts.length === 1) {
            coach.lastName = parts[0];
          }
        }

        coaches.push(coach);
      }
    }
  }

  return coaches;
}

// Scrape Twitter handle from school Twitter account (if available)
async function scrapeTwitterHandle(schoolName: string): Promise<string | undefined> {
  try {
    // This would require Twitter API or additional scraping
    // For now, return undefined as it requires external API
    return undefined;
  } catch (error) {
    return undefined;
  }
}

// Main scraping function
async function scrapeSchool(school: School): Promise<SchoolResult> {
  const result: SchoolResult = {
    schoolId: school.id,
    schoolName: school.name,
    division: school.division,
    conference: school.conference,
    state: school.state,
    athleticsUrl: school.athleticsUrl,
    coaches: [],
    scrapedAt: new Date().toISOString(),
  };

  try {
    console.log(`Scraping ${school.name} (${school.division})...`);
    const html = await fetchWithTimeout(school.athleticsUrl);
    const coaches = parseCoaches(html);

    result.coaches = coaches;
    console.log(`  Found ${coaches.length} coach(es)`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    result.error = errorMessage;
    console.error(`  Error: ${errorMessage}`);
  }

  return result;
}

// Main execution
async function main() {
  console.log('Starting coach database scraper...\n');

  // Load schools
  const schoolsData = JSON.parse(readFileSync(SCHOOLS_FILE, 'utf-8'));
  const schools: School[] = schoolsData.schools;

  console.log(`Loaded ${schools.length} schools to scrape\n`);

  const results: SchoolResult[] = [];
  let processedCount = 0;

  for (const school of schools) {
    if (processedCount > 0) {
      await delay(RATE_LIMIT_MS);
    }

    const result = await scrapeSchool(school);
    results.push(result);
    processedCount++;

    // Progress indicator
    if (processedCount % 10 === 0) {
      console.log(`\nProgress: ${processedCount}/${schools.length} schools\n`);
    }
  }

  // Save results
  const outputData = {
    generatedAt: new Date().toISOString(),
    totalSchools: schools.length,
    successfulScrapes: results.filter(r => !r.error).length,
    failedScrapes: results.filter(r => r.error).length,
    totalCoaches: results.reduce((sum, r) => sum + r.coaches.length, 0),
    results: results,
  };

  writeFileSync(OUTPUT_FILE, JSON.stringify(outputData, null, 2));
  console.log(`\n✓ Results saved to ${OUTPUT_FILE}`);

  // Print summary
  console.log('\n=== SCRAPING SUMMARY ===');
  console.log(`Total schools: ${schools.length}`);
  console.log(`Successful: ${outputData.successfulScrapes}`);
  console.log(`Failed: ${outputData.failedScrapes}`);
  console.log(`Total coaches found: ${outputData.totalCoaches}`);

  // Show breakdown by division
  console.log('\n=== BY DIVISION ===');
  const byDivision: Record<string, number> = {};
  for (const result of results) {
    const coaches = result.coaches.length;
    if (!byDivision[result.division]) {
      byDivision[result.division] = 0;
    }
    byDivision[result.division] += coaches;
  }

  for (const [division, count] of Object.entries(byDivision)) {
    console.log(`${division}: ${count} coaches`);
  }

  // Show top schools by coach count
  console.log('\n=== TOP SCHOOLS BY COACH COUNT ===');
  const topSchools = results
    .sort((a, b) => b.coaches.length - a.coaches.length)
    .slice(0, 10);

  for (const school of topSchools) {
    console.log(`${school.schoolName}: ${school.coaches.length} coaches`);
  }

  // Show schools with errors
  const failedSchools = results.filter(r => r.error);
  if (failedSchools.length > 0) {
    console.log('\n=== FAILED SCRAPES ===');
    for (const school of failedSchools.slice(0, 10)) {
      console.log(`${school.schoolName}: ${school.error}`);
    }
    if (failedSchools.length > 10) {
      console.log(`... and ${failedSchools.length - 10} more`);
    }
  }
}

// Title keywords for coach role identification
const titleKeywords = [
  'Head Coach',
  'Assistant Coach',
  'Associate Coach',
  'Assistant Strength Coach',
  'Player Development Coach',
  'Shooting Coach',
  'Recruiting Coordinator',
  'Director of Basketball Operations',
  'Director of Scouting',
  'Director of Recruiting',
  'Coach',
  'Offensive Coordinator',
  'Defensive Coordinator',
  'Development Coach',
  'Skill Development Coach',
  'Coordinator',
];

// Run
main().catch(console.error);
