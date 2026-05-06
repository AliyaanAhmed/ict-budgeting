import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BadgeDollarSign,
  Bot,
  BrainCircuit,
  Calendar,
  ChevronDown,
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
import { currentCycle, projects } from '@/data/db'
import { dashboardPalette, dashboardStatusColors } from '@/lib/dashboardPalette'
import { cn } from '@/lib/utils'

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

export default function RespondentDashboard() {
  const [portfolioExpanded, setPortfolioExpanded] = useState(false)

  const totalBudget = projects.reduce((sum, project) => sum + project.requestedBudget, 0)
  const lastYearBudget = Math.round(totalBudget * 0.86)
  const predictedBudget = Math.round(totalBudget * 0.803)
  const confidenceScore = Math.round(projects.reduce((sum, project) => sum + project.aiScore, 0) / projects.length)

  const submittedToReviewer = projects.filter((project) => project.status === 'Submitted to Reviewer').length
  const clarificationRequired = projects.filter((project) => project.status === 'Clarification Required').length
  const needsWork = projects.filter((project) => project.status === 'Needs Work' || project.status === 'Draft').length
  const submittedToApprover = projects.filter((project) => project.status === 'Submitted to Approver').length
  const approved = projects.filter((project) => project.status === 'Approved').length
  const respondentActive = clarificationRequired + needsWork
  const attentionCount = respondentActive

  const clarificationProjects = projects
    .filter((project) => project.status === 'Clarification Required' || project.pendingWith === 'Respondent')
    .sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime())
    .slice(0, 2)

  const newProjects = projects.filter((project) => project.budgetType === 'New')
  const recurringProjects = projects.filter((project) => project.budgetType !== 'New')
  const newProjectsBudget = newProjects.reduce((sum, project) => sum + project.requestedBudget, 0)
  const recurringProjectsBudget = recurringProjects.reduce((sum, project) => sum + project.requestedBudget, 0)
  const newProjectsShare = Math.round((newProjectsBudget / totalBudget) * 100)
  const recurringProjectsShare = 100 - newProjectsShare

  const comparisonData = Array.from(
    projects.reduce((acc, project) => {
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
    projects
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
      pct: Math.round((item.amount / totalBudget) * 100),
      color: BREAKDOWN_COLORS[index % BREAKDOWN_COLORS.length],
    }))

  const requestedBudgetByStatus = [
    {
      name: 'With Reviewer',
      value: projects
        .filter((project) => project.status === 'Submitted to Reviewer')
        .reduce((sum, project) => sum + project.requestedBudget, 0),
      fill: dashboardStatusColors.withReviewer,
    },
    {
      name: 'Clarification',
      value: projects
        .filter((project) => project.status === 'Clarification Required')
        .reduce((sum, project) => sum + project.requestedBudget, 0),
      fill: dashboardStatusColors.clarification,
    },
    {
      name: 'Needs Work',
      value: projects
        .filter((project) => project.status === 'Needs Work' || project.status === 'Draft')
        .reduce((sum, project) => sum + project.requestedBudget, 0),
      fill: dashboardStatusColors.needsWork,
    },
    {
      name: 'Approved',
      value: projects
        .filter((project) => project.status === 'Approved')
        .reduce((sum, project) => sum + project.requestedBudget, 0),
      fill: dashboardStatusColors.approved,
    },
  ]
    .filter((item) => item.value > 0)
    .map((item) => ({
      ...item,
      percent: Math.round((item.value / totalBudget) * 100),
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

  return (
    <div className="w-full space-y-6 pb-4">
      <section className="relative overflow-hidden rounded-[30px] border border-[#D7E4F4] bg-[linear-gradient(135deg,#F8FBFF_0%,#EEF5FF_45%,#FFFFFF_100%)] p-6 shadow-[0_28px_80px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-[linear-gradient(135deg,#0F172A_0%,#16263E_52%,#102946_100%)]">
        <div className="absolute -left-10 top-0 h-36 w-36 rounded-full bg-[#286CFF]/10 blur-3xl dark:bg-[#286CFF]/20" />
        <div className="absolute right-0 top-8 h-40 w-40 rounded-full bg-[#22C55E]/10 blur-3xl dark:bg-[#22C55E]/10" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#CFE0FF] bg-white/75 px-3 py-1 text-xs font-semibold text-[#286CFF] backdrop-blur dark:border-[#4F98FF]/30 dark:bg-white/5 dark:text-[#9FC4FF]">
              <Sparkles className="h-3.5 w-3.5" />
              Respondent Workspace
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-[#0F172A] dark:text-white">
              Budget planning with sharper signals, cleaner decisions, and faster follow-through.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#475569] dark:text-slate-100">
              Monitor requested budgets, compare this cycle against last year, and spot where AI predicts stronger approval outcomes before you move work into the next governance step.
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

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
        <MetricCard
          title="Requested Budgets"
          value={<CompactAmount amount={totalBudget} />}
          accent={dashboardPalette.techBlue}
          badge="AED Total"
          icon={<BadgeDollarSign className="h-5 w-5" />}
          className="xl:shadow-[0_10px_24px_rgba(40,108,255,0.08)]"
        />
        <MetricCard
          title="Last Year Requested"
          value={<CompactAmount amount={lastYearBudget} iconColor={dashboardPalette.slate} />}
          accent={dashboardPalette.slate}
          badge="FY2025 Baseline"
          icon={<TrendingUp className="h-5 w-5" />}
          className="shadow-none"
        />
        <MetricCard
          title="AI Predicted Approval"
          value={<CompactAmount amount={predictedBudget} iconColor="#0F9D7A" />}
          accent="#0F9D7A"
          badge="AI Estimate"
          icon={<BrainCircuit className="h-5 w-5" />}
          className="xl:shadow-[0_10px_24px_rgba(15,157,122,0.08)]"
        />
        <MetricCard
          title="Submitted to Review"
          value={submittedToReviewer}
          accent={dashboardPalette.seaBlue}
          badge="In Review"
          icon={<Radar className="h-5 w-5" />}
          className="shadow-none"
        />
        <MetricCard
          title="Needs Work / Draft"
          value={needsWork}
          accent={dashboardPalette.camelYellow}
          badge="Action Needed"
          icon={<TrendingDown className="h-5 w-5" />}
          className="shadow-none"
        />
        <MetricCard
          title="Clarification Required"
          value={clarificationRequired}
          accent={dashboardPalette.aeRed}
          badge="Urgent"
          icon={<FolderOpen className="h-5 w-5" />}
          className="shadow-none"
        />
      </section>

      <section
        title="AI summary of portfolio-wide risks, confidence, and recommended cleanup before submission."
        className="overflow-hidden rounded-[28px] border border-[#F6C9CF] bg-[linear-gradient(135deg,#FFF8FA_0%,#FFF9F6_100%)] shadow-[0_18px_48px_rgba(234,79,73,0.08)] dark:border-[#5D3240] dark:bg-[linear-gradient(135deg,#26131C_0%,#1E2438_100%)]"
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
                <span className="inline-flex items-center rounded-full bg-[#FFF1F2] px-2.5 py-1 text-[11px] font-semibold text-[#DC2626] dark:bg-[#DC2626]/15 dark:text-[#FCA5A5]">
                  High Portfolio Risk
                </span>
              </div>
              <p className="mt-1 text-sm text-[#475569] dark:text-slate-100">
                Portfolio status: High risk. {attentionCount} projects require attention before submission to DGE.
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-4">
            <div className="hidden items-center gap-4 text-sm md:flex">
              <span className="text-[#0F172A] dark:text-white">
                {projects.length} <span className="text-[#64748B] dark:text-slate-100">projects</span>
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

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Card
          title="Projects that were returned to the respondent for clarification and need response."
          className="overflow-hidden rounded-[28px] border-[#D9E6F5] shadow-none dark:border-white/10 dark:bg-[#162339]"
        >
          <CardContent className="p-6">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-xl font-bold text-[#0F172A] dark:text-white">Clarification&apos;s Project</h3>
                  <InfoHint text="Projects in this list are waiting for the respondent to answer clarification comments before they can move back to review." />
                </div>
                <p className="mt-1 text-sm text-[#64748B] dark:text-slate-100">
                  Reply to reviewer comments and move these projects back into the pipeline
                </p>
              </div>
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#F59E0B]/12 text-[#F59E0B] dark:bg-[#F59E0B]/18 dark:text-[#FCD34D]">
                <MessageSquareMore className="h-5 w-5" />
              </div>
            </div>

            <div className="space-y-3">
              {clarificationProjects.map((project, index) => (
                <Link
                  key={project.id}
                  to={`/respondent/projects/${project.id}`}
                  className="group block rounded-[24px] border border-[#DCE8F6] bg-[linear-gradient(135deg,#FBFDFF_0%,#F4F8FD_100%)] p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#286CFF] hover:bg-[#EEF5FF] dark:border-white/10 dark:bg-[#1B2A41] dark:hover:border-[#4F98FF] dark:hover:bg-[#203352]"
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
                        {project.clarifications.find((item) => item.status === 'Pending')?.message || project.summary}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-[#64748B] dark:text-slate-100">
                        <span className="inline-flex items-center rounded-full bg-[#FFF4E5] px-2.5 py-1 font-semibold text-[#D97706] dark:bg-[#D97706]/15 dark:text-[#FCD34D]">
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
            <div className="mt-4">
              <Button variant="outline" asChild className="h-10 rounded-2xl">
                <Link to="/respondent/projects">
                  View All Projects
                  <MoveRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card
          title="Requested budget distribution across your current project statuses."
          className="overflow-hidden rounded-[28px] border-[#D9E6F5] shadow-none dark:border-white/10 dark:bg-[#162339]"
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

              <div className="space-y-3">
                {requestedBudgetByStatus.map((item) => (
                  <div key={item.name} className="rounded-[20px] border border-[#DCE8F6] bg-[#F8FBFF] p-4 dark:border-white/10 dark:bg-[#1B2A41]">
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

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Card
          title="Compare current requested budgets against a reconstructed previous-year baseline across priorities."
          className="overflow-hidden rounded-[28px] border-[#D9E6F5] shadow-none dark:border-white/10 dark:bg-[#162339]"
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
          className="overflow-hidden rounded-[28px] border-[#D9E6F5] shadow-none dark:border-white/10 dark:bg-[#162339]"
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

      <section className="grid grid-cols-1 items-stretch gap-5 xl:grid-cols-[1fr_1fr]">
        <Card
          title="Quick access to active submission states and the next actions you should take in Projects."
          className="overflow-hidden rounded-[28px] border-[#D9E6F5] bg-[linear-gradient(135deg,#F8FBFF_0%,#FDFEFF_60%,#EEF6FF_100%)] shadow-none dark:border-white/10 dark:bg-[linear-gradient(135deg,#12233A_0%,#18263F_52%,#112846_100%)]"
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
                { label: 'Approved', value: approved, tone: dashboardStatusColors.approved },
                { label: 'With Reviewer', value: submittedToReviewer, tone: dashboardStatusColors.withReviewer },
                { label: 'With Approver', value: submittedToApprover, tone: dashboardStatusColors.withApprover },
                { label: 'Needs Attention', value: attentionCount, tone: dashboardStatusColors.clarification },
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
                  <Sparkles className="h-4.5 w-4.5" />
                </div>
                <div>
                  <p className="font-semibold text-[#0F172A] dark:text-white">Suggested Next Move</p>
                  <p className="mt-1 text-sm leading-6 text-[#64748B] dark:text-slate-100">
                    Resolve {attentionCount} active blocker{attentionCount === 1 ? '' : 's'} before the next submission window to improve approval odds and reduce back-and-forth.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-[24px] border border-[#DCE8F6] bg-[#F6FAFF] p-4 dark:border-white/10 dark:bg-[#1B2A41]">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4.5 w-4.5 text-[var(--ai-accent)]" />
                <p className="text-xs font-semibold tracking-[0.06em] text-[var(--ai-accent)]">
                  Recommended Next Actions
                </p>
              </div>
              <div className="mt-3 grid gap-2">
                {[
                  'Review clarification replies before re-submission.',
                  'Prioritize projects missing supporting evidence.',
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
              <Button asChild className="h-12 w-full rounded-2xl shadow-[0_16px_32px_rgba(40,108,255,0.20)]">
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
            className="overflow-hidden rounded-[28px] border-[#D9E6F5] shadow-none dark:border-white/10 dark:bg-[#162339]"
          >
            <CardContent className="p-6">
              <div className="mb-5">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-xl font-bold text-[#0F172A] dark:text-white">New vs Recurring Projects</h3>
                  <InfoHint text="Shows how much of the current requested budget belongs to new initiatives versus recurring or continuation work." />
                </div>
                <p className="mt-1 text-sm text-[#64748B] dark:text-slate-100">
                  Distribution of project types in the current cycle
                </p>
              </div>
              <div className="grid gap-3">
                <div className="rounded-[22px] border border-[#D8E7FF] bg-[linear-gradient(135deg,#EFF5FF_0%,#FFFFFF_100%)] p-4 shadow-[0_14px_30px_rgba(40,108,255,0.08)] dark:border-[#315389] dark:bg-[linear-gradient(135deg,#132844_0%,#18263F_100%)]">
                  <div className="flex items-center gap-3">
                    <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-[#DCEAFE] text-2xl font-bold text-[#286CFF] dark:bg-[#286CFF]/18 dark:text-white">
                      {newProjects.length}
                    </div>
                    <div>
                      <p className="text-base font-bold text-[#0F172A] dark:text-white">New Projects</p>
                      <CurrencyAmount amount={newProjectsBudget} className="mt-1 text-lg font-bold" iconSize={15} />
                      <p className="mt-1 text-xs text-[#64748B] dark:text-slate-100">{newProjectsShare}% of requested total</p>
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
                      <p className="mt-1 text-xs text-[#64748B] dark:text-slate-100">{recurringProjectsShare}% of requested total</p>
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
            title="AI model estimate for how much of the requested budget is likely to be approved."
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
                        <InfoHint text="AI estimates how much of the currently requested budget is likely to be approved based on approval history, risk, and project profile signals." />
                        <span className="inline-flex items-center rounded-full bg-[#F3E8FF] px-2.5 py-1 text-[11px] font-semibold text-[#7C3AED] dark:bg-[#7C3AED]/20 dark:text-[#DAC0FF]">
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
                    { label: 'Projects scanned', value: projects.length },
                    { label: 'Avg confidence', value: `${confidenceScore}%` },
                    { label: 'Need attention', value: attentionCount },
                    { label: 'Approved now', value: approved },
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
                  <span>{Math.round((predictedBudget / totalBudget) * 100)}%</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-white/70 dark:bg-white/10">
                  <div
                    className="h-full rounded-full bg-[linear-gradient(90deg,#7C3AED_0%,#A855F7_45%,#C084FC_100%)] shadow-[0_8px_24px_rgba(124,58,237,0.28)]"
                    style={{ width: `${Math.round((predictedBudget / totalBudget) * 100)}%` }}
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
