'use client'

import { useState } from 'react'

const STORAGE_BASE = 'https://xwmmqbnhyrtguswiplaw.supabase.co/storage/v1/object/public/profile-pics/bball-career'

interface TimelineEntry {
  date: string
  headline: string
  description: string
  source?: string
  image?: string
  clipping?: string
  stats?: string
  era: 'youth' | 'highschool' | 'college' | 'coaching'
}

const timeline: TimelineEntry[] = [
  // Youth
  {
    date: '1990-1993',
    headline: 'Seeley Lake Youth Basketball',
    description: 'Grew up playing basketball in Seeley Lake, Montana under Coach Cliff Nelson. Nelson\'s coaching and mentorship laid the foundation for everything that followed.',
    image: `${STORAGE_BASE}/nelson1.jpg`,
    era: 'youth',
  },
  {
    date: '1993',
    headline: 'Seeley Lake Youth Team',
    description: 'Playing on the Seeley Lake youth squad. The small-town roots and tight-knit community forged a group of players who would go on to make history together at Seeley-Swan High School.',
    image: `${STORAGE_BASE}/nelson2.jpg`,
    era: 'youth',
  },
  // High School
  {
    date: '1995-96',
    headline: 'Seeley-Swan Blackhawks Varsity',
    description: 'Joined the varsity squad for Coach Kim Haines at Seeley-Swan High School. The Blackhawks competed in District 13-C against Drummond, Valley Christian, Victor, Lincoln, Alberton, and Philipsburg.',
    image: `${STORAGE_BASE}/blackhawk.jpg`,
    era: 'highschool',
  },
  {
    date: 'Feb 3, 1996',
    headline: 'Seeley Rocks #1 Loyola',
    description: 'District 13-C Blackhawks pulled the biggest upset of the season, stunning top-ranked Missoula Loyola 86-84 at the Ram activity center. Jesse Boone drove to the basket and scored the winning field goal with 1.3 seconds left.',
    source: 'The Missoulian',
    clipping: `${STORAGE_BASE}/clipping_65303332.pdf`,
    era: 'highschool',
  },
  {
    date: 'Feb 25, 1996',
    headline: 'Blackhawks Oust Trojans in 13-C',
    description: 'Jesse Boone\'s two free throws with 2.8 seconds left in overtime gave Seeley-Swan a 56-55 win over Drummond in the consolation game of the District 13-C tournament at Missoula Hellgate. Boone tallied 11 points.',
    source: 'The Montana Standard (Butte)',
    clipping: `${STORAGE_BASE}/clipping_65302849.pdf`,
    era: 'highschool',
  },
  {
    date: 'Dec 22, 1996',
    headline: 'Seeley Thumps Young Eagles',
    description: 'Seeley-Swan downed Valley Christian 67-53 in a District 13-C contest. Senior center Jesse Boone led the way with 17 points including 9 of 9 free throws. Senior Mike Larson added 16.',
    source: 'The Missoulian',
    clipping: `${STORAGE_BASE}/clipping_65303003.pdf`,
    era: 'highschool',
  },
  {
    date: 'Jan 12, 1997',
    headline: 'Haines Gets No. 500',
    description: 'Coach Kim Haines\' 500th victory turned out to be one of his easiest. Seeley-Swan hammered District 13-C Victor 80-44. Senior center Jesse Boone led the Blackhawks with 28 points, matching his career high for the second straight night.',
    source: 'The Missoulian',
    clipping: `${STORAGE_BASE}/clipping_65304894.pdf`,
    stats: '28 pts, 14 pts first half',
    era: 'highschool',
  },
  {
    date: 'Jan 25, 1997',
    headline: 'Players to Watch: District 13-C Preview',
    description: 'Seeley-Swan features the best 1-2 punch in the district in 6-3 center Jesse Boone and 6-0 guard Matt Schneiter. The pair combine to average 34 points per game and give the Blackhawks a deadly inside-out game. Loyola coach: "That\'s the best team we\'ve faced all year."',
    source: 'The Missoulian',
    clipping: `${STORAGE_BASE}/clipping_65305862.pdf`,
    era: 'highschool',
  },
  {
    date: 'Feb 6, 1997',
    headline: 'District 13-C Scoring Leader',
    description: 'Jesse Boone, Seeley-Swan -- 13 games, 229 total points, 17.6 points per game average. Led all District 13-C scorers.',
    source: 'The Missoulian',
    clipping: `${STORAGE_BASE}/clipping_65305099.pdf`,
    stats: '17.6 PPG | 229 PTS | 13 GP',
    era: 'highschool',
  },
  {
    date: 'Feb 26, 1997',
    headline: 'District 13-C Tournament Preview',
    description: 'Players to watch: Seeley-Swan features the best 1-2 punch in the district in 6-3 center Jesse Boone and 6-0 guard Matt Schneiter. Seeley-Swan enters 13-5.',
    source: 'The Missoulian',
    clipping: `${STORAGE_BASE}/clipping_65305971.pdf`,
    era: 'highschool',
  },
  {
    date: 'Mar 2, 1997',
    headline: 'Seeley Claims District 13-C Title Over Drummond',
    description: 'Like a trustworthy car running on empty, Seeley-Swan had just enough left in the tank to get home. Seeley rallied in the final period to claim the District 13-C championship with a 56-52 win over Drummond. Morin and Schneiter each had 15 points to lead Seeley, while Jesse Boone added 13.',
    source: 'The Missoulian',
    clipping: `${STORAGE_BASE}/clipping_65304824.pdf`,
    image: `${STORAGE_BASE}/clipping_65304824.pdf`,
    era: 'highschool',
  },
  {
    date: 'Mar 8, 1997',
    headline: 'Seeley Swan, Ennis to Clash for Western C Championship',
    description: 'Blackhawks stave off Charlo 69-64 to advance to the Western C Divisional championship game at Carroll College PE Center in Helena. Senior Mike Larson led the Blackhawks with 11 rebounds.',
    source: 'The Independent-Record (Helena)',
    clipping: `${STORAGE_BASE}/clipping_65304144.pdf`,
    era: 'highschool',
  },
  {
    date: 'Mar 14, 1997',
    headline: 'Blackhawks Stun Top-Ranked Scobey at State',
    description: 'Seems like every 30 state tournaments, Seeley-Swan rises up and smacks an unbeaten. Jesse Boone scored 17 points and Matt Schneiter added 11 as the Blackhawks upset top-ranked and defending champion Scobey 52-51 in overtime in the first round of the State Class C tourney at MetraPark in Billings.',
    source: 'The Missoulian / Billings Gazette',
    clipping: `${STORAGE_BASE}/clipping_65305214.pdf`,
    stats: '17 PTS vs #1 Scobey',
    era: 'highschool',
  },
  {
    date: 'Mar 15, 1997',
    headline: 'Front Page: Great Falls Tribune',
    description: 'Jesse Boone and the Seeley-Swan Blackhawks featured on the front page of the Great Falls Tribune during the State Class C tournament. Photo shows Boone battling Cascade defenders for a rebound.',
    source: 'Great Falls Tribune - Front Page',
    clipping: `${STORAGE_BASE}/clipping_65305484.pdf`,
    era: 'highschool',
  },
  {
    date: 'Mar 16, 1997',
    headline: 'State Tournament Action Photo',
    description: 'Scobey\'s Spencer Fredrick denies Seeley-Swan\'s Jesse Boone the ball during the State C consolation game.',
    source: 'The Billings Gazette',
    clipping: `${STORAGE_BASE}/clipping_65305277.pdf`,
    era: 'highschool',
  },
  {
    date: 'Mar 19, 1997',
    headline: '13-C All-Conference First Team',
    description: 'Jesse Boone named to the District 13-C All-Conference First Team alongside teammates Matt Schneiter and Mike Larson. Three Seeley-Swan players on the first team.',
    source: 'The Missoulian / Montana Standard',
    clipping: `${STORAGE_BASE}/clipping_65305912.pdf`,
    era: 'highschool',
  },
  {
    date: 'May 15, 1997',
    headline: 'All-State Honors & Graduation',
    description: 'Jesse Boone awarded the Seeley-Swan High School emblem in recognition of honors attained: Newspaper Staff, Honor Roll, All-Conference, All-State Basketball, Student Council President, Senior Class President, Academic All-State.',
    image: `${STORAGE_BASE}/allstate.jpg`,
    era: 'highschool',
  },
  // Coaching
  {
    date: 'Jan 7, 2021',
    headline: 'New Eagles Coach Has Deep Ties',
    description: 'A Seeley-Swan alum, Jesse Boone excited to take over Valley Christian program. It\'s been more than 20 years since Boone was on the Seeley-Swan boys basketball team that made the 1996 Class C state semifinals following head coach Cliff Nelson\'s tragic and unsolved murder. That sticks with him, motivating him now as it did then.',
    source: 'The Missoulian - Sports Section Front Page',
    image: `${STORAGE_BASE}/New-coach.jpg`,
    era: 'coaching',
  },
  {
    date: 'Jan 2021',
    headline: 'Coach Boone on the Court',
    description: 'First season as head coach of the Valley Christian Eagles boys basketball program. Returned to Montana from Cleveland, Ohio where he ran Three Birds Studio with his wife.',
    image: `${STORAGE_BASE}/coach.png`,
    era: 'coaching',
  },
  {
    date: 'Jan 16, 2021',
    headline: 'Still Undefeated - Valley Christian Moves to 6-0',
    description: 'Valley Christian\'s growing maturity shows in 6-0 mark under first-year coach Jesse Boone. Featured on the front page of the Missoulian.',
    source: 'The Missoulian - Front Page',
    image: `${STORAGE_BASE}/undefeated.jpg`,
    era: 'coaching',
  },
  {
    date: 'Jan 16, 2021',
    headline: 'Starting to Soar',
    description: 'Full feature story on Valley Christian\'s impressive start under Coach Boone. Brennan Cox, whose father served in the military, credits Boone\'s coaching style for the team\'s success.',
    source: 'The Missoulian - Sports',
    image: `${STORAGE_BASE}/soar.jpg`,
    era: 'coaching',
  },
  {
    date: 'Feb 21, 2021',
    headline: 'Valley Christian Triumphs Due to Unlikely Hero',
    description: 'Valley Christian wins the District 13-C title game. The Eagles captured their first district championship in over 20 years and advanced through divisionals, pushing for their first state tournament appearance since 1998.',
    source: 'NBC Montana',
    era: 'coaching',
  },
  {
    date: 'Spring 2021',
    headline: '2021 Class C All-Conference Selections',
    description: 'Multiple Valley Christian Eagles earned All-Conference and All-State recognition: Billy Boone, Eyan Becker, Riley Reimer, and Brennan Cox were all selected, reflecting the program\'s breakout year under Coach Boone.',
    source: 'Montana Sports',
    era: 'coaching',
  },
  {
    date: 'May 2021',
    headline: 'Signing Day: Eagles Head to College',
    description: 'Two Valley Christian players signed to play college basketball at Yellowstone Christian College: center Billy Boone (Jesse\'s son) and guard Brennan Cox. Coach Boone highlighted the long-term impact, showing younger athletes that college basketball was possible if they bought in.',
    source: 'NBC Montana',
    era: 'coaching',
  },
  {
    date: '2020-2021',
    headline: 'Valley Christian Eagles Varsity',
    description: 'The Valley Christian Eagles varsity squad with Coach Boone. The team started 7-0, won its first District 13C title in over 20 years, and pushed for its first state tournament appearance since 1998. Two players signed college scholarships afterward.',
    image: `${STORAGE_BASE}/team-varsity-eagles.jpg`,
    era: 'coaching',
  },
]

