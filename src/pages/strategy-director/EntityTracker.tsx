import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, Building2, CheckCircle2, Rocket, Sparkles, Clock3, Route, CircleCheckBig, Waypoints } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { useCycle } from '@/context/CycleContext'
import { useToast } from '@/context/ToastContext'
import {
  DGE_BUDGET_STATUS,
  DGE_INSTANCE_STATUS,
  getBudgetStageBucket,
  getDgePortfolioData,
  getInstanceStageFilterLabel,
  type DgeInstanceRecord,
} from '@/services/dgePortfolioService'
import { publishDgeReviewedInstance, startInstanceAllocation } from '@/services/dgeWorkflowService'
import { StrategyPageShell, StrategyPill } from '@/pages/strategy-team/StrategyTeamShell'

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
  return <div className={`animate-pulse rounded-2xl bg-[#EAF0F6] dark:bg-white/10 ${className}`} />
}

function canPublishEntity(entity: DgeInstanceRecord) {
  return entity.budgets.length > 0 && entity.budgets.every((budget) => budget.statuscode === DGE_BUDGET_STATUS.reviewCompleted)
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

function EntityProgress({ entity }: { entity: DgeInstanceRecord }) {
  const activeIndex = getActiveStepIndex(entity)
  const breakdown = entity.budgets.reduce(
    (acc, budget) => {
      const bucket = getBudgetStageBucket(budget)
      acc[bucket] += 1
      return acc
    },
    { planning: 0, dgeReview: 0, reviewCompleted: 0, allocation: 0, utilization: 0 }
  )
  const total = Math.max(1, Object.values(breakdown).reduce((sum, value) => sum + value, 0))

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
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-[#0F172A] dark:text-white">Stage Progress</p>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#286CFF] dark:bg-white/10 dark:text-[#BFDBFE]">{entity.statusLabel}</span>
        </div>
        <div className="h-4 overflow-hidden rounded-full bg-[#EEF3F8] dark:bg-white/10">
          <div className="flex h-full w-full">
            {[
              { label: 'Planning', value: breakdown.planning, color: '#0F766E' },
              { label: 'DGE Review', value: breakdown.dgeReview, color: '#1D4ED8' },
              { label: 'Review Completed', value: breakdown.reviewCompleted, color: '#6D28D9' },
              { label: 'Allocation', value: breakdown.allocation, color: '#C2410C' },
              { label: 'Utilization', value: breakdown.utilization, color: '#475569' },
            ].map((segment) => (
              <div
                key={segment.label}
                className="flex h-full items-center justify-center text-[11px] font-semibold text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.15)]"
                style={{ width: `${(segment.value / total) * 100}%`, backgroundColor: segment.color }}
              >
                {segment.value > 0 ? segment.value : ''}
              </div>
            ))}
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-3 text-xs">
          {[
            { label: 'Planning', value: breakdown.planning, color: '#0F766E' },
            { label: 'DGE Review', value: breakdown.dgeReview, color: '#1D4ED8' },
            { label: 'Review Completed', value: breakdown.reviewCompleted, color: '#6D28D9' },
            { label: 'Allocation', value: breakdown.allocation, color: '#C2410C' },
            { label: 'Utilization', value: breakdown.utilization, color: '#475569' },
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

export default function DirectorEntityTracker() {
  const { selectedCycle } = useCycle()
  const { runActionToast } = useToast()
  const [activeStage, setActiveStage] = useState<(typeof stages)[number]>('All Stages')
  const [instances, setInstances] = useState<DgeInstanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = async () => {
    if (!selectedCycle?.id) return
    const portfolio = await getDgePortfolioData(selectedCycle.id)
    setInstances(portfolio.instances)
  }

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      if (!selectedCycle?.id) {
        setLoading(false)
        return
      }
      setLoading(true)
      setError(null)
      try {
        const portfolio = await getDgePortfolioData(selectedCycle.id)
        if (!cancelled) setInstances(portfolio.instances)
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : 'Unable to load entity tracker.')
      } finally {
        if (!cancelled) setLoading(false)
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
    () => instances.filter((instance) => (activeStage === 'All Stages' ? true : getInstanceStageFilterLabel(instance.statuscode) === activeStage)),
    [activeStage, instances]
  )

  const handlePublish = async (entity: DgeInstanceRecord) => {
    await runActionToast(
      async () => {
        await publishDgeReviewedInstance(entity.id)
        await refresh()
      },
      {
        processingTitle: 'Publishing entity review',
        processingDescription: 'Marking this entity as Review Completed by DGE...',
        successTitle: 'Entity published',
        successDescription: 'The entity is ready for allocation start.',
        errorTitle: 'Unable to publish entity',
        minDurationMs: 1200,
      }
    )
  }

  const handleStartAllocation = async (entity: DgeInstanceRecord) => {
    await runActionToast(
      async () => {
        await startInstanceAllocation(entity.id, entity.budgets.map((budget) => budget.id))
        await refresh()
      },
      {
        processingTitle: 'Starting allocation',
        processingDescription: 'Moving the entity and its projects into allocation...',
        successTitle: 'Allocation started',
        successDescription: 'All projects are now Allocation in Progress.',
        errorTitle: 'Unable to start allocation',
        minDurationMs: 1400,
      }
    )
  }

  return (
    <StrategyPageShell
      eyebrow="ICT - Strategy Director"
      title="Entity Tracker"
      description="Director-level entity readiness, publication, and allocation launch controls."
    >
      <section className="space-y-5">
        <section className="overflow-hidden rounded-[28px] border border-[#E9D5FF] bg-white dark:border-white/10 dark:bg-[#1E293B]">
          <div className="flex items-start gap-4 bg-gradient-to-b from-[#FDF8FF] via-white to-white px-6 py-5 dark:from-[#2A123D] dark:via-[#1F1B2E] dark:to-[#1E293B]">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#A855F7] text-white shadow-[0_12px_24px_rgba(168,85,247,0.24)]">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-[16px] font-semibold text-[#0F172A] dark:text-white">AI Director Entity Summary</h2>
              <p className="mt-1 text-sm leading-6 text-[#475569] dark:text-slate-100">Publish is enabled only when every project in the entity has completed DGE review.</p>
            </div>
          </div>
        </section>

        {error ? <div className="rounded-[18px] border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#B91C1C]">{error}</div> : null}

        <div className="flex flex-wrap items-center gap-2">
          {stageCounts.map((stage) => (
            <button
              key={stage.label}
              type="button"
              onClick={() => setActiveStage(stage.label)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                activeStage === stage.label
                  ? 'border-[var(--primary)] bg-[var(--primary)] text-white'
                  : 'border-[#E2E8F0] bg-white text-[#0F172A] hover:bg-[#F1F5F9] dark:border-white/10 dark:bg-[#1E293B] dark:text-white dark:hover:bg-white/5'
              }`}
            >
              {stage.label}
              <span className={`rounded-full px-1.5 py-0.5 text-xs font-bold ${activeStage === stage.label ? 'bg-white/20' : 'bg-[#F1F5F9] dark:bg-white/10'}`}>{stage.count}</span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-4">{Array.from({ length: 3 }).map((_, index) => <SkeletonBlock key={index} className="h-72" />)}</div>
        ) : filteredEntities.length === 0 ? (
          <Card className="rounded-[22px] border-[#D9E6F5] bg-white dark:border-white/10 dark:bg-[#162339]">
            <CardContent className="py-10 text-center text-sm text-[#64748B]">No entities matched this filter.</CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredEntities.map((entity) => {
              const publishReady = canPublishEntity(entity)
              const canStartAllocation = entity.statuscode === DGE_INSTANCE_STATUS.reviewCompletedByDge
              return (
                <Card key={entity.id} className="overflow-hidden rounded-[20px] border-[#D9E6F5] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.06)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_42px_rgba(15,23,42,0.12)] dark:border-white/10 dark:bg-[#162339]">
                  <CardContent className="p-0">
                    <div className="flex flex-col gap-4 px-5 py-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EEF5FF] text-sm font-bold text-[#286CFF] dark:bg-[#286CFF]/15 dark:text-[#BFDBFE]">
                          {entity.entityAbbr || entity.name.slice(0, 3).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate text-lg font-bold text-[#0F172A] dark:text-white">{entity.name}</p>
                            <StrategyPill tone={canStartAllocation ? 'teal' : publishReady ? 'violet' : 'blue'}>{entity.statusLabel}</StrategyPill>
                          </div>
                          <p className="text-xs text-[#64748B] dark:text-slate-300">{entity.budgets.length} projects in cycle</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {publishReady ? (
                          <Button className="rounded-2xl bg-[#286CFF] text-white shadow-none hover:bg-[#0C65F5]" onClick={() => void handlePublish(entity)}>
                            <CheckCircle2 className="h-4 w-4" />Publish
                          </Button>
                        ) : null}
                        {canStartAllocation ? (
                          <Button className="rounded-2xl bg-[#286CFF] text-white shadow-none hover:bg-[#0C65F5]" onClick={() => void handleStartAllocation(entity)}>
                            <Rocket className="h-4 w-4" />Start Allocation
                          </Button>
                        ) : null}
                      </div>
                    </div>
                    <div className="border-t border-[#EEF3F8] px-5 py-5 dark:border-white/10">
                      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                        {[
                          { label: 'Budget Items', value: entity.budgets.length },
                          { label: 'Final Review', value: entity.budgets.filter((item) => item.statuscode === DGE_BUDGET_STATUS.underFinalReview).length },
                          { label: 'Review Completed', value: entity.budgets.filter((item) => item.statuscode === DGE_BUDGET_STATUS.reviewCompleted).length },
                          { label: 'Clarification Pending', value: entity.budgets.filter((item) => item.statuscode === DGE_BUDGET_STATUS.clarificationPending).length },
                          { label: 'Allocation In Progress', value: entity.budgets.filter((item) => item.statuscode === DGE_BUDGET_STATUS.allocationInProgress).length },
                        ].map((item) => (
                          <div key={item.label} className="rounded-[18px] border border-[#EAF0F6] bg-[#F8FBFF] px-4 py-3 dark:border-white/10 dark:bg-white/5">
                            <p className="text-xs font-medium text-[#64748B] dark:text-slate-300">{item.label}</p>
                            <p className="mt-2 text-lg font-bold text-[#0F172A] dark:text-white">{item.value}</p>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4">
                        <EntityProgress entity={entity} />
                      </div>
                      <div className="mt-4 rounded-[20px] border border-[#E9D5FF] bg-[#FDF8FF] p-4 dark:border-white/10 dark:bg-[#2A123D]">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-[#A855F7]" />
                          <p className="text-sm font-semibold text-[#0F172A] dark:text-white">Director Insight</p>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-[#475569] dark:text-slate-200">
                          {publishReady
                            ? 'All projects are review completed. Publish this entity to mark DGE review complete.'
                            : canStartAllocation
                              ? 'This entity is published and can now move into allocation.'
                              : 'Review completion is still in progress. Publish will unlock after all projects complete director review.'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </section>
    </StrategyPageShell>
  )
}
