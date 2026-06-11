import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, ChevronDown, Clock3, CircleCheckBig, Route, Sparkles, Waypoints } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { useCycle } from '@/context/CycleContext'
import { StrategyPageShell, StrategyPill } from './StrategyTeamShell'
import {
  getBudgetStageBucket,
  getDgePortfolioData,
  getInstanceStageFilterLabel,
  type DgeInstanceRecord,
} from '@/services/dgePortfolioService'

const stages = ['All Stages', 'Planning', 'DGE Review', 'Allocation', 'Utilization'] as const
const stepStages = ['Planning', 'DGE Review', 'Review Completed', 'Allocation', 'Utilization'] as const

const stepIcons = {
  Planning: Clock3,
  'DGE Review': Route,
  'Review Completed': CircleCheckBig,
  Allocation: Waypoints,
  Utilization: ArrowRight,
} as const

function SkeletonBlock({ className }: { className: string }) {
  return <div className={cn('animate-pulse rounded-2xl bg-[#EAF0F6] dark:bg-white/10', className)} />
}

function getActiveStepIndex(instance: DgeInstanceRecord) {
  const stage = getInstanceStageFilterLabel(instance.statuscode)
  if (stage === 'Planning') return 0
  if (stage === 'DGE Review') {
    return instance.statusLabel === 'Review Completed' ? 2 : 1
  }
  if (stage === 'Allocation') return 3
  if (stage === 'Utilization') return 4
  return 0
}

