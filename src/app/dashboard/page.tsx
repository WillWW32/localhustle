'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { signOut } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { loadStripe } from '@stripe/stripe-js'

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
  const [favorites, setFavorites] = useState<any[]>([])
  const [selectedGig, setSelectedGig] = useState<any>(null)
  const [numAthletes, setNumAthletes] = useState(1)
  const [customDetails, setCustomDetails] = useState('')
  const [amount, setAmount] = useState('')
  const [scholarshipAmount, setScholarshipAmount] = useState('')
  const [standaloneScholarshipAmount, setStandaloneScholarshipAmount] = useState('')
  const [scholarshipMessage, setScholarshipMessage] = useState('')
  const [selectedAthleteForScholarship, setSelectedAthleteForScholarship] = useState<any>(null)
  const [athleteSearch, setAthleteSearch] = useState('')
  const [searchedAthletes, setSearchedAthletes] = useState<any[]>([])
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
  const [payoutHistory, setPayoutHistory] = useState<any[]>([])
  const [scholarshipsEarned, setScholarshipsEarned] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'wallet' | 'clips' | 'kids' | 'favorites' | 'scholarships' | 'booster'>('wallet')
  const router = useRouter()

  useEffect(() => {
  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.replace('/')
      return
    }

    const currentPath = window.location.pathname

    let prof = null
    const { data: existingProf } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (existingProf) {
      prof = existingProf
    } else {
      // New user — set role based on current path
      let role = 'athlete' // default
      if (currentPath.includes('/business-onboard')) {
        role = 'business'
      } else if (currentPath.includes('/get-started')) {
        role = 'athlete'
      }

      const { data: newProf } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email,
          role,
        })
        .select()
        .single()
      prof = newProf
    }

    setProfile(prof)

    // Optional: redirect to dashboard after first login (cleaner flow)
    if (currentPath.includes('/get-started') || currentPath.includes('/business-onboard')) {
      router.replace('/dashboard')
    }
    
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

        const { data: history } = await supabase
          .from('payouts')
          .select('amount, created_at, offers(type)')
          .eq('athlete_id', user.id)
          .order('created_at', { ascending: false })
        setPayoutHistory(history || [])

        // Freedom Scholarships earned (including standalone)
        const { data: scholarships } = await supabase
          .from('scholarships')
          .select('amount, message, created_at, businesses(name)')
          .eq('athlete_id', user.id)
          .order('created_at', { ascending: false })
        setScholarshipsEarned(scholarships || [])
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

        const { data: favs } = await supabase
          .from('business_favorites')
          .select('athlete_id, profiles(*)')
          .eq('business_id', biz.id)
        setFavorites(favs?.map(f => f.profiles) || [])

        const { data: clips } = await supabase
          .from('clips')
          .select('*, offers(*), profiles(email, parent_email)')
          .eq('status', 'pending')
          .in('offer_id', (await supabase.from('offers').select('id').eq('business_id', biz.id)).data?.map(o => o.id) || [])
        setPendingClips(clips || [])
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
      .update({ status: 'approved' })
      .eq('id', clip.id)

    if (clipError) {
      alert('Error approving clip: ' + clipError.message)
      return
    }

    // Real payout
    const response = await fetch('/api/payout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clip_id: clip.id,
        athlete_id: clip.athlete_id,
        amount: clip.offers.amount,
      }),
    })

    const data = await response.json()

    if (data.error) {
      alert('Payout failed: ' + data.error)
    } else {
      alert(`Approved and paid $${clip.offers.amount} instantly!`)
    }

    setPendingClips(pendingClips.filter(c => c.id !== clip.id))
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

  const searchAthletes = async () => {
    if (!athleteSearch.trim()) {
      setSearchedAthletes([])
      return
    }

    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, email, school')
      .ilike('full_name', `%${athleteSearch}%`)
      .limit(10)

    setSearchedAthletes(data || [])
  }

  const awardStandaloneScholarship = async () => {
    if (!selectedAthleteForScholarship || !standaloneScholarshipAmount || parseFloat(standaloneScholarshipAmount) <= 0) {
      alert('Please select an athlete and enter a valid amount')
      return
    }

    const amount = parseFloat(standaloneScholarshipAmount)

    // Real payout
    const response = await fetch('/api/payout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        athlete_id: selectedAthleteForScholarship.id,
        amount,
      }),
    })

    const data = await response.json()

    if (data.error) {
      alert('Scholarship payout failed: ' + data.error)
      return
    }

    // Record scholarship
    await supabase
      .from('scholarships')
      .insert({
        business_id: business.id,
        athlete_id: selectedAthleteForScholarship.id,
        amount,
        message: scholarshipMessage || 'Great hustle!',
      })

    alert(`Freedom Scholarship of $${amount} awarded to ${selectedAthleteForScholarship.full_name || selectedAthleteForScholarship.email}!`)
    setStandaloneScholarshipAmount('')
    setScholarshipMessage('')
    setSelectedAthleteForScholarship(null)
    setAthleteSearch('')
    setSearchedAthletes([])
  }

  if (!profile) return <p className="container text-center py-32">Loading...</p>

  return (
    <div className="container py-8">
      <p className="text-center mb-12 text-xl font-mono">Welcome, {profile.email}</p>

      {/* Subtitle — black block */}
      <div className="bg-black text-white p-8 mb-12">
        <h1 className="text-3xl font-bold">
          {profile.role === 'athlete' ? 'Your Hustle Dashboard' : 'Your Business Admin Console'}
        </h1>
      </div>

      {/* Detail — black block */}
      <div className="bg-black text-white p-8 mb-12">
        <p className="text-lg leading-relaxed">
          {profile.role === 'athlete' ? 'Pitch businesses, claim gigs, build your squad and earn together.' : 'Post gigs to get authentic content. Review clips — only approve what you love. Become the hometown hero.'}
        </p>
      </div>

      {profile.role === 'athlete' ? (
        <div className="max-w-4xl mx-auto space-y-32 font-mono text-center text-lg">
          

          {/* Player Profile Section */}
          <div className="max-w-2xl mx-auto bg-gray-100 p-8 border-4 border-black rounded-lg">
            <h2 className="text-2xl mb-8 font-bold">Your Player Profile</h2>

            {/* Circle Photo Upload */}
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

            {/* Name */}
            <div className="mb-8">
              <label className="block text-lg mb-2">Name</label>
              <Input placeholder="Your Name" value={profile?.full_name || ''} disabled className="text-center" />
            </div>

            {/* School */}
            <div className="mb-8">
              <label className="block text-lg mb-2">School</label>
              <Input placeholder="Your School" value={profile?.school || ''} disabled className="text-center" />
            </div>

            {/* Highlight Link */}
            <div className="mb-8">
              <label className="block text-lg mb-2">Highlight Reel Link</label>
              <Input placeholder="YouTube / Hudl link" value={highlightLink} onChange={(e) => setHighlightLink(e.target.value)} className="text-center" />
            </div>

            {/* Social Followers */}
            <div className="mb-8">
              <label className="block text-lg mb-2">Total Social Followers</label>
              <Input placeholder="e.g., 5,000" value={socialFollowers} onChange={(e) => setSocialFollowers(e.target.value)} className="text-center" />
            </div>

            {/* Bio */}
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
            
            {/* Payout Setup Banner — Only if not setup */}
{profile?.role === 'athlete' && !profile?.payout_method_setup && (
  <div className="bg-green-100 p-12 border-4 border-green-600 mb-16 text-center">
    <h2 className="text-3xl font-bold mb-6">
      Get Paid Instantly — Add Your Debit Card
    </h2>
    <p className="text-xl mb-8 max-w-3xl mx-auto">
      Connect your debit card to receive earnings and Freedom Scholarships directly.<br />
      Any athlete can add a card — 18+ get paid without parent approval.
    </p>
    <Button 
      onClick={() => router.push('/payout-setup')}
      className="w-full max-w-md h-20 text-2xl bg-black text-white font-bold"
    >
      Add Debit Card Now
    </Button>
  </div>
)}
          {/* Gig Selection */}
          <div>
            <h2 className="text-2xl mb-8 font-bold">Gigs You Offer</h2>
            <p className="mb-8">Select the gigs you're willing to do — businesses will see these.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {athleteGigTypes.map((gig) => (
                <div key={gig.title} className="border-4 border-black p-6 bg-gray-100">
                  <h3 className="text-xl font-bold mb-4">{gig.title}</h3>
                  <p className="mb-6">{gig.description}</p>
                  <Button 
                    onClick={() => toggleGigSelection(gig.title)}
                    className="w-full h-14 text-lg bg-black text-white hover:bg-gray-800"
                  >
                    {selectedGigs.includes(gig.title) ? 'Selected' : 'Select This Gig'}
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Open Offers */}
          <div>
            <h2 className="text-2xl mb-8 font-bold">Open Offers</h2>
            {offers.length === 0 ? (
              <p className="text-gray-600 mb-12">No offers yet — pitch businesses to get started!</p>
            ) : (
              <div className="space-y-16">
                {offers.map((offer) => (
                  <div key={offer.id} className="border-4 border-black p-8 bg-gray-100 max-w-lg mx-auto">
                    <p className="font-bold text-2xl mb-6">{offer.type.toUpperCase()} — ${offer.amount}</p>
                    <p className="mb-8">{offer.description}</p>
                    <Button 
                      onClick={() => router.push(`/claim/${offer.id}`)}
                      className="w-full h-16 text-xl bg-black text-white"
                    >
                      Claim Offer
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pitch Letter — Collapsible */}
          <div>
            <h2 className="text-2xl mb-8 font-bold cursor-pointer" onClick={() => setShowPitchLetter(!showPitchLetter)}>
              Pitch Local Businesses {showPitchLetter ? '▲' : '▼'}
            </h2>
            {showPitchLetter && (
              <div className="bg-gray-100 p-8 border-4 border-black mb-8 max-w-2xl mx-auto">
                <pre className="text-left whitespace-pre-wrap text-sm">
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
                  <Button onClick={shareLetter} className="h-14 text-lg bg-black text-white">
                    Share Letter
                  </Button>
                  <Button onClick={copyLetter} variant="outline" className="h-14 text-lg border-4 border-black">
                    Copy Letter
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Brand Deals CTA */}
          <div className="my-16">
            <Button 
              onClick={() => router.push('/brand-deals')}
              className="w-full max-w-2xl h-24 text-3xl bg-green-400 text-black font-bold"
            >
              Land National Brand Deals
            </Button>
          </div>

          {/* CTA */}
          <div className="my-16">
            <Button 
              onClick={() => router.push('/squad')}
              className="w-full max-w-md h-20 text-2xl bg-black text-white"
            >
              Build a Squad and Earn with Friends
            </Button>
          </div>

          {/* Divider */}
          <div className="border-t-4 border-black my-16"></div>

          {/* Squad Members */}
          <div>
            <h2 className="text-2xl mb-8 font-bold">Your Squad</h2>
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
           {/* Gig Search */}
          <div className="mb-12">
            <h2 className="text-2xl mb-8 font-bold">Find Gigs</h2>
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

          {/* Searched/Filtered Offers */}
          <div>
            <h2 className="text-2xl mb-8 font-bold">Available Gigs</h2>
            {searchedOffers.length === 0 ? (
              <p className="text-gray-600 mb-12">No gigs matching search — try different terms!</p>
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
            
          {/* Ambassador */}
          <div className="max-w-2xl mx-auto my-16 p-8 border-4 border-black bg-gray-100">
            <h2 className="text-2xl mb-8 font-bold">
              Become a Team Hustle Ambassador
            </h2>

            <div className="text-left text-lg leading-relaxed">
              <p className="mb-4">
                <strong>Task:</strong> Make 10 business connections — send the support letter to local spots.
              </p>
              <p className="mb-4">
                <strong>Qualifications:</strong> Varsity player, manager, or photographer • 3.0 GPA or better
              </p>
              <p className="mb-4">
                <strong>Prize:</strong> $100 bonus (1 week deadline) • 5% lifetime cut of every gig from businesses you onboard
              </p>
              <p className="mb-8">
                <strong>Deadline:</strong> Complete within 7 days of applying
              </p>
            </div>

            <div className="text-center">
              <Button className="w-full max-w-md h-16 text-xl bg-black text-white">
                Apply Now
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto space-y-16 font-mono text-center text-lg">
          {/* Subtitle — black block */}
          <div className="bg-black text-white p-8 mb-12">
            <h1 className="text-3xl font-bold">
              Your Business Admin Console
            </h1>
          </div>

          {/* Detail — black block */}
          <div className="bg-black text-white p-8 mb-12">
            <p className="text-lg leading-relaxed">
              Post gigs to get authentic content from local athletes.<br />
              Review clips — only approve what you love.<br />
              Become the hometown hero while discovering motivated teens.
            </p>

            <h2 className="text-2xl font-bold mt-12 mb-6">
              Why this is the best advertising
            </h2>
            <p className="text-lg leading-relaxed">
              • Real word-of-mouth from kids parents trust (88% trust recommendations from people they know).<br />
              • Authentic content — better than paid ads.<br />
              • Be the hometown hero — visible support for local teams.<br />
              • Discover motivated teens & potential future employees.<br />
              • Approve = Clips You Love.
            </p>
          </div>

          {/* My Kid's Challenges */}
          {referredAthletes.length > 0 && (
            <div className="mb-16">
              <h3 className="text-3xl mb-8 font-bold">My Kid's Challenges</h3>
              <p className="mb-8 text-lg">
                Create a challenge for your kid — they complete, you approve, they get paid.
              </p>
              <div className="space-y-8 max-w-2xl mx-auto">
                {referredAthletes.map((kid) => (
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
                ))}
              </div>
            </div>
          )}

          {/* Fund Best Friend Prompt */}
          {showFundFriend && (
            <div className="max-w-2xl mx-auto my-16 p-8 bg-green-100 border-4 border-green-600">
              <p className="text-2xl font-bold mb-6">
                Your kid earned $50! 🎉
              </p>
              <p className="text-xl mb-8">
                Fund a challenge for their best friend — get them started too.
              </p>
              <div className="space-y-6">
                <Input 
                  placeholder="Friend's name (optional)"
                  value={friendName}
                  onChange={(e) => setFriendName(e.target.value)}
                />
                <Input 
                  placeholder="Friend's email (required)"
                  value={friendEmail}
                  onChange={(e) => setFriendEmail(e.target.value)}
                />
                <Input 
                  placeholder="Challenge description (e.g., 80/100 free throws)"
                  value={friendChallenge}
                  onChange={(e) => setFriendChallenge(e.target.value)}
                />
                <Input 
                  placeholder="Payout amount (e.g., 50)"
                  value={friendAmount}
                  onChange={(e) => setFriendAmount(e.target.value)}
                />
                <Button onClick={handleFundFriend} className="w-full h-16 text-xl bg-green-400 text-black">
                  Fund Challenge & Invite Friend
                </Button>
              </div>
            </div>
          )}

          {/* Wallet Balance + Auto-Top-Up + Add Funds */}
          <div className="mb-16">
            <p className="text-3xl mb-4 font-bold">Wallet balance: ${business?.wallet_balance?.toFixed(2) || '0.00'}</p>

            {/* Auto-Top-Up Toggle */}
            <div className="max-w-md mx-auto mb-12 p-6 bg-gray-100 border-4 border-black">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-xl font-bold">Auto-Top-Up</span>
                <input
                  type="checkbox"
                  checked={business?.auto_top_up ?? true}
                  onChange={async (e) => {
                    const enabled = e.target.checked
                    await supabase
                      .from('businesses')
                      .update({ auto_top_up: enabled })
                      .eq('id', business.id)
                    setBusiness({ ...business, auto_top_up: enabled })
                    alert(enabled ? 'Auto-top-up enabled!' : 'Auto-top-up disabled')
                  }}
                  className="w-8 h-8"
                />
              </label>
              <p className="text-lg mt-4">
                Never run out — when balance falls below $100, automatically add $500.
              </p>
            </div>

            {/* Add Funds Buttons */}
            <p className="text-lg mb-8">
              Top up your wallet — post gigs anytime. Most businesses start with $500–$1000.
            </p>

            <div className="flex flex-wrap justify-center gap-4 mb-8">
              <Button 
                onClick={() => handleAddFunds(100)}
                className="w-48 h-14 text-lg bg-black text-white"
              >
                + $100
              </Button>
              <Button 
                onClick={() => handleAddFunds(500)}
                className="w-48 h-14 text-lg bg-black text-white"
              >
                + $500
              </Button>
              <Button 
                onClick={() => handleAddFunds(1000)}
                className="w-48 h-14 text-lg bg-black text-white"
              >
                + $1000
              </Button>
              <Button 
                onClick={() => {
                  const custom = prompt('Enter custom amount:')
                  if (custom !== null && custom.trim() !== '' && !isNaN(Number(custom)) && Number(custom) > 0) {
                    handleAddFunds(Number(custom))
                  }
                }}
                className="w-48 h-14 text-lg bg-green-400 text-black"
              >
                Custom Amount
              </Button>
            </div>

            <p className="text-sm text-gray-600">
              Transaction fee covers legal NIL compliance, bonus & challenge distributions, credit card fees, and platform expenses.
            </p>
          </div>

          {/* Award Standalone Freedom Scholarship */}
          <div className="mb-16">
            <h3 className="text-3xl mb-8 font-bold">Award a Freedom Scholarship</h3>
            <p className="mb-8 text-xl">
              Give instant, unrestricted cash to any athlete — no gig required.
            </p>
            <div className="max-w-2xl mx-auto space-y-6">
              <Input 
                placeholder="Search athlete by name"
                value={athleteSearch}
                onChange={(e) => setAthleteSearch(e.target.value)}
              />
              <Button onClick={searchAthletes} className="w-full h-16 text-xl bg-black text-white">
                Search Athletes
              </Button>

              {searchedAthletes.length > 0 && (
                <div className="space-y-4">
                  {searchedAthletes.map((athlete) => (
                    <div key={athlete.id} className="border-4 border-black p-4 bg-gray-100">
                      <p>{athlete.full_name || athlete.email} — {athlete.school}</p>
                      <Button 
                        onClick={() => setSelectedAthleteForScholarship(athlete)}
                        className="mt-4 w-full h-14 text-lg bg-green-400 text-black"
                      >
                        Select This Athlete
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {selectedAthleteForScholarship && (
                <div className="border-4 border-green-600 p-8 bg-green-100">
                  <p className="text-xl mb-4">
                    Selected: {selectedAthleteForScholarship.full_name || selectedAthleteForScholarship.email}
                  </p>
                  <Input 
                    placeholder="Scholarship amount (e.g., 500)"
                    value={standaloneScholarshipAmount}
                    onChange={(e) => setStandaloneScholarshipAmount(e.target.value)}
                  />
                  <textarea
                    placeholder="Optional message (e.g., Great season — use for books!)"
                    value={scholarshipMessage}
                    onChange={(e) => setScholarshipMessage(e.target.value)}
                    rows={4}
                    className="w-full p-4 text-lg border-4 border-black font-mono rounded-lg mt-4"
                  />                  
                  <Button 
                    onClick={awardStandaloneScholarship}
                    className="mt-8 w-full h-16 text-xl bg-green-600 text-white"
                  >
                    Award Freedom Scholarship Instantly
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Create a Gig */}
          <h3 className="text-2xl mb-8 font-bold">Create a Gig</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
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

                      <div>
                        <label className="block text-lg mb-2">
                          <input type="checkbox" checked={isRecurring} onChange={(e) => setIsRecurring(e.target.checked)} />
                          Make this recurring monthly
                        </label>
                      </div>

                      <div>
                        <label className="block text-lg mb-2">Offer Amount</label>
                        <Input
                          placeholder="Enter Offer Amount - Min $50"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="block text-lg mb-2">Add Freedom Scholarship (Optional)</label>
                        <Input
                          placeholder="Scholarship amount (e.g., 500)"
                          value={scholarshipAmount}
                          onChange={(e) => setScholarshipAmount(e.target.value)}
                        />
                        <p className="text-sm mt-2 text-green-600 font-bold">
                          Paid instantly to athlete — unrestricted cash for college.
                        </p>
                      </div>

                      <div>
                        <label className="block text-lg mb-2">Custom Details</label>
                        <textarea
                          placeholder="Add your details (e.g., Come to Bridge Pizza this Friday)"
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

          {/* Proposals Received */}
          <h3 className="text-2xl mb-8 font-bold">Proposals Received</h3>
          <p className="mb-12">No proposals yet — kids will pitch you soon!</p>

          {/* Tabs */}
          <h3 className="text-2xl mb-8 font-bold">Your Offers</h3>
          <div className="flex justify-center gap-8 mb-8">
            <Button variant="outline">
              Unclaimed
            </Button>
            <Button variant="outline">
              Active
            </Button>
            <Button variant="outline">
              Complete
            </Button>
          </div>

          {/* Pending Clips */}
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

          {/* Connect with Stripe */}
          {business && !business.stripe_account_id && (
            <div className="my-16">
              <p className="text-lg mb-6">
                Connect your Stripe account to automatically fund all approved gigs.
              </p>
              <Button
                onClick={async () => {
                  const response = await fetch('/api/connect-onboarding', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ business_id: business.id }),
                  })
                  const { url } = await response.json()
                  window.location.href = url
                }}
                className="w-full max-w-md h-20 text-2xl bg-purple-600 text-white"
              >
                Connect with Stripe
              </Button>
            </div>
          )}

          {/* Booster Events CTA */}
          <div className="my-16">
            <Button 
              onClick={() => router.push('/booster-events')}
              className="w-full max-w-md h-20 text-2xl bg-green-400 text-black"
            >
              Create Booster Club Event
            </Button>
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