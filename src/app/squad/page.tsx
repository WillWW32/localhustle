'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'

export default function Squad() {
  const [profile, setProfile] = useState<any>(null)
  const [squad, setSquad] = useState<any[]>([])
  const [leaderboard, setLeaderboard] = useState<any[]>([])
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

      // My squad
      const { data: mySquad } = await supabase
        .from('profiles')
        .select('id, email, full_name, school, profile_pic, created_at')
        .eq('referred_by', user.id)
        .order('created_at', { ascending: true })
      setSquad(mySquad || [])

      // Leaderboard — top 10 squads by size
      const { data: allReferrers } = await supabase
        .rpc('get_squad_sizes') // create RPC for efficiency
        .order('squad_size', { ascending: false })
        .limit(10)

      setLeaderboard(allReferrers || [])
    }

    fetchData()
  }, [router])

  const referralLink = profile ? `${window.location.origin}?ref=${profile.id}` : ''

  const copyReferral = () => {
    navigator.clipboard.writeText(referralLink)
    alert('Referral link copied!')
  }

  const shareReferral = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Join my LocalHustle Squad!',
        text: 'Earn NIL money with me — sign up with my link!',
        url: referralLink,
      })
    } else {
      copyReferral()
    }
  }

  const squadSize = squad.length
  const badge = squadSize >= 10 ? 'Squad of 10' : squadSize >= 5 ? 'Squad of 5' : null
  const challengeComplete = squadSize >= 3

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
        Your Squad ({squadSize} members)
      </h1>

      {/* Badges */}
      {badge && (
        <p style={{ fontSize: '1.8rem', marginBottom: '2rem', color: '#90ee90' }}>
          🎖️ {badge} Badge Earned!
        </p>
      )}

      {/* Challenge */}
      {challengeComplete && (
        <p style={{ fontSize: '1.8rem', marginBottom: '2rem', color: '#90ee90' }}>
          💰 $50 Challenge Bonus Earned!
        </p>
      )}

      {/* Referral Link */}
      <div style={{ maxWidth: '600px', margin: '0 auto 4rem auto', padding: '2rem', backgroundColor: '#f5f5f5', border: '4px solid black' }}>
        <p style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
          Share your referral link:
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

        {/* Share Templates */}
        <div style={{ marginTop: '2rem', textAlign: 'left' }}>
          <p style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Quick share messages:</p>
          <Button variant="outline" style={{ width: '100%', marginBottom: '1rem', justifyContent: 'flex-start' }}
            onClick={() => navigator.clipboard.writeText("Join my LocalHustle squad and earn NIL money together! Sign up here: " + referralLink)}
          >
            "Join my squad and earn together!"
          </Button>
          <Button variant="outline" style={{ width: '100%', justifyContent: 'flex-start' }}
            onClick={() => navigator.clipboard.writeText("Hey team — let's build a squad on LocalHustle and earn bonuses! My link: " + referralLink)}
          >
            "Hey team — let's build a squad!"
          </Button>
        </div>
      </div>

      {/* Squad Members */}
      <div>
        <h2 style={{ fontSize: '2rem', marginBottom: '3rem' }}>
          Your Squad Members
        </h2>
        {squad.length === 0 ? (
          <p style={{ fontSize: '1.2rem', color: '#666' }}>
            No members yet — share your link to grow your squad!
          </p>
        ) : (
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            {squad.map((member) => (
              <div key={member.id} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '2rem',
                padding: '1.5rem',
                borderBottom: '2px solid black',
              }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', border: '2px solid black' }}>
                  {member.profile_pic ? (
                    <img src={member.profile_pic} alt={member.email} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ backgroundColor: '#ccc', width: '100%', height: '100%' }}></div>
                  )}
                </div>
                <div style={{ textAlign: 'left', flex: 1 }}>
                  <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{member.full_name || member.email}</p>
                  <p>{member.school}</p>
                  <p style={{ fontSize: '1rem', color: '#666' }}>Joined: {new Date(member.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Leaderboard */}
      <div style={{ marginTop: '6rem' }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '3rem' }}>
          Squad Leaderboard (Top 10)
        </h2>
        {leaderboard.length === 0 ? (
          <p>No squads yet — be the first!</p>
        ) : (
          <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            {leaderboard.map((entry, index) => (
              <div key={entry.id} style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '1rem',
                borderBottom: '1px solid black',
              }}>
                <p style={{ fontSize: '1.2rem' }}>
                  {index + 1}. {entry.email} ({entry.squad_size} members)
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}