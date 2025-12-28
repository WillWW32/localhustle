import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: Request) {
  const { payment_method_id, business_id } = await request.json()

  if (!payment_method_id || !business_id) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  try {
    // Get business and Stripe customer ID from Supabase
    const res = await fetch(`${process.env.NEXT_PUBLIC_URL}/api/get-business-customer`, {
      method: 'POST',
      body: JSON.stringify({ business_id }),
    })
    const { stripe_customer_id } = await res.json()

    if (!stripe_customer_id) {
      return NextResponse.json({ error: 'No Stripe customer found' }, { status: 404 })
    }

    // Attach payment method
    const paymentMethod = await stripe.paymentMethods.attach(payment_method_id, {
      customer: stripe_customer_id,
    })

    // Optional: Set as default
    await stripe.customers.update(stripe_customer_id, {
      invoice_settings: { default_payment_method: payment_method_id },
    })

    return NextResponse.json({ 
      success: true, 
      method: {
        id: paymentMethod.id,
        brand: paymentMethod.card?.brand,
        last4: paymentMethod.card?.last4,
        exp_month: paymentMethod.card?.exp_month,
        exp_year: paymentMethod.card?.exp_year,
      }
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to attach card' }, { status: 500 })
  }
}