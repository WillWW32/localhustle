'use client'

import './globals.css'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [displayedSlogan, setDisplayedSlogan] = useState('')
  const slogan = "Community Driven Support for Student Athletes"
  const pathname = usePathname()

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'LocalHustle',
        text: 'Join LocalHustle — earn from local business sponsorships as a high school athlete!',
        url: 'https://app.localhustle.org',
      }).catch(console.error)
    } else {
      navigator.clipboard.writeText('https://app.localhustle.org')
      alert('Link copied — send to your teammates!')
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

  // Hide share banner on business pages
  const isBusinessPage = pathname === '/business-onboard' || pathname.startsWith('/dashboard')

  return (
    <html lang="en">
      <head>
        {/* PWA Manifest & Icons */}
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="theme-color" content="#000000" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black" />
      </head>
      <body>
        {/* Header */}
        <header className="bg-white border-b-4 border-black py-8">
          <div className="max-w-6xl mx-auto px-6 flex flex-col items-center gap-8">
            <Link href="/">
              <Image
                src="/logo.png"
                alt="LocalHustle Logo"
                width={0}
                height={0}
                sizes="100vw"
                style={{ width: 'auto', height: '120px' }}
                priority
              />
            </Link>

            {/* Slogan — Now Matches Subhead Size */}
            <div className="subhead-white-black">
              {displayedSlogan}
            </div>

            {/* Downward Triangle — Fixed & Visible */}
            <div className="w-0 h-0 border-l-[40px] border-l-transparent border-r-[40px] border-r-transparent border-t-[60px] border-t-black" />
          </div>
        </header>

        {children}

        {/* Share with Teammates Banner — Only on non-business pages */}
        {!isBusinessPage && (
          <div className="bg-gray-50 py-2 border-t border-b border-gray-300">
            <p className="text-xs text-center text-gray-600">
              Share with teammates — earn together!{' '}
              <button 
                onClick={handleShare}
                className="underline hover:text-black cursor-pointer"
              >
                Tap to share
              </button>
            </p>
          </div>
        )}

        {/* Footer */}
        <footer className="bg-white border-t-4 border-black py-16 mt-auto">
          <div className="max-w-6xl mx-auto px-6">
            {/* Footer Links — Horizontal, Spaced, Gray */}
            <nav className="flex flex-wrap justify-center gap-x-12 gap-y-6 mb-12">
              <a href="/" className="text-gray-600 hover:text-black text-lg no-underline">
                How It Works
              </a>
              <a href="/get-started" className="text-gray-600 hover:text-black text-lg no-underline">
                Athletes
              </a>
              <a href="/parent-onboard" className="text-gray-600 hover:text-black text-lg no-underline">
                Parents
              </a>
              <a href="/business-onboard" className="text-gray-600 hover:text-black text-lg no-underline">
                Businesses
              </a>
              <a href="/ambassador" className="text-gray-600 hover:text-black text-lg no-underline">
                Ambassador Program
              </a>
              <a href="/privacy" className="text-gray-600 hover:text-black text-lg no-underline">
                Privacy
              </a>
              <a href="/terms" className="text-gray-600 hover:text-black text-lg no-underline">
                Terms
              </a>
            </nav>

            <p className="text-gray-500 text-sm text-center">
              © 2025 LocalHustle — Community Driven Support for Student Athletes
            </p>
          </div>
        </footer>
      </body>
    </html>
  )
}