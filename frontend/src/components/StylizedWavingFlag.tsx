/**
 * Presentational only: stylized flag on a stick for background decoration.
 * Flat vector, minimal shapes, softened for blue theme. Sway animation via CSS.
 */
type Country =
  | 'France'
  | 'UK'
  | 'USA'
  | 'Albania'
  | 'Romania'
  | 'Morocco'
  | 'Spain'
  | 'Bulgaria'

const FLAG_COLORS: Record<string, string> = {
  franceBlue: '#6b7bb3',
  franceWhite: '#e8eaf0',
  franceRed: '#c47272',
  ukRed: '#a85555',
  ukBlue: '#5c6b8a',
  ukWhite: '#e8ecf0',
  usaRed: '#b85c5c',
  usaWhite: '#e8e8ec',
  usaBlue: '#4a5f8a',
  albaniaRed: '#b85c5c',
  albaniaBlack: '#3d4450',
  romaniaBlue: '#5c6b92',
  romaniaYellow: '#d4b85c',
  romaniaRed: '#b85c5c',
  moroccoRed: '#b85c5c',
  moroccoGreen: '#5c8a5c',
  spainRed: '#b85c5c',
  spainYellow: '#d4b85c',
  bulgariaWhite: '#e8ecf0',
  bulgariaGreen: '#5c8a6a',
  bulgariaRed: '#c47272',
  pole: '#4a5568',
}

function FlagFrance() {
  const w = 36
  const h = 24
  const x = 4
  const r = 2
  return (
    <>
      <rect x={x} y={0} width={w / 3} height={h} rx={r} ry={r} fill={FLAG_COLORS.franceBlue} />
      <rect x={x + w / 3} y={0} width={w / 3} height={h} rx={r} ry={r} fill={FLAG_COLORS.franceWhite} />
      <rect x={x + (2 * w) / 3} y={0} width={w / 3} height={h} rx={r} ry={r} fill={FLAG_COLORS.franceRed} />
    </>
  )
}

function FlagUK() {
  const x = 4
  const w = 36
  const h = 24
  const r = 2
  return (
    <>
      <rect x={x} y={0} width={w} height={h} rx={r} ry={r} fill={FLAG_COLORS.ukWhite} />
      <rect x={x + w / 2 - 2} y={0} width={4} height={h} rx={1} fill={FLAG_COLORS.ukRed} />
      <rect x={x} y={h / 2 - 2} width={w} height={4} rx={1} fill={FLAG_COLORS.ukRed} />
      <path d={`M${x} 0 L${x + w} ${h} M${x + w} 0 L${x} ${h}`} stroke={FLAG_COLORS.ukBlue} strokeWidth={3} fill="none" strokeLinecap="round" opacity={0.9} />
    </>
  )
}

function FlagUSA() {
  const x = 4
  const w = 36
  const h = 24
  const r = 1.5
  const stripeH = h / 7
  const cantonW = 14
  const cantonH = stripeH * 4
  const stripes = [
    FLAG_COLORS.usaRed,
    FLAG_COLORS.usaWhite,
    FLAG_COLORS.usaRed,
    FLAG_COLORS.usaWhite,
    FLAG_COLORS.usaRed,
    FLAG_COLORS.usaWhite,
    FLAG_COLORS.usaRed,
  ]
  return (
    <>
      {stripes.map((fill, i) => (
        <rect key={i} x={x} y={i * stripeH} width={w} height={stripeH + 0.5} rx={r} fill={fill} />
      ))}
      <rect x={x} y={0} width={cantonW} height={cantonH} rx={r} fill={FLAG_COLORS.usaBlue} />
      {[1, 2, 3].map((row) =>
        [1, 2].map((col) => (
          <circle key={`${row}-${col}`} cx={x + 2.5 + col * 4.5} cy={2 + row * 2.5} r={1} fill={FLAG_COLORS.usaWhite} />
        ))
      )}
    </>
  )
}

