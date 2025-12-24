'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

const gigTypes = [
  { title: 'ShoutOut', description: 'Visit a favorite business and make a quick shoutout 15-sec reel about what you like or your favorite order.' },
  { title: 'Youth Clinic', description: 'Run 30–60 min sessions for younger athletes (with teammates).' },
  { title: 'Team Sponsor', description: 'Business sponsors team meals/gear — money split equally.' },
  { title: 'Cameo', description: 'Custom 15-Sec Video for Younger Athletes (birthdays, pre-game pep talks).' },
  { title: 'Player Training', description: 'Varsity athlete 40-minute training with young player.' },
  { title: 'Challenge', description: 'Fun competitions — HORSE, PIG, free throws, accuracy toss. Base pay for clip, bonus if athlete wins.' },
  { title: 'Custom Gig', description: 'Create a gig and offer it.' },
]

export default function BusinessOnboard() {
  const router = useRouter()

  return (
    <div style={{
      fontFamily: "'Courier New', Courier, monospace",
      textAlign: 'center',
      padding: '2rem 2rem',
      backgroundColor: 'white',
      color: 'black',
      minHeight: '100vh',
    }}>
      {/* Title */}
      <h1 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '1rem' }}>
        A Local Student Athlete Personally Requested Your Business
      </h1>

      {/* Arrow */}
      <div style={{ fontSize: '2rem', marginBottom: '2rem' }}>▼</div>

      {/* "Why it's the best advertising" — black block */}
      <div style={{ backgroundColor: 'black', color: 'white', padding: '2rem', marginBottom: '4rem' }}>
        <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '2rem' }}>
          Why this is the best advertising
        </h2>
        <p style={{ fontSize: '20px', lineHeight: '1.8' }}>
          • Real word-of-mouth from kids parents trust (88% trust recommendations from people they know).<br />
          • Authentic content — better than paid ads.<br />
          • Be the hometown hero — visible support for local teams.<br />
          • Discover motivated teens & potential future employees.<br />
          • Approve = Clips You Love.
        </p>
      </div>

      {/* Gigs starting at $50 */}
      <p style={{ fontSize: '20px', marginBottom: '4rem', maxWidth: '800px', marginLeft: 'auto', marginRight: 'auto' }}>
        Gigs starting at $50 — you set the amount.
      </p>

      {/* Gig Descriptions */}
      <div style={{ maxWidth: '1000px', margin: '0 auto 4rem auto' }}>
        <div style={{ padding: '2rem', backgroundColor: 'white' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
            {gigTypes.map((gig) => (
              <div key={gig.title}>
                <h3 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '1rem' }}>{gig.title}</h3>
                <p>{gig.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Reassurance */}
      <p style={{ fontSize: '20px', marginBottom: '4rem', maxWidth: '800px', marginLeft: 'auto', marginRight: 'auto' }}>
        Ready to become the hometown hero?<br />
        Fund a gig — get authentic content + support a local athlete.<br />
        Approve = Clips You Love.
      </p>

      {/* CTA to dashboard */}
      <div style={{ marginBottom: '4rem' }}>
        <Button 
          onClick={() => router.push('/dashboard')}
          style={{
            width: '100%',
            maxWidth: '500px',
            height: '80px',
            fontSize: '30px',
            backgroundColor: '#90ee90',
            color: 'black',
            fontFamily: "'Courier New', Courier, monospace'",
          }}
        >
          Go to Admin Console & Make an Offer
        </Button>
      </div>

      {/* Booster Events Section */}
      <div style={{ backgroundColor: '#f0f0f0', padding: '2rem', marginTop: '4rem', borderTop: '4px solid black' }}>
        <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '2rem' }}>
          Fund the Whole Team
        </h2>
        <p style={{ fontSize: '20px', maxWidth: '800px', margin: '0 auto 2rem auto', lineHeight: '1.8' }}>
          Create a booster club event — crowd-fund team meals, gear, travel, or youth clinics.<br />
          Share the link — local businesses donate — money goes directly to team expenses.
        </p>
        <Button 
          onClick={() => router.push('/dashboard')}
          style={{
            width: '100%',
            maxWidth: '500px',
            height: '80px',
            fontSize: '30px',
            backgroundColor: '#90ee90',
            color: 'black',
            fontFamily: "'Courier New', Courier, monospace'",
          }}
        >
          Create Booster Event in Admin Console
        </Button>
      </div>

      {/* Banner at bottom */}
      <div style={{ backgroundColor: '#f0f0f0', padding: '2rem', marginTop: '4rem', borderTop: '4px solid black' }}>
        <p style={{ fontSize: '24px', fontWeight: 'bold' }}>
          Businesses can add scholarships after successful gig completion.
        </p>
      </div>
    </div>
  )
}