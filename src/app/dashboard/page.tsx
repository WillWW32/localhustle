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
  const [sessionError, setSessionError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchData = async () => {
      try {
        let { data: { session }, error: sessionError } = await supabase.auth.getSession()
        if (sessionError || !session) {
          setSessionError('Session expired — please log in again.')
          return
        }

        // Auto-refresh if close to expiry
        if (session.expires_at && session.expires_at * 1000 < Date.now() + 60000) {
          const { error: refreshError } = await supabase.auth.refreshSession()
          if (refreshError) throw refreshError
          const { data } = await supabase.auth.getSession()
          session = data.session
        }

        if (!session?.user) {
          setSessionError('No user in session — please log in again.')
          return
        }

        const { data: prof, error: profError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (profError) throw profError

        setProfile(prof)

        if (prof.role === 'business') {
          const { data: biz } = await supabase
            .from('businesses')
            .select('*')
            .eq('owner_id', session.user.id)
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
        setSessionError('Session expired — please log in again.')
        console.error(err)
      }
    }

    fetchData()
  }, [router])

  if (sessionError) {
    return (
      <div className="container text-center py-32">
        <p className="text-2xl mb-8">{sessionError}</p>
        <Button onClick={signOut} className="w-72 h-20 text-2xl">
          Log Out & Log In Again
        </Button>
      </div>
    )
  }

  if (!profile) return <p className="container text-center py-32">Loading...</p>

  return (
    <div className="container">
      <p className="text-center mb-12 text-xl font-mono">Welcome, {profile.email}</p>

      {profile.role === 'athlete' ? (
        <div className="max-w-2xl mx-auto space-y-16 font-mono text-center text-lg">
          {/* Letter first */}
          <div>
            <h2 className="text-3xl mb-8 font-bold">Student Athlete</h2>
            <p className="mb-12">Pitch local businesses for support — copy the letter below and send via text or email.</p>

            <div className="bg-gray-100 p-12 mb-16 border border-black max-w-lg mx-auto">
              <pre className="font-mono text-sm whitespace-pre-wrap text-left">
                {`Hey [Business Name],

I've been coming to [Your Spot] for years before and after practice.

Our team has joined a new app that helps us get community support for our athletic journey. I'm reaching out to my favorite spots to see if you would consider a sponsorship.

Here's what you would get: a short thank-you clip from me about your place. You can use the clip for social media if you want.

I'd probably get some new shoes or gear and be set for our roadtrips. It means a lot for me and the team and I'd love to rep a local business that's got our back.

This link has all the details for how it works: https://app.localhustle.org/business-onboard?ref=${profile.id || 'fallback-id'}

Thanks either way!

– ${profile?.email.split('@')[0] || 'me'}
${profile?.school || 'our local high school'} ${profile?.sport || 'varsity athlete'}`}
              </pre>
            </div>

            <Button onClick={copyLetter} className="w-72 h-20 text-2xl bg-black text-white hover:bg-gray-800 mb-16">
              Copy Letter to Clipboard
            </Button>
          </div>

          {/* Open Offers */}
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

          {/* Pinned gigs at bottom */}
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
        // Business view unchanged
        <div className="max-w-2xl mx-auto space-y-16 font-mono text-center text-lg">
          <div>
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
                  <div key={clip.id} className="card-lift border-4 border-black p-20 bg-white max-w-lg mx-auto">
                    <p className="font-bold mb-6 text-left">From: {clip.profiles.email}</p>
                    <p className="mb-6 text-left">Offer: {clip.offers.type} — ${clip.offers.amount}</p>
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

      {/* Small Log Out at bottom */}
      <div className="text-center mt-32">
        <Button onClick={signOut} variant="outline" className="text-base py-4 px-8">
          Log Out
        </Button>
      </div>
    </div>
  )
}