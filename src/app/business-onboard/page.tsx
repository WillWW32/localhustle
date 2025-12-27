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
      backgroundColor: '#fff',
      color: '#000',
      minHeight: '100vh',
      padding: '2rem',
      textAlign: 'center',
    }}>
      {/* Hero */}
      <h1 style={{
        fontSize: '48px',
        fontWeight: 'bold',
        marginBottom: '2rem',
      }}>
        Become the Hometown Hero
      </h1>

      <p style={{
        fontSize: '28px',
        maxWidth: '900px',
        margin: '0 auto 3rem auto',
        lineHeight: '1.6',
      }}>
        Fund local athletes with gigs & Freedom Scholarships — unrestricted cash paid instantly.
      </p>

      {/* Freedom Scholarships Callout */}
      <div style={{
        backgroundColor: '#90ee90',
        padding: '3rem',
        margin: '3rem auto',
        maxWidth: '1000px',
        border: '4px solid black',
      }}>
        <h2 style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '1.5rem' }}>
          Freedom Scholarships — Real Impact
        </h2>
        <p style={{ fontSize: '24px', lineHeight: '1.6' }}>
          Add a Freedom Scholarship to any gig — paid instantly to the athlete.<br />
          No restrictions — they use it for books, food, rent — whatever they need.<br />
          You become the hero who made college more possible.
        </p>
      </div>

      {/* Gig Types */}
      <h2 style={{ fontSize: '36px', fontWeight: 'bold', margin: '3rem 0 2rem' }}>
        Popular Gig Types
      </h2>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '2rem',
        maxWidth: '1200px',
        margin: '0 auto 4rem auto',
      }}>
        {gigTypes.map((gig) => (
          <div key={gig.title} style={{
            border: '4px solid black',
            padding: '2rem',
            backgroundColor: '#f0f0f0',
          }}>
            <h3 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '1rem' }}>
              {gig.title}
            </h3>
            <p style={{ fontSize: '20px' }}>
              {gig.description}
            </p>
          </div>
        ))}
      </div>

      {/* Booster Events */}
      <div style={{ margin: '4rem 0' }}>
        <h2 style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '2rem' }}>
          Booster Club Events
        </h2>
        <p style={{ fontSize: '24px', maxWidth: '800px', margin: '0 auto 2rem auto', lineHeight: '1.8' }}>
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

      {/* Final CTA */}
      <div style={{ margin: '4rem 0' }}>
        <Button
          onClick={() => router.push('/dashboard')}
          style={{
            width: '100%',
            maxWidth: '600px',
            height: '100px',
            fontSize: '36px',
            backgroundColor: '#000',
            color: '#fff',
          }}
        >
          Start Sponsoring Athletes Now
        </Button>
      </div>

      {/* Bottom Banner */}
      <div style={{ backgroundColor: '#f0f0f0', padding: '2rem', marginTop: '4rem', borderTop: '4px solid black' }}>
        <p style={{ fontSize: '24px', fontWeight: 'bold' }}>
          Fund Freedom Scholarships — paid instantly, no restrictions.
        </p>
      </div>
    </div>
  )
}