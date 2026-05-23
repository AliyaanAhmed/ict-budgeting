import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BadgeDollarSign,
  Bell,
  Bot,
  BrainCircuit,
  Calendar,
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
} from 'lucide-react'
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import { Button } from '@/components/ui/button'
import { BudgetByCategory } from '@/components/charts/BudgetByCategory'
import { Card, CardContent } from '@/components/ui/card'
import { CurrencyAmount } from '@/components/shared/CurrencyAmount'
import { useCycle } from '@/context/CycleContext'
import { useInstance } from '@/context/InstanceContext'
import { useBudgetByCategoryChart } from '@/hooks/useDashboardBudgetCharts'
import { useDelayedLoading } from '@/lib/useDelayedLoading'
import { dashboardPalette } from '@/lib/dashboardPalette'
import { cn } from '@/lib/utils'
import { useRoleProjects } from '@/hooks/useRoleProjects'
import { projectService } from '@/services/projectService'
import { useToast } from '@/context/ToastContext'

const LOCAL_STATUSCODE_BY_STATUS = {
  Approved: 776140003,
  'Submitted to DGE': 776140004,
} as const

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
        'group overflow-hidden rounded-[24px] border bg-white p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#286CFF] dark:bg-[#18263F] sm:p-5',
        className
      )}
      style={{ borderColor: `${accent}3D`, boxShadow: 'none' }}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold tracking-[0.04em] text-[#64748B] dark:text-slate-100">{title}</p>
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
            <p className="text-sm font-semibold tracking-[0.04em] text-[#334155] dark:text-slate-50">{title}</p>
          </div>
          <div className="mt-3 flex items-end gap-3">
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

export default function ApproverDashboard() {
  const [portfolioExpanded, setPortfolioExpanded] = useState(false)
  const [portfolioSubmittedToDge, setPortfolioSubmittedToDge] = useState(false)
  const [statusOverrides, setStatusOverrides] = useState<Record<string, 'Approved' | 'Submitted to DGE'>>({})
  const { selectedCycle } = useCycle()
  const { instanceId, instanceDetail, instanceLoading } = useInstance()
  const { items: liveProjects, loading, error } = useRoleProjects('approver', instanceId)
  const { runActionToast } = useToast()
  const effectiveLiveProjects = useMemo(
    () =>
      liveProjects.map((project) => {
        const override = project.ictBudgetId ? statusOverrides[project.ictBudgetId] : undefined
        if (!override) return project

        return {
          ...project,
          status: override,
          statusCode: LOCAL_STATUSCODE_BY_STATUS[override],
        }
      }),
    [liveProjects, statusOverrides]
  )
  const budgetByCategory = useBudgetByCategoryChart(effectiveLiveProjects)
  const showSkeleton = useDelayedLoading(instanceLoading || loading)
  const cycleName = selectedCycle?.name ?? 'ICT Budget Planning 2026'
  const daysRemaining = computeDaysRemaining(selectedCycle?.endDate)
  const submittedToApproverProjects = effectiveLiveProjects.filter((project) => project.status === 'Submitted to Approver')
  const clarificationProjects = effectiveLiveProjects.filter((project) => project.status === 'Clarification Required')
  const approvedProjects = effectiveLiveProjects.filter((project) => project.status === 'Approved')
  const submittedToDgeProjects = effectiveLiveProjects.filter((project) => project.status === 'Submitted to DGE')
  const reviewerProjects = effectiveLiveProjects.filter((project) => project.status === 'Submitted to Reviewer' || project.status === 'Reviewer Review Completed')
  const draftProjects = effectiveLiveProjects.filter((project) => project.status === 'Draft')
  const respondentProjects = [...draftProjects, ...clarificationProjects]

  const totalBudget = effectiveLiveProjects.reduce((sum, project) => sum + project.requestedBudget, 0)
  const approvedBudget = approvedProjects.reduce((sum, project) => sum + project.requestedBudget, 0)
  const pendingApproval = submittedToApproverProjects.length
  const clarificationCount = clarificationProjects.length
  const highRiskCount = effectiveLiveProjects.filter((project) => project.riskLevel === 'High').length
  const avgConfidence = effectiveLiveProjects.length > 0
    ? Math.round(effectiveLiveProjects.reduce((sum, project) => sum + project.aiScore, 0) / effectiveLiveProjects.length)
    : 0
  const approvalRate = Math.max(1, effectiveLiveProjects.length)
  const approvedCount = approvedProjects.length
  const submittedToDgeCount = submittedToDgeProjects.length
  const approverOwnedProjects = [...submittedToApproverProjects, ...approvedProjects]
  const allProjectsApproved = effectiveLiveProjects.length > 0 && effectiveLiveProjects.every((project) => project.status === 'Approved')
  const hasCycleDgeSubmission = effectiveLiveProjects.some(
    (project) => project.status === 'Submitted to DGE' && project.statusCode === 776140004
  )
  const portfolioAlreadySubmittedToDge =
    portfolioSubmittedToDge || hasCycleDgeSubmission
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
      value: draftProjects.reduce((sum, project) => sum + project.requestedBudget, 0),
      fill: dashboardPalette.primary,
    },
    {
      name: 'With Reviewer',
      value: reviewerProjects.reduce((sum, project) => sum + project.requestedBudget, 0),
      fill: dashboardPalette.primarySoft,
    },
    {
      name: 'Pending My Approval',
      value: approverOwnedProjects.reduce((sum, project) => sum + project.requestedBudget, 0),
      fill: dashboardPalette.primaryDeep,
    },
    {
      name: 'Clarification Open',
      value: clarificationProjects.reduce((sum, project) => sum + project.requestedBudget, 0),
      fill: dashboardPalette.primaryMuted,
    },
    {
      name: 'Submitted to DGE',
      value: submittedToDgeProjects.reduce((sum, project) => sum + project.requestedBudget, 0),
      fill: dashboardPalette.primary,
    },
  ].map((item) => ({
    ...item,
    percent: totalBudget > 0 ? Math.round((item.value / totalBudget) * 100) : 0,
  }))

  const clarificationMonitorItems = useMemo(
    () =>
      clarificationProjects.slice(0, 4).map((project) => ({
        name: project.name,
        pendingWith: project.pendingWith || 'Respondent',
        status: 'Clarification Pending',
        note: project.submittedDate,
        budget: project.requestedBudget,
        id: project.id,
      })),
    [clarificationProjects]
  )

  const insightCards = [
    {
      title: 'High Risk',
      value: highRiskCount,
      note: 'Need immediate review',
      accent: '#EF4444',
      icon: <ShieldAlert className="h-4.5 w-4.5" />,
      bg: 'bg-white dark:bg-[#18263F]',
      border: 'border-[#FFD1D1] dark:border-[#5B2632]',
    },
    {
      title: 'Missing Documents',
      value: 1,
      note: 'Blocking approval',
      accent: '#F97316',
      icon: <ClipboardCheck className="h-4.5 w-4.5" />,
      bg: 'bg-white dark:bg-[#18263F]',
      border: 'border-[#FFD9C3] dark:border-[#5A3523]',
    },
    {
      title: 'Low Confidence',
      value: 5,
      note: 'AI readiness below 60%',
      accent: '#D97706',
      icon: <TriangleAlert className="h-4.5 w-4.5" />,
      bg: 'bg-white dark:bg-[#18263F]',
      border: 'border-[#F7E1A1] dark:border-[#64582A]',
    },
    {
      title: 'Possible Duplicates',
      value: 3,
      note: 'Similar projects detected',
      accent: '#9333EA',
      icon: <CopyPlus className="h-4.5 w-4.5" />,
      bg: 'bg-white dark:bg-[#18263F]',
      border: 'border-[#E9D5FF] dark:border-[#52307A]',
    },
    {
      title: 'Budget Anomalies',
      value: 4,
      note: 'Unusual spending patterns',
      accent: '#286CFF',
      icon: <TrendingUp className="h-4.5 w-4.5" />,
      bg: 'bg-white dark:bg-[#18263F]',
      border: 'border-[#D4E4FF] dark:border-[#315389]',
    },
    {
      title: 'Clarification Likely',
      value: 6,
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
      .filter((project) => project.ictBudgetId && project.status === 'Approved')
      .map((project) => project.ictBudgetId as string)

    if (!projectIds.length) {
      return
    }

    await runActionToast(
      async () => {
        await projectService.approverSubmitToDge(projectIds)
        setPortfolioSubmittedToDge(true)
        setStatusOverrides((prev) => {
          const next = { ...prev }
          for (const projectId of projectIds) {
            next[projectId] = 'Submitted to DGE'
          }
          return next
        })
      },
      {
        processingTitle: 'Submitting to DGE',
        processingDescription: 'Assigning the approved portfolio to the strategy team and moving it into DGE review...',
        successTitle: 'Submitted to DGE',
        successDescription: 'All approved projects were submitted to DGE successfully.',
        errorTitle: 'Unable to submit to DGE',
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
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#475569] dark:text-slate-100">
              Current cycle status: final approval is in progress, reviewer-cleared projects are being checked for DGE readiness, and clarification loops remain open where evidence is incomplete.
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
              <span className="inline-flex items-center gap-2 rounded-full border border-[#D8E7FF] bg-white px-3.5 py-2 font-medium text-[#3B82F6] shadow-[0_10px_22px_rgba(15,23,42,0.05)] dark:border-white/10 dark:bg-[#1B2A41] dark:text-[#BFDBFE]">
                <Users className="h-4 w-4" />
                Final DGE gate
              </span>
            </div>
          </div>
        </div>
      </section>

      <section
        title="Portfolio-level deadline, AI summary, and final submission progress for the approver."
        className="overflow-hidden rounded-[24px] border border-[#DCE8F6] bg-white px-4 py-3 shadow-[0_10px_24px_rgba(40,108,255,0.05)] dark:border-white/10 dark:bg-[#18263F]"
      >
        <div className="overflow-x-auto">
          <div className="flex min-w-[980px] items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#EEF5FF] text-[#286CFE] dark:bg-[#286CFE]/15 dark:text-[#BFDBFE]">
                <Calendar className="h-4.5 w-4.5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#64748B] dark:text-slate-200">DGE submission deadline</p>
                <p className="mt-1 text-sm font-bold text-[#286CFE] dark:text-[#BFDBFE]">{daysRemaining} days remaining</p>
              </div>
            </div>

            <div className="h-12 w-px shrink-0 bg-[#D9E6F5] dark:bg-white/10" />

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#A855F7] text-white shadow-[0_12px_20px_rgba(168,85,247,0.18)]">
                <Sparkles className="h-4.5 w-4.5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#64748B] dark:text-slate-200">AI summary</p>
                <p className="mt-1 text-sm font-semibold text-[#0F172A] dark:text-white whitespace-nowrap">
                  {summaryCounts.inCycle} projects in cycle,{' '}
                  <span className="text-[#286CFE]">{summaryCounts.withRespondent} with Respondent</span>,{' '}
                  <span className="text-[#5B87FF]">{summaryCounts.withReviewer} with Reviewer</span>,{' '}
                  <span className="text-[#0C65F5]">{summaryCounts.withApprover} with Approver</span>
                </p>
              </div>
            </div>

            <div className="h-12 w-px shrink-0 bg-[#D9E6F5] dark:bg-white/10" />

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#F3E8FF] text-[#9333EA] dark:bg-[#9333EA]/18 dark:text-[#E9D5FF]">
                <BrainCircuit className="h-4.5 w-4.5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#64748B] dark:text-slate-200">Entity progress</p>
                <p className="mt-1 text-sm font-semibold text-[#0F172A] dark:text-white whitespace-nowrap">
                  <span className="text-[#7C3AED]">1</span> of {portfolioAlreadySubmittedToDge ? 1 : 0}
                </p>
              </div>
            </div>

            {portfolioAlreadySubmittedToDge ? (
              <div className="ml-auto flex min-w-[280px] items-start gap-3 rounded-[22px] border border-[#E9D5FF] bg-[#FDF8FF] px-4 py-3 dark:border-white/10 dark:bg-white/5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#A855F7] text-white">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
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
                disabled={!allProjectsApproved}
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
        <div className="grid h-full grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
          <ActionMetricCard
            title={<><span className="block">Submitted</span><span className="block">DGE</span></>}
            value={submittedToDgeCount}
            accent="#7C3AED"
            badge="Forwarded"
            icon={<Send className="h-5 w-5" />}
            href="/approver/projects?tab=submitted-dge"
            description="Portfolio items already handed off for strategic review."
          />
        </div>

        <Card className="h-full overflow-hidden rounded-[28px] border-[#D9E6F5] bg-white shadow-none dark:border-white/10 dark:bg-[#162339]">
          <CardContent className="p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-xl font-bold text-[#0F172A] dark:text-white">Approval Snapshot</h3>
                  <InfoHint text="Consolidated approver view of total requested budget, approved value, and portfolio confidence." />
                </div>
              </div>
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#E7F5FF] text-[#286CFF] dark:bg-[#286CFF]/15 dark:text-white">
                <BadgeDollarSign className="h-5 w-5" />
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-[22px] border border-[#DCE8F6] bg-[#F8FBFF] p-4 shadow-none dark:border-white/10 dark:bg-[#1B2A41]">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold tracking-[0.06em] text-[#64748B] dark:text-slate-100">Requested Budget</p>
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
                  <p className="text-xs font-semibold tracking-[0.06em] text-[#64748B] dark:text-slate-100">Approved Budget</p>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#ECFDF3] text-[#16A34A] dark:bg-[#16A34A]/15">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-4">
                  <CompactAmount amount={approvedBudget} iconColor={dashboardPalette.aeGreen} />
                </div>
              </div>

              <div className="rounded-[22px] border border-[#DCE8F6] bg-[#F8FBFF] p-4 shadow-none dark:border-white/10 dark:bg-[#1B2A41]">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold tracking-[0.06em] text-[#64748B] dark:text-slate-100">AI Confidence</p>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F3E8FF] text-[#7C3AED] dark:bg-[#7C3AED]/15">
                    <BrainCircuit className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-4 text-2xl font-bold leading-none text-[#0F172A] dark:text-white sm:text-[30px] xl:text-[32px]">
                  {avgConfidence}%
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section
        title="AI summary of final approval blockers and role-specific portfolio risks."
        className="overflow-hidden rounded-[28px] border border-[#E9D5FF] bg-gradient-to-b from-[#FDF7FF] to-white shadow-[0_12px_30px_rgba(15,23,42,0.06)] dark:border-white/10 dark:from-[#2A123D] dark:to-[#1E293B]"
      >
        <button
          type="button"
          onClick={() => setPortfolioExpanded((value) => !value)}
          className="flex w-full items-start justify-between gap-4 px-6 py-5 text-left transition-colors hover:bg-white/30 dark:hover:bg-white/5"
        >
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#A855F7] text-white shadow-[0_16px_30px_rgba(168,85,247,0.24)]">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold text-[#0F172A] dark:text-white">AI Portfolio Summary</h2>
                <InfoHint text="A final approval view of the portfolio showing major blockers before the package can move to DGE." />
                <span className="inline-flex items-center rounded-full bg-[#FDF8FF] px-2.5 py-1 text-xs font-semibold text-[#A855F7] dark:bg-[#A855F7]/15 dark:text-[#E9D5FF]">
                  DGE blockers found
                </span>
              </div>
              <p className="mt-1 text-sm text-[#475569] dark:text-slate-100">
                Portfolio status: {pendingApproval + clarificationCount + highRiskCount} items need attention before the final submission gate.
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-4">
            <div className="hidden items-center gap-4 text-sm md:flex">
              <span className="text-[#0F172A] dark:text-white">
                {summaryCounts.inCycle} <span className="text-[#64748B] dark:text-slate-100">projects</span>
              </span>
              <span className="text-[#A855F7] dark:text-[#E9D5FF]">
                {avgConfidence}% <span className="text-[#64748B] dark:text-slate-100">avg confidence</span>
              </span>
              <span className="text-[#C084FC] dark:text-[#E9D5FF]">
                {highRiskCount} <span className="text-[#64748B] dark:text-slate-100">high risk</span>
              </span>
              <RefreshCcw className="h-4 w-4 text-[#64748B] dark:text-slate-100" />
            </div>
            <ChevronDown className={cn('h-5 w-5 text-[#64748B] transition-transform dark:text-slate-100', portfolioExpanded && 'rotate-180')} />
          </div>
        </button>

        {portfolioExpanded && (
          <div className="border-t border-[#E9D5FF] px-6 pb-6 pt-5 dark:border-white/10">
            <div className="space-y-3">
              {portfolioIssues.map((issue) => (
                <div
                  key={issue.title}
                  className="flex items-start justify-between gap-4 rounded-[22px] border border-[#E9D5FF] bg-white px-4 py-4 shadow-sm dark:border-white/10 dark:bg-[#1E293B]"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 shrink-0 text-[#A855F7]">
                      {issue.icon}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#0F172A] dark:text-white">{issue.title}</p>
                      <p className="mt-1 text-sm text-[#64748B] dark:text-slate-100">{issue.detail}</p>
                    </div>
                  </div>
                  <span
                    className="inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-semibold"
                    style={{ backgroundColor: '#FDF8FF', color: '#A855F7' }}
                  >
                    {issue.badge}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Card
          title="AI-detected approval issues and risk themes needing final approver attention."
          className="overflow-hidden rounded-[28px] border border-[#E9D5FF] bg-gradient-to-b from-[#FDF7FF] to-white shadow-[0_12px_30px_rgba(15,23,42,0.06)] dark:border-white/10 dark:from-[#2A123D] dark:to-[#1E293B]"
        >
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Sparkles className="h-5 w-5 shrink-0 text-[#A855F7] dark:text-[#E9D5FF]" />
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
                <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-[#A855F7] text-white shadow-[0_18px_30px_rgba(168,85,247,0.24)]">
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
                        <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EEF5FF] text-xs font-bold text-[#286CFF] dark:bg-[#286CFF]/18 dark:text-[#BFDBFE]">
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
                        <span className="inline-flex items-center rounded-full bg-[#EEF5FF] px-2.5 py-1 font-semibold text-[#286CFE] dark:bg-[#286CFE]/15 dark:text-[#BFDBFE]">
                          {showPendingApprovalPanel ? 'Awaiting approval' : project.status}
                        </span>
                        <span>{project.budgetType}</span>
                        <CurrencyAmount amount={project.requestedBudget} className="text-sm font-semibold text-[#0F172A] dark:text-white" iconSize={13} />
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
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Card
          title="Budget distribution across ICT strategic categories for the current approval cycle."
          className="overflow-hidden rounded-[28px] border-[#D9E6F5] bg-white shadow-none dark:border-white/10 dark:bg-[#162339]"
        >
          <CardContent className="p-6">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Layers className="h-5 w-5 shrink-0 text-[#286CFF]" />
                  <h3 className="text-xl font-bold text-[#0F172A] dark:text-white">Budget by Category</h3>
                  <InfoHint text="Shows how the submitted budget is distributed across strategic ICT categories before final approval and DGE submission." />
                </div>
                <p className="mt-1 text-sm text-[#64748B] dark:text-slate-100">
                  Submitted budget by strategic ICT category
                </p>
              </div>
              <span className="inline-flex items-center rounded-full bg-[#EEF5FF] px-3 py-1 text-xs font-semibold text-[#286CFF] dark:bg-[#286CFF]/15 dark:text-[#C6DBFF]">
                Current cycle
              </span>
            </div>
            <BudgetByCategory data={budgetByCategory} />
          </CardContent>
        </Card>

        <Card
          title="Requested budget distribution across approver-visible workflow stages."
          className="overflow-hidden rounded-[28px] border-[#D9E6F5] bg-white shadow-none dark:border-white/10 dark:bg-[#162339]"
        >
          <CardContent className="p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <BadgeDollarSign className="h-5 w-5 shrink-0 text-[#286CFF]" />
                  <h3 className="text-xl font-bold text-[#0F172A] dark:text-white">Budget Queue Mix</h3>
                  <InfoHint text="Shows how requested budget is currently distributed across the approver-visible project workflow." />
                </div>
                <p className="mt-1 text-sm text-[#64748B] dark:text-slate-100">Requested budget split across approval stages</p>
              </div>
              <span className="inline-flex items-center rounded-full bg-[#EEF5FF] px-3 py-1 text-xs font-semibold text-[#286CFF] dark:bg-[#286CFF]/18 dark:text-[#C6DBFF]">
                Portfolio mix
              </span>
            </div>

            <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
              <div className="relative h-[230px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={queueBudgetMix}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={58}
                      outerRadius={88}
                      paddingAngle={3}
                      strokeWidth={0}
                    >
                      {queueBudgetMix.map((entry) => (
                        <Cell key={entry.name} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xs font-semibold tracking-[0.06em] text-[#64748B] dark:text-slate-100">Portfolio</span>
                  <CurrencyAmount amount={totalBudget} className="mt-1 text-2xl font-bold text-[#0F172A] dark:text-white" iconSize={15} />
                </div>
              </div>

              <div className="space-y-3">
                {queueBudgetMix.map((item) => (
                  <div key={item.name} className="rounded-[20px] border border-[#DCE8F6] bg-white p-4 shadow-none dark:border-white/10 dark:bg-[#1B2A41]">
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
        {clarificationCount > 0 ? (
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
                  <p className="mt-1 text-sm text-[#64748B] dark:text-slate-100">Track active clarifications before final approval</p>
                </div>
                <span className="inline-flex items-center rounded-full bg-[#EEF5FF] px-3 py-1 text-xs font-semibold text-[#286CFE] dark:bg-[#286CFE]/15 dark:text-[#BFDBFE]">
                  {clarificationCount} pending
                </span>
              </div>

              <div className="space-y-3">
                {clarificationMonitorItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-4 rounded-[22px] border border-[#DCE8F6] bg-[#F8FBFF] px-4 py-4 transition-all duration-200 hover:-translate-y-0.5 dark:border-white/10 dark:bg-[#1B2A41]"
                  >
                    <div>
                      <p className="text-lg font-semibold text-[#0F172A] dark:text-white">{item.name}</p>
                      <p className="mt-1 text-sm text-[#64748B] dark:text-slate-100">Pending with: {item.pendingWith}</p>
                      <div className="mt-2">
                        <CurrencyAmount amount={item.budget} className="text-sm font-semibold text-[#0F172A] dark:text-white" iconSize={13} />
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center rounded-full bg-[#EAF1FF] px-3 py-1 text-xs font-semibold text-[#0C65F5] dark:bg-[#0C65F5]/18 dark:text-[#DBEAFE]">
                        {item.status}
                      </span>
                      <Button variant="outline" asChild className="h-10 rounded-2xl">
                        <Link to={`/approver/approval-queue/${item.id}`}>
                          Visit Project
                          <MoveRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
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
        ) : (
          <Card
            title="Fast access to actions the approver takes most often."
            className="overflow-hidden rounded-[28px] border-[#D9E6F5] bg-white shadow-none dark:border-white/10 dark:bg-[#162339]"
          >
            <CardContent className="p-6">
              <div className="mb-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Radar className="h-5 w-5 shrink-0 text-[#286CFF]" />
                  <h3 className="text-xl font-bold text-[#0F172A] dark:text-white">Quick Actions</h3>
                  <InfoHint text="Shortcuts into queue review, readiness checks, notifications, and AI-assisted triage." />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {quickActions.map((action) => (
                  <Link
                    key={action.label}
                    to={action.to}
                    className={cn(
                      'group relative flex min-h-[118px] items-start justify-between gap-3 overflow-hidden rounded-[22px] border border-[#E4ECF7] bg-white px-4 py-4 shadow-none transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#F8FBFF] dark:border-white/10 dark:bg-[#1B2A41]',
                      action.rowClass
                    )}
                  >
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100" style={{ backgroundColor: action.accent }} />
                    <div className="flex items-start gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl" style={{ backgroundColor: `${action.accent}14`, color: action.accent }}>
                        {action.icon}
                      </span>
                      <div className="min-w-0">
                        <span className="block text-sm font-semibold text-[#0F172A] dark:text-white">{action.label}</span>
                        <span className="mt-1 block text-xs leading-5 text-[#64748B] dark:text-slate-200">
                          {action.label === 'Approval Queue' && 'Open pending approvals and review final-stage items.'}
                          {action.label === 'Submission Readiness' && 'Check if the portfolio is clear to move to DGE.'}
                          {action.label === 'Notify Reviewer' && 'Follow up with reviewers on items still upstream.'}
                          {action.label === 'Notify Respondent' && 'Prompt respondents to resolve open clarifications.'}
                          {action.label === 'High Risk Items' && 'Jump into the most critical submissions first.'}
                          {action.label === 'Ask AI Assistant' && 'Open AI-guided triage for final approval decisions.'}
                        </span>
                      </div>
                    </div>
                    <div className="flex shrink-0 self-center">
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors duration-200" style={{ backgroundColor: `${action.accent}14`, color: action.accent }}>
                        {action.endIcon}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card
          title="Shows whether the portfolio is ready for final onward submission to DGE."
          className="overflow-hidden rounded-[28px] border-[#D9E6F5] bg-white shadow-none dark:border-white/10 dark:bg-[#162339]"
        >
          <CardContent className="flex h-full flex-col p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Send className="h-5 w-5 shrink-0 text-[#286CFF]" />
                  <h3 className="text-xl font-bold text-[#0F172A] dark:text-white">Final Approval Readiness</h3>
                  <InfoHint text="A role-specific readiness board showing what still blocks the portfolio from moving to DGE." />
                </div>
                <p className="mt-1 text-sm text-[#64748B] dark:text-slate-100">
                  Review the current blockers before moving the portfolio forward
                </p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              {[
                { label: 'Approved', value: approvedCount, tone: '#16A34A' },
                { label: 'Pending Approval', value: pendingApproval, tone: '#D97706' },
                { label: 'With Reviewer', value: reviewerProjects.length, tone: '#286CFF' },
                { label: 'On Respondent', value: respondentProjects.length, tone: '#F97316' },
                { label: 'Submitted to DGE', value: submittedToDgeCount, tone: '#7C3AED' },
              ].map((item) => (
                <div key={item.label} className="rounded-[20px] border border-[#DCE8F6] bg-[#F3F8FF] p-4 dark:border-white/10 dark:bg-[#20314D]">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#64748B] dark:text-slate-100">{item.label}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.tone }} />
                    <span className="text-2xl font-bold text-[#0F172A] dark:text-white">{item.value}</span>
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
                  <p className="font-semibold text-[#0F172A] dark:text-white">Suggested next move</p>
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
              {portfolioAlreadySubmittedToDge ? (
                <div className="rounded-[22px] border border-[#DDD6FE] bg-[#F5F3FF] px-4 py-4 dark:border-[#5B3AA8] dark:bg-[#2A1C4A]">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#7C3AED_0%,#9333EA_100%)] text-white">
                      <Send className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#5B21B6] dark:text-[#DDD6FE]">Submitted to DGE</p>
                      <p className="mt-1 text-xs leading-5 text-[#6D28D9] dark:text-slate-100">
                        The portfolio has already been forwarded for strategic alignment review.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <Button
                  className="h-12 w-full rounded-2xl shadow-[0_16px_32px_rgba(40,108,255,0.20)]"
                  disabled={!allProjectsApproved}
                  onClick={() => void handleSubmitToDge()}
                >
                  Submit to DGE
                  <MoveRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </section>

      {clarificationCount > 0 && (
        <section>
          <Card
            title="Fast access to actions the approver takes most often."
            className="overflow-hidden rounded-[28px] border-[#D9E6F5] bg-white shadow-none dark:border-white/10 dark:bg-[#162339]"
          >
            <CardContent className="p-6">
              <div className="mb-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Radar className="h-5 w-5 shrink-0 text-[#286CFF]" />
                  <h3 className="text-xl font-bold text-[#0F172A] dark:text-white">Quick Actions</h3>
                  <InfoHint text="Shortcuts into queue review, readiness checks, notifications, and AI-assisted triage." />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-6">
                {quickActions.map((action) => (
                  <Link
                    key={action.label}
                    to={action.to}
                    className={cn(
                      'group relative flex min-h-[118px] items-start justify-between gap-3 overflow-hidden rounded-[22px] border border-[#E4ECF7] bg-white px-4 py-4 shadow-none transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#F8FBFF] dark:border-white/10 dark:bg-[#1B2A41]',
                      action.rowClass
                    )}
                  >
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100" style={{ backgroundColor: action.accent }} />
                    <div className="flex items-start gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl" style={{ backgroundColor: `${action.accent}14`, color: action.accent }}>
                        {action.icon}
                      </span>
                      <div className="min-w-0">
                        <span className="block text-sm font-semibold text-[#0F172A] dark:text-white">{action.label}</span>
                        <span className="mt-1 block text-xs leading-5 text-[#64748B] dark:text-slate-200">
                          {action.label === 'Approval Queue' && 'Open pending approvals and review final-stage items.'}
                          {action.label === 'Submission Readiness' && 'Check if the portfolio is clear to move to DGE.'}
                          {action.label === 'Notify Reviewer' && 'Follow up with reviewers on items still upstream.'}
                          {action.label === 'Notify Respondent' && 'Prompt respondents to resolve open clarifications.'}
                          {action.label === 'High Risk Items' && 'Jump into the most critical submissions first.'}
                          {action.label === 'Ask AI Assistant' && 'Open AI-guided triage for final approval decisions.'}
                        </span>
                      </div>
                    </div>
                    <div className="flex shrink-0 self-center">
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors duration-200" style={{ backgroundColor: `${action.accent}14`, color: action.accent }}>
                        {action.endIcon}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      )}

    </div>
  )
}
