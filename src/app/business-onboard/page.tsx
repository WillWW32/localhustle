'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function BusinessOnboard() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async () => {
    if (!name || !email) {
      alert('Please enter your name and email')
      return
    }

    setLoading(true)

    // Sign in with magic link
    const { error } = await supabase.auth.signInWithOtp({ 
      email,
      options: {
        data: { name, role: 'business' } // pass name + role to profile
      }
    })

    if (error) {
      alert(error.message)
    } else {
      alert('Check your email for the login link!')
      // Auto redirect on success (listener in layout handles)
    }

    setLoading(false)
  }

  return (
    <div style={{
      fontFamily: "'Courier New', Courier, monospace",
      textAlign: 'center',
      padding: '5rem 2rem',
      backgroundColor: 'white',
      color: 'black',
    }}>
      <h1 style={{ fontSize: '30px', fontWeight: 'bold', marginBottom: '2rem' }}>
        Welcome Local Business
      </h1>
      <p style={{ fontSize: '20px', marginBottom: '4rem' }}>
        Enter your name and email to get started — we'll send a login link.
      </p>

      <div style={{ maxWidth: '400px', margin: '0 auto' }}>
        <div style={{ marginBottom: '2rem' }}>
          <Label htmlFor="name" style={{ fontSize: '20px', display: 'block', marginBottom: '1rem' }}>
            Your Name
          </Label>
          <Input
            id="name"
            type="text"
            placeholder="Your Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ width: '100%', height: '60px', fontSize: '20px', border: '4px solid black', textAlign: 'center' }}
          />
        </div>

        <div style={{ marginBottom: '4rem' }}>
          <Label htmlFor="email" style={{ fontSize: '20px', display: 'block', marginBottom: '1rem' }}>
            Your Email
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="business@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: '100%', height: '60px', fontSize: '20px', border: '4px solid black', textAlign: 'center' }}
          />
        </div>

        <Button onClick={handleSubmit} disabled={loading} style={{
          width: '100%',
          height: '80px',
          fontSize: '30px',
          backgroundColor: 'black',
          color: 'white',
        }}>
          {loading ? 'Sending...' : 'Send Login Link'}
        </Button>
      </div>

      <p style={{ fontSize: '18px', marginTop: '4rem' }}>
        You'll be logged in and taken to your dashboard to post gigs.
      </p>
    </div>
  )
}