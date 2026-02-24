'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function MentorSignupPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    name: '',
    email: '',
    sport: '',
    college: '',
    bio: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/mentorship/mentors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to submit')
      }

      router.push('/mentorship/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  const update = (field: string, value: string) => setForm(p => ({ ...p, [field]: value }))

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.75rem 1rem',
    fontSize: '0.9rem',
    fontFamily: "'Courier New', Courier, monospace",
    border: '1px solid #ddd',
    borderRadius: '8px',
    background: 'white',
    outline: 'none',
  }

  const labelStyle: React.CSSProperties = {
    fontWeight: 'bold',
    display: 'block',
    marginBottom: '0.5rem',
    fontSize: '0.8rem',
    color: '#333',
  }

  return (
    <div style={{ minHeight: '100vh', background: 'white', fontFamily: "'Courier New', Courier, monospace", padding: '4rem 2rem' }}>
      <div style={{ maxWidth: '500px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', marginBottom: '0.75rem' }}>Become a Mentor</h1>
        <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '2.5rem', lineHeight: 1.7 }}>
          Share your college athlete experience with the next generation. Earn $35 per session.
        </p>

        {error && (
          <div style={{ padding: '0.75rem 1rem', background: '#fef2f2', borderRadius: '8px', color: '#dc2626', marginBottom: '1.5rem', fontWeight: 'bold', fontSize: '0.85rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label style={labelStyle}>Full Name *</label>
              <input type="text" required value={form.name} onChange={e => update('name', e.target.value)}
                style={inputStyle} placeholder="Your full name" />
            </div>

            <div>
              <label style={labelStyle}>Email *</label>
              <input type="email" required value={form.email} onChange={e => update('email', e.target.value)}
                style={inputStyle} placeholder="your@email.com" />
            </div>

            <div>
              <label style={labelStyle}>Sport *</label>
              <select required value={form.sport} onChange={e => update('sport', e.target.value)}
                style={inputStyle}>
                <option value="">Select sport</option>
                {['Football', 'Basketball', 'Baseball', 'Soccer', 'Track & Field', 'Swimming', 'Wrestling', 'Volleyball', 'Softball', 'Tennis', 'Golf', 'Lacrosse', 'Other'].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>College/University *</label>
              <input type="text" required value={form.college} onChange={e => update('college', e.target.value)}
                style={inputStyle} placeholder="University of Montana" />
            </div>

            <div>
              <label style={labelStyle}>Bio</label>
              <textarea value={form.bio} onChange={e => update('bio', e.target.value)} rows={4}
                style={{ ...inputStyle, resize: 'vertical' as const }}
                placeholder="Tell youth athletes about your experience, what position you play, and what advice you can offer..." />
            </div>

            <button type="submit" disabled={submitting} className="btn-fixed-200"
              style={{ width: '100%', opacity: submitting ? 0.6 : 1 }}>
              {submitting ? 'Submitting...' : 'Apply to Be a Mentor'}
            </button>

            <p style={{ color: '#999', fontSize: '0.75rem', textAlign: 'center', margin: 0 }}>
              Your application will be reviewed and you&apos;ll be notified when approved.
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}
