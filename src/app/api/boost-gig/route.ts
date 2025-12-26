// src/app/api/boost-gig/route.ts
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function POST(request: Request) {
  const { gig_id, extra_amount, business_id } = await request.json()

  if (!gig_id || !extra_amount || !business_id) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const { data: business, error: businessError } = await supabase
    .from('businesses')
    .select('wallet_balance')
    .eq('id', business_id)
    .single()

  if (businessError || !business) {
    return NextResponse.json({ error: 'Business not found' }, { status: 404 })
  }

  if (business.wallet_balance < extra_amount) {
    return NextResponse.json({ error: 'Insufficient funds' }, { status: 400 })
  }

  // Fetch current gig amount
  const { data: gig, error: gigError } = await supabase
    .from('offers')
    .select('amount')
    .eq('id', gig_id)
    .single()

  if (gigError || !gig) {
    return NextResponse.json({ error: 'Gig not found' }, { status: 404 })
  }

  const newAmount = gig.amount + extra_amount

  // Update gig amount
  const { data: updatedGig, error: updateError } = await supabase
    .from('offers')
    .update({ amount: newAmount })
    .eq('id', gig_id)
    .select()
    .single()

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  // Deduct from wallet
  await supabase
    .from('businesses')
    .update({ wallet_balance: business.wallet_balance - extra_amount })
    .eq('id', business_id)

  return NextResponse.json({ gig: updatedGig })
}