import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function POST(request: Request) {
  const { gig_id, extra_amount, business_id } = await request.json()

  const { data: business } = await supabase
    .from('businesses')
    .select('wallet_balance')
    .eq('id', business_id)
    .single()

  if (business.wallet_balance < extra_amount) {
    return NextResponse.json({ error: 'Insufficient funds' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('offers')
    .update({ amount: supabase.raw('amount + ?', extra_amount) })
    .eq('id', gig_id)
    .select()
    .single()

  if (error) return NextResponse.json({ error }, { status: 500 })

  // Deduct from wallet
  await supabase
    .from('businesses')
    .update({ wallet_balance: business.wallet_balance - extra_amount })
    .eq('id', business_id)

  return NextResponse.json({ gig: data })
}