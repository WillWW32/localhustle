import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseClient'

function generateSlug(firstName: string, lastName: string): string {
  return `${firstName.toLowerCase()}-${lastName.toLowerCase()}-${Date.now()}`
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { parent, athlete } = body

    if (!parent?.name || !parent?.email || !parent?.phone) {
      return NextResponse.json({ error: 'Missing parent information' }, { status: 400 })
    }

    if (!athlete?.firstName || !athlete?.lastName || !athlete?.sport || !athlete?.position) {
      return NextResponse.json({ error: 'Missing athlete information' }, { status: 400 })
    }

    const slug = generateSlug(athlete.firstName, athlete.lastName)

    // Insert athlete record
    const { data: athleteRecord, error: athleteError } = await supabaseAdmin
      .from('athletes')
      .insert({
        first_name: athlete.firstName,
        last_name: athlete.lastName,
        email: parent.email,
        parent_name: parent.name,
        parent_email: parent.email,
        parent_phone: parent.phone,
        sport: athlete.sport,
        position: athlete.position,
        height: athlete.height || null,
        weight: athlete.weight || null,
        grad_year: athlete.gradYear || null,
        high_school: athlete.highSchool || null,
        city: athlete.city || null,
        state: athlete.state || null,
        slug,
      })
      .select()
      .single()

    if (athleteError) {
      console.error('Athlete insert error:', athleteError)
      return NextResponse.json({ error: athleteError.message || 'Failed to create athlete' }, { status: 500 })
    }

    // Auto-create campaign for this athlete
    const { data: campaign, error: campaignError } = await supabaseAdmin
      .from('campaigns')
      .insert({
        athlete_id: athleteRecord.id,
        name: `${athlete.firstName} ${athlete.lastName} Campaign`,
        status: 'active',
        daily_email_limit: 25,
        target_divisions: ['D1', 'D2', 'NAIA'],
      })
      .select()
      .single()

    if (campaignError) {
      console.error('Campaign create error:', campaignError)
      // Don't fail the whole signup — athlete was created
    }

    // Auto-create default email template
    if (campaign) {
      const { error: templateError } = await supabaseAdmin
        .from('templates')
        .insert({
          campaign_id: campaign.id,
          type: 'initial',
          subject: 'Interested in {{school}} - {{athleteName}} ({{gradYear}} {{position}})',
          body: `Dear {{coachName}},\n\nMy name is {{athleteName}} and I am a {{gradYear}} {{position}} at {{highSchool}} in {{city}}, {{state}}.\n\nI am very interested in {{school}} and would love the opportunity to discuss how I can contribute to your program.\n\nHere is a link to my highlight video: {{highlightUrl}}\n\nThank you for your time and consideration.\n\nRespectfully,\n{{athleteName}}`,
          variables: {
            coachName: 'Coach last name',
            athleteName: 'Athlete full name',
            school: 'School name',
            gradYear: 'Graduation year',
            position: 'Position',
            highSchool: 'High school name',
            city: 'City',
            state: 'State',
            highlightUrl: 'Highlight video URL',
          },
        })

      if (templateError) {
        console.error('Template create error:', templateError)
      }
    }

    // Auto-create athlete profile for public page
    const { error: profileError } = await supabaseAdmin
      .from('athlete_profiles')
      .insert({
        athlete_id: athleteRecord.id,
        slug,
        headline: `${athlete.sport} - ${athlete.position}`,
        about: '',
        achievements: [],
        visibility: 'public',
        views: 0,
      })

    if (profileError) {
      console.error('Profile create error:', profileError)
    }

    return NextResponse.json({
      success: true,
      athleteId: athleteRecord.id,
      campaignId: campaign?.id || null,
      slug,
      message: 'Athlete profile created successfully',
    })
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Signup failed' },
      { status: 500 }
    )
  }
}
