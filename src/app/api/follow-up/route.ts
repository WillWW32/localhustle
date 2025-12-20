import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function POST(request: Request) {
  const { business_email, kid_name, link } = await request.json()

  // Send email (Resend or SendGrid — stub for now)
  console.log(`Follow-up email to ${business_email}: Still interested in sponsoring ${kid_name}? ${link}`)

  return NextResponse.json({ success: true })
}