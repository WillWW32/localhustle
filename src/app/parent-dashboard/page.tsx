'use client'

import { Suspense } from 'react'
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

function ParentDashboardContent() {
  const [parent, setParent] = useState<any>(null)
  const [business, setBusiness] = useState<any>(null)
  const [kid, setKid] = useState<any>(null)
  const [completedGigs, setCompletedGigs] = useState(0)
  const [customDetails, setCustomDetails] = useState('')
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const kidId = searchParams.get('kid_id')

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

      // Fetch business wallet (reuse business table)
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
    }

    fetchData()
  }, [router, kidId])

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

        {/* Share with Local Businesses */}
        <div className="max-w-2xl mx-auto">
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