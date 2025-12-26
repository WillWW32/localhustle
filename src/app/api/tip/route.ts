import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: Request) {
  const { clip_id, athlete_id, tip_amount } = await request.json()

  const { data: athlete } = await supabase
    .from('profiles')
    .select('debit_card_token')
    .eq('id', athlete_id)
    .single()

  if (!athlete.debit_card_token) {
    return NextResponse.json({ error: 'No debit card' }, { status: 400 })
  }

  const payout = await stripe.payouts.create({
    amount: tip_amount * 100,
    currency: 'usd',
    method: 'instant',
    destination: athlete.debit_card_token,
  })

  return NextResponse.json({ success: true })
}