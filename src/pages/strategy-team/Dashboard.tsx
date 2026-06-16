import { Link } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import {
  ArrowRight,
  BrainCircuit,
  Building2,
  CheckCircle2,
  CircleAlert,
  ClipboardList,
  Clock3,
  FileText,
  GaugeCircle,
  GitBranch,
  MessageSquare,
  PieChart,
  ShieldAlert,
  Sparkles,
  TriangleAlert,
  Users,
  Wallet,
  Workflow,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { CurrencyAmount } from '@/components/shared/CurrencyAmount'
import { useCycle } from '@/context/CycleContext'
import { StrategyDashboardEmptyState, StrategyMetricCard, StrategyPageShell, StrategyPill, StrategyProgressBar } from './StrategyTeamShell'
import { DGE_BUDGET_STATUS, DGE_INSTANCE_STATUS, getDgePortfolioData, type DgePortfolioData } from '@/services/dgePortfolioService'
import { getStoredSmeAssignments } from '@/services/dgeRoleContextService'
import { cn } from '@/lib/utils'

function sumBudgetAmounts(budgets: DgePortfolioData['budgets']) {
  return {
    requested: budgets.reduce((sum, budget) => sum + budget.requestedBudget, 0),
    recommended: budgets.reduce((sum, budget) => sum + budget.recommendedBudget, 0),
    allocated: budgets.reduce((sum, budget) => sum + budget.allocatedBudget, 0),
    utilized: budgets.reduce((sum, budget) => sum + budget.utilizedBudget, 0),
  }
}

function BudgetPortfolioGrid({ budgets }: { budgets: DgePortfolioData['budgets'] }) {
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

function MiniLink({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-2 rounded-full border border-[#D7E4F4] bg-white px-3 py-1.5 text-sm font-semibold text-[#286CFF] transition-colors hover:border-[#B0DBFF] hover:bg-[#EEF5FF] dark:border-white/10 dark:bg-white/5 dark:text-[#BFDBFE]"
    >
      {label}
      <ArrowRight className="h-3.5 w-3.5" />
    </Link>
  )
}

function SkeletonBlock({ className }: { className: string }) {
  return <div className={cn('animate-pulse rounded-2xl bg-[#EAF0F6] dark:bg-white/10', className)} />
}

function DashboardSkeleton() {
  return (
    <>
      <section className="overflow-hidden rounded-[24px] border border-[#D9E6F5] bg-white dark:border-white/10 dark:bg-[#162339]">
        <div className="space-y-4 p-5">
          <div className="flex flex-wrap gap-4">
            <SkeletonBlock className="h-12 w-60" />
            <SkeletonBlock className="h-12 w-60" />
          </div>
          <SkeletonBlock className="h-20 w-full rounded-[20px]" />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <SkeletonBlock key={index} className="h-40 w-full rounded-[24px]" />
        ))}
      </section>

      {Array.from({ length: 3 }).map((_, rowIndex) => (
        <section key={rowIndex} className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <SkeletonBlock className="h-[360px] w-full rounded-[28px]" />
          <SkeletonBlock className="h-[360px] w-full rounded-[28px]" />
        </section>
      ))}
    </>
  )
}

