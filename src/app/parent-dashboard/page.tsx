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

function ParentDashboardContent() {
  const [parent, setParent] = useState<any>(null)
  const [kids, setKids] = useState<any[]>([])
  const [selectedKid, setSelectedKid] = useState<any>(null)
  const [pendingClips, setPendingClips] = useState<any[]>([])
  const [gigCount, setGigCount] = useState(0)
  const [offers, setOffers] = useState<any[]>([])
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
  const [activeTab, setActiveTab] = useState<'wallet' | 'clips' | 'kids' | 'scholarships'>('wallet')
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

      const { data: parentRecord } = await supabase
        .from('businesses')
        .select('*')
        .eq('owner_id', user.id)
        .single();
      setParent(parentRecord);

      if (parentRecord?.id) {
      const { data: kidsData } = await supabase
        .from('profiles')
        .select('id, full_name, email, school, gig_count, profile_pic')
        .eq('parent_id', parentRecord?.id || '')
setKids(kidsData || [])
}
      const kidId = searchParams.get('kid_id')
      if (kidId) {
      const { data: kidData } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', kidId)
        .single()

      if (kidData) {
      setQuickSponsorKid(kidData)
      setShowQuickSponsor(true)
    }
    }

      if (kidsData && kidsData.length > 0) {
        const { data: clips } = await supabase
          .from('clips')
          .select('*, offers(*), profiles(full_name)')
          .eq('status', 'pending')
          .in('athlete_id', kidsData.map(k => k.id))
        setPendingClips(clips || [])
      }
      
      if (kidsData && kidsData.length > 0) {
        if (selectedKid) {
            setGigCount(selectedKid.gig_count || 0)
         } else if (kidId) {
          // If coming from invite, use the invited kid
            const invitedKid = kidsData.find(k => k.id === kidId)
         setGigCount(invitedKid?.gig_count || 0)
        } else {
         // Default: total gigs across all kids
            const total = kidsData.reduce((sum, kid) => sum + (kid.gig_count || 0), 0)
            setGigCount(total)
        }
       }

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
    setShowFundFriend(true)
  }

  const fundFriend = async () => {
    if (!friendEmail || !friendChallenge || parseFloat(friendAmount) <= 0) {
      alert('Fill all fields')
      return
    }

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

    if (data.error) {
      alert('Error: ' + data.error)
    } else {
      alert('Friend invited and challenge funded!')
      setShowFundFriend(false)
      setFriendEmail('')
      setFriendName('')
      setFriendChallenge('')
      setFriendAmount('50')
    }
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
        business_id: parent.id,
      }),
    })

    const data = await response.json()

    if (data.error) {
      alert('Charge failed: ' + data.error)
    } else {
      alert(`$${amount} added to wallet!`)
      setParent({ ...parent, wallet_balance: parent.wallet_balance + amount })
    }
  }

  const handleAddCard = async () => {
  if (!stripe || !elements) return;

  // Use the string 'card', not the component CardElement
  const cardElement = elements.getElement('card');

  if (!cardElement) {
    setPaymentError('Card element not found');
    return;
  }

  const { error: stripeError, paymentMethod } = await stripe.createPaymentMethod({
    type: 'card',
    card: cardElement,
  });
  
  if (stripeError) {
    setPaymentError(stripeError.message || 'Payment error')
    setPaymentLoading(false)
    return
  }

  // Save token to businesses table
  const { error: dbError } = await supabase
    .from('businesses')
    .update({ debit_card_token: paymentMethod.id })
    .eq('id', parent.id)

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
  setTimeout(() => setPaymentSuccess(false), 5000)
  setPaymentLoading(false)
}

  return (
    <div className="container py-8">
      <p className="text-center mb-12 text-xl font-mono">Welcome, Parent!</p>
      
            {/* Step-by-Step Setup Guidance for Parents */}
      <div className="bg-black text-white p-12 mb-16">
        <h2 className="text-4xl font-bold mb-12 text-center font-mono">
          Get Started in 3 Simple Steps
        </h2>
        <div className="max-w-4xl mx-auto space-y-12 text-xl leading-relaxed font-mono">
          <div>
            <p className="text-2xl font-bold mb-4">Step 1: Add Your Card</p>
            <p>
              Securely add a credit or debit card — you'll only be charged when you approve completed gigs.<br />
              No upfront fees, full control.
            </p>
          </div>
          <div>
            <p className="text-2xl font-bold mb-4">Step 2: Fund Your Kid's First Gig</p>
            <p>
              They complete it, you approve the clip, they get paid instantly.
            </p>
          </div>
          <div>
            <p className="text-2xl font-bold mb-4">Step 3: Watch Them Grow</p>
            <p>
              Every approved gig builds their earnings and progress toward Scholarships (4 gigs) and Brand Deals (8 gigs).<br />
              You're helping them earn real money — thank you!
            </p>
          </div>
        </div>
      </div>

            <div className="bg-black text-white p-8 mb-12">
        <h1 className="text-3xl font-bold text-center">
          Your Parent Console
        </h1>
      </div>

            
            {/* Progress Meter with Message to Parents */}
      <div className="max-w-3xl mx-auto mb-16 p-12 bg-green-100 border-4 border-green-600 rounded-lg">
        <h3 className="text-4xl font-bold mb-12 text-center font-mono">
          Your Kid's Progress to Freedom
        </h3>
        <p className="text-xl mb-12 text-center font-mono max-w-2xl mx-auto">
          Every gig you fund helps them build real earnings and qualify for Freedom Scholarships.<br />
          4 gigs = unrestricted cash scholarship. 8 gigs = brand deals unlocked.<br />
          You're making their hustle possible — thank you!
        </p>

        <div className="mb-8">
          <p className="text-2xl text-center mb-4 font-mono">
            Gigs Completed: {gigCount} / 8
          </p>
          <div className="relative h-20 bg-gray-300 border-4 border-black">
            <div 
              className="absolute top-0 left-0 h-full bg-green-400 transition-all duration-1000"
              style={{ width: `${(gigCount / 8) * 100}%` }}
            />
            <p className="absolute inset-0 flex items-center justify-center text-3xl font-bold font-mono">
              {gigCount < 4 ? 'Keep Going!' : gigCount < 8 ? 'Almost There!' : 'Brand Deals Unlocked!'}
            </p>
          </div>
          <div className="flex justify-between mt-4 text-lg font-mono">
            <span>4 gigs → Freedom Scholarship → </span>
            <span>8 gigs → Brand Deals</span>
          </div>
        </div>
      </div>

      {/* Quick Sponsor Banner */}
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
            onClick={() => setShowCardModal(true)}
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
      
            {/* Compact Sponsor a Gig Section */}
      <div className="max-w-3xl mx-auto mb-16 p-12 bg-white border-4 border-black rounded-lg">
        <h2 className="text-4xl font-bold mb-12 text-center font-mono">Sponsor a Gig</h2>
        <p className="text-xl mb-12 text-center font-mono text-gray-600">
          Choose a gig to fund — add a short note and send it to your kid instantly.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* ShoutOut */}
          <div className="bg-gray-100 p-8 border-4 border-black rounded-lg">
            <h3 className="text-2xl font-bold mb-4 font-mono">ShoutOut</h3>
            <p className="text-3xl font-bold mb-4 text-green-600">$50</p>
            <Input
              placeholder="e.g., Visit Bridge Pizza and shoutout your favorite order"
              className="mb-6 h-14 text-lg font-mono"
            />
            <Button className="w-full h-16 text-xl bg-black text-white font-bold font-mono">
              Fund ShoutOut
            </Button>
          </div>

          {/* Challenge */}
          <div className="bg-gray-100 p-8 border-4 border-black rounded-lg">
            <h3 className="text-2xl font-bold mb-4 font-mono">Challenge</h3>
            <p className="text-3xl font-bold mb-4 text-green-600">$75</p>
            <Input
              placeholder="e.g., 80/100 free throws or 50 pushups"
              className="mb-6 h-14 text-lg font-mono"
            />
            <Button className="w-full h-16 text-xl bg-black text-white font-bold font-mono">
              Fund Challenge
            </Button>
          </div>

          {/* Cameo */}
          <div className="bg-gray-100 p-8 border-4 border-black rounded-lg">
            <h3 className="text-2xl font-bold mb-4 font-mono">Cameo</h3>
            <p className="text-3xl font-bold mb-4 text-green-600">$50</p>
            <Input
              placeholder="e.g., Birthday message for little brother"
              className="mb-6 h-14 text-lg font-mono"
            />
            <Button className="w-full h-16 text-xl bg-black text-white font-bold font-mono">
              Fund Cameo
            </Button>
          </div>
        </div>

        {/* Custom Gig */}
        <div className="mt-12 max-w-xl mx-auto">
          <h3 className="text-2xl font-bold mb-6 text-center font-mono">Or Create a Custom Gig</h3>
          <Input
            placeholder="Gig title (e.g., Youth Clinic)"
            className="mb-6 h-14 text-lg font-mono"
          />
          <Input
            type="number"
            placeholder="Amount (e.g., 200)"
            className="mb-6 h-14 text-lg font-mono"
          />
          <Input
            placeholder="Description (e.g., Run a 1-hour clinic for younger players)"
            className="mb-8 h-14 text-lg font-mono"
          />
          <Button className="w-full h-16 text-xl bg-green-600 text-white font-bold font-mono">
            Fund Custom Gig
          </Button>
        </div>
      </div>

      {/* Sticky Tabs with Counts */}
      <div className="sticky top-0 bg-white z-30 border-b-4 border-black py-4 shadow-lg">
        <div className="flex justify-center gap-3 flex-wrap px-4 items-center">
          <Button
            onClick={() => setActiveTab('wallet')}
            variant={activeTab === 'wallet' ? 'default' : 'outline'}
            className="px-6 py-4 text-lg font-bold min-w-[100px]"
          >
            Wallet
          </Button>
          <Button
            onClick={() => setActiveTab('clips')}
            variant={activeTab === 'clips' ? 'default' : 'outline'}
            className="px-6 py-4 text-lg font-bold min-w-[100px]"
          >
            Pending Clips ({pendingClips.length})
          </Button>
          <Button
            onClick={() => setActiveTab('kids')}
            variant={activeTab === 'kids' ? 'default' : 'outline'}
            className="px-6 py-4 text-lg font-bold min-w-[100px]"
          >
            My Kids ({kids.length})
          </Button>
          <Button
            onClick={() => router.push('/freedom-scholarship')}
            className="px-6 py-4 text-lg font-mono font-bold bg-green-500 text-black border-4 border-black hover:bg-green-400"
          >
            Scholarships
          </Button>
        </div>
      </div>

      {/* ACTIVE TAB CONTENT ONLY */}
      <div className="pt-8 pb-40">

        {/* Wallet Tab */}
        {activeTab === 'wallet' && (
          <div className="space-y-32 px-4">
            {/* Card Entry — Sleek, Modern, Spacious */}
            <div className="max-w-md mx-auto py-8 bg-white p-12 border-4 border-black rounded-lg shadow-2xl">
              <h3 className="text-3xl font-bold mb-8 text-center">Add Card for Funding</h3>
              <p className="text-xl mb-12 text-center text-gray-600">
                Secure by Stripe — safe and encrypted.
              </p>
              
                <div className="space-y-12">
                  <div className="bg-gray-50 p-8 border-4 border-gray-300 rounded-lg">
                    <CardElement
                      onReady={() => setCardReady(true)}
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
              
            </div>

            {/* Add Funds */}
            <div className="max-w-3xl mx-auto">
              <h3 className="text-3xl font-bold mb-8 text-center">Add Funds to Wallet</h3>
              <p className="text-xl mb-12 text-center">
                Balance: ${parent?.wallet_balance?.toFixed(2) || '0.00'}
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

        {/* Pending Clips Tab */}
        {activeTab === 'clips' && (
          <div className="px-4">
            <h3 className="text-3xl mb-8 font-bold text-center">Pending Clips</h3>
            {pendingClips.length === 0 ? (
              <p className="text-gray-600 mb-12 text-center text-xl">No pending clips — post offers to get started!</p>
            ) : (
              <div className="space-y-16">
                {pendingClips.map((clip) => (
                  <div key={clip.id} className="border-4 border-black p-8 bg-white max-w-2xl mx-auto">
                    <p className="font-bold mb-4 text-left">From: {clip.profiles.full_name}</p>
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
            <h3 className="text-3xl mb-8 font-bold text-center">My Kids</h3>
            <div className="space-y-12 max-w-3xl mx-auto">
              {kids.length === 0 ? (
                <p className="text-xl text-center text-gray-600">No kids linked yet — wait for invite.</p>
              ) : (
                kids.map((kid) => (
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

      </div>

      {/* Fund a Friend — shown below tab content */}
      {showFundFriend && (
        <div className="max-w-2xl mx-auto mb-16 p-12 bg-green-100 border-4 border-green-600">
          <h3 className="text-3xl font-bold mb-8 text-center font-mono">Fund a Friend</h3>
          <p className="text-xl mb-8 text-center font-mono">
            Invite a new athlete with a pre-funded challenge — help your kid's friend get started.
          </p>
          <div className="space-y-6">
            <Input placeholder="Friend's email" value={friendEmail} onChange={(e) => setFriendEmail(e.target.value)} className="font-mono" />
            <Input placeholder="Friend's name (optional)" value={friendName} onChange={(e) => setFriendName(e.target.value)} className="font-mono" />
            <Input placeholder="Challenge description" value={friendChallenge} onChange={(e) => setFriendChallenge(e.target.value)} className="font-mono" />
            <Input placeholder="Amount (default $50)" value={friendAmount} onChange={(e) => setFriendAmount(e.target.value)} className="font-mono" />
            <Button onClick={fundFriend} className="w-full h-16 text-xl bg-green-600 text-white font-mono">
              Send Invite & Fund Challenge
            </Button>
          </div>
        </div>
      )}



      
      
      {/* Log Out */}
      <div className="text-center mt-32 pb-32">
        <Button onClick={async () => {
          await signOut()
          router.push('/')
          alert('Logged out successfully')
        }} variant="outline" className="w-64 h-14 text-lg border-4 border-black font-mono">
          Log Out
        </Button>
        
        {/* Role Switcher */}
            
      <div className="fixed bottom-6 right-6 z-50">
        <div className="bg-white border-4 border-black rounded-full shadow-2xl overflow-hidden w-40 h-12 flex items-center">
          <div 
            className={`absolute inset-0 w-1/2 bg-black transition-transform duration-300 ease-in-out ${
              currentRole === 'parent' ? 'translate-x-0' : 'translate-x-full'
            }`}
          />

          <button
            onClick={() => router.push('/parent-dashboard')}
            className="relative z-10 flex-1 h-full flex items-center justify-center text-sm font-bold font-mono disabled:opacity-100"
            disabled={currentRole === 'parent'}
          >
            <span className={currentRole === 'parent' ? 'text-white' : 'text-black'}>
              Parent
            </span>
          </button>

          <button
            onClick={() => router.push('/business-dashboard')}
            className="relative z-10 flex-1 h-full flex items-center justify-center text-sm font-bold font-mono disabled:opacity-100"
            disabled={currentRole === 'business'}
          >
            <span className={currentRole === 'business' ? 'text-white' : 'text-black'}>
              Business
            </span>
          </button>
        </div>

        <p className="text-center text-xs font-mono mt-2 text-gray-600">
          Switch role
        </p>
      </div>
      </div>
    </div>
  )
}

export default function ParentDashboard() {
  return (
    <Elements stripe={stripePromise}>
      <Suspense fallback={<p className="text-center py-32 text-2xl">Loading...</p>}>
        <ParentDashboardContent />
      </Suspense>
    </Elements>
  )
}