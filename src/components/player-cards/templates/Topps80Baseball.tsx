import type { CardData } from '../types';

interface Props { data: CardData; }

// 1986 Fleer Jordan RC style — five horizontal color bands: RED-BLUE-WHITE-BLUE-RED
// with rounded rectangle photo container + yellow stroke overlay
export function Topps80BaseballFront({ data }: Props) {
  const { primaryColor, secondaryColor, accentColor, textColor, mainPhoto, playerName, position, jerseyNumber, school, logoImage } = data;
  return (
    <svg viewBox="0 0 525 735" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      <defs>
        <clipPath id="jrc-photo"><rect x="52" y="36" width="421" height="548" rx="10" /></clipPath>
      </defs>

      {/* === FIVE HORIZONTAL COLOR BANDS === */}
      {/* Band 1: Red top (0–125) */}
      <rect width="525" height="735" rx="14" fill={primaryColor} />

      {/* Band 2: Blue (125–305) — taller for visibility */}
      <rect x="0" y="125" width="525" height="180" fill={secondaryColor} />

      {/* Band 3: White middle (305–430) */}
      <rect x="0" y="305" width="525" height="125" fill="white" />

      {/* Band 4: Blue (430–610) — taller for visibility */}
      <rect x="0" y="430" width="525" height="180" fill={secondaryColor} />

      {/* Band 5: Red bottom (610–735) — covered by base rect */}

      {/* === MAIN PHOTO CONTAINER — rounded rect with yellow stroke === */}
      {/* Yellow stroke border */}
      <rect x="46" y="30" width="433" height="560" rx="12" fill={accentColor} />
      {/* Inner photo area */}
      <rect x="52" y="36" width="421" height="548" rx="10" fill="#e0e0e0" />

      {/* Checkerboard placeholder when no photo */}
      {!mainPhoto && (
        <g clipPath="url(#jrc-photo)">
          {Array.from({ length: 29 }).map((_, i) =>
            Array.from({ length: 22 }).map((_, j) =>
              (i + j) % 2 === 0 ? <rect key={`${i}-${j}`} x={52 + j * 20} y={36 + i * 20} width="20" height="20" fill="#d0d0d0" /> : null
            )
          )}
          <text x="262" y="320" textAnchor="middle" fill="#999" fontSize="22" fontFamily="sans-serif">DROP PHOTO HERE</text>
        </g>
      )}
      {mainPhoto && (
        <image href={mainPhoto} x="52" y="36" width="421" height="548" clipPath="url(#jrc-photo)" preserveAspectRatio="xMidYMid slice" />
      )}

      {/* === NAME BANNER — below the photo container === */}
      <rect x="46" y="608" width="433" height="52" rx="6" fill={secondaryColor} />
      <rect x="46" y="608" width="433" height="52" rx="6" fill="none" stroke={accentColor} strokeWidth="2" />
      <text x="262" y="642" textAnchor="middle" fill={textColor} fontSize="26" fontWeight="bold" fontFamily="'Arial Black', sans-serif" letterSpacing="3">
        {playerName}
      </text>

      {/* Position + School */}
      <text x="262" y="686" textAnchor="middle" fill={textColor} fontSize="14" fontWeight="bold" fontFamily="sans-serif" letterSpacing="1" opacity="0.9">
        {school} {'\u2022'} {position}
      </text>

      {/* Jersey number badge — top right inside photo area */}
      <rect x="398" y="44" width="64" height="40" rx="6" fill={primaryColor} opacity="0.92" />
      <rect x="398" y="44" width="64" height="40" rx="6" fill="none" stroke={accentColor} strokeWidth="1.5" />
      <text x="430" y="72" textAnchor="middle" fill={textColor} fontSize="22" fontWeight="bold" fontFamily="'Arial Black', sans-serif">
        #{jerseyNumber}
      </text>

      {/* Logo circle — top left inside photo area */}
      <circle cx="94" cy="64" r="26" fill={primaryColor} opacity="0.92" />
      <circle cx="94" cy="64" r="26" fill="none" stroke={accentColor} strokeWidth="1.5" />
      {logoImage ? (
        <image href={logoImage} x="74" y="44" width="40" height="40" clipPath="circle(18px at 20px 20px)" />
      ) : (
        <text x="94" y="70" textAnchor="middle" fill={textColor} fontSize="14" fontWeight="bold" fontFamily="sans-serif">
          {school.substring(0, 3)}
        </text>
      )}

      {/* Sport tag bottom right */}
      <text x="478" y="722" textAnchor="end" fill={textColor} fontSize="10" fontFamily="sans-serif" opacity="0.4">
        {data.sport}
      </text>
    </svg>
  );
}

