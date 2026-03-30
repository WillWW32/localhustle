'use client'

import { useState } from 'react'

interface ReelContainerProps {
  reels: string[]
  editable?: boolean
  onReelsChange?: (reels: string[]) => void
}

function parseReelShortcode(url: string): string | null {
  const trimmed = url.trim()
  const patterns = [
    /instagram\.com\/reel\/([A-Za-z0-9_-]+)/,
    /instagram\.com\/reels\/([A-Za-z0-9_-]+)/,
    /instagram\.com\/p\/([A-Za-z0-9_-]+)/,
  ]
  for (const pattern of patterns) {
    const match = trimmed.match(pattern)
    if (match) return match[1]
  }
  return null
}

function buildEmbedUrl(url: string): string | null {
  const shortcode = parseReelShortcode(url)
  if (!shortcode) return null
  return `https://www.instagram.com/reel/${shortcode}/embed`
}

export default function ReelContainer({ reels, editable = false, onReelsChange }: ReelContainerProps) {
  const [inputUrl, setInputUrl] = useState('')
  const [error, setError] = useState('')

  const maxSlots = 3

  const handleAdd = () => {
    setError('')
    if (!inputUrl.trim()) return

    const shortcode = parseReelShortcode(inputUrl)
    if (!shortcode) {
      setError('Invalid URL. Paste a link like https://www.instagram.com/reel/ABC123/')
      return
    }

    if (reels.length >= maxSlots) {
      setError(`Maximum ${maxSlots} reels allowed`)
      return
    }

    onReelsChange?.([...reels, inputUrl.trim()])
    setInputUrl('')
  }

  const handleRemove = (index: number) => {
    const updated = reels.filter((_, i) => i !== index)
    onReelsChange?.(updated)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAdd()
    }
  }

  // Display mode — only show filled reels
  if (!editable) {
    const validReels = reels.filter(url => buildEmbedUrl(url))
    if (validReels.length === 0) return null

    return (
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${validReels.length}, 1fr)`, gap: '0.75rem' }}>
        {validReels.map((url, i) => {
          const embedUrl = buildEmbedUrl(url)
          return (
            <div key={i} style={{ borderRadius: '12px', overflow: 'hidden', height: '480px', background: '#f5f5f5' }}>
              <iframe
                src={embedUrl!}
                allowFullScreen
                loading="lazy"
                title={`Instagram Reel ${i + 1}`}
                style={{ width: '100%', height: '100%', border: 'none' }}
              />
            </div>
          )
        })}
      </div>
    )
  }

  // Edit mode — show slots, input, controls
  return (
    <div>
      {/* Input row */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <input
          type="text"
          value={inputUrl}
          onChange={e => setInputUrl(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Paste Instagram Reel URL..."
          className="dash-input"
          style={{ flex: 1 }}
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={reels.length >= maxSlots}
          className="dash-btn"
          style={{
            width: 'auto',
            padding: '0.5rem 1rem',
            fontSize: '0.8rem',
            opacity: reels.length >= maxSlots ? 0.4 : 1,
          }}
        >
          Add Reel
        </button>
      </div>

      {error && (
        <p style={{ color: '#dc2626', fontSize: '0.8rem', marginBottom: '0.75rem' }}>{error}</p>
      )}

      {/* Reel slots */}
      <div className="reel-container">
        {Array.from({ length: maxSlots }).map((_, i) => {
          const url = reels[i]
          const embedUrl = url ? buildEmbedUrl(url) : null

          if (embedUrl) {
            return (
              <div key={i} className="reel-slot reel-slot-filled">
                <button
                  type="button"
                  className="reel-remove-btn"
                  onClick={() => handleRemove(i)}
                  title="Remove"
                >
                  &times;
                </button>
                <iframe
                  src={embedUrl}
                  allowFullScreen
                  loading="lazy"
                  title={`Instagram Reel ${i + 1}`}
                />
              </div>
            )
          }

          return (
            <div key={i} className="reel-slot reel-slot-empty">
              <div style={{ textAlign: 'center', color: '#bbb', padding: '1rem' }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem', opacity: 0.3 }}>
                  {i + 1}
                </div>
                <p style={{ fontSize: '0.75rem', margin: 0 }}>Paste a Reel URL above</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
