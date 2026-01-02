// src/app/api/attach-payment-method/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  const body = await request.json()
  const { payment_method_id, business_id, parent_id, athlete_id } = body

  if (!payment_method_id) {
    return NextResponse.json({ error: 'Missing payment_method_id' }, { status: 400 })
  }

  const role = business_id ? 'business' : parent_id ? 'parent' : athlete_id ? 'athlete' : null
  const userId = business_id || parent_id || athlete_id

  if (!role || !userId) {
    return NextResponse.json({ error: 'Missing valid role ID' }, { status: 400 })
  }

  try {
    let table
    if (role === 'business') table = 'businesses'
    else if (role === 'parent') table = 'parents'  // even if table doesn't exist yet, safe
    else table = 'profiles'

    const { data, error } = await supabase
      .from(table)
      .update({ debit_card_token: payment_method_id })
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ 
      success: true, 
      message: 'Card saved successfully',
      token: payment_method_id // optional echo
    })
  } catch (error: any) {
    console.error('Save card error:', error)
    return NextResponse.json({ error: error.message || 'Failed to save card' }, { status: 500 })
  }
}