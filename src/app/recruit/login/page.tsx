'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface AthleteResult {
  id: string
  name: string
  sport: string
}

export default function RecruitLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [athletes, setAthletes] = useState<AthleteResult[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/recruit/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Not found')
      }

      const data = await res.json()

      if (data.athletes.length === 1) {
        router.push(`/recruit/dashboard/athletes/${data.athletes[0].id}`)
      } else {
        setAthletes(data.athletes)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lookup failed')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.875rem 1rem',
    fontSize: '0.95rem',
    fontFamily: "'Courier New', Courier, monospace",
    border: '1px solid #ddd',
    borderRadius: '8px',
    background: 'white',
    outline: 'none',
    textAlign: 'center',
  }

  return (
    <div style={{ minHeight: '100vh', background: 'white', fontFamily: "'Courier New', Courier, monospace", padding: '4rem 2rem' }}>
      <div style={{ maxWidth: '400px', margin: '0 auto', textAlign: 'center' }}>

        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.75rem' }}>
          Athlete Login
        </h1>
        <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '2.5rem' }}>
          Enter the email you signed up with.
        </p>

        {!athletes ? (
          <form onSubmit={handleLookup}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              style={inputStyle}
            />

            {error && (
              <p style={{ color: '#dc2626', fontSize: '0.85rem', fontWeight: 'bold', marginTop: '1rem' }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-fixed-200"
              style={{ width: '100%', marginTop: '1.5rem', opacity: loading ? 0.6 : 1 }}
            >
              {loading ? 'Looking up...' : 'Continue'}
            </button>
          </form>
        ) : (
          <div>
            <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '1.5rem' }}>
              Select your athlete profile:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {athletes.map((a) => (
                <button
                  key={a.id}
                  onClick={() => router.push(`/recruit/dashboard/athletes/${a.id}`)}
                  style={{
                    padding: '1.25rem',
                    background: '#fafafa',
                    border: '1px solid #eee',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontFamily: "'Courier New', Courier, monospace",
                    textAlign: 'left',
                  }}
                >
                  <p style={{ fontWeight: 'bold', fontSize: '1rem', marginBottom: '0.25rem' }}>{a.name}</p>
                  <p style={{ color: '#666', fontSize: '0.85rem', margin: 0 }}>{a.sport}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        <p style={{ fontSize: '0.8rem', color: '#999', marginTop: '2.5rem' }}>
          Don&apos;t have an account?{' '}
          <Link href="/recruit/signup" style={{ color: 'black', fontWeight: 'bold' }}>Sign up</Link>
        </p>
      </div>
    </div>
  )
}
