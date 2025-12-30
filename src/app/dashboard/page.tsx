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

const athleteGigTypes = [
  { title: 'ShoutOut', description: 'Visit a favorite business and make a quick shoutout 15-sec reel about what you like or your favorite order.' },
  { title: 'Youth Clinic', description: 'Run 30–60 min sessions for younger athletes (with teammates).' },
  { title: 'Cameo', description: 'Custom 15-Sec Video for Younger Athletes (birthdays, pre-game pep talks).' },
  { title: 'Player Training', description: 'Varsity athlete 40-minute training with young player.' },
  { title: 'Challenge', description: 'Fun competitions — HORSE, PIG, free throws, accuracy toss. Base pay for clip, bonus if you win.' },
  { title: 'Custom Gig', description: 'Create a gig and offer it.' },
]

const businessGigTypes = [
  { title: 'ShoutOut', baseAmount: 50, description: 'Visit a favorite business and make a quick shoutout 15-sec reel about what you like or your favorite order.' },
  { title: 'Youth Clinic', baseAmount: 500, description: 'Run 30–60 min sessions for younger athletes (with teammates).' },
  { title: 'Team Sponsor', baseAmount: 1000, description: 'Business sponsors team meals/gear — money split equally.' },
  { title: 'Cameo', baseAmount: 50, description: 'Custom 15-Sec Video for Younger Athletes (birthdays, pre-game pep talks).' },
  { title: 'Player Training', baseAmount: 100, description: 'Varsity athlete 40-minute training with young player.' },
  { title: 'Challenge', baseAmount: 75, description: 'Fun competitions — HORSE, PIG, free throws, accuracy toss. Base pay for clip, bonus if you win.' },
  { title: 'Custom Gig', baseAmount: 200, description: 'Create a gig and offer it.' },
]

