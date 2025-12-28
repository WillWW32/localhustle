import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: Request) {
  const { business_id } = await request.json()

  if (!business_id) {
    return NextResponse.json({ error: 'Missing business_id' }, { status: 400 })
  }

  try {
    // Get Stripe customer ID from DB (no auth needed — business_id from frontend)
    const response = await fetch(`${process.env.NEXT_PUBLIC_URL}/api/get-business-customer`, {
      method: 'POST',
      body: JSON.stringify({ business_id }),
    })
    const { stripe_customer_id } = await response.json()

    if (!stripe_customer_id) {
      return NextResponse.json({ methods: [] })
    }

    const paymentMethods = await stripe.paymentMethods.list({
      customer: stripe_customer_id,
      type: 'card',
    })

    const methods = paymentMethods.data.map(pm => ({
      id: pm.id,
      brand: pm.card?.brand,
      last4: pm.card?.last4,
      exp_month: pm.card?.exp_month,
      exp_year: pm.card?.exp_year,
    }))

    return NextResponse.json({ methods })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed' }, { status: 500 })
  }
}