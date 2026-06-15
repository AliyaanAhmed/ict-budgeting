import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BadgeDollarSign,
  BrainCircuit,
  Calendar,
  CalendarClock,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  ClipboardCheck,
  Clock3,
  CopyPlus,
  FolderOpen,
  Info,
  Layers,
  MessageSquareMore,
  MoveRight,
  Radar,
  RefreshCcw,
  Scale,
  ShieldAlert,
  Sparkles,
  TrendingDown,
  TrendingUp,
  WalletCards,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { BudgetByCategory } from '@/components/charts/BudgetByCategory'
import { Button } from '@/components/ui/button'
import { AccountCodesBreakdown } from '@/components/charts/AccountCodesBreakdown'
import { Card, CardContent } from '@/components/ui/card'
import { CurrencyAmount } from '@/components/shared/CurrencyAmount'
import { AiPortfolioSummary } from '@/components/shared/AiPortfolioSummary'
import { PortfolioInsightCharts } from '@/components/shared/PortfolioInsightCharts'
import { useCycle } from '@/context/CycleContext'
import { useInstance } from '@/context/InstanceContext'
import {
  DASHBOARD_BUDGET_METRIC_LABEL,
  getDashboardBudgetMetricForInstanceStatus,
  getDashboardBudgetMetricsForInstanceStatus,
  getMetricAmountsFromProjects,
  getProjectBudgetAmount,
  useAccountCodesBreakdown,
  useBudgetByCategoryChart,
  useStrategicPriorityCycleComparison,
} from '@/hooks/useDashboardBudgetCharts'
import { usePortfolioSummary } from '@/hooks/usePortfolioSummary'
import {
  getPortfolioSummaryRoleView,
  getRoleRecommendedActions,
  resolvePortfolioTemplate,
} from '@/services/portfolioSummaryService'
import { useDelayedLoading } from '@/lib/useDelayedLoading'
import { dashboardPalette } from '@/lib/dashboardPalette'
import { cn } from '@/lib/utils'
import { useRoleProjects } from '@/hooks/useRoleProjects'
import { isRespondentSubmittedProjectStatus } from '@/services/projectService'
import { getStoredInstanceDetail } from '@/services/instanceService'
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null

  const strategicPriorityName =
    payload.find((entry: any) => typeof entry?.payload?.name === 'string')?.payload?.name ?? label

  return (
    <div className="min-w-[180px] rounded-2xl border border-[#DCE6F1] bg-white/95 p-3 shadow-[0_18px_45px_rgba(15,23,42,0.16)] backdrop-blur dark:border-white/10 dark:bg-[#10203A]/95">
      <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#64748B] dark:text-slate-100">
        Strategic Priority
      </p>
      <p className="mt-1 text-xs font-semibold text-[#0F172A] dark:text-white">{strategicPriorityName}</p>
      <div className="mt-2 space-y-1.5">
        {payload.map((entry: any) => (
          <div key={entry.dataKey} className="flex items-center justify-between gap-4 text-xs">
            <span className="inline-flex items-center gap-2 text-[#475569] dark:text-slate-100">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
              {entry.name}
            </span>
            <CurrencyAmount
              amount={entry.value as number}
              className="text-xs font-semibold text-[#0F172A] dark:text-white"
              iconSize={12}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

function formatCompactTick(value: number) {
  if (!Number.isFinite(value)) return ''

  if (Math.abs(value) >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`
  }

  if (Math.abs(value) >= 1_000) {
    return `${(value / 1_000).toFixed(0)}K`
  }

  return `${Math.round(value)}`
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
        'group overflow-hidden rounded-[24px] border bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#286CFF] hover:shadow-[0_16px_36px_rgba(15,23,42,0.08)] dark:bg-[#18263F] sm:p-5',
        className
      )}
      style={{ borderColor: `${accent}3D` }}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-base font-semibold tracking-[0.02em] text-[#0F172A] dark:text-white">
            {title}
          </p>
          <div className="mt-4 text-2xl font-bold leading-none text-[#0F172A] dark:text-white sm:text-[30px] xl:text-[32px]">
            {value}
          </div>
        </div>
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full sm:h-11 sm:w-11"
          style={{
            backgroundColor: `${accent}14`,
            color: accent,
          }}
        >
          {icon}
        </div>
      </div>
      <div className="mt-5">
        <span
          className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold"
          style={{
            backgroundColor: `${accent}14`,
            color: accent,
          }}
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
  title: string
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
        <div className="min-w-0">
          <p className="text-base font-semibold tracking-[0.02em] text-[#0F172A] dark:text-white">{title}</p>
          <div className="mt-4">
            <span className="text-[40px] font-bold leading-none text-[#0F172A] dark:text-white">{value}</span>
          </div>
          <div className="mt-3 mb-2">
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

export default function RespondentDashboard() {
  const [portfolioExpanded, setPortfolioExpanded] = useState(false)
  const [planningExpanded, setPlanningExpanded] = useState(false)
  const { selectedCycle, cyclesData } = useCycle()
  const { instanceId, instanceDetail, instanceLoading } = useInstance()
  const dashboardInstanceStatus = instanceDetail?.statuscode ?? getStoredInstanceDetail()?.statuscode ?? null
  const dashboardBudgetMetrics = useMemo(() => getDashboardBudgetMetricsForInstanceStatus(dashboardInstanceStatus), [dashboardInstanceStatus])
  const dashboardBudgetMetric = getDashboardBudgetMetricForInstanceStatus(dashboardInstanceStatus)
  const dashboardBudgetMetricLabel = DASHBOARD_BUDGET_METRIC_LABEL[dashboardBudgetMetric]
  const { items: liveProjects, loading, error } = useRoleProjects('respondent', instanceId)
  const { summary: portfolioSummary, loading: portfolioLoading, error: portfolioError } = usePortfolioSummary('respondent', instanceId)
  const budgetByCategory = useBudgetByCategoryChart(liveProjects, dashboardBudgetMetrics)
  const {
    comparisonData,
    previousCycle,
    loading: comparisonLoading,
    error: comparisonError,
  } = useStrategicPriorityCycleComparison(liveProjects, selectedCycle, cyclesData)
  const showSkeleton = useDelayedLoading(instanceLoading || loading)
  const cycleName = selectedCycle?.name ?? 'ICT Budget Planning 2026'
  const daysRemaining = computeDaysRemaining(selectedCycle?.endDate)
  const dueDateLabel = selectedCycle?.endDate
    ? new Date(selectedCycle.endDate).toLocaleDateString('en-AE', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null
  const totalBudget = liveProjects.reduce((sum, project) => sum + getProjectBudgetAmount(project, dashboardBudgetMetric), 0)
  const budgetPhaseTotals = {
    requested: liveProjects.reduce((sum, project) => sum + getProjectBudgetAmount(project, 'requested'), 0),
    recommended: liveProjects.reduce((sum, project) => sum + getProjectBudgetAmount(project, 'recommended'), 0),
    allocated: liveProjects.reduce((sum, project) => sum + getProjectBudgetAmount(project, 'allocated'), 0),
    utilized: liveProjects.reduce((sum, project) => sum + getProjectBudgetAmount(project, 'utilized'), 0),
  }
  const lastYearBudget = comparisonData.reduce((sum, item) => sum + item.previous, 0)
  const predictedBudget = liveProjects.filter((p) => p.aiScore > 70).reduce((sum, p) => sum + getProjectBudgetAmount(p, dashboardBudgetMetric), 0)
  const budgetSnapshotItems =
    dashboardBudgetMetrics.length === 1
      ? [
          { label: 'Requested Budget', amount: budgetPhaseTotals.requested, iconColor: dashboardPalette.primary },
          { label: 'Last Year Requested', amount: lastYearBudget, iconColor: dashboardPalette.primarySoft },
          { label: 'AI Predicted Approval', amount: predictedBudget, iconColor: dashboardPalette.primary },
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
        }))
  const confidenceScore = liveProjects.length > 0
    ? Math.round(liveProjects.reduce((sum, project) => sum + project.aiScore, 0) / liveProjects.length)
    : 0

  const draftProjects = liveProjects.filter((project) => project.status === 'Draft')
  const submittedToReviewerProjects = liveProjects.filter((project) => isRespondentSubmittedProjectStatus(project.status))
  const clarificationRequiredProjects = liveProjects.filter((project) => project.status === 'Clarification Required')
  const submittedToApproverProjects = liveProjects.filter((project) => project.status === 'Submitted to Approver')
  const approvedProjects = liveProjects.filter((project) => project.status === 'Approved')
  const submittedToDgeProjects = liveProjects.filter((project) => project.status === 'Submitted to DGE')
  const reviewerStageProjects = liveProjects.filter(
    (project) => project.status === 'Submitted to Reviewer' || project.status === 'Reviewer Review Completed'
  )
  const approverStageProjects = liveProjects.filter(
    (project) => project.status === 'Submitted to Approver' || project.status === 'Approved'
  )

  const submittedToReviewer = submittedToReviewerProjects.length
  const clarificationRequired = clarificationRequiredProjects.length
  const needsWork = draftProjects.length
  const submittedToApprover = submittedToApproverProjects.length
  const approved = approvedProjects.length
  const respondentOwned = draftProjects.length + clarificationRequiredProjects.length
  const attentionCount = draftProjects.length

  const clarificationProjects = useMemo(
    () =>
      [...clarificationRequiredProjects]
        .sort((a, b) => parseProjectDate(b) - parseProjectDate(a))
        .slice(0, 2),
    [clarificationRequiredProjects]
  )

  const latestBudgetProjects = useMemo(
    () =>
      [...liveProjects]
        .sort((a, b) => parseProjectDate(b) - parseProjectDate(a))
        .slice(0, 2),
    [liveProjects]
  )

  const focusProjects = clarificationProjects.length > 0 ? clarificationProjects : latestBudgetProjects
  const showClarificationPanel = clarificationProjects.length > 0
  const recommendedActions = useMemo(
    () => getRoleRecommendedActions(portfolioSummary, 'respondent'),
    [portfolioSummary]
  )
  const planningSummary = useMemo(
    () => resolvePortfolioTemplate(getPortfolioSummaryRoleView(portfolioSummary, 'respondent')?.planning_cycle_summary_template, portfolioSummary),
    [portfolioSummary]
  )
  const storedInstanceDetail = getStoredInstanceDetail()
  const planningSummaryPreview = useMemo(
    () => truncateAtWordBoundary(planningSummary || 'Current cycle status: respondent submissions are open, drafts are being prepared, and projects are moving through review readiness checks before governance submission.', 210),
    [planningSummary]
  )
  const {
    items: accountBreakdown,
    loading: accountBreakdownLoading,
    error: accountBreakdownError,
  } = useAccountCodesBreakdown(liveProjects, dashboardBudgetMetrics)
  const hasPreviousCycle = Boolean(cyclesData?.previousCycle?.id && previousCycle?.id)

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
    const items = liveProjects.filter((project) => project.budgetType === group.key)
    const amount = items.reduce((sum, project) => sum + getProjectBudgetAmount(project, dashboardBudgetMetric), 0)
    return {
      ...group,
      count: items.length,
      amount,
      amounts: getMetricAmountsFromProjects(items, dashboardBudgetMetrics),
      share: totalBudget > 0 ? Math.round((amount / totalBudget) * 100) : 0,
    }
  })

  const budgetByStatus = [
    {
      name: 'Pending My Approval',
      value: draftProjects.reduce((sum, project) => sum + getProjectBudgetAmount(project, dashboardBudgetMetric), 0),
      amounts: getMetricAmountsFromProjects(draftProjects, dashboardBudgetMetrics),
      fill: dashboardPalette.primary,
    },
    {
      name: 'With Reviewer',
      value: reviewerStageProjects.reduce((sum, project) => sum + getProjectBudgetAmount(project, dashboardBudgetMetric), 0),
      amounts: getMetricAmountsFromProjects(reviewerStageProjects, dashboardBudgetMetrics),
      fill: dashboardPalette.primarySoft,
    },
    {
      name: 'With Approver',
      value: approverStageProjects.reduce((sum, project) => sum + getProjectBudgetAmount(project, dashboardBudgetMetric), 0),
      amounts: getMetricAmountsFromProjects(approverStageProjects, dashboardBudgetMetrics),
      fill: dashboardPalette.primaryDeep,
    },
    {
      name: 'Clarification Open',
      value: clarificationRequiredProjects.reduce((sum, project) => sum + getProjectBudgetAmount(project, dashboardBudgetMetric), 0),
      amounts: getMetricAmountsFromProjects(clarificationRequiredProjects, dashboardBudgetMetrics),
      fill: dashboardPalette.primaryMuted,
    },
    {
      name: 'Submitted to DGE',
      value: submittedToDgeProjects.reduce((sum, project) => sum + getProjectBudgetAmount(project, dashboardBudgetMetric), 0),
      amounts: getMetricAmountsFromProjects(submittedToDgeProjects, dashboardBudgetMetrics),
      fill: dashboardPalette.primaryPale,
    },
  ].map((item) => ({
    ...item,
    percent: totalBudget > 0 ? Math.round((item.value / totalBudget) * 100) : 0,
  }))

  const portfolioIssues = [
    {
      title: '1 project appears to be duplicate or near-duplicate.',
      detail: 'Network Modernization Infrastructure, Network Infrastructure Upgrade',
      icon: <CopyPlus className="h-4 w-4" />,
      tone: dashboardPalette.primary,
      badge: 'Warning',
    },
    {
      title: '4 projects are high risk due to incomplete supporting evidence.',
      detail: 'Missing proposals, technical assessments, and cost backup in current submissions.',
      icon: <ShieldAlert className="h-4 w-4" />,
      tone: dashboardPalette.primaryDeep,
      badge: 'Critical',
    },
    {
      title: '1 similar project was rejected in the previous cycle.',
      detail: 'Cloud Migration Phase 2',
      icon: <Clock3 className="h-4 w-4" />,
      tone: dashboardPalette.primarySoft,
      badge: 'Warning',
    },
    {
      title: '2 projects show budget values that do not align with attached cost documents.',
      detail: 'ERP Integration Programme, On-Premise Data Center Expansion',
      icon: <Scale className="h-4 w-4" />,
      tone: dashboardPalette.primaryMuted,
      badge: 'Warning',
    },
    {
      title: '2 submissions may have weak strategic alignment justification.',
      detail: 'Mobile Workforce Solution, Cloud Migration Phase 2',
      icon: <CircleAlert className="h-4 w-4" />,
      tone: dashboardPalette.primaryInk,
      badge: 'Info',
    },
  ]

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
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
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
            <div className="mt-5 flex flex-wrap items-center gap-3 text-sm">
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
            </div>
          </div>
          <div className="flex shrink-0 lg:self-center">
            <Button asChild className="dashboard-cta-gradient h-11 w-full rounded-2xl bg-[linear-gradient(135deg,#286CFE_0%,#4F80FF_100%)] px-6 text-white shadow-[0_14px_30px_rgba(40,108,254,0.18)] hover:text-white sm:w-auto">
              <Link to="/respondent/projects/new">
                Start New Project
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 items-stretch gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(340px,0.8fr)]">
        <div className="grid h-full grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <ActionMetricCard
            title="Submitted to Reviewer"
            value={submittedToReviewer}
            accent={dashboardPalette.seaBlue}
            badge="In Review"
            icon={<Radar className="h-5 w-5" />}
            href="/respondent/projects?tab=submitted-reviewer"
            description="Projects already sent forward and now tracked in review flow."
          />
          <ActionMetricCard
            title="Needs Work / Draft"
            value={needsWork}
            accent={dashboardPalette.camelYellow}
            badge="Action Needed"
            icon={<ClipboardCheck className="h-5 w-5" />}
            href="/respondent/projects?tab=needs-work"
            description="Draft items still waiting for respondent updates and submit."
          />
          <ActionMetricCard
            title="Clarification Required"
            value={clarificationRequired}
            accent={dashboardPalette.aeRed}
            badge="Urgent"
            icon={<MessageSquareMore className="h-5 w-5" />}
            href="/respondent/projects?tab=clarification"
            description="Projects returned for clarification before review can resume."
          />
        </div>

        <Card className="h-full overflow-hidden rounded-[28px] border-[#D9E6F5] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#162339]">
          <CardContent className="flex h-full flex-col justify-center p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <BadgeDollarSign className="h-5 w-5 shrink-0 text-[#286CFF]" />
                  <h3 className="text-xl font-bold text-[#0F172A] dark:text-white">Budget Snapshot</h3>
                  <InfoHint text="Consolidated budget view for the current cycle, previous-year baseline, and AI-estimated approval outlook." />
                </div>
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
                    <div className="mt-3">
                      <CompactAmount amount={item.amount} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <AiPortfolioSummary
        role="respondent"
        summary={portfolioSummary}
        loading={portfolioLoading}
        error={portfolioError}
        projects={liveProjects}
        variant="dashboard"
        projectHrefBuilder={(projectId) => `/respondent/projects/${projectId}`}
      />

      <section className="grid grid-cols-1 items-stretch gap-5 xl:grid-cols-2">
        <Card
          title={showClarificationPanel ? 'Projects that were returned to the respondent for clarification and need response.' : 'Latest ICT budget records created by the respondent.'}
          className="overflow-hidden rounded-[28px] border-[#D9E6F5] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#162339]"
        >
          <CardContent className="p-6">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <MessageSquareMore className={cn('h-5 w-5 shrink-0', showClarificationPanel ? 'text-[#286CFE]' : 'text-[#286CFF]')} />
                  <h3 className="text-xl font-bold text-[#0F172A] dark:text-white">{showClarificationPanel ? 'Clarification Projects' : 'ICT Budgets'}</h3>
                  <InfoHint text={showClarificationPanel ? 'Projects in this list are waiting for the respondent to answer clarification comments before they can move back to review.' : 'The latest ICT budget records created in the current respondent workspace.'} />
                </div>
                <p className="mt-1 text-sm text-[#64748B] dark:text-slate-100">
                  {showClarificationPanel
                    ? 'Reply to reviewer comments and move these projects back into the pipeline'
                    : 'Open the latest ICT budgets and continue where you left off'}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {focusProjects.map((project, index) => (
                <Link
                  key={project.id}
                  to={`/respondent/projects/${project.id}`}
                  className="group block rounded-[22px] border border-[#DCE8F6] bg-white p-4 shadow-[0_8px_20px_rgba(15,23,42,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#286CFF] hover:bg-[#F8FBFF] hover:shadow-[0_12px_24px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#1B2A41] dark:hover:border-[#4F98FF] dark:hover:bg-[#203352]"
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
                        {showClarificationPanel
                          ? getLatestClarificationMessage(project) || project.summary || `${project.strategicPriority} / ${project.classification}`
                          : project.summary || `${project.strategicPriority} / ${project.classification}`}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-[#64748B] dark:text-slate-100">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-1 font-semibold ${showClarificationPanel ? 'bg-[#EEF5FF] text-[#286CFE] dark:bg-[#286CFE]/15 dark:text-[#BFDBFE]' : 'bg-[#EEF5FF] text-[#286CFF] dark:bg-[#286CFF]/15 dark:text-[#C6DBFF]'}`}>
                          {showClarificationPanel ? 'Clarification needed' : project.status}
                        </span>
                        <span>{showClarificationPanel ? project.lastModified : project.submittedDate}</span>
                        <span>{showClarificationPanel ? project.workStream : project.strategicPriority}</span>
                      </div>
                    </div>
                    <MoveRight className="mt-1 h-4 w-4 shrink-0 text-[#94A3B8] transition-transform group-hover:translate-x-0.5 group-hover:text-[#286CFF]" />
                  </div>
                </Link>
              ))}
            </div>
            <div className="mt-4">
              <Button variant="outline" asChild className="h-10 rounded-2xl">
                <Link to={showClarificationPanel ? '/respondent/projects?tab=clarification' : '/respondent/projects'}>
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
          projectHrefBuilder={(projectId) => `/respondent/projects/${projectId}`}
        />

        <Card
          title={`${dashboardBudgetMetricLabel} distribution across your current project statuses.`}
          className="hidden overflow-hidden rounded-[28px] border-[#D9E6F5] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#162339]"
        >
          <CardContent className="p-6">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <BadgeDollarSign className="h-5 w-5 shrink-0 text-[#286CFF]" />
                  <h3 className="text-xl font-bold text-[#0F172A] dark:text-white">Budget Queue Mix</h3>
                  <InfoHint text={`A quick view of where your total ${dashboardBudgetMetricLabel.toLowerCase()} currently sits by project status, helping respondents understand what is blocked, in review, or already approved.`} />
                </div>
                <p className="mt-1 text-sm text-[#64748B] dark:text-slate-100">
                  Understand where your total {dashboardBudgetMetricLabel.toLowerCase()} is currently sitting
                </p>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
              <div className="relative h-[230px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={budgetByStatus}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={58}
                      outerRadius={88}
                      paddingAngle={3}
                      strokeWidth={0}
                    >
                      {budgetByStatus.map((entry) => (
                        <Cell key={entry.name} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xs font-semibold tracking-[0.06em] text-[#64748B] dark:text-slate-100">Total</span>
                  <CurrencyAmount amount={totalBudget} className="mt-1 text-2xl font-bold text-[#0F172A] dark:text-white" iconSize={15} />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {budgetByStatus.map((item) => (
                  <div key={item.name} className="rounded-[20px] border border-[#DCE8F6] bg-white p-4 shadow-[0_8px_20px_rgba(15,23,42,0.04)] dark:border-white/10 dark:bg-[#1B2A41]">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: item.fill }} />
                        <p className="text-sm font-semibold text-[#0F172A] dark:text-white">{item.name}</p>
                      </div>
                      <span className="text-xs font-semibold text-[#64748B] dark:text-slate-100">{item.percent}%</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-3 text-sm">
                      <span className="text-[#64748B] dark:text-slate-100">{dashboardBudgetMetricLabel}</span>
                      <CurrencyAmount amount={item.value} className="text-sm font-semibold text-[#0F172A] dark:text-white" iconSize={13} />
                    </div>
                    {dashboardBudgetMetrics.length > 1 && (
                      <div className="mt-3 grid gap-2">
                        {dashboardBudgetMetrics.map((metric) => (
                          <div key={metric} className="flex items-center justify-between gap-3 rounded-2xl bg-[#F8FAFC] px-3 py-2 text-sm dark:bg-white/5">
                            <span className="text-[#64748B] dark:text-slate-300">{DASHBOARD_BUDGET_METRIC_LABEL[metric]}</span>
                            <CurrencyAmount amount={item.amounts?.[metric] ?? 0} className="text-sm font-semibold text-[#0F172A] dark:text-white" iconSize={12} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        {hasPreviousCycle ? (
          <Card
            title="Compare the selected cycle against the immediately previous cycle across strategic priorities."
            className="overflow-hidden rounded-[28px] border-[#D9E6F5] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#162339]"
          >
            <CardContent className="p-6">
              <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-xl font-bold text-[#0F172A] dark:text-white">
                      Selected vs Previous Year
                    </h3>
                    <InfoHint text="Compares the selected cycle strategic-priority budgets against the immediately previous cycle for the same respondent entity." />
                  </div>
                  <p className="mt-1 text-sm text-[#64748B] dark:text-slate-100">
                    Budget request comparison by strategic priority
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs text-[#64748B] dark:text-slate-100">
                  <span className="inline-flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#286CFF]" />
                    {selectedCycle?.name ?? 'Selected Cycle'}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#93C5FD]" />
                    {previousCycle?.name ?? 'Previous Cycle'}
                  </span>
                </div>
              </div>
              {comparisonLoading ? (
                <div className="h-[320px] animate-pulse rounded-[20px] border border-[#DCE8F6] bg-[#F8FAFC] dark:border-white/10 dark:bg-white/5" />
              ) : comparisonError ? (
                <div className="rounded-[20px] border border-[#FFD4D1] bg-[#FFF5F5] px-4 py-3 text-sm text-[#B42318] dark:border-[#7F1D1D] dark:bg-[#3B0D0D] dark:text-[#FECACA]">
                  {comparisonError}
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={comparisonData} margin={{ top: 8, right: 10, left: 12, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.18)" vertical={false} />
                    <XAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#94A3B8' }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={formatCompactTick}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend />
                    <Bar
                      dataKey="current"
                      name={selectedCycle?.name ?? 'Selected Cycle'}
                      radius={[8, 8, 0, 0]}
                      fill="#286CFF"
                      maxBarSize={28}
                    />
                    <Bar
                      dataKey="previous"
                      name={previousCycle?.name ?? 'Previous Cycle'}
                      radius={[8, 8, 0, 0]}
                      fill="#93C5FD"
                      maxBarSize={28}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card
            title={`Shows ${dashboardBudgetMetricLabel.toLowerCase()} distribution by strategic priority for the selected cycle.`}
            className="overflow-hidden rounded-[28px] border-[#D9E6F5] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#162339]"
          >
            <CardContent className="p-6">
              <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Layers className="h-5 w-5 shrink-0 text-[#286CFF]" />
                    <h3 className="text-xl font-bold text-[#0F172A] dark:text-white">Budget by Strategic Priority</h3>
                    <InfoHint text={`Shows the selected cycle ${dashboardBudgetMetricLabel.toLowerCase()} grouped by strategic priority.`} />
                  </div>
                  <p className="mt-1 text-sm text-[#64748B] dark:text-slate-100">
                    {dashboardBudgetMetricLabel} grouped by strategic priority
                  </p>
                </div>
              </div>
              <BudgetByCategory data={budgetByCategory} metrics={dashboardBudgetMetrics} />
            </CardContent>
          </Card>
        )}
        <Card
          title={`Shows which account codes are driving the largest share of your ${dashboardBudgetMetricLabel.toLowerCase()}.`}
          className="overflow-hidden rounded-[28px] border-[#D9E6F5] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#162339]"
        >
          <CardContent className="p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <WalletCards className="h-5 w-5 shrink-0 text-[#286CFF]" />
                  <h3 className="text-xl font-bold text-[#0F172A] dark:text-white">Account Codes Breakdown</h3>
                  <InfoHint text={`Highlights the account codes receiving the largest share of ${dashboardBudgetMetricLabel.toLowerCase()} across your submissions.`} />
                </div>
                <p className="mt-1 text-sm text-[#64748B] dark:text-slate-100">
                  Most-funded accounts by {dashboardBudgetMetricLabel.toLowerCase()}
                </p>
              </div>
              <span className="inline-flex items-center rounded-full bg-[#EEF5FF] px-3 py-1 text-xs font-semibold text-[#286CFF] dark:bg-[#286CFF]/15 dark:text-[#C6DBFF]">
                Top 5 accounts
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
      </section>

      <section className="grid grid-cols-1 items-stretch gap-5 xl:grid-cols-[1fr_1fr]">
        <Card
          title="Quick access to active submission states and the next actions you should take in Projects."
          className="overflow-hidden rounded-[28px] border-[#D9E6F5] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#162339]"
        >
          <CardContent className="flex h-full flex-col p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <FolderOpen className="h-5 w-5 shrink-0 text-[#286CFF]" />
                  <h3 className="text-xl font-bold text-[#0F172A] dark:text-white">Projects Workspace</h3>
                  <InfoHint text="This workspace brings respondent-owned statuses together and points you toward the next best actions in the Projects area." />
                </div>
                <p className="mt-1 text-sm text-[#64748B] dark:text-slate-100">
                  Jump into the full projects page to continue edits, resolve clarifications, and prepare submissions.
                </p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              {[ 
                { label: 'Pending with Respondent', value: respondentOwned, tone: dashboardPalette.primary },
                { label: 'Pending with Reviewer', value: submittedToReviewer, tone: dashboardPalette.primarySoft },
                { label: 'Pending with Approver', value: submittedToApprover, tone: dashboardPalette.primaryDeep },
                { label: 'Clarification', value: clarificationRequired, tone: dashboardPalette.primaryMuted },
              ].map((item) => (
                <div key={item.label} className="rounded-[20px] border border-[#DCE8F6] bg-white p-4 shadow-[0_8px_20px_rgba(15,23,42,0.04)] dark:border-white/10 dark:bg-[#1B2A41]">
                  <p className="text-xs font-semibold tracking-[0.06em] text-[#64748B] dark:text-slate-100">
                    {item.label}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.tone }} />
                    <span className="text-2xl font-bold text-[#0F172A] dark:text-white">{item.value}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-[24px] border border-[#DCE8F6] bg-white p-4 shadow-[0_8px_20px_rgba(15,23,42,0.04)] dark:border-white/10 dark:bg-[#1B2A41]">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4.5 w-4.5 text-[#A855F7] dark:text-[#E9D5FF]" />
                <p className="text-sm font-semibold text-[#A855F7] dark:text-[#E9D5FF]">
                  Recommended Review Actions
                </p>
              </div>
              <ul className="mt-3 space-y-2">
                {(recommendedActions.length > 0
                  ? recommendedActions.slice(0, 3)
                  : [
                      'Review clarification replies before re-submission.',
                      'Finalize draft records that are still sitting with the respondent.',
                      'Move reviewer-ready projects forward this cycle.',
                    ]
                ).map((item) => (
                  <li key={item} className="ml-5 list-disc text-sm leading-6 text-[#475569] dark:text-slate-100">
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-auto pt-5">
              <Button asChild className="h-12 w-full rounded-2xl shadow-none">
                <Link to="/respondent/projects">
                  View All Projects
                  <MoveRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid h-full gap-5">
          <PortfolioInsightCharts
            summary={portfolioSummary}
            chartKeys={['budgetConsideration']}
            projectHrefBuilder={(projectId) => `/respondent/projects/${projectId}`}
          />
          <Card
            title="Shows the split between new initiatives and recurring budget demand in the current cycle."
            className="hidden overflow-hidden rounded-[28px] border-[#D9E6F5] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#162339]"
          >
            <CardContent className="p-6">
              <div className="mb-5">
                <div className="flex flex-wrap items-center gap-2">
                  <BadgeDollarSign className="h-5 w-5 shrink-0 text-[#286CFF]" />
                  <h3 className="text-xl font-bold text-[#0F172A] dark:text-white">Budget Type Distribution</h3>
                  <InfoHint text={`Shows how ${dashboardBudgetMetricLabel.toLowerCase()} is distributed across the four ICT budget activity types in the respondent workspace.`} />
                </div>
                <p className="mt-1 text-sm text-[#64748B] dark:text-slate-100">
                  Distribution of {dashboardBudgetMetricLabel.toLowerCase()} by budget type
                </p>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2" style={{marginTop: 50}}>
                {budgetTypeBreakdown.map((item) => (
                    <div key={item.key} className={`rounded-[22px] border bg-white p-4 shadow-[0_8px_20px_rgba(15,23,42,0.04)] dark:bg-[#18263F] ${item.bgClass}`}>
                    <div className="flex items-center gap-3">
                      <div className={`flex h-14 w-14 items-center justify-center rounded-[18px] text-2xl font-bold ${item.badgeClass}`}>
                        {item.count}
                      </div>
                      <div>
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
            </CardContent>
          </Card>

        </div>
      </section>

      <section className="grid grid-cols-1 items-stretch gap-5 xl:grid-cols-2">
        <Card
          title="Shows the split between new initiatives and recurring budget demand in the current cycle."
          className="overflow-hidden rounded-[28px] border-[#D9E6F5] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#162339]"
        >
          <CardContent className="p-6">
            <div className="mb-5">
              <div className="flex flex-wrap items-center gap-2">
                <BadgeDollarSign className="h-5 w-5 shrink-0 text-[#286CFF]" />
                <h3 className="text-xl font-bold text-[#0F172A] dark:text-white">Budget Type Distribution</h3>
                <InfoHint text={`Shows how ${dashboardBudgetMetricLabel.toLowerCase()} is distributed across the four ICT budget activity types in the respondent workspace.`} />
              </div>
              <p className="mt-1 text-sm text-[#64748B] dark:text-slate-100">
                Distribution of {dashboardBudgetMetricLabel.toLowerCase()} by budget type
              </p>
            </div>
            <div className="mx-auto mt-12 max-w-2xl">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {budgetTypeBreakdown.map((item) => (
                  <div key={item.key} className={`rounded-[22px] border bg-white p-4 shadow-[0_8px_20px_rgba(15,23,42,0.04)] dark:bg-[#18263F] ${item.bgClass}`}>
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
        <PortfolioInsightCharts
          summary={portfolioSummary}
          chartKeys={['issues']}
          projectHrefBuilder={(projectId) => `/respondent/projects/${projectId}`}
        />
      </section>
    </div>
  )
}

function PieTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const entry = payload[0]
  return (
    <div className="min-w-[170px] rounded-2xl border border-[#DCE6F1] bg-white/95 p-3 shadow-[0_18px_45px_rgba(15,23,42,0.14)] backdrop-blur dark:border-white/10 dark:bg-[#10203A]/95">
      <p className="text-xs font-semibold text-[#0F172A] dark:text-white">{entry.name}</p>
      <CurrencyAmount
        amount={entry.value as number}
        className="mt-1 text-xs text-[#64748B] dark:text-slate-100"
        iconSize={12}
        iconColor={entry.payload.fill}
      />
      <p className="mt-1 text-xs font-semibold" style={{ color: entry.payload.fill }}>
        {entry.payload.percent}% of portfolio budget
      </p>
    </div>
  )
}
