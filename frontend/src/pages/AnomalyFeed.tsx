import { useState } from 'react'
import TopBar from '../components/layout/TopBar'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { useCityAnomalies } from '../api/useCity'
import { useStore } from '../store/useStore'
import { AlertTriangle, Zap, Clock, TrendingUp } from 'lucide-react'

const SEVERITY_CONFIG: Record<string, { color: string; bg: string; glow: string }> = {
  Critical: { color: '#ff1744', bg: '#ff174411', glow: '#ff174433' },
  High:     { color: '#ff5252', bg: '#ff525211', glow: '#ff525233' },
  Medium:   { color: '#ff9100', bg: '#ff910011', glow: '#ff910033' },
  Low:      { color: '#ffea00', bg: '#ffea0011', glow: '#ffea0033' },
}

const CITIES = ['Delhi','Mumbai','Beijing','Shanghai','Los Angeles','New York','London','Paris','Tokyo','São Paulo','Cairo','Lahore','Dhaka','Karachi','Bangkok','Jakarta','Sydney','Toronto','Berlin','Seoul']

const POLLUTANT_COLOR: Record<string, string> = {
  pm25: '#ff5252', pm10: '#ff9100', no2: '#e040fb', o3: '#00d4ff', co: '#ffea00', so2: '#00e676'
}

