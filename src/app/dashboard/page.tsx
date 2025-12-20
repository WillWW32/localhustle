'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { signOut } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const gigTypes = [
  { title: 'ShoutOut', baseAmount: 50, description: 'Visit a favorite business and make a quick shoutout 15-sec reel about what you like or your favorite order.' },
  { title: 'Youth Clinic', baseAmount: 500, description: 'Run 30–60 min sessions for younger athletes (with teammates).' },
  { title: 'Team Sponsor', baseAmount: 1000, description: 'Business sponsors team meals/gear — money split equally.' },
  { title: 'Cameo', baseAmount: 100, description: 'Custom 15-Sec Video for Younger Athletes (birthdays, pre-game pep talks).' },
  { title: 'Player Training', baseAmount: 100, description: 'Varsity athlete 40-minute training with young player.' },
  { title: 'Custom Gig', baseAmount: 200, description: 'Create a gig and offer it.' },
]

export default function Dashboard() {
  const [profile, setProfile] = useState<any>(null)
  const [business, setBusiness] = useState<any>(null)
  const [offers, setOffers] = useState<any[]>([])
  const [pendingClips, setPendingClips] = useState<any[]>([])
  const [selectedGig, setSelectedGig] = useState<any>(null)
  const [numAthletes, setNumAthletes] = useState(1)
  const [customDetails, setCustomDetails] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState('')
  const [location, setLocation] = useState('')
  const [businessPhone, setBusinessPhone] = useState('')
  const [isRecurring, setIsRecurring] = useState(false)
  const router = useRouter()

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'LocalHustle',
        text: 'Join LocalHustle — earn from local business sponsorships as a high school athlete!',
        url: 'https://app.localhustle.org',
      }).catch(console.error)
    } else {
      alert('Copy this link to share: https://app.localhustle.org')
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.replace('/')
        return
      }

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
  }, [router])

  const handleGigSelect = (gig: any) => {
    setSelectedGig(gig)
    setNumAthletes(1)
    setAmount(gig.baseAmount.toString())
    setCustomDetails('')
    setDate('')
    setLocation('')
    setBusinessPhone('')
    setIsRecurring(false)
  }

  const handleAthletesChange = (value: number) => {
    setNumAthletes(value)
    if (selectedGig) {
      const total = selectedGig.baseAmount + (value - 1) * 75
      setAmount(total.toString())
    }
  }

  const handlePost = async () => {
    alert('Offer posted (live mode)!')
  }

  const copyLetter = () => {
    const athleteId = profile?.id || 'fallback-id'
    const letterText = `Hey [Business Name],

I've been coming to [Your Spot] for years before and after practice.

Our team has joined a new app that helps us get community support for our athletic journey. I'm reaching out to my favorite spots to see if you would consider a sponsorship.

Here's what you would get: a short thank-you clip from me about your place. You can use the clip for social media if you want.

I'd probably get some new shoes or gear and be set for our roadtrips. It means a lot for me and the team and I'd love to rep a local business that's got our back.

This link has all the details for how it works: https://app.localhustle.org/business-onboard?ref=${athleteId}

Thanks either way!

– ${profile?.email.split('@')[0] || 'me'}
${profile?.school || 'our local high school'} ${profile?.sport || 'varsity athlete'}`
    navigator.clipboard.writeText(letterText)
    alert('Letter copied to clipboard!')
  }

  const shareLetter = () => {
    const athleteId = profile?.id || 'fallback-id'
    const letterText = `Hey [Business Name],

I've been coming to [Your Spot] for years before and after practice.

Our team has joined a new app that helps us get community support for our athletic journey. I'm reaching out to my favorite spots to see if you would consider a sponsorship.

Here's what you would get: a short thank-you clip from me about your place. You can use the clip for social media if you want.

I'd probably get some new shoes or gear and be set for our roadtrips. It means a lot for me and the team and I'd love to rep a local business that's got our back.

This link has all the details for how it works: https://app.localhustle.org/business-onboard?ref=${athleteId}

Thanks either way!

– ${profile?.email.split('@')[0] || 'me'}
${profile?.school || 'our local high school'} ${profile?.sport || 'varsity athlete'}`

    if (navigator.share) {
      navigator.share({
        title: 'LocalHustle Sponsorship',
        text: letterText,
      }).catch(() => {
        copyLetter()
      })
    } else {
      copyLetter()
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

  if (!profile) return <p className="container text-center py-32">Loading...</p>

  return (
    <div className="container py-8">
      <p className="text-center mb-12 text-xl font-mono">Welcome, {profile.email}</p>

      {/* Share button — only for athlete */}
      {profile.role === 'athlete' && (
        <div style={{ margin: '4rem 0', textAlign: 'center' }}>
          <Button onClick={handleShare} style={{
            width: '100%',
            maxWidth: '500px',
            height: '80px',
            fontSize: '30px',
            backgroundColor: 'black',
            color: 'white',
            fontFamily: "'Courier New', Courier, monospace'",
          }}>
            Share with Teammates
          </Button>
        </div>
      )}

      {profile.role === 'athlete' ? (
        <div className="max-w-2xl mx-auto space-y-16 font-mono text-center text-lg">
          {/* Letter first */}
          <div>
            <h2 className="text-3xl mb-8 font-bold">Student Athlete</h2>
            <p className="mb-12">Pitch local businesses for support — copy or share the letter below.</p>

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
        <div className="max-w-4xl mx-auto space-y-16 font-mono text-center text-lg">
          <div>
            <h2 className="text-3xl mb-8 font-bold">Business Admin Console</h2>
            <p className="mb-8">Wallet balance: ${business?.wallet_balance?.toFixed(2) || '0.00'}</p>

            {/* Gig buttons + customize */}
            <h3 className="text-2xl mb-8 font-bold">Create a Gig</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-20 mb-32">
              {gigTypes.map((gig) => (
                <div key={gig.title}>
                  <button
                    onClick={() => handleGigSelect(gig)}
                    style={{
                      width: '100%',
                      height: '300px',
                      backgroundColor: selectedGig?.title === gig.title ? '#333' : 'black',
                      color: 'white',
                      fontFamily: "'Courier New', Courier, monospace",
                      fontSize: '30px',
                      padding: '2rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                      cursor: 'pointer',
                      border: 'none',
                      transition: 'background-color 0.3s',
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#333'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = selectedGig?.title === gig.title ? '#333' : 'black'}
                  >
                    <span style={{ marginBottom: '1rem' }}>{gig.title}</span>
                    <span style={{ marginBottom: '1rem' }}>${gig.baseAmount}+</span>
                    <span style={{ fontSize: '20px' }}>{gig.description}</span>
                  </button>

                  {selectedGig?.title === gig.title && (
                    <div style={{ marginTop: '2rem', backgroundColor: '#f5f5f5', padding: '2rem', border: '1px solid black', maxWidth: '500px', marginLeft: 'auto', marginRight: 'auto' }}>
                      <h3 style={{ fontSize: '24px', marginBottom: '2rem', fontWeight: 'bold' }}>Customize Your {gig.title}</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '20px', marginBottom: '0.5rem' }}>Number of Athletes</label>
                          <select
                            value={numAthletes}
                            onChange={(e) => handleAthletesChange(Number(e.target.value))}
                            style={{ width: '100%', padding: '1rem', fontSize: '20px', border: '4px solid black' }}
                          >
                            {[1,2,3,4,5,6,7,8,9,10].map(n => (
                              <option key={n} value={n}>{n} athlete{n > 1 ? 's' : ''}</option>
                            ))}
                          </select>
                          <p style={{ fontSize: '14px', marginTop: '0.5rem' }}>+ $75 per additional athlete</p>
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '20px', marginBottom: '0.5rem' }}>Date</label>
                          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '20px', marginBottom: '0.5rem' }}>Location</label>
                          <Input placeholder="e.g., Bridge Pizza" value={location} onChange={(e) => setLocation(e.target.value)} />
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '20px', marginBottom: '0.5rem' }}>Your Phone (for athlete contact)</label>
                          <Input placeholder="(555) 123-4567" value={businessPhone} onChange={(e) => setBusinessPhone(e.target.value)} />
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '20px', marginBottom: '0.5rem' }}>
                            <input type="checkbox" checked={isRecurring} onChange={(e) => setIsRecurring(e.target.checked)} />
                            Make this recurring monthly
                          </label>
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '20px', marginBottom: '0.5rem' }}>Offer Amount</label>
                          <Input
                            placeholder="Enter Offer Amount - Min $50"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            style={{ fontFamily: "'Courier New', Courier, monospace" }}
                          />
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '20px', marginBottom: '0.5rem' }}>Custom Details</label>
                          <textarea
                            placeholder="Add your details (e.g., Come to Bridge Pizza this Friday)"
                            value={customDetails}
                            onChange={(e) => setCustomDetails(e.target.value)}
                            style={{ width: '100%', height: '160px', padding: '1rem', fontSize: '20px', fontFamily: "'Courier New', Courier, monospace'", border: '4px solid black' }}
                          />
                        </div>

                        <Button onClick={handlePost} style={{
                          width: '100%',
                          height: '80px',
                          fontSize: '30px',
                          backgroundColor: '#90ee90',
                          color: 'black',
                          fontFamily: "'Courier New', Courier, monospace'",
                        }}>
                          Fund & Post Offer
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Proposals Received */}
            <h3 className="text-2xl mb-8 font-bold">Proposals Received</h3>
            <p className="mb-12">No proposals yet — kids will pitch you soon!</p>

            {/* Tabs */}
            <h3 className="text-2xl mb-8 font-bold">Your Offers</h3>
            <div className="flex justify-center gap-8 mb-8">
              <Button variant="outline">
                Unclaimed
              </Button>
              <Button variant="outline">
                Active
              </Button>
              <Button variant="outline">
                Complete
              </Button>
            </div>

            {/* Pending Clips */}
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