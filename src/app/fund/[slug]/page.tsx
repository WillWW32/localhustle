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

    // @ts-ignore — redirectToCheckout exists at runtime
    const { error } = await stripe.redirectToCheckout({ sessionId: id })

    if (error) {
      alert(error.message)
    }

    setLoading(false)
  }

  if (!event) return <p className="container text-center py-32">Loading event...</p>

  const progress = event.goal > 0 ? (event.raised / event.goal) * 100 : 0

  return (
    <div className="min-h-screen bg-white text-black font-mono py-8 px-4 sm:px-8">
      {/* Slogan + Triangle */}
      <p className="text-2xl sm:text-3xl text-center mb-4">
        Community Driven Support for Student Athletes
      </p>
      <div className="text-5xl sm:text-6xl text-center mb-12">▼</div>

      {/* Event Title */}
      <h1 className="text-3xl sm:text-5xl font-bold text-center mb-8">
        {event.name}
      </h1>

      {/* Description */}
      <p className="text-lg sm:text-2xl text-center mb-16 max-w-4xl mx-auto leading-relaxed">
        {event.description || 'Support this team event!'}
      </p>

      {/* Progress Meter */}
      <div className="max-w-2xl mx-auto mb-16">
        <p className="text-2xl sm:text-3xl text-center mb-6">
          ${event.raised.toFixed(2)} raised of ${event.goal.toFixed(2)}
        </p>
        <div className="relative h-20 bg-gray-300 border-4 border-black">
          <div 
            className="absolute top-0 left-0 h-full bg-green-400 transition-all duration-500"
            style={{ width: `${progress}%` }}
          ></div>
          <p className="absolute inset-0 flex items-center justify-center text-3xl font-bold">
            {progress.toFixed(0)}%
          </p>
        </div>
      </div>

      {/* Donation Form */}
      <div className="max-w-md mx-auto">
        <Input
          type="number"
          placeholder="Enter donation amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="h-16 text-2xl text-center border-4 border-black mb-8"
        />
        <Button 
          onClick={handleDonate}
          disabled={loading}
          className="w-full h-20 text-3xl bg-green-400 text-black"
        >
          {loading ? 'Processing...' : 'Donate Now'}
        </Button>
      </div>
    </div>
  )
}