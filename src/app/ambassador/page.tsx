'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function Ambassador() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [school, setSchool] = useState('')
  const [sport, setSport] = useState('')
  const [why, setWhy] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const router = useRouter()

  const handleSubmit = async () => {
    if (!name || !email || !phone || !school || !sport || !why) {
      alert('Please fill all fields')
      return
    }

    setLoading(true)

    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_URL}/dashboard`,
        data: { role: 'athlete' },
      },
    })

    if (authError) {
      alert('Error: ' + authError.message)
      setLoading(false)
      return
    }

    const { error: dbError } = await supabase
      .from('ambassador_applications')
      .insert({
        name,
        email,
        phone,
        school,
        sport,
        why,
        status: 'new',
      })

    if (dbError) {
      alert('Application error: ' + dbError.message)
    } else {
      setSubmitted(true)
    }

    setLoading(false)
  }

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
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    color: '#666',
  }

  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', background: 'white', fontFamily: "'Courier New', Courier, monospace", padding: '4rem 2rem', textAlign: 'center' }}>
        <div style={{ maxWidth: '500px', margin: '0 auto' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1.5rem' }}>&#10003;</div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', marginBottom: '1rem' }}>Application Submitted!</h1>
          <p style={{ fontSize: '0.9rem', color: '#666', lineHeight: 1.7, marginBottom: '2.5rem' }}>
            Thank you, {name}! We&apos;ve received your application.
            Check your email for a login link — start pitching businesses and earning today.
          </p>
          <button onClick={() => router.push('/')} className="btn-fixed-200">
            Back to Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'white', fontFamily: "'Courier New', Courier, monospace", padding: '4rem 2rem' }}>
      <div style={{ maxWidth: '560px', margin: '0 auto' }}>

        <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', textAlign: 'center', marginBottom: '0.75rem' }}>
          Become an Ambassador
        </h1>
        <p style={{ fontSize: '0.9rem', color: '#22c55e', fontWeight: 'bold', textAlign: 'center', marginBottom: '2.5rem' }}>
          Earn $100 Bonus + 5% Lifetime Commissions
        </p>

        {/* Description */}
        <div style={{ background: '#fafafa', borderRadius: '16px', padding: '2rem', marginBottom: '2.5rem' }}>
          <p style={{ fontSize: '0.85rem', color: '#666', lineHeight: 1.7, marginBottom: '1.25rem' }}>
            We&apos;re looking for self-motivated high school varsity athletes (or recent grads) to help grow LocalHustle — the app that lets student athletes earn real money and Freedom Scholarships from local businesses.
          </p>

          <p style={{ fontSize: '0.85rem', color: '#666', lineHeight: 1.7, marginBottom: '1.25rem' }}>
            <strong style={{ color: '#333' }}>Your Role:</strong><br />
            Pitch 10 local businesses using our proven letter.
            Get them to fund a gig → you earn $100 bonus + 5% of every dollar they ever spend.
          </p>

          <p style={{ fontSize: '0.85rem', color: '#666', lineHeight: 1.7, marginBottom: '1.25rem' }}>
            <strong style={{ color: '#333' }}>Top Requirements:</strong>
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem', paddingLeft: '0.5rem' }}>
            {[
              'Agency & Drive — You take initiative and get things done.',
              'Self-Motivated — You see a goal and go after it.',
              'Strong Communication — Clear, confident, professional.',
              'Varsity athletic experience is a plus.',
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                <span style={{ color: '#22c55e', fontWeight: 'bold', flexShrink: 0 }}>&#10003;</span>
                <p style={{ fontSize: '0.8rem', color: '#666', margin: 0, lineHeight: 1.6 }}>{item}</p>
              </div>
            ))}
          </div>

          <p style={{ fontSize: '0.85rem', color: '#666', lineHeight: 1.7, marginBottom: '1.25rem' }}>
            <strong style={{ color: '#333' }}>Compensation:</strong><br />
            $100 cash bonus (complete in 7 days). 5% lifetime commission on all gigs from businesses you onboard.
            Top performers → promoted to Executive Sales Team.
          </p>

          <p style={{ fontSize: '0.8rem', color: '#aaa', lineHeight: 1.6, margin: 0 }}>
            Fully remote · Flexible · Work around practice &amp; games.
          </p>
        </div>

        {/* Application Form */}
        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', textAlign: 'center', marginBottom: '2rem' }}>
          Apply Now
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={labelStyle}>Full Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              style={inputStyle} placeholder="Your full name" />
          </div>

          <div>
            <label style={labelStyle}>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              style={inputStyle} placeholder="your@email.com" />
          </div>

          <div>
            <label style={labelStyle}>Phone</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
              style={inputStyle} placeholder="(555) 123-4567" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>School</label>
              <input type="text" value={school} onChange={(e) => setSchool(e.target.value)}
                style={inputStyle} placeholder="Lincoln High" />
            </div>
            <div>
              <label style={labelStyle}>Sport</label>
              <input type="text" value={sport} onChange={(e) => setSport(e.target.value)}
                style={inputStyle} placeholder="Basketball" />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Why do you want to be an ambassador?</label>
            <textarea
              value={why}
              onChange={(e) => setWhy(e.target.value)}
              rows={4}
              style={{ ...inputStyle, resize: 'vertical' as const }}
              placeholder="Show us your hustle..."
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="btn-fixed-200"
            style={{ width: '100%', opacity: loading ? 0.6 : 1 }}
          >
            {loading ? 'Submitting...' : 'Submit Application'}
          </button>
        </div>

      </div>
    </div>
  )
}
