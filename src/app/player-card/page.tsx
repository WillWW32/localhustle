'use client'

import { useState, useRef, useCallback } from 'react'
import type { CardData, TemplateName } from '@/components/player-cards/types'
import { DEFAULT_CARD_DATA, TEMPLATE_INFO, SPORT_PRESETS, COLOR_PRESETS } from '@/components/player-cards/types'
import { Fleer86Front, Fleer86Back } from '@/components/player-cards/templates/Fleer86'
import { Topps80BBallFront, Topps80BBallBack } from '@/components/player-cards/templates/Topps80BBall'
import { Donruss84Front, Donruss84Back } from '@/components/player-cards/templates/Donruss84'
import { Topps83Front, Topps83Back } from '@/components/player-cards/templates/Topps83'
import { Topps80BaseballFront, Topps80BaseballBack } from '@/components/player-cards/templates/Topps80Baseball'
import { Henderson80Front, Henderson80Back } from '@/components/player-cards/templates/Henderson80'

const TEMPLATES: TemplateName[] = ['fleer86', 'topps80bball', 'donruss84', 'topps83', 'topps80baseball', 'henderson80']

function renderFront(template: TemplateName, data: CardData) {
  switch (template) {
    case 'fleer86': return <Fleer86Front data={data} />
    case 'topps80bball': return <Topps80BBallFront data={data} />
    case 'donruss84': return <Donruss84Front data={data} />
    case 'topps83': return <Topps83Front data={data} />
    case 'topps80baseball': return <Topps80BaseballFront data={data} />
    case 'henderson80': return <Henderson80Front data={data} />
  }
}

function renderBack(template: TemplateName, data: CardData) {
  switch (template) {
    case 'fleer86': return <Fleer86Back data={data} />
    case 'topps80bball': return <Topps80BBallBack data={data} />
    case 'donruss84': return <Donruss84Back data={data} />
    case 'topps83': return <Topps83Back data={data} />
    case 'topps80baseball': return <Topps80BaseballBack data={data} />
    case 'henderson80': return <Henderson80Back data={data} />
  }
}

type EditorTab = 'template' | 'info' | 'stats' | 'colors'

