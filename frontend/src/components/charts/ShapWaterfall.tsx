import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface Props { features: { label: string; shap_value: number; value: number }[] }

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="glass-card p-3 text-xs space-y-1" style={{ border: '1px solid #00d4ff33' }}>
      <p className="text-text-primary font-medium">{d.label}</p>
      <p className="text-text-secondary">Raw value: <span className="font-mono text-accent-cyan">{d.value?.toFixed(2)}</span></p>
      <p className="text-text-secondary">SHAP: <span className={`font-mono font-bold ${d.shap_value > 0 ? 'text-red-400' : 'text-green-400'}`}>{d.shap_value > 0 ? '+' : ''}{d.shap_value?.toFixed(4)}</span></p>
    </div>
  )
}

export default function ShapWaterfall({ features }: Props) {
  const data = [...features].sort((a, b) => Math.abs(b.shap_value) - Math.abs(a.shap_value))
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e2d40" horizontal={false} />
        <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} />
        <YAxis type="category" dataKey="label" tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} width={130} />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="shap_value" radius={[0, 4, 4, 0]}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.shap_value > 0 ? '#ff5252' : '#00e676'} fillOpacity={0.8} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
