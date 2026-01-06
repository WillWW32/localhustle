'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { signOut } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { loadStripe } from '@stripe/stripe-js'
import { useStripe, useElements } from '@stripe/react-stripe-js'
import dynamic from 'next/dynamic'
import { getGigsInRadius } from '@/lib/geo'

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
  const [editingProfile, setEditingProfile] = useState(false)
  const [offers, setOffers] = useState<any[]>([])
  const [selectedGigs, setSelectedGigs] = useState<string[]>([])
  const [squad, setSquad] = useState<any[]>([])
  const [profilePic, setProfilePic] = useState('')
  const [highlightLink, setHighlightLink] = useState('')
  const [socialFollowers, setSocialFollowers] = useState('')
  const [bio, setBio] = useState('')
  const [showPitchLetter, setShowPitchLetter] = useState(false)
  const [gigSearch, setGigSearch] = useState('')
  const [availableGigs, setAvailableGigs] = useState<any[]>([])
  const [searchedOffers, setSearchedOffers] = useState<any[]>([])
  const [gigCount, setGigCount] = useState(0)
  const [myGigs, setMyGigs] = useState<any[]>([])
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
  const [showVideoRecorder, setShowVideoRecorder] = useState(false)
  const [selectedOffer, setSelectedOffer] = useState<any>(null)
  const [recording, setRecording] = useState(false)
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null)
  const [videoUrl, setVideoUrl] = useState('')
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [showPWAInstall, setShowPWAInstall] = useState(false)
  const [localGigs, setLocalGigs] = useState<any[]>([])
  const [quickSponsorKid, setQuickSponsorKid] = useState<any>(null)
  const searchParams = useSearchParams()
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

      if (prof.debit_card_token) {
        setSavedMethods([{
          id: prof.debit_card_token,
          brand: prof.card_brand || 'Card',
          last4: prof.card_last4 || '••••',
          exp_month: prof.card_exp_month,
          exp_year: prof.card_exp_year,
        }])
      }
      
      // After setting profile
