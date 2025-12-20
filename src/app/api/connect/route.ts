import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabase } from '@/lib/supabaseClient'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: Request) {
  const { business_id } = await request.json()

  const account = await stripe.accounts.create({
    type: 'standard',
    country: 'US',
    email: 'business@email.com',
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
  })

  const accountLink = await stripe.accountLinks.create({
    account: account.id,
    refresh_url: 'https://app.localhustle.org/dashboard',
    return_url: 'https://app.localhustle.org/dashboard',
    type: 'account_onboarding',
  })

  await supabase.from('businesses').update({ stripe_account_id: account.id }).eq('id', business_id)

  return NextResponse.json({ url: accountLink.url })
}