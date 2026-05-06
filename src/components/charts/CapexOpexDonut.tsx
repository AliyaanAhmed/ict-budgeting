import { PieChart, Pie, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { projects } from '@/data/db'
import { dashboardPalette } from '@/lib/dashboardPalette'

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const entry = payload[0]
  return (
    <div className="rounded-[10px] border border-[#E2E8F0] bg-white dark:bg-[#1E293B] dark:border-white/10 p-3 shadow-lg">
      <p className="text-xs font-semibold text-[#0F172A] dark:text-white mb-0.5">{entry.name}</p>
      <p className="text-xs text-[#475569] dark:text-slate-200">
        AED {((entry.value as number) / 1_000_000).toFixed(1)}M
      </p>
      <p className="text-xs font-semibold mt-0.5" style={{ color: entry.payload.fill }}>
        {entry.payload.pct}%
      </p>
    </div>
  )
}

export function CapexOpexDonut() {
  const totalCapex = projects.reduce((s, p) => s + p.capex, 0)
  const totalOpex = projects.reduce((s, p) => s + p.opex, 0)
  const total = totalCapex + totalOpex

  const data = [
    { name: 'CapEx', value: totalCapex, pct: Math.round((totalCapex / total) * 100), fill: dashboardPalette.chartBlue },
    { name: 'OpEx', value: totalOpex, pct: Math.round((totalOpex / total) * 100), fill: dashboardPalette.chartCyan },
  ]

  const totalM = (total / 1_000_000).toFixed(1)

  return (
    <div className="relative" style={{ height: 240 }}>
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="44%"
            innerRadius={58}
            outerRadius={88}
            paddingAngle={3}
            dataKey="value"
            strokeWidth={0}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            iconType="circle"
            iconSize={8}
            formatter={(value, entry: any) => (
              <span style={{ fontSize: 12, color: '#64748B' }}>
                {value}{' '}
                <strong style={{ color: entry.payload.fill }}>{entry.payload.pct}%</strong>
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
      <div
        className="absolute pointer-events-none flex flex-col items-center justify-center"
        style={{ left: '50%', top: '44%', transform: 'translate(-50%, -50%)' }}
      >
        <span className="text-[15px] font-bold text-[#0F172A] dark:text-white leading-none">{totalM}M</span>
        <span className="text-xs text-[#94A3B8] mt-1">AED Total</span>
      </div>
    </div>
  )
}

export function NewVsRecurringDonut() {
  const data = [
    { name: 'New Projects', value: 52_400_000, pct: 42, fill: dashboardPalette.chartYellow },
    { name: 'Recurring', value: 71_900_000, pct: 58, fill: dashboardPalette.chartOrange },
  ]
  const total = data.reduce((s, d) => s + d.value, 0)
  const totalM = (total / 1_000_000).toFixed(1)

  return (
    <div className="relative" style={{ height: 240 }}>
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="44%"
            innerRadius={58}
            outerRadius={88}
            paddingAngle={3}
            dataKey="value"
            strokeWidth={0}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            iconType="circle"
            iconSize={8}
            formatter={(value, entry: any) => (
              <span style={{ fontSize: 12, color: '#64748B' }}>
                {value}{' '}
                <strong style={{ color: entry.payload.fill }}>{entry.payload.pct}%</strong>
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
      <div
        className="absolute pointer-events-none flex flex-col items-center justify-center"
        style={{ left: '50%', top: '44%', transform: 'translate(-50%, -50%)' }}
      >
        <span className="text-[15px] font-bold text-[#0F172A] dark:text-white leading-none">{totalM}M</span>
        <span className="text-xs text-[#94A3B8] mt-1">AED Total</span>
      </div>
    </div>
  )
}

