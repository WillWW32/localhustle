'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'

export default function Squad() {
  const [profile, setProfile] = useState<any>(null)
  const [squad, setSquad] = useState<any[]>([])
  const router = useRouter()

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.replace('/')
        return
      }

      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      setProfile(prof)

      const { data: squadMembers } = await supabase
        .from('profiles')
        .select('email, created_at')
        .eq('referred_by', user.id)
      setSquad(squadMembers || [])
    }

    fetchData()
  }, [router])

  const referralLink = `${window.location.origin}?ref=${profile?.id || ''}`

  const copyReferral = () => {
    navigator.clipboard.writeText(referralLink)
    alert('Referral link copied!')
  }

  const shareReferral = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Join my LocalHustle Squad!',
        text: 'Earn NIL money with me on LocalHustle — sign up with my link!',
        url: referralLink,
      })
    } else {
      copyReferral()
    }
  }

  if (!profile) return <p className="container text-center py-32">Loading...</p>

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

      {/* Title */}
      <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '2rem' }}>
        Build Your Squad
      </h1>

      {/* Detail */}
      <p style={{ fontSize: '1.5rem', maxWidth: '800px', margin: '0 auto 4rem auto', lineHeight: '1.8' }}>
        Invite friends to join LocalHustle with your link.<br />
        When they complete gigs, you earn a bonus!
      </p>

      {/* Referral Link */}
      <div style={{ maxWidth: '600px', margin: '0 auto 4rem auto', padding: '2rem', backgroundColor: '#f5f5f5', border: '4px solid black' }}>
        <p style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>
          Your referral link:
        </p>
        <p style={{ fontSize: '1.2rem', wordBreak: 'break-all', marginBottom: '2rem' }}>
          {referralLink}
        </p>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Button onClick={copyReferral} style={{
            flex: 1,
            height: '60px',
            fontSize: '1.5rem',
            backgroundColor: 'black',
            color: 'white',
          }}>
            Copy Link
          </Button>
          <Button onClick={shareReferral} style={{
            flex: 1,
            height: '60px',
            fontSize: '1.5rem',
            backgroundColor: '#90ee90',
            color: 'black',
          }}>
            Share Link
          </Button>
        </div>
      </div>

      {/* Squad Members */}
      <div>
        <h2 style={{ fontSize: '2rem', marginBottom: '3rem' }}>
          Your Squad ({squad.length} members)
        </h2>
        {squad.length === 0 ? (
          <p style={{ fontSize: '1.2rem', color: '#666' }}>
            No squad members yet — share your link to grow your team!
          </p>
        ) : (
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            {squad.map((member) => (
              <div key={member.id} style={{
                padding: '1.5rem',
                borderBottom: '2px solid black',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <p style={{ fontSize: '1.2rem' }}>{member.email}</p>
                <p style={{ fontSize: '1rem', color: '#666' }}>
                  Joined: {new Date(member.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}