'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'

export default function GetStarted() {
  const [profile, setProfile] = useState<any>(null)
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
        .select('*')
        .eq('id', user.id)
        .single()

      if (prof) {
        setProfile(prof)
      }
    }

    fetchProfile()
  }, [router])

  const shareWithParent = () => {
    const message = `Hey Mom/Dad,

I joined LocalHustle — an app that lets me earn real money from challenges and scholarships.

Can you be my first sponsor? It's super easy — you fund a simple challenge, I complete it, and I get paid instantly.

This link lets you sponsor me: https://app.localhustle.org/parent-onboard?kid_id=${profile?.id || 'your-id'}

Thanks! Love you.

– ${profile?.full_name || 'Me'}`

    if (navigator.share) {
      navigator.share({ text: message }).catch(() => {
        navigator.clipboard.writeText(message)
        alert('Message copied! Paste into Messages.')
      })
    } else {
      navigator.clipboard.writeText(message)
      alert('Message copied! Paste into Messages.')
    }
  }

  if (!profile) return <p className="text-center py-32 text-2xl">Loading...</p>

  return (
    <div className="min-h-screen bg-white text-black font-mono py-20 px-6 text-center">
      {/* Hero Block */}
      <div className="bg-black text-white p-16 mb-20">
        <h1 className="text-5xl sm:text-7xl font-bold">
          Get Your First Sponsor
        </h1>
      </div>

      <div className="max-w-4xl mx-auto space-y-24">
        {/* Subhead Block */}
        <div className="bg-green-600 text-white p-12 inline-block">
          <h2 className="text-4xl sm:text-5xl font-bold">
            Ask Your Parent — Easiest Way to Start Earning
          </h2>
        </div>

        <p className="text-xl sm:text-2xl leading-relaxed mb-16">
          Most athletes get their first money from a parent sponsoring a simple challenge.<br />
          It's fast, safe, and you get paid instantly.
        </p>

        {/* Steps */}
        <div className="space-y-8 text-left max-w-2xl mx-auto">
          <div className="bg-gray-100 p-8 border-4 border-black">
            <p className="text-xl font-bold mb-2">1. Send this message</p>
          </div>
          <div className="bg-gray-100 p-8 border-4 border-black">
            <p className="text-xl font-bold mb-2">2. They fund a challenge</p>
          </div>
          <div className="bg-gray-100 p-8 border-4 border-black">
            <p className="text-xl font-bold mb-2">3. You complete it + upload proof</p>
          </div>
          <div className="bg-gray-100 p-8 border-4 border-black">
            <p className="text-xl font-bold mb-2">4. They approve → you get paid instantly</p>
          </div>
          <div className="bg-gray-100 p-8 border-4 border-black">
            <p className="text-xl font-bold">5. Counts toward Freedom Scholarships + Brand Deals</p>
          </div>
        </div>

        {/* Message to Parent */}
        <div className="bg-gray-100 p-12 border-4 border-black mb-16">
          <h3 className="text-3xl font-bold mb-8">
            Ready-to-Send Message
          </h3>
          <pre className="text-left whitespace-pre-wrap text-base mb-12">
            {`Hey Mom/Dad,

I joined LocalHustle — an app that lets me earn real money from challenges and scholarships.

Can you be my first sponsor? It's super easy — you fund a simple challenge, I complete it, and I get paid instantly.

This link lets you sponsor me: https://app.localhustle.org/parent-onboard?kid_id=${profile.id}

Thanks! Love you.

– ${profile.full_name || 'Me'}`}
          </pre>

          <Button 
            onClick={shareWithParent}
            className="w-full max-w-md h-20 text-2xl bg-green-600 text-white font-bold"
          >
            Send to Parent
          </Button>
        </div>

        {/* Next Steps */}
        <div className="bg-purple-600 text-white p-12 inline-block mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold">
            Ready for More?
          </h2>
        </div>

        <p className="text-xl sm:text-2xl leading-relaxed mb-16">
          Once you have your first earnings, pitch local businesses and unlock Freedom Scholarships + Brand Deals.
        </p>

        <Button 
  onClick={() => router.push('/athlete-dashboard')}
  className="w-full max-w-md h-20 text-2xl bg-black text-white mx-auto block"
>
  Back to Dashboard
</Button>
      </div>
    </div>
  )
}