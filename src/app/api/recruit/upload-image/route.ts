import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseClient'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const athleteId = formData.get('athleteId') as string

    if (!file || !athleteId) {
      return NextResponse.json({ error: 'Missing file or athleteId' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const path = `public/${athleteId}-profile.jpg`

    const { error: uploadErr } = await supabaseAdmin.storage
      .from('profile-pics')
      .upload(path, buffer, {
        upsert: true,
        contentType: file.type || 'image/jpeg',
      })

    if (uploadErr) {
      console.error('Upload error:', uploadErr)
      return NextResponse.json({ error: uploadErr.message }, { status: 500 })
    }

    const { data: urlData } = supabaseAdmin.storage
      .from('profile-pics')
      .getPublicUrl(path)

    if (!urlData?.publicUrl) {
      return NextResponse.json({ error: 'Failed to get public URL' }, { status: 500 })
    }

    // Update athlete record
    const { error: updateErr } = await supabaseAdmin
      .from('athletes')
      .update({ profile_image_url: urlData.publicUrl })
      .eq('id', athleteId)

    if (updateErr) {
      console.error('Update error:', updateErr)
      return NextResponse.json({ error: updateErr.message }, { status: 500 })
    }

    return NextResponse.json({ url: urlData.publicUrl })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