export default function Dashboard() {
  const [profile, setProfile] = useState<any>(null)
  const [business, setBusiness] = useState<any>(null)
  const [offers, setOffers] = useState<any[]>([])
  const [pendingClips, setPendingClips] = useState<any[]>([])
  const [selectedGigs, setSelectedGigs] = useState<string[]>([])
  const [squad, setSquad] = useState<any[]>([])
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
  const [profilePic, setProfilePic] = useState('')
  const [highlightLink, setHighlightLink] = useState('')
  const [socialFollowers, setSocialFollowers] = useState('')
  const [bio, setBio] = useState('')
  const [showFundFriend, setShowFundFriend] = useState(false)
  const [friendEmail, setFriendEmail] = useState('')
  const [friendName, setFriendName] = useState('')
  const [friendChallenge, setFriendChallenge] = useState('')
  const [friendAmount, setFriendAmount] = useState('50')
  const [showPitchLetter, setShowPitchLetter] = useState(false)
  const [gigSearch, setGigSearch] = useState('')
  const [searchedOffers, setSearchedOffers] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'wallet' | 'clips' | 'kids' | 'favorites' | 'payment-methods' | 'booster'>('wallet')
  const [savedMethods, setSavedMethods] = useState<any[]>([])
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [completedGigs, setCompletedGigs] = useState(0)
  const router = useRouter()
  

  useEffect(() => {
  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.replace('/')
      return
    }

    // Check for force business view from business-onboard
    const urlParams = new URLSearchParams(window.location.search)
    const forceBusiness = urlParams.get('view') === 'business'

    let prof = null
    const { data: existingProf } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (existingProf) {
      prof = existingProf
    } else {
      // New user — default to athlete unless forced
      const metadataRole = user.user_metadata?.role || 'athlete'
      const { data: newProf } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email,
          role: forceBusiness ? 'business' : metadataRole,
        })
        .select()
        .single()
      prof = newProf
    }

    // Force business role if coming from business-onboard
    if (forceBusiness && prof.role !== 'business') {
      await supabase
        .from('profiles')
        .update({ role: 'business' })
        .eq('id', user.id)

      // Refresh profile
      const { data: updatedProf } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      prof = updatedProf
    }

    setProfile(prof)

    if (prof.role === 'athlete') {
      if (prof.selected_gigs) setSelectedGigs(prof.selected_gigs)
      setProfilePic(prof.profile_pic || '')
      setHighlightLink(prof.highlight_link || '')
      setSocialFollowers(prof.social_followers || '')
      setBio(prof.bio || '')

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
      
      const { count } = await supabase
        .from('clips')
        .select('id', { count: 'exact' })
        .eq('athlete_id', user.id)
        .eq('status', 'approved')

      setCompletedGigs(count || 0)
    }

    if (prof.role === 'business') {
      const { data: biz } = await supabase
        .from('businesses')
        .select('*')
        .eq('owner_id', user.id)
        .single()
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

      // Fetch saved payment methods when business loads
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
  }

  fetchData()
}, [router])

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
  
  const handleGigSearch = () => {
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

    setShowFundFriend(true)
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

  const handleFundFriend = async () => {
    if (!friendEmail || !friendChallenge || !friendAmount) {
      alert('Please fill all fields')
      return
    }

    const amountNum = parseFloat(friendAmount)
    if (isNaN(amountNum) || amountNum <= 0) {
      alert('Invalid amount')
      return
    }

    const response = await fetch('/api/invite-friend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        friend_email: friendEmail,
        friend_name: friendName,
        challenge_description: friendChallenge,
        amount: amountNum,
        business_id: business.id,
      }),
    })

    const data = await response.json()

    if (data.error) {
      alert('Error: ' + data.error)
    } else {
      alert(`Challenge funded and invite sent to ${friendEmail}!`)
      setShowFundFriend(false)
      setFriendEmail('')
      setFriendName('')
      setFriendChallenge('')
      setFriendAmount('50')
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

    // @ts-ignore
    const { error } = await stripe.redirectToCheckout({ sessionId: id })

    if (error) {
      alert(error.message)
    }
  }

  const handleAddCard = async () => {
  const stripe = useStripe()
  const elements = useElements()

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

  const fetchSavedMethods = async () => {
    if (!business) return

    const response = await fetch('/api/list-payment-methods', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ business_id: business.id }),
    })

    const data = await response.json()

    if (data.methods) {
      setSavedMethods(data.methods)
    }
  }

  useEffect(() => {
    if (business && activeTab === 'payment-methods') {
      fetchSavedMethods()
    }
  }, [business, activeTab])

  if (!profile) return <p className="container text-center py-32">Loading...</p>

  return (
    <div className="container py-8">
      <p className="text-center mb-12 text-xl font-mono">Welcome, {profile.email}</p>

      <div className="bg-black text-white p-8 mb-12">
        <h1 className="text-3xl font-bold">
          {profile.role === 'athlete' ? 'Your Athlete Dashboard' : 'Your Business Admin Console'}
        </h1>
      </div>

      <div className="bg-black text-white p-8 mb-12">
        <p className="text-lg leading-relaxed">
          {profile.role === 'athlete' ? 'Pitch businesses, claim gigs, build your squad and earn together.' : 'Post gigs to get authentic content. Review clips — only approve what you love. Become the hometown hero.'}
        </p>
      </div>

      {profile.role === 'athlete' ? (
  <div className="max-w-4xl mx-auto space-y-32 font-mono text-center text-lg">
    {/* Qualification Progress Meter — Top of Athlete Dashboard */}
    <div className="bg-gray-100 p-12 border-4 border-black mb-16">
      <h2 className="text-3xl font-bold mb-8">
        Your Path to Bigger Opportunities
      </h2>

      <div className="max-w-2xl mx-auto">
        {/* Progress Bar */}
        <div className="relative h-16 bg-gray-300 border-4 border-black mb-8 overflow-hidden">
          <div 
            className="absolute h-full bg-green-600 transition-all duration-500"
            style={{ width: `${Math.min((completedGigs / 8) * 100, 100)}%` }}
          />
          <p className="absolute inset-0 flex items-center justify-center text-2xl font-bold">
            {completedGigs} / 8 Gigs Completed
          </p>
        </div>

        {/* Milestones */}
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
{/* First-Time Athlete Setup Banner */}
{profile?.role === 'athlete' && (
  <div className="bg-blue-100 p-12 border-4 border-blue-600 mb-16 rounded-lg">
    <h3 className="text-3xl font-bold mb-8 text-center">
      Complete 3 Steps to Start Earning
    </h3>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
      {/* Step 1: Profile Photo + Bio */}
      <div className={`text-center p-6 border-4 rounded-lg ${profilePic && bio ? 'bg-green-100 border-green-600' : 'bg-gray-100 border-black'}`}>
        <p className="text-xl font-bold mb-2">
          {profilePic && bio ? 'Complete!' : 'Step 1'}
        </p>
        <p className="text-lg">Complete Your Profile</p>
        {!(profilePic && bio) && (
          <p className="text-sm mt-2 text-gray-600">
            Photo + bio help businesses choose you
          </p>
        )}
      </div>

      {/* Step 2: Select Gigs */}
      <div className={`text-center p-6 border-4 rounded-lg ${selectedGigs.length > 0 ? 'bg-green-100 border-green-600' : 'bg-gray-100 border-black'}`}>
        <p className="text-xl font-bold mb-2">
          {selectedGigs.length > 0 ? 'Complete!' : 'Step 2'}
        </p>
        <p className="text-lg">Choose Gigs You Offer</p>
        {selectedGigs.length === 0 ? (
          <p className="text-sm mt-2 text-gray-600">
            Businesses need to know what you'll do
          </p>
        ) : (
          <p className="text-sm mt-2 text-gray-600">
            {selectedGigs.length} gig{selectedGigs.length > 1 ? 's' : ''} selected
          </p>
        )}
      </div>

      {/* Step 3: Payout Method */}
      <div className={`text-center p-6 border-4 rounded-lg ${profile.payout_method_setup ? 'bg-green-100 border-green-600' : 'bg-gray-100 border-black'}`}>
        <p className="text-xl font-bold mb-2">
          {profile.payout_method_setup ? 'Complete!' : 'Step 3'}
        </p>
        <p className="text-lg">Add Debit Card</p>
        {!profile.payout_method_setup ? (
          <>
            <p className="text-sm mt-2 text-gray-600">
              Required for instant payouts
            </p>
            <Button 
              onClick={() => router.push('/payout-setup')}
              className="mt-4 w-full h-14 text-lg bg-black text-white"
            >
              Add Card
            </Button>
          </>
        ) : (
          <p className="text-sm mt-2 text-gray-600">
            Payouts enabled
          </p>
        )}
      </div>
    </div>

    {/* All Complete Message */}
    {(profilePic && bio && selectedGigs.length > 0 && profile.payout_method_setup) && (
      <p className="text-2xl text-center mt-12 text-green-600 font-bold">
        All steps complete — you're ready to earn!
      </p>
    )}
  </div>
)}
    {/* Step 1: Complete Profile */}
    <div className="bg-green-100 p-8 border-4 border-green-600 rounded-lg">
      <h2 className="text-3xl font-bold mb-8">
        Step 1 — Complete Your Profile
      </h2>
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
                <Input placeholder="Your Name" value={profile?.full_name || ''} disabled className="text-center" />
              </div>

              <div className="mb-8">
                <label className="block text-lg mb-2">School</label>
                <Input placeholder="Your School" value={profile?.school || ''} disabled className="text-center" />
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
              {athleteGigTypes.map((gig) => (
                <div key={gig.title} className="border-4 border-black p-8 bg-gray-100">
                  <h3 className="text-2xl font-bold mb-4">{gig.title}</h3>
                  <p className="mb-8">{gig.description}</p>
                  <Button 
                    onClick={() => toggleGigSelection(gig.title)}
                    className="w-full h-16 text-xl bg-black text-white hover:bg-gray-800"
                  >
                    {selectedGigs.includes(gig.title) ? 'Selected ✓' : 'Select This Gig'}
                  </Button>
                  <div className="border-t-4 border-black mt-8"></div>
                </div>
              ))}
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
              <div className="bg-gray-100 p-8 border-4 border-black mb-8 max-w-3xl mx-auto">
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
                <Button onClick={handleGigSearch} className="h-14 text-lg bg-black text-white">
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

          {/* Your Earnings + Freedom Scholarships */}
          <div className="max-w-2xl mx-auto bg-gray-100 p-8 border-4 border-black rounded-lg">
            <h2 className="text-3xl font-bold mb-8">Your Earnings</h2>
            <p className="text-xl mb-4">Total Earned: $125</p>
            <p className="text-xl mb-8 text-green-600 font-bold">Freedom Scholarships Earned: $500</p>
            <p className="text-lg mb-8">
              Freedom Scholarships are unrestricted cash paid instantly — use for books, food, rent — whatever you need.
            </p>
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
        
      ) : (
  <div className="max-w-5xl mx-auto">
    {/* Business Tabs — Sticky */}
    <div className="sticky top-0 bg-white z-10 border-b-4 border-black pb-6 mb-12">
      <div className="flex flex-wrap justify-center gap-4">
        <Button
          onClick={() => setActiveTab('wallet')}
          variant={activeTab === 'wallet' ? 'default' : 'outline'}
          className="px-8 py-4 text-xl min-w-48"
        >
          Wallet
        </Button>
        <Button
          onClick={() => setActiveTab('gigs')}
          variant={activeTab === 'gigs' ? 'default' : 'outline'}
          className="px-8 py-4 text-xl min-w-48"
        >
          Create Gigs
        </Button>
        <Button
          onClick={() => setActiveTab('clips')}
          variant={activeTab === 'clips' ? 'default' : 'outline'}
          className="px-8 py-4 text-xl min-w-48"
        >
          Pending Clips
        </Button>
        <Button
          onClick={() => setActiveTab('kids')}
          variant={activeTab === 'kids' ? 'default' : 'outline'}
          className="px-8 py-4 text-xl min-w-48"
        >
          My Kid's Challenges
        </Button>
        <Button
          onClick={() => setActiveTab('favorites')}
          variant={activeTab === 'favorites' ? 'default' : 'outline'}
          className="px-8 py-4 text-xl min-w-48"
        >
          Favorite Athletes
        </Button>
        <Button
          onClick={() => setActiveTab('scholarships')}
          variant={activeTab === 'scholarships' ? 'default' : 'outline'}
          className="px-8 py-4 text-xl min-w-48"
        >
          Freedom Scholarships
        </Button>
        <Button
          onClick={() => setActiveTab('booster')}
          variant={activeTab === 'booster' ? 'default' : 'outline'}
          className="px-8 py-4 text-xl min-w-48"
        >
          Booster Events
        </Button>
      </div>
    </div>

    {/* Tab Content — Directly Below Tabs */}
    <div className="space-y-24">

      {/* Wallet Tab — Payment Methods Inside */}
      {activeTab === 'wallet' && (
        <div>
          <h2 className="text-4xl font-bold mb-8">Wallet</h2>
          <p className="text-3xl mb-12">
            Balance: ${business?.wallet_balance?.toFixed(2) || '0.00'}
          </p>

          {/* Auto-Top-Up — Smaller & Centered */}
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

          {/* Add Funds — Card Entry */}
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

      {/* Create Gigs Tab — Redesigned */}
      {activeTab === 'gigs' && (
        <div>
          <h2 className="text-4xl font-bold mb-12">Create a Gig</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-5xl mx-auto">
            {businessGigTypes.map((gig) => (
              <div key={gig.title} className="border-4 border-black bg-gray-100">
                <button
                  onClick={() => handleGigSelect(gig)}
                  className="w-full p-12 hover:bg-gray-200 transition text-center"
                >
                  <h3 className="text-3xl font-bold mb-4">{gig.title}</h3>
                  <p className="text-2xl mb-6">${gig.baseAmount}+</p>
                  <p className="text-lg leading-relaxed">{gig.description}</p>
                </button>

                {selectedGig?.title === gig.title && (
                  <div className="p-12 border-t-4 border-black space-y-8">
                    <div>
                      <label className="block text-xl mb-2">Number of Athletes</label>
                      <select
                        value={numAthletes}
                        onChange={(e) => handleAthletesChange(Number(e.target.value))}
                        className="w-full p-4 text-lg border-4 border-black"
                      >
                        {[1,2,3,4,5,6,7,8,9,10].map(n => (
                          <option key={n} value={n}>{n} athlete{n > 1 ? 's' : ''}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xl mb-2">Date</label>
                      <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full" />
                    </div>

                    <div>
                      <label className="block text-xl mb-2">Location</label>
                      <Input value={location} onChange={(e) => setLocation(e.target.value)} className="w-full" />
                    </div>

                    <div>
                      <label className="block text-xl mb-2">Your Phone</label>
                      <Input value={businessPhone} onChange={(e) => setBusinessPhone(e.target.value)} className="w-full" />
                    </div>

                    <div className="flex justify-center">
                      <label className="flex items-center gap-4 text-xl">
                        <input 
                          type="checkbox" 
                          checked={isRecurring} 
                          onChange={(e) => setIsRecurring(e.target.checked)}
                          className="w-6 h-6"
                        />
                        Make recurring monthly
                      </label>
                    </div>

                    <div>
                      <label className="block text-xl mb-2">Offer Amount</label>
                      <Input value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full" />
                    </div>

                    <div>
                      <label className="block text-xl mb-2">Freedom Scholarship (Optional)</label>
                      <Input value={scholarshipAmount} onChange={(e) => setScholarshipAmount(e.target.value)} className="w-full" />
                    </div>

                    <div>
                      <label className="block text-xl mb-2">Custom Details</label>
                      <textarea 
                        value={customDetails} 
                        onChange={(e) => setCustomDetails(e.target.value)} 
                        className="w-full p-4 border-4 border-black font-mono"
                        rows={6}
                      />
                    </div>

                    <Button onClick={handlePost} className="w-full h-20 text-2xl bg-green-400 text-black">
                      Fund & Post Offer
                    </Button>
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
          <h2 className="text-4xl font-bold mb-12">Pending Clips to Review</h2>
          {pendingClips.length === 0 ? (
            <p className="text-xl">No pending clips — post offers to get started!</p>
          ) : (
            <div className="space-y-16">
              {pendingClips.map((clip) => (
                <div key={clip.id} className="border-4 border-black p-8 bg-white max-w-3xl mx-auto">
                  <p className="font-bold mb-4 text-left">From: {clip.profiles.email}</p>
                  <p className="mb-6 text-left">Offer: {clip.offers.type} — ${clip.offers.amount}</p>
                  <video controls className="w-full mb-8">
                    <source src={clip.video_url} type="video/mp4" />
                  </video>
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
          <h2 className="text-4xl font-bold mb-12">My Kid's Challenges</h2>
          <div className="space-y-8 max-w-2xl mx-auto">
            {referredAthletes.length === 0 ? (
              <p className="text-xl">No referred athletes yet — wait for kids to pitch you!</p>
            ) : (
              referredAthletes.map((kid) => (
                <div key={kid.id} className="border-4 border-black p-8 bg-gray-100">
                  <p className="font-bold text-2xl mb-4">{kid.full_name || kid.email}</p>
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
          <h2 className="text-4xl font-bold mb-12">Favorite Athletes</h2>
          <p className="text-xl mb-8">
            Quick access to athletes you like — re-fund gigs easily.
          </p>
          <p className="text-gray-600 mb-12">
            No favorites yet — add from clips or kids.
          </p>
        </div>
      )}

      {/* Freedom Scholarships Tab */}
      {activeTab === 'scholarships' && (
        <div>
          <h2 className="text-4xl font-bold mb-12">Freedom Scholarships</h2>
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
          <h2 className="text-4xl font-bold mb-12">Booster Events</h2>
          <p className="text-xl mb-8">
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