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

// Dynamic import for Stripe React components (client-only)
const Elements = dynamic(() => import('@stripe/react-stripe-js').then((mod) => mod.Elements), { ssr: false })
const CardElement = dynamic(() => import('@stripe/react-stripe-js').then((mod) => mod.CardElement), { ssr: false })

// Static loadStripe (safe)
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

function ParentDashboardContent() {
  const [parent, setParent] = useState<any>(null)
  const [kids, setKids] = useState<any[]>([])
  const [selectedKid, setSelectedKid] = useState<any>(null)
  const [pendingClips, setPendingClips] = useState<any[]>([])
  const [showFundFriend, setShowFundFriend] = useState(false)
  const [friendEmail, setFriendEmail] = useState('')
  const [friendName, setFriendName] = useState('')
  const [friendChallenge, setFriendChallenge] = useState('')
  const [friendAmount, setFriendAmount] = useState('50')
  const [savedMethods, setSavedMethods] = useState<any[]>([])
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [activeTab, setActiveTab] = useState<'wallet' | 'clips' | 'kids' | 'scholarships'>('wallet')
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
  window.scrollTo({ top: 0, behavior: 'smooth' })
    }, [activeTab])
    
  useEffect(() => {
  const tab = searchParams.get('tab')
  if (tab === 'clips' || tab === 'kids' || tab === 'wallet') {
    setActiveTab(tab as any)
  }
    }, [searchParams])

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.replace('/')
        return
      }

      const { data: parentRecord } = await supabase
        .from('parents')
        .select('*')
        .eq('user_id', user.id)
        .single()

      setParent(parentRecord)

      const { data: kidsData } = await supabase
        .from('profiles')
        .select('id, full_name, email, school, gig_count, profile_pic')
        .eq('parent_id', parentRecord?.id || '')

      setKids(kidsData || [])

      const kidId = searchParams.get('kid_id')
      if (kidId && kidsData) {
        const kid = kidsData.find(k => k.id === kidId)
        if (kid) setSelectedKid(kid)
      }

      if (kidsData && kidsData.length > 0) {
        const { data: clips } = await supabase
          .from('clips')
          .select('*, offers(*), profiles(full_name)')
          .eq('status', 'pending')
          .in('athlete_id', kidsData.map(k => k.id))
        setPendingClips(clips || [])
      }

      if (parentRecord?.id) {
        const response = await fetch('/api/list-payment-methods', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ parent_id: parentRecord.id }),
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

  // Critical bypass for dynamic import + TypeScript strict mode
  const cardElement = (elements as any).getElement('card') || elements.getElement(CardElement as any)

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
        parent_id: parent.id,
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

  return (
    <div className="container py-8">
      <p className="text-center mb-12 text-xl font-mono">Welcome, Parent!</p>

    

      <div className="bg-black text-white p-8 mb-12">
        <h1 className="text-3xl font-bold text-center">
          Your Parent Console
        </h1>
      </div>

      <div className="bg-black text-white p-8 mb-12">
        <p className="text-lg leading-relaxed text-center max-w-3xl mx-auto">
          Fund your kid's challenges and scholarships.<br />
          They complete — you approve — they earn instantly.<br />
          Help them get from first gig to Freedom Scholarship (4 gigs) to brand deals (8 gigs).
        </p>
      </div>

      {/* No Kid Yet Banner — Enhanced with Native Share */}
      {kids.length === 0 && (
        <div className="bg-yellow-100 p-12 border-4 border-yellow-600 mb-16 text-center max-w-3xl mx-auto rounded-lg">
          <h2 className="text-3xl font-bold mb-4 font-mono">
            No Kids Linked Yet
          </h2>
          <p className="text-xl mb-10 font-mono leading-relaxed">
            Send your kid their personal invite link.<br />
            Once they sign up, you’ll see their progress and approve earnings.
          </p>

          <Button
            onClick={async () => {
              const inviteLink = `https://app.localhustle.org/athlete-onboard?parent_id=${parent?.id || ''}`
              const shareText = "Hey! I set up LocalHustle for you — earn real money this off-season with simple gigs from local businesses. Use this link to get started and link to my parent account:"
              
              const shareData = {
                title: "Join me on LocalHustle",
                text: shareText,
                url: inviteLink,
              }

              if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
                try {
                  await navigator.share(shareData)
                  return
                } catch (err: any) {
                  if (err.name !== 'AbortError') {
                    console.warn('Share failed:', err)
                  }
                }
              }

              try {
                await navigator.clipboard.writeText(`${shareText}\n\n${inviteLink}`)
                alert('✅ Invite link + message copied!\n\nPaste it into a text, email, or AirDrop to your kid.')
              } catch (err) {
                prompt('Copy this link and message manually:', `${shareText}\n\n${inviteLink}`)
              }
            }}
            className="w-full max-w-md h-20 text-2xl bg-black text-white font-bold hover:bg-gray-800 transition"
          >
            Send Invite to My Kid
          </Button>

          <p className="text-sm text-gray-600 mt-6 font-mono">
            Works with Text, Email, AirDrop, WhatsApp, and more
          </p>
        </div>
      )}

      {/* Kid Profile & Progress Meter */}
      {selectedKid && (
        <div className="max-w-3xl mx-auto mb-16 p-12 bg-green-100 border-4 border-green-600">
          <div className="flex items-center gap-8 mb-8">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-black">
              <img src={selectedKid.profile_pic || '/default-avatar.png'} alt={selectedKid.full_name} className="w-full h-full object-cover" />
            </div>
            <div>
              <h2 className="text-3xl font-bold">{selectedKid.full_name}</h2>
              <p className="text-xl">{selectedKid.school}</p>
            </div>
          </div>

          <div className="mb-8">
            <p className="text-xl mb-4 text-center">Progress to Big Rewards</p>
            <div className="bg-gray-200 h-12 border-4 border-black relative">
              <div 
                className="bg-green-500 h-full transition-all"
                style={{ width: `${(selectedKid.gig_count / 8) * 100}%` }}
              />
              <div className="absolute inset-0 flex items-center justify-center text-2xl font-bold">
                {selectedKid.gig_count} / 8 Gigs
              </div>
            </div>
            <div className="flex justify-between mt-4 text-lg">
              <span>4 gigs → Freedom Scholarship</span>
              <span>8 gigs → Brand Deals</span>
            </div>
          </div>
        </div>
      )}

      {/* Tabs — Sticky, with counts where useful */}
      <div className="sticky top-0 bg-white z-30 border-b-4 border-black py-4 shadow-lg">
        <div className="flex justify-center gap-3 flex-wrap px-4">
          <Button
            onClick={() => setActiveTab('wallet')}
            variant={activeTab === 'wallet' ? 'default' : 'outline'}
            className="px-6 py-4 text-lg font-mono font-bold min-w-[100px]"
          >
            Wallet
          </Button>
          <Button
            onClick={() => setActiveTab('clips')}
            variant={activeTab === 'clips' ? 'default' : 'outline'}
            className="px-6 py-4 text-lg font-mono font-bold min-w-[100px]"
          >
            Pending Clips ({pendingClips.length})
          </Button>
          <Button
            onClick={() => setActiveTab('kids')}
            variant={activeTab === 'kids' ? 'default' : 'outline'}
            className="px-6 py-4 text-lg font-mono font-bold min-w-[100px]"
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

      {/* ACTIVE TAB CONTENT ONLY — appears directly below tabs */}
      <div className="pt-8 pb-32 min-h-screen">

        {/* Wallet Tab */}
        {activeTab === 'wallet' && (
          <div className="space-y-16 px-4">
            <h2 className="text-4xl font-bold mb-8 text-center font-mono">Wallet</h2>
            <p className="text-3xl mb-12 text-center font-mono">
              Balance: ${parent?.wallet_balance?.toFixed(2) || '0.00'}
            </p>

            <p className="text-lg mb-12 text-center max-w-3xl mx-auto font-mono">
              Add funds to sponsor challenges and scholarships.<br />
              You only pay when your kid completes and you approve.
            </p>

            {/* Add Funds */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
              <Button onClick={() => handleAddFunds(100)} className="h-16 text-xl bg-black text-white font-mono">
                + $100
              </Button>
              <Button onClick={() => handleAddFunds(500)} className="h-16 text-xl bg-black text-white font-mono">
                + $500
              </Button>
              <Button onClick={() => handleAddFunds(1000)} className="h-16 text-xl bg-black text-white font-mono">
                + $1000
              </Button>
              <Button 
                onClick={() => {
                  const amt = prompt('Custom amount:')
                  if (amt && !isNaN(Number(amt))) handleAddFunds(Number(amt))
                }}
                className="h-16 text-xl bg-green-400 text-black font-mono"
              >
                Custom
              </Button>
            </div>

            {/* Card Entry — Spacious Shopping Cart Style */}
            <div className="max-w-3xl mx-auto mb-16">
              <div className="bg-white p-16 border-4 border-black rounded-lg shadow-lg">
                <h4 className="text-3xl font-bold mb-8 text-center font-mono">
                  Add Card for Funding
                </h4>
                <p className="text-xl mb-12 text-center text-gray-600 font-mono">
                  Secure by Stripe — your card details are safe and encrypted.
                </p>
                <Elements stripe={stripePromise}>
                  <div className="space-y-12">
                    <div className="bg-gray-50 p-8 border-4 border-gray-300 rounded-lg">
                      <CardElement 
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
                    {paymentError && <p className="text-red-600 text-center text-xl">{paymentError}</p>}
                    {paymentSuccess && <p className="text-green-600 text-center text-xl">Card saved!</p>}
                    <Button 
                      onClick={handleAddCard}
                      disabled={paymentLoading}
                      className="w-full h-20 text-2xl bg-black text-white font-bold font-mono"
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
          </div>
        )}

        {/* Pending Clips Tab */}
        {activeTab === 'clips' && (
          <div className="px-4">
            <h3 className="text-3xl mb-8 font-bold text-center font-mono">Pending Clips to Approve</h3>
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
              {kids.length === 0 ? (
                <p className="text-xl text-center text-gray-600 font-mono">No kids linked yet — wait for invite.</p>
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
      </div>
      
      {/* Role Switcher — Bold 150px Slide Switch (Parent ↔ Business) */}
<div className="fixed bottom-6 right-6 z-50">
  <div className="bg-white border-4 border-black rounded-full shadow-2xl overflow-hidden w-[150px] h-16 flex items-center">
    {/* Background sliding indicator */}
    <div 
      className={`absolute inset-0 w-1/2 bg-black transition-transform duration-300 ease-in-out ${
        currentRole === 'parent' ? 'translate-x-0' : 'translate-x-full'
      }`}
    />

    {/* Parent Label */}
    <button
      onClick={() => router.push('/parent-dashboard')}
      className="relative z-10 flex-1 h-full flex items-center justify-center"
      disabled={currentRole === 'parent'}
    >
      <span className={`text-lg font-bold font-mono transition-colors ${
        currentRole === 'parent' ? 'text-white' : 'text-black'
      }`}>
        Parent
      </span>
    </button>

    {/* Business Label */}
    <button
      onClick={() => router.push('/business-dashboard')}
      className="relative z-10 flex-1 h-full flex items-center justify-center"
      disabled={currentRole === 'business'}
    >
      <span className={`text-lg font-bold font-mono transition-colors ${
        currentRole === 'business' ? 'text-white' : 'text-black'
      }`}>
        Business
      </span>
    </button>
  </div>

  {/* Optional: Small hint text below */}
  <p className="text-center text-xs font-mono mt-2 text-gray-600">
    Switch role
  </p>
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