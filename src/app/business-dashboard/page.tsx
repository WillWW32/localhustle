'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { signOut } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'

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
  const [activeTab, setActiveTab] = useState<'wallet' | 'gigs' | 'clips' | 'kids' | 'favorites' | 'scholarships' | 'booster'>('wallet')
  const [athleteSearch, setAthleteSearch] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [selectedAthlete, setSelectedAthlete] = useState<any>(null)
  const [standaloneScholarshipAmount, setStandaloneScholarshipAmount] = useState('')
  const [standaloneScholarshipMessage, setStandaloneScholarshipMessage] = useState('')
  const [scholarshipLoading, setScholarshipLoading] = useState(false)

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

  // Auto-scroll to top when tab changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [activeTab])

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

    if (!cardReady) {
      setPaymentError('Card field still loading — please wait a second')
      return
    }

    setPaymentError(null)
    setPaymentSuccess(false)
    setPaymentLoading(true)

    const cardElement = elements.getElement(CardElement)
    if (!cardElement) {
      setPaymentError('Card element not found')
      setPaymentLoading(false)
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

      {/* Sticky Tabs with Counts */}
      <div className="sticky top-0 bg-white z-30 border-b-4 border-black py-4 shadow-lg">
        <div className="flex justify-center gap-3 flex-wrap px-4">
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
            Create Gigs
          </Button>
          <Button
            onClick={() => setActiveTab('clips')}
            variant={activeTab === 'clips' ? 'default' : 'outline'}
            className="px-6 py-4 text-lg font-bold min-w-[100px]"
          >
            Clips ({pendingClips.length})
          </Button>
          <Button
            onClick={() => setActiveTab('kids')}
            variant={activeTab === 'kids' ? 'default' : 'outline'}
            className="px-6 py-4 text-lg font-bold min-w-[100px]"
          >
            My Kids ({referredAthletes.length})
          </Button>
          <Button
            onClick={() => setActiveTab('favorites')}
            variant={activeTab === 'favorites' ? 'default' : 'outline'}
            className="px-6 py-4 text-lg font-bold min-w-[100px]"
          >
            Favorites
          </Button>
          <Button
            onClick={() => setActiveTab('scholarships')}
            variant={activeTab === 'scholarships' ? 'default' : 'outline'}
            className="px-6 py-4 text-lg bg-green-500 text-black border-4 border-black hover:bg-green-400 font-bold min-w-[140px]"
          >
            Scholarships
          </Button>
          <Button
            onClick={() => setActiveTab('booster')}
            variant={activeTab === 'booster' ? 'default' : 'outline'}
            className="px-6 py-4 text-lg font-bold min-w-[100px]"
          >
            Booster
          </Button>
        </div>
      </div>

      {/* ACTIVE TAB CONTENT ONLY */}
      <div className="pt-8 pb-40">

        {/* Wallet Tab */}
        {activeTab === 'wallet' && (
          <div className="space-y-32 px-4">
            {/* 4-Step Guidance — First thing */}
            <div className="bg-black text-white p-16 border-4 border-black max-w-4xl mx-auto text-center">
              <h2 className="text-4xl font-bold mb-12">Get Started in 4 Steps</h2>
              <ol className="text-2xl space-y-8 max-w-2xl mx-auto text-left">
                <li><strong>1.</strong> Complete your profile (name + phone)</li>
                <li><strong>2.</strong> Add a card for funding</li>
                <li><strong>3.</strong> Add funds to your wallet</li>
                <li><strong>4.</strong> Post your first gig → start getting content</li>
              </ol>
            </div>

            {/* Profile Completion */}
            {(!business?.name || !business?.phone) && (
              <div className="max-w-2xl mx-auto p-12 bg-yellow-100 border-4 border-yellow-600">
                <h3 className="text-3xl font-bold mb-8 text-center">
                  Step 1: Complete Your Business Profile
                </h3>
                <p className="text-xl mb-12 text-center">
                  Add your business name and contact info to post gigs and award scholarships.
                </p>
                <div className="space-y-8">
                  <div>
                    <label className="block text-lg mb-2">Business Name</label>
                    <Input
                      value={business?.name || ''}
                      onChange={(e) => setBusiness({ ...business, name: e.target.value })}
                      placeholder="e.g., Bridge Pizza"
                    />
                  </div>
                  <div>
                    <label className="block text-lg mb-2">Contact Phone</label>
                    <Input
                      value={business?.phone || ''}
                      onChange={(e) => setBusiness({ ...business, phone: e.target.value })}
                      placeholder="(555) 123-4567"
                    />
                  </div>
                  <Button
                    onClick={async () => {
                      const { error } = await supabase
                        .from('businesses')
                        .update({ name: business.name, phone: business.phone })
                        .eq('id', business.id)
                      if (error) alert('Error saving profile')
                      else {
                        alert('Profile saved!')
                        setBusiness({ ...business })
                      }
                    }}
                    className="w-full h-16 text-xl bg-black text-white"
                  >
                    Save Profile
                  </Button>
                </div>
              </div>
            )}

            {/* Card Entry */}
            <div className="max-w-3xl mx-auto py-24">
              <div className="bg-white p-20 border-4 border-black rounded-lg shadow-2xl">
                <h3 className="text-4xl font-bold mb-12 text-center">Step 2: Add Card for Funding</h3>
                <p className="text-xl mb-16 text-center text-gray-600">
                  Secure by Stripe — only used when you approve content.
                </p>
                <Elements stripe={stripePromise}>
                  <div className="space-y-16">
                    <div className="bg-gray-50 p-12 border-4 border-gray-300 rounded-lg">
                      <CardElement
                        onReady={() => setCardReady(true)}
                        options={{
                          style: {
                            base: {
                              fontSize: '22px',
                              color: '#000',
                              fontFamily: 'Courier New, monospace',
                              '::placeholder': { color: '#666' },
                              backgroundColor: '#fff',
                              padding: '20px',
                            },
                          },
                        }}
                      />
                    </div>
                    {paymentError && <p className="text-red-600 text-center text-2xl">{paymentError}</p>}
                    {paymentSuccess && <p className="text-green-600 text-center text-2xl">Card saved successfully!</p>}
                    <Button
                      onClick={handleAddCard}
                      disabled={paymentLoading || !cardReady}
                      className="w-full h-20 text-3xl bg-black text-white font-bold"
                    >
                      {paymentLoading ? 'Saving...' : 'Save Card'}
                    </Button>
                  </div>
                </Elements>
              </div>
            </div>

            {/* Saved Cards */}
            {savedMethods.length > 0 && (
              <div className="max-w-2xl mx-auto">
                <h4 className="text-2xl font-bold mb-8 text-center">Saved Cards</h4>
                <div className="space-y-6">
                  {savedMethods.map((method) => (
                    <div key={method.id} className="bg-gray-100 p-8 border-4 border-black">
                      <p className="text-xl">
                        {method.brand.toUpperCase()} •••• {method.last4}<br />
                        Expires {method.exp_month}/{method.exp_year}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add Funds */}
            {(business?.name && business?.phone) && savedMethods.length > 0 && (
              <div className="max-w-3xl mx-auto">
                <h3 className="text-4xl font-bold mb-12 text-center">Step 3: Add Funds to Wallet</h3>
                <p className="text-xl mb-12 text-center">
                  Current balance: ${business?.wallet_balance?.toFixed(2) || '0.00'}
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                  <Button onClick={() => handleAddFunds(100)} className="h-20 text-2xl bg-black text-white">
                    + $100
                  </Button>
                  <Button onClick={() => handleAddFunds(500)} className="h-20 text-2xl bg-black text-white">
                    + $500
                  </Button>
                  <Button onClick={() => handleAddFunds(1000)} className="h-20 text-2xl bg-black text-white">
                    + $1000
                  </Button>
                  <Button
                    onClick={() => {
                      const amt = prompt('Custom amount:')
                      if (amt && !isNaN(Number(amt))) handleAddFunds(Number(amt))
                    }}
                    className="h-20 text-2xl bg-green-400 text-black"
                  >
                    Custom
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

                {/* Create Gigs Tab — Clean Vertical Cards + Share on Post */}
        {activeTab === 'gigs' && (
          <div className="px-4">
            <h2 className="text-4xl font-bold mb-12 text-center font-mono">Step 4: Create a Gig</h2>
            <p className="text-xl mb-16 text-center max-w-3xl mx-auto font-mono">
              Choose a gig type. Athletes create authentic content for you.<br />
              Review and approve — only pay for what you love.
            </p>

            <div className="max-w-4xl mx-auto space-y-12">
              {businessGigTypes.map((gig) => (
                <div
                  key={gig.title}
                  className={`border-4 border-black transition-all ${
                    selectedGig?.title === gig.title ? 'bg-green-100' : 'bg-white hover:bg-gray-50'
                  }`}
                >
                  {/* Card Header — Click to Select */}
                  <button
                    onClick={() => handleGigSelect(gig)}
                    className="w-full p-12 text-left"
                  >
                    <h3 className="text-4xl font-bold mb-6 font-mono">{gig.title}</h3>
                    <p className="text-3xl font-bold mb-8 text-green-600">${gig.baseAmount}+</p>
                    <p className="text-xl leading-relaxed font-mono">{gig.description}</p>
                  </button>

                  {/* Expanded Customize Panel */}
                  {selectedGig?.title === gig.title && (
                    <div className="p-12 border-t-4 border-black bg-white space-y-10">
                      <h3 className="text-3xl font-bold text-center mb-10 font-mono">
                        Customize Your {gig.title}
                      </h3>

                      <div className="space-y-8 max-w-2xl mx-auto">
                        <div>
                          <label className="block text-xl mb-3 font-mono">Number of Athletes</label>
                          <select
                            value={numAthletes}
                            onChange={(e) => handleAthletesChange(Number(e.target.value))}
                            className="w-full p-5 text-xl border-4 border-black font-mono bg-white"
                          >
                            {[1,2,3,4,5,6,7,8,9,10].map(n => (
                              <option key={n} value={n} className="text-xl">
                                {n} athlete{n > 1 ? 's' : ''}
                              </option>
                            ))}
                          </select>
                          <p className="text-lg mt-3 text-gray-600 font-mono">+ $75 per additional athlete</p>
                        </div>

                        <div>
                          <label className="block text-xl mb-3 font-mono">Date (Optional)</label>
                          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-16 text-xl font-mono" />
                        </div>

                        <div>
                          <label className="block text-xl mb-3 font-mono">Location</label>
                          <Input placeholder="e.g., Bridge Pizza" value={location} onChange={(e) => setLocation(e.target.value)} className="h-16 text-xl font-mono" />
                        </div>

                        <div>
                          <label className="block text-xl mb-3 font-mono">Your Phone (for athlete contact)</label>
                          <Input placeholder="(555) 123-4567" value={businessPhone} onChange={(e) => setBusinessPhone(e.target.value)} className="h-16 text-xl font-mono" />
                        </div>

                        <div className="flex justify-center">
                          <label className="flex items-center gap-4 text-xl font-mono">
                            <input
                              type="checkbox"
                              checked={isRecurring}
                              onChange={(e) => setIsRecurring(e.target.checked)}
                              className="w-8 h-8"
                            />
                            Make this recurring monthly
                          </label>
                        </div>

                        <div>
                          <label className="block text-xl mb-3 font-mono">Offer Amount</label>
                          <Input value={amount} onChange={(e) => setAmount(e.target.value)} className="h-16 text-xl font-mono" />
                        </div>

                        <div>
                          <label className="block text-xl mb-3 font-mono">Freedom Scholarship Bonus (Optional)</label>
                          <Input value={scholarshipAmount} onChange={(e) => setScholarshipAmount(e.target.value)} className="h-16 text-xl font-mono" />
                        </div>

                        <div>
                          <label className="block text-xl mb-3 font-mono">Custom Details (Optional)</label>
                          <textarea
                            value={customDetails}
                            onChange={(e) => setCustomDetails(e.target.value)}
                            className="w-full h-48 p-6 text-xl border-4 border-black font-mono bg-white"
                            placeholder="e.g., Wear our shirt, tag @yourbusiness, say our slogan..."
                          />
                        </div>

                        <div className="space-y-6">
                          <Button
                            onClick={async () => {
                              // Placeholder for real post logic
                              await handlePost()

                              // Native Share after post
                              const shareText = `Hey! I just posted a $${amount || gig.baseAmount} ${gig.title} gig on LocalHustle. Complete it and get paid instantly!`
                              const shareUrl = `https://app.localhustle.org/athlete-dashboard` // Replace with real gig link when available

                              const shareData = {
                                title: 'LocalHustle Gig Opportunity',
                                text: shareText,
                                url: shareUrl,
                              }

                              if (navigator.share && navigator.canShare(shareData)) {
                                try {
                                  await navigator.share(shareData)
                                } catch (err) {
                                  // Fallback to clipboard
                                  navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`)
                                  alert('Gig posted! Share link copied to clipboard.')
                                }
                              } else {
                                navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`)
                                alert('Gig posted! Share link copied to clipboard.')
                              }
                            }}
                            className="w-full h-20 text-3xl bg-green-400 text-black font-bold font-mono hover:bg-green-500"
                          >
                            Fund & Post Offer
                          </Button>

                          <Button
                            onClick={() => handleGigSelect(null)}
                            variant="outline"
                            className="w-full h-16 text-xl border-4 border-black font-mono"
                          >
                            Choose Different Gig
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        {/* Pending Clips Tab */}
        {activeTab === 'clips' && (
          <div className="px-4">
            <h3 className="text-2xl mb-8 font-bold">Pending Clips to Review</h3>
            {pendingClips.length === 0 ? (
              <p className="text-gray-600 mb-12 text-center text-xl">No pending clips — post offers to get started!</p>
            ) : (
              <div className="space-y-16">
                {pendingClips.map((clip) => (
                  <div key={clip.id} className="border-4 border-black p-8 bg-white max-w-2xl mx-auto">
                    <p className="font-bold mb-4 text-left">From: {clip.profiles.email}</p>
                    <p className="mb-6 text-left">Offer: {clip.offers.type} — ${clip.offers.amount}</p>
                    <video controls className="w-full mb-8 rounded">
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

        {/* My Kid's Challenges Tab */}
        {activeTab === 'kids' && (
          <div className="px-4">
            <h3 className="text-3xl mb-8 font-bold text-center">My Kid's Challenges</h3>
            <p className="mb-8 text-lg text-center">
              Create a challenge for your kid — they complete, you approve, they get paid.
            </p>
            <div className="space-y-8 max-w-2xl mx-auto">
              {referredAthletes.length === 0 ? (
                <p className="text-gray-600 text-center text-xl">No referred athletes yet — wait for kids to pitch you!</p>
              ) : (
                referredAthletes.map((kid) => (
                  <div key={kid.id} className="border-4 border-black p-8 bg-gray-100">
                    <p className="font-bold text-2xl mb-4 text-center">{kid.full_name || kid.email}</p>
                    <p className="mb-6 text-lg text-center">
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

        {/* Favorite Athletes Tab */}
        {activeTab === 'favorites' && (
          <div className="px-4 text-center py-20">
            <h3 className="text-3xl mb-8 font-bold">Favorite Athletes</h3>
            <p className="text-xl mb-8">
              Quick access to athletes you like — re-fund gigs easily.
            </p>
            <p className="text-gray-600 text-xl">
              No favorites yet — add from clips or kids.
            </p>
          </div>
        )}

        {/* Freedom Scholarships Tab */}
        {activeTab === 'scholarships' && (
          <div className="px-4">
            <h3 className="text-3xl mb-8 font-bold text-center">Freedom Scholarships</h3>
            <p className="text-xl mb-12 text-center max-w-3xl mx-auto">
              Award unrestricted cash to any athlete — paid instantly.<br />
              Real impact. Real hero status.
            </p>

            <div className="max-w-2xl mx-auto space-y-8">
              <Input
                placeholder="Search athlete by name, email, or school"
                value={athleteSearch}
                onChange={(e) => setAthleteSearch(e.target.value)}
                className="text-center text-lg"
              />
              <Button onClick={searchAthletes} className="w-full h-16 text-xl bg-black text-white">
                Search Athletes
              </Button>

              {searchResults.length > 0 && (
                <div className="space-y-4">
                  {searchResults.map((athlete) => (
                    <div key={athlete.id} className="border-4 border-black p-6 bg-gray-100">
                      <p className="text-lg text-center">
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
                    className="mb-6 text-center"
                  />
                  <textarea
                    placeholder="Optional message (e.g., Great season — use for books!)"
                    value={standaloneScholarshipMessage}
                    onChange={(e) => setStandaloneScholarshipMessage(e.target.value)}
                    className="w-full p-4 text-lg border-4 border-black font-mono mb-6 bg-white"
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

        {/* Booster Events Tab */}
        {activeTab === 'booster' && (
          <div className="px-4 text-center py-20">
            <h3 className="text-3xl mb-8 font-bold">Booster Events</h3>
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
          className="w-64 h-14 text-lg border-4 border-black"
        >
          Log Out
        </Button>
      </div>

      {/* Role Switcher */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <div className="bg-white border-4 border-black rounded-full shadow-2xl overflow-hidden w-[150px] h-16 flex items-center">
          <div
            className={`absolute inset-0 w-1/2 bg-black transition-transform duration-300 ease-in-out ${
              currentRole === 'parent' ? 'translate-x-0' : 'translate-x-full'
            }`}
          />
          <button
            onClick={() => router.push('/parent-dashboard')}
            className="relative z-10 flex-1 h-full flex items-center justify-center"
            disabled={currentRole === 'parent'}
          >
            <span
              className={`text-lg font-bold font-mono transition-colors ${
                currentRole === 'parent' ? 'text-white' : 'text-black'
              }`}
            >
              Parent
            </span>
          </button>
          <button
            onClick={() => router.push('/business-dashboard')}
            className="relative z-10 flex-1 h-full flex items-center justify-center"
            disabled={currentRole === 'business'}
          >
            <span
              className={`text-lg font-bold font-mono transition-colors ${
                currentRole === 'business' ? 'text-white' : 'text-black'
              }`}
            >
              Business
            </span>
          </button>
        </div>
        <p className="text-center text-xs font-mono mt-2 text-gray-600">Switch role</p>
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