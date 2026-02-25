import type { CardData } from '../types';

interface Props { data: CardData; showBack?: boolean; }

export function Fleer86Front({ data }: Props) {
  const { primaryColor, secondaryColor, accentColor, textColor, mainPhoto, playerName, position, jerseyNumber, school, logoImage } = data;
  return (
    <svg viewBox="0 0 525 735" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      <defs>
        <clipPath id="f86-photo"><rect x="42" y="90" width="441" height="530" rx="8" /></clipPath>
        <linearGradient id="f86-border" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={primaryColor} />
          <stop offset="50%" stopColor={accentColor} />
          <stop offset="100%" stopColor={secondaryColor} />
        </linearGradient>
        <filter id="f86-shadow"><feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.3" /></filter>
      </defs>
      {/* Card background */}
      <rect width="525" height="735" rx="16" fill="#f8f6f0" />
      {/* Outer border - gradient like Fleer */}
      <rect x="8" y="8" width="509" height="719" rx="12" fill="none" stroke="url(#f86-border)" strokeWidth="12" />
      {/* Inner border */}
      <rect x="22" y="22" width="481" height="691" rx="8" fill="none" stroke={secondaryColor} strokeWidth="3" />
      {/* Photo area with checkerboard if no photo */}
      <rect x="42" y="90" width="441" height="530" rx="8" fill="#e8e8e8" />
      {!mainPhoto && (
        <g clipPath="url(#f86-photo)">
          {Array.from({ length: 28 }).map((_, i) =>
            Array.from({ length: 23 }).map((_, j) =>
              (i + j) % 2 === 0 ? <rect key={`${i}-${j}`} x={42 + j * 20} y={90 + i * 20} width="20" height="20" fill="#d8d8d8" /> : null
            )
          )}
          <text x="262" y="370" textAnchor="middle" fill="#999" fontSize="24" fontFamily="sans-serif">DROP PHOTO HERE</text>
        </g>
      )}
      {mainPhoto && (
        <image href={mainPhoto} x="42" y="90" width="441" height="530" clipPath="url(#f86-photo)" preserveAspectRatio="xMidYMid slice" />
      )}
      {/* Team logo circle top-left */}
      <circle cx="72" cy="56" r="26" fill={primaryColor} stroke={accentColor} strokeWidth="2" filter="url(#f86-shadow)" />
      {logoImage ? (
        <image href={logoImage} x="52" y="36" width="40" height="40" clipPath="circle(18px at 20px 20px)" />
      ) : (
        <text x="72" y="62" textAnchor="middle" fill={textColor} fontSize="14" fontWeight="bold" fontFamily="sans-serif">
          {school.substring(0, 3)}
        </text>
      )}
      {/* Jersey number top-right */}
      <rect x="420" y="30" width="75" height="48" rx="6" fill={primaryColor} filter="url(#f86-shadow)" />
      <text x="457" y="64" textAnchor="middle" fill={accentColor} fontSize="28" fontWeight="bold" fontFamily="'Arial Black', sans-serif">
        #{jerseyNumber}
      </text>
      {/* Name banner bottom */}
      <rect x="30" y="628" width="465" height="42" rx="4" fill={primaryColor} />
      <rect x="30" y="628" width="465" height="42" rx="4" fill="none" stroke={accentColor} strokeWidth="2" />
      <text x="262" y="656" textAnchor="middle" fill={textColor} fontSize="22" fontWeight="bold" fontFamily="'Arial Black', sans-serif" letterSpacing="2">
        {playerName}
      </text>
      {/* Position + School below name */}
      <text x="262" y="690" textAnchor="middle" fill={secondaryColor} fontSize="13" fontFamily="sans-serif" fontWeight="600">
        {position} • {school}
      </text>
    </svg>
  );
}

