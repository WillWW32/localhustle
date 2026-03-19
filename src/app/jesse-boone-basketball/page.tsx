const IMG = 'https://xwmmqbnhyrtguswiplaw.supabase.co/storage/v1/object/public/profile-pics/jesse-career'

export default function JesseBooneBasketball() {
  return (
    <>

      <div style={{ minHeight: '100vh', background: '#fafaf8', fontFamily: "'Georgia', 'Times New Roman', serif" }}>
        {/* Hero */}
        <header style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)', color: 'white', padding: '4rem 1.5rem 3rem', textAlign: 'center' }}>
          <p style={{ fontSize: '0.75rem', letterSpacing: '0.2em', textTransform: 'uppercase', opacity: 0.7, marginBottom: '1rem' }}>
            A Montana Basketball Legacy
          </p>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 'bold', marginBottom: '0.5rem', lineHeight: 1.1 }}>
            Jesse Boone
          </h1>
          <p style={{ fontSize: '1.125rem', opacity: 0.85, maxWidth: '600px', margin: '0 auto' }}>
            Player. Coach. Father.
          </p>
          <p style={{ fontSize: '0.875rem', opacity: 0.6, marginTop: '0.75rem' }}>
            Seeley-Swan Blackhawks #32 &bull; Valley Christian Eagles Head Coach
          </p>
        </header>

        <main style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1.5rem' }}>

          {/* Chapter 1: Youth */}
          <section style={{ marginBottom: '3rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <div style={{ width: '40px', height: '2px', background: '#d4a017' }} />
              <h2 style={{ fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#999' }}>Chapter 1</h2>
            </div>
            <h3 style={{ fontSize: '1.75rem', marginBottom: '1rem', color: '#1a1a2e' }}>Seeley Lake Roots</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <img src={`${IMG}/seeley-lake-youth.jpg`} alt="Seeley Lake youth basketball team with Coach Nelson" style={{ width: '100%', borderRadius: '8px', objectFit: 'cover', aspectRatio: '4/3' }} />
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <p style={{ color: '#555', lineHeight: 1.8, fontSize: '0.95rem' }}>
                  Basketball started early for Jesse Boone in Seeley Lake, Montana. Playing for Coach Nelson on the Seeley Lake youth teams, Jesse learned the fundamentals that would carry him through a decorated high school career and beyond.
                </p>
              </div>
            </div>
          </section>

          {/* Chapter 2: Blackhawks */}
          <section style={{ marginBottom: '3rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <div style={{ width: '40px', height: '2px', background: '#d4a017' }} />
              <h2 style={{ fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#999' }}>Chapter 2</h2>
            </div>
            <h3 style={{ fontSize: '1.75rem', marginBottom: '1rem', color: '#1a1a2e' }}>Seeley-Swan Blackhawks (1994-1997)</h3>

            <img src={`${IMG}/blackhawk-team.jpg`} alt="Seeley-Swan Blackhawks varsity basketball team photo, mid-1990s" style={{ width: '100%', borderRadius: '8px', marginBottom: '1.5rem', objectFit: 'cover' }} />

            <p style={{ color: '#555', lineHeight: 1.8, fontSize: '0.95rem', marginBottom: '1.5rem' }}>
              Wearing #32 for the Seeley-Swan Blackhawks, Jesse Boone became one of the most accomplished players in the program&apos;s history. As a senior center, he earned All-Conference, All-State, and Academic All-State honors while also serving as Student Council President and Senior Class President.
            </p>

            {/* Key Games */}
            <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
              <h4 style={{ fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#d4a017', marginBottom: '1rem' }}>Notable Games</h4>

              <div style={{ borderLeft: '3px solid #d4a017', paddingLeft: '1.25rem', marginBottom: '1.25rem' }}>
                <p style={{ fontWeight: 'bold', marginBottom: '0.25rem', color: '#1a1a2e' }}>State Tournament: Seeley-Swan 52, #1 Scobey 51 (OT)</p>
                <p style={{ color: '#666', fontSize: '0.875rem', marginBottom: '0.25rem' }}>March 14, 1997 &bull; Great Falls Tribune, Page 25</p>
                <p style={{ color: '#555', fontSize: '0.9rem', lineHeight: 1.7 }}>
                  Jesse Boone scored 17 points as Seeley-Swan stunned top-ranked, previously unbeaten Scobey 52-51 in overtime at the State Class C Tournament. Matt Schneiter hit a 3-pointer with 10 seconds left in regulation to tie the game at 44-44. The Blackhawks advanced to the state semifinals.
                </p>
              </div>

              <div style={{ borderLeft: '3px solid #d4a017', paddingLeft: '1.25rem', marginBottom: '1.25rem' }}>
                <p style={{ fontWeight: 'bold', marginBottom: '0.25rem', color: '#1a1a2e' }}>District 13-C: Seeley-Swan 56, Drummond 55 (OT)</p>
                <p style={{ color: '#666', fontSize: '0.875rem', marginBottom: '0.25rem' }}>February 25, 1996 &bull; Montana Standard, Page 9</p>
                <p style={{ color: '#555', fontSize: '0.9rem', lineHeight: 1.7 }}>
                  Jesse Boone sank two free throws with 2.8 seconds left in overtime to give Seeley-Swan the win in the District 13-C consolation game. Jesse finished with 11 points as the Blackhawks advanced.
                </p>
              </div>

              <div style={{ borderLeft: '3px solid #d4a017', paddingLeft: '1.25rem' }}>
                <p style={{ fontWeight: 'bold', marginBottom: '0.25rem', color: '#1a1a2e' }}>Seeley-Swan 67, Valley Christian 53</p>
                <p style={{ color: '#666', fontSize: '0.875rem', marginBottom: '0.25rem' }}>December 22, 1996 &bull; The Missoulian, Page 43</p>
                <p style={{ color: '#555', fontSize: '0.9rem', lineHeight: 1.7 }}>
                  Senior center Jesse Boone led the way with 17 points, including 9 of 9 from the free throw line. Seeley-Swan dominated the first half with a 33-17 lead and controlled the game throughout.
                </p>
              </div>
            </div>

            {/* Awards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <img src={`${IMG}/allstate.jpg`} alt="Jesse Boone Seeley-Swan High School All-State award certificate with varsity photo, #32" style={{ width: '100%', borderRadius: '8px', objectFit: 'cover' }} />
              <div style={{ background: 'white', borderRadius: '12px', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                <h4 style={{ fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#d4a017', marginBottom: '1rem' }}>Honors &amp; Awards (1997)</h4>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {[
                    'All-State Basketball',
                    'All-Conference Basketball',
                    'Academic All-State',
                    'Honor Roll',
                    'Senior Class President',
                    'Student Council President',
                    'State Tournament Semifinalist',
                  ].map((award, i) => (
                    <li key={i} style={{ padding: '0.4rem 0', borderBottom: i < 6 ? '1px solid #f0f0f0' : 'none', color: '#333', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ color: '#d4a017' }}>&#9733;</span> {award}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* Chapter 3: Coaching */}
          <section style={{ marginBottom: '3rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <div style={{ width: '40px', height: '2px', background: '#d4a017' }} />
              <h2 style={{ fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#999' }}>Chapter 3</h2>
            </div>
            <h3 style={{ fontSize: '1.75rem', marginBottom: '1rem', color: '#1a1a2e' }}>Valley Christian Eagles Head Coach (2020-2021)</h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <img src={`${IMG}/new-coach.jpg`} alt="Missoulian article: New Eagles coach has deep ties - Jesse Boone, Valley Christian, January 2021" style={{ width: '100%', borderRadius: '8px', objectFit: 'cover' }} />
              <img src={`${IMG}/starting-to-soar.jpg`} alt="Missoulian article: Starting to soar - Valley Christian basketball under Jesse Boone, January 2021" style={{ width: '100%', borderRadius: '8px', objectFit: 'cover' }} />
            </div>

            <p style={{ color: '#555', lineHeight: 1.8, fontSize: '0.95rem', marginBottom: '1.5rem' }}>
              More than 20 years after his playing days at Seeley-Swan, Jesse Boone returned to the hardwood as head coach of the Valley Christian Eagles. A late hire who discovered the opening online, Boone brought his Montana roots and competitive fire to a program hungry for a turnaround.
            </p>

            {/* Coaching Highlights */}
            <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
              <h4 style={{ fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#2d6a4f', marginBottom: '1rem' }}>2020-2021 Season Highlights</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {[
                  { stat: '7-0', label: 'Season Start' },
                  { stat: '1st', label: 'District 13C Title in 20+ Years' },
                  { stat: '2', label: 'College Signings' },
                  { stat: '23', label: 'Years Since Last State Push' },
                ].map((item, i) => (
                  <div key={i} style={{ textAlign: 'center', padding: '1rem', background: '#f8f8f5', borderRadius: '8px' }}>
                    <p style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#2d6a4f', marginBottom: '0.25rem', fontFamily: "'Courier New', monospace" }}>{item.stat}</p>
                    <p style={{ fontSize: '0.75rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <img src={`${IMG}/still-undefeated.jpg`} alt="Missoulian front page: Still undefeated - Valley Christian moves to 6-0, January 16, 2021" style={{ width: '100%', borderRadius: '8px', objectFit: 'cover' }} />
              <img src={`${IMG}/eagles-district-champs.jpg`} alt="Valley Christian Eagles team celebrating District 13C championship trophy, 2021" style={{ width: '100%', borderRadius: '8px', objectFit: 'cover' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <img src={`${IMG}/coach-vc.png`} alt="Coach Jesse Boone in Valley Christian green jacket carrying basketballs" style={{ width: '100%', borderRadius: '8px', objectFit: 'cover', aspectRatio: '3/4' }} />
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ background: 'white', borderRadius: '12px', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                  <h4 style={{ fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#2d6a4f', marginBottom: '0.75rem' }}>News Coverage</h4>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {[
                      { title: 'New Eagles coach has deep ties to Missoula area', source: '406MT Sports / Missoulian', date: 'January 7, 2021' },
                      { title: 'Valley Christian looks to make state tournament for first time in 23 years', source: 'NBC Montana', date: 'January 18, 2021' },
                      { title: 'Still undefeated: Valley Christian moves to 6-0', source: 'Missoulian (Front Page)', date: 'January 16, 2021' },
                      { title: 'Valley Christian finishes breakout season with signing day', source: 'NBC Montana', date: 'May 23, 2021' },
                    ].map((article, i) => (
                      <li key={i} style={{ padding: '0.75rem 0', borderBottom: i < 3 ? '1px solid #f0f0f0' : 'none' }}>
                        <p style={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#333', marginBottom: '0.125rem' }}>{article.title}</p>
                        <p style={{ fontSize: '0.75rem', color: '#888' }}>{article.source} &bull; {article.date}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Chapter 4: Legacy */}
          <section style={{ marginBottom: '3rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <div style={{ width: '40px', height: '2px', background: '#d4a017' }} />
              <h2 style={{ fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#999' }}>Chapter 4</h2>
            </div>
            <h3 style={{ fontSize: '1.75rem', marginBottom: '1rem', color: '#1a1a2e' }}>The Legacy Continues</h3>
            <div style={{ background: 'white', borderRadius: '12px', padding: '2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', textAlign: 'center' }}>
              <p style={{ color: '#555', lineHeight: 1.8, fontSize: '1rem', maxWidth: '650px', margin: '0 auto 1.5rem' }}>
                Today Jesse lives in Missoula with his family. His son Josiah &quot;Siah&quot; Boone carries on the basketball tradition as a senior SG/SF for the Missoula Big Sky Eagles, leading the team in scoring and earning attention as a Class of 2026 recruit.
              </p>
              <a
                href="/recruit/josiah-boone-26"
                style={{
                  display: 'inline-block',
                  background: '#1a1a2e',
                  color: 'white',
                  padding: '0.75rem 2rem',
                  borderRadius: '9999px',
                  textDecoration: 'none',
                  fontWeight: 'bold',
                  fontSize: '0.875rem',
                  fontFamily: "'Courier New', monospace",
                }}
              >
                View Josiah Boone&apos;s Recruiting Profile &rarr;
              </a>
            </div>
          </section>

          {/* Timeline */}
          <section style={{ marginBottom: '3rem' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', color: '#1a1a2e', textAlign: 'center' }}>Career Timeline</h3>
            <div style={{ maxWidth: '600px', margin: '0 auto' }}>
              {[
                { year: '1990s', event: 'Seeley Lake youth basketball under Coach Nelson' },
                { year: '1994', event: 'Varsity starter for Seeley-Swan Blackhawks' },
                { year: '1996', event: 'Clutch OT free throws to beat Drummond in District 13-C' },
                { year: '1996', event: '17 points (9/9 FT) in win over Valley Christian' },
                { year: '1997', event: '17 points to stun #1 Scobey 52-51 in OT at State Tournament' },
                { year: '1997', event: 'Class C State Semifinals appearance' },
                { year: '1997', event: 'All-State, All-Conference, Academic All-State honors' },
                { year: '1997', event: 'Graduated: Senior Class President, Student Council President' },
                { year: '2020', event: 'Named head coach of Valley Christian Eagles' },
                { year: '2021', event: 'Eagles start season 7-0, make front page of Missoulian' },
                { year: '2021', event: 'First District 13C title in 20+ years' },
                { year: '2021', event: 'Two players sign with Yellowstone Christian College' },
                { year: '2026', event: 'Son Josiah "Siah" Boone leads Big Sky Eagles as leading scorer' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: '1rem', marginBottom: '0.75rem', alignItems: 'flex-start' }}>
                  <span style={{ fontFamily: "'Courier New', monospace", fontSize: '0.8rem', fontWeight: 'bold', color: '#d4a017', minWidth: '50px', flexShrink: 0, paddingTop: '0.1rem' }}>{item.year}</span>
                  <span style={{ fontSize: '0.875rem', color: '#555', lineHeight: 1.5 }}>{item.event}</span>
                </div>
              ))}
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer style={{ borderTop: '1px solid #eee', padding: '2rem 1.5rem', textAlign: 'center', background: 'white' }}>
          <p style={{ color: '#999', fontSize: '0.75rem', fontFamily: "'Courier New', monospace" }}>
            &copy; {new Date().getFullYear()} &bull; Jesse Boone Basketball Career Archive &bull; Missoula, Montana
          </p>
          <p style={{ color: '#ccc', fontSize: '0.65rem', marginTop: '0.5rem', fontFamily: "'Courier New', monospace" }}>
            Built with <a href="https://app.localhustle.org" style={{ color: '#999' }}>LocalHustle</a>
          </p>
        </footer>
      </div>
    </>
  )
}
