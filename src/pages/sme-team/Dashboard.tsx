import { Link } from 'react-router-dom'
import {
  BadgeDollarSign,
  CalendarClock,
  ClipboardCheck,
  Eye,
  FileText,
  FileWarning,
  MessageSquareDot,
  Radar,
  Scale,
  ShieldAlert,
  Sparkles,
  Users,
  WandSparkles,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CurrencyAmount } from '@/components/shared/CurrencyAmount'
import { cn } from '@/lib/utils'
import {
  StrategyAiPanel,
  StrategyPageShell,
  StrategyPill,
  StrategyProgressBar,
  StrategySectionCard,
} from '@/pages/strategy-team/StrategyTeamShell'
import {
  budgetDocumentSummary,
  clarificationMonitor,
  smeActionCards,
  smeAiSignals,
  smeSummaryStrip,
} from './smeTeamData'

function SmeActionCard({
  title,
  value,
  budgetLabel,
  budget,
  badge,
  accent,
  icon: Icon,
  href,
}: {
  title: string
  value: number
  budgetLabel: string
  budget: number | null
  badge: string
  accent: string
  icon: React.ElementType
  href: string
}) {
  return (
    <Link
      to={href}
      className="group flex h-full flex-col overflow-hidden rounded-[24px] border border-[#DCE8F6] bg-white px-4 py-5 shadow-[0_12px_30px_rgba(15,23,42,0.06)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#286CFF] hover:bg-[#F8FBFF] hover:shadow-[0_16px_36px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-[#18263F] sm:px-5 sm:py-6"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="min-h-[3rem]">
            <p className="text-base font-semibold text-[#0F172A] dark:text-white">{title}</p>
          </div>
          <div className="mt-3 text-[40px] font-bold leading-none text-[#0F172A] dark:text-white">{value}</div>
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
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="mt-4 border-t border-[#EEF3F8] pt-3 dark:border-white/10">
        <p className="text-xs font-semibold text-[#64748B] dark:text-slate-300">{budgetLabel}</p>
        {budget !== null ? (
          <CurrencyAmount amount={budget} className="mt-1 text-sm font-semibold text-[#0F172A] dark:text-white" iconSize={13} />
        ) : (
          <p className="mt-1 text-sm font-semibold text-[#0F172A] dark:text-white">{budgetLabel}</p>
        )}
      </div>
    </Link>
  )
}

