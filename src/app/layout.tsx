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
        {/* Header — minimal padding */}
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

        {/* Pinned Share Button — courier + vertical center */}
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

        <footer className="py-8 border-t-4 border-black text-center">
          <nav className="mb-4 flex justify-center gap-4 flex-wrap">
            <Link href="/" className="text-gray-600 underline">Home</Link>
            <Link href="/dashboard" className="text-gray-600 underline">Dashboard</Link>
            <Link href="/profile" className="text-gray-600 underline">Profile</Link>
            <Link href="/compliance" className="text-gray-600 underline">Compliance</Link>
            <Link href="/privacy" className="text-gray-600 underline">Privacy</Link>
            <Link href="/terms" className="text-gray-600 underline">Terms</Link>
          </nav>
          <p className="text-xs">
            © 2025 LocalHustle — Community Driven Support for Student Athletes
          </p>
        </footer>
      </body>
    </html>
  )
}