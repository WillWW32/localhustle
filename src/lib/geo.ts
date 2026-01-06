export const getGigsInRadius = async (userLat: number, userLng: number, radiusMiles = 60) => {
  // Fetch all active gigs (or limit to reasonable number)
  const { data: allGigs } = await supabase
    .from('offers')
    .select('*, businesses(name)')
    .eq('status', 'active')

  if (!allGigs) return []

  // Haversine formula (distance in miles)
  const distance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const toRad = (value: number) => (value * Math.PI) / 180
    const R = 3959 // Earth's radius in miles
    const dLat = toRad(lat2 - lat1)
    const dLon = toRad(lon2 - lon1)
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  // Filter gigs within radius
  const localGigs = allGigs.filter((gig: any) => 
    gig.lat && gig.lng && distance(userLat, userLng, gig.lat, gig.lng) <= radiusMiles
  )

  // Sort by distance
  localGigs.sort((a: any, b: any) => 
    distance(userLat, userLng, a.lat, a.lng) - distance(userLat, userLng, b.lat, b.lng)
  )

  return localGigs
}