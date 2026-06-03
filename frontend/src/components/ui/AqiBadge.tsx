interface Props { category: string; size?: 'sm' | 'md' | 'lg' }

const AQI_CONFIG: Record<string, { color: string; bg: string; glow: string }> = {
  'Good':                            { color: '#00e676', bg: '#00e67611', glow: '#00e67633' },
  'Moderate':                        { color: '#ffea00', bg: '#ffea0011', glow: '#ffea0033' },
  'Unhealthy for Sensitive Groups':  { color: '#ff9100', bg: '#ff910011', glow: '#ff910033' },
  'Unhealthy':                       { color: '#ff5252', bg: '#ff525211', glow: '#ff525233' },
  'Very Unhealthy':                  { color: '#e040fb', bg: '#e040fb11', glow: '#e040fb33' },
  'Hazardous':                       { color: '#ff1744', bg: '#ff174411', glow: '#ff174433' },
}

const SIZE = { sm: 'text-xs px-2 py-0.5', md: 'text-sm px-3 py-1', lg: 'text-base px-4 py-1.5' }

export default function AqiBadge({ category, size = 'md' }: Props) {
  const cfg = AQI_CONFIG[category] || { color: '#64748b', bg: '#64748b11', glow: '#64748b33' }
  return (
    <span
      className={`inline-flex items-center font-medium rounded-full ${SIZE[size]}`}
      style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.glow}`, boxShadow: `0 0 8px ${cfg.glow}` }}
    >
      {category}
    </span>
  )
}
