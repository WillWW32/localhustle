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
  const [level, setLevel] = useState<'high_school' | 'college' | null>(null)
  const [email, setEmail] = useState('')
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async () => {
    if (!role || (role === 'athlete' && !level)) {
      alert('Please select your role and level')
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.signInWithOtp({ 
      email,
      options: { 
        data: { 
          role,
          level: role === 'athlete' ? level : null 
        } 
      }
    })

    if (error) alert(error.message)
    else {
      alert(`
🎉 Magic link sent!

Check your email — click the link to log in.

You'll go straight to your dashboard.

No passwords, just hustle.

See you inside! 🚀
      `.trim())
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
      padding: '2rem',
      backgroundColor: 'white',
      color: 'black',
      minHeight: '100vh',
    }}>
      {/* Subtitle — black block */}
      <div style={{ backgroundColor: 'black', color: 'white', padding: '2rem', marginBottom: '4rem' }}>
        <p style={{ fontSize: '1.8rem', margin: '0' }}>
          We connect student athletes with local businesses for NIL deals
        </p>
      </div>

      {/* Detail — black block */}
      <div style={{ backgroundColor: 'black', color: 'white', padding: '2rem', marginBottom: '6rem' }}>
        <h2 style={{ fontSize: '1.8rem', marginBottom: '2rem' }}>
          Student Athletes
        </h2>
        <p style={{ fontSize: '1.2rem', lineHeight: '1.8' }}>
          • Earn real money for gas, gear, lunch, or savings.<br />
          • Meet business owners in your town.<br />
          • Build your resume and unlock scholarships with letters of recommendation.<br />
          • Safe, instant parent-approved payouts.
        </p>

        <h2 style={{ fontSize: '1.8rem', margin: '4rem 0 2rem 0' }}>
          Local Business
        </h2>
        <p style={{ fontSize: '1.2rem', lineHeight: '1.8' }}>
          • Fresh, authentic content for social media.<br />
          • Be a Hometown Hero — visible support for local teams.<br />
          • Discover motivated teens & potential future employees.<br />
          • Better than paid ads — real referrals from real athletes.
        </p>
      </div>

      {/* CTA */}
      <p style={{ fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '2rem' }}>
        Enter Below for How to Get an NIL Deal
      </p>

      {/* Role Selector */}
      {!role && (
        <div style={{ marginBottom: '4rem' }}>
          <p style={{ fontSize: '1.5rem', marginBottom: '2rem' }}>Who are you?</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap' }}>
            <Button 
              onClick={() => setRole('athlete')}
              style={{
                padding: '1.5rem 3rem',
                fontSize: '1.5rem',
                backgroundColor: 'black',
                color: 'white',
              }}
            >
              Student Athlete
            </Button>
            <Button 
              onClick={() => setRole('business')}
              style={{
                padding: '1.5rem 3rem',
                fontSize: '1.5rem',
                backgroundColor: 'black',
                color: 'white',
              }}
            >
              Local Business
            </Button>
          </div>
        </div>
      )}

      {/* Level Selector — only for athlete */}
      {role === 'athlete' && !level && (
        <div style={{ marginBottom: '4rem' }}>
          <p style={{ fontSize: '1.5rem', marginBottom: '2rem' }}>High School or College?</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap' }}>
            <Button 
              onClick={() => setLevel('high_school')}
              style={{
                padding: '1.5rem 3rem',
                fontSize: '1.5rem',
                backgroundColor: 'black',
                color: 'white',
              }}
            >
              High School
            </Button>
            <Button 
              onClick={() => setLevel('college')}
              style={{
                padding: '1.5rem 3rem',
                fontSize: '1.5rem',
                backgroundColor: 'black',
                color: 'white',
              }}
            >
              College
            </Button>
          </div>
          <Button 
            onClick={() => setRole(null)}
            variant="outline"
            style={{ marginTop: '2rem', fontSize: '1.2rem' }}
          >
            Back
          </Button>
        </div>
      )}

      {/* Email Form — only after role/level selected */}
      {(role === 'business' || level) && (
        <div style={{ maxWidth: '300px', margin: '0 auto' }}>
          <Label htmlFor="email" style={{ fontSize: '1.5rem', display: 'block', marginBottom: '1rem' }}>
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
              height: '60px',
              fontSize: '1.5rem',
              border: '4px solid black',
              textAlign: 'center',
              marginBottom: '2rem',
              fontFamily: "'Courier New', Courier, monospace",
            }}
          />
          <Button
            onClick={handleLogin}
            disabled={loading}
            style={{
              width: '100%',
              height: '60px',
              fontSize: '1.5rem',
              backgroundColor: 'black',
              color: 'white',
              fontFamily: "'Courier New', Courier, monospace",
            }}
          >
            {loading ? 'Sending...' : 'Send Login Link'}
          </Button>
          <Button 
            onClick={() => {
              setRole(null)
              setLevel(null)
            }}
            variant="outline"
            style={{ marginTop: '2rem', fontSize: '1.2rem' }}
          >
            Back
          </Button>
        </div>
      )}

      {/* Logged in state */}
      {user && (
        <div style={{ marginTop: '6rem' }}>
          <p style={{ fontSize: '1.5rem' }}>Logged in as {user.email}</p>
          <Button onClick={signOut} style={{
            width: '80%',
            maxWidth: '300px',
            height: '60px',
            fontSize: '1.5rem',
            backgroundColor: 'black',
            color: 'white',
            marginTop: '2rem',
            fontFamily: "'Courier New', Courier, monospace",
          }}>
            Log Out
          </Button>
        </div>
      )}
    </div>
  )
}