import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabase } from '@/lib/supabaseClient'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: Request) {
  const { clip_id, paymentMethodId } = await request.json()

  const { data: clip } = await supabase.from('clips').select('*, offers(amount)').eq('id', clip_id).single()

  if (!clip) return NextResponse.json({ error: 'Clip not found' }, { status: 404 })

  // Attach payment method to customer (create if needed)
  // Real code would create customer, attach method, save to profile

  // Create payout
  const payout = await stripe.transfers.create({
    amount: clip.offers.amount * 100, // cents
    currency: 'usd',
    destination: 'acct_123', // connected account or saved method
    description: 'LocalHustle gig payout',
  })

  return NextResponse.json({ success: true })
}