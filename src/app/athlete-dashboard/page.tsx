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

const athleteGigTypes = [
  { title: 'ShoutOut', description: 'Visit a favorite business and make a quick shoutout 15-sec reel about what you like or your favorite order.' },
  { title: 'Youth Clinic', description: 'Run 30–60 min sessions for younger athletes (with teammates).' },
  { title: 'Cameo', description: 'Custom 15-Sec Video for Younger Athletes (birthdays, pre-game pep talks).' },
  { title: 'Player Training', description: 'Varsity athlete 40-minute training with young player.' },
  { title: 'Challenge', description: 'Fun competitions — HORSE, PIG, free throws, accuracy toss. Base pay for clip, bonus if you win.' },
  { title: 'Custom Gig', description: 'Create a gig and offer it.' },
]

function AthleteDashboardContent() {
  const [cardReady, setCardReady] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [offers, setOffers] = useState<any[]>([])
  const [selectedGigs, setSelectedGigs] = useState<string[]>([])
  const [squad, setSquad] = useState<any[]>([])
  const [profilePic, setProfilePic] = useState('')
  const [highlightLink, setHighlightLink] = useState('')
  const [socialFollowers, setSocialFollowers] = useState('')
  const [bio, setBio] = useState('')
  const [showPitchLetter, setShowPitchLetter] = useState(false)
  const [gigSearch, setGigSearch] = useState('')
  const [searchedOffers, setSearchedOffers] = useState<any[]>([])
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
  const [cardholderName, setCardholderName] = useState(profile?.full_name || '')
  const [cardElementReady, setCardElementReady] = useState(false)
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

    const { data: prof } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (prof) {
      setProfile(prof)
      if (prof.selected_gigs) setSelectedGigs(prof.selected_gigs)
      setProfilePic(prof.profile_pic || '')
      setHighlightLink(prof.highlight_link || '')
      setSocialFollowers(prof.social_followers || '')
      setBio(prof.bio || '')
      setGigCount(prof.gig_count || 0)

elements.getElement(CardElement)
      if (prof.debit_card_token) {
        setSavedMethods([{
          id: prof.debit_card_token,
          brand: prof.card_brand || 'Card',
          last4: prof.card_last4 || '••••',
          exp_month: prof.card_exp_month,
          exp_year: prof.card_exp_year,
        }])
      }

        const { data: squadMembers } = await supabase
          .from('profiles')
          .select('email, created_at')
          .eq('referred_by', user.id)
        setSquad(squadMembers || [])

        const { data: openOffers } = await supabase
          .from('offers')
          .select('*')
          .eq('status', 'active')
          .order('created_at', { ascending: false })
        setOffers(openOffers || [])
        setSearchedOffers(openOffers || [])

        // Fetch saved payment methods for payouts
        const response = await fetch('/api/list-payment-methods', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ athlete_id: prof.id }),
        })
        const data = await response.json()
        setSavedMethods(data.methods || [])
      }
    }

    fetchData()
  }, [router])


    useEffect(() => {
    if (profile?.full_name) setCardholderName(profile.full_name)
    }, [profile])

  const handleSaveProfile = async () => {
    const { error } = await supabase
      .from('profiles')
      .update({
        profile_pic: profilePic,
        highlight_link: highlightLink,
        social_followers: socialFollowers,
        bio: bio,
      })
      .eq('id', profile.id)

    if (error) alert('Error saving profile')
    else alert('Profile saved!')
  }

  const toggleGigSelection = async (title: string) => {
    const newSelected = selectedGigs.includes(title)
      ? selectedGigs.filter(g => g !== title)
      : [...selectedGigs, title]

    setSelectedGigs(newSelected)

    await supabase
      .from('profiles')
      .update({ selected_gigs: newSelected })
      .eq('id', profile.id)
  }

  const copyLetter = () => {
    const athleteId = profile?.id || 'fallback-id'
    const letterText = `Hey [Business Name],

I've been coming to [Your Spot] for years before and after practice.

Our team has joined a new app that helps us get community support for our athletic journey. I'm reaching out to my favorite spots to see if you would consider a sponsorship.

Here's what you would get: a short thank-you clip from me about your place. You can use the clip for social media if you want.

I'd probably get some new shoes or gear and be set for our roadtrips. It means a lot for me and the team and I'd love to rep a local business that's got our back.

This link has all the details for how it works: https://app.localhustle.org/business-onboard?ref=${athleteId}

Thanks either way!

– ${profile?.email.split('@')[0] || 'me'}
${profile?.school || 'our local high school'} ${profile?.sport || 'varsity athlete'}`

    navigator.clipboard.writeText(letterText)
    alert('Letter copied to clipboard!')
  }

  const shareLetter = () => {
    const athleteId = profile?.id || 'fallback-id'
    const letterText = `Hey [Business Name],

I've been coming to [Your Spot] for years before and after practice.

Our team has joined a new app that helps us get community support for our athletic journey. I'm reaching out to my favorite spots to see if you would consider a sponsorship.

Here's what you would get: a short thank-you clip from me about your place. You can use the clip for social media if you want.

I'd probably get some new shoes or gear and be set for our roadtrips. It means a lot for me and the team and I'd love to rep a local business that's got our back.

This link has all the details for how it works: https://app.localhustle.org/business-onboard?ref=${athleteId}

Thanks either way!

– ${profile?.email.split('@')[0] || 'me'}
${profile?.school || 'our local high school'} ${profile?.sport || 'varsity athlete'}`

    if (navigator.share) {
      navigator.share({
        title: 'LocalHustle Sponsorship',
        text: letterText,
      }).catch(() => {
        copyLetter()
      })
    } else {
      copyLetter()
    }
  }

  const searchGigs = () => {
    if (!gigSearch.trim()) {
      setSearchedOffers(offers)
      return
    }

    const lower = gigSearch.toLowerCase()
    const filtered = offers.filter((o: any) => 
      o.type.toLowerCase().includes(lower) ||
      o.description.toLowerCase().includes(lower) ||
      o.location?.toLowerCase().includes(lower)
    )
    setSearchedOffers(filtered)
  }

  const inviteFriend = async () => {
    if (!friendEmail || !friendChallenge) {
      alert('Please enter friend email and challenge')
      return
    }

    const response = await fetch('/api/invite-friend-athlete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        friend_email: friendEmail,
        friend_name: friendName,
        challenge_description: friendChallenge,
        amount: parseFloat(friendAmount),
        athlete_id: profile.id,
      }),
    })

    const data = await response.json()

    if (data.error) {
      alert('Error: ' + data.error)
    } else {
      alert('Friend invited!')
      setShowFundFriend(false)
      setFriendEmail('')
      setFriendName('')
      setFriendChallenge('')
      setFriendAmount('50')
    }
  }

  const handleAddDebitCard = async () => {
  if (!stripe || !elements) {
    setPaymentError('Stripe not loaded')
    return
  }

  if (!cardReady) {
    setPaymentError('Card field loading — wait a second')
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

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    setPaymentError('Not authenticated')
    setPaymentLoading(false)
    return
  }

  // Save token directly to athlete profile
  const { error: dbError } = await supabase
    .from('profiles')
    .update({ debit_card_token: paymentMethod.id })
    .eq('id', user.id)  // or 'owner_id' if different

  if (dbError) {
    console.error('DB Error:', dbError)
    setPaymentError('Failed to save card — try again')
    setPaymentLoading(false)
    return
  }

  // Success — update local state to show saved card
  setPaymentSuccess(true)
  setSavedMethods([{
    id: paymentMethod.id,
    brand: paymentMethod.card?.brand,
    last4: paymentMethod.card?.last4,
    exp_month: paymentMethod.card?.exp_month,
    exp_year: paymentMethod.card?.exp_year,
  }])
  setTimeout(() => setPaymentSuccess(false), 5000)
  setPaymentLoading(false)
}

  if (!profile) return <p className="container text-center py-32">Loading...</p>

  return (
    <div className="container py-8 relative">
      <p className="text-center mb-12 text-xl font-mono">Welcome, {profile.email}</p>

      <div className="bg-black text-white p-8 mb-12">
        <h1 className="text-3xl font-bold text-center">
          Your Athlete Dashboard
        </h1>
      </div>

      <div className="bg-black text-white p-8 mb-12">
        <p className="text-lg leading-relaxed text-center max-w-3xl mx-auto">
          Businesses struggle with social media — you are the answer.<br />
          Pitch businesses, claim gigs, build your squad and earn together.
        </p>
      </div>

      {/* Progress Meter */}
      <div className="max-w-3xl mx-auto mb-16 p-12 bg-gray-100 border-4 border-black">
        <h2 className="text-3xl font-bold mb-8 text-center">
          Your Progress to Big Rewards
        </h2>
        <div className="bg-gray-200 h-12 border-4 border-black relative mb-8">
          <div 
            className="bg-green-500 h-full transition-all"
            style={{ width: `${(gigCount / 8) * 100}%` }}
          />
          <div className="absolute inset-0 flex items-center justify-center text-2xl font-bold">
            {gigCount} / 8 Gigs
          </div>
        </div>
        <div className="flex justify-between text-lg">
          <span>4 gigs → Freedom Scholarship</span>
          <span>→ 8 gigs → Brand Deals</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto space-y-32 font-mono text-center text-lg">
        {/* Step 1: Complete Profile */}
        <div className="bg-green-100 p-8 border-4 border-green-600 rounded-lg">
          <h2 className="text-3xl font-bold mb-8">
            Step 1 — Complete Your Profile
          </h2>
          <p className="text-xl mb-12">
            Businesses see this — make it great!
          </p>
          <div className="max-w-2xl mx-auto bg-gray-100 p-8 border-4 border-black rounded-lg">
            <div className="mb-12">
              <div className="relative w-40 h-40 mx-auto rounded-full overflow-hidden border-4 border-black">
                {profilePic ? (
                  <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                    <p className="text-gray-600">Tap to Upload</p>
                  </div>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file || !profile) return

                  const fileExt = file.name.split('.').pop()
                  const fileName = `${profile.id}.${fileExt}`
                  const filePath = `${profile.id}/${fileName}`

                  const { error: uploadError } = await supabase.storage
                    .from('profile-pics')
                    .upload(filePath, file, { upsert: true })

                  if (uploadError) {
                    alert('Upload failed: ' + uploadError.message)
                    return
                  }

                  const { data: urlData } = supabase.storage
                    .from('profile-pics')
                    .getPublicUrl(filePath)

                  setProfilePic(urlData.publicUrl)

                  await supabase
                    .from('profiles')
                    .update({ profile_pic: urlData.publicUrl })
                    .eq('id', profile.id)
                }}
                className="hidden"
                id="photo-upload"
              />
              <label htmlFor="photo-upload" className="block mt-4">
                <div className="px-8 py-4 bg-black text-white text-center cursor-pointer font-bold text-lg">
                  Upload Photo
                </div>
              </label>
            </div>

            <div className="mb-8">
  <label className="block text-lg mb-2">Name</label>
  <Input 
    placeholder="Your Name" 
    value={profile?.full_name || ''} 
    onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
    className="text-center" 
  />
