import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabase } from '@/lib/supabaseClient'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: Request) {
  const { amount, payment_method_id, business_id } = await request.json()

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // cents
      currency: 'usd',
      payment_method: payment_method_id,
      confirmation_method: 'manual',
      confirm: true,
    })

    // Update wallet balance in Supabase
    const { data: currentBusiness, error: fetchError } = await supabase
      .from('businesses')
      .select('wallet_balance')
      .eq('id', business_id)
      .single()

    if (fetchError || !currentBusiness) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    const newBalance = (currentBusiness.wallet_balance || 0) + amount

    const { error: updateError } = await supabase
      .from('businesses')
      .update({ wallet_balance: newBalance })
      .eq('id', business_id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}