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
  const [type, setType] = useState('shoutout')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
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

  const copyLetter = () => {
    // ... your copyLetter code ...
  }

  const shareLetter = () => {
    // ... your shareLetter code ...
  }

  const postOffer = async (e: React.FormEvent) => {
    // ... your postOffer code ...
  }

  const approveClip = async (clip: any) => {
    // ... your approveClip code ...
  }

  if (!profile) return <p className="container text-center">Loading...</p>

  return (
    <div className="container">
      <p className="text-center mb-12 text-xl font-mono">Welcome, {profile.email}</p>

      {profile.role === 'athlete' ? (
        <div className="max-w-2xl mx-auto space-y-16 font-mono text-center text-lg">
          {/* Gig Preferences */}
          <div>
            <h2 className="text-3xl mb-8 font-bold">Gigs You Accept</h2>
            <p className="mb-8">Default: ShoutOut + Season Update</p>
            {/* Toggle for gigs — stub for now */}
            <p className="mb-12">Edit in profile (coming soon)</p>
          </div>

          {/* Letter first */}
          <div>
            <h2 className="text-3xl mb-8 font-bold">Student Athlete</h2>
            <p className="mb-12">Pitch local businesses for support — copy or share the letter below.</p>
            <p className="mb-8 text-red-600 font-bold">Edit the letter to make it personal — add your favorite order or memory!</p>
            {/* ... your letter code ... */}
            <div className="space-y-8">
              <Button onClick={shareLetter} className="w-full max-w-md h-20 text-2xl bg-black text-white hover:bg-gray-800">
                Share Letter (Text, Instagram, etc.)
              </Button>
              <Button onClick={copyLetter} variant="outline" className="w-full max-w-md h-20 text-2xl">
                Copy Letter to Clipboard
              </Button>
            </div>
          </div>

          {/* Open Offers */}
          {/* ... your open offers code ... */}

          {/* Pinned gigs at bottom */}
          <div className="space-y-16 mt-32">
            <div className="card-lift border-2 border-black p-12 bg-gray-100 max-w-md mx-auto">
              <h3 className="text-2xl mb-6 font-bold">Apply to Be Team Hustle Ambassador</h3>
              <p className="mb-4 text-left">Task: Make 10–20 business connections — send the support letter to local spots.</p>
              <p className="mb-4 text-left">Qualifications: Varsity player, manager, or photographer • 3.0 GPA or better</p>
              <p className="mb-6 text-left">Prize: $100 bonus (1 week deadline) • 5% lifetime cut of every gig from businesses you onboard</p>
              <Button className="w-full h-20 text-2xl bg-black text-white hover:bg-gray-800">
                Apply Now
              </Button>
            </div>
          </div>
        </div>
      ) : (
        // Business view — proposals received, create gig, tabs
        <div className="max-w-2xl mx-auto space-y-16 font-mono text-center text-lg">
          <div>
            <h2 className="text-3xl mb-8 font-bold">Local Business</h2>
            <p className="mb-8">Wallet balance: ${business?.wallet_balance?.toFixed(2) || '0.00'}</p>

            {/* Proposals Received */}
            <h3 className="text-2xl mb-8 font-bold">Proposals Received</h3>
            {/* Stub — list proposals from kids */}
            <p className="mb-12">No proposals yet — kids will pitch you!</p>

            {/* Create Gig */}
            <Button onClick={() => router.push('/business-onboard')} className="w-full max-w-md h-20 text-2xl bg-black text-white hover:bg-gray-800 mb-12">
              Create Your Own Gig
            </Button>

            {/* Tabs */}
            <h3 className="text-2xl mb-8 font-bold">Your Offers</h3>
            <div className="space-y-8">
              <p>Unclaimed / Active / Complete tabs coming