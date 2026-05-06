import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BadgeDollarSign,
  Bot,
  BrainCircuit,
  Calendar,
  ChevronDown,
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
import { BudgetByCategory } from '@/components/charts/BudgetByCategory'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CurrencyAmount } from '@/components/shared/CurrencyAmount'
import { currentCycle, projects, reviewQueueProjects } from '@/data/db'
import { dashboardPalette, dashboardStatusColors } from '@/lib/dashboardPalette'
import { cn } from '@/lib/utils'

const BREAKDOWN_COLORS = ['#8B5CF6', '#22C55E', '#286CFF', '#F59E0B', '#EC4899']

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
        'group overflow-hidden rounded-[24px] border bg-white p-5 transition-all duration-300 hover:-translate-y-0.5 hover:bg-[linear-gradient(180deg,#FFFFFF_0%,#F1F7FF_100%)] hover:shadow-[0_14px_30px_rgba(15,23,42,0.08)] dark:bg-[#18263F] dark:hover:bg-[#1D2D48] dark:hover:shadow-[0_14px_30px_rgba(2,8,23,0.32)]',
        className
      )}
      style={{ borderColor: `${accent}3D` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold tracking-[0.04em] text-[#64748B] dark:text-slate-100">
            {title}
          </p>
          <div className="mt-4 text-[34px] font-bold leading-none text-[#0F172A] dark:text-white">
            {value}
          </div>
        </div>
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full shadow-inner"
          style={{
            background: `linear-gradient(135deg, ${accent}1F 0%, ${accent}12 100%)`,
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
            boxShadow: `inset 0 0 0 1px ${accent}12`,
          }}
        >
          {badge}
        </span>
      </div>
    </div>
  )
}

function CompactAmount({ amount, iconColor = '#286CFF' }: { amount: number; iconColor?: string }) {
  return <CurrencyAmount amount={amount} className="text-[34px] font-bold leading-none" iconColor={iconColor} iconSize={18} />
}

export default function ReviewerDashboard() {
  const [portfolioExpanded, setPortfolioExpanded] = useState(false)

  const toReview = reviewQueueProjects.filter((p) => p.status === 'To Review').length
  const reviewed = reviewQueueProjects.filter((p) => p.status === 'Reviewed').length
  const clarificationPending = reviewQueueProjects.filter((p) => p.status === 'Clarification Pending').length
  const highRisk = reviewQueueProjects.filter((p) => p.riskLevel === 'High').length

  const totalQueueBudget = reviewQueueProjects.reduce((sum, p) => sum + p.requestedBudget, 0)
  const reviewedBudget = reviewQueueProjects
    .filter((p) => p.status === 'Reviewed')
    .reduce((sum, p) => sum + p.requestedBudget, 0)
  const avgConfidence = Math.round(
    reviewQueueProjects.reduce((s, p) => s + p.aiConfidence, 0) / reviewQueueProjects.length
  )
  const predictedApproval = Math.round(totalQueueBudget * (avgConfidence / 100))

  const attentionCount = toReview + clarificationPending

  const newProjects = reviewQueueProjects.filter((_, i) => i % 2 === 0)
  const recurringProjects = reviewQueueProjects.filter((_, i) => i % 2 !== 0)
  const newProjectsBudget = newProjects.reduce((sum, p) => sum + p.requestedBudget, 0)
  const recurringProjectsBudget = recurringProjects.reduce((sum, p) => sum + p.requestedBudget, 0)
  const newProjectsShare = Math.round((newProjectsBudget / totalQueueBudget) * 100)
  const recurringProjectsShare = 100 - newProjectsShare

  const budgetByReviewStatus = [
    {
      name: 'To Review',
      value: reviewQueueProjects
        .filter((p) => p.status === 'To Review')
        .reduce((sum, p) => sum + p.requestedBudget, 0),
      fill: dashboardStatusColors.toReview,
    },
    {
      name: 'Clarification Pending',
      value: reviewQueueProjects
        .filter((p) => p.status === 'Clarification Pending')
        .reduce((sum, p) => sum + p.requestedBudget, 0),
      fill: dashboardStatusColors.clarificationPending,
    },
    {
      name: 'Reviewed',
      value: reviewedBudget,
      fill: dashboardStatusColors.reviewed,
    },
  ]
    .filter((item) => item.value > 0)
    .map((item) => ({
      ...item,
      percent: Math.round((item.value / totalQueueBudget) * 100),
    }))

  const accountBreakdown = Array.from(
    projects
      .flatMap((p) => p.budgetItems)
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
      pct: Math.round((item.amount / totalQueueBudget) * 100),
      color: BREAKDOWN_COLORS[index % BREAKDOWN_COLORS.length],
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

  return (
    <div className="w-full space-y-6 pb-4">
      {/* ─── Hero banner ─── */}
      <section className="relative overflow-hidden rounded-[30px] border border-[#D7E4F4] bg-[linear-gradient(135deg,#F8FBFF_0%,#EEF5FF_45%,#FFFFFF_100%)] p-6 shadow-[0_28px_80px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-[linear-gradient(135deg,#0F172A_0%,#16263E_52%,#102946_100%)]">
        <div className="absolute -left-10 top-0 h-36 w-36 rounded-full bg-[#286CFF]/10 blur-3xl dark:bg-[#286CFF]/20" />
        <div className="absolute right-0 top-8 h-40 w-40 rounded-full bg-[#22C55E]/10 blur-3xl dark:bg-[#22C55E]/10" />
        <div className="relative">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#CFE0FF] bg-white/75 px-3 py-1 text-xs font-semibold text-[#286CFF] backdrop-blur dark:border-[#4F98FF]/30 dark:bg-white/5 dark:text-[#9FC4FF]">
              <FileSearch className="h-3.5 w-3.5" />
              Reviewer Workspace
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-[#0F172A] dark:text-white">
              Review incoming budgets with clarity, raise clarifications where needed, and move quality submissions forward.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#475569] dark:text-slate-100">
              Assess submitted project budgets, identify risk signals, raise clarifications to respondents, and approve projects for the next governance stage. All clarifications are directed to the Respondent for response.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-3 text-sm">
              <span className="inline-flex items-center gap-2 rounded-full bg-[#E7F5FF] px-3 py-1.5 font-medium text-[#286CFF] dark:bg-[#286CFF]/15 dark:text-[#C6DBFF]">
                <Calendar className="h-4 w-4" />
                {currentCycle.name}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-[#F3FAF4] px-3 py-1.5 font-medium text-[#2C7A43] dark:bg-[#22C55E]/15 dark:text-[#C9F4D1]">
                <Radar className="h-4 w-4" />
                {currentCycle.daysRemaining} days remaining
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
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
        <MetricCard
          title="Total Queue Budget"
          value={<CompactAmount amount={totalQueueBudget} />}
          accent={dashboardPalette.techBlue}
          badge="AED In Queue"
          icon={<BadgeDollarSign className="h-5 w-5" />}
          className="xl:shadow-[0_10px_24px_rgba(40,108,255,0.08)]"
        />
        <MetricCard
          title="Reviewed Budget"
          value={<CompactAmount amount={reviewedBudget} iconColor={dashboardPalette.aeGreen} />}
          accent={dashboardPalette.aeGreen}
          badge="Ready to Forward"
          icon={<ClipboardCheck className="h-5 w-5" />}
          className="shadow-none"
        />
        <MetricCard
          title="AI Predicted Approval"
          value={<CompactAmount amount={predictedApproval} iconColor="#0F9D7A" />}
          accent="#0F9D7A"
          badge="AI Estimate"
          icon={<BrainCircuit className="h-5 w-5" />}
          className="xl:shadow-[0_10px_24px_rgba(15,157,122,0.08)]"
        />
        <MetricCard
          title="Pending Review"
          value={toReview}
          accent={dashboardPalette.seaBlue}
          badge="Awaiting Review"
          icon={<Radar className="h-5 w-5" />}
          className="shadow-none"
        />
        <MetricCard
          title="Clarification Sent"
          value={clarificationPending}
          accent={dashboardPalette.camelYellow}
          badge="Awaiting Respondent"
          icon={<MessageSquareMore className="h-5 w-5" />}
          className="shadow-none"
        />
        <MetricCard
          title="High Risk Items"
          value={highRisk}
          accent={dashboardPalette.aeRed}
          badge="Needs Attention"
          icon={<ShieldAlert className="h-5 w-5" />}
          className="shadow-none"
        />
      </section>

      {/* ─── AI Portfolio Summary ─── */}
      <section
        title="AI summary of portfolio-wide risks, quality signals, and review priorities."
        className="overflow-hidden rounded-[28px] border border-[#F6C9CF] bg-[linear-gradient(135deg,#FFF8FA_0%,#FFF9F6_100%)] shadow-[0_18px_48px_rgba(234,79,73,0.08)] dark:border-[#5D3240] dark:bg-[linear-gradient(135deg,#26131C_0%,#1E2438_100%)]"
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
                <span className="inline-flex items-center rounded-full bg-[#FFF1F2] px-2.5 py-1 text-[11px] font-semibold text-[#DC2626] dark:bg-[#DC2626]/15 dark:text-[#FCA5A5]">
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
                {reviewQueueProjects.length} <span className="text-[#64748B] dark:text-slate-100">in queue</span>
              </span>
              <span className="text-[#286CFF] dark:text-[#C6DBFF]">
                {avgConfidence}% <span className="text-[#64748B] dark:text-slate-100">avg confidence</span>
              </span>
              <span className="text-[#F59E0B] dark:text-[#FCD34D]">
                {highRisk} <span className="text-[#64748B] dark:text-slate-100">high risk</span>
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
                    className="inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[11px] font-semibold"
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
      <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Card
          title="High-priority items in the review queue that need immediate reviewer action."
          className="overflow-hidden rounded-[28px] border-[#D9E6F5] shadow-none dark:border-white/10 dark:bg-[#162339]"
        >
          <CardContent className="p-6">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-xl font-bold text-[#0F172A] dark:text-white">Projects Requiring Attention</h3>
                  <InfoHint text="Projects assigned to the reviewer that are high risk, have missing documentation, or are awaiting a clarification response from the respondent." />
                </div>
                <p className="mt-1 text-sm text-[#64748B] dark:text-slate-100">
                  High-risk and incomplete submissions that need your decision
                </p>
              </div>
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#EA4F49]/10 text-[#EA4F49] dark:bg-[#EA4F49]/18 dark:text-[#FCA5A5]">
                <ShieldAlert className="h-5 w-5" />
              </div>
            </div>

            <div className="space-y-3">
              {reviewQueueProjects
                .filter((p) => p.riskLevel === 'High' || p.hasMissingDocs || p.status === 'Clarification Pending')
                .slice(0, 2)
                .map((project, index) => (
                  <Link
                    key={project.id}
                    to={`/reviewer/review-queue/${project.id}`}
                    className="group block rounded-[24px] border border-[#DCE8F6] bg-[linear-gradient(135deg,#FBFDFF_0%,#F4F8FD_100%)] p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#286CFF] hover:bg-[#EEF5FF] dark:border-white/10 dark:bg-[#1B2A41] dark:hover:border-[#4F98FF] dark:hover:bg-[#203352]"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#FEE2E2] text-xs font-bold text-[#DC2626] dark:bg-[#DC2626]/15 dark:text-[#FCA5A5]">
                            {index + 1}
                          </span>
                          <p className="truncate text-[15px] font-semibold text-[#0F172A] dark:text-white">{project.name}</p>
                        </div>
                        <p className="mt-1.5 text-sm text-[#64748B] dark:text-slate-100">{project.entity}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                          {project.riskLevel === 'High' && (
                            <span className="inline-flex items-center rounded-full bg-[#FEE2E2] px-2.5 py-1 font-semibold text-[#DC2626] dark:bg-[#DC2626]/15 dark:text-[#FCA5A5]">
                              High Risk
                            </span>
                          )}
                          {project.hasMissingDocs && (
                            <span className="inline-flex items-center rounded-full bg-[#FFF4E5] px-2.5 py-1 font-semibold text-[#D97706] dark:bg-[#D97706]/15 dark:text-[#FCD34D]">
                              Missing Docs
                            </span>
                          )}
                          {project.status === 'Clarification Pending' && (
                            <span className="inline-flex items-center rounded-full bg-[#E7F5FF] px-2.5 py-1 font-semibold text-[#286CFF] dark:bg-[#286CFF]/15 dark:text-[#C6DBFF]">
                              Clarif. Pending
                            </span>
                          )}
                          <span className="text-[#94A3B8]">AI: {project.aiConfidence}%</span>
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
                <Link to="/reviewer/review-queue">
                  View Review Queue
                  <MoveRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card
          title="Requested budget distribution across review statuses in the current queue."
          className="overflow-hidden rounded-[28px] border-[#D9E6F5] shadow-none dark:border-white/10 dark:bg-[#162339]"
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
                  <div key={item.name} className="rounded-[20px] border border-[#DCE8F6] bg-[#F8FBFF] p-4 dark:border-white/10 dark:bg-[#1B2A41]">
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
      <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Card
          title="Budget distribution across ICT strategic categories for the current review cycle."
          className="overflow-hidden rounded-[28px] border-[#D9E6F5] shadow-none dark:border-white/10 dark:bg-[#162339]"
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
            <BudgetByCategory />
          </CardContent>
        </Card>

        <Card
          title="Account codes receiving the largest share of budget across submitted projects."
          className="overflow-hidden rounded-[28px] border-[#D9E6F5] shadow-none dark:border-white/10 dark:bg-[#162339]"
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
            <div className="space-y-4">
              {accountBreakdown.map((item) => (
                <div key={item.name} className="rounded-[20px] bg-[#F8FAFC] px-4 py-3 dark:bg-white/5">
                  <div className="flex items-center gap-3">
                    <span
                      className="inline-flex min-w-[64px] items-center justify-center rounded-full px-2.5 py-1 text-[11px] font-semibold"
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

      {/* ─── Review Queue Workspace + (New vs Recurring + AI Budget Prediction) ─── */}
      <section className="grid grid-cols-1 items-stretch gap-5 xl:grid-cols-[1fr_1fr]">
        <Card
          title="Reviewer workspace with submission statuses, risk signals, and suggested next actions."
          className="overflow-hidden rounded-[28px] border-[#D9E6F5] bg-[linear-gradient(135deg,#F8FBFF_0%,#FDFEFF_60%,#EEF6FF_100%)] shadow-none dark:border-white/10 dark:bg-[linear-gradient(135deg,#12233A_0%,#18263F_52%,#112846_100%)]"
        >
          <CardContent className="flex h-full flex-col p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-xl font-bold text-[#0F172A] dark:text-white">Review Queue Workspace</h3>
                  <InfoHint text="This workspace gives you a live view of the review queue status and points you toward the highest priority next actions in the review pipeline." />
                </div>
                <p className="mt-1 text-sm text-[#64748B] dark:text-slate-100">
                  Open the review queue to assess submissions, raise clarifications to respondents, and forward approved projects to the Approver.
                </p>
              </div>
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#286CFF]/10 text-[#286CFF] dark:bg-[#286CFF]/18 dark:text-white">
                <FolderOpen className="h-5 w-5" />
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              {[
                { label: 'Reviewed', value: reviewed, tone: dashboardStatusColors.reviewed },
                { label: 'To Review', value: toReview, tone: dashboardStatusColors.toReview },
                { label: 'Clarif. Sent', value: clarificationPending, tone: dashboardStatusColors.clarificationPending },
                { label: 'High Risk', value: highRisk, tone: dashboardPalette.aeRed },
              ].map((item) => (
                <div key={item.label} className="rounded-[20px] border border-[#DCE8F6] bg-[#F3F8FF] p-4 backdrop-blur dark:border-white/10 dark:bg-[#20314D]">
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

            <div className="mt-5 rounded-[24px] border border-dashed border-[#BED3F3] bg-white/70 p-4 dark:border-[#315389] dark:bg-white/5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EEF5FF] text-[#286CFF] dark:bg-[#286CFF]/18 dark:text-white">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-semibold text-[#0F172A] dark:text-white">Suggested Next Move</p>
                  <p className="mt-1 text-sm leading-6 text-[#64748B] dark:text-slate-100">
                    {toReview > 0
                      ? `Review ${toReview} pending submission${toReview === 1 ? '' : 's'} and raise clarifications where documentation or budget justification is incomplete.`
                      : 'All submissions reviewed. Forward approved projects to the Approver before the cycle deadline.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-[24px] border border-[#DCE8F6] bg-[#F6FAFF] p-4 dark:border-white/10 dark:bg-[#1B2A41]">
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
              <Button asChild className="h-12 w-full rounded-2xl shadow-[0_16px_32px_rgba(40,108,255,0.20)]">
                <Link to="/reviewer/review-queue">
                  Open Review Queue
                  <MoveRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid h-full gap-5">
          <Card
            title="Shows the split between new and recurring project budget requests in the current review queue."
            className="overflow-hidden rounded-[28px] border-[#D9E6F5] shadow-none dark:border-white/10 dark:bg-[#162339]"
          >
            <CardContent className="p-6">
              <div className="mb-5">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-xl font-bold text-[#0F172A] dark:text-white">New vs Recurring in Queue</h3>
                  <InfoHint text="Shows how much of the current review queue budget belongs to new initiatives versus recurring or continuation work — helps reviewers gauge where new investment is being requested." />
                </div>
                <p className="mt-1 text-sm text-[#64748B] dark:text-slate-100">
                  Budget type distribution within the current review queue
                </p>
              </div>
              <div className="grid gap-3">
                <div className="rounded-[22px] border border-[#D8E7FF] bg-[linear-gradient(135deg,#EFF5FF_0%,#FFFFFF_100%)] p-4 shadow-[0_14px_30px_rgba(40,108,255,0.08)] dark:border-[#315389] dark:bg-[linear-gradient(135deg,#132844_0%,#18263F_100%)]">
                  <div className="flex items-center gap-3">
                    <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-[#DCEAFE] text-2xl font-bold text-[#286CFF] dark:bg-[#286CFF]/18 dark:text-white">
                      {newProjects.length}
                    </div>
                    <div>
                      <p className="text-base font-bold text-[#0F172A] dark:text-white">New Requests</p>
                      <CurrencyAmount amount={newProjectsBudget} className="mt-1 text-lg font-bold" iconSize={15} />
                      <p className="mt-1 text-xs text-[#64748B] dark:text-slate-100">{newProjectsShare}% of queue total</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-[22px] border border-[#D5F1E0] bg-[linear-gradient(135deg,#F2FCF6_0%,#FFFFFF_100%)] p-4 shadow-[0_14px_30px_rgba(34,197,94,0.08)] dark:border-[#29583C] dark:bg-[linear-gradient(135deg,#102A22_0%,#183126_100%)]">
                  <div className="flex items-center gap-3">
                    <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-[#DCFCE7] text-2xl font-bold text-[#16A34A] dark:bg-[#16A34A]/18 dark:text-white">
                      {recurringProjects.length}
                    </div>
                    <div>
                      <p className="text-base font-bold text-[#0F172A] dark:text-white">Recurring</p>
                      <CurrencyAmount amount={recurringProjectsBudget} className="mt-1 text-lg font-bold" iconColor="#16A34A" iconSize={15} />
                      <p className="mt-1 text-xs text-[#64748B] dark:text-slate-100">{recurringProjectsShare}% of queue total</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-4 h-3 overflow-hidden rounded-full bg-[#EEF3F8] dark:bg-white/10">
                <div className="flex h-full">
                  <div
                    className="h-full rounded-l-full bg-[linear-gradient(90deg,#286CFF_0%,#60A5FA_100%)]"
                    style={{ width: `${newProjectsShare}%` }}
                  />
                  <div
                    className="h-full rounded-r-full bg-[linear-gradient(90deg,#22C55E_0%,#86EFAC_100%)]"
                    style={{ width: `${recurringProjectsShare}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            title="AI estimate of how much submitted budget is likely to receive final approval."
            className="overflow-hidden rounded-[28px] border-[#F5D3DC] bg-[linear-gradient(135deg,#FFF7F9_0%,#FFF8F2_100%)] shadow-[0_18px_44px_rgba(124,58,237,0.10)] dark:border-[#5D3240] dark:bg-[linear-gradient(135deg,#26131C_0%,#1E2438_100%)]"
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
                      <span className="inline-flex items-center rounded-full bg-[#F3E8FF] px-2.5 py-1 text-[11px] font-semibold text-[#7C3AED] dark:bg-[#7C3AED]/20 dark:text-[#DAC0FF]">
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
                    { label: 'In queue', value: reviewQueueProjects.length },
                    { label: 'Avg confidence', value: `${avgConfidence}%` },
                    { label: 'High risk', value: highRisk },
                    { label: 'Reviewed', value: reviewed },
                  ].map((item) => (
                    <div key={item.label} className="rounded-2xl bg-white/80 px-3 py-3 text-center dark:bg-white/5">
                      <p className="text-[11px] font-semibold tracking-[0.06em] text-[#64748B] dark:text-slate-100">
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
                  <span>{Math.round((predictedApproval / totalQueueBudget) * 100)}%</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-white/70 dark:bg-white/10">
                  <div
                    className="h-full rounded-full bg-[linear-gradient(90deg,#7C3AED_0%,#A855F7_45%,#C084FC_100%)] shadow-[0_8px_24px_rgba(124,58,237,0.28)]"
                    style={{ width: `${Math.round((predictedApproval / totalQueueBudget) * 100)}%` }}
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
