/**
 * Supabase Sync Module
 * Optionally sync scraped coach data to Supabase database
 *
 * Usage:
 *   npx tsx supabase-sync.ts [--file coaches-database.json] [--overwrite]
 *
 * Environment variables required:
 *   SUPABASE_URL - Your Supabase project URL
 *   SUPABASE_KEY - Your Supabase service role key
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

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

interface ScrapingOutput {
  generatedAt: string;
  totalSchools: number;
  successfulScrapes: number;
  failedScrapes: number;
  totalCoaches: number;
  results: SchoolResult[];
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class SupabaseSync {
  private supabaseUrl: string;
  private supabaseKey: string;

  constructor() {
    this.supabaseUrl = process.env.SUPABASE_URL || '';
    this.supabaseKey = process.env.SUPABASE_KEY || '';

    if (!this.supabaseUrl || !this.supabaseKey) {
      throw new Error(
        'SUPABASE_URL and SUPABASE_KEY environment variables are required'
      );
    }
  }

  async syncCoaches(
    data: ScrapingOutput,
    options: { overwrite?: boolean } = {}
  ): Promise<void> {
    console.log('Syncing coaches to Supabase...\n');

    // Flatten coaches with school info
    const coachesForSync = [];

    for (const school of data.results) {
      if (school.error) {
        console.log(`Skipping ${school.schoolName} (scraping error)`);
        continue;
      }

      for (const coach of school.coaches) {
        coachesForSync.push({
          school_id: school.schoolId,
          school_name: school.schoolName,
          division: school.division,
          conference: school.conference,
          state: school.state,
          athletics_url: school.athleticsUrl,
          coach_first_name: coach.firstName || null,
          coach_last_name: coach.lastName || null,
          coach_full_name: coach.fullName,
          coach_title: coach.title,
          coach_email: coach.email || null,
          coach_phone: coach.phone || null,
          coach_twitter: coach.twitterHandle || null,
          scraped_at: school.scrapedAt,
        });
      }
    }

    console.log(`Preparing to sync ${coachesForSync.length} coaches...\n`);

    // If overwrite flag is set, clear existing data first
    if (options.overwrite) {
      await this.clearCoaches();
    }

    // Insert coaches in batches of 100
    const batchSize = 100;
    for (let i = 0; i < coachesForSync.length; i += batchSize) {
      const batch = coachesForSync.slice(i, i + batchSize);
      await this.insertCoachesBatch(batch);
      console.log(`Synced batch ${Math.floor(i / batchSize) + 1}`);
    }

    console.log('\n✓ Sync complete!');
  }

  private async clearCoaches(): Promise<void> {
    console.log('Clearing existing coaches...');

    const response = await fetch(
      `${this.supabaseUrl}/rest/v1/coaches?on_conflict=school_id`,
      {
        method: 'DELETE',
        headers: {
          apikey: this.supabaseKey,
          Authorization: `Bearer ${this.supabaseKey}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Failed to clear coaches:', error);
    }
  }

  private async insertCoachesBatch(coaches: any[]): Promise<void> {
    const response = await fetch(`${this.supabaseUrl}/rest/v1/coaches`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: this.supabaseKey,
        Authorization: `Bearer ${this.supabaseKey}`,
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(coaches),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to insert coaches: ${error}`);
    }
  }
}

// CLI
async function main() {
  const args = process.argv.slice(2);
  let inputFile = join(__dirname, 'coaches-database.json');
  let overwrite = false;

  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--file') {
      inputFile = args[i + 1];
      i++;
    } else if (args[i] === '--overwrite') {
      overwrite = true;
    }
  }

  try {
    // Load data
    console.log(`Loading data from ${inputFile}...\n`);
    const data = JSON.parse(readFileSync(inputFile, 'utf-8'));

    // Sync to Supabase
    const sync = new SupabaseSync();
    await sync.syncCoaches(data, { overwrite });
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error:', error.message);
    } else {
      console.error('Error:', String(error));
    }
    process.exit(1);
  }
}

main().catch(console.error);
