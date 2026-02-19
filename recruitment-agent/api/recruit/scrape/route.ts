import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

/**
 * Coach data structure from scraping
 */
interface ScrapedCoach {
  firstName?: string;
  lastName?: string;
  fullName: string;
  title: string;
  email?: string;
  phone?: string;
}

/**
 * Title keywords for identifying coach roles
 */
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

/**
 * Extract capitalized names from text
 */
function extractNames(text: string): string[] {
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

/**
 * Extract titles (coach roles) from text
 */
function extractTitles(text: string): string[] {
  const titles: string[] = [];
  for (const keyword of titleKeywords) {
    if (text.toLowerCase().includes(keyword.toLowerCase())) {
      titles.push(keyword);
    }
  }
  return titles.length > 0 ? titles : [];
}

/**
 * Extract email address from text
 */
function extractEmail(text: string): string | undefined {
  const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const match = text.match(emailPattern);
  return match ? match[0] : undefined;
}

/**
 * Extract phone number from text
 */
function extractPhone(text: string): string | undefined {
  const phonePattern = /(?:\+?1[-.]?)?\(?([0-9]{3})\)?[-.]?([0-9]{3})[-.]?([0-9]{4})/;
  const match = text.match(phonePattern);
  return match ? match[0] : undefined;
}

/**
 * Parse coaches from HTML content
 */
function parseCoaches(html: string): ScrapedCoach[] {
  const $ = cheerio.load(html);
  const coaches: ScrapedCoach[] = [];

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
          const coach: ScrapedCoach = {
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

/**
 * Parse coach patterns directly from text content
 */
function parseCoachPatternsFromText(text: string): ScrapedCoach[] {
  const coaches: ScrapedCoach[] = [];
  const lines = text.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const titles = extractTitles(line);

    if (titles.length > 0) {
      const names = extractNames(line);
      const email = extractEmail(line);
      const phone = extractPhone(line);

      if (names.length > 0 || email) {
        const coach: ScrapedCoach = {
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

/**
 * Fetch URL with timeout
 */
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

/**
 * POST /api/recruit/scrape
 * Scrapes a school athletics URL for coach information
 * Returns coaches found without saving to database
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, schoolName, division, state } = body;

    // Validate required fields
    if (!url || !schoolName) {
      return NextResponse.json(
        { error: 'url and schoolName are required' },
        { status: 400 }
      );
    }

    // Validate URL format
    let urlToScrape: string;
    try {
      urlToScrape = new URL(url).toString();
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Fetch and parse the HTML
    console.log(`[Scrape] Fetching: ${urlToScrape}`);
    const html = await fetchWithTimeout(urlToScrape, 10000);
    const coaches = parseCoaches(html);

    console.log(`[Scrape] Found ${coaches.length} coach(es) at ${schoolName}`);

    return NextResponse.json(
      {
        success: true,
        schoolName,
        division: division || null,
        state: state || null,
        url: urlToScrape,
        coachCount: coaches.length,
        coaches: coaches,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error('[Scrape] Error:', err);

    let errorMessage = 'Internal server error';
    let statusCode = 500;

    if (err instanceof Error) {
      if (err.name === 'AbortError') {
        errorMessage = 'Request timeout - URL took too long to respond';
        statusCode = 408;
      } else if (err.message.includes('HTTP')) {
        errorMessage = err.message;
        statusCode = 400;
      } else if (err.message.includes('Invalid')) {
        errorMessage = err.message;
        statusCode = 400;
      } else {
        errorMessage = err.message;
      }
    }

    return NextResponse.json(
      { error: errorMessage, success: false },
      { status: statusCode }
    );
  }
}
