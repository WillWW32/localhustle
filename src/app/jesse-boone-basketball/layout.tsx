import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Jesse Boone Basketball Career | Seeley-Swan Blackhawks & Valley Christian Eagles | Montana Basketball',
  description: 'Complete basketball career archive of Jesse Boone. Seeley-Swan Blackhawks #32 (1996-97), District 13-C scoring leader (17.6 PPG), All-State, upset #1 Scobey at State. Valley Christian Eagles Head Coach (2020-21), started 6-0 undefeated. Seeley Lake, Missoula, Montana.',
  keywords: [
    'Jesse Boone', 'Seeley-Swan Blackhawks', 'Seeley Lake basketball', 'Montana Class C basketball',
    'District 13-C', '1997 State Tournament', 'Scobey upset', 'Kim Haines 500 wins',
    'Valley Christian Eagles', 'Missoula basketball', 'Montana high school basketball',
    'Seeley-Swan High School', 'All-State Montana', 'Cliff Nelson basketball',
  ],
  openGraph: {
    title: 'Jesse Boone Basketball Career | Montana Basketball',
    description: 'Seeley-Swan Blackhawks #32 (1996-97) | Valley Christian Eagles Head Coach (2020-21) | All-State, District 13-C Scoring Leader, State Tournament',
    type: 'profile',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
