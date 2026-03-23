import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseClient'

// POST /api/recruit/x-engage/queue
// Queue coaches for warm-engagement-then-DM pipeline
export async function POST(request: NextRequest) {
  try {
    const { athleteId, coachXHandles, dmMessage } = await request.json()

    if (!athleteId || !coachXHandles || !Array.isArray(coachXHandles) || coachXHandles.length === 0) {
      return NextResponse.json(
        { error: 'athleteId and coachXHandles (non-empty array) are required' },
        { status: 400 }
      )
    }

    const now = new Date()
    const dmAt = new Date(now.getTime() + 72 * 60 * 60 * 1000) // 72 hours (3 days) from now

    const entries = coachXHandles.map((handle: string) => {
      const cleanHandle = handle.startsWith('@') ? handle.slice(1) : handle
      return {
        athlete_id: athleteId,
        coach_x_handle: cleanHandle,
        status: 'queued',
        engage_at: now.toISOString(),
        dm_at: dmAt.toISOString(),
        dm_message: dmMessage || null,
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      }
    })

    const { data: inserted, error: insertError } = await supabaseAdmin
      .from('x_engagement_queue')
      .insert(entries)
      .select()

    if (insertError) {
      console.error('Failed to queue engagements:', insertError)
      return NextResponse.json(
        { error: `Failed to queue engagements: ${insertError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      queued: inserted?.length || 0,
      entries: inserted,
      engageAt: now.toISOString(),
      dmAt: dmAt.toISOString(),
    })
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : 'Failed to queue engagements'
    console.error('Queue error:', err)
    return NextResponse.json(
      { error: errMsg },
      { status: 500 }
    )
  }
}

// GET /api/recruit/x-engage/queue?athleteId=xxx
// Returns current queue status for an athlete
export async function GET(request: NextRequest) {
  const athleteId = request.nextUrl.searchParams.get('athleteId')

  if (!athleteId) {
    return NextResponse.json(
      { error: 'athleteId is required' },
      { status: 400 }
    )
  }

  const { data: queue, error } = await supabaseAdmin
    .from('x_engagement_queue')
    .select('*')
    .eq('athlete_id', athleteId)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }

  // Summarize by status
  const summary = {
    queued: 0,
    engaged: 0,
    dm_sent: 0,
    failed: 0,
  }

  for (const entry of queue || []) {
    const status = entry.status as keyof typeof summary
    if (status in summary) {
      summary[status]++
    }
  }

  return NextResponse.json({
    success: true,
    summary,
    total: queue?.length || 0,
    entries: queue,
  })
}
