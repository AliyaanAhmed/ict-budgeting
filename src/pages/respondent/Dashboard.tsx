import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BadgeDollarSign,
  BrainCircuit,
  Calendar,
  ChevronDown,
  ChevronRight,
  CircleAlert,
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
import { useCycle } from '@/context/CycleContext'
import { useInstance } from '@/context/InstanceContext'
import {
  useAccountCodesBreakdown,
  useBudgetByCategoryChart,
  useStrategicPriorityCycleComparison,
} from '@/hooks/useDashboardBudgetCharts'
import { usePortfolioSummary } from '@/hooks/usePortfolioSummary'
import { useDelayedLoading } from '@/lib/useDelayedLoading'
import { dashboardPalette } from '@/lib/dashboardPalette'
import { cn } from '@/lib/utils'
import { useRoleProjects } from '@/hooks/useRoleProjects'
import { isRespondentSubmittedProjectStatus } from '@/services/projectService'
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
        {entry.payload.percent}% of requested budget
      </p>
    </div>
  )
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
          <p className="text-sm font-semibold tracking-[0.04em] text-[#64748B] dark:text-slate-100">
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
      valueClassName="break-all"
      iconColor={iconColor}
      iconSize={16}
    />
  )
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
          <p className="text-sm font-semibold tracking-[0.04em] text-[#334155] dark:text-slate-50">{title}</p>
          <div className="mt-4 flex items-end gap-3">
            <span className="text-[40px] font-bold leading-none text-[#0F172A] dark:text-white">{value}</span>
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

      <div className="mt-auto flex items-center justify-between border-t border-[#EEF3F8] pt-4 text-sm font-medium text-[#475569] dark:border-white/10 dark:text-slate-100">
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
  const { selectedCycle, cyclesData } = useCycle()
  const { instanceId, instanceDetail, instanceLoading } = useInstance()
  const { items: liveProjects, loading, error } = useRoleProjects('respondent', instanceId)
  const { summary: portfolioSummary, loading: portfolioLoading, error: portfolioError } = usePortfolioSummary('respondent', instanceId)
  const budgetByCategory = useBudgetByCategoryChart(liveProjects)
  const {
    comparisonData,
    previousCycle,
    loading: comparisonLoading,
    error: comparisonError,
  } = useStrategicPriorityCycleComparison(liveProjects, selectedCycle, cyclesData)
  const showSkeleton = useDelayedLoading(instanceLoading || loading)
  const cycleName = selectedCycle?.name ?? 'ICT Budget Planning 2026'
  const daysRemaining = computeDaysRemaining(selectedCycle?.endDate)
  const totalBudget = liveProjects.reduce((sum, project) => sum + project.requestedBudget, 0)
  const lastYearBudget = comparisonData.reduce((sum, item) => sum + item.previous, 0)
  const predictedBudget = Math.round(totalBudget * 0.803)
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
  const {
    items: accountBreakdown,
    loading: accountBreakdownLoading,
    error: accountBreakdownError,
  } = useAccountCodesBreakdown(liveProjects)
  const hasPreviousCycle = Boolean(cyclesData?.previousCycle?.id && previousCycle?.id)

  const budgetTypeGroups = [
    {
      key: 'Operational Non-Recurring',
      label: 'Operational Non-Recurring',
      accent: dashboardPalette.primary,
      bgClass: 'border-[#D8E7FF] dark:border-[#315389]',
      badgeClass: 'bg-[#DCEAFE] text-[#286CFF] dark:border dark:border-[#4D73B8] dark:bg-[#1E3A68] dark:text-[#DBEAFE]',
    },
    {
      key: 'Operational Recurring',
      label: 'Operational Recurring',
      accent: dashboardPalette.primarySoft,
      bgClass: 'border-[#DDE8FF] dark:border-[#3E5F93]',
      badgeClass: 'bg-[#EAF1FF] text-[#4F86FF] dark:border dark:border-[#5477B5] dark:bg-[#243C66] dark:text-[#D7E5FF]',
    },
    {
      key: 'New Project',
      label: 'New Project',
      accent: dashboardPalette.primaryDeep,
      bgClass: 'border-[#D3E1FF] dark:border-[#284B86]',
      badgeClass: 'bg-[#E0EAFF] text-[#1D4ED8] dark:border dark:border-[#446BB0] dark:bg-[#1D3561] dark:text-[#DCE7FF]',
    },
    {
      key: 'Project Continuation',
      label: 'Project Continuation',
      accent: dashboardPalette.primaryMuted,
      bgClass: 'border-[#E3ECFF] dark:border-[#476596]',
      badgeClass: 'bg-[#F1F6FF] text-[#6E9FFF] dark:border dark:border-[#5E76A3] dark:bg-[#2A3D5F] dark:text-[#E4EEFF]',
    },
  ] as const

  const budgetTypeBreakdown = budgetTypeGroups.map((group) => {
    const items = liveProjects.filter((project) => project.budgetType === group.key)
    const amount = items.reduce((sum, project) => sum + project.requestedBudget, 0)
    return {
      ...group,
      count: items.length,
      amount,
      share: totalBudget > 0 ? Math.round((amount / totalBudget) * 100) : 0,
    }
  })

  const requestedBudgetByStatus = [
    {
      name: 'Pending My Approval',
      value: draftProjects.reduce((sum, project) => sum + project.requestedBudget, 0),
      fill: dashboardPalette.primary,
    },
    {
      name: 'With Reviewer',
      value: reviewerStageProjects.reduce((sum, project) => sum + project.requestedBudget, 0),
      fill: dashboardPalette.primarySoft,
    },
    {
      name: 'With Approver',
      value: approverStageProjects.reduce((sum, project) => sum + project.requestedBudget, 0),
      fill: dashboardPalette.primaryDeep,
    },
    {
      name: 'Clarification Open',
      value: clarificationRequiredProjects.reduce((sum, project) => sum + project.requestedBudget, 0),
      fill: dashboardPalette.primaryMuted,
    },
    {
      name: 'Submitted to DGE',
      value: submittedToDgeProjects.reduce((sum, project) => sum + project.requestedBudget, 0),
      fill: dashboardPalette.primaryPale,
    },
  ]
    .map((item) => ({
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
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#475569] dark:text-slate-100">
              Current cycle status: respondent submissions are open, drafts are being prepared, and projects are moving through review readiness checks before governance submission.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-3 text-sm">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#D8E7FF] bg-white px-3.5 py-2 font-medium text-[#1D4ED8] shadow-[0_10px_22px_rgba(15,23,42,0.05)] dark:border-white/10 dark:bg-[#1B2A41] dark:text-[#BFDBFE]">
                <Calendar className="h-4 w-4" />
                {instanceDetail?.name ?? cycleName}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-[#D8E7FF] bg-white px-3.5 py-2 font-medium text-[#2563EB] shadow-[0_10px_22px_rgba(15,23,42,0.05)] dark:border-white/10 dark:bg-[#1B2A41] dark:text-[#DBEAFE]">
                <Radar className="h-4 w-4" />
                {daysRemaining} days remaining
              </span>
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
            title="Submitted to Review"
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
            icon={<TrendingDown className="h-5 w-5" />}
            href="/respondent/projects?tab=needs-work"
            description="Draft items still waiting for respondent updates and submit."
          />
          <ActionMetricCard
            title="Clarification Required"
            value={clarificationRequired}
            accent={dashboardPalette.aeRed}
            badge="Urgent"
            icon={<FolderOpen className="h-5 w-5" />}
            href="/respondent/projects?tab=clarification"
            description="Projects returned for clarification before review can resume."
          />
        </div>

        <Card className="h-full overflow-hidden rounded-[28px] border-[#D9E6F5] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#162339]">
          <CardContent className="p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <BadgeDollarSign className="h-5 w-5 shrink-0 text-[#286CFF]" />
                  <h3 className="text-xl font-bold text-[#0F172A] dark:text-white">Budget Snapshot</h3>
                  <InfoHint text="Consolidated budget view for the current cycle, previous-year baseline, and AI-estimated approval outlook." />
                </div>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-[22px] border border-[#DCE8F6] bg-[#F8FBFF] p-4 dark:border-white/10 dark:bg-[#1B2A41]">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold tracking-[0.06em] text-[#64748B] dark:text-slate-100">Requested Budgets</p>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#E7F5FF] text-[#286CFF] dark:bg-[#286CFF]/15">
                    <BadgeDollarSign className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-4">
                  <CompactAmount amount={totalBudget} />
                </div>
              </div>

              <div className="rounded-[22px] border border-[#DCE8F6] bg-[#F8FBFF] p-4 dark:border-white/10 dark:bg-[#1B2A41]">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold tracking-[0.06em] text-[#64748B] dark:text-slate-100">Last Year Requested</p>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#EFF6FF] text-[#4F86FF] dark:bg-[#4F86FF]/15 dark:text-[#DBEAFE]">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-4">
                  <CompactAmount amount={lastYearBudget} iconColor={dashboardPalette.primarySoft} />
                </div>
              </div>

              <div className="rounded-[22px] border border-[#DCE8F6] bg-[linear-gradient(135deg,#F8FBFF_0%,#FFFFFF_100%)] p-4 dark:border-white/10 dark:bg-[linear-gradient(135deg,#1B2A41_0%,#162339_100%)]">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold tracking-[0.06em] text-[#64748B] dark:text-slate-100">AI Predicted Approval</p>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#E7F5FF] text-[#286CFF] dark:bg-[#286CFF]/15 dark:text-[#C6DBFF]">
                    <BrainCircuit className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-4">
                  <CompactAmount amount={predictedBudget} iconColor={dashboardPalette.primary} />
                </div>
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

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
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
                          ? project.clarifications.find((item) => item.status === 'Open')?.message || project.summary
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

        <Card
          title="Requested budget distribution across your current project statuses."
          className="overflow-hidden rounded-[28px] border-[#D9E6F5] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#162339]"
        >
          <CardContent className="p-6">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <BadgeDollarSign className="h-5 w-5 shrink-0 text-[#286CFF]" />
                  <h3 className="text-xl font-bold text-[#0F172A] dark:text-white">Requested Budget Mix</h3>
                  <InfoHint text="A quick view of where your total requested budget currently sits by project status, helping respondents understand what is blocked, in review, or already approved." />
                </div>
                <p className="mt-1 text-sm text-[#64748B] dark:text-slate-100">
                  Understand where your total requested budget is currently sitting
                </p>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
              <div className="relative h-[230px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={requestedBudgetByStatus}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={58}
                      outerRadius={88}
                      paddingAngle={3}
                      strokeWidth={0}
                    >
                      {requestedBudgetByStatus.map((entry) => (
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
                {requestedBudgetByStatus.map((item) => (
                  <div key={item.name} className="rounded-[20px] border border-[#DCE8F6] bg-white p-4 shadow-[0_8px_20px_rgba(15,23,42,0.04)] dark:border-white/10 dark:bg-[#1B2A41]">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: item.fill }} />
                        <p className="text-sm font-semibold text-[#0F172A] dark:text-white">{item.name}</p>
                      </div>
                      <span className="text-xs font-semibold text-[#64748B] dark:text-slate-100">{item.percent}%</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-3 text-sm">
                      <span className="text-[#64748B] dark:text-slate-100">Requested</span>
                      <CurrencyAmount amount={item.value} className="text-sm font-semibold text-[#0F172A] dark:text-white" iconSize={13} />
                    </div>
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
            title="Shows requested budget distribution by strategic priority for the selected cycle."
            className="overflow-hidden rounded-[28px] border-[#D9E6F5] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#162339]"
          >
            <CardContent className="p-6">
              <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Layers className="h-5 w-5 shrink-0 text-[#286CFF]" />
                    <h3 className="text-xl font-bold text-[#0F172A] dark:text-white">Budget by Category</h3>
                    <InfoHint text="Shows the selected cycle requested budget grouped by strategic priority." />
                  </div>
                  <p className="mt-1 text-sm text-[#64748B] dark:text-slate-100">
                    Requested budget grouped by strategic priority
                  </p>
                </div>
              </div>
              <BudgetByCategory data={budgetByCategory} />
            </CardContent>
          </Card>
        )}
        <Card
          title="Shows which account codes are driving the largest share of your requested budget."
          className="overflow-hidden rounded-[28px] border-[#D9E6F5] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#162339]"
        >
          <CardContent className="p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <WalletCards className="h-5 w-5 shrink-0 text-[#286CFF]" />
                  <h3 className="text-xl font-bold text-[#0F172A] dark:text-white">Account Codes Breakdown</h3>
                  <InfoHint text="Highlights the account codes receiving the largest share of requested budget across your submissions." />
                </div>
                <p className="mt-1 text-sm text-[#64748B] dark:text-slate-100">
                  Most-funded budget accounts across your submissions
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
                { label: 'On Respondent', value: respondentOwned, tone: dashboardPalette.primary },
                { label: 'On Reviewer', value: submittedToReviewer, tone: dashboardPalette.primarySoft },
                { label: 'On Approver', value: submittedToApprover, tone: dashboardPalette.primaryDeep },
                { label: 'Needs Attention', value: attentionCount, tone: dashboardPalette.primaryMuted },
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

            <div className="mt-5 rounded-[24px] border border-dashed border-[#BED3F3] bg-white p-4 shadow-[0_8px_20px_rgba(15,23,42,0.04)] dark:border-[#315389] dark:bg-[#1B2A41]">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EEF5FF] text-[#286CFF] dark:bg-[#1E3A68] dark:text-[#BFDBFE]">
                  <Sparkles className="h-4.5 w-4.5" />
                </div>
                <div>
                  <p className="font-semibold text-[#0F172A] dark:text-white">Suggested Next Move</p>
                  <p className="mt-1 text-sm leading-6 text-[#64748B] dark:text-slate-100">
                    Resolve {attentionCount} draft blocker{attentionCount === 1 ? '' : 's'} first, then close the remaining clarification items that are still sitting with the respondent.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-[24px] border border-[#DCE8F6] bg-white p-4 shadow-[0_8px_20px_rgba(15,23,42,0.04)] dark:border-white/10 dark:bg-[#1B2A41]">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4.5 w-4.5 text-[var(--ai-accent)]" />
                <p className="text-xs font-semibold tracking-[0.06em] text-[var(--ai-accent)]">
                  Recommended Next Actions
                </p>
              </div>
              <div className="mt-3 grid gap-2">
                {[
                  'Review clarification replies before re-submission.',
                  'Finalize draft records that are still sitting with the respondent.',
                  'Move reviewer-ready projects forward this cycle.',
                ].map((item) => (
                  <div key={item} className="flex items-start gap-2 text-sm text-[#475569] dark:text-slate-100">
                    <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--ai-accent)]" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
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
          <Card
            title="Shows the split between new initiatives and recurring budget demand in the current cycle."
            className="overflow-hidden rounded-[28px] border-[#D9E6F5] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#162339]"
          >
            <CardContent className="p-6">
              <div className="mb-5">
                <div className="flex flex-wrap items-center gap-2">
                  <BadgeDollarSign className="h-5 w-5 shrink-0 text-[#286CFF]" />
                  <h3 className="text-xl font-bold text-[#0F172A] dark:text-white">Budget Type Distribution</h3>
                  <InfoHint text="Shows how requested budget is distributed across the four ICT budget activity types in the respondent workspace." />
                </div>
                <p className="mt-1 text-sm text-[#64748B] dark:text-slate-100">
                  Distribution of requested budget by budget type
                </p>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {budgetTypeBreakdown.map((item) => (
                    <div key={item.key} className={`rounded-[22px] border bg-white p-4 shadow-[0_8px_20px_rgba(15,23,42,0.04)] dark:bg-[#18263F] ${item.bgClass}`}>
                    <div className="flex items-center gap-3">
                      <div className={`flex h-14 w-14 items-center justify-center rounded-[18px] text-2xl font-bold ${item.badgeClass}`}>
                        {item.count}
                      </div>
                      <div>
                        <p className="text-base font-bold text-[#0F172A] dark:text-white">{item.label}</p>
                        <CurrencyAmount amount={item.amount} className="mt-1 text-lg font-bold" iconColor={item.accent} iconSize={15} />
                        <p className="mt-1 text-xs text-[#64748B] dark:text-slate-100">{item.share}% of requested total</p>
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

          <Card
            title="AI model estimate for how much of the requested budget is likely to be approved."
            className="overflow-hidden rounded-[28px] border-[#E9D5FF] bg-gradient-to-b from-[#FDF7FF] to-white shadow-[0_12px_30px_rgba(15,23,42,0.06)] dark:border-white/10 dark:from-[#2A123D] dark:to-[#1E293B]"
          >
            <CardContent className="p-6">
              <div className="flex flex-col gap-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#A855F7] text-white shadow-[0_16px_30px_rgba(168,85,247,0.24)]">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-bold text-[#0F172A] dark:text-white">AI Budget Prediction</h2>
                        <InfoHint text="AI estimates how much of the currently requested budget is likely to be approved based on approval history, risk, and project profile signals." />
                        <span className="inline-flex items-center rounded-full bg-[#FDF8FF] px-2.5 py-1 text-xs font-semibold text-[#A855F7] dark:bg-[#A855F7]/15 dark:text-[#E9D5FF]">
                          Beta
                        </span>
                    </div>
                    <p className="mt-1 text-sm leading-6 text-[#475569] dark:text-slate-100">
                      Based on budget patterns, strategic alignment, and recent approval behavior, AI predicts that{' '}
                      <CurrencyAmount
                        amount={predictedBudget}
                        className="font-semibold text-[#A855F7] dark:text-[#E9D5FF]"
                        iconColor="#A855F7"
                        iconSize={13}
                      />{' '}
                      of your requested budget is most likely to move forward.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    { label: 'Projects scanned', value: liveProjects.length },
                    { label: 'Avg confidence', value: `${confidenceScore}%` },
                    { label: 'Need attention', value: attentionCount },
                    { label: 'Approved now', value: approved },
                  ].map((item) => (
                    <div key={item.label} className="rounded-2xl border border-[#E9D5FF] bg-white/80 px-3 py-3 text-center dark:border-[#51356F] dark:bg-[#241534]">
                      <p className="text-xs font-semibold tracking-[0.06em] text-[#64748B] dark:text-slate-100">
                        {item.label}
                      </p>
                      <p className="mt-1 text-base font-bold text-[#0F172A] dark:text-[#F3E8FF]">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between text-xs font-medium text-[#A855F7] dark:text-[#E9D5FF]">
                  <span>Approval likelihood</span>
                  <span>{totalBudget > 0 ? Math.round((predictedBudget / totalBudget) * 100) : 0}%</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-white/70 dark:bg-white/10">
                  <div
                    className="h-full rounded-full bg-[#A855F7] shadow-[0_8px_24px_rgba(168,85,247,0.24)]"
                    style={{ width: `${totalBudget > 0 ? Math.round((predictedBudget / totalBudget) * 100) : 0}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}
