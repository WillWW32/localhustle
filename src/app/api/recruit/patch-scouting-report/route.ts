import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseClient'

// One-off: fix incorrect FG%/3PT% stats in Josiah's scouting report
export async function POST(request: NextRequest) {
  const { athleteId } = await request.json()
  if (!athleteId) return NextResponse.json({ error: 'athleteId required' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('scouting_reports')
    .select('report')
    .eq('athlete_id', athleteId)
    .single()

  if (error || !data?.report) return NextResponse.json({ error: 'Report not found' }, { status: 404 })

  const report = data.report as Record<string, unknown>

  // Fix strengths array
  if (Array.isArray(report.strengths)) {
    report.strengths = (report.strengths as string[]).map(s =>
      s.replace(/42% from three/g, '36% from three')
       .replace(/50% FG/g, '48% FG')
       .replace(/\(42% from three, 50% FG\)/g, '(36% from three, 48% FG)')
       .replace(/\(50\/42 splits\)/g, '(48/36 splits)')
    )
  }

  // Fix attributes notes
  if (report.attributes && typeof report.attributes === 'object') {
    const attrs = report.attributes as Record<string, { score: number; note: string }>
    for (const key of Object.keys(attrs)) {
      if (attrs[key]?.note) {
        attrs[key].note = attrs[key].note
          .replace(/42% from three/g, '36% from three')
          .replace(/50% FG/g, '48% FG')
          .replace(/50\/42/g, '48/36')
          .replace(/42%/g, '36%')
          .replace(/50%/g, '48%')
      }
    }
  }

  // Fix coaching notes
  if (typeof report.coaching_notes === 'string') {
    report.coaching_notes = report.coaching_notes
      .replace(/42% three-point percentage/g, '36% three-point percentage')
      .replace(/42% from three/g, '36% from three')
      .replace(/50% overall field goal percentage/g, '48% overall field goal percentage')
      .replace(/50% FG/g, '48% FG')
      .replace(/50\/42/g, '48/36')
  }

  // Fix summary
  if (typeof report.summary === 'string') {
    report.summary = report.summary
      .replace(/42%/g, '36%')
      .replace(/50% FG/g, '48% FG')
  }

  const { error: updateErr } = await supabaseAdmin
    .from('scouting_reports')
    .update({ report })
    .eq('athlete_id', athleteId)

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