</div>

<div className="mb-8">
  <label className="block text-lg mb-2">School</label>
  <Input 
    placeholder="Your School" 
    value={profile?.school || ''} 
    onChange={(e) => setProfile({ ...profile, school: e.target.value })}
    className="text-center" 
  />
</div>
            <div className="mb-8">
              <label className="block text-lg mb-2">Highlight Reel Link</label>
              <Input placeholder="YouTube / Hudl link" value={highlightLink} onChange={(e) => setHighlightLink(e.target.value)} className="text-center" />
            </div>

            <div className="mb-8">
              <label className="block text-lg mb-2">Total Social Followers</label>
              <Input placeholder="e.g., 5,000" value={socialFollowers} onChange={(e) => setSocialFollowers(e.target.value)} className="text-center" />
            </div>

            <div className="mb-12">
              <label className="block text-lg mb-2">Bio</label>
              <textarea
                placeholder="Short bio about you and your sport"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full p-4 text-lg border-4 border-black font-mono"
              />
            </div>

            <Button onClick={handleSaveProfile} className="w-full h-16 text-xl bg-black text-white">
              Save Profile
            </Button>
          </div>
        </div>

        {/* Step 2: Choose Gigs You Offer */}
<div className="bg-green-100 p-8 border-4 border-green-600 rounded-lg">
  <h2 className="text-3xl font-bold mb-8">
    Step 2 — Choose Gigs You Offer
  </h2>
  <p className="mb-12 text-xl">
    Select the gigs you're willing to do — businesses will see these.
  </p>
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
    {athleteGigTypes.map((gig) => {
      const isSelected = selectedGigs.includes(gig.title)
      const gigSlug = gig.title.toLowerCase().replace(' ', '-')

      const parentMessage = `Hey Mom/Dad! Can you sponsor my ${gig.title} challenge on LocalHustle? I'd earn real money if I complete it. Here's the link: https://app.localhustle.org/parent-onboard?kid_id=${profile?.id || 'fallback'}&gig=${gigSlug}`

      const businessMessage = `Hey! Can you sponsor my ${gig.title} gig on LocalHustle? I'd create ${gig.description.toLowerCase()} for your business. Link: https://app.localhustle.org/business-onboard?ref=${profile?.id || 'fallback'}&gig=${gigSlug}`

      const share = (message: string) => {
        if (navigator.share) {
          navigator.share({
            title: `Sponsor my ${gig.title} gig!`,
            text: message,
          }).catch(() => {
            navigator.clipboard.writeText(message)
            alert('Message copied!')
          })
        } else {
          navigator.clipboard.writeText(message)
          alert('Message copied!')
        }
      }

      return (
        <div key={gig.title} className="border-4 border-black p-8 bg-gray-100 hover:bg-gray-200 transition">
          <h3 className="text-2xl font-bold mb-4">{gig.title}</h3>
          <p className="mb-8">{gig.description}</p>
          <Button 
            onClick={() => toggleGigSelection(gig.title)}
            className="w-full h-16 text-xl bg-black text-white hover:bg-gray-800 mb-4"
          >
            {isSelected ? 'Selected ✓' : 'Select This Gig'}
          </Button>
          {isSelected && (
            <div className="space-y-4">
              <Button 
                onClick={() => share(parentMessage)}
                className="w-full h-16 text-xl bg-green-600 text-white"
              >
                Share with Parent
              </Button>
              <Button 
                onClick={() => share(businessMessage)}
                className="w-full h-16 text-xl bg-black text-white"
              >
                Share with Business
              </Button>
            </div>
          )}
        </div>
      )
    })}
  </div>
