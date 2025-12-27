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

{/* Share with Teammates Banner — Ultra Small, Minimal */}
<div className="bg-gray-50 py-3 border-t border-b border-gray-300">
  <p className="text-sm text-center text-gray-700">
    Share with teammates — earn together!{' '}
    <a 
      href={`https://app.localhustle.org?ref=${profile?.id}`}
      className="underline hover:text-black"
    >
      localhustle.org?ref={profile?.id}
    </a>
  </p>
</div>

        {/* Footer — smaller text, 2 lines, gray */}
        <footer className="bg-white border-t-4 border-black py-8">
  <div className="max-w-4xl mx-auto px-6">
    <nav className="flex flex-wrap justify-center gap-x-8 gap-y-2 mb-6">
      <a href="/" className="text-xs text-gray-500 hover:text-black">
        Home
      </a>
      <a href="/get-started" className="text-xs text-gray-500 hover:text-black">
        Get Started
      </a>
      <a href="/business-onboard" className="text-xs text-gray-500 hover:text-black">
        For Businesses
      </a>
      <a href="/faq" className="text-xs text-gray-500 hover:text-black">
        FAQ
      </a>
      <a href="/ambassador" className="text-xs text-gray-500 hover:text-black">
        Ambassador Program
      </a>
      <a href="/privacy" className="text-xs text-gray-500 hover:text-black">
        Privacy
      </a>
      <a href="/terms" className="text-xs text-gray-500 hover:text-black">
        Terms
      </a>
    </nav>

    <p className="text-xs text-gray-400 text-center">
      © 2025 LocalHustle — Community Driven Support for Student Athletes
    </p>
  </div>
</footer>
      </body>
    </html>
  )
}