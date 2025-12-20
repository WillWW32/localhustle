import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function POST(request: Request) {
  const { clip_id, post_url } = await request.json()

  // Check if post tags @localhustl (Instagram/TikTok API stub — real in V3)
  const hasTag = true // stub

  if (hasTag) {
    // Add $10 bonus
    const { data: clip } = await supabase.from('clips').select('amount').eq('id', clip_id).single()
    await supabase.from('clips').update({ amount: clip.amount + 10 }).eq('id', clip_id)
  }

  return NextResponse.json({ bonus: hasTag })
}