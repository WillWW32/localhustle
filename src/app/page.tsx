'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function Home() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const sendMagicLink = async (path: string) => {
    if (!email.trim()) {
      alert('Please enter your email')
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `https://app.localhustle.org${path}`,
      },
    })

    if (error) {
      alert('Error: ' + error.message)
    } else {
      alert('🎉 Magic link sent! Check your email.')
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-white text-black font-mono">
      {/* Hero Section */}
      <section className="py-20 px-6 sm:px-12 lg:px-32 text-center">
       

        {/* "We Connect..." — Black Block Style */}
        <div className="bg-black text-white p-12 mb-16">
          <h2 className="text-3xl sm:text-5xl font-bold !text-white leading-tight">
            We Connect Local Businesses with Student Athletes<br />
            for Scholarships & NIL Deals
          </h2>
        </div>

        {/* Subheadline */}
        <p className="text-xl sm:text-2xl mb-24 max-w-4xl mx-auto leading-relaxed">
          Student athletes earn <strong>Freedom Scholarships</strong> — unrestricted cash paid instantly — 
          plus NIL gigs from local supporters.<br />
          Parents fund improvement. Businesses become hometown heroes.
        </p>
      </section>

      {/* Dashed Divider */}
      <hr className="border-t-4 border-dashed border-black my-24 max-w-5xl mx-auto" />

      {/* Benefits Grid */}
      <section className="px-6 sm:px-12 lg:px-32 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-16 max-w-6xl mx-auto">
          
          <div className="h-32"></div>
    </div>
    
          {/* Student Athletes */}
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-6">Student Athletes</h2>
            <h3 className="text-2xl font-bold mb-6">
              Earn Money & Freedom Scholarships<br />
              for Your Hustle
            </h3>
            <p className="text-lg leading-relaxed px-4">
              Get paid instantly for gigs + unrestricted scholarships from local businesses.<br />
              Use for books, food, rent — whatever you need.<br />
              Build recruiting profile coaches see.
            </p>
          </div>

          <div className="h-32"></div>
    </div>

          {/* Parents */}
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-6">Parents</h2>
            <h3 className="text-2xl font-bold mb-6">
              Less Financial Stress,<br />
              Help Them Earn Real Scholarships
            </h3>
            <p className="text-lg leading-relaxed px-4">
              Fund improvement, not handouts.<br />
              Your kid earns money and Freedom Scholarships.<br />
              Teach hustle pays.
            </p>
          </div>

          <div className="h-32"></div>
    </div>

          {/* Businesses */}
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-6">Businesses</h2>
            <h3 className="text-2xl font-bold mb-6">
              Best Local Advertising +<br />
              Become the Hometown Hero
            </h3>
            <p className="text-lg leading-relaxed px-4">
              Authentic clips from trusted kids.<br />
              Award Freedom Scholarships — paid instantly.<br />
              Real community impact that lasts.
            </p>
          </div>
        </div>
      </section>

      <div className="h-32"></div>
    </div>

      {/* Bottom CTA — Email + Role Buttons */}
      <section className="pb-20 text-center px-6 sm:px-12 lg:px-32">
        <p className="text-2xl mb-12">Ready to get started?</p>

        <div className="w-full max-w-md mx-auto space-y-12">
          <Input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-20 text-2xl text-center border-4 border-black"
          />

          <div className="space-y-6">
            <Button
              onClick={() => sendMagicLink('/get-started')}
              disabled={loading}
              className="w-full h-20 text-2xl bg-black text-white font-bold"
            >
              I'm a Student Athlete
            </Button>

            <Button
              onClick={() => sendMagicLink('/business-onboard')}
              disabled={loading}
              className="w-full h-20 text-2xl bg-purple-600 text-white font-bold"
            >
              I'm a Business or Parent Sponsor
            </Button>
          </div>

          {loading && (
            <p className="text-center text-xl mt-4">Sending magic link...</p>
          )}
        </div>
      </section>

      {/* Extra Space Below CTA */}
      <div className="h-32"></div>
    </div>
  )
}