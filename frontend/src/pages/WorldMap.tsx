import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, RefreshCw, Layers } from 'lucide-react'
import TopBar from '../components/layout/TopBar'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import AqiBadge from '../components/ui/AqiBadge'
import StatCard from '../components/ui/StatCard'
import { useWorldMap } from '../api/useWorldMap'
import { useStore } from '../store/useStore'

const AQI_COLOR: Record<string, string> = {
  'Good': '#00e676',
  'Moderate': '#ffea00',
  'Unhealthy for Sensitive Groups': '#ff9100',
  'Unhealthy': '#ff5252',
  'Very Unhealthy': '#e040fb',
  'Hazardous': '#ff1744',
}

export default function WorldMap() {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const LRef = useRef<any>(null)
  const [mapReady, setMapReady] = useState(false)
  const { data, isLoading, refetch, isFetching } = useWorldMap()
  const { setSelectedCity } = useStore()
  const navigate = useNavigate()
  const [selected, setSelected] = useState<any>(null)

  // Init map once
  useEffect(() => {
    if (mapInstanceRef.current) return
    const init = async () => {
      const L = await import('leaflet')
      await import('leaflet/dist/leaflet.css')
      if (!mapRef.current) return
      const map = L.map(mapRef.current, {
        zoomControl: false,
        worldCopyJump: false,
        maxBounds: [[-90, -180], [90, 180]],
        maxBoundsViscosity: 1.0,
        minZoom: 2,
        maxZoom: 10,
      }).setView([20, 10], 2)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; CartoDB',
        subdomains: 'abcd',
        maxZoom: 19,
        noWrap: true,
        bounds: [[-90, -180], [90, 180]],
      }).addTo(map)
      L.control.zoom({ position: 'bottomright' }).addTo(map)
      mapInstanceRef.current = map
      LRef.current = L
      setMapReady(true)
    }
    init()
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
        LRef.current = null
        setMapReady(false)
      }
    }
  }, [])

  // Draw markers when map ready or data changes
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || !LRef.current || !data?.features) return
    const L = LRef.current
    const map = mapInstanceRef.current
    map.eachLayer((layer: any) => { if (layer instanceof L.CircleMarker) map.removeLayer(layer) })
    data.features.forEach((f: any) => {
      const p = f.properties
      const color = AQI_COLOR[p.aqi_category] || '#64748b'
      const radius = Math.max(6, Math.min(20, (p.aqi || 50) / 15))
      const marker = L.circleMarker(
        [f.geometry.coordinates[1], f.geometry.coordinates[0]],
        { radius, fillColor: color, color, weight: 2, opacity: 0.9, fillOpacity: 0.6 }
      ).addTo(map)
      marker.on('click', () => setSelected(p))
      marker.bindTooltip(`
        <div style="background:#0d1321;border:1px solid #1e2d40;border-radius:8px;padding:8px 12px;font-size:12px;color:#e2e8f0">
          <strong style="color:#00d4ff">${p.city}</strong><br/>
          AQI: <strong style="color:${color}">${p.aqi?.toFixed(0) || 'N/A'}</strong><br/>
          <span style="color:#64748b">${p.aqi_category || ''}</span>
        </div>`,
        { permanent: false, direction: 'top', opacity: 1 }
      )
    })
  }, [mapReady, data])

  const stats = data?.features || []
  const avgAqi = stats.reduce((s: number, f: any) => s + (f.properties.aqi || 0), 0) / (stats.length || 1)
  const worstCity = stats.reduce((worst: any, f: any) =>
    (!worst || (f.properties.aqi || 0) > (worst.properties.aqi || 0)) ? f : worst, null)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <TopBar title="World Air Quality Map" />

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, padding: 16, flexShrink: 0 }}>
        <StatCard label="Cities Tracked" value={stats.length} icon={<MapPin size={14}/>} color="#00d4ff" />
        <StatCard label="Global Avg AQI" value={avgAqi.toFixed(0)} color="#7c3aed" icon={<Layers size={14}/>} />
        <StatCard label="Most Polluted" value={worstCity?.properties.city || '—'} color="#ff5252"
          subtitle={`AQI ${worstCity?.properties.aqi?.toFixed(0) || ''}`} />
        <StatCard label="Data Points" value={stats.length * 6} unit="readings" color="#00e676" />
      </div>

      {/* Outer wrapper — position relative so all overlays anchor here */}
      <div style={{ flex: 1, margin: '0 16px 16px', position: 'relative', minHeight: 0 }}>

        {/* Leaflet map — own clipping container */}
        <div style={{ position: 'absolute', inset: 0, borderRadius: 12, overflow: 'hidden', border: '1px solid #1e2d40' }}>
          {(isLoading || isFetching) && (
            <div style={{ position: 'absolute', inset: 0, zIndex: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#080c14bb', backdropFilter: 'blur(4px)' }}>
              <LoadingSpinner text="Loading map data..." />
            </div>
          )}
          <div ref={mapRef} style={{ position: 'absolute', inset: 0, background: '#080c14' }} />
        </div>

        {/* Refresh button — sibling of map, not inside it */}
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          style={{ position: 'absolute', top: 12, right: 12, zIndex: 1000 }}
          className="btn-primary flex items-center gap-2"
        >
          <RefreshCw size={12} className={isFetching ? 'animate-spin' : ''} />
          {isFetching ? 'Refreshing...' : 'Refresh'}
        </button>

        {/* Legend — bottom right, sibling of map */}
        <div style={{
          position: 'absolute', bottom: 40, right: 12, zIndex: 1000,
          background: 'rgba(13,19,33,0.92)', backdropFilter: 'blur(12px)',
          border: '1px solid #1e2d40', borderRadius: 10, padding: '10px 14px',
        }}>
          {Object.entries(AQI_COLOR).map(([cat, color]) => (
            <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, boxShadow: `0 0 6px ${color}`, flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: '#94a3b8', whiteSpace: 'nowrap' }}>{cat}</span>
            </div>
          ))}
        </div>

        {/* City popup — bottom left, sibling of map */}
        {selected && (
          <div style={{
            position: 'absolute', bottom: 16, left: 16, zIndex: 1000, width: 280,
            background: 'rgba(13,19,33,0.96)', backdropFilter: 'blur(16px)',
            border: '1px solid #00d4ff33', borderRadius: 12, padding: 16,
            boxShadow: '0 8px 32px #00000088',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div>
                <h3 style={{ fontWeight: 600, color: '#e2e8f0', margin: 0, fontSize: 16 }}>{selected.city}</h3>
                <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0' }}>{selected.country}</p>
              </div>
              <button onClick={() => setSelected(null)}
                style={{ fontSize: 22, lineHeight: 1, color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginLeft: 8 }}>
                ×
              </button>
            </div>

            <div style={{ marginBottom: 12 }}>
              <AqiBadge category={selected.aqi_category || 'Moderate'} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
              {[
                ['AQI',   selected.aqi?.toFixed(0)],
                ['PM2.5', selected.pm25?.toFixed(1)],
                ['NO₂',   selected.no2?.toFixed(1)],
                ['O₃',    selected.o3?.toFixed(1)],
              ].map(([k, v]) => (
                <div key={k} style={{ background: '#1e2d4066', borderRadius: 6, padding: '6px 10px' }}>
                  <p style={{ fontSize: 11, color: '#64748b', margin: 0 }}>{k}</p>
                  <p style={{ fontSize: 14, fontFamily: 'monospace', fontWeight: 700, color: '#00d4ff', margin: '2px 0 0' }}>{v ?? '—'}</p>
                </div>
              ))}
            </div>

            <button
              onClick={() => { setSelectedCity(selected.city); navigate('/city') }}
              style={{
                width: '100%', padding: '9px 0', textAlign: 'center', fontSize: 13,
                fontWeight: 500, borderRadius: 8, cursor: 'pointer',
                background: 'linear-gradient(135deg,#00d4ff22,#0073d722)',
                border: '1px solid #00d4ff44', color: '#00d4ff',
              }}
            >
              View City Details →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}