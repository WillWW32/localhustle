'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

function ParentOnboardContent() {
  const [kidName, setKidName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const router = useRouter()
  const searchParams = useSearchParams()
  const kidId = searchParams.get('kid_id')

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setIsAuthenticated(true)
        setEmail(session.user.email || '')
      }
      setCheckingAuth(false)
    })
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setIsAuthenticated(true)
        setEmail(user.email || '')
      }
      setCheckingAuth(false)
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    const fetchKid = async () => {
      if (!kidId) {
        setKidName('')
        return
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', kidId)
        .single()

      if (error || !data?.full_name) {
        setKidName('')
      } else {
        setKidName(data.full_name.split(' ')[0])
      }
    }

    fetchKid()
  }, [kidId])

  const handleContinue = async () => {
    if (!email.trim()) {
      alert('Please enter your email')
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/parent-dashboard${kidId ? `?kid_id=${kidId}` : ''}`,
      },
    })

    if (error) {
      alert('Error: ' + error.message)
      setLoading(false)
      return
    }

    alert('Magic link sent! Check your email and click it to go to your dashboard.')
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'white', fontFamily: "'Courier New', Courier, monospace", padding: '4rem 2rem', textAlign: 'center' }}>
      <div style={{ maxWidth: '500px', margin: '0 auto' }}>

        <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', lineHeight: 1.3, marginBottom: '1.5rem' }}>
          Hey {kidName ? `${kidName}'s ` : ''}Parent!
        </h1>

        <p style={{ fontSize: '0.95rem', fontWeight: 'normal', color: '#666', lineHeight: 1.7, marginBottom: '3rem' }}>
          NIL deals are here for your student athlete. Help them get started on the only fully compliant platform.
        </p>

        <p style={{ fontSize: '0.85rem', fontWeight: 'normal', color: '#666', lineHeight: 1.7, marginBottom: '2.5rem' }}>
          {kidName ? `${kidName} wants you to be their first sponsor on LocalHustle.` : 'You\'ve been invited to sponsor a local athlete on LocalHustle.'}{' '}
          It&apos;s easy — fund a challenge, they complete it, they earn real money instantly.
        </p>

        <div style={{ background: '#fafafa', borderRadius: '16px', padding: '2rem', marginBottom: '3rem', textAlign: 'left' }}>
          <p style={{ fontSize: '0.85rem', fontWeight: 'normal', color: '#666', lineHeight: 1.7, marginBottom: '1rem' }}>
            You&apos;ll fund a simple challenge (like &quot;80/100 free throws&quot;). When the athlete completes it, you approve, and they get paid instantly.
          </p>
          <p style={{ fontSize: '0.8rem', fontWeight: 'normal', color: '#aaa', margin: 0, lineHeight: 1.6 }}>
            Help them get started toward local business sponsorships, scholarships and brand deals.
          </p>
        </div>

        {checkingAuth ? (
          <p style={{ fontSize: '0.8rem', fontWeight: 'normal', color: '#aaa' }}>Checking your session...</p>
        ) : isAuthenticated ? (
          <div style={{ maxWidth: '320px', margin: '0 auto' }}>
            <p style={{ fontSize: '0.8rem', fontWeight: 'normal', color: '#22c55e', marginBottom: '1.5rem' }}>Signed in as {email}</p>
            <button
              onClick={() => router.push(`/parent-dashboard${kidId ? `?kid_id=${kidId}` : ''}`)}
              className="btn-fixed-200"
            >
              Continue to Dashboard
            </button>
          </div>
        ) : (
          <div style={{ maxWidth: '320px', margin: '0 auto' }}>
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '0.875rem 1rem',
                fontSize: '0.95rem',
                fontFamily: "'Courier New', Courier, monospace",
                border: '1px solid #ddd',
                borderRadius: '8px',
                textAlign: 'center',
                outline: 'none',
                marginBottom: '1.5rem',
              }}
            />

            <button
              onClick={handleContinue}
              disabled={loading}
              className="btn-fixed-200"
            >
              {loading ? 'Sending...' : 'Continue to Dashboard'}
            </button>

            <p style={{ fontSize: '0.8rem', fontWeight: 'normal', color: '#aaa', marginTop: '1.5rem' }}>
              You&apos;ll get a magic link — click it to set up your dashboard.
            </p>
          </div>
        )}

      </div>
    </div>
  )
}

export default function ParentOnboard() {
  return (
    <Suspense fallback={<p style={{ textAlign: 'center', padding: '8rem 0', fontSize: '1rem', color: '#aaa' }}>Loading...</p>}>
      <ParentOnboardContent />
    </Suspense>
  )
}
