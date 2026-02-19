# Coach Database Scraper

A TypeScript-based web scraper for college basketball coaching staff information across all divisions (D1, D2, NAIA, JUCO).

## Features

- Scrapes coaching staff from 50+ schools across multiple divisions
- Extracts: name, title, email, phone, Twitter handle
- Built-in rate limiting (1 request per 2 seconds) to be respectful of servers
- Comprehensive error handling with detailed logging
- Outputs structured JSON data
- Division breakdown and statistics
- Support for future Supabase integration

## Requirements

- Node.js 16+
- npm or yarn

## Installation

```bash
npm install
```

This installs:
- `cheerio` - HTML parsing
- `tsx` - TypeScript execution
- `typescript` - TypeScript compiler

## Usage

### Run the full scraper

```bash
npm run scrape:coaches
```

This will:
1. Load the list of schools from `schools.json`
2. Scrape each school's men's basketball staff page
3. Extract coach information (names, titles, emails, phones)
4. Generate `coaches-database.json` with full results
5. Display summary statistics

### Quick test (first 50 results)

```bash
npm run scrape:coaches:quick
```

## Configuration

### Schools List (`schools.json`)

The `schools.json` file contains the complete list of schools to scrape. Each entry includes:

```json
{
  "id": "unique-identifier",
  "name": "School Name",
  "division": "D1|D2|NAIA|JUCO",
  "conference": "Conference Name",
  "state": "ST",
  "athleticsUrl": "https://..."
}
```

To add schools:
1. Edit `schools.json`
2. Add a new object to the `schools` array
3. Run the scraper again

### Rate Limiting

The scraper respects server load with 2-second delays between requests. This can be configured in `scrape-coaches.ts`:

```typescript
const RATE_LIMIT_MS = 2000; // Adjust as needed
```

## Output

### coaches-database.json

Contains the scraping results with:
- Metadata (generation timestamp, counts)
- Per-school results:
  - School info (name, division, conference)
  - List of coaches (name, title, email, phone)
  - Scraping timestamp and error messages

### Console Summary

After scraping completes, you get:
- Total schools and coaches found
- Breakdown by division
- Top 10 schools by coach count
- List of failed scrapes with error messages

## School Coverage

Current coverage (~50 schools):

### Division 1 (D1)
- University of Montana
- Montana State University
- Boise State
- Eastern Washington
- Washington State
- University of Idaho
- University of Portland
- Gonzaga University
- University of Denver
- University of Wyoming
- Weber State
- Southern Utah
- Portland State
- University of Northern Colorado
- Sacramento State
- Plus regional mid-major programs

### Division 2 (D2)
- Montana Tech
- Carroll College
- Rocky Mountain College
- Providence College
- Montana State University-Northern
- University of Montana-Western
- Northern State University
- South Dakota School of Mines & Technology
- Central Washington University
- Saint Martin's University
- Western Washington University
- Seattle Pacific University
- Simon Fraser University
- Plus 8+ more GNAC and RMAC programs

### NAIA
- Carroll University (WI)
- Northwest University
- Pacific University
- Oregon Institute of Technology
- Corban University
- Warner Pacific University
- Southern Oregon University

### JUCO
- Multnomah University
- Clark College
- Skagit Valley College
- Wenatchee Valley College
- Columbia Gorge Community College
- Lane Community College
- Chemeketa Community College
- Seattle Central College
- Green River College

## Data Quality

### What Gets Extracted

✓ Coach names (first and last when available)
✓ Job titles (Head Coach, Assistant Coach, etc.)
✓ Email addresses (when publicly listed)
✓ Phone numbers (when publicly listed)

### Limitations

- Some schools don't list coaching staff publicly
- Email/phone may not always be available
- Different schools use different directory formats
- Dynamic/JavaScript-heavy sites may not scrape well

## Error Handling

The scraper includes:
- Request timeout handling (10 seconds per request)
- HTTP error status detection
- Network failure recovery
- Detailed error messages in output

Failed scrapes are logged with reasons:
- HTTP errors
- Timeouts
- Connection failures
- Empty/unreadable content

## Future Enhancements

- [ ] Twitter API integration for coach handles
- [ ] Supabase database export
- [ ] Incremental updates
- [ ] Email validation/verification
- [ ] Duplicate detection across multiple name formats
- [ ] School website schema parsing
- [ ] Headless browser support for dynamic sites
- [ ] Caching to avoid re-scraping

## Troubleshooting

### "Failed to fetch" errors
- Check internet connection
- Verify school URL is still valid (schools update websites)
- Try running again (temporary network issues)

### "HTTP 403" or "HTTP 429" errors
- School is blocking automated requests
- Increase `RATE_LIMIT_MS` in the script
- Consider contacting school athletics directly

### No coaches found for a school
- Directory structure doesn't match parser assumptions
- Visit the URL manually to verify it has coaching staff
- Update the parser with new selectors if needed

### Script runs very slowly
- Normal behavior due to 2-second rate limiting
- 50 schools takes ~100+ seconds minimum
- Network latency may add time

## Contributing

To improve coach data extraction:

1. Add new CSS selectors in `parseCoaches()`
2. Add new keywords in `titleKeywords` array
3. Test with specific school URLs
4. Submit improvements with test results

## License

For use in college basketball recruiting research and analysis.
