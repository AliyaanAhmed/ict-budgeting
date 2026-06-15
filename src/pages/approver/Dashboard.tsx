import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BadgeDollarSign,
  Bell,
  Bot,
  BrainCircuit,
  Calendar,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  ClipboardCheck,
  Clock3,
  CopyPlus,
  Info,
  Layers,
  MessageSquareMore,
  MoveRight,
  Radar,
  RefreshCcw,
  Scale,
  Send,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  TriangleAlert,
  Users,
  WalletCards,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BudgetByCategory } from '@/components/charts/BudgetByCategory'
import { AccountCodesBreakdown } from '@/components/charts/AccountCodesBreakdown'
import { Card, CardContent } from '@/components/ui/card'
import { CurrencyAmount } from '@/components/shared/CurrencyAmount'
import { AiPortfolioSummary } from '@/components/shared/AiPortfolioSummary'
import { PortfolioInsightCharts } from '@/components/shared/PortfolioInsightCharts'
import { useCycle } from '@/context/CycleContext'
import { useInstance } from '@/context/InstanceContext'
import {
  DASHBOARD_BUDGET_METRIC_LABEL,
  type DashboardBudgetMetric,
  getDashboardBudgetMetricForInstanceStatus,
  getDashboardBudgetMetricsForInstanceStatus,
  getMetricAmountsFromProjects,
  getProjectBudgetAmount,
  useAccountCodesBreakdown,
  useBudgetByCategoryChart,
} from '@/hooks/useDashboardBudgetCharts'
import { usePortfolioSummary } from '@/hooks/usePortfolioSummary'
import {
  getAiReviewFlags,
  getClarificationGroups,
  getPortfolioCounts,
  getPortfolioSummaryRoleView,
  resolvePortfolioTemplate,
} from '@/services/portfolioSummaryService'
import { useDelayedLoading } from '@/lib/useDelayedLoading'
import { dashboardPalette } from '@/lib/dashboardPalette'
import { cn } from '@/lib/utils'
import { useRoleProjects } from '@/hooks/useRoleProjects'
import { projectService } from '@/services/projectService'
import { useToast } from '@/context/ToastContext'
import { updateCurrentInstanceSubmissionDate } from '@/services/instanceService'
import { getStoredInstanceDetail } from '@/services/instanceService'
import { submitInstanceToUtilization } from '@/services/dgeWorkflowService'
import { DGE_BUDGET_STATUS, DGE_INSTANCE_STATUS } from '@/services/dgePortfolioService'
import type { Project } from '@/domain/types'

const LOCAL_STATUSCODE_BY_STATUS = {
  Approved: 776140003,
  'Submitted to DGE': 776140004,
} as const

type StatusOverride = {
  status: Project['status']
  statusCode: number
}

