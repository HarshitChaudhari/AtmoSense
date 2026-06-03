import { Search, Activity } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../../store/useStore'

const CITIES = ['Delhi','Mumbai','Beijing','Shanghai','Los Angeles','New York','London','Paris','Tokyo','São Paulo','Cairo','Lahore','Dhaka','Karachi','Bangkok','Jakarta','Sydney','Toronto','Berlin','Seoul']

export default function TopBar({ title }: { title: string }) {
  const { selectedCity, setSelectedCity } = useStore()
  const [search, setSearch] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const navigate = useNavigate()

  useEffect(() => {
    const handle = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handle)
    return () => window.removeEventListener('resize', handle)
  }, [])

  const filtered = CITIES.filter(c => c.toLowerCase().includes(search.toLowerCase()))

  const selectCity = (city: string) => {
    setSelectedCity(city)
    setSearch('')
    setShowDropdown(false)
    navigate('/city')
  }

  return (
    <header style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: isMobile ? '10px 16px 10px 60px' : '12px 24px',
      borderBottom: '1px solid #1e2d40',
      background: 'rgba(8,12,20,0.95)', backdropFilter: 'blur(12px)', flexShrink: 0
    }}>
      <div style={{ minWidth: 0 }}>
        <h1 style={{ fontSize: isMobile ? 14 : 18, fontWeight: 600, color: '#e2e8f0', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</h1>
        {!isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00e676' }} />
            <span style={{ fontSize: 12, color: '#64748b' }}>Live · 20 cities monitored</span>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 12, flexShrink: 0 }}>
        {/* City Search */}
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: isMobile ? '6px 10px' : '8px 12px', borderRadius: 8, background: '#0d1321', border: '1px solid #1e2d40' }}>
            <Search size={13} style={{ color: '#64748b', flexShrink: 0 }} />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setShowDropdown(true) }}
              onFocus={() => setShowDropdown(true)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
              placeholder={selectedCity}
              style={{ background: 'transparent', outline: 'none', color: '#e2e8f0', width: isMobile ? 80 : 130, fontSize: 13, border: 'none' }}
            />
          </div>
          {showDropdown && filtered.length > 0 && (
            <div style={{ position: 'absolute', top: '100%', marginTop: 4, width: 200, borderRadius: 8, overflow: 'hidden', zIndex: 50, background: '#0d1321', border: '1px solid #1e2d40', boxShadow: '0 8px 32px #00000088', right: 0 }}>
              {filtered.slice(0, 8).map(city => (
                <button key={city} onMouseDown={() => selectCity(city)}
                  style={{ width: '100%', textAlign: 'left', padding: '8px 12px', fontSize: 13, color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', display: 'block' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#1e2d40'; (e.currentTarget as HTMLButtonElement).style.color = '#e2e8f0' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'none'; (e.currentTarget as HTMLButtonElement).style.color = '#64748b' }}>
                  {city}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* API status */}
        {!isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, background: '#00e67611', border: '1px solid #00e67633' }}>
            <Activity size={12} style={{ color: '#00e676' }} />
            <span style={{ fontSize: 12, color: '#00e676', fontWeight: 500 }}>API Online</span>
          </div>
        )}
      </div>
    </header>
  )
}