import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { renderTemplate, buildContext } from '@/lib/template-engine';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// GET: Fetch follow-up data (responded + non-responded coaches for a campaign)
export async function GET(request: NextRequest) {
  try {
    const campaignId = request.nextUrl.searchParams.get('campaignId');
    const athleteId = request.nextUrl.searchParams.get('athleteId');

    if (!campaignId || !athleteId) {
      return NextResponse.json(
        { error: 'campaignId and athleteId are required' },
        { status: 400 }
      );
    }

    // Fetch athlete
    const { data: athlete } = await supabaseAdmin
      .from('athletes')
      .select('*')
      .eq('id', athleteId)
      .single();

    if (!athlete) {
      return NextResponse.json({ error: 'Athlete not found' }, { status: 404 });
    }

    // Fetch all sent messages for this campaign (initial outreach)
    const { data: sentMessages } = await supabaseAdmin
      .from('messages')
      .select('id, coach_id, to_address, subject, sent_at, status')
      .eq('campaign_id', campaignId)
      .eq('type', 'email')
      .in('status', ['sent', 'delivered', 'opened'])
      .order('sent_at', { ascending: false });

    // Fetch all responses
    const { data: responses } = await supabaseAdmin
      .from('responses')
      .select('id, coach_id, from_address, subject, body, sentiment, created_at')
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: false });

    // Fetch all follow-ups already sent (type = 'follow_up' in messages)
    const { data: followupsSent } = await supabaseAdmin
      .from('messages')
      .select('id, coach_id, sent_at, status, subject')
      .eq('campaign_id', campaignId)
      .eq('type', 'follow_up')
      .order('sent_at', { ascending: false });

    const respondedCoachIds = new Set((responses || []).map((r: any) => r.coach_id));
    const followedUpCoachIds = new Set((followupsSent || []).map((m: any) => m.coach_id));

    // Get unique coach IDs from sent messages
    const sentCoachIds = [...new Set((sentMessages || []).map((m: any) => m.coach_id))];

    // Fetch coach details for all sent coaches
    const { data: coaches } = await supabaseAdmin
      .from('coaches')
      .select('id, first_name, last_name, email, school, division, state, title')
      .in('id', sentCoachIds.length > 0 ? sentCoachIds : ['00000000-0000-0000-0000-000000000000']);

    const coachMap = new Map((coaches || []).map((c: any) => [c.id, c]));

    // Build responded list
    const responded = (responses || []).map((r: any) => {
      const coach = coachMap.get(r.coach_id);
      return {
        responseId: r.id,
        coachId: r.coach_id,
        coachName: coach ? `${coach.first_name} ${coach.last_name}` : 'Unknown',
        school: coach?.school || '',
        division: coach?.division || '',
        sentiment: r.sentiment || 'neutral',
        responseBody: r.body,
        responseSubject: r.subject,
        respondedAt: r.created_at,
        followUpSent: followedUpCoachIds.has(r.coach_id),
      };
    });

    // Build non-responded list
    const nonResponded = sentCoachIds
      .filter(id => !respondedCoachIds.has(id))
      .map(id => {
        const coach = coachMap.get(id);
        const msg = (sentMessages || []).find((m: any) => m.coach_id === id);
        return {
          coachId: id,
          coachName: coach ? `${coach.first_name} ${coach.last_name}` : 'Unknown',
          school: coach?.school || '',
          division: coach?.division || '',
          email: coach?.email || '',
          sentAt: msg?.sent_at,
          daysSince: msg?.sent_at
            ? Math.floor((Date.now() - new Date(msg.sent_at).getTime()) / (1000 * 60 * 60 * 24))
            : null,
          followUpSent: followedUpCoachIds.has(id),
        };
      })
      .sort((a, b) => (b.daysSince || 0) - (a.daysSince || 0));

    // Generate pre-populated follow-up messages
    const followUpTemplates = {
      responded_positive: `Coach {{coach_last}},\n\nThank you for your response and interest. I am very excited about the opportunity at {{school}}.\n\nI wanted to follow up and see if there are any next steps, whether that is a phone call, campus visit, or additional film you would like to see.\n\nI have continued to work hard and improve my game. Here is my highlight film again for reference:\n{{highlight_url}}\n\nPlease feel free to reach out anytime. I look forward to hearing from you.\n\nRespectfully,\n{{athlete_first}} {{athlete_last}}\n{{high_school}} — Class of {{grad_year}}`,

      responded_neutral: `Coach {{coach_last}},\n\nThank you for getting back to me. I understand you have many athletes to evaluate.\n\nI wanted to follow up and share that I am still very interested in {{school}}. I have been putting in work and believe I can contribute to your program.\n\nHere is my updated highlight film:\n{{highlight_url}}\n\nI would love the opportunity to speak with you or visit campus. Please let me know if there is anything else I can provide.\n\nRespectfully,\n{{athlete_first}} {{athlete_last}}\n{{high_school}} — Class of {{grad_year}}`,

      no_response: `Coach {{coach_last}},\n\nI hope this message finds you well. I reached out a few weeks ago about my interest in {{school}} and your basketball program.\n\nI wanted to follow up in case my original email was missed. I am a {{grad_year}} {{position}} from {{high_school}} in {{city}}, {{state}} — {{height}}, averaging {{ppg}} PPG, {{rpg}} RPG, and {{spg}} SPG.\n\nHere is my highlight film:\n{{highlight_url}}\n\nI would love to learn more about your program and what you look for in recruits. Please feel free to contact me at {{athlete_email}} or my father, {{parent_name}}, at {{parent_email}}.\n\nThank you for your time, Coach.\n\nRespectfully,\n{{athlete_first}} {{athlete_last}}\n{{high_school}} — Class of {{grad_year}}`,
    };

    return NextResponse.json({
      success: true,
      responded,
      nonResponded,
      followUpTemplates,
      stats: {
        totalSent: sentCoachIds.length,
        responded: responded.length,
        nonResponded: nonResponded.length,
        followUpsSent: followedUpCoachIds.size,
        responseRate: sentCoachIds.length > 0
          ? Math.round((responded.length / sentCoachIds.length) * 100)
          : 0,
      },
    });
  } catch (err: any) {
    console.error('Follow-up GET error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Send a follow-up email
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { campaignId, athleteId, coachId, subject, message } = body;

    if (!campaignId || !athleteId || !coachId || !message) {
      return NextResponse.json(
        { error: 'campaignId, athleteId, coachId, and message are required' },
        { status: 400 }
      );
    }

    // Fetch athlete
    const { data: athlete } = await supabaseAdmin
      .from('athletes')
      .select('*')
      .eq('id', athleteId)
      .single();

    if (!athlete) {
      return NextResponse.json({ error: 'Athlete not found' }, { status: 404 });
    }

    // Fetch coach
    const { data: coach } = await supabaseAdmin
      .from('coaches')
      .select('*')
      .eq('id', coachId)
      .single();

    if (!coach) {
      return NextResponse.json({ error: 'Coach not found' }, { status: 404 });
    }

    // Render the message with template variables
    const context = buildContext(athlete, coach);
    const renderedBody = renderTemplate(message, context);
    const renderedSubject = subject
      ? renderTemplate(subject, context)
      : `Following Up — ${athlete.first_name} ${athlete.last_name} | ${athlete.grad_year} ${athlete.position}`;

    // Create message record
    const { data: msgRecord, error: insertError } = await supabaseAdmin
      .from('messages')
      .insert({
        campaign_id: campaignId,
        coach_id: coachId,
        athlete_id: athleteId,
        type: 'follow_up',
        channel: 'resend',
        to_address: coach.email,
        subject: renderedSubject,
        body: renderedBody,
        status: 'queued',
      })
      .select()
      .single();

    if (insertError || !msgRecord) {
      return NextResponse.json(
        { error: insertError?.message || 'Failed to create message' },
        { status: 500 }
      );
    }

    // Send via Resend
    try {
      const result = await resend.emails.send({
        from: `${athlete.first_name} ${athlete.last_name} <${athlete.email}>`,
        to: coach.email,
        subject: renderedSubject,
        text: renderedBody,
      });

      await supabaseAdmin
        .from('messages')
        .update({
          status: 'sent',
          resend_id: result.data?.id,
          sent_at: new Date().toISOString(),
        })
        .eq('id', msgRecord.id);

      return NextResponse.json({
        success: true,
        messageId: msgRecord.id,
        resendId: result.data?.id,
        sentTo: coach.email,
      });
    } catch (sendErr: any) {
      await supabaseAdmin
        .from('messages')
        .update({ status: 'failed', error: sendErr.message })
        .eq('id', msgRecord.id);

      return NextResponse.json(
        { error: sendErr.message, messageId: msgRecord.id },
        { status: 500 }
      );
    }
  } catch (err: any) {
    console.error('Follow-up POST error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
