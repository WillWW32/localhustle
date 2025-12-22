import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabase } from '@/lib/supabaseClient'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: Request) {
  const { amount, business_id } = await request.json()

  // amount = gig amount athlete sees (e.g., $100)
  // Charge business amount + 15% platform fee
  const chargeAmount = Math.round(amount * 1.15)  // e.g., $115

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: { name: 'LocalHustle Gig Funding' },
        unit_amount: chargeAmount * 100,  // in cents
      },
      quantity: 1,
    }],
    mode: 'payment',
    success_url: `${process.env.NEXT_PUBLIC_URL}/dashboard?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL}/dashboard?canceled=true`,
    metadata: {
      gig_amount: amount,  // original amount for payout
      business_id,
    },
  })

  return NextResponse.json({ id: session.id })
}