function InfoHint({ text }: { text: string }) {
  return (
    <span className="group relative inline-flex">
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-[#D7E4F4] bg-white/80 text-[#64748B] transition-colors hover:border-[#286CFF] hover:text-[#286CFF] dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:hover:border-[#4F98FF] dark:hover:text-white">
        <Info className="h-3.5 w-3.5" />
      </span>
      <span className="pointer-events-none absolute left-1/2 top-full z-30 mt-2 w-64 -translate-x-1/2 rounded-2xl border border-[#DCE6F1] bg-white/95 px-3 py-2 text-xs leading-5 text-[#475569] opacity-0 shadow-[0_18px_45px_rgba(15,23,42,0.14)] transition-all duration-200 group-hover:translate-y-1 group-hover:opacity-100 dark:border-white/10 dark:bg-[#10203A]/95 dark:text-slate-100">
        {text}
      </span>
    </span>
  )
}

function BudgetQueueMixContent({
  queueBudgetMix,
  totalBudget,
  dashboardBudgetMetricLabel,
  dashboardBudgetMetrics,
}: {
  queueBudgetMix: Array<{
    name: string
    value: number
    fill: string
    percent: number
    amounts?: Partial<Record<DashboardBudgetMetric, number>>
  }>
  totalBudget: number
  dashboardBudgetMetricLabel: string
  dashboardBudgetMetrics: DashboardBudgetMetric[]
}) {
  const activeMix = queueBudgetMix.filter((item) => item.value > 0 || item.percent > 0)
  const visibleMix = [...(activeMix.length ? activeMix : queueBudgetMix)]
    .sort((left, right) => right.value - left.value)
    .slice(0, 5)
  const maxValue = Math.max(...visibleMix.map((item) => item.value), 1)
  const leadingStage = visibleMix[0]

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-[18px] border border-[#DCE8F6] bg-[#F8FBFF] px-4 py-3 dark:border-white/10 dark:bg-white/5">
          <p className="text-xs font-semibold text-[#64748B] dark:text-slate-300">Current Lens</p>
          <p className="mt-1 text-sm font-bold text-[#0F172A] dark:text-white">{dashboardBudgetMetricLabel}</p>
        </div>
        <div className="rounded-[18px] border border-[#DCE8F6] bg-[#F8FBFF] px-4 py-3 dark:border-white/10 dark:bg-white/5">
          <p className="text-xs font-semibold text-[#64748B] dark:text-slate-300">Portfolio Total</p>
          <CurrencyAmount amount={totalBudget} className="mt-1 text-sm font-bold text-[#0F172A] dark:text-white" iconSize={11} />
        </div>
        <div className="rounded-[18px] border border-[#DCE8F6] bg-[#F8FBFF] px-4 py-3 dark:border-white/10 dark:bg-white/5">
          <p className="text-xs font-semibold text-[#64748B] dark:text-slate-300">Largest Stage</p>
          <p className="mt-1 truncate text-sm font-bold text-[#0F172A] dark:text-white">{leadingStage?.name ?? 'No activity'}</p>
        </div>
      </div>

      <div className="space-y-3">
        {visibleMix.map((item) => {
          const width = Math.max(6, Math.round((item.value / maxValue) * 100))
          return (
            <div key={item.name} className="rounded-[18px] border border-[#DCE8F6] bg-white px-4 py-3 dark:border-white/10 dark:bg-[#1B2A41]">
              <div className="mb-2 flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.fill }} />
                  <p className="truncate text-sm font-semibold text-[#0F172A] dark:text-white">{item.name}</p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="text-xs font-bold text-[#286CFF] dark:text-[#BFDBFE]">{item.percent}%</span>
                  <CurrencyAmount amount={item.value} className="text-sm font-semibold text-[#0F172A] dark:text-white" iconSize={11} />
                </div>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-[#EEF3F8] dark:bg-white/10">
                <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${width}%`, backgroundColor: item.fill }} />
              </div>
            </div>
          )
        })}
      </div>

      {dashboardBudgetMetrics.length > 1 ? (
        <div className="flex flex-wrap gap-2">
          {dashboardBudgetMetrics.map((metric) => (
            <span key={metric} className="inline-flex items-center gap-2 rounded-full border border-[#DCE8F6] bg-[#F8FBFF] px-3 py-1.5 text-xs font-semibold text-[#475569] dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
              {DASHBOARD_BUDGET_METRIC_LABEL[metric]}
              <CurrencyAmount
                amount={queueBudgetMix.reduce((sum, item) => sum + (item.amounts?.[metric] ?? 0), 0)}
                className="text-xs font-bold text-[#0F172A] dark:text-white"
                iconSize={10}
              />
            </span>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function MetricCard({
  title,
  value,
  accent,
  icon,
  badge,
  className,
}: {
  title: string
  value: React.ReactNode
  accent: string
  icon: React.ReactNode
  badge: string
  className?: string
}) {
  return (
    <div
      className={cn(
        'group overflow-hidden rounded-[24px] border bg-white p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#286CFF] dark:bg-[#18263F] sm:p-5',
        className
      )}
      style={{ borderColor: `${accent}3D`, boxShadow: 'none' }}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-base font-semibold tracking-[0.02em] text-[#0F172A] dark:text-white">{title}</p>
          <div className="mt-4 text-2xl font-bold leading-none text-[#0F172A] dark:text-white sm:text-[30px] xl:text-[32px]">{value}</div>
        </div>
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full sm:h-11 sm:w-11"
          style={{ backgroundColor: `${accent}14`, color: accent }}
        >
          {icon}
        </div>
      </div>
      <div className="mt-5">
        <span
          className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold"
          style={{ backgroundColor: `${accent}14`, color: accent }}
        >
          {badge}
        </span>
      </div>
    </div>
  )
}

function CompactAmount({ amount, iconColor = '#286CFF' }: { amount: number; iconColor?: string }) {
  return (
    <CurrencyAmount
      amount={amount}
      className="max-w-full text-xl font-bold leading-tight sm:text-2xl xl:text-[26px]"
      valueClassName="break-words"
      iconColor="#286CFF"
      iconSize={16}
    />
  )
}

function truncateAtWordBoundary(value: string, maxCharacters: number) {
  const trimmed = value.trim()
  if (trimmed.length <= maxCharacters) {
    return { text: trimmed, truncated: false }
  }

  const clipped = trimmed.slice(0, maxCharacters)
  const lastSpace = clipped.lastIndexOf(' ')
  const nextText = (lastSpace > 40 ? clipped.slice(0, lastSpace) : clipped).trimEnd()

  return {
    text: nextText,
    truncated: true,
  }
}

function ActionMetricCard({
  title,
  value,
  accent,
  badge,
  icon,
  href,
  description,
}: {
  title: React.ReactNode
  value: number
  accent: string
  badge: string
  icon: React.ReactNode
  href: string
  description: string
}) {
  return (
    <Link
      to={href}
      className="group flex h-full flex-col overflow-hidden rounded-[24px] border border-[#DCE8F6] bg-white px-4 py-5 shadow-[0_12px_30px_rgba(15,23,42,0.06)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#286CFF] hover:bg-[#F8FBFF] hover:shadow-[0_16px_36px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-[#18263F] sm:px-5 sm:py-6"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="min-h-[3.25rem]">
            <p className="text-base font-semibold tracking-[0.02em] text-[#0F172A] dark:text-white">{title}</p>
          </div>
          <div className="mt-3 mb-2">
            <span className="text-[40px] font-bold leading-none text-[#0F172A] dark:text-white">{value}</span>
          </div>
          <div className="mt-3">
            <span
              className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold"
              style={{ backgroundColor: `${accent}14`, color: accent }}
            >
              {badge}
            </span>
          </div>
        </div>
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-transform duration-300 group-hover:scale-105"
          style={{ backgroundColor: `${accent}14`, color: accent }}
        >
          {icon}
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between border-t border-[#EEF3F8] pt-[10px] text-sm font-medium text-[#475569] dark:border-white/10 dark:text-slate-100">
        <span>Open Projects</span>
        <ChevronRight className="h-4 w-4 text-[#286CFF] transition-transform duration-300 group-hover:translate-x-0.5" />
      </div>
    </Link>
  )
}

function parseProjectDate(project: { submittedDateRaw?: string; submittedDate: string }) {
  const rawValue = project.submittedDateRaw || project.submittedDate
  const parsed = Date.parse(rawValue)
  return Number.isNaN(parsed) ? 0 : parsed
}

function getLatestClarificationMessage(project: {
  clarifications: Array<{
    date: string
    message: string
    replies: Array<{ date: string; message: string }>
  }>
}) {
  const activity = project.clarifications.flatMap((clarification) => [
    { date: clarification.date, message: clarification.message },
    ...clarification.replies.map((reply) => ({ date: reply.date, message: reply.message })),
  ])

  if (!activity.length) return null

  return [...activity]
    .sort((a, b) => {
      const aTime = Date.parse(a.date)
      const bTime = Date.parse(b.date)
      return (Number.isNaN(bTime) ? 0 : bTime) - (Number.isNaN(aTime) ? 0 : aTime)
    })[0]?.message ?? null
}

function DashboardLoadingState() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-[220px] rounded-[30px] border border-[#D7E4F4] bg-[linear-gradient(135deg,#F8FBFF_0%,#EEF5FF_45%,#FFFFFF_100%)]" />
      <div className="h-[110px] rounded-[24px] border border-[#DCE8F6] bg-white dark:border-white/10 dark:bg-[#18263F]" />
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(340px,0.8fr)]">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-[200px] rounded-[24px] border border-[#DCE8F6] bg-white dark:border-white/10 dark:bg-[#18263F]" />
          ))}
        </div>
        <div className="h-[200px] rounded-[28px] border border-[#D9E6F5] bg-white dark:border-white/10 dark:bg-[#162339]" />
      </div>
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-[360px] rounded-[28px] border border-[#D9E6F5] bg-white dark:border-white/10 dark:bg-[#162339]" />
        ))}
      </div>
    </div>
  )
}

function computeDaysRemaining(endDate?: string | null): number {
  if (!endDate) return 0
  const end = new Date(endDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.max(0, Math.ceil((end.getTime() - today.getTime()) / 86_400_000))
}

function getInstancePhaseLabel(statuscode: number | null | undefined) {
  if (statuscode === DGE_INSTANCE_STATUS.utilization) return 'Utilization'
  if (statuscode === DGE_INSTANCE_STATUS.allocation) return 'Allocation'
  if (statuscode === DGE_INSTANCE_STATUS.reviewCompletedByDge) return 'Review Completed by DGE'
  if (statuscode === DGE_INSTANCE_STATUS.underDgeReview) return 'Under DGE Review'
  return 'Planning'
}

export default function ApproverDashboard() {
  const [portfolioExpanded, setPortfolioExpanded] = useState(false)
  const [planningExpanded, setPlanningExpanded] = useState(false)
  const [portfolioSubmittedToDge, setPortfolioSubmittedToDge] = useState(false)
  const [statusOverrides, setStatusOverrides] = useState<Record<string, StatusOverride>>({})
  const { selectedCycle } = useCycle()
  const { instanceId, instanceDetail, instanceLoading } = useInstance()
  const { items: liveProjects, loading, error } = useRoleProjects('approver', instanceId)
  const { summary: portfolioSummary, loading: portfolioLoading, error: portfolioError } = usePortfolioSummary('approver', instanceId)
  const { runActionToast } = useToast()
  const storedInstanceDetail = getStoredInstanceDetail()
  const activeInstanceDetail = instanceDetail ?? storedInstanceDetail
  const dashboardInstanceStatus = activeInstanceDetail?.statuscode ?? null
  const dashboardBudgetMetrics = useMemo(() => getDashboardBudgetMetricsForInstanceStatus(dashboardInstanceStatus), [dashboardInstanceStatus])
  const dashboardBudgetMetric = getDashboardBudgetMetricForInstanceStatus(dashboardInstanceStatus)
  const dashboardBudgetMetricLabel = DASHBOARD_BUDGET_METRIC_LABEL[dashboardBudgetMetric]
  const effectiveLiveProjects = useMemo(
    () =>
      liveProjects.map((project) => {
        const override = project.ictBudgetId ? statusOverrides[project.ictBudgetId] : undefined
        if (!override) return project

        return {
          ...project,
          status: override.status,
          statusCode: override.statusCode,
        }
      }),
    [liveProjects, statusOverrides]
  )
  const budgetByCategory = useBudgetByCategoryChart(effectiveLiveProjects, dashboardBudgetMetrics)
  const {
    items: accountBreakdown,
    loading: accountBreakdownLoading,
    error: accountBreakdownError,
  } = useAccountCodesBreakdown(effectiveLiveProjects, dashboardBudgetMetrics)
  const showSkeleton = useDelayedLoading(instanceLoading || loading)
  const cycleName = selectedCycle?.name ?? 'ICT Budget Planning 2026'
  const instanceInAllocation = activeInstanceDetail?.statuscode === DGE_INSTANCE_STATUS.allocation
  const daysRemaining = computeDaysRemaining(selectedCycle?.endDate)
  const dueDateLabel = selectedCycle?.endDate
    ? new Date(selectedCycle.endDate).toLocaleDateString('en-AE', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null
  const submittedToApproverProjects = effectiveLiveProjects.filter((project) => project.status === 'Submitted to Approver')
  const clarificationProjects = effectiveLiveProjects.filter((project) => project.status === 'Clarification Required')
  const approvedProjects = effectiveLiveProjects.filter((project) => project.status === 'Approved')
  const submittedToDgeProjects = effectiveLiveProjects.filter((project) => project.status === 'Submitted to DGE')
  const reviewerProjects = effectiveLiveProjects.filter((project) => project.status === 'Submitted to Reviewer' || project.status === 'Reviewer Review Completed')
  const draftProjects = effectiveLiveProjects.filter((project) => project.status === 'Draft')
  const respondentProjects = [...draftProjects, ...clarificationProjects]

  const totalBudget = effectiveLiveProjects.reduce((sum, project) => sum + getProjectBudgetAmount(project, dashboardBudgetMetric), 0)
  const approvedBudget = approvedProjects.reduce((sum, project) => sum + getProjectBudgetAmount(project, dashboardBudgetMetric), 0)
  const budgetPhaseTotals = {
    requested: effectiveLiveProjects.reduce((sum, project) => sum + getProjectBudgetAmount(project, 'requested'), 0),
    recommended: effectiveLiveProjects.reduce((sum, project) => sum + getProjectBudgetAmount(project, 'recommended'), 0),
    allocated: effectiveLiveProjects.reduce((sum, project) => sum + getProjectBudgetAmount(project, 'allocated'), 0),
    utilized: effectiveLiveProjects.reduce((sum, project) => sum + getProjectBudgetAmount(project, 'utilized'), 0),
  }
  const pendingApproval = submittedToApproverProjects.length
  const clarificationCount = clarificationProjects.length
  const highRiskCount = effectiveLiveProjects.filter((project) => project.riskLevel === 'High').length
  const avgConfidence = effectiveLiveProjects.length > 0
    ? Math.round(effectiveLiveProjects.reduce((sum, project) => sum + project.aiScore, 0) / effectiveLiveProjects.length)
    : 0
  const budgetSnapshotItems =
    dashboardBudgetMetrics.length === 1
      ? [
          { label: 'Requested Budget', amount: budgetPhaseTotals.requested, iconColor: dashboardPalette.primary, type: 'amount' as const },
          { label: 'Approved Budget', amount: approvedBudget, iconColor: dashboardPalette.primarySoft, type: 'amount' as const },
          { label: 'AI Confidence', amount: avgConfidence, iconColor: dashboardPalette.primary, type: 'percent' as const },
        ]
      : dashboardBudgetMetrics.map((metric) => ({
          label: DASHBOARD_BUDGET_METRIC_LABEL[metric],
          amount: budgetPhaseTotals[metric],
          iconColor:
            metric === 'recommended'
              ? dashboardPalette.primarySoft
              : metric === 'allocated'
                ? dashboardPalette.primaryDeep
                : metric === 'utilized'
                  ? dashboardPalette.primaryInk
                  : dashboardPalette.primary,
          type: 'amount' as const,
        }))
  const approvalRate = Math.max(1, effectiveLiveProjects.length)
  const approvedCount = approvedProjects.length
  const submittedToDgeCount = submittedToDgeProjects.length
  const approverOwnedProjects = [...submittedToApproverProjects, ...approvedProjects]
  const allProjectsApproved = effectiveLiveProjects.length > 0 && effectiveLiveProjects.every((project) => project.status === 'Approved')
  const allocationCompletedProjectCount = effectiveLiveProjects.filter(
    (project) => project.statusCode === DGE_BUDGET_STATUS.allocationCompleted
  ).length
  const allProjectsAllocationCompleted =
    effectiveLiveProjects.length > 0 &&
    allocationCompletedProjectCount === effectiveLiveProjects.length
  const hasCycleDgeSubmission = effectiveLiveProjects.some(
    (project) => project.status === 'Submitted to DGE' && project.statusCode === 776140004
  )
  const portfolioAlreadySubmittedToDge =
    portfolioSubmittedToDge || hasCycleDgeSubmission
  const showSubmittedToDgeMessage = portfolioAlreadySubmittedToDge && !instanceInAllocation
  const submitToDgeDisabled = instanceInAllocation
    ? !allProjectsAllocationCompleted
    : !allProjectsApproved
  const projectsRequiringApproval = useMemo(
    () => [...submittedToApproverProjects].sort((a, b) => parseProjectDate(b) - parseProjectDate(a)).slice(0, 2),
    [submittedToApproverProjects]
  )
  const latestProjects = useMemo(
    () => [...effectiveLiveProjects].sort((a, b) => parseProjectDate(b) - parseProjectDate(a)).slice(0, 2),
    [effectiveLiveProjects]
  )
  const showPendingApprovalPanel = projectsRequiringApproval.length > 0
  const focusProjects = showPendingApprovalPanel ? projectsRequiringApproval : latestProjects

  const summaryCounts = {
    inCycle: effectiveLiveProjects.length,
    withRespondent: respondentProjects.length,
    withReviewer: reviewerProjects.length,
    withApprover: approverOwnedProjects.length,
  }

  const queueBudgetMix = [
    {
      name: 'Drafts on Respondent',
      value: draftProjects.reduce((sum, project) => sum + getProjectBudgetAmount(project, dashboardBudgetMetric), 0),
      amounts: getMetricAmountsFromProjects(draftProjects, dashboardBudgetMetrics),
      fill: dashboardPalette.primary,
    },
    {
      name: 'With Reviewer',
      value: reviewerProjects.reduce((sum, project) => sum + getProjectBudgetAmount(project, dashboardBudgetMetric), 0),
      amounts: getMetricAmountsFromProjects(reviewerProjects, dashboardBudgetMetrics),
      fill: dashboardPalette.primarySoft,
    },
    {
      name: 'Pending My Approval',
      value: approverOwnedProjects.reduce((sum, project) => sum + getProjectBudgetAmount(project, dashboardBudgetMetric), 0),
      amounts: getMetricAmountsFromProjects(approverOwnedProjects, dashboardBudgetMetrics),
      fill: dashboardPalette.primaryDeep,
    },
    {
      name: 'Clarification Open',
      value: clarificationProjects.reduce((sum, project) => sum + getProjectBudgetAmount(project, dashboardBudgetMetric), 0),
      amounts: getMetricAmountsFromProjects(clarificationProjects, dashboardBudgetMetrics),
      fill: dashboardPalette.primaryMuted,
    },
    {
      name: 'Submitted to DGE',
      value: submittedToDgeProjects.reduce((sum, project) => sum + getProjectBudgetAmount(project, dashboardBudgetMetric), 0),
      amounts: getMetricAmountsFromProjects(submittedToDgeProjects, dashboardBudgetMetrics),
      fill: dashboardPalette.primary,
    },
  ].map((item) => ({
    ...item,
    percent: totalBudget > 0 ? Math.round((item.value / totalBudget) * 100) : 0,
  }))

  const budgetTypeGroups = [
    {
      key: 'Operational Non-Recurring',
      label: 'Operational Non-Recurring',
      accent: '#286CFF',
      bgClass: 'border-[#D8E7FF] dark:border-[#3E5F97]',
      badgeClass: 'bg-[#EAF2FF] text-[#286CFF] dark:border dark:border-[#3E5F97] dark:bg-[#1E355C] dark:text-[#BFDBFE]',
    },
    {
      key: 'Operational Recurring',
      label: 'Operational Recurring',
      accent: '#0EA5E9',
      bgClass: 'border-[#CFEFFF] dark:border-[#2D6E8B]',
      badgeClass: 'bg-[#E0F7FF] text-[#0EA5E9] dark:border dark:border-[#2D6E8B] dark:bg-[#173B4B] dark:text-[#BAE6FD]',
    },
    {
      key: 'New Project',
      label: 'New Project',
      accent: '#14B8A6',
      bgClass: 'border-[#CDEFEA] dark:border-[#2F7C73]',
      badgeClass: 'bg-[#E6FFFB] text-[#0F9D8A] dark:border dark:border-[#2F7C73] dark:bg-[#173E3B] dark:text-[#99F6E4]',
    },
    {
      key: 'Project Continuation',
      label: 'Project Continuation',
      accent: '#F59E0B',
      bgClass: 'border-[#F8E2B7] dark:border-[#8A6832]',
      badgeClass: 'bg-[#FFF4DB] text-[#D97706] dark:border dark:border-[#8A6832] dark:bg-[#4A3517] dark:text-[#FCD34D]',
    },
  ] as const

  const budgetTypeBreakdown = budgetTypeGroups.map((group) => {
    const items = effectiveLiveProjects.filter((project) => project.budgetType === group.key)
    const amount = items.reduce((sum, project) => sum + getProjectBudgetAmount(project, dashboardBudgetMetric), 0)
    return {
      ...group,
      count: items.length,
      amount,
      amounts: getMetricAmountsFromProjects(items, dashboardBudgetMetrics),
      share: totalBudget > 0 ? Math.round((amount / totalBudget) * 100) : 0,
    }
  })

  const clarificationFocusProjects = useMemo(
    () => [...clarificationProjects].sort((a, b) => parseProjectDate(b) - parseProjectDate(a)).slice(0, 2),
    [clarificationProjects]
  )

  const portfolioAiFlags = useMemo(() => getAiReviewFlags(portfolioSummary), [portfolioSummary])
  const portfolioClarification = useMemo(() => getClarificationGroups(portfolioSummary), [portfolioSummary])
  const portfolioCounts = useMemo(() => getPortfolioCounts(portfolioSummary), [portfolioSummary])
  const planningSummary = useMemo(
    () => resolvePortfolioTemplate(getPortfolioSummaryRoleView(portfolioSummary, 'approver')?.planning_cycle_summary_template, portfolioSummary),
    [portfolioSummary]
  )
  const planningSummaryPreview = useMemo(
    () => truncateAtWordBoundary(planningSummary || 'Current cycle status: final approval is in progress, reviewer-cleared projects are being checked for DGE readiness, and clarification loops remain open where evidence is incomplete.', 210),
    [planningSummary]
  )
  const approverProgressAssigned = pendingApproval + approvedCount + submittedToDgeCount
  const approverProgressValue = approverProgressAssigned > 0 ? Math.round(((approvedCount + submittedToDgeCount) / approverProgressAssigned) * 100) : 0

  const insightCards = [
    {
      title: 'High Risk',
      value: portfolioCounts.highRiskProjects || highRiskCount,
      note: 'Need immediate review',
      accent: '#EF4444',
      icon: <ShieldAlert className="h-4.5 w-4.5" />,
      bg: 'bg-white dark:bg-[#18263F]',
      border: 'border-[#FFD1D1] dark:border-[#5B2632]',
    },
    {
      title: 'Evidence Risk',
      value: portfolioAiFlags.evidence_risk?.project_ids?.length ?? 0,
      note: 'Missing or incomplete evidence',
      accent: '#F97316',
      icon: <ClipboardCheck className="h-4.5 w-4.5" />,
      bg: 'bg-white dark:bg-[#18263F]',
      border: 'border-[#FFD9C3] dark:border-[#5A3523]',
    },
    {
      title: 'Budget Accuracy Risk',
      value: portfolioAiFlags.budget_accuracy_risk?.project_ids?.length ?? 0,
      note: 'Unusual spending patterns',
      accent: '#286CFF',
      icon: <TrendingUp className="h-4.5 w-4.5" />,
      bg: 'bg-white dark:bg-[#18263F]',
      border: 'border-[#D4E4FF] dark:border-[#315389]',
    },
    {
      title: 'Strategic Alignment Risk',
      value: portfolioAiFlags.strategic_alignment_risk?.project_ids?.length ?? 0,
      note: 'Weak strategic justification',
      accent: '#9333EA',
      icon: <CircleAlert className="h-4.5 w-4.5" />,
      bg: 'bg-white dark:bg-[#18263F]',
      border: 'border-[#E9D5FF] dark:border-[#52307A]',
    },
    {
      title: 'Clarification Open',
      value: portfolioClarification.already_raised?.project_ids?.length ?? 0,
      note: 'Need respondent reply',
      accent: '#D97706',
      icon: <MessageSquareMore className="h-4.5 w-4.5" />,
      bg: 'bg-white dark:bg-[#18263F]',
      border: 'border-[#F7E1A1] dark:border-[#64582A]',
    },
    {
      title: 'Clarification Likely',
      value: portfolioClarification.potential_clarification?.project_ids?.length ?? 0,
      note: 'May need follow-up',
      accent: '#F97316',
      icon: <MessageSquareMore className="h-4.5 w-4.5" />,
      bg: 'bg-white dark:bg-[#18263F]',
      border: 'border-[#FFD9C3] dark:border-[#5A3523]',
    },
  ]

  const quickActions = [
    {
      label: 'Approval Queue',
      meta: pendingApproval,
      to: '/approver/approval-queue',
      accent: '#D97706',
      icon: <Clock3 className="h-4.5 w-4.5" />,
      endIcon: <ClipboardCheck className="h-4 w-4" />,
      rowClass: 'hover:border-[#F7D58D] hover:bg-[#FFF9ED] dark:hover:bg-[#2E2416]',
    },
    {
      label: 'Submission Readiness',
      meta: `${Math.round((approvedCount / approvalRate) * 100)}%`,
      to: '/approver/approval-queue',
      accent: '#15803D',
      icon: <Send className="h-4.5 w-4.5" />,
      endIcon: <CheckCircle2 className="h-4 w-4" />,
      rowClass: 'hover:border-[#BDE7CB] hover:bg-[#F2FCF6] dark:hover:bg-[#163224]',
    },
    {
      label: 'Notify Reviewer',
      meta: reviewerProjects.length,
      to: '/approver/approval-queue',
      accent: '#286CFF',
      icon: <Bell className="h-4.5 w-4.5" />,
      endIcon: <Bell className="h-4 w-4" />,
      rowClass: 'hover:border-[#CFE0FF] hover:bg-[#F3F8FF] dark:hover:bg-[#1A2D49]',
    },
    {
      label: 'Notify Respondent',
      meta: respondentProjects.length,
      to: '/approver/approval-queue',
      accent: '#475569',
      icon: <Users className="h-4.5 w-4.5" />,
      endIcon: <Users className="h-4 w-4" />,
      rowClass: 'hover:border-[#DCE6F1] hover:bg-[#F8FAFC] dark:hover:bg-[#202F47]',
    },
    {
      label: 'High Risk Items',
      meta: highRiskCount,
      to: '/approver/approval-queue',
      accent: '#EF4444',
      icon: <ShieldAlert className="h-4.5 w-4.5" />,
      endIcon: <TriangleAlert className="h-4 w-4" />,
      rowClass: 'hover:border-[#FFD1D1] hover:bg-[#FFF6F6] dark:hover:bg-[#34161D]',
    },
    {
      label: 'Ask AI Assistant',
      meta: 'Assist',
      to: '/approver/approval-queue',
      accent: '#9333EA',
      icon: <Sparkles className="h-4.5 w-4.5" />,
      endIcon: <Bot className="h-4 w-4" />,
      rowClass: 'hover:border-[#E9D5FF] hover:bg-[#FAF5FF] dark:hover:bg-[#281A3A]',
    },
  ]

  const portfolioIssues = useMemo(
    () => [
      {
        title: '2 submissions flagged as high risk with incomplete supporting documentation.',
        detail: 'Electronic Health Records System and Smart Classroom Initiative need supporting assessments before final approval.',
        icon: <ShieldAlert className="h-4 w-4" />,
        tone: '#EF4444',
        badge: 'Critical',
      },
      {
        title: '1 project appears near-duplicate of a previously approved initiative.',
        detail: 'Network Modernization Infrastructure overlaps with a previously approved network uplift request.',
        icon: <CopyPlus className="h-4 w-4" />,
        tone: '#F59E0B',
        badge: 'Warning',
      },
      {
        title: '4 submitted budgets show anomalies versus historical spending patterns.',
        detail: 'Line-item shifts are higher than expected and should be reviewed before DGE submission.',
        icon: <Scale className="h-4 w-4" />,
        tone: '#286CFF',
        badge: 'Review',
      },
    ],
    []
  )

  const handleSubmitToDge = async () => {
    const projectIds = effectiveLiveProjects
      .filter((project) =>
        project.ictBudgetId &&
        (instanceInAllocation
          ? project.statusCode === DGE_BUDGET_STATUS.allocationCompleted
          : project.status === 'Approved')
      )
      .map((project) => project.ictBudgetId as string)

    if (!projectIds.length || (instanceInAllocation && !instanceId)) {
      return
    }

    await runActionToast(
      async () => {
        if (instanceInAllocation && instanceId) {
          await submitInstanceToUtilization(instanceId, projectIds)
        } else {
          await projectService.approverSubmitToDge(projectIds)
          await updateCurrentInstanceSubmissionDate()
        }
        setPortfolioSubmittedToDge(true)
        setStatusOverrides((prev) => {
          const next = { ...prev }
          for (const projectId of projectIds) {
            next[projectId] = {
              status: 'Submitted to DGE',
              statusCode: instanceInAllocation ? DGE_BUDGET_STATUS.utilizationInProgress : DGE_BUDGET_STATUS.underStrategicAlignmentReview,
            }
          }
          return next
        })
      },
      {
        processingTitle: instanceInAllocation ? 'Starting utilization' : 'Submitting to DGE',
        processingDescription: instanceInAllocation
          ? 'Moving the entity into utilization and assigning projects back to Respondent...'
          : 'Assigning the approved portfolio to the strategy team and moving it into DGE review...',
        successTitle: instanceInAllocation ? 'Utilization started' : 'Submitted to DGE',
        successDescription: instanceInAllocation
          ? 'All allocation-completed projects are now in utilization.'
          : 'All approved projects were submitted to DGE successfully.',
        errorTitle: instanceInAllocation ? 'Unable to start utilization' : 'Unable to submit to DGE',
        minDurationMs: 1600,
      }
    )
  }

  if (showSkeleton) {
    return <DashboardLoadingState />
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-[#FFD4D1] bg-[#FFF5F5] px-4 py-3 text-sm text-[#B42318]">
        {error}
      </div>
    )
  }

  return (
    <div className="w-full space-y-6 pb-4">
      <section className="relative p-1">
        <div className="relative">
          <div className="max-w-3xl">
            <h1 className="text-3xl font-bold tracking-tight text-[#0F172A] dark:text-white">
              {cycleName}
            </h1>
            <p className="mt-1 text-sm font-medium text-[#64748B] dark:text-slate-200">
              {instanceDetail?.name ?? storedInstanceDetail?.name ?? 'Entity'}
            </p>
            <span className="relative mt-3 inline-flex max-w-2xl items-end gap-1 text-sm leading-6 text-[#475569] dark:text-slate-100">
              <span className={planningExpanded ? 'block' : 'block line-clamp-2'}>
                {planningExpanded ? (planningSummary || planningSummaryPreview.text) : planningSummaryPreview.text}
              </span>
              <button
                type="button"
                onClick={() => setPlanningExpanded((current) => !current)}
                className="inline-flex shrink-0 items-center whitespace-nowrap rounded-full border border-[#D8E7FF] bg-[#EEF5FF] px-2 py-0.5 text-[11px] font-semibold leading-none text-[#286CFF] transition-colors hover:border-[#BFD4FF] hover:bg-[#E7F0FF] hover:text-[#0C65F5] dark:border-white/10 dark:bg-white/5 dark:text-[#BFDBFE] dark:hover:bg-white/10 dark:hover:text-white"
              >
                {planningExpanded ? 'Less' : '..'}
              </button>
            </span>
            <div className="mt-5 space-y-3">
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <span className="inline-flex items-center gap-2 rounded-full border border-[#D8E7FF] bg-white px-3.5 py-2 font-medium text-[#2563EB] shadow-[0_10px_22px_rgba(15,23,42,0.05)] dark:border-white/10 dark:bg-[#1B2A41] dark:text-[#DBEAFE]">
                  <Radar className="h-4 w-4" />
                  {daysRemaining} days remaining
                </span>
                {dueDateLabel && (
                  <span className="inline-flex items-center gap-2 rounded-full border border-[#D8E7FF] bg-white px-3.5 py-2 font-medium text-[#2563EB] shadow-[0_10px_22px_rgba(15,23,42,0.05)] dark:border-white/10 dark:bg-[#1B2A41] dark:text-[#DBEAFE]">
                    <CalendarClock className="h-4 w-4" />
                    Due {dueDateLabel}
                  </span>
                )}
                <span className="inline-flex items-center gap-2 rounded-full border border-[#DCE8F6] bg-white px-3.5 py-2 font-medium text-[#475569] shadow-[0_10px_22px_rgba(15,23,42,0.05)] dark:border-white/10 dark:bg-[#1B2A41] dark:text-slate-100">
                  <Users className="h-4 w-4 text-[#286CFF] dark:text-[#BFDBFE]" />
                  <span>My Progress</span>
                  <span className="text-[#0F172A] dark:text-white">{approvedCount + submittedToDgeCount}/{approverProgressAssigned || 0}</span>
                  <span className="h-2 w-16 overflow-hidden rounded-full bg-[#EEF3F8] dark:bg-white/10">
                    <span className="block h-full rounded-full bg-[#286CFF]" style={{ width: `${approverProgressValue}%` }} />
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        title="Once all created projects are reviewed and approved, you can submit them all to DGE."
        className="overflow-hidden rounded-[24px] border border-[#DCE8F6] bg-white px-4 py-3 shadow-[0_10px_24px_rgba(40,108,255,0.05)] dark:border-white/10 dark:bg-[#18263F]"
      >
        <div className="overflow-x-auto">
          <div className="flex min-w-[980px] items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#EEF5FF] text-[#286CFE] dark:bg-[#1E3A68] dark:text-[#DBEAFE]">
                <Calendar className="h-4.5 w-4.5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-[#64748B] dark:text-slate-200 [text-wrap-mode:nowrap]">DGE Submission Deadline</p>
                <p className="mt-1 text-sm font-bold text-[#286CFE] dark:text-[#BFDBFE]">{daysRemaining} days remaining</p>
              </div>
            </div>

            <div className="h-12 w-px shrink-0 bg-[#D9E6F5] dark:bg-white/10" />

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#F3E8FF] text-[#9333EA] dark:bg-[#352050] dark:text-[#F3E8FF]">
                <Sparkles className="h-4.5 w-4.5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[#64748B] dark:text-slate-200">AI Summary</p>
                <p className="mt-1 text-sm font-semibold text-[#0F172A] dark:text-white whitespace-nowrap">
                  {summaryCounts.inCycle} projects in cycle,{' '}
                  <span className="text-[#286CFE] dark:text-[#BFDBFE]">{summaryCounts.withRespondent} with Respondent</span>,{' '}
                  <span className="text-[#5B87FF] dark:text-[#CFE0FF]">{summaryCounts.withReviewer} with Reviewer</span>,{' '}
                  <span className="text-[#0C65F5] dark:text-[#93C5FD]">{summaryCounts.withApprover} with Approver</span>
                </p>
              </div>
            </div>

            {showSubmittedToDgeMessage ? (
              <div className="ml-auto flex min-w-[280px] items-start gap-3 rounded-[22px] border border-[#E9D5FF] bg-[#FDF8FF] px-4 py-3 dark:border-white/10 dark:bg-white/5">
                <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-[#A855F7] dark:text-[#E9D5FF]" />
                <div>
                  <p className="text-sm font-bold text-[#A855F7] dark:text-[#E9D5FF]">Submitted to DGE</p>
                  <p className="mt-1 text-xs leading-5 text-[#475569] dark:text-slate-100">
                    The ADGE entity has already moved to the strategy team. Any new approver-stage project will now move directly into DGE review.
                  </p>
                </div>
              </div>
            ) : (
              <Button
                className="ml-auto h-11 shrink-0 rounded-[18px] px-4 shadow-[0_12px_24px_rgba(40,108,255,0.16)]"
                disabled={submitToDgeDisabled}
                onClick={() => void handleSubmitToDge()}
              >
                Submit to DGE
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 items-stretch gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(340px,0.8fr)]">
        <div className="grid h-full grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <ActionMetricCard
            title={<><span className="block">Pending</span><span className="block">Approval</span></>}
            value={pendingApproval}
            accent={dashboardPalette.camelYellow}
            badge="Pending"
            icon={<ClipboardCheck className="h-5 w-5" />}
            href="/approver/projects?tab=pending-approval"
            description="Projects waiting for approver decision before final handoff."
          />
          <ActionMetricCard
            title={<><span className="block">Clarification</span><span className="block">Open</span></>}
            value={clarificationCount}
            accent={dashboardPalette.desertOrange}
            badge="Open"
            icon={<MessageSquareMore className="h-5 w-5" />}
            href="/approver/projects?tab=clarification"
            description="Approver-returned items pending respondent clarification."
          />
          <ActionMetricCard
            title={<><span className="block">Approved</span><span className="block">Project</span></>}
            value={approvedCount}
            accent={dashboardPalette.aeGreen}
            badge="Ready"
            icon={<CheckCircle2 className="h-5 w-5" />}
            href="/approver/projects?tab=approved"
            description="Approved items held until the entity moves onward to DGE."
          />
        </div>

        <Card className="h-full overflow-hidden rounded-[28px] border-[#D9E6F5] bg-white shadow-none dark:border-white/10 dark:bg-[#162339]">
          <CardContent className="flex h-full flex-col justify-center p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-xl font-bold text-[#0F172A] dark:text-white">Budget Snapshot</h3>
                  <InfoHint text={`Consolidated approver view of total ${dashboardBudgetMetricLabel.toLowerCase()}, approved value, and portfolio confidence.`} />
                </div>
              </div>
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#E7F5FF] text-[#286CFF] dark:bg-[#286CFF]/15 dark:text-white">
                <BadgeDollarSign className="h-5 w-5" />
              </div>
            </div>

            <div className="mt-5 rounded-[22px] border border-[#DCE8F6] bg-[#F8FBFF] px-4 py-4 dark:border-white/10 dark:bg-[#1B2A41]">
              <div className={cn(
                'grid gap-4 sm:divide-x sm:divide-[#DCE8F6] dark:sm:divide-white/10',
                budgetSnapshotItems.length >= 4 ? 'sm:grid-cols-2 xl:grid-cols-4' : 'sm:grid-cols-3'
              )}>
                {budgetSnapshotItems.map((item, index) => (
                  <div key={item.label} className={cn(index === 0 ? 'sm:pr-4' : 'sm:px-4', index === budgetSnapshotItems.length - 1 && 'sm:pr-0')}>
                    <p className="flex min-h-8 items-end text-xs font-semibold tracking-[0.06em] text-[#64748B] dark:text-slate-100">{item.label}</p>
                    {item.type === 'percent' ? (
                      <div className="mt-3 text-2xl font-bold leading-none text-[#0F172A] dark:text-white sm:text-[30px] xl:text-[32px]">
                        {item.amount}%
                      </div>
                    ) : (
                      <div className="mt-3">
                        <CompactAmount amount={item.amount} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <AiPortfolioSummary
        role="approver"
        summary={portfolioSummary}
        loading={portfolioLoading}
        error={portfolioError}
        projects={effectiveLiveProjects}
        variant="dashboard"
        projectHrefBuilder={(projectId) => `/approver/approval-queue/${projectId}`}
      />

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Card
          title="AI-detected approval issues and risk themes needing final approver attention."
          className="hidden overflow-hidden rounded-[28px] border border-[#E9D5FF] bg-gradient-to-b from-[#FDF7FF] to-white shadow-[0_12px_30px_rgba(15,23,42,0.06)] dark:border-white/10 dark:from-[#2A123D] dark:to-[#1E293B]"
        >
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Sparkles className="h-6 w-6 shrink-0 text-[#A855F7] dark:text-[#E9D5FF]" />
                  <h3 className="text-xl font-bold text-[#0F172A] dark:text-white">AI Risk &amp; Priority Insights</h3>
                  <InfoHint text="AI surfaces the themes that most often block final approval and DGE readiness." />
                </div>
                <p className="mt-1 text-sm text-[#64748B] dark:text-slate-100">AI-detected issues requiring attention</p>
              </div>
              <span className="inline-flex items-center rounded-full bg-[#FDF8FF] px-3 py-1 text-xs font-semibold text-[#A855F7] dark:bg-[#A855F7]/15 dark:text-[#E9D5FF]">
                AI-assisted
              </span>
            </div>

            <div className="mt-5 rounded-[24px] border border-[#E9D5FF] bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#1E293B]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#64748B] dark:text-slate-200">Priority snapshot</p>
                  <p className="mt-2 text-2xl font-bold text-[#0F172A] dark:text-white">
                    {highRiskCount + clarificationCount} portfolio signals need final attention
                  </p>
                </div>
                <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-[#A855F7] text-white">
                  <Sparkles className="h-6 w-6" />
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {insightCards.map((card) => (
                <div
                  key={card.title}
                  className="min-h-[124px] rounded-[20px] border border-[#E9D5FF] bg-white p-4 transition-transform duration-200 hover:-translate-y-0.5 hover:bg-[#FDF8FF] dark:border-white/10 dark:bg-[#1E293B]"
                >
                  <div className="flex items-center gap-2 text-[#A855F7] dark:text-[#E9D5FF]">
                    {card.icon}
                    <p className="text-sm font-semibold">{card.title}</p>
                  </div>
                  <p className="mt-4 text-[32px] font-bold leading-none text-[#A855F7] dark:text-[#E9D5FF]">
                    {card.value}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-[#64748B] dark:text-slate-200">{card.note}</p>
                </div>
              ))}
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {[
                  `${pendingApproval} pending approvals`,
                  `${clarificationCount} clarification loops`,
                  `${avgConfidence}% avg confidence`,
                ].map((item, index) => (
                  <span
                    key={item}
                    className={cn(
                      'inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold',
                      index === 0 && 'bg-[#FDF8FF] text-[#A855F7] dark:bg-[#A855F7]/15 dark:text-[#E9D5FF]',
                      index === 1 && 'bg-[#EEF5FF] text-[#286CFE] dark:bg-[#286CFE]/15 dark:text-[#BFDBFE]',
                      index === 2 && 'bg-[#F8FAFC] text-[#475569] dark:bg-white/5 dark:text-slate-100'
                    )}
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          title="Projects currently waiting for final approver decision."
          className="overflow-hidden rounded-[28px] border-[#D9E6F5] bg-white shadow-none dark:border-white/10 dark:bg-[#162339]"
        >
          <CardContent className="p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <ClipboardCheck className="h-5 w-5 shrink-0 text-[#286CFF]" />
                  <h3 className="text-xl font-bold text-[#0F172A] dark:text-white">
                    {showPendingApprovalPanel ? 'Projects Requiring My Approval' : 'Latest ICT Budgets'}
                  </h3>
                  <InfoHint text={showPendingApprovalPanel
                    ? 'A focused list of projects that are currently waiting for final approver action before they can move onward.'
                    : 'No project is currently pending with the approver, so this section falls back to the latest ICT budgets.'}
                  />
                </div>
                <p className="mt-1 text-sm text-[#64748B] dark:text-slate-100">
                  {showPendingApprovalPanel ? 'Top items waiting for your decision' : 'Most recent ICT budgets visible to the approver'}
                </p>
              </div>
              <span className="inline-flex items-center rounded-full bg-[#EEF5FF] px-3 py-1 text-xs font-semibold text-[#286CFE] dark:bg-[#286CFE]/15 dark:text-[#BFDBFE]">
                {showPendingApprovalPanel ? `${pendingApproval} pending` : `${liveProjects.length} in cycle`}
              </span>
            </div>

            <div className="space-y-3">
              {focusProjects.map((project, index) => (
                <Link
                  key={project.id}
                  to={`/approver/approval-queue/${project.id}`}
                  className="group block rounded-[22px] border border-[#DCE8F6] bg-white p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#286CFF] hover:bg-[#F8FBFF] dark:border-white/10 dark:bg-[#1B2A41] dark:hover:border-[#4F98FF] dark:hover:bg-[#203352]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                      <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EEF5FF] text-xs font-bold text-[#286CFF] dark:bg-[#1E3A68] dark:text-[#DBEAFE]">
                          {index + 1}
                        </span>
                        <p className="truncate text-[15px] font-semibold text-[#0F172A] dark:text-white">{project.name}</p>
                      </div>
                      <p className="mt-2 line-clamp-2 text-sm text-[#64748B] dark:text-slate-100">
                        {showPendingApprovalPanel
                          ? `${project.strategicPriority} budget request awaiting final approval decision.`
                          : `${project.strategicPriority} budget record in the current ICT planning cycle.`}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-[#64748B] dark:text-slate-100">
                        <span className="inline-flex items-center rounded-full bg-[#EEF5FF] px-2.5 py-1 font-semibold text-[#286CFE] dark:bg-[#1E3A68] dark:text-[#DBEAFE]">
                          {showPendingApprovalPanel ? 'Awaiting approval' : project.status}
                        </span>
                        <span>{project.budgetType}</span>
                        <CurrencyAmount amount={getProjectBudgetAmount(project, dashboardBudgetMetric)} className="text-sm font-semibold text-[#0F172A] dark:text-white" iconSize={13} />
                      </div>
                    </div>
                    <MoveRight className="mt-1 h-4 w-4 shrink-0 text-[#94A3B8] transition-transform group-hover:translate-x-0.5 group-hover:text-[#286CFF]" />
                  </div>
                </Link>
              ))}
            </div>

            <div className="mt-4">
              <Button variant="outline" asChild className="h-10 rounded-2xl">
                <Link to={showPendingApprovalPanel ? '/approver/projects?tab=pending-approval' : '/approver/projects'}>
                  View All Projects
                  <MoveRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
        <PortfolioInsightCharts
          summary={portfolioSummary}
          chartKeys={['aiReviewFlags']}
          projectHrefBuilder={(projectId) => `/approver/approval-queue/${projectId}`}
        />
      </section>

      <section className="grid grid-cols-1 items-stretch gap-5 xl:grid-cols-2">
        <Card
          title={`${dashboardBudgetMetricLabel} distribution across ICT strategic categories for the current approval cycle.`}
          className="overflow-hidden rounded-[28px] border-[#D9E6F5] bg-white shadow-none dark:border-white/10 dark:bg-[#162339]"
        >
          <CardContent className="p-6">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Layers className="h-5 w-5 shrink-0 text-[#286CFF]" />
                  <h3 className="text-xl font-bold text-[#0F172A] dark:text-white">Budget by Strategic Priority</h3>
                  <InfoHint text={`Shows how the ${dashboardBudgetMetricLabel.toLowerCase()} is distributed across strategic ICT categories before final approval and DGE submission.`} />
                </div>
                <p className="mt-1 text-sm text-[#64748B] dark:text-slate-100">
                  {dashboardBudgetMetricLabel} by strategic ICT category
                </p>
              </div>
              <span className="inline-flex items-center rounded-full bg-[#EEF5FF] px-3 py-1 text-xs font-semibold text-[#286CFF] dark:bg-[#286CFF]/15 dark:text-[#C6DBFF]">
                Current cycle
              </span>
            </div>
            <BudgetByCategory data={budgetByCategory} metrics={dashboardBudgetMetrics} />
          </CardContent>
        </Card>
        <Card
          title={`Account codes receiving the largest share of ${dashboardBudgetMetricLabel.toLowerCase()} across approver-stage projects.`}
          className="h-full overflow-hidden rounded-[28px] border-[#D9E6F5] bg-white shadow-none dark:border-white/10 dark:bg-[#162339]"
        >
          <CardContent className="flex h-full flex-col p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <WalletCards className="h-5 w-5 shrink-0 text-[#286CFF]" />
                  <h3 className="text-xl font-bold text-[#0F172A] dark:text-white">Account Codes Breakdown</h3>
                  <InfoHint text={`Highlights which account codes are drawing the largest share of ${dashboardBudgetMetricLabel.toLowerCase()} across approver-stage projects.`} />
                </div>
                <p className="mt-1 text-sm text-[#64748B] dark:text-slate-100">
                  Most-funded accounts by {dashboardBudgetMetricLabel.toLowerCase()}
                </p>
              </div>
              <span className="inline-flex items-center rounded-full bg-[#EEF5FF] px-3 py-1 text-xs font-semibold text-[#286CFE] dark:bg-[#286CFE]/18 dark:text-[#C6DBFF]">
                Top accounts
              </span>
            </div>
            <AccountCodesBreakdown
              items={accountBreakdown}
              loading={accountBreakdownLoading}
              error={accountBreakdownError}
              metrics={dashboardBudgetMetrics}
            />
          </CardContent>
        </Card>

        <Card
          title={`${dashboardBudgetMetricLabel} distribution across approver-visible workflow stages.`}
          className="hidden overflow-hidden rounded-[28px] border-[#D9E6F5] bg-white shadow-none dark:border-white/10 dark:bg-[#162339]"
        >
          <CardContent className="p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <BadgeDollarSign className="h-5 w-5 shrink-0 text-[#286CFF]" />
                  <h3 className="text-xl font-bold text-[#0F172A] dark:text-white">Budget Queue Mix</h3>
                  <InfoHint text={`Shows how ${dashboardBudgetMetricLabel.toLowerCase()} is currently distributed across the approver-visible project workflow.`} />
                </div>
                <p className="mt-1 text-sm text-[#64748B] dark:text-slate-100">{dashboardBudgetMetricLabel} split across approval stages</p>
              </div>
              <span className="inline-flex items-center rounded-full bg-[#EEF5FF] px-3 py-1 text-xs font-semibold text-[#286CFF] dark:bg-[#286CFF]/18 dark:text-[#C6DBFF]">
                Portfolio mix
              </span>
            </div>

            <BudgetQueueMixContent
              queueBudgetMix={queueBudgetMix}
              totalBudget={totalBudget}
              dashboardBudgetMetricLabel={dashboardBudgetMetricLabel}
              dashboardBudgetMetrics={dashboardBudgetMetrics}
            />
          </CardContent>
        </Card>
      </section>

      <section className="grid grid-cols-1 items-stretch gap-5 xl:grid-cols-2">
        <Card
          title={`Shows how ${dashboardBudgetMetricLabel.toLowerCase()} is distributed across the four ICT budget activity types in the approver workspace.`}
          className="overflow-hidden rounded-[28px] border-[#D9E6F5] bg-white shadow-none dark:border-white/10 dark:bg-[#162339]"
        >
          <CardContent className="p-6">
            <div className="mb-5">
              <div className="flex flex-wrap items-center gap-2">
                <BadgeDollarSign className="h-5 w-5 shrink-0 text-[#286CFF]" />
                <h3 className="text-xl font-bold text-[#0F172A] dark:text-white">Budget Type Distribution</h3>
                <InfoHint text={`Shows how much of the approver-visible ${dashboardBudgetMetricLabel.toLowerCase()} sits in each ICT budget activity type.`} />
              </div>
              <p className="mt-1 text-sm text-[#64748B] dark:text-slate-100">
                {dashboardBudgetMetricLabel} split across all four budget types
              </p>
            </div>
            <div className="mx-auto mt-8 max-w-2xl">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {budgetTypeBreakdown.map((item) => (
                  <div key={item.key} className={`rounded-[22px] border bg-white p-4 shadow-none dark:bg-[#18263F] ${item.bgClass}`}>
                    <div className="flex min-h-[104px] items-center gap-3">
                      <div className={`flex h-14 w-14 items-center justify-center rounded-[18px] text-2xl font-bold ${item.badgeClass}`}>
                        {item.count}
                      </div>
                      <div className="flex-1">
                        <p className="text-base font-bold text-[#0F172A] dark:text-white">{item.label}</p>
                        <CurrencyAmount amount={item.amount} className="mt-1 text-lg font-bold" iconColor={item.accent} iconSize={15} />
                        <p className="mt-1 text-xs text-[#64748B] dark:text-slate-100">{item.share}% of {dashboardBudgetMetricLabel.toLowerCase()} total</p>
                        {dashboardBudgetMetrics.length > 1 && (
                          <div className="mt-3 space-y-1.5">
                            {dashboardBudgetMetrics.map((metric) => (
                              <div key={metric} className="flex items-center justify-between gap-2 text-xs">
                                <span className="text-[#64748B] dark:text-slate-300">{DASHBOARD_BUDGET_METRIC_LABEL[metric]}</span>
                                <CurrencyAmount amount={item.amounts?.[metric] ?? 0} className="font-semibold text-[#0F172A] dark:text-white" iconSize={11} />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 h-3 overflow-hidden rounded-full bg-[#EEF3F8] dark:bg-white/10">
                <div className="flex h-full">
                  {budgetTypeBreakdown.map((item, index) => (
                    <div
                      key={item.key}
                      className={`${index === 0 ? 'rounded-l-full' : ''} ${index === budgetTypeBreakdown.length - 1 ? 'rounded-r-full' : ''} h-full`}
                      style={{
                        width: `${item.share}%`,
                        backgroundColor: item.accent,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          title="Phase-aware budget lens for requested, recommended, allocated, and utilized values."
          className="h-full overflow-hidden rounded-[28px] border-[#D9E6F5] bg-white shadow-none dark:border-white/10 dark:bg-[#162339]"
        >
          <CardContent className="flex h-full flex-col p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <WalletCards className="h-5 w-5 shrink-0 text-[#286CFF]" />
                  <h3 className="text-xl font-bold text-[#0F172A] dark:text-white">Budget Phase Lens</h3>
                  <InfoHint text="Shows all budget lenses while highlighting the value currently used by dashboard charts for this instance stage." />
                </div>
                <p className="mt-1 text-sm text-[#64748B] dark:text-slate-100">
                  Active dashboard metric: {dashboardBudgetMetricLabel}
                </p>
              </div>
              <span className="inline-flex items-center rounded-full bg-[#EEF5FF] px-3 py-1 text-xs font-semibold text-[#286CFE] dark:bg-[#286CFE]/18 dark:text-[#C6DBFF]">
                {getInstancePhaseLabel(activeInstanceDetail?.statuscode)}
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { label: 'Requested Budget', value: budgetPhaseTotals.requested, metric: 'requested', accent: '#286CFF' },
                { label: 'Recommended Budget', value: budgetPhaseTotals.recommended, metric: 'recommended', accent: '#10B981' },
                { label: 'Allocated Budget', value: budgetPhaseTotals.allocated, metric: 'allocated', accent: '#7C3AED' },
                { label: 'Utilized Budget', value: budgetPhaseTotals.utilized, metric: 'utilized', accent: '#F59E0B' },
              ].map((item) => {
                const isActive = item.metric === dashboardBudgetMetric
                return (
                  <div
                    key={item.label}
                    className={cn(
                      'rounded-[20px] border bg-white p-4 transition-colors dark:bg-[#1B2A41]',
                      isActive
                        ? 'border-[#286CFF] bg-[#F3F8FF] dark:border-[#4F98FF] dark:bg-[#203352]'
                        : 'border-[#DCE8F6] dark:border-white/10'
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-[#0F172A] dark:text-white">{item.label}</p>
                      {isActive && (
                        <span className="rounded-full bg-[#286CFF] px-2 py-0.5 text-[11px] font-semibold text-white">
                          Active
                        </span>
                      )}
                    </div>
                    <CurrencyAmount amount={item.value} className="mt-3 text-lg font-bold text-[#0F172A] dark:text-white" iconColor={item.accent} iconSize={15} />
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid grid-cols-1 items-stretch gap-5 xl:grid-cols-2">
        <PortfolioInsightCharts
          summary={portfolioSummary}
          chartKeys={['issues']}
          projectHrefBuilder={(projectId) => `/approver/approval-queue/${projectId}`}
        />

        <Card
          title="Cycle Workspace"
          className="overflow-hidden rounded-[28px] border-[#D9E6F5] bg-white shadow-none dark:border-white/10 dark:bg-[#162339]"
        >
          <CardContent className="flex h-full flex-col p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Send className="h-5 w-5 shrink-0 text-[#286CFF]" />
                  <h3 className="text-xl font-bold text-[#0F172A] dark:text-white">Cycle Workspace</h3>
                  <InfoHint text="A role-specific workspace showing the current cycle states and the next actions needed before DGE submission." />
                </div>
                <p className="mt-1 text-sm text-[#64748B] dark:text-slate-100">
                  Review the current cycle states before moving the portfolio forward
                </p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              {[
                { label: 'Pending with Respondent', value: respondentProjects.length, tone: '#286CFF' },
                { label: 'Pending with Reviewer', value: reviewerProjects.length, tone: '#4F98FF' },
                { label: 'Pending with Approver', value: pendingApproval, tone: '#7C3AED' },
                { label: 'Clarification', value: clarificationCount, tone: '#F97316' },
              ].map((item) => (
                <div key={item.label} className="rounded-[20px] border border-[#DCE8F6] bg-[#F3F8FF] p-4 dark:border-[#37547A] dark:bg-[#20314D]">
                  <p className="text-xs font-semibold tracking-[0.06em] text-[#64748B] dark:text-slate-100">{item.label}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.tone }} />
                    <span className="text-2xl font-bold text-[#0F172A] dark:text-[#E2E8F0]">{item.value}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-[24px] border border-dashed border-[#BED3F3] bg-white/70 p-4 dark:border-[#315389] dark:bg-white/5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EEF5FF] text-[#286CFF] dark:bg-[#286CFF]/18 dark:text-white">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-semibold text-[#0F172A] dark:text-white">Recommended Review Actions</p>
                  <p className="mt-1 text-sm leading-6 text-[#64748B] dark:text-slate-100">
                    {portfolioAlreadySubmittedToDge
                      ? 'The full portfolio has already moved to DGE. Keep monitoring downstream progress and any returned clarifications.'
                      : pendingApproval > 0
                        ? 'Approve reviewer-cleared low-risk items first, then resolve any active clarifications before assembling the final DGE package.'
                        : allProjectsApproved
                          ? 'All approver-stage work is complete. Submit the full ADGE portfolio to DGE when ready.'
                          : 'No items are pending your approval right now. Keep tracking reviewer handoffs and clarification closures for final readiness.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-auto flex flex-col gap-3 pt-5">
              <Button
                className="h-12 w-full rounded-2xl shadow-[0_16px_32px_rgba(40,108,255,0.20)]"
                disabled={submitToDgeDisabled}
                onClick={() => void handleSubmitToDge()}
              >
                Submit to DGE
                <MoveRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {clarificationCount > 0 && (
        <section>
          <Card
            title="Tracks clarifications that are currently open and blocking final approval."
            className="overflow-hidden rounded-[28px] border-[#D9E6F5] bg-white shadow-none dark:border-white/10 dark:bg-[#162339]"
          >
            <CardContent className="p-6">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <MessageSquareMore className="h-5 w-5 shrink-0 text-[#286CFF]" />
                    <h3 className="text-xl font-bold text-[#0F172A] dark:text-white">Clarification Monitor</h3>
                    <InfoHint text="A compact view of active clarification conversations that can block final approval." />
                  </div>
                  <p className="mt-1 text-sm text-[#64748B] dark:text-slate-100">Review clarification context and unblock these projects before final approval</p>
                </div>
                <span className="inline-flex items-center rounded-full bg-[#EEF5FF] px-3 py-1 text-xs font-semibold text-[#286CFE] dark:bg-[#1E3A68] dark:text-[#DBEAFE]">
                  {clarificationCount} pending
                </span>
              </div>

              <div className="space-y-3">
                {clarificationFocusProjects.map((project, index) => (
                  <Link
                    key={project.id}
                    to={`/approver/approval-queue/${project.id}`}
                    className="group block rounded-[22px] border border-[#DCE8F6] bg-white p-4 shadow-[0_8px_20px_rgba(15,23,42,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#286CFF] hover:bg-[#F8FBFF] dark:border-white/10 dark:bg-[#1B2A41] dark:hover:border-[#4F98FF] dark:hover:bg-[#203352]"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EEF5FF] text-xs font-bold text-[#286CFE] dark:bg-[#286CFE]/15 dark:text-[#BFDBFE]">
                            {index + 1}
                          </span>
                          <p className="truncate text-[15px] font-semibold text-[#0F172A] dark:text-white">{project.name}</p>
                        </div>
                        <p className="mt-2 line-clamp-2 text-sm text-[#64748B] dark:text-slate-100">
                          {getLatestClarificationMessage(project) || project.summary || `${project.strategicPriority} / ${project.classification}`}
                        </p>
                        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-[#64748B] dark:text-slate-100">
                          <span className="inline-flex items-center rounded-full bg-[#EEF5FF] px-2.5 py-1 font-semibold text-[#286CFE] dark:bg-[#286CFE]/15 dark:text-[#BFDBFE]">
                            Clarification needed
                          </span>
                          <span>{project.lastModified}</span>
                          <span>{project.workStream}</span>
                        </div>
                      </div>
                      <MoveRight className="mt-1 h-4 w-4 shrink-0 text-[#94A3B8] transition-transform group-hover:translate-x-0.5 group-hover:text-[#286CFF]" />
                    </div>
                  </Link>
                ))}
              </div>

              <div className="mt-5 flex justify-end">
                <Button variant="outline" asChild className="h-10 rounded-2xl">
                  <Link to="/approver/projects?tab=clarification">
                    View All
                    <MoveRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      {clarificationCount > 0 && (
        <section className="grid grid-cols-1 items-stretch gap-5 xl:grid-cols-2">
          <PortfolioInsightCharts
            summary={portfolioSummary}
            chartKeys={['budgetConsideration']}
            projectHrefBuilder={(projectId) => `/approver/approval-queue/${projectId}`}
          />
          <Card
            title={`${dashboardBudgetMetricLabel} distribution across approver-visible workflow stages.`}
            className="overflow-hidden rounded-[28px] border-[#D9E6F5] bg-white shadow-none dark:border-white/10 dark:bg-[#162339]"
          >
            <CardContent className="p-6">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <BadgeDollarSign className="h-5 w-5 shrink-0 text-[#286CFF]" />
                    <h3 className="text-xl font-bold text-[#0F172A] dark:text-white">Budget Queue Mix</h3>
                    <InfoHint text={`Shows how ${dashboardBudgetMetricLabel.toLowerCase()} is currently distributed across the approver-visible project workflow.`} />
                  </div>
                  <p className="mt-1 text-sm text-[#64748B] dark:text-slate-100">{dashboardBudgetMetricLabel} split across approval stages</p>
                </div>
                <span className="inline-flex items-center rounded-full bg-[#EEF5FF] px-3 py-1 text-xs font-semibold text-[#286CFF] dark:bg-[#286CFF]/18 dark:text-[#C6DBFF]">
                  Portfolio mix
                </span>
              </div>

              <BudgetQueueMixContent
                queueBudgetMix={queueBudgetMix}
                totalBudget={totalBudget}
                dashboardBudgetMetricLabel={dashboardBudgetMetricLabel}
                dashboardBudgetMetrics={dashboardBudgetMetrics}
              />
            </CardContent>
          </Card>
        </section>
      )}

      {clarificationCount > 0 ? null : (
        <section className="grid grid-cols-1 items-stretch gap-5 xl:grid-cols-2">
          <PortfolioInsightCharts
            summary={portfolioSummary}
            chartKeys={['budgetConsideration']}
            projectHrefBuilder={(projectId) => `/approver/approval-queue/${projectId}`}
          />
          <Card
            title={`${dashboardBudgetMetricLabel} distribution across approver-visible workflow stages.`}
            className="overflow-hidden rounded-[28px] border-[#D9E6F5] bg-white shadow-none dark:border-white/10 dark:bg-[#162339]"
          >
            <CardContent className="p-6">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <BadgeDollarSign className="h-5 w-5 shrink-0 text-[#286CFF]" />
                    <h3 className="text-xl font-bold text-[#0F172A] dark:text-white">Budget Queue Mix</h3>
                    <InfoHint text={`Shows how ${dashboardBudgetMetricLabel.toLowerCase()} is currently distributed across the approver-visible project workflow.`} />
                  </div>
                  <p className="mt-1 text-sm text-[#64748B] dark:text-slate-100">{dashboardBudgetMetricLabel} split across approval stages</p>
                </div>
                <span className="inline-flex items-center rounded-full bg-[#EEF5FF] px-3 py-1 text-xs font-semibold text-[#286CFF] dark:bg-[#286CFF]/18 dark:text-[#C6DBFF]">
                  Portfolio mix
                </span>
              </div>

              <BudgetQueueMixContent
                queueBudgetMix={queueBudgetMix}
                totalBudget={totalBudget}
                dashboardBudgetMetricLabel={dashboardBudgetMetricLabel}
                dashboardBudgetMetrics={dashboardBudgetMetrics}
              />
            </CardContent>
          </Card>
        </section>
      )}

    </div>
  )
}
