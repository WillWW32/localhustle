'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { signOut } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Image from 'next/image'

export default function Home() {
  const [email, setEmail] = useState('')
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({ email })
    if (error) alert(error.message)
    else alert('Check your email for the login link.')
    setLoading(false)
  }

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)

      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single()

        if (!profile?.role) {
          router.push('/select-role')
        } else {
          router.push('/dashboard')
        }
      }
    }

    checkSession()

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single()

        if (!profile?.role) {
          router.push('/select-role')
        } else {
          router.push('/dashboard')
        }
      }
    })

    return () => listener.subscription.unsubscribe()
  }, [router])

  return (
    <div className="container py-32">
      {/* Logo */}
      <div className="text-center mb-20 animate-fadeIn">
        <Image
          src="/logo.jpg"
          alt="LocalHustle Logo"
          width={300}
          height={300}
          className="mx-auto hover:scale-105 transition-transform duration-300"
          priority
        />
      </div>

      {/* Title */}
      <h1 className="text-center text-6xl mb-16 font-bold tracking-tight animate-fadeIn">
        LocalHustle
      </h1>

      {/* Slogan */}
      <p className="text-center text-4xl mb-32 font-mono animate-fadeIn animation-delay-300">
        Community Driven Support for Student Athletes
      </p>

      {/* Benefits Grid */}
      <div className="grid md:grid-cols-2 gap-24 mb-40 animate-fadeIn animation-delay-600">
        <div className="text-center">
          <h2 className="text-4xl mb-12 font-bold">For Student Athletes</h2>
          <ul className="space-y-8 text-xl font-mono max-w-md mx-auto">
            <li>• Earn real money — $50–$1000 per gig for gas, gear, lunch, or savings.</li>
            <li>• Local exposure to business owners and entrepreneurs in your town.</li>
            <li>• Build relationships that lead to scholarships and letters of recommendation.</li>
            <li>• Safe, private gigs — no forced public posting, parent-approved payouts.</li>
            <li>• Resume-building experience that shows initiative and character.</li>
          </ul>
        </div>

        <div className="text-center">
          <h2 className="text-4xl mb-12 font-bold">For Local Businesses</h2>
          <ul className="space-y-8 text-xl font-mono max-w-md mx-auto">
            <li>• Fresh, authentic content for social media from kids parents trust.</li>
            <li>• Become the hometown hero — visible support for local teams.</li>
            <li>• Discover motivated teens — potential future employees.</li>
            <li>• Better advertising than paid ads — real stories from real athletes.</li>
            <li>• Only pay for clips you love — zero risk, total control.</li>
          </ul>
        </div>
      </div>

      {/* Login Form */}
      {user ? (
        <div className="text-center space-y-8 animate-fadeIn animation-delay-900">
          <p className="text-2xl">Logged in as {user.email}</p>
          <p className="text-lg">Redirecting to dashboard...</p>
        </div>
      ) : (
        <div className="max-w-md mx-auto space-y-20 animate-fadeIn animation-delay-900">
          <div className="space-y-8">
            <Label htmlFor="email" className="text-4xl block">Your Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@school.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="py-16 text-3xl border-4 border-black text-center"
            />
          </div>

          <Button onClick={handleLogin} disabled={loading} className="w-full py-20 text-5xl border-8 border-black bg-black text-white hover:scale-105 hover:bg-gray-900 transition-all duration-300">
            {loading ? 'Sending...' : 'Send Login Link'}
          </Button>
        </div>
      )}
    </div>
  )
}