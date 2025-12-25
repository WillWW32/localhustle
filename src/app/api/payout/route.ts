import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: Request) {
  const { clip_id, athlete_id, amount } = await request.json()

  // Get athlete debit card token
  const { data: athlete } = await supabase
    .from('profiles')
    .select('debit_card_token')
    .eq('id', athlete_id)
    .single()

  if (!athlete.debit_card_token) {
    return NextResponse.json({ error: 'No debit card on file' }, { status: 400 })
  }

  // Create payout
  const payout = await stripe.payouts.create({
    amount: amount * 100,
    currency: 'usd',
    method: 'instant',
    destination: athlete.debit_card_token,
  })

  // Record payout
  await supabase
    .from('payouts')
    .insert({
      athlete_id,
      gig_id: clip_id,
      amount,
      stripe_transfer_id: payout.id,
      status: 'completed',
    })

  return NextResponse.json({ success: true, payout })
}