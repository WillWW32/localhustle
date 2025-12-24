'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'

export default function GetStarted() {
  const [profile, setProfile] = useState<any>(null)
  const [pitchText, setPitchText] = useState('')
  const router = useRouter()

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.replace('/')
        return
      }

      const { data: prof } = await supabase
        .from('profiles')
        .select('full_name, school, sport, email')
        .eq('id', user.id)
        .single()

      setProfile(prof)

      // Generate personalized pitch
      const name = prof.full_name || prof.email.split('@')[0]
      const text = `Hey Mom/Dad,

I joined LocalHustle — an app where I earn money from sponsors by making clips.

Can you be my first sponsor? Set me a challenge!

Examples:
• 80 out of 100 free throws = $50
• Make 50 3-pointers = $75
• 30-min shoot-around video = $50

You fund it, I complete it, you approve, I get paid.

These count toward big brand deals (Nike, Gatorade).

Link: ${window.location.origin}?ref=${user.id}

Thanks!
– ${name}
${prof.school || 'My school'} ${prof.sport || 'athlete'}`

      setPitchText(text)
    }

    fetchProfile()
  }, [router])

  const copyPitch = () => {
    navigator.clipboard.writeText(pitchText)
    alert('Pitch copied — send to your parent!')
  }

  if (!profile) return <p className="container text-center py-32">Loading...</p>

  return (
    <div className="min-h-screen bg-white text-black font-mono py-8 px-4 sm:px-8">
      {/* Slogan + Triangle */}
      <p className="text-2xl sm:text-3xl text-center mb-4">
        Community Driven Support for Student Athletes
      </p>
      <div className="text-5xl sm:text-6xl text-center mb-12">▼</div>

      {/* Hero */}
      <h1 className="text-3xl sm:text-5xl font-bold text-center mb-8">
        Your First Gig: Challenge Your Parent
      </h1>
      <p className="text-lg sm:text-2xl text-center mb-16 max-w-4xl mx-auto leading-relaxed">
        Turn allowance into earned money — complete challenges, get paid fast.<br />
        Parent gigs count toward brand deal qualification (4 needed).
      </p>

      {/* Why */}
      <div className="max-w-3xl mx-auto mb-16 p-8 bg-gray-100 border-4 border-black">
        <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-center">
          Why Start with Your Parent?
        </h2>
        <ul className="text-lg sm:text-xl space-y-4 text-left max-w-2xl mx-auto">
          <li>• They already support you — now tie it to hustle.</li>
          <li>• First payout guaranteed — see the app works.</li>
          <li>• Counts toward big brand deals (Nike, Gatorade).</li>
          <li>• Better than allowance — earn for effort.</li>
        </ul>
      </div>

      {/* Ready-Made Challenges */}
      <div className="max-w-4xl mx-auto mb-16">
        <h2 className="text-2xl sm:text-3xl font-bold mb-8 text-center">
          Ready-Made Challenges
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="p-8 bg-gray-100 border-4 border-black">
            <p className="text-xl font-bold mb-4">80 out of 100 Free Throws</p>
            <p className="text-3xl font-bold">$50</p>
          </div>
          <div className="p-8 bg-gray-100 border-4 border-black">
            <p className="text-xl font-bold mb-4">Make 50 3-Pointers</p>
            <p className="text-3xl font-bold">$75</p>
          </div>
          <div className="p-8 bg-gray-100 border-4 border-black">
            <p className="text-xl font-bold mb-4">30-Min Shoot-Around Video</p>
            <p className="text-3xl font-bold">$50</p>
          </div>
        </div>
      </div>

      {/* Pitch to Parent */}
      <div className="max-w-3xl mx-auto mb-16 p-8 bg-gray-100 border-4 border-black">
        <h2 className="text-2xl sm:text-3xl font-bold mb-8 text-center">
          Pitch Your Parent
        </h2>
        <pre className="text-left whitespace-pre-wrap text-base sm:text-lg mb-8 p-4 bg-white border-2 border-black">
          {pitchText}
        </pre>
        <Button onClick={copyPitch} className="w-full max-w-md h-20 text-2xl bg-black text-white">
          Copy & Send to Parent
        </Button>
      </div>

      {/* What Next */}
      <div className="max-w-3xl mx-auto mb-16">
        <h2 className="text-2xl sm:text-3xl font-bold mb-8 text-center">
          What Happens Next
        </h2>
        <ol className="text-lg sm:text-xl space-y-6 text-left max-w-2xl mx-auto">
          <li>1. Parent gets message → signs up as business.</li>
          <li>2. Funds challenge gig (custom or template).</li>
          <li>3. You complete → upload video proof.</li>
          <li>4. Parent approves → you get paid!</li>
          <li>5. Counts as 1/4 gigs for brand deals.</li>
        </ol>
      </div>

      <Button 
        onClick={() => router.push('/dashboard')}
        className="w-full max-w-md h-20 text-2xl bg-black text-white mx-auto block"
      >
        Back to Dashboard
      </Button>
    </div>
  )
}