function FlagAlbania() {
  const x = 4
  const w = 36
  const h = 24
  const r = 2
  return (
    <>
      <rect x={x} y={0} width={w} height={h} rx={r} ry={r} fill={FLAG_COLORS.albaniaRed} />
      <path
        d={`M${x + w / 2} ${4} L${x + w / 2 + 6} ${h / 2} L${x + w / 2} ${h - 4} L${x + w / 2 - 6} ${h / 2} Z`}
        fill={FLAG_COLORS.albaniaBlack}
      />
    </>
  )
}

function FlagRomania() {
  const w = 36
  const h = 24
  const x = 4
  const r = 2
  return (
    <>
      <rect x={x} y={0} width={w / 3} height={h} rx={r} ry={r} fill={FLAG_COLORS.romaniaBlue} />
      <rect x={x + w / 3} y={0} width={w / 3} height={h} rx={r} ry={r} fill={FLAG_COLORS.romaniaYellow} />
      <rect x={x + (2 * w) / 3} y={0} width={w / 3} height={h} rx={r} ry={r} fill={FLAG_COLORS.romaniaRed} />
    </>
  )
}

function FlagMorocco() {
  const x = 4
  const w = 36
  const h = 24
  const r = 2
  const cx = x + w / 2
  const cy = h / 2
  const R = 5
  const points = Array.from({ length: 5 }, (_, i) => {
    const a = (i * 4 * Math.PI) / 5 - Math.PI / 2
    return `${cx + R * Math.cos(a)},${cy + R * Math.sin(a)}`
  })
  return (
    <>
      <rect x={x} y={0} width={w} height={h} rx={r} ry={r} fill={FLAG_COLORS.moroccoRed} />
      <polygon points={points.join(' ')} fill={FLAG_COLORS.moroccoGreen} />
    </>
  )
}

function FlagSpain() {
  const x = 4
  const w = 36
  const h = 24
  const r = 2
  const bandH = h / 3
  return (
    <>
      <rect x={x} y={0} width={w} height={bandH} rx={r} ry={r} fill={FLAG_COLORS.spainRed} />
      <rect x={x} y={bandH} width={w} height={bandH} rx={r} ry={r} fill={FLAG_COLORS.spainYellow} />
      <rect x={x} y={bandH * 2} width={w} height={bandH} rx={r} ry={r} fill={FLAG_COLORS.spainRed} />
    </>
  )
}

function FlagBulgaria() {
  const x = 4
  const w = 36
  const h = 24
  const r = 2
  const bandH = h / 3
  return (
    <>
      <rect x={x} y={0} width={w} height={bandH} rx={r} ry={r} fill={FLAG_COLORS.bulgariaWhite} />
      <rect x={x} y={bandH} width={w} height={bandH} rx={r} ry={r} fill={FLAG_COLORS.bulgariaGreen} />
      <rect x={x} y={bandH * 2} width={w} height={bandH} rx={r} ry={r} fill={FLAG_COLORS.bulgariaRed} />
    </>
  )
}

const FLAG_SVG: Record<Country, () => JSX.Element> = {
  France: FlagFrance,
  UK: FlagUK,
  USA: FlagUSA,
  Albania: FlagAlbania,
  Romania: FlagRomania,
  Morocco: FlagMorocco,
  Spain: FlagSpain,
  Bulgaria: FlagBulgaria,
}

export type { Country }

export function StylizedWavingFlag({
  country,
  className = '',
}: {
  country: Country
  className?: string
}) {
  const FlagContent = FLAG_SVG[country]
  return (
    <div
      className={`stylized-flag ${className}`}
      style={{ transformOrigin: '0 0' }}
      aria-hidden
    >
      <svg
        viewBox="0 0 44 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: 'block', filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.2))' }}
      >
        <rect x={0} y={0} width={4} height={64} rx={1} fill={FLAG_COLORS.pole} />
        <g stroke="rgba(255,255,255,0.12)" strokeWidth="0.5">
          <FlagContent />
        </g>
      </svg>
    </div>
  )
}
