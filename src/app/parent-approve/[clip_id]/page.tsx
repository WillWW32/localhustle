'use client'

import { useParams } from 'next/navigation'
import { useState } from 'react'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

export default function ParentApprove() {
  const { clip_id } = useParams()
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [cardComplete, setCardComplete] = useState(false)

  const handleApprove = async () => {
    if (!stripe || !elements) return

    setLoading(true)

    const cardElement = elements.getElement(CardElement)
    if (!cardElement) return

    const { error: methodError, paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
      card: cardElement,
    })

    if (methodError) {
      alert(methodError.message)
      setLoading(false)
      return
    }

    // Save payment method + payout (server action)
    const response = await fetch('/api/payout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clip_id, paymentMethodId: paymentMethod.id }),
    })

    const result = await response.json()

    if (result.error) {
      alert(result.error)
    } else {
      alert('Payout sent to your card!')
      // Update clip status
      await supabase.from('clips').update({ status: 'paid' }).eq('id', clip_id)
    }

    setLoading(false)
  }

  return (
    <div className="container py-20">
      <h1 className="text-center text-5xl mb-12">Parent Approval</h1>
      <p className="text-center text-2xl mb-20">Your child earned from a gig.</p>

      <div className="max-w-md mx-auto space-y-12">
        <div className="p-8 border-4 border-black">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '20px',
                  color: '#000',
                  '::placeholder': { color: '#666' },
                },
              },
            }}
            onChange={(e) => setCardComplete(e.complete)}
          />
        </div>

        <Button onClick={handleApprove} disabled={loading || !cardComplete} className="w-full h-20 text-3xl bg-black text-white hover:bg-gray-800">
          {loading ? 'Processing...' : 'Enter Card & Approve Payout'}
        </Button>
      </div>
    </div>
  )
}

// Wrap in Elements
const WrappedParentApprove = () => (
  <Elements stripe={stripePromise}>
    <ParentApprove />
  </Elements>
)

export default WrappedParentApprove