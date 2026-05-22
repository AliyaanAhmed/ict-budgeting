import { useState } from 'react'
import { CurrencyAmount } from '@/components/shared/CurrencyAmount'
import { dashboardPalette } from '@/lib/dashboardPalette'
import type { AccountCodesBreakdownItem } from '@/hooks/useDashboardBudgetCharts'

const BREAKDOWN_COLORS = [...dashboardPalette.primarySeries]
const PAGE_SIZE = 5

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
  const [page, setPage] = useState(0)
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

  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages - 1)
  const visibleItems = items.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE)

  return (
    <div className="space-y-4">
      {visibleItems.map((item, index) => {
        const actualIndex = safePage * PAGE_SIZE + index
        const color = BREAKDOWN_COLORS[actualIndex % BREAKDOWN_COLORS.length]
        const isCapex = item.type.toLowerCase().includes('cap')

        return (
          <div key={item.name} className="rounded-[20px] border border-[#DCE8F6] bg-white px-4 py-3 shadow-none dark:border-white/10 dark:bg-[#1B2A41]">
            <div className="flex items-center gap-3">
              <span
                className={`inline-flex min-w-[64px] items-center justify-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                  isCapex
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                    : 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                }`}
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
                  backgroundColor: color,
                }}
              />
            </div>
          </div>
        )
      })}
      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-3 rounded-[18px] border border-[#DCE8F6] bg-white px-4 py-3 dark:border-white/10 dark:bg-[#1B2A41]">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#64748B] dark:text-slate-200">
            Account page {safePage + 1} of {totalPages}
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
