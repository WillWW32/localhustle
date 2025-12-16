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
    <div style={{
      fontFamily: "'Courier New', Courier, monospace",
      textAlign: 'center',
      padding: '10rem 2rem',
      minHeight: '100vh',
      backgroundColor: 'white',
      color: 'black',
    }}>
      {/* Logo */}
      <div style={{ marginBottom: '6rem' }}>
        <Image
          src="/logo.jpg"
          alt="LocalHustle Logo"
          width={280}
          height={280}
          style={{ margin: '0 auto' }}
          priority
        />
      </div>

     

      {/* Slogan */}
      <p style={{ fontSize: '5rem', marginBottom: '10rem' }}>
        Community Driven Support for Student Athletes
      </p>

      {/* Benefits */}
      <div style={{ maxWidth: '800px', margin: '0 auto 12rem auto' }}>
        <div style={{ marginBottom: '10rem' }}>
          <h2 style={{ fontSize: '3.5rem', fontWeight: 'bold', marginBottom: '6rem' }}>
            For Student Athletes
          </h2>
          <div style={{ fontSize: '1.125rem', lineHeight: '2.4' }}>
            <p>Earn real money — $50–$1000 per gig for gas, gear, lunch, or savings.</p>
            <p>Local exposure to business owners and entrepreneurs in your town.</p>
            <p>Build relationships that lead to scholarships and letters of recommendation.</p>
            <p>Safe, private gigs — no forced public posting, parent-approved payouts.</p>
            <p>Resume-building experience that shows initiative and character.</p>
          </div>
        </div>

        <div>
          <h2 style={{ fontSize: '3.5rem', fontWeight: 'bold', marginBottom: '6rem' }}>
            For Local Businesses
          </h2>
          <div style={{ fontSize: '1.125rem', lineHeight: '2.4' }}>
            <p>Fresh, authentic content for social media from kids parents trust.</p>
            <p>Become the hometown hero — visible support for local teams.</p>
            <p>Discover motivated teens — potential future employees.</p>
            <p>Better advertising than paid ads — real stories from real athletes.</p>
            <p>Only pay for clips you love — zero risk, total control.</p>
          </div>
        </div>
      </div>

      {/* Login Form */}
      {user ? (
        <div style={{ marginTop: '6rem' }}>
          <p style={{ fontSize: '2rem' }}>Logged in as {user.email}</p>
          <p style={{ fontSize: '1.5rem' }}>Redirecting to dashboard...</p>
        </div>
      ) : (
        <div style={{ maxWidth: '500px', margin: '0 auto', paddingBottom: '15rem' }}>
          <div style={{ marginBottom: '6rem' }}>
            <Label htmlFor="email" style={{ fontSize: '3rem', display: 'block', marginBottom: '3rem' }}>
              Your Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="you@school.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '60%',
                padding: '3rem',
                fontSize: '2rem',
                border: '4px solid black',
                textAlign: 'center',
              }}
            />
          </div>

          <Button
            onClick={handleLogin}
            disabled={loading}
            style={{
              width: '60%',
              padding: '4rem',
              fontSize: '2rem',
              border: '2px solid black',
              backgroundColor: 'black',
              color: 'white',
            }}
          >
            {loading ? 'Sending...' : 'Send Login Link'}
          </Button>
        </div>
      )}
    </div>
  )
}