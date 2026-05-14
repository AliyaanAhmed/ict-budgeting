import { useEffect, useMemo, useState } from 'react'
import type { Project } from '@/domain/types'
import type { AppCycle, CyclesSessionData } from '@/services/cycleService'
import { getAccountIdForRole } from '@/services/instanceService'
import { getBudgetLineItemsByBudgetIds } from '@/services/budgetLineItemService'
import { Dga_ict_budget_instancesService } from '@/generated/services/Dga_ict_budget_instancesService'
import { Dga_ict_budgetsService } from '@/generated/services/Dga_ict_budgetsService'

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

export interface StrategicPriorityComparisonItem {
  name: string
  current: number
  previous: number
}

function normalizeChartLabel(value: string | null | undefined, fallback: string) {
  const trimmed = value?.trim()
  return trimmed || fallback
}

function groupStrategicPriorityBudgets(projects: Project[]) {
  const grouped = new Map<string, number>()

  for (const project of projects) {
    const name = normalizeChartLabel(project.strategicPriority, 'Unassigned Strategic Priority')
    grouped.set(name, (grouped.get(name) ?? 0) + project.requestedBudget)
  }

  return grouped
}

function normalizeAccountCodeType(value: string | null | undefined) {
  const trimmed = value?.trim()
  return trimmed || 'GL Code'
}

function getFormattedAnnotation(record: unknown, key: string) {
  const value = (record as Record<string, unknown> | null)?.[key]
  return typeof value === 'string' && value.trim() ? value : null
}

function getPreviousCycleForSelected(
  cyclesData: CyclesSessionData | null,
  selectedCycle: AppCycle | null
) {
  if (!cyclesData?.allCycles.length || !selectedCycle?.id) return null

  const sortedCycles = [...cyclesData.allCycles].sort(
    (left, right) => new Date(left.startDate).getTime() - new Date(right.startDate).getTime()
  )
  const selectedIndex = sortedCycles.findIndex((cycle) => cycle.id === selectedCycle.id)
  if (selectedIndex <= 0) return null
  return sortedCycles[selectedIndex - 1]
}

async function getStrategicPriorityBudgetsByInstanceId(instanceId: string) {
  const result = await Dga_ict_budgetsService.getAll({
    select: [
      'dga_total_budget_requested',
      '_dga_strategic_priority_value',
    ],
    filter: `_dga_ict_budget_instance_value eq ${instanceId}`,
  })

  const grouped = new Map<string, number>()

  for (const record of result.data ?? []) {
    const name =
      getFormattedAnnotation(
        record,
        '_dga_strategic_priority_value@OData.Community.Display.V1.FormattedValue'
      ) ?? 'Unassigned Strategic Priority'
    const amount =
      typeof record.dga_total_budget_requested === 'number' && Number.isFinite(record.dga_total_budget_requested)
        ? record.dga_total_budget_requested
        : 0

    grouped.set(name, (grouped.get(name) ?? 0) + amount)
  }

  return grouped
}

export function useBudgetByCategoryChart(projects: Project[]) {
  return useMemo<BudgetByCategoryChartItem[]>(() => {
    const grouped = groupStrategicPriorityBudgets(projects)
    return Array.from(grouped.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((left, right) => right.value - left.value)
  }, [projects])
}

export function useStrategicPriorityCycleComparison(
  selectedProjects: Project[],
  selectedCycle: AppCycle | null,
  cyclesData: CyclesSessionData | null
) {
  const [comparisonData, setComparisonData] = useState<StrategicPriorityComparisonItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const previousCycle = useMemo(
    () => getPreviousCycleForSelected(cyclesData, selectedCycle),
    [cyclesData, selectedCycle]
  )

  useEffect(() => {
    let mounted = true

    const load = async () => {
      setError(null)

      if (!selectedCycle?.id) {
        if (mounted) {
          setComparisonData([])
          setLoading(false)
        }
        return
      }

      if (!previousCycle?.id) {
        if (mounted) {
          setComparisonData([])
          setLoading(false)
        }
        return
      }

      setLoading(true)

      try {
        const respondentAccountId = getAccountIdForRole('Respondent')
        if (!respondentAccountId) {
          throw new Error('Unable to resolve the respondent account for cycle comparison.')
        }

        const previousInstanceResult = await Dga_ict_budget_instancesService.getAll({
          select: ['dga_ict_budget_instanceid'],
          filter: `_dga_cycle_value eq ${previousCycle.id} and _dga_entity_value eq ${respondentAccountId}`,
          top: 1,
        })

        const previousInstanceId = previousInstanceResult.data?.[0]?.dga_ict_budget_instanceid

        const [selectedBudgetMap, previousBudgetMap] = await Promise.all([
          Promise.resolve(groupStrategicPriorityBudgets(selectedProjects)),
          previousInstanceId
            ? getStrategicPriorityBudgetsByInstanceId(previousInstanceId)
            : Promise.resolve(new Map<string, number>()),
        ])

        const allNames = Array.from(
          new Set([...selectedBudgetMap.keys(), ...previousBudgetMap.keys()])
        )

        const nextData = allNames
          .map((name) => ({
            name,
            current: selectedBudgetMap.get(name) ?? 0,
            previous: previousBudgetMap.get(name) ?? 0,
          }))
          .sort((left, right) => {
            const leftMax = Math.max(left.current, left.previous)
            const rightMax = Math.max(right.current, right.previous)
            return rightMax - leftMax
          })

        if (mounted) {
          setComparisonData(nextData)
        }
      } catch (loadError) {
        if (mounted) {
          setComparisonData([])
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'Unable to load strategic priority cycle comparison.'
          )
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
  }, [previousCycle?.id, selectedCycle?.id, selectedProjects])

  return {
    comparisonData,
    previousCycle,
    loading,
    error,
  }
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
