import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function POST(request: Request) {
  const { business_id, athlete_id } = await request.json()

  const { error } = await supabase
    .from('business_favorites')
    .insert({ business_id, athlete_id })

  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ success: true })
}