import type { CardData } from '../types';

interface Props { data: CardData; }

export function Topps80BBallFront({ data }: Props) {
  const { primaryColor, secondaryColor, accentColor, textColor, mainPhoto, secondaryPhoto, playerName, position, jerseyNumber, school } = data;
  // Tri-panel layout: two side panels + center main
  return (
    <svg viewBox="0 0 525 735" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      <defs>
        <clipPath id="t80-left"><rect x="18" y="80" width="148" height="500" rx="6" /></clipPath>
        <clipPath id="t80-center"><rect x="178" y="50" width="169" height="560" rx="6" /></clipPath>
        <clipPath id="t80-right"><rect x="359" y="80" width="148" height="500" rx="6" /></clipPath>
      </defs>
      {/* Card base */}
      <rect width="525" height="735" rx="14" fill="#f5f0e6" />
      {/* Three panel borders */}
      <rect x="12" y="74" width="160" height="512" rx="8" fill={primaryColor} />
      <rect x="172" y="44" width="181" height="572" rx="8" fill={accentColor} />
      <rect x="353" y="74" width="160" height="512" rx="8" fill={secondaryColor} />
      {/* Panel photo areas */}
      <rect x="18" y="80" width="148" height="500" rx="6" fill="#ddd" />
      <rect x="178" y="50" width="169" height="560" rx="6" fill="#ddd" />
      <rect x="359" y="80" width="148" height="500" rx="6" fill="#ddd" />
      {/* Checkerboard for empty panels */}
      {!mainPhoto && (
        <g clipPath="url(#t80-center)">
          {Array.from({ length: 30 }).map((_, i) =>
            Array.from({ length: 10 }).map((_, j) =>
              (i + j) % 2 === 0 ? <rect key={`c${i}-${j}`} x={178 + j * 18} y={50 + i * 20} width="18" height="20" fill="#ccc" /> : null
            )
          )}
          <text x="262" y="340" textAnchor="middle" fill="#999" fontSize="16" fontFamily="sans-serif">MAIN PHOTO</text>
        </g>
      )}
      {mainPhoto && <image href={mainPhoto} x="178" y="50" width="169" height="560" clipPath="url(#t80-center)" preserveAspectRatio="xMidYMid slice" />}
      {/* Side panels - secondary photo or placeholder */}
      {!secondaryPhoto && (
        <>
          <g clipPath="url(#t80-left)">
            <text x="92" y="340" textAnchor="middle" fill="#aaa" fontSize="12" fontFamily="sans-serif">PHOTO 2</text>
          </g>
          <g clipPath="url(#t80-right)">
            <text x="433" y="340" textAnchor="middle" fill="#aaa" fontSize="12" fontFamily="sans-serif">PHOTO 3</text>
          </g>
        </>
      )}
      {secondaryPhoto && (
        <>
          <image href={secondaryPhoto} x="18" y="80" width="148" height="500" clipPath="url(#t80-left)" preserveAspectRatio="xMidYMid slice" />
          <image href={secondaryPhoto} x="359" y="80" width="148" height="500" clipPath="url(#t80-right)" preserveAspectRatio="xMidYMid slice" />
        </>
      )}
      {/* Top banner */}
      <rect x="140" y="8" width="245" height="30" rx="4" fill={primaryColor} />
      <text x="262" y="30" textAnchor="middle" fill={textColor} fontSize="14" fontWeight="bold" fontFamily="sans-serif" letterSpacing="3">
        {data.sport.toUpperCase()} LEADERS
      </text>
      {/* Center circle logo */}
      <circle cx="262" cy="330" r="28" fill={primaryColor} stroke={accentColor} strokeWidth="3" opacity="0.9" />
      <text x="262" y="326" textAnchor="middle" fill={textColor} fontSize="8" fontFamily="sans-serif">#{jerseyNumber}</text>
      <text x="262" y="340" textAnchor="middle" fill={accentColor} fontSize="10" fontWeight="bold" fontFamily="sans-serif">
        {school.substring(0, 5).toUpperCase()}
      </text>
      {/* Bottom name bar */}
      <rect x="20" y="630" width="485" height="50" rx="6" fill={primaryColor} />
      <rect x="20" y="630" width="485" height="50" rx="6" fill="none" stroke={accentColor} strokeWidth="2" />
      <text x="262" y="662" textAnchor="middle" fill={textColor} fontSize="20" fontWeight="bold" fontFamily="'Arial Black', sans-serif" letterSpacing="2">
        {playerName}
      </text>
      {/* Position labels under panels */}
      <text x="92" y="606" textAnchor="middle" fill={primaryColor} fontSize="11" fontWeight="bold" fontFamily="sans-serif">{position}</text>
      <text x="262" y="632" textAnchor="middle" fill={accentColor} fontSize="11" fontWeight="bold" fontFamily="sans-serif">#{jerseyNumber}</text>
      <text x="433" y="606" textAnchor="middle" fill={secondaryColor} fontSize="11" fontWeight="bold" fontFamily="sans-serif">{school}</text>
      <text x="262" y="710" textAnchor="middle" fill="#888" fontSize="11" fontFamily="sans-serif">{school} • {data.year}</text>
    </svg>
  );
}

