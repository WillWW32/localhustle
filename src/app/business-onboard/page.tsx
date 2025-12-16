'use client'

import { useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Button } from '@/components/ui/button'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

export default function BusinessOnboard() {
  const searchParams = useSearchParams()
  const ref = searchParams.get('ref') || 'a friend'

  const [loading, setLoading] = useState(false)

  const handleFund = async () => {
    setLoading(true)

    const response = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: 10000 }),
    })

    const { id } = await response.json()

    const stripe = await stripePromise
    if (stripe) {
      const { error } = await stripe.redirectToCheckout({ sessionId: id })
      if (error) alert(error.message)
    } else {
      alert('Stripe failed to load')
    }

    setLoading(false)
  }

  return (
    <div className="container">
      <h1 className="text-center text-5xl mb-12">Welcome, Local Business</h1>
      <p className="text-center mb-12 text-xl">An athlete invited you to support the team.</p>

      <div className="max-w-2xl mx-auto space-y-12 text-center">
        <p className="text-lg mb-8">
          Add funds to your wallet to post offers. Start with $100 — only pay for clips you approve.
        </p>

        <Button onClick={handleFund} disabled={loading} className="w-full max-w-md text-lg py-6">
          {loading ? 'Processing...' : 'Add $100 to Wallet'}
        </Button>

        <p className="text-sm text-gray-600 mt-12">
          Questions? Reply to the athlete's message.
        </p>
      </div>
    </div>
  )
}