import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Jesse Boone Basketball Career | Seeley-Swan Blackhawks & Valley Christian Eagles | Montana Basketball',
  description: 'Complete basketball career archive of Jesse Boone from Seeley Lake, Montana. Seeley-Swan Blackhawks #32 (1996-97): District 13-C scoring leader at 17.6 PPG, All-State, All-Conference First Team, upset #1 Loyola and #1 Scobey at State Tournament. Valley Christian Eagles Head Coach (2020-21): started 7-0, first District 13C title in 20+ years, two players signed college scholarships. Newspaper clippings from The Missoulian, Billings Gazette, Great Falls Tribune.',
  keywords: [
    'Jesse Boone', 'Jesse Boone basketball', 'Jesse Boone Seeley-Swan',
    'Seeley-Swan Blackhawks', 'Seeley-Swan basketball', 'Seeley Lake basketball',
    'Montana Class C basketball', 'Montana high school basketball 1997',
    'District 13-C basketball', '1997 State Tournament Montana',
    'Scobey upset 1997', 'Kim Haines 500 wins', 'Kim Haines Seeley-Swan',
    'Valley Christian Eagles basketball', 'Valley Christian Eagles Missoula',
    'Jesse Boone coach', 'Jesse Boone Valley Christian',
    'Missoula basketball', 'Missoula County basketball 1997',
    'Seeley-Swan High School', 'All-State Montana basketball',
    'Cliff Nelson Seeley Lake', 'Billy Boone basketball',
    'Brennan Cox Valley Christian', 'Yellowstone Christian College basketball',
    'Matt Schneiter Seeley-Swan', 'Mike Larson Seeley-Swan',
    'Pat Morin Seeley-Swan', 'Abe Kats Seeley-Swan',
  ],
  openGraph: {
    title: 'Jesse Boone Basketball Career | Seeley-Swan & Valley Christian | Montana',
    description: 'Player: Seeley-Swan Blackhawks #32, 17.6 PPG, All-State, State Tournament. Coach: Valley Christian Eagles, 7-0 start, District 13C champions.',
    type: 'profile',
    url: 'https://app.localhustle.org/jesse-boone-basketball',
  },
  alternates: {
    canonical: 'https://app.localhustle.org/jesse-boone-basketball',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
}

// JSON-LD structured data for Google
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'Jesse Boone',
  description: 'Montana basketball player and coach. Seeley-Swan Blackhawks #32 (1996-97), District 13-C scoring leader, All-State. Valley Christian Eagles Head Coach (2020-21).',
  birthPlace: {
    '@type': 'Place',
    name: 'Seeley Lake, Montana',
  },
  alumniOf: [
    {
      '@type': 'HighSchool',
      name: 'Seeley-Swan High School',
      address: { '@type': 'PostalAddress', addressLocality: 'Seeley Lake', addressRegion: 'MT' },
    },
  ],
  sport: 'Basketball',
  award: [
    'District 13-C All-Conference First Team (1997)',
    'Montana All-State Basketball (1997)',
    'District 13-C Scoring Leader - 17.6 PPG (1997)',
    'Academic All-State (1997)',
  ],
  knowsAbout: ['Basketball coaching', 'Montana high school basketball', 'Youth basketball development'],
  url: 'https://app.localhustle.org/jesse-boone-basketball',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </>
  )
}