export function Topps80BBallBack({ data }: Props) {
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
      <rect x="8" y="8" width="509" height="719" rx="10" fill="none" stroke={primaryColor} strokeWidth="4" />
      {/* Header */}
      <rect x="30" y="30" width="465" height="55" rx="6" fill={primaryColor} />
      <text x="262" y="65" textAnchor="middle" fill={textColor} fontSize="22" fontWeight="bold" fontFamily="'Arial Black', sans-serif" letterSpacing="2">{data.playerName}</text>
      {/* Three column stats */}
      <rect x="30" y="100" width="465" height="36" rx="4" fill={accentColor} />
      <text x="262" y="124" textAnchor="middle" fill={primaryColor} fontSize="15" fontWeight="bold" fontFamily="sans-serif">SCORING LEADERS STATS</text>
      {stats.map((s, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const rectX = 30 + col * 235;
        const rectW = 230;
        const centerX = rectX + rectW / 2;
        return (
          <g key={i}>
            <rect x={rectX} y={148 + row * 80} width={rectW} height="70" rx="4" fill={i % 2 === 0 ? '#f0ece3' : '#e8e4db'} stroke={secondaryColor} strokeWidth="1" />
            <text x={centerX} y={180 + row * 80} textAnchor="middle" fill={primaryColor} fontSize="28" fontWeight="bold" fontFamily="'Arial Black', sans-serif">{s.value}</text>
            <text x={centerX} y={202 + row * 80} textAnchor="middle" fill="#777" fontSize="12" fontFamily="sans-serif">{s.label}</text>
          </g>
        );
      })}
      {/* Bio */}
      <text x="50" y="340" fill={secondaryColor} fontSize="14" fontWeight="bold" fontFamily="sans-serif">PLAYER INFO</text>
      <line x1="50" y1="348" x2="475" y2="348" stroke={accentColor} strokeWidth="2" />
      <text x="50" y="372" fill="#555" fontSize="13" fontFamily="sans-serif">{data.position} • #{data.jerseyNumber} • {data.school}</text>
      <text x="50" y="394" fill="#555" fontSize="13" fontFamily="sans-serif">{data.height} • {data.weight} • {data.hometown}</text>
      <text x="50" y="416" fill="#555" fontSize="13" fontFamily="sans-serif">Class: {data.year}</text>
      {/* Highlights */}
      <text x="50" y="460" fill={secondaryColor} fontSize="14" fontWeight="bold" fontFamily="sans-serif">HIGHLIGHTS</text>
      <line x1="50" y1="468" x2="475" y2="468" stroke={accentColor} strokeWidth="2" />
      {[data.highlight1, data.highlight2, data.highlight3].filter(Boolean).map((h, i) => (
        <text key={i} x="60" y={492 + i * 24} fill="#444" fontSize="13" fontFamily="sans-serif">• {h}</text>
      ))}
      <text x="262" y="700" textAnchor="middle" fill="#aaa" fontSize="10" fontFamily="sans-serif">{data.school} {data.sport} • {data.year}</text>
    </svg>
  );
}
