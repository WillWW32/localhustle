import type { CardData } from '../types';

interface Props { data: CardData; }

export function Topps80BaseballFront({ data }: Props) {
  const { primaryColor, secondaryColor, accentColor, textColor, mainPhoto, playerName, position, jerseyNumber, school, year } = data;
  return (
    <svg viewBox="0 0 525 735" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      <defs>
        <clipPath id="t80b-photo"><rect x="40" y="100" width="445" height="470" rx="6" /></clipPath>
      </defs>
      {/* Card base */}
      <rect width="525" height="735" rx="14" fill="#f5f0e6" />
      {/* Thin border frame */}
      <rect x="12" y="12" width="501" height="711" rx="10" fill="none" stroke={secondaryColor} strokeWidth="3" />
      <rect x="20" y="20" width="485" height="695" rx="8" fill="none" stroke={primaryColor} strokeWidth="1.5" />
      {/* Curved ribbon for name - top */}
      <path d={`M60 30 Q262 0 465 30 L465 70 Q262 45 60 70 Z`} fill={primaryColor} />
      <path d={`M60 30 Q262 0 465 30 L465 70 Q262 45 60 70 Z`} fill="none" stroke={accentColor} strokeWidth="2" />
      <text x="262" y="55" textAnchor="middle" fill={textColor} fontSize="20" fontWeight="bold" fontFamily="'Arial Black', sans-serif" letterSpacing="2">
        {playerName}
      </text>
      {/* Position ribbon - smaller */}
      <rect x="195" y="72" width="135" height="22" rx="11" fill={accentColor} />
      <text x="262" y="88" textAnchor="middle" fill={primaryColor} fontSize="11" fontWeight="bold" fontFamily="sans-serif">{position}</text>
      {/* Photo area */}
      <rect x="36" y="96" width="453" height="478" rx="8" fill={secondaryColor} />
      <rect x="40" y="100" width="445" height="470" rx="6" fill="#e0e0e0" />
      {!mainPhoto && (
        <g clipPath="url(#t80b-photo)">
          {Array.from({ length: 25 }).map((_, i) =>
            Array.from({ length: 24 }).map((_, j) =>
              (i + j) % 2 === 0 ? <rect key={`${i}-${j}`} x={40 + j * 20} y={100 + i * 20} width="20" height="20" fill="#d0d0d0" /> : null
            )
          )}
          <text x="262" y="345" textAnchor="middle" fill="#999" fontSize="22" fontFamily="sans-serif">DROP PHOTO HERE</text>
        </g>
      )}
      {mainPhoto && <image href={mainPhoto} x="40" y="100" width="445" height="470" clipPath="url(#t80b-photo)" preserveAspectRatio="xMidYMid slice" />}
      {/* Pennant/banner at bottom */}
      <path d={`M40 590 L262 590 L280 605 L262 620 L40 620 Z`} fill={primaryColor} />
      <text x="148" y="610" textAnchor="middle" fill={textColor} fontSize="13" fontWeight="bold" fontFamily="sans-serif">{school}</text>
      {/* Right pennant */}
      <path d={`M485 590 L262 590 L245 605 L262 620 L485 620 Z`} fill={secondaryColor} />
      <text x="375" y="610" textAnchor="middle" fill={textColor} fontSize="13" fontWeight="bold" fontFamily="sans-serif">#{jerseyNumber} • {year}</text>
      {/* Facsimile signature */}
      <line x1="100" y1="665" x2="300" y2="665" stroke="#bbb" strokeWidth="1" strokeDasharray="4,3" />
      <text x="200" y="660" textAnchor="middle" fill="#aaa" fontSize="10" fontFamily="serif" fontStyle="italic">signature</text>
      {/* Logo placeholder */}
      <circle cx="430" cy="665" r="22" fill={primaryColor} opacity="0.2" />
      {data.logoImage ? (
        <image href={data.logoImage} x="412" y="647" width="36" height="36" />
      ) : (
        <text x="430" y="670" textAnchor="middle" fill={primaryColor} fontSize="9" fontFamily="sans-serif">LOGO</text>
      )}
      <text x="262" y="710" textAnchor="middle" fill="#888" fontSize="11" fontFamily="sans-serif">{data.sport} • {year}</text>
    </svg>
  );
}

