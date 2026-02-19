'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { signOut } from '@/lib/auth'
import { loadStripe } from '@stripe/stripe-js'
import { useStripe, useElements } from '@stripe/react-stripe-js'
import dynamic from 'next/dynamic'

const Elements = dynamic(() => import('@stripe/react-stripe-js').then((mod) => mod.Elements), { ssr: false })
const CardElement = dynamic(() => import('@stripe/react-stripe-js').then((mod) => mod.CardElement), { ssr: false })

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

const businessGigTypes = [
  { title: 'ShoutOut', baseAmount: 50, description: 'Quick 15-sec shoutout reel at your business.' },
  { title: 'Youth Clinic', baseAmount: 500, description: '30–60 min sessions for younger athletes.' },
  { title: 'Team Sponsor', baseAmount: 1000, description: 'Sponsor team meals/gear — money split equally.' },
  { title: 'Cameo', baseAmount: 50, description: 'Custom 15-sec video (birthdays, pep talks).' },
  { title: 'Player Training', baseAmount: 100, description: '40-minute training with young player.' },
  { title: 'Challenge', baseAmount: 75, description: 'Fun competitions — base pay + bonus if you win.' },
  { title: 'Custom Gig', baseAmount: 200, description: 'Create a custom gig and offer it.' },
]

type TabId = 'profile' | 'wallet' | 'gigs' | 'clips' | 'kids' | 'favorites' | 'scholarships' | 'booster' | 'mentorship'

const tabs: { id: TabId; label: string }[] = [
  { id: 'profile', label: 'Profile' },
  { id: 'wallet', label: 'Wallet' },
  { id: 'gigs', label: 'Gigs' },
  { id: 'clips', label: 'Clips' },
  { id: 'kids', label: 'My Kids' },
  { id: 'favorites', label: 'Favorites' },
  { id: 'scholarships', label: 'Scholarships' },
  { id: 'booster', label: 'Booster' },
  { id: 'mentorship', label: 'Mentors' },
]

