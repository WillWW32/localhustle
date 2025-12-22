'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'

export default function ClaimOffer() {
  const { id } = useParams()
  const router = useRouter()
  const [offer, setOffer] = useState<any>(null)
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [deliveryOption, setDeliveryOption] = useState<'private' | 'public'>('private')
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    const fetchOffer = async () => {
      const { data } = await supabase
        .from('offers')
        .select('*')
        .eq('id', id)
        .single()
      setOffer(data)
    }
    fetchOffer()
  }, [id])

  const handleUpload = async () => {
    if (!videoFile || !offer) return
    setUploading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      alert('Please log in')
      setUploading(false)
      return
    }

    const filePath = `${offer.id}/${user.id}-${Date.now()}.mp4`

    const { error: uploadError } = await supabase.storage
      .from('clips')
      .upload(filePath, videoFile)

    if (uploadError) {
      alert(uploadError.message)
      setUploading(false)
      return
    }

    const { data: urlData } = supabase.storage
      .from('clips')
      .getPublicUrl(filePath)

    const { error } = await supabase
      .from('clips')
      .insert({
        offer_id: offer.id,
        athlete_id: user.id,
        video_url: urlData.publicUrl,
        status: 'pending',
        delivery_option: deliveryOption,
      })

    if (error) {
      alert(error.message)
    } else {
      if (deliveryOption === 'public') {
        alert('Clip uploaded! Post on IG/TT and tag @localhustl + business for $10 bonus.')
      } else {
        alert('Clip uploaded! Business will review soon.')
      }
      router.push('/dashboard')
    }

    setUploading(false)
  }

  if (!offer) return <p className="container text-center py-32">Loading offer...</p>

  return (
    <div style={{
      fontFamily: "'Courier New', Courier, monospace",
      textAlign: 'center',
      padding: '2rem',
      backgroundColor: 'white',
      color: 'black',
      minHeight: '100vh',
    }}>
      {/* Slogan + Triangle */}
      <p style={{ fontSize: '2rem', marginBottom: '1rem' }}>
        Community Driven Support for Student Athletes
      </p>
      <div style={{ fontSize: '3rem', marginBottom: '4rem' }}>▼</div>

      {/* Subtitle — black block */}
      <div style={{ backgroundColor: 'black', color: 'white', padding: '2rem', marginBottom: '4rem' }}>
        <h1 style={{ fontSize: '1.8rem', margin: '0' }}>
          Claim This Gig
        </h1>
      </div>

      {/* Detail — black block */}
      <div style={{ backgroundColor: 'black', color: 'white', padding: '2rem', marginBottom: '4rem' }}>
        <p style={{ fontSize: '1.2rem', lineHeight: '1.8' }}>
          {offer.type.toUpperCase()}<br />
          {offer.description}<br />
          {offer.date && `Date: ${offer.date}`}<br />
          {offer.location && `Location: ${offer.location}`}
        </p>
      </div>

      {/* Main Content */}
      <div className="max-w-md mx-auto space-y-20">
        <div className="space-y-8">
          <label className="block text-3xl text-center mb-8">
            Record or Upload Your Clip
          </label>

          {/* Delivery Options */}
          <div className="space-y-4 mb-12">
            <label className="flex items-center space-x-4">
              <input type="radio" name="delivery" value="private" checked={deliveryOption === 'private'} onChange={(e) => setDeliveryOption(e.target.value as 'private')} />
              <span className="text-xl">Private Video Send (upload here — business sees only)</span>
            </label>
            <label className="flex items-center space-x-4">
              <input type="radio" name="delivery" value="public" checked={deliveryOption === 'public'} onChange={(e) => setDeliveryOption(e.target.value as 'public')} />
              <span className="text-xl">Public Social Post (IG or TT — $10 bonus)</span>
            </label>
            {deliveryOption === 'public' && (
              <p className="text-sm text-gray-600">
                Must tag @localhustl and the business. Caption example: "Shoutout to [Business] for supporting local athletes! #LocalHustle"
              </p>
            )}
          </div>

          {deliveryOption === 'private' && (
            <input
              type="file"
              accept="video/*"
              capture="environment"
              onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
              style={{
                width: '100%',
                padding: '2rem',
                fontSize: '1.5rem',
                border: '4px solid black',
                textAlign: 'center',
                backgroundColor: 'white',
              }}
            />
          )}
        </div>

        {deliveryOption === 'private' && (
          <Button onClick={handleUpload} disabled={uploading || !videoFile} style={{
            width: '100%',
            height: '80px',
            fontSize: '2rem',
            backgroundColor: '#90ee90',
            color: 'black',
            fontFamily: "'Courier New', Courier, monospace'",
          }}>
            {uploading ? 'Uploading...' : 'Upload Clip & Claim'}
          </Button>
        )}

        {deliveryOption === 'public' && (
          <Button onClick={() => router.push('/dashboard')} style={{
            width: '100%',
            height: '80px',
            fontSize: '2rem',
            backgroundColor: '#90ee90',
            color: 'black',
            fontFamily: "'Courier New', Courier, monospace'",
          }}>
            I'll Post on Social & Claim
          </Button>
        )}
      </div>
    </div>
  )
}