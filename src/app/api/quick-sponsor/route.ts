// src/app/api/quick-sponsor/route.ts
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'
import { resend } from '@/lib/resend'

export async function POST(request: Request) {
  const { kidId } = await request.json()

  if (!kidId) {
    return NextResponse.json({ error: 'Missing kidId' }, { status: 400 })
  }

  // Get current user (parent/business)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })
  }

  // Fetch parent/business record (stored in businesses table)
  const { data: parentRecord, error: parentError } = await supabase
    .from('businesses')
    .select('id, name, wallet_balance')
    .eq('owner_id', user.id)
    .single()

  if (parentError || !parentRecord) {
    return NextResponse.json({ error: 'Parent record not found' }, { status: 404 })
  }

  // Fetch kid details
  const { data: kid, error: kidError } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .eq('id', kidId)
    .single()

  if (kidError || !kid) {
    return NextResponse.json({ error: 'Kid not found' }, { status: 404 })
  }

  // Check if parent has a saved card
  if (!parentRecord.wallet_balance || parentRecord.wallet_balance < 50) {
    return NextResponse.json({ error: 'Insufficient funds or no card on file' }, { status: 400 })
  }

  // Create the $50 pre-funded challenge gig
  const { data: gig, error: gigError } = await supabase
    .from('offers')
    .insert({
      business_id: parentRecord.id,
      type: 'Challenge',
      amount: 50,
      description: 'First challenge from your parent — complete and earn $50!',
      target_athlete_email: kid.email,
      status: 'active',
    })
    .select()
    .single()

  if (gigError) {
    console.error('Gig creation error:', gigError)
    return NextResponse.json({ error: 'Failed to create challenge' }, { status: 500 })
  }

  // Send notification email to athlete
  try {
    await resend.emails.send({
      from: 'LocalHustle <notifications@localhustle.org>',
      to: kid.email,
      subject: `Your Parent Funded a $50 Challenge!`,
      text: `Hey ${kid.full_name.split(' ')[0]}!

Your parent just funded a $50 challenge for you on LocalHustle.

Complete it and get paid instantly!

Log in to claim it: https://app.localhustle.org/athlete-dashboard

Let's go!
— LocalHustle Team`,
      html: `<p>Hey ${kid.full_name.split(' ')[0]}!</p>
<p>Your parent just funded a <strong>$50 challenge</strong> for you on LocalHustle.</p>
<p>Complete it and get paid instantly!</p>
<p><a href="https://app.localhustle.org/athlete-dashboard" style="background:#000;color:#fff;padding:1rem 2rem;text-decoration:none;font-weight:bold;">Claim Your Challenge</a></p>
<p>Let's go!<br/>— LocalHustle Team</p>`,
    })
  } catch (emailError) {
    console.error('Resend error:', emailError)
    // Don't fail the whole flow if email fails
  }

  return NextResponse.json({ success: true, gig })
}