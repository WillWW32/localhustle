'use client'

import { useParams } from 'next/navigation'
import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'

export default function ParentApprove() {
  const { clip_id } = useParams()
  const [loading, setLoading] = useState(false)

  const handleApprove = async () => {
    setLoading(true)
    // Test mode — no real card entry yet
    alert('Parent approved (test mode)! Payout sent.')
    const { error } = await supabase
      .from('clips')
      .update({ status: 'paid' })
      .eq('id', clip_id)

    if (error) alert(error.message)
    setLoading(false)
  }

  return (
    <div className="container py-20">
      <h1 className="text-center text-5xl mb-12">Parent Approval</h1>
      <p className="text-center text-2xl mb-20">Your child earned from a gig.</p>

      <div className="max-w-md mx-auto space-y-12">
        <Button onClick={handleApprove} disabled={loading} className="w-full h-20 text-3xl bg-black text-white hover:bg-gray-800">
          Approve Payout
        </Button>
      </div>
    </div>
  )
}