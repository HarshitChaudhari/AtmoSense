interface Props { aqi: number; category: string }

const ZONES = [
  { label: 'Good',      max: 50,  color: '#00e676' },
  { label: 'Moderate',  max: 100, color: '#ffea00' },
  { label: 'USG',       max: 150, color: '#ff9100' },
  { label: 'Unhealthy', max: 200, color: '#ff5252' },
  { label: 'Very',      max: 300, color: '#e040fb' },
  { label: 'Hazardous', max: 500, color: '#ff1744' },
]

function getColor(aqi: number) {
  for (const z of ZONES) if (aqi <= z.max) return z.color
  return '#ff1744'
}

export default function AqiGauge({ aqi, category }: Props) {
  const MAX = 500
  const clamped = Math.min(aqi, MAX)
  const color = getColor(aqi)

  // SVG arc parameters
  const cx = 100, cy = 100, r = 80
  const startAngle = -210
  const sweepAngle = 240
  const toRad = (deg: number) => (deg * Math.PI) / 180

  const arcPath = (start: number, sweep: number, radius: number) => {
    const s = toRad(start)
    const e = toRad(start + sweep)
    const x1 = cx + radius * Math.cos(s)
    const y1 = cy + radius * Math.sin(s)
    const x2 = cx + radius * Math.cos(e)
    const y2 = cy + radius * Math.sin(e)
    const large = sweep > 180 ? 1 : 0
    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${large} 1 ${x2} ${y2}`
  }

  const valueAngle = startAngle + (clamped / MAX) * sweepAngle
  const needleRad = toRad(valueAngle)
  const needleX = cx + 60 * Math.cos(needleRad)
  const needleY = cy + 60 * Math.sin(needleRad)

  // Zone arcs
  let prevAngle = startAngle
  const zoneArcs = ZONES.map(zone => {
    const zoneSweep = ((Math.min(zone.max, MAX)) / MAX) * sweepAngle
    const startA = prevAngle
    const endA = startAngle + zoneSweep
    prevAngle = endA
    return { ...zone, path: arcPath(startA, endA - startA, r), color: zone.color }
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg width="200" height="140" viewBox="0 0 200 140">
        {/* Background track */}
        <path d={arcPath(startAngle, sweepAngle, r)} fill="none" stroke="#1e2d40" strokeWidth="14" strokeLinecap="round" />

        {/* Zone colored arcs */}
        {zoneArcs.map((z, i) => (
          <path key={i} d={z.path} fill="none" stroke={z.color} strokeWidth="14" strokeLinecap="round" opacity="0.3" />
        ))}

        {/* Value arc */}
        <path
          d={arcPath(startAngle, (clamped / MAX) * sweepAngle, r)}
          fill="none" stroke={color} strokeWidth="14" strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 6px ${color})` }}
        />

        {/* Needle */}
        <line x1={cx} y1={cy} x2={needleX} y2={needleY} stroke={color} strokeWidth="2.5" strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 4px ${color})` }} />
        <circle cx={cx} cy={cy} r="5" fill={color} style={{ filter: `drop-shadow(0 0 6px ${color})` }} />

        {/* AQI value */}
        <text x={cx} y={cy + 22} textAnchor="middle" fill={color}
          style={{ fontSize: 26, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>
          {Math.round(aqi)}
        </text>
        <text x={cx} y={cy + 38} textAnchor="middle" fill="#64748b" style={{ fontSize: 11 }}>
          AQI
        </text>
      </svg>

      {/* Category label */}
      <div style={{
        marginTop: 4, padding: '4px 14px', borderRadius: 20, fontSize: 13, fontWeight: 500,
        color, background: `${color}18`, border: `1px solid ${color}44`,
        boxShadow: `0 0 12px ${color}33`
      }}>
        {category}
      </div>

      {/* Zone legend */}
      <div style={{ display: 'flex', gap: 6, marginTop: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        {ZONES.map(z => (
          <div key={z.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: z.color }} />
            <span style={{ fontSize: 10, color: '#64748b' }}>{z.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}