import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY!)

export async function POST(request: Request) {
  const { email, subject, text } = await request.json()

  const { data, error } = await resend.emails.send({
    from: 'LocalHustle <notifications@localhustle.org>',
    to: email,
    subject,
    text,
  })

  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ success: true })
}