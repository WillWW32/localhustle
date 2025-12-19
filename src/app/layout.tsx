import './globals.css'
import Image from 'next/image'
import Link from 'next/link'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'LocalHustle',
        text: 'Join LocalHustle — earn from local business sponsorships as a high school athlete!',
        url: 'https://app.localhustle.org',
      }).catch(console.error)
    } else {
      alert('Copy this link to share: https://app.localhustle.org')
    }
  }

  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>
        {/* Header — reduced padding */}
        <header className="py-2 border-b-4 border-black"> {/* py-4 → py-2 */}
          <div className="container text-center">
            <Link href="/">
              <Image
                src="/logo.jpg"
                alt="LocalHustle Logo"
                width={250}
                height={250}
                className="mx-auto"
                priority
              />
            </Link>
          </div>
        </header>

        <main>{children}</main>

        {/* Share button pinned above footer */}
        <div style={{ position: 'sticky', bottom: '0', backgroundColor: 'white', padding: '1rem', borderTop: '4px solid black', zIndex: 90 }}>
          <button
            onClick={handleShare}
            style={{
              width: '100%',
              maxWidth: '500px',
              margin: '0 auto',
              display: 'block',
              backgroundColor: 'black',
              color: 'white',
              fontFamily: "'Courier New', Courier, monospace",
              fontSize: '20px',
              padding: '1rem 2rem',
              border: '4px solid black',
              cursor: 'pointer',
            }}
          >
            Share with Teammates
          </button>
        </div>

        <footer style={{ marginTop: '4rem', paddingTop: '4rem', borderTop: '4px solid black' }}>
          <nav style={{
            marginBottom: '2rem',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '1rem',
          }}>
            <Link href="/" style={{ color: 'gray', textDecoration: 'underline' }}>Home</Link>
            <Link href="/dashboard" style={{ color: 'gray', textDecoration: 'underline' }}>Dashboard</Link>
            <Link href="/profile" style={{ color: 'gray', textDecoration: 'underline' }}>Profile</Link>
            <Link href="/compliance" style={{ color: 'gray', textDecoration: 'underline' }}>Compliance</Link>
            <Link href="/privacy" style={{ color: 'gray', textDecoration: 'underline' }}>Privacy</Link>
            <Link href="/terms" style={{ color: 'gray', textDecoration: 'underline' }}>Terms</Link>
          </nav>
          <p style={{ fontSize: '.7rem' }}>
            © 2025 LocalHustle — Community Driven Support for Student Athletes
          </p>
        </footer>
      </body>
    </html>
  )
}