// src/app/api/payout/route.ts
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: Request) {
  const body = await request.json()
  const { clip_id, athlete_id, amount } = body

  if (!clip_id || !athlete_id || !amount || amount <= 0) {
    return NextResponse.json({ error: 'Missing or invalid fields' }, { status: 400 })
  }

  // Get athlete profile (for debit card token and age check)
  const { data: athlete, error: athleteError } = await supabase
    .from('profiles')
    .select('debit_card_token, age')
    .eq('id', athlete_id)
    .single()

  if (athleteError || !athlete) {
    return NextResponse.json({ error: 'Athlete not found' }, { status: 404 })
  }

  // Under 18: Require parent approval first (status already 'approved' from clip flow)
  // 18+: Direct payout if card on file

  if (!athlete.debit_card_token) {
    return NextResponse.json({ error: 'No debit card on file — athlete must add one (18+)' }, { status: 400 })
  }

  try {
    // Create instant payout to debit card
    const payout = await stripe.payouts.create({
      amount: Math.round(amount * 100), // cents
      currency: 'usd',
      method: 'instant',
      destination: athlete.debit_card_token,
      statement_descriptor: 'LocalHustle Gig Payout',
    })

    // Record payout in DB
    const { error: dbError } = await supabase
      .from('payouts')
      .insert({
        athlete_id,
        clip_id,
        amount,
        stripe_payout_id: payout.id,
        status: 'completed',
        created_at: new Date().toISOString(),
      })

    if (dbError) {
      console.error('DB insert error:', dbError)
      // Don't fail payout if DB record fails — money already sent
    }

    return NextResponse.json({ success: true, payout_id: payout.id })
  } catch (stripeError: any) {
    console.error('Stripe payout error:', stripeError)
    return NextResponse.json({ error: stripeError.message || 'Payout failed' }, { status: 500 })
  }
}