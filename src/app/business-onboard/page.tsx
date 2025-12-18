'use client'

import { useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

const gigTypes = [
  { title: 'ShoutOut', baseAmount: 50, description: 'Visit a favorite business and make a quick shoutout 15-sec reel about what you like.' },
  { title: 'Youth Clinic', baseAmount: 500, description: 'Run 30–60 min sessions for younger athletes (with teammates).' },
  { title: 'Team Sponsor', baseAmount: 1000, description: 'Business sponsors team meals/gear — money split equally.' },
  { title: 'Product Review', baseAmount: 50, description: '$50 + Perks (e.g., post your order — get free coffee for a month).' },
  { title: 'Cameo', baseAmount: 100, description: 'Custom 15-Sec Video for Younger Athletes (birthdays, pre-game pep talks).' },
  { title: 'Custom Gig', baseAmount: 200, description: 'Create a gig and offer it.' },
]

export default function BusinessOnboard() {
  const [selectedGig, setSelectedGig] = useState<typeof gigTypes[0] | null>(null)
  const [numAthletes, setNumAthletes] = useState(1)
  const [customDetails, setCustomDetails] = useState('')
  const [amount, setAmount] = useState('')
  const [isRecurring, setIsRecurring] = useState(false)
  const [showPaymentPopup, setShowPaymentPopup] = useState(false)
  const [loadingStripe, setLoadingStripe] = useState(false)

  const handleGigSelect = (gig: typeof gigTypes[0]) => {
    setSelectedGig(gig)
    setNumAthletes(1)
    setAmount('')
    setCustomDetails('')
    setIsRecurring(false)
  }

  const handleAthletesChange = (value: number) => {
    setNumAthletes(value)
    if (selectedGig) {
      const total = selectedGig.baseAmount + (value - 1) * 75
      setAmount(total.toString())
    }
  }

  const handleStripeCheckout = async () => {
    setLoadingStripe(true)

    const response = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: parseFloat(amount) * 100 }), // cents
    })

    const { id } = await response.json()

    const stripe = await stripePromise
    if (stripe) {
      const { error } = await stripe.redirectToCheckout({ sessionId: id })
      if (error) alert(error.message)
    }

    setLoadingStripe(false)
  }

  const handlePost = async () => {
    alert('Offer posted (live mode)!')
  }

  return (
    <div className="container py-8">
      {/* Small header */}
      <h1 className="text-center text-3xl mb-4 font-bold">Welcome Local Business</h1>
      <p className="text-center text-xl mb-4">An athlete invited you to support the team.</p>
      <p className="text-center text-xl mb-12">Here's How:</p>

      {/* Arrow */}
      <div className="text-center mb-12">
        <div style={{ fontSize: '2rem' }}>▼</div>
      </div>

      {/* Gig Descriptions */}
      <div className="max-w-4xl mx-auto mb-32">
        <div className="border border-black p-12 bg-white">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {gigTypes.map((gig) => (
              <div key={gig.title}>
                <h3 className="text-2xl font-bold mb-4">{gig.title}</h3>
                <p className="font-bold mb-4">${gig.baseAmount}+</p>
                <p>{gig.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Giant Gig Buttons */}
      <h2 className="text-center text-3xl mb-12 font-bold">Choose a Gig to Sponsor</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-20 max-w-4xl mx-auto mb-32">
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
              <span style={{ marginBottom: '1rem' }}>${gig.baseAmount}+</span>
              <span style={{ fontSize: '20px' }}>{gig.description}</span>
            </button>

            {/* Form below selected gig */}
            {selectedGig?.title === gig.title && (
              <div style={{ marginTop: '2rem', backgroundColor: '#f5f5f5', padding: '2rem', border: '1px solid black', maxWidth: '500px', marginLeft: 'auto', marginRight: 'auto' }}>
                <h3 style={{ fontSize: '24px', marginBottom: '2rem', fontWeight: 'bold' }}>Customize Your {gig.title}</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '20px', marginBottom: '0.5rem' }}>Number of Athletes</label>
                    <select
                      value={numAthletes}
                      onChange={(e) => handleAthletesChange(Number(e.target.value))}
                      style={{ width: '100%', padding: '1rem', fontSize: '20px', border: '4px solid black' }}
                    >
                      {[1,2,3,4,5,6,7,8,9,10].map(n => (
                        <option key={n} value={n}>{n} athlete{n > 1 ? 's' : ''}</option>
                      ))}
                    </select>
                    <p style={{ fontSize: '14px', marginTop: '0.5rem' }}>+ $75 per additional athlete</p>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '20px', marginBottom: '0.5rem' }}>Offer Amount</label>
                    <Input
                      placeholder="Enter Offer Amount - Min $50"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      style={{ fontFamily: "'Courier New', Courier, monospace" }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '20px', marginBottom: '0.5rem' }}>Custom Details</label>
                    <textarea
                      placeholder="Add your details (e.g., Come to Bridge Pizza this Friday)"
                      value={customDetails}
                      onChange={(e) => setCustomDetails(e.target.value)}
                      style={{ width: '100%', height: '160px', padding: '1rem', fontSize: '20px', fontFamily: "'Courier New', Courier, monospace'", border: '4px solid black' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '20px', marginBottom: '0.5rem' }}>
                      <input type="checkbox" checked={isRecurring} onChange={(e) => setIsRecurring(e.target.checked)} />
                      Make this recurring monthly
                    </label>
                  </div>

                  <Button onClick={handlePost} style={{
                    width: '100%',
                    height: '80px',
                    fontSize: '30px',
                    backgroundColor: '#90ee90',
                    color: 'black',
                    fontFamily: "'Courier New', Courier, monospace'",
                  }}>
                    Fund & Post Offer
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Banner at bottom */}
      <div style={{ backgroundColor: '#f0f0f0', padding: '2rem', marginTop: '4rem', borderTop: '4px solid black' }}>
        <p style={{ fontSize: '24px', fontWeight: 'bold' }}>
          Business can add scholarships after successful gig completion.
        </p>
      </div>

      {/* Payment Popup */}
      <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
        <Button onClick={() => setShowPaymentPopup(true)} variant="outline" style={{ fontSize: '20px', padding: '1rem 2rem' }}>
          How payments work?
        </Button>
      </div>

      {showPaymentPopup && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ backgroundColor: 'white', padding: '3rem', border: '4px solid black', maxWidth: '600px' }}>
            <h2 style={{ fontSize: '30px', marginBottom: '2rem', fontWeight: 'bold' }}>How Payments Work</h2>
            <p style={{ marginBottom: '1rem' }}>1. Athlete uploads clip</p>
            <p style={{ marginBottom: '1rem' }}>2. You review & approve</p>
            <p style={{ marginBottom: '1rem' }}>3. Parent approves (for minors)</p>
            <p style={{ marginBottom: '2rem' }}>4. $ sent = clips you love</p>
            <Button onClick={() => setShowPaymentPopup(false)} style={{ width: '100%', height: '60px', fontSize: '20px' }}>
              Got it
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}