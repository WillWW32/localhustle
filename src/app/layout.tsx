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
        <header className="py-8 mb-12 border-b-4 border-black">
          <div className="container text-center">
            <Link href="/">
              <Image
                src="/logo.jpg"
                alt="LocalHustle Logo"
                width={250}
                height={250}
                className="mx-auto transition-transform hover:scale-105"
                priority
              />
            </Link>
          </div>
        </header>

        <main className="animate-fadeIn">
          {children}
        </main>
      </body>
    </html>
  )
}