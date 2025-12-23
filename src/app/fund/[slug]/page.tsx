'use client'

import { useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { loadStripe } from '@stripe/stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

export default function FundEvent() {
  const { slug } = useParams()
  const [event, setEvent] = useState<any>(null)
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchEvent = async () => {
      const { data, error } = await supabase
        .from('booster_events')
        .select('*')
        .eq('slug', slug)
        .single()

      if (error) {
        console.error(error)
        return
      }

      setEvent(data)
    }

    if (slug) fetchEvent()
  }, [slug])

  const handleDonate = async () => {
    if (!amount || !event) return
    if (parseFloat(amount) <= 0) {
      alert('Enter a valid amount')
      return
    }

    setLoading(true)

    const response = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: parseFloat(amount), booster_event_id: event.id }),
    })

    const { id } = await response.json()
    const stripe = await stripePromise
    if (!stripe) {
      alert('Stripe failed to load')
      setLoading(false)
      return
    }

    // Workaround for TypeScript error — redirectToCheckout exists at runtime
    // @ts-ignore
    const { error } = await stripe.redirectToCheckout({ sessionId: id })

    if (error) {
      alert(error.message)
    }

    setLoading(false)
  }

  if (!event) return <p className="container text-center py-32">Loading event...</p>

  const progress = event.goal > 0 ? (event.raised / event.goal) * 100 : 0

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

      {/* Event Title */}
      <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '2rem' }}>
        {event.name}
      </h1>

      {/* Description */}
      <p style={{ fontSize: '1.5rem', maxWidth: '800px', margin: '0 auto 4rem auto', lineHeight: '1.8' }}>
        {event.description || 'Support this team event!'}
      </p>

      {/* Progress Meter */}
      <div style={{ maxWidth: '600px', margin: '0 auto 4rem auto' }}>
        <p style={{ fontSize: '1.8rem', marginBottom: '1rem' }}>
          ${event.raised.toFixed(2)} raised of ${event.goal.toFixed(2)}
        </p>
        <div style={{ height: '60px', backgroundColor: '#ddd', border: '4px solid black', position: 'relative' }}>
          <div style={{
            width: `${progress}%`,
            height: '100%',
            backgroundColor: '#90ee90',
            transition: 'width 0.5s ease',
          }}></div>
          <p style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: '2rem',
            fontWeight: 'bold',
          }}>
            {progress.toFixed(0)}%
          </p>
        </div>
      </div>

      {/* Donation Form */}
      <div style={{ maxWidth: '500px', margin: '0 auto' }}>
        <Input
          type="number"
          placeholder="Enter donation amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          style={{
            height: '60px',
            fontSize: '1.5rem',
            border: '4px solid black',
            textAlign: 'center',
            marginBottom: '2rem',
          }}
        />
        <Button 
          onClick={handleDonate}
          disabled={loading}
          style={{
            width: '100%',
            height: '80px',
            fontSize: '2rem',
            backgroundColor: '#90ee90',
            color: 'black',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: "'Courier New', Courier, monospace'",
          }}
        >
          {loading ? 'Processing...' : 'Donate Now'}
        </Button>
      </div>
    </div>
  )
}