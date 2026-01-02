'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { signOut } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { loadStripe } from '@stripe/stripe-js'
import { useStripe, useElements } from '@stripe/react-stripe-js'
import dynamic from 'next/dynamic'

// Dynamically import only the React components (client-side only)
const Elements = dynamic(() => import('@stripe/react-stripe-js').then((mod) => mod.Elements), { ssr: false })
const CardElement = dynamic(() => import('@stripe/react-stripe-js').then((mod) => mod.CardElement), { ssr: false })

// Keep loadStripe static — it's safe and standard
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

const businessGigTypes = [
  { title: 'ShoutOut', baseAmount: 50, description: 'Visit a favorite business and make a quick shoutout 15-sec reel about what you like or your favorite order.' },
  { title: 'Youth Clinic', baseAmount: 500, description: 'Run 30–60 min sessions for younger athletes (with teammates).' },
  { title: 'Team Sponsor', baseAmount: 1000, description: 'Business sponsors team meals/gear — money split equally.' },
  { title: 'Cameo', baseAmount: 50, description: 'Custom 15-Sec Video for Younger Athletes (birthdays, pre-game pep talks).' },
  { title: 'Player Training', baseAmount: 100, description: 'Varsity athlete 40-minute training with young player.' },
  { title: 'Challenge', baseAmount: 75, description: 'Fun competitions — HORSE, PIG, free throws, accuracy toss. Base pay for clip, bonus if you win.' },
  { title: 'Custom Gig', baseAmount: 200, description: 'Create a gig and offer it.' },
]

