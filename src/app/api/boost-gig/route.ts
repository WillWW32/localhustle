import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function POST(request: Request) {
  const { gig_id, extra_amount } = await request.json()

  const { data, error } = await supabase
    .from('offers')
    .update({ amount: supabase.raw('amount + ?', extra_amount) })
    .eq('id', gig_id)
    .select()
    .single()

  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ gig: data })
}