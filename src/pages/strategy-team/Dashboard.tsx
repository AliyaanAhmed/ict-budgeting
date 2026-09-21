import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BarChart3,
  Building2,
  CalendarClock,
  CheckCircle2,
  Clock3,
  GaugeCircle,
  MessageSquareMore,
  PieChart,
  Radar,
  Route,
  ShieldAlert,
  Sparkles,
  Target,
  Users,
  Workflow,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CurrencyAmount } from '@/components/shared/CurrencyAmount'
import { useCycle } from '@/context/CycleContext'
import type { Clarification } from '@/data/db'
import { cn } from '@/lib/utils'
import { getClarificationsByBudgetId } from '@/services/clarificationService'
import {
  DGE_BUDGET_STATUS,
  DGE_INSTANCE_STATUS,
  getDgePortfolioData,
  type DgeBudgetRecord,
  type DgeInstanceRecord,
  type DgePortfolioData,
} from '@/services/dgePortfolioService'
import {
  StrategyDashboardEmptyState,
  StrategyMetricCard,
  StrategyPageShell,
  StrategyPill,
} from './StrategyTeamShell'

type ClarificationType = 'within-dge' | 'dge-to-adge' | 'adge-to-adge'

type ClarificationMonitorItem = {
  id: string
  type: ClarificationType
  budget: DgeBudgetRecord
  clarification: Clarification
}

type ExceptionItem = {
  label: string
  abbrs: string[]
  count?: number
  tone: 'blue' | 'amber' | 'red' | 'violet'
  description: string
}

const today = new Date()
today.setHours(0, 0, 0, 0)

function parseDate(value?: string | null) {
  if (!value) return null
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  parsed.setHours(0, 0, 0, 0)
  return parsed
}

function addDays(value: Date, days: number) {
  const next = new Date(value)
  next.setDate(next.getDate() + days)
  return next
}

function isPast(value?: string | null) {
  const parsed = parseDate(value)
  return parsed ? parsed < today : false
}

function isPlanningStartGracePassed(instance: DgeInstanceRecord) {
  const start = parseDate(instance.planningStartDate)
  return start ? addDays(start, 7) < today : false
}

function getEntityCode(instance: DgeInstanceRecord) {
  return instance.entityAbbr || instance.entityName || instance.name || 'Entity'
}

function getClarificationType(clarification: Clarification): ClarificationType {
  if (clarification.scope === 'Internal (DGE)') return 'within-dge'
  if (clarification.scope === 'External') return 'dge-to-adge'
  return 'adge-to-adge'
}

function getBudgetLensTotal(budgets: DgeBudgetRecord[]) {
  return budgets.reduce(
    (sum, budget) =>
      sum +
      (budget.utilizedBudget ||
        budget.allocatedBudget ||
        budget.recommendedBudget ||
        budget.requestedBudget ||
        0),
    0
  )
}

function getClarificationLatestDate(clarification: Clarification) {
  return clarification.replies.reduce(
    (latest, reply) => (reply.date > latest ? reply.date : latest),
    clarification.closedAt || clarification.date
  )
}

function isClarificationOverdue(clarification: Clarification) {
  if (clarification.status === 'Closed') return false
  return isPast(clarification.dueDate)
}

function ReviewMetric({
  label,
  value,
  accent,
  href,
}: {
  label: string
  value: number
  accent: string
  href?: string
}) {
  const content = (
    <div className="group rounded-[20px] border border-[#DCE8F6] bg-[#F8FBFF] px-4 py-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#286CFF] hover:bg-[#EEF5FF] dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-[#0F172A] dark:text-white">{label}</p>
        <span className="text-2xl font-bold" style={{ color: accent }}>{value}</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white dark:bg-white/10">
        <div className="h-full rounded-full transition-[width] duration-500" style={{ width: value > 0 ? `${Math.min(100, Math.max(8, value * 12))}%` : '0%', backgroundColor: accent }} />
      </div>
    </div>
  )

  return href ? <Link to={href}>{content}</Link> : content
}

