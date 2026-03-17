import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseClient'

export async function POST(request: NextRequest) {
  try {
    const { athleteId, slug } = await request.json()

    if (!athleteId || !slug) {
      return NextResponse.json({ error: 'Missing athleteId or slug' }, { status: 400 })
    }

    const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/--+/g, '-')

    if (cleanSlug.length < 3) {
      return NextResponse.json({ error: 'URL must be at least 3 characters' }, { status: 400 })
    }

    // Check if slug is already taken by another athlete
    const { data: existing } = await supabaseAdmin
      .from('athlete_profiles')
      .select('athlete_id')
      .eq('slug', cleanSlug)
      .neq('athlete_id', athleteId)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: 'This URL is already taken. Try a different one.' }, { status: 409 })
    }

    // Update the slug
    const { error } = await supabaseAdmin
      .from('athlete_profiles')
      .update({ slug: cleanSlug })
      .eq('athlete_id', athleteId)

    if (error) {
      console.error('Slug update error:', error)
      return NextResponse.json({ error: 'Failed to update URL' }, { status: 500 })
    }

    return NextResponse.json({ success: true, slug: cleanSlug })
  } catch (error) {
    console.error('Update slug error:', error)
    return NextResponse.json({ error: 'Failed to update URL' }, { status: 500 })
  }
}
