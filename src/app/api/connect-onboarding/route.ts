import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabase } from '@/lib/supabaseClient'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: Request) {
  const { business_id } = await request.json()

  const { data: business } = await supabase
    .from('businesses')
    .select('stripe_account_id')
    .eq('id', business_id)
    .single()

  let accountId = business?.stripe_account_id

  if (!accountId) {
    const account = await stripe.accounts.create({
      type: 'standard',
      country: 'US',
      email: profile?.email, // or business email
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    })

    accountId = account.id

    await supabase
      .from('businesses')
      .update({ stripe_account_id: accountId })
      .eq('id', business_id)
  }

  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${process.env.NEXT_PUBLIC_URL}/dashboard`,
    return_url: `${process.env.NEXT_PUBLIC_URL}/dashboard`,
    type: 'account_onboarding',
  })

  return NextResponse.json({ url: accountLink.url })
}