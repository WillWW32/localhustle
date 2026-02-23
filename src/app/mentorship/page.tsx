'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function MentorshipLandingPage() {
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

  return (
    <div style={{ minHeight: '100vh', background: 'white', fontFamily: "'Courier New', Courier, monospace" }}>

      {/* Hero */}
      <section style={{ padding: '4rem 2rem', textAlign: 'center' }}>
        <div className="fade-in-scroll" style={{ maxWidth: '560px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', lineHeight: 1.3, marginBottom: '1.5rem' }}>
            Mentorship
          </h1>
          <p style={{ fontSize: '0.95rem', fontWeight: 'normal', color: '#666', lineHeight: 1.7, marginBottom: '2.5rem' }}>
            Connect with college athletes who&apos;ve been where you are. Get guidance on recruitment, training, and the college experience.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/mentorship/signup" className="btn-fixed-200">
              Become a Mentor
            </Link>
          </div>
        </div>
      </section>


      {/* How It Works */}
      <section id="how-it-works" style={{ padding: '4rem 2rem', background: '#fafafa' }}>
        <div style={{ maxWidth: '560px', margin: '0 auto' }}>
          <h2 className="fade-in-scroll" style={{ fontSize: '1.5rem', fontWeight: 'bold', textAlign: 'center', marginBottom: '2.5rem' }}>
            How It Works
          </h2>
          <div className="fade-in-scroll" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {[
              { step: '01', title: 'For Athletes', desc: 'Browse mentors by sport and request a session. Get paired with a college athlete who plays your position.' },
              { step: '02', title: 'For Mentors', desc: 'Sign up as a college athlete. Share your experience, help the next generation, and earn $35/session.' },
              { step: '03', title: 'For Businesses', desc: 'Sponsor mentorship sessions. Fund youth development in your community.' },
            ].map((item) => (
              <div key={item.step} style={{ background: 'white', borderRadius: '16px', padding: '1.75rem' }}>
                <p style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#22c55e' }}>{item.step}</p>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>{item.title}</h3>
                <p style={{ fontSize: '0.8rem', fontWeight: 'normal', color: '#666', lineHeight: 1.7, margin: 0 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* What Mentors Provide */}
      <section style={{ padding: '4rem 2rem' }}>
        <div style={{ maxWidth: '560px', margin: '0 auto' }}>
          <h2 className="fade-in-scroll" style={{ fontSize: '1.5rem', fontWeight: 'bold', textAlign: 'center', marginBottom: '2.5rem' }}>
            What Mentors Provide
          </h2>
          <div className="fade-in-scroll" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              'Recruitment guidance and timeline planning',
              'Position-specific training advice',
              'Campus visit preparation tips',
              'Academic planning for student-athletes',
              'Mental toughness and competition prep',
              'Real talk about the college athlete experience',
            ].map((item, i) => (
              <div key={i} style={{ background: '#f5f5f5', borderRadius: '12px', padding: '1.25rem 1.5rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                <span style={{ fontWeight: 'bold', color: '#22c55e', flexShrink: 0 }}>&#10003;</span>
                <p style={{ fontSize: '0.85rem', fontWeight: 'normal', color: '#666', margin: 0, lineHeight: 1.6 }}>{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* Pricing */}
      <section style={{ padding: '4rem 2rem', background: '#fafafa', textAlign: 'center' }}>
        <div className="fade-in-scroll" style={{ maxWidth: '400px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '2rem' }}>Simple Pricing</h2>
          <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#22c55e', margin: 0 }}>$35</p>
          <p style={{ fontSize: '0.8rem', fontWeight: 'normal', color: '#aaa', marginTop: '0.25rem', marginBottom: '1.5rem' }}>per 30-minute session</p>
          <p style={{ fontSize: '0.85rem', fontWeight: 'normal', color: '#666', lineHeight: 1.7, marginBottom: '2.5rem' }}>
            Sessions can be funded by local businesses or paid directly. Mentors earn the full session fee.
          </p>
          <Link href="/mentorship/signup" className="btn-fixed-200">
            Get Started
          </Link>
        </div>
      </section>

    </div>
  )
}
