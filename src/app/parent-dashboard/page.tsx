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

const parentGigTypes = [
  { title: 'ShoutOut', amount: 50, description: 'Quick 15-sec shoutout at a local business.' },
  { title: 'Challenge', amount: 75, description: 'Fun competition — free throws, pushups, etc.' },
  { title: 'Cameo', amount: 50, description: 'Custom 15-sec video (birthday, pep talk).' },
  { title: 'Youth Clinic', amount: 500, description: 'Run a 30-60 min session for younger players.' },
  { title: 'Player Training', amount: 100, description: '40-min training session with a young player.' },
  { title: 'Custom Gig', amount: 200, description: 'Create any gig — you set the terms.' },
]

type TabId = 'wallet' | 'fund' | 'clips' | 'kids' | 'scholarships'

const tabs: { id: TabId; label: string }[] = [
  { id: 'wallet', label: 'Wallet' },
  { id: 'fund', label: 'Fund Gig' },
  { id: 'clips', label: 'Clips' },
  { id: 'kids', label: 'My Kids' },
  { id: 'scholarships', label: 'Scholarships' },
]

function ParentDashboardContent() {
  const [parent, setParent] = useState<any>(null)
  const [kids, setKids] = useState<any[]>([])
  const [selectedKid, setSelectedKid] = useState<any>(null)
  const [pendingClips, setPendingClips] = useState<any[]>([])
  const [gigCount, setGigCount] = useState(0)
  const [showFundFriend, setShowFundFriend] = useState(false)
  const [friendEmail, setFriendEmail] = useState('')
  const [friendName, setFriendName] = useState('')
  const [friendChallenge, setFriendChallenge] = useState('')
  const [friendAmount, setFriendAmount] = useState('50')
  const [savedMethods, setSavedMethods] = useState<any[]>([])
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [cardReady, setCardReady] = useState(false)
  const [activeTab, setActiveTab] = useState<TabId>('wallet')
  const [showQuickSponsor, setShowQuickSponsor] = useState(false)
  const [quickSponsorKid, setQuickSponsorKid] = useState<any>(null)
  const [showCardModal, setShowCardModal] = useState(false)
  // Fund gig form state
  const [fundGigType, setFundGigType] = useState('')
  const [fundGigDescription, setFundGigDescription] = useState('')
  const [fundGigAmount, setFundGigAmount] = useState('')
  const [fundGigKidId, setFundGigKidId] = useState('')
  const [fundingGig, setFundingGig] = useState(false)
  // Scholarship state
  const [scholarshipAmount, setScholarshipAmount] = useState('')
  const [scholarshipMessage, setScholarshipMessage] = useState('')
  const [scholarshipKidId, setScholarshipKidId] = useState('')
  const [awardingScholarship, setAwardingScholarship] = useState(false)

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

      const { data: parentRecord } = await supabase
        .from('businesses')
        .select('*')
        .eq('owner_id', user.id)
        .single()

      setParent(parentRecord)

      let kidsData: any[] = []
      if (parentRecord?.id) {
        const { data } = await supabase
          .from('profiles')
          .select('id, full_name, email, school, gig_count, profile_pic, total_earnings, scholarships_earned')
          .eq('parent_id', parentRecord.id)
        kidsData = data || []
      }
      setKids(kidsData)

      // Auto-select kid from URL param
      const kidId = searchParams.get('kid_id')
      if (kidId && kidsData.length > 0) {
        const kid = kidsData.find(k => k.id === kidId)
        if (kid) {
          setSelectedKid(kid)
          setQuickSponsorKid(kid)
          setShowQuickSponsor(true)
          setFundGigKidId(kid.id)
          setScholarshipKidId(kid.id)
        }
      } else if (kidsData.length === 1) {
        // Auto-select if only one kid
        setSelectedKid(kidsData[0])
        setFundGigKidId(kidsData[0].id)
        setScholarshipKidId(kidsData[0].id)
      }

      // Pending clips from kids
      if (kidsData.length > 0) {
        const { data: clips } = await supabase
          .from('clips')
          .select('*, offers(*), profiles(full_name)')
          .eq('status', 'pending')
          .in('athlete_id', kidsData.map(k => k.id))
        setPendingClips(clips || [])
      }

      // Total gig count across kids
      const total = kidsData.reduce((sum, kid) => sum + (kid.gig_count || 0), 0)
      setGigCount(total)

      // Saved payment methods
      if (parentRecord?.id) {
        const response = await fetch('/api/list-payment-methods', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ business_id: parentRecord.id }),
        })
        const data = await response.json()
        setSavedMethods(data.methods || [])
      }
    }
    fetchData()
  }, [router, searchParams])

  // --- Handlers ---

  const handleAddCard = async () => {
    if (!stripe || !elements) { setPaymentError('Stripe not loaded'); return }
    if (!cardReady) { setPaymentError('Card loading...'); return }
    setPaymentError(null); setPaymentSuccess(false); setPaymentLoading(true)

    const cardElement = elements.getElement('card')
    if (!cardElement) { setPaymentError('Card not found'); setPaymentLoading(false); return }

    const { error: stripeError, paymentMethod } = await stripe.createPaymentMethod({ type: 'card', card: cardElement })
    if (stripeError) { setPaymentError(stripeError.message || 'Error'); setPaymentLoading(false); return }

    const { error: dbError } = await supabase
      .from('businesses')
      .update({ debit_card_token: paymentMethod.id })
      .eq('id', parent.id)

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

  const handleAddFunds = async (amount: number) => {
    if (savedMethods.length === 0) { alert('Add a card first'); return }
    const response = await fetch('/api/charge-card', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, payment_method_id: savedMethods[0].id, business_id: parent.id }),
    })
    const data = await response.json()
    if (data.error) { alert('Charge failed: ' + data.error) }
    else { alert(`$${amount} added!`); setParent({ ...parent, wallet_balance: parent.wallet_balance + amount }) }
  }

  const approveClip = async (clip: any) => {
    const { error } = await supabase.from('clips').update({ status: 'approved' }).eq('id', clip.id)
    if (error) { alert('Error approving'); return }
    alert('Clip approved — payment sent!')
    setPendingClips(pendingClips.filter(c => c.id !== clip.id))
    setShowFundFriend(true)
  }

  const fundGig = async () => {
    if (!fundGigKidId || !fundGigType) { alert('Select a kid and gig type'); return }
    const gigType = parentGigTypes.find(g => g.title === fundGigType)
    const amount = fundGigAmount ? parseFloat(fundGigAmount) : (gigType?.amount || 50)

    if (amount <= 0) { alert('Enter a valid amount'); return }
    if (savedMethods.length === 0) { setShowCardModal(true); return }

    setFundingGig(true)
    const { error } = await supabase.from('offers').insert({
      business_id: parent.id,
      type: fundGigType,
      amount,
      description: fundGigDescription || gigType?.description || `Complete this ${fundGigType} gig!`,
      target_athlete_id: fundGigKidId,
      status: 'open',
    })

    if (error) { alert('Error: ' + error.message) }
    else {
      const kid = kids.find(k => k.id === fundGigKidId)
      alert(`$${amount} ${fundGigType} sent to ${kid?.full_name || 'your kid'}!`)
      setFundGigType(''); setFundGigDescription(''); setFundGigAmount('')
    }
    setFundingGig(false)
  }

  const fundFriend = async () => {
    if (!friendEmail || !friendChallenge || parseFloat(friendAmount) <= 0) { alert('Fill all fields'); return }
    const response = await fetch('/api/invite-friend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        friend_email: friendEmail,
        friend_name: friendName,
        challenge_description: friendChallenge,
        amount: parseFloat(friendAmount),
        parent_id: parent.id,
      }),
    })
    const data = await response.json()
    if (data.error) { alert('Error: ' + data.error) }
    else {
      alert('Friend invited and challenge funded!')
      setShowFundFriend(false); setFriendEmail(''); setFriendName(''); setFriendChallenge(''); setFriendAmount('50')
    }
  }

  const awardScholarship = async () => {
    if (!scholarshipKidId || !scholarshipAmount || parseFloat(scholarshipAmount) <= 0) {
      alert('Select a kid and enter a valid amount'); return
    }
    setAwardingScholarship(true)
    const response = await fetch('/api/payout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        athlete_id: scholarshipKidId,
        amount: parseFloat(scholarshipAmount),
        type: 'freedom_scholarship',
        message: scholarshipMessage || 'Great hustle!',
      }),
    })
    const data = await response.json()
    if (data.error) { alert('Error: ' + data.error) }
    else {
      await supabase.from('scholarships').insert({
        business_id: parent.id,
        athlete_id: scholarshipKidId,
        amount: parseFloat(scholarshipAmount),
        message: scholarshipMessage || 'Great hustle!',
      })
      const kid = kids.find(k => k.id === scholarshipKidId)
      alert(`Scholarship awarded to ${kid?.full_name || 'your kid'}!`)
      setScholarshipAmount(''); setScholarshipMessage('')
    }
    setAwardingScholarship(false)
  }

  if (!parent) {
    return <div className="dash-empty" style={{ padding: '4rem 1rem' }}>Loading your dashboard...</div>
  }

  return (
    <div className="dashboard-container" style={{ paddingBottom: '4rem' }}>
      {/* Welcome banner */}
      <div className="dash-welcome">
        <h1>Welcome, Parent!</h1>
        <p>Fund gigs, approve clips, help them earn.</p>
      </div>

      {/* Quick Sponsor Banner */}
      {showQuickSponsor && quickSponsorKid && (
        <div style={{ background: '#f0fdf4', border: '2px solid #22c55e', padding: '1rem', margin: '0.75rem', borderRadius: '8px' }}>
          <p style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.5rem', textAlign: 'center' }}>
            Fund {quickSponsorKid.full_name?.split(' ')[0]}&apos;s First Gig!
          </p>
          <p style={{ fontSize: '0.8rem', color: '#666', marginBottom: '0.75rem', textAlign: 'center' }}>
            Fund a $50 challenge — they complete it, you approve, they get paid.
          </p>
          <button className="dash-btn dash-btn-green" onClick={() => {
            if (savedMethods.length === 0) setShowCardModal(true)
            else { setActiveTab('fund'); setShowQuickSponsor(false) }
          }}>
            {savedMethods.length === 0 ? 'Add Card & Fund $50' : 'Fund a Gig Now'}
          </button>
        </div>
      )}

      {/* Progress bar */}
      <div style={{ padding: '0.75rem 1rem', background: '#f9fafb', borderBottom: '1px solid #eee' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>Kid&apos;s Progress</span>
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
          <div className="dash-stat-value">${parent?.wallet_balance?.toFixed(0) || '0'}</div>
          <div className="dash-stat-label">Wallet</div>
        </div>
        <div className="dash-stat">
          <div className="dash-stat-value">{kids.length}</div>
          <div className="dash-stat-label">Kids</div>
        </div>
        <div className="dash-stat">
          <div className="dash-stat-value">{pendingClips.length}</div>
          <div className="dash-stat-label">Pending</div>
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

        {/* ===== WALLET TAB ===== */}
        {activeTab === 'wallet' && (
          <div>
            <h2 className="dash-section-title">Wallet</h2>
            <div className="dash-card" style={{ textAlign: 'center', marginBottom: '1rem' }}>
              <div style={{ fontSize: '2rem', fontWeight: 700 }}>${parent?.wallet_balance?.toFixed(2) || '0.00'}</div>
              <div style={{ fontSize: '0.75rem', color: '#666' }}>Available Balance</div>
            </div>

            {/* Add funds */}
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
                    <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{m.brand?.toUpperCase()} •••• {m.last4}</span>
                    <span style={{ fontSize: '0.75rem', color: '#666' }}>Exp {m.exp_month}/{m.exp_year}</span>
                  </div>
                ))}
              </>
            )}

            {/* Add card */}
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

            {/* Log out in wallet tab */}
            <div style={{ marginTop: '2rem', textAlign: 'center' }}>
              <button className="dash-btn dash-btn-outline" style={{ maxWidth: '200px', margin: '0 auto' }} onClick={async () => {
                await signOut(); router.push('/'); alert('Logged out')
              }}>Log Out</button>
            </div>
          </div>
        )}

        {/* ===== FUND GIG TAB ===== */}
        {activeTab === 'fund' && (
          <div>
            <h2 className="dash-section-title">Fund a Gig</h2>
            <p className="dash-section-subtitle">Pick a gig type, customize it, and send it to your kid instantly.</p>

            {/* Select kid (if multiple) */}
            {kids.length > 1 && (
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>Which Kid?</label>
                <select
                  className="dash-input"
                  value={fundGigKidId}
                  onChange={(e) => setFundGigKidId(e.target.value)}
                >
                  <option value="">Select kid...</option>
                  {kids.map(k => <option key={k.id} value={k.id}>{k.full_name}</option>)}
                </select>
              </div>
            )}

            {/* Gig type cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
              {parentGigTypes.map((gig) => (
                <div
                  key={gig.title}
                  className={`gig-type-card ${fundGigType === gig.title ? 'selected' : ''}`}
                  onClick={() => { setFundGigType(gig.title); setFundGigAmount(String(gig.amount)) }}
                >
                  <div className="gig-title">{gig.title}</div>
                  <div className="gig-price">${gig.amount}</div>
                  <div className="gig-desc">{gig.description}</div>
                </div>
              ))}
            </div>

            {/* Custom description + amount */}
            {fundGigType && (
              <div className="dash-card dash-card-highlight" style={{ marginBottom: '0.75rem' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                  Sending: {fundGigType}
                </h3>
                <input
                  className="dash-input"
                  placeholder="Custom description (optional)"
                  value={fundGigDescription}
                  onChange={(e) => setFundGigDescription(e.target.value)}
                  style={{ marginBottom: '0.5rem' }}
                />
                <input
                  className="dash-input"
                  type="number"
                  placeholder="Amount"
                  value={fundGigAmount}
                  onChange={(e) => setFundGigAmount(e.target.value)}
                  style={{ marginBottom: '0.75rem' }}
                />
                <button className="dash-btn dash-btn-green" onClick={fundGig} disabled={fundingGig}>
                  {fundingGig ? 'Sending...' : `Fund $${fundGigAmount || '0'} ${fundGigType}`}
                </button>
              </div>
            )}

            {/* Fund a friend */}
            <div style={{ marginTop: '1.5rem' }}>
              <button className="dash-btn dash-btn-outline" onClick={() => setShowFundFriend(!showFundFriend)}>
                {showFundFriend ? 'Hide' : 'Fund a Friend\'s Kid Too'}
              </button>

              {showFundFriend && (
                <div className="dash-card" style={{ marginTop: '0.75rem' }}>
                  <h3 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem' }}>Fund a Friend</h3>
                  <p style={{ fontSize: '0.75rem', color: '#666', marginBottom: '0.75rem' }}>
                    Invite another athlete with a pre-funded challenge.
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <input className="dash-input" placeholder="Friend's email" value={friendEmail} onChange={(e) => setFriendEmail(e.target.value)} />
                    <input className="dash-input" placeholder="Friend's name (optional)" value={friendName} onChange={(e) => setFriendName(e.target.value)} />
                    <input className="dash-input" placeholder="Challenge description" value={friendChallenge} onChange={(e) => setFriendChallenge(e.target.value)} />
                    <input className="dash-input" placeholder="Amount (default $50)" value={friendAmount} onChange={(e) => setFriendAmount(e.target.value)} />
                    <button className="dash-btn dash-btn-green" onClick={fundFriend}>
                      Send Invite & Fund
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===== CLIPS TAB ===== */}
        {activeTab === 'clips' && (
          <div>
            <h2 className="dash-section-title">Pending Clips</h2>
            {pendingClips.length === 0 ? (
              <div className="dash-empty">No pending clips — fund a gig to get started!</div>
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
            {kids.length === 0 ? (
              <div className="dash-empty">
                <p>No kids linked yet.</p>
                <p style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>Your kid needs to sign up and link your account from their athlete dashboard.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {kids.map((kid) => (
                  <div key={kid.id} className="dash-card" onClick={() => setSelectedKid(selectedKid?.id === kid.id ? null : kid)} style={{ cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#e5e5e5', flexShrink: 0, overflow: 'hidden', border: '2px solid #ddd' }}>
                        <img src={kid.profile_pic || '/default-avatar.png'} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{kid.full_name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#666' }}>{kid.school}</div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{kid.gig_count || 0}</div>
                        <div style={{ fontSize: '0.65rem', color: '#666' }}>gigs</div>
                      </div>
                    </div>

                    {/* Expanded view */}
                    {selectedKid?.id === kid.id && (
                      <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #eee' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
                          <div className="dash-stat" style={{ background: '#f9fafb', borderRadius: '6px', padding: '0.5rem' }}>
                            <div className="dash-stat-value" style={{ fontSize: '1.25rem' }}>${kid.total_earnings?.toFixed(0) || '0'}</div>
                            <div className="dash-stat-label">Earned</div>
                          </div>
                          <div className="dash-stat" style={{ background: '#f0fdf4', borderRadius: '6px', padding: '0.5rem' }}>
                            <div className="dash-stat-value" style={{ fontSize: '1.25rem', color: '#16a34a' }}>${kid.scholarships_earned?.toFixed(0) || '0'}</div>
                            <div className="dash-stat-label">Scholarships</div>
                          </div>
                        </div>
                        <div className="progress-bar-track" style={{ marginBottom: '0.35rem' }}>
                          <div className="progress-bar-fill" style={{ width: `${Math.min(((kid.gig_count || 0) / 8) * 100, 100)}%` }} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '0.6rem', color: (kid.gig_count || 0) >= 4 ? '#16a34a' : '#999' }}>4 = Scholarship</span>
                          <span style={{ fontSize: '0.6rem', color: (kid.gig_count || 0) >= 8 ? '#16a34a' : '#999' }}>8 = Brand Deals</span>
                        </div>
                        <button className="dash-btn" style={{ marginTop: '0.75rem' }} onClick={(e) => {
                          e.stopPropagation()
                          setFundGigKidId(kid.id); setActiveTab('fund')
                        }}>Fund a Gig for {kid.full_name?.split(' ')[0]}</button>
                      </div>
                    )}
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
            <p className="dash-section-subtitle">Award unrestricted cash directly to your kid — paid instantly. Use for books, gear, gas, anything.</p>

            {kids.length === 0 ? (
              <div className="dash-empty">Link your kid first to award scholarships.</div>
            ) : (
              <div className="dash-card dash-card-highlight">
                {/* Select kid (if multiple) */}
                {kids.length > 1 && (
                  <div style={{ marginBottom: '0.75rem' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>Which Kid?</label>
                    <select
                      className="dash-input"
                      value={scholarshipKidId}
                      onChange={(e) => setScholarshipKidId(e.target.value)}
                    >
                      <option value="">Select kid...</option>
                      {kids.map(k => <option key={k.id} value={k.id}>{k.full_name}</option>)}
                    </select>
                  </div>
                )}

                {kids.length === 1 && (
                  <p style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                    Awarding: {kids[0].full_name}
                  </p>
                )}

                <input
                  className="dash-input"
                  type="number"
                  placeholder="Amount (e.g., 500)"
                  value={scholarshipAmount}
                  onChange={(e) => setScholarshipAmount(e.target.value)}
                  style={{ marginBottom: '0.5rem' }}
                />
                <textarea
                  className="dash-textarea"
                  placeholder="Message (e.g., Great season — use for books!)"
                  value={scholarshipMessage}
                  onChange={(e) => setScholarshipMessage(e.target.value)}
                  style={{ marginBottom: '0.75rem' }}
                />
                <button className="dash-btn dash-btn-green" onClick={awardScholarship} disabled={awardingScholarship}>
                  {awardingScholarship ? 'Awarding...' : 'Award Scholarship'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Card Modal */}
      {showCardModal && (
        <div className="dash-modal-overlay" onClick={() => setShowCardModal(false)}>
          <div className="dash-modal" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem', textAlign: 'center' }}>Add Card</h3>
            <div style={{ background: '#f9fafb', padding: '0.75rem', borderRadius: '6px', border: '1px solid #ddd', marginBottom: '0.75rem' }}>
              <CardElement
                onReady={() => setCardReady(true)}
                options={{
                  style: { base: { fontSize: '15px', color: '#000', fontFamily: 'Courier New, monospace', '::placeholder': { color: '#999' } } },
                }}
              />
            </div>
            {paymentError && <p style={{ color: '#dc2626', fontSize: '0.8rem', marginBottom: '0.5rem' }}>{paymentError}</p>}
            <button className="dash-btn" onClick={handleAddCard} disabled={paymentLoading || !cardReady}>
              {paymentLoading ? 'Saving...' : 'Save Card'}
            </button>
            <button className="dash-btn dash-btn-outline" style={{ marginTop: '0.5rem' }} onClick={() => setShowCardModal(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Role Switcher */}
      <div className="role-switcher">
        <span style={{ fontWeight: 700 }}>Parent</span>
        <div
          className={`toggle-switch ${currentRole === 'business' ? 'active' : ''}`}
          onClick={() => router.push(currentRole === 'business' ? '/parent-dashboard' : '/business-dashboard')}
        />
        <span>Business</span>
      </div>
    </div>
  )
}

export default function ParentDashboard() {
  return (
    <Elements stripe={stripePromise}>
      <Suspense fallback={<div className="dash-empty" style={{ padding: '4rem 1rem' }}>Loading...</div>}>
        <ParentDashboardContent />
      </Suspense>
    </Elements>
  )
}
