'use client'

import { useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'

export default function ParentApprove() {
  const { clip_id } = useParams()
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

  const handleApprove = async () => {
    setLoading(true)

    // Final payout logic (Stripe Transfer or Payout)
    // Stub for now — real Stripe payout here in production

    const { error } = await supabase
      .from('clips')
      .update({ status: 'paid' })
      .eq('id', clip_id)

    if (error) alert(error.message)
    else alert(`Approved! $${clip.offers.amount} sent to parent account.`)

    setLoading(false)
  }

  if (!clip) return <p className="container text-center">Loading...</p>

  return (
    <div className="container">
      <h1 className="text-center text-5xl mb-12">Parent Approval</h1>
      <p className="text-center mb-12 text-xl">Review your child's earned support</p>

      <div className="max-w-2xl mx-auto space-y-12 text-center">
        <p className="text-lg">Athlete: {clip.profiles.email}</p>
        <p className="text-lg">Offer: {clip.offers.type} — ${clip.offers.amount}</p>
        <video controls className="w-full max-w-lg mx-auto mb-8 border border-black">
          <source src={clip.video_url} type="video/mp4" />
        </video>

        <Button onClick={handleApprove} disabled={loading} className="w-full max-w-md text-lg py-6">
          {loading ? 'Processing...' : 'Approve & Release Payment'}
        </Button>
      </div>
    </div>
  )
}