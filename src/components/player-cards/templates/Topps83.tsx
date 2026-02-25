import type { CardData } from '../types';

interface Props { data: CardData; }

export function Topps83Front({ data }: Props) {
  const { primaryColor, secondaryColor, accentColor, textColor, mainPhoto, secondaryPhoto, playerName, position, jerseyNumber, school, year } = data;
  return (
    <svg viewBox="0 0 525 735" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      <defs>
        <clipPath id="t83-main"><rect x="30" y="30" width="465" height="530" rx="8" /></clipPath>
        <clipPath id="t83-inset"><circle cx="440" cy="520" r="55" /></clipPath>
      </defs>
      {/* Card base */}
      <rect width="525" height="735" rx="14" fill="#f5f0e6" />
      {/* Team-colored border frame */}
      <rect x="10" y="10" width="505" height="715" rx="10" fill="none" stroke={primaryColor} strokeWidth="6" />
      <rect x="18" y="18" width="489" height="699" rx="8" fill="none" stroke={secondaryColor} strokeWidth="2" />
      {/* Diagonal accent lines in corners */}
      <line x1="10" y1="10" x2="60" y2="60" stroke={accentColor} strokeWidth="4" />
      <line x1="515" y1="10" x2="465" y2="60" stroke={accentColor} strokeWidth="4" />
      {/* Main photo area */}
      <rect x="30" y="30" width="465" height="530" rx="8" fill="#e0e0e0" />
      {!mainPhoto && (
        <g clipPath="url(#t83-main)">
          {Array.from({ length: 28 }).map((_, i) =>
            Array.from({ length: 24 }).map((_, j) =>
              (i + j) % 2 === 0 ? <rect key={`${i}-${j}`} x={30 + j * 20} y={30 + i * 20} width="20" height="20" fill="#d0d0d0" /> : null
            )
          )}
          <text x="262" y="300" textAnchor="middle" fill="#999" fontSize="22" fontFamily="sans-serif">ACTION PHOTO</text>
        </g>
      )}
      {mainPhoto && <image href={mainPhoto} x="30" y="30" width="465" height="530" clipPath="url(#t83-main)" preserveAspectRatio="xMidYMid slice" />}
      {/* Circular inset portrait - bottom right */}
      <circle cx="440" cy="520" r="58" fill={primaryColor} stroke={accentColor} strokeWidth="3" />
      <circle cx="440" cy="520" r="55" fill="#ddd" />
      {!secondaryPhoto && (
        <text x="440" y="525" textAnchor="middle" fill="#999" fontSize="10" fontFamily="sans-serif">PORTRAIT</text>
      )}
      {secondaryPhoto && <image href={secondaryPhoto} x="385" y="465" width="110" height="110" clipPath="url(#t83-inset)" preserveAspectRatio="xMidYMid slice" />}
      {/* Star badge - top left */}
      <polygon points="70,575 78,595 100,595 82,608 89,628 70,616 51,628 58,608 40,595 62,595" fill={accentColor} stroke={primaryColor} strokeWidth="1.5" />
      <text x="70" y="606" textAnchor="middle" fill={primaryColor} fontSize="7" fontWeight="bold" fontFamily="sans-serif">ALL</text>
      <text x="70" y="616" textAnchor="middle" fill={primaryColor} fontSize="7" fontWeight="bold" fontFamily="sans-serif">STAR</text>
      {/* Name bar */}
      <rect x="30" y="640" width="465" height="45" rx="5" fill={primaryColor} />
      <rect x="30" y="640" width="465" height="45" rx="5" fill="none" stroke={accentColor} strokeWidth="2" />
      <text x="262" y="670" textAnchor="middle" fill={textColor} fontSize="22" fontWeight="bold" fontFamily="'Arial Black', sans-serif" letterSpacing="2">{playerName}</text>
      {/* Position & School */}
      <text x="262" y="710" textAnchor="middle" fill={secondaryColor} fontSize="13" fontFamily="sans-serif" fontWeight="600">{position} • {school} • {year}</text>
    </svg>
  );
}

export function Topps83Back({ data }: Props) {
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
      <rect x="10" y="10" width="505" height="715" rx="10" fill="none" stroke={primaryColor} strokeWidth="4" />
      {/* Header bar - orange/black like original */}
      <rect x="30" y="30" width="465" height="55" rx="6" fill={accentColor} />
      <text x="262" y="65" textAnchor="middle" fill={primaryColor} fontSize="22" fontWeight="bold" fontFamily="'Arial Black', sans-serif" letterSpacing="2">{data.playerName}</text>
      {/* Bio */}
      <text x="50" y="116" fill={secondaryColor} fontSize="14" fontWeight="bold" fontFamily="sans-serif">{data.school} • #{data.jerseyNumber}</text>
      <text x="50" y="138" fill="#555" fontSize="13" fontFamily="sans-serif">{data.position} • {data.height} • {data.weight}</text>
      <text x="50" y="158" fill="#555" fontSize="13" fontFamily="sans-serif">{data.hometown} • Class: {data.year}</text>
      {/* Horizontal stats table (like original Topps baseball back) */}
      <rect x="30" y="180" width="465" height="32" rx="0" fill={primaryColor} />
      <text x="100" y="201" textAnchor="middle" fill={textColor} fontSize="12" fontWeight="bold" fontFamily="sans-serif">STAT</text>
      <text x="350" y="201" textAnchor="middle" fill={textColor} fontSize="12" fontWeight="bold" fontFamily="sans-serif">VALUE</text>
      {stats.map((s, i) => (
        <g key={i}>
          <rect x="30" y={212 + i * 38} width="465" height="38" fill={i % 2 === 0 ? '#f0ece3' : '#e8e4db'} />
          <text x="100" y={236 + i * 38} textAnchor="middle" fill="#555" fontSize="14" fontFamily="sans-serif">{s.label}</text>
          <text x="350" y={236 + i * 38} textAnchor="middle" fill={primaryColor} fontSize="18" fontWeight="bold" fontFamily="'Arial Black', sans-serif">{s.value}</text>
        </g>
      ))}
      {/* Fun fact section */}
      <rect x="30" y="380" width="465" height="30" rx="4" fill={accentColor} opacity="0.3" />
      <text x="50" y="400" fill={primaryColor} fontSize="13" fontWeight="bold" fontFamily="sans-serif">FUN FACT</text>
      <text x="50" y="428" fill="#555" fontSize="12" fontFamily="sans-serif">{data.highlight1}</text>
      {/* Highlights */}
      <text x="50" y="470" fill={secondaryColor} fontSize="14" fontWeight="bold" fontFamily="sans-serif">CAREER HIGHLIGHTS</text>
      <line x1="50" y1="478" x2="475" y2="478" stroke={accentColor} strokeWidth="2" />
      {[data.highlight2, data.highlight3].filter(Boolean).map((h, i) => (
        <text key={i} x="60" y={502 + i * 24} fill="#444" fontSize="13" fontFamily="sans-serif">• {h}</text>
      ))}
      <text x="262" y="700" textAnchor="middle" fill="#aaa" fontSize="10" fontFamily="sans-serif">{data.school} {data.sport} • {data.year}</text>
    </svg>
  );
}
