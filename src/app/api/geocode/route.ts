import { NextResponse } from 'next/server'

const GOOGLE_GEOCODE_API_KEY = process.env.GOOGLE_GEOCODE_API_KEY!

export async function POST(request: Request) {
  const { address } = await request.json()

  if (!address) {
    return NextResponse.json({ error: 'Address is required' }, { status: 400 })
  }

  try {
    const encodedAddress = encodeURIComponent(address)
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${GOOGLE_GEOCODE_API_KEY}`

    const response = await fetch(url)
    const data = await response.json()

    if (data.status !== 'OK' || data.results.length === 0) {
      return NextResponse.json({ error: `Geocode failed: ${data.status}` }, { status: 400 })
    }

    const result = data.results[0]
    const { lat, lng } = result.geometry.location

    // Optional: extract zip code
    const zipComponent = result.address_components.find((c: any) => 
      c.types.includes('postal_code')
    )
    const zip = zipComponent?.long_name || null

    return NextResponse.json({
      lat,
      lng,
      zip,
      formatted_address: result.formatted_address,
    })
  } catch (error) {
    console.error('Geocode error:', error)
    return NextResponse.json({ error: 'Geocode service error' }, { status: 500 })
  }
}