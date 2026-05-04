import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { budgetByCategory } from '@/data/db'
import { dashboardPalette } from '@/lib/dashboardPalette'

const BAR_COLORS = [
  dashboardPalette.chartBlue,
  dashboardPalette.chartCyan,
  dashboardPalette.chartYellow,
  dashboardPalette.chartOrange,
  dashboardPalette.chartPink,
  dashboardPalette.chartSlate,
]

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const val = (payload[0].value as number) * 1_000_000
  return (
    <div className="rounded-[10px] border border-[#E2E8F0] bg-white dark:bg-[#1E293B] dark:border-white/10 p-3 shadow-lg min-w-[160px]">
      <p className="text-xs font-semibold text-[#0F172A] dark:text-white mb-1">{label}</p>
      <p className="text-xs text-[#475569] dark:text-slate-400">
        AED {val.toLocaleString('en-AE', { maximumFractionDigits: 0 })}
      </p>
    </div>
  )
}

export function BudgetByCategory() {
  const data = budgetByCategory.map((item, index) => ({
    ...item,
    displayValue: item.value / 1_000_000,
    fill: BAR_COLORS[index % BAR_COLORS.length],
  }))

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 28, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" horizontal={false} />
        <XAxis
          type="number"
          tickFormatter={(v) => `${v}M`}
          tick={{ fontSize: 11, fill: '#94A3B8' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fontSize: 11, fill: '#94A3B8' }}
          axisLine={false}
          tickLine={false}
          width={140}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(148,163,184,0.07)' }} />
        <Bar dataKey="displayValue" radius={[0, 6, 6, 0]} maxBarSize={22} />
      </BarChart>
    </ResponsiveContainer>
  )
}
