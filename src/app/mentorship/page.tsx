'use client'

import Link from 'next/link'

export default function MentorshipLandingPage() {
  return (
    <div className="form-page" style={{ minHeight: '100vh', background: 'white' }}>
      {/* Hero */}
      <section style={{ borderBottom: '4px solid black', padding: '4rem 1.5rem', textAlign: 'center' }}>
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <div className="black-block" style={{ display: 'inline-block', marginBottom: '1.5rem' }}>
            <h1 style={{ fontSize: '2rem', padding: '0.75rem 1.5rem', margin: 0 }}>Mentorship</h1>
          </div>
          <p style={{ fontSize: '1.25rem', color: '#333', marginBottom: '1.5rem', lineHeight: 1.6 }}>
            Connect with college athletes who&apos;ve been where you are. Get guidance on recruitment, training, and the college experience.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/mentorship/signup" className="btn-fixed-200" style={{ background: 'black', color: 'white', padding: '0.75rem 2rem', fontWeight: 'bold', textDecoration: 'none', display: 'inline-block', textAlign: 'center' }}>
              Become a Mentor
            </Link>
            <Link href="#how-it-works" style={{ border: '3px solid black', padding: '0.75rem 2rem', fontWeight: 'bold', textDecoration: 'none', color: 'black', display: 'inline-block', textAlign: 'center' }}>
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" style={{ padding: '4rem 1.5rem', maxWidth: '900px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '1.5rem', textAlign: 'center', marginBottom: '2rem' }}>How It Works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {[
            { step: '01', title: 'For Athletes', desc: 'Browse mentors by sport and request a session. Get paired with a college athlete who plays your position.' },
            { step: '02', title: 'For Mentors', desc: 'Sign up as a college athlete. Share your experience, help the next generation, and earn $35/session.' },
            { step: '03', title: 'For Businesses', desc: 'Sponsor mentorship sessions. Fund youth development in your community and build your brand.' },
          ].map((item) => (
            <div key={item.step} style={{ border: '4px solid black', padding: '1.5rem' }}>
              <p style={{ color: 'green', fontWeight: 'bold', fontSize: '2rem', marginBottom: '0.5rem' }}>{item.step}</p>
              <h3 style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>{item.title}</h3>
              <p style={{ color: '#666', fontSize: '0.875rem', marginBottom: 0 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* What You Get */}
      <section style={{ background: 'black', color: 'white', padding: '4rem 1.5rem' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '1.5rem', textAlign: 'center', marginBottom: '2rem' }}>What Mentors Provide</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              'Recruitment guidance and timeline planning',
              'Position-specific training advice',
              'Campus visit preparation tips',
              'Academic planning for student-athletes',
              'Mental toughness and competition prep',
              'Real talk about the college athlete experience',
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                <span style={{ color: 'green', fontWeight: 'bold', fontSize: '1.25rem', flexShrink: 0 }}>&#10003;</span>
                <p style={{ fontSize: '0.875rem', marginBottom: 0 }}>{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section style={{ padding: '4rem 1.5rem', maxWidth: '700px', margin: '0 auto', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Simple Pricing</h2>
        <div style={{ border: '4px solid black', padding: '2rem', marginBottom: '1.5rem' }}>
          <p style={{ fontSize: '3rem', fontWeight: 'bold', color: 'green', marginBottom: '0.25rem' }}>$35</p>
          <p style={{ color: '#666', marginBottom: '1rem' }}>per 30-minute session</p>
          <p style={{ color: '#333', fontSize: '0.875rem', marginBottom: 0 }}>
            Sessions can be funded by local businesses or paid directly. Mentors earn the full session fee.
          </p>
        </div>
        <Link href="/mentorship/signup" style={{ background: 'black', color: 'white', padding: '0.75rem 2rem', fontWeight: 'bold', textDecoration: 'none', display: 'inline-block' }}>
          Get Started
        </Link>
      </section>
    </div>
  )
}
