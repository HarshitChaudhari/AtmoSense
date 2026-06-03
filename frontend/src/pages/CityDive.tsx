import { useState } from 'react'
import TopBar from '../components/layout/TopBar'
import AqiLineChart from '../components/charts/AqiLineChart'
import AqiGauge from '../components/ui/AqiGauge'
import StatCard from '../components/ui/StatCard'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { useCityHistory, useCityForecast, useCitySummary } from '../api/useCity'
import { useStore } from '../store/useStore'
import { TrendingUp, Wind, Droplets, Thermometer, Download } from 'lucide-react'

const DAYS_OPTIONS = [7, 14, 30, 60]

function exportCSV(city: string, history: any[]) {
  if (!history?.length) return
  const headers = ['timestamp', 'aqi', 'aqi_category', 'pm25', 'pm10', 'no2', 'o3', 'co', 'so2', 'temperature', 'humidity', 'wind_speed']
  const rows = history.map(r => headers.map(h => r[h] ?? '').join(','))
  const csv = [headers.join(','), ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${city}_air_quality.csv`
  a.click()
  URL.revokeObjectURL(url)
}

const POLLUTANTS = [
  { key: 'pm25',  label: 'PM2.5', unit: 'µg/m³', color: '#ff5252', limit: 35 },
  { key: 'pm10',  label: 'PM10',  unit: 'µg/m³', color: '#ff9100', limit: 150 },
  { key: 'no2',   label: 'NO₂',   unit: 'ppb',   color: '#e040fb', limit: 100 },
  { key: 'o3',    label: 'O₃',    unit: 'ppb',   color: '#00d4ff', limit: 70 },
  { key: 'co',    label: 'CO',    unit: 'ppm',   color: '#ffea00', limit: 9 },
  { key: 'so2',   label: 'SO₂',   unit: 'ppb',   color: '#00e676', limit: 75 },
]

export default function CityDive() {
  const { selectedCity } = useStore()
  const [days, setDays] = useState(30)
  const [showForecast, setShowForecast] = useState(true)

  const { data: histData, isLoading: histLoading } = useCityHistory(selectedCity, days)
  const { data: forecastData } = useCityForecast(selectedCity, 7)
  const { data: summary } = useCitySummary(selectedCity)

  const latest = summary?.latest
  const stats = summary?.seven_day_stats

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'auto', background: '#080c14' }}>
      <TopBar title={`${selectedCity} — City Deep-Dive`} />

      <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Top section: gauge + stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 20 }}>

          {/* AQI Gauge card */}
          <div style={{
            background: 'rgba(13,19,33,0.9)', border: '1px solid #1e2d40',
            borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden'
          }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,transparent,#00d4ff,transparent)' }} />
            <p style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Current AQI</p>
            {latest?.aqi
              ? <AqiGauge aqi={latest.aqi} category={latest.aqi_category || 'Moderate'} />
              : <div style={{ color: '#64748b', fontSize: 14 }}>No data</div>
            }
          </div>

          {/* Stats grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16 }}>
            <StatCard label="7-Day Avg AQI" value={stats?.avg_aqi?.toFixed(0) ?? 0} icon={<TrendingUp size={14}/>} color="#7c3aed" />
            <StatCard label="7-Day Max AQI" value={stats?.max_aqi?.toFixed(0) ?? 0} icon={<TrendingUp size={14}/>} color="#ff5252" />
            <StatCard label="Temperature" value={latest?.temperature?.toFixed(1) ?? 0} unit="°C" icon={<Thermometer size={14}/>} color="#ff9100" />
            <StatCard label="Humidity" value={latest?.humidity?.toFixed(0) ?? 0} unit="%" icon={<Droplets size={14}/>} color="#00e676" />
          </div>
        </div>

        {/* Time series chart */}
        <div style={{ background: 'rgba(13,19,33,0.9)', border: '1px solid #1e2d40', borderRadius: 16, padding: 24, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,transparent,#7c3aed,transparent)' }} />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <h2 style={{ fontWeight: 600, color: '#e2e8f0', margin: 0, fontSize: 16 }}>AQI Time Series</h2>
              <p style={{ fontSize: 12, color: '#64748b', margin: '4px 0 0' }}>Historical trend with 7-day forecast</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {/* Export CSV */}
              <button
                onClick={() => exportCSV(selectedCity, histData?.history || [])}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px',
                  borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer',
                  background: '#00e67611', border: '1px solid #00e67633', color: '#00e676'
                }}>
                <Download size={12} /> Export CSV
              </button>

              {/* Forecast toggle */}
              <button onClick={() => setShowForecast(!showForecast)}
                style={{
                  padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer',
                  background: showForecast ? '#7c3aed22' : 'transparent',
                  border: `1px solid ${showForecast ? '#7c3aed66' : '#1e2d40'}`,
                  color: showForecast ? '#a78bfa' : '#64748b'
                }}>
                7-day Forecast
              </button>

              {/* Day range */}
              <div style={{ display: 'flex', gap: 4 }}>
                {DAYS_OPTIONS.map(d => (
                  <button key={d} onClick={() => setDays(d)}
                    style={{
                      padding: '6px 12px', borderRadius: 8, fontSize: 12, cursor: 'pointer',
                      background: days === d ? '#00d4ff11' : 'transparent',
                      border: `1px solid ${days === d ? '#00d4ff44' : '#1e2d40'}`,
                      color: days === d ? '#00d4ff' : '#64748b'
                    }}>
                    {d}d
                  </button>
                ))}
              </div>
            </div>
          </div>

          {histLoading
            ? <LoadingSpinner text="Loading history..." />
            : histData?.history?.length
              ? <AqiLineChart data={histData.history} forecast={showForecast ? (forecastData?.forecast || []) : []} height={320} />
              : <div style={{ height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: 14 }}>
                  No historical data yet. Run seed_db.py to populate.
                </div>
          }
        </div>

        {/* Pollutant breakdown */}
        <div style={{ background: 'rgba(13,19,33,0.9)', border: '1px solid #1e2d40', borderRadius: 16, padding: 24, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,transparent,#00e676,transparent)' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <h2 style={{ fontWeight: 600, color: '#e2e8f0', margin: 0, fontSize: 16 }}>Pollutant Breakdown</h2>
              <p style={{ fontSize: 12, color: '#64748b', margin: '4px 0 0' }}>Current readings vs WHO/EPA safe limits</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Wind size={14} style={{ color: '#64748b' }} />
              <span style={{ fontSize: 12, color: '#64748b' }}>Wind: {latest?.wind_speed?.toFixed(1) ?? '—'} km/h</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
            {POLLUTANTS.map(({ key, label, unit, color, limit }) => {
              const val = latest?.[key]
              const pct = val ? Math.min((val / limit) * 100, 100) : 0
              const over = val && val > limit
              return (
                <div key={key} style={{
                  borderRadius: 12, padding: 16,
                  background: over ? `${color}08` : '#0d1321',
                  border: `1px solid ${over ? color + '44' : '#1e2d40'}`,
                  transition: 'all 0.3s'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: '#e2e8f0' }}>{label}</span>
                    <span style={{ fontSize: 13, fontFamily: 'monospace', fontWeight: 700, color }}>{val?.toFixed(1) ?? '—'} <span style={{ fontSize: 11, fontWeight: 400, color: '#64748b' }}>{unit}</span></span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: '#1e2d40', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3, boxShadow: `0 0 8px ${color}88`, transition: 'width 0.8s ease' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                    <span style={{ fontSize: 10, color: '#64748b' }}>Safe limit: {limit} {unit}</span>
                    {over && <span style={{ fontSize: 10, color, fontWeight: 600 }}>{(val! / limit * 100).toFixed(0)}% of limit</span>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}