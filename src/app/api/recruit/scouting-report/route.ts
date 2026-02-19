import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseClient'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
})

export async function GET(request: NextRequest) {
  const athleteId = request.nextUrl.searchParams.get('athleteId')
  if (!athleteId) {
    return NextResponse.json({ error: 'athleteId required' }, { status: 400 })
  }

  const { data: report, error } = await supabaseAdmin
    .from('scouting_reports')
    .select('*')
    .eq('athlete_id', athleteId)
    .single()

  if (error || !report) {
    return NextResponse.json({ report: null })
  }

  // Check if expired
  if (report.expires_at && new Date(report.expires_at) < new Date()) {
    return NextResponse.json({ report: null, expired: true })
  }

  return NextResponse.json({ report: report.report, generatedAt: report.generated_at, model: report.model })
}

export async function POST(request: NextRequest) {
  try {
    const { athleteId } = await request.json()
    if (!athleteId) {
      return NextResponse.json({ error: 'athleteId required' }, { status: 400 })
    }

    // Fetch athlete data
    const { data: athlete, error: athleteErr } = await supabaseAdmin
      .from('athletes')
      .select('*')
      .eq('id', athleteId)
      .single()

    if (athleteErr || !athlete) {
      return NextResponse.json({ error: 'Athlete not found' }, { status: 404 })
    }

    // Fetch coach letters for additional context
    const { data: letters } = await supabaseAdmin
      .from('coach_letters')
      .select('coach_name, school, letter_text')
      .eq('athlete_id', athleteId)

    const letterContext = letters && letters.length > 0
      ? `\n\nCoach Letters/Recommendations:\n${letters.map(l => `- ${l.coach_name} (${l.school}): "${l.letter_text}"`).join('\n')}`
      : ''

    const statsStr = athlete.stats
      ? Object.entries(athlete.stats).map(([k, v]) => `${k}: ${v}`).join(', ')
      : 'No stats provided'

    const prompt = `You are an expert college athletic recruiter and scout. Analyze this high school athlete and provide a detailed scouting report.

Athlete Profile:
- Name: ${athlete.first_name} ${athlete.last_name}
- Sport: ${athlete.sport}
- Position: ${athlete.position}
- Height: ${athlete.height || 'Not provided'}
- Weight: ${athlete.weight || 'Not provided'}
- Graduation Year: ${athlete.grad_year || 'Not provided'}
- High School: ${athlete.high_school || 'Not provided'}
- Location: ${athlete.city || ''}, ${athlete.state || ''}
- Stats: ${statsStr}
- Bio: ${athlete.bio || 'Not provided'}
- Highlight Video: ${athlete.highlight_url || 'Not provided'}${letterContext}

Based on this information, provide a scouting report in the following JSON format. Be realistic and honest in your assessment.

Division projection options (pick one):
- "D1-Major" — Power conference level (SEC, Big Ten, ACC, Big 12). If D1-Major, also assign "stars" as 3, 4, or 5.
- "D1-Mid" — Strong D1 but not power conference (Mountain West, AAC, WCC, etc.)
- "D1-Small" — Low-major D1 (Patriot, MAAC, Big South, etc.)
- "D2" — Division II programs
- "D3" — Division III programs
- "NAIA" — NAIA programs
- "JUCO" — Junior College pathway

Return ONLY valid JSON (no markdown, no code blocks):
{
  "overall_score": <number 1-100>,
  "division_projection": "<one of the options above>",
  "division_confidence": <number 0-1>,
  "stars": <null or 3-5, only for D1-Major>,
  "attributes": {
    "athleticism": { "score": <1-100>, "note": "<brief note>" },
    "skill": { "score": <1-100>, "note": "<brief note>" },
    "size": { "score": <1-100>, "note": "<brief note>" },
    "academics": { "score": <1-100>, "note": "<brief note>" },
    "leadership": { "score": <1-100>, "note": "<brief note>" }
  },
  "summary": "<2-3 sentence overview>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "development_areas": ["<area 1>", "<area 2>"],
  "coaching_notes": "<paragraph for coaches evaluating this athlete>",
  "comparable_programs": ["<school 1>", "<school 2>", "<school 3>"]
}`

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    })

    const responseText = message.content[0].type === 'text' ? message.content[0].text : ''

    // Parse the JSON response
    let report
    try {
      report = JSON.parse(responseText)
    } catch {
      // Try to extract JSON from the response if there's surrounding text
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        report = JSON.parse(jsonMatch[0])
      } else {
        return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 })
      }
    }

    // Upsert the report
    const { error: upsertErr } = await supabaseAdmin
      .from('scouting_reports')
      .upsert({
        athlete_id: athleteId,
        report,
        generated_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        model: 'claude-sonnet-4-5-20250929',
      }, { onConflict: 'athlete_id' })

    if (upsertErr) {
      console.error('Failed to save scouting report:', upsertErr)
      return NextResponse.json({ error: 'Failed to save report' }, { status: 500 })
    }

    return NextResponse.json({ report, generatedAt: new Date().toISOString() })
  } catch (error) {
    console.error('Scouting report error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate report' },
      { status: 500 }
    )
  }
}
