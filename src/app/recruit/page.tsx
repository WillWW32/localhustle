'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function RecruitLandingPage() {
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
            Get Recruited
          </h1>
          <p style={{ fontSize: '0.95rem', fontWeight: 'normal', color: '#666', lineHeight: 1.7, marginBottom: '2.5rem' }}>
            We handle outreach to college coaches — emails, DMs, follow-ups on autopilot. You focus on your game.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/recruit/signup" className="btn-fixed-200">
              Start Now
            </Link>
            <Link href="/recruit/login" style={{ display: 'inline-block', padding: '0.75rem 2rem', fontSize: '0.85rem', fontWeight: 'bold', fontFamily: "'Courier New', Courier, monospace", border: '2px solid black', borderRadius: '9999px', color: 'black', textDecoration: 'none' }}>
              Athlete Login
            </Link>
          </div>
        </div>
      </section>


      {/* How It Works */}
      <section style={{ padding: '4rem 2rem', background: '#fafafa' }}>
        <div style={{ maxWidth: '560px', margin: '0 auto' }}>
          <h2 className="fade-in-scroll" style={{ fontSize: '1.5rem', fontWeight: 'bold', textAlign: 'center', marginBottom: '2.5rem' }}>
            How It Works
          </h2>
          <div className="fade-in-scroll" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {[
              { step: '01', title: 'Create Your Profile', desc: 'Add your stats, highlights, GPA, and achievements.' },
              { step: '02', title: 'Connect Your X Account', desc: 'We amplify your visibility to coaches across the country.' },
              { step: '03', title: 'We Handle Outreach', desc: 'Automated emails and DMs to coaches in all 50 states with real-time tracking.' },
            ].map((item) => (
              <div key={item.step} style={{ background: 'white', borderRadius: '16px', padding: '1.75rem' }}>
                <p style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>{item.step}</p>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>{item.title}</h3>
                <p style={{ fontSize: '0.8rem', fontWeight: 'normal', color: '#666', lineHeight: 1.7, margin: 0 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* What Coaches See */}
      <section style={{ padding: '4rem 2rem' }}>
        <div style={{ maxWidth: '560px', margin: '0 auto' }}>
          <h2 className="fade-in-scroll" style={{ fontSize: '1.5rem', fontWeight: 'bold', textAlign: 'center', marginBottom: '2.5rem' }}>
            What Coaches See
          </h2>
          <div className="fade-in-scroll" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              'Full athletic profile with stats and highlights',
              'GPA and academic standing',
              'Video clips and game footage',
              'Social media presence and engagement',
              'Endorsements from local businesses',
            ].map((item, i) => (
              <div key={i} style={{ background: '#f5f5f5', borderRadius: '12px', padding: '1.25rem 1.5rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                <span style={{ fontWeight: 'bold', color: '#22c55e', flexShrink: 0 }}>&#10003;</span>
                <p style={{ fontSize: '0.85rem', fontWeight: 'normal', color: '#666', margin: 0, lineHeight: 1.6 }}>{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* CTA */}
      <section style={{ padding: '4rem 2rem 5rem', textAlign: 'center' }}>
        <div className="fade-in-scroll" style={{ maxWidth: '400px', margin: '0 auto' }}>
          <p style={{ fontSize: '0.9rem', fontWeight: 'normal', color: '#666', lineHeight: 1.7, marginBottom: '2rem' }}>
            Coaches in all 50 states. Real-time tracking. We do the work — you play your game.
          </p>
          <Link href="/recruit/signup" className="btn-fixed-200">
            Get Started
          </Link>
        </div>
      </section>

    </div>
  )
}
