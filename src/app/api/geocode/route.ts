// src/app/api/geocode/route.ts
import { NextResponse } from 'next/server'

const GOOGLE_GEOCODE_API_KEY = process.env.GOOGLE_GEOCODE_API_KEY

if (!GOOGLE_GEOCODE_API_KEY) {
  console.error('GOOGLE_GEOCODE_API_KEY is missing in environment variables')
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { address } = body

    if (!address || typeof address !== 'string' || address.trim() === '') {
      return NextResponse.json(
        { error: 'Valid address is required' },
        { status: 400 }
      )
    }

    const encodedAddress = encodeURIComponent(address.trim())
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${GOOGLE_GEOCODE_API_KEY}`

    const response = await fetch(url)
    const data = await response.json()

    if (!response.ok) {
      console.error('Google Geocode API error:', data)
      return NextResponse.json(
        { error: `Geocode service error: ${data.error_message || response.statusText}` },
        { status: response.status }
      )
    }

    if (data.status !== 'OK' || !data.results?.length) {
      return NextResponse.json(
        { error: `No results found for address: ${address}` },
        { status: 404 }
      )
    }

    const result = data.results[0]
    const { lat, lng } = result.geometry.location

    // Extract zip code if available
    const zipComponent = result.address_components?.find((comp: any) =>
      comp.types.includes('postal_code')
    )
    const zip = zipComponent?.long_name || null

    return NextResponse.json({
      lat,
      lng,
      zip,
      formatted_address: result.formatted_address,
      place_id: result.place_id,
    })
  } catch (error) {
    console.error('Geocode API error:', error)
    return NextResponse.json(
      { error: 'Internal server error during geocoding' },
      { status: 500 }
    )
  }
}