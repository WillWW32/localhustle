'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type FormStep = 1 | 2

interface ParentFormData {
  name: string
  email: string
  phone: string
}

interface AthleteFormData {
  firstName: string
  lastName: string
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
  const [currentStep, setCurrentStep] = useState<FormStep>(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [parentData, setParentData] = useState<ParentFormData>({
    name: '',
    email: '',
    phone: '',
  })

  const [athleteData, setAthleteData] = useState<AthleteFormData>({
    firstName: '',
    lastName: '',
    sport: '',
    position: '',
    height: '',
    weight: '',
    gradYear: '',
    highSchool: '',
    city: '',
    state: '',
  })

  const handleParentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setParentData((prev) => ({ ...prev, [name]: value }))
  }

  const handleAthleteChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setAthleteData((prev) => ({ ...prev, [name]: value }))
  }

  const validateParentForm = () => {
    if (!parentData.name.trim()) { setError('Please enter your name'); return false }
    if (!parentData.email.trim() || !parentData.email.includes('@')) { setError('Please enter a valid email'); return false }
    if (!parentData.phone.trim()) { setError('Please enter your phone number'); return false }
    return true
  }

  const validateAthleteForm = () => {
    if (!athleteData.firstName.trim()) { setError("Please enter athlete's first name"); return false }
    if (!athleteData.lastName.trim()) { setError("Please enter athlete's last name"); return false }
    if (!athleteData.sport) { setError('Please select a sport'); return false }
    if (!athleteData.position.trim()) { setError('Please enter position'); return false }
    if (!athleteData.height.trim()) { setError('Please enter height'); return false }
    if (!athleteData.weight.trim()) { setError('Please enter weight'); return false }
    if (!athleteData.gradYear) { setError('Please select graduation year'); return false }
    if (!athleteData.highSchool.trim()) { setError('Please enter high school'); return false }
    if (!athleteData.city.trim()) { setError('Please enter city'); return false }
    if (!athleteData.state) { setError('Please select state'); return false }
    return true
  }

  const handleNext = () => {
    setError(null)
    if (validateParentForm()) setCurrentStep(2)
  }

  const handleBack = () => {
    setError(null)
    setCurrentStep(1)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!validateAthleteForm()) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/recruit/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parent: parentData, athlete: athleteData }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Signup failed')
      }

      router.push('/recruit/dashboard')
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

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
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
            Get Your Athlete Recruited
          </h1>
          <p style={{ fontSize: '0.9rem', color: '#666', margin: 0 }}>
            Fill out this quick form and we&apos;ll start reaching out to coaches.
          </p>
        </div>

        {/* Progress bar */}
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <div className="progress-bar-track" style={{ flex: 1 }}>
              <div className="progress-bar-fill" style={{ width: currentStep >= 1 ? '100%' : '0%' }} />
            </div>
            <div className="progress-bar-track" style={{ flex: 1 }}>
              <div className="progress-bar-fill" style={{ width: currentStep >= 2 ? '100%' : '0%' }} />
            </div>
          </div>
          <p style={{ fontSize: '0.75rem', color: '#999', margin: 0 }}>Step {currentStep} of 2</p>
        </div>

        {/* Form */}
        <div style={{ background: '#fafafa', borderRadius: '16px', padding: '2rem' }}>
          <form onSubmit={handleSubmit}>
            {currentStep === 1 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Parent/Guardian Information</h3>

                <div>
                  <label style={labelStyle}>Full Name</label>
                  <input type="text" name="name" value={parentData.name} onChange={handleParentChange}
                    style={inputStyle} placeholder="John Smith" />
                </div>

                <div>
                  <label style={labelStyle}>Email Address</label>
                  <input type="email" name="email" value={parentData.email} onChange={handleParentChange}
                    style={inputStyle} placeholder="john@example.com" />
                </div>

                <div>
                  <label style={labelStyle}>Phone Number</label>
                  <input type="tel" name="phone" value={parentData.phone} onChange={handleParentChange}
                    style={inputStyle} placeholder="(555) 123-4567" />
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Athlete Information</h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={labelStyle}>First Name</label>
                    <input type="text" name="firstName" value={athleteData.firstName} onChange={handleAthleteChange}
                      style={inputStyle} placeholder="Alex" />
                  </div>
                  <div>
                    <label style={labelStyle}>Last Name</label>
                    <input type="text" name="lastName" value={athleteData.lastName} onChange={handleAthleteChange}
                      style={inputStyle} placeholder="Johnson" />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={labelStyle}>Sport</label>
                    <select name="sport" value={athleteData.sport} onChange={handleAthleteChange} style={selectStyle}>
                      <option value="">Select a sport</option>
                      {sports.map((sport) => (<option key={sport} value={sport}>{sport}</option>))}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Position</label>
                    <input type="text" name="position" value={athleteData.position} onChange={handleAthleteChange}
                      style={inputStyle} placeholder="Quarterback" />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={labelStyle}>Height</label>
                    <input type="text" name="height" value={athleteData.height} onChange={handleAthleteChange}
                      style={inputStyle} placeholder="6'2&quot;" />
                  </div>
                  <div>
                    <label style={labelStyle}>Weight (lbs)</label>
                    <input type="text" name="weight" value={athleteData.weight} onChange={handleAthleteChange}
                      style={inputStyle} placeholder="210" />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={labelStyle}>Graduation Year</label>
                    <select name="gradYear" value={athleteData.gradYear} onChange={handleAthleteChange} style={selectStyle}>
                      <option value="">Select year</option>
                      {gradYears.map((year) => (<option key={year} value={year}>{year}</option>))}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>High School</label>
                    <input type="text" name="highSchool" value={athleteData.highSchool} onChange={handleAthleteChange}
                      style={inputStyle} placeholder="Lincoln High School" />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={labelStyle}>City</label>
                    <input type="text" name="city" value={athleteData.city} onChange={handleAthleteChange}
                      style={inputStyle} placeholder="San Francisco" />
                  </div>
                  <div>
                    <label style={labelStyle}>State</label>
                    <select name="state" value={athleteData.state} onChange={handleAthleteChange} style={selectStyle}>
                      <option value="">Select state</option>
                      {states.map((state) => (<option key={state} value={state}>{state}</option>))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Error message */}
            {error && (
              <div style={{ marginTop: '1.5rem', padding: '0.75rem 1rem', background: '#fef2f2', borderRadius: '8px', color: '#dc2626', fontSize: '0.85rem', fontWeight: 'bold' }}>
                {error}
              </div>
            )}

            {/* Form buttons */}
            <div style={{ marginTop: '2rem', display: 'flex', gap: '0.75rem' }}>
              {currentStep === 2 && (
                <button type="button" onClick={handleBack}
                  style={{
                    flex: 1, padding: '0.75rem', fontSize: '0.9rem', fontWeight: 'bold',
                    fontFamily: "'Courier New', Courier, monospace",
                    background: '#f0f0f0', color: '#333', border: 'none', borderRadius: '9999px', cursor: 'pointer',
                  }}>
                  Back
                </button>
              )}
              <button
                type={currentStep === 1 ? 'button' : 'submit'}
                onClick={currentStep === 1 ? handleNext : undefined}
                disabled={isLoading}
                className="btn-fixed-200"
                style={{ flex: 1, opacity: isLoading ? 0.6 : 1 }}
              >
                {isLoading ? 'Creating account...' : currentStep === 1 ? 'Next' : 'Complete Signup'}
              </button>
            </div>
          </form>
        </div>

        {/* Info section */}
        <div style={{ marginTop: '3rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[
            { title: 'Secure', desc: 'Your data is encrypted and safe' },
            { title: 'Instant', desc: 'Start receiving outreach immediately' },
            { title: 'Simple', desc: 'Manage everything from your phone' },
          ].map((item, idx) => (
            <div key={idx} style={{ background: '#f5f5f5', borderRadius: '12px', padding: '1.25rem 1.5rem', textAlign: 'center' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>{item.title}</h4>
              <p style={{ fontSize: '0.8rem', color: '#666', margin: 0 }}>{item.desc}</p>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
