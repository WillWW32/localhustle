import './globals.css'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'  // <--- Added this line

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
        {/* Header — reduced padding, logo 225px */}
        <header className="py-1 border-b-4 border-black">
          <div className="container text-center">
            <Link href="/">
              <Image
                src="/logo.jpg"
                alt="LocalHustle Logo"
                width={225}
                height={225}
                className="mx-auto"
                priority
              />
            </Link>
          </div>
        </header>

        <main>{children}</main>

        {/* Pinned Share Button — above footer */}
        <div style={{ padding: '2rem 0', backgroundColor: 'white' }}>
          <Button onClick={handleShare} className="w-full max-w-md h-20 text-2xl bg-black text-white hover:bg-gray-800 mx-auto block">
            Share with Teammates
          </Button>
        </div>

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