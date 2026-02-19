'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { signOut } from '@/lib/auth'
import { loadStripe } from '@stripe/stripe-js'
import { useStripe, useElements } from '@stripe/react-stripe-js'
import dynamic from 'next/dynamic'
import { getGigsInRadius } from '@/lib/geo'

const Elements = dynamic(() => import('@stripe/react-stripe-js').then((mod) => mod.Elements), { ssr: false })
const CardElement = dynamic(() => import('@stripe/react-stripe-js').then((mod) => mod.CardElement), { ssr: false })

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

const athleteGigTypes = [
  { title: 'ShoutOut', description: 'Quick 15-sec shoutout reel at a favorite business.' },
  { title: 'Youth Clinic', description: '30–60 min sessions for younger athletes.' },
  { title: 'Cameo', description: 'Custom 15-sec video (birthdays, pep talks).' },
  { title: 'Player Training', description: '40-minute training with a young player.' },
  { title: 'Challenge', description: 'Fun competitions — HORSE, free throws, accuracy toss.' },
  { title: 'Custom Gig', description: 'Create a gig and offer it.' },
]

type TabId = 'home' | 'gigs' | 'profile' | 'pitch' | 'earnings' | 'squad' | 'payout'

const tabs: { id: TabId; label: string }[] = [
  { id: 'home', label: 'Home' },
  { id: 'gigs', label: 'Gigs' },
  { id: 'profile', label: 'Profile' },
  { id: 'pitch', label: 'Pitch' },
  { id: 'earnings', label: 'Earnings' },
  { id: 'squad', label: 'Squad' },
  { id: 'payout', label: 'Payout' },
]

