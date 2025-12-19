'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { signOut } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function Home() {
  const [role, setRole] = useState<'athlete' | 'business' | null>(null)
  const [email, setEmail] = useState('')
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'LocalHustle',
        text: 'Join LocalHustle — earn from local business sponsorships as a high school athlete!',
        url: 'https://app.localhustle.org',
      }).catch(console.error)
    } else {
      alert('Copy this link to share: https://app.localhustle.org')
    }
  }

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
        <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem' }}>
          <Button onClick={() => setRole('athlete')} className="text-2xl px-8 py-6">
            Student Athlete
          </Button>
          <Button onClick={() => setRole('business')} className="text-2xl px-8 py-6">
            Local Business
          </Button>
        </div>
      </div>

      {/* Black downward arrow */}
      <div style={{ fontSize: '3rem', marginBottom: '6rem' }}>▼</div>

      {/* Benefits */}
      <div style={{ maxWidth: '700px', margin: '0 auto 12rem auto' }}>
        {/* ... your benefits ... */}
      </div>

      {/* Share with Teammates button on landing */}
      <div style={{ margin: '4rem 0' }}>
        <Button onClick={handleShare} style={{
          width: '100%',
          maxWidth: '500px',
          height: '80px',
          fontSize: '30px',
          backgroundColor: 'black',
          color: 'white',
          fontFamily: "'Courier New', Courier, monospace'",
        }}>
          Share with Teammates
        </Button>
      </div>

      {/* Login Form */}
      {user ? (
        <div style={{ marginTop: '2rem' }}>
          <p style={{ fontSize: '2rem' }}>Logged in as {user.email}</p>
          <Button onClick={signOut} style={{
            width: '250px',
            height: '60px',
            fontSize: '2rem',
            backgroundColor: 'black',
            color: 'white',
            marginTop: '4rem',
            fontFamily: "'Courier New', Courier, monospace",
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
              backgroundColor: 'black',
              color: 'white',
              fontFamily: "'Courier New', Courier, monospace",
            }}
          >
            {loading ? 'Sending...' : 'Send Login Link'}
          </Button>
        </div>
      )}
    </div>
  )
}