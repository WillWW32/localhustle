import type { CardData } from '../types';

interface Props { data: CardData; }

export function Donruss84Front({ data }: Props) {
  const { primaryColor, secondaryColor, accentColor, textColor, mainPhoto, playerName, position, jerseyNumber, school } = data;
  return (
    <svg viewBox="0 0 525 735" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      <defs>
        <clipPath id="d84-photo"><rect x="0" y="0" width="525" height="600" /></clipPath>
        <linearGradient id="d84-wave1" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={primaryColor} />
          <stop offset="100%" stopColor={secondaryColor} />
        </linearGradient>
      </defs>
      {/* Card base - no outer border (borderless style) */}
      <rect width="525" height="735" rx="12" fill="#222" />
      {/* Full-bleed photo area */}
      <rect x="0" y="0" width="525" height="600" rx="12" fill="#e0e0e0" />
      {!mainPhoto && (
        <g clipPath="url(#d84-photo)">
          {Array.from({ length: 32 }).map((_, i) =>
            Array.from({ length: 28 }).map((_, j) =>
              (i + j) % 2 === 0 ? <rect key={`${i}-${j}`} x={j * 20} y={i * 20} width="20" height="20" fill="#d0d0d0" /> : null
            )
          )}
          <text x="262" y="310" textAnchor="middle" fill="#999" fontSize="22" fontFamily="sans-serif">DROP PHOTO HERE</text>
        </g>
      )}
      {mainPhoto && <image href={mainPhoto} x="0" y="0" width="525" height="600" clipPath="url(#d84-photo)" preserveAspectRatio="xMidYMid slice" />}
      {/* Color wave accents at bottom - signature Donruss style */}
      <path d={`M0 560 Q130 520 262 550 Q395 580 525 540 L525 600 Q395 640 262 610 Q130 580 0 620 Z`} fill={primaryColor} opacity="0.85" />
      <path d={`M0 590 Q130 560 262 585 Q395 610 525 575 L525 620 Q395 660 262 635 Q130 610 0 650 Z`} fill={accentColor} opacity="0.9" />
      <path d={`M0 625 Q130 600 262 620 Q395 640 525 610 L525 650 Q395 680 262 660 Q130 640 0 670 Z`} fill={secondaryColor} opacity="0.85" />
      {/* Name banner over waves */}
      <text x="262" y="612" textAnchor="middle" fill={textColor} fontSize="28" fontWeight="bold" fontFamily="'Arial Black', sans-serif" letterSpacing="1" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>
        {playerName}
      </text>
      {/* Bottom info area */}
      <rect x="0" y="650" width="525" height="85" rx="0" fill="#1a1a1a" />
      <rect x="0" y="725" width="525" height="10" rx="0" fill="#1a1a1a" />
      {/* Position badge */}
      <rect x="20" y="662" width="150" height="28" rx="14" fill={primaryColor} />
      <text x="95" y="681" textAnchor="middle" fill={textColor} fontSize="12" fontWeight="bold" fontFamily="sans-serif">{position}</text>
      {/* School */}
      <text x="262" y="700" textAnchor="middle" fill="#ccc" fontSize="14" fontFamily="sans-serif">{school}</text>
      {/* Number */}
      <text x="480" y="682" textAnchor="middle" fill={accentColor} fontSize="26" fontWeight="bold" fontFamily="'Arial Black', sans-serif">#{jerseyNumber}</text>
      {/* Facsimile signature line */}
      <line x1="40" y1="720" x2="200" y2="720" stroke="#555" strokeWidth="1" strokeDasharray="4,4" />
      <text x="120" y="716" textAnchor="middle" fill="#666" fontSize="9" fontFamily="serif" fontStyle="italic">signature</text>
    </svg>
  );
}

export function Donruss84Back({ data }: Props) {
  const { primaryColor, secondaryColor, accentColor, textColor } = data;
  const stats = [
    { label: data.stat1Label, value: data.stat1Value },
    { label: data.stat2Label, value: data.stat2Value },
    { label: data.stat3Label, value: data.stat3Value },
    { label: data.stat4Label, value: data.stat4Value },
  ];
  return (
    <svg viewBox="0 0 525 735" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      <rect width="525" height="735" rx="12" fill="#f8f5ef" />
      {/* Top wave accent */}
      <path d="M0 0 L525 0 L525 60 Q395 30 262 50 Q130 70 0 40 Z" fill={primaryColor} />
      <path d="M0 40 Q130 70 262 50 Q395 30 525 60 L525 80 Q395 50 262 70 Q130 90 0 60 Z" fill={accentColor} opacity="0.7" />
      {/* Name */}
      <text x="262" y="120" textAnchor="middle" fill={primaryColor} fontSize="24" fontWeight="bold" fontFamily="'Arial Black', sans-serif" letterSpacing="2">{data.playerName}</text>
      <text x="262" y="145" textAnchor="middle" fill="#666" fontSize="13" fontFamily="sans-serif">{data.position} • #{data.jerseyNumber} • {data.school}</text>
      {/* Bio box */}
      <rect x="30" y="165" width="465" height="90" rx="6" fill="#f0ece3" stroke={secondaryColor} strokeWidth="1" />
      <text x="50" y="190" fill="#555" fontSize="13" fontFamily="sans-serif">{data.height} • {data.weight}</text>
      <text x="50" y="212" fill="#555" fontSize="13" fontFamily="sans-serif">Hometown: {data.hometown}</text>
      <text x="50" y="234" fill="#555" fontSize="13" fontFamily="sans-serif">Class: {data.year} • {data.sport}</text>
      {/* Stats table */}
      <rect x="30" y="274" width="465" height="32" rx="4" fill={primaryColor} />
      <text x="262" y="296" textAnchor="middle" fill={textColor} fontSize="14" fontWeight="bold" fontFamily="sans-serif">SEASON STATS</text>
      {stats.map((s, i) => (
        <g key={i}>
          <rect x={30 + i * 116} y="310" width="116" height="70" fill={i % 2 === 0 ? '#f5f2ec' : '#ede9e1'} stroke="#ddd" strokeWidth="0.5" />
          <text x={88 + i * 116} y="342" textAnchor="middle" fill={primaryColor} fontSize="22" fontWeight="bold" fontFamily="'Arial Black', sans-serif">{s.value}</text>
          <text x={88 + i * 116} y="366" textAnchor="middle" fill="#888" fontSize="11" fontFamily="sans-serif">{s.label}</text>
        </g>
      ))}
      {/* Highlights */}
      <text x="50" y="418" fill={secondaryColor} fontSize="14" fontWeight="bold" fontFamily="sans-serif">HIGHLIGHTS</text>
      {[data.highlight1, data.highlight2, data.highlight3].filter(Boolean).map((h, i) => (
        <text key={i} x="60" y={444 + i * 24} fill="#444" fontSize="13" fontFamily="sans-serif">• {h}</text>
      ))}
      {/* Bottom wave */}
      <path d="M0 680 Q130 660 262 675 Q395 690 525 670 L525 735 L0 735 Z" fill={secondaryColor} opacity="0.3" />
      <text x="262" y="710" textAnchor="middle" fill="#aaa" fontSize="10" fontFamily="sans-serif">{data.school} {data.sport} • {data.year}</text>
    </svg>
  );
}
