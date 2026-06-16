import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  FileText,
  FileWarning,
  FolderSearch,
  Layers,
  MessageSquareDot,
  PieChart,
  ShieldCheck,
  Sparkles,
  Wallet,
  Workflow,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CurrencyAmount } from '@/components/shared/CurrencyAmount'
import { useCycle } from '@/context/CycleContext'
import { useRole } from '@/context/RoleContext'
import { cn } from '@/lib/utils'
import {
  StrategyDashboardEmptyState,
  StrategyPageShell,
  StrategyPill,
  StrategyProgressBar,
  StrategySectionCard,
} from '@/pages/strategy-team/StrategyTeamShell'
import { getStoredCurrentSme } from '@/services/dgeRoleContextService'
import {
  DGE_BUDGET_STATUS,
  getCurrentSmeBudgets,
  getDgePortfolioData,
  type DgeBudgetRecord,
} from '@/services/dgePortfolioService'
import { ICT_BUDGET_STATUS } from '@/services/ictBudgetDraftService'

const SME_QUEUE_VISIBLE_STATUSES = new Set<number>([
  DGE_BUDGET_STATUS.underSmeReview,
  DGE_BUDGET_STATUS.strategicPriorityChangeUnderReview,
  DGE_BUDGET_STATUS.clarificationPending,
  DGE_BUDGET_STATUS.underQualityCheck,
])

const SME_QUEUE_FILTER_HREFS = {
  toReview: '/sme-team/reviews?filter=under-sme-review',
  reviewed: '/sme-team/reviews?filter=under-quality-check',
  clarificationRequired: '/sme-team/reviews?filter=clarification-required',
  clarificationRaised: '/sme-team/reviews?filter=clarification-raised',
  mismatch: '/sme-team/reviews?filter=change-under-review',
} as const

function sumBudgetAmounts(budgets: DgeBudgetRecord[]) {
  return {
    requested: budgets.reduce((sum, budget) => sum + budget.requestedBudget, 0),
    recommended: budgets.reduce((sum, budget) => sum + budget.recommendedBudget, 0),
    allocated: budgets.reduce((sum, budget) => sum + budget.allocatedBudget, 0),
    utilized: budgets.reduce((sum, budget) => sum + budget.utilizedBudget, 0),
  }
}

function BudgetPortfolioGrid({ budgets }: { budgets: DgeBudgetRecord[] }) {
  const totals = sumBudgetAmounts(budgets)
  const items = [
    { label: 'Requested', value: totals.requested, accent: '#286CFF' },
    { label: 'Recommended', value: totals.recommended, accent: '#5B87FF' },
    { label: 'Allocated', value: totals.allocated, accent: '#0C65F5' },
    { label: 'Utilized', value: totals.utilized, accent: '#1E3A8A' },
  ]

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <div key={item.label} className="rounded-[18px] border border-[#DCE8F6] bg-[#F8FBFF] p-4 dark:border-white/10 dark:bg-white/5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-[#64748B] dark:text-slate-300">{item.label}</p>
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.accent }} />
          </div>
          <CurrencyAmount amount={item.value} className="mt-3 text-lg font-bold text-[#0F172A] dark:text-white" iconSize={14} />
        </div>
      ))}
    </div>
  )
}

function SkeletonPanel() {
  return (
    <div className="space-y-5">
      <div className="animate-pulse rounded-[24px] border border-[#D9E6F5] bg-white p-5 dark:border-white/10 dark:bg-[#162339]">
        <div className="h-5 w-40 rounded bg-[#EAF0F6] dark:bg-white/10" />
        <div className="mt-4 h-4 w-full max-w-3xl rounded bg-[#EAF0F6] dark:bg-white/10" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="animate-pulse rounded-[20px] border border-[#D9E6F5] bg-white p-5 dark:border-white/10 dark:bg-[#162339]">
            <div className="h-4 w-24 rounded bg-[#EAF0F6] dark:bg-white/10" />
            <div className="mt-4 h-10 w-20 rounded bg-[#EAF0F6] dark:bg-white/10" />
            <div className="mt-4 h-4 w-full rounded bg-[#EAF0F6] dark:bg-white/10" />
          </div>
        ))}
      </div>
    </div>
  )
}

