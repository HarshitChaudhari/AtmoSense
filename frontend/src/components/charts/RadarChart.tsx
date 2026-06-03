import { Radar, RadarChart as ReRadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, Legend, Tooltip } from 'recharts'

const COLORS = ['#00d4ff', '#7c3aed', '#00e676', '#ff9100', '#e040fb']

interface Props { data: any[]; metrics: string[] }

export default function RadarChart({ data, metrics }: Props) {
  if (!data?.length) return null

  const chartData = metrics.map(metric => {
    const point: any = { metric: metric.toUpperCase() }
    data.forEach(city => { point[city.city] = city.normalized?.[metric] || 0 })
    return point
  })

  return (
    <ResponsiveContainer width="100%" height={320}>
      <ReRadarChart data={chartData}>
        <PolarGrid stroke="#1e2d40" />
        <PolarAngleAxis dataKey="metric" tick={{ fill: '#64748b', fontSize: 11 }} />
        <Tooltip contentStyle={{ background: '#0d1321', border: '1px solid #1e2d40', borderRadius: '8px', fontSize: '12px' }} />
        <Legend wrapperStyle={{ fontSize: '12px', color: '#64748b' }} />
        {data.map((city, i) => (
          <Radar key={city.city} name={city.city} dataKey={city.city} stroke={COLORS[i]} fill={COLORS[i]} fillOpacity={0.15} strokeWidth={2} />
        ))}
      </ReRadarChart>
    </ResponsiveContainer>
  )
}
