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

  const paths = {
  athlete: '/get-started',
  parent: '/parent-onboard',
  business: '/business-onboard',
}

const sendMagicLink = async (selectedRole: Role) => {
  if (!email.trim()) {
    alert('Please enter your email')
    return
  }

  setLoading(true)

  const redirectPath = paths[selectedRole]

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `https://app.localhustle.org${redirectPath}`,
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

      <div className="min-h-screen bg-white text-black font-mono form-page">
        {/* Hero */}
        <section className="py-12 px-6 sm:px-12 lg:px-32 text-center">
          <div className="bg-black text-white p-10 sm:p-14 mb-10">
            <h2 className="text-3xl sm:text-5xl font-bold leading-tight">
              We Connect Local Businesses with Student Athletes<br />
              for Scholarships &amp; NIL Deals
            </h2>
          </div>

          <p className="text-xl sm:text-2xl max-w-4xl mx-auto leading-relaxed">
            Earn money instantly. Get real scholarships.
            Parents fund improvement. Businesses become hometown heroes.
          </p>
        </section>

        {/* Benefits Grid */}
        <section className="px-6 sm:px-12 lg:px-32 pb-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="text-center">
              <div className="bg-black text-white p-6 mb-3">
                <h2 className="text-2xl font-bold">Student Athletes</h2>
              </div>
              <p className="text-lg leading-relaxed px-4">
                Earn money + scholarships. Complete 8 gigs to qualify for national brand deals. Stay in sport longer.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-black text-white p-6 mb-3">
                <h2 className="text-2xl font-bold">Parents</h2>
              </div>
              <p className="text-lg leading-relaxed px-4">
                Ease financial stress. Help your kid earn real money &amp; scholarships. Less pressure on the family.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-black text-white p-6 mb-3">
                <h2 className="text-2xl font-bold">Businesses</h2>
              </div>
              <p className="text-lg leading-relaxed px-4">
                Authentic local advertising. Real community impact. Hometown hero status.
              </p>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-16 px-6 sm:px-12 lg:px-32 bg-gray-50">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-10">
            How It Works
          </h2>

          <div className="max-w-4xl mx-auto space-y-8">
            <div className="bg-white p-8 border-4 border-black">
              <h3 className="text-2xl font-bold mb-4">What is a Gig?</h3>
              <p className="text-lg leading-relaxed">
                A simple task funded by a local business — like a 15-second shoutout video, a youth clinic, or a challenge.
                Athlete completes it, business approves, athlete gets paid instantly.
              </p>
            </div>

            <div className="bg-white p-8 border-4 border-black">
              <h3 className="text-2xl font-bold mb-4">What is a Freedom Scholarship?</h3>
              <p className="text-lg leading-relaxed">
                Unrestricted cash awarded by businesses, paid instantly to the athlete.
                No strings — use for books, food, rent, whatever they need.
              </p>
            </div>
          </div>
        </section>

        {/* College Recruitment */}
        <section className="py-16 px-6 sm:px-12 lg:px-32">
          <div className="max-w-5xl mx-auto">
            <div className="bg-black text-white p-10 sm:p-14 text-center mb-10">
              <h2 className="text-3xl sm:text-4xl font-bold">Get Recruited. Automatically.</h2>
              <p className="text-lg mt-4 opacity-80">
                We handle outreach to college coaches — emails, DMs, follow-ups on autopilot.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
              <div className="border-4 border-black p-6">
                <p className="text-2xl font-bold mb-2">01</p>
                <h3 className="font-bold mb-1">Create Profile</h3>
                <p className="text-sm" style={{ color: '#666' }}>Stats, highlights, achievements.</p>
              </div>
              <div className="border-4 border-black p-6">
                <p className="text-2xl font-bold mb-2">02</p>
                <h3 className="font-bold mb-1">Connect X Account</h3>
                <p className="text-sm" style={{ color: '#666' }}>Amplify visibility to coaches.</p>
              </div>
              <div className="border-4 border-black p-6">
                <p className="text-2xl font-bold mb-2">03</p>
                <h3 className="font-bold mb-1">We Handle Outreach</h3>
                <p className="text-sm" style={{ color: '#666' }}>Coaches in all 50 states. Real-time tracking.</p>
              </div>
            </div>

            <div className="text-center">
              <a href="/recruit" className="btn-fixed-200">Get Recruited</a>
            </div>
          </div>
        </section>

        {/* Mentorship */}
        <section className="py-16 px-6 sm:px-12 lg:px-32 bg-gray-50">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">Mentorship</h2>
            <p className="text-lg text-center mb-10 max-w-2xl mx-auto" style={{ color: '#666' }}>
              Connect with college athletes who&apos;ve been where you are.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
              <div className="border-4 border-black p-6">
                <p className="text-2xl font-bold mb-2" style={{ color: '#22c55e' }}>01</p>
                <h3 className="font-bold mb-1">For Athletes</h3>
                <p className="text-sm" style={{ color: '#666' }}>Get paired with a college athlete in your sport.</p>
              </div>
              <div className="border-4 border-black p-6">
                <p className="text-2xl font-bold mb-2" style={{ color: '#22c55e' }}>02</p>
                <h3 className="font-bold mb-1">For Mentors</h3>
                <p className="text-sm" style={{ color: '#666' }}>Share your experience. Earn $35/session.</p>
              </div>
              <div className="border-4 border-black p-6">
                <p className="text-2xl font-bold mb-2" style={{ color: '#22c55e' }}>03</p>
                <h3 className="font-bold mb-1">For Businesses</h3>
                <p className="text-sm" style={{ color: '#666' }}>Sponsor sessions. Fund youth development.</p>
              </div>
            </div>

            <div className="bg-black text-white p-8 text-center mb-10">
              <p className="text-3xl font-bold" style={{ color: '#22c55e' }}>$35</p>
              <p className="text-sm opacity-80">per 30-minute session</p>
            </div>

            <div className="text-center">
              <a href="/mentorship" className="btn-fixed-200">Find a Mentor</a>
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="py-16 px-6 sm:px-12 lg:px-32 text-center bg-white">
          <div className="max-w-lg mx-auto space-y-10">

            <div>
              <p className="text-2xl mb-4 text-gray-600 font-mono">Enter your email</p>
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-20 text-2xl text-center border-4 border-black font-mono"
              />
            </div>

            <div>
              <p className="text-2xl mb-8 text-gray-600 font-mono">Choose your role</p>
              <div className="grid grid-cols-1 gap-6 max-w-xs mx-auto">
                <button
                  onClick={() => {
                    if (!email.trim()) {
                      alert('Please enter your email')
                      return
                    }
                    setRole('athlete')
                    sendMagicLink('athlete')
                  }}
                  disabled={loading}
                  className={`btn-fixed-200 ${role === 'athlete' ? 'selected' : ''}`}
                >
                  {loading && role === 'athlete' ? 'Sending...' : 'Student Athlete'}
                </button>

                <button
                  onClick={() => {
                    if (!email.trim()) {
                      alert('Please enter your email')
                      return
                    }
                    setRole('parent')
                    sendMagicLink('parent')
                  }}
                  disabled={loading}
                  className={`btn-fixed-200 ${role === 'parent' ? 'selected' : ''}`}
                >
                  {loading && role === 'parent' ? 'Sending...' : 'Parent'}
                </button>

                <button
                  onClick={() => {
                    if (!email.trim()) {
                      alert('Please enter your email')
                      return
                    }
                    setRole('business')
                    sendMagicLink('business')
                  }}
                  disabled={loading}
                  className={`btn-fixed-200 ${role === 'business' ? 'selected' : ''}`}
                >
                  {loading && role === 'business' ? 'Sending...' : 'Business'}
                </button>
              </div>
            </div>

            {loading && (
              <p className="text-xl text-gray-600 animate-pulse font-mono">
                Sending magic link...
              </p>
            )}
          </div>
        </section>
      </div>
    </>
  )
}