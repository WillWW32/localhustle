'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const gigTypes = [
  { title: 'ShoutOut', amount: '50', description: 'Visit a favorite business and make a quick shoutout 15-sec reel about what you like.' },
  { title: 'Youth Clinic', amount: '500+', description: 'Run 30–60 min sessions for younger athletes (with teammates).' },
  { title: 'Team Sponsor', amount: '1000', description: 'Business sponsors team meals/gear — money split equally.' },
  { title: 'Product Review', amount: '50', description: '$50 + Perks (e.g., post your order — get free coffee for a month).' },
  { title: 'Cameo', amount: '100', description: 'Custom 15-Sec Video for Younger Athletes (birthdays, pre-game pep talks).' },
  { title: 'Custom Gig', amount: '200+', description: 'Create a gig and offer it.' },
]

export default function BusinessOnboard() {
  const [selectedGig, setSelectedGig] = useState<typeof gigTypes[0] | null>(null)
  const [customDetails, setCustomDetails] = useState('')
  const [amount, setAmount] = useState('')
  const [showPaymentPopup, setShowPaymentPopup] = useState(false)

  const handleGigSelect = (gig: typeof gigTypes[0]) => {
    setSelectedGig(gig)
    setAmount('')
    setCustomDetails('')
  }

  const handlePost = async () => {
    alert('Offer posted and wallet funded (test mode)!')
  }

  return (
    <div style={{
      fontFamily: "'Courier New', Courier, monospace",
      textAlign: 'center',
      padding: '2rem 2rem',
      backgroundColor: 'white',
      color: 'black',
    }}>
      {/* New title — 22px, reduced space above */}
      <h1 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '1rem' }}>
        A Local Student Athlete Personally Requested Your Business
      </h1>
      <p style={{ fontSize: '20px', marginBottom: '1rem' }}>An athlete invited you to support the team.</p>
      <p style={{ fontSize: '20px', marginBottom: '2rem' }}>Here's How:</p>
      {/* Arrow */}
      <div style={{ fontSize: '2rem', marginBottom: '2rem' }}>▼</div>
      {/* Gig Descriptions — thin hairline border */}
      <div style={{ maxWidth: '1000px', margin: '0 auto 4rem auto' }}>
        <div style={{ border: '1px solid black', padding: '2rem', backgroundColor: 'white' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
            {gigTypes.map((gig) => (
              <div key={gig.title}>
                <h3 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '1rem' }}>{gig.title}</h3>
                <p style={{ fontWeight: 'bold', marginBottom: '1rem' }}>${gig.amount}</p>
                <p>{gig.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Giant Gig Buttons — raw styles, no Tailwind */}
      <h2 style={{ fontSize: '30px', fontWeight: 'bold', marginBottom: '2rem' }}>Choose a Gig to Sponsor</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem', maxWidth: '1000px', margin: '0 auto 4rem auto' }}>
        {gigTypes.map((gig) => (
          <div key={gig.title}>
            <button
              onClick={() => handleGigSelect(gig)}
              style={{
                width: '100%',
                height: '300px',
                backgroundColor: selectedGig?.title === gig.title ? '#333' : 'black',
                color: 'white',
                fontFamily: "'Courier New', Courier, monospace",
                fontSize: '30px',
                padding: '2rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                cursor: 'pointer',
                border: 'none',
                transition: 'background-color 0.3s',
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#333'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = selectedGig?.title === gig.title ? '#333' : 'black'}
            >
              <span style={{ marginBottom: '1rem' }}>{gig.title}</span>
              <span style={{ marginBottom: '1rem' }}>${gig.amount}</span>
              <span style={{ fontSize: '20px' }}>{gig.description}</span>
            </button>
            {/* Form below selected gig */}
            {selectedGig?.title === gig.title && (
              <div style={{ marginTop: '2rem', backgroundColor: '#f5f5f5', padding: '2rem', border: '1px solid black', maxWidth: '500px', marginLeft: 'auto', marginRight: 'auto' }}>
                <h3 style={{ fontSize: '24px', marginBottom: '2rem', fontWeight: 'bold' }}>Customize Your {gig.title}</h3>
                <div style={{ display: 'flex', flexDirection: 'column',