import { useState } from 'react'
import TopBar from '../components/layout/TopBar'
import ShapWaterfall from '../components/charts/ShapWaterfall'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { usePredict } from '../api/usePredict'
import { Brain, Zap, Info } from 'lucide-react'

const FIELDS = [
  { key: 'aqi_value',      label: 'Overall AQI',   min: 0, max: 500, required: true,  color: '#00d4ff' },
  { key: 'pm25_aqi_value', label: 'PM2.5 AQI',     min: 0, max: 500, required: false, color: '#ff5252' },
  { key: 'no2_aqi_value',  label: 'NO₂ AQI',       min: 0, max: 500, required: false, color: '#e040fb' },
  { key: 'ozone_aqi_value',label: 'Ozone AQI',     min: 0, max: 500, required: false, color: '#00d4ff' },
  { key: 'co_aqi_value',   label: 'CO AQI',        min: 0, max: 500, required: false, color: '#ffea00' },
]

const PRESETS = [
  { label: '🟢 Clean Air',        color: '#00e676', values: { aqi_value: 42,  pm25_aqi_value: 35,  no2_aqi_value: 12,  ozone_aqi_value: 28,  co_aqi_value: 1  } },
  { label: '🟡 Moderate',         color: '#ffea00', values: { aqi_value: 95,  pm25_aqi_value: 88,  no2_aqi_value: 45,  ozone_aqi_value: 62,  co_aqi_value: 2  } },
  { label: '🟠 Heavy Smog',       color: '#ff9100', values: { aqi_value: 310, pm25_aqi_value: 295, no2_aqi_value: 120, ozone_aqi_value: 85,  co_aqi_value: 8  } },
  { label: '🔴 Hazardous Event',  color: '#ff1744', values: { aqi_value: 450, pm25_aqi_value: 420, no2_aqi_value: 200, ozone_aqi_value: 150, co_aqi_value: 15 } },
]

const AQI_COLORS: Record<string, string> = {
  'Good': '#00e676', 'Moderate': '#ffea00',
  'Unhealthy for Sensitive Groups': '#ff9100',
  'Unhealthy': '#ff5252', 'Very Unhealthy': '#e040fb', 'Hazardous': '#ff1744',
}

