'use client'

import './globals.css'
import Image from 'next/image'
import Link from 'next/link'
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

  const isDashboard = pathname?.includes('-dashboard') || pathname?.startsWith('/admin')

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

  const isBusinessPage = pathname === '/business-onboard' || pathname?.startsWith('/dashboard')

  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="theme-color" content="#000000" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      </head>
      <body>
        {/* Header — compact on dashboards */}
        <header style={{
          borderBottom: isDashboard ? '2px solid black' : '3px solid black',
          padding: isDashboard ? '0.5rem 0' : '1.5rem 0',
          background: 'white',
        }}>
          <div style={{ maxWidth: '768px', margin: '0 auto', padding: '0 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: isDashboard ? '0' : '0.75rem' }}>
            <Link href="/">
              <Image
                src="/logo.png"
                alt="LocalHustle"
                width={0}
                height={0}
                sizes="100vw"
                style={{ width: 'auto', height: isDashboard ? '40px' : '80px' }}
                priority
              />
            </Link>

            {/* Slogan — hide on dashboards */}
            {!isDashboard && (
              <>
                <div className="subhead-white-black">
                  {displayedSlogan}
                </div>
                <div style={{ width: 0, height: 0, borderLeft: '20px solid transparent', borderRight: '20px solid transparent', borderTop: '30px solid black' }} />
              </>
            )}
          </div>
        </header>

        {children}

        {/* Share banner — hide on dashboards */}
        {!isBusinessPage && !isDashboard && (
          <div style={{ background: '#f9fafb', padding: '0.5rem', borderTop: '1px solid #eee', borderBottom: '1px solid #eee' }}>
            <p style={{ fontSize: '0.7rem', textAlign: 'center', color: '#666', margin: 0 }}>
              Share with teammates — earn together!{' '}
              <button
                onClick={handleShare}
                style={{ textDecoration: 'underline', cursor: 'pointer', background: 'none', border: 'none', color: '#666', fontSize: '0.7rem', padding: 0, margin: 0, width: 'auto', maxWidth: 'none', display: 'inline' }}
              >
                Tap to share
              </button>
            </p>
          </div>
        )}

        {/* Footer — minimal on dashboards */}
        {!isDashboard ? (
          <footer style={{ borderTop: '3px solid black', padding: '2rem 1rem', background: 'white' }}>
            <div style={{ maxWidth: '768px', margin: '0 auto' }}>
              <nav style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0.75rem 1.5rem', marginBottom: '1rem' }}>
                <a href="/" style={{ color: '#666', textDecoration: 'none', fontSize: '0.8rem' }}>How It Works</a>
                <a href="/get-started" style={{ color: '#666', textDecoration: 'none', fontSize: '0.8rem' }}>Athletes</a>
                <a href="/parent-onboard" style={{ color: '#666', textDecoration: 'none', fontSize: '0.8rem' }}>Parents</a>
                <a href="/business-onboard" style={{ color: '#666', textDecoration: 'none', fontSize: '0.8rem' }}>Businesses</a>
                <a href="/ambassador" style={{ color: '#666', textDecoration: 'none', fontSize: '0.8rem' }}>Ambassador</a>
                <a href="/privacy" style={{ color: '#666', textDecoration: 'none', fontSize: '0.8rem' }}>Privacy</a>
                <a href="/terms" style={{ color: '#666', textDecoration: 'none', fontSize: '0.8rem' }}>Terms</a>
              </nav>
              <p style={{ color: '#999', fontSize: '0.65rem', textAlign: 'center', margin: 0 }}>
                © 2025 LocalHustle — Community Driven Support for Student Athletes
              </p>
            </div>
          </footer>
        ) : (
          <footer style={{ borderTop: '1px solid #eee', padding: '0.75rem', background: 'white', marginBottom: '3rem' }}>
            <p style={{ color: '#ccc', fontSize: '0.6rem', textAlign: 'center', margin: 0 }}>
              © 2025 LocalHustle
            </p>
          </footer>
        )}
      </body>
    </html>
  )
}
