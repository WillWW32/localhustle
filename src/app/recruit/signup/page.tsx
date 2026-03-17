'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface FormData {
  firstName: string
  lastName: string
  email: string
  sport: string
  position: string
  height: string
  weight: string
  gradYear: string
  highSchool: string
  city: string
  state: string
}

export default function SignupPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    sport: '',
    position: '',
    height: '',
    weight: '',
    gradYear: '',
    highSchool: '',
    city: '',
    state: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const validate = () => {
    if (!form.firstName.trim()) { setError("Please enter first name"); return false }
    if (!form.lastName.trim()) { setError("Please enter last name"); return false }
    if (!form.email.trim() || !form.email.includes('@')) { setError('Please enter a valid email'); return false }
    if (!form.sport) { setError('Please select a sport'); return false }
    if (!form.position.trim()) { setError('Please enter position'); return false }
    if (!form.gradYear) { setError('Please select graduation year'); return false }
    if (!form.highSchool.trim()) { setError('Please enter high school'); return false }
    if (!form.state) { setError('Please select state'); return false }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!validate()) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/recruit/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parent: { name: '', email: form.email, phone: '' },
          athlete: {
            firstName: form.firstName, lastName: form.lastName,
            sport: form.sport, position: form.position,
            height: form.height, weight: form.weight,
            gradYear: form.gradYear, highSchool: form.highSchool,
            city: form.city, state: form.state,
          },
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Signup failed')
      }

      const data = await response.json()
      router.push(`/recruit/success?slug=${data.slug}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during signup')
    } finally {
      setIsLoading(false)
    }
  }

  const sports = [
    'Football', 'Basketball', 'Baseball', 'Soccer', 'Lacrosse',
    'Volleyball', 'Tennis', 'Cross Country', 'Track & Field',
    'Swimming', 'Golf', 'Softball',
  ]

  const states = [
    'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
    'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
    'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
    'VA','WA','WV','WI','WY',
  ]

  const currentYear = new Date().getFullYear()
  const gradYears = Array.from({ length: 8 }, (_, i) => (currentYear + i).toString())

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
    display: 'block',
    fontSize: '0.75rem',
    fontWeight: 'bold',
    marginBottom: '0.5rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: '#666',
  }

  return (
    <div style={{ minHeight: '100vh', background: 'white', fontFamily: "'Courier New', Courier, monospace", padding: '4rem 2rem' }}>
      <div style={{ maxWidth: '560px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: '2.5rem' }}>
          <Link href="/recruit" style={{ color: '#999', fontSize: '0.8rem', textDecoration: 'none' }}>
            &larr; Back to Recruit
          </Link>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', marginTop: '1.5rem', marginBottom: '0.75rem' }}>
            Get Recruited
          </h1>
          <p style={{ fontSize: '0.9rem', color: '#666', margin: 0 }}>
            One quick form — we&apos;ll start reaching out to coaches immediately.
          </p>
        </div>

        {/* Form */}
        <div style={{ background: '#fafafa', borderRadius: '16px', padding: '2rem' }}>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>First Name</label>
                  <input type="text" name="firstName" value={form.firstName} onChange={handleChange}
                    style={inputStyle} placeholder="Alex" />
                </div>
                <div>
                  <label style={labelStyle}>Last Name</label>
                  <input type="text" name="lastName" value={form.lastName} onChange={handleChange}
                    style={inputStyle} placeholder="Johnson" />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Email</label>
                <input type="email" name="email" value={form.email} onChange={handleChange}
                  style={inputStyle} placeholder="alex@example.com" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>Sport</label>
                  <select name="sport" value={form.sport} onChange={handleChange} style={inputStyle}>
                    <option value="">Select a sport</option>
                    {sports.map((sport) => (<option key={sport} value={sport}>{sport}</option>))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Position</label>
                  <input type="text" name="position" value={form.position} onChange={handleChange}
                    style={inputStyle} placeholder="Quarterback" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>Grad Year</label>
                  <select name="gradYear" value={form.gradYear} onChange={handleChange} style={inputStyle}>
                    <option value="">Year</option>
                    {gradYears.map((year) => (<option key={year} value={year}>{year}</option>))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Height</label>
                  <input type="text" name="height" value={form.height} onChange={handleChange}
                    style={inputStyle} placeholder="6'2&quot;" />
                </div>
                <div>
                  <label style={labelStyle}>Weight</label>
                  <input type="text" name="weight" value={form.weight} onChange={handleChange}
                    style={inputStyle} placeholder="210 lbs" />
                </div>
              </div>

              <div>
                <label style={labelStyle}>High School</label>
                <input type="text" name="highSchool" value={form.highSchool} onChange={handleChange}
                  style={inputStyle} placeholder="Lincoln High School" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>City</label>
                  <input type="text" name="city" value={form.city} onChange={handleChange}
                    style={inputStyle} placeholder="San Francisco" />
                </div>
                <div>
                  <label style={labelStyle}>State</label>
                  <select name="state" value={form.state} onChange={handleChange} style={inputStyle}>
                    <option value="">State</option>
                    {states.map((state) => (<option key={state} value={state}>{state}</option>))}
                  </select>
                </div>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div style={{ marginTop: '1.5rem', padding: '0.75rem 1rem', background: '#fef2f2', borderRadius: '8px', color: '#dc2626', fontSize: '0.85rem', fontWeight: 'bold' }}>
                {error}
              </div>
            )}

            {/* Submit */}
            <div style={{ marginTop: '2rem' }}>
              <button type="submit" disabled={isLoading} className="btn-fixed-200" style={{ width: '100%', opacity: isLoading ? 0.6 : 1 }}>
                {isLoading ? 'Creating profile...' : 'Start Recruiting'}
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  )
}
