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

  // Fetch current wallet balance
  const { data: business, error: fetchError } = await supabase
    .from('businesses')
    .select('wallet_balance')
    .eq('id', clip.offers.business_id)
    .single()

  if (fetchError || !business) return NextResponse.json({ error: 'Business not found' }, { status: 404 })

  const newBalance = business.wallet_balance - clip.offers.amount

  // Update wallet
  const { error: updateError } = await supabase
    .from('businesses')
    .update({ wallet_balance: newBalance })
    .eq('id', clip.offers.business_id)

  if (updateError) return NextResponse.json({ error: 'Wallet update failed' }, { status: 500 })

  // Real payout (stub — replace with real transfer when ready)
  // await stripe.transfers.create({ ... })

  return NextResponse.json({ success: true })
}