export function Topps80BaseballBack({ data }: Props) {
  const { primaryColor, secondaryColor, accentColor, textColor } = data;
  const stats = [
    { label: data.stat1Label, value: data.stat1Value },
    { label: data.stat2Label, value: data.stat2Value },
    { label: data.stat3Label, value: data.stat3Value },
    { label: data.stat4Label, value: data.stat4Value },
  ];
  return (
    <svg viewBox="0 0 525 735" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      <rect width="525" height="735" rx="14" fill="#f5f0e6" />
      <rect x="12" y="12" width="501" height="711" rx="10" fill="none" stroke={secondaryColor} strokeWidth="3" />
      {/* Name ribbon top */}
      <path d="M60 24 Q262 10 465 24 L465 60 Q262 46 60 60 Z" fill={primaryColor} />
      <text x="262" y="48" textAnchor="middle" fill={textColor} fontSize="20" fontWeight="bold" fontFamily="'Arial Black', sans-serif" letterSpacing="2">{data.playerName}</text>
      {/* Bio */}
      <text x="50" y="94" fill={secondaryColor} fontSize="14" fontWeight="bold" fontFamily="sans-serif">{data.school}</text>
      <text x="50" y="114" fill="#555" fontSize="13" fontFamily="sans-serif">{data.position} • #{data.jerseyNumber}</text>
      <text x="50" y="134" fill="#555" fontSize="13" fontFamily="sans-serif">{data.height} • {data.weight} • {data.hometown}</text>
      <text x="50" y="154" fill="#555" fontSize="13" fontFamily="sans-serif">Class: {data.year} • {data.sport}</text>
      {/* Detailed record table (like batting record) */}
      <rect x="30" y="175" width="465" height="30" rx="4" fill={primaryColor} />
      <text x="262" y="195" textAnchor="middle" fill={textColor} fontSize="13" fontWeight="bold" fontFamily="sans-serif">COMPLETE SEASON RECORD</text>
      {/* Table header */}
      <rect x="30" y="205" width="465" height="28" fill={accentColor} opacity="0.5" />
      {stats.map((s, i) => (
        <text key={`h${i}`} x={142 + i * 116} y="224" textAnchor="middle" fill={primaryColor} fontSize="11" fontWeight="bold" fontFamily="sans-serif">{s.label}</text>
      ))}
      {/* Values row */}
      <rect x="30" y="233" width="465" height="36" fill="#f0ece3" />
      {stats.map((s, i) => (
        <text key={`v${i}`} x={142 + i * 116} y="258" textAnchor="middle" fill={primaryColor} fontSize="20" fontWeight="bold" fontFamily="'Arial Black', sans-serif">{s.value}</text>
      ))}
      {/* Highlights section */}
      <text x="50" y="306" fill={secondaryColor} fontSize="14" fontWeight="bold" fontFamily="sans-serif">HIGHLIGHTS</text>
      <line x1="50" y1="314" x2="475" y2="314" stroke={accentColor} strokeWidth="2" />
      {[data.highlight1, data.highlight2, data.highlight3].filter(Boolean).map((h, i) => (
        <text key={i} x="60" y={338 + i * 24} fill="#444" fontSize="13" fontFamily="sans-serif">• {h}</text>
      ))}
      {/* Cartoon icon placeholder */}
      <rect x="180" y="420" width="165" height="120" rx="8" fill="#f0ece3" stroke={accentColor} strokeWidth="1" strokeDasharray="4,4" />
      <text x="262" y="485" textAnchor="middle" fill="#bbb" fontSize="12" fontFamily="sans-serif">ICON / MASCOT</text>
      {/* QR placeholder */}
      <rect x="210" y="560" width="105" height="105" rx="6" fill="#eee" stroke="#ccc" strokeWidth="1" />
      <text x="262" y="618" textAnchor="middle" fill="#bbb" fontSize="10" fontFamily="sans-serif">QR CODE</text>
      {/* Bottom pennant */}
      <path d="M120 690 Q262 680 405 690 L405 710 Q262 700 120 710 Z" fill={secondaryColor} opacity="0.3" />
      <text x="262" y="706" textAnchor="middle" fill="#888" fontSize="10" fontFamily="sans-serif">{data.school} {data.sport} • {data.year}</text>
    </svg>
  );
}
