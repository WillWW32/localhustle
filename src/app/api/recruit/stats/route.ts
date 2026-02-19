import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseClient'

export async function GET(request: NextRequest) {
  try {
    const campaignId = request.nextUrl.searchParams.get('campaignId')

    if (!campaignId) {
      return NextResponse.json({ error: 'campaignId query parameter is required' }, { status: 400 })
    }

    const { data: campaign, error: campaignError } = await supabaseAdmin
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .single()

    if (campaignError || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    const { data: messages } = await supabaseAdmin
      .from('messages')
      .select('id, created_at, status, type')
      .eq('campaign_id', campaignId)
      .eq('type', 'email')
      .eq('status', 'sent')

    const totalSent = messages?.length || 0

    const { data: dailyStats } = await supabaseAdmin
      .from('daily_log')
      .select('date, emails_sent, dms_sent')
      .eq('campaign_id', campaignId)
      .order('date', { ascending: false })

    const { data: responses } = await supabaseAdmin
      .from('responses')
      .select('id, created_at')
      .eq('campaign_id', campaignId)

    const responseCount = responses?.length || 0
    const openRate = totalSent > 0 ? ((responseCount / totalSent) * 100).toFixed(2) : '0.00'

    const dailyBreakdown = (dailyStats || []).map((day: any) => ({
      date: day.date,
      emailsSent: day.emails_sent,
      dmsSent: day.dms_sent,
    }))

    return NextResponse.json({
      success: true,
      campaign: {
        id: campaign.id,
        athlete_id: campaign.athlete_id,
        name: campaign.name || '',
        daily_email_limit: campaign.daily_email_limit,
        created_at: campaign.created_at,
        status: campaign.status,
      },
      totalEmailsSent: totalSent,
      dailyBreakdown,
      responseCount,
      openRate: parseFloat(openRate),
    })
  } catch (err: any) {
    console.error('Stats error:', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}