if (profile.lat && profile.lng) {
  const localGigs = await getGigsInRadius(profile.lat, profile.lng, 60)
  setLocalGigs(localGigs)
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
  if (!profile.school) {
    alert('School is required for local gigs')
    return
  }

  setPaymentLoading(true)  // reuse loading state or add new
  
  const invitedBy = searchParams.get('invited_by')
if (invitedBy) {
  const { data } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', invitedBy)
    .single()

  if (data) setQuickSponsorKid(data)
}

  // Geocode school name (add state if you have it for better accuracy)
  const address = `${profile.school}, ${profile.state}`

  const geoResponse = await fetch('/api/geocode', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address }),
  })
  
  let geoData = null
  if (geoResponse.ok) {
    geoData = await geoResponse.json()
  } else {
    console.error('Geocode failed')
    // Optional: fallback or alert
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      profile_pic: profilePic,
      highlight_link: highlightLink,
      social_followers: socialFollowers,
      bio: bio,
      lat: geoData?.lat || null,
      lng: geoData?.lng || null,
      zip_code: geoData?.zip || null,
    })
    .eq('id', profile.id)

  if (error) {
    alert('Error saving profile: ' + error.message)
  } else {
    alert('Profile saved with location!')
  }

  setPaymentLoading(false)
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

  const cardElement = (elements as any).getElement(CardElement) || (elements as any).getElement('card')

  if (!cardElement) {
    setPaymentError('Card element not found — please refresh and try again')
    setPaymentLoading(false)
    return
  }

  const { error: stripeError, paymentMethod } = await stripe.createPaymentMethod({
    type: 'card',
    card: cardElement,  // ← instance, not the component
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
    .update({
      debit_card_token: paymentMethod.id,
      card_brand: paymentMethod.card?.brand,
      card_last4: paymentMethod.card?.last4,
      card_exp_month: paymentMethod.card?.exp_month,
      card_exp_year: paymentMethod.card?.exp_year,
    })
    .eq('id', user.id)

  if (dbError) {
    console.error('DB Error:', dbError)
    setPaymentError('Failed to save card — try again')
    setPaymentLoading(false)
    return
  }

  // Success — update local state
  setPaymentSuccess(true)
  setSavedMethods([{
    id: paymentMethod.id,
    brand: paymentMethod.card?.brand || 'Card',
    last4: paymentMethod.card?.last4 || '••••',
    exp_month: paymentMethod.card?.exp_month,
    exp_year: paymentMethod.card?.exp_year,
  }])
  setTimeout(() => setPaymentSuccess(false), 5000)
  setPaymentLoading(false)
}

const selectGig = (gig: string) => {
    const newSelected = [...selectedGigs, gig]
    setSelectedGigs(newSelected)
    supabase
      .from('profiles')
      .update({ selected_gigs: newSelected })
      .eq('id', profile.id)
  }

const loadMyGigs = async () => {
  const { data } = await supabase
    .from('offers')
    .select('*, businesses(name)')
    .eq('status', 'active')
    .eq('target_athlete_email', profile.email)  // ← Targeted to this athlete
  setOffers(data || [])
}

const claimGig = (offer: any) => {
  setSelectedOffer(offer)
  setShowVideoRecorder(true)
}

// Load available gigs
const loadAvailableGigs = async () => {
  const { data: openOffers } = await supabase
    .from('offers')
    .select('*, businesses(name)')
    .eq('status', 'active')

  setAvailableGigs(openOffers || [])
}
  
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      setMediaStream(stream)
      const recorder = new MediaRecorder(stream)
      setMediaRecorder(recorder)
      const chunks: Blob[] = []

      recorder.ondataavailable = (e) => chunks.push(e.data)
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' })
        setVideoBlob(blob)
        setVideoUrl(URL.createObjectURL(blob))
      }

      recorder.start()
      setRecording(true)
    } catch (err) {
      alert('Camera access denied')
    }
  }

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop()
      setRecording(false)
      mediaStream?.getTracks().forEach(track => track.stop())
    }
  }

  const submitClip = async () => {
    if (!videoBlob || !selectedOffer) return

    setPaymentLoading(true)

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('clips')
      .upload(`public/${profile.id}-${Date.now()}.webm`, videoBlob)

    if (uploadError) {
      alert('Upload error: ' + uploadError.message)
      setPaymentLoading(false)
      return
    }

    const { data: publicUrl } = supabase.storage
      .from('clips')
      .getPublicUrl(uploadData.path)

    const { error: insertError } = await supabase
      .from('clips')
      .insert({
        athlete_id: profile.id,
        offer_id: selectedOffer.id,
        video_url: publicUrl.publicUrl,
        status: 'pending',
      })

    if (insertError) {
      alert('Submit error: ' + insertError.message)
      setPaymentLoading(false)
      return
    }

    alert('Clip submitted! Waiting for approval.')

    // Notification to funder
    const { data: offer } = await supabase
      .from('offers')
      .select('business_id')
      .eq('id', selectedOffer.id)
      .single()

    if (offer?.business_id) {
      const { data: funder } = await supabase
        .from('businesses')
        .select('email')
        .eq('id', offer.business_id)
        .single()

      if (funder?.email) {
        console.log(`Notify ${funder.email}: New clip from ${profile.full_name}`)
        // Replace with Resend when ready
      }
    }

    setShowVideoRecorder(false)
    setVideoUrl('')
    setVideoBlob(null)
    setSelectedOffer(null)
    setPaymentLoading(false)
  }

  return (
    <div className="container py-8 relative">
      <p className="text-center mb-12 text-xl font-mono">Welcome, {profile.email}</p>

      <div className="bg-black text-white p-8 mb-12">
        <h1 className="text-3xl font-bold text-center">
          Your Athlete Dashboard
        </h1>
              
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
      
            {/* My Gigs — Targeted Gigs for This Athlete (Above Profile) */}
      <div className="mb-20">
        <h2 className="text-4xl font-bold mb-12 text-center font-mono">Gigs for You</h2>
        {myGigs.length === 0 ? (
          <p className="text-xl text-center text-gray-600 font-mono mb-12">
            No personal gigs yet — invite a parent or business to fund one for you!
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {myGigs.map((offer) => (
              <div key={offer.id} className="bg-white p-12 border-4 border-black rounded-lg shadow-2xl hover:shadow-3xl transition-all">
                <h3 className="text-3xl font-bold mb-6 font-mono">{offer.type}</h3>
                <p className="text-4xl font-bold mb-8 text-green-600">${offer.amount}</p>
                <p className="text-xl mb-8 font-mono">{offer.description}</p>
                <p className="text-lg mb-8 font-mono text-gray-600">From: {offer.businesses?.name || 'Your Sponsor'}</p>
                <Button
                  onClick={() => claimGig(offer)}
                  className="w-full h-20 text-2xl bg-black text-white font-bold font-mono"
                >
                  Claim This Gig
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
        
              {/* Step 1: Complete Your Profile */}
      <div className="max-w-2xl mx-auto mb-32 p-12 bg-white border-4 border-black rounded-lg">
        <h3 className="text-4xl font-bold mb-12 text-center font-mono">Step 1: Complete Your Profile</h3>

        {/* Read-Only View — When Profile is Complete */}
        {(profile?.full_name && profile?.school) && !editingProfile ? (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <p className="text-2xl font-mono">Full Name: {profile.full_name}</p>
              <button 
                onClick={() => setEditingProfile(true)}
                className="text-2xl text-gray-600 hover:text-black font-mono"
              >
                ✏️ Edit
              </button>
            </div>
            <p className="text-2xl font-mono">School: {profile.school}</p>
            {profile.profile_pic && (
              <div>
                <p className="text-xl font-mono mb-4">Profile Pic:</p>
                <img src={profile.profile_pic} alt="Profile" className="w-full max-w-md mx-auto border-4 border-black rounded-lg" />
              </div>
            )}
            {profile.highlight_link && (
              <p className="text-xl font-mono break-all">Highlight Link: {profile.highlight_link}</p>
            )}
            {profile.social_followers && (
              <p className="text-xl font-mono">Social Followers: {profile.social_followers}</p>
            )}
            {profile.bio && (
              <div>
                <p className="text-xl font-mono mb-4">Bio:</p>
                <p className="text-lg font-mono whitespace-pre-wrap">{profile.bio}</p>
              </div>
            )}
          </div>
        ) : (
          /* Edit Form — When Incomplete or Editing */
          <div className="space-y-10">
            <div>
              <label className="block text-xl mb-4 font-mono">Full Name</label>
              <Input
                value={profile?.full_name || ''}
                onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                placeholder="John Smith"
                className="h-16 text-xl font-mono"
              />
            </div>
            <div>
              <label className="block text-xl mb-4 font-mono">School</label>
              <Input
                value={profile?.school || ''}
                onChange={(e) => setProfile({ ...profile, school: e.target.value })}
                placeholder="Lincoln High School"
                className="h-16 text-xl font-mono"
              />
            </div>
            <div>
  <label className="block text-xl mb-4 font-mono">State</label>
  <Input
    value={profile?.state || ''}
    onChange={(e) => setProfile({ ...profile, state: e.target.value.toUpperCase() })}
    placeholder="CA"
    className="h-16 text-xl font-mono text-center"
    maxLength={2}
  />
</div>
            <div>
              <label className="block text-xl mb-4 font-mono">Profile Pic (tap to upload)</label>
              {profilePic ? (
                <div className="mb-8">
                  <img src={profilePic} alt="Preview" className="w-full max-w-md mx-auto border-4 border-black rounded-lg" />
                  <Button onClick={() => setProfilePic('')} className="mt-4 w-full h-16 text-xl bg-black text-white font-mono">
                    Remove Photo
                  </Button>
                </div>
              ) : (
                <Input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file) return

                    const { data, error } = await supabase.storage
                      .from('profile-pics')
                      .upload(`public/${profile.id}.jpg`, file, { upsert: true })

                    if (error) {
                      alert('Upload error')
                      return
                    }

                    const { data: urlData } = supabase.storage
                      .from('profile-pics')
                      .getPublicUrl(`public/${profile.id}.jpg`)

                    setProfilePic(urlData.publicUrl)
                  }}
                  className="w-full h-16 text-xl font-mono border-4 border-black"
                />
              )}
            </div>
            <div>
              <label className="block text-xl mb-4 font-mono">Highlight Link</label>
              <Input
                value={highlightLink}
                onChange={(e) => setHighlightLink(e.target.value)}
                placeholder="https://hudl.com/your-highlights"
                className="h-16 text-xl font-mono"
              />
            </div>
            <div>
              <label className="block text-xl mb-4 font-mono">Social Followers</label>
              <Input
                value={socialFollowers}
                onChange={(e) => setSocialFollowers(e.target.value)}
                placeholder="e.g., 5k IG followers"
                className="h-16 text-xl font-mono"
              />
            </div>
            <div>
              <label className="block text-xl mb-4 font-mono">Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full h-40 p-6 text-xl border-4 border-black font-mono bg-white"
                placeholder="Tell us about yourself..."
              />
            </div>
            <Button
              onClick={handleSaveProfile}
              className="w-full h-20 text-3xl bg-black text-white font-bold font-mono"
            >
              Save Profile & Continue
            </Button>
            {showPWAInstall && (
            <div className="mt-12 p-8 bg-black text-white border-4 border-white rounded-lg text-center">
                <p className="text-2xl mb-6 font-mono">
                Great! Now add LocalHustle to your Home Screen for quick access.
                </p>
                <p className="text-lg mb-8 text-gray-300 font-mono">
                iOS: Tap Share → Add to Home Screen<br />
                Android: Tap Menu → Add to Home Screen
                </p>
                    <Button 
                onClick={() => setShowPWAInstall(false)}
                className="w-full max-w-xs h-16 text-xl bg-white text-black font-bold font-mono"
                >
                Got it!
                </Button>
            </div>
            )}
          </div>
        )}
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

        {/* Available Gigs — Highlight First */}
      <div className="mb-20">
        <h2 className="text-4xl font-bold mb-12 text-center font-mono">Available Gigs</h2>
        {availableGigs.length === 0 ? (
          <p className="text-xl text-center text-gray-600 font-mono mb-12">
            No gigs available yet — check back soon or invite a parent/business!
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {availableGigs.map((offer) => (
              <div key={offer.id} className="bg-white p-12 border-4 border-black rounded-lg shadow-2xl hover:shadow-3xl transition-all">
                <h3 className="text-3xl font-bold mb-6 font-mono">{offer.type}</h3>
                <p className="text-4xl font-bold mb-8 text-green-600">${offer.amount}</p>
                <p className="text-xl mb-8 font-mono">{offer.description}</p>
                <p className="text-lg mb-8 font-mono text-gray-600">From: {offer.businesses?.name || 'Local Sponsor'}</p>
                <Button
                  onClick={() => claimGig(offer)}
                  className="w-full h-20 text-2xl bg-black text-white font-bold font-mono"
                >
                  Claim This Gig
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
            {/* Local Gigs — 60-Mile Radius */}
      <div className="mb-20">
        <h2 className="text-4xl font-bold mb-12 text-center font-mono">Local Gigs (60 Miles)</h2>
        {localGigs.length === 0 ? (
          <p className="text-xl text-center text-gray-600 font-mono mb-12">
            No local gigs yet — invite businesses in your area!
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {localGigs.map((offer) => (
              <div key={offer.id} className="bg-white p-12 border-4 border-black rounded-lg shadow-2xl">
                <h3 className="text-3xl font-bold mb-6 font-mono">{offer.type}</h3>
                <p className="text-4xl font-bold mb-8 text-green-600">${offer.amount}</p>
                <p className="text-xl mb-8 font-mono">{offer.description}</p>
                <p className="text-lg mb-8 font-mono text-gray-600">
                  From: {offer.businesses?.name || 'Local Sponsor'}
                </p>
                <Button
                  onClick={() => claimGig(offer)}
                  className="w-full h-20 text-2xl bg-black text-white font-bold font-mono"
                >
                  Claim This Gig
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

                    {/* Debit Card Entry — Spacious, Clean, Thin Border on Card Field */}
            <div className="max-w-2xl mx-auto py-20">
              <div className="bg-white p-16 border-4 border-black rounded-lg shadow-2xl">
                <h3 className="text-4xl font-bold mb-12 text-center font-mono">Add Your Debit Card - This is for you to receive payments - No charges will be made</h3>
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
      
      {/* Video Recorder Modal */}
      {showVideoRecorder && selectedOffer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-12 border-4 border-black rounded-lg max-w-3xl w-full">
            <h3 className="text-3xl font-bold mb-8 text-center font-mono">
              Record Clip for {selectedOffer.type}
            </h3>
            <p className="text-xl mb-8 text-center font-mono">
              ${selectedOffer.amount} gig from {selectedOffer.businesses?.name || 'Sponsor'}
            </p>

            <div className="mb-8">
              {recording ? (
                <video 
                  autoPlay 
                  muted 
                  playsInline 
                  ref={(video) => {
                    if (video && mediaStream) video.srcObject = mediaStream
                  }}
                  className="w-full border-4 border-black rounded-lg"
                />
              ) : videoUrl ? (
                <video controls src={videoUrl} className="w-full border-4 border-black rounded-lg" />
              ) : (
                <div className="bg-gray-200 border-4 border-dashed border-gray-400 rounded-lg h-64 flex items-center justify-center">
                  <p className="text-xl font-mono text-gray-600">Camera preview</p>
                </div>
              )}
            </div>

            <div className="space-y-6">
              {!recording && !videoUrl && (
                <Button onClick={startRecording} className="w-full h-20 text-3xl bg-black text-white font-bold font-mono">
                  Start Recording
                </Button>
              )}
              {recording && (
                <Button onClick={stopRecording} className="w-full h-20 text-3xl bg-red-600 text-white font-bold font-mono">
                  Stop Recording
                </Button>
              )}
              {videoUrl && !recording && (
                <>
                  <Button onClick={submitClip} className="w-full h-20 text-3xl bg-green-600 text-white font-bold font-mono">
                    Submit Clip
                  </Button>
                  <Button onClick={() => {
                    setVideoUrl('')
                    setVideoBlob(null)
                    setShowVideoRecorder(false)
                  }} variant="outline" className="w-full h-16 text-xl border-4 border-black font-mono">
                    Cancel
                  </Button>
                </>
              )}
            </div>
          </div>
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