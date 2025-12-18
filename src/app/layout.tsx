import './globals.css'
import Image from 'next/image'
import Link from 'next/link'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
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

        {/* Site-map Footer — small gray links */}
        <footer className="py-12 border-t-4 border-black mt-32">
          <div className="container text-center">
            <nav className="flex flex-wrap justify-center gap-6 mb-8 text-sm text-gray-600">
              <Link href="/" className="hover:underline">Home</Link>
              <Link href="/dashboard" className="hover:underline">Dashboard</Link>
              <Link href="/profile" className="hover:underline">Profile</Link>
              <Link href="/open-gigs" className="hover:underline">Open Gigs</Link>
              <Link href="/compliance" className="hover:underline">Compliance</Link>
              <Link href="/privacy" className="hover:underline">Privacy</Link>
              <Link href="/terms" className="hover:underline">Terms</Link>
            </nav>
            <p className="text-xs text-gray-600">
              © 2025 LocalHustle — Community Driven Support for Student Athletes
            </p>
          </div>
        </footer>
      </body>
    </html>
  )
}