// src/app/api/invite-friend/route.ts
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function POST(request: Request) {
  const { friend_email, friend_name, challenge_description, amount, business_id } = await request.json()

  if (!friend_email || !challenge_description || !amount || !business_id) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Create the gig
  const { data: gig, error: gigError } = await supabase
    .from('offers')
    .insert({
      business_id,
      type: 'Challenge',
      amount,
      description: challenge_description,
      target_athlete_email: friend_email,
      status: 'active',
    })
    .select()
    .single()

  if (gigError) {
    return NextResponse.json({ error: gigError.message }, { status: 500 })
  }

  // Send magic link
  const { error: authError } = await supabase.auth.signInWithOtp({
    email: friend_email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_URL}/dashboard`,
    },
  })

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, gig_id: gig.id })
}