'use client'

import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'

export default function BusinessOnboard() {
  const searchParams = useSearchParams()
  const ref = searchParams.get('ref') || 'a friend'

  const handleFund = () => {
    alert('Wallet funding coming soon — contact us to get started with test funds!')
  }

  return (
    <div className="container">
      <h1 className="text-center text-5xl mb-12">Welcome, Local Business</h1>
      <p className="text-center mb-12 text-xl">An athlete invited you to support the team.</p>

      <div className="max-w-2xl mx-auto space-y-12 text-center">
        <p className="text-lg mb-8">
          Add funds to your wallet to post offers. Start with $100 — only pay for clips you approve.
        </p>

        <Button onClick={handleFund} className="w-full max-w-md text-lg py-6">
          Add $100 to Wallet (Coming Soon)
        </Button>

        <p className="text-sm text-gray-600 mt-12">
          Questions? Reply to the athlete's message.
        </p>
      </div>
    </div>
  )
}