export function Fleer86Back({ data }: Props) {
  const { primaryColor, secondaryColor, accentColor, textColor, playerName, position, jerseyNumber, school, year, height, weight, hometown, sport } = data;
  const stats = [
    { label: data.stat1Label, value: data.stat1Value },
    { label: data.stat2Label, value: data.stat2Value },
    { label: data.stat3Label, value: data.stat3Value },
    { label: data.stat4Label, value: data.stat4Value },
  ];
  return (
    <svg viewBox="0 0 525 735" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      <rect width="525" height="735" rx="16" fill="#f8f6f0" />
      <rect x="8" y="8" width="509" height="719" rx="12" fill="none" stroke={primaryColor} strokeWidth="6" />
      {/* Header */}
      <rect x="30" y="30" width="465" height="60" rx="6" fill={primaryColor} />
      <text x="262" y="68" textAnchor="middle" fill={textColor} fontSize="24" fontWeight="bold" fontFamily="'Arial Black', sans-serif" letterSpacing="2">
        {playerName}
      </text>
      {/* Bio section */}
      <rect x="30" y="108" width="465" height="130" rx="6" fill={secondaryColor} opacity="0.1" />
      <text x="50" y="136" fill={secondaryColor} fontSize="14" fontWeight="bold" fontFamily="sans-serif">{school}</text>
      <text x="50" y="158" fill="#555" fontSize="13" fontFamily="sans-serif">Position: {position} | #{jerseyNumber}</text>
      <text x="50" y="178" fill="#555" fontSize="13" fontFamily="sans-serif">Year: {year} | {sport}</text>
      <text x="50" y="198" fill="#555" fontSize="13" fontFamily="sans-serif">{height} • {weight} • {hometown}</text>
      <text x="50" y="226" fill="#555" fontSize="13" fontFamily="sans-serif">Class: {year}</text>
      {/* Stats header */}
      <rect x="30" y="256" width="465" height="36" rx="4" fill={accentColor} />
      <text x="262" y="280" textAnchor="middle" fill={primaryColor} fontSize="16" fontWeight="bold" fontFamily="sans-serif">
        SEASON STATISTICS
      </text>
      {/* Stats grid */}
      {stats.map((s, i) => (
        <g key={i}>
          <rect x={30 + (i % 2) * 233} y={304 + Math.floor(i / 2) * 72} width="225" height="64" rx="4" fill={i % 2 === 0 ? '#f0f0f0' : '#e8e8e8'} />
          <text x={142 + (i % 2) * 233} y={330 + Math.floor(i / 2) * 72} textAnchor="middle" fill={primaryColor} fontSize="24" fontWeight="bold" fontFamily="'Arial Black', sans-serif">
            {s.value}
          </text>
          <text x={142 + (i % 2) * 233} y={352 + Math.floor(i / 2) * 72} textAnchor="middle" fill="#666" fontSize="12" fontFamily="sans-serif">
            {s.label}
          </text>
        </g>
      ))}
      {/* Highlights */}
      <text x="50" y="480" fill={secondaryColor} fontSize="14" fontWeight="bold" fontFamily="sans-serif">HIGHLIGHTS</text>
      <line x1="50" y1="488" x2="475" y2="488" stroke={accentColor} strokeWidth="2" />
      {[data.highlight1, data.highlight2, data.highlight3].filter(Boolean).map((h, i) => (
        <text key={i} x="60" y={512 + i * 24} fill="#444" fontSize="13" fontFamily="sans-serif">• {h}</text>
      ))}
      {/* Logo placeholder */}
      <circle cx="262" cy="640" r="35" fill={primaryColor} opacity="0.15" />
      {data.logoImage ? (
        <image href={data.logoImage} x="232" y="610" width="60" height="60" />
      ) : (
        <text x="262" y="646" textAnchor="middle" fill={primaryColor} fontSize="11" fontFamily="sans-serif">LOGO</text>
      )}
      <text x="262" y="700" textAnchor="middle" fill="#999" fontSize="10" fontFamily="sans-serif">
        {school} {sport} • {year}
      </text>
    </svg>
  );
}
