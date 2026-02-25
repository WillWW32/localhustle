import type { CardData } from '../types';

interface Props { data: CardData; }

export function Henderson80Front({ data }: Props) {
  const { primaryColor, secondaryColor, accentColor, textColor, mainPhoto, playerName, position, jerseyNumber, school, year } = data;
  // 1980 Topps Rickey Henderson rookie — accurate replica:
  // - Cream card base
  // - Rounded light-colored inner border
  // - Player name bold black centered near top
  // - Position on a folded pennant/ribbon (top-left, angled)
  // - Large photo with thin border
  // - Team name on a swooping colored banner (bottom area, right-aligned)
  // - Facsimile signature across photo lower area
  return (
    <svg viewBox="0 0 525 735" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      <defs>
        <clipPath id="h80-photo"><rect x="38" y="108" width="449" height="498" rx="3" /></clipPath>
      </defs>

      {/* Card base - cream/off-white */}
      <rect width="525" height="735" rx="12" fill="#f0ead6" />

      {/* Rounded colored inner border - light blue/teal like the original */}
      <rect x="14" y="14" width="497" height="707" rx="10" fill="none" stroke={secondaryColor} strokeWidth="8" />

      {/* Player name - bold black centered near top */}
      <text x="262" y="50" textAnchor="middle" fill="#111" fontSize="28" fontWeight="bold" fontFamily="'Arial Black', Impact, sans-serif" letterSpacing="1">
        {playerName}
      </text>

      {/* Position pennant/ribbon - top left, flag shape pointing right */}
      {/* Ribbon body: left edge flush, right edge has notch cut inward */}
      <path d={`M18 60 L190 60 L175 78 L190 96 L18 96 Z`} fill={primaryColor} />
      {/* Fold/shadow triangle under ribbon */}
      <path d={`M18 96 L38 96 L18 114 Z`} fill={primaryColor} opacity="0.4" />
      <text x="96" y="84" textAnchor="middle" fill={textColor} fontSize="14" fontWeight="bold" fontFamily="'Arial Black', sans-serif" letterSpacing="2">
        {position.toUpperCase()}
      </text>

      {/* Photo area - large, thin border */}
      <rect x="34" y="104" width="457" height="506" rx="4" fill={secondaryColor} />
      <rect x="38" y="108" width="449" height="498" rx="3" fill="#e0e0e0" />
      {!mainPhoto && (
        <g clipPath="url(#h80-photo)">
          {Array.from({ length: 26 }).map((_, i) =>
            Array.from({ length: 24 }).map((_, j) =>
              (i + j) % 2 === 0 ? <rect key={`${i}-${j}`} x={38 + j * 19} y={108 + i * 20} width="19" height="20" fill="#d0d0d0" /> : null
            )
          )}
          <text x="262" y="365" textAnchor="middle" fill="#999" fontSize="22" fontFamily="sans-serif">DROP PHOTO HERE</text>
        </g>
      )}
      {mainPhoto && <image href={mainPhoto} x="38" y="108" width="449" height="498" clipPath="url(#h80-photo)" preserveAspectRatio="xMidYMid slice" />}

      {/* Facsimile signature line across lower photo area */}
      <line x1="60" y1="560" x2="280" y2="545" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" />
      <text x="170" y="554" textAnchor="middle" fill="rgba(255,255,255,0.65)" fontSize="16" fontFamily="'Brush Script MT', 'Segoe Script', cursive" fontStyle="italic" transform="rotate(-2, 170, 554)">
        {playerName.split(' ').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')}
      </text>

      {/* Team banner - bottom right, mirror of top-left pennant (flag pointing left) */}
      {/* Right edge flush, left edge has notch cut inward */}
      <path d={`M507 598 L335 598 L350 616 L335 634 L507 634 Z`} fill={primaryColor} />
      {/* Fold/shadow triangle above ribbon (mirrored) */}
      <path d={`M507 598 L487 598 L507 580 Z`} fill={primaryColor} opacity="0.4" />
      <text x="428" y="622" textAnchor="middle" fill={textColor} fontSize="14" fontWeight="bold" fontFamily="'Arial Black', sans-serif" letterSpacing="2">
        {school.toUpperCase()}
      </text>

      {/* Jersey number in small circle - top right corner area */}
      <circle cx="470" cy="78" r="20" fill={accentColor} stroke={primaryColor} strokeWidth="2" />
      <text x="470" y="84" textAnchor="middle" fill={primaryColor} fontSize="16" fontWeight="bold" fontFamily="'Arial Black', sans-serif">
        #{jerseyNumber}
      </text>

      {/* Bottom area - year and sport */}
      <text x="262" y="660" textAnchor="middle" fill="#666" fontSize="12" fontFamily="sans-serif" fontWeight="600">
        {data.sport.toUpperCase()} • {year}
      </text>

      {/* Small star for class/rookie indicator */}
      <polygon points="80,640 86,656 104,656 90,666 95,682 80,673 65,682 70,666 56,656 74,656" fill={accentColor} stroke={primaryColor} strokeWidth="1" />
      <text x="80" y="665" textAnchor="middle" fill={primaryColor} fontSize="6" fontWeight="bold" fontFamily="sans-serif">{year.substring(0, 4).toUpperCase()}</text>

      {/* Bottom copyright-style line */}
      <text x="262" y="718" textAnchor="middle" fill="#bbb" fontSize="8" fontFamily="sans-serif">{school} {data.sport} Card Series</text>
    </svg>
  );
}

export function Henderson80Back({ data }: Props) {
  const { primaryColor, secondaryColor, accentColor } = data;
  const stats = [
    { label: data.stat1Label, value: data.stat1Value },
    { label: data.stat2Label, value: data.stat2Value },
    { label: data.stat3Label, value: data.stat3Value },
    { label: data.stat4Label, value: data.stat4Value },
  ];
  return (
    <svg viewBox="0 0 525 735" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      {/* Card base */}
      <rect width="525" height="735" rx="12" fill="#f0ead6" />

      {/* Colored inner border - matching front */}
      <rect x="14" y="14" width="497" height="707" rx="10" fill="none" stroke={secondaryColor} strokeWidth="8" />

      {/* Card number in home plate shape - top left */}
      <path d="M30 30 L80 30 L80 55 L55 70 L30 55 Z" fill="#111" />
      <text x="55" y="52" textAnchor="middle" fill="#fff" fontSize="14" fontWeight="bold" fontFamily="'Arial Black', sans-serif">#{data.jerseyNumber}</text>

      {/* Header: Position / Name / Team */}
      <text x="262" y="48" textAnchor="middle" fill={primaryColor} fontSize="13" fontWeight="bold" fontFamily="sans-serif" letterSpacing="3">
        {data.position.toUpperCase()}
      </text>
      <text x="262" y="76" textAnchor="middle" fill="#111" fontSize="24" fontWeight="bold" fontFamily="'Arial Black', sans-serif" letterSpacing="1">
        {data.playerName}
      </text>
      <text x="262" y="98" textAnchor="middle" fill={primaryColor} fontSize="14" fontWeight="bold" fontFamily="sans-serif" letterSpacing="2">
        {data.school.toUpperCase()}
      </text>

      {/* Divider line */}
      <line x1="30" y1="112" x2="495" y2="112" stroke={secondaryColor} strokeWidth="2" />

      {/* Left side: Cartoon/mascot placeholder box */}
      <rect x="30" y="124" width="200" height="200" rx="6" fill="#f7f3e8" stroke={secondaryColor} strokeWidth="1.5" />
      {data.logoImage ? (
        <image href={data.logoImage} x="40" y="134" width="180" height="180" />
      ) : (
        <>
          {/* Simple placeholder illustration area */}
          <rect x="50" y="144" width="160" height="140" rx="4" fill="#eee8d5" />
          <circle cx="130" cy="200" r="30" fill={secondaryColor} opacity="0.15" />
          <text x="130" y="196" textAnchor="middle" fill={secondaryColor} fontSize="20" fontFamily="sans-serif">★</text>
          <text x="130" y="218" textAnchor="middle" fill={secondaryColor} fontSize="9" fontFamily="sans-serif" fontWeight="bold">TEAM LOGO</text>
          <text x="130" y="300" textAnchor="middle" fill="#bbb" fontSize="8" fontFamily="sans-serif">or custom illustration</text>
        </>
      )}

      {/* Right side: Stats table - classic Topps tabular style */}
      <rect x="242" y="124" width="253" height="28" rx="3" fill={primaryColor} />
      <text x="368" y="143" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="bold" fontFamily="sans-serif" letterSpacing="1">SEASON STATS</text>

      {/* Stats header row */}
      <rect x="242" y="152" width="253" height="24" fill={accentColor} />
      <text x="304" y="168" textAnchor="middle" fill={primaryColor} fontSize="10" fontWeight="bold" fontFamily="sans-serif">STAT</text>
      <text x="432" y="168" textAnchor="middle" fill={primaryColor} fontSize="10" fontWeight="bold" fontFamily="sans-serif">VALUE</text>

      {/* Stat rows */}
      {stats.map((s, i) => (
        <g key={i}>
          <rect x="242" y={176 + i * 36} width="253" height="36" fill={i % 2 === 0 ? '#f5f0e4' : '#ebe6d8'} stroke="#d4cfc1" strokeWidth="0.5" />
          <text x="304" y={200 + i * 36} textAnchor="middle" fill="#555" fontSize="13" fontFamily="sans-serif" fontWeight="600">{s.label}</text>
          <text x="432" y={200 + i * 36} textAnchor="middle" fill={primaryColor} fontSize="18" fontWeight="bold" fontFamily="'Arial Black', sans-serif">{s.value}</text>
        </g>
      ))}

      {/* Divider */}
      <line x1="30" y1="340" x2="495" y2="340" stroke={secondaryColor} strokeWidth="1.5" />

      {/* Highlights section - star bullets like the original */}
      <text x="46" y="370" fill={primaryColor} fontSize="14" fontWeight="bold" fontFamily="sans-serif" letterSpacing="1">HIGHLIGHTS</text>
      {[data.highlight1, data.highlight2, data.highlight3].filter(Boolean).map((h, i) => (
        <g key={i}>
          <text x="46" y={398 + i * 30} fill={accentColor} fontSize="14" fontFamily="sans-serif">★</text>
          <text x="66" y={398 + i * 30} fill="#333" fontSize="13" fontFamily="sans-serif">{h}</text>
        </g>
      ))}

      {/* Bio section at bottom */}
      <line x1="30" y1="500" x2="495" y2="500" stroke={secondaryColor} strokeWidth="1.5" />

      <rect x="30" y="512" width="465" height="100" rx="4" fill="#f7f3e8" />
      <text x="46" y="534" fill={primaryColor} fontSize="12" fontWeight="bold" fontFamily="sans-serif" letterSpacing="1">PLAYER BIO</text>
      <text x="46" y="556" fill="#444" fontSize="12" fontFamily="sans-serif">
        {data.height} • {data.weight} • {data.hometown}
      </text>
      <text x="46" y="576" fill="#444" fontSize="12" fontFamily="sans-serif">
        Class: {data.year} • {data.sport} • #{data.jerseyNumber}
      </text>
      <text x="46" y="596" fill="#444" fontSize="12" fontFamily="sans-serif">
        {data.school}
      </text>

      {/* Bottom card series text */}
      <text x="262" y="650" textAnchor="middle" fill="#bbb" fontSize="9" fontFamily="sans-serif">
        {data.school} {data.sport} Card Series • {data.year}
      </text>

      {/* Small home plate with card number bottom-right */}
      <path d="M445 660 L495 660 L495 680 L470 692 L445 680 Z" fill="#111" opacity="0.15" />
      <text x="470" y="680" textAnchor="middle" fill="#999" fontSize="10" fontFamily="sans-serif">#{data.jerseyNumber}</text>
    </svg>
  );
}
