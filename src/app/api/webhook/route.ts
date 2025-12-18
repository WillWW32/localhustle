import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabase } from '@/lib/supabaseClient'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: Request) {
  const sig = request.headers.get('stripe-signature')!
  const body = await request.text()

  let event

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret!)
  } catch (err) {
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    const businessId = session.metadata?.business_id
    const amount = session.amount_total // in cents

    if (businessId && amount) {
      const { error } = await supabase
        .from('businesses')
        .update({ wallet_balance: supabase.raw('wallet_balance + ?', [amount / 100]) })
        .eq('id', businessId)

      if (error) console.error('Wallet update error:', error)
    }
  }

  return NextResponse.json({ received: true })
}