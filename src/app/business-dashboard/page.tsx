'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { signOut } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { loadStripe } from '@stripe/stripe-js'
import { useStripe, useElements } from '@stripe/react-stripe-js'
import dynamic from 'next/dynamic'

const Elements = dynamic(() => import('@stripe/react-stripe-js').then((mod) => mod.Elements), { ssr: false })
const CardElement = dynamic(() => import('@stripe/react-stripe-js').then((mod) => mod.CardElement), { ssr: false })

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

const businessGigTypes = [
  { title: 'ShoutOut', baseAmount: 50, description: 'Visit a favorite business and make a quick shoutout 15-sec reel about what you like or your favorite order.' },
  { title: 'Youth Clinic', baseAmount: 500, description: 'Run 30–60 min sessions for younger athletes (with teammates).' },
  { title: 'Team Sponsor', baseAmount: 1000, description: 'Business sponsors team meals/gear — money split bually.' },
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
  const [selectedKid, setSelectedKid] = useState<any>(null)
  const [selectedAthlete, setSelectedAthlete] = useState<any>(null)
  const [standaloneScholarshipAmount, setStandaloneScholarshipAmount] = useState('')
  const [standaloneScholarshipMessage, setStandaloneScholarshipMessage] = useState('')
  const [scholarshipLoading, setScholarshipLoading] = useState(false)
  const [editingProfile, setEditingProfile] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
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
        setSelectedOffers(biz.selected_offers || [])

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

          // Load favorites
          const { data: favs } = await supabase
            .from('favorites')
            .select('*, profiles(full_name, email, school)')
            .eq('funder_id', biz.id)
          setFavorites(favs || [])

          // Check for invited athlete
          const invitedId = searchParams.get('invited_by')
          if (invitedId) {
            setInvitedAthleteId(invitedId)

            // Auto-add as favorite if not already
            const { data: existingFav } = await supabase
              .from('favorites')
              .select('id')
              .eq('funder_id', biz.id)
              .eq('athlete_id', invitedId)
              .single()

            if (!existingFav) {
              await supabase
                .from('favorites')
                .insert({ funder_id: biz.id, athlete_id: invitedId })
            }

            // Fetch kid name for quick sponsor banner
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

  const handleQuickSponsor = async () => {
    if (savedMethods.length === 0) {
      setShowCardModal(true)
      return
    }

    // Create pre-funded $50 challenge for invited athlete
    const { error } = await supabase
      .from('offers')
      .insert({
        business_id: business.id,
        type: 'Challenge',
        amount: 50,
        description: 'First challenge from your sponsor — complete and earn $50!',
        target_athlete_id: quickSponsorKid.id,
        status: 'open',
      })

    if (error) {
      alert('Error creating challenge: ' + error.message)
    } else {
      alert(`$50 challenge sent to ${quickSponsorKid.full_name.split(' ')[0]}!`)
      setShowQuickSponsor(false)
    }
  }

  const handleAddCard = async () => {
    if (!stripe || !elements) {
      setPaymentError('Stripe not loaded — please refresh')
      return
    }

    if (!cardReady) {
      setPaymentError('Card field still loading — please wait a second')
      return
    }

    setPaymentError(null)
    setPaymentSuccess(false)
    setPaymentLoading(true)

    const cardElement = elements.getElement('card');
    
    if (!cardElement) {
      setPaymentError('Card element not found — please refresh and try again')
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

    const { error: dbError } = await supabase
      .from('businesses')
      .update({ debit_card_token: paymentMethod.id })
      .eq('id', business.id)

    if (dbError) {
      setPaymentError('Failed to save card — try again')
      setPaymentLoading(false)
      return
    }

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
    if (savedMethods.length === 0) {
      alert('Add a card first')
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

  const approveClip = async (clip: any) => {
    const { error } = await supabase
      .from('clips')
      .update({ status: 'approved' })
      .eq('id', clip.id)

    if (error) {
      alert('Error approving clip')
      return
    }

    alert('Clip approved — payment sent to athlete!')
    setPendingClips(pendingClips.filter(c => c.id !== clip.id))
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

  const toggleOffer = async (title: string) => {
    const newOffers = selectedOffers.includes(title)
      ? selectedOffers.filter(o => o !== title)
      : [...selectedOffers, title]

    const { error } = await supabase
      .from('businesses')
      .update({ selected_offers: newOffers })
      .eq('id', business.id)

    if (!error) {
      setSelectedOffers(newOffers)
    }
  }

  const shareGig = (gigTitle: string) => {
    const shareText = `Hey athletes! I'm offering a $${businessGigTypes.find(g => g.title === gigTitle)?.baseAmount}+ ${gigTitle} gig on LocalHustle. Complete it and get paid instantly!`
    const shareUrl = 'https://app.localhustle.org/athlete-dashboard'

    const shareData = {
      title: 'LocalHustle Gig Opportunity',
      text: shareText,
      url: shareUrl,
    }

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      navigator.share(shareData).catch(() => {
        navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`)
        alert('Gig link copied!')
      })
    } else {
      navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`)
      alert('Gig link copied!')
    }
  }

  return (
    <div className="container py-8">
      <p className="text-center mb-12 text-xl font-mono">Welcome, {business?.name || 'Business Owner'}!</p>

      {/* Quick Sponsor Banner — When Invited */}
      {showQuickSponsor && quickSponsorKid && (
        <div className="max-w-3xl mx-auto mb-16 p-12 bg-green-100 border-4 border-green-600 rounded-lg">
          <h2 className="text-4xl font-bold mb-8 text-center font-mono">
            Quick Sponsor {quickSponsorKid.full_name.split(' ')[0]}'s First Gig!
          </h2>
          <p className="text-xl mb-12 text-center font-mono">
            Fund a $50 challenge — they complete it, you approve, they get paid instantly.<br />
            Help them get started today.
          </p>
          <Button
            onClick={handleQuickSponsor}
            className="w-full max-w-md h-20 text-3xl bg-green-600 text-white font-bold font-mono"
          >
            {savedMethods.length === 0 ? 'Add Card & Fund $50' : 'Fund $50 Challenge Now'}
          </Button>
        </div>
      )}

      {/* Card Modal */}
      {showCardModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-16 border-4 border-black rounded-lg max-w-md w-full">
            <h3 className="text-3xl font-bold mb-8 text-center font-mono">Add Card to Sponsor</h3>
            
              <div className="space-y-12">
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
                        },
                      },
                    }}
                  />
                </div>
                {paymentError && <p className="text-red-600 text-center text-xl">{paymentError}</p>}
                <Button
                  onClick={handleAddCard}
                  disabled={paymentLoading || !cardReady}
                  className="w-full h-20 text-3xl bg-black text-white font-bold font-mono"
                >
                  {paymentLoading ? 'Saving...' : 'Save Card & Fund $50'}
                </Button>
                <Button
                  onClick={() => setShowCardModal(false)}
                  variant="outline"
                  className="w-full h-16 text-xl border-4 border-black font-mono"
                >
                  Cancel
                </Button>
              </div>
            
          </div>
        </div>
      )}

      <div className="bg-black text-white p-8 mb-12">
        <h1 className="text-3xl font-bold text-center">
          Your Business Admin Console
        </h1>
      </div>

      <div className="bg-black text-white p-8 mb-12">
        <p className="text-lg leading-relaxed text-center">
          The easiest way to get new customers with authentic content from local athletes.<br />
          Post gigs, review clips — only approve what you love.<br />
          Become the hometown hero with Freedom Scholarships.
        </p>
      </div>

      {/* Sticky Tabs — Core + More Dropdown */}
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
          <div className="relative">
            <Button
              variant="outline"
              className="px-6 py-4 text-lg font-bold min-w-[100px] border-4 border-black"
              onClick={() => setShowDropdown(!showDropdown)}
            >
              More
            </Button>
            {showDropdown && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-white border-4 border-black shadow-lg rounded z-50">
                <Button onClick={() => { setActiveTab('clips'); setShowDropdown(false) }} className="w-full text-left px-4 py-3 hover:bg-gray-100 border-b-2 border-gray-300">
                  Clips ({pendingClips.length})
                </Button>
                <Button onClick={() => { setActiveTab('kids'); setShowDropdown(false) }} className="w-full text-left px-4 py-3 hover:bg-gray-100 border-b-2 border-gray-300">
                  My Kids ({referredAthletes.length})
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
            <h3 className="text-4xl font-bold mb-12 text-center font-mono">Your Profile</h3>
            {business?.name && business?.phone ? (
              <div className="max-w-2xl mx-auto p-16 bg-gray-100 border-4 border-black">
                <div className="flex items-center justify-between mb-8">
                  <p className="text-2xl font-mono">Business Name: {business.name}</p>
                  <button onClick={() => setEditingProfile(true)} className="text-2xl text-gray-600 hover:text-black font-mono">
                    ✏️ Edit
                  </button>
                </div>
                <p className="text-2xl font-mono">Contact Phone: {business.phone}</p>
              </div>
            ) : (
              <div className="max-w-2xl mx-auto p-16 bg-yellow-100 border-4 border-yellow-600">
                <h3 className="text-4xl font-bold mb-12 text-center font-mono">Complete Your Business Profile</h3>
                <p className="text-xl mb-16 text-center font-mono">
                  Add your business name and contact info to post gigs.
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
                        setBusiness({ ...business })
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
                <h3 className="text-3xl font-bold mb-8 text-center font-mono">Edit Profile</h3>
                <div className="space-y-8">
                  <Input
                    value={business?.name || ''}
                    onChange={(e) => setBusiness({ ...business, name: e.target.value })}
                    placeholder="Business Name"
                    className="h-16 text-xl font-mono"
                  />
                  <Input
                    value={business?.phone || ''}
                    onChange={(e) => setBusiness({ ...business, phone: e.target.value })}
                    placeholder="Contact Phone"
                    className="h-16 text-xl font-mono"
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
            {/* Card Entry — Spacious Modal-Style */}
            <div className="max-w-3xl mx-auto py-20">
              <div className="bg-white p-20 border-4 border-black rounded-lg shadow-2xl">
                <h3 className="text-4xl font-bold mb-12 text-center font-mono">Add Card for Funding</h3>
                <p className="text-xl mb-20 text-center text-gray-600 font-mono">
                  Secure by Stripe — your card details are safe and encrypted.
                </p>
               
                  <div className="space-y-20">
                    <div className="bg-gray-50 p-12 border-2 border-gray-400 rounded-lg">
                      <CardElement
                        onReady={() => setCardReady(true)}
                        options={{
                          style: {
                            base: {
                              fontSize: '22px',
                              color: '#000',
                              fontFamily: 'Courier New, monospace',
                              '::placeholder': { color: '#666' },
                            },
                          },
                        }}
                      />
                    </div>
                    {paymentError && <p className="text-red-600 text-center text-2xl font-mono">{paymentError}</p>}
                    {paymentSuccess && <p className="text-green-600 text-center text-2xl font-mono">Card saved!</p>}
                    <Button
                      onClick={handleAddCard}
                      disabled={paymentLoading || !cardReady}
                      className="w-full h-20 text-3xl bg-black text-white font-bold font-mono"
                    >
                      {paymentLoading ? 'Saving...' : 'Save Card'}
                    </Button>
                  </div>
                
              </div>
            </div>

            {/* Saved Cards */}
            {savedMethods.length > 0 && (
              <div className="max-w-2xl mx-auto">
                <h4 className="text-2xl font-bold mb-8 text-center font-mono">Saved Cards</h4>
                <div className="space-y-6">
                  {savedMethods.map((method) => (
                    <div key={method.id} className="bg-gray-100 p-8 border-4 border-black">
                      <p className="text-xl font-mono">
                        {method.brand.toUpperCase()} •••• {method.last4}<br />
                        Expires {method.exp_month}/{method.exp_year}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add Funds */}
            <div className="max-w-3xl mx-auto">
              <h3 className="text-4xl font-bold mb-12 text-center font-mono">Add Funds to Wallet</h3>
              <p className="text-xl mb-12 text-center font-mono">
                Current balance: ${business?.wallet_balance?.toFixed(2) || '0.00'}
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                <Button onClick={() => handleAddFunds(100)} className="h-20 text-2xl bg-black text-white font-mono">
                  + $100
                </Button>
                <Button onClick={() => handleAddFunds(500)} className="h-20 text-2xl bg-black text-white font-mono">
                  + $500
                </Button>
                <Button onClick={() => handleAddFunds(1000)} className="h-20 text-2xl bg-black text-white font-mono">
                  + $1000
                </Button>
                <Button
                  onClick={() => {
                    const amt = prompt('Custom amount:')
                    if (amt && !isNaN(Number(amt))) handleAddFunds(Number(amt))
                  }}
                  className="h-20 text-2xl bg-green-400 text-black font-mono"
                >
                  Custom
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Gigs Tab — Business Selects Offers */}
        {activeTab === 'gigs' && (
          <div className="px-4">
            <h3 className="text-4xl font-bold mb-12 text-center font-mono">My Active Offers</h3>
            <p className="text-xl mb-16 text-center font-mono max-w-3xl mx-auto">
              Choose the gigs you want to offer. They stay open as long as your wallet is funded.
            </p>

            <div className="max-w-3xl mx-auto space-y-8">
              {businessGigTypes.map((gig) => (
                <div
                  key={gig.title}
                  className="border-4 border-black p-8 bg-white hover:bg-gray-50 transition-all"
                  style={{
                    backgroundColor: selectedOffers.includes(gig.title) ? '#d4edda' : '#ffffff',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-3xl font-bold mb-4 font-mono">{gig.title}</h4>
                      <p className="text-xl mb-4 text-green-600 font-mono">${gig.baseAmount}+</p>
                      <p className="text-lg font-mono">{gig.description}</p>
                    </div>
                    <Button
                      onClick={() => toggleOffer(gig.title)}
                      className="h-16 px-8 text-xl font-mono"
                      style={{
                        backgroundColor: selectedOffers.includes(gig.title) ? '#000000' : '#ffffff',
                        color: selectedOffers.includes(gig.title) ? '#ffffff' : '#000000',
                        border: '4px solid black',
                      }}
                    >
                      {selectedOffers.includes(gig.title) ? 'Active' : 'Offer This Gig'}
                    </Button>
                  </div>
                  {selectedOffers.includes(gig.title) && (
                    <Button
                      onClick={() => shareGig(gig.title)}
                      className="mt-8 w-full h-16 text-xl bg-black text-white font-mono"
                    >
                      Share This Gig
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Clips Tab */}
        {activeTab === 'clips' && (
          <div className="px-4">
            <h3 className="text-3xl mb-8 font-bold text-center font-mono">Pending Clips to Review</h3>
            {pendingClips.length === 0 ? (
              <p className="text-xl text-center text-gray-600 font-mono mb-12">No pending clips — post offers to get started!</p>
            ) : (
              <div className="space-y-16">
                {pendingClips.map((clip) => (
                  <div key={clip.id} className="border-4 border-black p-8 bg-white max-w-2xl mx-auto">
                    <p className="font-bold mb-4 text-left font-mono">From: {clip.profiles.full_name}</p>
                    <p className="mb-6 text-left font-mono">Offer: {clip.offers.type} — ${clip.offers.amount}</p>
                    <video controls className="w-full mb-8 rounded">
                      <source src={clip.video_url} type="video/mp4" />
                    </video>
                    <p className="text-sm text-gray-600 mb-4 font-mono">
                      Prove it with timelapse or witness video — easy!
                    </p>
                    <Button
                      onClick={() => approveClip(clip)}
                      className="w-full h-16 text-xl bg-black text-white font-mono"
                    >
                      Approve & Pay
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* My Kids Tab */}
        {activeTab === 'kids' && (
          <div className="px-4">
            <h3 className="text-3xl mb-8 font-bold text-center font-mono">My Kids</h3>
            <div className="space-y-12 max-w-3xl mx-auto">
              {referredAthletes.length === 0 ? (
                <p className="text-xl text-center text-gray-600 font-mono">No kids linked yet — wait for invite.</p>
              ) : (
                referredAthletes.map((kid) => (
                  <div key={kid.id} className="bg-gray-100 p-8 border-4 border-black">
                    <div className="flex items-center gap-8 mb-8">
                      <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-black">
                        <img src={kid.profile_pic || '/default-avatar.png'} alt={kid.full_name} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <h4 className="text-2xl font-bold font-mono">{kid.full_name}</h4>
                        <p className="text-xl font-mono">{kid.school}</p>
                        <p className="text-lg font-mono">Gigs completed: {kid.gig_count}</p>
                      </div>
                    </div>
                    <Button 
                      onClick={() => setSelectedKid(kid)}
                      className="w-full h-16 text-xl bg-black text-white font-mono"
                    >
                      View Progress
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Favorites Tab */}
        {activeTab === 'favorites' && (
          <div className="px-4">
            <h3 className="text-3xl mb-8 font-bold text-center font-mono">Favorite Athletes</h3>
            <p className="text-xl mb-12 text-center font-mono">
              Quickly send gigs to athletes you like working with.
            </p>
            {favorites.length === 0 ? (
              <p className="text-xl text-center text-gray-600 font-mono">
                No favorites yet — they’ll appear here when athletes invite you or you add them.
              </p>
            ) : (
              <div className="space-y-12 max-w-3xl mx-auto">
                {favorites.map((fav) => (
                  <div key={fav.athlete_id} className="bg-gray-100 p-8 border-4 border-black">
                    <div className="flex items-center gap-8 mb-8">
                      <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-black">
                        <img src={fav.profiles.profile_pic || '/default-avatar.png'} alt={fav.profiles.full_name} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <h4 className="text-2xl font-bold font-mono">{fav.profiles.full_name}</h4>
                        <p className="text-xl font-mono">{fav.profiles.school}</p>
                      </div>
                    </div>
                    <Button
                      onClick={() => {
                        // Quick gig send to favorite (placeholder)
                        alert(`Sending gig to ${fav.profiles.full_name} coming soon!`)
                      }}
                      className="w-full h-16 text-xl bg-black text-white font-mono"
                    >
                      Send Gig to {fav.profiles.full_name.split(' ')[0]}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Scholarships Tab */}
        {activeTab === 'scholarships' && (
          <div className="px-4">
            <h3 className="text-3xl mb-8 font-bold text-center font-mono">Freedom Scholarships</h3>
            <p className="text-xl mb-12 text-center font-mono max-w-3xl mx-auto">
              Award unrestricted cash to any athlete — paid instantly.<br />
              Real impact. Real hero status.
            </p>

            <div className="max-w-2xl mx-auto space-y-8">
              <Input
                placeholder="Search athlete by name, email, or school"
                value={athleteSearch}
                onChange={(e) => setAthleteSearch(e.target.value)}
                className="text-center text-lg font-mono"
              />
              <Button onClick={searchAthletes} className="w-full h-16 text-xl bg-black text-white font-mono">
                Search Athletes
              </Button>

              {searchResults.length > 0 && (
                <div className="space-y-4">
                  {searchResults.map((athlete) => (
                    <div key={athlete.id} className="border-4 border-black p-6 bg-gray-100">
                      <p className="text-lg text-center font-mono">
                        {athlete.full_name || athlete.email} — {athlete.school}
                      </p>
                      <Button
                        onClick={() => setSelectedAthlete(athlete)}
                        className="mt-4 w-full h-14 text-lg bg-green-600 text-white font-mono"
                      >
                        Select This Athlete
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {selectedAthlete && (
                <div className="border-4 border-green-600 p-8 bg-green-100">
                  <p className="text-xl mb-4 text-center font-mono">
                    Selected: {selectedAthlete.full_name || selectedAthlete.email} ({selectedAthlete.school})
                  </p>
                  <Input
                    placeholder="Scholarship amount (e.g., 500)"
                    value={standaloneScholarshipAmount}
                    onChange={(e) => setStandaloneScholarshipAmount(e.target.value)}
                    className="mb-6 text-center font-mono"
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
                    className="w-full h-16 text-xl bg-green-600 text-white font-bold font-mono"
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

            {/* Local Hustle Leaders — Featured Section Above Log Out */}
      <div className="max-w-6xl mx-auto mb-20 px-4">
        <h2 className="text-4xl font-bold text-center mb-16 font-mono">Local Hustle Leaders</h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Featured Athletes */}
          <div>
            <h3 className="text-3xl font-bold mb-8 text-center font-mono">Top Athletes</h3>
            {featuredAthletes.length === 0 ? (
              <p className="text-xl text-center text-gray-600 font-mono">
                No active athletes yet — be the first to shine!
              </p>
            ) : (
              <div className="space-y-8">
                {featuredAthletes.map((athlete, index) => (
                  <div key={athlete.id} className="bg-white p-8 border-4 border-black rounded-lg flex items-center gap-8 shadow-xl">
                    <div className="text-5xl font-bold text-gray-300 w-16 text-right">
                      #{index + 1}
                    </div>
                    <img 
                      src={athlete.profile_pic || '/default-avatar.png'} 
                      alt={athlete.full_name}
                      className="w-24 h-24 rounded-full object-cover border-4 border-black"
                    />
                    <div className="flex-1">
                      <h4 className="text-2xl font-bold font-mono">{athlete.full_name}</h4>
                      <p className="text-lg text-gray-600 font-mono">{athlete.school}</p>
                      <p className="text-2xl font-bold text-green-600 mt-2">
                        {athlete.gig_count} Gigs Completed
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Featured Sponsors */}
          <div>
            <h3 className="text-3xl font-bold mb-8 text-center font-mono">Top Sponsors</h3>
            {featuredBusinesses.length === 0 ? (
              <p className="text-xl text-center text-gray-600 font-mono">
                No sponsors yet — be the first to support!
              </p>
            ) : (
              <div className="space-y-8">
                {featuredBusinesses.map((business, index) => (
                  <div key={business.id} className="bg-gray-100 p-8 border-4 border-black rounded-lg flex items-center gap-8 shadow-xl">
                    <div className="text-5xl font-bold text-gray-300 w-16 text-right">
                      #{index + 1}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-2xl font-bold font-mono">{business.name}</h4>
                      <p className="text-lg text-gray-600 font-mono mt-2">
                        {business.description || 'Supporting local athletes'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Log Out */}
      <div className="text-center mt-32 pb-32">
        <Button onClick={async () => {
          await signOut()
          router.push('/')
          alert('Logged out successfully')
        }} variant="outline" className="w-64 h-14 text-lg border-4 border-black font-mono">
          Log Out
        </Button>
      </div>

      {/* Role Switcher — Fixed Bottom Center */}
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