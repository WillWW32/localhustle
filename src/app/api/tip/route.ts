// src/app/api/tip/route.ts
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: Request) {
  const { clip_id, athlete_id, tip_amount } = await request.json()

  if (!clip_id || !athlete_id || tip_amount <= 0) {
    return NextResponse.json({ error: 'Missing or invalid fields' }, { status: 400 })
  }

  // Fetch athlete with debit card token
  const { data: athlete, error: athleteError } = await supabase
    .from('profiles')
    .select('debit_card_token')
    .eq('id', athlete_id)
    .single()

  if (athleteError || !athlete) {
    return NextResponse.json({ error: 'Athlete not found or error fetching card' }, { status: 404 })
  }

  if (!athlete.debit_card_token) {
    return NextResponse.json({ error: 'No debit card on file' }, { status: 400 })
  }

  try {
    const payout = await stripe.payouts.create({
      amount: Math.round(tip_amount * 100),
      currency: 'usd',
      method: 'instant',
      destination: athlete.debit_card_token,
    })

    return NextResponse.json({ success: true, payout_id: payout.id })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Payout failed' }, { status: 500 })
  }
}