function BusinessDashboardContent() {
  const [business, setBusiness] = useState<any>(null)
  const [pendingClips, setPendingClips] = useState<any[]>([])
  const [referredAthletes, setReferredAthletes] = useState<any[]>([])
  const [selectedGig, setSelectedGig] = useState<any>(null)
  const [amount, setAmount] = useState('')
  const [savedMethods, setSavedMethods] = useState<any[]>([])
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [cardReady, setCardReady] = useState(false)
  const [activeTab, setActiveTab] = useState<TabId>('profile')
  const [athleteSearch, setAthleteSearch] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [selectedAthlete, setSelectedAthlete] = useState<any>(null)
  const [standaloneScholarshipAmount, setStandaloneScholarshipAmount] = useState('')
  const [standaloneScholarshipMessage, setStandaloneScholarshipMessage] = useState('')
  const [scholarshipLoading, setScholarshipLoading] = useState(false)
  const [editingProfile, setEditingProfile] = useState(false)
  const [selectedOffers, setSelectedOffers] = useState<string[]>([])
  const [favorites, setFavorites] = useState<any[]>([])
  const [invitedAthleteId, setInvitedAthleteId] = useState<string | null>(null)
  const [showQuickSponsor, setShowQuickSponsor] = useState(false)
  const [quickSponsorKid, setQuickSponsorKid] = useState<any>(null)
  const [showCardModal, setShowCardModal] = useState(false)

  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const stripe = useStripe()
  const elements = useElements()

  const currentRole = pathname.includes('athlete-dashboard')
    ? 'athlete'
    : pathname.includes('parent-dashboard')
      ? 'parent'
      : 'business'

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/'); return }

      const { data: biz } = await supabase
        .from('businesses')
        .select('*')
        .eq('owner_id', user.id)
        .single()

      if (biz) {
        setBusiness(biz)
        setSelectedOffers(biz.selected_offers || [])

        const { data: referred } = await supabase
          .from('profiles')
          .select('id, full_name, email, school')
          .eq('referred_by', biz.id)
        setReferredAthletes(referred || [])

        const { data: offers } = await supabase.from('offers').select('id').eq('business_id', biz.id)
        const offerIds = offers?.map(o => o.id) || []
        if (offerIds.length > 0) {
          const { data: clips } = await supabase
            .from('clips')
            .select('*, offers(*), profiles(email, parent_email)')
            .eq('status', 'pending')
            .in('offer_id', offerIds)
          setPendingClips(clips || [])
        }

        if (biz.id) {
          const response = await fetch('/api/list-payment-methods', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ business_id: biz.id }),
          })
          const data = await response.json()
          setSavedMethods(data.methods || [])

          const { data: favs } = await supabase
            .from('favorites')
            .select('*, profiles(full_name, email, school)')
            .eq('funder_id', biz.id)
          setFavorites(favs || [])

          const invitedId = searchParams.get('invited_by')
          if (invitedId) {
            setInvitedAthleteId(invitedId)
            const { data: existingFav } = await supabase
              .from('favorites')
              .select('id')
              .eq('funder_id', biz.id)
              .eq('athlete_id', invitedId)
              .single()

            if (!existingFav) {
              await supabase.from('favorites').insert({ funder_id: biz.id, athlete_id: invitedId })
            }

            const { data: kidData } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', invitedId)
              .single()

            if (kidData) {
              setQuickSponsorKid(kidData)
              setShowQuickSponsor(true)
            }
          }
        }
      }
    }
    fetchData()
  }, [router, searchParams])

  // --- Handlers ---

  const handleQuickSponsor = async () => {
    if (savedMethods.length === 0) { setShowCardModal(true); return }
    const { error } = await supabase.from('offers').insert({
      business_id: business.id,
      type: 'Challenge',
      amount: 50,
      description: 'First challenge from your sponsor — complete and earn $50!',
      target_athlete_id: quickSponsorKid.id,
      status: 'open',
    })
    if (error) { alert('Error: ' + error.message) }
    else { alert(`$50 challenge sent!`); setShowQuickSponsor(false) }
  }

  const handleAddCard = async () => {
    if (!stripe || !elements) { setPaymentError('Stripe not loaded — refresh'); return }
    if (!cardReady) { setPaymentError('Card loading...'); return }
    setPaymentError(null); setPaymentSuccess(false); setPaymentLoading(true)

    const cardElement = elements.getElement('card')
    if (!cardElement) { setPaymentError('Card not found — refresh'); setPaymentLoading(false); return }

    const { error: stripeError, paymentMethod } = await stripe.createPaymentMethod({ type: 'card', card: cardElement })
    if (stripeError) { setPaymentError(stripeError.message || 'Error'); setPaymentLoading(false); return }

    const { error: dbError } = await supabase
      .from('businesses')
      .update({ debit_card_token: paymentMethod.id })
      .eq('id', business.id)

    if (dbError) { setPaymentError('Failed to save'); setPaymentLoading(false); return }

    setPaymentSuccess(true)
    setSavedMethods([...savedMethods, {
      id: paymentMethod.id,
      brand: paymentMethod.card?.brand,
      last4: paymentMethod.card?.last4,
      exp_month: paymentMethod.card?.exp_month,
      exp_year: paymentMethod.card?.exp_year,
    }])
    setShowCardModal(false)
    setTimeout(() => setPaymentSuccess(false), 5000)
    setPaymentLoading(false)
  }

  const handleAddFunds = async (amt: number) => {
    if (savedMethods.length === 0) { alert('Add a card first'); return }
    const response = await fetch('/api/charge-card', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: amt, payment_method_id: savedMethods[0].id, business_id: business.id }),
    })
    const data = await response.json()
    if (data.error) { alert('Charge failed: ' + data.error) }
    else { alert(`$${amt} added!`); setBusiness({ ...business, wallet_balance: business.wallet_balance + amt }) }
  }

  const approveClip = async (clip: any) => {
    const { error } = await supabase.from('clips').update({ status: 'approved' }).eq('id', clip.id)
    if (error) { alert('Error approving'); return }
    alert('Clip approved — payment sent!')
    setPendingClips(pendingClips.filter(c => c.id !== clip.id))
  }

  const searchAthletes = async () => {
    if (!athleteSearch.trim()) { setSearchResults([]); return }
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, email, school')
      .or(`full_name.ilike.%${athleteSearch}%,email.ilike.%${athleteSearch}%,school.ilike.%${athleteSearch}%`)
      .limit(10)
    setSearchResults(data || [])
  }

  const awardScholarship = async () => {
    if (!selectedAthlete || !standaloneScholarshipAmount || parseFloat(standaloneScholarshipAmount) <= 0) {
      alert('Select an athlete and enter a valid amount'); return
    }
    setScholarshipLoading(true)
    const response = await fetch('/api/payout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        athlete_id: selectedAthlete.id,
        amount: parseFloat(standaloneScholarshipAmount),
        type: 'freedom_scholarship',
        message: standaloneScholarshipMessage || 'Great hustle!',
      }),
    })
    const data = await response.json()
    if (data.error) { alert('Error: ' + data.error) }
    else {
      await supabase.from('scholarships').insert({
        business_id: business.id,
        athlete_id: selectedAthlete.id,
        amount: parseFloat(standaloneScholarshipAmount),
        message: standaloneScholarshipMessage || 'Great hustle!',
      })
      alert(`Scholarship awarded to ${selectedAthlete.full_name || selectedAthlete.email}!`)
      setStandaloneScholarshipAmount(''); setStandaloneScholarshipMessage('')
      setSelectedAthlete(null); setSearchResults([]); setAthleteSearch('')
    }
    setScholarshipLoading(false)
  }

  const toggleOffer = async (title: string) => {
    const newOffers = selectedOffers.includes(title)
      ? selectedOffers.filter(o => o !== title)
      : [...selectedOffers, title]
    const { error } = await supabase.from('businesses').update({ selected_offers: newOffers }).eq('id', business.id)
    if (!error) setSelectedOffers(newOffers)
  }

  const shareGig = (gigTitle: string) => {
    const gig = businessGigTypes.find(g => g.title === gigTitle)
    const shareText = `I'm offering a $${gig?.baseAmount}+ ${gigTitle} gig on LocalHustle. Complete it and get paid!`
    const shareUrl = 'https://app.localhustle.org/athlete-dashboard'
    if (navigator.share) {
      navigator.share({ title: 'LocalHustle Gig', text: shareText, url: shareUrl }).catch(() => {
        navigator.clipboard.writeText(`${shareText}\n${shareUrl}`); alert('Copied!')
      })
    } else {
      navigator.clipboard.writeText(`${shareText}\n${shareUrl}`); alert('Copied!')
    }
  }

  if (!business) {
    return <div className="dash-empty" style={{ padding: '4rem 1rem' }}>Loading your dashboard...</div>
  }

  return (
    <div className="dashboard-container" style={{ paddingBottom: '4rem' }}>
      {/* Welcome banner */}
      <div className="dash-welcome">
        <h1>Welcome, {business?.name || 'Business Owner'}</h1>
        <p>Post gigs, review clips, become the hometown hero.</p>
      </div>

      {/* Quick Sponsor Banner */}
      {showQuickSponsor && quickSponsorKid && (
        <div style={{ background: '#f0fdf4', border: '2px solid #22c55e', padding: '1rem', margin: '0.75rem' , borderRadius: '8px' }}>
          <p style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.5rem', textAlign: 'center' }}>
            Sponsor {quickSponsorKid.full_name?.split(' ')[0]}'s First Gig!
          </p>
          <p style={{ fontSize: '0.8rem', color: '#666', marginBottom: '0.75rem', textAlign: 'center' }}>
            Fund a $50 challenge — they complete it, you approve, they get paid.
          </p>
          <button className="dash-btn dash-btn-green" onClick={handleQuickSponsor}>
            {savedMethods.length === 0 ? 'Add Card & Fund $50' : 'Fund $50 Challenge'}
          </button>
        </div>
      )}

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderBottom: '1px solid #eee' }}>
        <div className="dash-stat">
          <div className="dash-stat-value">${business?.wallet_balance?.toFixed(0) || '0'}</div>
          <div className="dash-stat-label">Wallet</div>
        </div>
        <div className="dash-stat">
          <div className="dash-stat-value">{selectedOffers.length}</div>
          <div className="dash-stat-label">Active Gigs</div>
        </div>
        <div className="dash-stat">
          <div className="dash-stat-value">{pendingClips.length}</div>
          <div className="dash-stat-label">Pending</div>
        </div>
      </div>

      {/* Tabs — horizontally scrollable */}
      <div className="dash-tabs">
        <div className="dash-tabs-inner">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`dash-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => tab.id === 'mentorship' ? router.push('/mentorship/dashboard') : setActiveTab(tab.id)}
            >
              {tab.label}
              {tab.id === 'clips' && pendingClips.length > 0 && (
                <span className="dash-badge dash-badge-yellow" style={{ marginLeft: '0.35rem' }}>
                  {pendingClips.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="dash-panel">

        {/* ===== PROFILE TAB ===== */}
        {activeTab === 'profile' && (
          <div>
            <h2 className="dash-section-title">Business Profile</h2>
            {business?.name && business?.phone && !editingProfile ? (
              <div className="dash-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 700 }}>{business.name}</span>
                  <button className="dash-btn dash-btn-outline dash-btn-sm" onClick={() => setEditingProfile(true)}>Edit</button>
                </div>
                <p style={{ fontSize: '0.85rem', color: '#666', margin: 0 }}>{business.phone}</p>
              </div>
            ) : (
              <div className="dash-card" style={{ background: '#fffbeb' }}>
                <h3 className="dash-section-title" style={{ textAlign: 'center' }}>Complete Your Profile</h3>
                <p className="dash-section-subtitle" style={{ textAlign: 'center' }}>Add your info to start posting gigs.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>Business Name</label>
                    <input
                      className="dash-input"
                      value={business?.name || ''}
                      onChange={(e) => setBusiness({ ...business, name: e.target.value })}
                      placeholder="e.g., Bridge Pizza"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>Contact Phone</label>
                    <input
                      className="dash-input"
                      value={business?.phone || ''}
                      onChange={(e) => setBusiness({ ...business, phone: e.target.value })}
                      placeholder="(555) 123-4567"
                    />
                  </div>
                  <button className="dash-btn" onClick={async () => {
                    const { error } = await supabase
                      .from('businesses')
                      .update({ name: business.name, phone: business.phone })
                      .eq('id', business.id)
                    if (error) alert('Error: ' + error.message)
                    else { alert('Profile saved!'); setEditingProfile(false) }
                  }}>
                    Save Profile
                  </button>
                </div>
              </div>
            )}
            {editingProfile && business?.name && business?.phone && (
              <div className="dash-card" style={{ marginTop: '0.75rem' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem' }}>Edit Profile</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <input className="dash-input" value={business?.name || ''} onChange={(e) => setBusiness({ ...business, name: e.target.value })} placeholder="Business Name" />
                  <input className="dash-input" value={business?.phone || ''} onChange={(e) => setBusiness({ ...business, phone: e.target.value })} placeholder="Phone" />
                  <button className="dash-btn" onClick={async () => {
                    const { error } = await supabase.from('businesses').update({ name: business.name, phone: business.phone }).eq('id', business.id)
                    if (error) alert('Error saving')
                    else { alert('Updated!'); setEditingProfile(false) }
                  }}>Save Changes</button>
                </div>
              </div>
            )}

            {/* Log out in profile tab */}
            <div style={{ marginTop: '2rem', textAlign: 'center' }}>
              <button className="dash-btn dash-btn-outline" style={{ maxWidth: '200px', margin: '0 auto' }} onClick={async () => {
                await signOut(); router.push('/'); alert('Logged out')
              }}>Log Out</button>
            </div>
          </div>
        )}

        {/* ===== WALLET TAB ===== */}
        {activeTab === 'wallet' && (
          <div>
            <h2 className="dash-section-title">Wallet</h2>
            <div className="dash-card" style={{ textAlign: 'center', marginBottom: '1rem' }}>
              <div style={{ fontSize: '2rem', fontWeight: 700 }}>${business?.wallet_balance?.toFixed(2) || '0.00'}</div>
              <div style={{ fontSize: '0.75rem', color: '#666' }}>Available Balance</div>
            </div>

            {/* Add funds buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1.25rem' }}>
              {[100, 500, 1000].map(amt => (
                <button key={amt} className="dash-btn" onClick={() => handleAddFunds(amt)}>+ ${amt}</button>
              ))}
              <button className="dash-btn dash-btn-green" onClick={() => {
                const amt = prompt('Custom amount:')
                if (amt && !isNaN(Number(amt))) handleAddFunds(Number(amt))
              }}>Custom</button>
            </div>

            {/* Saved cards */}
            {savedMethods.length > 0 && (
              <>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem' }}>Saved Cards</h3>
                {savedMethods.map((m) => (
                  <div key={m.id} className="dash-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{m.brand?.toUpperCase()} •••• {m.last4}</span>
                    <span style={{ fontSize: '0.75rem', color: '#666' }}>Exp {m.exp_month}/{m.exp_year}</span>
                  </div>
                ))}
              </>
            )}

            {/* Add card section */}
            <div className="dash-card" style={{ marginTop: '1rem' }}>
              <h3 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem' }}>Add Payment Card</h3>
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
              <button className="dash-btn" onClick={handleAddCard} disabled={paymentLoading || !cardReady}>
                {paymentLoading ? 'Saving...' : 'Save Card'}
              </button>
            </div>
          </div>
        )}

        {/* ===== GIGS TAB ===== */}
        {activeTab === 'gigs' && (
          <div>
            <h2 className="dash-section-title">Your Active Offers</h2>
            <p className="dash-section-subtitle">Toggle gigs on/off. Active gigs are visible to athletes while your wallet is funded.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {businessGigTypes.map((gig) => {
                const isActive = selectedOffers.includes(gig.title)
                return (
                  <div key={gig.title} className={`gig-type-card ${isActive ? 'selected' : ''}`}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1, marginRight: '0.75rem' }}>
                        <div className="gig-title">{gig.title}</div>
                        <div className="gig-price">${gig.baseAmount}+</div>
                        <div className="gig-desc">{gig.description}</div>
                      </div>
                      <button
                        className={`dash-btn dash-btn-sm ${isActive ? '' : 'dash-btn-outline'}`}
                        style={{ flex: 'none', width: 'auto', padding: '0.4rem 0.75rem' }}
                        onClick={() => toggleOffer(gig.title)}
                      >
                        {isActive ? 'Active' : 'Offer'}
                      </button>
                    </div>
                    {isActive && (
                      <button
                        className="dash-btn dash-btn-sm dash-btn-outline"
                        style={{ marginTop: '0.5rem' }}
                        onClick={() => shareGig(gig.title)}
                      >
                        Share This Gig
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ===== CLIPS TAB ===== */}
        {activeTab === 'clips' && (
          <div>
            <h2 className="dash-section-title">Pending Clips</h2>
            {pendingClips.length === 0 ? (
              <div className="dash-empty">No pending clips — post offers to get started!</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {pendingClips.map((clip) => (
                  <div key={clip.id} className="dash-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{clip.profiles?.full_name || 'Athlete'}</span>
                      <span className="dash-badge dash-badge-yellow">Pending</span>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: '#666', marginBottom: '0.5rem' }}>
                      {clip.offers?.type} — ${clip.offers?.amount}
                    </p>
                    <video controls style={{ width: '100%', borderRadius: '6px', marginBottom: '0.5rem', maxWidth: '100%', border: '1px solid #ddd', margin: 0 }}>
                      <source src={clip.video_url} type="video/mp4" />
                    </video>
                    <button className="dash-btn dash-btn-green" style={{ marginTop: '0.5rem' }} onClick={() => approveClip(clip)}>
                      Approve & Pay
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===== MY KIDS TAB ===== */}
        {activeTab === 'kids' && (
          <div>
            <h2 className="dash-section-title">My Kids</h2>
            {referredAthletes.length === 0 ? (
              <div className="dash-empty">No kids linked yet — wait for invite.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {referredAthletes.map((kid) => (
                  <div key={kid.id} className="dash-card" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#e5e5e5', flexShrink: 0, overflow: 'hidden' }}>
                      <img src={kid.profile_pic || '/default-avatar.png'} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{kid.full_name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#666' }}>{kid.school}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===== FAVORITES TAB ===== */}
        {activeTab === 'favorites' && (
          <div>
            <h2 className="dash-section-title">Favorite Athletes</h2>
            <p className="dash-section-subtitle">Quick-send gigs to athletes you like working with.</p>
            {favorites.length === 0 ? (
              <div className="dash-empty">No favorites yet — they appear when athletes invite you.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {favorites.map((fav) => (
                  <div key={fav.athlete_id} className="dash-card" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#e5e5e5', flexShrink: 0, overflow: 'hidden' }}>
                      <img src={fav.profiles?.profile_pic || '/default-avatar.png'} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{fav.profiles?.full_name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#666' }}>{fav.profiles?.school}</div>
                    </div>
                    <button className="dash-btn dash-btn-sm" style={{ width: 'auto', flex: 'none' }} onClick={() => {
                      alert(`Send gig to ${fav.profiles?.full_name} coming soon!`)
                    }}>Send Gig</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===== SCHOLARSHIPS TAB ===== */}
        {activeTab === 'scholarships' && (
          <div>
            <h2 className="dash-section-title">Freedom Scholarships</h2>
            <p className="dash-section-subtitle">Award unrestricted cash to any athlete — paid instantly. Real impact.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <input
                className="dash-input"
                placeholder="Search by name, email, or school"
                value={athleteSearch}
                onChange={(e) => setAthleteSearch(e.target.value)}
              />
              <button className="dash-btn" onClick={searchAthletes}>Search Athletes</button>

              {searchResults.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {searchResults.map((athlete) => (
                    <div key={athlete.id} className="dash-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{athlete.full_name || athlete.email}</div>
                        <div style={{ fontSize: '0.75rem', color: '#666' }}>{athlete.school}</div>
                      </div>
                      <button className="dash-btn dash-btn-sm dash-btn-green" style={{ width: 'auto' }} onClick={() => setSelectedAthlete(athlete)}>
                        Select
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {selectedAthlete && (
                <div className="dash-card dash-card-highlight">
                  <p style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                    Awarding: {selectedAthlete.full_name || selectedAthlete.email}
                  </p>
                  <input
                    className="dash-input"
                    placeholder="Amount (e.g., 500)"
                    value={standaloneScholarshipAmount}
                    onChange={(e) => setStandaloneScholarshipAmount(e.target.value)}
                    style={{ marginBottom: '0.5rem' }}
                  />
                  <textarea
                    className="dash-textarea"
                    placeholder="Message (e.g., Great season — use for books!)"
                    value={standaloneScholarshipMessage}
                    onChange={(e) => setStandaloneScholarshipMessage(e.target.value)}
                    style={{ marginBottom: '0.75rem' }}
                  />
                  <button className="dash-btn dash-btn-green" onClick={awardScholarship} disabled={scholarshipLoading}>
                    {scholarshipLoading ? 'Awarding...' : 'Award Scholarship'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===== BOOSTER TAB ===== */}
        {activeTab === 'booster' && (
          <div>
            <h2 className="dash-section-title">Booster Events</h2>
            <p className="dash-section-subtitle">Create a booster club event — crowd-fund team expenses.</p>
            <button className="dash-btn dash-btn-green" onClick={() => router.push('/booster-events')}>
              Create Booster Club Event
            </button>
          </div>
        )}
      </div>

      {/* Card Modal */}
      {showCardModal && (
        <div className="dash-modal-overlay" onClick={() => setShowCardModal(false)}>
          <div className="dash-modal" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem', textAlign: 'center' }}>Add Card to Sponsor</h3>
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
            <button className="dash-btn" onClick={handleAddCard} disabled={paymentLoading || !cardReady}>
              {paymentLoading ? 'Saving...' : 'Save Card & Fund $50'}
            </button>
            <button className="dash-btn dash-btn-outline" style={{ marginTop: '0.5rem' }} onClick={() => setShowCardModal(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Role Switcher */}
      <div className="role-switcher">
        <span>Parent</span>
        <div
          className={`toggle-switch ${currentRole === 'business' ? 'active' : ''}`}
          onClick={() => router.push(currentRole === 'business' ? '/parent-dashboard' : '/business-dashboard')}
        />
        <span style={{ fontWeight: 700 }}>Business</span>
      </div>
    </div>
  )
}

export default function BusinessDashboard() {
  return (
    <Elements stripe={stripePromise}>
      <Suspense fallback={<div className="dash-empty" style={{ padding: '4rem 1rem' }}>Loading...</div>}>
        <BusinessDashboardContent />
      </Suspense>
    </Elements>
  )
}
