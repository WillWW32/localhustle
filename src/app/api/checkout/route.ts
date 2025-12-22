import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabase } from '@/lib/supabaseClient'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: Request) {
  const body = await request.json()
  const { amount, business_id, booster_event_id } = body

  if (!amount || amount < 50) {
    return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
  }

  // Business pays +15% platform fee
  const chargeAmount = Math.round(amount * 1.15) // e.g., $100 gig → $115 charge

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: booster_event_id ? 'Booster Event Donation' : 'LocalHustle Gig Funding',
          },
          unit_amount: chargeAmount * 100, // in cents
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: `${process.env.NEXT_PUBLIC_URL}/dashboard?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL}/dashboard?canceled=true`,
    metadata: {
      original_amount: amount,
      business_id: business_id || null,
      booster_event_id: booster_event_id || null,
    },
  })

  return NextResponse.json({ id: session.id })
}