'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { signOut } from '@/lib/auth'
import { Button } from '@/components/ui/button'

export default function Dashboard() {
  const [profile, setProfile] = useState<any>(null)
  const [business, setBusiness] = useState<any>(null)
  const [proposals, setProposals] = useState<any[]>([]) // proposals from kids
  const [offers, setOffers] = useState<any[]>([])
  const [pendingClips, setPendingClips] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'unclaimed' | 'active' | 'complete'>('unclaimed')
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

        // Proposals received from athletes (stub — real from pitches)
        const { data: props } = await supabase
          .from('proposals') // new table or stub
          .select('*')
          .eq('business_id', biz.id)
        setProposals(props || [])

        // Offers
        const { data: allOffers } = await supabase
          .from('offers')
          .select('*')
          .eq('business_id', biz.id)

        setOffers(allOffers || [])

        // Pending clips
        const { data: clips } = await supabase
          .from('clips')
          .select('*, offers(*), profiles(email, parent_email)')
          .eq('status', 'pending')
          .eq('business_id', biz.id)
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

  const copyLetter = () => { /* ... your code ... */ }
  const shareLetter = () => { /* ... your code ... */ }
  const postOffer = async (e: React.FormEvent) => { /* ... your code ... */ }
  const approveClip = async (clip: any) => { /* ... your code ... */ }

  if (!profile) return <p className="container text-center">Loading...</p>

  return (
    <div className="container">
      <p className="text-center mb-12 text-xl font-mono">Welcome, {profile.email}</p>

      {profile.role === 'athlete' ? (
        // Athlete dashboard unchanged
        <div className="max-w-2xl mx-auto space-y-16 font-mono text-center text-lg">
          {/* ... your full athlete code ... */}
        </div>
      ) : (
        <div className="max-w-4xl mx-auto space-y-16 font-mono text-center text-lg">
          <div>
            <h2 className="text-3xl mb-8 font-bold">Local Business Dashboard</h2>
            <p className="mb-8">Wallet balance: ${business?.wallet_balance?.toFixed(2) || '0.00'}</p>

            {/* Proposals Received */}
            <h3 className="text-2xl mb-8 font-bold">Proposals Received</h3>
            {proposals.length === 0 ? (
              <p className="mb-12">No proposals yet — kids will pitch you soon!</p>
            ) : (
              <div className="space-y-8 mb-16">
                {proposals.map((prop) => (
                  <div key={prop.id} className="border-4 border-black p-8 bg-white">
                    <p className="text-xl mb-4">{prop.athlete_name} proposes: {prop.gigs.join(', ')}</p>
                    <p className="mb-4">{prop.message}</p>
                    <Button className="mr-4">Accept</Button>
                    <Button variant="outline">Reject</Button>
                  </div>
                ))}
              </div>
            )}

            {/* Create Gig */}
            <Button onClick={() => router.push('/business-onboard')} className="w-full max-w-md h-20 text-2xl bg-black text-white hover:bg-gray-800 mb-16">
              Create Your Own Gig
            </Button>

            {/* Tabs */}
            <h3 className="text-2xl mb-8 font-bold">Your Offers</h3>
            <div className="flex justify-center gap-8 mb-8">
              <Button onClick={() => setActiveTab('unclaimed')} variant={activeTab === 'unclaimed' ? 'default' : 'outline'}>
                Unclaimed
              </Button>
              <Button onClick={() => setActiveTab('active')} variant={activeTab === 'active' ? 'default' : 'outline'}>
                Active
              </Button>
              <Button onClick={() => setActiveTab('complete')} variant={activeTab === 'complete' ? 'default' : 'outline'}>
                Complete
              </Button>
            </div>

            {/* Offers list */}
            <div className="space-y-16">
              {offers.filter(o => {
                if (activeTab === 'unclaimed') return !o.claimed
                if (activeTab === 'active') return o.claimed && o.status === 'active'
                if (activeTab === 'complete') return o.status === 'complete'
                return true
              }).map((offer) => (
                <div key={offer.id} className="border-4 border-black p-12 bg-white">
                  <p className="text-2xl font-bold mb-4">{offer.type} — ${offer.amount}</p>
                  <p className="mb-8">{offer.description}</p>
                  <p>Status: {offer.claimed ? 'Claimed' : 'Unclaimed'}</p>
                </div>
              ))}
            </div>

            {/* Pending Clips */}
            <h3 className="text-2xl mb-8 mt-16 font-bold">Pending Clips to Review</h3>
            {/* ... your pending clips code ... */}
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