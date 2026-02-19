'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

interface XOAuthButtonProps {
  athleteId: string
  onConnected?: () => void
  className?: string
}

export function XOAuthButton({ athleteId, onConnected, className }: XOAuthButtonProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const searchParams = useSearchParams()

  useEffect(() => {
    if (searchParams.get('connected') === 'true') {
      setIsConnected(true)
      onConnected?.()
    }
  }, [searchParams, onConnected])

  const handleClick = () => {
    setIsLoading(true)
    window.location.href = `/api/auth/x/authorize?athleteId=${athleteId}`
  }

  if (isConnected) {
    return (
      <button type="button" disabled className={`${className || ''} dash-btn-green`} style={{ cursor: 'default' }}>
        X Connected
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isLoading}
      className={`${className || ''} dash-btn`}
      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
    >
      {isLoading ? (
        'Connecting...'
      ) : (
        <>
          <svg style={{ width: '16px', height: '16px' }} fill="currentColor" viewBox="0 0 24 24">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.514l-5.106-6.677L2.306 21.75H0l7.644-8.746L0 2.25h6.678l4.744 6.278 5.822-6.278zM17.7 19.5h1.828L6.374 4.07H4.447L17.7 19.5z" />
          </svg>
          Connect X Account
        </>
      )}
    </button>
  )
}

interface XOAuthStatusProps {
  isConnected: boolean
  xHandle?: string
  xProfileUrl?: string
  onDisconnect?: () => Promise<void>
}

export function XOAuthStatus({ isConnected, xHandle, xProfileUrl, onDisconnect }: XOAuthStatusProps) {
  const [isDisconnecting, setIsDisconnecting] = useState(false)

  const handleDisconnect = async () => {
    if (!confirm('Disconnect your X account?')) return
    try {
      setIsDisconnecting(true)
      await onDisconnect?.()
    } finally {
      setIsDisconnecting(false)
    }
  }

  if (!isConnected) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#999' }}>
        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#999' }} />
        Not connected
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'green' }} />
        {xHandle ? (
          <a href={xProfileUrl || `https://twitter.com/${xHandle}`} target="_blank" rel="noopener noreferrer" style={{ color: 'green', fontWeight: 'bold' }}>
            @{xHandle}
          </a>
        ) : (
          <span style={{ fontWeight: 'bold' }}>Connected</span>
        )}
      </div>
      <button
        type="button"
        onClick={handleDisconnect}
        disabled={isDisconnecting}
        style={{ color: 'red', fontWeight: 'bold', fontSize: '0.875rem', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
      >
        {isDisconnecting ? 'Disconnecting...' : 'Disconnect'}
      </button>
    </div>
  )
}
