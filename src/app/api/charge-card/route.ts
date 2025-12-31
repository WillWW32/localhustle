import { NextResponse } from 'next/server'
import Stripe from 'stripe'

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
      return_url: 'https://app.localhustle.org/business-dashboard', // optional
    })

    // Update wallet balance in Supabase
    await supabase
      .from('businesses')
      .update({ wallet_balance: supabase.raw('wallet_balance + ?', [amount]) })
      .eq('id', business_id)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}