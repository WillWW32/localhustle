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

    let path = '/dashboard'
    if (role === 'athlete') path = '/get-started'
    if (role === 'parent') path = '/parent-onboard'
    if (role === 'business') path = '/business-onboard'

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
        
        {/* Open Graph */}
        <meta property="og:title" content="LocalHustle — NIL Money & Scholarships for High School & College Athletes" />
        <meta property="og:description" content="Earn instant cash and Freedom Scholarships from local businesses. Basketball, football, soccer, baseball, volleyball — all sports. Parents and businesses join the movement." />
        <meta property="og:image" content="https://app.localhustle.org/og-image.jpg" />
        <meta property="og:url" content="https://app.localhustle.org" />
        <meta property="og:type" content="website" />
      </Head>

      <div className="min-h-screen bg-white text-black font-mono">
        {/* Hero */}
        <section className="py-20 px-6 sm:px-12 lg:px-32 text-center">
          <div className="bg-black text-white p-16 mb-16 inline-block">
            <h1 className="text-3xl sm:text-5xl font-bold leading-tight">
              We Connect Local Businesses with Student Athletes<br />
              for Scholarships & NIL Deals
            </h1>
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
              <div className="bg-black text-white p-8 mb-6">
                <h2 className="text-2xl font-bold">Student Athletes</h2>
              </div>
              <p className="text-lg leading-relaxed px-4">
                Earn money instantly + Freedom Scholarships.<br />
                Complete 4 gigs → qualify for national brand deals.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-black text-white p-8 mb-6">
                <h2 className="text-2xl font-bold">Parents</h2>
              </div>
              <p className="text-lg leading-relaxed px-4">
                Less financial stress.<br />
                Help your kid earn real money & scholarships.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-black text-white p-8 mb-6">
                <h2 className="text-2xl font-bold">Businesses</h2>
              </div>
              <p className="text-lg leading-relaxed px-4">
                Best local advertising + become the hometown hero.<br />
                Award Freedom Scholarships — real impact.
              </p>
            </div>
          </div>
        </section>

        {/* Emotional Close */}
        <section className="py-24 px-6 sm:px-12 lg:px-32 text-center bg-gray-50">
          <p className="text-2xl sm:text-3xl max-w-4xl mx-auto leading-relaxed">
            Real money. Real scholarships. Real community.<br />
            Keep kids in sports. Build stronger towns.
          </p>
        </section>

        {/* Bottom CTA */}
        <section className="py-24 px-6 sm:px-12 lg:px-32 text-center">
          <p className="text-2xl mb-12">Who are you?</p>

          <div className="w-full max-w-lg mx-auto space-y-12">
            {/* Email Field First */}
            <Input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-20 text-2xl text-center border-4 border-black"
            />

            {/* 3 Role Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Button
                onClick={() => setRole('athlete')}
                variant={role === 'athlete' ? 'default' : 'outline'}
                className="h-20 text-xl sm:text-2xl font-bold"
              >
                Student Athlete
              </Button>

              <Button
                onClick={() => setRole('parent')}
                variant={role === 'parent' ? 'default' : 'outline'}
                className="h-20 text-xl sm:text-2xl font-bold"
              >
                Parent
              </Button>

              <Button
                onClick={() => setRole('business')}
                variant={role === 'business' ? 'default' : 'outline'}
                className="h-20 text-xl sm:text-2xl font-bold"
              >
                Business
              </Button>
            </div>

            {/* Go Button */}
            <Button
              onClick={sendMagicLink}
              disabled={loading || !role}
              className="w-full h-20 text-3xl bg-black text-white font-bold"
            >
              {loading ? 'Sending...' : 'Go'}
            </Button>
          </div>

          {loading && (
            <p className="text-center text-xl mt-4">Sending magic link...</p>
          )}
        </div>
      </section>
    </div>
  )
}