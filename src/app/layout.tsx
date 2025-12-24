'use client'

import './globals.css'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useEffect, useState } from 'react'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [displayedSlogan, setDisplayedSlogan] = useState('')
  const slogan = "Community Driven Support for Student Athletes"

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

  useEffect(() => {
    let index = 0
    const interval = setInterval(() => {
      if (index <= slogan.length) {
        setDisplayedSlogan(slogan.slice(0, index))
        index++
      } else {
        clearInterval(interval)
      }
    }, 50)

    return () => clearInterval(interval)
  }, [])

  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body style={{ fontFamily: "'Courier New', Courier, monospace", backgroundColor: 'white', color: 'black' }}>
        {/* Header */}
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

        {/* Slogan + Typewriter + Triangle */}
        <div className="text-center py-2">
          <p style={{ fontSize: '2rem', margin: '0' }}>
            {displayedSlogan}
            <span style={{ animation: 'blink 1s step-end infinite' }}>|</span>
          </p>
          <div style={{ fontSize: '3rem', margin: '1rem 0' }}>▼</div>
        </div>

        <main>{children}</main>

        {/* Pinned Share Button */}
        <div className="text-center py-8 bg-white">
          <Button onClick={handleShare} style={{
            width: '100%',
            maxWidth: '500px',
            height: '80px',
            fontSize: '30px',
            backgroundColor: 'black',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: "'Courier New', Courier, monospace'",
          }}>
            Share with Teammates
          </Button>
        </div>

        {/* Footer — smaller text, 2 lines, gray */}
        <footer className="py-8 border-t-4 border-black text-center">
          <nav className="mb-2 flex flex-col items-center gap-2 text-xs">
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/" className="text-gray-600 hover:text-black">Home</Link>
              <Link href="/dashboard" className="text-gray-600 hover:text-black">Dashboard</Link>
              <Link href="/profile" className="text-gray-600 hover:text-black">Profile</Link>
              <Link href="/compliance" className="text-gray-600 hover:text-black">Compliance</Link>
            </div>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/privacy" className="text-gray-600 hover:text-black">Privacy</Link>
              <Link href="/terms" className="text-gray-600 hover:text-black">Terms</Link>
              <Link href="/support" className="text-gray-600 hover:text-black">Support</Link>
            </div>
          </nav>
          <p className="text-xs text-gray-600 mt-4">
            © 2025 LocalHustle — Community Driven Support for Student Athletes
          </p>
        </footer>
      </body>
    </html>
  )
}