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
        <header className="py-4 border-b-4 border-black">
          <div className="container text-center">
            <Link href="/">
              <Image
                src="/logo.jpg"
                alt="LocalHustle Logo"
                width={280}
                height={280}
                className="mx-auto"
                priority
              />
            </Link>
          </div>
        </header>

        <main>{children}</main>

        {/* Global Share Button — fixed bottom */}
        <button
          onClick={handleShare}
          style={{
            position: 'fixed',
            bottom: '2rem',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 100,
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

        {/* Your exact footer */}
        <footer style={{ marginTop: '8rem', paddingTop: '4rem', borderTop: '4px solid black' }}>
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