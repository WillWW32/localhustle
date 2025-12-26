// src/app/api/payout/route.ts
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: Request) {
  const { clip_id, athlete_id, amount } = await request.json()

  if (!clip_id || !athlete_id || amount <= 0) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const { data: athlete } = await supabase
    .from('profiles')
    .select('debit_card_token, age')
    .eq('id', athlete_id)
    .single()

  if (!athlete?.debit_card_token) {
    return NextResponse.json({ error: 'No debit card on file' }, { status: 400 })
  }

  try {
    const payout = await stripe.payouts.create({
      amount: Math.round(amount * 100),
      currency: 'usd',
      method: 'instant',
      destination: athlete.debit_card_token,
    })

    await supabase
      .from('payouts')
      .insert({
        athlete_id,
        clip_id,
        amount,
        stripe_payout_id: payout.id,
        status: 'completed',
      })

    return NextResponse.json({ success: true, payout_id: payout.id })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}