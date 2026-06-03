interface Props { cities: string[]; matrix: { city_a: string; city_b: string; correlation: number }[] }

function getColor(val: number) {
  if (val >= 0.8)  return '#00e676'
  if (val >= 0.5)  return '#00d4ff'
  if (val >= 0.2)  return '#7c3aed'
  if (val >= -0.2) return '#64748b'
  if (val >= -0.5) return '#ff9100'
  return '#ff1744'
}

export default function CorrelationMatrix({ cities, matrix }: Props) {
  const get = (a: string, b: string) => matrix.find(m => m.city_a === a && m.city_b === b)?.correlation ?? 0

  return (
    <div className="overflow-auto">
      <table className="w-full text-xs">
        <thead>
          <tr>
            <th className="p-2" />
            {cities.map(c => <th key={c} className="p-2 text-text-secondary font-medium">{c.split(' ')[0]}</th>)}
          </tr>
        </thead>
        <tbody>
          {cities.map(rowCity => (
            <tr key={rowCity}>
              <td className="p-2 text-text-secondary font-medium whitespace-nowrap">{rowCity.split(' ')[0]}</td>
              {cities.map(colCity => {
                const val = get(rowCity, colCity)
                const color = getColor(val)
                return (
                  <td key={colCity} className="p-2 text-center">
                    <div className="w-12 h-10 mx-auto rounded flex items-center justify-center font-mono font-bold"
                      style={{ background: `${color}22`, color, border: `1px solid ${color}44` }}>
                      {val.toFixed(2)}
                    </div>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
