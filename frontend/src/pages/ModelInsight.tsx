import TopBar from '../components/layout/TopBar'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { useGlobalShap } from '../api/usePredict'
import { Microscope, Award, TrendingUp } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const COLORS = ['#00d4ff', '#7c3aed', '#00e676', '#ff9100', '#e040fb']

export default function ModelInsight() {
  const { data, isLoading } = useGlobalShap()

  const meta = data?.metadata
  const shap = data?.global_shap || []
  const importance = data?.feature_importance || []

  return (
    <div className="flex flex-col h-full page-enter overflow-y-auto">
      <TopBar title="Model Insight — XGBoost + SHAP" />
      <div className="p-6 space-y-6">

        {/* Model metrics */}
        {meta && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="stat-card text-center">
              <p className="text-xs text-text-secondary mb-1">CV Accuracy</p>
              <p className="text-3xl font-mono font-bold text-accent-green">{(meta.cv_accuracy_mean * 100).toFixed(2)}%</p>
            </div>
            <div className="stat-card text-center">
              <p className="text-xs text-text-secondary mb-1">Std Dev</p>
              <p className="text-3xl font-mono font-bold text-accent-cyan">±{(meta.cv_accuracy_std * 100).toFixed(3)}%</p>
            </div>
            <div className="stat-card text-center">
              <p className="text-xs text-text-secondary mb-1">Training Samples</p>
              <p className="text-3xl font-mono font-bold text-accent-purple">{meta.n_train?.toLocaleString()}</p>
            </div>
            <div className="stat-card text-center">
              <p className="text-xs text-text-secondary mb-1">Test Samples</p>
              <p className="text-3xl font-mono font-bold text-accent-orange">{meta.n_test?.toLocaleString()}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Global SHAP */}
          <div className="glass-card p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: '#00d4ff11', border: '1px solid #00d4ff33' }}>
                <Microscope size={16} className="text-accent-cyan" />
              </div>
              <div>
                <h2 className="font-semibold text-text-primary">Global SHAP Values</h2>
                <p className="text-xs text-text-secondary">Mean |SHAP| across all predictions</p>
              </div>
            </div>
            {isLoading ? <LoadingSpinner /> : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={shap} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2d40" horizontal={false} />
                  <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="label" tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} width={130} />
                  <Tooltip contentStyle={{ background: '#0d1321', border: '1px solid #1e2d40', borderRadius: '8px', fontSize: '12px' }} />
                  <Bar dataKey="mean_shap" radius={[0, 4, 4, 0]}>
                    {shap.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} fillOpacity={0.85} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Feature Importance */}
          <div className="glass-card p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: '#7c3aed11', border: '1px solid #7c3aed33' }}>
                <TrendingUp size={16} className="text-accent-purple" />
              </div>
              <div>
                <h2 className="font-semibold text-text-primary">XGBoost Feature Importance</h2>
                <p className="text-xs text-text-secondary">Gain-based importance scores</p>
              </div>
            </div>
            {isLoading ? <LoadingSpinner /> : (
              <div className="space-y-3">
                {importance.map((f: any, i: number) => {
                  const pct = (f.importance / (importance[0]?.importance || 1)) * 100
                  const color = COLORS[i % COLORS.length]
                  return (
                    <div key={f.feature}>
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-xs text-text-secondary">{f.label || f.feature}</span>
                        <span className="text-xs font-mono font-bold" style={{ color }}>{(f.importance * 100).toFixed(2)}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-border-subtle overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color, boxShadow: `0 0 6px ${color}44` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* AQI Classes */}
        {meta?.classes && (
          <div className="glass-card p-5">
            <div className="flex items-center gap-3 mb-4">
              <Award size={16} className="text-accent-orange" />
              <h2 className="font-semibold text-text-primary">Model Classes</h2>
            </div>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {meta.classes.map((cls: string, i: number) => (
                <div key={cls} className="rounded-lg p-3 text-center" style={{ background: `${COLORS[i % COLORS.length]}11`, border: `1px solid ${COLORS[i % COLORS.length]}33` }}>
                  <p className="text-xs font-mono font-bold" style={{ color: COLORS[i % COLORS.length] }}>Class {i}</p>
                  <p className="text-xs text-text-secondary mt-1">{cls}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Architecture note */}
        <div className="glass-card p-5" style={{ border: '1px solid #1e2d40' }}>
          <h3 className="font-semibold text-text-primary mb-3">Model Architecture</h3>
          <div className="grid grid-cols-3 gap-4 text-xs">
            {[
              { title: 'XGBoost Classifier', detail: '300 estimators · depth 6 · lr 0.05 · 6-class AQI prediction', color: '#00d4ff' },
              { title: 'Isolation Forest', detail: '200 estimators · 3% contamination · anomaly detection', color: '#7c3aed' },
              { title: 'EWM Forecaster', detail: 'α=0.3 exponential weighted · 7-day city forecast with bands', color: '#00e676' },
            ].map(m => (
              <div key={m.title} className="rounded-lg p-3" style={{ background: `${m.color}11`, border: `1px solid ${m.color}33` }}>
                <p className="font-medium mb-1" style={{ color: m.color }}>{m.title}</p>
                <p className="text-text-secondary">{m.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