export default function PredictPanel() {
  const [inputs, setInputs] = useState<Record<string, number>>({ aqi_value: 100 })
  const { mutate, data, isPending, isError } = usePredict()
  const prediction = data?.prediction

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'auto', background: '#080c14' }}>
      <TopBar title="ML Predict — AQI Category" />
      <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

          {/* Input panel */}
          <div style={{ background: 'rgba(13,19,33,0.9)', border: '1px solid #1e2d40', borderRadius: 16, padding: 24, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,transparent,#00d4ff,transparent)' }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#00d4ff11', border: '1px solid #00d4ff33' }}>
                <Brain size={16} style={{ color: '#00d4ff' }} />
              </div>
              <div>
                <h2 style={{ fontWeight: 600, color: '#e2e8f0', margin: 0, fontSize: 16 }}>Input Pollutant Values</h2>
                <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0' }}>XGBoost classifier · 6 AQI categories · 99.99% CV accuracy</p>
              </div>
            </div>

            {/* Presets */}
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>Quick presets:</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {PRESETS.map(p => (
                  <button key={p.label} onClick={() => setInputs(p.values)}
                    style={{
                      textAlign: 'left', padding: '10px 14px', borderRadius: 10, fontSize: 12,
                      cursor: 'pointer', background: `${p.color}0a`, border: `1px solid ${p.color}33`,
                      color: p.color, fontWeight: 500, transition: 'all 0.2s'
                    }}>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sliders */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {FIELDS.map(f => (
                <div key={f.key}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <label style={{ fontSize: 13, color: '#94a3b8' }}>
                      {f.label}
                      {f.required && <span style={{ color: '#ff5252', marginLeft: 4 }}>*</span>}
                    </label>
                    <span style={{ fontSize: 13, fontFamily: 'monospace', fontWeight: 700, color: f.color }}>
                      {inputs[f.key] ?? 0}
                    </span>
                  </div>
                  <input type="range" min={f.min} max={f.max}
                    value={inputs[f.key] ?? 0}
                    onChange={e => setInputs(prev => ({ ...prev, [f.key]: Number(e.target.value) }))}
                    style={{ width: '100%', height: 6, borderRadius: 3, appearance: 'none', cursor: 'pointer', accentColor: f.color,
                      background: `linear-gradient(to right, ${f.color} ${((inputs[f.key] ?? 0) / f.max) * 100}%, #1e2d40 0%)` }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#334155', marginTop: 2 }}>
                    <span>0</span><span>500</span>
                  </div>
                </div>
              ))}
            </div>

            <button onClick={() => mutate(inputs as any)} disabled={isPending}
              style={{
                width: '100%', marginTop: 24, padding: '12px 0', borderRadius: 10, fontSize: 14,
                fontWeight: 600, cursor: isPending ? 'not-allowed' : 'pointer',
                background: isPending ? '#1e2d40' : 'linear-gradient(135deg,#00d4ff22,#0073d722)',
                border: '1px solid #00d4ff44', color: '#00d4ff',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'all 0.2s'
              }}>
              <Zap size={15} />
              {isPending ? 'Running inference...' : 'Run XGBoost Prediction'}
            </button>
          </div>

          {/* Result panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {isPending && (
              <div style={{ background: 'rgba(13,19,33,0.9)', border: '1px solid #1e2d40', borderRadius: 16, padding: 24 }}>
                <LoadingSpinner text="Running XGBoost inference..." />
              </div>
            )}

            {isError && (
              <div style={{ background: '#ff174411', border: '1px solid #ff174433', borderRadius: 16, padding: 24, textAlign: 'center', color: '#ff1744', fontSize: 14 }}>
                Prediction failed. Is the backend running?
              </div>
            )}

            {!prediction && !isPending && (
              <div style={{ background: 'rgba(13,19,33,0.9)', border: '1px solid #1e2d40', borderRadius: 16, padding: 48, textAlign: 'center', flex: 1 }}>
                <Brain size={40} style={{ color: '#334155', margin: '0 auto 16px' }} />
                <p style={{ color: '#64748b', fontSize: 14, margin: 0 }}>Set values and click predict</p>
                <p style={{ color: '#334155', fontSize: 12, margin: '6px 0 0' }}>XGBoost output + SHAP explanation will appear here</p>
              </div>
            )}

            {prediction && (
              <>
                {/* Predicted class */}
                <div style={{ background: 'rgba(13,19,33,0.9)', border: `1px solid ${AQI_COLORS[prediction.predicted_class] || '#00d4ff'}44`, borderRadius: 16, padding: 24, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,transparent,${AQI_COLORS[prediction.predicted_class] || '#00d4ff'},transparent)` }} />
                  <p style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Predicted AQI Category</p>
                  <div style={{
                    display: 'inline-block', padding: '8px 24px', borderRadius: 24, fontSize: 18, fontWeight: 700,
                    color: AQI_COLORS[prediction.predicted_class] || '#00d4ff',
                    background: `${AQI_COLORS[prediction.predicted_class] || '#00d4ff'}18`,
                    border: `1px solid ${AQI_COLORS[prediction.predicted_class] || '#00d4ff'}44`,
                    boxShadow: `0 0 20px ${AQI_COLORS[prediction.predicted_class] || '#00d4ff'}33`,
                    marginBottom: 20
                  }}>
                    {prediction.predicted_class}
                  </div>

                  {/* Probability bars */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, textAlign: 'left' }}>
                    {Object.entries(prediction.probabilities).map(([cat, prob]: any) => {
                      const color = AQI_COLORS[cat] || '#64748b'
                      const pct = (prob * 100)
                      return (
                        <div key={cat}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                            <span style={{ color: '#94a3b8' }}>{cat}</span>
                            <span style={{ color, fontFamily: 'monospace', fontWeight: 700 }}>{pct.toFixed(1)}%</span>
                          </div>
                          <div style={{ height: 5, borderRadius: 3, background: '#1e2d40', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3, boxShadow: `0 0 6px ${color}88`, transition: 'width 0.8s ease' }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* SHAP */}
                <div style={{ background: 'rgba(13,19,33,0.9)', border: '1px solid #1e2d40', borderRadius: 16, padding: 24, position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,transparent,#7c3aed,transparent)' }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <h3 style={{ fontWeight: 600, color: '#e2e8f0', margin: 0, fontSize: 15 }}>SHAP Explanation</h3>
                    <Info size={13} style={{ color: '#64748b' }} />
                  </div>
                  <p style={{ fontSize: 12, color: '#64748b', marginBottom: 16 }}>
                    🔴 Red = pushes AQI higher &nbsp;·&nbsp; 🟢 Green = pushes AQI lower
                  </p>
                  <ShapWaterfall features={prediction.all_features} />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}