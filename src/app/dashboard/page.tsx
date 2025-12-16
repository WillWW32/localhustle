'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { signOut } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast/Toast'

export default function Dashboard() {
  const [profile, setProfile] = useState<any>(null)
  const [business, setBusiness] = useState<any>(null)
  const [offers, setOffers] = useState<any[]>([])
  const [pendingClips, setPendingClips] = useState<any[]>([])
  const [type, setType] = useState('shoutout')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const router = useRouter()
  const { addToast } = useToast()

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      setProfile(prof)

      if (prof.role === 'business') {
        const { data: biz } = await supabase
          .from('businesses')
          .select('*')
          .eq('owner_id', user.id)
          .single()
        setBusiness(biz)

        const { data: clips } = await supabase 
          .from('clips')
          .select('*, offers(*), profiles(email, parent_email)')
          .eq('status', 'pending')
          .in('offer_id', (await supabase.from('offers').select('id').eq('business_id', biz.id)).data?.map(o => o.id) || [])
        setPendingClips(clips || [])
      }

      if (prof.role === 'athlete') {
        const { data: openOffers } = await supabase
          .from('offers')
          .select('*')
          .eq('status', 'active')
          .order('created_at', { ascending: false })
        setOffers(openOffers || [])
      }
    }
    fetchData()
  }, [])

  const copyLetter = () => {
    const athleteId = profile?.id || 'fallback-id'
    const letterText = `Hey [Business Name],

I'm ${profile?.email.split('@')[0] || 'a student athlete'} from ${profile?.school || 'our local high school'} — ${profile?.sport || 'varsity athlete'}.

Small ask: could you sponsor a quick 15-second thank-you clip about your spot? If you like it, send $75.

It's shoes, gas, or lunch money for me and the team. No strings, parent-approved.

Want to help? Tap this link to set it up (30 seconds): https://app.localhustle.org/business-onboard?ref=${athleteId}

Thanks!
– ${profile?.email.split('@')[0] || 'me'}`
    navigator.clipboard.writeText(letterText)
    addToast('Letter copied to clipboard!', 'success')
  }

  const postOffer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!business) return

    const finalDescription = type === 'booster' ? 'Sponsoring the team — post-game meals, gear, or event. Money split equally among roster.' : description
    const finalAmount = type === 'booster' ? 1000 : parseFloat(amount)

    const { error } = await supabase
      .from('offers')
      .insert({
        business_id: business.id,
        type: type === 'booster' ? 'team_event' : type,
        amount: finalAmount,
        description: finalDescription,
        status: 'active',
      })

    if (error) addToast(error.message, 'error')
    else {
      addToast('Offer posted!', 'success')
      setAmount('')
      setDescription('')
      setType('shoutout')
    }
  }

  const approveClip = async (clip: any) => {
    const { error: clipError } = await supabase
      .from('clips')
      .update({ status: 'waiting_parent' })
      .eq('id', clip.id)

    if (clipError) {
      addToast(clipError.message, 'error')
      return
    }

    await supabase
      .from('businesses')
      .update({ wallet_balance: business.wallet_balance - clip.offers.amount })
      .eq('id', business.id)

    addToast(`Clip sent to parent for final approval: ${clip.profiles.parent_email || 'parent email'}`, 'success')
    setPendingClips(pendingClips.filter(c => c.id !== clip.id))
    setBusiness({ ...business, wallet_balance: business.wallet_balance - clip.offers.amount })
  }

  if (!profile) return <p className="container text-center">Loading...</p>

  return (
    <div className="container">
      <p className="text-center mb-12 text-xl font-mono">Welcome, {profile.email}</p>

      {profile.role === 'athlete' ? (
        <div className="max-w-2xl mx-auto space-y-16 font-mono text-center text-lg">
          {/* Pinned Team Hustle Ambassador Gig */}
          <div className="card-lift border-4 border-black p-16 bg-gray-100 max-w-lg mx-auto">
            <h2 className="text-4xl mb-8 font-bold">Team Hustle Ambassador</h2>
            <p className="mb-6">Task: Make 10–20 business connections — send the support letter to local spots.</p>
            <p className="mb-6">Qualifications: Varsity player, manager, or photographer • 3.0 GPA or better</p>
            <p className="mb-8">Prize: $100 bonus (1 week deadline) • 5% lifetime cut of every gig from businesses you onboard</p>
            <p className="font-bold text-xl">Be the first — start pitching today!</p>
          </div>

          {/* Pinned Team Manager Gig */}
          <div className="card-lift border-4 border-black p-16 bg-gray-100 max-w-lg mx-auto">
            <h2 className="text-4xl mb-8 font-bold">Team Manager Support Gig</h2>
            <p className="mb-6">Task: Logistics + weekly updates tagging sponsor.</p>
            <p className="mb-6">Qualifications: Current manager • Reliable</p>
            <p className="mb-8">Prize: $150/month + perks</p>
          </div>

          <div>
            <h2 className="text-3xl mb-8 font-bold">Student Athlete</h2>
            <p className="mb-12">Pitch local businesses for support — copy the letter below and send via text or email.</p>

            <div className="bg-gray-100 p-12 mb-16 border border-black max-w-lg mx-auto">
              <pre className="font-mono text-sm whitespace-pre-wrap text-left">
                {`Hey [Business Name],

I'm ${profile.email.split('@')[0]} from ${profile.school || 'our local high school'} — ${profile.sport || 'varsity athlete'}.

Small ask: could you sponsor a quick 15-second thank-you clip about your spot? If you like it, send $75.

It's shoes, gas, or lunch money for me and the team. No strings, parent-approved.

Want to help? Tap this link to set it up (30 seconds): https://app.localhustle.org/business-onboard?ref=${profile.id || 'fallback-id'}

Thanks!
– ${profile.email.split('@')[0]}`}
              </pre>
            </div>

            <Button onClick={copyLetter} className="w-full max-w-md h-20 text-2xl bg-black text-white hover:bg-gray-800 mb-