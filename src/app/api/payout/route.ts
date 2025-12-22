import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabase } from '@/lib/supabaseClient'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: Request) {
  const { clip_id, paymentMethodId } = await request.json()

  const { data: clip, error: clipError } = await supabase
    .from('clips')
    .select('*, offers(amount)')
    .eq('id', clip_id)
    .single()

  if (clipError || !clip) {
    return NextResponse.json({ error: 'Clip not found' }, { status: 404 })
  }

  // Calculate 85% payout to parent (platform keeps 15%)
  const gigAmount = clip.offers.amount
  const payoutAmount = Math.round(gigAmount * 0.85 * 100) // in cents

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: payoutAmount,
      currency: 'usd',
      payment_method: paymentMethodId,
      confirmation_method: 'manual',
      confirm: true,
      description: `LocalHustle payout for gig — 85% of $${gigAmount}`,
    })

    if (paymentIntent.status === 'succeeded') {
      await supabase
        .from('clips')
        .update({ status: 'paid' })
        .eq('id', clip_id)

      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ error: 'Payment failed' }, { status: 400 })
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}