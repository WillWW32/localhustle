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

    const fileExt = videoFile.name.split('.').pop()
    const fileName = `${Date.now()}.${fileExt}`
    const filePath = `${user.id}/${fileName}` // athlete folder

    const { error: uploadError } = await supabase.storage
      .from('video-clips') // ← new bucket
      .upload(filePath, videoFile, { upsert: true })

    if (uploadError) {
      alert('Upload failed: ' + uploadError.message)
      setUploading(false)
      return
    }

    const { data: urlData } = supabase.storage
      .from('video-clips')
      .getPublicUrl(filePath)

    const { error: dbError } = await supabase
      .from('clips')
      .insert({
        offer_id: offer.id,
        athlete_id: user.id,
        video_url: urlData.publicUrl,
        status: 'pending',
        delivery_option: deliveryOption,
      })

    if (dbError) {
      alert('Save failed: ' + dbError.message)
    } else {
      alert('Clip uploaded — waiting for business approval!')
      router.push('/dashboard')
    }

    setUploading(false)
  }

  if (!offer) return <p className="container text-center py-32">Loading offer...</p>

  return (
    <div className="min-h-screen bg-white text-black font-mono py-8 px-4 sm:px-8">
      {/* Slogan + Triangle */}
      <p className="text-2xl sm:text-3xl text-center mb-4">
        Community Driven Support for Student Athletes
      </p>
      <div className="text-5xl sm:text-6xl text-center mb-12">▼</div>

      {/* Offer Title */}
      <h1 className="text-3xl sm:text-5xl font-bold text-center mb-8">
        Claim: {offer.type} — ${offer.amount}
      </h1>

      {/* Description */}
      <p className="text-lg sm:text-2xl text-center mb-12 max-w-3xl mx-auto leading-relaxed">
        {offer.description}
      </p>

      {/* Delivery Option */}
      <div className="max-w-2xl mx-auto mb-12">
        <h2 className="text-2xl sm:text-3xl font-bold mb-8 text-center">
          How will you deliver?
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          <div 
            className={`p-8 border-4 ${deliveryOption === 'private' ? 'border-black bg-gray-100' : 'border-gray-400'} cursor-pointer`}
            onClick={() => setDeliveryOption('private')}
          >
            <h3 className="text-xl font-bold mb-4">Private Upload</h3>
            <p>Record & upload video here — only business sees it.</p>
          </div>
          <div 
            className={`p-8 border-4 ${deliveryOption === 'public' ? 'border-black bg-gray-100' : 'border-gray-400'} cursor-pointer`}
            onClick={() => setDeliveryOption('public')}
          >
            <h3 className="text-xl font-bold mb-4">Public Social Post</h3>
            <p>Post on your social — tag business + @localhustle.</p>
            {deliveryOption === 'public' && (
              <p className="text-sm text-gray-600 mt-4">
                Must tag @localhustl and the business. Caption example: "Shoutout to [Business] for supporting local athletes! #LocalHustle"
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Private Upload */}
      {deliveryOption === 'private' && (
        <div className="max-w-md mx-auto mb-12">
          <input
            type="file"
            accept="video/*"
            capture="environment"
            onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
            className="w-full p-8 text-center border-4 border-black bg-white text-lg"
          />
        </div>
      )}

      {/* Submit Button */}
      <div className="max-w-md mx-auto">
        {deliveryOption === 'private' && (
          <Button onClick={handleUpload} disabled={uploading || !videoFile} className="w-full h-20 text-2xl sm:text-3xl bg-green-400 text-black">
            {uploading ? 'Uploading...' : 'Upload Clip & Claim'}
          </Button>
        )}

        {deliveryOption === 'public' && (
          <Button onClick={() => router.push('/dashboard')} className="w-full h-20 text-2xl sm:text-3xl bg-green-400 text-black">
            I'll Post on Social & Claim
          </Button>
        )}
      </div>
    </div>
  )
}