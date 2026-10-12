import { useEffect, useMemo, useState } from 'react'
import type { Project } from '@/domain/types'
import type { AppCycle, CyclesSessionData } from '@/services/cycleService'
import { getAccountIdForRole } from '@/services/instanceService'
import { getBudgetLineItemsByBudgetIds } from '@/services/budgetLineItemService'
import { DGE_INSTANCE_STATUS } from '@/services/dgePortfolioService'
import { Dga_ict_budget_instancesService } from '@/generated/services/Dga_ict_budget_instancesService'
import { Dga_ict_budgetsService } from '@/generated/services/Dga_ict_budgetsService'

export interface BudgetByCategoryChartItem {
  name: string
  value: number
  amounts?: Partial<Record<DashboardBudgetMetric, number>>
}

export interface AccountCodesBreakdownItem {
  name: string
  type: string
  amount: number
  amounts?: Partial<Record<DashboardBudgetMetric, number>>
  pct: number
}

export interface StrategicPriorityComparisonItem {
  name: string
  current: number
  previous: number
}

export type DashboardBudgetMetric = 'requested' | 'recommended' | 'allocated' | 'utilized'

export const DASHBOARD_BUDGET_METRIC_LABEL: Record<DashboardBudgetMetric, string> = {
  requested: 'Requested Budget',
  recommended: 'Recommended Budget',
  allocated: 'Allocated Budget',
  utilized: 'Utilized Budget',
}

export function getDashboardBudgetMetricForInstanceStatus(statuscode: number | null | undefined): DashboardBudgetMetric {
  if (statuscode === DGE_INSTANCE_STATUS.utilization) return 'utilized'
  if (statuscode === DGE_INSTANCE_STATUS.allocation) return 'allocated'
  if (statuscode === DGE_INSTANCE_STATUS.reviewCompletedByDge) return 'recommended'
  return 'requested'
}

export function getDashboardBudgetMetricsForInstanceStatus(statuscode: number | null | undefined): DashboardBudgetMetric[] {
  if (statuscode === DGE_INSTANCE_STATUS.utilization) return ['requested', 'recommended', 'allocated', 'utilized']
  if (statuscode === DGE_INSTANCE_STATUS.allocation) return ['requested', 'recommended', 'allocated']
  if (statuscode === DGE_INSTANCE_STATUS.reviewCompletedByDge) return ['requested', 'recommended']
  return ['requested']
}

export function getProjectBudgetAmount(project: Project, metric: DashboardBudgetMetric) {
  if (metric === 'recommended') return project.recommendedBudget ?? 0
  if (metric === 'allocated') return project.allocatedBudget ?? 0
  if (metric === 'utilized') return project.utilizedBudget ?? 0
  return project.requestedBudget
}

function getBudgetLineAmount(
  item: {
    budgetRequested: number
    budgetRecommended: number
    budgetAllocated: number
    totalBudgetUtilized: number
  },
  metric: DashboardBudgetMetric
) {
  if (metric === 'recommended') return item.budgetRecommended
  if (metric === 'allocated') return item.budgetAllocated
  if (metric === 'utilized') return item.totalBudgetUtilized
  return item.budgetRequested
}

function normalizeChartLabel(value: string | null | undefined, fallback: string) {
  const trimmed = value?.trim()
  return trimmed || fallback
}

export function getMetricAmountsFromProjects(projects: Project[], metrics: DashboardBudgetMetric[]) {
  return metrics.reduce<Partial<Record<DashboardBudgetMetric, number>>>((totals, metric) => {
    totals[metric] = projects.reduce((sum, project) => sum + getProjectBudgetAmount(project, metric), 0)
    return totals
  }, {})
}

function groupStrategicPriorityBudgets(projects: Project[], metrics: DashboardBudgetMetric[] = ['requested']) {
  const grouped = new Map<string, Project[]>()

  for (const project of projects) {
    const name = normalizeChartLabel(project.strategicPriority, 'Unassigned Strategic Priority')
    const existing = grouped.get(name) ?? []
    existing.push(project)
    grouped.set(name, existing)
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

export function useBudgetByCategoryChart(projects: Project[], metrics: DashboardBudgetMetric[] = ['requested']) {
  return useMemo<BudgetByCategoryChartItem[]>(() => {
    const grouped = groupStrategicPriorityBudgets(projects, metrics)
    const activeMetric = metrics[metrics.length - 1] ?? 'requested'
    return Array.from(grouped.entries())
      .map(([name, groupedProjects]) => {
        const amounts = getMetricAmountsFromProjects(groupedProjects, metrics)
        return {
          name,
          value: amounts[activeMetric] ?? 0,
          amounts,
        }
      })
      .sort((left, right) => right.value - left.value)
  }, [metrics, projects])
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
          Promise.resolve(
            new Map(
              Array.from(groupStrategicPriorityBudgets(selectedProjects, ['requested']).entries()).map(
                ([name, groupedProjects]) => [
                  name,
                  groupedProjects.reduce((sum, project) => sum + getProjectBudgetAmount(project, 'requested'), 0),
                ]
              )
            )
          ),
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

export function useAccountCodesBreakdown(projects: Project[], metrics: DashboardBudgetMetric[] = ['requested']) {
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
        const activeMetric = metrics[metrics.length - 1] ?? 'requested'
        const grouped = new Map<string, { name: string; type: string; amounts: Partial<Record<DashboardBudgetMetric, number>> }>()

        for (const item of lineItems) {
          const name = normalizeChartLabel(item.accountName, 'Unnamed GL Code')
          const existing = grouped.get(name)
          if (existing) {
            for (const budgetMetric of metrics) {
              existing.amounts[budgetMetric] = (existing.amounts[budgetMetric] ?? 0) + getBudgetLineAmount(item, budgetMetric)
            }
            continue
          }

          grouped.set(name, {
            name,
            type: normalizeAccountCodeType(item.expenseTypeLabel),
            amounts: metrics.reduce<Partial<Record<DashboardBudgetMetric, number>>>((totals, budgetMetric) => {
              totals[budgetMetric] = getBudgetLineAmount(item, budgetMetric)
              return totals
            }, {}),
          })
        }

        const total = Array.from(grouped.values()).reduce((sum, item) => sum + (item.amounts[activeMetric] ?? 0), 0)
        const nextItems = Array.from(grouped.values())
          .sort((left, right) => (right.amounts[activeMetric] ?? 0) - (left.amounts[activeMetric] ?? 0))
          .slice(0, 5)
          .map((item) => ({
            ...item,
            amount: item.amounts[activeMetric] ?? 0,
            pct: total > 0 ? Math.round(((item.amounts[activeMetric] ?? 0) / total) * 100) : 0,
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
  }, [budgetIds, metrics])

  return { items, loading, error }
}
