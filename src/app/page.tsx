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

      <div className="min-h-screen bg-white text-black font-mono">
        {/* Hero */}
        <section className="py-20 px-6 sm:px-12 lg:px-32 text-center">
          <div className="bg-black text-white p-16 mb-16">
            <h2 className="text-3xl sm:text-5xl font-bold leading-tight">
              We Connect Local Businesses with Student Athletes<br />
              for Scholarships & NIL Deals
            </h2>
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

        {/* How It Works */}
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
                Unrestricted cash awarded by businesses or the platform paid instantly to the athlete.<br />
                No strings attached — use for books, food, rent — whatever they need to succeed.
              </p>
            </div>
          </div>
        </section>
        
                {/* Key Outcomes Grid — Ties Directly to Top 12 */}
        <section className="py-24 px-6 sm:px-12 lg:px-32">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-16">
            Real Impact for Everyone
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 max-w-6xl mx-auto">
            <div className="bg-green-100 p-12 border-4 border-green-600 text-center">
              <p className="text-2xl font-bold mb-4">Athletes Stay in Sport</p>
              <p className="text-lg">Earn money early → less likely to quit due to costs</p>
            </div>

            <div className="bg-green-100 p-12 border-4 border-green-600 text-center">
              <p className="text-2xl font-bold mb-4">Freedom Scholarships</p>
              <p className="text-lg">Complete 4 gigs → unlock unrestricted cash for college</p>
            </div>

            <div className="bg-green-100 p-12 border-4 border-green-600 text-center">
              <p className="text-2xl font-bold mb-4">Parents Relieved</p>
              <p className="text-lg">Kid earns their way → less financial pressure on family</p>
            </div>

            <div className="bg-green-100 p-12 border-4 border-green-600 text-center">
              <p className="text-2xl font-bold mb-4">Businesses Win Big</p>
              <p className="text-lg">Authentic content + hero status in community</p>
            </div>

            <div className="bg-green-100 p-12 border-4 border-green-600 text-center">
              <p className="text-2xl font-bold mb-4">Kids Learn Hustle</p>
              <p className="text-lg">Real work → entrepreneurship → financial literacy</p>
            </div>

            <div className="bg-green-100 p-12 border-4 border-green-600 text-center">
              <p className="text-2xl font-bold mb-4">Stronger Towns</p>
              <p className="text-lg">Local support loops back into youth sports</p>
            </div>
          </div>
        </section>

        {/* Emotional Close */}
        <section className="py-24 px-6 sm:px-12 lg:px-32 text-center bg-gray-50">
          <p className="text-2xl sm:text-3xl max-w-4xl mx-auto leading-relaxed">
            Real money. Real scholarships.<br />
            Keep kids in sports longer. Build stronger communities.
          </p>
        </section>

               {/* Bottom CTA — Role Button = Submit with Onboard Paths */}
        <section className="py-32 px-6 sm:px-12 lg:px-32 text-center bg-white">
          <div className="max-w-lg mx-auto space-y-16">

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
              <div className="grid grid-cols-1 gap-8 max-w-xs mx-auto">
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