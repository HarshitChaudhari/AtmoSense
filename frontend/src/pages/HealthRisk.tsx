import TopBar from '../components/layout/TopBar'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { useHealthRisk } from '../api/useWorldMap'
import { Heart, Users, AlertTriangle, Shield } from 'lucide-react'

const RISK_COLOR = (score: number) => {
  if (score >= 60) return '#ff1744'
  if (score >= 45) return '#ff5252'
  if (score >= 30) return '#ff9100'
  if (score >= 15) return '#ffea00'
  return '#00e676'
}

const AQI_COLORS: Record<string, string> = {
  'Good': '#00e676', 'Moderate': '#ffea00',
  'Unhealthy for Sensitive Groups': '#ff9100',
  'Unhealthy': '#ff5252', 'Very Unhealthy': '#e040fb', 'Hazardous': '#ff1744',
}

export default function HealthRisk() {
  const { data, isLoading } = useHealthRisk()
  const rankings = data?.rankings || []
  const top3 = rankings.slice(0, 3)
  const avgRisk = rankings.length ? rankings.reduce((s: number, r: any) => s + (r.health_risk_score || 0), 0) / rankings.length : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'auto', background: '#080c14' }}>
      <TopBar title="Health Risk Index" />
      <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Global stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
          {[
            { label: 'Cities Assessed', value: rankings.length, color: '#00d4ff', icon: <Shield size={14}/> },
            { label: 'Avg Risk Score', value: avgRisk.toFixed(1), color: '#7c3aed', icon: <AlertTriangle size={14}/> },
            { label: 'High Risk Cities', value: rankings.filter((r: any) => r.health_risk_score >= 30).length, color: '#ff5252', icon: <Heart size={14}/> },
            { label: 'People at Risk', value: '2.1B+', color: '#ff9100', icon: <Users size={14}/> },
          ].map(({ label, value, color, icon }) => (
            <div key={label} style={{ background: 'rgba(13,19,33,0.9)', border: '1px solid #1e2d40', borderRadius: 14, padding: '18px 20px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,transparent,${color},transparent)` }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
                <div style={{ width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${color}11`, color }}>
                  {icon}
                </div>
              </div>
              <p style={{ fontSize: 28, fontFamily: 'monospace', fontWeight: 700, color, margin: 0 }}>{value}</p>
            </div>
          ))}
        </div>

        {/* Top 3 podium */}
        {!isLoading && top3.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
            {top3.map((city: any, i: number) => {
              const colors = ['#ff1744', '#ff5252', '#ff9100']
              const labels = ['🏆 Highest Risk', '2nd Highest', '3rd Highest']
              const color = colors[i]
              return (
                <div key={city.city} style={{
                  borderRadius: 16, padding: 24, textAlign: 'center', position: 'relative', overflow: 'hidden',
                  background: `${color}0a`, border: `1px solid ${color}33`,
                  boxShadow: i === 0 ? `0 0 30px ${color}22` : 'none'
                }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,transparent,${color},transparent)` }} />
                  <p style={{ fontSize: 11, color, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{labels[i]}</p>
                  <p style={{ fontSize: 22, fontWeight: 700, color: '#e2e8f0', margin: '0 0 4px' }}>{city.city}</p>
                  <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 12px' }}>{city.country}</p>
                  <p style={{ fontSize: 42, fontFamily: 'monospace', fontWeight: 700, color, margin: '0 0 4px', lineHeight: 1 }}>{city.health_risk_score?.toFixed(0)}</p>
                  <p style={{ fontSize: 11, color: '#64748b', margin: '0 0 12px' }}>Risk Score</p>
                  <div style={{ display: 'inline-block', padding: '4px 14px', borderRadius: 20, fontSize: 12, fontWeight: 500, color: AQI_COLORS[city.aqi_category] || '#64748b', background: `${AQI_COLORS[city.aqi_category] || '#64748b'}18`, border: `1px solid ${AQI_COLORS[city.aqi_category] || '#64748b'}44` }}>
                    {city.aqi_category || 'Unknown'}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Full rankings */}
        <div style={{ background: 'rgba(13,19,33,0.9)', border: '1px solid #1e2d40', borderRadius: 16, padding: 24, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,transparent,#ff1744,transparent)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#ff174411', border: '1px solid #ff174433' }}>
              <Heart size={16} style={{ color: '#ff1744' }} />
            </div>
            <div>
              <h2 style={{ fontWeight: 600, color: '#e2e8f0', margin: 0, fontSize: 16 }}>Full Risk Rankings</h2>
              <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0' }}>Composite: AQI (60%) × Population Density (40%)</p>
            </div>
          </div>

          {isLoading ? <LoadingSpinner text="Computing health risk..." /> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {rankings.map((city: any, i: number) => {
                const color = RISK_COLOR(city.health_risk_score || 0)
                const pct = city.health_risk_score || 0
                return (
                  <div key={city.city} style={{
                    display: 'flex', alignItems: 'center', gap: 16, borderRadius: 12, padding: '14px 18px',
                    background: '#0d1321', border: `1px solid ${i < 3 ? color + '22' : '#1e2d40'}`,
                    transition: 'border-color 0.2s'
                  }}>
                    {/* Rank */}
                    <span style={{ fontSize: 16, fontFamily: 'monospace', fontWeight: 700, width: 36, flexShrink: 0, color: i < 3 ? color : i < 7 ? '#ff9100' : '#334155' }}>
                      #{i + 1}
                    </span>

                    {/* City */}
                    <div style={{ width: 140, flexShrink: 0 }}>
                      <p style={{ fontSize: 14, fontWeight: 500, color: '#e2e8f0', margin: 0 }}>{city.city}</p>
                      <p style={{ fontSize: 11, color: '#64748b', margin: '2px 0 0' }}>{city.country}</p>
                    </div>

                    {/* Risk bar */}
                    <div style={{ flex: 1 }}>
                      <div style={{ height: 8, borderRadius: 4, background: '#1e2d40', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 4, boxShadow: `0 0 8px ${color}66`, transition: 'width 0.8s ease' }} />
                      </div>
                    </div>

                    {/* Score */}
                    <span style={{ fontSize: 18, fontFamily: 'monospace', fontWeight: 700, color, width: 40, textAlign: 'right', flexShrink: 0 }}>
                      {city.health_risk_score?.toFixed(0)}
                    </span>

                    {/* AQI */}
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p style={{ fontSize: 11, color: '#64748b', margin: 0 }}>AQI</p>
                      <p style={{ fontSize: 14, fontFamily: 'monospace', fontWeight: 700, color: '#00d4ff', margin: 0 }}>{city.aqi?.toFixed(0) ?? '—'}</p>
                    </div>

                    {/* Pop density */}
                    <div style={{ textAlign: 'right', width: 100, flexShrink: 0 }}>
                      <p style={{ fontSize: 11, color: '#64748b', margin: 0 }}>Pop/km²</p>
                      <p style={{ fontSize: 12, fontFamily: 'monospace', color: '#94a3b8', margin: 0 }}>{city.population_density?.toLocaleString()}</p>
                    </div>

                    {/* AQI badge */}
                    <div style={{ flexShrink: 0 }}>
                      <div style={{ padding: '3px 10px', borderRadius: 16, fontSize: 11, fontWeight: 500, color: AQI_COLORS[city.aqi_category] || '#64748b', background: `${AQI_COLORS[city.aqi_category] || '#64748b'}18`, border: `1px solid ${AQI_COLORS[city.aqi_category] || '#64748b'}33`, whiteSpace: 'nowrap' }}>
                        {city.aqi_category?.split(' ')[0] || '—'}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Formula card */}
        <div style={{ background: 'rgba(13,19,33,0.9)', border: '1px solid #7c3aed33', borderRadius: 16, padding: 20 }}>
          <h3 style={{ fontWeight: 600, color: '#e2e8f0', margin: '0 0 14px', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={14} style={{ color: '#7c3aed' }} /> Risk Score Formula
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
            {[
              { title: 'AQI Component (60%)', desc: 'Normalized AQI / 500 × 60', color: '#7c3aed' },
              { title: 'Population Density (40%)', desc: 'Normalized pop/km² / 50,000 × 40', color: '#00d4ff' },
              { title: 'Final Score (0–100)', desc: '(0.6 × AQI_norm + 0.4 × Pop_norm) × 100', color: '#00e676' },
            ].map(f => (
              <div key={f.title} style={{ padding: 14, borderRadius: 10, background: `${f.color}08`, border: `1px solid ${f.color}22` }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: f.color, margin: '0 0 6px' }}>{f.title}</p>
                <p style={{ fontSize: 11, color: '#64748b', fontFamily: 'monospace', margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}