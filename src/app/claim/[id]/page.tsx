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
      })

    if (error) {
      alert(error.message)
    } else {
      alert('Clip uploaded! Business will review soon.')
      router.push('/dashboard')
    }

    setUploading(false)
  }

  if (!offer) return <p className="container text-center">Loading offer...</p>

  return (
    <div className="container py-20">
      <h1 className="text-center text-5xl mb-12">Claim Offer</h1>

      {/* Offer card with card-lift */}
      <div className="card-lift border-4 border-black p-12 bg-gray-100 max-w-2xl mx-auto mb-20">
        <p className="text-4xl font-bold mb-6 text-center">{offer.type.toUpperCase()} — ${offer.amount}</p>
        <p className="text-2xl mb-12 text-center">{offer.description}</p>
      </div>

      <div className="max-w-md mx-auto space-y-20">
        <div className="space-y-8">
          <label htmlFor="video" className="block text-3xl text-center mb-8">
            Record or Upload Your Clip
          </label>
          <input
            id="video"
            type="file"
            accept="video/*"
            capture="environment"
            onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
            className="w-full py-20 text-2xl border-4 border-black text-center block mx-auto bg-white"
          />
        </div>

        <Button onClick={handleUpload} disabled={uploading || !videoFile} className="w-full py-20 text-4xl border-8 border-black bg-black text-white hover:bg-gray-800">
          {uploading ? 'Uploading...' : 'Upload Clip & Claim'}
        </Button>
      </div>
    </div>
  )
}