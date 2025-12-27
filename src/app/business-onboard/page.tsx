'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

const gigTypes = [
  { title: 'ShoutOut', description: 'Visit a favorite business and make a quick shoutout 15-sec reel about what you like or your favorite order.' },
  { title: 'Youth Clinic', description: 'Run 30–60 min sessions for younger athletes (with teammates).' },
  { title: 'Cameo', description: 'Custom 15-Sec Video for Younger Athletes (birthdays, pre-game pep talks).' },
  { title: 'Player Training', description: 'Varsity athlete 40-minute training with young player.' },
  { title: 'Challenge', description: 'Fun competitions — HORSE, PIG, free throws, accuracy toss. Base pay for clip, bonus if you win.' },
  { title: 'Custom Gig', description: 'Create a gig and offer it.' },
]

export default function BusinessOnboard() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-white text-black font-mono py-16 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Hero */}
        <h1 className="text-4xl sm:text-6xl font-bold text-center mb-12">
          Become the Hometown Hero
        </h1>

        <p className="text-xl sm:text-3xl text-center mb-16 max-w-4xl mx-auto">
          Fund local athletes with gigs & Freedom Scholarships — unrestricted cash paid instantly.<br />
          Get authentic content. Build goodwill. Discover motivated kids.
        </p>

        {/* NIL Stat Callout */}
        <div className="bg-black text-white p-12 mb-16 text-center">
          <p className="text-3xl font-bold">
            NIL deal advertising performs 4x better than traditional ads
          </p>
          <p className="text-xl mt-4">
            Authentic word-of-mouth from kids parents trust — real results.
          </p>
        </div>

        {/* How It Works */}
        <div className="bg-black text-white p-12 mb-16 text-center">
          <h2 className="text-3xl font-bold mb-8">
            How It Works — 3 Simple Steps
          </h2>
          <ol className="text-xl space-y-6 max-w-3xl mx-auto text-left">
            <li>1. Add funds to your wallet (instant).</li>
            <li>2. Post a gig or award a Freedom Scholarship.</li>
            <li>3. Athletes complete → you approve → they get paid instantly.</li>
          </ol>
        </div>

        {/* Popular Gig Types */}
        <h2 className="text-3xl font-bold text-center mb-12">
          Popular Gig Types
        </h2>
        <p className="text-xl text-center mb-12 max-w-4xl mx-auto">
          These are the gigs and challenges you can offer student athletes.<br />
          Add a Freedom Scholarship to any gig for extra impact.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-24">
          {gigTypes.map((gig) => (
            <div key={gig.title} className="border-4 border-black p-8 bg-gray-100">
              <h3 className="text-2xl font-bold mb-4">{gig.title}</h3>
              <p className="text-lg">{gig.description}</p>
            </div>
          ))}
        </div>

        {/* Freedom Scholarships Callout */}
        <div className="bg-green-100 p-12 border-4 border-green-600 mb-24">
          <h2 className="text-3xl font-bold text-center mb-8">
            Freedom Scholarships
          </h2>
          <p className="text-xl text-center max-w-3xl mx-auto">
            Add a scholarship to any gig or award standalone — paid instantly to the athlete.<br />
            No restrictions — they use it for books, food, rent — whatever they need.<br />
            You become the hero who made college more possible.
          </p>
        </div>

        {/* Booster Events Mention */}
        <div className="bg-gray-100 p-12 border-4 border-black mb-24 text-center">
          <h2 className="text-3xl font-bold mb-8">
            Better Fundraising with Booster Events
          </h2>
          <p className="text-xl max-w-3xl mx-auto">
            In your dashboard, you can support or create booster events — crowd-fund team meals, gear, travel, or clinics.<br />
            Share the link — local businesses donate — money goes directly to team needs.
          </p>
        </div>

        {/* Main CTA */}
        <div className="text-center">
          <Button
            onClick={() => router.push('/dashboard')}
            className="w-full max-w-2xl h-24 text-3xl bg-black text-white font-bold"
          >
            Go to Admin Console — Start Funding Gigs & Scholarships
          </Button>
        </div>
      </div>
    </div>
  )
}