'use client'

import { useParams } from 'next/navigation'
import { useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

function ParentApproveContent() {
  const { clip_id } = useParams()
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [cardComplete, setCardComplete] = useState(false)

  const handleApprove = async () => {
    if (!stripe || !elements || !cardComplete) return

    setLoading(true)

    const cardElement = elements.getElement(CardElement)
    if (!cardElement) {
      setLoading(false)
      return
    }

    const { error: methodError, paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
      card: cardElement,
    })

    if (methodError) {
      alert(methodError.message)
      setLoading(false)
      return
    }

    const response = await fetch('/api/payout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clip_id, paymentMethodId: paymentMethod.id }),
    })

    const result = await response.json()

    if (result.error) {
      alert(result.error)
    } else {
      alert('Payout sent to your card! Thank you for supporting your athlete.')
      await supabase.from('clips').update({ status: 'paid' }).eq('id', clip_id)
    }

    setLoading(false)
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
      {/* Slogan + Triangle (global, but repeated for consistency if layout doesn't cover) */}
      <p style={{ fontSize: '2rem', marginBottom: '1rem' }}>
        Community Driven Support for Student Athletes
      </p>
      <div style={{ fontSize: '3rem', marginBottom: '4rem' }}>▼</div>

      {/* Subtitle — black block */}
      <div style={{ backgroundColor: 'black', color: 'white', padding: '2rem', marginBottom: '4rem' }}>
        <h1 style={{ fontSize: '1.8rem', margin: '0' }}>
          Parent Approval Required
        </h1>
      </div>

      {/* Detail — black block */}
      <div style={{ backgroundColor: 'black', color: 'white', padding: '2rem', marginBottom: '6rem' }}>
        <p style={{ fontSize: '1.2rem', lineHeight: '1.8' }}>
          Your child earned from a gig.<br />
          Enter your card to receive the payout (saved for future gigs).
        </p>
      </div>

      {/* Main Content */}
      <div className="max-w-md mx-auto space-y-12">
        <div className="p-8 border-4 border-black bg-white">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '20px',
                  color: '#000',
                  '::placeholder': { color: '#666' },
                  fontFamily: "'Courier New', Courier, monospace",
                },
              },
            }}
            onChange={(e) => setCardComplete(e.complete)}
          />
        </div>

        <Button onClick={handleApprove} disabled={loading || !cardComplete} style={{
          width: '100%',
          height: '80px',
          fontSize: '30px',
          backgroundColor: '#90ee90',
          color: 'black',
          fontFamily: "'Courier New', Courier, monospace'",
        }}>
          {loading ? 'Processing...' : 'Enter Card & Approve Payout'}
        </Button>
      </div>
    </div>
  )
}

export default function ParentApprove() {
  return (
    <Elements stripe={stripePromise}>
      <ParentApproveContent />
    </Elements>
  )
}