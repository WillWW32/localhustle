import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseClient'

// GET: Fetch template for a campaign
export async function GET(request: NextRequest) {
  const campaignId = request.nextUrl.searchParams.get('campaignId')
  if (!campaignId) {
    return NextResponse.json({ error: 'campaignId is required' }, { status: 400 })
  }

  const { data: template, error } = await supabaseAdmin
    .from('templates')
    .select('*')
    .eq('campaign_id', campaignId)
    .eq('type', 'email')
    .single()

  if (error || !template) {
    return NextResponse.json({ template: null })
  }

  return NextResponse.json({ template })
}

// PUT: Update template subject and body
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { campaignId, subject, bodyText } = body

    if (!campaignId) {
      return NextResponse.json({ error: 'campaignId is required' }, { status: 400 })
    }

    // Check if template exists
    const { data: existing } = await supabaseAdmin
      .from('templates')
      .select('id')
      .eq('campaign_id', campaignId)
      .eq('type', 'email')
      .single()

    if (existing) {
      // Update existing
      const { error } = await supabaseAdmin
        .from('templates')
        .update({ subject, body: bodyText, updated_at: new Date().toISOString() })
        .eq('id', existing.id)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    } else {
      // Create new
      const { error } = await supabaseAdmin
        .from('templates')
        .insert({
          campaign_id: campaignId,
          name: 'Initial Outreach',
          type: 'email',
          subject,
          body: bodyText,
        })

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
