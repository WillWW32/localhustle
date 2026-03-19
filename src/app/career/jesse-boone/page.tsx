import { Metadata } from 'next'
import Image from 'next/image'

export const metadata: Metadata = {
  title: 'Jesse Boone Basketball Career | Seeley-Swan Blackhawks #32 | Class of 1997',
  description:
    'Jesse Boone basketball career archive. Senior center #32 for the Seeley-Swan Blackhawks in Seeley Lake, Montana. District 13-C scoring leader (17.6 PPG), First Team All-Conference, All-State 1997. Led upset of #1 Scobey at State C Tournament. Later head coach at Valley Christian Eagles (2020-2021).',
  keywords: [
    'Jesse Boone basketball',
    'Jesse Boone Seeley-Swan',
    'Jesse Boone Seeley Lake Montana',
    'Seeley-Swan Blackhawks basketball',
    'Seeley-Swan Blackhawks 1997',
    'District 13-C basketball Montana',
    'Montana Class C basketball 1997',
    'State C Tournament 1997',
    'Kim Haines 500 wins',
    'Seeley Lake basketball',
    'Jesse Boone Valley Christian',
    'Valley Christian Eagles basketball coach',
    'Missoula County basketball 1997',
    'Montana high school basketball',
    'Jesse Boone #32',
  ],
  openGraph: {
    title: 'Jesse Boone Basketball Career | Seeley-Swan Blackhawks #32',
    description:
      'Career archive for Jesse Boone, senior center for the Seeley-Swan Blackhawks. District 13-C scoring leader, All-State, State Tournament competitor. Newspaper clippings, photos, and game history from 1993-1997.',
    type: 'profile',
    url: 'https://app.localhustle.org/career/jesse-boone',
    siteName: 'LocalHustle',
    images: [
      {
        url: '/career/jesse-boone/blackhawks-team.jpg',
        width: 800,
        height: 600,
        alt: 'Seeley-Swan Blackhawks basketball team 1996-97',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Jesse Boone Basketball Career | Seeley-Swan Blackhawks #32',
    description:
      'Career archive: District 13-C scoring leader, All-State, upset of #1 Scobey at State. Newspaper clippings and photos from 1993-1997.',
  },
  robots: { index: true, follow: true },
}

interface Clipping {
  title: string
  source: string
  date: string
  description: string
  pdfUrl: string
  highlight?: boolean
}

interface GameResult {
  date: string
  opponent: string
  result: string
  jesseStats: string
  context?: string
}

const clippings: Clipping[] = [
  {
    title: 'Seeley rocks No. 1 Loyola',
    source: 'The Missoulian',
    date: 'February 3, 1996',
    description:
      'District 13-C Blackhawks pull biggest upset of season, stunning #1 ranked Missoula Loyola at the Ram activity center. Jesse Boone drove to the basket and scored the winning field goal with 1.3 seconds left.',
    pdfUrl: '/career/jesse-boone/seeley-rocks-loyola.pdf',
    highlight: true,
  },
  {
    title: 'Blackhawks oust Trojans in 13-C',
    source: 'The Montana Standard (Butte)',
    date: 'February 25, 1996',
    description:
      'Jesse Boone hit two free throws with 2.3 seconds left in overtime to give Seeley-Swan a 56-55 win over Drummond in the consolation game of the District 13-C tournament at Missoula Hellgate.',
    pdfUrl: '/career/jesse-boone/blackhawks-oust-trojans.pdf',
  },
  {
    title: 'Seeley thumps young Eagles',
    source: 'The Missoulian',
    date: 'December 22, 1996',
    description:
      'Seeley-Swan downed Valley Christian 67-53 in District 13-C. Senior center Jesse Boone led the way with 17 points including 9 of 9 free throws.',
    pdfUrl: '/career/jesse-boone/seeley-thumps-eagles.pdf',
  },
  {
    title: 'Haines gets No. 500',
    source: 'The Missoulian',
    date: 'January 12, 1997',
    description:
      'Coach Kim Haines reached 500 career victories as Seeley-Swan hammered Victor 80-44. Jesse Boone led the Blackhawks with 28 points, matching his career high for the second straight night.',
    pdfUrl: '/career/jesse-boone/haines-500.pdf',
    highlight: true,
  },
  {
    title: 'Loyola coach: "Best team we\'ve faced all year"',
    source: 'The Missoulian',
    date: 'January 25, 1997',
    description:
      'Loyola coach Scott Anderson called Seeley-Swan the best team they faced all year. Jesse Boone identified as leading scorer at 17.0 PPG and tallest player at 6-3.',
    pdfUrl: '/career/jesse-boone/loyola-coach-quote.pdf',
  },
  {
    title: 'District 13-C Scoring Leaders',
    source: 'The Missoulian',
    date: 'February 6, 1997',
    description:
      'Jesse Boone ranked #1 in District 13-C scoring with 229 points in 13 games for a 17.6 average. Teammate Matt Schneiter also in the top 5 with 14.8 PPG.',
    pdfUrl: '/career/jesse-boone/scoring-leaders.pdf',
    highlight: true,
  },
  {
    title: 'Players to Watch: District Tournament Preview',
    source: 'The Missoulian',
    date: 'February 26, 1997',
    description:
      'Seeley-Swan featured the best 1-2 punch in District 13-C with 6-3 center Jesse Boone and 6-0 guard Matt Schneiter. The pair combined to average 34 points per game.',
    pdfUrl: '/career/jesse-boone/players-to-watch.pdf',
  },
  {
    title: 'Seeley claims title over Drummond',
    source: 'The Missoulian',
    date: 'March 2, 1997',
    description:
      'The Blackhawks won the District 13-C Championship 56-52 over Drummond. Jesse Boone contributed 13 points as Seeley-Swan advanced to the Western C Divisional.',
    pdfUrl: '/career/jesse-boone/district-championship.pdf',
    highlight: true,
  },
  {
    title: 'Seeley Swan, Ennis to clash for Western C championship',
    source: 'The Independent-Record (Helena)',
    date: 'March 8, 1997',
    description:
      'Blackhawks staved off Charlo 69-64 to advance to the Western C Championship game. Photo of Jesse Boone reaching for an offensive rebound at Carroll College P.E. Center.',
    pdfUrl: '/career/jesse-boone/western-c-charlo.pdf',
  },
  {
    title: 'Blackhawks stun Scobey at State',
    source: 'The Missoulian / Great Falls Tribune / Billings Gazette',
    date: 'March 14, 1997',
    description:
      'Seeley-Swan stunned top-ranked and defending champion Scobey 52-51 in overtime in the first round of the State C Tournament at MetraPark in Billings. Jesse Boone scored 17 points. The story made the front page of the Great Falls Tribune.',
    pdfUrl: '/career/jesse-boone/blackhawks-stun-scobey.pdf',
    highlight: true,
  },
  {
    title: 'Great Falls Tribune Front Page',
    source: 'Great Falls Tribune',
    date: 'March 15, 1997',
    description:
      'Jesse Boone and the Blackhawks featured in a front-page photo from the State C Tournament in Billings, with action shot of the Cascade game.',
    pdfUrl: '/career/jesse-boone/gf-tribune-front-page.pdf',
  },
  {
    title: 'District 13-C First Team All-Conference',
    source: 'The Missoulian / Montana Standard',
    date: 'March 19-21, 1997',
    description:
      'Jesse Boone named to the District 13-C First Team All-Conference, selected by conference coaches. Teammates Matt Schneiter and Mike Larson also named First Team.',
    pdfUrl: '/career/jesse-boone/all-conference.pdf',
    highlight: true,
  },
]

const keyGames: GameResult[] = [
  {
    date: 'Feb 3, 1996',
    opponent: '#1 Missoula Loyola',
    result: 'W (Upset)',
    jesseStats: 'Game-winning basket, 1.3 sec left',
    context: 'Biggest upset of the season in Montana Class C',
  },
  {
    date: 'Feb 25, 1996',
    opponent: 'Drummond (District 13-C)',
    result: 'W 56-55 OT',
    jesseStats: '11 pts, clutch FTs with 2.3 sec left',
    context: 'District consolation game',
  },
  {
    date: 'Dec 22, 1996',
    opponent: 'Valley Christian',
    result: 'W 67-53',
    jesseStats: '17 pts, 9-9 FT',
    context: 'District 13-C',
  },
  {
    date: 'Jan 11, 1997',
    opponent: 'Victor',
    result: 'W 80-44',
    jesseStats: '28 pts (career high)',
    context: 'Coach Haines\' 500th career win',
  },
  {
    date: 'Mar 2, 1997',
    opponent: 'Drummond',
    result: 'W 56-52',
    jesseStats: '13 pts',
    context: 'District 13-C Championship',
  },
  {
    date: 'Mar 7, 1997',
    opponent: 'Charlo',
    result: 'W 69-64',
    jesseStats: 'Key rebounds',
    context: 'Western C Divisional Semifinal',
  },
  {
    date: 'Mar 14, 1997',
    opponent: '#1 Scobey',
    result: 'W 52-51 OT',
    jesseStats: '17 pts',
    context: 'State C Tournament, MetraPark, Billings',
  },
]

export default function JesseBooneCareerPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Jesse Boone',
    description:
      'Basketball player and coach from Seeley Lake, Montana. Senior center #32 for the Seeley-Swan Blackhawks (Class of 1997). District 13-C scoring leader, First Team All-Conference, All-State. Later head coach at Valley Christian Eagles.',
    url: 'https://app.localhustle.org/career/jesse-boone',
    birthPlace: {
      '@type': 'Place',
      name: 'Seeley Lake, Montana',
    },
    height: '6\'3"',
    memberOf: [
      {
        '@type': 'SportsTeam',
        name: 'Seeley-Swan Blackhawks Basketball',
        sport: 'Basketball',
      },
      {
        '@type': 'SportsTeam',
        name: 'Valley Christian Eagles Basketball',
        sport: 'Basketball',
      },
    ],
    additionalType: 'https://schema.org/Athlete',
    jobTitle: 'Center #32 - Class of 1997 / Head Coach',
    knowsAbout: ['Basketball', 'Center', 'Coaching'],
    alumniOf: {
      '@type': 'HighSchool',
      name: 'Seeley-Swan High School',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Seeley Lake',
        addressRegion: 'Montana',
      },
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hidden SEO content for crawlers */}
      <div style={{ display: 'none' }} aria-hidden="true">
        <h1>Jesse Boone - Basketball Career Archive</h1>
        <p>Senior Center #32, Seeley-Swan Blackhawks, Seeley Lake, Montana, Class of 1997</p>
        <p>District 13-C scoring leader 17.6 PPG. First Team All-Conference. All-State. State C Tournament.</p>
        <p>Coach Kim Haines. 500th win. Upset of #1 Loyola 1996. Upset of #1 Scobey at State 1997.</p>
        <p>Head Coach, Valley Christian Eagles, Missoula, Montana, 2020-2021. Started 6-0. Front page Missoulian.</p>
        <p>Missoula County basketball. Montana high school basketball history.</p>
      </div>

      <div className="min-h-screen bg-gray-950 text-white">
        {/* Hero */}
        <div className="relative bg-gradient-to-b from-gray-900 to-gray-950 border-b border-gray-800">
          <div className="max-w-5xl mx-auto px-4 py-16 sm:py-24">
            <div className="text-center">
              <p className="text-amber-500 font-medium tracking-widest uppercase text-sm mb-3">
                Basketball Career Archive
              </p>
              <h1 className="text-4xl sm:text-6xl font-bold mb-4">
                Jesse Boone
              </h1>
              <p className="text-xl sm:text-2xl text-gray-300 mb-2">
                Senior Center #32 | Seeley-Swan Blackhawks
              </p>
              <p className="text-gray-400 text-lg">
                Seeley Lake, Montana | Class of 1997
              </p>
              <div className="flex flex-wrap justify-center gap-3 mt-8">
                <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 px-4 py-1.5 rounded-full text-sm font-medium">
                  District 13-C Scoring Leader
                </span>
                <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 px-4 py-1.5 rounded-full text-sm font-medium">
                  First Team All-Conference
                </span>
                <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 px-4 py-1.5 rounded-full text-sm font-medium">
                  All-State 1997
                </span>
                <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 px-4 py-1.5 rounded-full text-sm font-medium">
                  State C Tournament
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="bg-gray-900/50 border-b border-gray-800">
          <div className="max-w-5xl mx-auto px-4 py-8">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
              <div>
                <p className="text-3xl font-bold text-amber-400">17.6</p>
                <p className="text-gray-400 text-sm mt-1">PPG (District Leader)</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-amber-400">28</p>
                <p className="text-gray-400 text-sm mt-1">Career High Points</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-amber-400">6&apos;3&quot;</p>
                <p className="text-gray-400 text-sm mt-1">Height (Center)</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-amber-400">#32</p>
                <p className="text-gray-400 text-sm mt-1">Jersey Number</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-12">
          {/* Team Photo */}
          <section className="mb-16">
            <div className="relative aspect-[16/10] sm:aspect-[16/8] rounded-xl overflow-hidden border border-gray-800">
              <Image
                src="/career/jesse-boone/blackhawks-team.jpg"
                alt="1996-97 Seeley-Swan Blackhawks basketball team photo"
                fill
                className="object-cover"
                priority
              />
            </div>
            <p className="text-center text-gray-400 text-sm mt-3">
              The 1996-97 Seeley-Swan Blackhawks | District 13-C Champions | State C Tournament Qualifiers
            </p>
          </section>

          {/* Playing Career */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold mb-2 flex items-center gap-3">
              <span className="w-8 h-0.5 bg-amber-500" />
              Playing Career (1993-1997)
            </h2>
            <p className="text-gray-400 mb-8 ml-11">
              Seeley-Swan Blackhawks | Coach Kim Haines | District 13-C, Class C Montana
            </p>

            <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-6 mb-8">
              <h3 className="text-lg font-semibold text-amber-400 mb-4">Senior Season Highlights (1996-97)</h3>
              <div className="grid sm:grid-cols-2 gap-4 text-gray-300">
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500 mt-1">&#8226;</span>
                    <span>#1 scorer in District 13-C with 17.6 PPG (229 pts / 13 games)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500 mt-1">&#8226;</span>
                    <span>Career high 28 points (twice) including Coach Haines&apos; 500th career win</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500 mt-1">&#8226;</span>
                    <span>District 13-C First Team All-Conference (selected by coaches)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500 mt-1">&#8226;</span>
                    <span>All-State Honors, Seeley-Swan High School</span>
                  </li>
                </ul>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500 mt-1">&#8226;</span>
                    <span>District 13-C Champions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500 mt-1">&#8226;</span>
                    <span>Western C Divisional qualifier (Carroll College, Helena)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500 mt-1">&#8226;</span>
                    <span>State C Tournament qualifier (MetraPark, Billings)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500 mt-1">&#8226;</span>
                    <span>Upset of #1 Scobey 52-51 OT at State (front page news)</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Key Games */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <span className="w-8 h-0.5 bg-amber-500" />
              Notable Games
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-800 text-gray-400 text-sm">
                    <th className="py-3 pr-4">Date</th>
                    <th className="py-3 pr-4">Opponent</th>
                    <th className="py-3 pr-4">Result</th>
                    <th className="py-3 pr-4">Jesse&apos;s Stats</th>
                    <th className="py-3 pr-4 hidden sm:table-cell">Context</th>
                  </tr>
                </thead>
                <tbody>
                  {keyGames.map((game, i) => (
                    <tr key={i} className="border-b border-gray-800/50 text-gray-300 hover:bg-gray-900/30">
                      <td className="py-3 pr-4 text-sm whitespace-nowrap">{game.date}</td>
                      <td className="py-3 pr-4 font-medium">{game.opponent}</td>
                      <td className="py-3 pr-4 text-green-400 font-medium">{game.result}</td>
                      <td className="py-3 pr-4 text-amber-300">{game.jesseStats}</td>
                      <td className="py-3 pr-4 text-gray-500 text-sm hidden sm:table-cell">{game.context}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Awards Photo */}
          <section className="mb-16">
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="relative aspect-[4/3] rounded-xl overflow-hidden border border-gray-800">
                <Image
                  src="/career/jesse-boone/allstate-award.jpg"
                  alt="Jesse Boone All-State award certificate from Seeley-Swan High School with varsity photo"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex flex-col justify-center">
                <h3 className="text-xl font-bold mb-3">All-State Honors</h3>
                <p className="text-gray-400">
                  Seeley-Swan High School honors certificate recognizing Jesse Boone for
                  All-Conference, All-State, Conference scoring leader, All-State Tournament team,
                  and Senior Class President. Pictured in his #32 Blackhawks jersey.
                </p>
              </div>
            </div>
          </section>

          {/* Newspaper Clippings Timeline */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
              <span className="w-8 h-0.5 bg-amber-500" />
              Newspaper Clippings Archive
            </h2>

            <div className="space-y-6">
              {clippings.map((clip, i) => (
                <a
                  key={i}
                  href={clip.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`block rounded-xl border p-6 transition-all hover:border-amber-500/50 hover:bg-gray-900/50 ${
                    clip.highlight
                      ? 'border-amber-500/30 bg-amber-500/5'
                      : 'border-gray-800 bg-gray-900/30'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {clip.highlight && (
                          <span className="text-amber-500 text-xs font-bold uppercase tracking-wider">
                            Key Moment
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-1">
                        {clip.title}
                      </h3>
                      <p className="text-gray-500 text-sm mb-2">
                        {clip.source} | {clip.date}
                      </p>
                      <p className="text-gray-400 text-sm leading-relaxed">
                        {clip.description}
                      </p>
                    </div>
                    <div className="flex-shrink-0 text-gray-600">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </section>

          {/* Youth */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <span className="w-8 h-0.5 bg-amber-500" />
              Early Years
            </h2>
            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <div className="relative aspect-[4/3] rounded-xl overflow-hidden border border-gray-800">
                  <Image
                    src="/career/jesse-boone/youth-team.jpg"
                    alt="Seeley Lake youth basketball team with young Jesse Boone"
                    fill
                    className="object-cover"
                  />
                </div>
                <p className="text-gray-400 text-sm mt-3">
                  Seeley Lake youth basketball. Where it all started.
                </p>
              </div>
              <div className="flex flex-col justify-center">
                <p className="text-gray-300 leading-relaxed">
                  Jesse grew up in Seeley Lake, Montana, playing basketball from a young age in the
                  small mountain community. The Seeley Lake youth program fed directly into the
                  Seeley-Swan Blackhawks varsity program under legendary coach Kim Haines,
                  who coached at Seeley-Swan for 33 seasons and compiled over 500 wins.
                </p>
              </div>
            </div>
          </section>

          {/* Coaching Career */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold mb-2 flex items-center gap-3">
              <span className="w-8 h-0.5 bg-amber-500" />
              Coaching Career (2020-2021)
            </h2>
            <p className="text-gray-400 mb-8 ml-11">
              Valley Christian Eagles | Missoula, Montana | Head Coach
            </p>

            <div className="grid sm:grid-cols-3 gap-6 mb-8">
              <div className="relative aspect-[3/4] rounded-xl overflow-hidden border border-gray-800">
                <Image
                  src="/career/jesse-boone/coach.png"
                  alt="Coach Jesse Boone with basketballs in the Valley Christian gym"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="relative aspect-[4/3] sm:aspect-[3/4] rounded-xl overflow-hidden border border-gray-800">
                <Image
                  src="/career/jesse-boone/new-coach.jpg"
                  alt="Missoulian newspaper article: New Eagles coach has deep ties, about Jesse Boone taking over Valley Christian program"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="relative aspect-[4/3] sm:aspect-[3/4] rounded-xl overflow-hidden border border-gray-800">
                <Image
                  src="/career/jesse-boone/still-undefeated.jpg"
                  alt="Missoulian front page: Still undefeated, Valley Christian moves to 6-0 under Coach Boone"
                  fill
                  className="object-cover"
                />
              </div>
            </div>

            <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-6 mb-6">
              <h3 className="text-lg font-semibold text-amber-400 mb-4">Valley Christian Eagles</h3>
              <div className="text-gray-300 space-y-3">
                <p>
                  In 2020, Jesse returned to the game as head coach of the Valley Christian Eagles
                  in Missoula, taking over a program with deep ties to his playing career. As a senior
                  at Seeley-Swan, one of his biggest games was a 67-53 win over Valley Christian.
                  Two decades later, he was leading their program.
                </p>
                <p>
                  The Eagles started the 2020-21 season 6-0, earning front-page coverage in the
                  Missoulian and a feature in the sports section about the program&apos;s resurgence.
                </p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              <div className="relative aspect-[16/10] rounded-xl overflow-hidden border border-gray-800">
                <Image
                  src="/career/jesse-boone/starting-to-soar.jpg"
                  alt="Missoulian Sports page: Starting to soar, Valley Christian basketball feature"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="relative aspect-[16/10] rounded-xl overflow-hidden border border-gray-800">
                <Image
                  src="/career/jesse-boone/eagles-team.jpg"
                  alt="Valley Christian Eagles basketball team with Coach Jesse Boone holding trophy"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
            <p className="text-center text-gray-400 text-sm mt-3">
              Valley Christian Eagles 2020-21 | Coach Jesse Boone (far left)
            </p>
          </section>

          {/* Footer */}
          <section className="border-t border-gray-800 pt-12 text-center">
            <p className="text-gray-500 text-sm">
              Career archive maintained on{' '}
              <a href="https://app.localhustle.org" className="text-amber-500 hover:text-amber-400">
                LocalHustle
              </a>
              . Newspaper clippings sourced from Newspapers.com via Ancestry.
            </p>
            <p className="text-gray-600 text-xs mt-2">
              The Missoulian | Great Falls Tribune | Billings Gazette | Montana Standard | Independent-Record
            </p>
          </section>
        </div>
      </div>
    </>
  )
}
