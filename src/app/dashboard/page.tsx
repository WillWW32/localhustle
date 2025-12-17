'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { signOut } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast/Toast'  // assuming toast component

export default function Dashboard() {
  const [profile, setProfile] = useState<any>(null)
  const [business, setBusiness] = useState<any>(null)
  const [offers, setOffers] = useState<any[]>([])
  const [pendingClips, setPendingClips] = useState<any[]>([])
  const [type, setType] = useState('shoutout')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { addToast, ToastContainer } = useToast()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) {
          setError('Session expired or not logged in. Please log in again.')
          router.push('/')
          return
        }

        const { data: prof, error: profError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (profError || !prof) {
          setError('Failed to load profile. Please try logging out and in again.')
          return
        }

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
      } catch (err) {
        setError('Something went wrong loading your dashboard. Please refresh or log in again.')
        console.error(err)
      }
    }

    fetchData()
  }, [router])

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
    addToast('Letter copied to clipboard!', 'success')
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

    if (error) addToast(error.message, 'error')
    else {
      addToast('Offer posted!', 'success')
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
      addToast(clipError.message, 'error')
      return
    }

    await supabase
      .from('businesses')
      .update({ wallet_balance: business.wallet_balance - clip.offers.amount })
      .eq('id', business.id)

    addToast(`Clip sent to parent for final approval: ${clip.profiles.parent_email || 'parent email'}`, 'success')
    setPendingClips(pendingClips.filter(c => c.id !== clip.id))
    setBusiness({ ...business, wallet_balance: business.wallet_balance - clip.offers.amount })
  }

  if (error) {
    return (
      <div className="container text-center py-32">
        <p className="text-2xl text-red-600 mb-8">{error}</p>
        <Button onClick={signOut} className="w-72 h-20 text-2xl">
          Log Out & Try Again
        </Button>
      </div>
    )
  }

  if (!profile) return <p className="container text-center py-32">Loading...</p>

  return (
    <div className="container py-20">
      <div className="flex justify-between items-center mb-12">
        <p className="text-xl">Welcome, {profile.email}</p>
        <Button onClick={signOut} variant="outline" className="w-72 h-20 text-2xl">
          Log Out
        </Button>
      </div>

      {profile.role === 'athlete' ? (
        <div className="max-w-2xl mx-auto space-y-16">
          {/* Pinned Team Hustle Ambassador Gig */}
          <div className="card-lift border-4 border-black p-16 bg-gray-100 max-w-lg mx-auto">
            <h2 className="text-4xl mb-8 font-bold">Team Hustle Ambassador</h2>
            <p className="mb-6">Task: Make 10–20 business connections — send the support letter to local spots.</p>
            <p className="mb-6">Qualifications: Varsity player, manager, or photographer • 3.0 GPA or better</p>
            <p className="mb-8">Prize: $100 bonus (1 week deadline) • 5% lifetime cut of every gig from businesses you onboard</p>
            <p className="font-bold text-xl">Be the first — start pitching today!</p>
          </div>

          {/* Pinned Team Manager Gig */}
          <div className="card-lift border-4 border-black p-16 bg-gray-100 max-w-lg mx-auto">
            <h2 className="text-4xl mb-8 font-bold">Team Manager Support Gig</h2>
            <p className="mb-6">Task: Logistics + weekly updates tagging sponsor.</p>
            <p className="mb-6">Qualifications: Current manager • Reliable</p>
            <p className="mb-8">Prize: $150/month + perks</p>
          </div>

          <div className="text-center">
            <h2 className="text-3xl mb-8 font-bold">Student Athlete</h2>
            <p className="mb-12">Pitch local businesses for support — copy the letter below and send via text or email.</p>

            <div className="bg-gray-100 p-12 mb-16 border border-black max-w-lg mx-auto">
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

          <div>
            <h2 className="text-3xl mb-8 font-bold">Open Offers</h2>
            {offers.length === 0 ? (
              <p className="text-gray-600 mb-12">No offers yet — send letters to get businesses posting!</p>
            ) : (
              <div className="space-y-16">
                {offers.map((offer) => (
                  <div key={offer.id} className="card-lift border-4 border-black p-16 bg-white max-w-lg mx-auto">
                    <p className="font-bold text-2xl mb-6">{offer.type.toUpperCase()} — ${offer.amount}</p>
                    <p className="mb-12">{offer.description}</p>
                    <Button 
                      onClick={() => router.push(`/claim/${offer.id}`)}
                      className="w-72 h-20 text-2xl bg-black text-white hover:bg-gray-800"
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
        // Business view — same style
        <div className="max-w-2xl mx-auto space-y-16">
          <div className="text-center">
            <h2 className="text-3xl mb-8 font-bold">Local Business</h2>
            <p className="mb-8">Wallet balance: ${business?.wallet_balance?.toFixed(2) || '0.00'}</p>
            <Button 
              onClick={() => router.push('/business-onboard')}
              className="w-72 h-20 text-2xl bg-black text-white hover:bg-gray-800 mb-12"
            >
              Add Funds to Wallet
            </Button>

            <h3 className="text-2xl mb-8 font-bold">Pending Clips to Review</h3>
            {pendingClips.length === 0 ? (
              <p className="text-gray-600 mb-12">No pending clips — post offers to get started!</p>
            ) : (
              <div className="space-y-16">
                {pendingClips.map((clip) => (
                  <div key={clip.id} className="card-lift border-4 border-black p-16 bg-white max-w-lg mx-auto">
                    <p className="font-bold mb-6">From: {clip.profiles.email}</p>
                    <p className="mb-6">Offer: {clip.offers.type} — ${clip.offers.amount}</p>
                    <video controls className="w-full mb-8">
                      <source src={clip.video_url} type="video/mp4" />
                    </video>
                    <Button 
                      onClick={() => approveClip(clip)}
                      className="w-72 h-20 text-2xl bg-black text-white hover:bg-gray-800"
                    >
                      Approve & Send to Parent
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <h3 className="text-2xl mb-8 mt-12 font-bold">Post a New Offer</h3>
            <form onSubmit={postOffer} className="space-y-12 max-w-md mx-auto">
              <select value={type} onChange={(e) => setType(e.target.value)} className="w-full border-4 border-black p-6 text-xl">
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
                className="w-full border-4 border-black p-6 text-xl"
              />
              <textarea
                placeholder={type === 'booster' ? "Sponsoring the team — post-game meals, gear, or event. Money split equally among roster." : "Brief description"}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                className="w-full border-4 border-black p-6 h-40 text-xl"
              />
              <Button type="submit" className="w-72 h-20 text-2xl bg-black text-white hover:bg-gray-800">
                Post Offer
              </Button>
            </form>
          </div>
        </div>
      )}

      <ToastContainer />

      <div className="text-center mt-20">
        <Button onClick={signOut} variant="outline" className="w-72 h-20 text-2xl bg-black text-white hover:bg-gray-800">
          Log Out
        </Button>
      </div>
    </div>
  )
}