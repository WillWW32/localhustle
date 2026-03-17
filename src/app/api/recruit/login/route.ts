import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseClient'

export async function POST(request: NextRequest) {
  const { email } = await request.json()

  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 })
  }

  // Look up athletes by parent_email (contact email used at signup)
  const { data: athletes, error } = await supabaseAdmin
    .from('athletes')
    .select('id, first_name, last_name, sport')
    .eq('parent_email', email)
    .order('created_at', { ascending: false })

  if (error || !athletes || athletes.length === 0) {
    return NextResponse.json({ error: 'No athlete found with this email' }, { status: 404 })
  }

  // If multiple athletes, return the list so user can pick
  // If single, return the athlete ID directly
  return NextResponse.json({
    athletes: athletes.map(a => ({
      id: a.id,
      name: `${a.first_name} ${a.last_name}`,
      sport: a.sport,
    })),
  })
}
