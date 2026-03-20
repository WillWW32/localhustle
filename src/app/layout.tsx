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
  const slogan = "Athletes earn. Parents support. Businesses sponsor. Everyone wins."
  const pathname = usePathname()

  const isDashboard = pathname?.includes('-dashboard') || pathname?.startsWith('/admin') || pathname?.startsWith('/recruit/dashboard') || pathname?.startsWith('/mentorship/dashboard')

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
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.log('SW registration failed:', err)
      })
    }
  }, [])

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
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="google-site-verification" content="UIK5Zy5W_07pMvsiK_WKladS2TsMAXDlzdpkjgIc3Xs" />
      </head>
      <body>
        {/* Header — compact on dashboards */}
        <header style={{
          borderBottom: isDashboard ? '2px solid black' : 'none',
          padding: isDashboard ? '0.5rem 0' : '2rem 0 1.5rem',
          background: 'white',
        }}>
          <div style={{ maxWidth: '768px', margin: '0 auto', padding: '0 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: isDashboard ? '0' : '0.5rem' }}>
            <Link href="/">
              <Image
                src="/logo.png"
                alt="LocalHustle"
                width={0}
                height={0}
                sizes="100vw"
                style={{ width: 'auto', height: isDashboard ? '40px' : '70px' }}
                priority
              />
            </Link>

            {/* Slogan — hide on dashboards */}
            {!isDashboard && (
              <p style={{
                fontSize: '0.75rem',
                color: '#999',
                fontFamily: "'Courier New', Courier, monospace",
                fontWeight: 'normal',
                margin: 0,
                letterSpacing: '0.02em',
              }}>
                {displayedSlogan}
              </p>
            )}
          </div>
        </header>

        {children}

        {/* Share banner — hide on dashboards */}
        {!isBusinessPage && !isDashboard && (
          <div style={{ background: 'black', padding: '0.75rem 1rem', textAlign: 'center' }}>
            <p style={{ fontSize: '0.8rem', color: 'white', margin: 0 }}>
              Share with teammates — earn together!{' '}
              <button
                onClick={handleShare}
                style={{ textDecoration: 'underline', cursor: 'pointer', background: 'none', border: 'none', color: '#22c55e', fontSize: '0.8rem', fontWeight: 'bold', padding: 0, margin: 0, width: 'auto', maxWidth: 'none', display: 'inline' }}
              >
                Tap to share
              </button>
            </p>
          </div>
        )}

        {/* Footer — minimal on dashboards */}
        {!isDashboard ? (
          <footer style={{ borderTop: 'none', padding: '3rem 2rem', background: 'white' }}>
            <div style={{ maxWidth: '768px', margin: '0 auto' }}>
              <nav style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-start', gap: '0.5rem 1.25rem', marginBottom: '1.5rem' }}>
                <a href="/" style={{ color: '#666', textDecoration: 'none', fontSize: '0.8rem' }}>How It Works</a>
                <a href="/get-started" style={{ color: '#666', textDecoration: 'none', fontSize: '0.8rem' }}>Athletes</a>
                <a href="/parent-onboard" style={{ color: '#666', textDecoration: 'none', fontSize: '0.8rem' }}>Parents</a>
                <a href="/business-onboard" style={{ color: '#666', textDecoration: 'none', fontSize: '0.8rem' }}>Businesses</a>
                <a href="/ambassador" style={{ color: '#666', textDecoration: 'none', fontSize: '0.8rem' }}>Ambassador</a>
                <a href="/recruit" style={{ color: '#666', textDecoration: 'none', fontSize: '0.8rem' }}>Recruit</a>
                <a href="/recruit/login" style={{ color: '#666', textDecoration: 'none', fontSize: '0.8rem' }}>Athlete Login</a>
                <a href="/mentorship" style={{ color: '#666', textDecoration: 'none', fontSize: '0.8rem' }}>Mentorship</a>
                <a href="/player-card" style={{ color: '#666', textDecoration: 'none', fontSize: '0.8rem' }}>Player Card</a>
                <a href="/privacy" style={{ color: '#666', textDecoration: 'none', fontSize: '0.8rem' }}>Privacy</a>
                <a href="/terms" style={{ color: '#666', textDecoration: 'none', fontSize: '0.8rem' }}>Terms</a>
              </nav>
              <p style={{ color: '#999', fontSize: '0.65rem', textAlign: 'center', margin: 0 }}>
                © {new Date().getFullYear()} LocalHustle — Athletes earn. Parents support. Businesses sponsor.
              </p>
            </div>
          </footer>
        ) : (
          <footer style={{ borderTop: '1px solid #eee', padding: '0.75rem', background: 'white', marginBottom: '3rem' }}>
            <p style={{ color: '#ccc', fontSize: '0.6rem', textAlign: 'center', margin: 0 }}>
              © {new Date().getFullYear()} LocalHustle
            </p>
          </footer>
        )}
      </body>
    </html>
  )
}
