import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BadgeDollarSign,
  Bot,
  BrainCircuit,
  Calendar,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  Clock3,
  CopyPlus,
  FolderOpen,
  Info,
  MessageSquareMore,
  MoveRight,
  Radar,
  RefreshCcw,
  Scale,
  ShieldAlert,
  Sparkles,
  TrendingDown,
  TrendingUp,
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
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CurrencyAmount } from '@/components/shared/CurrencyAmount'
import { projects as mockProjects } from '@/data/db'
import { useCycle } from '@/context/CycleContext'
import { useInstance } from '@/context/InstanceContext'
import { useDelayedLoading } from '@/lib/useDelayedLoading'
import { dashboardPalette, dashboardStatusColors } from '@/lib/dashboardPalette'
import { cn } from '@/lib/utils'
import { useRoleProjects } from '@/hooks/useRoleProjects'

const YEAR_COMPARISON_FACTORS = [0.88, 0.94, 0.81, 0.9, 0.86, 0.78]
const BREAKDOWN_COLORS = ['#8B5CF6', '#22C55E', '#286CFF', '#F59E0B', '#EC4899']

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null

  return (
    <div className="min-w-[180px] rounded-2xl border border-[#DCE6F1] bg-white/95 p-3 shadow-[0_18px_45px_rgba(15,23,42,0.16)] backdrop-blur dark:border-white/10 dark:bg-[#10203A]/95">
      <p className="text-xs font-semibold text-[#0F172A] dark:text-white">{label}</p>
      <div className="mt-2 space-y-1.5">
        {payload.map((entry: any) => (
          <div key={entry.dataKey} className="flex items-center justify-between gap-4 text-xs">
            <span className="inline-flex items-center gap-2 text-[#475569] dark:text-slate-100">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
              {entry.name}
            </span>
            <CurrencyAmount
              amount={(entry.value as number) * 1_000_000}
              className="text-xs font-semibold text-[#0F172A] dark:text-white"
              iconSize={12}
            />
          </div>
        ))}
      </div>
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
        'group overflow-hidden rounded-[24px] border bg-white p-4 shadow-none transition-all duration-300 hover:-translate-y-0.5 hover:border-[#286CFF] hover:shadow-none dark:bg-[#18263F] sm:p-5',
        className
      )}
      style={{ borderColor: `${accent}3D`, boxShadow: 'none' }}
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
  return <CurrencyAmount amount={amount} className="text-2xl font-bold leading-none sm:text-[30px] xl:text-[32px]" iconColor={iconColor} iconSize={18} />
}

