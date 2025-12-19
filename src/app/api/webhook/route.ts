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
    console.error('Webhook signature verification failed.', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    const businessId = session.metadata?.business_id
    const amountTotal = session.amount_total // in cents

    if (businessId && amountTotal) {
      const amount = amountTotal / 100 // dollars

      const { error } = await supabase
        .from('businesses')
        .update({ wallet_balance: supabase.raw('wallet_balance + ?', [amount]) })
        .eq('id', businessId)

      if (error) {
        console.error('Wallet update error:', error)
      }
    }
  }

  return NextResponse.json({ received: true })
}