</div>

        {/* Step 3: Pitch Local Businesses */}
        <div className="bg-green-100 p-8 border-4 border-green-600 rounded-lg">
          <h2 className="text-3xl font-bold mb-8">
            Step 3 — Pitch Local Businesses
          </h2>
          <p className="mb-8 text-xl">
            Click the button below to reveal your personalized pitch letter — copy or share it with your favorite local spots!
          </p>
          <Button 
            onClick={() => setShowPitchLetter(!showPitchLetter)}
            className="w-full max-w-md h-16 text-xl bg-black text-white mb-8"
          >
            {showPitchLetter ? 'Hide Pitch Letter' : 'Show Pitch Letter'}
          </Button>
          {showPitchLetter && (
            <div className="bg-gray-100 p-8 border-4 border-black mb-8 max-w-4xl mx-auto">
              <pre className="text-left whitespace-pre-wrap text-base">
                {`Hey [Business Name],

I've been coming to [Your Spot] for years before and after practice.

Our team has joined a new app that helps us get community support for our athletic journey. I'm reaching out to my favorite spots to see if you would consider a sponsorship.

Here's what you would get: a short thank-you clip from me about your place. You can use the clip for social media if you want.

I'd probably get some new shoes or gear and be set for our roadtrips. It means a lot for me and the team and I'd love to rep a local business that's got our back.

This link has all the details for how it works: https://app.localhustle.org/business-onboard?ref=${profile.id || 'fallback-id'}

Thanks either way!

– ${profile?.email.split('@')[0] || 'me'}
${profile?.school || 'our local high school'} ${profile?.sport || 'varsity athlete'}`}
              </pre>
              <div className="flex flex-col gap-4 max-w-md mx-auto mt-8">
                <Button onClick={shareLetter} className="h-16 text-xl bg-black text-white">
                  Share Letter
                </Button>
                <Button onClick={copyLetter} variant="outline" className="h-16 text-xl border-4 border-black">
                  Copy Letter
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Available Gigs */}
        <div>
          <h2 className="text-3xl font-bold mb-12">Available Gigs</h2>
          <div className="mb-12">
            <h3 className="text-2xl mb-8 font-bold">Find Gigs</h3>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <Input 
                placeholder="Search gigs (type, location, school)"
                value={gigSearch}
                onChange={(e) => setGigSearch(e.target.value)}
                className="text-center"
              />
              <Button onClick={searchGigs} className="h-14 text-lg bg-black text-white">
                Search
              </Button>
            </div>
          </div>
          {searchedOffers.length === 0 ? (
            <p className="text-gray-600 mb-12 text-xl">No gigs matching search — try different terms!</p>
          ) : (
            <div className="space-y-16">
              {searchedOffers.map((offer) => (
                <div key={offer.id} className="border-4 border-black p-8 bg-gray-100 max-w-lg mx-auto">
                  <p className="font-bold text-2xl mb-6">{offer.type.toUpperCase()} — ${offer.amount}</p>
                  <p className="mb-8">{offer.description}</p>
                  <Button 
                    onClick={() => router.push(`/claim/${offer.id}`)}
                    className="w-full h-16 text-xl bg-black text-white"
                  >
                    Claim Gig
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

                    {/* Debit Card Entry — Spacious, Clean, Thin Border on Card Field */}
            <div className="max-w-2xl mx-auto py-20">
              <div className="bg-white p-16 border-4 border-black rounded-lg shadow-2xl">
                <h3 className="text-4xl font-bold mb-12 text-center font-mono">Add Your Debit Card</h3>
                <p className="text-xl mb-20 text-center text-gray-600 font-mono">
                  For instant payouts when you complete gigs.<br />
                  Secure by Stripe — your card details are safe and encrypted.
                </p>

                <Elements stripe={stripePromise}>
                  <div className="space-y-20">
                    {/* Card Number Field — Full Width, Thin Border, Spacious */}
                    <div className="bg-gray-50 p-10 border-2 border-gray-400 rounded-lg"> {/* Thin border */}
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
                            },
                          },
                        }}
                      />
                    </div>

                    {paymentError && <p className="text-red-600 text-center text-2xl font-mono">{paymentError}</p>}
                    {paymentSuccess && <p className="text-green-600 text-center text-2xl font-mono">Card saved!</p>}

                    <Button
                      onClick={handleAddDebitCard}
                      disabled={paymentLoading || !cardReady}
                      className="w-full h-20 text-3xl bg-black text-white font-bold font-mono"
                    >
                      {paymentLoading ? 'Saving...' : 'Save Debit Card'}
                    </Button>
                  </div>
                </Elements>
              </div>
            </div>

    {/* Saved Cards */}
    {savedMethods.length > 0 && (
      <div className="mt-16">
        <h4 className="text-2xl font-bold mb-8 text-center">Saved Debit Cards</h4>
        <div className="space-y-8 max-w-2xl mx-auto">
          {savedMethods.map((method) => (
            <div key={method.id} className="bg-white p-8 border-4 border-black rounded-lg">
              <p className="text-xl">
                {method.brand.toUpperCase()} •••• {method.last4}<br />
                Expires {method.exp_month}/{method.exp_year}
              </p>
            </div>
          ))}
        </div>
      </div>
    )}
 

        {/* Your Earnings + Freedom Scholarships */}
<div className="max-w-2xl mx-auto bg-gray-100 p-8 border-4 border-black rounded-lg">
  <h2 className="text-3xl font-bold mb-8">Your Earnings</h2>
  <p className="text-xl mb-4">Total Earned: ${profile?.total_earnings?.toFixed(2) || '0.00'}</p>
  <p className="text-xl mb-8 text-green-600 font-bold">Freedom Scholarships Earned: ${profile?.scholarships_earned?.toFixed(2) || '0.00'}</p>
  <p className="text-lg mb-8">
    Freedom Scholarships are unrestricted cash paid instantly — use for books, food, rent — whatever you need.
  </p>

  {gigCount < 4 ? (
    <p className="text-xl text-center font-bold text-green-600">
      Complete 4 gigs to qualify for Freedom Scholarships!
    </p>
  ) : (
    <div className="bg-green-100 p-12 border-4 border-green-600 rounded-lg">
      <h3 className="text-2xl font-bold mb-4 text-center">
        You Qualify for a Freedom Scholarship!
      </h3>
      <p className="text-lg mb-8 text-center">
        Apply now — tell us your story in a quick message.
      </p>
      <textarea 
        placeholder="Why you deserve a Freedom Scholarship (short message about your hustle)"
        className="w-full p-4 text-lg border-4 border-black font-mono mb-6"
        rows={6}
      />
      <Button className="w-full h-16 text-xl bg-green-600 text-white font-bold mb-4">
        Submit Application
      </Button>
      <Button variant="outline" className="w-full h-16 text-xl border-4 border-black">
        Share Application Link
      </Button>
    </div>
  )}
</div>
        {/* Your Squad */}
        <div>
          <h2 className="text-3xl font-bold mb-8">Your Squad</h2>
          <div className="mb-8">
            <Button 
              onClick={() => router.push('/squad')}
              className="w-full max-w-md h-16 text-xl bg-black text-white"
            >
              Build a Squad and Earn with Friends
            </Button>
          </div>
          {squad.length === 0 ? (
            <p className="text-gray-600 mb-12">No squad members yet — share your link!</p>
          ) : (
            <div className="space-y-8 max-w-2xl mx-auto">
              {squad.map((member) => (
                <div key={member.id} className="border-2 border-black p-8 bg-gray-100">
                  <p className="font-bold">{member.email}</p>
                  <p className="text-sm">Joined: {new Date(member.created_at).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Ambassador */}
        <div>
          <h2 className="text-3xl font-bold mb-8">Become an Ambassador</h2>
          <p className="mb-8 text-xl">
            Earn $100 + 5% commissions by bringing local businesses to LocalHustle.
          </p>
          <Button 
            onClick={() => router.push('/ambassador')}
            className="w-full max-w-md h-16 text-xl bg-black text-white"
          >
            View Ambassador Opportunity
          </Button>
        </div>

        {/* Land National Brand Deals CTA */}
        <div className="my-16">
          <Button 
            onClick={() => router.push('/brand-deals')}
            className="w-full max-w-2xl h-24 text-3xl bg-green-400 text-black font-bold"
          >
            Land National Brand Deals
          </Button>
        </div>
      </div>

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
  )
}

export default function AthleteDashboard() {
  return (
    <Elements stripe={stripePromise}>
      <Suspense fallback={<p className="container text-center py-32">Loading Stripe...</p>}>
        <AthleteDashboardContent />
      </Suspense>
    </Elements>
  )
}