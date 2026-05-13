import { CurrencyAmount } from '@/components/shared/CurrencyAmount'
import { dashboardPalette } from '@/lib/dashboardPalette'
import type { BudgetByCategoryChartItem } from '@/hooks/useDashboardBudgetCharts'

const BAR_COLORS = [
  dashboardPalette.chartBlue,
  dashboardPalette.chartCyan,
  dashboardPalette.chartYellow,
  dashboardPalette.chartOrange,
  dashboardPalette.chartPink,
  dashboardPalette.chartSlate,
]

interface BudgetByCategoryProps {
  data: BudgetByCategoryChartItem[]
}

export function BudgetByCategory({ data }: BudgetByCategoryProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0)
  const chartData = data.map((item, index) => ({
    ...item,
    pct: total > 0 ? Math.round((item.value / total) * 100) : 0,
    color: BAR_COLORS[index % BAR_COLORS.length],
  }))

  if (!chartData.length) {
    return (
      <div className="rounded-[20px] border border-dashed border-[#DCE8F6] bg-[#F8FAFC] px-4 py-8 text-center text-sm text-[#64748B] dark:border-white/10 dark:bg-white/5 dark:text-slate-100">
        No strategic priority budget data is available for the current cycle.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {chartData.map((item) => (
        <div key={item.name} className="rounded-[20px] bg-[#F8FAFC] px-4 py-3 dark:bg-white/5">
          <div className="flex items-center gap-3">
            <span
              className="inline-flex min-w-[44px] items-center justify-center rounded-full px-2.5 py-1 text-xs font-semibold"
              style={{ backgroundColor: `${item.color}18`, color: item.color }}
            >
              {item.pct}%
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-[#0F172A] dark:text-white">{item.name}</p>
            </div>
            <CurrencyAmount amount={item.value} className="text-sm font-medium text-[#0F172A] dark:text-white" iconSize={13} />
          </div>
          <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white dark:bg-white/10">
            <div
              className="h-full rounded-full"
              style={{
                width: `${item.pct}%`,
                background: `linear-gradient(90deg, ${item.color}, ${item.color}BB)`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
