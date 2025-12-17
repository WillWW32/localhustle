'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { signOut } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

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
    const athleteId = profile?.id || 'fallback-id'
    const letterText = `Hey [Business Name],

I've been coming to [Your Spot] for years before and after practice.

Our team has joined a new app that helps us get community support for our athletic journey. I'm reaching out to my favorite spots to see if you would consider a sponsorship.

Here's what you would get: a short thank-you clip from me about your place. You can use the clip for social media if you want.

I'd probably get some new shoes or gear and be set for our roadtrips. It'd mean a lot for the team and I'd love to rep a local business that's got our back.

Interested? This link sets it up in like 30 seconds: https://app.localhustle.org/business-onboard?ref=${athleteId}

Thanks either way!

– ${profile?.email.split('@')[0] || 'me'}
${profile?.school || 'our local high school'} ${profile?.sport || 'varsity athlete'}`
    navigator.clipboard.writeText(letterText)
    alert('Letter copied to clipboard!')
  }

  const postOffer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!business) return

    const finalDescription = type === 'booster' ? 'Sponsoring the team — post-game meals, gear, or event. Money split equally among roster.' : description
    const finalAmount = type === 'booster' ? 1000 : parseFloat(amount)

    const { error } = await supabase
      .from('offers')
      .insert({
        business_id: business.id,
        type: type === 'booster' ? 'team_event' : type,
        amount: finalAmount,
        description: finalDescription,
        status: 'active',
      })

    if (error) alert(error.message)
    else {
      alert('Offer posted!')
      setAmount('')
      setDescription('')
      setType('shoutout')
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
      <p className="text-center mb-12 text-xl">Welcome, {profile.email}</p>

      {profile.role === 'athlete' ? (
        <div className="max-w-4xl mx-auto space-y-16">
          {/* Letter first */}
          <div className="text-center">
            <h2 className="text-3xl mb-8">Student Athletes Pitch Local</h2>
            <p className="mb-12">Copy or share the letter below to your favorite spots.</p>

            <div className="bg-gray-100 p-12 mb-12 border border-black max-w-lg mx-auto">
              <pre className="font-mono text-sm whitespace-pre-wrap text-left">
                {`Hey [Business Name],

I've been coming to [Your Spot] for years before and after practice.

Our team has joined a new app that helps us get community support for our athletic journey. I'm reaching out to my favorite spots to see if you would consider a sponsorship.

Here's what you would get: a short thank-you clip from me about your place. You can use the clip for social media if you want.

I'd probably get some new shoes or gear and be set for our roadtrips. It'd mean a lot for the team and I'd love to rep a local business that's got our back.

Interested? This link sets it up in like 30 seconds: https://app.localhustle.org/business-onboard?ref=${profile.id || 'fallback-id'}

Thanks either way!

– ${profile?.email.split('@')[0] || 'me'}
${profile?.school || 'our local high school'} ${profile?.sport || 'varsity athlete'}`}
              </pre>
            </div>

            <Button onClick={copyLetter} className="w-72 h-20 text-2xl bg-black text-white hover:bg-gray-800 mb-16">
              Copy Letter to Clipboard
            </Button>
          </div>

          {/* Open Offers — 2 rows of 3 smaller boxes */}
          <div>
            <h2 className="text-3xl mb-12 text-center">Open Offers</h2>
            {offers.length === 0 ? (
              <p className="text-center text-gray-600 mb-12">No offers yet — send letters to get businesses posting!</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12">
                {offers.map((offer) => (
                  <div key={offer.id} className="card-lift border-4 border-black p-12 bg-white">
                    <p className="font-bold text-2xl mb-4 text-center">{offer.type.toUpperCase()}</p>
                    <p className="font-bold text-3xl mb-6 text-center">${offer.amount}</p>
                    <p className="mb-8 text-center">{offer.description}</p>
                    <Button 
                      onClick={() => router.push(`/claim/${offer.id}`)}
                      className="w-full h-20 text-2xl bg-black text-white hover:bg-gray-800"
                    >
                      Claim This Gig
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pre-populating gigs at bottom — smaller */}
          <div className="space-y-16 mt-32">
            <div className="card-lift border-2 border-black p-12 bg-gray-100 max-w-md mx-auto">
              <h3 className="text-2xl mb-6 font-bold">Team Hustle Ambassador</h3>
              <p className="mb-4 text-left">Task: Make 10–20 business connections — send the support letter to local spots.</p>
              <p className="mb-4 text-left">Qualifications: Varsity player, manager, or photographer • 3.0 GPA or better</p>
              <p className="mb-6 text-left">Prize: $100 bonus (1 week deadline) • 5% lifetime cut of every gig from businesses you onboard</p>
              <p className="font-bold text-xl text-left">Be the first — start pitching today!</p>
            </div>

            <div className="card-lift border-2 border-black p-12 bg-gray-100 max-w-md mx-auto">
              <h3 className="text-2xl mb-6 font-bold">Team Manager Support Gig</h3>
              <p className="mb-4 text-left">Task: Logistics + weekly updates tagging sponsor.</p>
              <p className="mb-4 text-left">Qualifications: Current manager • Reliable</p>
              <p className="mb-6 text-left">Prize: $150/month + perks</p>
            </div>
          </div>
        </div>
      ) : (
        // Business view unchanged for now
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
                <option value="booster">Booster Club Team Event</option>
              </select>
              <input
                type="number"
                placeholder={type === 'booster' ? "Amount ($500–$2000 recommended)" : "Amount ($50–$1000)"}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="w-full border border-black px-4 py-2"
              />
              <textarea
                placeholder={type === 'booster' ? "Sponsoring the team — post-game meals, gear, or event. Money split equally among roster." : "Brief description"}
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

      {/* Responsive site-map footer (gray links) */}
      <footer className="mt-32 py-12 border-t-4 border-black">
        <div className="container text-center">
          <nav className="flex flex-wrap justify-center gap-4 mb-8 text-gray-600">
            <Link href="/" className="hover:underline">Home</Link>
            <Link href="/dashboard" className="hover:underline">Dashboard</Link>
            <Link href="/profile" className="hover:underline">Profile</Link>
            <Link href="/open-gigs" className="hover:underline">Open Gigs</Link>
            <Link href="/compliance" className="hover:underline">Compliance</Link>
            <Link href="/privacy" className="hover:underline">Privacy</Link>
            <Link href="/terms" className="hover:underline">Terms</Link>
          </nav>
          <p className="text-sm">
            © 2025 LocalHustle — Community Driven Support for Student Athletes
          </p>
        </div>
      </footer>
    </div>
  )
}