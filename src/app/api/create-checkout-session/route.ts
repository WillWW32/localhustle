import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabase } from '@/lib/supabaseClient'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: Request) {
  const { amount } = await request.json()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: business } = await supabase
    .from('businesses')
    .select('stripe_account_id')
    .eq('owner_id', user.id)
    .single()

  if (!business?.stripe_account_id) return NextResponse.json({ error: 'No connected account' }, { status: 400 })

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'LocalHustle Gig Funding',
          },
          unit_amount: amount,
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: `${process.env.NEXT_PUBLIC_URL}/dashboard?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL}/business-onboard?canceled=true`,
    payment_intent_data: {
      application_fee_amount: Math.round(amount * 0.15), // 15% fee
      transfer_data: {
        destination: business.stripe_account_id,
      },
    },
  })

  return NextResponse.json({ id: session.id })
}