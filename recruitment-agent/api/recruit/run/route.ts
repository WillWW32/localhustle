import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { renderTemplate, buildContext } from '@/lib/template-engine';
import { sendRecruitmentEmail } from '@/lib/email-sender';

interface RunRequest {
  campaignId: string;
  maxEmails?: number;
  maxDms?: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: RunRequest = await request.json();
    const { campaignId, maxEmails = 10, maxDms = 0 } = body;

    if (!campaignId) {
      return NextResponse.json(
        { error: 'campaignId is required' },
        { status: 400 }
      );
    }

    // Fetch campaign details
    const { data: campaign, error: campaignError } = await supabaseAdmin
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    // Fetch athlete details
    const { data: athlete, error: athleteError } = await supabaseAdmin
      .from('athletes')
      .select('*')
      .eq('id', campaign.athlete_id)
      .single();

    if (athleteError || !athlete) {
      return NextResponse.json(
        { error: 'Athlete not found' },
        { status: 404 }
      );
    }

    // Fetch the campaign's email template
    const { data: emailTemplate, error: templateError } = await supabaseAdmin
      .from('templates')
      .select('*')
      .eq('campaign_id', campaignId)
      .eq('type', 'email')
      .single();

    if (templateError || !emailTemplate) {
      return NextResponse.json(
        { error: 'Email template not found for this campaign' },
        { status: 404 }
      );
    }

    // Get the current date and check daily limit
    const today = new Date().toISOString().split('T')[0];

    // Fetch or create daily log entry
    let { data: dailyLog, error: dailyLogError } = await supabaseAdmin
      .from('daily_log')
      .select('emails_sent, dms_sent')
      .eq('campaign_id', campaignId)
      .eq('date', today)
      .single();

    if (dailyLogError) {
      // Create if doesn't exist
      await supabaseAdmin
        .from('daily_log')
        .insert({
          campaign_id: campaignId,
          date: today,
          emails_sent: 0,
          dms_sent: 0,
        });
      dailyLog = { emails_sent: 0, dms_sent: 0 };
    }

    const emailsSentToday = dailyLog?.emails_sent || 0;
    const dmssSentToday = dailyLog?.dms_sent || 0;

    const emailsRemaining = Math.max(0, campaign.daily_email_limit - emailsSentToday);
    const emailsToSend = Math.min(maxEmails, emailsRemaining);

    // Fetch un-contacted coaches for this campaign
    const { data: coaches, error: coachError } = await supabaseAdmin
      .from('coaches')
      .select('*')
      .not('messages', 'not.is', null)
      .filter('messages.campaign_id', 'eq', campaignId)
      .filter('messages.status', 'not.eq', 'failed')
      .limit(emailsToSend);

    // Alternative approach: fetch coaches without explicit contact
    let { data: uncontactedCoaches, error: uncontactedError } = await supabaseAdmin
      .from('coaches')
      .select('id, first_name, last_name, email, school, title, division, state')
      .not(
        'id',
        'in',
        `(SELECT DISTINCT coach_id FROM messages WHERE campaign_id = '${campaignId}')`
      )
      .limit(emailsToSend);

    if (uncontactedError) {
      // Fallback: simpler query
      const { data: allCoaches } = await supabaseAdmin
        .from('coaches')
        .select('id, first_name, last_name, email, school, title, division, state');

      const { data: contactedIds } = await supabaseAdmin
        .from('messages')
        .select('coach_id')
        .eq('campaign_id', campaignId);

      const contactedSet = new Set(contactedIds?.map((m: any) => m.coach_id) || []);
      uncontactedCoaches = (allCoaches || [])
        .filter((c: any) => !contactedSet.has(c.id))
        .slice(0, emailsToSend);
    }

    const emailsSent: string[] = [];
    const dmsSent: string[] = [];
    const errors: Array<{ coach: string; error: string }> = [];

    // Send emails to un-contacted coaches
    if (uncontactedCoaches && uncontactedCoaches.length > 0) {
      for (const coach of uncontactedCoaches) {
        // Add 1-second delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 1000));

        try {
          // Build context with athlete and coach info
          const context = buildContext(athlete, coach);

          // Render email template
          const subject = renderTemplate(emailTemplate.subject || 'Recruitment Opportunity', context);
          const body = renderTemplate(emailTemplate.body || '', context);

          // Send email via Resend
          const sendResult = await sendRecruitmentEmail({
            campaignId,
            coachId: coach.id,
            athleteId: athlete.id,
            fromEmail: athlete.email,
            fromName: athlete.first_name + ' ' + athlete.last_name,
            toEmail: coach.email,
            subject,
            body,
          });

          if (sendResult.success) {
            emailsSent.push(coach.id);
          } else {
            errors.push({
              coach: coach.id,
              error: sendResult.error || 'Unknown error',
            });
          }
        } catch (err: any) {
          errors.push({
            coach: coach.id,
            error: err.message || 'Failed to send email',
          });
        }

        // Stop if we've hit the limit
        if (emailsSent.length >= emailsToSend) {
          break;
        }
      }
    }

    // Calculate remaining coaches
    const { data: allCoaches } = await supabaseAdmin
      .from('coaches')
      .select('id');
    const { data: contactedIds } = await supabaseAdmin
      .from('messages')
      .select('coach_id')
      .eq('campaign_id', campaignId);

    const contactedSet = new Set(contactedIds?.map((m: any) => m.coach_id) || []);
    const remaining = (allCoaches || []).length - contactedSet.size;

    return NextResponse.json(
      {
        success: true,
        emailsSent: emailsSent.length,
        dmsSent: dmsSent.length,
        errors,
        remaining: Math.max(0, remaining - emailsSent.length),
        sentCoachIds: emailsSent,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error('Recruitment run error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
