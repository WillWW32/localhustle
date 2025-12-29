'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Head from 'next/head'

type Role = 'athlete' | 'parent' | 'business'

export default function Home() {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<Role | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const sendMagicLink = async () => {
    if (!email.trim()) {
      alert('Please enter your email')
      return
    }
    if (!role) {
      alert('Please select your role')
      return
    }

    setLoading(true)

    const paths = {
    athlete: '/get-started',
    parent: '/parent-onboard',
    business: '/business-onboard',
  }

  const redirectPath = paths[role]

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `https://app.localhustle.org${path}`,
      },
    })

    if (error) {
      alert('Error: ' + error.message)
    } else {
      alert('Magic link sent! Check your email.')
    }

    setLoading(false)
  }

  return (
    <>
      <Head>
        <title>LocalHustle — Earn NIL Money & Scholarships for High School & College Athletes</title>
        <meta name="description" content="LocalHustle helps high school and college athletes earn instant cash, Freedom Scholarships, and NIL deals from local businesses. Basketball NIL, football NIL, soccer, baseball, volleyball — all sports welcome. Parents fund improvement. Businesses become hometown heroes." />
        <meta name="keywords" content="high school athlete NIL, college athlete NIL, basketball NIL, football NIL, soccer NIL, baseball NIL, volleyball NIL, student athlete earnings, local business sponsorship, Freedom Scholarships, youth sports funding, athlete scholarships, NIL deals high school, NIL deals college" />
        <meta name="robots" content="index, follow" />
        <meta property="og:title" content="LocalHustle — NIL Money & Scholarships for High School & College Athletes" />
        <meta property="og:description" content="Earn instant cash and Freedom Scholarships from local businesses. Basketball, football, soccer, baseball, volleyball — all sports. Parents and businesses join the movement." />
        <meta property="og:image" content="https://app.localhustle.org/og-image.jpg" />
        <meta property="og:url" content="https://app.localhustle.org" />
        <meta property="og:type" content="website" />
      </Head>

      <div className="min-h-screen bg-white text-black font-mono">
        {/* Hero */}
        <section className="py-20 px-6 sm:px-12 lg:px-32 text-center">
          <div className="subhead-white-black">
              We Connect Local Businesses with Student Athletes<br />
              for Scholarships & NIL Deals
          </div>

          <p className="text-xl sm:text-2xl mb-24 max-w-4xl mx-auto leading-relaxed">
            Earn money instantly. Get Freedom Scholarships — unrestricted cash paid today.<br />
            Parents fund improvement. Businesses become hometown heroes.
          </p>
        </section>

        {/* Benefits Grid */}
<section className="px-6 sm:px-12 lg:px-32 pb-24">
  <div className="grid grid-cols-1 md:grid-cols-3 gap-16 max-w-6xl mx-auto">
    <div className="text-center">
      <div className="subhead-white-black">
        Student Athletes
      </div>
      <p className="text-lg leading-relaxed px-4">
        • Earn money instantly with gigs + Freedom Scholarships.<br />
        • Complete 4 gigs → qualify for national brand deals.
      </p>
    </div>

    <div className="text-center">
      <div className="subhead-white-black">
        Parent
      </div>
      <p className="text-lg leading-relaxed px-4">
        • Less financial stress.<br />
        • Help your kid earn real money & scholarships.
      </p>
    </div>

    <div className="text-center">
      <div className="subhead-white-black">
        Businesses
      </div>
      <p className="text-lg leading-relaxed px-4">
        • Best local advertising + become the hometown hero.<br />
        • Award Freedom Scholarships — real community impact.
      </p>
    </div>
  </div>
</section>
        
        {/* How It Works — Define Key Terms */}
<section className="py-24 px-6 sm:px-12 lg:px-32 bg-gray-50">
  <h2 className="text-3xl sm:text-4xl font-bold text-center mb-16">
    How It Works
  </h2>

  <div className="max-w-4xl mx-auto space-y-16">
    <div className="bg-white p-12 border-4 border-black">
      <h3 className="text-2xl font-bold mb-6">What is a Gig?</h3>
      <p className="text-lg leading-relaxed">
        A gig is a simple task funded by a local business — like making a 15-second shoutout video, running a youth clinic, or competing in a challenge.<br />
        Athletes complete the gig → business approves → athlete gets paid instantly.
      </p>
    </div>

    <div className="bg-white p-12 border-4 border-black">
      <h3 className="text-2xl font-bold mb-6">What is a Freedom Scholarship?</h3>
      <p className="text-lg leading-relaxed">
        Unrestricted cash awarded by businesses or the platform — paid instantly to the athlete.<br />
        No strings attached — use for books, food, rent, gear — whatever they need to succeed.
      </p>
    </div>
  </div>
</section>

        {/* Emotional Close */}
        <section className="py-24 px-6 sm:px-12 lg:px-32 text-center bg-gray-50">
          <p className="text-2xl sm:text-3xl max-w-4xl mx-auto leading-relaxed">
            Real money. Real scholarships. Real NIL deals.<br />
            Keep kids in sports. Build stronger communities.
          </p>
        </section>

       {/* Bottom CTA — 3-Stage Toggle with Hard-Wired Onboarding */}
<section className="py-24 px-6 sm:px-12 lg:px-32 text-center">
  <p className="text-2xl mb-12">Who are you?</p>

  <div className="w-full max-w-lg mx-auto space-y-12">
    {/* Role Selector — Strong Selected State, No Variant */}
    <div className="grid grid-cols-1 gap-6">
      <button
        onClick={() => setRole('athlete')}
        className={`w-full h-20 text-2xl font-bold transition-all rounded-none border-4 border-black ${
          role === 'athlete'
            ? 'bg-black text-white'
            : 'bg-white text-black hover:bg-gray-50'
        }`}
      >
        Student Athlete
      </button>

      <button
        onClick={() => setRole('parent')}
        className={`w-full h-20 text-2xl font-bold transition-all rounded-none border-4 border-black ${
          role === 'parent'
            ? 'bg-green-600 text-white'
            : 'bg-white text-black hover:bg-gray-50'
        }`}
      >
        Parent
      </button>

      <button
        onClick={() => setRole('business')}
        className={`w-full h-20 text-2xl font-bold transition-all rounded-none border-4 border-black ${
          role === 'business'
            ? 'bg-purple-600 text-white'
            : 'bg-white text-black hover:bg-gray-50'
        }`}
      >
        Business
      </button>
    </div>

    {/* Email */}
    <Input
      type="email"
      placeholder="your@email.com"
      value={email}
      onChange={(e) => setEmail(e.target.value)}
      className="h-20 text-2xl text-center border-4 border-black"
    />

    {/* Go Button — Sends to Correct Onboarding */}
    <Button
      onClick={sendMagicLink}
      disabled={loading || !role}
      className="w-full h-20 text-3xl bg-black text-white font-bold"
    >
      {loading ? 'Sending...' : 'Go'}
    </Button>

    {loading && (
      <p className="text-center text-xl mt-4">Sending magic link...</p>
    )}
  </div>
</section>
      </div>
    </>
  )
}