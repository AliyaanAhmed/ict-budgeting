import { useEffect, useMemo, useState } from 'react'
import type { Project } from '@/domain/types'
import { getBudgetLineItemsByBudgetIds } from '@/services/budgetLineItemService'

export interface BudgetByCategoryChartItem {
  name: string
  value: number
}

export interface AccountCodesBreakdownItem {
  name: string
  type: string
  amount: number
  pct: number
}

function normalizeChartLabel(value: string | null | undefined, fallback: string) {
  const trimmed = value?.trim()
  return trimmed || fallback
}

function normalizeAccountCodeType(value: string | null | undefined) {
  const trimmed = value?.trim()
  return trimmed || 'GL Code'
}

export function useBudgetByCategoryChart(projects: Project[]) {
  return useMemo<BudgetByCategoryChartItem[]>(() => {
    const grouped = new Map<string, number>()

    for (const project of projects) {
      const name = normalizeChartLabel(project.strategicPriority, 'Unassigned Strategic Priority')
      grouped.set(name, (grouped.get(name) ?? 0) + project.requestedBudget)
    }

    return Array.from(grouped.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((left, right) => right.value - left.value)
  }, [projects])
}

export function useAccountCodesBreakdown(projects: Project[]) {
  const [items, setItems] = useState<AccountCodesBreakdownItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const budgetIds = useMemo(
    () => Array.from(new Set(projects.map((project) => project.ictBudgetId?.trim()).filter(Boolean) as string[])),
    [projects]
  )

  useEffect(() => {
    let mounted = true

    const load = async () => {
      setLoading(true)
      setError(null)

      try {
        if (!budgetIds.length) {
          if (mounted) {
            setItems([])
            setLoading(false)
          }
          return
        }

        const lineItems = await getBudgetLineItemsByBudgetIds(budgetIds)
        const grouped = new Map<string, { name: string; type: string; amount: number }>()

        for (const item of lineItems) {
          const name = normalizeChartLabel(item.accountName, 'Unnamed GL Code')
          const existing = grouped.get(name)
          if (existing) {
            existing.amount += item.budgetRequested
            continue
          }

          grouped.set(name, {
            name,
            type: normalizeAccountCodeType(item.expenseTypeLabel),
            amount: item.budgetRequested,
          })
        }

        const total = Array.from(grouped.values()).reduce((sum, item) => sum + item.amount, 0)
        const nextItems = Array.from(grouped.values())
          .sort((left, right) => right.amount - left.amount)
          .slice(0, 5)
          .map((item) => ({
            ...item,
            pct: total > 0 ? Math.round((item.amount / total) * 100) : 0,
          }))

        if (mounted) {
          setItems(nextItems)
        }
      } catch (loadError) {
        if (mounted) {
          setItems([])
          setError(loadError instanceof Error ? loadError.message : 'Unable to load account code breakdown.')
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    void load()

    return () => {
      mounted = false
    }
  }, [budgetIds])

  return { items, loading, error }
}
