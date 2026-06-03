import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'

interface Props { data: any[]; forecast?: any[]; height?: number }

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="glass-card p-3 text-xs space-y-1" style={{ border: '1px solid #00d4ff33' }}>
      <p className="text-text-secondary">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: <span className="font-mono font-bold">{p.value?.toFixed(1)}</span></p>
      ))}
    </div>
  )
}

export default function AqiLineChart({ data, forecast = [], height = 300 }: Props) {
  const combined = [
    ...data.map(d => ({ ...d, type: 'actual' })),
    ...forecast.map(d => ({ ...d, type: 'forecast' })),
  ]

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={combined} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="aqiGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#00d4ff" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#00d4ff" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#7c3aed" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e2d40" />
        <XAxis dataKey="timestamp" tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false}
          tickFormatter={v => v ? new Date(v).toLocaleDateString('en', { month:'short', day:'numeric' }) : ''} />
        <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <Area type="monotone" dataKey="aqi" stroke="#00d4ff" strokeWidth={2} fill="url(#aqiGrad)" dot={false} name="AQI" />
        {forecast.length > 0 && (
          <Area type="monotone" dataKey="predicted_aqi" stroke="#7c3aed" strokeWidth={2} strokeDasharray="5 5" fill="url(#forecastGrad)" dot={false} name="Forecast" />
        )}
      </AreaChart>
    </ResponsiveContainer>
  )
}
