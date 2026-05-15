import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BadgeDollarSign,
  Bot,
  BrainCircuit,
  Calendar,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  ClipboardCheck,
  Clock3,
  CopyPlus,
  FileSearch,
  FolderOpen,
  Info,
  MessageSquareMore,
  MoveRight,
  Radar,
  RefreshCcw,
  Scale,
  ShieldAlert,
  Sparkles,
} from 'lucide-react'
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import { AccountCodesBreakdown } from '@/components/charts/AccountCodesBreakdown'
import { BudgetByCategory } from '@/components/charts/BudgetByCategory'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CurrencyAmount } from '@/components/shared/CurrencyAmount'
import { useCycle } from '@/context/CycleContext'
import { useInstance } from '@/context/InstanceContext'
import {
  useAccountCodesBreakdown,
  useBudgetByCategoryChart,
} from '@/hooks/useDashboardBudgetCharts'
import { useDelayedLoading } from '@/lib/useDelayedLoading'
import { dashboardPalette, dashboardStatusColors } from '@/lib/dashboardPalette'
import { cn } from '@/lib/utils'
import { useRoleProjects } from '@/hooks/useRoleProjects'
import { isReviewerSentToApproverProjectStatus } from '@/services/projectService'

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
        {entry.payload.percent}% of queue budget
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
      className="group flex h-full flex-col overflow-hidden rounded-[24px] border bg-white px-4 py-5 shadow-none transition-all duration-300 hover:-translate-y-0.5 hover:border-[#286CFF] hover:bg-[#F8FBFF] dark:bg-[#18263F] sm:px-5 sm:py-6"
      style={{ borderColor: `${accent}3D`, boxShadow: 'none' }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="min-h-[3.25rem]">
            <p className="text-sm font-semibold tracking-[0.04em] text-[#334155] dark:text-slate-50">{title}</p>
          </div>
          <div className="mt-3 flex items-end gap-3">
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
      <div className="mt-3 min-h-[3rem] text-sm text-[#64748B] dark:text-slate-100">
        {description}
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

export default function ReviewerDashboard() {
  const [portfolioExpanded, setPortfolioExpanded] = useState(false)
  const { selectedCycle } = useCycle()
  const { instanceId, instanceDetail, instanceLoading } = useInstance()
  const { items: liveProjects, loading, error } = useRoleProjects('reviewer', instanceId)
  const budgetByCategory = useBudgetByCategoryChart(liveProjects)
  const {
    items: accountBreakdown,
    loading: accountBreakdownLoading,
    error: accountBreakdownError,
  } = useAccountCodesBreakdown(liveProjects)
  const showSkeleton = useDelayedLoading(instanceLoading || loading)
  const cycleName = selectedCycle?.name ?? 'ICT Budget Planning 2026'
  const daysRemaining = computeDaysRemaining(selectedCycle?.endDate)
  const pendingReviewProjects = liveProjects.filter((project) => project.status === 'Submitted to Reviewer')
  const reviewCompletedProjects = liveProjects.filter((project) => project.status === 'Reviewer Review Completed')
  const clarificationSentProjects = liveProjects.filter((project) => project.status === 'Clarification Required')
  const sentToApproverProjects = liveProjects.filter((project) => isReviewerSentToApproverProjectStatus(project.status))
  const approvedProjects = liveProjects.filter((project) => project.status === 'Approved')
  const submittedToDgeProjects = liveProjects.filter((project) => project.status === 'Submitted to DGE')
  const draftProjects = liveProjects.filter((project) => project.status === 'Draft')
  const approverStageProjects = liveProjects.filter(
    (project) => project.status === 'Submitted to Approver' || project.status === 'Approved'
  )

  const toReview = pendingReviewProjects.length
  const reviewCompleted = reviewCompletedProjects.length
  const clarificationPending = clarificationSentProjects.length
  const reviewed = sentToApproverProjects.length

  const totalQueueBudget = liveProjects.reduce((sum, p) => sum + p.requestedBudget, 0)
  const reviewedBudget = sentToApproverProjects.reduce((sum, p) => sum + p.requestedBudget, 0)
  const approverStageBudget = approverStageProjects.reduce((sum, p) => sum + p.requestedBudget, 0)
  const approvedBudget = approvedProjects.reduce((sum, p) => sum + p.requestedBudget, 0)
  const submittedToDgeBudget = submittedToDgeProjects.reduce((sum, p) => sum + p.requestedBudget, 0)
  const avgConfidence = liveProjects.length > 0
    ? Math.round(liveProjects.reduce((sum, p) => sum + p.aiScore, 0) / liveProjects.length)
    : 0
  const predictedApproval = Math.round(totalQueueBudget * (avgConfidence / 100))

  const attentionCount = toReview + reviewCompleted + clarificationPending

  const attentionProjects = useMemo(
    () =>
      [...pendingReviewProjects]
        .sort((a, b) => parseProjectDate(b) - parseProjectDate(a))
        .slice(0, 2),
    [pendingReviewProjects]
  )

  const latestProjects = useMemo(
    () =>
      [...liveProjects]
        .sort((a, b) => parseProjectDate(b) - parseProjectDate(a))
        .slice(0, 2),
    [liveProjects]
  )

  const showPendingReviewPanel = attentionProjects.length > 0
  const focusProjects = showPendingReviewPanel ? attentionProjects : latestProjects

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
      share: totalQueueBudget > 0 ? Math.round((amount / totalQueueBudget) * 100) : 0,
    }
  })

  const budgetByReviewStatus = [
    {
      name: 'Pending My Approval',
      value: pendingReviewProjects.reduce((sum, p) => sum + p.requestedBudget, 0),
      fill: dashboardStatusColors.toReview,
    },
    {
      name: 'With Respondent',
      value: draftProjects.reduce((sum, p) => sum + p.requestedBudget, 0),
      fill: dashboardStatusColors.needsWork,
    },
    {
      name: 'With Approver',
      value: approverStageBudget,
      fill: dashboardStatusColors.reviewed,
    },
    {
      name: 'Clarification Open',
      value: clarificationSentProjects.reduce((sum, p) => sum + p.requestedBudget, 0),
      fill: dashboardStatusColors.clarificationPending,
    },
    {
      name: 'Submitted to DGE',
      value: submittedToDgeBudget,
      fill: '#7C3AED',
    },
  ].map((item) => ({
    ...item,
    percent: totalQueueBudget > 0 ? Math.round((item.value / totalQueueBudget) * 100) : 0,
  }))

  const portfolioIssues = [
    {
      title: '2 submissions appear to have duplicate or near-duplicate scope.',
      detail: 'Cloud Infrastructure Modernization, Network Infrastructure Upgrade — overlapping technical objectives.',
      icon: <CopyPlus className="h-4 w-4" />,
      tone: '#F59E0B',
      badge: 'Warning',
    },
    {
      title: '3 projects are flagged as high risk due to incomplete documentation.',
      detail: 'Missing cost breakdowns, technical assessments, or vendor justification in current submissions.',
      icon: <ShieldAlert className="h-4 w-4" />,
      tone: '#EF4444',
      badge: 'Critical',
    },
    {
      title: '1 submission has budget values inconsistent with attached cost documents.',
      detail: 'Cybersecurity Enhancement Program — requested amount does not match itemised breakdown.',
      icon: <Scale className="h-4 w-4" />,
      tone: '#F59E0B',
      badge: 'Warning',
    },
    {
      title: '1 clarification is overdue by 3 days with no respondent reply.',
      detail: 'Network Infrastructure Upgrade — raised by reviewer, awaiting Khalid Al-Mansoori.',
      icon: <Clock3 className="h-4 w-4" />,
      tone: '#EF4444',
      badge: 'Overdue',
    },
    {
      title: '2 submissions show weak strategic alignment justification.',
      detail: 'AI-Powered Customer Service, Smart Government Services Portal — justification lacks DGE priority mapping.',
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
      {/* ─── Hero banner ─── */}
      <section className="relative overflow-hidden rounded-[30px] border border-[#D7E4F4] bg-[linear-gradient(135deg,#F8FBFF_0%,#EEF5FF_45%,#FFFFFF_100%)] p-6 shadow-none dark:border-white/10 dark:bg-[linear-gradient(135deg,#0F172A_0%,#16263E_52%,#102946_100%)]">
        <div className="absolute -left-10 top-0 h-36 w-36 rounded-full bg-[#286CFF]/10 blur-3xl dark:bg-[#286CFF]/20" />
        <div className="absolute right-0 top-8 h-40 w-40 rounded-full bg-[#22C55E]/10 blur-3xl dark:bg-[#22C55E]/10" />
        <div className="relative">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#CFE0FF] bg-white/75 px-3 py-1 text-xs font-semibold text-[#286CFF] backdrop-blur dark:border-[#4F98FF]/30 dark:bg-white/5 dark:text-[#9FC4FF]">
              <FileSearch className="h-3.5 w-3.5" />
              Reviewer Workspace
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-[#0F172A] dark:text-white">
              {cycleName}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#475569] dark:text-slate-100">
              Current cycle status: reviewer assessment is active, submitted projects are being validated, and clarifications are routed to respondents before items move to approver review.
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
              <span className="inline-flex items-center gap-2 rounded-full bg-[#FFF4E5] px-3 py-1.5 font-medium text-[#D97706] dark:bg-[#D97706]/15 dark:text-[#FCD34D]">
                <MessageSquareMore className="h-4 w-4" />
                Clarifications go to Respondent only
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Metric cards ─── */}
      <section className="grid grid-cols-1 items-stretch gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(340px,0.8fr)]">
        <div className="grid h-full grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
          <ActionMetricCard
            title={<><span className="block">Pending</span><span className="block">Review</span></>}
            value={toReview}
            accent={dashboardPalette.seaBlue}
            badge="Pending"
            icon={<Radar className="h-5 w-5" />}
            href="/reviewer/projects?tab=pending-review"
            description="Submitted items waiting for reviewer assessment and action."
          />
          <ActionMetricCard
            title={<><span className="block">Review</span><span className="block">Completed</span></>}
            value={reviewCompleted}
            accent={dashboardPalette.aeGreen}
            badge="Ready"
            icon={<ClipboardCheck className="h-5 w-5" />}
            href="/reviewer/projects?tab=review-completed"
            description="Reviewer-cleared items ready for onward approver submission."
          />
          <ActionMetricCard
            title={<><span className="block">Clarification</span><span className="block">Open</span></>}
            value={clarificationPending}
            accent={dashboardPalette.camelYellow}
            badge="Open"
            icon={<MessageSquareMore className="h-5 w-5" />}
            href="/reviewer/projects?tab=clarification"
            description="Projects sent back to respondent for reviewer clarification."
          />
          <ActionMetricCard
            title={<><span className="block">Sent</span><span className="block">Approver</span></>}
            value={reviewed}
            accent={dashboardPalette.aeGreen}
            badge="Forwarded"
            icon={<ClipboardCheck className="h-5 w-5" />}
            href="/reviewer/projects?tab=submitted-approver"
            description="Reviewer-forwarded items now progressing in approver flow."
          />
        </div>

        <Card className="h-full overflow-hidden rounded-[28px] border-[#D9E6F5] bg-white shadow-none dark:border-white/10 dark:bg-[#162339]">
          <CardContent className="p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-xl font-bold text-[#0F172A] dark:text-white">Review Snapshot</h3>
                  <InfoHint text="Consolidated reviewer view of queue budget, completed review value, and AI-estimated approval outlook." />
                </div>
                <p className="mt-1 text-sm text-[#64748B] dark:text-slate-100">
                  Informational metrics for queue size, reviewed value, and likely approval volume
                </p>
              </div>
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#E7F5FF] text-[#286CFF] dark:bg-[#286CFF]/15 dark:text-white">
                <BadgeDollarSign className="h-5 w-5" />
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-[22px] border border-[#DCE8F6] bg-[#F8FBFF] p-4 shadow-none dark:border-white/10 dark:bg-[#1B2A41]">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold tracking-[0.06em] text-[#64748B] dark:text-slate-100">Total Queue Budget</p>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#E7F5FF] text-[#286CFF] dark:bg-[#286CFF]/15">
                    <BadgeDollarSign className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-4">
                  <CompactAmount amount={totalQueueBudget} />
                </div>
              </div>

              <div className="rounded-[22px] border border-[#DCE8F6] bg-[#F8FBFF] p-4 shadow-none dark:border-white/10 dark:bg-[#1B2A41]">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold tracking-[0.06em] text-[#64748B] dark:text-slate-100">Reviewed Budget</p>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#ECFDF3] text-[#16A34A] dark:bg-[#16A34A]/15">
                    <ClipboardCheck className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-4">
                  <CompactAmount amount={reviewedBudget} iconColor={dashboardPalette.aeGreen} />
                </div>
              </div>

              <div className="rounded-[22px] border border-[#DCE8F6] bg-[#F8FBFF] p-4 shadow-none dark:border-white/10 dark:bg-[#1B2A41]">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold tracking-[0.06em] text-[#64748B] dark:text-slate-100">AI Predicted Approval</p>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#ECFDF6] text-[#0F9D7A] dark:bg-[#0F9D7A]/15">
                    <BrainCircuit className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-4">
                  <CompactAmount amount={predictedApproval} iconColor="#0F9D7A" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ─── AI Portfolio Summary ─── */}
      <section
        title="AI summary of portfolio-wide risks, quality signals, and review priorities."
        className="overflow-hidden rounded-[28px] border border-[#F6C9CF] bg-[linear-gradient(135deg,#FFF8FA_0%,#FFF9F6_100%)] shadow-none dark:border-[#5D3240] dark:bg-[linear-gradient(135deg,#26131C_0%,#1E2438_100%)]"
      >
        <button
          type="button"
          onClick={() => setPortfolioExpanded((v) => !v)}
          className="flex w-full items-start justify-between gap-4 px-6 py-5 text-left transition-colors hover:bg-white/30 dark:hover:bg-white/5"
        >
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#7C3AED_0%,#9333EA_100%)] text-white shadow-[0_16px_30px_rgba(124,58,237,0.28)]">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold text-[#0F172A] dark:text-white">AI Portfolio Summary</h2>
                <InfoHint text="AI scans all submitted projects for quality gaps, documentation issues, budget anomalies, duplicate scope, and strategic alignment concerns to guide review priorities." />
                <span className="inline-flex items-center rounded-full bg-[#FFF1F2] px-2.5 py-1 text-xs font-semibold text-[#DC2626] dark:bg-[#DC2626]/15 dark:text-[#FCA5A5]">
                  Action Required
                </span>
              </div>
              <p className="mt-1 text-sm text-[#475569] dark:text-slate-100">
                Queue status: {attentionCount} submissions need attention before forwarding to Approver.
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-4">
            <div className="hidden items-center gap-4 text-sm md:flex">
              <span className="text-[#0F172A] dark:text-white">
                {liveProjects.length} <span className="text-[#64748B] dark:text-slate-100">in queue</span>
              </span>
              <span className="text-[#286CFF] dark:text-[#C6DBFF]">
                {avgConfidence}% <span className="text-[#64748B] dark:text-slate-100">avg confidence</span>
              </span>
              <span className="text-[#16A34A] dark:text-[#BBF7D0]">
                {reviewed} <span className="text-[#64748B] dark:text-slate-100">sent onward</span>
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
                Recommended Review Actions
              </p>
              <div className="mt-3 grid gap-2 text-sm text-[#475569] dark:text-slate-100">
                {[
                  'Raise clarification to respondents for missing cost breakdowns and incomplete documentation.',
                  'Flag duplicate-scope projects before forwarding to Approver.',
                  'Prioritise high-risk submissions for immediate review.',
                  'Verify overdue clarifications and follow up with respondents.',
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

      {/* ─── Projects Requiring Attention + Budget Mix ─── */}
      <section className="grid grid-cols-1 gap-5 xl:grid-cols-2 [&_*]:shadow-none">
        <Card
          title="Reviewer-owned projects that are ready for assessment or need immediate attention."
          className="overflow-hidden rounded-[28px] border-[#D9E6F5] bg-white shadow-none dark:border-white/10 dark:bg-[#162339]"
        >
          <CardContent className="p-6">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-xl font-bold text-[#0F172A] dark:text-white">
                    {showPendingReviewPanel ? 'Projects Requiring Attention' : 'Latest ICT Budgets'}
                  </h3>
                  <InfoHint
                    text={
                      showPendingReviewPanel
                        ? 'Shows the latest ICT budget submissions that are currently pending with the reviewer.'
                        : 'No project is pending with the reviewer right now, so this section falls back to the latest ICT budgets in the workspace.'
                    }
                  />
                </div>
                <p className="mt-1 text-sm text-[#64748B] dark:text-slate-100">
                  {showPendingReviewPanel
                    ? 'Latest submissions that are waiting for reviewer action'
                    : 'Most recent ICT budgets visible in the reviewer workspace'}
                </p>
              </div>
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#E7F5FF] text-[#286CFF] dark:bg-[#286CFF]/18 dark:text-[#9FC4FF]">
                <FolderOpen className="h-5 w-5" />
              </div>
            </div>

            <div className="space-y-3">
              {focusProjects.map((project, index) => (
                  <Link
                    key={project.id}
                    to={`/reviewer/review-queue/${project.id}`}
                    className="group block rounded-[22px] border border-[#DCE8F6] bg-white p-4 shadow-none transition-all duration-200 hover:-translate-y-0.5 hover:border-[#286CFF] hover:bg-[#F8FBFF] hover:shadow-none dark:border-white/10 dark:bg-[#1B2A41] dark:hover:border-[#4F98FF] dark:hover:bg-[#203352]"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#FEE2E2] text-xs font-bold text-[#DC2626] dark:bg-[#DC2626]/15 dark:text-[#FCA5A5]">
                            {index + 1}
                          </span>
                          <p className="truncate text-[15px] font-semibold text-[#0F172A] dark:text-white">{project.name}</p>
                        </div>
                        <p className="mt-1.5 text-sm text-[#64748B] dark:text-slate-100">{project.strategicPriority}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                          <span className="inline-flex items-center rounded-full bg-[#E7F5FF] px-2.5 py-1 font-semibold text-[#286CFF] dark:bg-[#286CFF]/15 dark:text-[#C6DBFF]">
                            {project.status}
                          </span>
                          <span className="inline-flex items-center rounded-full bg-[#F8FAFC] px-2.5 py-1 font-semibold text-[#475569] dark:bg-white/10 dark:text-slate-100">
                            {project.budgetType}
                          </span>
                          <span className="text-[#94A3B8]">AI: {project.aiScore}%</span>
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <CurrencyAmount amount={project.requestedBudget} className="text-sm font-semibold text-[#0F172A] dark:text-white" iconSize={12} />
                        <MoveRight className="h-4 w-4 text-[#94A3B8] transition-transform group-hover:translate-x-0.5 group-hover:text-[#286CFF]" />
                      </div>
                    </div>
                  </Link>
                ))}
            </div>

            <div className="mt-4">
              <Button variant="outline" asChild className="h-10 rounded-2xl">
                <Link to={showPendingReviewPanel ? '/reviewer/projects?tab=pending-review' : '/reviewer/projects'}>
                  View All Projects
                  <MoveRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card
          title="Requested budget distribution across review statuses in the current queue."
          className="overflow-hidden rounded-[28px] border-[#D9E6F5] bg-white shadow-none dark:border-white/10 dark:bg-[#162339]"
        >
          <CardContent className="p-6">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-xl font-bold text-[#0F172A] dark:text-white">Queue Budget Mix</h3>
                  <InfoHint text="Shows where the total requested budget currently sits across review statuses — helping reviewers understand what is pending, blocked by clarification, or already reviewed." />
                </div>
                <p className="mt-1 text-sm text-[#64748B] dark:text-slate-100">
                  Submitted budget split by current review status
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
                      data={budgetByReviewStatus}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={58}
                      outerRadius={88}
                      paddingAngle={3}
                      strokeWidth={0}
                    >
                      {budgetByReviewStatus.map((entry) => (
                        <Cell key={entry.name} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xs font-semibold tracking-[0.06em] text-[#64748B] dark:text-slate-100">Queue</span>
                  <CurrencyAmount amount={totalQueueBudget} className="mt-1 text-2xl font-bold text-[#0F172A] dark:text-white" iconSize={15} />
                </div>
              </div>

              <div className="space-y-3">
                {budgetByReviewStatus.map((item) => (
                  <div key={item.name} className="rounded-[20px] border border-[#DCE8F6] bg-white p-4 shadow-none dark:border-white/10 dark:bg-[#1B2A41]">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.fill }} />
                        <p className="text-sm font-semibold text-[#0F172A] dark:text-white">{item.name}</p>
                      </div>
                      <span className="text-xs font-semibold text-[#64748B] dark:text-slate-100">{item.percent}%</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-3 text-sm">
                      <span className="text-[#64748B] dark:text-slate-100">Budget</span>
                      <CurrencyAmount amount={item.value} className="text-sm font-semibold text-[#0F172A] dark:text-white" iconSize={13} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ─── Budget by Category + Account codes ─── */}
      <section className="grid grid-cols-1 gap-5 xl:grid-cols-2 [&_*]:shadow-none">
        <Card
          title="Budget distribution across ICT strategic categories for the current review cycle."
          className="overflow-hidden rounded-[28px] border-[#D9E6F5] bg-white shadow-none dark:border-white/10 dark:bg-[#162339]"
        >
          <CardContent className="p-6">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-xl font-bold text-[#0F172A] dark:text-white">Budget by Category</h3>
                  <InfoHint text="Shows how the total submitted budget is distributed across strategic ICT categories, helping reviewers identify where the largest funding requests are concentrated." />
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
          title="Account codes receiving the largest share of budget across submitted projects."
          className="overflow-hidden rounded-[28px] border-[#D9E6F5] bg-white shadow-none dark:border-white/10 dark:bg-[#162339]"
        >
          <CardContent className="p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-xl font-bold text-[#0F172A] dark:text-white">Account Codes Breakdown</h3>
                  <InfoHint text="Highlights which account codes are claiming the largest share of budget across all submitted projects in the review queue — useful for identifying concentration risk." />
                </div>
                <p className="mt-1 text-sm text-[#64748B] dark:text-slate-100">
                  Most-funded budget accounts across submitted projects
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

      {/* ─── Review Queue Workspace + (New vs Recurring + AI Budget Prediction) ─── */}
      <section className="grid grid-cols-1 items-stretch gap-5 xl:grid-cols-[1fr_1fr] [&_*]:shadow-none">
        <Card
          title="Reviewer workspace with submission statuses, risk signals, and suggested next actions."
          className="overflow-hidden rounded-[28px] border-[#D9E6F5] bg-white shadow-none dark:border-white/10 dark:bg-[#162339]"
        >
          <CardContent className="flex h-full flex-col p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-xl font-bold text-[#0F172A] dark:text-white">Review Queue Workspace</h3>
                  <InfoHint text="This workspace gives you a live view of the review queue status and points you toward the highest priority next actions in the review pipeline." />
                </div>
                <p className="mt-1 text-sm text-[#64748B] dark:text-slate-100">
                  Open the reviewer projects workspace to assess submissions, raise clarifications to respondents, and forward ready projects to the Approver.
                </p>
              </div>
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#286CFF]/10 text-[#286CFF] dark:bg-[#286CFF]/18 dark:text-white">
                <FolderOpen className="h-5 w-5" />
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              {[
                { label: 'Pending Review', value: toReview, tone: dashboardStatusColors.toReview },
                { label: 'Review Completed', value: reviewCompleted, tone: '#16A34A' },
                { label: 'Clarif. Sent', value: clarificationPending, tone: dashboardStatusColors.clarificationPending },
                { label: 'Sent To Approver', value: reviewed, tone: dashboardStatusColors.reviewed },
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
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-semibold text-[#0F172A] dark:text-white">Suggested Next Move</p>
                  <p className="mt-1 text-sm leading-6 text-[#64748B] dark:text-slate-100">
                    {toReview > 0
                      ? `Review ${toReview} pending submission${toReview === 1 ? '' : 's'} and raise clarifications where documentation or budget justification is incomplete.`
                      : 'There are no reviewer-owned submissions pending right now. Keep an eye on clarification returns and newly submitted budgets.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-[24px] border border-[#DCE8F6] bg-white p-4 shadow-none dark:border-white/10 dark:bg-[#1B2A41]">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[var(--ai-accent)]" />
                <p className="text-xs font-semibold tracking-[0.06em] text-[var(--ai-accent)]">
                  Recommended Review Actions
                </p>
              </div>
              <div className="mt-3 grid gap-2">
                {[
                  'Raise clarification to respondents for all missing documentation.',
                  'Flag duplicate-scope projects before forwarding to Approver.',
                  'Prioritise high-risk submissions — review and decide within this cycle.',
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
                <Link to="/reviewer/projects">
                  Open Reviewer Projects
                  <MoveRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid h-full gap-5">
          <Card
            title="Shows how requested budget is distributed across the four ICT budget activity types in the reviewer workspace."
            className="overflow-hidden rounded-[28px] border-[#D9E6F5] bg-white shadow-none dark:border-white/10 dark:bg-[#162339]"
          >
            <CardContent className="p-6">
              <div className="mb-5">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-xl font-bold text-[#0F172A] dark:text-white">Budget Type Distribution</h3>
                  <InfoHint text="Shows how much of the reviewer-visible requested budget sits in each ICT budget activity type." />
                </div>
                <p className="mt-1 text-sm text-[#64748B] dark:text-slate-100">
                  Requested budget split across all four budget types
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
                        <p className="mt-1 text-xs text-[#64748B] dark:text-slate-100">{item.share}% of queue total</p>
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
            title="AI estimate of how much submitted budget is likely to receive final approval."
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
                      <InfoHint text="AI estimates how much of the currently reviewed budget is likely to be approved through the full governance chain, based on submission quality, risk levels, and historical approval patterns." />
                      <span className="inline-flex items-center rounded-full bg-[#F3E8FF] px-2.5 py-1 text-xs font-semibold text-[#7C3AED] dark:bg-[#7C3AED]/20 dark:text-[#DAC0FF]">
                        Beta
                      </span>
                    </div>
                    <p className="mt-1 text-sm leading-6 text-[#475569] dark:text-slate-100">
                      Based on submission quality, AI confidence scores, and approval patterns, AI predicts that{' '}
                      <CurrencyAmount
                        amount={predictedApproval}
                        className="font-semibold text-[#7C3AED] dark:text-[#DAC0FF]"
                        iconColor="#7C3AED"
                        iconSize={13}
                      />{' '}
                      of the queue budget is likely to move forward to final approval.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    { label: 'In queue', value: liveProjects.length },
                    { label: 'Avg confidence', value: `${avgConfidence}%` },
                    { label: 'Clarifications', value: clarificationPending },
                    { label: 'Sent onward', value: reviewed },
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
                  <span>{totalQueueBudget > 0 ? Math.round((predictedApproval / totalQueueBudget) * 100) : 0}%</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-white/70 dark:bg-white/10">
                  <div
                    className="h-full rounded-full bg-[linear-gradient(90deg,#7C3AED_0%,#A855F7_45%,#C084FC_100%)] shadow-[0_8px_24px_rgba(124,58,237,0.28)]"
                    style={{ width: `${totalQueueBudget > 0 ? Math.round((predictedApproval / totalQueueBudget) * 100) : 0}%` }}
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
