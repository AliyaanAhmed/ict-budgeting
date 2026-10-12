import { useState } from 'react'
import { dashboardPalette } from '@/lib/dashboardPalette'
import {
  DASHBOARD_BUDGET_METRIC_LABEL,
  type BudgetByCategoryChartItem,
  type DashboardBudgetMetric,
} from '@/hooks/useDashboardBudgetCharts'

const BAR_COLORS = [
  ...dashboardPalette.primarySeries,
]
const METRIC_COLORS: Record<DashboardBudgetMetric, string> = {
  requested: '#286CFF',
  recommended: '#5B87FF',
  allocated: '#0C65F5',
  utilized: '#1E3A8A',
}
const PAGE_SIZE = 5

function formatCompactBudget(amount: number) {
  return new Intl.NumberFormat('en', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(amount)
}

interface BudgetByCategoryProps {
  data: BudgetByCategoryChartItem[]
  metrics?: DashboardBudgetMetric[]
}

export function BudgetByCategory({ data, metrics = ['requested'] }: BudgetByCategoryProps) {
  const [page, setPage] = useState(0)
  const total = data.reduce((sum, item) => sum + item.value, 0)
  const chartData = data.map((item, index) => ({
    ...item,
    pct: total > 0 ? Math.round((item.value / total) * 100) : 0,
    color: BAR_COLORS[index % BAR_COLORS.length],
  }))
  const totalPages = Math.max(1, Math.ceil(chartData.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages - 1)
  const visibleData = chartData.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE)

  if (!chartData.length) {
    return (
      <div className="rounded-[20px] border border-dashed border-[#DCE8F6] bg-[#F8FAFC] px-4 py-8 text-center text-sm text-[#64748B] dark:border-white/10 dark:bg-white/5 dark:text-slate-100">
        No strategic priority budget data is available for the current cycle.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {visibleData.map((item) => {
        const metricTotal = metrics.reduce((sum, metric) => sum + (item.amounts?.[metric] ?? 0), 0)

        return (
        <div key={item.name} className="rounded-[20px] bg-[#F8FAFC] px-4 py-3 dark:bg-white/5">
          <div className="flex items-center gap-3">
            <span
              className="inline-flex min-w-[44px] items-center justify-center rounded-full bg-[#EEF5FF] px-2.5 py-1 text-xs font-semibold text-[#286CFF] dark:bg-[#286CFF]/15 dark:text-[#C6DBFF]"
            >
              {item.pct}%
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-[#0F172A] dark:text-white">{item.name}</p>
            </div>
          </div>
          <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white dark:bg-white/10">
            {metrics.length > 1 ? (
              <div className="flex h-full">
                {metrics.map((metric, index) => {
                  const amount = item.amounts?.[metric] ?? 0
                  return (
                    <div
                      key={metric}
                      title={`${DASHBOARD_BUDGET_METRIC_LABEL[metric]}: ${amount.toLocaleString('en-AE')}`}
                      className={`${index === 0 ? 'rounded-l-full' : ''} ${index === metrics.length - 1 ? 'rounded-r-full' : ''} h-full`}
                      style={{
                        width: `${metricTotal > 0 ? Math.max(4, Math.round((amount / metricTotal) * 100)) : 0}%`,
                        backgroundColor: METRIC_COLORS[metric],
                      }}
                    />
                  )
                })}
              </div>
            ) : (
              <div
                className="h-full rounded-full"
                style={{
                  width: `${item.pct}%`,
                  backgroundColor: item.color,
                }}
              />
            )}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5">
            {metrics.map((metric) => (
              <div key={metric} className="inline-flex items-center gap-1.5 text-xs">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: METRIC_COLORS[metric] }} />
                <span className="font-semibold text-[#64748B] dark:text-slate-300">{DASHBOARD_BUDGET_METRIC_LABEL[metric]}</span>
                <span className="font-semibold text-[#0F172A] dark:text-white">
                  {formatCompactBudget(item.amounts?.[metric] ?? 0)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )})}
      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-3 rounded-[18px] border border-[#DCE8F6] bg-white px-4 py-3 dark:border-white/10 dark:bg-[#1B2A41]">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#64748B] dark:text-slate-200">
            Category page {safePage + 1} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(0, current - 1))}
              disabled={safePage === 0}
              className="inline-flex h-9 items-center justify-center rounded-full border border-[#DCE8F6] px-3 text-xs font-semibold text-[#286CFF] transition-colors hover:bg-[#EEF5FF] disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:text-[#BFDBFE] dark:hover:bg-white/5"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => setPage((current) => Math.min(totalPages - 1, current + 1))}
              disabled={safePage >= totalPages - 1}
              className="inline-flex h-9 items-center justify-center rounded-full border border-[#DCE8F6] px-3 text-xs font-semibold text-[#286CFF] transition-colors hover:bg-[#EEF5FF] disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:text-[#BFDBFE] dark:hover:bg-white/5"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
