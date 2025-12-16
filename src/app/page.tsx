'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { signOut } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

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
    <div className="container">
      <h1 className="text-5xl mb-12">LocalHustle</h1>
      <p className="text-2xl mb-24">Community Driven Support for Student Athletes</p>

      <div className="grid md:grid-cols-2 gap-16 mb-24">
        <div>
          <h2 className="text-3xl mb-8">For Student Athletes</h2>
          <ul className="space-y-6 text-lg">
            <li>• Earn real money — $50–$1000 per gig for gas, gear, lunch, or savings.</li>
            <li>• Local exposure to business owners and entrepreneurs in your town.</li>
            <li>• Build relationships that lead to scholarships and letters of recommendation.</li>
            <li>• Safe, private gigs — no forced public posting, parent-approved payouts.</li>
            <li>• Resume-building experience that shows initiative and character.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-3xl mb-8">For Local Businesses</h2>
          <ul className="space-y-6 text-lg">
            <li>• Fresh, authentic content for social media from kids parents trust.</li>
            <li>• Become the hometown hero — visible support for local teams.</li>
            <li>• Discover motivated teens — potential future employees.</li>
            <li>• Better advertising than paid ads — real stories from real athletes.</li>
            <li>• Only pay for clips you love — zero risk, total control.</li>
          </ul>
        </div>
      </div>

      {user ? (
        <div className="space-y-8">
          <p className="text-lg">Logged in as {user.email}</p>
          <p className="text-sm">Redirecting to dashboard...</p>
        </div>
      ) : (
        <div className="space-y-16">
          <div className="space-y-6">
            <Label htmlFor="email" className="text-3xl block">Your Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@school.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="py-12 text-2xl"
            />
          </div>

          <Button onClick={handleLogin} disabled={loading} className="py-16 text-3xl">
            {loading ? 'Sending...' : 'Send Login Link'}
          </Button>
        </div>
      )}
    </div>
  )
}