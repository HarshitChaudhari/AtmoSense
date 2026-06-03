import { useState } from 'react'
import TopBar from '../components/layout/TopBar'
import RadarChart from '../components/charts/RadarChart'
import CorrelationMatrix from '../components/charts/CorrelationMatrix'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { useRadar, useCorrelation } from '../api/useCompare'
import { GitCompare, X, Plus } from 'lucide-react'
import { useStore } from '../store/useStore'

const ALL_CITIES = ['Delhi','Mumbai','Beijing','Shanghai','Los Angeles','New York','London','Paris','Tokyo','São Paulo','Cairo','Seoul','Sydney','Toronto','Berlin','Lahore','Dhaka','Karachi','Bangkok','Jakarta']
const CITY_COLORS = ['#00d4ff','#7c3aed','#00e676','#ff9100','#e040fb']

export default function CityCompare() {
  const { compareCities, setCompareCities } = useStore()
  const [days, setDays] = useState(30)
  const { data: radarData, isLoading: radarLoading } = useRadar(compareCities)
  const { data: corrData, isLoading: corrLoading } = useCorrelation(compareCities, days)

  const addCity = (city: string) => {
    if (!compareCities.includes(city) && compareCities.length < 5)
      setCompareCities([...compareCities, city])
  }
  const removeCity = (city: string) => {
    if (compareCities.length > 2) setCompareCities(compareCities.filter(c => c !== city))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'auto', background: '#080c14' }}>
      <TopBar title="City Comparison" />
      <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* City selector */}
        <div style={{ background: 'rgba(13,19,33,0.9)', border: '1px solid #1e2d40', borderRadius: 16, padding: 20, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,transparent,#00d4ff,transparent)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <GitCompare size={16} style={{ color: '#00d4ff' }} />
            <h2 style={{ fontWeight: 600, color: '#e2e8f0', margin: 0, fontSize: 15 }}>Select Cities <span style={{ color: '#64748b', fontSize: 13, fontWeight: 400 }}>(2–5 cities)</span></h2>
          </div>

          {/* Selected cities */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
            {compareCities.map((city, i) => (
              <div key={city} style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 20,
                background: `${CITY_COLORS[i]}18`, border: `1px solid ${CITY_COLORS[i]}44`, color: CITY_COLORS[i],
                fontSize: 13, fontWeight: 500
              }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: CITY_COLORS[i] }} />
                {city}
                <button onClick={() => removeCity(city)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: CITY_COLORS[i], padding: 0, display: 'flex', lineHeight: 1 }}>
                  <X size={13} />
                </button>
              </div>
            ))}
          </div>

          {/* Available cities */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {ALL_CITIES.filter(c => !compareCities.includes(c)).map(city => (
              <button key={city} onClick={() => addCity(city)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 16,
                  fontSize: 12, cursor: compareCities.length >= 5 ? 'not-allowed' : 'pointer',
                  background: 'transparent', border: '1px solid #1e2d40', color: '#64748b',
                  opacity: compareCities.length >= 5 ? 0.4 : 1, transition: 'all 0.15s'
                }}
                onMouseEnter={e => { if (compareCities.length < 5) { (e.currentTarget as HTMLButtonElement).style.borderColor = '#00d4ff44'; (e.currentTarget as HTMLButtonElement).style.color = '#e2e8f0' } }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#1e2d40'; (e.currentTarget as HTMLButtonElement).style.color = '#64748b' }}>
                <Plus size={10} /> {city}
              </button>
            ))}
          </div>
        </div>

        {/* Charts row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

          {/* Radar */}
          <div style={{ background: 'rgba(13,19,33,0.9)', border: '1px solid #1e2d40', borderRadius: 16, padding: 24, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,transparent,#7c3aed,transparent)' }} />
            <h2 style={{ fontWeight: 600, color: '#e2e8f0', margin: '0 0 4px', fontSize: 15 }}>Pollutant Radar</h2>
            <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 16px' }}>Normalized 0–100 · all 6 pollutants</p>
            {radarLoading ? <LoadingSpinner /> : <RadarChart data={radarData?.radar || []} metrics={radarData?.metrics || []} />}
          </div>

          {/* Correlation */}
          <div style={{ background: 'rgba(13,19,33,0.9)', border: '1px solid #1e2d40', borderRadius: 16, padding: 24, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,transparent,#00e676,transparent)' }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <h2 style={{ fontWeight: 600, color: '#e2e8f0', margin: '0 0 4px', fontSize: 15 }}>AQI Correlation Matrix</h2>
                <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>Pearson correlation over time</p>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {[14, 30, 60].map(d => (
                  <button key={d} onClick={() => setDays(d)}
                    style={{
                      padding: '4px 10px', borderRadius: 8, fontSize: 12, cursor: 'pointer',
                      background: days === d ? '#00d4ff11' : 'transparent',
                      border: `1px solid ${days === d ? '#00d4ff44' : '#1e2d40'}`,
                      color: days === d ? '#00d4ff' : '#64748b'
                    }}>
                    {d}d
                  </button>
                ))}
              </div>
            </div>
            {corrLoading ? <LoadingSpinner /> :
              corrData?.matrix
                ? <CorrelationMatrix cities={corrData.cities} matrix={corrData.matrix} />
                : <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b', fontSize: 13 }}>
                    Not enough overlapping historical data yet.
                  </div>
            }
          </div>
        </div>

        {/* Raw table */}
        {radarData?.radar && (
          <div style={{ background: 'rgba(13,19,33,0.9)', border: '1px solid #1e2d40', borderRadius: 16, padding: 24, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,transparent,#ff9100,transparent)' }} />
            <h2 style={{ fontWeight: 600, color: '#e2e8f0', margin: '0 0 16px', fontSize: 15 }}>Raw Pollutant Values</h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #1e2d40' }}>
                    <th style={{ textAlign: 'left', padding: '8px 12px', color: '#64748b', fontWeight: 500 }}>City</th>
                    {['PM2.5','PM10','NO₂','O₃','CO','SO₂','AQI'].map(h => (
                      <th key={h} style={{ textAlign: 'center', padding: '8px 12px', color: '#64748b', fontWeight: 500, fontSize: 11, textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {radarData.radar.map((city: any, i: number) => (
                    <tr key={city.city} style={{ borderBottom: '1px solid #0d1321' }}>
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: CITY_COLORS[i] }} />
                          <span style={{ fontWeight: 500, color: '#e2e8f0' }}>{city.city}</span>
                        </div>
                      </td>
                      {['pm25','pm10','no2','o3','co','so2'].map(m => (
                        <td key={m} style={{ textAlign: 'center', padding: '10px 12px', fontFamily: 'monospace', fontSize: 12, color: '#64748b' }}>
                          {city.raw?.[m]?.toFixed(1) ?? '—'}
                        </td>
                      ))}
                      <td style={{ textAlign: 'center', padding: '10px 12px', fontFamily: 'monospace', fontWeight: 700, color: CITY_COLORS[i] }}>
                        {city.aqi?.toFixed(0) ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}