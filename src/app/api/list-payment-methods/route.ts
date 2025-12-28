import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
})

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { business_id } = await request.json()

  if (!business_id) {
    return NextResponse.json({ error: 'Missing business_id' }, { status: 400 })
  }

  try {
    // Get business and Stripe customer ID
    const { data: business } = await supabase
      .from('businesses')
      .select('stripe_customer_id')
      .eq('id', business_id)
      .single()

    if (!business?.stripe_customer_id) {
      return NextResponse.json({ methods: [] })
    }

    // List payment methods from Stripe
    const paymentMethods = await stripe.paymentMethods.list({
      customer: business.stripe_customer_id,
      type: 'card',
    })

    const methods = paymentMethods.data.map(pm => ({
      id: pm.id,
      brand: pm.card?.brand,
      last4: pm.card?.last4,
      exp_month: pm.card?.exp_month,
      exp_year: pm.card?.exp_year,
      is_default: pm.id === business.default_payment_method_id, // optional: track default
    }))

    return NextResponse.json({ methods })
  } catch (error: any) {
    console.error('Stripe error:', error)
    return NextResponse.json({ error: error.message || 'Failed to list cards' }, { status: 500 })
  }
}