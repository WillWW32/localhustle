'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function Profile() {
  const [profile, setProfile] = useState<any>(null)
  const [school, setSchool] = useState('')
  const [sport, setSport] = useState('')
  const [parentEmail, setParentEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        setProfile(data)
        setSchool(data.school || '')
        setSport(data.sport || '')
        setParentEmail(data.parent_email || '')
      }
    }
    fetchProfile()
  }, [])

  const handleSave = async () => {
    setLoading(true)
    setSaved(false)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { error } = await supabase
        .from('profiles')
        .update({
          school,
          sport,
          parent_email: parentEmail,
        })
        .eq('id', user.id)

      if (error) alert(error.message)
      else setSaved(true)
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

  if (!profile) {
    return (
      <div style={{ minHeight: '100vh', background: 'white', fontFamily: "'Courier New', Courier, monospace", display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontSize: '0.9rem', color: '#aaa' }}>Loading...</p>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'white', fontFamily: "'Courier New', Courier, monospace", padding: '4rem 2rem' }}>
      <div style={{ maxWidth: '500px', margin: '0 auto' }}>

        <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', marginBottom: '0.75rem' }}>Edit Profile</h1>
        <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '2.5rem' }}>
          Update your athlete info below.
        </p>

        {saved && (
          <div style={{ padding: '0.75rem 1rem', background: '#f0fdf4', borderRadius: '8px', color: '#22c55e', marginBottom: '1.5rem', fontWeight: 'bold', fontSize: '0.85rem' }}>
            Profile updated!
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
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

          <div>
            <label style={labelStyle}>Parent/Guardian Email</label>
            <input type="email" value={parentEmail} onChange={(e) => setParentEmail(e.target.value)}
              style={inputStyle} placeholder="parent@example.com" />
            <div style={{ marginTop: '0.75rem', background: '#fafafa', borderRadius: '8px', padding: '1rem' }}>
              <p style={{ fontSize: '0.75rem', color: '#999', lineHeight: 1.6, margin: 0 }}>
                Your earnings are sent to your parent for safety and compliance (required for minors).
                Please ask them to forward the money to you promptly (e.g., to your Venmo Teen or cash).
              </p>
            </div>
          </div>

          <button onClick={handleSave} disabled={loading} className="btn-fixed-200"
            style={{ width: '100%', opacity: loading ? 0.6 : 1 }}>
            {loading ? 'Saving...' : 'Save Profile'}
          </button>
        </div>

      </div>
    </div>
  )
}
