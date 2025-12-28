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
      <head />
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
                style={{ width: 'auto', height: '60px' }}
                priority
              />
            </Link>

            {/* Slogan + Downward Triangle */}
            <div className="text-center">
              <p className="text-3xl sm:text-4xl lg:text-5xl font-mono mb-4">
                {displayedSlogan}
              </p>

              {/* Downward Triangle */}
              <div className="w-0 h-0 mx-auto 
                border-l-[30px] border-l-transparent
                border-r-[30px] border-r-transparent
                border-t-[40px] border-t-black" 
              />
            </div>
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
        <footer className="bg-white border-t-4 border-black py-12">
          <div className="max-w-4xl mx-auto px-6">
            <nav className="flex flex-wrap justify-center gap-x-12 gap-y-6 mb-8">
              <a href="/" className="text-gray-600 hover:text-black text-base no-underline">
                Home
              </a>
              <a href="/get-started" className="text-gray-600 hover:text-black text-base no-underline">
                Get Started
              </a>
              <a href="/business-onboard" className="text-gray-600 hover:text-black text-base no-underline">
                For Businesses
              </a>
              <a href="/faq" className="text-gray-600 hover:text-black text-base no-underline">
                FAQ
              </a>
              <a href="/ambassador" className="text-gray-600 hover:text-black text-base no-underline">
                Ambassador Program
              </a>
              <a href="/privacy" className="text-gray-600 hover:text-black text-base no-underline">
                Privacy
              </a>
              <a href="/terms" className="text-gray-600 hover:text-black text-base no-underline">
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