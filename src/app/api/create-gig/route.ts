import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function POST(request: Request) {
  const { business_id, type, amount, description, target_athlete_email, is_repeat } = await request.json()

  const { data, error } = await supabase
    .from('offers')
    .insert({
      business_id,
      type,
      amount,
      description,
      target_athlete_email,
      is_repeat: is_repeat || false,
      status: 'active',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ gig: data })
}