function AthleteDashboardContent() {
  const [cardReady, setCardReady] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [editingProfile, setEditingProfile] = useState(false)
  const [offers, setOffers] = useState<any[]>([])
  const [selectedGigs, setSelectedGigs] = useState<string[]>([])
  const [squad, setSquad] = useState<any[]>([])
  const [profilePic, setProfilePic] = useState('')
  const [highlightLink, setHighlightLink] = useState('')
  const [socialFollowers, setSocialFollowers] = useState('')
  const [bio, setBio] = useState('')
  const [showPitchLetter, setShowPitchLetter] = useState(false)
  const [availableGigs, setAvailableGigs] = useState<any[]>([])
  const [gigCount, setGigCount] = useState(0)
  const [myGigs, setMyGigs] = useState<any[]>([])
  const [savedMethods, setSavedMethods] = useState<any[]>([])
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [showVideoRecorder, setShowVideoRecorder] = useState(false)
  const [selectedOffer, setSelectedOffer] = useState<any>(null)
  const [recording, setRecording] = useState(false)
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null)
  const [videoUrl, setVideoUrl] = useState('')
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [localGigs, setLocalGigs] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<TabId>('home')

  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const stripe = useStripe()
  const elements = useElements()

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/'); return }

      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (prof) {
        setProfile(prof)
        if (prof.selected_gigs) setSelectedGigs(prof.selected_gigs)
        setProfilePic(prof.profile_pic || '')
        setHighlightLink(prof.highlight_link || '')
        setSocialFollowers(prof.social_followers || '')
        setBio(prof.bio || '')
        setGigCount(prof.gig_count || 0)

        if (prof.debit_card_token) {
          setSavedMethods([{
            id: prof.debit_card_token,
            brand: prof.card_brand || 'Card',
            last4: prof.card_last4 || '••••',
            exp_month: prof.card_exp_month,
            exp_year: prof.card_exp_year,
          }])
        }

        if (prof.lat && prof.lng) {
          const local = await getGigsInRadius(prof.lat, prof.lng, 60)
          setLocalGigs(local)
        }

        const { data: squadMembers } = await supabase
          .from('profiles')
          .select('email, created_at')
          .eq('referred_by', user.id)
        setSquad(squadMembers || [])

        const { data: openOffers } = await supabase
          .from('offers')
          .select('*, businesses(name)')
          .eq('status', 'active')
          .order('created_at', { ascending: false })
        setAvailableGigs(openOffers || [])
        setOffers(openOffers || [])

        const response = await fetch('/api/list-payment-methods', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ athlete_id: prof.id }),
        })
        const data = await response.json()
        if (data.methods?.length) setSavedMethods(data.methods)
      }
    }
    fetchData()
  }, [router])

  // --- Handlers ---

  const handleSaveProfile = async () => {
    if (!profile.school) { alert('School is required'); return }
    setPaymentLoading(true)

    const address = `${profile.school}, ${profile.state}`
    const geoResponse = await fetch('/api/geocode', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address }),
    })

    let geoData = null
    if (geoResponse.ok) geoData = await geoResponse.json()

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: profile.full_name,
        school: profile.school,
        state: profile.state,
        profile_pic: profilePic,
        highlight_link: highlightLink,
        social_followers: socialFollowers,
        bio: bio,
        lat: geoData?.lat || null,
        lng: geoData?.lng || null,
        zip_code: geoData?.zip || null,
      })
      .eq('id', profile.id)

    if (error) alert('Error: ' + error.message)
    else { alert('Profile saved!'); setEditingProfile(false) }
    setPaymentLoading(false)
  }

  const toggleGigSelection = async (title: string) => {
    const newSelected = selectedGigs.includes(title)
      ? selectedGigs.filter(g => g !== title)
      : [...selectedGigs, title]
    setSelectedGigs(newSelected)
    await supabase.from('profiles').update({ selected_gigs: newSelected }).eq('id', profile.id)
  }

  const copyLetter = () => {
    const letterText = `Hey [Business Name],\n\nI've been coming to [Your Spot] for years before and after practice.\n\nOur team has joined a new app that helps us get community support for our athletic journey. I'm reaching out to my favorite spots to see if you would consider a sponsorship.\n\nHere's what you would get: a short thank-you clip from me about your place. You can use the clip for social media if you want.\n\nI'd probably get some new shoes or gear and be set for our roadtrips. It means a lot for me and the team and I'd love to rep a local business that's got our back.\n\nThis link has all the details for how it works: https://app.localhustle.org/business-onboard?ref=${profile?.id || 'fallback-id'}\n\nThanks either way!\n\n– ${profile?.email?.split('@')[0] || 'me'}\n${profile?.school || 'our local high school'} ${profile?.sport || 'varsity athlete'}`
    navigator.clipboard.writeText(letterText)
    alert('Letter copied!')
  }

  const shareLetter = () => {
    const letterText = `Hey [Business Name],\n\nI've been coming to [Your Spot] for years before and after practice.\n\nOur team has joined a new app that helps us get community support for our athletic journey. I'm reaching out to my favorite spots to see if you would consider a sponsorship.\n\nHere's what you would get: a short thank-you clip from me about your place. You can use the clip for social media if you want.\n\nI'd probably get some new shoes or gear and be set for our roadtrips. It means a lot for me and the team and I'd love to rep a local business that's got our back.\n\nThis link has all the details for how it works: https://app.localhustle.org/business-onboard?ref=${profile?.id || 'fallback-id'}\n\nThanks either way!\n\n– ${profile?.email?.split('@')[0] || 'me'}\n${profile?.school || 'our local high school'} ${profile?.sport || 'varsity athlete'}`
    if (navigator.share) {
      navigator.share({ title: 'LocalHustle Sponsorship', text: letterText }).catch(() => copyLetter())
    } else { copyLetter() }
  }

  const claimGig = (offer: any) => {
    setSelectedOffer(offer)
    setShowVideoRecorder(true)
  }

  const handleAddDebitCard = async () => {
    if (!stripe || !elements) { setPaymentError('Stripe not loaded'); return }
    if (!cardReady) { setPaymentError('Card loading...'); return }
    setPaymentError(null); setPaymentSuccess(false); setPaymentLoading(true)

    const cardElement = elements.getElement('card')
    if (!cardElement) { setPaymentError('Card not found'); setPaymentLoading(false); return }

    const { error: stripeError, paymentMethod } = await stripe.createPaymentMethod({ type: 'card', card: cardElement })
    if (stripeError) { setPaymentError(stripeError.message || 'Error'); setPaymentLoading(false); return }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setPaymentError('Not authenticated'); setPaymentLoading(false); return }

    const { error: dbError } = await supabase
      .from('profiles')
      .update({
        debit_card_token: paymentMethod.id,
        card_brand: paymentMethod.card?.brand,
        card_last4: paymentMethod.card?.last4,
        card_exp_month: paymentMethod.card?.exp_month,
        card_exp_year: paymentMethod.card?.exp_year,
      })
      .eq('id', user.id)

    if (dbError) { setPaymentError('Failed to save'); setPaymentLoading(false); return }

    setPaymentSuccess(true)
    setSavedMethods([{
      id: paymentMethod.id,
      brand: paymentMethod.card?.brand || 'Card',
      last4: paymentMethod.card?.last4 || '••••',
      exp_month: paymentMethod.card?.exp_month,
      exp_year: paymentMethod.card?.exp_year,
    }])
    setTimeout(() => setPaymentSuccess(false), 5000)
    setPaymentLoading(false)
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      setMediaStream(stream)
      const recorder = new MediaRecorder(stream)
      setMediaRecorder(recorder)
      const chunks: Blob[] = []
      recorder.ondataavailable = (e) => chunks.push(e.data)
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' })
        setVideoBlob(blob)
        setVideoUrl(URL.createObjectURL(blob))
      }
      recorder.start()
      setRecording(true)
    } catch { alert('Camera access denied') }
  }

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop()
      setRecording(false)
      mediaStream?.getTracks().forEach(track => track.stop())
    }
  }

  const submitClip = async () => {
    if (!videoBlob || !selectedOffer) return
    setPaymentLoading(true)

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('clips')
      .upload(`public/${profile.id}-${Date.now()}.webm`, videoBlob)

    if (uploadError) { alert('Upload error: ' + uploadError.message); setPaymentLoading(false); return }

    const { data: publicUrl } = supabase.storage.from('clips').getPublicUrl(uploadData.path)

    const { error: insertError } = await supabase.from('clips').insert({
      athlete_id: profile.id,
      offer_id: selectedOffer.id,
      video_url: publicUrl.publicUrl,
      status: 'pending',
    })

    if (insertError) { alert('Submit error: ' + insertError.message); setPaymentLoading(false); return }

    alert('Clip submitted! Waiting for approval.')

    const { data: offer } = await supabase.from('offers').select('business_id').eq('id', selectedOffer.id).single()
    if (offer?.business_id) {
      const { data: funder } = await supabase.from('businesses').select('email').eq('id', offer.business_id).single()
      if (funder?.email) console.log(`Notify ${funder.email}: New clip from ${profile.full_name}`)
    }

    setShowVideoRecorder(false); setVideoUrl(''); setVideoBlob(null); setSelectedOffer(null); setPaymentLoading(false)
  }

  if (!profile) {
    return <div className="dash-empty" style={{ padding: '4rem 1rem' }}>Loading your dashboard...</div>
  }

  const allGigs = [...myGigs, ...availableGigs, ...localGigs]
  const uniqueGigs = allGigs.filter((gig, index, self) => index === self.findIndex(g => g.id === gig.id))

  return (
    <div className="dashboard-container" style={{ paddingBottom: '4rem' }}>
      {/* Welcome banner */}
      <div className="dash-welcome">
        <h1>Your Athlete Dashboard</h1>
        <p>Pitch businesses, claim gigs, get paid.</p>
      </div>

      {/* Progress bar */}
      <div style={{ padding: '0.75rem 1rem', background: '#f9fafb', borderBottom: '1px solid #eee' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>Progress</span>
          <span style={{ fontSize: '0.75rem', color: '#666' }}>{gigCount}/8 gigs</span>
        </div>
        <div className="progress-bar-track">
          <div className="progress-bar-fill" style={{ width: `${Math.min((gigCount / 8) * 100, 100)}%` }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem' }}>
          <span style={{ fontSize: '0.65rem', color: gigCount >= 4 ? '#16a34a' : '#999' }}>4 = Scholarship</span>
          <span style={{ fontSize: '0.65rem', color: gigCount >= 8 ? '#16a34a' : '#999' }}>8 = Brand Deals</span>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderBottom: '1px solid #eee' }}>
        <div className="dash-stat">
          <div className="dash-stat-value">{gigCount}</div>
          <div className="dash-stat-label">Gigs Done</div>
        </div>
        <div className="dash-stat">
          <div className="dash-stat-value">${profile?.total_earnings?.toFixed(0) || '0'}</div>
          <div className="dash-stat-label">Earned</div>
        </div>
        <div className="dash-stat">
          <div className="dash-stat-value">{squad.length}</div>
          <div className="dash-stat-label">Squad</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="dash-tabs">
        <div className="dash-tabs-inner">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`dash-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="dash-panel">

        {/* ===== HOME TAB ===== */}
        {activeTab === 'home' && (
          <div>
            {/* Quick actions */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <button className="dash-btn" onClick={() => setActiveTab('pitch')}>Pitch a Business</button>
              <button className="dash-btn dash-btn-green" onClick={() => setActiveTab('gigs')}>Browse Gigs</button>
            </div>

            {/* Gigs for you */}
            {myGigs.length > 0 && (
              <>
                <h2 className="dash-section-title">Gigs for You</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
                  {myGigs.map((offer) => (
                    <div key={offer.id} className="dash-card dash-card-highlight">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{offer.type}</span>
                        <span style={{ fontWeight: 700, color: '#16a34a', fontSize: '1.1rem' }}>${offer.amount}</span>
                      </div>
                      <p style={{ fontSize: '0.8rem', color: '#666', marginBottom: '0.5rem' }}>{offer.description}</p>
                      <p style={{ fontSize: '0.7rem', color: '#999', marginBottom: '0.5rem' }}>From: {offer.businesses?.name || 'Sponsor'}</p>
                      <button className="dash-btn dash-btn-green" onClick={() => claimGig(offer)}>Claim This Gig</button>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Choose your gig types */}
            <h2 className="dash-section-title">Gigs You Offer</h2>
            <p className="dash-section-subtitle">Select gigs you're willing to do — businesses will see these.</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1.25rem' }}>
              {athleteGigTypes.map((gig) => {
                const isSelected = selectedGigs.includes(gig.title)
                return (
                  <div
                    key={gig.title}
                    className={`gig-type-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => toggleGigSelection(gig.title)}
                  >
                    <div className="gig-title">{gig.title}</div>
                    <div className="gig-desc">{gig.description}</div>
                    {isSelected && <span className="dash-badge dash-badge-green" style={{ marginTop: '0.35rem' }}>Selected</span>}
                  </div>
                )
              })}
            </div>

            {/* Share selected gigs */}
            {selectedGigs.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
                {selectedGigs.map((gig) => {
                  const gigSlug = gig.toLowerCase().replace(' ', '-')
                  return (
                    <div key={gig} className="dash-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{gig}</span>
                      <div style={{ display: 'flex', gap: '0.35rem' }}>
                        <button className="dash-btn dash-btn-sm dash-btn-green" style={{ width: 'auto' }}
                          onClick={() => {
                            const msg = `Hey Mom/Dad! Can you sponsor my ${gig} challenge on LocalHustle? Here's the link: https://app.localhustle.org/parent-onboard?kid_id=${profile?.id}&gig=${gigSlug}`
                            if (navigator.share) navigator.share({ title: `Sponsor my ${gig}`, text: msg }).catch(() => { navigator.clipboard.writeText(msg); alert('Copied!') })
                            else { navigator.clipboard.writeText(msg); alert('Copied!') }
                          }}>Parent</button>
                        <button className="dash-btn dash-btn-sm" style={{ width: 'auto' }}
                          onClick={() => {
                            const msg = `Hey! Sponsor my ${gig} gig on LocalHustle? Link: https://app.localhustle.org/business-onboard?ref=${profile?.id}&gig=${gigSlug}`
                            if (navigator.share) navigator.share({ title: `Sponsor my ${gig}`, text: msg }).catch(() => { navigator.clipboard.writeText(msg); alert('Copied!') })
                            else { navigator.clipboard.writeText(msg); alert('Copied!') }
                          }}>Business</button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Ambassador + Brand Deals CTAs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <button className="dash-btn dash-btn-outline" onClick={() => router.push('/ambassador')}>
                Become an Ambassador
              </button>
              <button className="dash-btn dash-btn-green" onClick={() => router.push('/brand-deals')}>
                Land National Brand Deals
              </button>
            </div>
          </div>
        )}

        {/* ===== GIGS TAB ===== */}
        {activeTab === 'gigs' && (
          <div>
            {/* Available gigs */}
            <h2 className="dash-section-title">Available Gigs</h2>
            {availableGigs.length === 0 ? (
              <div className="dash-empty">No gigs yet — pitch a business or invite a parent!</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
                {availableGigs.map((offer) => (
                  <div key={offer.id} className="dash-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{offer.type}</span>
                      <span style={{ fontWeight: 700, color: '#16a34a', fontSize: '1.1rem' }}>${offer.amount}</span>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: '#666', marginBottom: '0.25rem' }}>{offer.description}</p>
                    <p style={{ fontSize: '0.7rem', color: '#999', marginBottom: '0.5rem' }}>From: {offer.businesses?.name || 'Sponsor'}</p>
                    <button className="dash-btn" onClick={() => claimGig(offer)}>Claim Gig</button>
                  </div>
                ))}
              </div>
            )}

            {/* Local gigs */}
            {localGigs.length > 0 && (
              <>
                <h2 className="dash-section-title">Local Gigs (60 mi)</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {localGigs.map((offer) => (
                    <div key={offer.id} className="dash-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{offer.type}</span>
                        <span style={{ fontWeight: 700, color: '#16a34a', fontSize: '1.1rem' }}>${offer.amount}</span>
                      </div>
                      <p style={{ fontSize: '0.8rem', color: '#666', marginBottom: '0.25rem' }}>{offer.description}</p>
                      <p style={{ fontSize: '0.7rem', color: '#999', marginBottom: '0.5rem' }}>From: {offer.businesses?.name || 'Local Sponsor'}</p>
                      <button className="dash-btn" onClick={() => claimGig(offer)}>Claim Gig</button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* ===== PROFILE TAB ===== */}
        {activeTab === 'profile' && (
          <div>
            <h2 className="dash-section-title">Your Profile</h2>

            {profile?.full_name && profile?.school && !editingProfile ? (
              <div className="dash-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{profile.full_name}</div>
                    <div style={{ fontSize: '0.8rem', color: '#666' }}>{profile.school}{profile.state ? `, ${profile.state}` : ''}</div>
                  </div>
                  <button className="dash-btn dash-btn-outline dash-btn-sm" onClick={() => setEditingProfile(true)}>Edit</button>
                </div>
                {profilePic && (
                  <img src={profilePic} alt="Profile" style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', borderRadius: '6px', marginBottom: '0.5rem' }} />
                )}
                {highlightLink && <p style={{ fontSize: '0.75rem', color: '#666', marginBottom: '0.25rem', wordBreak: 'break-all' }}>Highlights: {highlightLink}</p>}
                {socialFollowers && <p style={{ fontSize: '0.75rem', color: '#666', marginBottom: '0.25rem' }}>Followers: {socialFollowers}</p>}
                {bio && <p style={{ fontSize: '0.8rem', marginTop: '0.5rem', whiteSpace: 'pre-wrap' }}>{bio}</p>}
              </div>
            ) : (
              <div className="dash-card" style={{ background: '#fffbeb' }}>
                <h3 className="dash-section-title" style={{ textAlign: 'center' }}>Complete Your Profile</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>Full Name</label>
                    <input className="dash-input" value={profile?.full_name || ''} onChange={(e) => setProfile({ ...profile, full_name: e.target.value })} placeholder="John Smith" />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>School</label>
                    <input className="dash-input" value={profile?.school || ''} onChange={(e) => setProfile({ ...profile, school: e.target.value })} placeholder="Lincoln High School" />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>State</label>
                    <input className="dash-input" value={profile?.state || ''} onChange={(e) => setProfile({ ...profile, state: e.target.value.toUpperCase() })} placeholder="CA" maxLength={2} style={{ maxWidth: '80px' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>Profile Pic</label>
                    {profilePic ? (
                      <div>
                        <img src={profilePic} alt="" style={{ width: '100%', maxHeight: '150px', objectFit: 'cover', borderRadius: '6px', marginBottom: '0.5rem' }} />
                        <button className="dash-btn dash-btn-outline dash-btn-sm" onClick={() => setProfilePic('')}>Remove Photo</button>
                      </div>
                    ) : (
                      <input
                        type="file"
                        accept="image/*"
                        className="dash-input"
                        style={{ padding: '0.5rem' }}
                        onChange={async (e) => {
                          const file = e.target.files?.[0]
                          if (!file) return
                          const { data, error } = await supabase.storage.from('profile-pics').upload(`public/${profile.id}.jpg`, file, { upsert: true })
                          if (error) { alert('Upload error'); return }
                          const { data: urlData } = supabase.storage.from('profile-pics').getPublicUrl(`public/${profile.id}.jpg`)
                          setProfilePic(urlData.publicUrl)
                        }}
                      />
                    )}
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>Highlight Link</label>
                    <input className="dash-input" value={highlightLink} onChange={(e) => setHighlightLink(e.target.value)} placeholder="https://hudl.com/your-highlights" />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>Social Followers</label>
                    <input className="dash-input" value={socialFollowers} onChange={(e) => setSocialFollowers(e.target.value)} placeholder="e.g., 5k IG followers" />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>Bio</label>
                    <textarea className="dash-textarea" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell us about yourself..." />
                  </div>
                  <button className="dash-btn" onClick={handleSaveProfile} disabled={paymentLoading}>
                    {paymentLoading ? 'Saving...' : 'Save Profile'}
                  </button>
                </div>
              </div>
            )}

            {/* Log out */}
            <div style={{ marginTop: '2rem', textAlign: 'center' }}>
              <button className="dash-btn dash-btn-outline" style={{ maxWidth: '200px', margin: '0 auto' }} onClick={async () => {
                await signOut(); router.push('/'); alert('Logged out')
              }}>Log Out</button>
            </div>
          </div>
        )}

        {/* ===== PITCH TAB ===== */}
        {activeTab === 'pitch' && (
          <div>
            <h2 className="dash-section-title">Pitch Local Businesses</h2>
            <p className="dash-section-subtitle">Copy or share your personalized pitch letter with your favorite local spots.</p>

            <button className="dash-btn dash-btn-outline" style={{ marginBottom: '0.75rem' }} onClick={() => setShowPitchLetter(!showPitchLetter)}>
              {showPitchLetter ? 'Hide Pitch Letter' : 'Show Pitch Letter'}
            </button>

            {showPitchLetter && (
              <div className="dash-card" style={{ background: '#f9fafb' }}>
                <pre style={{ fontSize: '0.75rem', lineHeight: 1.5, border: 'none', padding: 0, margin: '0 0 0.75rem', background: 'transparent', maxWidth: '100%' }}>
{`Hey [Business Name],

I've been coming to [Your Spot] for years before and after practice.

Our team has joined a new app that helps us get community support for our athletic journey. I'm reaching out to my favorite spots to see if you would consider a sponsorship.

Here's what you would get: a short thank-you clip from me about your place. You can use the clip for social media if you want.

I'd probably get some new shoes or gear and be set for our roadtrips. It means a lot for me and the team and I'd love to rep a local business that's got our back.

This link has all the details: https://app.localhustle.org/business-onboard?ref=${profile?.id || 'fallback-id'}

Thanks either way!

– ${profile?.email?.split('@')[0] || 'me'}
${profile?.school || 'our local high school'} ${profile?.sport || 'varsity athlete'}`}
                </pre>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="dash-btn" onClick={shareLetter}>Share</button>
                  <button className="dash-btn dash-btn-outline" onClick={copyLetter}>Copy</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===== EARNINGS TAB ===== */}
        {activeTab === 'earnings' && (
          <div>
            <h2 className="dash-section-title">Your Earnings</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
              <div className="dash-card" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>${profile?.total_earnings?.toFixed(2) || '0.00'}</div>
                <div style={{ fontSize: '0.7rem', color: '#666' }}>Total Earned</div>
              </div>
              <div className="dash-card dash-card-highlight" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#16a34a' }}>${profile?.scholarships_earned?.toFixed(2) || '0.00'}</div>
                <div style={{ fontSize: '0.7rem', color: '#666' }}>Scholarships</div>
              </div>
            </div>

            <p className="dash-section-subtitle">
              Freedom Scholarships are unrestricted cash — use for books, food, rent, whatever you need.
            </p>

            {gigCount < 4 ? (
              <div className="dash-card" style={{ textAlign: 'center' }}>
                <p style={{ fontWeight: 700, color: '#16a34a', fontSize: '0.9rem', margin: 0 }}>
                  Complete {4 - gigCount} more gig{4 - gigCount > 1 ? 's' : ''} to qualify for Freedom Scholarships!
                </p>
              </div>
            ) : (
              <div className="dash-card dash-card-highlight">
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.5rem', textAlign: 'center' }}>
                  You Qualify for a Freedom Scholarship!
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#666', marginBottom: '0.75rem', textAlign: 'center' }}>
                  Apply now — tell us your story.
                </p>
                <textarea
                  className="dash-textarea"
                  placeholder="Why you deserve a Freedom Scholarship (short message about your hustle)"
                  style={{ marginBottom: '0.75rem' }}
                />
                <button className="dash-btn dash-btn-green">Submit Application</button>
              </div>
            )}
          </div>
        )}

        {/* ===== SQUAD TAB ===== */}
        {activeTab === 'squad' && (
          <div>
            <h2 className="dash-section-title">Your Squad</h2>
            <p className="dash-section-subtitle">Invite friends to earn together.</p>

            <button className="dash-btn" style={{ marginBottom: '1rem' }} onClick={() => router.push('/squad')}>
              Build Your Squad
            </button>

            {squad.length === 0 ? (
              <div className="dash-empty">No squad members yet — share your link!</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {squad.map((member, i) => (
                  <div key={i} className="dash-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{member.email}</span>
                    <span style={{ fontSize: '0.7rem', color: '#999' }}>{new Date(member.created_at).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===== PAYOUT TAB ===== */}
        {activeTab === 'payout' && (
          <div>
            <h2 className="dash-section-title">Debit Card for Payouts</h2>
            <p className="dash-section-subtitle">Add your debit card for instant payouts when you complete gigs. No charges will be made — this is for receiving payments only.</p>

            {/* Saved cards */}
            {savedMethods.length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem' }}>Saved Card</h3>
                {savedMethods.map((m) => (
                  <div key={m.id} className="dash-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{m.brand?.toUpperCase()} •••• {m.last4}</span>
                    <span style={{ fontSize: '0.75rem', color: '#666' }}>Exp {m.exp_month}/{m.exp_year}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Add card */}
            <div className="dash-card">
              <h3 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                {savedMethods.length > 0 ? 'Update Card' : 'Add Debit Card'}
              </h3>
              <p style={{ fontSize: '0.75rem', color: '#666', marginBottom: '0.75rem' }}>Secure via Stripe — encrypted & safe.</p>
              <div style={{ background: '#f9fafb', padding: '0.75rem', borderRadius: '6px', border: '1px solid #ddd', marginBottom: '0.75rem' }}>
                <CardElement
                  onReady={() => setCardReady(true)}
                  options={{
                    style: {
                      base: { fontSize: '15px', color: '#000', fontFamily: 'Courier New, monospace', '::placeholder': { color: '#999' } },
                    },
                  }}
                />
              </div>
              {paymentError && <p style={{ color: '#dc2626', fontSize: '0.8rem', marginBottom: '0.5rem' }}>{paymentError}</p>}
              {paymentSuccess && <p style={{ color: '#16a34a', fontSize: '0.8rem', marginBottom: '0.5rem' }}>Card saved!</p>}
              <button className="dash-btn" onClick={handleAddDebitCard} disabled={paymentLoading || !cardReady}>
                {paymentLoading ? 'Saving...' : 'Save Debit Card'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Video Recorder Modal */}
      {showVideoRecorder && selectedOffer && (
        <div className="dash-modal-overlay" onClick={() => { setShowVideoRecorder(false); setVideoUrl(''); setVideoBlob(null) }}>
          <div className="dash-modal" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.5rem', textAlign: 'center' }}>
              Record Clip for {selectedOffer.type}
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#666', marginBottom: '0.75rem', textAlign: 'center' }}>
              ${selectedOffer.amount} gig from {selectedOffer.businesses?.name || 'Sponsor'}
            </p>

            <div style={{ marginBottom: '0.75rem' }}>
              {recording ? (
                <video
                  autoPlay muted playsInline
                  ref={(video) => { if (video && mediaStream) video.srcObject = mediaStream }}
                  style={{ width: '100%', borderRadius: '6px', border: '1px solid #ddd', margin: 0, maxWidth: '100%' }}
                />
              ) : videoUrl ? (
                <video controls src={videoUrl} style={{ width: '100%', borderRadius: '6px', border: '1px solid #ddd', margin: 0, maxWidth: '100%' }} />
              ) : (
                <div style={{ background: '#f5f5f5', border: '2px dashed #ddd', borderRadius: '6px', height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <p style={{ color: '#999', fontSize: '0.85rem', margin: 0 }}>Camera preview</p>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {!recording && !videoUrl && (
                <button className="dash-btn" onClick={startRecording}>Start Recording</button>
              )}
              {recording && (
                <button className="dash-btn" style={{ background: '#dc2626', borderColor: '#dc2626' }} onClick={stopRecording}>Stop Recording</button>
              )}
              {videoUrl && !recording && (
                <>
                  <button className="dash-btn dash-btn-green" onClick={submitClip}>Submit Clip</button>
                  <button className="dash-btn dash-btn-outline" onClick={() => { setVideoUrl(''); setVideoBlob(null); setShowVideoRecorder(false) }}>Cancel</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function AthleteDashboard() {
  return (
    <Elements stripe={stripePromise}>
      <Suspense fallback={<div className="dash-empty" style={{ padding: '4rem 1rem' }}>Loading...</div>}>
        <AthleteDashboardContent />
      </Suspense>
    </Elements>
  )
}
