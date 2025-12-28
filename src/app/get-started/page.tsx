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

      if (!prof) {
        alert('Profile not found — please try logging in again')
        router.replace('/')
        return
      }

      setProfile(prof)

      // Generate personalized pitch
      const name = prof.full_name || prof.email.split('@')[0]
      const text = `Hey Mom/Dad,

I've been using LocalHustle — an app where I can earn real money and Freedom Scholarships from local businesses for completing fun challenges.

To get started, I need you to be my first sponsor (it's easy!).

Just click this link, add $50–$100 to a challenge, and when I complete it, I get paid instantly.

Plus — businesses can award Freedom Scholarships (unrestricted cash for college — books, food, rent — whatever I need).

It teaches hustle pays, and helps with college costs.

Can you be my first sponsor? Here's the link:

https://app.localhustle.org/parent-onboard?kid_id=${profile.id}

Love,
${name}
${prof.school ? prof.school + ' ' : ''}${prof.sport ? prof.sport : ''}`

      setPitchText(text)
    }

    fetchProfile()
  }, [router])

  const copyPitch = () => {
    navigator.clipboard.writeText(pitchText)
    alert('Pitch copied! Send it to your parent.')
  }

  if (!profile) return <p className="container text-center py-32">Loading...</p>

  return (
    <div className="min-h-screen bg-white text-black font-mono py-16 px-4">
      {/* Hero */}
      <h1 className="text-4xl sm:text-6xl font-bold text-center mb-12">
        Get Your Parent to Sponsor You
      </h1>

      <p className="text-xl sm:text-3xl text-center mb-16 max-w-4xl mx-auto">
        Send this message — they fund a challenge → you earn money + Freedom Scholarships instantly.
      </p>

      {/* Pitch Letter */}
      <div className="max-w-3xl mx-auto mb-24">
        <div className="bg-gray-100 p-12 border-4 border-black">
          <pre className="text-left whitespace-pre-wrap text-base">
            {pitchText}
          </pre>
        </div>

        <Button onClick={copyPitch} className="w-full max-w-md h-20 text-2xl bg-black text-white mt-8 mx-auto block">
          Copy & Send to Parent
        </Button>
      </div>

      {/* Freedom Scholarships Callout */}
      <div className="max-w-3xl mx-auto mb-24 p-12 bg-green-100 border-4 border-green-600">
        <h2 className="text-3xl font-bold text-center mb-8">
          Freedom Scholarships — Real Money for College
        </h2>
        <p className="text-xl text-center">
          Businesses can award unrestricted scholarships on any gig.<br />
          Paid instantly to you — use for books, food, rent — whatever you need.
        </p>
      </div>

      {/* What Next */}
      <div className="max-w-3xl mx-auto mb-24">
        <h2 className="text-3xl font-bold text-center mb-12">
          What Happens Next
        </h2>
        <ol className="text-xl space-y-8 text-left max-w-2xl mx-auto list-decimal pl-8">
          <li>Parent gets message → signs up as sponsor.</li>
          <li>Funds your first challenge gig.</li>
          <li>You complete → upload video proof.</li>
          <li>Parent approves → you get paid instantly!</li>
          <li>Counts toward brand deals + Freedom Scholarships.</li>
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