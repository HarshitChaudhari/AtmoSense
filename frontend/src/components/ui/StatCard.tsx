import { type ReactNode, useEffect, useState } from 'react'

interface Props {
  label: string
  value: string | number
  unit?: string
  icon?: ReactNode
  trend?: 'up' | 'down' | 'neutral'
  color?: string
  subtitle?: string
  animate?: boolean
}

function useCountUp(target: number, duration = 1000) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    let start = 0
    const step = target / (duration / 16)
    const timer = setInterval(() => {
      start += step
      if (start >= target) { setCount(target); clearInterval(timer) }
      else setCount(Math.floor(start))
    }, 16)
    return () => clearInterval(timer)
  }, [target, duration])
  return count
}

export default function StatCard({ label, value, unit, icon, trend, color = '#00d4ff', subtitle, animate = true }: Props) {
  const isNumber = typeof value === 'number' || (typeof value === 'string' && !isNaN(Number(value)))
  const numericValue = isNumber ? Number(value) : 0
  const animatedValue = useCountUp(animate && isNumber ? numericValue : 0)
  const displayValue = animate && isNumber ? animatedValue : value

  return (
    <div className="stat-card group" style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Gradient top border */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${color}, transparent)`, opacity: 0.6 }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 11, fontWeight: 500, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
        {icon && (
          <div style={{ width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${color}11`, border: `1px solid ${color}33` }}>
            <span style={{ color }}>{icon}</span>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4 }}>
        <span style={{ fontSize: 28, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color, lineHeight: 1 }}>
          {displayValue}
        </span>
        {unit && <span style={{ fontSize: 13, color: '#64748b', marginBottom: 2 }}>{unit}</span>}
      </div>

      {subtitle && <p style={{ fontSize: 12, color: '#64748b', marginTop: 6 }}>{subtitle}</p>}

      {trend && (
        <div style={{ fontSize: 11, marginTop: 8, color: trend === 'up' ? '#ff5252' : trend === 'down' ? '#00e676' : '#64748b' }}>
          {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} vs yesterday
        </div>
      )}
    </div>
  )
}