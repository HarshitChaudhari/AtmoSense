import { NavLink } from 'react-router-dom'
import { Globe, BarChart2, Brain, AlertTriangle, GitCompare, Heart, Microscope, ChevronLeft, ChevronRight, Menu, X } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { useState, useEffect } from 'react'

const LINKS = [
  { to: '/',          icon: Globe,         label: 'World Map' },
  { to: '/city',      icon: BarChart2,     label: 'City Deep-Dive' },
  { to: '/predict',   icon: Brain,         label: 'ML Predict' },
  { to: '/anomalies', icon: AlertTriangle, label: 'Anomaly Feed' },
  { to: '/compare',   icon: GitCompare,    label: 'City Compare' },
  { to: '/health',    icon: Heart,         label: 'Health Risk' },
  { to: '/insight',   icon: Microscope,    label: 'Model Insight' },
]

export default function Sidebar() {
  const { sidebarOpen, setSidebarOpen } = useStore()
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const handle = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handle)
    return () => window.removeEventListener('resize', handle)
  }, [])

  // Mobile: hamburger + slide-in drawer
  if (isMobile) {
    return (
      <>
        {/* Hamburger button */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          style={{
            position: 'fixed', top: 12, left: 12, zIndex: 1000,
            width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(13,19,33,0.95)', border: '1px solid #1e2d40', cursor: 'pointer', color: '#00d4ff'
          }}>
          {mobileOpen ? <X size={18} /> : <Menu size={18} />}
        </button>

        {/* Overlay */}
        {mobileOpen && (
          <div onClick={() => setMobileOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 998, background: '#00000066', backdropFilter: 'blur(4px)' }} />
        )}

        {/* Drawer */}
        <div style={{
          position: 'fixed', top: 0, left: 0, height: '100%', zIndex: 999, width: 240,
          background: 'rgba(8,12,20,0.98)', borderRight: '1px solid #1e2d40',
          backdropFilter: 'blur(16px)', display: 'flex', flexDirection: 'column',
          transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s ease',
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px 16px', borderBottom: '1px solid #1e2d40' }}>
            <img src="/logo.png" alt="AtmoSense" style={{ width: 42, height: 42, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
            <span style={{ fontWeight: 700, fontSize: 18, background: 'linear-gradient(135deg,#00d4ff,#7c3aed)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              AtmoSense
            </span>
          </div>

          {/* Nav */}
          <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {LINKS.map(({ to, icon: Icon, label }) => (
              <NavLink key={to} to={to} end={to === '/'} onClick={() => setMobileOpen(false)}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <Icon size={16} style={{ flexShrink: 0 }} />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      </>
    )
  }

  // Desktop sidebar
  return (
    <aside style={{
      position: 'fixed', left: 0, top: 0, height: '100%', zIndex: 40,
      width: sidebarOpen ? 220 : 64,
      background: 'rgba(8,12,20,0.97)', borderRight: '1px solid #1e2d40',
      backdropFilter: 'blur(16px)', display: 'flex', flexDirection: 'column',
      transition: 'width 0.3s ease',
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: sidebarOpen ? '18px 16px' : '18px 12px', borderBottom: '1px solid #1e2d40', overflow: 'hidden' }}>
        <img src="/logo.png" alt="AtmoSense"
          style={{ width: 40, height: 40, borderRadius: 10, objectFit: 'cover', flexShrink: 0, boxShadow: '0 0 12px #00d4ff33' }} />
        {sidebarOpen && (
          <span style={{ fontWeight: 700, fontSize: 17, background: 'linear-gradient(135deg,#00d4ff,#7c3aed)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', whiteSpace: 'nowrap' }}>
            AtmoSense
          </span>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 4, overflow: 'hidden' }}>
        {LINKS.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} end={to === '/'}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            title={!sidebarOpen ? label : undefined}>
            <Icon size={16} style={{ flexShrink: 0 }} />
            {sidebarOpen && <span style={{ whiteSpace: 'nowrap' }}>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Toggle */}
      <button onClick={() => setSidebarOpen(!sidebarOpen)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: '100%', padding: '14px 0', borderTop: '1px solid #1e2d40',
          background: 'none', border: 'none', cursor: 'pointer', color: '#64748b',
          transition: 'color 0.2s'
        }}
        onMouseEnter={e => (e.currentTarget.style.color = '#00d4ff')}
        onMouseLeave={e => (e.currentTarget.style.color = '#64748b')}>
        {sidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
      </button>
    </aside>
  )
}