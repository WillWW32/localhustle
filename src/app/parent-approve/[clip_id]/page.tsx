'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'

export default function ParentApprove() {
  const { clip_id } = useParams()
  const router = useRouter()
  const [clip, setClip] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchClip = async () => {
      const { data } = await supabase
        .from('clips')
        .select('*, offers(*), profiles(email)')
        .eq('id', clip_id)
        .single()
      setClip(data)
    }
    fetchClip()
  }, [clip_id])

  const approve = async () => {
    setLoading(true)
    const { error } = await supabase
      .from('clips')
      .update({ status: 'paid' })
      .eq('id', clip_id)

    if (error) {
      alert(error.message)
    } else {
      alert('Approved! Payout sent (test mode — manual transfer for now).')
      router.push('/')
    }
    setLoading(false)
  }

  const deny = async () => {
    setLoading(true)
    const { error } = await supabase
      .from('clips')
      .update({ status: 'denied' })
      .eq('id', clip_id)

    if (error) {
      alert(error.message)
    } else {
      alert('Denied — business notified.')
      router.push('/')
    }
    setLoading(false)
  }

  if (!clip) return <p className="container text-center">Loading...</p>

  return (
    <div className="container py-20">
      <h1 className="text-center text-5xl mb-12">Parent Approval</h1>
      <p className="text-center text-2xl mb-12">
        Your child completed a gig for ${clip.offers.amount} from a local business.
      </p>

      <video controls className="w-full max-w-2xl mx-auto mb-12 border-4 border-black">
        <source src={clip.video_url} type="video/mp4" />
      </video>

      <div className="max-w-md mx-auto space-y-12">
        <Button onClick={approve} disabled={loading} className="w-full py-20 text-4xl bg-black text-white hover:bg-gray-800">
          Approve & Send Payout
        </Button>

        <Button onClick={deny} disabled={loading} variant="outline" className="w-full py-20 text-4xl border-4 border-black">
          Deny
        </Button>
      </div>
    </div>
  )
}