'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'

export default function OpenGigs() {
  const [offers, setOffers] = useState<any[]>([])
  const router = useRouter()

  useEffect(() => {
    const fetchOffers = async () => {
      const { data } = await supabase
        .from('offers')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
      setOffers(data || [])
    }
    fetchOffers()
  }, [])

  return (
    <div className="container py-12">
      <h1 className="text-center text-5xl mb-12">Open Gigs</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {offers.length === 0 ? (
          <p className="text-center col-span-full text-xl text-gray-600">No open gigs yet — check back soon!</p>
        ) : (
          offers.map((offer) => (
            <div key={offer.id} className="border-4 border-black p-6 bg-white w-full max-w-xs mx-auto">
              <h2 className="text-2xl font-bold mb-4 text-center">{offer.type.toUpperCase()}</h2>
              <p className="text-3xl font-bold text-center mb-4">${offer.amount}</p>
              <p className="text-center mb-8 whitespace-pre-wrap">{offer.description}</p>
              <Button 
                onClick={() => router.push(`/claim/${offer.id}`)}
                className="w-full text-xl py-6 bg-black text-white hover:bg-gray-800"
              >
                Claim This Gig
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}