'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function GetStarted() {
  const [profile, setProfile] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.replace('/')
        return
      }

      let { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (!prof) {
        // New user — create a minimal profile row
        const { data: newProf } = await supabase
          .from('profiles')
          .insert({ id: user.id, email: user.email, role: 'athlete' })
          .select()
          .single()
        prof = newProf
      }

      if (prof) {
        setProfile(prof)
      }
    }

    fetchProfile()
  }, [router])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('fade-in-visible')
          observer.unobserve(e.target)
        }
      }),
      { threshold: 0.15 }
    )
    document.querySelectorAll('.fade-in-scroll').forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  const shareWithParent = () => {
    const message = `Hey Mom/Dad,

I joined LocalHustle — an app that lets me earn real money from challenges and scholarships.

Can you be my first sponsor? It's super easy — you fund a simple challenge, I complete it, and I get paid instantly.

This link lets you sponsor me: https://app.localhustle.org/parent-onboard?kid_id=${profile?.id || 'your-id'}

Thanks! Love you.

– ${profile?.full_name || 'Me'}`

    if (navigator.share) {
      navigator.share({ text: message }).catch(() => {
        navigator.clipboard.writeText(message)
        alert('Message copied! Paste into Messages.')
      })
    } else {
      navigator.clipboard.writeText(message)
      alert('Message copied! Paste into Messages.')
    }
  }

  if (!profile) return <p style={{ textAlign: 'center', padding: '8rem 0', fontSize: '1rem', color: '#aaa' }}>Loading...</p>

  return (
    <div style={{ minHeight: '100vh', background: 'white', fontFamily: "'Courier New', Courier, monospace", padding: '4rem 2rem', textAlign: 'center' }}>
      <div style={{ maxWidth: '500px', margin: '0 auto' }}>

        <div className="fade-in-scroll" style={{ marginBottom: '3rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', lineHeight: 1.3, marginBottom: '1.5rem' }}>
            Get Your First Sponsor
          </h1>
          <p style={{ fontSize: '0.95rem', fontWeight: 'normal', color: '#666', lineHeight: 1.7, margin: 0 }}>
            Ask your parent — the easiest way to start earning
          </p>
        </div>

        <p className="fade-in-scroll" style={{ fontSize: '0.85rem', fontWeight: 'normal', color: '#666', lineHeight: 1.7, marginBottom: '3rem' }}>
          Most athletes get their first money from a parent sponsoring a simple challenge. It&apos;s fast, safe, and you get paid instantly.
        </p>

        {/* Steps */}
        <div className="fade-in-scroll" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', textAlign: 'left', marginBottom: '3rem' }}>
          {[
            '1. Send this message to your parent',
            '2. They fund a challenge',
            '3. You complete it + upload proof',
            '4. They approve \u2192 you get paid instantly',
            '5. Counts toward Freedom Scholarships + Brand Deals',
          ].map((step, i) => (
            <div key={i} style={{ background: '#f5f5f5', borderRadius: '12px', padding: '1.25rem 1.5rem' }}>
              <p style={{ fontSize: '0.8rem', fontWeight: 'bold', margin: 0 }}>{step}</p>
            </div>
          ))}
        </div>

        {/* Message to Parent */}
        <div className="fade-in-scroll" style={{ background: '#fafafa', borderRadius: '16px', padding: '2rem', marginBottom: '3rem', textAlign: 'left' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '1.25rem', textAlign: 'center' }}>Ready-to-Send Message</h3>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.8rem', fontWeight: 'normal', color: '#666', marginBottom: '1.5rem', background: 'none', border: 'none', padding: 0, lineHeight: 1.6 }}>
            {`Hey Mom/Dad,

I joined LocalHustle — an app that lets me earn real money from challenges and scholarships.

Can you be my first sponsor? It's super easy — you fund a simple challenge, I complete it, and I get paid instantly.

This link lets you sponsor me: https://app.localhustle.org/parent-onboard?kid_id=${profile.id}

Thanks! Love you.

– ${profile.full_name || 'Me'}`}
          </pre>

          <div style={{ textAlign: 'center' }}>
            <button onClick={shareWithParent} className="btn-fixed-200">
              Send to Parent
            </button>
          </div>
        </div>

        {/* Next Steps */}
        <div className="fade-in-scroll" style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>Ready for More?</h2>
          <p style={{ fontSize: '0.85rem', fontWeight: 'normal', color: '#666', lineHeight: 1.7, margin: 0 }}>
            Once you have your first earnings, pitch local businesses and unlock Freedom Scholarships + Brand Deals.
          </p>
        </div>

        <div className="fade-in-scroll">
          <button
            onClick={() => router.push('/athlete-dashboard')}
            className="btn-fixed-200"
          >
            Back to Dashboard
          </button>
        </div>

      </div>
    </div>
  )
}
