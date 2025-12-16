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
    const letterText = `Hey [Business Name],

I'm ${profile?.email.split('@')[0] || 'a student athlete'} from ${profile?.school || 'our local high school'} — ${profile?.sport || 'varsity athlete'}.

Small ask: could you sponsor a quick 15-second thank-you clip about your spot? If you like it, send $75.

It's shoes, gas, or lunch money for me and the team. No strings, parent-approved.

Want to help? Tap this link to set it up (30 seconds): https://localhustle.vercel.app/business-onboard?ref=${profile?.id}

Thanks!
– ${profile?.email.split('@')[0] || 'me'}`
    navigator.clipboard.writeText(letterText)
    alert('Letter copied to clipboard!')
  }

  const postOffer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!business) return

    const { error } = await supabase
      .from('offers')
      .insert({
        business_id: business.id,
        type,
        amount: parseFloat(amount),
        description,
        status: 'active',
      })

    if (error) alert(error.message)
    else {
      alert('Offer posted!')
      setAmount('')
      setDescription('')
    }
  }

  const approveClip = async (clip: any) => {
    const { error: clipError } = await supabase
      .from('clips')
      .update({ status: 'waiting_parent' })
      .eq('id', clip.id)

    if (clipError) {
      alert(clipError.message)
      return
    }

    await supabase
      .from('businesses')
      .update({ wallet_balance: business.wallet_balance - clip.offers.amount })
      .eq('id', business.id)

    alert(`Clip sent to parent for final approval: ${clip.profiles.parent_email || 'parent email'}`)
    setPendingClips(pendingClips.filter(c => c.id !== clip.id))
    setBusiness({ ...business, wallet_balance: business.wallet_balance - clip.offers.amount })
  }

  if (!profile) return <p className="container text-center">Loading...</p>

  return (
    <div className="container">
      <h1 className="text-center text-5xl mb-12">LocalHustle</h1>
      <p className="text-center mb-12 text-xl">Welcome, {profile.email}</p>

      {profile.role === 'athlete' ? (
        <div className="max-w-2xl mx-auto space-y-12">
          <div className="text-center">
            <h2 className="text-3xl mb-6">Student Athlete</h2>
            <p className="mb-8">Pitch local businesses for support — copy the letter below and send via text or email.</p>

            <div className="bg-gray-100 p-8 mb-12 border border-black">
              <pre className="font-mono text-sm whitespace-pre-wrap text-left">
                {`Hey [Business Name],

I'm ${profile.email.split('@')[0]} from ${profile.school || 'our local high school'} — ${profile.sport || 'varsity athlete'}.

Small ask: could you sponsor a quick 15-second thank-you clip about your spot? If you like it, send $75.

It's shoes, gas, or lunch money for me and the team. No strings, parent-approved.

Want to help? Tap this link to set it up (30 seconds): hhttps://localhustle.vercel.app/business-onboard?ref=${profile.id}

Thanks!
– ${profile.email.split('@')[0]}`}
              </pre>
            </div>

            <Button onClick={copyLetter} className="w-full max-w-md text-lg py-6 mb-12">
              Copy Letter to Clipboard
            </Button>
          </div>

          <div>
            <h2 className="text-3xl mb-6 text-center">Open Offers</h2>
            {offers.length === 0 ? (
              <p className="text-center text-gray-600">No offers yet — send letters to get businesses posting!</p>
            ) : (
              <div className="space-y-8">
                {offers.map((offer) => (
                  <div key={offer.id} className="border border-black p-6 bg-white">
                    <p className="font-bold text-xl mb-2">{offer.type.toUpperCase()} — ${offer.amount}</p>
                    <p className="mb-4">{offer.description}</p>
                    <Button 
                      onClick={() => router.push(`/claim/${offer.id}`)}
                      className="w-full text-lg py-4"
                    >
                      Claim Offer
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="max-w-2xl mx-auto space-y-12">
          <div className="text-center">
            <h2 className="text-3xl mb-6">Local Business</h2>
            <p className="mb-8">Wallet balance: ${business?.wallet_balance?.toFixed(2) || '0.00'}</p>
            <Button 
              onClick={() => router.push('/business-onboard')}
              className="w-full max-w-md text-lg py-6 mb-12"
            >
              Add Funds to Wallet
            </Button>

            <h3 className="text-2xl mb-6">Pending Clips to Review</h3>
            {pendingClips.length === 0 ? (
              <p className="text-gray-600">No pending clips — post offers to get started!</p>
            ) : (
              <div className="space-y-8">
                {pendingClips.map((clip) => (
                  <div key={clip.id} className="border border-black p-6 bg-white">
                    <p className="font-bold mb-2">From: {clip.profiles.email}</p>
                    <p className="mb-4">Offer: {clip.offers.type} — ${clip.offers.amount}</p>
                    <video controls className="w-full mb-4">
                      <source src={clip.video_url} type="video/mp4" />
                    </video>
                    <Button 
                      onClick={() => approveClip(clip)}
                      className="w-full text-lg py-4"
                    >
                      Approve & Send to Parent
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <h3 className="text-2xl mb-6 mt-12">Post a New Offer</h3>
            <form onSubmit={postOffer} className="space-y-4 max-w-md mx-auto">
              <select value={type} onChange={(e) => setType(e.target.value)} className="w-full border border-black px-4 py-2">
                <option value="shoutout">Shoutout Clip</option>
                <option value="experience">Experience</option>
                <option value="clinic">Clinic</option>
                <option value="perk">Perk Pack</option>
                <option value="pay">Pay Direct</option>
                <option value="scholarship">Scholarship Boost</option>
              </select>
              <input
                type="number"
                placeholder="Amount ($50–$1000)"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="w-full border border-black px-4 py-2"
              />
              <textarea
                placeholder="Brief description (e.g., 15-sec thank-you clip)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                className="w-full border border-black px-4 py-2 h-32"
              />
              <Button type="submit" className="w-full text-lg py-6">
                Post Offer
              </Button>
            </form>
          </div>
        </div>
      )}

      <div className="text-center mt-12">
        <Button onClick={signOut} variant="outline" className="text-lg py-6">
          Log Out
        </Button>
      </div>
    </div>
  )
}