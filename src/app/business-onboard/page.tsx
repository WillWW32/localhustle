'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const gigTypes = [
  { type: 'shoutout', title: 'ShoutOut', amount: 50, description: 'Visit a favorite business and make a quick shoutout 15-sec reel about what you like.' },
  { type: 'clinic', title: 'Youth Clinic', amount: 500, description: 'Run 30–60 min sessions for younger athletes (with teammates).' },
  { type: 'team', title: 'Team Sponsor', amount: 1000, description: 'Business sponsors team meals/gear — money split equally.' },
  { type: 'review', title: 'Product Review', amount: 50, description: '$50 + Perks (e.g., post your order — get free coffee for a month).' },
  { type: 'cameo', title: 'Cameo', amount: 200, description: '$50–$200 — Impact the next gen (birthdays, pep talks).' },
]

export default function BusinessOnboard() {
  const [selectedGig, setSelectedGig] = useState<typeof gigTypes[0] | null>(null)
  const [customDetails, setCustomDetails] = useState('')
  const [amount, setAmount] = useState('')
  const [showPaymentPopup, setShowPaymentPopup] = useState(false)

  const handleGigSelect = (gig: typeof gigTypes[0]) => {
    setSelectedGig(gig)
    setAmount(gig.amount.toString())
    setCustomDetails('')
  }

  const handlePost = async () => {
    // Post offer logic (same as before)
    alert('Offer posted!')
  }

  return (
    <div className="container py-20">
      <h1 className="text-center text-5xl mb-12">Welcome, Local Business</h1>
      <p className="text-center text-2xl mb-12">An athlete invited you to support the team.</p>

      {/* Gig Types Table */}
      <div className="max-w-4xl mx-auto mb-20">
        <h2 className="text-3xl mb-8 text-center font-bold">What Athletes Can Earn</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {gigTypes.map((gig) => (
            <div key={gig.type} className="border-4 border-black p-8 bg-gray-100">
              <h3 className="text-2xl font-bold mb-4">{gig.title}</h3>
              <p className="text-xl mb-4">${gig.amount}{gig.type === 'cameo' ? '–$200' : gig.type === 'clinic' ? '+' : ''}</p>
              <p>{gig.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Giant Gig Buttons */}
      <h2 className="text-3xl mb-12 text-center font-bold">Post an Offer</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-4xl mx-auto mb-20">
        {gigTypes.map((gig) => (
          <Button
            key={gig.type}
            onClick={() => handleGigSelect(gig)}
            className="h-32 text-3xl bg-black text-white hover:bg-gray-800"
          >
            {gig.title}<br />${gig.amount}+
          </Button>
        ))}
      </div>

      {/* Custom Offer Form */}
      {selectedGig && (
        <div className="max-w-md mx-auto space-y-12 mb-20">
          <div>
            <Label className="text-2xl block mb-4">Gig Details</Label>
            <p className="mb-4">{selectedGig.description}</p>
            <Input
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mb-4"
            />
            <Input
              placeholder="Add your details (e.g., Come to Bridge Pizza this Friday)"
              value={customDetails}
              onChange={(e) => setCustomDetails(e.target.value)}
            />
          </div>

          <Button onClick={handlePost} className="w-full h-20 text-3xl bg-black text-white hover:bg-gray-800">
            Post Offer
          </Button>
        </div>
      )}

      {/* Payment Popup */}
      <div className="text-center mb-20">
        <Button onClick={() => setShowPaymentPopup(true)} variant="outline" className="text-xl py-6">
          How does payment work?
        </Button>
      </div>

      {showPaymentPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-12 border-4 border-black max-w-lg">
            <h2 className="text-3xl mb-8 font-bold">How Payments Work</h2>
            <p className="mb-4">1. Athlete uploads clip</p>
            <p className="mb-4">2. You review & approve</p>
            <p className="mb-4">3. Parent approves (for minors)</p>
            <p className="mb-8">4. $ sent — only pay for clips you love</p>
            <Button onClick={() => setShowPaymentPopup(false)} className="w-full text-xl py-6">
              Got it
            </Button>
          </div>
        </div>
      )}

      {/* Add Funds (Stripe) */}
      <div className="max-w-md mx-auto">
        <Button className="w-full h-20 text-3xl bg-black text-white hover:bg-gray-800">
          Add Funds to Wallet
        </Button>
      </div>
    </div>
  )
}