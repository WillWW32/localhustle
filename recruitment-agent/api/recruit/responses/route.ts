import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET(request: NextRequest) {
  try {
    const campaignId = request.nextUrl.searchParams.get('campaignId');
    const coachId = request.nextUrl.searchParams.get('coachId');

    if (!campaignId) {
      return NextResponse.json(
        { error: 'campaignId query parameter is required' },
        { status: 400 }
      );
    }

    let query = supabaseAdmin
      .from('responses')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: false });

    if (coachId) {
      query = query.eq('coach_id', coachId);
    }

    const { data: responses, error: responsesError } = await query;

    if (responsesError) {
      return NextResponse.json(
        { error: responsesError.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        count: responses?.length || 0,
        responses,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error('Responses GET error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      campaignId,
      coachId,
      athleteId,
      fromEmail,
      fromName,
      subject,
      body: responseBody,
      parentEmail,
    } = body;

    // Validate required fields
    if (!campaignId || !coachId || !athleteId || !parentEmail) {
      return NextResponse.json(
        { error: 'campaignId, coachId, athleteId, and parentEmail are required' },
        { status: 400 }
      );
    }

    // Fetch athlete to confirm
    const { data: athlete, error: athleteError } = await supabaseAdmin
      .from('athletes')
      .select('first_name, last_name, email')
      .eq('id', athleteId)
      .single();

    if (athleteError || !athlete) {
      return NextResponse.json(
        { error: 'Athlete not found' },
        { status: 404 }
      );
    }

    // Fetch coach info
    const { data: coach, error: coachError } = await supabaseAdmin
      .from('coaches')
      .select('first_name, last_name, email')
      .eq('id', coachId)
      .single();

    if (coachError || !coach) {
      return NextResponse.json(
        { error: 'Coach not found' },
        { status: 404 }
      );
    }

    // Record the response
    const { data: response, error: insertError } = await supabaseAdmin
      .from('responses')
      .insert({
        campaign_id: campaignId,
        coach_id: coachId,
        athlete_id: athleteId,
        from_email: coach.email,
        from_name: `${coach.first_name} ${coach.last_name}`,
        subject,
        body: responseBody,
      })
      .select()
      .single();

    if (insertError || !response) {
      return NextResponse.json(
        { error: insertError?.message || 'Failed to record response' },
        { status: 500 }
      );
    }

    // Forward the response to the parent email via Resend
    try {
      const forwardSubject = `FWD: ${subject}`;
      const forwardBody = `
Coach Response from ${coach.first_name} ${coach.last_name}:

${responseBody}

---
From: ${coach.email}
Original Recipient: ${athlete.email}
      `.trim();

      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'noreply@localhustle.org',
        to: parentEmail,
        subject: forwardSubject,
        text: forwardBody,
      });
    } catch (forwardError: any) {
      console.error('Failed to forward response to parent:', forwardError);
      // Don't fail the API response if forwarding fails, just log it
    }

    return NextResponse.json(
      {
        success: true,
        response,
        message: 'Response recorded and forwarded to parent email',
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error('Responses POST error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
