import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseClient'

// ── School definitions ──────────────────────────────────────────────
interface SchoolDef {
  school: string
  division: string
  state: string
}

const MONTANA_NAIA: SchoolDef[] = [
  { school: 'Montana Tech', division: 'NAIA', state: 'MT' },
  { school: 'Carroll College', division: 'NAIA', state: 'MT' },
  { school: 'Rocky Mountain College', division: 'NAIA', state: 'MT' },
  { school: 'University of Providence', division: 'NAIA', state: 'MT' },
  { school: 'Montana State-Northern', division: 'NAIA', state: 'MT' },
  { school: 'University of Montana Western', division: 'NAIA', state: 'MT' },
]

const IDAHO_SCHOOLS: SchoolDef[] = [
  { school: 'College of Idaho', division: 'NAIA', state: 'ID' },
  { school: 'Northwest Nazarene', division: 'D2', state: 'ID' },
  { school: 'Lewis-Clark State', division: 'NAIA', state: 'ID' },
  { school: 'Idaho State', division: 'D1', state: 'ID' },
]

const EASTERN_OREGON: SchoolDef[] = [
  { school: 'Eastern Oregon', division: 'NAIA', state: 'OR' },
]

const NORTHWEST_JUCO: SchoolDef[] = [
  { school: 'North Idaho College', division: 'JUCO', state: 'ID' },
  { school: 'Dawson Community College', division: 'JUCO', state: 'MT' },
  { school: 'Flathead Valley Community College', division: 'JUCO', state: 'MT' },
  { school: 'Miles Community College', division: 'JUCO', state: 'MT' },
  { school: 'Treasure Valley Community College', division: 'JUCO', state: 'OR' },
  { school: 'Blue Mountain Community College', division: 'JUCO', state: 'OR' },
  { school: 'Walla Walla Community College', division: 'JUCO', state: 'WA' },
  { school: 'Spokane Community College', division: 'JUCO', state: 'WA' },
  { school: 'Big Bend Community College', division: 'JUCO', state: 'WA' },
]

const ALL_SCHOOLS: SchoolDef[] = [
  ...MONTANA_NAIA,
  ...IDAHO_SCHOOLS,
  ...EASTERN_OREGON,
  ...NORTHWEST_JUCO,
]

// ── Build coach rows for a given sport ──────────────────────────────
function buildCoachRows(sport: string) {
  const rows: {
    first_name: string
    last_name: string
    name: string
    email: null
    school: string
    division: string
    state: string
    title: string
    sport: string
    x_handle: null
  }[] = []

  for (const s of ALL_SCHOOLS) {
    // Head coach entry
    rows.push({
      first_name: 'Head',
      last_name: 'Coach',
      name: `Head Coach - ${s.school}`,
      email: null,
      school: s.school,
      division: s.division,
      state: s.state,
      title: 'Head Coach',
      sport,
      x_handle: null,
    })

    // Assistant coach entry
    rows.push({
      first_name: 'Assistant',
      last_name: 'Coach',
      name: `Assistant Coach - ${s.school}`,
      email: null,
      school: s.school,
      division: s.division,
      state: s.state,
      title: 'Assistant Coach',
      sport,
      x_handle: null,
    })
  }

  return rows
}

// ── POST handler ────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { athleteId, sport } = body

    if (!sport) {
      return NextResponse.json(
        { error: 'sport is required (e.g. "basketball")' },
        { status: 400 },
      )
    }

    const coachRows = buildCoachRows(sport)

    // Fetch existing coaches by school name to avoid duplicates
    const schoolNames = ALL_SCHOOLS.map(s => s.school)
    const { data: existing, error: fetchErr } = await supabaseAdmin
      .from('coaches')
      .select('school, title')
      .in('school', schoolNames)

    if (fetchErr) {
      return NextResponse.json(
        { error: `Failed to check existing coaches: ${fetchErr.message}` },
        { status: 500 },
      )
    }

    // Build a set of "school|title" keys that already exist
    const existingKeys = new Set(
      (existing || []).map((c: { school: string; title: string }) =>
        `${c.school}|${c.title}`,
      ),
    )

    // Filter to only new coaches
    const newCoaches = coachRows.filter(
      c => !existingKeys.has(`${c.school}|${c.title}`),
    )

    if (newCoaches.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'All coaches already seeded — nothing to insert.',
        inserted: 0,
        skipped: coachRows.length,
        schools: schoolNames.length,
      })
    }

    // Insert in batches of 50 to stay within Supabase limits
    const BATCH_SIZE = 50
    let totalInserted = 0
    const errors: string[] = []

    for (let i = 0; i < newCoaches.length; i += BATCH_SIZE) {
      const batch = newCoaches.slice(i, i + BATCH_SIZE)
      const { data: inserted, error: insertErr } = await supabaseAdmin
        .from('coaches')
        .insert(batch)
        .select('id, school, title')

      if (insertErr) {
        errors.push(`Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${insertErr.message}`)
      } else {
        totalInserted += (inserted || []).length
      }
    }

    return NextResponse.json({
      success: errors.length === 0,
      inserted: totalInserted,
      skipped: coachRows.length - newCoaches.length,
      total: coachRows.length,
      schools: schoolNames.length,
      errors: errors.length > 0 ? errors : undefined,
      breakdown: {
        montana_naia: MONTANA_NAIA.length,
        idaho: IDAHO_SCHOOLS.length,
        eastern_oregon: EASTERN_OREGON.length,
        northwest_juco: NORTHWEST_JUCO.length,
      },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    console.error('seed-coaches POST error:', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// ── GET handler (list seed schools) ─────────────────────────────────
export async function GET() {
  return NextResponse.json({
    schools: ALL_SCHOOLS,
    totalSchools: ALL_SCHOOLS.length,
    coachesPerSchool: 2,
    totalCoachEntries: ALL_SCHOOLS.length * 2,
    categories: {
      montana_naia: MONTANA_NAIA.map(s => s.school),
      idaho: IDAHO_SCHOOLS.map(s => s.school),
      eastern_oregon: EASTERN_OREGON.map(s => s.school),
      northwest_juco: NORTHWEST_JUCO.map(s => s.school),
    },
  })
}
