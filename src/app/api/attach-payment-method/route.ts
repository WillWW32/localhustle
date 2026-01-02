import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  const body = await request.json()
  const { payment_method_id, business_id, parent_id, athlete_id } = body

  if (!payment_method_id) {
    return NextResponse.json({ error: 'Missing payment_method_id' }, { status: 400 })
  }

  // Determine which role is attaching the card
  const role = business_id ? 'business' : parent_id ? 'parent' : athlete_id ? 'athlete' : null

  if (!role || !(business_id || parent_id || athlete_id)) {
    return NextResponse.json({ error: 'Missing valid role ID (business_id, parent_id, or athlete_id)' }, { status: 400 })
  }

  const userId = business_id || parent_id || athlete_id

  try {
    // Fetch the user/profile record to get stripe_customer_id
    let profile
    if (role === 'business') {
      const { data, error } = await supabase
        .from('businesses')
        .select('stripe_customer_id')
        .eq('id', userId)
        .single()
      if (error || !data) throw new Error('Business not found')
      profile = data
    } else if (role === 'parent') {
      const { data, error } = await supabase
        .from('parents')
        .select('stripe_customer_id')
        .eq('id', userId)
        .single()
      if (error || !data) throw new Error('Parent not found')
      profile = data
    } else if (role === 'athlete') {
      const { data, error } = await supabase
        .from('profiles')
        .select('stripe_customer_id')
        .eq('id', userId)
        .single()
      if (error || !data) throw new Error('Athlete not found')
      profile = data
    }

    const stripe_customer_id = profile.stripe_customer_id

    if (!stripe_customer_id) {
      return NextResponse.json({ error: 'No Stripe customer ID found for this user' }, { status: 404 })
    }

    // Attach the payment method to the customer
    const paymentMethod = await stripe.paymentMethods.attach(payment_method_id, {
      customer: stripe_customer_id,
    })

    // Set as default payment method for invoices (optional but recommended)
    await stripe.customers.update(stripe_customer_id, {
      invoice_settings: { default_payment_method: payment_method_id },
    })

    // Return simplified card info
    return NextResponse.json({
      success: true,
      method: {
        id: paymentMethod.id,
        brand: paymentMethod.card?.brand,
        last4: paymentMethod.card?.last4,
        exp_month: paymentMethod.card?.exp_month,
        exp_year: paymentMethod.card?.exp_year,
      },
    })
  } catch (error: any) {
    console.error('Attach payment method error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to attach payment method' },
      { status: 500 }
    )
  }
}