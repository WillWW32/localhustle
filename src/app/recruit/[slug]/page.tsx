import { Metadata } from 'next'
import { supabaseAdmin } from '@/lib/supabaseClient'
import ProfileClient from './ProfileClient'

interface PageProps {
  params: Promise<{ slug: string }>
}

async function getAthleteData(slug: string) {
  const { data: profile } = await supabaseAdmin
    .from('athlete_profiles')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!profile) return null

  const { data: athlete } = await supabaseAdmin
    .from('athletes')
    .select('*')
    .eq('id', profile.athlete_id)
    .single()

  if (!athlete) return null

  return { profile, athlete }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const data = await getAthleteData(slug)

  if (!data) {
    return { title: 'Profile Not Found | LocalHustle' }
  }

  const { athlete } = data
  const name = `${athlete.first_name} ${athlete.last_name}`
  const title = `${name} - ${athlete.position || athlete.sport} | ${athlete.high_school} | Class of ${athlete.grad_year}`
  const description = athlete.bio ||
    `${name} is a ${athlete.height || ''} ${athlete.position || ''} from ${athlete.high_school} in ${athlete.city}, ${athlete.state}. Class of ${athlete.grad_year} ${athlete.sport} recruit.`

  return {
    title,
    description,
    keywords: [
      name,
      `${athlete.first_name} ${athlete.last_name} basketball`,
      `${athlete.high_school} ${athlete.sport}`,
      `Class of ${athlete.grad_year} ${athlete.sport} recruit`,
      `${athlete.state} ${athlete.sport} recruit ${athlete.grad_year}`,
      `${athlete.position} ${athlete.state}`,
      `${athlete.city} ${athlete.state} high school ${athlete.sport}`,
    ].filter(Boolean),
    openGraph: {
      title,
      description,
      type: 'profile',
      url: `https://app.localhustle.org/recruit/${slug}`,
      siteName: 'LocalHustle',
      images: athlete.profile_image_url ? [{ url: athlete.profile_image_url, width: 400, height: 400, alt: name }] : [],
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
    robots: {
      index: true,
      follow: true,
    },
  }
}

export default async function PublicAthleteProfilePage({ params }: PageProps) {
  const { slug } = await params
  const data = await getAthleteData(slug)

  // JSON-LD structured data for AI crawlers
  const jsonLd = data ? {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: `${data.athlete.first_name} ${data.athlete.last_name}`,
    alternateName: data.athlete.first_name === 'Josiah' ? 'Siah Boone' : undefined,
    description: data.athlete.bio || '',
    url: `https://app.localhustle.org/recruit/${slug}`,
    image: data.athlete.profile_image_url || undefined,
    birthPlace: {
      '@type': 'Place',
      name: `${data.athlete.city}, ${data.athlete.state}`,
    },
    height: data.athlete.height || undefined,
    weight: data.athlete.weight ? `${data.athlete.weight} lbs` : undefined,
    memberOf: {
      '@type': 'SportsTeam',
      name: `${data.athlete.high_school} ${data.athlete.sport}`,
      sport: data.athlete.sport,
    },
    sameAs: data.athlete.highlight_url ? [data.athlete.highlight_url] : [],
    additionalType: 'https://schema.org/Athlete',
    jobTitle: `${data.athlete.position} - Class of ${data.athlete.grad_year}`,
    knowsAbout: [data.athlete.sport, data.athlete.position].filter(Boolean),
  } : null

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      {/* Server-rendered content for crawlers */}
      {data && (
        <div style={{ display: 'none' }} aria-hidden="true">
          <h1>{data.athlete.first_name} {data.athlete.last_name} - {data.athlete.position} | {data.athlete.high_school}</h1>
          <p>Class of {data.athlete.grad_year} | {data.athlete.city}, {data.athlete.state}</p>
          <p>{data.athlete.height} | {data.athlete.weight} lbs | {data.athlete.sport}</p>
          <p>{data.athlete.bio}</p>
          {data.athlete.stats && Object.entries(data.athlete.stats as Record<string, string>).map(([key, value]) => (
            <span key={key}>{key}: {value} </span>
          ))}
          {(data.profile.achievements as string[] || []).map((a: string, i: number) => (
            <span key={i}>{a} </span>
          ))}
        </div>
      )}
      <ProfileClient slug={slug} />
    </>
  )
}