function ClarificationDirectionCard({
  label,
  total,
  onTrack,
  overdue,
  accent,
}: {
  label: string
  total: number
  onTrack: number
  overdue: number
  accent: string
}) {
  return (
    <div className="rounded-[22px] border border-[#DCE8F6] bg-[#F8FBFF] p-4 dark:border-white/10 dark:bg-white/5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-bold text-[#0F172A] dark:text-white">{label}</p>
        <span className="rounded-full px-2.5 py-1 text-xs font-bold text-white" style={{ backgroundColor: accent }}>{total}</span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-[18px] border border-[#DCE8F6] bg-white px-3 py-3 dark:border-white/10 dark:bg-[#162339]">
          <p className="text-xs font-semibold text-[#64748B] dark:text-slate-300">On Track</p>
          <p className="mt-1 text-2xl font-bold text-[#15803D] dark:text-[#86EFAC]">{onTrack}</p>
        </div>
        <div className="rounded-[18px] border border-[#FFD4D1] bg-white px-3 py-3 dark:border-[#7F1D1D] dark:bg-[#162339]">
          <p className="text-xs font-semibold text-[#64748B] dark:text-slate-300">Overdue</p>
          <p className="mt-1 text-2xl font-bold text-[#DC2626] dark:text-[#FCA5A5]">{overdue}</p>
        </div>
      </div>
    </div>
  )
}

function ExceptionRow({ item, compact = false }: { item: ExceptionItem; compact?: boolean }) {
  const toneClass = {
    blue: 'bg-[#EEF5FF] text-[#286CFF] dark:bg-[#286CFF]/15 dark:text-[#BFDBFE]',
    amber: 'bg-[#FFF7E6] text-[#D97706] dark:bg-[#D97706]/15 dark:text-[#FCD34D]',
    red: 'bg-[#FFF1F1] text-[#DC2626] dark:bg-[#DC2626]/15 dark:text-[#FCA5A5]',
    violet: 'bg-[#F5EEFF] text-[#9333EA] dark:bg-[#9333EA]/15 dark:text-[#E9D5FF]',
  }[item.tone]

  return (
    <div className={cn(
      'rounded-[18px] border border-[#DCE8F6] bg-white dark:border-white/10 dark:bg-white/5',
      compact ? 'px-3 py-2.5' : 'px-4 py-3'
    )}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-bold text-[#0F172A] dark:text-white">{item.label}</p>
          {!compact ? <p className="mt-1 text-xs leading-5 text-[#64748B] dark:text-slate-300">{item.description}</p> : null}
        </div>
        <span className={cn('shrink-0 rounded-full px-2.5 py-1 text-xs font-bold', toneClass)}>
          {item.count ?? item.abbrs.length}
        </span>
      </div>
      <div className={cn('flex flex-wrap gap-2', compact ? 'mt-2' : 'mt-3')}>
        {item.abbrs.length ? (
          item.abbrs.slice(0, compact ? 6 : 12).map((abbr) => (
            <span key={abbr} className="rounded-full border border-[#DCE8F6] bg-[#F8FBFF] px-2.5 py-1 text-xs font-bold text-[#286CFF] dark:border-white/10 dark:bg-[#162339] dark:text-[#BFDBFE]">
              {abbr}
            </span>
          ))
        ) : (
          <span className="text-xs font-semibold text-[#94A3B8] dark:text-slate-400">No exceptions</span>
        )}
      </div>
    </div>
  )
}

function ExceptionStageSummary({
  title,
  icon,
  items,
}: {
  title: string
  icon: React.ReactNode
  items: ExceptionItem[]
}) {
  const count = items.reduce((sum, item) => sum + (item.count ?? item.abbrs.length), 0)

  return (
    <div className="rounded-[22px] border border-[#DCE8F6] bg-[#F8FBFF] p-3 dark:border-white/10 dark:bg-white/5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#EEF5FF] text-[#286CFF] dark:bg-[#286CFF]/15 dark:text-[#BFDBFE]">
            {icon}
          </div>
          <h3 className="text-sm font-bold text-[#0F172A] dark:text-white">{title}</h3>
        </div>
        <span className={cn(
          'rounded-full px-2.5 py-1 text-xs font-bold',
          count > 0
            ? 'bg-[#FFF7E6] text-[#D97706] dark:bg-[#D97706]/15 dark:text-[#FCD34D]'
            : 'bg-[#ECFDF3] text-[#15803D] dark:bg-[#15803D]/15 dark:text-[#86EFAC]'
        )}>
          {count}
        </span>
      </div>
      <div className="space-y-2">
        {items.map((item) => <ExceptionRow key={item.label} item={item} compact />)}
      </div>
    </div>
  )
}

type CycleStageKey = 'planning' | 'dge-review' | 'allocation' | 'utilization'

type CycleStep = {
  label: string
  current: number
  completed: number
  overdue: number
  medianDays: number | null
  paused: number
  progress: number
}

function daysBetween(start?: string | null, end?: string | null) {
  const startDate = parseDate(start)
  const endDate = parseDate(end) ?? today
  if (!startDate) return null
  return Math.max(0, Math.round((endDate.getTime() - startDate.getTime()) / 86_400_000))
}

function median(values: number[]) {
  if (!values.length) return null
  const sorted = [...values].sort((left, right) => left - right)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[middle] : Math.round((sorted[middle - 1] + sorted[middle]) / 2)
}

function formatLongDate(value?: string | null) {
  const date = parseDate(value)
  if (!date) return null

  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function getDaysFromToday(value?: string | null) {
  const date = parseDate(value)
  if (!date) return null
  return Math.round((date.getTime() - today.getTime()) / 86_400_000)
}

function getStageProgress(current: number, completed: number) {
  const total = current + completed
  return total > 0 ? Math.round((completed / total) * 100) : 0
}

function getBudgetTotals(budgets: DgeBudgetRecord[]) {
  return {
    requested: budgets.reduce((sum, budget) => sum + budget.requestedBudget, 0),
    recommended: budgets.reduce((sum, budget) => sum + budget.recommendedBudget, 0),
    allocated: budgets.reduce((sum, budget) => sum + budget.allocatedBudget, 0),
    utilized: budgets.reduce((sum, budget) => sum + budget.utilizedBudget, 0),
  }
}

function DonutChart({ value, accent }: { value: number; accent: string }) {
  return (
    <div
      className="grid h-20 w-20 shrink-0 place-items-center rounded-full transition-all duration-500 ease-out"
      style={{ background: `conic-gradient(${accent} ${value}%, #EAF0F7 0)` }}
    >
      <div className="grid h-14 w-14 place-items-center rounded-full bg-white text-sm font-bold text-[#0F172A] dark:bg-[#162339] dark:text-white">
        {value}%
      </div>
    </div>
  )
}

function getPhaseDeadlineDate(instance: DgeInstanceRecord, stage: CycleStageKey) {
  if (stage === 'planning') return instance.submissionDate
  if (stage === 'dge-review') return instance.allocationStartDate
  if (stage === 'allocation') return instance.allocationEndDate
  return instance.utilizationEndDate
}

function getSelectedDeadline(instances: DgeInstanceRecord[], stage: CycleStageKey) {
  const dated = instances
    .map((instance) => {
      const value = getPhaseDeadlineDate(instance, stage)
      const date = parseDate(value)
      return date ? { value, date } : null
    })
    .filter((item): item is { value: string; date: Date } => Boolean(item))

  if (!dated.length) return null

  const upcoming = dated
    .filter((item) => item.date >= today)
    .sort((left, right) => left.date.getTime() - right.date.getTime())

  if (upcoming.length) return upcoming[0].value

  return dated.sort((left, right) => right.date.getTime() - left.date.getTime())[0].value
}

function isBudgetAllocationCompletedOrBeyond(budget: DgeBudgetRecord) {
  return (
    budget.statuscode === DGE_BUDGET_STATUS.allocationCompleted ||
    budget.statuscode === DGE_BUDGET_STATUS.utilizationInProgress ||
    budget.statuscode === DGE_BUDGET_STATUS.utilizationCompleted
  )
}

function isBudgetUtilizationCompleted(budget: DgeBudgetRecord) {
  return budget.statuscode === DGE_BUDGET_STATUS.utilizationCompleted
}

function getLeftBehindEntities(instances: DgeInstanceRecord[], stage: CycleStageKey) {
  return instances.filter((instance) => {
    const deadline = getPhaseDeadlineDate(instance, stage)
    if (!isPast(deadline)) return false

    if (stage === 'planning') {
      return (
        instance.statuscode === DGE_INSTANCE_STATUS.published ||
        instance.statuscode === DGE_INSTANCE_STATUS.planning
      )
    }
    if (stage === 'dge-review') {
      return (
        instance.statuscode !== DGE_INSTANCE_STATUS.allocation &&
        instance.statuscode !== DGE_INSTANCE_STATUS.utilization
      )
    }
    if (stage === 'allocation') {
      return !instance.budgets.length || !instance.budgets.every(isBudgetAllocationCompletedOrBeyond)
    }
    return !instance.budgets.length || !instance.budgets.every(isBudgetUtilizationCompleted)
  })
}

function CycleProgressExplorer({
  instances,
  budgets,
  clarifications,
}: {
  instances: DgeInstanceRecord[]
  budgets: DgeBudgetRecord[]
  clarifications: ClarificationMonitorItem[]
}) {
  const [activeStage, setActiveStage] = useState<CycleStageKey>('dge-review')
  const [hoverStage, setHoverStage] = useState<CycleStageKey | null>(null)
  const didAutoSelectStage = useRef(false)

  const planningBudgets = useMemo(
    () => {
      const statuses = new Set<number>([
          DGE_BUDGET_STATUS.draft,
          DGE_BUDGET_STATUS.underReviewerReview,
          DGE_BUDGET_STATUS.underApproverReview,
          DGE_BUDGET_STATUS.reviewerReviewCompleted,
          DGE_BUDGET_STATUS.approvedByApprover,
        ])
      return budgets.filter((budget) => statuses.has(budget.statuscode))
    },
    [budgets]
  )
  const dgeReviewBudgets = useMemo(
    () => {
      const statuses = new Set<number>([
          DGE_BUDGET_STATUS.underStrategicAlignmentReview,
          DGE_BUDGET_STATUS.underSmeReview,
          DGE_BUDGET_STATUS.strategicPriorityChangeUnderReview,
          DGE_BUDGET_STATUS.underQualityCheck,
          DGE_BUDGET_STATUS.underFinalReview,
          DGE_BUDGET_STATUS.reviewCompleted,
          DGE_BUDGET_STATUS.clarificationPending,
        ])
      return budgets.filter((budget) => statuses.has(budget.statuscode))
    },
    [budgets]
  )
  const allocationBudgets = useMemo(
    () => {
      const statuses = new Set<number>([
          DGE_BUDGET_STATUS.allocationInProgress,
          DGE_BUDGET_STATUS.allocationInReview,
          DGE_BUDGET_STATUS.allocationCompleted,
        ])
      return budgets.filter((budget) => statuses.has(budget.statuscode))
    },
    [budgets]
  )
  const utilizationBudgets = useMemo(
    () => {
      const statuses = new Set<number>([
          DGE_BUDGET_STATUS.utilizationInProgress,
          DGE_BUDGET_STATUS.utilizationCompleted,
        ])
      return budgets.filter((budget) => statuses.has(budget.statuscode))
    },
    [budgets]
  )

  const instanceById = useMemo(() => new Map(instances.map((instance) => [instance.id, instance])), [instances])
  const dgeReviewSteps = useMemo<CycleStep[]>(() => {
    const stepDefs: Array<{ label: string; status: number; completed: number[]; isPausedMatch?: (item: ClarificationMonitorItem) => boolean }> = [
      {
        label: 'Under Strategic Alignment Review',
        status: DGE_BUDGET_STATUS.underStrategicAlignmentReview,
        completed: [DGE_BUDGET_STATUS.underSmeReview, DGE_BUDGET_STATUS.underQualityCheck, DGE_BUDGET_STATUS.underFinalReview, DGE_BUDGET_STATUS.reviewCompleted],
        isPausedMatch: (item) =>
          item.budget.statuscode === DGE_BUDGET_STATUS.clarificationPending &&
          item.clarification.stage === 'In DGE Review' &&
          item.clarification.raisedBy === 'Strategy Team' &&
          item.clarification.scope === 'External' &&
          !item.clarification.raisedTo.toLowerCase().includes('sme'),
      },
      {
        label: 'Under SME Review',
        status: DGE_BUDGET_STATUS.underSmeReview,
        completed: [DGE_BUDGET_STATUS.underQualityCheck, DGE_BUDGET_STATUS.underFinalReview, DGE_BUDGET_STATUS.reviewCompleted],
        isPausedMatch: (item) =>
          item.budget.statuscode === DGE_BUDGET_STATUS.clarificationPending &&
          item.clarification.stage === 'In DGE Review' &&
          item.clarification.raisedBy === 'SME Team',
      },
      {
        label: 'Quality Check Review',
        status: DGE_BUDGET_STATUS.underQualityCheck,
        completed: [DGE_BUDGET_STATUS.underFinalReview, DGE_BUDGET_STATUS.reviewCompleted],
        isPausedMatch: (item) =>
          item.budget.statuscode === DGE_BUDGET_STATUS.clarificationPending &&
          item.clarification.stage === 'In DGE Review' &&
          item.clarification.raisedBy === 'Strategy Team' &&
          (item.clarification.scope === 'Internal (DGE)' || item.clarification.raisedTo.toLowerCase().includes('sme')),
      },
      {
        label: 'Review by Director',
        status: DGE_BUDGET_STATUS.underFinalReview,
        completed: [DGE_BUDGET_STATUS.reviewCompleted],
        isPausedMatch: (item) =>
          item.budget.statuscode === DGE_BUDGET_STATUS.clarificationPending &&
          item.clarification.stage === 'In DGE Review' &&
          item.clarification.raisedBy === 'Strategy Director',
      },
      { label: 'Review Completed', status: DGE_BUDGET_STATUS.reviewCompleted, completed: [] },
    ]

    return stepDefs.map((step) => {
      const currentBudgets = budgets.filter((budget) => budget.statuscode === step.status)
      const completedBudgets = budgets.filter((budget) => step.completed.includes(budget.statuscode))
      const overdue = currentBudgets.filter((budget) => isPast(instanceById.get(budget.instanceId || '')?.planningEndDate)).length
      const paused = step.isPausedMatch
        ? clarifications.filter((item) => item.clarification.status === 'Open' && step.isPausedMatch?.(item)).length
        : 0
      const medianDays = median(currentBudgets.map((budget) => daysBetween(instanceById.get(budget.instanceId || '')?.submissionDate || instanceById.get(budget.instanceId || '')?.planningEndDate)).filter((value): value is number => value !== null))
      return {
        label: step.label,
        current: currentBudgets.length,
        completed: completedBudgets.length,
        overdue,
        medianDays,
        paused,
        progress: step.status === DGE_BUDGET_STATUS.reviewCompleted ? (currentBudgets.length ? 100 : 0) : getStageProgress(currentBudgets.length, completedBudgets.length),
      }
    })
  }, [budgets, clarifications, instanceById])

  const planningSteps = useMemo(() => {
    const planningNotStarted = instances.filter((instance) => instance.statuscode === DGE_INSTANCE_STATUS.planning && instance.budgets.length === 0).length
    const draftingProjects = budgets.filter((budget) => budget.statuscode === DGE_BUDGET_STATUS.draft).length
    const submittedToReviewer = budgets.filter((budget) => budget.statuscode === DGE_BUDGET_STATUS.underReviewerReview).length
    const submittedToApprover = budgets.filter((budget) => budget.statuscode === DGE_BUDGET_STATUS.underApproverReview || budget.statuscode === DGE_BUDGET_STATUS.reviewerReviewCompleted).length
    const dgeReview = budgets.filter((budget) =>
      budget.statuscode === DGE_BUDGET_STATUS.approvedByApprover ||
      budget.statuscode === DGE_BUDGET_STATUS.underStrategicAlignmentReview
    ).length
    const published = instances.filter((instance) => instance.statuscode === DGE_INSTANCE_STATUS.published).length
    const total = Math.max(1, budgets.length + planningNotStarted)
    return [
      { label: 'Planning Not Started', count: planningNotStarted, unit: 'entities', progress: Math.round((planningNotStarted / total) * 100) },
      { label: 'Drafting Projects', count: draftingProjects, progress: Math.round((draftingProjects / total) * 100) },
      { label: 'Submitted to Reviewer', count: submittedToReviewer, progress: Math.round((submittedToReviewer / total) * 100) },
      { label: 'Submitted to Approver', count: submittedToApprover, progress: Math.round((submittedToApprover / total) * 100) },
      { label: 'DGE Review', count: dgeReview, progress: Math.round((dgeReview / total) * 100) },
      { label: 'Published', count: published, unit: 'entities', progress: Math.round((published / total) * 100) },
    ]
  }, [budgets, instances])

  const allocationSteps = useMemo(() => {
    const total = Math.max(1, allocationBudgets.length)
    return [
      { label: 'Allocation In Progress', count: allocationBudgets.filter((budget) => budget.statuscode === DGE_BUDGET_STATUS.allocationInProgress).length },
      { label: 'Allocation In Review', count: allocationBudgets.filter((budget) => budget.statuscode === DGE_BUDGET_STATUS.allocationInReview).length },
      { label: 'Allocation Completed', count: allocationBudgets.filter((budget) => budget.statuscode === DGE_BUDGET_STATUS.allocationCompleted).length },
    ].map((step) => ({ ...step, progress: Math.round((step.count / total) * 100) }))
  }, [allocationBudgets])

  const utilizationSteps = useMemo(() => {
    const total = Math.max(1, utilizationBudgets.length)
    return [
      { label: 'Utilization In Progress', count: utilizationBudgets.filter((budget) => budget.statuscode === DGE_BUDGET_STATUS.utilizationInProgress).length },
      { label: 'Utilization Completed', count: utilizationBudgets.filter((budget) => budget.statuscode === DGE_BUDGET_STATUS.utilizationCompleted).length },
    ].map((step) => ({ ...step, progress: Math.round((step.count / total) * 100) }))
  }, [utilizationBudgets])

  const utilizationQuarters = useMemo(() => {
    const utilizedTotal = budgets.reduce((sum, budget) => sum + budget.utilizedBudget, 0)
    const allocatedTotal = budgets.reduce((sum, budget) => sum + budget.allocatedBudget, 0)
    const baseProgress = allocatedTotal > 0 ? Math.round((utilizedTotal / allocatedTotal) * 100) : 0
    return [
      { label: 'Q1', value: Math.min(100, baseProgress), amount: utilizedTotal * 0.25 },
      { label: 'Q2', value: Math.min(100, Math.round(baseProgress * 0.75)), amount: utilizedTotal * 0.25 },
      { label: 'Q3', value: Math.min(100, Math.round(baseProgress * 0.5)), amount: utilizedTotal * 0.25 },
      { label: 'Q4', value: Math.min(100, Math.round(baseProgress * 0.25)), amount: utilizedTotal * 0.25 },
    ]
  }, [budgets])

  const stageMeta = useMemo(() => {
    const planningActive = planningBudgets.length
    const reviewCurrent = dgeReviewSteps.reduce((sum, step) => sum + step.current, 0)
    const reviewCompleted = dgeReviewSteps.find((step) => step.label === 'Review Completed')?.current ?? 0
    const allocationActive = allocationBudgets.length
    const utilizationActive = utilizationBudgets.length
    const utilizationProgress = utilizationQuarters.length ? Math.round(utilizationQuarters.reduce((sum, quarter) => sum + quarter.value, 0) / utilizationQuarters.length) : 0

    return [
      { key: 'planning' as const, number: '01', eyebrow: 'Planning', title: 'Planning', subtitle: 'Projects moving from drafting to DGE submission', count: planningActive, unit: 'projects', progress: Math.min(100, Math.round(((planningSteps[2]?.count ?? 0) + (planningSteps[3]?.count ?? 0) + (planningSteps[4]?.count ?? 0)) / Math.max(1, planningActive) * 100)), accent: '#286CFF', soft: '#EEF5FF' },
      { key: 'dge-review' as const, number: '02', eyebrow: 'Governance', title: 'DGE Review', subtitle: 'Projects moving through five assurance gates', count: reviewCurrent, unit: 'projects', progress: getStageProgress(reviewCurrent, reviewCompleted), accent: '#7C3AED', soft: '#F5EEFF' },
      { key: 'allocation' as const, number: '03', eyebrow: 'Funding', title: 'Allocation', subtitle: 'Projects progressing through allocation stages', count: allocationActive, unit: 'projects', progress: allocationSteps.find((step) => step.label === 'Allocation Completed')?.progress ?? 0, accent: '#0F9D8A', soft: '#ECFEFF' },
      { key: 'utilization' as const, number: '04', eyebrow: 'Execution', title: 'Utilization', subtitle: 'Projects moving through utilization completion', count: utilizationActive, unit: 'projects', progress: utilizationProgress, accent: '#D97706', soft: '#FFF7E6' },
    ]
  }, [allocationBudgets.length, allocationSteps, dgeReviewSteps, planningBudgets.length, planningSteps, utilizationBudgets.length, utilizationQuarters])

  const visibleStage = hoverStage ?? activeStage
  const active = stageMeta.find((stage) => stage.key === visibleStage) ?? stageMeta[1]
  const dominantStage = stageMeta.find((stage) => stage.count > 0)?.key ?? 'planning'
  const activeStageBudgets =
    visibleStage === 'planning'
      ? planningBudgets
      : visibleStage === 'dge-review'
        ? dgeReviewBudgets
        : visibleStage === 'allocation'
          ? allocationBudgets
          : utilizationBudgets
  const activeStageBudgetTotals = getBudgetTotals(activeStageBudgets)
  const activeStageBudgetRows = [
    { label: 'Requested', amount: activeStageBudgetTotals.requested, accent: '#286CFF' },
    { label: 'Recommended', amount: activeStageBudgetTotals.recommended, accent: '#10B981' },
    { label: 'Allocated', amount: activeStageBudgetTotals.allocated, accent: '#7C3AED' },
    { label: 'Utilized', amount: activeStageBudgetTotals.utilized, accent: '#D97706' },
  ]
  const activeStageBudgetMax = Math.max(...activeStageBudgetRows.map((item) => item.amount), 1)
  const activeDeadline = getSelectedDeadline(instances, visibleStage)
  const activeDeadlineLabel = formatLongDate(activeDeadline)
  const activeDeadlineDays = getDaysFromToday(activeDeadline)
  const activeLeftBehindEntities = getLeftBehindEntities(instances, visibleStage)
  const activeLeftBehindPreview = activeLeftBehindEntities.slice(0, 10)
  const hiddenLeftBehindCount = Math.max(0, activeLeftBehindEntities.length - activeLeftBehindPreview.length)

  useEffect(() => {
    if (didAutoSelectStage.current || !stageMeta.some((stage) => stage.count > 0)) return
    didAutoSelectStage.current = true
    setActiveStage(dominantStage)
  }, [dominantStage, stageMeta])
  const activeEntities = instances
    .filter((instance) =>
      visibleStage === 'planning'
        ? instance.statuscode === DGE_INSTANCE_STATUS.planning || instance.statuscode === DGE_INSTANCE_STATUS.published
        : visibleStage === 'dge-review'
          ? instance.statuscode === DGE_INSTANCE_STATUS.underDgeReview || instance.statuscode === DGE_INSTANCE_STATUS.reviewCompletedByDge
          : visibleStage === 'allocation'
            ? instance.statuscode === DGE_INSTANCE_STATUS.allocation
            : instance.statuscode === DGE_INSTANCE_STATUS.utilization
    )
    .slice(0, 4)

  return (
    <section className="overflow-hidden rounded-[30px] border border-[#D9E6F5] bg-white shadow-[0_16px_46px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-[#162339]">
      <div className="flex flex-col gap-4 border-b border-[#EEF3F8] bg-[radial-gradient(circle_at_12%_0%,#EEF5FF_0%,#FFFFFF_45%,#F8FBFF_100%)] px-5 py-5 dark:border-white/10 dark:bg-none lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#EEF5FF] text-[#286CFF] dark:bg-[#286CFF]/15 dark:text-[#BFDBFE]">
            <span className="absolute h-7 w-7 animate-ping rounded-xl border border-[#286CFF]/30" />
            <Radar className="relative h-5 w-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold text-[#0F172A] dark:text-white">Cycle Progress</h2>
              <StrategyPill tone="blue">{instances.length} entities</StrategyPill>
            </div>
            <p className="mt-1 text-sm text-[#64748B] dark:text-slate-300">Live movement across planning, DGE review, allocation, and utilization.</p>
          </div>
        </div>
        <Button asChild className="h-10 rounded-2xl shadow-none">
          <Link to="/strategy-team/entity-tracker">
            Open Entity Tracker
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="p-5">
        <div className="flex flex-col gap-3 xl:flex-row" onMouseLeave={() => setHoverStage(null)}>
          {stageMeta.map((stage) => {
            const selected = activeStage === stage.key
            const highlighted = (hoverStage ?? activeStage) === stage.key
            return (
              <button
                key={stage.key}
                type="button"
                onMouseEnter={() => setHoverStage(stage.key)}
                onFocus={() => setHoverStage(stage.key)}
                onBlur={() => setHoverStage(null)}
                onClick={() => setActiveStage(stage.key)}
                className={cn(
                  'group relative min-w-0 overflow-hidden rounded-[22px] border px-4 py-4 text-left outline-none transition-[flex-grow,border-color,box-shadow,background-color] duration-500 ease-out will-change-[flex-grow] focus-visible:ring-4 focus-visible:ring-[#DBE6FF] dark:focus-visible:ring-white/10 xl:flex-1',
                  highlighted
                    ? 'border-[#80808024] xl:flex-[1.65]'
                    : 'border-[#DCE8F6] bg-[#F8FBFF] hover:border-[#BFD4FF] hover:bg-[#EEF5FF] dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10'
                )}
                style={
                  highlighted
                    ? {
                        background: `linear-gradient(135deg, ${stage.soft} 0%, #FFFFFF 72%)`,
                        boxShadow: selected ? `0 12px 28px ${stage.accent}1F` : `0 8px 20px ${stage.accent}14`,
                      }
                    : undefined
                }
              >
                <div className="relative flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        'relative grid h-9 w-9 shrink-0 place-items-center rounded-full border-4 border-white text-[10px] font-black shadow-sm transition-colors duration-200 dark:border-[#162339]',
                        highlighted ? 'text-white' : 'bg-white dark:bg-white/10'
                      )}
                      style={{ backgroundColor: highlighted ? stage.accent : undefined, color: highlighted ? '#FFFFFF' : stage.accent }}
                    >
                      {highlighted ? (
                        <span className="absolute inset-[-7px] rounded-full border opacity-30" style={{ borderColor: stage.accent }} />
                      ) : null}
                      {stage.number}
                    </span>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: stage.accent }}>{stage.eyebrow}</p>
                      <h3 className="mt-1 text-[17px] font-bold tracking-tight text-[#0F172A] dark:text-white">{stage.title}</h3>
                    </div>
                  </div>
                  <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-[#586A84] shadow-sm dark:bg-white/10 dark:text-slate-200">
                    {stage.count} {stage.unit}
                  </span>
                </div>
                <p className={cn(
                  'relative mt-3 max-w-[300px] text-xs leading-5 text-[#64748B] transition-opacity duration-300 dark:text-slate-300',
                  highlighted ? 'opacity-100' : 'opacity-75 xl:opacity-0'
                )}>
                  {stage.subtitle}
                </p>
                <div className="relative mt-3 flex items-center gap-3">
                  <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-white shadow-inner dark:bg-white/10">
                    <span className="block h-full rounded-full transition-[width] duration-700 ease-out" style={{ width: `${stage.progress}%`, backgroundColor: stage.accent }} />
                  </span>
                  <strong className="text-[11px]" style={{ color: stage.accent }}>{stage.progress}%</strong>
                </div>
              </button>
            )
          })}
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(330px,0.65fr)]">
          <div key={active.key} className="animate-[cyclePanelIn_0.36s_cubic-bezier(0.2,0.8,0.2,1)_both] rounded-[26px] border border-[#DCE8F6] bg-[#F8FBFF] p-4 dark:border-white/10 dark:bg-white/5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em]" style={{ color: active.accent }}>Stage {active.number}</p>
                <h3 className="mt-1 text-xl font-bold text-[#0F172A] dark:text-white">{active.title} Overview</h3>
              </div>
            </div>

            <div className="mb-4 grid gap-3 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
              <div className="rounded-[20px] border border-[#DCE8F6] bg-white p-4 transition-colors duration-200 hover:border-[#BFD4FF] dark:border-white/10 dark:bg-[#162339]">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[14px]" style={{ backgroundColor: `${active.accent}14`, color: active.accent }}>
                    <CalendarClock className="h-4.5 w-4.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[#0F172A] dark:text-white">Deadline</p>
                    <p className="mt-2 text-base font-bold text-[#0F172A] dark:text-white">
                      {activeDeadlineLabel ?? 'Deadline not set'}
                    </p>
                    {activeDeadlineDays !== null ? (
                      <p
                        className={cn(
                          'mt-1 text-xs font-semibold',
                          activeDeadlineDays < 0
                            ? 'text-[#DC2626] dark:text-[#FCA5A5]'
                            : 'text-[#15803D] dark:text-[#86EFAC]'
                        )}
                      >
                        {activeDeadlineDays < 0
                          ? `${Math.abs(activeDeadlineDays)} days overdue`
                          : `${activeDeadlineDays} days remaining`}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="rounded-[20px] border border-[#DCE8F6] bg-white p-4 transition-colors duration-200 hover:border-[#BFD4FF] dark:border-white/10 dark:bg-[#162339]">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-[#0F172A] dark:text-white">Entities Left Behind</p>
                    <p className="mt-1 text-xs font-semibold text-[#64748B] dark:text-slate-300">
                      {activeLeftBehindEntities.length} entities left behind
                    </p>
                  </div>
                  <span className="rounded-full px-2.5 py-1 text-xs font-bold text-white" style={{ backgroundColor: activeLeftBehindEntities.length ? '#DC2626' : active.accent }}>
                    {activeLeftBehindEntities.length}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {activeLeftBehindPreview.length ? (
                    <>
                      {activeLeftBehindPreview.map((instance) => (
                        <span
                          key={instance.id}
                          className="inline-flex max-w-full items-center rounded-full border border-[#FFD4D1] bg-[#FFF1F1] px-2.5 py-1 text-xs font-semibold text-[#DC2626] dark:border-[#7F1D1D] dark:bg-[#DC2626]/15 dark:text-[#FCA5A5]"
                          title={instance.entityName || instance.name}
                        >
                          {getEntityCode(instance)}
                        </span>
                      ))}
                      {hiddenLeftBehindCount > 0 ? (
                        <span className="inline-flex items-center rounded-full border border-[#DCE8F6] bg-[#F8FBFF] px-2.5 py-1 text-xs font-semibold text-[#64748B] dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                          +{hiddenLeftBehindCount} more
                        </span>
                      ) : null}
                    </>
                  ) : (
                    <span className="text-xs font-semibold text-[#94A3B8] dark:text-slate-400">No entities are behind this phase deadline.</span>
                  )}
                </div>
              </div>
            </div>

            {visibleStage === 'planning' ? (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
                {planningSteps.map((step) => (
                  <div key={step.label} className="rounded-[20px] border border-[#DCE8F6] bg-white p-4 transition-colors duration-200 hover:border-[#BFD4FF] dark:border-white/10 dark:bg-[#162339]">
                    <p className="min-h-10 text-sm font-bold text-[#0F172A] dark:text-white">{step.label}</p>
                    <p className="mt-3 text-3xl font-bold" style={{ color: active.accent }}>{step.count}</p>
                    <p className="text-xs text-[#64748B] dark:text-slate-300">{step.unit ?? 'projects'}</p>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#EEF3F8] dark:bg-white/10">
                      <span className="block h-full rounded-full transition-[width] duration-700" style={{ width: `${step.progress}%`, backgroundColor: active.accent }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : visibleStage === 'dge-review' ? (
              <div className="grid gap-3 lg:grid-cols-5">
                {dgeReviewSteps.map((step) => (
                  <div key={step.label} className="rounded-[20px] border border-[#DCE8F6] bg-white p-4 transition-colors duration-200 hover:border-[#BFD4FF] dark:border-white/10 dark:bg-[#162339]">
                    <p className="min-h-10 text-sm font-bold text-[#0F172A] dark:text-white">{step.label}</p>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {[
                        ['Current', step.current, '#286CFF'],
                        ['Completed', step.completed, '#15803D'],
                        ['Overdue', step.overdue, '#DC2626'],
                        ['Paused', step.paused, '#D97706'],
                      ].map(([label, value, color]) => (
                        <div key={label} className="rounded-[14px] bg-[#F8FBFF] p-2 dark:bg-white/5">
                          <p className="text-[10px] font-semibold text-[#64748B] dark:text-slate-300">{label}</p>
                          <p className="mt-1 text-base font-bold" style={{ color: String(color) }}>{value}</p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs font-semibold text-[#64748B] dark:text-slate-300">
                      <span>Median {step.medianDays ?? 0}d</span>
                      <span>{step.progress}%</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#EEF3F8] dark:bg-white/10">
                      <span className="block h-full rounded-full transition-[width] duration-700" style={{ width: `${step.progress}%`, backgroundColor: active.accent }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : visibleStage === 'allocation' ? (
              <div className="grid gap-3 md:grid-cols-4">
                {allocationSteps.map((step) => (
                  <div key={step.label} className="rounded-[20px] border border-[#DCE8F6] bg-white p-4 transition-colors duration-200 hover:border-[#BFD4FF] dark:border-white/10 dark:bg-[#162339]">
                    <p className="text-sm font-bold text-[#0F172A] dark:text-white">{step.label}</p>
                    <p className="mt-5 text-3xl font-bold" style={{ color: active.accent }}>{step.count}</p>
                    <p className="text-xs text-[#64748B] dark:text-slate-300">projects</p>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#EEF3F8] dark:bg-white/10">
                      <span className="block h-full rounded-full transition-[width] duration-700" style={{ width: `${step.progress}%`, backgroundColor: active.accent }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-4">
                {utilizationQuarters.map((quarter) => (
                  <div key={quarter.label} className="rounded-[20px] border border-[#DCE8F6] bg-white p-4 transition-colors duration-200 hover:border-[#BFD4FF] dark:border-white/10 dark:bg-[#162339]">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-[#0F172A] dark:text-white">{quarter.label} Utilization</p>
                      <StrategyPill tone={quarter.value >= 75 ? 'teal' : quarter.value >= 40 ? 'blue' : 'amber'}>{quarter.value}%</StrategyPill>
                    </div>
                    <div className="mt-4 flex items-center justify-between gap-4">
                      <DonutChart value={quarter.value} accent={active.accent} />
                      <div className="min-w-0">
                        <CurrencyAmount amount={quarter.amount} className="text-lg font-bold text-[#0F172A] dark:text-white" iconSize={14} />
                        <p className="mt-1 text-xs text-[#64748B] dark:text-slate-300">utilized budget</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 rounded-[22px] border border-[#DCE8F6] bg-white px-4 py-4 dark:border-white/10 dark:bg-[#162339]">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-[#0F172A] dark:text-white">{active.title} Progress</p>
                  <p className="mt-1 text-xs text-[#64748B] dark:text-slate-300">{activeStageBudgets.length} projects moving through this stage</p>
                </div>
                <span className="rounded-full px-3 py-1 text-xs font-bold text-white" style={{ backgroundColor: active.accent }}>
                  {active.progress}%
                </span>
              </div>
              <div className="relative pt-2">
                <div className="h-3 overflow-hidden rounded-full bg-[#EAF0F7] shadow-inner dark:bg-white/10">
                  <div
                    className="relative h-full rounded-full transition-[width] duration-700 ease-out"
                    style={{ width: `${active.progress}%`, backgroundColor: active.accent }}
                  >
                    <span className="absolute inset-0 animate-[cycleProgressShine_1.8s_linear_infinite] bg-[linear-gradient(110deg,transparent_0%,rgba(255,255,255,0.45)_45%,transparent_72%)]" />
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-5 text-[10px] font-bold text-[#94A3B8] dark:text-slate-400">
                  {[0, 25, 50, 75, 100].map((marker) => (
                    <span key={marker} className={cn(marker === 0 ? 'text-left' : marker === 100 ? 'text-right' : 'text-center')}>
                      {marker}%
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-[26px] border border-[#DCE8F6] bg-white p-4 dark:border-white/10 dark:bg-[#162339]">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-[#286CFF]" />
                  <p className="text-sm font-bold text-[#0F172A] dark:text-white">{active.title} Budget Lens</p>
                </div>
                <span className="text-xs font-bold" style={{ color: active.accent }}>{activeStageBudgets.length} projects</span>
              </div>
              <div className="mt-4 space-y-3">
                {activeStageBudgetRows.map((item) => {
                  const width = item.amount > 0 ? Math.max(8, Math.round((item.amount / activeStageBudgetMax) * 100)) : 0
                  return (
                    <div key={item.label} className="rounded-[18px] bg-[#F8FBFF] px-3 py-3 dark:bg-white/5">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <span className="text-xs font-bold text-[#475569] dark:text-slate-200">{item.label}</span>
                        <CurrencyAmount amount={item.amount} className="text-xs font-black text-[#0F172A] dark:text-white" iconColor={item.accent} iconSize={10} />
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-white dark:bg-white/10">
                        <span className="block h-full rounded-full transition-[width] duration-700" style={{ width: `${width}%`, backgroundColor: item.accent }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="rounded-[26px] border border-[#DCE8F6] bg-white p-4 dark:border-white/10 dark:bg-[#162339]">
              <div className="flex items-center gap-2">
                <PieChart className="h-5 w-5 text-[#286CFF]" />
                <p className="text-sm font-bold text-[#0F172A] dark:text-white">Active Entities</p>
              </div>
              <div className="mt-4 space-y-2">
                {activeEntities.length ? activeEntities.map((instance) => (
                  <div key={instance.id} className="flex items-center justify-between gap-3 rounded-[18px] border border-[#DCE8F6] bg-[#F8FBFF] px-3 py-2 dark:border-white/10 dark:bg-white/5">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold" style={{ backgroundColor: `${active.accent}14`, color: active.accent }}>{getEntityCode(instance).slice(0, 2)}</span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-[#0F172A] dark:text-white">{instance.entityName || instance.name}</p>
                        <p className="text-xs text-[#64748B] dark:text-slate-300">{instance.budgets.length} projects</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold" style={{ color: active.accent }}>{instance.statusLabel}</span>
                  </div>
                )) : (
                  <p className="rounded-[18px] border border-dashed border-[#BED3F3] bg-[#F8FBFF] px-4 py-5 text-center text-sm text-[#64748B] dark:border-white/10 dark:bg-white/5 dark:text-slate-300">No active entities in this stage.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes cyclePanelIn {
          from { opacity: 0; transform: translateY(10px) scale(0.985); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes cycleProgressShine {
          from { transform: translateX(-100%); }
          to { transform: translateX(100%); }
        }
      `}</style>
    </section>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-40 animate-pulse rounded-[24px] bg-[#EAF0F6] dark:bg-white/10" />
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-[330px] animate-pulse rounded-[28px] bg-[#EAF0F6] dark:bg-white/10" />
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
        <div className="h-[420px] animate-pulse rounded-[28px] bg-[#EAF0F6] dark:bg-white/10" />
        <div className="h-[420px] animate-pulse rounded-[28px] bg-[#EAF0F6] dark:bg-white/10" />
      </div>
    </div>
  )
}

export default function StrategyTeamDashboard() {
  const { selectedCycle } = useCycle()
  const [portfolio, setPortfolio] = useState<DgePortfolioData>({ instances: [], budgets: [] })
  const [clarifications, setClarifications] = useState<ClarificationMonitorItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadDashboard() {
      if (!selectedCycle?.id) {
        setPortfolio({ instances: [], budgets: [] })
        setClarifications([])
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        const data = await getDgePortfolioData(selectedCycle.id)
        const clarificationGroups = await Promise.all(
          data.budgets.map(async (budget) => ({
            budget,
            clarifications: await getClarificationsByBudgetId(budget.id),
          }))
        )

        if (cancelled) return

        setPortfolio(data)
        setClarifications(
          clarificationGroups.flatMap(({ budget, clarifications }) =>
            clarifications.map((clarification) => ({
              id: `${budget.id}-${clarification.id}`,
              type: getClarificationType(clarification),
              budget,
              clarification,
            }))
          )
        )
      } catch (loadError) {
        if (!cancelled) {
          console.error('[StrategyTeamDashboard] Unable to load dashboard:', loadError)
          setError(loadError instanceof Error ? loadError.message : 'Unable to load strategy dashboard data.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadDashboard()

    return () => {
      cancelled = true
    }
  }, [selectedCycle?.id])

  const budgets = portfolio.budgets
  const instances = portfolio.instances

  const strategicAlignmentPending = budgets.filter((budget) => budget.statuscode === DGE_BUDGET_STATUS.underStrategicAlignmentReview).length
  const strategicPriorityCrPending = budgets.filter((budget) => budget.statuscode === DGE_BUDGET_STATUS.strategicPriorityChangeUnderReview).length
  const sentToSmes = budgets.filter((budget) => budget.statuscode === DGE_BUDGET_STATUS.underSmeReview).length
  const pendingQualityCheckReview = budgets.filter((budget) => budget.statuscode === DGE_BUDGET_STATUS.underQualityCheck).length
  const qualityCheckReviewed = budgets.filter(
    (budget) =>
      budget.statuscode === DGE_BUDGET_STATUS.underFinalReview ||
      budget.statuscode === DGE_BUDGET_STATUS.reviewCompleted
  ).length
  const pendingClarifications = clarifications.filter((item) => item.clarification.status === 'Open').length
  const totalBudget = getBudgetLensTotal(budgets)

  const clarificationStats = useMemo(() => {
    const base: Record<ClarificationType, { total: number; onTrack: number; overdue: number }> = {
      'within-dge': { total: 0, onTrack: 0, overdue: 0 },
      'dge-to-adge': { total: 0, onTrack: 0, overdue: 0 },
      'adge-to-adge': { total: 0, onTrack: 0, overdue: 0 },
    }

    clarifications.forEach((item) => {
      base[item.type].total += 1
      if (isClarificationOverdue(item.clarification)) {
        base[item.type].overdue += 1
      } else {
        base[item.type].onTrack += 1
      }
    })

    return base
  }, [clarifications])

  const recentlyActiveClarifications = useMemo(
    () =>
      [...clarifications]
        .sort((left, right) => getClarificationLatestDate(right.clarification).localeCompare(getClarificationLatestDate(left.clarification)))
        .slice(0, 3),
    [clarifications]
  )

  const exceptions = useMemo(() => {
    const planningNotStarted = instances.filter(
      (instance) =>
        isPlanningStartGracePassed(instance) &&
        instance.budgets.length === 0 &&
        (instance.statuscode === DGE_INSTANCE_STATUS.published || instance.statuscode === DGE_INSTANCE_STATUS.planning)
    )
    const missedSubmission = instances.filter(
      (instance) =>
        isPast(instance.submissionDate) &&
        (instance.statuscode === DGE_INSTANCE_STATUS.published || instance.statuscode === DGE_INSTANCE_STATUS.planning)
    )
    const strategicAlignmentPendingBudgets = budgets.filter(
      (budget) => budget.statuscode === DGE_BUDGET_STATUS.underStrategicAlignmentReview
    )
    const smePendingBudgets = budgets.filter(
      (budget) => budget.statuscode === DGE_BUDGET_STATUS.underSmeReview
    )
    const overdueEntityClarifications = clarifications
      .filter((item) => item.type === 'dge-to-adge' && isClarificationOverdue(item.clarification))
      .map((item) => item.budget.instanceId)
    const directorReviewPending = budgets.filter(
      (budget) => budget.statuscode === DGE_BUDGET_STATUS.underFinalReview
    )
    const allocationNotSubmitted = instances.filter(
      (instance) =>
        instance.statuscode === DGE_INSTANCE_STATUS.allocation &&
        isPast(instance.allocationEndDate) &&
        !instance.budgets.some((budget) => budget.statuscode === DGE_BUDGET_STATUS.allocationCompleted)
    )
    const utilizationNotFilled = instances.filter(
      (instance) =>
        instance.statuscode === DGE_INSTANCE_STATUS.utilization &&
        isPast(instance.utilizationEndDate) &&
        !instance.budgets.some((budget) => budget.utilizedBudget > 0 || budget.statuscode === DGE_BUDGET_STATUS.utilizationCompleted)
    )

    const instanceById = new Map(instances.map((instance) => [instance.id, instance]))
    const uniqueAbbrs = (ids: Array<string | null>) =>
      Array.from(new Set(ids.map((id) => (id ? instanceById.get(id) : null)).filter(Boolean).map((instance) => getEntityCode(instance as DgeInstanceRecord))))

    return {
      planning: [
        {
          label: 'Entities that have not started planning',
          abbrs: planningNotStarted.map(getEntityCode),
          tone: 'amber',
          description: 'Shown after one week from planning start when no budget has been created.',
        },
        {
          label: 'Entities that missed submission deadlines',
          abbrs: missedSubmission.map(getEntityCode),
          tone: 'red',
          description: 'Planning end date has passed and entity submission date is still empty.',
        },
      ] as ExceptionItem[],
      dgeReview: [
        {
          label: 'Strategic Alignment has not been completed',
          abbrs: uniqueAbbrs(strategicAlignmentPendingBudgets.map((budget) => budget.instanceId)),
          count: strategicAlignmentPendingBudgets.length,
          tone: 'amber',
          description: 'Projects are currently under strategic alignment review.',
        },
        {
          label: 'SMEs have not yet completed reviews',
          abbrs: uniqueAbbrs(smePendingBudgets.map((budget) => budget.instanceId)),
          count: smePendingBudgets.length,
          tone: 'violet',
          description: 'Projects are assigned to SME review and are not completed yet.',
        },
        {
          label: 'Clarifications overdue with Entities',
          abbrs: uniqueAbbrs(overdueEntityClarifications),
          tone: 'red',
          description: 'External DGE to ADGE clarification due dates have passed.',
        },
        {
          label: 'Director review is pending',
          abbrs: uniqueAbbrs(directorReviewPending.map((budget) => budget.instanceId)),
          count: directorReviewPending.length,
          tone: 'blue',
          description: 'Projects are currently waiting in the director review lane.',
        },
      ] as ExceptionItem[],
      allocation: [
        {
          label: 'Entities have not submitted allocation',
          abbrs: allocationNotSubmitted.map(getEntityCode),
          tone: 'amber',
          description: 'Allocation end date has passed and no allocation-completed project is present.',
        },
      ] as ExceptionItem[],
      utilization: [
        {
          label: 'Entities have not filled any utilization',
          abbrs: utilizationNotFilled.map(getEntityCode),
          tone: 'red',
          description: 'Utilization window has closed and no utilization value has been captured.',
        },
      ] as ExceptionItem[],
    }
  }, [budgets, clarifications, instances])

  const totalExceptions = [
    ...exceptions.planning,
    ...exceptions.dgeReview,
    ...exceptions.allocation,
    ...exceptions.utilization,
  ].reduce((sum, item) => sum + (item.count ?? item.abbrs.length), 0)

  return (
    <StrategyPageShell
      eyebrow="ICT - Strategy Team"
      title="Strategy Team Dashboard"
      description="A DGE governance command center for strategic alignment progress, clarification health, and deadline exceptions across the active ICT budget cycle."
    >
      {loading ? (
        <DashboardSkeleton />
      ) : (
        <div className="space-y-6">
          {error ? (
            <div className="rounded-[18px] border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#B91C1C] dark:border-[#7F1D1D] dark:bg-[#3A1717] dark:text-[#FCA5A5]">
              {error}
            </div>
          ) : null}

          <CycleProgressExplorer
            instances={instances}
            budgets={budgets}
            clarifications={clarifications}
          />

          <section className="grid items-stretch gap-5 xl:grid-cols-2">
            <div className="flex h-full flex-col overflow-hidden rounded-[30px] border border-[#D9E6F5] bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#162339]">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-[#286CFF]" />
                    <h2 className="text-xl font-bold text-[#0F172A] dark:text-white">Strategy Review</h2>
                  </div>
                  <p className="mt-1 text-sm leading-6 text-[#64748B] dark:text-slate-300">
                    Strategy-side progress across alignment, strategic priority change requests, SME routing, quality check, and clarification blocks.
                  </p>
                </div>
                <StrategyPill tone="blue">{strategicAlignmentPending + strategicPriorityCrPending + sentToSmes + pendingQualityCheckReview + pendingClarifications} active</StrategyPill>
              </div>

              <div className="mt-5 grid flex-1 gap-4">
                <div className="rounded-[24px] border border-[#DCE8F6] bg-[#F8FBFF] p-4 dark:border-white/10 dark:bg-white/5">
                  <div className="mb-3 flex items-center gap-2">
                    <Target className="h-4.5 w-4.5 text-[#286CFF]" />
                    <p className="text-sm font-bold text-[#0F172A] dark:text-white">Strategic Alignment Progress</p>
                  </div>
                  <div className="grid gap-3 md:grid-cols-3">
                    <ReviewMetric label="Pending Strategic Alignment" value={strategicAlignmentPending} accent="#286CFF" href="/strategy-team/strategic-alignment" />
                    <ReviewMetric label="Pending Strategic Priority CR" value={strategicPriorityCrPending} accent="#286CFF" href="/strategy-team/strategic-alignment" />
                    <ReviewMetric label="Sent to SMEs" value={sentToSmes} accent="#286CFF" href="/strategy-team/sme-tracker" />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-[24px] border border-[#DCE8F6] bg-[#F8FBFF] p-4 dark:border-white/10 dark:bg-white/5">
                    <div className="mb-3 flex items-center gap-2">
                      <CheckCircle2 className="h-4.5 w-4.5 text-[#286CFF]" />
                      <p className="text-sm font-bold text-[#0F172A] dark:text-white">Quality Check Progress</p>
                    </div>
                    <div className="grid gap-3">
                      <ReviewMetric label="Pending Quality Check Review" value={pendingQualityCheckReview} accent="#286CFF" href="/strategy-team/quality-check" />
                      <ReviewMetric label="Quality Check Reviewed" value={qualityCheckReviewed} accent="#286CFF" href="/strategy-team/quality-check" />
                    </div>
                  </div>
                  <div className="rounded-[24px] border border-[#DCE8F6] bg-[#F8FBFF] p-4 dark:border-white/10 dark:bg-white/5">
                    <div className="mb-3 flex items-center gap-2">
                      <MessageSquareMore className="h-4.5 w-4.5 text-[#286CFF]" />
                      <p className="text-sm font-bold text-[#0F172A] dark:text-white">Pending Clarifications</p>
                    </div>
                    <div className="grid gap-3">
                      <ReviewMetric label="Open Clarifications" value={pendingClarifications} accent="#286CFF" href="/strategy-team/clarification-monitor" />
                      <ReviewMetric label="Overdue Clarifications" value={clarifications.filter((item) => isClarificationOverdue(item.clarification)).length} accent="#286CFF" href="/strategy-team/clarification-monitor" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex h-full flex-col overflow-hidden rounded-[30px] border border-[#D9E6F5] bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#162339]">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <MessageSquareMore className="h-5 w-5 text-[#286CFF]" />
                    <h2 className="text-xl font-bold text-[#0F172A] dark:text-white">Clarification Monitor</h2>
                  </div>
                  <p className="mt-1 text-sm leading-6 text-[#64748B] dark:text-slate-300">
                    Directional health of clarification threads, separated by DGE internal, DGE to ADGE, and ADGE internal flows.
                  </p>
                </div>
                <Button asChild className="h-10 shrink-0 rounded-2xl shadow-none">
                  <Link to="/strategy-team/clarification-monitor">
                    View More
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>

              <div className="mt-5 grid gap-3">
                <ClarificationDirectionCard label="DGE Internal" total={clarificationStats['within-dge'].total} onTrack={clarificationStats['within-dge'].onTrack} overdue={clarificationStats['within-dge'].overdue} accent="#286CFF" />
                <ClarificationDirectionCard label="DGE -> ADGE" total={clarificationStats['dge-to-adge'].total} onTrack={clarificationStats['dge-to-adge'].onTrack} overdue={clarificationStats['dge-to-adge'].overdue} accent="#286CFF" />
                <ClarificationDirectionCard label="ADGEs Internal" total={clarificationStats['adge-to-adge'].total} onTrack={clarificationStats['adge-to-adge'].onTrack} overdue={clarificationStats['adge-to-adge'].overdue} accent="#286CFF" />
              </div>
            </div>
          </section>

          <section className="grid items-stretch gap-5 xl:grid-cols-2">
            <div className="flex h-full flex-col overflow-hidden rounded-[30px] border border-[#D9E6F5] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#162339]">
              <div className="border-b border-[#EEF3F8] bg-[linear-gradient(135deg,#F8FBFF_0%,#FFFFFF_55%,#FFF7E6_100%)] p-6 dark:border-white/10 dark:bg-none">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="h-5 w-5 text-[#D97706]" />
                      <h2 className="text-xl font-bold text-[#0F172A] dark:text-white">Deadline and Exceptions</h2>
                    </div>
                    <p className="mt-1 text-sm leading-6 text-[#64748B] dark:text-slate-300">
                      Deadline-driven exceptions based on planning, DGE review, allocation, and utilization signals.
                    </p>
                  </div>
                  <div className="rounded-[20px] border border-[#F8E2B7] bg-white px-4 py-3 dark:border-white/10 dark:bg-white/5">
                    <p className="text-xs font-semibold text-[#64748B] dark:text-slate-300">Exceptions</p>
                    <p className="mt-1 text-3xl font-bold text-[#D97706]">{totalExceptions}</p>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 p-4">
                {[
                  { title: 'Planning', icon: <CalendarClock className="h-4.5 w-4.5" />, items: exceptions.planning },
                  { title: 'DGE Review', icon: <Radar className="h-4.5 w-4.5" />, items: exceptions.dgeReview },
                  { title: 'Allocation', icon: <Route className="h-4.5 w-4.5" />, items: exceptions.allocation },
                  { title: 'Utilization', icon: <Building2 className="h-4.5 w-4.5" />, items: exceptions.utilization },
                ].map((group) => (
                  <ExceptionStageSummary key={group.title} title={group.title} icon={group.icon} items={group.items} />
                ))}
              </div>
            </div>

            <div className="grid h-full gap-5">
              <div className="flex h-full flex-col overflow-hidden rounded-[28px] border border-[#D9E6F5] bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#162339]">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-[#A855F7]" />
                      <h2 className="text-xl font-bold text-[#0F172A] dark:text-white">DGE Focus Queue</h2>
                    </div>
                    <p className="mt-1 text-sm text-[#64748B] dark:text-slate-300">
                      Recently active clarifications and exception-heavy areas to help Strategy Team decide where to intervene next.
                    </p>
                  </div>
                </div>
                <div className="mt-5 space-y-3">
                  {recentlyActiveClarifications.map((item) => (
                    <Link
                      key={item.id}
                      to={`/strategy-team/projects/${item.budget.id}`}
                      className="group block rounded-[22px] border border-[#DCE8F6] bg-[#F8FBFF] p-4 transition-all hover:-translate-y-0.5 hover:border-[#286CFF] hover:bg-[#EEF5FF] dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-[#0F172A] dark:text-white">{item.budget.name}</p>
                          <p className="mt-1 text-xs text-[#64748B] dark:text-slate-300">{item.budget.entityName || item.budget.instanceName || 'Unknown entity'}</p>
                          <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#475569] dark:text-slate-200">{item.clarification.message}</p>
                        </div>
                        <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-[#94A3B8] transition-transform group-hover:translate-x-0.5 group-hover:text-[#286CFF]" />
                      </div>
                    </Link>
                  ))}
                  {!recentlyActiveClarifications.length ? (
                    <StrategyDashboardEmptyState
                      icon={<MessageSquareMore className="h-6 w-6" />}
                      title="No Clarification Activity"
                      description="Clarification threads will appear here once DGE or ADGE teams begin raising questions."
                    />
                  ) : null}
                </div>
              </div>

              <div className="flex h-full flex-col overflow-hidden rounded-[28px] border border-[#E9D5FF] bg-[#FDF8FF] p-6 shadow-[0_12px_30px_rgba(168,85,247,0.08)] dark:border-white/10 dark:bg-[#2A123D]">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#A855F7] text-white shadow-[0_12px_24px_rgba(168,85,247,0.24)]">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-[#0F172A] dark:text-white">AI Governance Readout</h2>
                    <p className="text-xs text-[#64748B] dark:text-slate-300">Priority signals for the strategy workspace</p>
                  </div>
                </div>
                <div className="mt-5 space-y-3">
                  {[
                    `${strategicAlignmentPending + strategicPriorityCrPending} projects still need strategy-side classification decisions.`,
                    `${sentToSmes} projects have moved to SME review and need specialist completion before quality check.`,
                    `${pendingClarifications} open clarifications may slow the DGE review path if not resolved.`,
                    `${totalExceptions} deadline exceptions are currently visible across planning, review, allocation, and utilization.`,
                  ].map((insight) => (
                    <div key={insight} className="flex items-start gap-2.5 rounded-[18px] border border-[#E9D5FF] bg-white px-4 py-3 dark:border-white/10 dark:bg-white/5">
                      <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#A855F7] dark:text-[#E9D5FF]" />
                      <p className="text-sm leading-6 text-[#475569] dark:text-slate-100">{insight}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section>
            <div className="flex h-full flex-col overflow-hidden rounded-[28px] border border-[#D9E6F5] bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#162339]">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <GaugeCircle className="h-5 w-5 text-[#286CFF]" />
                    <h2 className="text-xl font-bold text-[#0F172A] dark:text-white">Portfolio Snapshot</h2>
                  </div>
                  <p className="mt-1 text-sm text-[#64748B] dark:text-slate-300">
                    Existing cycle overview with entity coverage, active review workload, and budget under governance.
                  </p>
                </div>
              </div>
              <div className="mt-5 grid flex-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  { label: 'Entities', value: instances.length, note: 'In selected cycle', accent: '#286CFF' },
                  { label: 'Projects', value: budgets.length, note: 'Portfolio records', accent: '#0F9D8A' },
                  { label: 'DGE Review', value: instances.filter((instance) => instance.statuscode === DGE_INSTANCE_STATUS.underDgeReview).length, note: 'Entities under review', accent: '#9333EA' },
                  { label: 'Exceptions', value: totalExceptions, note: 'Deadline signals', accent: '#D97706' },
                ].map((item) => (
                  <div key={item.label} className="rounded-[22px] border border-[#DCE8F6] bg-[#F8FBFF] p-4 dark:border-white/10 dark:bg-white/5">
                    <p className="text-xs font-semibold tracking-[0.08em] text-[#64748B] dark:text-slate-300">{item.label}</p>
                    <p className="mt-3 text-3xl font-bold" style={{ color: item.accent }}>{item.value}</p>
                    <p className="mt-2 text-sm text-[#64748B] dark:text-slate-300">{item.note}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-[22px] border border-[#DCE8F6] bg-[#F8FBFF] p-4 dark:border-white/10 dark:bg-white/5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-[#0F172A] dark:text-white">Budget Under Governance</p>
                    <p className="mt-1 text-xs text-[#64748B] dark:text-slate-300">Latest available lens across all projects</p>
                  </div>
                  <CurrencyAmount amount={totalBudget} className="text-lg font-bold text-[#0F172A] dark:text-white" iconSize={15} />
                </div>
              </div>
            </div>
          </section>
        </div>
      )}
    </StrategyPageShell>
  )
}
