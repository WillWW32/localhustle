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
  <link rel="icon" href="/favicon.ico" sizes="any" />
  <link rel="icon" href="/favicon-16x16.png" type="image/png" sizes="16x16" />
  <link rel="icon" href="/favicon-32x32.png" type="image/png" sizes="32x32" />
  <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
  <link rel="manifest" href="/site.webmanifest" /> {/* optional for PWA */}
</head>
      <body>
        <header className="py-12 border-b-4 border-black">
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

        <main className="fade-in">
          {children}
        </main>
      </body>
    </html>
  )
}