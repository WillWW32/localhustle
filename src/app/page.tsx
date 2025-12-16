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
    <div className="container py-20">
      {/* Logo */}
      <div className="text-center mb-16">
        <Image
          src="/logo.jpg"
          alt="LocalHustle Logo"
          width={250}
          height={250}
          className="mx-auto"
          priority
        />
      </div>

      {/* Slogan */}
      <h2 className="text-center text-6xl mb-24 font-serif tracking-tight">
        Community Driven Support for Student Athletes
      </h2>

      {/* Benefits Grid */}
      <div className="grid md:grid-cols-2 gap-16 mb-32">
        <div>
          <h3 className="text-3xl mb-8 font-serif">For Student Athletes</h3>
          <ul className="space-y-6 text-lg">
            <li><span className="font-mono text-2xl mr-2">••</span> Earn real money — $50–$1000 per gig for gas, gear, lunch, or savings.</li>
            <li><span className="font-mono text-2xl mr-2">••</span> Local exposure to business owners and entrepreneurs in your town.</li>
            <li><span className="font-mono text-2xl mr-2">••</span> Build relationships that lead to scholarships and letters of recommendation.</li>
            <li><span className="font-mono text-2xl mr-2">••</span> Safe, private gigs — no forced public posting, parent-approved payouts.</li>
            <li><span className="font-mono text-2xl mr-2">••</span> Resume-building experience that shows initiative and character.</li>
          </ul>
        </div>

        <div>
          <h3 className="text-3xl mb-8 font-serif">For Local Businesses</h3>
          <ul className="space-y-6 text-lg">
            <li><span className="font-mono text-2xl mr-2">••</span> Fresh, authentic content for social media from kids parents trust.</li>
            <li><span className="font-mono text-2xl mr-2">••</span> Become the hometown hero — visible support for local teams.</li>
            <li><span className="font-mono text-2xl mr-2">••</span> Discover motivated teens — potential future employees.</li>
            <li><span className="font-mono text-2xl mr-2">••</span> Better advertising than paid ads — real stories from real athletes.</li>
            <li><span className="font-mono text-2xl mr-2">••</span> Only pay for clips you love — zero risk, total control.</li>
          </ul>
        </div>
      </div>

      {/* Login Form */}
      {user ? (
        <div className="max-w-md mx-auto space-y-8 text-center">
          <p className="text-lg">Logged in as {user.email}</p>
          <p className="text-sm">Redirecting to dashboard...</p>
        </div>
      ) : (
        <div className="max-w-md mx-auto space-y-16">
          <div className="space-y-6">
            <Label htmlFor="email" className="text-3xl block text-center">Your Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@school.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full text-2xl py-12 border-4 border-black text-center"
            />
          </div>

          <Button onClick={handleLogin} disabled={loading} className="w-full text-4xl py-16 border-8 border-black hover:bg-black hover:text-white">
            {loading ? 'Sending...' : 'Send Login Link'}
          </Button>
        </div>
      )}
    </div>
  )
}