function ActionMetricCard({
  title,
  value,
  accent,
  badge,
  icon,
  href,
}: {
  title: string
  value: number
  accent: string
  badge: string
  icon: React.ReactNode
  href: string
}) {
  return (
    <Link
      to={href}
      className="group flex h-full flex-col overflow-hidden rounded-[24px] border bg-white px-4 py-5 shadow-none transition-all duration-300 hover:-translate-y-0.5 hover:border-[#286CFF] hover:bg-[#F8FBFF] dark:bg-[#18263F] sm:px-5 sm:py-6"
      style={{ borderColor: `${accent}3D`, boxShadow: 'none' }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold tracking-[0.04em] text-[#334155] dark:text-slate-50">{title}</p>
          <div className="mt-4 flex items-end gap-3">
            <span className="text-3xl font-bold leading-none text-[#0F172A] dark:text-white">{value}</span>
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
      <div className="mt-3 text-sm text-[#64748B] dark:text-slate-100">
        Open related projects and continue the next workflow step.
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
  const { selectedCycle } = useCycle()
  const { instanceId, instanceDetail, instanceLoading } = useInstance()
  const { items: liveProjects, loading, error } = useRoleProjects('respondent', instanceId)
  const showSkeleton = useDelayedLoading(instanceLoading || loading)
  const cycleName = selectedCycle?.name ?? 'ICT Budget Planning 2026'
  const daysRemaining = computeDaysRemaining(selectedCycle?.endDate)
  const mockTotalBudget = mockProjects.reduce((sum, project) => sum + project.requestedBudget, 0)
  const totalBudget = liveProjects.reduce((sum, project) => sum + project.requestedBudget, 0)
  const lastYearBudget = 0
  const predictedBudget = Math.round(totalBudget * 0.803)
  const confidenceScore = liveProjects.length > 0
    ? Math.round(liveProjects.reduce((sum, project) => sum + project.aiScore, 0) / liveProjects.length)
    : 0

  const draftProjects = liveProjects.filter((project) => project.status === 'Draft')
  const submittedToReviewerProjects = liveProjects.filter((project) => project.status === 'Submitted to Reviewer')
  const clarificationRequiredProjects = liveProjects.filter((project) => project.status === 'Clarification Required')
  const submittedToApproverProjects = liveProjects.filter((project) => project.status === 'Submitted to Approver')
  const approvedProjects = liveProjects.filter((project) => project.status === 'Approved')

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

  const budgetTypeGroups = [
    {
      key: 'Operational Non-Recurring',
      label: 'Operational Non-Recurring',
      accent: '#D97706',
      bgClass: 'border-[#F6E4B4] dark:border-[#5E4C1E]',
      badgeClass: 'bg-[#FFF3D9] text-[#D97706] dark:bg-[#D97706]/18 dark:text-[#FCD34D]',
    },
    {
      key: 'Operational Recurring',
      label: 'Operational Recurring',
      accent: '#16A34A',
      bgClass: 'border-[#CDEFD7] dark:border-[#29583C]',
      badgeClass: 'bg-[#DCFCE7] text-[#16A34A] dark:bg-[#16A34A]/18 dark:text-[#BBF7D0]',
    },
    {
      key: 'New Project',
      label: 'New Project',
      accent: '#286CFF',
      bgClass: 'border-[#D8E7FF] dark:border-[#315389]',
      badgeClass: 'bg-[#DCEAFE] text-[#286CFF] dark:bg-[#286CFF]/18 dark:text-white',
    },
    {
      key: 'Project Continuation',
      label: 'Project Continuation',
      accent: '#7C3AED',
      bgClass: 'border-[#E9D5FF] dark:border-[#52307A]',
      badgeClass: 'bg-[#F3E8FF] text-[#7C3AED] dark:bg-[#7C3AED]/18 dark:text-[#E9D5FF]',
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

  const comparisonData = Array.from(
    mockProjects.reduce((acc, project) => {
      const existing = acc.get(project.strategicPriority)
      if (existing) {
        existing.current += project.requestedBudget / 1_000_000
        return acc
      }

      const index = acc.size
      acc.set(project.strategicPriority, {
        name: project.strategicPriority,
        current: project.requestedBudget / 1_000_000,
        previous: (project.requestedBudget / 1_000_000) * YEAR_COMPARISON_FACTORS[index % YEAR_COMPARISON_FACTORS.length],
      })
      return acc
    }, new Map<string, { name: string; current: number; previous: number }>())
  ).map(([, value]) => ({
    ...value,
    previous: Number(value.previous.toFixed(1)),
    current: Number(value.current.toFixed(1)),
  }))

  const accountBreakdown = Array.from(
    mockProjects
      .flatMap((project) => project.budgetItems)
      .reduce((acc, item) => {
        const existing = acc.get(item.accountName)
        if (existing) {
          existing.amount += item.budgetRequested
          return acc
        }

        acc.set(item.accountName, {
          name: item.accountName,
          type: item.classification,
          amount: item.budgetRequested,
        })
        return acc
      }, new Map<string, { name: string; type: 'CapEx' | 'OpEx'; amount: number }>())
  )
    .sort((a, b) => b[1].amount - a[1].amount)
    .slice(0, 5)
    .map(([, item], index) => ({
      ...item,
      pct: Math.round((item.amount / mockTotalBudget) * 100),
      color: BREAKDOWN_COLORS[index % BREAKDOWN_COLORS.length],
    }))

  const requestedBudgetByStatus = [
    {
      name: 'With Reviewer',
      value: submittedToReviewerProjects.reduce((sum, project) => sum + project.requestedBudget, 0),
      fill: dashboardStatusColors.withReviewer,
    },
    {
      name: 'Clarification',
      value: clarificationRequiredProjects.reduce((sum, project) => sum + project.requestedBudget, 0),
      fill: dashboardStatusColors.clarification,
    },
    {
      name: 'Needs Work',
      value: draftProjects.reduce((sum, project) => sum + project.requestedBudget, 0),
      fill: dashboardStatusColors.needsWork,
    },
    {
      name: 'With Approver',
      value: submittedToApproverProjects.reduce((sum, project) => sum + project.requestedBudget, 0),
      fill: dashboardStatusColors.withApprover,
    },
    {
      name: 'Approved',
      value: approvedProjects.reduce((sum, project) => sum + project.requestedBudget, 0),
      fill: dashboardStatusColors.approved,
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
      tone: '#F59E0B',
      badge: 'Warning',
    },
    {
      title: '4 projects are high risk due to incomplete supporting evidence.',
      detail: 'Missing proposals, technical assessments, and cost backup in current submissions.',
      icon: <ShieldAlert className="h-4 w-4" />,
      tone: '#EF4444',
      badge: 'Critical',
    },
    {
      title: '1 similar project was rejected in the previous cycle.',
      detail: 'Cloud Migration Phase 2',
      icon: <Clock3 className="h-4 w-4" />,
      tone: '#F59E0B',
      badge: 'Warning',
    },
    {
      title: '2 projects show budget values that do not align with attached cost documents.',
      detail: 'ERP Integration Programme, On-Premise Data Center Expansion',
      icon: <Scale className="h-4 w-4" />,
      tone: '#F59E0B',
      badge: 'Warning',
    },
    {
      title: '2 submissions may have weak strategic alignment justification.',
      detail: 'Mobile Workforce Solution, Cloud Migration Phase 2',
      icon: <CircleAlert className="h-4 w-4" />,
      tone: '#286CFF',
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
      <section className="relative overflow-hidden rounded-[30px] border border-[#D7E4F4] bg-[linear-gradient(135deg,#F8FBFF_0%,#EEF5FF_45%,#FFFFFF_100%)] p-6 shadow-none dark:border-white/10 dark:bg-[linear-gradient(135deg,#0F172A_0%,#16263E_52%,#102946_100%)]">
        <div className="absolute -left-10 top-0 h-36 w-36 rounded-full bg-[#286CFF]/10 blur-3xl dark:bg-[#286CFF]/20" />
        <div className="absolute right-0 top-8 h-40 w-40 rounded-full bg-[#22C55E]/10 blur-3xl dark:bg-[#22C55E]/10" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#CFE0FF] bg-white/75 px-3 py-1 text-xs font-semibold text-[#286CFF] backdrop-blur dark:border-[#4F98FF]/30 dark:bg-white/5 dark:text-[#9FC4FF]">
              <Sparkles className="h-3.5 w-3.5" />
              Respondent Workspace
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-[#0F172A] dark:text-white">
              {cycleName}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#475569] dark:text-slate-100">
              Current cycle status: respondent submissions are open, drafts are being prepared, and projects are moving through review readiness checks before governance submission.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-3 text-sm">
              <span className="inline-flex items-center gap-2 rounded-full bg-[#E7F5FF] px-3 py-1.5 font-medium text-[#286CFF] dark:bg-[#286CFF]/15 dark:text-[#C6DBFF]">
                <Calendar className="h-4 w-4" />
                {instanceDetail?.name ?? cycleName}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-[#F3FAF4] px-3 py-1.5 font-medium text-[#2C7A43] dark:bg-[#22C55E]/15 dark:text-[#C9F4D1]">
                <Radar className="h-4 w-4" />
                {daysRemaining} days remaining
              </span>
            </div>
          </div>
          <div className="flex shrink-0 lg:self-center">
            <Button asChild className="h-11 w-full rounded-2xl px-6 shadow-[0_14px_30px_rgba(40,108,255,0.22)] sm:w-auto">
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
          />
          <ActionMetricCard
            title="Needs Work / Draft"
            value={needsWork}
            accent={dashboardPalette.camelYellow}
            badge="Action Needed"
            icon={<TrendingDown className="h-5 w-5" />}
            href="/respondent/projects?tab=needs-work"
          />
          <ActionMetricCard
            title="Clarification Required"
            value={clarificationRequired}
            accent={dashboardPalette.aeRed}
            badge="Urgent"
            icon={<FolderOpen className="h-5 w-5" />}
            href="/respondent/projects?tab=clarification"
          />
        </div>

        <Card className="h-full overflow-hidden rounded-[28px] border-[#D9E6F5] bg-white shadow-none dark:border-white/10 dark:bg-[#162339]">
          <CardContent className="p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-xl font-bold text-[#0F172A] dark:text-white">Budget Snapshot</h3>
                  <InfoHint text="Consolidated budget view for the current cycle, previous-year baseline, and AI-estimated approval outlook." />
                </div>
                <p className="mt-1 text-sm text-[#64748B] dark:text-slate-100">
                  Informational metrics for planning context and approval outlook
                </p>
              </div>
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#E7F5FF] text-[#286CFF] dark:bg-[#286CFF]/15 dark:text-white">
                <BadgeDollarSign className="h-5 w-5" />
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-[22px] border border-[#DCE8F6] bg-[#F8FBFF] p-4 shadow-none dark:border-white/10 dark:bg-[#1B2A41]">
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

              <div className="rounded-[22px] border border-[#DCE8F6] bg-[#F8FBFF] p-4 shadow-none dark:border-white/10 dark:bg-[#1B2A41]">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold tracking-[0.06em] text-[#64748B] dark:text-slate-100">Last Year Requested</p>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#EEF3F8] text-[#64748B] dark:bg-white/10 dark:text-slate-100">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-4">
                  <CompactAmount amount={lastYearBudget} iconColor={dashboardPalette.slate} />
                </div>
              </div>

              <div className="rounded-[22px] border border-[#DCE8F6] bg-[linear-gradient(135deg,#F6FBF9_0%,#FFFFFF_100%)] p-4 shadow-none dark:border-white/10 dark:bg-[#1B2A41]">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold tracking-[0.06em] text-[#64748B] dark:text-slate-100">AI Predicted Approval</p>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#E8F8F3] text-[#0F9D7A] dark:bg-[#0F9D7A]/15 dark:text-[#9CE7D4]">
                    <BrainCircuit className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-4">
                  <CompactAmount amount={predictedBudget} iconColor="#0F9D7A" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section
        title="AI summary of portfolio-wide risks, confidence, and recommended cleanup before submission."
        className="overflow-hidden rounded-[28px] border border-[#F6C9CF] bg-[linear-gradient(135deg,#FFF8FA_0%,#FFF9F6_100%)] shadow-none dark:border-[#5D3240] dark:bg-[linear-gradient(135deg,#26131C_0%,#1E2438_100%)]"
      >
        <button
          type="button"
          onClick={() => setPortfolioExpanded((value) => !value)}
          className="flex w-full items-start justify-between gap-4 px-6 py-5 text-left transition-colors hover:bg-white/30 dark:hover:bg-white/5"
        >
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#7C3AED_0%,#9333EA_100%)] text-white shadow-[0_16px_30px_rgba(124,58,237,0.28)]">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold text-[#0F172A] dark:text-white">AI Portfolio Summary</h2>
                <InfoHint text="AI reviews portfolio-wide risk patterns, duplicate signals, document gaps, and strategic alignment concerns before respondent submissions move forward." />
                <span className="inline-flex items-center rounded-full bg-[#FFF1F2] px-2.5 py-1 text-xs font-semibold text-[#DC2626] dark:bg-[#DC2626]/15 dark:text-[#FCA5A5]">
                  High Portfolio Risk
                </span>
              </div>
              <p className="mt-1 text-sm text-[#475569] dark:text-slate-100">
                Portfolio status: High risk. {respondentOwned} projects are currently with the respondent, and {attentionCount} draft item{attentionCount === 1 ? '' : 's'} still need attention before submission to DGE.
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-4">
            <div className="hidden items-center gap-4 text-sm md:flex">
              <span className="text-[#0F172A] dark:text-white">
                {liveProjects.length} <span className="text-[#64748B] dark:text-slate-100">projects</span>
              </span>
              <span className="text-[#286CFF] dark:text-[#C6DBFF]">
                {confidenceScore}% <span className="text-[#64748B] dark:text-slate-100">avg confidence</span>
              </span>
              <span className="text-[#F59E0B] dark:text-[#FCD34D]">
                {attentionCount} <span className="text-[#64748B] dark:text-slate-100">need attention</span>
              </span>
              <RefreshCcw className="h-4 w-4 text-[#64748B] dark:text-slate-100" />
            </div>
            <ChevronDown
              className={cn('h-5 w-5 text-[#64748B] transition-transform dark:text-slate-100', portfolioExpanded && 'rotate-180')}
            />
          </div>
        </button>
        {portfolioExpanded && (
          <div className="border-t border-[#F3D8DD] px-6 pb-6 pt-5 dark:border-white/10">
            <div className="space-y-3">
              {portfolioIssues.map((issue) => (
                <div
                  key={issue.title}
                  className="flex items-start justify-between gap-4 rounded-[22px] border border-white/80 bg-white/70 px-4 py-4 shadow-[0_10px_25px_rgba(15,23,42,0.04)] dark:border-white/10 dark:bg-white/5"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl"
                      style={{ backgroundColor: `${issue.tone}14`, color: issue.tone }}
                    >
                      {issue.icon}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#0F172A] dark:text-white">{issue.title}</p>
                      <p className="mt-1 text-sm text-[#64748B] dark:text-slate-100">{issue.detail}</p>
                    </div>
                  </div>
                  <span
                    className="inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-semibold"
                    style={{ backgroundColor: `${issue.tone}14`, color: issue.tone }}
                  >
                    {issue.badge}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-5 border-t border-[#F3D8DD] pt-5 dark:border-white/10">
              <p className="text-xs font-semibold tracking-[0.06em] text-[#7C3AED] dark:text-[#DAC0FF]">
                Recommended Next Actions
              </p>
              <div className="mt-3 grid gap-2 text-sm text-[#475569] dark:text-slate-100">
                {[
                  'Review duplicate-suspect items before submission.',
                  'Strengthen document support for high-value projects.',
                  'Review rejection reasons and address concerns before resubmission.',
                  'Verify budget breakdowns match supporting documentation.',
                ].map((item) => (
                  <div key={item} className="flex items-start gap-2">
                    <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#7C3AED] dark:text-[#DAC0FF]" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-2 [&_*]:shadow-none">
        <Card
          title={showClarificationPanel ? 'Projects that were returned to the respondent for clarification and need response.' : 'Latest ICT budget records created by the respondent.'}
          className="overflow-hidden rounded-[28px] border-[#D9E6F5] bg-white shadow-none dark:border-white/10 dark:bg-[#162339]"
        >
          <CardContent className="p-6">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-xl font-bold text-[#0F172A] dark:text-white">{showClarificationPanel ? 'Clarification Projects' : 'ICT Budgets'}</h3>
                  <InfoHint text={showClarificationPanel ? 'Projects in this list are waiting for the respondent to answer clarification comments before they can move back to review.' : 'The latest ICT budget records created in the current respondent workspace.'} />
                </div>
                <p className="mt-1 text-sm text-[#64748B] dark:text-slate-100">
                  {showClarificationPanel
                    ? 'Reply to reviewer comments and move these projects back into the pipeline'
                    : 'Open the latest ICT budgets and continue where you left off'}
                </p>
              </div>
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${showClarificationPanel ? 'bg-[#F59E0B]/12 text-[#F59E0B] dark:bg-[#F59E0B]/18 dark:text-[#FCD34D]' : 'bg-[#286CFF]/12 text-[#286CFF] dark:bg-[#286CFF]/18 dark:text-[#9FC4FF]'}`}>
                <MessageSquareMore className="h-5 w-5" />
              </div>
            </div>

            <div className="space-y-3">
              {focusProjects.map((project, index) => (
                <Link
                  key={project.id}
                  to={`/respondent/projects/${project.id}`}
                  className="group block rounded-[22px] border border-[#DCE8F6] bg-white p-4 shadow-none transition-all duration-200 hover:-translate-y-0.5 hover:border-[#286CFF] hover:bg-[#F8FBFF] hover:shadow-none dark:border-white/10 dark:bg-[#1B2A41] dark:hover:border-[#4F98FF] dark:hover:bg-[#203352]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#FFF4E5] text-xs font-bold text-[#D97706] dark:bg-[#D97706]/15 dark:text-[#FCD34D]">
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
                        <span className={`inline-flex items-center rounded-full px-2.5 py-1 font-semibold ${showClarificationPanel ? 'bg-[#FFF4E5] text-[#D97706] dark:bg-[#D97706]/15 dark:text-[#FCD34D]' : 'bg-[#EEF5FF] text-[#286CFF] dark:bg-[#286CFF]/15 dark:text-[#C6DBFF]'}`}>
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
          className="overflow-hidden rounded-[28px] border-[#D9E6F5] bg-white shadow-none dark:border-white/10 dark:bg-[#162339]"
        >
          <CardContent className="p-6">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-xl font-bold text-[#0F172A] dark:text-white">Requested Budget Mix</h3>
                  <InfoHint text="A quick view of where your total requested budget currently sits by project status, helping respondents understand what is blocked, in review, or already approved." />
                </div>
                <p className="mt-1 text-sm text-[#64748B] dark:text-slate-100">
                  Understand where your total requested budget is currently sitting
                </p>
              </div>
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#286CFF]/12 text-[#286CFF] dark:bg-[#286CFF]/18 dark:text-[#9FC4FF]">
                <BadgeDollarSign className="h-5 w-5" />
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
                  <div key={item.name} className="rounded-[20px] border border-[#DCE8F6] bg-white p-4 shadow-none dark:border-white/10 dark:bg-[#1B2A41]">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.fill }} />
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

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-2 [&_*]:shadow-none">
        <Card
          title="Compare current requested budgets against a reconstructed previous-year baseline across priorities."
          className="overflow-hidden rounded-[28px] border-[#D9E6F5] bg-white shadow-none dark:border-white/10 dark:bg-[#162339]"
        >
          <CardContent className="p-6">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-xl font-bold text-[#0F172A] dark:text-white">Current vs Previous Year</h3>
                  <InfoHint text="Compare current requested budgets against a previous-cycle baseline to understand where this year is trending higher or lower." />
                </div>
                <p className="mt-1 text-sm text-[#64748B] dark:text-slate-100">
                  Budget request comparison by strategic priority
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs text-[#64748B] dark:text-slate-100">
                <span className="inline-flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#286CFF]" />
                  Current
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#AEBBCC]" />
                  Previous
                </span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={comparisonData} margin={{ top: 8, right: 10, left: 12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.18)" vertical={false} />
                <XAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Legend />
                <Bar dataKey="current" name="Current" radius={[8, 8, 0, 0]} fill="#286CFF" maxBarSize={28} />
                <Bar dataKey="previous" name="Previous" radius={[8, 8, 0, 0]} fill="#AEBBCC" maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card
          title="Shows which account codes are driving the largest share of your requested budget."
          className="overflow-hidden rounded-[28px] border-[#D9E6F5] bg-white shadow-none dark:border-white/10 dark:bg-[#162339]"
        >
          <CardContent className="p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
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
            <div className="space-y-4">
              {accountBreakdown.map((item) => (
                <div key={item.name} className="rounded-[20px] border border-[#DCE8F6] bg-white px-4 py-3 shadow-none dark:border-white/10 dark:bg-[#1B2A41]">
                  <div className="flex items-center gap-3">
                    <span
                      className="inline-flex min-w-[64px] items-center justify-center rounded-full px-2.5 py-1 text-xs font-semibold"
                      style={{ backgroundColor: `${item.color}16`, color: item.color }}
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
                        background: `linear-gradient(90deg, ${item.color}, ${item.color}BB)`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid grid-cols-1 items-stretch gap-5 xl:grid-cols-[1fr_1fr] [&_*]:shadow-none">
        <Card
          title="Quick access to active submission states and the next actions you should take in Projects."
          className="overflow-hidden rounded-[28px] border-[#D9E6F5] bg-white shadow-none dark:border-white/10 dark:bg-[#162339]"
        >
          <CardContent className="flex h-full flex-col p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-xl font-bold text-[#0F172A] dark:text-white">Projects Workspace</h3>
                  <InfoHint text="This workspace brings respondent-owned statuses together and points you toward the next best actions in the Projects area." />
                </div>
                <p className="mt-1 text-sm text-[#64748B] dark:text-slate-100">
                  Jump into the full projects page to continue edits, resolve clarifications, and prepare submissions.
                </p>
              </div>
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#286CFF]/10 text-[#286CFF] dark:bg-[#286CFF]/18 dark:text-white">
                <FolderOpen className="h-5 w-5" />
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              {[ 
                { label: 'On Respondent', value: respondentOwned, tone: dashboardStatusColors.clarification },
                { label: 'On Reviewer', value: submittedToReviewer, tone: dashboardStatusColors.withReviewer },
                { label: 'On Approver', value: submittedToApprover, tone: dashboardStatusColors.withApprover },
                { label: 'Needs Attention', value: attentionCount, tone: dashboardStatusColors.needsWork },
              ].map((item) => (
                <div key={item.label} className="rounded-[20px] border border-[#DCE8F6] bg-white p-4 shadow-none dark:border-white/10 dark:bg-[#1B2A41]">
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

            <div className="mt-5 rounded-[24px] border border-dashed border-[#BED3F3] bg-white p-4 shadow-none dark:border-[#315389] dark:bg-[#1B2A41]">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EEF5FF] text-[#286CFF] dark:bg-[#286CFF]/18 dark:text-white">
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

            <div className="mt-5 rounded-[24px] border border-[#DCE8F6] bg-white p-4 shadow-none dark:border-white/10 dark:bg-[#1B2A41]">
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
            className="overflow-hidden rounded-[28px] border-[#D9E6F5] bg-white shadow-none dark:border-white/10 dark:bg-[#162339]"
          >
            <CardContent className="p-6">
              <div className="mb-5">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-xl font-bold text-[#0F172A] dark:text-white">Budget Type Distribution</h3>
                  <InfoHint text="Shows how requested budget is distributed across the four ICT budget activity types in the respondent workspace." />
                </div>
                <p className="mt-1 text-sm text-[#64748B] dark:text-slate-100">
                  Distribution of requested budget by budget type
                </p>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {budgetTypeBreakdown.map((item) => (
                  <div key={item.key} className={`rounded-[22px] border bg-white p-4 shadow-none dark:bg-[#18263F] ${item.bgClass}`}>
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
            className="overflow-hidden rounded-[28px] border-[#F5D3DC] bg-white shadow-none dark:border-[#5D3240] dark:bg-[#162339]"
          >
            <CardContent className="p-6">
              <div className="flex flex-col gap-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#7C3AED_0%,#A855F7_100%)] text-white shadow-[0_16px_30px_rgba(124,58,237,0.28)]">
                    <Bot className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-bold text-[#0F172A] dark:text-white">AI Budget Prediction</h2>
                        <InfoHint text="AI estimates how much of the currently requested budget is likely to be approved based on approval history, risk, and project profile signals." />
                        <span className="inline-flex items-center rounded-full bg-[#F3E8FF] px-2.5 py-1 text-xs font-semibold text-[#7C3AED] dark:bg-[#7C3AED]/20 dark:text-[#DAC0FF]">
                          Beta
                        </span>
                    </div>
                    <p className="mt-1 text-sm leading-6 text-[#475569] dark:text-slate-100">
                      Based on budget patterns, strategic alignment, and recent approval behavior, AI predicts that{' '}
                      <CurrencyAmount
                        amount={predictedBudget}
                        className="font-semibold text-[#7C3AED] dark:text-[#DAC0FF]"
                        iconColor="#7C3AED"
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
                    <div key={item.label} className="rounded-2xl bg-white/80 px-3 py-3 text-center dark:bg-white/5">
                      <p className="text-xs font-semibold tracking-[0.06em] text-[#64748B] dark:text-slate-100">
                        {item.label}
                      </p>
                      <p className="mt-1 text-base font-bold text-[#0F172A] dark:text-white">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between text-xs font-medium text-[#7C3AED] dark:text-[#DAC0FF]">
                  <span>Approval likelihood</span>
                  <span>{totalBudget > 0 ? Math.round((predictedBudget / totalBudget) * 100) : 0}%</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-white/70 dark:bg-white/10">
                  <div
                    className="h-full rounded-full bg-[linear-gradient(90deg,#7C3AED_0%,#A855F7_45%,#C084FC_100%)] shadow-[0_8px_24px_rgba(124,58,237,0.28)]"
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
