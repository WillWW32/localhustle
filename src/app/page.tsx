'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { signOut } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/toast/Toast' // assuming toast component path
import Link from 'next/link'

export default function Home() {
  const [email, setEmail] = useState('')
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { addToast } = useToast()

  const handleLogin = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({ email })
    if (error) {
      addToast(error.message, 'error')
    } else {
      addToast('Check your email for the login link!', 'success')
    }
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

        if (profile?.role) {
          router.replace('/dashboard')
        } else {
          router.replace('/select-role')
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

        if (profile?.role) {
          router.replace('/dashboard')
        } else {
          router.replace('/select-role')
        }
      }
    })

    return () => listener.subscription.unsubscribe()
  }, [router])

  return (
    <div style={{
      fontFamily: "'Courier New', Courier, monospace",
      textAlign: 'center',
      padding: '7rem 2rem',
      
      backgroundColor: 'white',
      color: 'black',
    }}>
      {/* Slogan */}
      <p style={{ fontSize: '2rem', marginBottom: '10rem' }}>
        Community Driven Support for Student Athletes
      </p>

      {/* Benefits */}
      <div style={{ maxWidth: '600px', margin: '0 auto 12rem auto' }}>
        <div style={{ marginBottom: '10rem' }}>
          <h2 style={{ fontSize: '3.5rem', fontWeight: 'bold', marginBottom: '6rem' }}>
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

      {/* Login Form + Log Out */}
      {user ? (
        <div style={{ marginTop: '2rem' }}>
          <p style={{ fontSize: '2rem' }}>Logged in as {user.email}</p>
          <Button onClick={signOut} style={{
            width: '200px',
            padding: '4rem',
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
        <div style={{ maxWidth: '200px', margin: '0 auto', paddingBottom: '5rem' }}>
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
                width: '100%',
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
              width: '200px',
              padding: '4rem',
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

      {/* Site-map Footer */}
      <footer style={{ marginTop: '8rem', paddingTop: '4rem', borderTop: '4px solid black' }}>
        <nav style={{ marginBottom: '2rem' }}>
          <Link href="/" style={{ margin: '0 1rem', textDecoration: 'underline' }}>Home</Link>
          <Link href="/dashboard" style={{ margin: '0 1rem', textDecoration: 'underline' }}>Dashboard</Link>
          <Link href="/profile" style={{ margin: '0 1rem', textDecoration: 'underline' }}>Profile</Link>
          <Link href="/compliance" style={{ margin: '0 1rem', textDecoration: 'underline' }}>Compliance</Link>
          <Link href="/privacy" style={{ margin: '0 1rem', textDecoration: 'underline' }}>Privacy</Link>
          <Link href="/terms" style={{ margin: '0 1rem', textDecoration: 'underline' }}>Terms</Link>
        </nav>
        <p style={{ fontSize: '1rem' }}>
          © 2025 LocalHustle — Community Driven Support for Student Athletes
        </p>
      </footer>
    </div>
  )
}