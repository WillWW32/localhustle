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
        emailRedirectTo: `${process.env.NEXT_PUBLIC_URL}${path}`,
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
    <div className="min-h-screen bg-white text-black font-mono flex flex-col items-center justify-center px-4">
      {/* Slogan */}
      <p className="text-2xl sm:text-3xl text-center mb-8">
        Community Driven Support for Student Athletes
      </p>

      {/* Main H2 */}
      <h1 className="text-4xl sm:text-6xl font-bold text-center mb-12 max-w-5xl">
        We Connect Local Businesses with Student Athletes<br />
        for Scholarships & NIL Deals
      </h1>

      {/* Subheadline with Freedom Scholarships Explained */}
      <p className="text-xl sm:text-3xl text-center mb-24 max-w-4xl">
        Student athletes earn <strong>Freedom Scholarships</strong> — unrestricted cash paid instantly — 
        plus NIL gigs from local supporters.<br />
        Parents fund improvement. Businesses become hometown heroes.
      </p>

      {/* Benefits Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-5xl mx-auto my-24 px-8">
        {/* For Student Athletes */}
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-8">Student Athletes</h2>
          <h3 className="text-2xl font-bold mb-6">
            Earn Money & Freedom Scholarships<br />
            for Your Hustle
          </h3>
          <p className="text-lg">
            Get paid instantly for gigs + unrestricted scholarships from local businesses.<br />
            Use for books, food, rent — whatever you need.<br />
            Build recruiting profile coaches see.
          </p>
        </div>

        {/* For Parents */}
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-8">Parents</h2>
          <h3 className="text-2xl font-bold mb-6">
            Less Financial Stress,<br />
            Help Them Earn Real Scholarships
          </h3>
          <p className="text-lg">
            Fund improvement, not handouts.<br />
            Your kid earns money and Freedom Scholarships.<br />
            Teach hustle pays.
          </p>
        </div>

        {/* For Businesses */}
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-8">Businesses</h2>
          <h3 className="text-2xl font-bold mb-6">
            Best Local Advertising +<br />
            Become the Hometown Hero
          </h3>
          <p className="text-lg">
            Authentic clips from trusted kids.<br />
            Award Freedom Scholarships — paid instantly.<br />
            Real Community Impact that lasts.
          </p>
        </div>
      </div>

      {/* Bottom CTA — Email + Role Buttons */}
      <div className="w-full max-w-md space-y-12 my-24">
        <p className="text-2xl text-center mb-8">Ready to get started?</p>

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
            className="w-full h-20 text-2xl sm:text-3xl bg-black text-white font-bold"
          >
            I'm a Student Athlete
          </Button>

          <Button
            onClick={() => sendMagicLink('/business-onboard')}
            disabled={loading}
            className="w-full h-20 text-2xl sm:text-3xl bg-purple-600 text-white font-bold"
          >
            I'm a Business or Parent Sponsor
          </Button>
        </div>

        {loading && (
          <p className="text-center text-xl">Sending magic link...</p>
        )}
      </div>
    </div>
  )
}