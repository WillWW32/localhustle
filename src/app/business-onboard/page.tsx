'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'

const gigTypes = [
  { title: 'ShoutOut', description: 'Visit a favorite business and make a quick 15-sec shoutout reel.' },
  { title: 'Youth Clinic', description: '30-60 min sessions for younger athletes with teammates.' },
  { title: 'Cameo', description: 'Custom 15-sec video for younger athletes — birthdays, pep talks.' },
  { title: 'Player Training', description: 'Varsity athlete 40-minute training with a young player.' },
  { title: 'Challenge', description: 'Fun competitions — HORSE, free throws, accuracy toss.' },
  { title: 'Custom Gig', description: 'Create a gig and offer it.' },
]

export default function BusinessOnboard() {
  const router = useRouter()

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

  useEffect(() => {
    const setBusinessRole = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: prof } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (!prof || prof.role !== 'business') {
        await supabase
          .from('profiles')
          .upsert({ id: user.id, role: 'business' })
      }
    }

    setBusinessRole()
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: 'white', fontFamily: "'Courier New', Courier, monospace" }}>

      {/* Hero */}
      <section style={{ padding: '4rem 2rem', textAlign: 'center' }}>
        <div className="fade-in-scroll" style={{ maxWidth: '560px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', lineHeight: 1.3, marginBottom: '1.5rem' }}>
            Become the Hometown Hero
          </h1>
          <p style={{ fontSize: '0.95rem', fontWeight: 'normal', color: '#666', lineHeight: 1.7, margin: 0 }}>
            Fund local athletes with gigs and Freedom Scholarships — unrestricted cash paid instantly. Get authentic content. Build goodwill.
          </p>
        </div>
      </section>


      {/* Stat */}
      <section style={{ padding: '0 2rem 4rem' }}>
        <div className="fade-in-scroll" style={{ maxWidth: '560px', margin: '0 auto', background: '#fafafa', borderRadius: '16px', padding: '2rem', textAlign: 'center' }}>
          <p style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '0.75rem' }}>
            NIL deal advertising performs 4x better than traditional ads
          </p>
          <p style={{ fontSize: '0.8rem', fontWeight: 'normal', color: '#666', margin: 0 }}>
            Authentic word-of-mouth from kids parents trust.
          </p>
        </div>
      </section>


      {/* How It Works */}
      <section style={{ padding: '4rem 2rem', background: '#fafafa' }}>
        <div style={{ maxWidth: '560px', margin: '0 auto' }}>
          <h2 className="fade-in-scroll" style={{ fontSize: '1.5rem', fontWeight: 'bold', textAlign: 'center', marginBottom: '2.5rem' }}>
            How It Works
          </h2>
          <div className="fade-in-scroll" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              '1. Add funds to your wallet (instant).',
              '2. Post a gig or award a Freedom Scholarship.',
              '3. Athletes complete, you approve, they get paid.',
            ].map((step, i) => (
              <div key={i} style={{ background: 'white', borderRadius: '12px', padding: '1.25rem 1.5rem' }}>
                <p style={{ fontSize: '0.85rem', fontWeight: 'normal', color: '#666', margin: 0 }}>{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* Gig Types */}
      <section style={{ padding: '4rem 2rem' }}>
        <div style={{ maxWidth: '560px', margin: '0 auto' }}>
          <h2 className="fade-in-scroll" style={{ fontSize: '1.5rem', fontWeight: 'bold', textAlign: 'center', marginBottom: '1rem' }}>
            Popular Gig Types
          </h2>
          <p className="fade-in-scroll" style={{ fontSize: '0.85rem', fontWeight: 'normal', color: '#666', textAlign: 'center', marginBottom: '2.5rem', lineHeight: 1.7 }}>
            These are the gigs you can offer student athletes.
          </p>
          <div className="fade-in-scroll" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {gigTypes.map((gig) => (
              <div key={gig.title} style={{ background: '#f5f5f5', borderRadius: '16px', padding: '1.75rem' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>{gig.title}</h3>
                <p style={{ fontSize: '0.8rem', fontWeight: 'normal', color: '#666', margin: 0, lineHeight: 1.6 }}>{gig.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* Freedom Scholarships */}
      <section style={{ padding: '4rem 2rem', background: '#fafafa' }}>
        <div className="fade-in-scroll" style={{ maxWidth: '560px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Freedom Scholarships</h2>
          <p style={{ fontSize: '0.85rem', fontWeight: 'normal', color: '#666', lineHeight: 1.7, margin: 0 }}>
            Add a scholarship to any gig or award standalone — paid instantly. No restrictions. You become the hero who made college more possible.
          </p>
        </div>
      </section>


      {/* Booster Events */}
      <section style={{ padding: '4rem 2rem' }}>
        <div className="fade-in-scroll" style={{ maxWidth: '560px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Better Fundraising</h2>
          <p style={{ fontSize: '0.85rem', fontWeight: 'normal', color: '#666', lineHeight: 1.7, margin: 0 }}>
            Support or create booster events — crowd-fund team meals, gear, travel, or clinics. Share the link, businesses donate, money goes directly to team needs.
          </p>
        </div>
      </section>


      {/* CTA */}
      <section style={{ padding: '3rem 2rem 5rem', textAlign: 'center' }}>
        <div className="fade-in-scroll">
          <Link href="/business-dashboard" className="btn-fixed-200">
            Go to Dashboard
          </Link>
        </div>
      </section>

    </div>
  )
}
