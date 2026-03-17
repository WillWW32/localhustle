'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface AthleteResult {
  id: string
  name: string
  sport: string
}

export default function DashboardPage() {
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
        throw new Error(data.error || 'No athletes found for this email')
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

  return (
    <div className="dashboard-container" style={{ padding: '0 1rem', paddingBottom: '4rem' }}>
      <div style={{ padding: '1.5rem 0', borderBottom: '1px solid #eee', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Recruitment Dashboard</h1>
        <p style={{ color: '#666', fontSize: '0.875rem', marginBottom: 0 }}>Enter your email to access your athlete profiles</p>
      </div>

      {!athletes ? (
        <div style={{ maxWidth: '400px', margin: '2rem auto', textAlign: 'center' }}>
          <form onSubmit={handleLookup}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              style={{
                width: '100%',
                padding: '0.875rem 1rem',
                fontSize: '0.95rem',
                fontFamily: "'Courier New', Courier, monospace",
                border: '1px solid #ddd',
                borderRadius: '8px',
                background: 'white',
                outline: 'none',
                textAlign: 'center',
              }}
            />

            {error && (
              <p style={{ color: '#dc2626', fontSize: '0.85rem', fontWeight: 'bold', marginTop: '1rem' }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="dash-btn"
              style={{ width: '100%', marginTop: '1.5rem', padding: '0.875rem', opacity: loading ? 0.6 : 1 }}
            >
              {loading ? 'Looking up...' : 'Continue'}
            </button>
          </form>

          <p style={{ fontSize: '0.8rem', color: '#999', marginTop: '2rem' }}>
            Don&apos;t have an account?{' '}
            <Link href="/recruit/signup" style={{ color: 'black', fontWeight: 'bold' }}>Sign up</Link>
          </p>
        </div>
      ) : (
        <div style={{ maxWidth: '500px', margin: '2rem auto' }}>
          <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '1.5rem', textAlign: 'center' }}>
            Select your athlete profile:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {athletes.map((a) => (
              <button
                key={a.id}
                onClick={() => router.push(`/recruit/dashboard/athletes/${a.id}`)}
                className="dash-card"
                style={{ cursor: 'pointer', textAlign: 'left', border: '1px solid #eee' }}
              >
                <p style={{ fontWeight: 'bold', fontSize: '1rem', marginBottom: '0.25rem' }}>{a.name}</p>
                <p style={{ color: '#666', fontSize: '0.85rem', margin: 0 }}>{a.sport}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
