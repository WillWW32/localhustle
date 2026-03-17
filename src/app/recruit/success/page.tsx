'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function SuccessContent() {
  const searchParams = useSearchParams()
  const slug = searchParams.get('slug')

  return (
    <div style={{ minHeight: '100vh', background: 'white', fontFamily: "'Courier New', Courier, monospace", padding: '4rem 2rem' }}>
      <div style={{ maxWidth: '560px', margin: '0 auto', textAlign: 'center' }}>

        <div style={{ fontSize: '3rem', marginBottom: '1.5rem' }}>&#10003;</div>

        <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', marginBottom: '1rem' }}>
          You&apos;re In.
        </h1>
        <p style={{ fontSize: '0.95rem', color: '#666', lineHeight: 1.7, marginBottom: '2.5rem' }}>
          Your athlete profile has been created and we&apos;re setting up your recruitment campaign. Coaches will start hearing from us soon.
        </p>

        <div style={{ background: '#f5f5f5', borderRadius: '16px', padding: '2rem', marginBottom: '2.5rem', textAlign: 'left' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '1.25rem' }}>What happens next:</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <span style={{ color: '#22c55e', fontWeight: 'bold', fontSize: '0.9rem' }}>01</span>
              <p style={{ fontSize: '0.85rem', color: '#666', margin: 0 }}>We build your outreach campaign targeting coaches across all 50 states.</p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <span style={{ color: '#22c55e', fontWeight: 'bold', fontSize: '0.9rem' }}>02</span>
              <p style={{ fontSize: '0.85rem', color: '#666', margin: 0 }}>Personalized emails go out to college programs that match your profile.</p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <span style={{ color: '#22c55e', fontWeight: 'bold', fontSize: '0.9rem' }}>03</span>
              <p style={{ fontSize: '0.85rem', color: '#666', margin: 0 }}>We&apos;ll email you with updates and coach responses.</p>
            </div>
          </div>
        </div>

        {slug && (
          <div style={{ marginBottom: '2rem' }}>
            <p style={{ fontSize: '0.75rem', color: '#999', marginBottom: '0.5rem' }}>Your public profile:</p>
            <a href={`/recruit/${slug}`} style={{ fontSize: '0.85rem', color: 'black', fontWeight: 'bold' }}>
              localhustle.org/recruit/{slug}
            </a>
          </div>
        )}

        <a href="/" style={{
          display: 'inline-block',
          padding: '0.75rem 2rem',
          fontSize: '0.9rem',
          fontWeight: 'bold',
          fontFamily: "'Courier New', Courier, monospace",
          background: 'black',
          color: 'white',
          border: 'none',
          borderRadius: '9999px',
          textDecoration: 'none',
        }}>
          Back to Home
        </a>

      </div>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Courier New', Courier, monospace" }}>
        Loading...
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
}
