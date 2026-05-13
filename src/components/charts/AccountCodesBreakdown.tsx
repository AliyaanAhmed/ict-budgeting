import { CurrencyAmount } from '@/components/shared/CurrencyAmount'
import type { AccountCodesBreakdownItem } from '@/hooks/useDashboardBudgetCharts'

const BREAKDOWN_COLORS = ['#8B5CF6', '#22C55E', '#286CFF', '#F59E0B', '#EC4899']

interface AccountCodesBreakdownProps {
  items: AccountCodesBreakdownItem[]
  loading?: boolean
  error?: string | null
}

export function AccountCodesBreakdown({
  items,
  loading = false,
  error = null,
}: AccountCodesBreakdownProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="h-[86px] animate-pulse rounded-[20px] border border-[#DCE8F6] bg-white px-4 py-3 dark:border-white/10 dark:bg-[#1B2A41]"
          />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-[20px] border border-[#FFD4D1] bg-[#FFF5F5] px-4 py-3 text-sm text-[#B42318] dark:border-[#7F1D1D] dark:bg-[#3B0D0D] dark:text-[#FECACA]">
        {error}
      </div>
    )
  }

  if (!items.length) {
    return (
      <div className="rounded-[20px] border border-dashed border-[#DCE8F6] bg-[#F8FAFC] px-4 py-8 text-center text-sm text-[#64748B] dark:border-white/10 dark:bg-white/5 dark:text-slate-100">
        No GL code budget line items are available for the current cycle.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {items.map((item, index) => {
        const color = BREAKDOWN_COLORS[index % BREAKDOWN_COLORS.length]

        return (
          <div key={item.name} className="rounded-[20px] border border-[#DCE8F6] bg-white px-4 py-3 shadow-none dark:border-white/10 dark:bg-[#1B2A41]">
            <div className="flex items-center gap-3">
              <span
                className="inline-flex min-w-[64px] items-center justify-center rounded-full px-2.5 py-1 text-xs font-semibold"
                style={{ backgroundColor: `${color}16`, color }}
              >
                {item.type}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-[#0F172A] dark:text-white">{item.name}</p>
              </div>
              <CurrencyAmount amount={item.amount} className="text-sm font-medium text-[#0F172A] dark:text-white" iconSize={13} />
            </div>
            <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white dark:bg-white/10">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${item.pct}%`,
                  background: `linear-gradient(90deg, ${color}, ${color}BB)`,
                }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