function EntityTrackerSummary() {
  const [expanded, setExpanded] = useState(false)
  return (
    <section className="overflow-hidden rounded-[28px] border border-[#E9D5FF] bg-white dark:border-white/10 dark:bg-[#1E293B]">
      <button
        type="button"
        onClick={() => setExpanded((current) => !current)}
        className="flex w-full items-start justify-between gap-4 bg-gradient-to-b from-[#FDF8FF] via-white to-white px-6 py-5 text-left transition-colors hover:bg-white/40 dark:from-[#2A123D] dark:via-[#1F1B2E] dark:to-[#1E293B] dark:hover:bg-white/5"
      >
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#A855F7] text-white shadow-[0_12px_24px_rgba(168,85,247,0.24)]">
            <Sparkles className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-[16px] font-semibold text-[#0F172A] dark:text-white">AI Entity Tracker Summary</h2>
              <span className="inline-flex rounded-full bg-[#F5EEFF] px-2.5 py-1 text-xs font-semibold text-[#A855F7] dark:bg-[#A855F7]/15 dark:text-[#E9D5FF]">
                Governing View
              </span>
            </div>
            <p className="mt-1 text-sm leading-6 text-[#475569] dark:text-slate-100">
              Portfolio-level progress across every participating entity, with stage pressure, routing signals, and governance focus.
            </p>
          </div>
        </div>
        <ChevronDown className={cn('mt-1 h-5 w-5 shrink-0 text-[#64748B] transition-transform dark:text-slate-300', expanded && 'rotate-180')} />
      </button>

      {expanded ? (
        <div className="border-t border-[#DDEBFF] px-6 py-5 dark:border-white/10">
          <div className="grid gap-4 lg:grid-cols-2">
            {[
              'Planning pressure remains highest where ADGE submissions are still incomplete.',
              'Entities already in DGE review should be watched for routing and clarification bottlenecks.',
              'Allocation and utilization readiness depends on how smoothly projects clear review completed status.',
            ].map((item) => (
              <div key={item} className="rounded-[18px] border border-[#E9D5FF] bg-[#FDF8FF] p-4 text-sm leading-6 text-[#475569] dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
                {item}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  )
}

function EntityTrackerSkeleton() {
  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-[28px] border border-[#E9D5FF] bg-white dark:border-white/10 dark:bg-[#1E293B]">
        <div className="px-6 py-5">
          <div className="flex items-start gap-4">
            <SkeletonBlock className="h-12 w-12 rounded-full" />
            <div className="min-w-0 flex-1 space-y-3">
              <SkeletonBlock className="h-5 w-52" />
              <SkeletonBlock className="h-4 w-full max-w-[520px]" />
            </div>
          </div>
        </div>
      </section>
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 5 }).map((_, index) => (
          <SkeletonBlock key={index} className="h-9 w-28 rounded-full" />
        ))}
      </div>
      {Array.from({ length: 2 }).map((_, index) => (
        <Card key={index} className="overflow-hidden rounded-[20px] border-[#D9E6F5] bg-white dark:border-white/10 dark:bg-[#162339]">
          <CardContent className="space-y-4 p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <SkeletonBlock className="h-11 w-11 rounded-xl" />
                <div className="space-y-2">
                  <SkeletonBlock className="h-5 w-52" />
                  <SkeletonBlock className="h-4 w-36" />
                </div>
              </div>
              <SkeletonBlock className="h-10 w-40 rounded-2xl" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
              {Array.from({ length: 6 }).map((__, itemIndex) => (
                <div key={itemIndex} className="rounded-[18px] border border-[#EAF0F6] bg-[#F8FBFF] p-4 dark:border-white/10 dark:bg-white/5">
                  <SkeletonBlock className="h-3 w-24" />
                  <SkeletonBlock className="mt-3 h-4 w-20" />
                </div>
              ))}
            </div>
            <SkeletonBlock className="h-36 w-full rounded-[20px]" />
            <div className="grid gap-4 lg:grid-cols-[1fr_0.95fr]">
              <SkeletonBlock className="h-36 w-full rounded-[20px]" />
              <SkeletonBlock className="h-36 w-full rounded-[20px]" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function EntityStageTracker({ instance }: { instance: DgeInstanceRecord }) {
  const activeIndex = getActiveStepIndex(instance)
  const breakdown = instance.budgets.reduce(
    (acc, budget) => {
      const bucket = getBudgetStageBucket(budget)
      acc[bucket] += 1
      return acc
    },
    { planning: 0, dgeReview: 0, reviewCompleted: 0, allocation: 0, utilization: 0 }
  )

  const total = Math.max(
    1,
    breakdown.planning + breakdown.dgeReview + breakdown.reviewCompleted + breakdown.allocation + breakdown.utilization
  )

  return (
    <div className="space-y-4">
      <div className="rounded-[20px] border border-[#DDEBFF] bg-white px-4 py-4 dark:border-white/10 dark:bg-[#1E293B]">
        <div className="flex w-full flex-nowrap items-center gap-2 overflow-x-auto pb-1">
          {stepStages.map((stage, index) => {
            const StageIcon = stepIcons[stage]
            const active = index <= activeIndex
            return (
              <div key={stage} className="flex min-w-0 flex-1 items-center">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div
                    className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-sm font-bold transition-all duration-200',
                      active
                        ? 'border-[#286CFF] bg-[#286CFF] text-white'
                        : 'border-[#D8E7FF] bg-[#EEF3F8] text-[#94A3B8] dark:border-white/10 dark:bg-white/10 dark:text-slate-400'
                    )}
                  >
                    <StageIcon className="h-4.5 w-4.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[#0F172A] dark:text-white">{stage}</p>
                    <p className="mt-0.5 text-xs text-[#64748B] dark:text-slate-400">{active ? 'Active' : 'Upcoming'}</p>
                  </div>
                </div>
                {index < stepStages.length - 1 ? (
                  <div className="mx-2 h-0.5 min-w-[18px] flex-1 overflow-hidden rounded-full bg-[#EEF3F8] dark:bg-white/10">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{ width: index < activeIndex ? '100%' : '0%', backgroundColor: '#286CFF' }}
                    />
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      </div>

      <div className="rounded-[20px] border border-[#DDEBFF] bg-[#F8FBFF] p-4 dark:border-white/10 dark:bg-white/5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[#0F172A] dark:text-white">Stage Progress</p>
            <p className="mt-1 text-xs text-[#64748B] dark:text-slate-300">Current project status mix for this entity</p>
          </div>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#286CFF] dark:bg-white/10 dark:text-[#BFDBFE]">
            {instance.statusLabel}
          </span>
        </div>

        <div className="h-4 overflow-hidden rounded-full bg-[#EEF3F8] dark:bg-white/10">
          <div className="flex h-full w-full">
            {[
              { label: 'Planning', value: breakdown.planning, color: '#0F766E', textColor: '#FFFFFF' },
              { label: 'DGE Review', value: breakdown.dgeReview, color: '#1D4ED8', textColor: '#FFFFFF' },
              { label: 'Review Completed', value: breakdown.reviewCompleted, color: '#6D28D9', textColor: '#FFFFFF' },
              { label: 'Allocation', value: breakdown.allocation, color: '#C2410C', textColor: '#FFFFFF' },
              { label: 'Utilization', value: breakdown.utilization, color: '#475569', textColor: '#FFFFFF' },
            ].map((segment) => (
              <div
                key={segment.label}
                className="flex h-full items-center justify-center text-[11px] font-semibold shadow-[inset_0_0_0_1px_rgba(255,255,255,0.15)]"
                style={{ width: `${(segment.value / total) * 100}%`, backgroundColor: segment.color, color: segment.textColor }}
              >
                {segment.value > 0 ? segment.value : ''}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
          {[
            { label: 'Planning', value: breakdown.planning, color: '#0F766E', textColor: '#FFFFFF' },
            { label: 'DGE Review', value: breakdown.dgeReview, color: '#1D4ED8', textColor: '#FFFFFF' },
            { label: 'Review Completed', value: breakdown.reviewCompleted, color: '#6D28D9', textColor: '#FFFFFF' },
            { label: 'Allocation', value: breakdown.allocation, color: '#C2410C', textColor: '#FFFFFF' },
            { label: 'Utilization', value: breakdown.utilization, color: '#475569', textColor: '#FFFFFF' },
          ].map((item) => (
            <div key={item.label} className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-[#64748B] dark:text-slate-300">{item.label}</span>
              <span className="font-semibold text-[#0F172A] dark:text-white">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function EntityTracker() {
  const { selectedCycle } = useCycle()
  const [activeStage, setActiveStage] = useState<(typeof stages)[number]>('All Stages')
  const [instances, setInstances] = useState<DgeInstanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      if (!selectedCycle?.id) {
        if (!cancelled) {
          setInstances([])
          setLoading(false)
        }
        return
      }

      setLoading(true)
      setError(null)
      try {
        const portfolio = await getDgePortfolioData(selectedCycle.id)
        if (!cancelled) {
          setInstances(portfolio.instances)
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load entity tracker data.')
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

  const stageCounts = useMemo(
    () =>
      stages.map((stage) => ({
        label: stage,
        count:
          stage === 'All Stages'
            ? instances.length
            : instances.filter((instance) => getInstanceStageFilterLabel(instance.statuscode) === stage).length,
      })),
    [instances]
  )

  const filteredEntities = useMemo(
    () =>
      instances.filter((instance) =>
        activeStage === 'All Stages' ? true : getInstanceStageFilterLabel(instance.statuscode) === activeStage
      ),
    [activeStage, instances]
  )

  return (
    <StrategyPageShell
      eyebrow="ICT - Strategy Team"
      title="Entity Tracker"
      description="Portfolio-level monitoring for every participating government entity across the budgeting cycle."
    >
      <section className="space-y-5">
        <EntityTrackerSummary />
        {error ? (
          <div className="rounded-[18px] border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#B91C1C] dark:border-[#7F1D1D] dark:bg-[#3A1717] dark:text-[#FCA5A5]">
            {error}
          </div>
        ) : null}

        <div className="flex items-center gap-2 flex-wrap">
          {stageCounts.map((stage) => (
            <button
              key={stage.label}
              type="button"
              onClick={() => setActiveStage(stage.label)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                activeStage === stage.label
                  ? 'border-[var(--primary)] bg-[var(--primary)] text-white'
                  : 'border border-[#E2E8F0] bg-white text-[#0F172A] hover:bg-[#F1F5F9] dark:border-white/10 dark:bg-[#1E293B] dark:text-white dark:hover:bg-white/5'
              }`}
            >
              <span>{stage.label}</span>
              <span className={`rounded-full px-1.5 py-0.5 text-xs font-bold ${activeStage === stage.label ? 'bg-white/20' : 'bg-[#F1F5F9] dark:bg-white/10'}`}>
                {stage.count}
              </span>
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {loading ? (
            <EntityTrackerSkeleton />
          ) : filteredEntities.length === 0 ? (
            <Card className="overflow-hidden rounded-[20px] border-[#D9E6F5] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#162339]">
              <CardContent className="p-5 text-sm text-[#64748B] dark:text-slate-300">No entities matched the current stage filter.</CardContent>
            </Card>
          ) : (
            filteredEntities.map((entity) => {
              const planningRisk = entity.budgets.filter((budget) => getBudgetStageBucket(budget) === 'planning').length
              const dgeReviewCount = entity.budgets.filter((budget) => getBudgetStageBucket(budget) === 'dgeReview').length
              const reviewCompletedCount = entity.budgets.filter((budget) => getBudgetStageBucket(budget) === 'reviewCompleted').length
              const allocationCount = entity.budgets.filter((budget) => getBudgetStageBucket(budget) === 'allocation').length
              const utilizationCount = entity.budgets.filter((budget) => getBudgetStageBucket(budget) === 'utilization').length

              return (
                <Card
                  key={entity.id}
                  className="group overflow-hidden rounded-[20px] border-[#D9E6F5] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.06)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_42px_rgba(15,23,42,0.12)] dark:border-white/10 dark:bg-[#162339]"
                >
                  <CardContent className="p-0">
                    <div className="flex w-full items-start justify-between gap-4 px-5 py-4 text-left">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EEF5FF] text-sm font-bold text-[#286CFF] dark:bg-[#286CFF]/15 dark:text-[#BFDBFE]">
                            {entity.entityAbbr || entity.name.slice(0, 3).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="truncate text-lg font-bold text-[#0F172A] dark:text-white">{entity.name}</p>
                              <StrategyPill tone={entity.statusLabel === 'Planning' ? 'blue' : entity.statusLabel === 'Under DGE Review' ? 'violet' : entity.statusLabel === 'Allocation' ? 'amber' : 'teal'}>
                                {entity.statusLabel}
                              </StrategyPill>
                            </div>
                            <p className="text-xs text-[#64748B] dark:text-slate-300">
                              {entity.planningStartDate?.slice(0, 10) || '-'} to {entity.planningEndDate?.slice(0, 10) || '-'}
                            </p>
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="inline-flex items-center gap-2 rounded-2xl bg-[#286CFF] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1F5BFF]"
                      >
                        View Entity Budgets
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="border-t border-[#EEF3F8] px-5 py-5 dark:border-white/10">
                      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
                        {[
                          { label: 'Budget Items', value: entity.budgets.length },
                          { label: 'Requested Budget', value: `AED ${entity.budgets.reduce((sum, budget) => sum + budget.requestedBudget, 0).toLocaleString('en-AE')}` },
                          { label: 'Recommended Budget', value: `AED ${entity.budgets.reduce((sum, budget) => sum + budget.recommendedBudget, 0).toLocaleString('en-AE')}` },
                          { label: 'Allocation Budget', value: `AED ${entity.budgets.reduce((sum, budget) => sum + budget.allocatedBudget, 0).toLocaleString('en-AE')}` },
                          { label: 'Utilization Budget', value: `AED ${entity.budgets.reduce((sum, budget) => sum + budget.utilizedBudget, 0).toLocaleString('en-AE')}` },
                          { label: 'Pending ADGE Clarification', value: entity.budgets.filter((budget) => budget.statuscode === 776140010).length },
                        ].map((item) => (
                          <div key={item.label} className="rounded-[18px] border border-[#EAF0F6] bg-[#F8FBFF] px-4 py-3 dark:border-white/10 dark:bg-white/5">
                            <p className="text-[12px] font-medium text-[#64748B] dark:text-slate-300">{item.label}</p>
                            <p className="mt-2 text-sm font-bold text-[#0F172A] dark:text-white">{item.value}</p>
                          </div>
                        ))}
                      </div>

                      <div className="mt-4">
                        <EntityStageTracker instance={entity} />
                      </div>

                      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_0.95fr]">
                        <div className="rounded-[20px] border border-[#DDEBFF] bg-[#F8FBFF] p-4 dark:border-white/10 dark:bg-[#1E293B]">
                          <div className="flex items-center gap-2">
                            <Clock3 className="h-4.5 w-4.5 text-[#286CFF]" />
                            <p className="text-sm font-semibold text-[#0F172A] dark:text-white">Portfolio Summary</p>
                          </div>
                          <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            {[
                              { label: 'Planning', value: planningRisk },
                              { label: 'DGE Review', value: dgeReviewCount },
                              { label: 'Review Completed', value: reviewCompletedCount },
                              { label: 'Allocation / Utilization', value: allocationCount + utilizationCount },
                            ].map((item) => (
                              <div key={item.label} className="rounded-[18px] border border-[#EAF0F6] bg-white p-3 dark:border-white/10 dark:bg-white/5">
                                <p className="text-[12px] font-medium text-[#64748B] dark:text-slate-300">{item.label}</p>
                                <p className="mt-2 text-xl font-bold text-[#0F172A] dark:text-white">{item.value}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="rounded-[20px] border border-[#E9D5FF] bg-[#FDF8FF] p-4 dark:border-white/10 dark:bg-[#2A123D]">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#A855F7] text-white shadow-[0_12px_24px_rgba(168,85,247,0.24)]">
                              <Sparkles className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-[#0F172A] dark:text-white">AI Portfolio Insights</p>
                              <p className="text-xs text-[#64748B] dark:text-slate-300">{entity.name}</p>
                            </div>
                          </div>
                          <div className="mt-4 space-y-2">
                            {[
                              `${planningRisk} projects are still in planning-side workflow states.`,
                              `${dgeReviewCount} projects remain active in DGE review stages for this entity.`,
                              `${reviewCompletedCount} projects have cleared DGE review and are ready for the next stage.`,
                            ].map((insight) => (
                              <div key={insight} className="flex items-start gap-2 rounded-[16px] border border-[#E9D5FF] bg-white px-3 py-2.5 dark:border-white/10 dark:bg-white/5">
                                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#A855F7]" />
                                <p className="text-sm leading-6 text-[#475569] dark:text-slate-200">{insight}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      </section>
    </StrategyPageShell>
  )
}