function ActionCard({
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
          <p className="min-h-[3rem] text-base font-semibold text-[#0F172A] dark:text-white">{title}</p>
          <div className="mt-3 text-[40px] font-bold leading-none text-[#0F172A] dark:text-white">{value}</div>
          <div className="mt-3">
            <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold" style={{ backgroundColor: `${accent}14`, color: accent }}>
              {badge}
            </span>
          </div>
        </div>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-transform duration-300 group-hover:scale-105" style={{ backgroundColor: `${accent}14`, color: accent }}>
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

export default function SmeTeamDashboard() {
  const { selectedCycle } = useCycle()
  const { activeRoleOptionKey } = useRole()
  const currentSme = useMemo(() => getStoredCurrentSme(), [activeRoleOptionKey])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [budgets, setBudgets] = useState<DgeBudgetRecord[]>([])
  const [assignedFilter, setAssignedFilter] = useState<'all' | 'review' | 'change' | 'clarification' | 'quality'>('all')
  const [assignedPage, setAssignedPage] = useState(1)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      if (!selectedCycle?.id) {
        if (!cancelled) {
          setBudgets([])
          setLoading(false)
        }
        return
      }

      setLoading(true)
      setError(null)

      try {
        const portfolio = await getDgePortfolioData(selectedCycle.id)
        if (!cancelled) {
          setBudgets(getCurrentSmeBudgets(portfolio, currentSme))
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load SME dashboard.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [currentSme?.strategicPriorityId, selectedCycle?.id])

  const metrics = useMemo(() => {
    const budgetTotals = sumBudgetAmounts(budgets)
    const toReview = budgets.filter((budget) => budget.statuscode === DGE_BUDGET_STATUS.underSmeReview)
    const reviewed = budgets.filter((budget) => budget.statuscode === DGE_BUDGET_STATUS.underQualityCheck)
    const changeRequests = budgets.filter(
      (budget) => budget.statuscode === DGE_BUDGET_STATUS.strategicPriorityChangeUnderReview
    )
    const clarificationsRaised = budgets.filter(
      (budget) =>
        budget.statuscode === DGE_BUDGET_STATUS.clarificationPending &&
        budget.statusForAdge === ICT_BUDGET_STATUS.clarificationPending
    )
    const clarificationsRequired = budgets.filter(
      (budget) =>
        budget.statuscode === DGE_BUDGET_STATUS.clarificationPending &&
        budget.statusForAdge !== ICT_BUDGET_STATUS.clarificationPending
    )
    const missingDocs = budgets.filter((budget) => !budget.sharePointUrl)

    return {
      budgetTotals,
      toReview,
      reviewed,
      changeRequests,
      clarificationsRaised,
      clarificationsRequired,
      missingDocs,
    }
  }, [budgets])

  const actionCards = useMemo(
    () => [
      {
        title: 'To Review',
        value: metrics.toReview.length,
        budgetLabel: 'Requested / Recommended',
        budget: metrics.toReview.reduce((sum, budget) => sum + budget.requestedBudget + budget.recommendedBudget, 0),
        badge: 'Live queue',
        accent: '#286CFF',
        icon: ClipboardCheck,
        href: SME_QUEUE_FILTER_HREFS.toReview,
      },
      {
        title: 'Reviewed',
        value: metrics.reviewed.length,
        budgetLabel: 'Requested / Recommended',
        budget: metrics.reviewed.reduce((sum, budget) => sum + budget.requestedBudget + budget.recommendedBudget, 0),
        badge: 'Quality check',
        accent: '#10B981',
        icon: CheckCircle2,
        href: SME_QUEUE_FILTER_HREFS.reviewed,
      },
      {
        title: 'Clarification Required',
        value: metrics.clarificationsRequired.length,
        budgetLabel: 'Needed by Strategy Team',
        budget: null,
        badge: 'Action needed',
        accent: '#A855F7',
        icon: MessageSquareDot,
        href: SME_QUEUE_FILTER_HREFS.clarificationRequired,
      },
      {
        title: 'Clarification Raised',
        value: metrics.clarificationsRaised.length,
        budgetLabel: 'Awaiting ADGE response',
        budget: null,
        badge: 'Pending response',
        accent: '#7C3AED',
        icon: MessageSquareDot,
        href: SME_QUEUE_FILTER_HREFS.clarificationRaised,
      },
      {
        title: 'Priority Mismatch',
        value: metrics.changeRequests.length,
        budgetLabel: 'Strategy review needed',
        budget: null,
        badge: 'Review routing',
        accent: '#F97316',
        icon: Workflow,
        href: SME_QUEUE_FILTER_HREFS.mismatch,
      },
    ],
    [
      metrics.changeRequests.length,
      metrics.clarificationsRaised.length,
      metrics.clarificationsRequired.length,
      metrics.reviewed.length,
      metrics.toReview.length,
    ]
  )

  const assignedTabs = useMemo(
    () => [
      {
        key: 'all' as const,
        label: 'All',
        count: budgets.filter((budget) => SME_QUEUE_VISIBLE_STATUSES.has(budget.statuscode)).length,
      },
      { key: 'review' as const, label: 'Under SME Review', count: metrics.toReview.length },
      {
        key: 'change' as const,
        label: 'Strategic Priority Change Under Review',
        count: metrics.changeRequests.length,
      },
      {
        key: 'clarification' as const,
        label: 'Clarification Pending',
        count: metrics.clarificationsRaised.length + metrics.clarificationsRequired.length,
      },
      { key: 'quality' as const, label: 'Under Quality Check', count: metrics.reviewed.length },
    ],
    [
      budgets.length,
      metrics.changeRequests.length,
      metrics.clarificationsRaised.length,
      metrics.clarificationsRequired.length,
      metrics.reviewed.length,
      metrics.toReview.length,
    ]
  )

  const assignedProjects = useMemo(() => {
    const filtered = budgets.filter((budget) => {
      if (!SME_QUEUE_VISIBLE_STATUSES.has(budget.statuscode)) return false
      if (assignedFilter === 'review') return budget.statuscode === DGE_BUDGET_STATUS.underSmeReview
      if (assignedFilter === 'change') {
        return budget.statuscode === DGE_BUDGET_STATUS.strategicPriorityChangeUnderReview
      }
      if (assignedFilter === 'clarification') return budget.statuscode === DGE_BUDGET_STATUS.clarificationPending
      if (assignedFilter === 'quality') return budget.statuscode === DGE_BUDGET_STATUS.underQualityCheck
      return true
    })
    return filtered
  }, [assignedFilter, budgets])

  const assignedPageSize = 4
  const assignedTotalPages = Math.max(1, Math.ceil(assignedProjects.length / assignedPageSize))
  const assignedVisible = assignedProjects.slice((assignedPage - 1) * assignedPageSize, assignedPage * assignedPageSize)

  useEffect(() => {
    setAssignedPage(1)
  }, [assignedFilter])

  const entityCount = new Set(
    budgets.map((budget) => budget.entityName || budget.instanceName).filter((value): value is string => Boolean(value))
  ).size

  const reviewProgress = budgets.length ? Math.round((metrics.reviewed.length / budgets.length) * 100) : 0
  const outstandingProgress = budgets.length ? Math.round((metrics.toReview.length / budgets.length) * 100) : 0
  const changeRequestProgress = budgets.length ? Math.round((metrics.changeRequests.length / budgets.length) * 100) : 0

  return (
    <StrategyPageShell
      eyebrow="ICT - SME Team"
      title="SME Dashboard"
      description="A live domain workspace for assigned SME reviews, strategic change requests, quality-check routing, and budget-document posture across all entities in the selected cycle."
    >
      {error ? (
        <div className="rounded-[18px] border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#B91C1C] dark:border-[#7F1D1D] dark:bg-[#3A1717] dark:text-[#FCA5A5]">
          {error}
        </div>
      ) : null}

      {loading ? (
        <SkeletonPanel />
      ) : (
        <>
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
                      <p className="text-sm font-bold text-[#0F172A] dark:text-white">{selectedCycle?.name || 'No active cycle'}</p>
                    </div>
                  </div>
                </div>
                <div className="hidden h-10 w-px bg-[#DCE8F6] lg:block dark:bg-white/10" />
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F5EEFF] text-[#A855F7] dark:bg-[#A855F7]/15 dark:text-[#E9D5FF]">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold tracking-[0.08em] text-[#64748B] dark:text-slate-300">SME Team</p>
                    <p className="mt-1 text-sm font-bold text-[#0F172A] dark:text-white">{currentSme?.teamName || '-'}</p>
                  </div>
                </div>
              </div>
              <div className="mt-4 rounded-[20px] border border-[#DCE8F6] bg-[#F8FBFF] p-3 dark:border-white/10 dark:bg-white/5">
                <div className="flex items-start gap-2">
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#A855F7] dark:text-[#E9D5FF]" />
                  <p className="text-sm text-[#475569] dark:text-slate-200">
                    <span className="font-semibold text-[#0F172A] dark:text-white">AI Summary:</span> {budgets.length} projects across {entityCount} entities are currently in your SME lane. {metrics.toReview.length} still need review, {metrics.changeRequests.length} are waiting for strategy confirmation, and {metrics.reviewed.length} have already moved to quality check.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {actionCards.map((card) => (
              <ActionCard key={card.title} {...card} />
            ))}
          </section>

          <section className="grid grid-cols-1 items-stretch gap-5 xl:grid-cols-2">
            <StrategySectionCard
              title="Assigned Reviews"
              description="Active projects in the SME domain across review, strategic change, and quality-check states."
              className="h-full"
              headingIcon={<ClipboardCheck className="h-5 w-5 text-[#286CFF]" />}
            >
              <div className="flex h-full flex-col">
                <div className="flex flex-wrap gap-2">
                  {assignedTabs.map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setAssignedFilter(tab.key)}
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                        assignedFilter === tab.key
                          ? 'bg-[var(--primary)] text-white'
                          : 'border border-[#E2E8F0] bg-white text-[#0F172A] hover:bg-[#F1F5F9] dark:border-white/10 dark:bg-[#1E293B] dark:text-white dark:hover:bg-white/5'
                      )}
                    >
                      {tab.label}
                      <span className={cn('rounded-full px-1.5 py-0.5 text-xs font-bold', assignedFilter === tab.key ? 'bg-white/20' : 'bg-[#F1F5F9] dark:bg-white/10')}>
                        {tab.count}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="mt-4 flex-1 space-y-3">
                  {assignedVisible.length === 0 ? (
                    <StrategyDashboardEmptyState
                      icon={<FolderSearch className="h-6 w-6" />}
                      title="No Assigned Projects"
                      description="No projects match this SME review filter. Switch filters or wait for Strategy Team to route new budgets to this SME domain."
                    />
                  ) : (
                    assignedVisible.map((budget) => (
                      <div key={budget.id} className="rounded-[20px] border border-[#DCE8F6] bg-[#FBFDFF] p-4 transition-all hover:-translate-y-0.5 hover:border-[#BFD8FF] hover:shadow-[0_14px_28px_rgba(15,23,42,0.07)] dark:border-white/10 dark:bg-white/5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-base font-semibold text-[#0F172A] dark:text-white">{budget.name}</p>
                              <StrategyPill
                                tone={
                                  budget.statuscode === DGE_BUDGET_STATUS.underQualityCheck
                                    ? 'amber'
                                    : budget.statuscode === DGE_BUDGET_STATUS.strategicPriorityChangeUnderReview
                                      ? 'violet'
                                      : 'blue'
                                }
                                className="whitespace-nowrap"
                              >
                                {budget.statusLabel}
                              </StrategyPill>
                            </div>
                            <p className="mt-1 text-sm text-[#64748B] dark:text-slate-300">
                              {budget.budgetRefId} • {budget.entityName || budget.instanceName || 'Unknown Entity'}
                            </p>
                            <p className="mt-3 line-clamp-2 text-sm leading-6 text-[#475569] dark:text-slate-300">
                              {budget.summary || 'No summary available for this project.'}
                            </p>
                          </div>
                          <Button size="sm" className="h-8 bg-[#286CFF] px-3 text-xs text-white hover:bg-[#0C65F5]" asChild>
                            <Link to="/sme-team/reviews">
                              Review
                            </Link>
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-[#EEF3F8] pt-4 dark:border-white/10">
                  <p className="text-sm text-[#64748B] dark:text-slate-300">
                    Showing {(assignedPage - 1) * assignedPageSize + (assignedVisible.length ? 1 : 0)}-{(assignedPage - 1) * assignedPageSize + assignedVisible.length} of {assignedProjects.length}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button type="button" variant="outline" size="sm" className="h-8 rounded-lg px-3" disabled={assignedPage <= 1} onClick={() => setAssignedPage((current) => Math.max(1, current - 1))}>
                      Previous
                    </Button>
                    <Button type="button" variant="outline" size="sm" className="h-8 rounded-lg px-3" disabled={assignedPage >= assignedTotalPages} onClick={() => setAssignedPage((current) => Math.min(assignedTotalPages, current + 1))}>
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            </StrategySectionCard>

            <StrategySectionCard
              title="Budget And Documents"
              description="Budget value and document posture across every project in this SME domain."
              className="h-full"
              headingIcon={<Wallet className="h-5 w-5 text-[#286CFF]" />}
            >
              <div className="flex h-full flex-col justify-center">
                <div className="rounded-[24px] border border-[#DCE8F6] bg-[linear-gradient(135deg,#F8FBFF_0%,#EEF5FF_100%)] p-5 dark:border-white/10 dark:bg-[linear-gradient(135deg,#162339_0%,#1B2A41_100%)]">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-[#0F172A] dark:text-white">Domain Budget Portfolio</p>
                      <p className="mt-2 text-sm text-[#64748B] dark:text-slate-300">{budgets.length} projects in the SME lane</p>
                    </div>
                    <div className="rounded-full bg-white/80 px-3 py-1 text-sm font-semibold text-[#286CFF] dark:bg-white/10 dark:text-[#BFDBFE]">
                      {reviewProgress}% reviewed
                    </div>
                  </div>
                  <div className="mt-5">
                    <BudgetPortfolioGrid budgets={budgets} />
                  </div>

                  <div className="mt-5 h-4 overflow-hidden rounded-full bg-white/70 dark:bg-white/10">
                    <div className="flex h-full">
                      <div className="flex h-full items-center justify-center bg-[#286CFF] text-[11px] font-semibold text-white" style={{ width: `${Math.max(reviewProgress, metrics.reviewed.length ? 8 : 0)}%` }}>
                        {metrics.reviewed.length}
                      </div>
                      <div className="flex h-full items-center justify-center bg-[#7C3AED] text-[11px] font-semibold text-white" style={{ width: `${Math.max(outstandingProgress, metrics.toReview.length ? 8 : 0)}%` }}>
                        {metrics.toReview.length}
                      </div>
                      <div className="flex h-full items-center justify-center bg-[#F97316] text-[11px] font-semibold text-white" style={{ width: `${Math.max(changeRequestProgress, metrics.changeRequests.length ? 8 : 0)}%` }}>
                        {metrics.changeRequests.length}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
                    <div className="inline-flex items-center gap-2 text-[#286CFF] dark:text-[#BFDBFE]">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#286CFF]" />
                      Reviewed {metrics.reviewed.length}
                    </div>
                    <div className="inline-flex items-center gap-2 text-[#7C3AED] dark:text-[#E9D5FF]">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#7C3AED]" />
                      To Review {metrics.toReview.length}
                    </div>
                    <div className="inline-flex items-center gap-2 text-[#F97316] dark:text-[#FDBA74]">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#F97316]" />
                      Change Review {metrics.changeRequests.length}
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="rounded-[20px] border border-[#DCE8F6] bg-white p-4 dark:border-white/10 dark:bg-[#1B2A41]">
                    <p className="text-sm font-semibold text-[#0F172A] dark:text-white">Reviewed Recommended</p>
                    <CurrencyAmount amount={metrics.reviewed.reduce((sum, budget) => sum + budget.recommendedBudget, 0)} className="mt-2 text-lg font-bold" iconSize={14} />
                    <p className="mt-1 text-sm text-[#64748B] dark:text-slate-300">{metrics.reviewed.length} projects</p>
                  </div>
                  <div className="rounded-[20px] border border-[#DCE8F6] bg-white p-4 dark:border-white/10 dark:bg-[#1B2A41]">
                    <p className="text-sm font-semibold text-[#0F172A] dark:text-white">Pending Requested</p>
                    <CurrencyAmount amount={metrics.toReview.reduce((sum, budget) => sum + budget.requestedBudget, 0)} className="mt-2 text-lg font-bold" iconSize={14} />
                    <p className="mt-1 text-sm text-[#64748B] dark:text-slate-300">{metrics.toReview.length} projects</p>
                  </div>
                  <div className="rounded-[20px] border border-[#FDE68A] bg-[#FFF8E8] p-4 dark:border-[#D97706]/30 dark:bg-[#3A2810]">
                    <p className="text-sm font-semibold text-[#B45309] dark:text-[#FCD34D]">Missing Docs</p>
                    <p className="mt-2 text-2xl font-bold text-[#B45309] dark:text-[#FCD34D]">{metrics.missingDocs.length}</p>
                    <p className="mt-1 text-sm text-[#B45309] dark:text-[#FDE68A]">Blocked by document posture</p>
                  </div>
                </div>
              </div>
            </StrategySectionCard>
          </section>

          <section className="grid grid-cols-1 items-stretch gap-5 xl:grid-cols-2">
            <StrategySectionCard
              title="SME Progress"
              description="Live progress snapshot for the current domain, covering throughput, routed items, and strategy-review exceptions."
              className="h-full"
              headingIcon={<PieChart className="h-5 w-5 text-[#286CFF]" />}
            >
              <div className="flex h-full flex-col space-y-5">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-[20px] border border-[#DCE8F6] bg-[#F8FBFF] p-4 dark:border-white/10 dark:bg-white/5">
                    <p className="text-sm font-semibold text-[#0F172A] dark:text-white">Projects</p>
                    <p className="mt-2 text-2xl font-bold text-[#0F172A] dark:text-white">{budgets.length}</p>
                    <p className="mt-1 text-sm text-[#64748B] dark:text-slate-300">Across {entityCount} entities</p>
                  </div>
                  <div className="rounded-[20px] border border-[#DCE8F6] bg-[#F8FBFF] p-4 dark:border-white/10 dark:bg-white/5">
                    <p className="text-sm font-semibold text-[#0F172A] dark:text-white">Quality Check</p>
                    <p className="mt-2 text-2xl font-bold text-[#0F172A] dark:text-white">{metrics.reviewed.length}</p>
                    <p className="mt-1 text-sm text-[#64748B] dark:text-slate-300">Already routed forward</p>
                  </div>
                  <div className="rounded-[20px] border border-[#DCE8F6] bg-[#F8FBFF] p-4 dark:border-white/10 dark:bg-white/5">
                    <p className="text-sm font-semibold text-[#0F172A] dark:text-white">Mismatch Requests</p>
                    <p className="mt-2 text-2xl font-bold text-[#0F172A] dark:text-white">{metrics.changeRequests.length}</p>
                    <p className="mt-1 text-sm text-[#64748B] dark:text-slate-300">Waiting on Strategy Team</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="font-semibold text-[#0F172A] dark:text-white">Review completion</span>
                      <span className="text-[#286CFF] dark:text-[#BFDBFE]">{reviewProgress}%</span>
                    </div>
                    <StrategyProgressBar value={reviewProgress} accent="#286CFF" />
                  </div>
                  <div>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="font-semibold text-[#0F172A] dark:text-white">Still under SME review</span>
                      <span className="text-[#7C3AED] dark:text-[#E9D5FF]">{outstandingProgress}%</span>
                    </div>
                    <StrategyProgressBar value={outstandingProgress} accent="#7C3AED" />
                  </div>
                  <div>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="font-semibold text-[#0F172A] dark:text-white">Strategic change under review</span>
                      <span className="text-[#F97316] dark:text-[#FDBA74]">{changeRequestProgress}%</span>
                    </div>
                    <StrategyProgressBar value={changeRequestProgress} accent="#F97316" />
                  </div>
                </div>
              </div>
            </StrategySectionCard>

            <StrategySectionCard
              title="AI Review Guidance"
              description="AI signals for this SME domain, based on queue state, document posture, and strategic mapping exceptions."
              className="h-full"
              headingIcon={<Sparkles className="h-5 w-5 text-[#A855F7]" />}
            >
              <div className="flex h-full flex-col justify-center space-y-3">
                <div className="overflow-hidden rounded-[18px] border border-[#E9D5FF] bg-white dark:border-white/10 dark:bg-[#1E293B]">
                  <div className="flex items-center gap-2 bg-gradient-to-b from-[#FDF7FF] to-white px-4 py-3 dark:from-[#2A123D] dark:to-[#1E293B]">
                    <Sparkles className="h-4 w-4 text-[#A855F7]" />
                    <span className="text-sm font-semibold text-[#0F172A] dark:text-white">AI Review Guidance</span>
                  </div>
                  <div className="space-y-3 border-t border-[#E9D5FF] px-4 py-4 dark:border-white/10">
                    <div className="rounded-[16px] border border-[#EAF0F6] bg-[#F8FBFF] p-4 dark:border-white/10 dark:bg-white/5">
                      <div className="flex items-center gap-2">
                        <ClipboardCheck className="h-4 w-4 text-[#286CFF]" />
                        <p className="text-sm font-semibold text-[#0F172A] dark:text-white">Queue focus</p>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-[#475569] dark:text-slate-300">
                        {metrics.toReview.length} items still need SME review in {currentSme?.teamName || 'this domain'}. Move the cleanest evidence sets first to keep quality check flowing.
                      </p>
                    </div>
                    <div className="rounded-[16px] border border-[#EAF0F6] bg-[#F8FBFF] p-4 dark:border-white/10 dark:bg-white/5">
                      <div className="flex items-center gap-2">
                        <Workflow className="h-4 w-4 text-[#A855F7]" />
                        <p className="text-sm font-semibold text-[#0F172A] dark:text-white">Routing risk</p>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-[#475569] dark:text-slate-300">
                        {metrics.changeRequests.length} projects are already asking for strategic remapping. Review similar items early to avoid sending misclassified budgets deeper into the flow.
                      </p>
                    </div>
                    <div className="rounded-[16px] border border-[#EAF0F6] bg-[#F8FBFF] p-4 dark:border-white/10 dark:bg-white/5">
                      <div className="flex items-center gap-2">
                        <FileWarning className="h-4 w-4 text-[#F97316]" />
                        <p className="text-sm font-semibold text-[#0F172A] dark:text-white">Document posture</p>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-[#475569] dark:text-slate-300">
                        {metrics.missingDocs.length} projects in this domain do not yet have a linked document path, which may weaken confidence during SME review and quality check.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </StrategySectionCard>
          </section>
        </>
      )}
    </StrategyPageShell>
  )
}

function trimTitle(value: string) {
  return value.split(' - ')[0]?.trim() || value
}
