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

    const photoIndex = formData.get('photoIndex') as string | null
    const buffer = Buffer.from(await file.arrayBuffer())
    const ext = file.type === 'image/png' ? 'png' : 'jpg'
    const path = photoIndex != null
      ? `${athleteId}-photo-${photoIndex}.${ext}`
      : `${athleteId}-profile.${ext}`

    // Ensure the storage bucket exists and is public
    const { error: bucketErr } = await supabaseAdmin.storage.createBucket('profile-pics', {
      public: true,
      fileSizeLimit: 5242880, // 5MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    })
    // Ignore "already exists" error
    if (bucketErr && !bucketErr.message?.includes('already exists')) {
      console.error('Bucket creation error:', bucketErr)
    }

    // Remove old files to avoid stale cache
    if (photoIndex != null) {
      await supabaseAdmin.storage
        .from('profile-pics')
        .remove([`${athleteId}-photo-${photoIndex}.jpg`, `${athleteId}-photo-${photoIndex}.png`])
    } else {
      await supabaseAdmin.storage
        .from('profile-pics')
        .remove([path, `public/${athleteId}-profile.jpg`, `public/${athleteId}-profile.png`])
    }

    const { error: uploadErr } = await supabaseAdmin.storage
      .from('profile-pics')
      .upload(path, buffer, {
        upsert: true,
        contentType: file.type || 'image/jpeg',
        cacheControl: '0',
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

    // Append cache-buster so browsers and CDNs fetch the new image
    const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`

    // Update athlete record only for profile pic uploads (not photo gallery)
    if (photoIndex == null) {
      const { error: updateErr } = await supabaseAdmin
        .from('athletes')
        .update({ profile_image_url: publicUrl })
        .eq('id', athleteId)

      if (updateErr) {
        console.error('Update error:', updateErr)
        return NextResponse.json({ error: updateErr.message }, { status: 500 })
      }
    }

    return NextResponse.json({ url: publicUrl })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
