import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseClient'

const DAILY_DM_LIMIT = 20

// GET /api/recruit/dm/bulk?athleteId=xxx
// Returns current bulk DM campaign status for the athlete
export async function GET(request: NextRequest) {
  try {
    const athleteId = request.nextUrl.searchParams.get('athleteId')
    if (!athleteId) {
      return NextResponse.json({ error: 'athleteId is required' }, { status: 400 })
    }

    // Count DMs sent today
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const { count: sentToday } = await supabaseAdmin
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('athlete_id', athleteId)
      .eq('type', 'dm')
      .eq('channel', 'x')
      .eq('status', 'sent')
      .gte('sent_at', todayStart.toISOString())

    // Count total queued
    const { count: totalQueued } = await supabaseAdmin
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('athlete_id', athleteId)
      .eq('type', 'dm')
      .eq('channel', 'x')
      .eq('status', 'queued')

    // Count total sent (all time)
    const { count: totalSent } = await supabaseAdmin
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('athlete_id', athleteId)
      .eq('type', 'dm')
      .eq('channel', 'x')
      .eq('status', 'sent')

    return NextResponse.json({
      success: true,
      sentToday: sentToday || 0,
      dailyLimit: DAILY_DM_LIMIT,
      remainingToday: Math.max(0, DAILY_DM_LIMIT - (sentToday || 0)),
      totalQueued: totalQueued || 0,
      totalSent: totalSent || 0,
    })
  } catch (err: any) {
    console.error('Bulk DM GET error:', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}

// POST /api/recruit/dm/bulk
// Queue bulk DMs for coaches. Sends up to daily limit immediately, queues rest.
// Body: { athleteId, template, coachIds?: string[] }
export async function POST(request: NextRequest) {
  try {
    const { athleteId, template, coachIds } = await request.json()

    if (!athleteId || !template) {
      return NextResponse.json(
        { error: 'athleteId and template are required' },
        { status: 400 }
      )
    }

    // Verify athlete exists and has X connected
    const { data: athlete, error: athleteError } = await supabaseAdmin
      .from('athletes')
      .select('id, first_name, last_name, position, height, weight, high_school, grad_year, highlight_url, gpa')
      .eq('id', athleteId)
      .single()

    if (athleteError || !athlete) {
      return NextResponse.json({ error: 'Athlete not found' }, { status: 404 })
    }

    // Verify X tokens exist
    const { data: tokenRow } = await supabaseAdmin
      .from('x_oauth_tokens')
      .select('id')
      .eq('athlete_id', athleteId)
      .single()

    if (!tokenRow) {
      return NextResponse.json({ error: 'X account not connected' }, { status: 400 })
    }

    // Get target coaches
    let coachQuery = supabaseAdmin
      .from('coaches')
      .select('id, first_name, last_name, school, division, state, x_handle')
      .not('x_handle', 'is', null)
      .neq('x_handle', '')

    if (coachIds && coachIds.length > 0) {
      coachQuery = coachQuery.in('id', coachIds)
    }

    const { data: coaches, error: coachError } = await coachQuery

    if (coachError || !coaches || coaches.length === 0) {
      return NextResponse.json({ error: 'No eligible coaches found' }, { status: 400 })
    }

    // Filter out coaches already DM'd or queued
    const coachIdList = coaches.map((c: any) => c.id)
    const { data: existingDMs } = await supabaseAdmin
      .from('messages')
      .select('coach_id, status')
      .eq('athlete_id', athleteId)
      .eq('type', 'dm')
      .eq('channel', 'x')
      .in('coach_id', coachIdList)
      .in('status', ['sent', 'queued'])

    const alreadyHandled = new Set((existingDMs || []).map((m: any) => m.coach_id))
    const eligibleCoaches = coaches.filter((c: any) => !alreadyHandled.has(c.id))

    if (eligibleCoaches.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'All coaches have already been DM\'d or are queued',
        queued: 0,
        skipped: coaches.length,
        alreadySent: alreadyHandled.size,
      })
    }

    // Count DMs sent today to enforce daily limit
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const { count: sentToday } = await supabaseAdmin
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('athlete_id', athleteId)
      .eq('type', 'dm')
      .eq('channel', 'x')
      .eq('status', 'sent')
      .gte('sent_at', todayStart.toISOString())

    const remainingToday = Math.max(0, DAILY_DM_LIMIT - (sentToday || 0))

    // Helper to fill template variables for a coach
    const fillTemplate = (tmpl: string, coach: any) => {
      return tmpl
        .replace(/\{\{coach_first\}\}/g, coach.first_name || '')
        .replace(/\{\{coach_last\}\}/g, coach.last_name || '')
        .replace(/\{\{coach_name\}\}/g, `${coach.first_name} ${coach.last_name}`)
        .replace(/\{\{school\}\}/g, coach.school || '')
        .replace(/\{\{division\}\}/g, coach.division || '')
        .replace(/\{\{state\}\}/g, coach.state || '')
        .replace(/\{\{athlete_first\}\}/g, athlete.first_name || '')
        .replace(/\{\{athlete_last\}\}/g, athlete.last_name || '')
        .replace(/\{\{position\}\}/g, athlete.position || '')
        .replace(/\{\{height\}\}/g, athlete.height || '')
        .replace(/\{\{weight\}\}/g, athlete.weight || '')
        .replace(/\{\{high_school\}\}/g, athlete.high_school || '')
        .replace(/\{\{grad_year\}\}/g, athlete.grad_year || '')
        .replace(/\{\{highlight_url\}\}/g, athlete.highlight_url || '')
        .replace(/\{\{gpa\}\}/g, athlete.gpa || '')
    }

    // Queue all eligible coaches as 'queued' in messages table
    const queuedRecords = eligibleCoaches.map((coach: any) => ({
      coach_id: coach.id,
      athlete_id: athleteId,
      type: 'dm',
      channel: 'x',
      to_address: coach.x_handle,
      subject: null,
      body: fillTemplate(template, coach),
      status: 'queued',
    }))

    const { data: inserted, error: insertError } = await supabaseAdmin
      .from('messages')
      .insert(queuedRecords)
      .select('id, coach_id, to_address, body, status')

    if (insertError) {
      console.error('Bulk DM insert error:', insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      queued: inserted?.length || 0,
      skipped: alreadyHandled.size,
      remainingToday,
      dailyLimit: DAILY_DM_LIMIT,
      message: `${inserted?.length || 0} DMs queued. ${remainingToday} can be sent today.`,
    })
  } catch (err: any) {
    console.error('Bulk DM POST error:', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/recruit/dm/bulk
// Process the next batch of queued DMs (called by the frontend to send in batches)
// Body: { athleteId, action: 'send_next' | 'pause' | 'cancel' }
export async function PATCH(request: NextRequest) {
  try {
    const { athleteId, action } = await request.json()

    if (!athleteId || !action) {
      return NextResponse.json({ error: 'athleteId and action are required' }, { status: 400 })
    }

    if (action === 'cancel') {
      // Delete all queued (unsent) DMs
      const { count } = await supabaseAdmin
        .from('messages')
        .delete({ count: 'exact' })
        .eq('athlete_id', athleteId)
        .eq('type', 'dm')
        .eq('channel', 'x')
        .eq('status', 'queued')

      return NextResponse.json({
        success: true,
        cancelled: count || 0,
        message: `${count || 0} queued DMs cancelled`,
      })
    }

    if (action === 'send_next') {
      // Check daily limit
      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)
      const { count: sentToday } = await supabaseAdmin
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('athlete_id', athleteId)
        .eq('type', 'dm')
        .eq('channel', 'x')
        .eq('status', 'sent')
        .gte('sent_at', todayStart.toISOString())

      if ((sentToday || 0) >= DAILY_DM_LIMIT) {
        return NextResponse.json({
          success: false,
          error: 'Daily DM limit reached',
          sentToday: sentToday || 0,
          dailyLimit: DAILY_DM_LIMIT,
        }, { status: 429 })
      }

      // Get next queued DM
      const { data: nextDm, error: nextError } = await supabaseAdmin
        .from('messages')
        .select('id, coach_id, to_address, body')
        .eq('athlete_id', athleteId)
        .eq('type', 'dm')
        .eq('channel', 'x')
        .eq('status', 'queued')
        .order('created_at', { ascending: true })
        .limit(1)
        .single()

      if (nextError || !nextDm) {
        return NextResponse.json({
          success: true,
          done: true,
          message: 'No more queued DMs',
          sentToday: sentToday || 0,
        })
      }

      // Send via the existing DM send endpoint logic
      // We call the internal send function directly to avoid HTTP overhead
      const coachXHandle = nextDm.to_address
      const message = nextDm.body

      // Call the send API internally
      const baseUrl = request.nextUrl.origin
      const sendRes = await fetch(`${baseUrl}/api/recruit/dm/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ athleteId, coachXHandle, message }),
      })

      const sendData = await sendRes.json()

      if (sendData.success) {
        // Update the queued message to sent (the send endpoint already created a new record,
        // so delete the queued one to avoid duplicates)
        await supabaseAdmin
          .from('messages')
          .delete()
          .eq('id', nextDm.id)

        // Count remaining
        const { count: remaining } = await supabaseAdmin
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .eq('athlete_id', athleteId)
          .eq('type', 'dm')
          .eq('channel', 'x')
          .eq('status', 'queued')

        return NextResponse.json({
          success: true,
          sent: {
            coachXHandle,
            coachId: nextDm.coach_id,
            xMessageId: sendData.xMessageId,
          },
          remaining: remaining || 0,
          sentToday: (sentToday || 0) + 1,
          dailyLimit: DAILY_DM_LIMIT,
        })
      } else {
        // Mark as failed
        await supabaseAdmin
          .from('messages')
          .update({ status: 'failed' })
          .eq('id', nextDm.id)

        return NextResponse.json({
          success: false,
          error: sendData.error || 'Failed to send DM',
          failedCoach: coachXHandle,
          coachId: nextDm.coach_id,
        })
      }
    }

    return NextResponse.json({ error: 'Invalid action. Use send_next or cancel.' }, { status: 400 })
  } catch (err: any) {
    console.error('Bulk DM PATCH error:', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}
