import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseClient'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { athleteId, field, value } = body

    if (!athleteId || !field) {
      return NextResponse.json({ error: 'Missing athleteId or field' }, { status: 400 })
    }

    const allowedAthleteFields = ['instagram_reels', 'bio', 'highlight_url', 'profile_image_url', 'photos', 'parent_email', 'parent_name']
    const allowedProfileFields = ['about', 'achievements']

    if (allowedAthleteFields.includes(field)) {
      const dbField = field === 'bio' ? 'bio' : field
      const { error } = await supabaseAdmin
        .from('athletes')
        .update({ [dbField]: value })
        .eq('id', athleteId)

      if (error) {
        console.error('Update athlete error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    } else if (allowedProfileFields.includes(field)) {
      const { error } = await supabaseAdmin
        .from('athlete_profiles')
        .update({ [field]: value })
        .eq('athlete_id', athleteId)

      if (error) {
        console.error('Update profile error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    } else {
      return NextResponse.json({ error: 'Invalid field' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update profile error:', error)
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}
