import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { budgetByCategory } from '@/data/db'

const COLORS = ['#286CFF', '#4A9D5C', '#D946EF', '#D97706', '#EA4F49', '#06B6D4']

export function BudgetByCategory() {
  const data = budgetByCategory.map((item) => ({
    ...item,
    displayValue: item.value / 1_000_000,
  }))

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
        <XAxis
          type="number"
          tickFormatter={(v) => `${v}M`}
          tick={{ fontSize: 11, fill: '#475569' }}
          axisLine={false}
          tickLine={false}
          dataKey="displayValue"
        />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fontSize: 11, fill: '#475569' }}
          axisLine={false}
          tickLine={false}
          width={130}
        />
        <Tooltip
          formatter={(value: number) => [`AED ${value.toFixed(1)}M`, 'Budget']}
          contentStyle={{
            borderRadius: '8px',
            border: '1px solid #E2E8F0',
            fontSize: 12,
          }}
        />
        <Bar dataKey="displayValue" fill="#286CFF" radius={[0, 4, 4, 0]} maxBarSize={20} />
      </BarChart>
    </ResponsiveContainer>
  )
}
