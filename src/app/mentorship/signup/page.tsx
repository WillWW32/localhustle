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

  return (
    <div className="form-page" style={{ minHeight: '100vh', background: 'white' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Become a Mentor</h1>
        <p style={{ color: '#666', fontSize: '0.875rem', marginBottom: '2rem' }}>
          Share your college athlete experience with the next generation. Earn $35 per session.
        </p>

        {error && (
          <div style={{ padding: '0.75rem 1rem', border: '3px solid red', background: '#fff5f5', color: 'red', marginBottom: '1rem', fontWeight: 'bold' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.5rem' }}>Full Name *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={e => update('name', e.target.value)}
                style={{ width: '100%', padding: '0.75rem', border: '4px solid black', fontFamily: 'inherit', fontSize: '1rem' }}
                placeholder="Your full name"
              />
            </div>

            <div>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.5rem' }}>Email *</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={e => update('email', e.target.value)}
                style={{ width: '100%', padding: '0.75rem', border: '4px solid black', fontFamily: 'inherit', fontSize: '1rem' }}
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.5rem' }}>Sport *</label>
              <select
                required
                value={form.sport}
                onChange={e => update('sport', e.target.value)}
                style={{ width: '100%', padding: '0.75rem', border: '4px solid black', fontFamily: 'inherit', fontSize: '1rem', background: 'white' }}
              >
                <option value="">Select sport</option>
                {['Football', 'Basketball', 'Baseball', 'Soccer', 'Track & Field', 'Swimming', 'Wrestling', 'Volleyball', 'Softball', 'Tennis', 'Golf', 'Lacrosse', 'Other'].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.5rem' }}>College/University *</label>
              <input
                type="text"
                required
                value={form.college}
                onChange={e => update('college', e.target.value)}
                style={{ width: '100%', padding: '0.75rem', border: '4px solid black', fontFamily: 'inherit', fontSize: '1rem' }}
                placeholder="University of Montana"
              />
            </div>

            <div>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.5rem' }}>Bio</label>
              <textarea
                value={form.bio}
                onChange={e => update('bio', e.target.value)}
                rows={4}
                style={{ width: '100%', padding: '0.75rem', border: '4px solid black', fontFamily: 'inherit', fontSize: '1rem', resize: 'vertical' }}
                placeholder="Tell youth athletes about your experience, what position you play, and what advice you can offer..."
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'black',
                color: 'white',
                border: 'none',
                fontWeight: 'bold',
                fontSize: '1rem',
                cursor: submitting ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
                opacity: submitting ? 0.7 : 1,
              }}
            >
              {submitting ? 'Submitting...' : 'Apply to Be a Mentor'}
            </button>

            <p style={{ color: '#999', fontSize: '0.75rem', textAlign: 'center' }}>
              Your application will be reviewed and you&apos;ll be notified when approved.
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}
