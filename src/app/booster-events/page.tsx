'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function BoosterEvents() {
  const [eventName, setEventName] = useState('')
  const [goal, setGoal] = useState('')
  const [description, setDescription] = useState('')
  const [shareLink, setShareLink] = useState('')
  const [loading, setLoading] = useState(false)

  const handleCreate = async () => {
    if (!eventName || !goal) {
      alert('Please enter event name and goal')
      return
    }

    setLoading(true)

    // Create event (stub — real would insert to Supabase)
    const slug = eventName.toLowerCase().replace(/ /g, '-').replace(/[^a-z0-9-]/g, '')
    const link = `https://app.localhustle.org/fund/${slug}`

    setShareLink(link)
    setLoading(false)

    // Real would save to DB + generate unique ID
  }

  return (
    <div style={{
      fontFamily: "'Courier New', Courier, monospace",
      textAlign: 'center',
      padding: '2rem',
      backgroundColor: 'white',
      color: 'black',
      minHeight: '100vh',
    }}>
      {/* Slogan + Triangle */}
      <p style={{ fontSize: '2rem', marginBottom: '1rem' }}>
        Community Driven Support for Student Athletes
      </p>
      <div style={{ fontSize: '3rem', marginBottom: '4rem' }}>▼</div>

      {/* Title */}
      <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '2rem' }}>
        Create Booster Club Event
      </h1>

      {/* Detail */}
      <p style={{ fontSize: '1.5rem', maxWidth: '800px', margin: '0 auto 4rem auto', lineHeight: '1.8' }}>
        Crowd-fund team expenses fast — businesses contribute, money goes to team.<br />
        Perfect for post-game meals, gear, youth clinics, elementary visits, or charity work.
      </p>

      {/* Form */}
      <div style={{ maxWidth: '500px', margin: '0 auto', spaceY: '2rem' }}>
        <Input
          placeholder="Event Name (e.g., Post-Game Meals for Road Trips)"
          value={eventName}
          onChange={(e) => setEventName(e.target.value)}
          style={{ height: '60px', fontSize: '1.5rem', border: '4px solid black' }}
        />
        <Input
          type="number"
          placeholder="Funding Goal (e.g., 1000)"
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          style={{ height: '60px', fontSize: '1.5rem', border: '4px solid black' }}
        />
        <textarea
          placeholder="Description (e.g., Meals for away games — help keep our athletes fueled!)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          style={{ width: '100%', height: '200px', padding: '1rem', fontSize: '1.5rem', border: '4px solid black', fontFamily: "'Courier New', Courier, monospace'" }}
        />
        <Button 
          onClick={handleCreate}
          disabled={loading}
          style={{
            width: '100%',
            height: '80px',
            fontSize: '2rem',
            backgroundColor: '#90ee90',
            color: 'black',
            fontFamily: "'Courier New', Courier, monospace'",
          }}
        >
          {loading ? 'Creating...' : 'Create Event & Get Share Link'}
        </Button>
      </div>

      {/* Share Link */}
      {shareLink && (
        <div style={{ marginTop: '6rem', padding: '2rem', backgroundColor: '#f0f0f0', border: '4px solid black', maxWidth: '600px', marginLeft: 'auto', marginRight: 'auto' }}>
          <p style={{ fontSize: '1.8rem', marginBottom: '2rem' }}>
            Event created! Share this link with local businesses:
          </p>
          <p style={{ fontSize: '1.5rem', wordBreak: 'break-all', marginBottom: '2rem' }}>
            {shareLink}
          </p>
          <Button onClick={() => navigator.clipboard.writeText(shareLink)} style={{
            width: '100%',
            height: '60px',
            fontSize: '1.5rem',
            backgroundColor: 'black',
            color: 'white',
          }}>
            Copy Link
          </Button>
        </div>
      )}
    </div>
  )
}