import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { projects } from '@/data/db'

export function CapexOpexDonut() {
  const totalCapex = projects.reduce((s, p) => s + p.capex, 0)
  const totalOpex = projects.reduce((s, p) => s + p.opex, 0)
  const total = totalCapex + totalOpex

  const data = [
    { name: 'CapEx', value: totalCapex, pct: Math.round((totalCapex / total) * 100) },
    { name: 'OpEx', value: totalOpex, pct: Math.round((totalOpex / total) * 100) },
  ]

  const COLORS = ['#286CFF', '#4A9D5C']

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={80}
          paddingAngle={3}
          dataKey="value"
          label={({ name, pct }) => `${name} ${pct}%`}
          labelLine={false}
        >
          {data.map((_, index) => (
            <Cell key={index} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number) => [`AED ${(value / 1_000_000).toFixed(1)}M`]}
          contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: 12 }}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          formatter={(value) => <span style={{ fontSize: 12, color: '#475569' }}>{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}

export function NewVsRecurringDonut() {
  const data = [
    { name: 'New Projects', value: 52_400_000, pct: 42 },
    { name: 'Recurring', value: 71_900_000, pct: 58 },
  ]
  const COLORS = ['#286CFF', '#4A9D5C']

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={80}
          paddingAngle={3}
          dataKey="value"
        >
          {data.map((_, index) => (
            <Cell key={index} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number) => [`AED ${(value / 1_000_000).toFixed(1)}M`]}
          contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: 12 }}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          formatter={(value) => <span style={{ fontSize: 12, color: '#475569' }}>{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
