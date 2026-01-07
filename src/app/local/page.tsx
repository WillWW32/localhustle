'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'

export default function LocalPortal() {
  const [featuredAthletes, setFeaturedAthletes] = useState<any[]>([])
  const [featuredBusinesses, setFeaturedBusinesses] = useState<any[]>([])
  const [favoritedAthleteIds, setFavoritedAthleteIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    const fetchData = async () => {
      // Get current user (business/parent) for favorites
      const { data: { user } } = await supabase.auth.getUser()
      let currentFunderId = null

      if (user) {
        const { data: funder } = await supabase
          .from('businesses')
          .select('id')
          .eq('owner_id', user.id)
          .single()

        currentFunderId = funder?.id || null

        // Load favorites if logged in
        if (currentFunderId) {
          const { data: favorites } = await supabase
            .from('favorites')
            .select('athlete_id')
            .eq('funder_id', currentFunderId)

          if (favorites) {
            setFavoritedAthleteIds(new Set(favorites.map(f => f.athlete_id)))
          }
        }
      }

      // Featured Athletes (gig_count > 0, most active first)
      const { data: athletes } = await supabase
        .from('profiles')
        .select('id, full_name, school, gig_count, profile_pic')
        .gt('gig_count', 0)
        .order('gig_count', { ascending: false })
        .limit(20)

      setFeaturedAthletes(athletes || [])

      // Featured Businesses (active sponsors)
      const { data: businesses } = await supabase
        .from('businesses')
        .select('id, name, description')
        .neq('name', '')
        .limit(20)

      setFeaturedBusinesses(businesses || [])
    }

    fetchData()
  }, [])

  const handleFavorite = async (athleteId: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      alert('Log in to favorite athletes')
      return
    }

    const { data: funder } = await supabase
      .from('businesses')
      .select('id')
      .eq('owner_id', user.id)
      .single()

    if (!funder) return

    const isFavorited = favoritedAthleteIds.has(athleteId)

    if (isFavorited) {
      await supabase
        .from('favorites')
        .delete()
        .eq('funder_id', funder.id)
        .eq('athlete_id', athleteId)
      setFavoritedAthleteIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(athleteId)
        return newSet
      })
    } else {
      await supabase
        .from('favorites')
        .insert({ funder_id: funder.id, athlete_id: athleteId })
      setFavoritedAthleteIds(prev => new Set(prev).add(athleteId))
    }
  }

  return (
    <div className="container py-8 font-mono">
      <h1 className="text-5xl font-bold text-center mb-16">Local Hustle Leaders</h1>

      <section className="mb-32">
        <h2 className="text-4xl font-bold text-center mb-12">Featured Athletes</h2>
        {featuredAthletes.length === 0 ? (
          <p className="text-xl text-center text-gray-600">No active athletes yet — be the first!</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-12 max-w-7xl mx-auto">
            {featuredAthletes.map((athlete) => (
              <div key={athlete.id} className="bg-white p-10 border-4 border-black rounded-lg shadow-2xl text-center">
                <img 
                  src={athlete.profile_pic || '/default-avatar.png'} 
                  alt={athlete.full_name}
                  className="w-40 h-40 rounded-full mx-auto mb-6 object-cover border-4 border-black"
                />
                <h3 className="text-2xl font-bold mb-2">{athlete.full_name}</h3>
                <p className="text-lg mb-4 text-gray-600">{athlete.school}</p>
                <p className="text-3xl font-bold text-green-600 mb-8">{athlete.gig_count} Gigs Completed</p>
                <Button
                  onClick={() => handleFavorite(athlete.id)}
                  className={`w-full h-16 text-xl font-bold ${
                    favoritedAthleteIds.has(athlete.id) 
                      ? 'bg-black text-white' 
                      : 'bg-white text-black border-4 border-black'
                  }`}
                >
                  {favoritedAthleteIds.has(athlete.id) ? '★ Favorited' : '☆ Favorite Athlete'}
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-4xl font-bold text-center mb-12">Featured Sponsors</h2>
        {featuredBusinesses.length === 0 ? (
          <p className="text-xl text-center text-gray-600">No sponsors yet — be the first!</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 max-w-6xl mx-auto">
            {featuredBusinesses.map((business) => (
              <div key={business.id} className="bg-gray-100 p-12 border-4 border-black rounded-lg text-center">
                <h3 className="text-3xl font-bold mb-6">{business.name}</h3>
                <p className="text-xl">{business.description || 'Supporting local athletes'}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}