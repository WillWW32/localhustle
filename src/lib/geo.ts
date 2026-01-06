import { supabase } from '@/lib/supabaseClient'

export const getGigsInRadius = async (userLat: number, userLng: number, radiusMiles = 60) => {
  // Rough bounding box to reduce data fetched (approx ±60 miles)
  const latDelta = 1.0
  const lngDelta = 1.5

  const { data: allGigs, error } = await supabase
    .from('offers')
    .select('*, businesses(name)')
    .eq('status', 'active')
    .gte('lat', userLat - latDelta)
    .lte('lat', userLat + latDelta)
    .gte('lng', userLng - lngDelta)
    .lte('lng', userLng + lngDelta)

  if (error) {
    console.error('Error fetching gigs for radius:', error)
    return []
  }

  if (!allGigs || allGigs.length === 0) return []

  // Haversine formula...
  const distance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const toRad = (value: number) => (value * Math.PI) / 180
    const R = 3959
    const dLat = toRad(lat2 - lat1)
    const dLon = toRad(lon2 - lon1)
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  const localGigs = allGigs.filter((gig: any) => 
    gig.lat && gig.lng && distance(userLat, userLng, gig.lat, gig.lng) <= radiusMiles
  )

  localGigs.sort((a: any, b: any) => 
    distance(userLat, userLng, a.lat, a.lng) - distance(userLat, userLng, b.lat, b.lng)
  )

  return localGigs
}