export default function StrategyTeamDashboard() {
  const { selectedCycle } = useCycle()
  const [portfolio, setPortfolio] = useState<DgePortfolioData>({ instances: [], budgets: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      if (!selectedCycle?.id) {
        if (!cancelled) {
          setPortfolio({ instances: [], budgets: [] })
          setLoading(false)
        }
        return
      }

      setLoading(true)
      setError(null)

      try {
        const data = await getDgePortfolioData(selectedCycle.id)
        if (!cancelled) {
          setPortfolio(data)
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load strategy dashboard data.')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [selectedCycle?.id])

  const budgets = portfolio.budgets
  const instances = portfolio.instances
  const clarificationBudgets = useMemo(
    () => budgets.filter((budget) => budget.statuscode === DGE_BUDGET_STATUS.clarificationPending),
    [budgets]
  )
  const aiFlagCount = useMemo(
    () => budgets.reduce((sum, budget) => sum + (budget.aiReviewFlags?.length ?? 0), 0),
    [budgets]
  )
  const missingDocumentCount = useMemo(
    () => budgets.filter((budget) => !budget.sharePointUrl).length,
    [budgets]
  )
  const dgeToAdgeClarifications = useMemo(
    () => clarificationBudgets.filter((budget) => budget.statusForAdge === 5),
    [clarificationBudgets]
  )
  const internalDgeClarifications = useMemo(
    () => clarificationBudgets.filter((budget) => budget.statusForAdge !== 5),
    [clarificationBudgets]
  )
  const highestPendingClarifications = useMemo(() => {
    const byEntity = new Map<string, number>()
    for (const budget of clarificationBudgets) {
      const key = budget.entityName || budget.instanceName || 'Unknown Entity'
      byEntity.set(key, (byEntity.get(key) ?? 0) + 1)
    }
    return [...byEntity.entries()]
      .map(([entity, count]) => ({ entity, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
  }, [clarificationBudgets])
  const qualityCheckBudgets = useMemo(
    () => budgets.filter((budget) => budget.statuscode === DGE_BUDGET_STATUS.underQualityCheck),
    [budgets]
  )
  const finalReviewBudgets = useMemo(
    () => budgets.filter((budget) => budget.statuscode === DGE_BUDGET_STATUS.underFinalReview),
    [budgets]
  )
  const reviewCompletedBudgets = useMemo(
    () => budgets.filter((budget) => budget.statuscode === DGE_BUDGET_STATUS.reviewCompleted),
    [budgets]
  )
  const getInstanceStageMeta = (statuscode: number | null | undefined) => {
    switch (statuscode) {
      case DGE_INSTANCE_STATUS.planning:
        return { label: 'Planning', progress: 20, accent: '#008A65', tone: 'teal' as const }
      case DGE_INSTANCE_STATUS.underDgeReview:
        return { label: 'Under DGE Review', progress: 40, accent: '#286CFF', tone: 'blue' as const }
      case DGE_INSTANCE_STATUS.reviewCompletedByDge:
        return { label: 'Review Completed by DGE', progress: 60, accent: '#7C3AED', tone: 'violet' as const }
      case DGE_INSTANCE_STATUS.allocation:
        return { label: 'Allocation', progress: 80, accent: '#D97706', tone: 'amber' as const }
      case DGE_INSTANCE_STATUS.utilization:
        return { label: 'Utilization', progress: 100, accent: '#0F9D8A', tone: 'teal' as const }
      default:
        return { label: 'Planning', progress: 10, accent: '#008A65', tone: 'teal' as const }
    }
  }
  const entityStageRows = useMemo(() => {
    return instances.map((instance) => {
      const stage = getInstanceStageMeta(instance.statuscode)
      const completed = instance.budgets.filter((budget) => budget.statuscode === DGE_BUDGET_STATUS.reviewCompleted).length
      const hasCompletedDgeReviewStage =
        instance.statuscode === DGE_INSTANCE_STATUS.reviewCompletedByDge ||
        instance.statuscode === DGE_INSTANCE_STATUS.allocation ||
        instance.statuscode === DGE_INSTANCE_STATUS.utilization
      const detail = hasCompletedDgeReviewStage
        ? `${instance.budgets.length} projects, DGE review completed`
        : `${instance.budgets.length} projects, ${completed} review completed`

      return { instance, stage: stage.label, detail, progress: stage.progress, accent: stage.accent, tone: stage.tone }
    })
  }, [instances])

  const entityReadiness = useMemo(() => {
    const submitted = instances.filter((instance) => instance.budgets.length > 0).length
    const inReview = instances.filter((instance) => instance.statuscode === DGE_INSTANCE_STATUS.underDgeReview).length
    const planning = instances.filter((instance) => instance.statuscode === DGE_INSTANCE_STATUS.planning).length
    return { submitted, inReview, planning }
  }, [instances])

  const strategyOwnedCount = useMemo(
    () =>
      budgets.filter(
        (budget) =>
          budget.statuscode === DGE_BUDGET_STATUS.underStrategicAlignmentReview ||
          budget.statuscode === DGE_BUDGET_STATUS.strategicPriorityChangeUnderReview ||
          budget.statuscode === DGE_BUDGET_STATUS.underQualityCheck ||
          budget.statuscode === DGE_BUDGET_STATUS.clarificationPending
      ).length,
    [budgets]
  )

  const dashboardStats = useMemo(
    () => [
      {
        label: 'Projects in cycle',
        value: budgets.length.toString(),
        note: 'Across all entities',
        accent: '#286CFF',
        icon: ClipboardList,
      },
      {
        label: 'Aligned priorities',
        value: budgets
          .filter(
            (budget) =>
              budget.statuscode === DGE_BUDGET_STATUS.underSmeReview ||
              budget.statuscode === DGE_BUDGET_STATUS.underQualityCheck
          )
          .length.toString(),
        note: 'Ready for SME routing',
        accent: '#14B8A6',
        icon: Sparkles,
      },
      {
        label: 'SME queues active',
        value: budgets.filter((budget) => budget.statuscode === DGE_BUDGET_STATUS.underSmeReview).length.toString(),
        note: 'Currently with SME teams',
        accent: '#9333EA',
        icon: Users,
      },
      {
        label: 'Quality check items',
        value: budgets.filter((budget) => budget.statuscode === DGE_BUDGET_STATUS.underQualityCheck).length.toString(),
        note: 'Awaiting governance review',
        accent: '#F97316',
        icon: BrainCircuit,
      },
    ],
    [budgets]
  )

  const alignmentDistribution = useMemo(() => {
    const alignedAndReady = budgets.filter(
      (budget) => budget.statuscode === DGE_BUDGET_STATUS.underStrategicAlignmentReview
    ).length
    const needsClassification = budgets.filter(
      (budget) => budget.statuscode === DGE_BUDGET_STATUS.strategicPriorityChangeUnderReview
    ).length
    const qualityCheck = budgets.filter(
      (budget) => budget.statuscode === DGE_BUDGET_STATUS.underQualityCheck
    ).length
    const holdForClarification = budgets.filter(
      (budget) => budget.statuscode === DGE_BUDGET_STATUS.clarificationPending
    ).length
    const total = Math.max(1, alignedAndReady + needsClassification + qualityCheck + holdForClarification)

    return [
      { label: 'Aligned and ready', value: alignedAndReady, color: '#286CFF', share: Math.round((alignedAndReady / total) * 100) },
      { label: 'Needs classification review', value: needsClassification, color: '#A855F7', share: Math.round((needsClassification / total) * 100) },
      { label: 'Quality Check', value: qualityCheck, color: '#10B981', share: Math.round((qualityCheck / total) * 100) },
      { label: 'Hold for clarification', value: holdForClarification, color: '#DC2626', share: Math.round((holdForClarification / total) * 100) },
    ]
  }, [budgets])

  const dynamicSmeTracks = useMemo(() => {
    return getStoredSmeAssignments().map((assignment) => {
      const matching = budgets.filter((budget) => budget.strategicPriorityId === assignment.strategicPriorityId)

      const awaitingSME = matching.filter((budget) => budget.statuscode === DGE_BUDGET_STATUS.underSmeReview).length
      const routedToQualityCheck = matching.filter((budget) => budget.statuscode === DGE_BUDGET_STATUS.underQualityCheck).length
      const totalInLane = awaitingSME + routedToQualityCheck
      const progress = totalInLane ? Math.round((routedToQualityCheck / totalInLane) * 100) : 0
      const status = awaitingSME > routedToQualityCheck ? 'Backlog' : routedToQualityCheck > 0 ? 'On Track' : 'Attention'

      return {
        priority: assignment.strategicPriorityName.split(' - ')[0]?.trim() || assignment.strategicPriorityName,
        ownerTeam: assignment.teamName,
        status,
        projects: matching.length,
        routed: routedToQualityCheck,
        completed: routedToQualityCheck,
        awaitingSME,
        progress,
      }
    }).filter((track) => track.projects > 0 || track.awaitingSME > 0 || track.routed > 0).slice(0, 3)
  }, [budgets])

  return (
    <StrategyPageShell
      eyebrow="ICT - Strategy Team"
      title="Strategy Team Dashboard"
      description="A high-access governance workspace for the strategy team to steer alignment, oversee entities, monitor SMEs, and keep DGE readiness moving across the full portfolio."
    >
      {loading ? (
        <DashboardSkeleton />
      ) : (
        <>
      <section className="overflow-hidden rounded-[24px] border border-[#D9E6F5] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#162339]">
        <div className="p-4 sm:p-5">
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
                <Users className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold tracking-[0.08em] text-[#64748B] dark:text-slate-300">Entity Readiness</p>
                <p className="mt-1 text-sm font-bold text-[#0F172A] dark:text-white">
                  {entityReadiness.submitted} submitted, {entityReadiness.inReview} in DGE review, {entityReadiness.planning} still planning
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-[20px] border border-[#DCE8F6] bg-[#F8FBFF] p-3 dark:border-white/10 dark:bg-white/5">
            <div className="flex items-start gap-2">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#A855F7] dark:text-[#E9D5FF]" />
              <p className="text-sm text-[#475569] dark:text-slate-200">
                <span className="font-semibold text-[#0F172A] dark:text-white">AI Summary:</span> Strategy is currently governing {budgets.length} projects across {instances.length} entities. {strategyOwnedCount} are actively on the strategy side, {entityReadiness.inReview} entities are under DGE review, and {entityReadiness.planning} still need planning-stage intervention.
              </p>
            </div>
          </div>
        </div>
      </section>

      {error ? (
        <div className="rounded-[18px] border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#B91C1C] dark:border-[#7F1D1D] dark:bg-[#3A1717] dark:text-[#FCA5A5]">
          {error}
        </div>
      ) : null}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {dashboardStats.map((item) => (
          <StrategyMetricCard
            key={item.label}
            title={item.label}
            value={item.value}
            note={item.note}
            accent={item.accent}
            icon={<item.icon className="h-4.5 w-4.5" />}
          />
        ))}
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Card className="flex h-full flex-col overflow-hidden rounded-[28px] border-[#D9E6F5] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#162339]">
          <CardContent className="flex flex-1 flex-col p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-[#286CFF]" />
                  <h2 className="text-xl font-bold text-[#0F172A] dark:text-white">Budget Portfolio</h2>
                </div>
                <p className="mt-1 text-sm text-[#64748B] dark:text-slate-300">
                  All budget lenses across the selected cycle, regardless of individual entity stage.
                </p>
              </div>
            </div>
            <div className="mt-5 flex flex-1 flex-col justify-center">
              <BudgetPortfolioGrid budgets={budgets} />
            </div>
          </CardContent>
        </Card>

        <Card className="flex h-full flex-col overflow-hidden rounded-[28px] border-[#D9E6F5] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#162339]">
          <CardContent className="flex flex-1 flex-col p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Workflow className="h-5 w-5 text-[#286CFF]" />
                  <h2 className="text-xl font-bold text-[#0F172A] dark:text-white">DGE Workflow Mix</h2>
                </div>
                <p className="mt-1 text-sm text-[#64748B] dark:text-slate-300">
                  Current distribution across strategic alignment, SME review, quality check, final review, and completion.
                </p>
              </div>
            </div>
            <div className="mt-5 flex flex-1 flex-col justify-center space-y-3">
              {[
                { label: 'Strategic Alignment', value: budgets.filter((budget) => budget.statuscode === DGE_BUDGET_STATUS.underStrategicAlignmentReview).length, accent: '#286CFF' },
                { label: 'SME Review', value: budgets.filter((budget) => budget.statuscode === DGE_BUDGET_STATUS.underSmeReview).length, accent: '#7C3AED' },
                { label: 'Quality Check', value: budgets.filter((budget) => budget.statuscode === DGE_BUDGET_STATUS.underQualityCheck).length, accent: '#10B981' },
                { label: 'Final Review', value: budgets.filter((budget) => budget.statuscode === DGE_BUDGET_STATUS.underFinalReview).length, accent: '#F97316' },
                { label: 'Review Completed', value: budgets.filter((budget) => budget.statuscode === DGE_BUDGET_STATUS.reviewCompleted).length, accent: '#0F9D8A' },
                { label: 'Allocation', value: budgets.filter((budget) => budget.statuscode === DGE_BUDGET_STATUS.allocationInProgress || budget.statuscode === DGE_BUDGET_STATUS.allocationInReview || budget.statuscode === DGE_BUDGET_STATUS.allocationCompleted).length, accent: '#D97706' },
                { label: 'Utilization', value: budgets.filter((budget) => budget.statuscode === DGE_BUDGET_STATUS.utilizationInProgress || budget.statuscode === DGE_BUDGET_STATUS.utilizationCompleted).length, accent: '#1E3A8A' },
              ].map((item) => {
                const share = budgets.length ? Math.round((item.value / budgets.length) * 100) : 0
                return (
                  <div key={item.label}>
                    <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                      <span className="font-semibold text-[#0F172A] dark:text-white">{item.label}</span>
                      <span className="text-[#64748B] dark:text-slate-300">{item.value}</span>
                    </div>
                    <StrategyProgressBar value={share} accent={item.accent} />
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Card className="order-1 flex h-full flex-col overflow-hidden rounded-[28px] border-[#D9E6F5] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#162339]">
          <CardContent className="flex flex-1 flex-col p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-[#286CFF]" />
                  <h2 className="text-xl font-bold text-[#0F172A] dark:text-white">Entity Progress</h2>
                </div>
                <p className="mt-1 text-sm text-[#64748B] dark:text-slate-300">
                  Current stage by entity across planning, DGE review, review completion, allocation, and utilization.
                </p>
              </div>
              <MiniLink to="/strategy-team/entity-tracker" label="Open tracker" />
            </div>
            <div className="mt-5 flex flex-1 flex-col justify-center space-y-3">
              {entityStageRows.slice(0, 5).map(({ instance, stage, detail, progress, accent, tone }) => (
                <div key={instance.id} className="rounded-[20px] border border-[#DCE6F6] bg-[#F8FBFF] p-4 dark:border-white/10 dark:bg-white/5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[#0F172A] dark:text-white">{instance.entityName || instance.name}</p>
                      <p className="mt-1 text-xs text-[#64748B] dark:text-slate-300">{detail}</p>
                    </div>
                    <StrategyPill tone={tone}>
                      {stage}
                    </StrategyPill>
                  </div>
                  <div className="mt-3">
                    <StrategyProgressBar value={progress} accent={accent} />
                  </div>
                </div>
              ))}
              {entityStageRows.length === 0 ? (
                <StrategyDashboardEmptyState
                  icon={<Building2 className="h-6 w-6" />}
                  title="No Entity Progress Yet"
                  description="Entity stages will appear once this cycle has participating instances and budget movement."
                />
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card className="order-3 flex h-full flex-col overflow-hidden rounded-[28px] border-[#D9E6F5] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#162339]">
          <CardContent className="flex flex-1 flex-col p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-[#286CFF]" />
                  <h2 className="text-xl font-bold text-[#0F172A] dark:text-white">Strategic Alignment</h2>
                </div>
                <p className="mt-1 text-sm text-[#64748B] dark:text-slate-300">
                  Bulk routing lane for adjusting priorities, classifications, and SME ownership.
                </p>
              </div>
              <MiniLink to="/strategy-team/strategic-alignment" label="Open table" />
            </div>
            <div className="mt-5 grid flex-1 content-center gap-3 md:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-[22px] border border-[#DCE6F6] bg-[#F8FBFF] p-4 dark:border-white/10 dark:bg-white/5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[#0F172A] dark:text-white">Alignment Distribution</p>
                    <p className="mt-1 text-xs leading-5 text-[#64748B] dark:text-slate-300">Projects by routing quality and strategy confidence.</p>
                  </div>
                  <PieChart className="h-5 w-5 text-[#286CFF]" />
                </div>
                <div className="mt-4 space-y-3">
                  {alignmentDistribution.map((item) => (
                    <div key={item.label}>
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="inline-flex items-center gap-2 font-medium text-[#0F172A] dark:text-white">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                          {item.label}
                        </span>
                        <span className="text-[#475569] dark:text-slate-300">{item.value}</span>
                      </div>
                      <div className="mt-2">
                        <StrategyProgressBar value={item.share} accent={item.color} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                {[
                  { title: 'Bulk updates ready', value: alignmentDistribution[0]?.value ?? 0, badge: 'Priority review' },
                  { title: 'Clarification hold', value: alignmentDistribution[3]?.value ?? 0, badge: 'Needs action' },
                  { title: 'Quality check', value: alignmentDistribution[2]?.value ?? 0, badge: 'Route next' },
                ].map((item) => (
                  <div key={item.title} className="rounded-[22px] border border-[#DCE6F6] bg-white p-4 dark:border-white/10 dark:bg-white/5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-[#0F172A] dark:text-white">{item.title}</p>
                        <p className="mt-2 text-2xl font-bold text-[#0F172A] dark:text-white">{item.value}</p>
                      </div>
                      <StrategyPill tone="violet">{item.badge}</StrategyPill>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="order-2 flex h-full flex-col overflow-hidden rounded-[28px] border-[#D9E6F5] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#162339]">
          <CardContent className="flex flex-1 flex-col p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-[#286CFF]" />
                  <h2 className="text-xl font-bold text-[#0F172A] dark:text-white">SME Oversight</h2>
                </div>
                <p className="mt-1 text-sm text-[#64748B] dark:text-slate-300">
                  One lane per strategic priority with live routing, confidence, and backlog signals.
                </p>
              </div>
              <MiniLink to="/strategy-team/sme-tracker" label="Open SME view" />
            </div>
            <div className="mt-5 space-y-3">
              {dynamicSmeTracks.map((track) => (
                <div key={track.priority} className="rounded-[22px] border border-[#DCE6F6] bg-[#F8FBFF] p-4 dark:border-white/10 dark:bg-white/5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[#0F172A] dark:text-white">{track.priority}</p>
                      <p className="mt-1 text-xs text-[#64748B] dark:text-slate-300">{track.ownerTeam}</p>
                    </div>
                    <StrategyPill tone={track.status === 'On Track' ? 'teal' : track.status === 'Backlog' ? 'violet' : 'amber'}>{track.status}</StrategyPill>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-[#64748B] dark:text-slate-300">
                    <span>{track.projects} projects</span>
                    <span>{track.awaitingSME} under SME review</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-xs text-[#64748B] dark:text-slate-300">
                    <span>{track.routed} routed to quality check</span>
                    <span>{track.progress}% routed</span>
                  </div>
                  <div className="mt-2">
                    <StrategyProgressBar value={track.progress} accent={track.status === 'On Track' ? '#14B8A6' : '#286CFF'} />
                  </div>
                </div>
              ))}
              {dynamicSmeTracks.length === 0 ? (
                <StrategyDashboardEmptyState
                  icon={<Users className="h-6 w-6" />}
                  title="No SME Queue Activity"
                  description="SME review lanes will appear once projects are assigned to SME teams or routed onward to quality check."
                />
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card className="order-4 flex h-full flex-col overflow-hidden rounded-[28px] border-[#D9E6F5] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#162339]">
          <CardContent className="flex flex-1 flex-col p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-[#286CFF]" />
                  <h2 className="text-xl font-bold text-[#0F172A] dark:text-white">Clarification Governance</h2>
                </div>
                <p className="mt-1 text-sm text-[#64748B] dark:text-slate-300">
                  Communication flow status.
                </p>
              </div>
              <MiniLink to="/strategy-team/quality-check" label="View All" />
            </div>
            <div className="mt-5 flex flex-1 flex-col justify-center space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {[
                  { label: 'DGE To ADGE', value: dgeToAdgeClarifications.length.toString(), accent: '#286CFF' },
                  { label: 'Within DGE', value: internalDgeClarifications.length.toString(), accent: '#A855F7' },
                  { label: 'All Pending', value: clarificationBudgets.length.toString(), accent: '#D97706' },
                  { label: 'Entities Impacted', value: highestPendingClarifications.length.toString(), accent: '#10B981' },
                  { label: 'Missing Docs', value: missingDocumentCount.toString(), accent: '#DC2626' },
                  { label: 'AI Flags', value: aiFlagCount.toString(), accent: '#0F172A' },
                ].map((item) => (
                  <div key={item.label} className="rounded-[22px] border border-[#DCE6F6] bg-[#F8FBFF] p-4 dark:border-white/10 dark:bg-white/5">
                    <p className="text-xs font-semibold tracking-[0.08em] text-[#64748B] dark:text-slate-300">{item.label}</p>
                    <p className="mt-3 text-3xl font-bold" style={{ color: item.accent }}>{item.value}</p>
                  </div>
                ))}
              </div>

              <div className="grid gap-3 md:grid-cols-[0.9fr_1.1fr]">
                <div className="rounded-[22px] border border-[#DCE6F6] bg-[#F8FBFF] p-4 dark:border-white/10 dark:bg-white/5">
                  <div className="flex items-center gap-2">
                    <GitBranch className="h-5 w-5 text-[#286CFF]" />
                    <p className="text-sm font-semibold text-[#0F172A] dark:text-white">Highest Pending</p>
                  </div>
                  <div className="mt-4 space-y-3">
                    {(highestPendingClarifications.length ? highestPendingClarifications : [{ entity: 'No pending clarifications', count: 0 }]).map((item, index) => (
                      <div key={item.entity} className="flex items-center justify-between rounded-[18px] border border-[#E4EDF9] bg-white px-4 py-3 dark:border-white/10 dark:bg-[#162339]">
                        <span className="text-sm font-semibold text-[#0F172A] dark:text-white">{item.entity}</span>
                        <span className="text-lg font-bold" style={{ color: index === 0 ? '#DC2626' : index === 1 ? '#D97706' : '#286CFF' }}>{item.count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[22px] border border-[#E9D5FF] bg-gradient-to-br from-[#FDF8FF] via-white to-white p-4 dark:border-white/10 dark:from-[#2A123D] dark:via-[#1F1B2E] dark:to-[#1E293B]">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-[#A855F7] dark:text-[#E9D5FF]" />
                    <p className="text-sm font-semibold text-[#0F172A] dark:text-white">AI Insights</p>
                  </div>
                  <div className="mt-4 space-y-3">
                    {[
                      `${dgeToAdgeClarifications.length} external clarification threads need ADGE respondent attention.`,
                      `${internalDgeClarifications.length} internal DGE clarification threads are blocking governance movement.`,
                    ].map((item) => (
                      <div key={item} className="flex items-start gap-2.5">
                        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#A855F7] dark:text-[#E9D5FF]" />
                        <span className="text-sm leading-6 text-[#475569] dark:text-slate-200">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Card className="overflow-hidden rounded-[28px] border-[#E9D5FF] bg-white shadow-[0_12px_30px_rgba(168,85,247,0.08)] dark:border-white/10 dark:bg-[#1E293B]">
          <CardContent className="bg-gradient-to-b from-[#FDF8FF] via-white to-white p-6 dark:from-[#2A123D] dark:via-[#1F1B2E] dark:to-[#1E293B]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#A855F7] text-white shadow-[0_12px_24px_rgba(168,85,247,0.24)]">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <h2 className="text-xl font-bold text-[#0F172A] dark:text-white">Deadline And Exception Monitor</h2>
                </div>
                <p className="mt-1 text-sm text-[#64748B] dark:text-slate-300">
                  Watch deadlines, exceptions, and unresolved approval bottlenecks across the portfolio.
                </p>
              </div>
              <MiniLink to="/strategy-team/entity-tracker" label="Open entity view" />
            </div>
            <div className="mt-5 flex flex-1 flex-col justify-center space-y-4">
              <div className="rounded-[24px] border border-[#DCE6F6] bg-[#F8FBFF] p-4 dark:border-white/10 dark:bg-white/5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <GaugeCircle className="h-5 w-5 text-[#286CFF]" />
                    <p className="text-sm font-semibold text-[#0F172A] dark:text-white">Timeline Heat</p>
                  </div>
                  <StrategyPill tone="amber">Attention needed</StrategyPill>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  {[
                    { title: 'AI review flags', value: aiFlagCount, note: 'Require governance attention', accent: '#F97316' },
                    { title: 'Clarification holds', value: clarificationBudgets.length, note: 'Blocking movement', accent: '#DC2626' },
                    { title: 'SME backlog pressure', value: budgets.filter((budget) => budget.statuscode === DGE_BUDGET_STATUS.underSmeReview).length, note: 'Queue strain', accent: '#A855F7' },
                  ].map((item) => (
                    <div key={item.title} className="rounded-[20px] border border-[#E4EDF9] bg-white p-4 dark:border-white/10 dark:bg-[#162339]">
                      <p className="text-xs font-semibold tracking-[0.08em] text-[#64748B] dark:text-slate-300">{item.title}</p>
                      <p className="mt-2 text-3xl font-bold" style={{ color: item.accent }}>{item.value}</p>
                      <p className="mt-2 text-sm text-[#64748B] dark:text-slate-300">{item.note}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  { title: 'DGE submission window', detail: '91 days remaining before the full DGE review deadline.', icon: Clock3, accent: '#286CFF' },
                  { title: 'Planning-stage entities', detail: `${entityReadiness.planning} entities still need strategy attention before they fully enter DGE review.`, icon: Workflow, accent: '#D97706' },
                  { title: 'Quality handoff pressure', detail: `${qualityCheckBudgets.length} projects are sitting in quality check and should be advanced before downstream pressure grows.`, icon: CircleAlert, accent: '#A855F7' },
                ].map((item) => (
                  <div key={item.title} className="rounded-[22px] border border-[#DCE6F6] bg-white p-4 dark:border-white/10 dark:bg-white/5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: `${item.accent}14`, color: item.accent }}>
                      <item.icon className="h-5 w-5" />
                    </div>
                    <p className="mt-3 text-sm font-semibold text-[#0F172A] dark:text-white">{item.title}</p>
                    <p className="mt-2 text-sm leading-6 text-[#64748B] dark:text-slate-300">{item.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-[28px] border-[#D9E6F5] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#162339]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <BrainCircuit className="h-5 w-5 text-[#286CFF]" />
                  <h2 className="text-xl font-bold text-[#0F172A] dark:text-white">Quality Check</h2>
                </div>
                <p className="mt-1 text-sm text-[#64748B] dark:text-slate-300">
                  Items needing governance review before they can move deeper into the DGE journey.
                </p>
              </div>
              <MiniLink to="/strategy-team/quality-check" label="Open QC" />
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-2 md:items-start">
              <div className="rounded-[22px] border border-[#DCE6F6] bg-[#F8FBFF] p-4 dark:border-white/10 dark:bg-white/5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <BrainCircuit className="h-5 w-5 text-[#286CFF]" />
                    <p className="text-sm font-semibold text-[#0F172A] dark:text-white">QC Flow</p>
                  </div>
                  <span className="text-2xl font-bold text-[#0F172A] dark:text-white">
                    {qualityCheckBudgets.length + finalReviewBudgets.length}
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3">
                  {[
                    { label: 'Under QC', value: qualityCheckBudgets.length, accent: '#286CFF' },
                    { label: 'Director lane', value: finalReviewBudgets.length, accent: '#10B981' },
                    { label: 'Clarification', value: clarificationBudgets.length, accent: '#D97706' },
                  ].map((item) => (
                    <div key={item.label} className="rounded-[18px] border border-[#DCE6F6] bg-white p-3 text-center dark:border-white/10 dark:bg-white/5">
                      <p className="text-xl font-bold" style={{ color: item.accent }}>{item.value}</p>
                      <p className="mt-1 text-xs font-medium text-[#64748B] dark:text-slate-300">{item.label}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 space-y-2">
                  {[...qualityCheckBudgets, ...finalReviewBudgets].slice(0, 3).map((budget) => (
                    <div key={budget.id} className="rounded-[16px] border border-[#EAF0F6] bg-white px-3 py-2 dark:border-white/10 dark:bg-[#162339]">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-[#0F172A] dark:text-white">{budget.name}</p>
                          <p className="mt-0.5 text-xs text-[#64748B] dark:text-slate-300">{budget.entityName || budget.instanceName || 'Unknown entity'}</p>
                        </div>
                        <StrategyPill tone={budget.statuscode === DGE_BUDGET_STATUS.underFinalReview ? 'violet' : 'blue'}>
                          {budget.statuscode === DGE_BUDGET_STATUS.underFinalReview ? 'Final Review' : 'Quality Check'}
                        </StrategyPill>
                      </div>
                    </div>
                  ))}
                  {qualityCheckBudgets.length + finalReviewBudgets.length === 0 ? (
                    <StrategyDashboardEmptyState
                      icon={<BrainCircuit className="h-6 w-6" />}
                      title="No Quality Check Projects"
                      description="Projects will appear here after SME review routes them to Strategy Team for quality check or final review preparation."
                    />
                  ) : null}
                </div>
              </div>
              <div className="grid gap-3">
                {[
                  { title: 'AI-sensitive items', detail: `${aiFlagCount} projects carry AI review flags across the quality and governance lanes.`, icon: Sparkles, accent: '#A855F7' },
                  { title: 'High-confidence lane', detail: `${reviewCompletedBudgets.length} projects have completed DGE review and are ready for downstream entity readiness.`, icon: CheckCircle2, accent: '#10B981' },
                  { title: 'Clarification before QC', detail: `${clarificationBudgets.length} projects are clarification pending and should be resolved before final governance movement.`, icon: CircleAlert, accent: '#D97706' },
                ].map((item) => (
                  <div key={item.title} className="rounded-[22px] border border-[#DCE6F6] bg-white p-4 dark:border-white/10 dark:bg-white/5">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: `${item.accent}14`, color: item.accent }}>
                        <item.icon className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#0F172A] dark:text-white">{item.title}</p>
                        <p className="mt-1 text-sm leading-6 text-[#64748B] dark:text-slate-300">{item.detail}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

      </section>
        </>
      )}
    </StrategyPageShell>
  )
}
