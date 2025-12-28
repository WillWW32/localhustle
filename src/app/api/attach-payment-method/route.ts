import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover',
})
export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { payment_method_id, business_id } = await request.json()

  if (!payment_method_id || !business_id) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  try {
    // Get or create Stripe Customer for business
    const { data: business } = await supabase
      .from('businesses')
      .select('stripe_customer_id')
      .eq('id', business_id)
      .single()

    let customerId = business.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        metadata: { supabase_business_id: business_id },
      })
      customerId = customer.id

      await supabase
        .from('businesses')
        .update({ stripe_customer_id: customerId })
        .eq('id', business_id)
    }

    // Attach payment method to customer
    await stripe.paymentMethods.attach(payment_method_id, {
      customer: customerId,
    })

    // Set as default if first card
    const methods = await stripe.paymentMethods.list({
      customer: customerId,
      type: 'card',
    })

    if (methods.data.length === 1) {
      await stripe.customers.update(customerId, {
        invoice_settings: { default_payment_method: payment_method_id },
      })
    }

    return NextResponse.json({ 
      success: true, 
      method: {
        id: payment_method_id,
        card: methods.data[0].card,
      }
    })
  } catch (error: any) {
    console.error('Stripe error:', error)
    return NextResponse.json({ error: error.message || 'Failed to save card' }, { status: 500 })
  }
}