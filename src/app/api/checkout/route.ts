import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabase } from '@/lib/supabaseClient'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: Request) {
  const { amount, business_id } = await request.json()

  const { data: business } = await supabase
    .from('businesses')
    .select('stripe_account_id')
    .eq('id', business_id)
    .single()

  if (!business || !business.stripe_account_id) {
    return NextResponse.json({ error: 'Business or Stripe account not found' }, { status: 400 })
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: { name: 'LocalHustle Gig Funding' },
        unit_amount: amount * 100,
      },
      quantity: 1,
    }],
    mode: 'payment',
    success_url: `${process.env.NEXT_PUBLIC_URL}/dashboard?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL}/dashboard?canceled=true`,
    payment_intent_data: {
      application_fee_amount: Math.round(amount * 100 * 0.15), // 15%
      transfer_data: {
        destination: business.stripe_account_id,
      },
    },
  })

  return NextResponse.json({ id: session.id })
}