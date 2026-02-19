import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
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

export async function POST(request: Request) {
  const { lat, lng, radiusMiles = 60 } = await request.json()

  if (!lat || !lng) {
    return NextResponse.json({ error: 'Lat and Lng required' }, { status: 400 })
  }

  try {
    // Using PostGIS ST_DWithin (if enabled) — or Haversine fallback
    const { data, error } = await supabase
      .from('offers')
      .select('*, businesses(name)')
      .eq('status', 'active')
      .filter('lat', 'gte', lat - 1) // rough box
      .filter('lat', 'lte', lat + 1)
      .filter('lng', 'gte', lng - 1.5)
      .filter('lng', 'lte', lng + 1.5)

    if (error) throw error

    // Client-side exact filter if needed (or use PostGIS)
    const localGigs = data.filter((gig: any) => {
      const distance = haversineDistance(lat, lng, gig.lat, gig.lng)
      return distance <= radiusMiles
    })

    // Sort by distance
    localGigs.sort((a, b) => haversineDistance(lat, lng, a.lat, a.lng) - haversineDistance(lat, lng, b.lat, b.lng))

    return NextResponse.json(localGigs)
  } catch (error) {
    console.error('Local gigs error:', error)
    return NextResponse.json({ error: 'Failed to fetch local gigs' }, { status: 500 })
  }
}