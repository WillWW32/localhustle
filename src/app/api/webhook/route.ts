import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabase } from '@/lib/supabaseClient'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: Request) {
  const sig = request.headers.get('stripe-signature')!
  const body = await request.text()

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret!)
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // Handle Checkout Session Completed (Wallet Funding)
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    const businessId = session.metadata?.business_id
    const amountTotal = session.amount_total

    if (businessId && amountTotal) {
      const amount = amountTotal / 100

      const { data: business } = await supabase
        .from('businesses')
        .select('wallet_balance')
        .eq('id', businessId)
        .single()

      if (business) {
        await supabase
          .from('businesses')
          .update({ wallet_balance: business.wallet_balance + amount })
          .eq('id', businessId)
      }
    }
  }

  // Handle Payout Events (for reliability)
  if (event.type === 'payout.paid' || event.type === 'payout.failed') {
    const payout = event.data.object as Stripe.Payout

    await supabase
      .from('payouts')
      .update({ status: payout.status })
      .eq('stripe_payout_id', payout.id)
  }

  return NextResponse.json({ received: true })
}