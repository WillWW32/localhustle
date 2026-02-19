import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Webhook for Resend inbound emails
 * When a coach replies to josiah@localhustle.org, this captures the reply,
 * stores it in the responses table, and forwards it to the parent_email.
 *
 * Expected webhook payload from Resend:
 * {
 *   type: 'email.delivered' | 'email.bounced' | other,
 *   data: {
 *     from_email: 'coach@example.com',
 *     to_email: 'josiah@localhustle.org',
 *     subject: 'Re: Recruitment Opportunity',
 *     body: 'Thank you for reaching out...',
 *     in_reply_to: 'message-id-from-original-email'
 *   }
 * }
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Verify the webhook is for an inbound email
    if (body.type !== 'email.inbound') {
      return NextResponse.json(
        { received: true, message: 'Webhook acknowledged but not an inbound email' },
        { status: 200 }
      );
    }

    const {
      from_email,
      to_email,
      subject,
      body: emailBody,
      in_reply_to,
    } = body.data || {};

    if (!from_email || !to_email || !emailBody) {
      return NextResponse.json(
        { error: 'Missing required email fields' },
        { status: 400 }
      );
    }

    // The inbound email is for josiah@localhustle.org
    // We need to find which athlete/campaign this belongs to
    // If in_reply_to is provided, use it to find the original message

    let campaignId: string | null = null;
    let athleteId: string | null = null;
    let coachEmail = from_email;

    if (in_reply_to) {
      // Find the original message by resend_id
      const { data: originalMessage, error: msgError } = await supabaseAdmin
        .from('messages')
        .select('campaign_id, athlete_id, coach_id')
        .eq('resend_id', in_reply_to)
        .single();

      if (originalMessage) {
        campaignId = originalMessage.campaign_id;
        athleteId = originalMessage.athlete_id;
      }
    }

    // If we couldn't find via in_reply_to, try to match the coach email to recent messages
    if (!campaignId || !athleteId) {
      const { data: recentMessage, error: matchError } = await supabaseAdmin
        .from('messages')
        .select('campaign_id, athlete_id, coach_id')
        .eq('to_address', from_email)
        .eq('type', 'email')
        .eq('status', 'sent')
        .order('sent_at', { ascending: false })
        .limit(1)
        .single();

      if (recentMessage) {
        campaignId = recentMessage.campaign_id;
        athleteId = recentMessage.athlete_id;

        // Find the coach_id from the coach email
        const { data: coach, error: coachError } = await supabaseAdmin
          .from('coaches')
          .select('id')
          .eq('email', from_email)
          .single();

        if (coach) {
          coachEmail = coach.id;
        }
      }
    }

    if (!campaignId || !athleteId) {
      return NextResponse.json(
        { error: 'Could not match inbound email to a campaign' },
        { status: 400 }
      );
    }

    // Fetch athlete to get parent email
    const { data: athlete, error: athleteError } = await supabaseAdmin
      .from('athletes')
      .select('parent_email, first_name, last_name, email')
      .eq('id', athleteId)
      .single();

    if (athleteError || !athlete) {
      return NextResponse.json(
        { error: 'Athlete not found' },
        { status: 404 }
      );
    }

    // Fetch coach details
    const { data: coach, error: coachError } = await supabaseAdmin
      .from('coaches')
      .select('id, first_name, last_name, school')
      .eq('email', from_email)
      .single();

    const coachId = coach?.id;
    const coachName = coach
      ? `${coach.first_name} ${coach.last_name}`
      : from_email;

    if (!coach || !coachId) {
      return NextResponse.json(
        { error: 'Coach not found' },
        { status: 404 }
      );
    }

    // Record the response in the responses table
    const { data: response, error: insertError } = await supabaseAdmin
      .from('responses')
      .insert({
        campaign_id: campaignId,
        coach_id: coachId,
        athlete_id: athleteId,
        from_email,
        from_name: coachName,
        subject,
        body: emailBody,
      })
      .select()
      .single();

    if (insertError || !response) {
      console.error('Failed to insert response:', insertError);
      return NextResponse.json(
        { error: insertError?.message || 'Failed to record response' },
        { status: 500 }
      );
    }

    // Forward the response to the parent email
    if (athlete.parent_email) {
      try {
        const forwardSubject = `[${coach.school || 'Coach'}] ${subject}`;
        const forwardBody = `
Inbound Coach Response for ${athlete.first_name} ${athlete.last_name}:

From: ${coachName} <${from_email}>
School: ${coach.school || 'N/A'}

---

${emailBody}

---
Forwarded by Recruitment Agent
Original athlete email: ${athlete.email}
      `.trim();

        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'noreply@localhustle.org',
          to: athlete.parent_email,
          subject: forwardSubject,
          text: forwardBody,
        });

        // Update response record to mark as forwarded
        await supabaseAdmin
          .from('responses')
          .update({
            forwarded_at: new Date().toISOString(),
            forwarded_to: athlete.parent_email,
          })
          .eq('id', response.id);
      } catch (forwardError: any) {
        console.error('Failed to forward response to parent:', forwardError);
        // Log but don't fail - we've successfully recorded the response
      }
    }

    return NextResponse.json(
      {
        success: true,
        responseId: response.id,
        message: 'Response recorded and forwarded to parent',
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error('Inbox webhook error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
