import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
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
  FileSearch,
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
  Users,
  WalletCards,
} from 'lucide-react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { AccountCodesBreakdown } from '@/components/charts/AccountCodesBreakdown'
import { BudgetByCategory } from '@/components/charts/BudgetByCategory'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CurrencyAmount } from '@/components/shared/CurrencyAmount'
import { AiPortfolioSummary } from '@/components/shared/AiPortfolioSummary'
import { PortfolioInsightCharts } from '@/components/shared/PortfolioInsightCharts'
import { useCycle } from '@/context/CycleContext'
import { useInstance } from '@/context/InstanceContext'
import {
  useAccountCodesBreakdown,
  useBudgetByCategoryChart,
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
import { isReviewerSentToApproverProjectStatus } from '@/services/projectService'

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
  const { summary: portfolioSummary, loading: portfolioLoading, error: portfolioError } = usePortfolioSummary('reviewer', instanceId)
  const budgetByCategory = useBudgetByCategoryChart(liveProjects)
  const {
    items: accountBreakdown,
    loading: accountBreakdownLoading,
    error: accountBreakdownError,
  } = useAccountCodesBreakdown(liveProjects)
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
  const predictedApproval = liveProjects.filter((p) => p.aiScore > 70).reduce((sum, p) => sum + p.requestedBudget, 0)

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
  const recommendedActions = useMemo(
    () => getRoleRecommendedActions(portfolioSummary, 'reviewer'),
    [portfolioSummary]
  )
  const planningSummary = useMemo(
    () => resolvePortfolioTemplate(getPortfolioSummaryRoleView(portfolioSummary, 'reviewer')?.planning_cycle_summary_template, portfolioSummary),
    [portfolioSummary]
  )
  const reviewerProgressAssigned = toReview + reviewCompleted + clarificationPending + reviewed
  const reviewerProgressValue = reviewerProgressAssigned > 0 ? Math.round((reviewed / reviewerProgressAssigned) * 100) : 0

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
      fill: dashboardPalette.primary,
    },
    {
      name: 'With Respondent',
      value: draftProjects.reduce((sum, p) => sum + p.requestedBudget, 0),
      fill: dashboardPalette.primarySoft,
    },
    {
      name: 'With Approver',
      value: approverStageBudget,
      fill: dashboardPalette.primaryDeep,
    },
    {
      name: 'Clarification Open',
      value: clarificationSentProjects.reduce((sum, p) => sum + p.requestedBudget, 0),
      fill: dashboardPalette.primaryMuted,
    },
    {
      name: 'Submitted to DGE',
      value: submittedToDgeBudget,
      fill: dashboardPalette.primaryPale,
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
      tone: dashboardPalette.primary,
      badge: 'Warning',
    },
    {
      title: '3 projects are flagged as high risk due to incomplete documentation.',
      detail: 'Missing cost breakdowns, technical assessments, or vendor justification in current submissions.',
      icon: <ShieldAlert className="h-4 w-4" />,
      tone: dashboardPalette.primaryDeep,
      badge: 'Critical',
    },
    {
      title: '1 submission has budget values inconsistent with attached cost documents.',
      detail: 'Cybersecurity Enhancement Program — requested amount does not match itemised breakdown.',
      icon: <Scale className="h-4 w-4" />,
      tone: dashboardPalette.primarySoft,
      badge: 'Warning',
    },
    {
      title: '1 clarification is overdue by 3 days with no respondent reply.',
      detail: 'Network Infrastructure Upgrade — raised by reviewer, awaiting Khalid Al-Mansoori.',
      icon: <Clock3 className="h-4 w-4" />,
      tone: dashboardPalette.primaryMuted,
      badge: 'Overdue',
    },
    {
      title: '2 submissions show weak strategic alignment justification.',
      detail: 'AI-Powered Customer Service, Smart Government Services Portal — justification lacks DGE priority mapping.',
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
      {/* ─── Hero banner ─── */}
      <section className="relative p-1">
        <div className="relative">
          <div className="max-w-3xl">
            <h1 className="text-3xl font-bold tracking-tight text-[#0F172A] dark:text-white">
              {cycleName}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#475569] dark:text-slate-100">
              {planningSummary || 'Current cycle status: reviewer assessment is active, submitted projects are being validated, and clarifications are routed to respondents before items move to approver review.'}
            </p>
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
                  <span className="text-[#0F172A] dark:text-white">{reviewed}/{reviewerProgressAssigned || 0}</span>
                  <span className="h-2 w-16 overflow-hidden rounded-full bg-[#EEF3F8] dark:bg-white/10">
                    <span className="block h-full rounded-full bg-[#286CFF]" style={{ width: `${reviewerProgressValue}%` }} />
                  </span>
                </span>
              </div>
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

        <Card className="h-full overflow-hidden rounded-[28px] border-[#D9E6F5] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#162339]">
          <CardContent className="p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <BadgeDollarSign className="h-5 w-5 shrink-0 text-[#286CFF]" />
                  <h3 className="text-xl font-bold text-[#0F172A] dark:text-white">Review Snapshot</h3>
                  <InfoHint text="Consolidated reviewer view of queue budget, completed review value, and AI-estimated approval outlook." />
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-[22px] border border-[#DCE8F6] bg-[#F8FBFF] px-4 py-4 dark:border-white/10 dark:bg-[#1B2A41]">
              <div className="grid gap-4 sm:grid-cols-3 sm:divide-x sm:divide-[#DCE8F6] dark:sm:divide-white/10">
                <div className="sm:pr-4">
                  <p className="text-xs font-semibold tracking-[0.06em] text-[#64748B] dark:text-slate-100">Total Queue Budget</p>
                  <div className="mt-3">
                    <CompactAmount amount={totalQueueBudget} />
                  </div>
                </div>
                <div className="sm:px-4">
                  <p className="text-xs font-semibold tracking-[0.06em] text-[#64748B] dark:text-slate-100">Reviewed Budget</p>
                  <div className="mt-3">
                    <CompactAmount amount={reviewedBudget} iconColor={dashboardPalette.primarySoft} />
                  </div>
                </div>
                <div className="sm:pl-4">
                  <p className="text-xs font-semibold tracking-[0.06em] text-[#64748B] dark:text-slate-100">AI Predicted Approval</p>
                  <div className="mt-3">
                    <CompactAmount amount={predictedApproval} iconColor={dashboardPalette.primary} />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <AiPortfolioSummary
        role="reviewer"
        summary={portfolioSummary}
        loading={portfolioLoading}
        error={portfolioError}
        projects={liveProjects}
        variant="dashboard"
        projectHrefBuilder={(projectId) => `/reviewer/review-queue/${projectId}`}
      />

      {/* ─── Projects Requiring Attention + Budget Mix ─── */}
      <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Card
          title="Reviewer-owned projects that are ready for assessment or need immediate attention."
          className="overflow-hidden rounded-[28px] border-[#D9E6F5] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#162339]"
        >
          <CardContent className="p-6">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <FolderOpen className="h-5 w-5 shrink-0 text-[#286CFF]" />
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
            </div>

            <div className="space-y-3">
              {focusProjects.map((project, index) => (
                  <Link
                    key={project.id}
                    to={`/reviewer/review-queue/${project.id}`}
                    className="group block rounded-[22px] border border-[#DCE8F6] bg-white p-4 shadow-[0_8px_20px_rgba(15,23,42,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#286CFF] hover:bg-[#F8FBFF] hover:shadow-[0_12px_24px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#1B2A41] dark:hover:border-[#4F98FF] dark:hover:bg-[#203352]"
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

        <PortfolioInsightCharts summary={portfolioSummary} chartKeys={['aiReviewFlags']} />

        <Card
          title="Requested budget distribution across review statuses in the current queue."
          className="hidden overflow-hidden rounded-[28px] border-[#D9E6F5] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#162339]"
        >
          <CardContent className="p-6">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <ClipboardCheck className="h-5 w-5 shrink-0 text-[#286CFF]" />
                  <h3 className="text-xl font-bold text-[#0F172A] dark:text-white">Queue Budget Mix</h3>
                  <InfoHint text="Shows where the total requested budget currently sits across review statuses — helping reviewers understand what is pending, blocked by clarification, or already reviewed." />
                </div>
                <p className="mt-1 text-sm text-[#64748B] dark:text-slate-100">
                  Submitted budget split by current review status
                </p>
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
                  <div key={item.name} className="rounded-[20px] border border-[#DCE8F6] bg-white p-4 shadow-[0_8px_20px_rgba(15,23,42,0.04)] dark:border-white/10 dark:bg-[#1B2A41]">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: item.fill }} />
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
      <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Card
          title="Budget distribution across ICT strategic categories for the current review cycle."
          className="overflow-hidden rounded-[28px] border-[#D9E6F5] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#162339]"
        >
          <CardContent className="p-6">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Layers className="h-5 w-5 shrink-0 text-[#286CFF]" />
                  <h3 className="text-xl font-bold text-[#0F172A] dark:text-white">Budget by Strategic Priority</h3>
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
          className="overflow-hidden rounded-[28px] border-[#D9E6F5] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#162339]"
        >
          <CardContent className="p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <WalletCards className="h-5 w-5 shrink-0 text-[#286CFF]" />
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
      <section className="grid grid-cols-1 items-stretch gap-5 xl:grid-cols-[1fr_1fr]">
        <Card
          title="Reviewer workspace with submission statuses, risk signals, and suggested next actions."
          className="overflow-hidden rounded-[28px] border-[#D9E6F5] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#162339]"
        >
          <CardContent className="flex h-full flex-col p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <FolderOpen className="h-5 w-5 shrink-0 text-[#286CFF]" />
                  <h3 className="text-xl font-bold text-[#0F172A] dark:text-white">Review Queue Workspace</h3>
                  <InfoHint text="This workspace gives you a live view of the review queue status and points you toward the highest priority next actions in the review pipeline." />
                </div>
                <p className="mt-1 text-sm text-[#64748B] dark:text-slate-100">
                  Open the reviewer projects workspace to assess submissions, raise clarifications to respondents, and forward ready projects to the Approver.
                </p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              {[
                { label: 'Pending Review', value: toReview, tone: dashboardPalette.primary },
                { label: 'Review Completed', value: reviewCompleted, tone: dashboardPalette.primarySoft },
                { label: 'Clarif. Sent', value: clarificationPending, tone: dashboardPalette.primaryDeep },
                { label: 'Sent To Approver', value: reviewed, tone: dashboardPalette.primaryMuted },
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
                <Sparkles className="h-4 w-4 text-[#A855F7] dark:text-[#E9D5FF]" />
                <p className="text-sm font-semibold text-[#A855F7] dark:text-[#E9D5FF]">
                  Recommended Review Actions
                </p>
              </div>
              <ul className="mt-3 space-y-2">
                {(recommendedActions.length > 0
                  ? recommendedActions.slice(0, 3)
                  : [
                      'Raise clarification to respondents for all missing documentation.',
                      'Flag duplicate-scope projects before forwarding to Approver.',
                      'Prioritise high-risk submissions — review and decide within this cycle.',
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
                <Link to="/reviewer/projects">
                  Open Reviewer Projects
                  <MoveRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid h-full gap-5">
          <PortfolioInsightCharts summary={portfolioSummary} chartKeys={['budgetConsideration']} />
          <Card
            title="Shows how requested budget is distributed across the four ICT budget activity types in the reviewer workspace."
            className="hidden overflow-hidden rounded-[28px] border-[#D9E6F5] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#162339]"
          >
            <CardContent className="p-6">
              <div className="mb-5">
                <div className="flex flex-wrap items-center gap-2">
                  <BadgeDollarSign className="h-5 w-5 shrink-0 text-[#286CFF]" />
                  <h3 className="text-xl font-bold text-[#0F172A] dark:text-white">Budget Type Distribution</h3>
                  <InfoHint text="Shows how much of the reviewer-visible requested budget sits in each ICT budget activity type." />
                </div>
                <p className="mt-1 text-sm text-[#64748B] dark:text-slate-100">
                  Requested budget split across all four budget types
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

        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Card
          title="Shows how requested budget is distributed across the four ICT budget activity types in the reviewer workspace."
          className="overflow-hidden rounded-[28px] border-[#D9E6F5] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#162339]"
        >
          <CardContent className="p-6">
            <div className="mb-5">
              <div className="flex flex-wrap items-center gap-2">
                <BadgeDollarSign className="h-5 w-5 shrink-0 text-[#286CFF]" />
                <h3 className="text-xl font-bold text-[#0F172A] dark:text-white">Budget Type Distribution</h3>
                <InfoHint text="Shows how much of the reviewer-visible requested budget sits in each ICT budget activity type." />
              </div>
              <p className="mt-1 text-sm text-[#64748B] dark:text-slate-100">
                Requested budget split across all four budget types
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
        <PortfolioInsightCharts summary={portfolioSummary} chartKeys={['issues']} />
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
