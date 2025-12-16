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
        <header className="py-8 mb-12">
          <div className="container text-center">
            <Link href="/">
              <Image
                src="/logo.jpg"
                alt="LocalHustle Logo"
                width={300}
                height={300}
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