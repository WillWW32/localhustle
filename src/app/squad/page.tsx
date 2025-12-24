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
      const { data: board } = await supabase.rpc('get_squad_sizes')
      setLeaderboard(board || [])
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
        text: 'Earn NIL money with me on LocalHustle — sign up with my link!',
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
    <div className="min-h-screen bg-white text-black font-mono py-8 px-4 sm:px-8">
      {/* Slogan + Triangle */}
      <p className="text-2xl sm:text-3xl text-center mb-4">
        Community Driven Support for Student Athletes
      </p>
      <div className="text-5xl sm:text-6xl text-center mb-12">▼</div>

      {/* Title */}
      <h1 className="text-3xl sm:text-4xl font-bold text-center mb-8">
        Your Squad ({squadSize} members)
      </h1>

      {/* Badges */}
      {badge && (
        <p className="text-2xl sm:text-3xl text-center mb-8 text-green-500 font-bold">
          🎖️ {badge} Badge Earned!
        </p>
      )}

      {/* Challenge */}
      {challengeComplete && (
        <p className="text-2xl sm:text-3xl text-center mb-8 text-green-500 font-bold">
          💰 $50 Challenge Bonus Earned!
        </p>
      )}

      {/* Referral Link */}
      <div className="max-w-2xl mx-auto mb-12 p-8 bg-gray-100 border-4 border-black">
        <p className="text-xl sm:text-2xl mb-6 text-center">
          Share your referral link:
        </p>
        <p className="text-base sm:text-lg break-all mb-8 px-4">
          {referralLink}
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Button onClick={copyReferral} className="h-16 text-xl bg-black text-white">
            Copy Link
          </Button>
          <Button onClick={shareReferral} className="h-16 text-xl bg-green-400 text-black">
            Share Link
          </Button>
        </div>

        {/* Share Templates */}
        <div className="mt-8 text-left">
          <p className="text-lg mb-4 text-center">Quick share messages:</p>
          <Button 
            variant="outline" 
            className="w-full mb-4 h-14 text-base border-4 border-black"
            onClick={() => navigator.clipboard.writeText("Join my LocalHustle squad and earn NIL money together! Sign up here: " + referralLink)}
          >
            "Join my squad and earn together!"
          </Button>
          <Button 
            variant="outline" 
            className="w-full h-14 text-base border-4 border-black"
            onClick={() => navigator.clipboard.writeText("Hey team — let's build a squad on LocalHustle and earn bonuses! My link: " + referralLink)}
          >
            "Hey team — let's build a squad!"
          </Button>
        </div>
      </div>

      {/* Squad Members */}
      <div className="max-w-4xl mx-auto mb-16">
        <h2 className="text-2xl sm:text-3xl font-bold mb-8 text-center">
          Your Squad Members
        </h2>
        {squad.length === 0 ? (
          <p className="text-lg text-gray-600 text-center">
            No members yet — share your link to grow your squad!
          </p>
        ) : (
          <div className="space-y-8">
            {squad.map((member) => (
              <div key={member.id} className="flex flex-col sm:flex-row items-center gap-6 p-6 border-4 border-black bg-gray-100">
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-black flex-shrink-0">
                  {member.profile_pic ? (
                    <img src={member.profile_pic} alt={member.email} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gray-300"></div>
                  )}
                </div>
                <div className="text-center sm:text-left flex-1">
                  <p className="text-xl font-bold">{member.full_name || member.email}</p>
                  <p className="text-lg">{member.school}</p>
                  <p className="text-base text-gray-600">Joined: {new Date(member.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Leaderboard */}
      <div className="max-w-2xl mx-auto py-16">
        <h2 className="text-3xl sm:text-4xl font-bold mb-8 text-center">
          Squad Leaderboard (Top 10)
        </h2>
        {leaderboard.length === 0 ? (
          <p className="text-lg text-center">No squads yet — be the first!</p>
        ) : (
          <div className="space-y-4">
            {leaderboard.map((entry, index) => (
              <div key={entry.id} className="flex flex-col sm:flex-row justify-between items-center p-4 border-b-2 border-black bg-gray-50">
                <p className="text-lg sm:text-xl font-bold">
                  {index + 1}. {entry.email}
                </p>
                <p className="text-lg mt-2 sm:mt-0">
                  ({entry.squad_size} members)
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}