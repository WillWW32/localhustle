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
    <div className="container">
      <h1 className="text-center text-5xl mb-12">Claim Offer</h1>
      <p className="text-center mb-12 text-xl">{offer.type.toUpperCase()} — ${offer.amount}</p>
      <p className="text-center mb-12 max-w-2xl mx-auto">{offer.description}</p>

      <div className="max-w-md mx-auto space-y-8">
        <input
          type="file"
          accept="video/*"
          capture="environment"
          onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
          className="w-full border border-black px-4 py-2"
        />

        <Button onClick={handleUpload} disabled={uploading || !videoFile} className="w-full text-lg py-6">
          {uploading ? 'Uploading...' : 'Upload Clip & Claim'}
        </Button>
      </div>
    </div>
  )
}