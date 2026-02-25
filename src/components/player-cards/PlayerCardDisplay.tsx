'use client'

import { useState } from 'react'
import type { CardData, TemplateName } from './types'
import { DEFAULT_CARD_DATA, TEMPLATE_INFO } from './types'
import { Fleer86Front, Fleer86Back } from './templates/Fleer86'
import { Topps80BBallFront, Topps80BBallBack } from './templates/Topps80BBall'
import { Donruss84Front, Donruss84Back } from './templates/Donruss84'
import { Topps83Front, Topps83Back } from './templates/Topps83'
import { Topps80BaseballFront, Topps80BaseballBack } from './templates/Topps80Baseball'
import { Henderson80Front, Henderson80Back } from './templates/Henderson80'

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

interface PlayerCardDisplayProps {
  card: any
  onEdit?: () => void
  onDelete?: () => void
  compact?: boolean
}

export default function PlayerCardDisplay({ card, onEdit, onDelete, compact }: PlayerCardDisplayProps) {
  const [showBack, setShowBack] = useState(false)

  const template = (card.template || 'fleer86') as TemplateName
  const cardData: CardData = {
    ...DEFAULT_CARD_DATA,
    ...(card.card_data || {}),
    mainPhoto: card.main_photo_url || null,
    secondaryPhoto: card.secondary_photo_url || null,
    logoImage: card.logo_image_url || null,
  }

  return (
    <div style={{ textAlign: 'center' }}>
      {/* Card with flip on tap */}
      <div
        onClick={() => setShowBack(!showBack)}
        style={{
          width: compact ? '160px' : '100%',
          maxWidth: compact ? '160px' : '320px',
          margin: '0 auto',
          cursor: 'pointer',
          filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.15))',
          transition: 'transform 0.15s ease',
        }}
      >
        {showBack ? renderBack(template, cardData) : renderFront(template, cardData)}
      </div>

      <p style={{ fontSize: '0.6rem', color: '#aaa', marginTop: '0.35rem' }}>
        {TEMPLATE_INFO[template]?.name || template} {showBack ? '(back)' : '(front)'} — tap to flip
      </p>

      {/* Actions */}
      {(onEdit || onDelete) && (
        <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'center', marginTop: '0.35rem' }}>
          {onEdit && <button className="dash-btn dash-btn-sm dash-btn-outline" style={{ width: 'auto' }} onClick={onEdit}>Edit</button>}
          {onDelete && <button className="dash-btn dash-btn-sm dash-btn-outline" style={{ width: 'auto', color: '#dc2626', borderColor: '#dc2626' }} onClick={onDelete}>Delete</button>}
        </div>
      )}
    </div>
  )
}
