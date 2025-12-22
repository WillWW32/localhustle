'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { signOut } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const athleteGigTypes = [
  { title: 'ShoutOut', description: 'Visit a favorite business and make a quick shoutout 15-sec reel about what you like or your favorite order.' },
  { title: 'Youth Clinic', description: 'Run 30–60 min sessions for younger athletes (with teammates).' },
  { title: 'Cameo', description: 'Custom 15-Sec Video for Younger Athletes (birthdays, pre-game pep talks).' },
  { title: 'Player Training', description: 'Varsity athlete 40-minute training with young player.' },
  { title: 'Custom Gig', description: 'Create a gig and offer it.' },
]

const businessGigTypes = [
  { title: 'ShoutOut', baseAmount: 50, description: 'Visit a favorite business and make a quick shoutout 15-sec reel about what you like or your favorite order.' },
  { title: 'Youth Clinic', baseAmount: 500, description: 'Run 30–60 min sessions for younger athletes (with teammates).' },
  { title: 'Team Sponsor', baseAmount: 1000, description: 'Business sponsors team meals/gear — money split equally.' },
  { title: 'Cameo', baseAmount: 50, description: 'Custom 15-Sec Video for Younger Athletes (birthdays, pre-game pep talks).' },
  { title: 'Player Training', baseAmount: 100, description: 'Varsity athlete 40-minute training with young player.' },
  { title: 'Custom Gig', baseAmount: 200, description: 'Create a gig and offer it.' },
]

