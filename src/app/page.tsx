'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { signOut } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'

export default function Home() {
  const [role, setRole] = useState<'athlete' | 'business' | 'creative' | 'fan' | null>(null)
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

  if (role === 'business') {
    router.push('/business-onboard')
    return null
  }

  return (
    <div style={{
      fontFamily: "'Courier New', Courier, monospace",
      textAlign: 'center',
      padding: '5rem 2rem',
      backgroundColor: 'white',
      color: 'black',
    }}>
      {/* Slogan */}
      <p style={{ fontSize: '2rem', marginBottom: '6rem' }}>
        Community Driven Support for Student Athletes
      </p>

      {/* Role Toggle */}
      <div style={{ marginBottom: '4rem' }}>
        <p style={{ fontSize: '24px', marginBottom: '2rem' }}>Who are you?</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap' }}>
          <Button onClick={() => setRole('athlete')} className="text-2xl px-8 py-6">
            Student Athlete
          </Button>
          <Button onClick={() => setRole('business')} className="text-2xl px-8 py-6">
            Local Business
          </Button>
          <Button onClick={() => setRole('creative')} className="text-2xl px-8 py-6">
            Creative Talent
          </Button>
          <Button onClick={() => setRole('fan')} className="text-2xl px-8 py-6">
            Fan / Parent
          </Button>
        </div>
      </div>

      {/* Black downward arrow */}
      <div style={{ fontSize: '3rem', marginBottom: '6rem' }}>▼</div>

      {/* Benefits */}
      <div style={{ maxWidth: '700px', margin: '0 auto 12rem auto' }}>
        <div style={{ marginBottom: '10rem' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '6rem' }}>
            Student Athletes
          </h2>
          <div style={{ fontSize: '1.125rem', lineHeight: '2.4' }}>
            <p>• Earn real money for gas, gear, lunch, or savings.</p>
            <p>• Meet business owners and entrepreneurs in your town.</p>
            <p>• Get scholarships and letters of recommendation.</p>
            <p>• Safe, instant parent-approved payouts.</p>
            <p>• Resume-building experience.</p>
          </div>
        </div>

        <div>
          <h2 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '6rem' }}>
            Local Business
          </h2>
          <div style={{ fontSize: '1.125rem', lineHeight: '2.4' }}>
            <p>• Fresh, authentic content for social media.</p>
            <p>• Be a Hometown Hero — visible support for local teams.</p>
            <p>• Discover motivated teens & potential future employees.</p>
            <p>• Better than paid ads — real referrals from real athletes.</p>
          </div>
        </div>
      </div>

      {/* Login Form */}
      {user ? (
        <div style={{ marginTop: '2rem' }}>
          <p style={{ fontSize: '2rem' }}>Logged in as {user.email}</p>
          <Button onClick={signOut} style={{
            width: '250px',
            height: '60px',
            fontSize: '2rem',
            border: '1px solid black',
            backgroundColor: 'black',
            color: 'white',
            marginTop: '4rem',
          }}>
            Log Out
          </Button>
        </div>
      ) : (
        <div style={{ maxWidth: '250px', margin: '0 auto', paddingBottom: '5rem' }}>
          <div style={{ marginBottom: '6rem' }}>
            <Label htmlFor="email" style={{ fontSize: '2rem', display: 'block', marginBottom: '3rem' }}>
              Your Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="you@school.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '250px',
                height: '60px',
                fontSize: '2rem',
                border: '4px solid black',
                textAlign: 'center',
                fontFamily: "'Courier New', Courier, monospace",
              }}
            />
          </div>
          <Button
            onClick={handleLogin}
            disabled={loading}
            style={{
              width: '250px',
              height: '60px',
              fontSize: '2rem',
              border: '1px solid black',
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