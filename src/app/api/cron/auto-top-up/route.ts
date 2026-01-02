// app/api/cron/auto-top-up/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!) // Use service role key (server-only)

export async function GET() {
  try {
    // Fetch all businesses with auto_top_up enabled and low balance
    const { data: businesses, error } = await supabase
      .from('businesses')
      .select('id, wallet_balance, auto_top_up, stripe_customer_id')
      .eq('auto_top_up', true)
      .lt('wallet_balance', 100)

    if (error) throw error
    if (!businesses || businesses.length === 0) {
      return NextResponse.json({ message: 'No top-ups needed' })
    }

    for (const biz of businesses) {
      // Get default payment method
      const { data: methods } = await supabase
        .from('payment_methods')
        .select('payment_method_id')
        .eq('business_id', biz.id)
        .limit(1)

      if (!methods || methods.length === 0) continue

      const paymentMethodId = methods[0].payment_method_id

      // Charge $500
      const paymentIntent = await stripe.paymentIntents.create({
        amount: 50000, // $500 in cents
        currency: 'usd',
        customer: biz.stripe_customer_id,
        payment_method: paymentMethodId,
        confirm: true,
        off_session: true,
        description: 'LocalHustle Auto Top-Up',
      })

      if (paymentIntent.status === 'succeeded') {
        // Update wallet balance
        await supabase
          .from('businesses')
          .update({ wallet_balance: biz.wallet_balance + 500 })
          .eq('id', biz.id)

        console.log(`Auto top-up $500 for business ${biz.id}`)
      }
    }

    return NextResponse.json({ message: `Processed ${businesses.length} top-ups` })
  } catch (err: any) {
    console.error('Auto top-up error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}