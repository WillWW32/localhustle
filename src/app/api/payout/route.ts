import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabase } from '@/lib/supabaseClient'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: Request) {
  const { clip_id, paymentMethodId } = await request.json()

  const { data: clip } = await supabase
    .from('clips')
    .select('*, offers(amount, business_id), profiles(parent_email)')
    .eq('id', clip_id)
    .single()

  if (!clip) return NextResponse.json({ error: 'Clip not found' }, { status: 404 })

  // Save payment method to profile (stub — real would attach to customer)
  // For now, payout directly

  const payout = await stripe.transfers.create({
    amount: clip.offers.amount * 100 * 0.85, // 85% to athlete (15% platform)
    currency: 'usd',
    destination: 'acct_test', // real would use connected account or saved method
    source_transaction: 'ch_test', // from business payment
  })

  // Deduct from business wallet
  await supabase
    .from('businesses')
    .update({ wallet_balance: supabase.raw('wallet_balance - ?', [clip.offers.amount]) })
    .eq('id', clip.offers.business_id)

  return NextResponse.json({ success: true })
}