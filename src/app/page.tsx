'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { Fleer86Front } from '@/components/player-cards/templates/Fleer86'
import type { CardData } from '@/components/player-cards/types'
import { DEFAULT_CARD_DATA } from '@/components/player-cards/types'

type Role = 'athlete' | 'parent' | 'business'

export default function Home() {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<Role | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const paths = {
    athlete: '/get-started',
    parent: '/parent-onboard',
    business: '/business-onboard',
  }

  // Fade-in on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('fade-in-visible')
          observer.unobserve(e.target)
        }
      }),
      { threshold: 0.25 }
    )
    document.querySelectorAll('.fade-in-scroll').forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  const sendMagicLink = async (selectedRole: Role) => {
    if (!email.trim()) {
      alert('Please enter your email')
      return
    }

    setLoading(true)

    const redirectPath = paths[selectedRole]

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `https://app.localhustle.org${redirectPath}`,
      },
    })

    if (error) {
      alert('Error: ' + error.message)
    } else {
      alert('Magic link sent! Check your email.')
    }

    setLoading(false)
  }

  const handleSubmit = () => {
    if (!email.trim()) {
      alert('Please enter your email')
      return
    }
    if (!role) {
      alert('Please select your role')
      return
    }
    sendMagicLink(role)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'white', color: 'black', fontFamily: "'Courier New', Courier, monospace" }}>

      {/* Hero */}
      <section style={{ padding: '4rem 2rem', textAlign: 'center' }}>
        <div className="fade-in-scroll" style={{ maxWidth: '560px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', lineHeight: 1.3, marginBottom: '1.5rem' }}>
            Connecting Local Businesses with Student Athletes
          </h1>
          <p style={{ fontSize: '0.95rem', fontWeight: 'normal', color: '#666', lineHeight: 1.7, marginBottom: '2rem' }}>
            Local sponsors. Real earnings. The NIL platform built for high school athletes.
          </p>
          <a href="#get-started" className="btn-fixed-200">Get Started</a>
        </div>
      </section>


      {/* Benefits */}
      <section style={{ padding: '4rem 2rem', background: '#fafafa' }}>
        <div className="fade-in-scroll" style={{ maxWidth: '560px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          <div style={{ background: 'white', borderRadius: '16px', padding: '2rem' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '0.75rem' }}>Student Athletes</h2>
            <p style={{ fontSize: '0.85rem', fontWeight: 'normal', color: '#666', lineHeight: 1.7, margin: 0 }}>
              Earn money and scholarships. Complete 8 gigs to qualify for national brand deals.
            </p>
          </div>

          <div style={{ background: 'white', borderRadius: '16px', padding: '2rem' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '0.75rem' }}>Parents</h2>
            <p style={{ fontSize: '0.85rem', fontWeight: 'normal', color: '#666', lineHeight: 1.7, margin: 0 }}>
              Ease financial stress. Help your kid earn real money and scholarships.
            </p>
          </div>

          <div style={{ background: 'white', borderRadius: '16px', padding: '2rem' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '0.75rem' }}>Businesses</h2>
            <p style={{ fontSize: '0.85rem', fontWeight: 'normal', color: '#666', lineHeight: 1.7, margin: 0 }}>
              Authentic local advertising. Real community impact. Hometown hero status.
            </p>
          </div>

        </div>
      </section>


      {/* How It Works */}
      <section style={{ padding: '4rem 2rem' }}>
        <div style={{ maxWidth: '560px', margin: '0 auto' }}>
          <h2 className="fade-in-scroll" style={{ fontSize: '1.5rem', fontWeight: 'bold', textAlign: 'center', marginBottom: '2.5rem' }}>
            How It Works
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="fade-in-scroll" style={{ background: '#f5f5f5', borderRadius: '16px', padding: '2rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '0.75rem' }}>What is a Gig?</h3>
              <p style={{ fontSize: '0.85rem', fontWeight: 'normal', color: '#666', lineHeight: 1.7, margin: 0 }}>
                A simple task funded by a local business — like a 15-second shoutout, a youth clinic, or a challenge. Athlete completes it, business approves, athlete gets paid instantly.
              </p>
            </div>

            <div className="fade-in-scroll" style={{ background: '#f5f5f5', borderRadius: '16px', padding: '2rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '0.75rem' }}>What is a Freedom Scholarship?</h3>
              <p style={{ fontSize: '0.85rem', fontWeight: 'normal', color: '#666', lineHeight: 1.7, margin: 0 }}>
                Unrestricted cash awarded by businesses, paid instantly. No strings — use for books, food, rent, whatever they need.
              </p>
            </div>
          </div>
        </div>
      </section>


      {/* Player Card CTA */}
      <section style={{ padding: '4rem 2rem', background: '#fafafa' }}>
        <div className="fade-in-scroll" style={{ maxWidth: '560px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
            Create Your Player Card
          </h2>
          <p style={{ fontSize: '0.9rem', fontWeight: 'normal', color: '#666', lineHeight: 1.7, marginBottom: '2rem' }}>
            Build a retro trading card with your stats, school colors, and highlights. Free to create — download instantly.
          </p>

          {/* Jordan RC style preview card */}
          <div style={{ width: '220px', margin: '0 auto 2rem', filter: 'drop-shadow(0 6px 20px rgba(0,0,0,0.2))', transform: 'rotate(-2deg)' }}>
            <Fleer86Front data={{
              ...DEFAULT_CARD_DATA,
              playerName: 'YOUR NAME',
              position: 'Guard',
              jerseyNumber: '23',
              school: 'YOUR SCHOOL',
              primaryColor: '#ce1141',
              secondaryColor: '#000000',
              accentColor: '#ffffff',
              textColor: '#ffffff',
              sport: 'Basketball',
              stat1Label: 'PPG', stat1Value: '28.2',
              stat2Label: 'RPG', stat2Value: '6.2',
              stat3Label: 'APG', stat3Value: '5.3',
              stat4Label: 'FG%', stat4Value: '.497',
            }} />
          </div>

          <p style={{ fontSize: '0.75rem', color: '#999', marginBottom: '1.5rem' }}>
            6 retro templates — customize colors, stats, and photos
          </p>
          <a href="/player-card" className="btn-fixed-200" style={{ background: '#22c55e', borderColor: '#22c55e' }}>
            Make My Card
          </a>
        </div>
      </section>


      {/* Get Started */}
      <section id="get-started" style={{ padding: '4rem 2rem', background: 'white', textAlign: 'center' }}>
        <div className="fade-in-scroll" style={{ maxWidth: '400px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '2.5rem' }}>Get Started</h2>

          <input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: '100%',
              padding: '0.875rem 1rem',
              fontSize: '0.95rem',
              fontFamily: "'Courier New', Courier, monospace",
              background: '#f0f0f0',
              border: 'none',
              borderRadius: '8px',
              textAlign: 'center',
              outline: 'none',
              marginBottom: '2rem',
            }}
          />

          <div style={{ marginBottom: '2rem' }}>
            <p style={{ fontSize: '0.8rem', fontWeight: 'normal', color: '#999', marginBottom: '1rem' }}>I am a...</p>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              {(['athlete', 'parent', 'business'] as Role[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  style={{
                    padding: '0.75rem 1.5rem',
                    fontSize: '0.85rem',
                    fontFamily: "'Courier New', Courier, monospace",
                    fontWeight: role === r ? 'bold' : 'normal',
                    borderRadius: '9999px',
                    border: 'none',
                    background: role === r ? 'black' : '#eee',
                    color: role === r ? 'white' : '#666',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {r === 'athlete' ? 'Athlete' : r === 'parent' ? 'Parent' : 'Business'}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="btn-fixed-200"
          >
            {loading ? 'Sending...' : 'Get Started'}
          </button>

          {loading && (
            <p style={{ fontSize: '0.8rem', color: '#999', marginTop: '1.5rem' }}>
              Sending magic link...
            </p>
          )}
        </div>
      </section>


      {/* College Recruitment */}
      <section style={{ padding: '4rem 2rem' }}>
        <div style={{ maxWidth: '560px', margin: '0 auto' }}>
          <div className="fade-in-scroll" style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
              Get Recruited. Automatically.
            </h2>
            <p style={{ fontSize: '0.9rem', fontWeight: 'normal', color: '#666', lineHeight: 1.7, margin: 0 }}>
              We handle outreach to college coaches — emails, DMs, follow-ups on autopilot.
            </p>
          </div>

          <div className="fade-in-scroll" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '2.5rem' }}>
            <div style={{ background: '#f5f5f5', borderRadius: '16px', padding: '1.75rem' }}>
              <p style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#22c55e' }}>01</p>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Create Profile</h3>
              <p style={{ fontSize: '0.8rem', fontWeight: 'normal', color: '#666', margin: 0 }}>Stats, highlights, achievements.</p>
            </div>
            <div style={{ background: '#f5f5f5', borderRadius: '16px', padding: '1.75rem' }}>
              <p style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#22c55e' }}>02</p>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Connect X Account</h3>
              <p style={{ fontSize: '0.8rem', fontWeight: 'normal', color: '#666', margin: 0 }}>Amplify visibility to coaches.</p>
            </div>
            <div style={{ background: '#f5f5f5', borderRadius: '16px', padding: '1.75rem' }}>
              <p style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#22c55e' }}>03</p>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>We Handle Outreach</h3>
              <p style={{ fontSize: '0.8rem', fontWeight: 'normal', color: '#666', margin: 0 }}>Coaches in all 50 states. Real-time tracking.</p>
            </div>
          </div>

          <div className="fade-in-scroll" style={{ textAlign: 'center' }}>
            <a href="/recruit" className="btn-fixed-200">Get Recruited</a>
          </div>
        </div>
      </section>


      {/* Mentorship */}
      <section style={{ padding: '4rem 2rem', background: '#fafafa' }}>
        <div style={{ maxWidth: '560px', margin: '0 auto' }}>
          <div className="fade-in-scroll" style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Mentorship</h2>
            <p style={{ fontSize: '0.9rem', fontWeight: 'normal', color: '#666', lineHeight: 1.7, margin: 0 }}>
              Connect with college athletes who&apos;ve been where you are.
            </p>
          </div>

          <div className="fade-in-scroll" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '2.5rem' }}>
            <div style={{ background: 'white', borderRadius: '16px', padding: '1.75rem' }}>
              <p style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#22c55e' }}>01</p>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>For Athletes</h3>
              <p style={{ fontSize: '0.8rem', fontWeight: 'normal', color: '#666', margin: 0 }}>Get paired with a college athlete in your sport.</p>
            </div>
            <div style={{ background: 'white', borderRadius: '16px', padding: '1.75rem' }}>
              <p style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#22c55e' }}>02</p>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>For Mentors</h3>
              <p style={{ fontSize: '0.8rem', fontWeight: 'normal', color: '#666', margin: 0 }}>Share your experience. Get paid to mentor.</p>
            </div>
            <div style={{ background: 'white', borderRadius: '16px', padding: '1.75rem' }}>
              <p style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#22c55e' }}>03</p>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>For Businesses</h3>
              <p style={{ fontSize: '0.8rem', fontWeight: 'normal', color: '#666', margin: 0 }}>Sponsor sessions. Fund youth development.</p>
            </div>
          </div>

          <div className="fade-in-scroll" style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <p style={{ fontSize: '0.85rem', fontWeight: 'normal', color: '#666', lineHeight: 1.7, margin: 0 }}>
              Real conversations with real athletes who made it. Get advice on recruiting, training, and life after high school.
            </p>
          </div>

          <div className="fade-in-scroll" style={{ textAlign: 'center' }}>
            <a href="/mentorship" className="btn-fixed-200">Find a Mentor</a>
          </div>
        </div>
      </section>

    </div>
  )
}
