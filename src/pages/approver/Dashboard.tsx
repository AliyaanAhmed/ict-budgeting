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
  CircleAlert,
  ClipboardCheck,
  Clock3,
  CopyPlus,
  Info,
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
import { Button } from '@/components/ui/button'
import { BudgetByCategory } from '@/components/charts/BudgetByCategory'
import { Card, CardContent } from '@/components/ui/card'
import { CurrencyAmount } from '@/components/shared/CurrencyAmount'
import { currentCycle, projects, approvalQueueProjects } from '@/data/db'
import { dashboardPalette } from '@/lib/dashboardPalette'
import { cn } from '@/lib/utils'
import { ClarificationModal } from '@/components/shared/ClarificationModal'
import { useToast } from '@/context/ToastContext'

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
        'group overflow-hidden rounded-[24px] border bg-[linear-gradient(180deg,#FFFFFF_0%,#F8FBFF_100%)] p-5 transition-all duration-300 hover:-translate-y-0.5 hover:bg-[linear-gradient(180deg,#FFFFFF_0%,#F1F7FF_100%)] hover:shadow-[0_14px_30px_rgba(15,23,42,0.08)] dark:bg-[#18263F] dark:hover:bg-[#1D2D48] dark:hover:shadow-[0_14px_30px_rgba(2,8,23,0.32)]',
        className
      )}
      style={{ borderColor: `${accent}3D` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold tracking-[0.04em] text-[#64748B] dark:text-slate-100">{title}</p>
          <div className="mt-4 text-[34px] font-bold leading-none text-[#0F172A] dark:text-white">{value}</div>
        </div>
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full shadow-inner"
          style={{ background: `linear-gradient(135deg, ${accent}1F 0%, ${accent}12 100%)`, color: accent }}
        >
          {icon}
        </div>
      </div>
      <div className="mt-5">
        <span
          className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold"
          style={{ backgroundColor: `${accent}14`, color: accent, boxShadow: `inset 0 0 0 1px ${accent}12` }}
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

export default function ApproverDashboard() {
  const [portfolioExpanded, setPortfolioExpanded] = useState(false)
  const [clarificationProject, setClarificationProject] = useState<string | null>(null)
  const { showSuccessToast } = useToast()

  const submittedToApproverProjects = projects.filter((project) => project.status === 'Submitted to Approver')
  const clarificationProjects = projects.filter((project) => project.status === 'Clarification Required')
  const approvedProjects = projects.filter((project) => project.status === 'Approved')
  const reviewerProjects = projects.filter((project) => project.status === 'Submitted to Reviewer')
  const respondentProjects = projects.filter((project) => project.pendingWith === 'Respondent')

  const totalBudget = [...projects, ...approvalQueueProjects].reduce((sum, project) => sum + project.requestedBudget, 0)
  const approvedBudget = approvedProjects.reduce((sum, project) => sum + project.requestedBudget, 0)
  const pendingApproval = approvalQueueProjects.length + submittedToApproverProjects.length
  const clarificationCount = clarificationProjects.length
  const highRiskCount = [...projects, ...approvalQueueProjects].filter((project) => project.riskLevel === 'High').length
  const avgConfidence = Math.round(
    (projects.reduce((sum, project) => sum + project.aiScore, 0) +
      approvalQueueProjects.reduce((sum, project) => sum + project.aiConfidence, 0)) /
      (projects.length + approvalQueueProjects.length)
  )
  const approvalRate = Math.max(1, projects.length + approvalQueueProjects.length)
  const approvedCount = approvedProjects.length
  const projectsRequiringApproval: Array<{
    id: string
    name: string
    requestedBudget: number
    summary?: string
    entity?: string
  }> = [...submittedToApproverProjects, ...approvalQueueProjects].slice(0, 2)

  const summaryCounts = {
    inCycle: projects.length + approvalQueueProjects.length,
    withRespondent: respondentProjects.length,
    withReviewer: reviewerProjects.length,
    pendingMyApproval: pendingApproval,
  }

  const clarificationMonitorItems = [
    {
      name: 'AI Analytics Platform',
      pendingWith: 'Ahmed Ali',
      status: 'Pending',
      tone: 'amber',
      note: '2 pending',
    },
    {
      name: 'Network Upgrade',
      pendingWith: 'Sara Mohammed',
      status: '3 days overdue',
      tone: 'red',
      note: 'Overdue',
    },
    {
      name: 'Data Center Expansion',
      pendingWith: 'Khalid Omar',
      status: 'Responded',
      tone: 'green',
      note: 'Ready to review',
    },
    {
      name: 'Smart Classroom Initiative',
      pendingWith: 'Mariam Yusuf',
      status: 'Pending',
      tone: 'amber',
      note: 'Waiting for documents',
    },
    {
      name: 'Electronic Health Records System',
      pendingWith: 'Fatima Rahman',
      status: '1 day overdue',
      tone: 'red',
      note: 'Approval blocker',
    },
    {
      name: 'Cloud Services Expansion',
      pendingWith: 'Omar Khalid',
      status: 'Responded',
      tone: 'green',
      note: 'Back for approver review',
    },
  ]

  const insightCards = [
    {
      title: 'High Risk',
      value: highRiskCount,
      note: 'Need immediate review',
      accent: '#EF4444',
      icon: <ShieldAlert className="h-4.5 w-4.5" />,
      bg: 'bg-[#FFF5F5] dark:bg-[#34161D]',
      border: 'border-[#FFD1D1] dark:border-[#5B2632]',
    },
    {
      title: 'Missing Documents',
      value: 1,
      note: 'Blocking approval',
      accent: '#F97316',
      icon: <ClipboardCheck className="h-4.5 w-4.5" />,
      bg: 'bg-[#FFF7F1] dark:bg-[#332015]',
      border: 'border-[#FFD9C3] dark:border-[#5A3523]',
    },
    {
      title: 'Low Confidence',
      value: 5,
      note: 'AI readiness below 60%',
      accent: '#D97706',
      icon: <TriangleAlert className="h-4.5 w-4.5" />,
      bg: 'bg-[#FFFBEA] dark:bg-[#342D17]',
      border: 'border-[#F7E1A1] dark:border-[#64582A]',
    },
    {
      title: 'Possible Duplicates',
      value: 3,
      note: 'Similar projects detected',
      accent: '#9333EA',
      icon: <CopyPlus className="h-4.5 w-4.5" />,
      bg: 'bg-[#FAF5FF] dark:bg-[#281A3A]',
      border: 'border-[#E9D5FF] dark:border-[#52307A]',
    },
    {
      title: 'Budget Anomalies',
      value: 4,
      note: 'Unusual spending patterns',
      accent: '#286CFF',
      icon: <TrendingUp className="h-4.5 w-4.5" />,
      bg: 'bg-[#F2F7FF] dark:bg-[#18263F]',
      border: 'border-[#D4E4FF] dark:border-[#315389]',
    },
    {
      title: 'Clarification Likely',
      value: 6,
      note: 'May need follow-up',
      accent: '#F97316',
      icon: <MessageSquareMore className="h-4.5 w-4.5" />,
      bg: 'bg-[#FFF7F1] dark:bg-[#332015]',
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
      meta: 'Live',
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

  return (
    <div className="w-full space-y-6 pb-4">
      <section className="relative overflow-hidden rounded-[30px] border border-[#D7E4F4] bg-[linear-gradient(135deg,#F8FBFF_0%,#EEF5FF_45%,#FFFFFF_100%)] p-6 shadow-[0_22px_72px_rgba(15,23,42,0.07)] dark:border-white/10 dark:bg-[linear-gradient(135deg,#0F172A_0%,#16263E_52%,#102946_100%)]">
        <div className="absolute -left-10 top-0 h-36 w-36 rounded-full bg-[#286CFF]/10 blur-3xl dark:bg-[#286CFF]/20" />
        <div className="absolute right-0 top-8 h-40 w-40 rounded-full bg-[#C084FC]/10 blur-3xl dark:bg-[#C084FC]/10" />
        <div className="relative">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#CFE0FF] bg-white/75 px-3 py-1 text-xs font-semibold text-[#286CFF] backdrop-blur dark:border-[#4F98FF]/30 dark:bg-white/5 dark:text-[#9FC4FF]">
              <ClipboardCheck className="h-3.5 w-3.5" />
              Approver workspace
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-[#0F172A] dark:text-white">
              Final approval control center for DGE-ready submissions.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#475569] dark:text-slate-100">
              Review reviewer-cleared projects, monitor clarification loops, and move only the strongest submissions through the final approval gate.
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
                <Users className="h-4 w-4" />
                Final DGE gate
              </span>
            </div>
          </div>
        </div>
      </section>

      <section
        title="Portfolio-level deadline, AI summary, and final submission progress for the approver."
        className="overflow-hidden rounded-[24px] border border-[#DCE8F6] bg-[linear-gradient(180deg,#F9FCFF_0%,#F4F8FF_100%)] px-4 py-3 shadow-[0_10px_24px_rgba(40,108,255,0.05)] dark:border-white/10 dark:bg-[linear-gradient(180deg,#13233A_0%,#18263F_100%)]"
      >
        <div className="overflow-x-auto">
          <div className="flex min-w-[980px] items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#FFF3D9] text-[#D97706] dark:bg-[#D97706]/18 dark:text-[#FCD34D]">
                <Calendar className="h-4.5 w-4.5" />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#64748B] dark:text-slate-200">DGE submission deadline</p>
                <p className="mt-1 text-sm font-bold text-[#D97706] dark:text-[#FCD34D]">{currentCycle.daysRemaining} days remaining</p>
              </div>
            </div>

            <div className="h-12 w-px shrink-0 bg-[#D9E6F5] dark:bg-white/10" />

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#7C3AED_0%,#9333EA_100%)] text-white shadow-[0_12px_20px_rgba(124,58,237,0.18)]">
                <Bot className="h-4.5 w-4.5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#64748B] dark:text-slate-200">AI summary</p>
                <p className="mt-1 text-sm font-semibold text-[#0F172A] dark:text-white whitespace-nowrap">
                  {summaryCounts.inCycle} projects in cycle,{' '}
                  <span className="text-[#D97706]">{summaryCounts.withRespondent} with Respondent</span>,{' '}
                  <span className="text-[#286CFF]">{summaryCounts.withReviewer} with Reviewer</span>,{' '}
                  <span className="text-[#F97316]">{summaryCounts.pendingMyApproval} pending your approval</span>
                </p>
              </div>
            </div>

            <div className="h-12 w-px shrink-0 bg-[#D9E6F5] dark:bg-white/10" />

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#F3E8FF] text-[#9333EA] dark:bg-[#9333EA]/18 dark:text-[#E9D5FF]">
                <BrainCircuit className="h-4.5 w-4.5" />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#64748B] dark:text-slate-200">Entity progress</p>
                <p className="mt-1 text-sm font-semibold text-[#0F172A] dark:text-white whitespace-nowrap">
                  <span className="text-[#7C3AED]">{approvedCount}</span> of {summaryCounts.inCycle} approved
                </p>
              </div>
            </div>

            <Button asChild className="ml-auto h-11 shrink-0 rounded-[18px] px-4 shadow-[0_12px_24px_rgba(40,108,255,0.16)]">
              <Link to="/approver/approval-queue">
                Open Approval Queue
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
        <MetricCard
          title="Requested Budget"
          value={<CompactAmount amount={totalBudget} />}
          accent={dashboardPalette.techBlue}
          badge="Portfolio total"
          icon={<BadgeDollarSign className="h-5 w-5" />}
          className="xl:shadow-[0_10px_24px_rgba(40,108,255,0.08)]"
        />
        <MetricCard
          title="Approved Budget"
          value={<CompactAmount amount={approvedBudget} iconColor={dashboardPalette.aeGreen} />}
          accent={dashboardPalette.aeGreen}
          badge="Ready for DGE"
          icon={<CheckCircle2 className="h-5 w-5" />}
        />
        <MetricCard
          title="Pending My Approval"
          value={pendingApproval}
          accent={dashboardPalette.camelYellow}
          badge="Decision queue"
          icon={<ClipboardCheck className="h-5 w-5" />}
        />
        <MetricCard
          title="Clarifications Open"
          value={clarificationCount}
          accent={dashboardPalette.desertOrange}
          badge="Awaiting reply"
          icon={<MessageSquareMore className="h-5 w-5" />}
        />
        <MetricCard
          title="AI Confidence"
          value={`${avgConfidence}%`}
          accent="#7C3AED"
          badge="Portfolio signal"
          icon={<BrainCircuit className="h-5 w-5" />}
          className="xl:shadow-[0_10px_24px_rgba(124,58,237,0.08)]"
        />
      </section>

      <section
        title="AI summary of final approval blockers and role-specific portfolio risks."
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
                <InfoHint text="A final approval view of the portfolio showing major blockers before the package can move to DGE." />
                <span className="inline-flex items-center rounded-full bg-[#FFF1F2] px-2.5 py-1 text-[11px] font-semibold text-[#DC2626] dark:bg-[#DC2626]/15 dark:text-[#FCA5A5]">
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
              <span className="text-[#286CFF] dark:text-[#C6DBFF]">
                {avgConfidence}% <span className="text-[#64748B] dark:text-slate-100">avg confidence</span>
              </span>
              <span className="text-[#F59E0B] dark:text-[#FCD34D]">
                {highRiskCount} <span className="text-[#64748B] dark:text-slate-100">high risk</span>
              </span>
              <RefreshCcw className="h-4 w-4 text-[#64748B] dark:text-slate-100" />
            </div>
            <ChevronDown className={cn('h-5 w-5 text-[#64748B] transition-transform dark:text-slate-100', portfolioExpanded && 'rotate-180')} />
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
          </div>
        )}
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Card
          title="AI-detected approval issues and risk themes needing final approver attention."
          className="overflow-hidden rounded-[28px] border-[#D9E6F5] shadow-none dark:border-white/10 dark:bg-[#162339]"
        >
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-xl font-bold text-[#0F172A] dark:text-white">AI Risk &amp; Priority Insights</h3>
                  <InfoHint text="AI surfaces the themes that most often block final approval and DGE readiness." />
                </div>
                <p className="mt-1 text-sm text-[#64748B] dark:text-slate-100">AI-detected issues requiring attention</p>
              </div>
              <span className="inline-flex items-center rounded-full bg-[#F3E8FF] px-3 py-1 text-xs font-semibold text-[#7C3AED] dark:bg-[#7C3AED]/18 dark:text-[#DAC0FF]">
                AI-assisted
              </span>
            </div>

            <div className="mt-5 rounded-[24px] border border-[#E7EEFA] bg-[linear-gradient(135deg,#FBFDFF_0%,#F4F8FF_100%)] p-5 dark:border-white/10 dark:bg-[linear-gradient(135deg,#1A2941_0%,#162339_100%)]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#64748B] dark:text-slate-200">Priority snapshot</p>
                  <p className="mt-2 text-2xl font-bold text-[#0F172A] dark:text-white">
                    {highRiskCount + clarificationCount} portfolio signals need final attention
                  </p>
                </div>
                <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-[linear-gradient(135deg,#7C3AED_0%,#9333EA_100%)] text-white shadow-[0_18px_30px_rgba(124,58,237,0.24)]">
                  <Bot className="h-6 w-6" />
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {insightCards.map((card) => (
                <div
                  key={card.title}
                  className={cn(
                    'min-h-[124px] rounded-[20px] border p-4 transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_22px_rgba(15,23,42,0.06)]',
                    card.bg,
                    card.border
                  )}
                >
                  <div className="flex items-center gap-2" style={{ color: card.accent }}>
                    {card.icon}
                    <p className="text-sm font-semibold">{card.title}</p>
                  </div>
                  <p className="mt-4 text-[32px] font-bold leading-none" style={{ color: card.accent }}>
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
                      index === 0 && 'bg-[#FFF4E5] text-[#D97706] dark:bg-[#D97706]/18 dark:text-[#FCD34D]',
                      index === 1 && 'bg-[#FFE4E6] text-[#EF4444] dark:bg-[#EF4444]/18 dark:text-[#FCA5A5]',
                      index === 2 && 'bg-[#EEF5FF] text-[#286CFF] dark:bg-[#286CFF]/18 dark:text-[#BFDBFE]'
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
          className="overflow-hidden rounded-[28px] border-[#D9E6F5] shadow-none dark:border-white/10 dark:bg-[#162339]"
        >
          <CardContent className="p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-xl font-bold text-[#0F172A] dark:text-white">Projects Requiring My Approval</h3>
                  <InfoHint text="A focused list of projects that are currently waiting for final approver action before they can move onward." />
                </div>
                <p className="mt-1 text-sm text-[#64748B] dark:text-slate-100">Top items waiting for your decision</p>
              </div>
              <span className="inline-flex items-center rounded-full bg-[#FFF4E5] px-3 py-1 text-xs font-semibold text-[#D97706] dark:bg-[#D97706]/18 dark:text-[#FCD34D]">
                {pendingApproval} pending
              </span>
            </div>

            <div className="space-y-3">
              {projectsRequiringApproval.map((project, index) => (
                <Link
                  key={project.id}
                  to="/approver/approval-queue"
                  className="group block rounded-[22px] border border-[#DCE8F6] bg-[linear-gradient(135deg,#FBFDFF_0%,#F4F8FD_100%)] p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#286CFF] hover:bg-[#EEF5FF] dark:border-white/10 dark:bg-[#1B2A41] dark:hover:border-[#4F98FF] dark:hover:bg-[#203352]"
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
                        {'summary' in project ? project.summary : `${project.entity} budget request awaiting final approval decision.`}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-[#64748B] dark:text-slate-100">
                        <span className="inline-flex items-center rounded-full bg-[#FFF4E5] px-2.5 py-1 font-semibold text-[#D97706] dark:bg-[#D97706]/15 dark:text-[#FCD34D]">
                          Awaiting approval
                        </span>
                        {'entity' in project && <span>{project.entity}</span>}
                        {'requestedBudget' in project && <CurrencyAmount amount={project.requestedBudget} className="text-sm font-semibold text-[#0F172A] dark:text-white" iconSize={13} />}
                      </div>
                    </div>
                    <MoveRight className="mt-1 h-4 w-4 shrink-0 text-[#94A3B8] transition-transform group-hover:translate-x-0.5 group-hover:text-[#286CFF]" />
                  </div>
                </Link>
              ))}
            </div>

            <div className="mt-4">
              <Button variant="outline" asChild className="h-10 rounded-2xl">
                <Link to="/approver/approval-queue">
                  Show All
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
          className="overflow-hidden rounded-[28px] border-[#D9E6F5] shadow-none dark:border-white/10 dark:bg-[#162339]"
        >
          <CardContent className="p-6">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
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
            <BudgetByCategory />
          </CardContent>
        </Card>

        <Card
          title="Tracks clarifications that are open, overdue, or already responded to across the approval cycle."
          className="overflow-hidden rounded-[28px] border-[#D9E6F5] shadow-none dark:border-white/10 dark:bg-[#162339]"
        >
          <CardContent className="p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-xl font-bold text-[#0F172A] dark:text-white">Clarification Monitor</h3>
                  <InfoHint text="A compact view of active clarification conversations that can block final approval." />
                </div>
                <p className="mt-1 text-sm text-[#64748B] dark:text-slate-100">Track pending clarifications</p>
              </div>
              <span className="inline-flex items-center rounded-full bg-[#FFF4E5] px-3 py-1 text-xs font-semibold text-[#D97706] dark:bg-[#D97706]/18 dark:text-[#FCD34D]">
                {clarificationCount || 2} pending
              </span>
            </div>

            <div className="space-y-3">
              {clarificationMonitorItems.map((item) => (
                <div
                  key={item.name}
                  className={cn(
                    'flex items-center justify-between gap-4 rounded-[22px] border px-4 py-4 transition-all duration-200 hover:-translate-y-0.5',
                    item.tone === 'amber' && 'border-[#F6E4B4] bg-[#FFF9ED] dark:border-[#5E4C1E] dark:bg-[#2C2416]',
                    item.tone === 'red' && 'border-[#FFD6D9] bg-[#FFF5F5] dark:border-[#6A2732] dark:bg-[#31161D]',
                    item.tone === 'green' && 'border-[#CDEFD7] bg-[#F3FBF5] dark:border-[#29583C] dark:bg-[#173122]'
                  )}
                >
                  <div>
                    <p className="text-lg font-semibold text-[#0F172A] dark:text-white">{item.name}</p>
                    <p className="mt-1 text-sm text-[#64748B] dark:text-slate-100">Pending with: {item.pendingWith}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold',
                        item.tone === 'amber' && 'bg-[#FFF2CC] text-[#D97706] dark:bg-[#D97706]/18 dark:text-[#FCD34D]',
                        item.tone === 'red' && 'bg-[#FFE4E6] text-[#EF4444] dark:bg-[#EF4444]/18 dark:text-[#FCA5A5]',
                        item.tone === 'green' && 'bg-[#DCFCE7] text-[#15803D] dark:bg-[#15803D]/18 dark:text-[#BBF7D0]'
                      )}
                    >
                      {item.status}
                    </span>
                    <button
                      type="button"
                      onClick={() => setClarificationProject(item.name)}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#D9E6F5] bg-white text-[#286CFF] transition-colors hover:border-[#286CFF] hover:bg-[#EEF5FF] dark:border-white/10 dark:bg-white/5 dark:text-[#BFDBFE] dark:hover:bg-white/10"
                    >
                      <Bell className="h-4.5 w-4.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Card
          title="Fast access to actions the approver takes most often."
          className="overflow-hidden rounded-[28px] border-[#D9E6F5] shadow-none dark:border-white/10 dark:bg-[#162339]"
        >
          <CardContent className="p-6">
            <div className="mb-4">
              <div className="flex flex-wrap items-center gap-2">
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
                    'group relative flex min-h-[118px] items-start justify-between gap-3 overflow-hidden rounded-[22px] border border-[#E4ECF7] bg-[linear-gradient(180deg,#FFFFFF_0%,#F7FAFF_100%)] px-4 py-4 shadow-[0_8px_18px_rgba(15,23,42,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_24px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-[linear-gradient(180deg,#1B2A41_0%,#1F304B_100%)]',
                    action.rowClass
                  )}
                >
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100" style={{ backgroundColor: action.accent }} />
                  <div className="flex items-start gap-3">
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl"
                      style={{ backgroundColor: `${action.accent}14`, color: action.accent }}
                    >
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
                    <span
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors duration-200"
                      style={{ backgroundColor: `${action.accent}14`, color: action.accent }}
                    >
                      {action.endIcon}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card
          title="Shows whether the portfolio is ready for final onward submission to DGE."
          className="overflow-hidden rounded-[28px] border-[#D9E6F5] bg-[linear-gradient(135deg,#F8FBFF_0%,#FDFEFF_60%,#EEF6FF_100%)] shadow-none dark:border-white/10 dark:bg-[linear-gradient(135deg,#12233A_0%,#18263F_52%,#112846_100%)]"
        >
          <CardContent className="flex h-full flex-col p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-xl font-bold text-[#0F172A] dark:text-white">Final Approval Readiness</h3>
                  <InfoHint text="A role-specific readiness board showing what still blocks the portfolio from moving to DGE." />
                </div>
                <p className="mt-1 text-sm text-[#64748B] dark:text-slate-100">
                  Review the current blockers before moving the portfolio forward
                </p>
              </div>
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#286CFF]/10 text-[#286CFF] dark:bg-[#286CFF]/18 dark:text-white">
                <Send className="h-5 w-5" />
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              {[
                { label: 'Approved', value: approvedCount, tone: '#16A34A' },
                { label: 'Pending Approval', value: pendingApproval, tone: '#D97706' },
                { label: 'With Reviewer', value: reviewerProjects.length, tone: '#286CFF' },
                { label: 'Clarifications', value: clarificationCount, tone: '#F97316' },
              ].map((item) => (
                <div key={item.label} className="rounded-[20px] border border-[#DCE8F6] bg-[#F3F8FF] p-4 dark:border-white/10 dark:bg-[#20314D]">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#64748B] dark:text-slate-100">{item.label}</p>
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
                    Approve reviewer-cleared low-risk items first, then resolve the open clarification and document blockers before the final DGE package is assembled.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-auto flex flex-col gap-3 pt-5">
              <Button asChild className="h-12 w-full rounded-2xl shadow-[0_16px_32px_rgba(40,108,255,0.20)]">
                <Link to="/approver/approval-queue">
                  Open Approval Queue
                  <MoveRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      <ClarificationModal
        open={Boolean(clarificationProject)}
        onOpenChange={(open) => {
          if (!open) setClarificationProject(null)
        }}
        projectName={clarificationProject || ''}
        onSubmit={() => {
          showSuccessToast('Clarification raised', 'The respondent has been notified and the request is now awaiting response.')
          setClarificationProject(null)
        }}
      />
    </div>
  )
}