export default function PlayerCardGeneratorPage() {
  const [template, setTemplate] = useState<TemplateName>('fleer86')
  const [showBack, setShowBack] = useState(false)
  const [activeTab, setActiveTab] = useState<EditorTab>('info')
  const [data, setData] = useState<CardData>({ ...DEFAULT_CARD_DATA })
  const [showEmailGate, setShowEmailGate] = useState(false)
  const [email, setEmail] = useState('')
  const [downloading, setDownloading] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const mainPhotoRef = useRef<HTMLInputElement>(null)
  const logoRef = useRef<HTMLInputElement>(null)

  const update = useCallback((field: keyof CardData, value: string | null) => {
    setData(prev => ({ ...prev, [field]: value }))
  }, [])

  const handleFileUpload = (file: File, field: 'mainPhoto' | 'logoImage') => {
    const reader = new FileReader()
    reader.onload = (e) => {
      update(field, e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleCardTap = (e: React.MouseEvent<HTMLDivElement>) => {
    if (showBack) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height

    // Logo area: top-left corner (roughly 0-20% x, 0-15% y)
    if (x < 0.2 && y < 0.15) {
      logoRef.current?.click()
      return
    }
    // Main photo area: center of card (roughly 8-92% x, 12-85% y)
    if (x > 0.08 && x < 0.92 && y > 0.12 && y < 0.85) {
      mainPhotoRef.current?.click()
      return
    }
  }

  const applySportPreset = (sport: string) => {
    const preset = SPORT_PRESETS[sport]
    if (preset) {
      setData(prev => ({
        ...prev,
        sport,
        stat1Label: preset.s1,
        stat2Label: preset.s2,
        stat3Label: preset.s3,
        stat4Label: preset.s4,
      }))
    }
  }

  const handleDownloadClick = () => {
    if (!data.playerName.trim()) {
      alert('Please enter your name first')
      return
    }
    setShowEmailGate(true)
  }

  const exportCard = async (side: 'front' | 'back') => {
    if (!cardRef.current) return
    const svgEl = cardRef.current.querySelector('svg')
    if (!svgEl) return
    const svgData = new XMLSerializer().serializeToString(svgEl)
    const canvas = document.createElement('canvas')
    canvas.width = 1050
    canvas.height = 1470
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    return new Promise<void>((resolve) => {
      const img = new Image()
      img.onload = () => {
        ctx.drawImage(img, 0, 0, 1050, 1470)
        const link = document.createElement('a')
        link.download = `${data.playerName.replace(/\s+/g, '_')}_${side}.png`
        link.href = canvas.toDataURL('image/png')
        link.click()
        resolve()
      }
      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
    })
  }

  const handleEmailSubmit = async () => {
    if (!email.trim() || !email.includes('@')) {
      alert('Please enter a valid email')
      return
    }
    setDownloading(true)

    // Save lead email
    try {
      await fetch('/api/card-leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, playerName: data.playerName, sport: data.sport }),
      })
    } catch { /* non-blocking */ }

    // Export front
    setShowBack(false)
    await new Promise(r => setTimeout(r, 100))
    await exportCard('front')

    // Export back
    setShowBack(true)
    await new Promise(r => setTimeout(r, 100))
    await exportCard('back')

    setShowBack(false)
    setDownloading(false)
    setShowEmailGate(false)
  }

  const tabStyle = (t: EditorTab): React.CSSProperties => ({
    padding: '0.6rem 1rem',
    fontSize: '0.8rem',
    fontWeight: activeTab === t ? 'bold' : 'normal',
    cursor: 'pointer',
    border: 'none',
    borderBottom: activeTab === t ? '2px solid black' : '2px solid transparent',
    background: 'none',
    color: activeTab === t ? 'black' : '#999',
    fontFamily: "'Courier New', Courier, monospace",
  })

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.6rem 0.75rem',
    fontSize: '0.85rem',
    fontFamily: "'Courier New', Courier, monospace",
    border: '1px solid #ddd',
    borderRadius: '8px',
    background: 'white',
    outline: 'none',
  }

  const labelStyle: React.CSSProperties = {
    fontSize: '0.7rem',
    fontWeight: 'bold',
    display: 'block',
    marginBottom: '0.25rem',
    textTransform: 'uppercase',
    color: '#888',
    letterSpacing: '0.03em',
  }

  return (
    <div style={{ minHeight: '100vh', background: 'white', fontFamily: "'Courier New', Courier, monospace" }}>

      {/* Hero */}
      <section style={{ padding: '2.5rem 1.5rem 1.5rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', lineHeight: 1.3, marginBottom: '0.75rem' }}>
          Create Your Player Card
        </h1>
        <p style={{ fontSize: '0.85rem', color: '#666', lineHeight: 1.6, margin: '0 auto', maxWidth: '400px' }}>
          Build a retro trading card with your stats. Free to create — enter your email to download.
        </p>
      </section>

      <div style={{ maxWidth: '500px', margin: '0 auto', padding: '0 1.5rem 4rem' }}>

        {/* Card Preview */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', justifyContent: 'center' }}>
            <button
              onClick={() => setShowBack(false)}
              style={{
                padding: '0.5rem 1.25rem', fontSize: '0.8rem', fontWeight: !showBack ? 'bold' : 'normal',
                borderRadius: '9999px', border: 'none', cursor: 'pointer',
                background: !showBack ? 'black' : '#eee', color: !showBack ? 'white' : '#666',
                fontFamily: "'Courier New', Courier, monospace",
              }}
            >
              Front
            </button>
            <button
              onClick={() => setShowBack(true)}
              style={{
                padding: '0.5rem 1.25rem', fontSize: '0.8rem', fontWeight: showBack ? 'bold' : 'normal',
                borderRadius: '9999px', border: 'none', cursor: 'pointer',
                background: showBack ? 'black' : '#eee', color: showBack ? 'white' : '#666',
                fontFamily: "'Courier New', Courier, monospace",
              }}
            >
              Back
            </button>
          </div>

          <div
            ref={cardRef}
            onClick={handleCardTap}
            style={{ width: '100%', maxWidth: '320px', margin: '0 auto', filter: 'drop-shadow(0 4px 16px rgba(0,0,0,0.15))', cursor: showBack ? 'default' : 'pointer' }}
          >
            {showBack ? renderBack(template, data) : renderFront(template, data)}
          </div>
          <p style={{ fontSize: '0.65rem', color: '#bbb', textAlign: 'center', marginTop: '0.5rem' }}>
            {TEMPLATE_INFO[template].name} style{!showBack && ' — tap card to add photo'}
          </p>

          {/* Hidden file inputs for photo upload */}
          <input
            ref={mainPhotoRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f, 'mainPhoto'); e.target.value = '' }}
          />
          <input
            ref={logoRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f, 'logoImage'); e.target.value = '' }}
          />
        </div>

        {/* Download CTA */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <button
            onClick={handleDownloadClick}
            style={{
              padding: '0.875rem 2.5rem', fontSize: '0.9rem', fontWeight: 'bold',
              fontFamily: "'Courier New', Courier, monospace",
              background: '#22c55e', color: 'white', border: 'none', borderRadius: '9999px',
              cursor: 'pointer', transition: 'all 0.2s',
            }}
          >
            Download Card
          </button>
        </div>

        {/* Editor Tabs */}
        <div style={{ display: 'flex', borderBottom: '2px solid #eee', marginBottom: '1.25rem' }}>
          {(['info', 'stats', 'colors', 'template'] as EditorTab[]).map(t => (
            <button key={t} onClick={() => setActiveTab(t)} style={tabStyle(t)}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* Info Tab */}
        {activeTab === 'info' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div>
              <label style={labelStyle}>Player Name</label>
              <input style={inputStyle} value={data.playerName} onChange={e => update('playerName', e.target.value)} placeholder="JOHN SMITH" />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Sport</label>
                <select style={inputStyle} value={data.sport} onChange={e => applySportPreset(e.target.value)}>
                  {Object.keys(SPORT_PRESETS).map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Position</label>
                <input style={inputStyle} value={data.position} onChange={e => update('position', e.target.value)} placeholder="PG" />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Jersey #</label>
                <input style={inputStyle} value={data.jerseyNumber} onChange={e => update('jerseyNumber', e.target.value)} placeholder="23" />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Year</label>
                <input style={inputStyle} value={data.year} onChange={e => update('year', e.target.value)} placeholder="Senior" />
              </div>
            </div>
            <div>
              <label style={labelStyle}>School</label>
              <input style={inputStyle} value={data.school} onChange={e => update('school', e.target.value)} placeholder="LINCOLN HIGH SCHOOL" />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Height</label>
                <input style={inputStyle} value={data.height} onChange={e => update('height', e.target.value)} placeholder="6'2&quot;" />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Weight</label>
                <input style={inputStyle} value={data.weight} onChange={e => update('weight', e.target.value)} placeholder="185 lbs" />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Hometown</label>
              <input style={inputStyle} value={data.hometown} onChange={e => update('hometown', e.target.value)} placeholder="Houston, TX" />
            </div>
          </div>
        )}

        {/* Stats Tab */}
        {activeTab === 'stats' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              {([1, 2, 3, 4] as const).map(i => (
                <div key={i}>
                  <label style={{ ...labelStyle, fontSize: '0.65rem' }}>Stat {i} Label</label>
                  <input style={{ ...inputStyle, marginBottom: '0.25rem' }} value={data[`stat${i}Label` as keyof CardData] as string} onChange={e => update(`stat${i}Label` as keyof CardData, e.target.value)} />
                  <label style={{ ...labelStyle, fontSize: '0.65rem' }}>Value</label>
                  <input style={inputStyle} value={data[`stat${i}Value` as keyof CardData] as string} onChange={e => update(`stat${i}Value` as keyof CardData, e.target.value)} placeholder="0.0" />
                </div>
              ))}
            </div>
            <div style={{ borderTop: '1px solid #eee', paddingTop: '0.75rem' }}>
              <label style={labelStyle}>Highlights</label>
              <input style={{ ...inputStyle, marginBottom: '0.35rem' }} value={data.highlight1} onChange={e => update('highlight1', e.target.value)} placeholder="All-District First Team" />
              <input style={{ ...inputStyle, marginBottom: '0.35rem' }} value={data.highlight2} onChange={e => update('highlight2', e.target.value)} placeholder="Team MVP 2024" />
              <input style={inputStyle} value={data.highlight3} onChange={e => update('highlight3', e.target.value)} placeholder="State Tournament Selection" />
            </div>
          </div>
        )}

        {/* Colors Tab */}
        {activeTab === 'colors' && (
          <div>
            <label style={{ ...labelStyle, marginBottom: '0.5rem' }}>Presets</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.35rem', marginBottom: '1rem' }}>
              {COLOR_PRESETS.map(cp => (
                <button
                  key={cp.name}
                  onClick={() => setData(prev => ({ ...prev, primaryColor: cp.p, secondaryColor: cp.s, accentColor: cp.a }))}
                  style={{
                    border: '1px solid #ddd', borderRadius: '8px', padding: '0.5rem',
                    cursor: 'pointer', background: '#fff', textAlign: 'left',
                  }}
                >
                  <div style={{ display: 'flex', gap: '3px', marginBottom: '0.2rem' }}>
                    <span style={{ width: '16px', height: '16px', borderRadius: '3px', background: cp.p, display: 'inline-block' }} />
                    <span style={{ width: '16px', height: '16px', borderRadius: '3px', background: cp.s, display: 'inline-block' }} />
                    <span style={{ width: '16px', height: '16px', borderRadius: '3px', background: cp.a, display: 'inline-block' }} />
                  </div>
                  <span style={{ fontSize: '0.6rem', color: '#888' }}>{cp.name}</span>
                </button>
              ))}
            </div>
            <label style={{ ...labelStyle, marginBottom: '0.5rem' }}>Custom</label>
            {[
              { label: 'Primary', field: 'primaryColor' as keyof CardData },
              { label: 'Secondary', field: 'secondaryColor' as keyof CardData },
              { label: 'Accent', field: 'accentColor' as keyof CardData },
              { label: 'Text', field: 'textColor' as keyof CardData },
            ].map(c => (
              <div key={c.field} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                <input type="color" value={data[c.field] as string} onChange={e => update(c.field, e.target.value)} style={{ width: '32px', height: '32px', border: 'none', padding: 0, cursor: 'pointer' }} />
                <span style={{ fontSize: '0.75rem', color: '#666', minWidth: '65px' }}>{c.label}</span>
                <input style={{ ...inputStyle, maxWidth: '90px', fontFamily: 'monospace', fontSize: '0.75rem' }} value={data[c.field] as string} onChange={e => update(c.field, e.target.value)} />
              </div>
            ))}
          </div>
        )}

        {/* Template Tab */}
        {activeTab === 'template' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {TEMPLATES.map(t => (
              <button
                key={t}
                onClick={() => setTemplate(t)}
                style={{
                  cursor: 'pointer', textAlign: 'left', padding: '0.75rem 1rem',
                  border: template === t ? '2px solid black' : '1px solid #eee',
                  borderRadius: '12px', background: template === t ? '#f9fafb' : '#fff',
                  fontFamily: "'Courier New', Courier, monospace",
                }}
              >
                <span style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>{TEMPLATE_INFO[t].name}</span>
                <span style={{ fontSize: '0.7rem', color: '#888', marginLeft: '0.5rem' }}>{TEMPLATE_INFO[t].description}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Email Gate Modal */}
      {showEmailGate && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '1.5rem',
        }}>
          <div style={{
            background: 'white', borderRadius: '16px', padding: '2rem',
            maxWidth: '380px', width: '100%', textAlign: 'center',
            fontFamily: "'Courier New', Courier, monospace",
          }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.75rem' }}>
              Download Your Card
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#666', lineHeight: 1.6, marginBottom: '1.5rem' }}>
              Enter your email and we&apos;ll download your card as a PNG — front and back.
            </p>
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleEmailSubmit() }}
              style={{
                ...inputStyle,
                textAlign: 'center',
                marginBottom: '1rem',
              }}
            />
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => setShowEmailGate(false)}
                style={{
                  flex: 1, padding: '0.75rem', fontSize: '0.85rem', fontWeight: 'bold',
                  fontFamily: "'Courier New', Courier, monospace",
                  background: '#f0f0f0', color: '#666', border: 'none', borderRadius: '9999px',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleEmailSubmit}
                disabled={downloading}
                style={{
                  flex: 1, padding: '0.75rem', fontSize: '0.85rem', fontWeight: 'bold',
                  fontFamily: "'Courier New', Courier, monospace",
                  background: downloading ? '#999' : 'black', color: 'white', border: 'none',
                  borderRadius: '9999px', cursor: downloading ? 'default' : 'pointer',
                }}
              >
                {downloading ? 'Downloading...' : 'Download'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
