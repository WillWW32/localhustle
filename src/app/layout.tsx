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
      <body className="min-h-screen bg-white text-black">
        {/* Single Logo Header */}
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

        <main>{children}</main>
      </body>
    </html>
  )
}