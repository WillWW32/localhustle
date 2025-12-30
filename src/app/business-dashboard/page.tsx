'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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

export default function BusinessDashboard() {
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
  const [activeTab, setActiveTab] = useState<'wallet' | 'gigs' | 'clips' | 'kids' | 'favorites' | 'payment-methods' | 'scholarships' | 'booster'>('wallet')
  const [athleteSearch, setAthleteSearch] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [selectedAthlete, setSelectedAthlete] = useState<any>(null)
  const [standaloneScholarshipAmount, setStandaloneScholarshipAmount] = useState('')
  const [standaloneScholarshipMessage, setStandaloneScholarshipMessage] = useState('')
  const [scholarshipLoading, setScholarshipLoading] = useState(false)
  const router = useRouter()
  const stripe = useStripe()
  const elements = useElements()

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

        const { data: clips } = await supabase
          .from('clips')
          .select('*, offers(*), profiles(email, parent_email)')
          .eq('status', 'pending')
          .in('offer_id', (await supabase.from('offers').select('id').eq('business_id', biz.id)).data?.map(o => o.id) || [])
        setPendingClips(clips || [])

        // Fetch saved payment methods
        if (biz?.id) {
          const response = await fetch('/api/list-payment-methods', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ business_id: biz.id }),
          })
          const data = await response.json()
          setSavedMethods(data.methods || [])
        }
      } else {
        router.replace('/business-onboard')
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
    const response = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, business_id: business.id }),
    })
    const { id } = await response.json()
    const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
    if (!stripe) {
      alert('Stripe failed to load')
      return
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

  if (!business) return <p className="container text-center py-32">Loading...</p>

  return (
    <div className="container py-8">
      <p className="text-center mb-12 text-xl font-mono">Welcome, {business.name}</p>

      <div className="bg-black text-white p-8 mb-12">
        <h1 className="text-3xl font-bold">
          Your Business Admin Console
        </h1>
      </div>

      <div className="bg-black text-white p-8 mb-12">
        <p className="text-lg leading-relaxed">
          Post gigs to get authentic content. Review clips — only approve what you love. Become the hometown hero.
        </p>
      </div>

      <div className="max-w-4xl mx-auto space-y-16 font-mono text-center text-lg">
        {/* Business Tabs */}
        <div className="flex justify-center gap-4 flex-wrap mb-12">
          <Button
            onClick={() => setActiveTab('wallet')}
            variant={activeTab === 'wallet' ? 'default' : 'outline'}
            className="px-8 py-4 text-xl"
          >
            Wallet
          </Button>
          <Button
            onClick={() => setActiveTab('gigs')}
            variant={activeTab === 'gigs' ? 'default' : 'outline'}
            className="px-8 py-4 text-xl"
          >
            Create Gigs
          </Button>
          <Button
            onClick={() => setActiveTab('clips')}
            variant={activeTab === 'clips' ? 'default' : 'outline'}
            className="px-8 py-4 text-xl"
          >
            Pending Clips
          </Button>
          <Button
            onClick={() => setActiveTab('kids')}
            variant={activeTab === 'kids' ? 'default' : 'outline'}
            className="px-8 py-4 text-xl"
          >
            My Kid's Challenges
          </Button>
          <Button
            onClick={() => setActiveTab('favorites')}
            variant={activeTab === 'favorites' ? 'default' : 'outline'}
            className="px-8 py-4 text-xl"
          >
            Favorite Athletes
          </Button>
          <Button
            onClick={() => setActiveTab('payment-methods')}
            variant={activeTab === 'payment-methods' ? 'default' : 'outline'}
            className="px-8 py-4 text-xl"
          >
            Payment Methods
          </Button>
          <Button
            onClick={() => setActiveTab('scholarships')}
            variant={activeTab === 'scholarships' ? 'default' : 'outline'}
            className="px-8 py-4 text-xl"
          >
            Freedom Scholarships
          </Button>
          <Button
            onClick={() => setActiveTab('booster')}
            variant={activeTab === 'booster' ? 'default' : 'outline'}
            className="px-8 py-4 text-xl"
          >
            Booster Events
          </Button>
        </div>

        {/* Wallet Tab */}
        {activeTab === 'wallet' && (
          <div>
            <h2 className="text-4xl font-bold mb-8">Wallet</h2>
            <p className="text-3xl mb-12">
              Balance: ${business?.wallet_balance?.toFixed(2) || '0.00'}
            </p>

            {/* Auto-Top-Up */}
            <div className="max-w-sm mx-auto mb-16 p-8 bg-gray-100 border-4 border-black">
              <label className="flex flex-col items-center gap-4 cursor-pointer">
                <span className="text-2xl font-bold">Auto-Top-Up</span>
                <input
                  type="checkbox"
                  checked={business?.auto_top_up ?? false}
                  onChange={async (e) => {
                    const enabled = e.target.checked
                    await supabase
                      .from('businesses')
                      .update({ auto_top_up: enabled })
                      .eq('id', business.id)
                    setBusiness({ ...business, auto_top_up: enabled })
                  }}
                  className="w-8 h-8"
                />
              </label>
              <p className="text-lg mt-4">
                When balance &lt; $100, add $500 automatically
              </p>
            </div>

            {/* Add Funds */}
            <div className="max-w-2xl mx-auto space-y-12">
              <div>
                <h3 className="text-2xl font-bold mb-8 text-center">Add Funds</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <Button onClick={() => handleAddFunds(100)} className="h-16 text-xl bg-black text-white">
                    + $100
                  </Button>
                  <Button onClick={() => handleAddFunds(500)} className="h-16 text-xl bg-black text-white">
                    + $500
                  </Button>
                  <Button onClick={() => handleAddFunds(1000)} className="h-16 text-xl bg-black text-white">
                    + $1000
                  </Button>
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

              {/* Card Entry */}
              <div className="bg-gray-100 p-12 border-4 border-black">
                <h4 className="text-2xl font-bold mb-8 text-center">
                  Add Card for Top-Ups
                </h4>
                <p className="text-lg mb-8 text-center">
                  Use this card to fund gigs and scholarships.
                </p>
                <Elements stripe={stripePromise}>
                  <div className="space-y-8">
                    <CardElement 
                      options={{
                        style: {
                          base: {
                            fontSize: '20px',
                            color: '#000',
                            fontFamily: 'Courier New, monospace',
                            '::placeholder': { color: '#666' },
                          },
                        },
                      }}
                    />
                    <Button onClick={handleAddCard} className="w-full h-16 text-xl bg-black text-white">
                      Save Card
                    </Button>
                  </div>
                </Elements>
              </div>

              {/* Saved Cards */}
              {savedMethods.length > 0 && (
                <div>
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
            </div>
          </div>
        )}

        {/* Create Gigs Tab */}
        {activeTab === 'gigs' && (
          <div>
            <h2 className="text-4xl font-bold mb-12">Create a Gig</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-5xl mx-auto">
              {businessGigTypes.map((gig) => (
                <div key={gig.title}>
                  <button
                    onClick={() => handleGigSelect(gig)}
                    className="w-full h-80 bg-black text-white p-8 flex flex-col items-center justify-center hover:bg-gray-800 transition"
                  >
                    <span className="text-3xl mb-4">{gig.title}</span>
                    <span className="text-2xl mb-4">${gig.baseAmount}+</span>
                    <span className="text-lg">{gig.description}</span>
                  </button>

                  {selectedGig?.title === gig.title && (
                    <div className="mt-8 bg-gray-100 p-8 border-4 border-black max-w-2xl mx-auto">
                      <h3 className="text-2xl mb-6 font-bold">Customize Your {gig.title}</h3>
                      <div className="space-y-6">
                        <div>
                          <label className="block text-lg mb-2">Number of Athletes</label>
                          <select
                            value={numAthletes}
                            onChange={(e) => handleAthletesChange(Number(e.target.value))}
                            className="w-full p-4 text-lg border-4 border-black"
                          >
                            {[1,2,3,4,5,6,7,8,9,10].map(n => (
                              <option key={n} value={n}>{n} athlete{n > 1 ? 's' : ''}</option>
                            ))}
                          </select>
                          <p className="text-sm mt-2">+ $75 per additional athlete</p>
                        </div>

                        <div>
                          <label className="block text-lg mb-2">Date</label>
                          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                        </div>

                        <div>
                          <label className="block text-lg mb-2">Location</label>
                          <Input placeholder="e.g., Bridge Pizza" value={location} onChange={(e) => setLocation(e.target.value)} />
                        </div>

                        <div>
                          <label className="block text-lg mb-2">Your Phone (for athlete contact)</label>
                          <Input placeholder="(555) 123-4567" value={businessPhone} onChange={(e) => setBusinessPhone(e.target.value)} />
                        </div>

                        <div className="flex justify-center">
                          <label className="flex items-center gap-4 text-xl">
                            <input 
                              type="checkbox" 
                              checked={isRecurring} 
                              onChange={(e) => setIsRecurring(e.target.checked)}
                              className="w-6 h-6"
                            />
                            Make this recurring monthly
                          </label>
                        </div>

                        <div>
                          <label className="block text-lg mb-2">Offer Amount</label>
                          <Input value={amount} onChange={(e) => setAmount(e.target.value)} />
                        </div>

                        <div>
                          <label className="block text-lg mb-2">Freedom Scholarship (Optional)</label>
                          <Input value={scholarshipAmount} onChange={(e) => setScholarshipAmount(e.target.value)} />
                        </div>

                        <div>
                          <label className="block text-lg mb-2">Custom Details</label>
                          <textarea 
                            value={customDetails} 
                            onChange={(e) => setCustomDetails(e.target.value)} 
                            className="w-full h-40 p-4 text-lg border-4 border-black font-mono"
                          />
                        </div>

                        <Button onClick={handlePost} className="w-full h-20 text-2xl bg-green-400 text-black">
                          Fund & Post Offer
                        </Button>
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
          <div>
            <h3 className="text-2xl mb-8 font-bold">Pending Clips to Review</h3>
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

        {/* My Kid's Challenges Tab */}
        {activeTab === 'kids' && (
          <div>
            <h3 className="text-3xl mb-8 font-bold">My Kid's Challenges</h3>
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

        {/* Favorite Athletes Tab */}
        {activeTab === 'favorites' && (
          <div>
            <h3 className="text-3xl mb-8 font-bold">Favorite Athletes</h3>
            <p className="mb-8 text-lg">
              Quick access to athletes you like — re-fund gigs easily.
            </p>
            <p className="text-gray-600 mb-12">
              No favorites yet — add from clips or kids.
            </p>
          </div>
        )}

        {/* Payment Methods Tab */}
        {activeTab === 'payment-methods' && (
          <Elements stripe={stripePromise}>
            <div>
              <h3 className="text-3xl mb-8 font-bold">Payment Methods</h3>
              <p className="text-xl mb-12">
                Saved cards for wallet top-ups and auto-top-up.<br />
                Add or manage cards below to fund gigs and scholarships.
              </p>

              {/* Saved Cards */}
              {savedMethods.length === 0 ? (
                <p className="text-gray-600 mb-12 text-xl">
                  No saved cards yet.
                </p>
              ) : (
                <div className="space-y-8 mb-16 max-w-2xl mx-auto">
                  {savedMethods.map((method) => (
                    <div key={method.id} className="border-4 border-black p-8 bg-gray-100">
                      <p className="text-xl">
                        {method.brand.toUpperCase()} •••• {method.last4}<br />
                        Expires {method.exp_month}/{method.exp_year}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Add New Card */}
              <div className="max-w-2xl mx-auto">
                <div className="bg-gray-100 p-12 border-4 border-black mb-12">
                  <h4 className="text-2xl font-bold mb-6 text-center">
                    Add New Card
                  </h4>
                  <CardElement 
                    options={{
                      style: {
                        base: {
                          fontSize: '20px',
                          color: '#000',
                          fontFamily: 'Courier New, monospace',
                          '::placeholder': { color: '#666' },
                        },
                      },
                    }}
                  />
                </div>

                {paymentError && <p className="text-red-600 text-center mb-8 text-xl">{paymentError}</p>}
                {paymentSuccess && <p className="text-green-600 text-center mb-8 text-xl">Card added!</p>}

                <Button 
                  onClick={handleAddCard}
                  disabled={paymentLoading}
                  className="w-full h-20 text-2xl bg-black text-white font-bold"
                >
                  {paymentLoading ? 'Adding...' : 'Save Card'}
                </Button>
              </div>
            </div>
          </Elements>
        )}

        {/* Freedom Scholarships Tab */}
        {activeTab === 'scholarships' && (
          <div>
            <h3 className="text-3xl mb-8 font-bold">Freedom Scholarships</h3>
            <p className="text-xl mb-12 max-w-3xl mx-auto">
              Award unrestricted cash to any athlete — paid instantly.<br />
              Real impact. Real hero status.
            </p>

            <Button 
              onClick={() => router.push('/freedom-scholarship')}
              className="w-full max-w-md h-20 text-2xl bg-purple-600 text-white font-bold"
            >
              Create Freedom Scholarship
            </Button>

            <p className="text-lg mt-12 text-gray-600">
              Search athletes, set amount, add message — posted for them to accept.
            </p>
          </div>
        )}

        {/* Booster Events Tab */}
        {activeTab === 'booster' && (
          <div>
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

        {/* Log Out */}
        <div className="text-center mt-32">
          <Button onClick={async () => {
            await signOut()
            router.push('/')
            alert('Logged out successfully')
          }} variant="outline" className="w-64 h-14 text-lg border-4 border-black">
            Log Out
          </Button>
        </div>
      </div>
    </div>
  )
}