// src/app/api/repeat-gig/route.ts
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function POST(request: Request) {
  const { gig_id, business_id } = await request.json()

  if (!gig_id || !business_id) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Fetch business wallet
  const { data: business, error: businessError } = await supabase
    .from('businesses')
    .select('wallet_balance')
    .eq('id', business_id)
    .single()

  if (businessError || !business) {
    return NextResponse.json({ error: 'Business not found or fetch error' }, { status: 404 })
  }

  // Fetch gig amount
  const { data: gig, error: gigError } = await supabase
    .from('offers')
    .select('amount')
    .eq('id', gig_id)
    .single()

  if (gigError || !gig) {
    return NextResponse.json({ error: 'Gig not found' }, { status: 404 })
  }

  // Check funds
  if (business.wallet_balance < gig.amount) {
    return NextResponse.json({ error: 'Insufficient funds' }, { status: 400 })
  }

  // Gig stays active — no action needed (repeat logic handled by UI)
  return NextResponse.json({ success: true })
}