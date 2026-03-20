import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseClient'
import { resend } from '@/lib/resend'

// GET /api/recruit/parent-access?athleteId=...
// List all parent/guardian access for an athlete
export async function GET(request: NextRequest) {
  try {
    const athleteId = request.nextUrl.searchParams.get('athleteId')
    if (!athleteId) {
      return NextResponse.json({ error: 'athleteId is required' }, { status: 400 })
    }

    // Get the primary parent email from athletes table
    const { data: athlete } = await supabaseAdmin
      .from('athletes')
      .select('parent_email, first_name, last_name')
      .eq('id', athleteId)
      .single()

    // Get additional guardians from parent_access table
    const { data: access, error } = await supabaseAdmin
      .from('parent_access')
      .select('*')
      .eq('athlete_id', athleteId)
      .order('created_at', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      primaryEmail: athlete?.parent_email || null,
      athleteName: athlete ? `${athlete.first_name} ${athlete.last_name}` : '',
      guardians: (access || []).map((a: any) => ({
        id: a.id,
        email: a.email,
        name: a.name || '',
        relationship: a.relationship || '',
        status: a.status,
        invitedAt: a.created_at,
      })),
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// POST /api/recruit/parent-access
// Invite a new parent/guardian
export async function POST(request: NextRequest) {
  try {
    const { athleteId, email, name, relationship } = await request.json()

    if (!athleteId || !email) {
      return NextResponse.json({ error: 'athleteId and email are required' }, { status: 400 })
    }

    const normalizedEmail = email.trim().toLowerCase()

    // Check for duplicate
    const { data: existing } = await supabaseAdmin
      .from('parent_access')
      .select('id')
      .eq('athlete_id', athleteId)
      .eq('email', normalizedEmail)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'This email already has access' }, { status: 409 })
    }

    // Also check if this is already the primary parent email
    const { data: athlete } = await supabaseAdmin
      .from('athletes')
      .select('parent_email, first_name, last_name')
      .eq('id', athleteId)
      .single()

    if (athlete?.parent_email?.toLowerCase() === normalizedEmail) {
      return NextResponse.json({ error: 'This is already the primary account holder email' }, { status: 409 })
    }

    // Insert access record
    const { data: access, error: insertError } = await supabaseAdmin
      .from('parent_access')
      .insert({
        athlete_id: athleteId,
        email: normalizedEmail,
        name: name || null,
        relationship: relationship || null,
        status: 'active',
      })
      .select()
      .single()

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    // Send invitation email
    const athleteName = athlete ? `${athlete.first_name} ${athlete.last_name}` : 'your athlete'
    try {
      await resend.emails.send({
        from: 'LocalHustle <notifications@localhustle.org>',
        to: normalizedEmail,
        subject: `You've been added to ${athleteName}'s recruiting dashboard`,
        text: `Hi${name ? ` ${name}` : ''},\n\nYou've been added as a ${relationship || 'parent/guardian'} on ${athleteName}'s LocalHustle recruiting dashboard.\n\nYou can now log in at any time to view ${athleteName}'s outreach progress, coach responses, and campaign performance.\n\nLog in here: https://app.localhustle.org/recruit/login\nUse this email: ${normalizedEmail}\n\nBest,\nThe LocalHustle Team`,
      })
    } catch {
      // Email send failure shouldn't block the access grant
    }

    return NextResponse.json({
      success: true,
      access: {
        id: access.id,
        email: normalizedEmail,
        name: name || '',
        relationship: relationship || '',
        status: 'active',
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// DELETE /api/recruit/parent-access
// Revoke a parent/guardian's access
export async function DELETE(request: NextRequest) {
  try {
    const { accessId } = await request.json()

    if (!accessId) {
      return NextResponse.json({ error: 'accessId is required' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('parent_access')
      .update({ status: 'revoked' })
      .eq('id', accessId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
