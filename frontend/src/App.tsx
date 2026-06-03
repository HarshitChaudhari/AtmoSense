import { Routes, Route } from 'react-router-dom'
import Sidebar from './components/layout/Sidebar'
import WorldMap from './pages/WorldMap'
import CityDive from './pages/CityDive'
import PredictPanel from './pages/PredictPanel'
import AnomalyFeed from './pages/AnomalyFeed'
import CityCompare from './pages/CityCompare'
import HealthRisk from './pages/HealthRisk'
import ModelInsight from './pages/ModelInsight'
import { useStore } from './store/useStore'
import { useEffect, useState } from 'react'

export default function App() {
  const { sidebarOpen } = useStore()
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  useEffect(() => {
    const handle = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handle)
    return () => window.removeEventListener('resize', handle)
  }, [])

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', background: '#080c14' }}>
      <Sidebar />
      <main style={{
        marginLeft: isMobile ? 0 : (sidebarOpen ? '220px' : '64px'),
        flex: 1,
        height: '100vh',
        overflow: 'hidden',
        transition: 'margin-left 0.3s ease',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <Routes>
          <Route path="/"          element={<WorldMap />} />
          <Route path="/city"      element={<CityDive />} />
          <Route path="/predict"   element={<PredictPanel />} />
          <Route path="/anomalies" element={<AnomalyFeed />} />
          <Route path="/compare"   element={<CityCompare />} />
          <Route path="/health"    element={<HealthRisk />} />
          <Route path="/insight"   element={<ModelInsight />} />
        </Routes>
      </main>
    </div>
  )
}