export default function AnomalyFeed() {
  const { selectedCity, setSelectedCity } = useStore()
  const [filter, setFilter] = useState('All')
  const { data, isLoading } = useCityAnomalies(selectedCity)

  const anomalies = data?.anomalies || []
  const filtered = filter === 'All' ? anomalies : anomalies.filter((a: any) => a.severity === filter)

  const counts = {
    Critical: anomalies.filter((a: any) => a.severity === 'Critical').length,
    High:     anomalies.filter((a: any) => a.severity === 'High').length,
    Medium:   anomalies.filter((a: any) => a.severity === 'Medium').length,
    Low:      anomalies.filter((a: any) => a.severity === 'Low').length,
  }

  const worstScore = anomalies.length ? Math.min(...anomalies.map((a: any) => a.anomaly_score || 0)).toFixed(3) : '—'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'auto', background: '#080c14' }}>
      <TopBar title="Anomaly Detection Feed" />
      <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Summary cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
          {Object.entries(SEVERITY_CONFIG).map(([sev, cfg]) => (
            <div key={sev} onClick={() => setFilter(sev === filter ? 'All' : sev)}
              style={{
                borderRadius: 14, padding: '18px 20px', cursor: 'pointer',
                background: filter === sev ? cfg.bg : 'rgba(13,19,33,0.9)',
                border: `1px solid ${filter === sev ? cfg.color + '66' : '#1e2d40'}`,
                boxShadow: filter === sev ? `0 0 20px ${cfg.glow}` : 'none',
                transition: 'all 0.2s', position: 'relative', overflow: 'hidden'
              }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,transparent,${cfg.color},transparent)`, opacity: filter === sev ? 1 : 0.3 }} />
              <p style={{ fontSize: 11, color: cfg.color, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{sev}</p>
              <p style={{ fontSize: 32, fontFamily: 'monospace', fontWeight: 700, color: cfg.color, margin: 0, lineHeight: 1 }}>{counts[sev as keyof typeof counts]}</p>
              <p style={{ fontSize: 11, color: '#64748b', margin: '6px 0 0' }}>events detected</p>
            </div>
          ))}
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
          <div style={{ background: 'rgba(13,19,33,0.9)', border: '1px solid #1e2d40', borderRadius: 12, padding: '14px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <Zap size={13} style={{ color: '#ff1744' }} />
              <span style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Total Events</span>
            </div>
            <p style={{ fontSize: 24, fontFamily: 'monospace', fontWeight: 700, color: '#e2e8f0', margin: 0 }}>{anomalies.length}</p>
          </div>
          <div style={{ background: 'rgba(13,19,33,0.9)', border: '1px solid #1e2d40', borderRadius: 12, padding: '14px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <TrendingUp size={13} style={{ color: '#ff5252' }} />
              <span style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Worst Score</span>
            </div>
            <p style={{ fontSize: 24, fontFamily: 'monospace', fontWeight: 700, color: '#ff5252', margin: 0 }}>{worstScore}</p>
          </div>
          <div style={{ background: 'rgba(13,19,33,0.9)', border: '1px solid #1e2d40', borderRadius: 12, padding: '14px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <Clock size={13} style={{ color: '#00d4ff' }} />
              <span style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Model</span>
            </div>
            <p style={{ fontSize: 14, fontFamily: 'monospace', fontWeight: 700, color: '#00d4ff', margin: 0 }}>Isolation Forest</p>
          </div>
        </div>

        {/* Feed */}
        <div style={{ background: 'rgba(13,19,33,0.9)', border: '1px solid #1e2d40', borderRadius: 16, padding: 24, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,transparent,#ff1744,transparent)' }} />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#ff174411', border: '1px solid #ff174433' }}>
                <AlertTriangle size={16} style={{ color: '#ff1744' }} />
              </div>
              <div>
                <h2 style={{ fontWeight: 600, color: '#e2e8f0', margin: 0, fontSize: 16 }}>Pollution Anomalies — {selectedCity}</h2>
                <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0' }}>{filtered.length} events · Isolation Forest · 3% contamination threshold</p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {/* Filter pills */}
              <div style={{ display: 'flex', gap: 6 }}>
                {['All', 'Critical', 'High', 'Medium', 'Low'].map(s => {
                  const cfg = SEVERITY_CONFIG[s as keyof typeof SEVERITY_CONFIG]
                  return (
                    <button key={s} onClick={() => setFilter(s)}
                      style={{
                        padding: '5px 12px', borderRadius: 20, fontSize: 12, cursor: 'pointer', fontWeight: 500,
                        background: filter === s ? (cfg?.bg || '#00d4ff11') : 'transparent',
                        border: `1px solid ${filter === s ? (cfg?.color + '66' || '#00d4ff44') : '#1e2d40'}`,
                        color: filter === s ? (cfg?.color || '#00d4ff') : '#64748b',
                        transition: 'all 0.2s'
                      }}>
                      {s}
                    </button>
                  )
                })}
              </div>

              {/* City selector */}
              <select value={selectedCity} onChange={e => setSelectedCity(e.target.value)}
                style={{ padding: '6px 12px', borderRadius: 8, fontSize: 13, color: '#e2e8f0', background: '#0d1321', border: '1px solid #1e2d40', cursor: 'pointer' }}>
                {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {isLoading ? <LoadingSpinner text="Scanning for anomalies..." /> :
           filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <Zap size={36} style={{ color: '#334155', margin: '0 auto 12px' }} />
              <p style={{ color: '#64748b', fontSize: 14 }}>No anomalies for {selectedCity}</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filtered.map((a: any, i: number) => {
                const cfg = SEVERITY_CONFIG[a.severity] || SEVERITY_CONFIG.Low
                const pollColor = POLLUTANT_COLOR[a.pollutant] || '#64748b'
                return (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 16, borderRadius: 12, padding: '14px 18px',
                    background: '#0d1321', border: `1px solid ${cfg.color}22`,
                    transition: 'border-color 0.2s'
                  }}>
                    {/* Severity dot */}
                    <div style={{ width: 10, height: 10, borderRadius: '50%', flexShrink: 0, background: cfg.color, boxShadow: `0 0 10px ${cfg.color}`, animation: a.severity === 'Critical' ? 'pulse 1.5s infinite' : 'none' }} />

                    {/* Pollutant badge */}
                    <div style={{ padding: '3px 10px', borderRadius: 8, background: `${pollColor}18`, border: `1px solid ${pollColor}44`, color: pollColor, fontSize: 12, fontWeight: 700, fontFamily: 'monospace', flexShrink: 0 }}>
                      {a.pollutant?.toUpperCase()}
                    </div>

                    {/* City + time */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                        <span style={{ fontSize: 13, fontWeight: 500, color: '#e2e8f0' }}>{selectedCity}</span>
                        <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: 11, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.glow}` }}>{a.severity}</span>
                      </div>
                      <p style={{ fontSize: 11, color: '#64748b', margin: 0 }}>
                        {a.timestamp ? new Date(a.timestamp).toLocaleString() : 'Recent'}
                      </p>
                    </div>

                    {/* Value + score */}
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p style={{ fontSize: 16, fontFamily: 'monospace', fontWeight: 700, color: cfg.color, margin: 0 }}>{a.value?.toFixed(1) ?? '—'}</p>
                      <p style={{ fontSize: 11, color: '#64748b', margin: '2px 0 0' }}>score: {a.anomaly_score?.toFixed(3)}</p>
                    </div>

                    {/* Score bar */}
                    <div style={{ width: 60, flexShrink: 0 }}>
                      <div style={{ height: 4, background: '#1e2d40', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${Math.min(Math.abs(a.anomaly_score || 0) * 200, 100)}%`, background: cfg.color, borderRadius: 2 }} />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}