function BusinessDashboardContent() {
  const [business, setBusiness] = useState<any>(null)
  const [pendingClips, setPendingClips] = useState<any[]>([])
  const [referredAthletes, setReferredAthletes] = useState<any[]>([])
  const [selectedGig, setSelectedGig] = useState<any>(null)
  const [numAthletes, setNumAthletes] = useState(1)
  const [customDetails, setCustomDetails] = useState('')
  const [amount, setAmount] = useState('')
  const [scholarshipAmount, setScholarshipAmount] = useState('')
  const [date, setDate] = useState('')
  const [location, setLocation] = useState('')
  const [businessPhone, setBusinessPhone] = useState('')
  const [isRecurring, setIsRecurring] = useState(false)
  const [savedMethods, setSavedMethods] = useState<any[]>([])
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [cardReady, setCardReady] = useState(false)
  const [activeTab, setActiveTab] = useState<'profile' | 'wallet' | 'gigs' | 'clips' | 'kids' | 'favorites' | 'scholarships' | 'booster'>('profile')
  const [athleteSearch, setAthleteSearch] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [selectedAthlete, setSelectedAthlete] = useState<any>(null)
  const [standaloneScholarshipAmount, setStandaloneScholarshipAmount] = useState('')
  const [standaloneScholarshipMessage, setStandaloneScholarshipMessage] = useState('')
  const [scholarshipLoading, setScholarshipLoading] = useState(false)
  const [editingProfile, setEditingProfile] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [profileComplete, setProfileComplete] = useState(false)

  const router = useRouter()
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
      if (!user) {
        router.replace('/')
        return
      }

      const { data: biz } = await supabase
        .from('businesses')
        .select('*')
        .eq('owner_id', user.id)
        .single()

      if (biz) {
        setBusiness(biz)
        setProfileComplete(!!biz.name && !!biz.phone)

        const { data: referred } = await supabase
          .from('profiles')
          .select('id, full_name, email, school')
          .eq('referred_by', biz.id)
        setReferredAthletes(referred || [])

        const { data: offers } = await supabase.from('offers').select('id').eq('business_id', biz.id)
        const offerIds = offers?.map(o => o.id) || []
        const { data: clips } = await supabase
          .from('clips')
          .select('*, offers(*), profiles(email, parent_email)')
          .eq('status', 'pending')
          .in('offer_id', offerIds)
        setPendingClips(clips || [])

        if (biz.id) {
          const response = await fetch('/api/list-payment-methods', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ business_id: biz.id }),
          })
          const data = await response.json()
          setSavedMethods(data.methods || [])
        }
      }
    }

    fetchData()
  }, [router])

  const handleGigSelect = (gig: any) => {
    setSelectedGig(gig)
    setNumAthletes(1)
    setAmount('')
    setCustomDetails('')
    setDate('')
    setLocation('')
    setBusinessPhone('')
    setIsRecurring(false)
    setScholarshipAmount('')
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

  const createChallengeForKid = async (kid: any) => {
    const description = prompt(`Enter challenge for ${kid.full_name || kid.email} (e.g., 80/100 free throws)`)
    const amountStr = prompt('Payout amount if completed (e.g., 50)')
    if (!description || !amountStr) return

    const amount = parseFloat(amountStr)
    if (isNaN(amount) || amount <= 0) {
      alert('Invalid amount')
      return
    }

    const response = await fetch('/api/create-gig', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        business_id: business.id,
        type: 'Challenge',
        amount,
        description,
        target_athlete_email: kid.email,
      }),
    })

    const data = await response.json()

    if (data.error) {
      alert('Error creating challenge: ' + data.error)
    } else {
      alert(`Challenge created for ${kid.full_name || kid.email}!`)
    }
  }

  const handleAddFunds = async (amount: number) => {
    if (savedMethods.length === 0) {
      alert('Please add a card first')
      return
    }

    const response = await fetch('/api/charge-card', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount,
        payment_method_id: savedMethods[0].id,
        business_id: business.id,
      }),
    })

    const data = await response.json()

    if (data.error) {
      alert('Charge failed: ' + data.error)
    } else {
      alert(`$${amount} added to wallet!`)
      setBusiness({ ...business, wallet_balance: business.wallet_balance + amount })
    }
  }

  const handleAddCard = async () => {
    if (!stripe || !elements) {
      setPaymentError('Stripe not loaded')
      return
    }

    setPaymentError(null)
    setPaymentSuccess(false)
    setPaymentLoading(true)

    const cardElement = elements.getElement(CardElement)
    if (!cardElement) {
      setPaymentError('Card element not found')
      return
    }

    const { error: stripeError, paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
      card: cardElement,
    })

    if (stripeError) {
      setPaymentError(stripeError.message || 'Payment error')
      setPaymentLoading(false)
      return
    }

    const response = await fetch('/api/attach-payment-method', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        payment_method_id: paymentMethod.id,
        business_id: business.id,
      }),
    })

    const data = await response.json()

    if (data.error) {
      setPaymentError(data.error)
    } else {
      setPaymentSuccess(true)
      setSavedMethods([...savedMethods, data.method])
      setTimeout(() => setPaymentSuccess(false), 5000)
    }

    setPaymentLoading(false)
  }

  const searchAthletes = async () => {
    if (!athleteSearch.trim()) {
      setSearchResults([])
      return
    }

    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, email, school')
      .or(`full_name.ilike.%${athleteSearch}%,email.ilike.%${athleteSearch}%,school.ilike.%${athleteSearch}%`)
      .limit(10)

    setSearchResults(data || [])
  }

  const awardScholarship = async () => {
    if (!selectedAthlete || !standaloneScholarshipAmount || parseFloat(standaloneScholarshipAmount) <= 0) {
      alert('Select an athlete and enter a valid amount')
      return
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

    if (data.error) {
      alert('Error: ' + data.error)
    } else {
      await supabase
        .from('scholarships')
        .insert({
          business_id: business.id,
          athlete_id: selectedAthlete.id,
          amount: parseFloat(standaloneScholarshipAmount),
          message: standaloneScholarshipMessage || 'Great hustle!',
        })

      alert(`$${standaloneScholarshipAmount} Freedom Scholarship awarded to ${selectedAthlete.full_name || selectedAthlete.email}!`)
      setStandaloneScholarshipAmount('')
      setStandaloneScholarshipMessage('')
      setSelectedAthlete(null)
      setSearchResults([])
      setAthleteSearch('')
    }

    setScholarshipLoading(false)
  }

  return (
    <div className="container py-8 font-mono">
      <p className="text-center mb-12 text-xl">Welcome, {business?.name || 'Business Owner'}!</p>

      <div className="bg-black text-white p-8 mb-12">
        <h1 className="text-3xl font-bold text-center">Your Business Admin Console</h1>
      </div>

      <div className="bg-black text-white p-8 mb-12">
        <p className="text-lg leading-relaxed text-center">
          The easiest way to get new customers with authentic content from local athletes.<br />
          Post gigs, review clips — only approve what you love.<br />
          Become the hometown hero with Freedom Scholarships.
        </p>
      </div>

      {/* 4-Step Guidance — Right below welcome */}
      <div className="bg-black text-white p-16 border-4 border-black max-w-4xl mx-auto text-center">
        <h2 className="text-4xl font-bold mb-12">Get Started in 4 Steps</h2>
        <ol className="text-2xl space-y-8 max-w-2xl mx-auto text-left">
          <li><strong>1.</strong> Complete your profile (name + phone)</li>
          <li><strong>2.</strong> Add a card for funding</li>
          <li><strong>3.</strong> Add funds to your wallet</li>
          <li><strong>4.</strong> Post your first gig → start getting content</li>
        </ol>
      </div>

      {/* Sticky Tabs with Counts */}
      <div className="sticky top-0 bg-white z-30 border-b-4 border-black py-4 shadow-lg">
        <div className="flex justify-center gap-3 flex-wrap px-4 items-center">
          <Button
            onClick={() => setActiveTab('profile')}
            variant={activeTab === 'profile' ? 'default' : 'outline'}
            className="px-6 py-4 text-lg font-bold min-w-[100px]"
          >
            Profile
          </Button>
          <Button
            onClick={() => setActiveTab('wallet')}
            variant={activeTab === 'wallet' ? 'default' : 'outline'}
            className="px-6 py-4 text-lg font-bold min-w-[100px]"
          >
            Wallet
          </Button>
          <Button
            onClick={() => setActiveTab('gigs')}
            variant={activeTab === 'gigs' ? 'default' : 'outline'}
            className="px-6 py-4 text-lg font-bold min-w-[100px]"
          >
            Gigs
          </Button>
          {/* More Dropdown — Small Button with List */}
          <div className="relative">
            <Button variant="outline" className="px-6 py-4 text-lg font-bold min-w-[100px] border-4 border-black" onClick={() => setShowDropdown(!showDropdown)}>
              More
            </Button>
            {showDropdown && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-white border-4 border-black shadow-lg rounded z-50">
                <Button onClick={() => { setActiveTab('clips'); setShowDropdown(false) }} className="w-full text-left px-4 py-3 hover:bg-gray-100 border-b-2 border-gray-300">
                  Clips
                </Button>
                <Button onClick={() => { setActiveTab('kids'); setShowDropdown(false) }} className="w-full text-left px-4 py-3 hover:bg-gray-100 border-b-2 border-gray-300">
                  My Kids
                </Button>
                <Button onClick={() => { setActiveTab('favorites'); setShowDropdown(false) }} className="w-full text-left px-4 py-3 hover:bg-gray-100 border-b-2 border-gray-300">
                  Favorites
                </Button>
                <Button onClick={() => { setActiveTab('scholarships'); setShowDropdown(false) }} className="w-full text-left px-4 py-3 hover:bg-gray-100 border-b-2 border-gray-300">
                  Scholarships
                </Button>
                <Button onClick={() => { setActiveTab('booster'); setShowDropdown(false) }} className="w-full text-left px-4 py-3 hover:bg-gray-100">
                  Booster
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ACTIVE TAB CONTENT ONLY */}
      <div className="pt-8 pb-40">

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="px-4">
            <h3 className="text-4xl font-bold mb-12 text-center">Your Profile</h3>
            {business?.name && business?.phone ? (
              <div className="max-w-2xl mx-auto p-16 bg-gray-100 border-4 border-black">
                <div className="flex items-center justify-between mb-8">
                  <p className="text-2xl">Business Name: {business.name}</p>
                  <button onClick={() => setEditingProfile(true)} className="text-gray-600 hover:text-black">
                    ✏️ Edit
                  </button>
                </div>
                <p className="text-2xl">Contact Phone: {business.phone}</p>
              </div>
            ) : (
              <div className="max-w-2xl mx-auto p-16 bg-yellow-100 border-4 border-black">
                <h3 className="text-4xl font-bold mb-12 text-center">Complete Your Profile</h3>
                <p className="text-xl mb-16 text-center">
                  Add your business name and contact phone.
                </p>
                <div className="space-y-10">
                  <div>
                    <label className="block text-xl mb-4 font-mono">Business Name</label>
                    <Input
                      value={business?.name || ''}
                      onChange={(e) => setBusiness({ ...business, name: e.target.value })}
                      placeholder="e.g., Bridge Pizza"
                      className="h-16 text-xl font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xl mb-4 font-mono">Contact Phone</label>
                    <Input
                      value={business?.phone || ''}
                      onChange={(e) => setBusiness({ ...business, phone: e.target.value })}
                      placeholder="(555) 123-4567"
                      className="h-16 text-xl font-mono"
                    />
                  </div>
                  <Button
                    onClick={async () => {
                      const { error } = await supabase
                        .from('businesses')
                        .update({ name: business.name, phone: business.phone })
                        .eq('id', business.id)
                      if (error) {
                        alert('Error saving profile: ' + error.message)
                      } else {
                        alert('Profile saved!')
                        setBusiness({ ...business }) // Trigger re-render
                      }
                    }}
                    className="w-full h-20 text-3xl bg-black text-white font-bold font-mono"
                  >
                    Save Profile & Continue
                  </Button>
                </div>
              </div>
            )}
            {editingProfile && business?.name && business?.phone && (
              <div className="max-w-2xl mx-auto p-16 bg-yellow-100 border-4 border-black mt-12">
                <h3 className="text-3xl font-bold mb-8 text-center">Edit Profile</h3>
                <div className="space-y-8">
                  <Input
                    value={business?.name || ''}
                    onChange={(e) => setBusiness({ ...business, name: e.target.value })}
                    placeholder="Business Name"
                    className="h-16 text-xl"
                  />
                  <Input
                    value={business?.phone || ''}
                    onChange={(e) => setBusiness({ ...business, phone: e.target.value })}
                    placeholder="Contact Phone"
                    className="h-16 text-xl"
                  />
                  <Button
                    onClick={async () => {
                      const { error } = await supabase
                        .from('businesses')
                        .update({ name: business.name, phone: business.phone })
                        .eq('id', business.id)
                      if (error) {
                        alert('Error saving profile')
                      } else {
                        alert('Profile updated!')
                        setEditingProfile(false)
                      }
                    }}
                    className="w-full h-16 text-xl bg-black text-white font-bold font-mono"
                  >
                    Save Changes
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Wallet Tab */}
        {activeTab === 'wallet' && (
          <div className="space-y-32 px-4">
            {/* Card Entry — Sleek, Modern, Spacious */}
            <div className="max-w-md mx-auto py-8 bg-white p-12 border-4 border-black rounded-lg shadow-2xl">
              <h3 className="text-3xl font-bold mb-8 text-center">Add Card for Funding</h3>
              <p className="text-xl mb-12 text-center text-gray-600">
                Secure by Stripe — safe and encrypted.
              </p>
              <Elements stripe={stripePromise}>
                <div className="space-y-12">
                  <div className="bg-gray-50 p-8 border-4 border-gray-300 rounded-lg">
                    <CardElement
                      options={{
                        style: {
                          base: {
                            fontSize: '20px',
                            color: '#000000',
                            fontFamily: 'Courier New, monospace',
                            '::placeholder': { color: '#666666' },
                          },
                        },
                      }}
                    />
                  </div>
                  {paymentError && <p className="text-red-600 text-center text-xl">{paymentError}</p>}
                  {paymentSuccess && <p className="text-green-600 text-center text-xl">Card saved!</p>}
                  <Button
                    onClick={handleAddCard}
                    disabled={paymentLoading}
                    className="w-full h-16 text-xl bg-black text-white font-bold"
                  >
                    {paymentLoading ? 'Saving...' : 'Save Card'}
                  </Button>
                </div>
              </Elements>
            </div>

            {/* Add Funds */}
            <div className="max-w-3xl mx-auto">
              <h3 className="text-3xl font-bold mb-8 text-center">Add Funds to Wallet</h3>
              <p className="text-xl mb-12 text-center">
                Balance: ${business?.wallet_balance?.toFixed(2) || '0.00'}
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <Button onClick={() => handleAddFunds(100)} className="h-16 text-xl bg-black text-white">+ $100</Button>
                <Button onClick={() => handleAddFunds(500)} className="h-16 text-xl bg-black text-white">+ $500</Button>
                <Button onClick={() => handleAddFunds(1000)} className="h-16 text-xl bg-black text-white">+ $1000</Button>
                <Button
                  onClick={() => {
                    const amt = prompt('Custom amount:')
                    if (amt && !isNaN(Number(amt))) handleAddFunds(Number(amt))
                  }}
                  className="h-16 text-xl bg-green-400 text-black"
                >
                  Custom
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Create Gigs Tab */}
        {activeTab === 'gigs' && (
          <div className="px-6">
            <h3 className="text-3xl font-bold mb-8 text-center">Create Gigs</h3>
            <p className="text-xl mb-12 text-center">
              Choose a gig type to get started.
            </p>
            <div className="space-y-8">
              {businessGigTypes.map((gig) => (
                <div key={gig.title} style={{ border: '4px solid black', backgroundColor: '#ffffff', padding: '24px', textAlign: 'center' }}>
                  <h4 style={{ fontSize: '28px', fontWeight: 'bold' }}>{gig.title}</h4>
                  <p style={{ fontSize: '24px', color: '#28a745', fontWeight: 'bold', marginBottom: '16px' }}>${gig.baseAmount}+</p>
                  <p style={{ fontSize: '18px', lineHeight: '1.5' }}>{gig.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Secondary Tabs Content — Triggered from Dropdown */}
        {activeTab === 'clips' && (
          <div className="px-4">
            <h3 className="text-3xl mb-8 font-bold text-center">Pending Clips</h3>
            {pendingClips.length === 0 ? (
              <p className="text-gray-600 mb-12">No pending clips — post offers to get started!</p>
            ) : (
              <div className="space-y-16">
                {pendingClips.map((clip) => (
                  <div key={clip.id} className="border-4 border-black p-8 bg-white max-w-2xl mx-auto">
                    <p className="font-bold mb-4 text-left">From: {clip.profiles.email}</p>
                    <p className="mb-6 text-left">Offer: {clip.offers.type} — ${clip.offers.amount}</p>
                    <video controls className="w-full mb-8">
                      <source src={clip.video_url} type="video/mp4" />
                    </video>
                    <p className="text-sm text-gray-600 mb-4">
                      Prove it with timelapse or witness video — easy!
                    </p>
                    <Button 
                      onClick={() => approveClip(clip)}
                      className="w-full h-16 text-xl bg-black text-white"
                    >
                      Approve & Send to Parent
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'kids' && (
          <div className="px-4">
            <h3 className="text-3xl mb-8 font-bold text-center">My Kids</h3>
            <p className="mb-8 text-lg">
              Create a challenge for your kid — they complete, you approve, they get paid.
            </p>
            <div className="space-y-8 max-w-2xl mx-auto">
              {referredAthletes.length === 0 ? (
                <p className="text-gray-600">No referred athletes yet — wait for kids to pitch you!</p>
              ) : (
                referredAthletes.map((kid) => (
                  <div key={kid.id} className="border-4 border-black p-8 bg-gray-100">
                    <p className="font-bold text-2xl mb-4">{kid.full_name || kid.email}</p>
                    <p className="mb-6 text-lg">
                      Prove it with timelapse or witness video — easy!
                    </p>
                    <Button 
                      onClick={() => createChallengeForKid(kid)}
                      className="w-full h-16 text-xl bg-green-400 text-black"
                    >
                      Create Challenge for {kid.full_name?.split(' ')[0] || 'Kid'}
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}


        {activeTab === 'favorites' && (
          <div className="px-4">
            <h3 className="text-3xl mb-8 font-bold text-center">Favorites</h3>
            <p className="mb-8 text-lg">
              Quick access to athletes you like — re-fund gigs easily.
            </p>
            <p className="text-gray-600 mb-12">
              No favorites yet — add from clips or kids.
            </p>
          </div>
        )}

        {activeTab === 'scholarships' && (
          <div className="px-4">
            <h3 className="text-3xl mb-8 font-bold text-center">Scholarships</h3>
            <p className="text-xl mb-12 max-w-3xl mx-auto">
              Award unrestricted cash to any athlete — paid instantly.<br />
              Real impact. Real hero status.
            </p>

            <div className="max-w-2xl mx-auto space-y-8">
              <Input
                placeholder="Search athlete by name, email, or school"
                value={athleteSearch}
                onChange={(e) => setAthleteSearch(e.target.value)}
                className="text-center"
              />
              <Button onClick={searchAthletes} className="w-full h-16 text-xl bg-black text-white">
                Search Athletes
              </Button>

              {searchResults.length > 0 && (
                <div className="space-y-4">
                  {searchResults.map((athlete) => (
                    <div key={athlete.id} className="border-4 border-black p-6 bg-gray-100">
                      <p className="text-lg">
                        {athlete.full_name || athlete.email} — {athlete.school}
                      </p>
                      <Button
                        onClick={() => setSelectedAthlete(athlete)}
                        className="mt-4 w-full h-14 text-lg bg-green-600 text-white"
                      >
                        Select This Athlete
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {selectedAthlete && (
                <div className="border-4 border-green-600 p-8 bg-green-100">
                  <p className="text-xl mb-4 text-center">
                    Selected: {selectedAthlete.full_name || selectedAthlete.email} ({selectedAthlete.school})
                  </p>
                  <Input
                    placeholder="Scholarship amount (e.g., 500)"
                    value={standaloneScholarshipAmount}
                    onChange={(e) => setStandaloneScholarshipAmount(e.target.value)}
                    className="mb-6"
                  />
                  <textarea
                    placeholder="Optional message (e.g., Great season — use for books!)"
                    value={standaloneScholarshipMessage}
                    onChange={(e) => setStandaloneScholarshipMessage(e.target.value)}
                    className="w-full p-4 text-lg border-4 border-black font-mono mb-6"
                    rows={6}
                  />
                  <Button
                    onClick={awardScholarship}
                    disabled={scholarshipLoading}
                    className="w-full h-16 text-xl bg-green-600 text-white font-bold"
                  >
                    {scholarshipLoading ? 'Awarding...' : 'Award Freedom Scholarship Instantly'}
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}


        {activeTab === 'booster' && (
          <div className="px-4">
            <h3 className="text-3xl mb-8 font-bold text-center">Booster</h3>
            <p className="mb-8 text-lg">
              Create a booster club event — crowd-fund team expenses.
            </p>
            <Button 
              onClick={() => router.push('/booster-events')}
              className="w-full max-w-md h-20 text-2xl bg-green-400 text-black"
            >
              Create Booster Club Event
            </Button>
          </div>
        )}


      </div>

      {/* Log Out */}
      <div className="text-center py-20">
        <Button
          onClick={async () => {
            await signOut()
            router.push('/')
            alert('Logged out successfully')
          }}
          variant="outline"
          className="w-32 h-14 text-lg border-4 border-black"
        >
          Log Out
        </Button>
      </div>

      {/* Role Switcher */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
        <div className="bg-white border-4 border-black rounded-full shadow-xl px-6 py-3 flex items-center gap-6">
          <span className="text-sm font-mono text-gray-600">Role:</span>
          <div className="relative inline-flex items-center">
            <span className="text-sm font-bold font-mono mr-3">Parent</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={currentRole === 'business'}
                onChange={() => router.push(currentRole === 'business' ? '/parent-dashboard' : '/business-dashboard')}
              />
              <div className="w-12 h-6 bg-gray-300 rounded-full peer peer-checked:bg-black after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:border after:border-gray-300 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-6"></div>
            </label>
            <span className="text-sm font-bold font-mono ml-3">Business</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function BusinessDashboard() {
  return (
    <Elements stripe={stripePromise}>
      <Suspense fallback={<p className="text-center py-32 text-2xl">Loading...</p>}>
        <BusinessDashboardContent />
      </Suspense>
    </Elements>
  )
}