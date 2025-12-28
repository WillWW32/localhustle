'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { signOut } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { loadStripe } from '@stripe/stripe-js'
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

const businessGigTypes = [
  { title: 'ShoutOut', baseAmount: 50, description: 'Visit a favorite business and make a quick shoutout 15-sec reel about what you like or your favorite order.' },
  { title: 'Youth Clinic', baseAmount: 500, description: 'Run 30–60 min sessions for younger athletes (with teammates).' },
  { title: 'Cameo', baseAmount: 50, description: 'Custom 15-Sec Video for Younger Athletes (birthdays, pre-game pep talks).' },
  { title: 'Player Training', baseAmount: 100, description: 'Varsity athlete 40-minute training with young player.' },
  { title: 'Challenge', baseAmount: 75, description: 'Fun competitions — HORSE, PIG, free throws, accuracy toss. Base pay for clip, bonus if you win.' },
  { title: 'Custom Gig', baseAmount: 200, description: 'Create a gig and offer it.' },
]

export default function ParentDashboard() {
  const [parent, setParent] = useState<any>(null)
  const [business, setBusiness] = useState<any>(null)
  const [kid, setKid] = useState<any>(null)
  const [completedGigs, setCompletedGigs] = useState(0)
  const [walletBalance, setWalletBalance] = useState(0)
  const [savedMethods, setSavedMethods] = useState<any[]>([])
  const [selectedGig, setSelectedGig] = useState<any>(null)
  const [numAthletes, setNumAthletes] = useState(1)
  const [customDetails, setCustomDetails] = useState('')
  const [amount, setAmount] = useState('')
  const [scholarshipAmount, setScholarshipAmount] = useState('')
  const [scholarshipMessage, setScholarshipMessage] = useState('')
  const [activeTab, setActiveTab] = useState<'wallet' | 'my-kid' | 'friends' | 'scholarships' | 'payment-methods'>('my-kid')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const stripe = useStripe()
  const elements = useElements()

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

      if (prof) {
        setParent(prof)
      }

      // Fetch business record (wallet, etc.)
      const { data: biz } = await supabase
        .from('businesses')
        .select('*')
        .eq('owner_id', user.id)
        .single()

      if (biz) {
        setBusiness(biz)
        setWalletBalance(biz.wallet_balance || 0)
      }

      // Fetch kid from query param or referred
      const kidId = searchParams.get('kid_id')
      if (kidId) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', kidId)
          .single()
        if (data) {
          setKid(data)
          // Count completed gigs
          const { count } = await supabase
            .from('clips')
            .select('id', { count: 'exact' })
            .eq('athlete_id', kidId)
            .eq('status', 'approved')
          setCompletedGigs(count || 0)
        }
      }
    }

    fetchData()
  }, [router, searchParams])

  const handleAddFunds = async (amount: number) => {
    const response = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, business_id: business.id }),
    })
    const { id } = await response.json()
    const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
    if (!stripe) return

    const { error } = await stripe.redirectToCheckout({ sessionId: id })
    if (error) alert(error.message)
  }

  const handleFundChallenge = async () => {
  if (!kid || !amount || parseFloat(amount) <= 0) {
    alert('Please enter a valid amount')
    return
  }

  setLoading(true)

  const response = await fetch('/api/parent-fund-challenge', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      kid_id: kid.id,
      amount: parseFloat(amount),
      description: customDetails || 'Complete challenge for payout',
      parent_email: parent.email,
    }),
  })

  const data = await response.json()

  if (data.error) {
    alert('Error: ' + data.error)
    setLoading(false)
    return
  }

  if (data.sessionId) {
    const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
    if (!stripe) {
      alert('Stripe failed to load')
      setLoading(false)
      return
    }

    const { error } = await stripe.redirectToCheckout({ sessionId: data.sessionId })
    if (error) {
      alert(error.message)
    }
  }

  setLoading(false)
}
    const data = await response.json()
    if (data.error) alert(data.error)
    else alert(`${kid.full_name}'s challenge funded!`)
  }

  const handleAwardScholarship = async () => {
    if (!kid || !scholarshipAmount || parseFloat(scholarshipAmount) <= 0) return

    const response = await fetch('/api/payout', {
      method: 'POST',
      body: JSON.stringify({
        athlete_id: kid.id,
        amount: parseFloat(scholarshipAmount),
        type: 'freedom_scholarship',
        message: scholarshipMessage,
      }),
    })

    const data = await response.json()
    if (data.error) alert(data.error)
    else alert(`Freedom Scholarship awarded to ${kid.full_name}!`)
  }

  if (!parent || !kid) return <p className="text-center py-32">Loading...</p>

  return (
    <div className="container py-8">
      <p className="text-center mb-12 text-xl font-mono">Welcome, Parent of {kid.full_name}</p>

      <div className="bg-black text-white p-8 mb-12">
        <h1 className="text-3xl font-bold">Your Parent Sponsor Dashboard</h1>
      </div>

      {/* Tabs */}
      <div className="flex justify-center gap-4 flex-wrap mb-12">
        <Button onClick={() => setActiveTab('my-kid')} variant={activeTab === 'my-kid' ? 'default' : 'outline'} className="px-8 py-4 text-xl">
          My Kid
        </Button>
        <Button onClick={() => setActiveTab('friends')} variant={activeTab === 'friends' ? 'default' : 'outline'} className="px-8 py-4 text-xl">
          Fund Friends
        </Button>
        <Button onClick={() => setActiveTab('scholarships')} variant={activeTab === 'scholarships' ? 'default' : 'outline'} className="px-8 py-4 text-xl">
          Scholarships
        </Button>
        <Button onClick={() => setActiveTab('wallet')} variant={activeTab === 'wallet' ? 'default' : 'outline'} className="px-8 py-4 text-xl">
          Wallet
        </Button>
        <Button onClick={() => setActiveTab('payment-methods')} variant={activeTab === 'payment-methods' ? 'default' : 'outline'} className="px-8 py-4 text-xl">
          Payment Methods
        </Button>
      </div>

      {/* My Kid Tab */}
      {activeTab === 'my-kid' && (
        <div>
          {/* Progress Meter */}
          <div className="bg-gray-100 p-12 border-4 border-black mb-16">
            <h2 className="text-3xl font-bold mb-8 text-center">
              {kid.full_name}'s Path to Bigger Opportunities
            </h2>
            <div className="max-w-2xl mx-auto">
              <div className="relative h-16 bg-gray-300 border-4 border-black mb-8 overflow-hidden">
                <div className="absolute h-full bg-green-600 transition-all duration-500" style={{ width: `${Math.min((completedGigs / 8) * 100, 100)}%` }} />
                <p className="absolute inset-0 flex items-center justify-center text-2xl font-bold">
                  {completedGigs} / 8 Gigs Completed
                </p>
              </div>
              <div className="grid grid-cols-2 gap-8">
                <div className={`text-center p-6 border-4 ${completedGigs >= 4 ? 'bg-green-100 border-green-600' : 'bg-gray-100 border-black'}`}>
                  <p className="text-xl font-bold mb-2">
                    {completedGigs >= 4 ? 'Qualified!' : `${4 - completedGigs} gigs to go`}
                  </p>
                  <p className="text-lg">
                    Freedom Scholarship Eligible<br />
                    <span className="text-sm">Unrestricted cash bonus</span>
                  </p>
                </div>
                <div className={`text-center p-6 border-4 ${completedGigs >= 8 ? 'bg-purple-100 border-purple-600' : 'bg-gray-100 border-black'}`}>
                  <p className="text-xl font-bold mb-2">
                    {completedGigs >= 8 ? 'Qualified!' : `${8 - completedGigs} gigs to go`}
                  </p>
                  <p className="text-lg">
                    Brand Deal Eligible<br />
                    <span className="text-sm">National brand submissions</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Fund Challenge */}
          <div className="max-w-2xl mx-auto">
            <h3 className="text-3xl font-bold mb-8">Fund a New Challenge</h3>
            <Input placeholder="Challenge description" value={customDetails} onChange={(e) => setCustomDetails(e.target.value)} className="mb-6" />
            <Input placeholder="Payout amount (e.g., 50)" value={amount} onChange={(e) => setAmount(e.target.value)} className="mb-12" />
            <Button onClick={handleFundChallenge} className="w-full h-20 text-2xl bg-green-600 text-white font-bold">
              Fund Challenge
            </Button>
          </div>
        </div>
      )}

      {/* Other tabs (friends, scholarships, wallet, payment-methods) — similar to business but filtered to kid/friends */}

      {/* Log Out */}
      <div className="text-center mt-32">
        <Button onClick={async () => {
          await signOut()
          router.push('/')
        }} variant="outline" className="w-64 h-14 text-lg border-4 border-black">
          Log Out
        </Button>
      </div>
    </div>
  )
}