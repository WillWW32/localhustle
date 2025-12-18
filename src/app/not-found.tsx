export default function NotFound() {
  return (
    <div style={{
      fontFamily: "'Courier New', Courier, monospace",
      textAlign: 'center',
      padding: '10rem 2rem',
      backgroundColor: 'white',
      color: 'black',
    }}>
      <h1 style={{ fontSize: '48px', fontWeight: 'bold', marginBottom: '2rem' }}>
        404 — Page Not Found
      </h1>
      <p style={{ fontSize: '24px' }}>
        Sorry, this page doesn't exist.
      </p>
      <p style={{ fontSize: '20px', marginTop: '2rem' }}>
        <a href="/" style={{ color: 'black', textDecoration: 'underline' }}>
          Return to Home
        </a>
      </p>
    </div>
  )
}