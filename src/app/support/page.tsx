'use client'

export default function Support() {
  return (
    <div style={{
      fontFamily: "'Courier New', Courier, monospace",
      textAlign: 'center',
      padding: '4rem 2rem',
      backgroundColor: 'white',
      color: 'black',
      minHeight: '100vh',
    }}>
      {/* Slogan + Triangle */}
      <p style={{ fontSize: '2rem', marginBottom: '1rem' }}>
        Community Driven Support for Student Athletes
      </p>
      <div style={{ fontSize: '3rem', marginBottom: '4rem' }}>▼</div>

      {/* Title */}
      <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '2rem' }}>
        Support
      </h1>

      {/* Content */}
      <div style={{ maxWidth: '800px', margin: '0 auto', fontSize: '1.5rem', lineHeight: '1.8' }}>
        <p style={{ marginBottom: '3rem' }}>
          Have a question or need help?<br />
          Email us at <strong>support@localhustle.org</strong>
        </p>

        <p style={{ marginBottom: '3rem' }}>
          We typically reply within 24 hours.
        </p>

        <p>
          Thanks for being part of LocalHustle!<br />
          Together we're supporting local athletes.
        </p>
      </div>
    </div>
  )
}