export default function Dashboard() {
  const [profile, setProfile] = useState<any>(null)
  const [business, setBusiness] = useState<any>(null)
  const [offers, setOffers] = useState<any[]>([])
const [pendingProposals, setPendingProposals] = useState<any[]>([])
  const [pendingClips, setPendingClips] = useState<any[]>([])
  const [selectedGigs, setSelectedGigs] = useState<string[]>([])
  const [squad, setSquad] = useState<any[]>([])
  const [selectedGig, setSelectedGig] = useState<any>(null)
  const [numAthletes, setNumAthletes] = useState(1)
  const [customDetails, setCustomDetails] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState('')
  const [location, setLocation] = useState('')
  const [businessPhone, setBusinessPhone] = useState('')
  const [isRecurring, setIsRecurring] = useState(false)
  const [profilePic, setProfilePic] = useState('')
  const [highlightLink, setHighlightLink] = useState('')
  const [socialFollowers, setSocialFollowers] = useState('')
  const [bio, setBio] = useState('')
  const router = useRouter()

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
      }

      if (prof.role === 'business') {
        const { data: biz } = await supabase
          .from('businesses')
          .select('*')
          .eq('owner_id', user.id)
          .single()
        setBusiness(biz)

  const { data: proposals } = await supabase
    .rpc('get_pending_proposals', { biz_id: biz.id })
  setPendingProposals(proposals || [])

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
  }

  if (!profile) return <p className="container text-center py-32">Loading...</p>

  return (
    <div className="container py-8">
      {/* Welcome */}
      <p className="text-center mb-12 text-xl font-mono">Welcome, {profile.email}</p>

      {/* Subtitle — black block */}
      <div style={{ backgroundColor: 'black', color: 'white', padding: '2rem', marginBottom: '4rem' }}>
        <h1 style={{ fontSize: '1.8rem', margin: '0' }}>
          {profile.role === 'athlete' ? 'Your Athlete Dashboard' : 'Your Business Admin Console'}
        </h1>
      </div>

      {/* Detail — black block */}
      <div style={{ backgroundColor: 'black', color: 'white', padding: '2rem', marginBottom: '4rem' }}>
        <p style={{ fontSize: '1.2rem', lineHeight: '1.8' }}>
          {profile.role === 'athlete' ? 'Pitch businesses, claim gigs, build your squad and earn together.' : 'Post gigs to get authentic content. Review clips — only approve what you love. Become the hometown hero.'}
        </p>
      </div>

      {profile.role === 'athlete' ? (
        <div className="max-w-4xl mx-auto space-y-16 font-mono text-center text-lg">
    {/* Player Profile Section */}
<div style={{ maxWidth: '600px', margin: '0 auto 6rem auto', padding: '3rem', border: '2px solid black', backgroundColor: '#f5f5f5' }}>
  <h2 style={{ fontSize: '1.8rem', marginBottom: '3rem' }}>
    Your Player Profile
  </h2>

  {/* Circle Photo Upload */}
  <div style={{ marginBottom: '3rem' }}>
    <div style={{ width: '150px', height: '150px', borderRadius: '50%', backgroundColor: '#ddd', margin: '0 auto', overflow: 'hidden', border: '4px solid black' }}>
      {profilePic ? (
        <img src={profilePic} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <div style={{ width: '100%', height: '100%', backgroundColor: '#ccc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ fontSize: '1rem', color: '#666' }}>Tap to Upload</p>
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
      }}
      style={{ display: 'none' }}
      id="photo-upload"
    />
    <label htmlFor="photo-upload">
      <div style={{
        marginTop: '1rem',
        padding: '1rem',
        backgroundColor: 'black',
        color: 'white',
        textAlign: 'center',
        cursor: 'pointer',
        fontSize: '1.2rem',
      }}>
        Upload Photo
      </div>
    </label>
  </div>

  {/* Name */}
  <div style={{ marginBottom: '2rem' }}>
    <label style={{ display: 'block', fontSize: '1.2rem', marginBottom: '0.5rem' }}>Name</label>
    <Input placeholder="Your Name" value={profile?.full_name || ''} onChange={() => {}} disabled />
  </div>

  {/* School */}
  <div style={{ marginBottom: '2rem' }}>
    <label style={{ display: 'block', fontSize: '1.2rem', marginBottom: '0.5rem' }}>School</label>
    <Input placeholder="Your School" value={profile?.school || ''} onChange={() => {}} disabled />
  </div>

  {/* Highlight Link */}
  <div style={{ marginBottom: '2rem' }}>
    <label style={{ display: 'block', fontSize: '1.2rem', marginBottom: '0.5rem' }}>Highlight Reel Link</label>
    <Input placeholder="YouTube / Hudl link" value={highlightLink} onChange={(e) => setHighlightLink(e.target.value)} />
  </div>

  {/* Social Followers */}
  <div style={{ marginBottom: '2rem' }}>
    <label style={{ display: 'block', fontSize: '1.2rem', marginBottom: '0.5rem' }}>Total Social Followers</label>
    <Input placeholder="e.g., 5,000" value={socialFollowers} onChange={(e) => setSocialFollowers(e.target.value)} />
  </div>

  {/* Bio */}
  <div style={{ marginBottom: '3rem' }}>
    <label style={{ display: 'block', fontSize: '1.2rem', marginBottom: '0.5rem' }}>Bio</label>
    <textarea
      placeholder="Short bio about you and your sport"
      value={bio}
      onChange={(e) => setBio(e.target.value)}
      style={{ width: '100%', height: '160px', padding: '1rem', fontSize: '1.2rem', border: '4px solid black', fontFamily: "'Courier New', Courier, monospace'" }}
    />
  </div>

  <Button onClick={handleSaveProfile} style={{
    width: '100%',
    height: '60px',
    fontSize: '1.5rem',
    backgroundColor: 'black',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'Courier New', Courier, monospace'",
  }}>
    Save Profile
  </Button>
</div>

          {/* Gig Selection */}
          <div>
            <h2 className="text-2xl mb-8 font-bold">Gigs You Offer</h2>
            <p className="mb-8">Select the gigs you're willing to do — businesses will see these.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {athleteGigTypes.map((gig) => (
                <div key={gig.title} style={{
                  border: '2px solid black',
                  padding: '2rem',
                  backgroundColor: selectedGigs.includes(gig.title) ? '#333' : '#f5f5f5',
                  color: selectedGigs.includes(gig.title) ? 'white' : 'black',
                }}>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>{gig.title}</h3>
                  <p style={{ fontSize: '1.2rem', marginBottom: '2rem' }}>{gig.description}</p>
                  <Button 
                    onClick={() => toggleGigSelection(gig.title)}
                    style={{
                      width: '100%',
                      height: '60px',
                      fontSize: '1.2rem',
                      backgroundColor: selectedGigs.includes(gig.title) ? 'white' : 'black',
                      color: selectedGigs.includes(gig.title) ? 'black' : 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: "'Courier New', Courier, monospace'",
                    }}
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
                  <div key={offer.id} className="border-4 border-black p-16 bg-gray-100 max-w-lg mx-auto">
                    <p className="font-bold text-2xl mb-6">{offer.type.toUpperCase()} — ${offer.amount}</p>
                    <p className="mb-12">{offer.description}</p>
                    <Button 
                      onClick={() => router.push(`/claim/${offer.id}`)}
                      style={{
                        width: '100%',
                        height: '60px',
                        fontSize: '1.5rem',
                        backgroundColor: 'black',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontFamily: "'Courier New', Courier, monospace'",
                      }}
                    >
                      Claim Offer
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pitch Letter */}
          <div>
            <h2 className="text-2xl mb-8 font-bold">Pitch Local Businesses</h2>
            <p className="mb-12">Copy or share this letter to your favorite spots.</p>

            <div style={{ backgroundColor: '#f5f5f5', padding: '2rem', border: '1px solid black', marginBottom: '2rem', overflowWrap: 'break-word' }}>
              <pre style={{ fontSize: '1rem', whiteSpace: 'pre-wrap', wordWrap: 'break-word', textAlign: 'left' }}>
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
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '400px', margin: '0 auto' }}>
              <Button onClick={shareLetter} style={{
                height: '60px',
                fontSize: '1.5rem',
                backgroundColor: 'black',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: "'Courier New', Courier, monospace'",
              }}>
                Share Letter
              </Button>
              <Button onClick={copyLetter} variant="outline" style={{
                height: '60px',
                fontSize: '1.5rem',
                border: '4px solid black',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: "'Courier New', Courier, monospace'",
              }}>
                Copy Letter
              </Button>
            </div>
          </div>

          {/* CTA */}
          <div style={{ margin: '6rem 0' }}>
  <Button 
    onClick={() => router.push('/squad')}
    style={{
      width: '100%',
      maxWidth: '500px',
      height: '80px',
      fontSize: '2rem',
      backgroundColor: '#90ee90',
      color: 'black',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Courier New', Courier, monospace'",
    }}
  >
    Build a Squad and Earn with Friends
  </Button>
</div>

          {/* Divider */}
          <div style={{ borderTop: '4px solid black', margin: '4rem 0' }}></div>

          {/* Squad Members */}
          <div>
            <h2 className="text-2xl mb-8 font-bold">Your Squad</h2>
            {squad.length === 0 ? (
              <p className="text-gray-600 mb-12">No squad members yet — share your link!</p>
            ) : (
              <div className="space-y-8">
                {squad.map((member) => (
                  <div key={member.id} className="border-2 border-black p-8 bg-gray-100 max-w-md mx-auto">
                    <p className="font-bold">{member.email}</p>
                    <p className="text-sm">Joined: {new Date(member.created_at).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Ambassador */}
          <div style={{ maxWidth: '600px', margin: '0 auto 8rem auto', padding: '3rem', border: '2px solid black', backgroundColor: '#f5f5f5' }}>
            <h2 style={{ fontSize: '1.8rem', marginBottom: '3rem' }}>
              Become a Team Hustle Ambassador
            </h2>

            <div style={{ fontSize: '1.2rem', lineHeight: '2', textAlign: 'left' }}>
              <p style={{ marginBottom: '1.5rem' }}>
                <strong>Task:</strong> Make 10 business connections — send the support letter to local spots.
              </p>
              <p style={{ marginBottom: '1.5rem' }}>
                <strong>Qualifications:</strong> Varsity player, manager, or photographer • 3.0 GPA or better
              </p>
              <p style={{ marginBottom: '1.5rem' }}>
                <strong>Prize:</strong> $200 bonus (1 week deadline) • Lifetime cut of every gig from businesses you onboard
              </p>
              <p style={{ marginBottom: '3rem' }}>
                <strong>Deadline:</strong> Complete within 7 days of applying
              </p>
            </div>

            <div style={{ textAlign: 'center' }}>
  <Button 
    onClick={() => {
      const subject = encodeURIComponent('Team Hustle Ambassador Application')
      const body = encodeURIComponent(
        `Hi Jesse,\n\nI'd like to apply to be a Team Hustle Ambassador.\n\nName: ${profile?.full_name || profile?.email || 'Not provided'}\nSchool: ${profile?.school || 'Not provided'}\nSport: ${profile?.sport || 'Not provided'}\nEmail: ${profile?.email}\n\nThanks!`
      )
      window.location.href = `mailto:jesse@entreartists.com?subject=${subject}&body=${body}`
      alert('Application received! Email opened — send it to jesse@entreartists.com and we\'ll review within 48 hours.')
    }}
    style={{
      width: '100%',
      maxWidth: '400px',
      height: '70px',
      fontSize: '1.6rem',
      backgroundColor: 'black',
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Courier New', Courier, monospace'",
    }}
  >
    Apply Now
  </Button>
</div>
          </div>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto space-y-16 font-mono text-center text-lg">
          <div>
            <h2 className="text-3xl mb-8 font-bold">Business Admin Console</h2>
            <p className="mb-8">Wallet balance: ${business?.wallet_balance?.toFixed(2) || '0.00'}</p>

            {/* Gig buttons + customize */}
            <h3 className="text-2xl mb-8 font-bold">Create a Gig</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-20 mb-32">
              {businessGigTypes.map((gig) => (
                <div key={gig.title}>
                  <button
                    onClick={() => handleGigSelect(gig)}
                    style={{
                      width: '100%',
                      height: '300px',
                      backgroundColor: selectedGig?.title === gig.title ? '#333' : 'black',
                      color: 'white',
                      fontFamily: "'Courier New', Courier, monospace",
                      fontSize: '30px',
                      padding: '2rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                      cursor: 'pointer',
                      border: 'none',
                      transition: 'background-color 0.3s',
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#333'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = selectedGig?.title === gig.title ? '#333' : 'black'}
                  >
                    <span style={{ marginBottom: '1rem' }}>{gig.title}</span>
                    <span style={{ marginBottom: '1rem' }}>${gig.baseAmount}+</span>
                    <span style={{ fontSize: '20px' }}>{gig.description}</span>
                  </button>

                  {selectedGig?.title === gig.title && (
                    <div style={{ marginTop: '2rem', backgroundColor: '#f5f5f5', padding: '2rem', border: '1px solid black', maxWidth: '500px', marginLeft: 'auto', marginRight: 'auto' }}>
                      <h3 style={{ fontSize: '24px', marginBottom: '2rem', fontWeight: 'bold' }}>Customize Your {gig.title}</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '20px', marginBottom: '0.5rem' }}>Number of Athletes</label>
                          <select
                            value={numAthletes}
                            onChange={(e) => handleAthletesChange(Number(e.target.value))}
                            style={{ width: '100%', padding: '1rem', fontSize: '20px', border: '4px solid black' }}
                          >
                            {[1,2,3,4,5,6,7,8,9,10].map(n => (
                              <option key={n} value={n}>{n} athlete{n > 1 ? 's' : ''}</option>
                            ))}
                          </select>
                          <p style={{ fontSize: '14px', marginTop: '0.5rem' }}>+ $75 per additional athlete</p>
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '20px', marginBottom: '0.5rem' }}>Date</label>
                          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '20px', marginBottom: '0.5rem' }}>Location</label>
                          <Input placeholder="e.g., Bridge Pizza" value={location} onChange={(e) => setLocation(e.target.value)} />
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '20px', marginBottom: '0.5rem' }}>Your Phone (for athlete contact)</label>
                          <Input placeholder="(555) 123-4567" value={businessPhone} onChange={(e) => setBusinessPhone(e.target.value)} />
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '20px', marginBottom: '0.5rem' }}>
                            <input type="checkbox" checked={isRecurring} onChange={(e) => setIsRecurring(e.target.checked)} />
                            Make this recurring monthly
                          </label>
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '20px', marginBottom: '0.5rem' }}>Offer Amount</label>
                          <Input
                            placeholder="Enter Offer Amount - Min $50"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            style={{ fontFamily: "'Courier New', Courier, monospace" }}
                          />
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '20px', marginBottom: '0.5rem' }}>Custom Details</label>
                          <textarea
                            placeholder="Add your details (e.g., Come to Bridge Pizza this Friday)"
                            value={customDetails}
                            onChange={(e) => setCustomDetails(e.target.value)}
                            style={{ width: '100%', height: '160px', padding: '1rem', fontSize: '20px', fontFamily: "'Courier New', Courier, monospace'", border: '4px solid black' }}
                          />
                        </div>

                        <Button onClick={handlePost} style={{
                          width: '100%',
                          height: '80px',
                          fontSize: '30px',
                          backgroundColor: '#90ee90',
                          color: 'black',
                          fontFamily: "'Courier New', Courier, monospace'",
                        }}>
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
{pendingProposals.length === 0 ? (
  <p className="mb-12">No proposals yet — kids will pitch you soon!</p>
) : (
  <div className="space-y-16">
    {pendingProposals.map((proposal) => (
      <div key={proposal.id} className="border-4 border-black p-20 bg-white max-w-lg mx-auto">
        <p className="font-bold mb-6 text-left">From: {proposal.athlete_email}</p>
        <p className="mb-6 text-left">Message: {proposal.message || 'No message'}</p>

        {/* Athlete Profile Preview */}
        <div style={{ marginTop: '2rem', padding: '2rem', backgroundColor: '#f5f5f5', border: '2px solid black' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginBottom: '2rem' }}>
            <div style={{ width: '100px', height: '100px', borderRadius: '50%', overflow: 'hidden', border: '2px solid black' }}>
              {proposal.profile_pic ? (
                <img src={proposal.profile_pic} alt="Athlete" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ backgroundColor: '#ccc', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <p>No Photo</p>
                </div>
              )}
            </div>
            <div>
              <p className="font-bold text-xl">{proposal.full_name || proposal.athlete_email}</p>
              <p>{proposal.school} • {proposal.sport}</p>
              {proposal.social_followers && <p>Followers: {proposal.social_followers}</p>}
            </div>
          </div>

          {proposal.bio && <p className="mb-4">{proposal.bio}</p>}

          {proposal.selected_gigs && proposal.selected_gigs.length > 0 && (
            <div>
              <p className="font-bold mb-2">Gigs Offered:</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                {proposal.selected_gigs.map((gig: string) => (
                  <span key={gig} style={{ padding: '0.5rem 1rem', backgroundColor: 'black', color: 'white' }}>
                    {gig}
                  </span>
                ))}
              </div>
            </div>
          )}

          <Button 
            onClick={() => router.push(`/athlete/${proposal.athlete_id}`)}
            style={{
              marginTop: '2rem',
              width: '100%',
              height: '60px',
              fontSize: '1.5rem',
              backgroundColor: 'black',
              color: 'white',
            }}
          >
            View Full Profile
          </Button>
        </div>

        {/* Accept/Reject Buttons */}
<div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
  <Button 
    onClick={async () => {
      const { error } = await supabase
        .from('proposals')
        .update({ status: 'accepted' })
        .eq('id', proposal.id)

      if (error) {
        alert('Error accepting proposal')
      } else {
        alert('Proposal accepted!')
        // Refresh proposals
        const { data: updated } = await supabase.rpc('get_pending_proposals', { biz_id: business.id })
        setPendingProposals(updated || [])
      }
    }}
    style={{
      flex: 1,
      height: '60px',
      fontSize: '1.5rem',
      backgroundColor: '#90ee90',
      color: 'black',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Courier New', Courier, monospace'",
    }}
  >
    Accept
  </Button>
  <Button 
    onClick={async () => {
      const { error } = await supabase
        .from('proposals')
        .update({ status: 'rejected' })
        .eq('id', proposal.id)

      if (error) {
        alert('Error rejecting proposal')
      } else {
        alert('Proposal rejected')
        // Refresh proposals
        const { data: updated } = await supabase.rpc('get_pending_proposals', { biz_id: business.id })
        setPendingProposals(updated || [])
      }
    }}
    variant="outline"
    style={{
      flex: 1,
      height: '60px',
      fontSize: '1.5rem',
      border: '4px solid black',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Courier New', Courier, monospace'",
    }}
  >
    Reject
  </Button>
</div>
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
                  <div key={clip.id} className="border-4 border-black p-20 bg-white max-w-lg mx-auto">
                    <p className="font-bold mb-6 text-left">From: {clip.profiles.email}</p>
                    <p className="mb-6 text-left">Offer: {clip.offers.type} — ${clip.offers.amount}</p>
                    <video controls className="w-full mb-8">
                      <source src={clip.video_url} type="video/mp4" />
                    </video>
                    <Button 
                      onClick={() => approveClip(clip)}
                      style={{
                        width: '100%',
                        height: '60px',
                        fontSize: '1.5rem',
                        backgroundColor: 'black',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontFamily: "'Courier New', Courier, monospace'",
                      }}
                    >
                      Approve & Send to Parent
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Connect with Stripe — at bottom, inside business view */}
            {business && !business.stripe_account_id && (
              <div style={{ margin: '6rem 0' }}>
                <p style={{ fontSize: '1.2rem', marginBottom: '2rem' }}>
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
                  style={{
                    width: '100%',
                    maxWidth: '500px',
                    height: '80px',
                    fontSize: '1.8rem',
                    backgroundColor: '#635BFF',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: "'Courier New', Courier, monospace'",
                  }}
                >
                  Connect with Stripe
                </Button>
              </div>
            )}

            {/* Booster Events CTA */}
            <div className="mt-32">
              <Button 
                onClick={() => router.push('/booster-events')}
                style={{
                  width: '100%',
                  maxWidth: '500px',
                  height: '80px',
                  fontSize: '1.8rem',
                  backgroundColor: '#90ee90',
                  color: 'black',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: "'Courier New', Courier, monospace'",
                }}
              >
                Create Booster Club Event
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Log Out — outside role switch */}
      <div className="text-center mt-32">
        <Button onClick={signOut} variant="outline" style={{
          width: '50%',
          maxWidth: '250px',
          height: '50px',
          fontSize: '1.2rem',
          border: '4px solid black',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: "'Courier New', Courier, monospace'",
        }}>
          Log Out
        </Button>
      </div>
    </div>
  )
}