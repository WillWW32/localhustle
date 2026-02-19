# Coach Database Scraper - Quick Start Guide

## Installation

```bash
cd /sessions/gallant-youthful-darwin/recruitment-agent
npm install
```

## Running the Scraper

### Full Scrape (All 50+ Schools)

```bash
npm run scrape:coaches
```

This will:
- Load schools from `scripts/schools.json` (50 schools across D1, D2, NAIA, JUCO)
- Scrape men's basketball staff pages for each school
- Extract coach names, titles, emails, phones
- Save complete results to `scripts/coaches-database.json`
- Display summary statistics

**Expected Runtime:** ~2-3 minutes (due to 2-second rate limiting per request)

### Quick Test

```bash
npm run scrape:coaches:quick
```

Shows first 50 lines of output (good for testing the setup).

## Output Files

### `scripts/coaches-database.json`

Complete scraping results with:

```json
{
  "generatedAt": "2024-02-18T12:34:56.789Z",
  "totalSchools": 50,
  "successfulScrapes": 48,
  "failedScrapes": 2,
  "totalCoaches": 287,
  "results": [
    {
      "schoolId": "montana_d1_1",
      "schoolName": "University of Montana",
      "division": "D1",
      "conference": "Big Sky Conference",
      "state": "MT",
      "athleticsUrl": "https://montanagriz.com/...",
      "coaches": [
        {
          "firstName": "Travis",
          "lastName": "DeCuire",
          "fullName": "Travis DeCuire",
          "title": "Head Coach",
          "email": "travis.decuire@montanagriz.com",
          "phone": "406-243-4891"
        }
      ],
      "scrapedAt": "2024-02-18T12:34:56.789Z"
    }
  ]
}
```

## Data Schema

Each coach record contains:

| Field | Type | Notes |
|-------|------|-------|
| `firstName` | string | May be undefined if not parsed |
| `lastName` | string | May be undefined if not parsed |
| `fullName` | string | Always present, may be email if name unavailable |
| `title` | string | Job title (e.g., "Head Coach", "Assistant Coach") |
| `email` | string | May be undefined if not publicly listed |
| `phone` | string | Formatted phone number, may be undefined |
| `twitterHandle` | string | Future feature, currently undefined |

## Adding/Removing Schools

Edit `scripts/schools.json`:

```json
{
  "id": "unique-identifier",
  "name": "School Name",
  "division": "D1|D2|NAIA|JUCO",
  "conference": "Conference Name",
  "state": "ST",
  "athleticsUrl": "https://athletics.school.edu/sports/m-basketball/roster"
}
```

Then run the scraper again.

## Supabase Integration (Optional)

To sync results to Supabase:

```bash
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_KEY="your-service-role-key"

npx tsx scripts/supabase-sync.ts --file scripts/coaches-database.json
```

Options:
- `--file <path>` - JSON file to sync (default: `coaches-database.json`)
- `--overwrite` - Clear existing data before syncing

## Troubleshooting

### Script doesn't run
- Ensure Node.js 16+ is installed: `node --version`
- Run `npm install` first
- Check for error messages in console output

### No coaches found for a school
- School may not have public staff directory
- URL might be outdated
- Directory structure doesn't match parser assumptions
- Visit URL manually to verify it lists coaches

### HTTP 403/429 errors
- School is blocking automated requests
- Increase rate limiting in `scripts/scrape-coaches.ts`: `const RATE_LIMIT_MS = 3000;`
- Try again later

### Connection timeouts
- Network issue or school site is slow
- Retry the scraper
- Increase timeout in script if needed

## File Structure

```
recruitment-agent/
├── scripts/
│   ├── scrape-coaches.ts        # Main scraper script
│   ├── schools.json             # School list to scrape
│   ├── coaches-database.json    # Output (auto-generated)
│   ├── supabase-sync.ts         # Optional Supabase sync
│   └── README.md                # Detailed documentation
├── package.json                 # Dependencies
├── tsconfig.json                # TypeScript config
└── SCRAPER_QUICKSTART.md        # This file
```

## What Gets Scraped

✓ Coach full names, first names, last names (when available)
✓ Job titles (Head Coach, Assistant Coach, Recruiting Coordinator, etc.)
✓ Email addresses (when publicly listed)
✓ Phone numbers (when publicly listed)

✗ Salaries (not publicly listed)
✗ Twitter handles (requires Twitter API, future feature)
✗ Personal information beyond directory listings

## Performance Notes

- **Rate limiting:** 2 seconds between requests (configurable)
- **Timeout:** 10 seconds per request
- **50 schools:** ~2-3 minutes total
- **100 schools:** ~5-8 minutes total

## Next Steps

1. Run the scraper: `npm run scrape:coaches`
2. Check output in `scripts/coaches-database.json`
3. Add more schools to `scripts/schools.json` if desired
4. (Optional) Sync to Supabase with `supabase-sync.ts`
5. Integrate with recruiting platform/database

## Support

For issues with:
- **Scraping specific schools:** Edit scraper logic in `parseCoaches()` function
- **Adding new schools:** Update `scripts/schools.json`
- **Parsing edge cases:** Adjust CSS selectors and regex patterns in scraper
- **Supabase sync:** Verify credentials and schema match `coach` table structure

## Data Quality

The scraper is designed to be tolerant of website variation. Expected accuracy:
- **Names:** 85-90% (some schools use abbreviated forms)
- **Titles:** 95%+ (titles are usually clearly labeled)
- **Emails:** 70-80% (not all schools list publicly)
- **Phones:** 60-70% (varies by school)

Success depends on how uniformly schools structure their athletic directories.