export function Topps80BaseballBack({ data }: Props) {
  const { primaryColor, secondaryColor, accentColor } = data;
  const stats = [
    { label: data.stat1Label, value: data.stat1Value },
    { label: data.stat2Label, value: data.stat2Value },
    { label: data.stat3Label, value: data.stat3Value },
    { label: data.stat4Label, value: data.stat4Value },
  ];
  return (
    <svg viewBox="0 0 525 735" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      {/* Card base — primary color */}
      <rect width="525" height="735" rx="14" fill={primaryColor} />

      {/* Inner content panel — cream */}
      <rect x="20" y="20" width="485" height="695" rx="10" fill="#faf8f2" stroke={accentColor} strokeWidth="3" />

      {/* Top header band — secondary color */}
      <rect x="20" y="20" width="485" height="70" rx="10" fill={secondaryColor} />
      <rect x="20" y="82" width="485" height="8" fill={secondaryColor} />

      {/* Accent stripe in header */}
      <rect x="20" y="68" width="485" height="4" fill={accentColor} />

      {/* Logo circle in header */}
      <circle cx="60" cy="50" r="24" fill="white" />
      {data.logoImage ? (
        <image href={data.logoImage} x="40" y="30" width="40" height="40" />
      ) : (
        <text x="60" y="56" textAnchor="middle" fill={secondaryColor} fontSize="12" fontWeight="bold" fontFamily="sans-serif">
          {data.school.substring(0, 3)}
        </text>
      )}

      {/* Player name in header */}
      <text x="262" y="48" textAnchor="middle" fill="white" fontSize="22" fontWeight="bold" fontFamily="'Arial Black', sans-serif" letterSpacing="2">
        {data.playerName}
      </text>
      <text x="262" y="66" textAnchor="middle" fill={accentColor} fontSize="13" fontWeight="bold" fontFamily="sans-serif">
        {data.school} {'\u2022'} {data.position}
      </text>

      {/* Card number top right */}
      <rect x="445" y="26" width="50" height="28" rx="4" fill={primaryColor} />
      <text x="470" y="46" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold" fontFamily="sans-serif">
        #{data.jerseyNumber}
      </text>

      {/* Bio section */}
      <rect x="36" y="106" width="453" height="100" rx="6" fill="white" stroke="#ddd" strokeWidth="1" />
      <text x="52" y="130" fill={secondaryColor} fontSize="12" fontWeight="bold" fontFamily="sans-serif">PLAYER INFO</text>
      <line x1="52" y1="138" x2="475" y2="138" stroke="#eee" strokeWidth="1" />
      <text x="52" y="158" fill="#555" fontSize="12" fontFamily="sans-serif">Height: {data.height}  {'\u2022'}  Weight: {data.weight}</text>
      <text x="52" y="178" fill="#555" fontSize="12" fontFamily="sans-serif">Hometown: {data.hometown}  {'\u2022'}  Year: {data.year}</text>
      <text x="52" y="198" fill="#555" fontSize="12" fontFamily="sans-serif">Sport: {data.sport}</text>

      {/* Stats table header */}
      <rect x="36" y="222" width="453" height="34" rx="4" fill={primaryColor} />
      <text x="262" y="245" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold" fontFamily="sans-serif" letterSpacing="1">
        SEASON STATISTICS
      </text>

      {/* Stats column headers */}
      <rect x="36" y="256" width="453" height="28" fill={secondaryColor} opacity="0.15" />
      {stats.map((s, i) => (
        <text key={`h${i}`} x={149 + i * 113} y="275" textAnchor="middle" fill={secondaryColor} fontSize="11" fontWeight="bold" fontFamily="sans-serif">
          {s.label}
        </text>
      ))}

      {/* Stats values */}
      <rect x="36" y="284" width="453" height="50" fill="white" stroke="#eee" strokeWidth="1" />
      {stats.map((s, i) => (
        <text key={`v${i}`} x={149 + i * 113} y="316" textAnchor="middle" fill={primaryColor} fontSize="24" fontWeight="bold" fontFamily="'Arial Black', sans-serif">
          {s.value}
        </text>
      ))}

      {/* Accent divider — mirrors front bands */}
      <rect x="36" y="348" width="453" height="4" fill={secondaryColor} />
      <rect x="36" y="352" width="453" height="3" fill={accentColor} />
      <rect x="36" y="355" width="453" height="4" fill={secondaryColor} />

      {/* Highlights */}
      <rect x="36" y="374" width="453" height="30" rx="4" fill={secondaryColor} opacity="0.08" />
      <text x="52" y="394" fill={secondaryColor} fontSize="13" fontWeight="bold" fontFamily="sans-serif" letterSpacing="1">HIGHLIGHTS</text>

      {[data.highlight1, data.highlight2, data.highlight3].filter(Boolean).map((h, i) => (
        <g key={i}>
          <rect x="36" y={414 + i * 36} width="453" height="32" rx="4" fill={i % 2 === 0 ? '#f8f6f0' : 'white'} />
          <circle cx="54" cy={430 + i * 36} r="4" fill={primaryColor} />
          <text x="68" y={435 + i * 36} fill="#333" fontSize="13" fontFamily="sans-serif">{h}</text>
        </g>
      ))}

      {/* Bottom five-band echo — mirrors front design */}
      <rect x="36" y="540" width="453" height="8" fill={primaryColor} opacity="0.3" />
      <rect x="36" y="548" width="453" height="5" fill={secondaryColor} opacity="0.3" />
      <rect x="36" y="553" width="453" height="12" fill="white" stroke="#eee" strokeWidth="0.5" />
      <rect x="36" y="565" width="453" height="5" fill={secondaryColor} opacity="0.3" />
      <rect x="36" y="570" width="453" height="8" fill={primaryColor} opacity="0.3" />

      {/* Bottom logo */}
      <circle cx="262" cy="610" r="24" fill={primaryColor} opacity="0.15" />
      {data.logoImage ? (
        <image href={data.logoImage} x="244" y="592" width="36" height="36" />
      ) : (
        <text x="262" y="616" textAnchor="middle" fill={primaryColor} fontSize="10" fontFamily="sans-serif">LOGO</text>
      )}

      {/* Bottom text */}
      <rect x="20" y="650" width="485" height="65" rx="10" fill={secondaryColor} opacity="0.06" />
      <rect x="20" y="650" width="485" height="2" fill={primaryColor} />
      <text x="262" y="680" textAnchor="middle" fill="#aaa" fontSize="10" fontFamily="sans-serif">
        {data.school} {data.sport} {'\u2022'} {data.year}
      </text>
      <text x="262" y="700" textAnchor="middle" fill="#bbb" fontSize="9" fontFamily="sans-serif">
        LOCALHUSTLE PLAYER CARD
      </text>
    </svg>
  );
}
