'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function SelectRole() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleRole = async (role: 'athlete' | 'business') => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { error } = await supabase
        .from('profiles')
        .update({ role })
        .eq('id', user.id)
      if (error) {
        alert(error.message)
      } else {
        router.push('/dashboard')
      }
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'white', fontFamily: "'Courier New', Courier, monospace", padding: '4rem 2rem', textAlign: 'center' }}>
      <div style={{ maxWidth: '400px', margin: '0 auto' }}>

        <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', marginBottom: '0.75rem' }}>Choose Your Role</h1>
        <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '3rem' }}>
          Are you here as an athlete or a local business?
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <button
            onClick={() => handleRole('athlete')}
            disabled={loading}
            className="btn-fixed-200"
            style={{ width: '100%' }}
          >
            Student Athlete
          </button>
          <button
            onClick={() => handleRole('business')}
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.75rem',
              fontSize: '0.9rem',
              fontWeight: 'bold',
              fontFamily: "'Courier New', Courier, monospace",
              background: '#f0f0f0',
              color: '#333',
              border: 'none',
              borderRadius: '9999px',
              cursor: 'pointer',
            }}
          >
            Local Business
          </button>
        </div>

      </div>
    </div>
  )
}
