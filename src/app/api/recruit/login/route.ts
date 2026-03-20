import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseClient'

export async function POST(request: NextRequest) {
  const { email } = await request.json()

  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 })
  }

  const normalizedEmail = email.trim().toLowerCase()

  // 1. Check parent_email (primary account holder)
  const { data: byParent } = await supabaseAdmin
    .from('athletes')
    .select('id, first_name, last_name, sport')
    .eq('parent_email', normalizedEmail)
    .order('created_at', { ascending: false })

  // 2. Check athlete's own @localhustle.org email
  const { data: byAthleteEmail } = await supabaseAdmin
    .from('athletes')
    .select('id, first_name, last_name, sport')
    .eq('email', normalizedEmail)
    .order('created_at', { ascending: false })

  // 3. Check parent_access table (additional guardians)
  const { data: accessRecords } = await supabaseAdmin
    .from('parent_access')
    .select('athlete_id')
    .eq('email', normalizedEmail)
    .eq('status', 'active')

  let additionalAthletes: any[] = []
  if (accessRecords && accessRecords.length > 0) {
    const athleteIds = accessRecords.map((r: any) => r.athlete_id)
    const { data: byAccess } = await supabaseAdmin
      .from('athletes')
      .select('id, first_name, last_name, sport')
      .in('id', athleteIds)
    additionalAthletes = byAccess || []
  }

  // Merge all results, deduplicate by athlete ID
  const allAthletes = [...(byParent || []), ...(byAthleteEmail || []), ...additionalAthletes]
  const seen = new Set<string>()
  const unique = allAthletes.filter(a => {
    if (seen.has(a.id)) return false
    seen.add(a.id)
    return true
  })

  if (unique.length === 0) {
    return NextResponse.json({ error: 'No athlete found with this email' }, { status: 404 })
  }

  return NextResponse.json({
    athletes: unique.map(a => ({
      id: a.id,
      name: `${a.first_name} ${a.last_name}`,
      sport: a.sport,
    })),
  })
}
