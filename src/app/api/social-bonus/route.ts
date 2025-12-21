import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function POST(request: Request) {
  const { clip_id } = await request.json()

  // Fetch clip with null check
  const { data: clip, error: fetchError } = await supabase
    .from('clips')
    .select('amount')
    .eq('id', clip_id)
    .single()

  if (fetchError || !clip) {
    console.error('Clip fetch error:', fetchError)
    return NextResponse.json({ error: 'Clip not found' }, { status: 404 })
  }

  // Add $10 bonus
  const { error: updateError } = await supabase
    .from('clips')
    .update({ amount: clip.amount + 10 })
    .eq('id', clip_id)

  if (updateError) {
    console.error('Bonus update error:', updateError)
    return NextResponse.json({ error: 'Failed to add bonus' }, { status: 500 })
  }

  return NextResponse.json({ bonus: true })
}