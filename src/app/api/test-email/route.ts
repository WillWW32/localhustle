import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function GET() {
  try {
    const data = await resend.emails.send({
      from: 'no-reply@localhustle.org',
      to: ['your-test-email@example.com'], // replace with your email
      subject: 'Test Email from LocalHustle',
      text: 'This is a test email. If you see this, Resend is working!',
    })

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error })
  }
}