
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'
import { resend } from '@/lib/resend'  // your existing Resend instance

export async function POST(request: Request) {
  const { business_id, type, amount, description, target_athlete_email, is_repeat } = await request.json()

  if (!business_id || !type || !amount) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Fetch business name for email
  const { data: business } = await supabase
    .from('businesses')
    .select('name')
    .eq('id', business_id)
    .single()

  const businessName = business?.name || 'A Local Sponsor'

  // Insert gig
  const { data: gig, error } = await supabase
    .from('offers')
    .insert({
      business_id,
      type,
      amount,
      description,
      target_athlete_email: target_athlete_email || null,
      is_repeat: is_repeat || false,
      status: 'active',
    })
    .select()
    .single()

  if (error) {
    console.error('Gig creation error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Send notification to targeted athlete (if any)
  if (target_athlete_email) {
    try {
      await resend.emails.send({
        from: 'LocalHustle <notifications@localhustle.org>',
        to: target_athlete_email,
        subject: `New $${amount} ${type} Gig from ${businessName}!`,
        text: `Hey!

${businessName} just posted a $${amount} ${type} gig for you on LocalHustle.

${description ? description + '\n\n' : ''}Log in to complete it and get paid instantly!

https://app.localhustle.org/athlete-dashboard

Let's go!
— LocalHustle Team`,
        html: `<p>Hey!</p>
<p><strong>${businessName}</strong> just posted a <strong>$${amount} ${type}</strong> gig for you on LocalHustle.</p>
${description ? `<p>${description}</p>` : ''}
<p>Log in to complete it and get paid instantly!</p>
<p><a href="https://app.localhustle.org/athlete-dashboard" style="background:#000;color:#fff;padding:1rem 2rem;text-decoration:none;font-weight:bold;">Claim Gig Now</a></p>
<p>Let's go!<br/>— LocalHustle Team</p>`,
      })
    } catch (emailError) {
      console.error('Resend error:', emailError)
      // Don't fail gig creation if email fails
    }
  }

  return NextResponse.json({ gig })
}