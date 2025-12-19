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
    const amountTotal = session.amount_total // in cents

    if (businessId && amountTotal) {
      const amount = amountTotal / 100 // dollars

      // Fetch current balance
      const { data: business, error: fetchError } = await supabase
        .from('businesses')
        .select('wallet_balance')
        .eq('id', businessId)
        .single()

      if (fetchError || !business) {
        console.error('Business fetch error:', fetchError)
        return NextResponse.json({ error: 'Business not found' }, { status: 404 })
      }

      const newBalance = business.wallet_balance + amount

      // Update wallet
      const { error: updateError } = await supabase
        .from('businesses')
        .update({ wallet_balance: newBalance })
        .eq('id', businessId)

      if (updateError) {
        console.error('Wallet update error:', updateError)
      }
    }
  }

  return NextResponse.json({ received: true })
}