function AssignedReviewsPanel() {
  const projects = [
    {
      id: 'BI-1103',
      name: 'Cloud Infrastructure Modernization',
      status: 'To Review',
      risk: 'Medium',
      entity: 'Digital Services',
      priority: 'Digital Transformation',
      budget: 4500000,
      assigned: '2026-04-10',
      due: '2026-04-28',
      ai: '87%',
      tone: 'border-l-[#286CFF]',
      mismatch: false,
    },
    {
      id: 'BI-1104',
      name: 'AI Analytics Platform',
      status: 'To Review',
      risk: 'High Risk',
      entity: 'Innovation Hub',
      priority: 'AI & Innovation',
      budget: 3200000,
      assigned: '2026-04-08',
      due: '2026-04-25',
      ai: '72%',
      tone: 'border-l-[#A855F7]',
      mismatch: true,
    },
    {
      id: 'BI-1105',
      name: 'Enterprise Resource Planning',
      status: 'To Review',
      risk: 'High Risk',
      entity: 'Corporate Services',
      priority: 'Operational Excellence',
      budget: 5100000,
      assigned: '2026-04-12',
      due: '2026-04-30',
      ai: '68%',
      tone: 'border-l-[#A855F7]',
      mismatch: true,
    },
  ]

  const filterChips = [
    { label: 'To Review', count: 11, active: true },
    { label: 'Clarify', count: 4 },
    { label: 'Reviewed', count: 24 },
    { label: 'High Risk', count: 5 },
    { label: 'Mismatch', count: 3 },
  ]

  return (
    <Card className="overflow-hidden rounded-[24px] border border-[#D9E6F5] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#162339]">
      <div className="border-b border-[#EEF3F8] p-4 dark:border-white/10">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <ClipboardCheck className="mt-0.5 h-6 w-6 shrink-0 text-[#286CFF]" />
            <div className="min-w-0">
              <div className="truncate text-xl font-bold text-[#0F172A] dark:text-white">Assigned Reviews</div>
              <p className="mt-1 truncate text-sm text-[#64748B] dark:text-slate-300">Projects for SME review</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="inline-flex items-center justify-center rounded-md bg-[#EEF5FF] px-2 py-0.5 text-xs font-medium text-[#286CFF]">3</span>
          </div>
        </div>
      </div>

      <CardContent className="p-4">
        <div className="mb-4 flex flex-wrap gap-2">
          {filterChips.map((chip) => (
            <button
              key={chip.label}
              type="button"
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                chip.active
                  ? 'bg-[var(--primary)] text-white'
                  : 'border border-[#E2E8F0] bg-white text-[#0F172A] hover:bg-[#F1F5F9] dark:border-white/10 dark:bg-[#1E293B] dark:text-white dark:hover:bg-white/5'
              )}
            >
              <span>{chip.label}</span>
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.5 text-xs font-bold',
                  chip.active ? 'bg-white/20 text-current' : 'bg-[#F1F5F9] dark:bg-white/10'
                )}
              >
                {chip.count}
              </span>
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {projects.map((project) => (
            <div
              key={project.id}
              className={cn(
                'overflow-hidden rounded-[20px] border border-[#DCE8F6] bg-[#FBFDFF] p-4 transition-all hover:-translate-y-0.5 hover:border-[#BFD8FF] hover:shadow-[0_14px_28px_rgba(15,23,42,0.07)] dark:border-white/10 dark:bg-white/5'
              )}
            >
              <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="truncate text-base font-semibold text-[#0F172A] dark:text-white">{project.name}</h4>
                    <span className="inline-flex items-center rounded-md bg-[#FFF8E8] px-2 py-0.5 text-xs font-medium text-[#B45309]">
                      <Eye className="mr-1 h-3 w-3" />
                      {project.status}
                    </span>
                    <span className="inline-flex items-center rounded-md bg-[#FEF2F2] px-2 py-0.5 text-xs font-medium text-[#DC2626]">
                      <ShieldAlert className="mr-1 h-3 w-3" />
                      {project.risk}
                    </span>
                    {project.mismatch && (
                      <span className="inline-flex items-center rounded-md bg-[#F5EEFF] px-2 py-0.5 text-xs font-medium text-[#A855F7]">
                        <Scale className="mr-1 h-3 w-3" />
                        Mismatch
                      </span>
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[#64748B] dark:text-slate-300">
                    <span>{project.entity}</span>
                    <span>{project.priority}</span>
                    <CurrencyAmount amount={project.budget} className="text-sm font-semibold text-[#286CFF]" iconSize={12} />
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#94A3B8]">
                    <span>Assigned: {project.assigned}</span>
                    <span className="font-medium text-red-600">Due: {project.due}</span>
                    <span className="inline-flex items-center gap-1">
                      <WandSparkles className="h-3 w-3" />
                      AI: {project.ai}
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <Button variant="outline" size="sm" className="h-8 border-orange-200 px-3 text-xs text-orange-600 hover:bg-orange-50">
                    <MessageSquareDot className="h-3.5 w-3.5 sm:mr-1" />
                    <span className="hidden sm:inline">Clarify</span>
                  </Button>
                  {project.mismatch && (
                    <Button variant="outline" size="sm" className="h-8 border-purple-200 px-3 text-xs text-purple-600 hover:bg-purple-50">
                      <Scale className="h-3.5 w-3.5 sm:mr-1" />
                      <span className="hidden sm:inline">Reassign</span>
                    </Button>
                  )}
                  <Button size="sm" className="h-8 bg-[#286CFF] px-3 text-xs text-white hover:bg-[#0C65F5]">
                    <Eye className="h-3.5 w-3.5 sm:mr-1" />
                    <span className="hidden sm:inline">Review</span>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default function SmeTeamDashboard() {
  return (
    <StrategyPageShell
      eyebrow="ICT - SME Team"
      title="SME Dashboard"
      description="A domain review workspace for SME teams to assess assigned budgets, manage clarifications, and move high-confidence recommendations into strategy quality check."
    >
      <Card className="overflow-hidden rounded-[24px] border border-[#D9E6F5] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#162339]">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-3 lg:gap-6">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EEF5FF] text-[#286CFF] dark:bg-[#286CFF]/15 dark:text-[#BFDBFE]">
                <FileText className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold tracking-[0.08em] text-[#64748B] dark:text-slate-300">Budget Cycle</p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <p className="text-sm font-bold text-[#0F172A] dark:text-white">{smeSummaryStrip.cycle}</p>
                  <StrategyPill tone="blue">{smeSummaryStrip.stage}</StrategyPill>
                </div>
              </div>
            </div>
            <div className="hidden h-10 w-px bg-[#DCE8F6] lg:block dark:bg-white/10" />
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FFF7E6] text-[#D97706] dark:bg-[#D97706]/15 dark:text-[#FCD34D]">
                <CalendarClock className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold tracking-[0.08em] text-[#64748B] dark:text-slate-300">Review Deadline</p>
                <p className="mt-1 text-sm font-bold text-[#D97706] dark:text-[#FCD34D]">
                  {smeSummaryStrip.deadline} • {smeSummaryStrip.daysLeft} days left
                </p>
              </div>
            </div>
            <div className="hidden h-10 w-px bg-[#DCE8F6] lg:block dark:bg-white/10" />
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F5EEFF] text-[#A855F7] dark:bg-[#A855F7]/15 dark:text-[#E9D5FF]">
                <Users className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold tracking-[0.08em] text-[#64748B] dark:text-slate-300">SME Team</p>
                <p className="mt-1 text-sm font-bold text-[#0F172A] dark:text-white">{smeSummaryStrip.team}</p>
              </div>
            </div>
          </div>
          <div className="mt-4 rounded-[20px] border border-[#DCE8F6] bg-[#F8FBFF] p-3 dark:border-white/10 dark:bg-white/5">
            <div className="flex items-start gap-2">
              <WandSparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#A855F7] dark:text-[#E9D5FF]" />
              <p className="text-sm text-[#475569] dark:text-slate-200">
                <span className="font-semibold text-[#0F172A] dark:text-white">AI Summary:</span> {smeSummaryStrip.summary}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {smeActionCards.map((card) => (
          <SmeActionCard key={card.title} {...card} />
        ))}
      </section>

      <section className="grid grid-cols-1 items-stretch gap-5 xl:grid-cols-2">
        <AssignedReviewsPanel />
        <StrategySectionCard
          title="Budget And Documents"
          description="Portfolio-level budget posture for the SME lane, including reviewed volume, pending value, and documentation blockers."
          className="h-full"
          headingIcon={<BadgeDollarSign className="h-5 w-5 text-[#286CFF]" />}
        >
          <div className="flex h-full flex-col justify-center">
            <div className="rounded-[24px] border border-[#DCE8F6] bg-[linear-gradient(135deg,#F8FBFF_0%,#EEF5FF_100%)] p-5 dark:border-white/10 dark:bg-[linear-gradient(135deg,#162339_0%,#1B2A41_100%)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-[#0F172A] dark:text-white">Total Budget</p>
                  <CurrencyAmount amount={budgetDocumentSummary.totalBudget} className="mt-2 text-2xl font-bold" iconSize={16} />
                  <p className="mt-2 text-sm text-[#64748B] dark:text-slate-300">{budgetDocumentSummary.totalProjects} projects in the SME lane</p>
                </div>
                <div className="rounded-full bg-white/80 px-3 py-1 text-sm font-semibold text-[#286CFF] dark:bg-white/10 dark:text-[#BFDBFE]">
                  63% reviewed
                </div>
              </div>

              <div className="mt-5 h-4 overflow-hidden rounded-full bg-white/70 dark:bg-white/10">
                <div className="flex h-full">
                  <div className="flex h-full items-center justify-center bg-[#286CFF] text-[11px] font-semibold text-white" style={{ width: '63%' }}>
                    24
                  </div>
                  <div className="flex h-full items-center justify-center bg-[#7C3AED] text-[11px] font-semibold text-white" style={{ width: '37%' }}>
                    14
                  </div>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
                <div className="inline-flex items-center gap-2 text-[#286CFF] dark:text-[#BFDBFE]">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#286CFF]" />
                  Reviewed 24
                </div>
                <div className="inline-flex items-center gap-2 text-[#7C3AED] dark:text-[#E9D5FF]">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#7C3AED]" />
                  Pending 14
                </div>
                <div className="inline-flex items-center gap-2 text-[#D97706] dark:text-[#FCD34D]">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#D97706]" />
                  Missing Docs 4
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-[20px] border border-[#DCE8F6] bg-white p-4 shadow-[0_8px_18px_rgba(15,23,42,0.04)] dark:border-white/10 dark:bg-[#1B2A41]">
                <p className="text-sm font-semibold text-[#0F172A] dark:text-white">Reviewed Budget</p>
                <CurrencyAmount amount={budgetDocumentSummary.reviewedBudget} className="mt-2 text-lg font-bold" iconSize={14} />
                <p className="mt-1 text-sm text-[#64748B] dark:text-slate-300">{budgetDocumentSummary.reviewedProjects} projects</p>
              </div>
              <div className="rounded-[20px] border border-[#DCE8F6] bg-white p-4 shadow-[0_8px_18px_rgba(15,23,42,0.04)] dark:border-white/10 dark:bg-[#1B2A41]">
                <p className="text-sm font-semibold text-[#0F172A] dark:text-white">Pending Budget</p>
                <CurrencyAmount amount={budgetDocumentSummary.pendingBudget} className="mt-2 text-lg font-bold" iconSize={14} />
                <p className="mt-1 text-sm text-[#64748B] dark:text-slate-300">{budgetDocumentSummary.pendingProjects} projects</p>
              </div>
              <div className="rounded-[20px] border border-[#FDE68A] bg-[#FFF8E8] p-4 shadow-[0_8px_18px_rgba(15,23,42,0.04)] dark:border-[#D97706]/30 dark:bg-[#3A2810]">
                <p className="text-sm font-semibold text-[#B45309] dark:text-[#FCD34D]">Missing Docs</p>
                <p className="mt-2 text-2xl font-bold text-[#B45309] dark:text-[#FCD34D]">{budgetDocumentSummary.missingDocs}</p>
                <p className="mt-1 text-sm text-[#B45309] dark:text-[#FDE68A]">{budgetDocumentSummary.blockedLabel}</p>
              </div>
            </div>
          </div>
        </StrategySectionCard>
      </section>

      <section className="grid grid-cols-1 items-stretch gap-5 xl:grid-cols-2">
        <StrategySectionCard
          title="Clarifications Monitor"
          description="Keep the most active clarification-linked projects visible so recommendation flow does not stall."
          className="h-full"
          headingIcon={<MessageSquareDot className="h-5 w-5 text-[#286CFF]" />}
        >
          <div className="flex h-full flex-col justify-center">
          <div className="space-y-3">
            {clarificationMonitor.slice(0, 3).map((item) => (
              <div key={item.id} className="rounded-[22px] border border-[#DCE8F6] bg-[#F8FBFF] p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(15,23,42,0.05)] dark:border-white/10 dark:bg-[#1B2A41]">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs text-[#94A3B8]">{item.id}</span>
                      <span
                        className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold"
                        style={{ backgroundColor: `${item.accent}14`, color: item.accent }}
                      >
                        {item.state}
                      </span>
                    </div>
                    <p className="mt-2 text-base font-semibold text-[#0F172A] dark:text-white">{item.title}</p>
                    <p className="mt-1 text-sm text-[#64748B] dark:text-slate-300">{item.entity}</p>
                  </div>
                  <Link
                    to="/sme-team/reviews"
                    className="shrink-0 text-sm font-semibold text-[#286CFF] transition-colors hover:text-[#0C65F5] dark:text-[#BFDBFE] dark:hover:text-white"
                  >
                    View Detail
                  </Link>
                </div>
                <p className="mt-2 text-sm leading-6 text-[#64748B] dark:text-slate-300">{item.note}</p>
              </div>
            ))}
          </div>
          </div>
        </StrategySectionCard>

        <StrategyAiPanel title="AI Review Guidance">
          <div className="flex h-full flex-col justify-center space-y-3">
            {smeAiSignals.map((signal) => (
              <div key={signal.title} className="rounded-[18px] border border-[#E9D5FF] bg-white p-4 dark:border-white/10 dark:bg-white/5">
                <div className="flex items-start gap-3">
                  <div
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white"
                    style={{ backgroundColor: signal.accent }}
                  >
                    <signal.icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-base font-semibold text-[#0F172A] dark:text-white">{signal.title}</p>
                    <p className="mt-1 text-sm leading-6 text-[#64748B] dark:text-slate-300">{signal.detail}</p>
                  </div>
                </div>
              </div>
            ))}
            <div className="rounded-[18px] border border-[#DCE8F6] bg-white px-4 py-3 dark:border-white/10 dark:bg-white/5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[#0F172A] dark:text-white">Review Momentum</p>
                  <p className="mt-1 text-sm text-[#64748B] dark:text-slate-300">24 of 38 projects already reviewed</p>
                </div>
                <span className="text-lg font-bold text-[#286CFF] dark:text-[#BFDBFE]">63%</span>
              </div>
              <div className="mt-3">
                <StrategyProgressBar value={63} accent="#286CFF" />
              </div>
            </div>
          </div>
        </StrategyAiPanel>
      </section>
    </StrategyPageShell>
  )
}
