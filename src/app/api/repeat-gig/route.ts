// src/app/api/repeat-gig/route.ts
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function POST(request: Request) {
  const { gig_id, business_id } = await request.json()

  const { data: gig } = await supabase
    .from('offers')
    .select('amount, business_id')
    .eq('id', gig_id)
    .single()

  const { data: business } = await supabase
    .from('businesses')
    .select('wallet_balance')
    .eq('id', business_id)
    .single()

  if (business.wallet_balance < gig.amount) {
    return NextResponse.json({ error: 'Insufficient funds' }, { status: 400 })
  }

  // Gig stays active — no action needed
  return NextResponse.json({ success: true })
}