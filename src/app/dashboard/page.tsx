'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { signOut } from '@/lib/auth'
import { Button } from '@/components/ui/button'

const allGigTypes = [
  { title: 'ShoutOut', description: 'Visit a favorite business and make a quick shoutout 15-sec reel about what you like or your favorite order.' },
  { title: 'Youth Clinic', description: 'Run 30–60 min sessions for younger athletes (with teammates).' },
  { title: 'Team Sponsor', description: 'Business sponsors team meals/gear — money split equally.' },
  { title: 'Cameo', description: 'Custom 15-Sec Video for Younger Athletes (birthdays, pre-game pep talks).' },
  { title: 'Player Training', description: 'Varsity athlete 40-minute training with young player.' },
  { title: 'Custom Gig', description: 'Create a gig and offer it.' },
]

export default function Dashboard() {
  const [profile, setProfile] = useState<any>(null)
  const [business, setBusiness] = useState<any>(null)
  const [offers, setOffers] = useState<any[]>([])
  const [pendingClips, setPendingClips] = useState<any[]>([])
  const [selectedGigs, setSelectedGigs] = useState<string[]>([])
  const [selectedGigForCreate, setSelectedGigForCreate] = useState<any>(null)
  const [amount, setAmount] = useState('')
  const [customDetails, setCustomDetails] = useState('')
  const router = useRouter()

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

      // Load athlete selected gigs
      if (prof.role === 'athlete' && prof.selected_gigs) {
        setSelectedGigs(prof.selected_gigs)
      }

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

  const toggleGigSelection = async (title: string) => {
    const newSelected = selectedGigs.includes(title)
      ? selectedGigs.filter(g => g !== title)
      : [...selectedGigs, title]

    setSelectedGigs(newSelected)

    // Save to profile
    await supabase
      .from('profiles')
      .update({ selected_gigs: newSelected })
      .eq('id', profile.id)
  }

  const handleGigCreateSelect = (gig: any) => {
    setSelectedGigForCreate(gig)
    setAmount(gig.baseAmount?.toString() || '')
    setCustomDetails('')
  }

  const handleCreateOffer = async () => {
    if (!business || !selectedGigForCreate) return

    const { error } = await supabase
      .from('offers')
      .insert({
        business_id: business.id,
        type: selectedGigForCreate.title,
        amount: parseFloat(amount || selectedGigForCreate.baseAmount || 50),
        description: customDetails || selectedGigForCreate.description,
        status: 'active',
      })

    if (error) alert(error.message)
    else alert('Offer posted!')
  }

  const copyLetter = (gigTitle: string) => {
    const athleteId = profile?.id || 'fallback-id'
    const letterText = `Hey [Business Name],

I'm a local high school athlete and I'd love to partner with you on a ${gigTitle} gig through LocalHustle.

Here's what you'd get: ${gigTypes.find(g => g.title === gigTitle)?.description || 'a great clip featuring your business'}.

This link has all the details: https://app.localhustle.org/business-onboard?ref=${athleteId}

Thanks!

– ${profile?.email.split('@')[0] || 'me'}`
    navigator.clipboard.writeText(letterText)
    alert(`${gigTitle} letter copied!`)
  }

  const shareLetter = (gigTitle: string) => {
    const athleteId = profile?.id || 'fallback-id'
    const letterText = `Hey [Business Name],

I'm a local high school athlete and I'd love to partner with you on a ${gigTitle} gig through LocalHustle.

Here's what you'd get: ${gigTypes.find(g => g.title === gigTitle)?.description || 'a great clip featuring your business'}.

This link has all the details: https://app.localhustle.org/business-onboard?ref=${athleteId}

Thanks!

– ${profile?.email.split('@')[0] || 'me'}`

    if (navigator.share) {
      navigator.share({
        title: `LocalHustle ${gigTitle} Proposal`,
        text: letterText,
      })
    } else {
      copyLetter(gigTitle)
    }
  }

  if (!profile) return <p className="container text-center py-32">Loading...</p>

  return (
    <div className="container py-8">
      {/* Welcome */}
      <p className="text-center mb-12 text-xl font-mono">Welcome, {profile.email}</p>

      {/* Subtitle — black block */}
      <div style={{ backgroundColor: 'black', color: 'white', padding: '2rem', marginBottom: '4rem' }}>
        <h1 style={{ fontSize: '1.8rem', margin: '0' }}>
          {profile.role === 'athlete' ? 'Your Athlete Dashboard' : 'Your Business Admin Console'}
        </h1>
      </div>

      {/* How it Works — black block */}
      <div style={{ backgroundColor: 'black', color: 'white', padding: '2rem', marginBottom: '4rem' }}>
        <p style={{ fontSize: '1.2rem', lineHeight: '1.8' }}>
          {profile.role === 'athlete' ? 'Select gigs you offer → pitch businesses → claim funded gigs → record clip → get paid' : 'Fund wallet → create gigs → review clips → approve payouts'}
        </p>
      </div>

      {profile.role === 'athlete' ? (
        <div className="max-w-4xl mx-auto space-y-16 font-mono text-center text-lg">
          {/* Gigs athlete can offer — smaller, selectable */}
          <div>
            <h2 className="text-2xl mb-8 font-bold">Gigs You Offer</h2>
            <p className="mb-8">Select the gigs you're willing to do — businesses will see these.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {allGigTypes.map((gig) => (
                <div key={gig.title} style={{
                  border: '2px solid black',
                  padding: '2rem',
                  backgroundColor: selectedGigs.includes(gig.title) ? '#333' : '#f5f5f5',
                  color: selectedGigs.includes(gig.title) ? 'white' : 'black',
                }}>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>{gig.title}</h3>
                  <p style={{ fontSize: '1.1rem', marginBottom: '2rem' }}>{gig.description}</p>
                  <Button 
                    onClick={() => toggleGigSelection(gig.title)}
                    style={{
                      width: '100%',
                      height: '60px',
                      fontSize: '1.2rem',
                      backgroundColor: selectedGigs.includes(gig.title) ? 'white' : 'black',
                      color: selectedGigs.includes(gig.title) ? 'black' : 'white',
                    }}
                  >
                    {selectedGigs.includes(gig.title) ? 'Selected' : 'Select This Gig'}
                  </Button>
                  <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
                    <Button onClick={() => copyLetter(gig.title)} variant="outline" style={{ flex: 1 }}>
                      Copy Letter
                    </Button>
                    <Button onClick={() => shareLetter(gig.title)} style={{ flex: 1 }}>
                      Share Letter
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Open Offers */}
          <div>
            <h2 className="text-2xl mb-8 font-bold">Open Offers</h2>
            {offers.length === 0 ? (
              <p className="text-gray-600 mb-12">No offers yet — select gigs above and pitch businesses!</p>
            ) : (
              <div className="space-y-16">
                {offers.map((offer) => (
                  <div key={offer.id} className="border-4 border-black p-16 bg-gray-100 max-w-lg mx-auto">
                    <p className="font-bold text-2xl mb-6">{offer.type.toUpperCase()}</p>
                    <p className="mb-12">{offer.description}</p>
                    <Button 
                      onClick={() => router.push(`/claim/${offer.id}`)}
                      style={{
                        width: '100%',
                        height: '60px',
                        fontSize: '1.5rem',
                        backgroundColor: 'black',
                        color: 'white',
                      }}
                    >
                      Claim Offer
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Booster Events Link */}
          <div className="mt-32">
            <Button 
              onClick={() => router.push('/booster-events')}
              style={{
                width: '100%',
                maxWidth: '500px',
                height: '80px',
                fontSize: '1.8rem',
                backgroundColor: '#90ee90',
                color: 'black',
              }}
            >
              Create Booster Club Event
            </Button>
          </div>
        </div>
      ) : (
        // Business view
        <div className="max-w-4xl mx-auto space-y-16 font-mono text-center text-lg">
          <div>
            <h2 className="text-3xl mb-8 font-bold">Business Admin Console</h2>
            <p className="mb-8">Wallet balance: ${business?.wallet_balance?.toFixed(2) || '0.00'}</p>

            {/* Gig buttons + customize */}
            <h3 className="text-2xl mb-8 font-bold">Create a Gig</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-20 mb-32">
              {allGigTypes.map((gig) => (
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
                    <span style={{ fontSize: '20px' }}>{gig.description}</span>
                  </button>

                  {selectedGig?.title === gig.title && (
                    <div style={{ marginTop: '2rem', backgroundColor: '#f5f5f5', padding: '2rem', border: '1px solid black', maxWidth: '500px', marginLeft: 'auto', marginRight: 'auto' }}>
                      <h3 style={{ fontSize: '24px', marginBottom: '2rem', fontWeight: 'bold' }}>Customize Your {gig.title}</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '20px', marginBottom: '0.5rem' }}>Offer Amount</label>
                          <Input
                            placeholder="Enter Offer Amount - Starting at $50"
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
                  <div key={clip.id} className="border-4 border-black p-20 bg-white max-w-lg mx-auto">
                    <p className="font-bold mb-6 text-left">From: {clip.profiles.email}</p>
                    <p className="mb-6 text-left">Offer: {clip.offers.type} — ${clip.offers.amount}</p>
                    <video controls className="w-full mb-8">
                      <source src={clip.video_url} type="video/mp4" />
                    </video>
                    <Button 
                      onClick={() => approveClip(clip)}
                      style={{
                        width: '100%',
                        height: '60px',
                        fontSize: '1.5rem',
                        backgroundColor: 'black',
                        color: 'white',
                      }}
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