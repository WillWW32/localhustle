'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { signOut } from '@/lib/auth'
import { Button } from '@/components/ui/button'

export default function Dashboard() {
  const [profile, setProfile] = useState<any>(null)
  const [business, setBusiness] = useState<any>(null)
  const [offers, setOffers] = useState<any[]>([])
  const [pendingClips, setPendingClips] = useState<any[]>([])
  const router = useRouter()

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      setProfile(prof)

      if (prof.role === 'business') {
        const { data: biz } = await supabase
          .from('businesses')
          .select('*')
          .eq('owner_id', user.id)
          .single()
        setBusiness(biz)

        const { data: clips } = await supabase
          .from('clips')
          .select('*, offers(*), profiles(email, parent_email)')
          .eq('status', 'pending')
          .in('offer_id', (await supabase.from('offers').select('id').eq('business_id', biz.id)).data?.map(o => o.id) || [])
        setPendingClips(clips || [])
      }

      if (prof.role === 'athlete') {
        const { data: openOffers } = await supabase
          .from('offers')
          .select('*')
          .eq('status', 'active')
          .order('created_at', { ascending: false })
        setOffers(openOffers || [])
      }
    }
    fetchData()
  }, [])

  // ... your copyLetter, shareLetter, postOffer, approveClip functions ...

  if (!profile) return <p className="container text-center">Loading...</p>

  return (
    <div className="container">
      <p className="text-center mb-12 text-xl font-mono">Welcome, {profile.email}</p>

      {profile.role === 'athlete' ? (
        // Full athlete dashboard — letter, offers, pinned gigs
        <div className="max-w-2xl mx-auto space-y-16 font-mono text-center text-lg">
          {/* ... your full athlete code from before ... */}
        </div>
      ) : (
        // Full business dashboard — wallet, pending clips, post offer
        <div className="max-w-2xl mx-auto space-y-16 font-mono text-center text-lg">
          <div>
            <h2 className="text-3xl mb-8 font-bold">Local Business</h2>
            <p className="mb-8">Wallet balance: ${business?.wallet_balance?.toFixed(2) || '0.00'}</p>

            {/* Low balance warning */}
            {business?.wallet_balance < 100 && (
              <div className="text-center mb-12">
                <p className="text-2xl text-red-600 mb-4">Low balance — add funds to post more offers</p>
                <Button onClick={() => router.push('/business-onboard')} className="w-full max-w-md h-20 text-2xl">
                  Add Funds
                </Button>
              </div>
            )}

            <Button
              onClick={() => router.push('/business-onboard')}
              className="w-72 h-20 text-2xl bg-black text-white hover:bg-gray-800 mb-12"
            >
              Add Funds to Wallet
            </Button>

            {/* Pending Clips */}
            {/* ... your pending clips code ... */}

            {/* Post New Offer */}
            {/* ... your post offer form ... */}
          </div>
        </div>
      )}

      <div className="text-center mt-32">
        <Button onClick={signOut} variant="outline" className="text-base py-4 px-8">
          Log Out
        </Button>
      </div>
    </div>
  )
}