const eraLabels: Record<string, string> = {
  youth: 'Youth Basketball',
  highschool: 'Seeley-Swan Blackhawks',
  college: 'College',
  coaching: 'Coaching: Valley Christian Eagles',
}

const eraColors: Record<string, string> = {
  youth: '#2d5016',
  highschool: '#1a1a1a',
  college: '#1e3a5f',
  coaching: '#1a472a',
}

export default function JesseBooneBballPage() {
  const [filter, setFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [lightbox, setLightbox] = useState<string | null>(null)

  const filtered = timeline.filter(e => {
    if (filter !== 'all' && e.era !== filter) return false
    if (search) {
      const q = search.toLowerCase()
      return (
        e.headline.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        e.date.toLowerCase().includes(q) ||
        (e.source || '').toLowerCase().includes(q) ||
        (e.stats || '').toLowerCase().includes(q)
      )
    }
    return true
  })

  return (
    <div style={{ minHeight: '100vh', background: '#fafaf8', fontFamily: "'Georgia', 'Times New Roman', serif" }}>
      {/* Hero */}
      <header style={{ background: '#1a1a1a', color: 'white', padding: '3rem 1.5rem', textAlign: 'center' }}>
        <p style={{ fontSize: '0.75rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#999', marginBottom: '0.5rem' }}>Montana Basketball</p>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', fontWeight: 'normal', letterSpacing: '-0.02em' }}>Jesse Boone</h1>
        <p style={{ color: '#ccc', fontSize: '1.1rem', marginBottom: '0.25rem' }}>Seeley-Swan Blackhawks #32 &bull; Valley Christian Eagles Head Coach</p>
        <p style={{ color: '#888', fontSize: '0.875rem' }}>Seeley Lake, Montana &bull; Class of 1997</p>
        <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center', marginTop: '1.5rem', flexWrap: 'wrap' }}>
          <div>
            <p style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#e8c547', marginBottom: '0' }}>17.6</p>
            <p style={{ fontSize: '0.7rem', color: '#999', textTransform: 'uppercase', letterSpacing: '0.1em' }}>PPG Senior Year</p>
          </div>
          <div>
            <p style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#e8c547', marginBottom: '0' }}>All-State</p>
            <p style={{ fontSize: '0.7rem', color: '#999', textTransform: 'uppercase', letterSpacing: '0.1em' }}>1997 Class C</p>
          </div>
          <div>
            <p style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#e8c547', marginBottom: '0' }}>#1 Upset</p>
            <p style={{ fontSize: '0.7rem', color: '#999', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Beat Scobey at State</p>
          </div>
          <div>
            <p style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#e8c547', marginBottom: '0' }}>6-0</p>
            <p style={{ fontSize: '0.7rem', color: '#999', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Eagles Start 2021</p>
          </div>
        </div>
      </header>

      {/* Search & Filter */}
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '1.5rem 1.5rem 0' }}>
        <input
          type="text"
          placeholder="Search games, articles, stats..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #ddd', borderRadius: '8px', fontSize: '1rem', fontFamily: 'inherit', marginBottom: '1rem', background: 'white' }}
        />
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
          {['all', 'youth', 'highschool', 'coaching'].map(era => (
            <button
              key={era}
              onClick={() => setFilter(era)}
              style={{
                padding: '0.4rem 1rem',
                borderRadius: '9999px',
                border: filter === era ? '2px solid #1a1a1a' : '1px solid #ccc',
                background: filter === era ? '#1a1a1a' : 'white',
                color: filter === era ? 'white' : '#333',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontFamily: 'inherit',
              }}
            >
              {era === 'all' ? 'All' : eraLabels[era]}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 1.5rem 3rem' }}>
        {filtered.length === 0 && (
          <p style={{ textAlign: 'center', color: '#999', padding: '3rem 0' }}>No results found</p>
        )}
        {filtered.map((entry, i) => {
          const prevEra = i > 0 ? filtered[i - 1].era : null
          const showEraHeader = entry.era !== prevEra

          return (
            <div key={i}>
              {showEraHeader && (
                <div style={{ borderBottom: `3px solid ${eraColors[entry.era]}`, paddingBottom: '0.5rem', marginBottom: '1.5rem', marginTop: i > 0 ? '2.5rem' : '0' }}>
                  <h2 style={{ fontSize: '1.25rem', color: eraColors[entry.era], marginBottom: '0', fontWeight: 'bold' }}>
                    {eraLabels[entry.era]}
                  </h2>
                </div>
              )}
              <div
                style={{
                  display: 'flex',
                  gap: '1.5rem',
                  marginBottom: '2rem',
                  alignItems: 'flex-start',
                  flexDirection: entry.image ? 'row' : 'row',
                  flexWrap: 'wrap',
                }}
              >
                {/* Date */}
                <div style={{ minWidth: '120px', flexShrink: 0 }}>
                  <p style={{ fontSize: '0.8rem', color: '#888', fontFamily: "'Courier New', monospace", marginBottom: '0' }}>{entry.date}</p>
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: '250px' }}>
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', lineHeight: 1.3 }}>{entry.headline}</h3>
                  <p style={{ color: '#555', fontSize: '0.9rem', lineHeight: 1.7, marginBottom: '0.5rem' }}>{entry.description}</p>

                  {entry.stats && (
                    <p style={{ background: '#f0ede4', display: 'inline-block', padding: '0.25rem 0.75rem', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 'bold', color: '#333', fontFamily: "'Courier New', monospace", marginBottom: '0.5rem' }}>
                      {entry.stats}
                    </p>
                  )}

                  {entry.source && (
                    <p style={{ color: '#aaa', fontSize: '0.75rem', fontStyle: 'italic', marginBottom: '0.5rem' }}>
                      Source: {entry.source}
                    </p>
                  )}

                  {entry.clipping && (
                    <a
                      href={entry.clipping}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#1a472a', fontSize: '0.8rem', fontWeight: 'bold', textDecoration: 'none' }}
                    >
                      View Original Clipping &rarr;
                    </a>
                  )}
                </div>

                {/* Image */}
                {entry.image && !entry.image.endsWith('.pdf') && (
                  <div
                    style={{ width: '200px', flexShrink: 0, cursor: 'pointer' }}
                    onClick={() => setLightbox(entry.image!)}
                  >
                    <img
                      src={entry.image}
                      alt={entry.headline}
                      style={{ width: '100%', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                      loading="lazy"
                    />
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            padding: '2rem',
          }}
        >
          <img src={lightbox} alt="Full size" style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: '8px' }} />
        </div>
      )}

      {/* Footer */}
      <footer style={{ borderTop: '1px solid #ddd', padding: '2rem 1.5rem', textAlign: 'center', color: '#999', fontSize: '0.75rem', background: '#f5f5f3' }}>
        <p style={{ marginBottom: '0.25rem' }}>Jesse Boone Basketball Career Archive</p>
        <p style={{ marginBottom: '0.5rem' }}>Seeley Lake, Montana &bull; Newspaper clippings from The Missoulian, Billings Gazette, Great Falls Tribune, Montana Standard, Helena Independent-Record</p>
        <p>Built with <a href="https://app.localhustle.org" style={{ color: '#1a472a' }}>LocalHustle</a></p>
      </footer>
    </div>
  )
}
