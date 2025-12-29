'use client'

import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { signOut } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

const gigTypes = [
  { title: 'ShoutOut', baseAmount: 50, description: 'Visit a favorite business and make a quick shoutout 15-sec reel about what you like or your favorite order.' },
  { title: 'Youth Clinic', baseAmount: 500, description: 'Run 30–60 min sessions for younger athletes (with teammates).' },
  { title: 'Cameo', baseAmount: 50, description: 'Custom 15-Sec Video for Younger Athletes (birthdays, pre-game pep talks).' },
  { title: 'Player Training', baseAmount: 100, description: 'Varsity athlete 40-minute training with young player.' },
  { title: 'Challenge', baseAmount: 75, description: 'Fun competitions — HORSE, PIG, free throws, accuracy toss. Base pay for clip, bonus if you win.' },
  { title: 'Custom Gig', baseAmount: 200, description: 'Create a gig and offer it.' },
]

function ParentDashboardContent() {
  const [parent, setParent] = useState<any>(null)
  const [business, setBusiness] = useState<any>(null)
  const [kid, setKid] = useState<any>(null)
  const [completedGigs, setCompletedGigs] = useState(0)
  const [selectedGig, setSelectedGig] = useState<any>(null)
  const [numAthletes, setNumAthletes] = useState(1)
  const [customDetails, setCustomDetails] = useState('')
  const [amount, setAmount] = useState('')
  const [scholarshipAmount, setScholarshipAmount] = useState('')
  const [scholarshipMessage, setScholarshipMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [savedMethods, setSavedMethods] = useState<any[]>([])
  const router = useRouter()
  const searchParams = useSearchParams()
  const kidId = searchParams.get('kid_id')
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

      // Reuse business wallet for parent
      const { data: biz } = await supabase
        .from('businesses')
        .select('*')
        .eq('owner_id', user.id)
        .single()

      if (biz) {
        setBusiness(biz)
      }

      // Fetch kid
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
    }

    fetchData()
  }, [router, kidId])

  const handleGigSelect = (gig: any) => {
    setSelectedGig(gig)
    setNumAthletes(1)
    setAmount('')
    setCustomDetails('')
  }

  const handleAthletesChange = (value: number) => {
    setNumAthletes(value)
    if (selectedGig) {
      const total = selectedGig.baseAmount + (value - 1) * 75
      setAmount(total.toString())
    }
  }

  const handleFundChallenge = async () => {
    if (!kid || !amount || parseFloat(amount) <= 0) {
      alert('Enter valid amount')
      return
    }

    setLoading(true)

    const response = await fetch('/api/create-gig', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        business_id: business.id,
        type: 'Challenge',
        amount: parseFloat(amount),
        description: customDetails || 'Complete challenge for payout',
        target_athlete_id: kid.id,
      }),
    })

    const data = await response.json()

    if (data.error) {
      alert('Error: ' + data.error)
    } else {
      alert(`${kid.full_name}'s challenge funded!`)
      setCustomDetails('')
      setAmount('')
    }

    setLoading(false)
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

  const handleAwardScholarship = async () => {
    if (!kid || !scholarshipAmount || parseFloat(scholarshipAmount) <= 0) {
      alert('Enter valid amount')
      return
    }

    const response = await fetch('/api/payout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        athlete_id: kid.id,
        amount: parseFloat(scholarshipAmount),
        type: 'freedom_scholarship',
        message: scholarshipMessage || 'Great hustle!',
      }),
    })

    const data = await response.json()

    if (data.error) {
      alert('Error: ' + data.error)
    } else {
      alert(`Freedom Scholarship awarded to ${kid.full_name}!`)
    }
  }

  if (!parent || !kid) return <p className="text-center py-32 text-2xl">Loading...</p>

  return (
    <div className="min-h-screen bg-white text-black font-mono py-20 px-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl sm:text-6xl font-bold text-center mb-12">
          Parent Dashboard — {kid.full_name}
        </h1>

        {/* Progress Meter */}
        <div className="bg-gray-100 p-12 border-4 border-black mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">
            {kid.full_name}'s Path to Bigger Opportunities
          </h2>

          <div className="max-w-2xl mx-auto">
            <div className="relative h-16 bg-gray-300 border-4 border-black mb-8 overflow-hidden">
              <div 
                className="absolute h-full bg-green-600 transition-all duration-500"
                style={{ width: `${Math.min((completedGigs / 8) * 100, 100)}%` }}
              />
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
                  Freedom Scholarship Eligible
                </p>
              </div>
              <div className={`text-center p-6 border-4 ${completedGigs >= 8 ? 'bg-purple-100 border-purple-600' : 'bg-gray-100 border-black'}`}>
                <p className="text-xl font-bold mb-2">
                  {completedGigs >= 8 ? 'Qualified!' : `${8 - completedGigs} gigs to go`}
                </p>
                <p className="text-lg">
                  Brand Deal Eligible
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Wallet Balance */}
        <div className="bg-gray-100 p-8 border-4 border-black mb-16 text-center">
          <p className="text-3xl font-bold mb-4">
            Wallet Balance: ${business?.wallet_balance?.toFixed(2) || '0.00'}
          </p>
          <Button 
            onClick={() => router.push('/add-funds')}
            className="w-full max-w-md h-16 text-xl bg-black text-white"
          >
            Add Funds
          </Button>
        </div>

        {/* Fund New Challenge */}
        <div className="max-w-2xl mx-auto mb-16">
          <h3 className="text-3xl font-bold mb-8 text-center">
            Fund a New Challenge for {kid.full_name}
          </h3>
          <Input 
            placeholder="Challenge description (e.g., Make 80/100 free throws)"
            value={customDetails}
            onChange={(e) => setCustomDetails(e.target.value)}
            className="mb-6"
          />
          <Input 
            placeholder="Payout amount (e.g., 50)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mb-12"
          />
          <Button 
            onClick={handleFundChallenge}
            disabled={loading}
            className="w-full h-20 text-2xl bg-green-600 text-white font-bold"
          >
            {loading ? 'Funding...' : 'Fund Challenge'}
          </Button>
        </div>

        {/* Award Freedom Scholarship */}
        <div className="max-w-2xl mx-auto mb-16">
          <h3 className="text-3xl font-bold mb-8 text-center">
            Award a Freedom Scholarship to {kid.full_name}
          </h3>
          <Input 
            placeholder="Scholarship amount (e.g., 500)"
            value={scholarshipAmount}
            onChange={(e) => setScholarshipAmount(e.target.value)}
            className="mb-6"
          />
          <textarea 
            placeholder="Optional message (e.g., Great season — use for books!)"
            value={scholarshipMessage}
            onChange={(e) => setScholarshipMessage(e.target.value)}
            className="w-full p-4 text-lg border-4 border-black font-mono mb-6"
          />
          <Button 
            onClick={handleAwardScholarship}
            className="w-full h-20 text-2xl bg-purple-600 text-white font-bold"
          >
            Award Scholarship
          </Button>
        </div>

        {/* Payment Methods */}
        <div className="max-w-2xl mx-auto mb-16">
          <h3 className="text-3xl font-bold mb-8 text-center">
            Payment Methods
          </h3>
          {savedMethods.length === 0 ? (
            <p className="text-gray-600 mb-12 text-xl">
              No saved cards yet.
            </p>
          ) : (
            <div className="space-y-8 mb-16">
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

        {/* Share with Local Businesses */}
        <div className="max-w-2xl mx-auto mb-16">
          <h3 className="text-3xl font-bold mb-8 text-center">
            Help {kid.full_name} Get More Sponsors
          </h3>
          <p className="text-xl mb-12 text-center">
            Share their personalized pitch letter with local businesses.
          </p>
          <Button 
            onClick={() => {
              const letter = `Hey [Business],

My kid ${kid.full_name} has been coming to your spot for years.

They're on LocalHustle earning from challenges and scholarships.

Would you consider sponsoring them? Here's what you'd get: a thank-you clip they make about your business.

This link has details: https://app.localhustle.org/business-onboard?ref=${kid.id}

Thanks!

– A proud parent`
              navigator.clipboard.writeText(letter)
              alert('Pitch letter copied!')
            }}
            className="w-full h-20 text-2xl bg-black text-white font-bold"
          >
            Copy Pitch Letter
          </Button>
        </div>

        {/* Log Out */}
        <div className="text-center mt-32">
          <Button 
            onClick={async () => {
              await signOut()
              router.push('/')
            }}
            variant="outline"
            className="w-64 h-14 text-lg border-4 border-black"
          >
            Log Out
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function ParentDashboard() {
  return (
    <Suspense fallback={<p className="text-center py-32 text-2xl">Loading...</p>}>
      <ParentDashboardContent />
    </Suspense>
  )
}