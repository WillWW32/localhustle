'use client'

import { useState, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import type { CardData, TemplateName } from './types'
import { DEFAULT_CARD_DATA, TEMPLATE_INFO, SPORT_PRESETS, COLOR_PRESETS } from './types'
import { Fleer86Front, Fleer86Back } from './templates/Fleer86'
import { Topps80BBallFront, Topps80BBallBack } from './templates/Topps80BBall'
import { Donruss84Front, Donruss84Back } from './templates/Donruss84'
import { Topps83Front, Topps83Back } from './templates/Topps83'
import { Topps80BaseballFront, Topps80BaseballBack } from './templates/Topps80Baseball'
import { Henderson80Front, Henderson80Back } from './templates/Henderson80'

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

interface PlayerCardCreatorProps {
  profile: any
  athleteId?: string // override athlete_id (for recruitment context)
  existingCard?: any
  onSave: () => void
  onCancel: () => void
  useApi?: boolean // use API route instead of direct Supabase (for recruitment)
}

export default function PlayerCardCreator({ profile, athleteId, existingCard, onSave, onCancel, useApi }: PlayerCardCreatorProps) {
  const [template, setTemplate] = useState<TemplateName>(existingCard?.template || 'fleer86')
  const [showBack, setShowBack] = useState(false)
  const [activeTab, setActiveTab] = useState<'template' | 'info' | 'stats' | 'colors' | 'photos'>('template')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const mainPhotoRef = useRef<HTMLInputElement>(null)
  const secondaryPhotoRef = useRef<HTMLInputElement>(null)
  const logoRef = useRef<HTMLInputElement>(null)

  // Pre-populate from existing card or profile data
  const initialData: CardData = existingCard?.card_data ? {
    ...DEFAULT_CARD_DATA,
    ...existingCard.card_data,
    mainPhoto: existingCard.main_photo_url || null,
    secondaryPhoto: existingCard.secondary_photo_url || null,
    logoImage: existingCard.logo_image_url || null,
  } : {
    ...DEFAULT_CARD_DATA,
    playerName: profile?.full_name?.toUpperCase() || '',
    school: profile?.school?.toUpperCase() || '',
    sport: profile?.sport || 'Basketball',
    hometown: profile?.state ? `${profile.state}` : '',
    stat1Label: SPORT_PRESETS[profile?.sport || 'Basketball']?.s1 || 'PPG',
    stat2Label: SPORT_PRESETS[profile?.sport || 'Basketball']?.s2 || 'RPG',
    stat3Label: SPORT_PRESETS[profile?.sport || 'Basketball']?.s3 || 'APG',
    stat4Label: SPORT_PRESETS[profile?.sport || 'Basketball']?.s4 || 'FG%',
    mainPhoto: profile?.profile_pic || null,
  }

  const [data, setData] = useState<CardData>(initialData)

  const update = useCallback((field: keyof CardData, value: string | null) => {
    setData(prev => ({ ...prev, [field]: value }))
  }, [])

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

  const uploadImage = async (file: File, type: 'main' | 'secondary' | 'logo') => {
    if (!profile?.id) return
    setUploading(true)
    const ext = file.name.split('.').pop() || 'jpg'
    const path = `public/${profile.id}-${type}-${Date.now()}.${ext}`

    const { data: uploadData, error } = await supabase.storage
      .from('player-card-images')
      .upload(path, file, { upsert: true })

    if (error) {
      alert('Upload error: ' + error.message)
      setUploading(false)
      return
    }

    const { data: urlData } = supabase.storage
      .from('player-card-images')
      .getPublicUrl(uploadData.path)

    const fieldMap = { main: 'mainPhoto', secondary: 'secondaryPhoto', logo: 'logoImage' } as const
    update(fieldMap[type], urlData.publicUrl)
    setUploading(false)
  }

  const handleSave = async () => {
    const saveId = athleteId || profile?.id
    if (!saveId) return
    setSaving(true)

    const { mainPhoto, secondaryPhoto, logoImage, ...cardDataWithoutPhotos } = data

    const cardRecord = {
      id: existingCard?.id || undefined,
      athlete_id: saveId,
      template,
      card_data: cardDataWithoutPhotos,
      main_photo_url: mainPhoto,
      secondary_photo_url: secondaryPhoto,
      logo_image_url: logoImage,
    }

    if (useApi) {
      const res = await fetch('/api/player-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cardRecord),
      })
      const result = await res.json()
      if (result.error) {
        alert('Save error: ' + result.error)
      } else {
        onSave()
      }
    } else {
      const record = { ...cardRecord, updated_at: new Date().toISOString() }
      delete (record as any).id
      let error
      if (existingCard?.id) {
        const result = await supabase.from('player_cards').update(record).eq('id', existingCard.id)
        error = result.error
      } else {
        const result = await supabase.from('player_cards').insert(record)
        error = result.error
      }
      if (error) {
        alert('Save error: ' + error.message)
      } else {
        onSave()
      }
    }
    setSaving(false)
  }

  const exportCard = async () => {
    if (!cardRef.current) return
    const svgEl = cardRef.current.querySelector('svg')
    if (!svgEl) return
    const svgData = new XMLSerializer().serializeToString(svgEl)
    const canvas = document.createElement('canvas')
    canvas.width = 1050
    canvas.height = 1470
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const img = new Image()
    img.onload = () => {
      ctx.drawImage(img, 0, 0, 1050, 1470)
      const link = document.createElement('a')
      link.download = `${data.playerName.replace(/\s+/g, '_')}_${showBack ? 'back' : 'front'}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    }
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
  }

  const editorTabStyle = (t: string) =>
    `dash-btn dash-btn-sm ${activeTab === t ? '' : 'dash-btn-outline'}`

  return (
    <div>
      {/* Editor tabs */}
      <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
        {(['template', 'info', 'stats', 'colors', 'photos'] as const).map(t => (
          <button key={t} className={editorTabStyle(t)} style={{ width: 'auto' }} onClick={() => setActiveTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Template picker */}
      {activeTab === 'template' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '1rem' }}>
          {TEMPLATES.map(t => (
            <button
              key={t}
              onClick={() => setTemplate(t)}
              className="dash-card"
              style={{
                cursor: 'pointer',
                border: template === t ? '2px solid #111' : '1px solid #eee',
                background: template === t ? '#f9fafb' : '#fff',
                textAlign: 'left',
                padding: '0.6rem 0.75rem',
              }}
            >
              <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{TEMPLATE_INFO[t].name}</span>
              <span style={{ fontSize: '0.7rem', color: '#888', marginLeft: '0.5rem' }}>{TEMPLATE_INFO[t].description}</span>
            </button>
          ))}
        </div>
      )}

      {/* Info editor */}
      {activeTab === 'info' && (
        <div className="dash-card" style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div>
              <label style={{ fontSize: '0.7rem', fontWeight: 700, display: 'block', marginBottom: '0.2rem' }}>Player Name</label>
              <input className="dash-input" value={data.playerName} onChange={e => update('playerName', e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.7rem', fontWeight: 700, display: 'block', marginBottom: '0.2rem' }}>Position</label>
                <input className="dash-input" value={data.position} onChange={e => update('position', e.target.value)} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.7rem', fontWeight: 700, display: 'block', marginBottom: '0.2rem' }}>Jersey #</label>
                <input className="dash-input" value={data.jerseyNumber} onChange={e => update('jerseyNumber', e.target.value)} />
              </div>
            </div>
            <div>
              <label style={{ fontSize: '0.7rem', fontWeight: 700, display: 'block', marginBottom: '0.2rem' }}>School</label>
              <input className="dash-input" value={data.school} onChange={e => update('school', e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.7rem', fontWeight: 700, display: 'block', marginBottom: '0.2rem' }}>Year</label>
                <input className="dash-input" value={data.year} onChange={e => update('year', e.target.value)} placeholder="Senior" />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.7rem', fontWeight: 700, display: 'block', marginBottom: '0.2rem' }}>Sport</label>
                <select className="dash-input" value={data.sport} onChange={e => applySportPreset(e.target.value)} style={{ padding: '0.45rem 0.5rem' }}>
                  {Object.keys(SPORT_PRESETS).map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.7rem', fontWeight: 700, display: 'block', marginBottom: '0.2rem' }}>Height</label>
                <input className="dash-input" value={data.height} onChange={e => update('height', e.target.value)} placeholder="6'2&quot;" />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.7rem', fontWeight: 700, display: 'block', marginBottom: '0.2rem' }}>Weight</label>
                <input className="dash-input" value={data.weight} onChange={e => update('weight', e.target.value)} placeholder="185 lbs" />
              </div>
            </div>
            <div>
              <label style={{ fontSize: '0.7rem', fontWeight: 700, display: 'block', marginBottom: '0.2rem' }}>Hometown</label>
              <input className="dash-input" value={data.hometown} onChange={e => update('hometown', e.target.value)} />
            </div>
          </div>
        </div>
      )}

      {/* Stats editor */}
      {activeTab === 'stats' && (
        <div className="dash-card" style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
            {([1, 2, 3, 4] as const).map(i => (
              <div key={i}>
                <label style={{ fontSize: '0.65rem', fontWeight: 700, display: 'block', marginBottom: '0.15rem', color: '#888' }}>Stat {i} Label</label>
                <input className="dash-input" value={data[`stat${i}Label` as keyof CardData] as string} onChange={e => update(`stat${i}Label` as keyof CardData, e.target.value)} style={{ marginBottom: '0.25rem' }} />
                <label style={{ fontSize: '0.65rem', fontWeight: 700, display: 'block', marginBottom: '0.15rem', color: '#888' }}>Value</label>
                <input className="dash-input" value={data[`stat${i}Value` as keyof CardData] as string} onChange={e => update(`stat${i}Value` as keyof CardData, e.target.value)} placeholder="0.0" />
              </div>
            ))}
          </div>
          <div style={{ borderTop: '1px solid #eee', paddingTop: '0.5rem' }}>
            <label style={{ fontSize: '0.7rem', fontWeight: 700, display: 'block', marginBottom: '0.2rem' }}>Highlights</label>
            <input className="dash-input" value={data.highlight1} onChange={e => update('highlight1', e.target.value)} placeholder="Highlight 1" style={{ marginBottom: '0.35rem' }} />
            <input className="dash-input" value={data.highlight2} onChange={e => update('highlight2', e.target.value)} placeholder="Highlight 2" style={{ marginBottom: '0.35rem' }} />
            <input className="dash-input" value={data.highlight3} onChange={e => update('highlight3', e.target.value)} placeholder="Highlight 3" />
          </div>
        </div>
      )}

      {/* Colors editor */}
      {activeTab === 'colors' && (
        <div className="dash-card" style={{ marginBottom: '1rem' }}>
          <label style={{ fontSize: '0.7rem', fontWeight: 700, display: 'block', marginBottom: '0.35rem' }}>Presets</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.35rem', marginBottom: '0.75rem' }}>
            {COLOR_PRESETS.map(cp => (
              <button
                key={cp.name}
                onClick={() => setData(prev => ({ ...prev, primaryColor: cp.p, secondaryColor: cp.s, accentColor: cp.a }))}
                style={{
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  padding: '0.4rem',
                  cursor: 'pointer',
                  background: '#fff',
                  textAlign: 'left',
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
          <label style={{ fontSize: '0.7rem', fontWeight: 700, display: 'block', marginBottom: '0.35rem' }}>Custom</label>
          {[
            { label: 'Primary', field: 'primaryColor' as keyof CardData },
            { label: 'Secondary', field: 'secondaryColor' as keyof CardData },
            { label: 'Accent', field: 'accentColor' as keyof CardData },
            { label: 'Text', field: 'textColor' as keyof CardData },
          ].map(c => (
            <div key={c.field} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <input type="color" value={data[c.field] as string} onChange={e => update(c.field, e.target.value)} style={{ width: '32px', height: '32px', border: 'none', padding: 0, cursor: 'pointer' }} />
              <span style={{ fontSize: '0.75rem', color: '#666', minWidth: '65px' }}>{c.label}</span>
              <input className="dash-input" value={data[c.field] as string} onChange={e => update(c.field, e.target.value)} style={{ maxWidth: '90px', fontFamily: 'monospace', fontSize: '0.75rem' }} />
            </div>
          ))}
        </div>
      )}

      {/* Photos editor */}
      {activeTab === 'photos' && (
        <div className="dash-card" style={{ marginBottom: '1rem' }}>
          {[
            { label: 'Main Photo (action shot)', field: 'mainPhoto' as keyof CardData, ref: mainPhotoRef, type: 'main' as const },
            { label: 'Secondary Photo (portrait)', field: 'secondaryPhoto' as keyof CardData, ref: secondaryPhotoRef, type: 'secondary' as const },
            { label: 'School Logo', field: 'logoImage' as keyof CardData, ref: logoRef, type: 'logo' as const },
          ].map(p => (
            <div key={p.type} style={{ marginBottom: '0.75rem' }}>
              <label style={{ fontSize: '0.7rem', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>{p.label}</label>
              <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                <button className="dash-btn dash-btn-sm" style={{ width: 'auto' }} onClick={() => p.ref.current?.click()} disabled={uploading}>
                  {data[p.field] ? 'Change' : 'Upload'}
                </button>
                {data[p.field] && (
                  <button className="dash-btn dash-btn-sm dash-btn-outline" style={{ width: 'auto', color: '#dc2626', borderColor: '#dc2626' }} onClick={() => update(p.field, null)}>
                    Remove
                  </button>
                )}
              </div>
              <input ref={p.ref} type="file" accept="image/*" className="hidden" style={{ display: 'none' }} onChange={e => {
                const file = e.target.files?.[0]
                if (file) uploadImage(file, p.type)
              }} />
              {data[p.field] && (
                <img src={data[p.field] as string} alt="" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px', marginTop: '0.35rem', border: '1px solid #eee' }} />
              )}
            </div>
          ))}
          {uploading && <p style={{ fontSize: '0.75rem', color: '#888' }}>Uploading...</p>}
        </div>
      )}

      {/* Card Preview */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', justifyContent: 'center' }}>
        <button className={`dash-btn dash-btn-sm ${!showBack ? '' : 'dash-btn-outline'}`} style={{ width: 'auto' }} onClick={() => setShowBack(false)}>Front</button>
        <button className={`dash-btn dash-btn-sm ${showBack ? '' : 'dash-btn-outline'}`} style={{ width: 'auto' }} onClick={() => setShowBack(true)}>Back</button>
      </div>

      <div ref={cardRef} style={{ width: '100%', maxWidth: '350px', margin: '0 auto', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.15))' }}>
        {showBack ? renderBack(template, data) : renderFront(template, data)}
      </div>

      <p style={{ fontSize: '0.65rem', color: '#aaa', textAlign: 'center', marginTop: '0.5rem' }}>
        {TEMPLATE_INFO[template].name} style
      </p>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
        <button className="dash-btn dash-btn-green" onClick={handleSave} disabled={saving} style={{ flex: 1 }}>
          {saving ? 'Saving...' : existingCard ? 'Update Card' : 'Save Card'}
        </button>
        <button className="dash-btn dash-btn-sm" style={{ width: 'auto' }} onClick={exportCard}>Export PNG</button>
        <button className="dash-btn dash-btn-outline dash-btn-sm" style={{ width: 'auto' }} onClick={onCancel}>Cancel</button>
      </div>
    </div>
  )
}
