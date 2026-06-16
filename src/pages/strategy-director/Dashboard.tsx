import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BarChart3, Building2, CheckCircle2, ClipboardCheck, FileText, Rocket, ShieldCheck, Wallet, Workflow } from 'lucide-react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { useCycle } from '@/context/CycleContext'
import {
  DGE_BUDGET_STATUS,
  DGE_INSTANCE_STATUS,
  getDgePortfolioData,
  type DgePortfolioData,
} from '@/services/dgePortfolioService'
import {
  StrategyDashboardEmptyState,
  StrategyMetricCard,
  StrategyPageShell,
  StrategyProgressBar,
  StrategySectionCard,
} from '@/pages/strategy-team/StrategyTeamShell'
import { CurrencyAmount } from '@/components/shared/CurrencyAmount'

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

function SkeletonBlock({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-2xl bg-[#EAF0F6] dark:bg-white/10 ${className}`} />
}

function getDirectorInstanceStageMeta(statuscode: number | null | undefined) {
  switch (statuscode) {
    case DGE_INSTANCE_STATUS.planning:
      return { label: 'Planning', progress: 20, accent: '#008A65' }
    case DGE_INSTANCE_STATUS.underDgeReview:
      return { label: 'Under DGE Review', progress: 40, accent: '#286CFF' }
    case DGE_INSTANCE_STATUS.reviewCompletedByDge:
      return { label: 'Review Completed by DGE', progress: 60, accent: '#7C3AED' }
    case DGE_INSTANCE_STATUS.allocation:
      return { label: 'Allocation', progress: 80, accent: '#D97706' }
    case DGE_INSTANCE_STATUS.utilization:
      return { label: 'Utilization', progress: 100, accent: '#0F9D8A' }
    default:
      return { label: 'Planning', progress: 10, accent: '#008A65' }
  }
}

function EntityPublicationTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const entry = payload[0]
  return (
    <div className="rounded-2xl border border-[#DCE6F1] bg-white/95 px-3 py-2 shadow-[0_18px_45px_rgba(15,23,42,0.14)] backdrop-blur dark:border-white/10 dark:bg-[#10203A]/95">
      <p className="text-xs font-semibold text-[#0F172A] dark:text-white">{entry.name}</p>
      <p className="mt-1 text-xs font-bold" style={{ color: entry.payload.fill }}>
        {entry.value} entities
      </p>
    </div>
  )
}

export default function StrategyDirectorDashboard() {
  const { selectedCycle } = useCycle()
  const [data, setData] = useState<DgePortfolioData>({ instances: [], budgets: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
        if (!cancelled) setData(portfolio)
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : 'Unable to load director dashboard.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [selectedCycle?.id])

  const stats = useMemo(() => {
    const budgets = data.budgets
    const finalReview = budgets.filter((item) => item.statuscode === DGE_BUDGET_STATUS.underFinalReview)
    const completed = budgets.filter((item) => item.statuscode === DGE_BUDGET_STATUS.reviewCompleted)
    const clarification = budgets.filter((item) => item.statuscode === DGE_BUDGET_STATUS.clarificationPending)
    const qualityCheck = budgets.filter((item) => item.statuscode === DGE_BUDGET_STATUS.underQualityCheck)
    const allocation = budgets.filter(
      (item) =>
        item.statuscode === DGE_BUDGET_STATUS.allocationInProgress ||
        item.statuscode === DGE_BUDGET_STATUS.allocationInReview ||
        item.statuscode === DGE_BUDGET_STATUS.allocationCompleted
    )
    const utilization = budgets.filter(
      (item) =>
        item.statuscode === DGE_BUDGET_STATUS.utilizationInProgress ||
        item.statuscode === DGE_BUDGET_STATUS.utilizationCompleted
    )
    const publishReadyEntities = data.instances.filter(
      (instance) => instance.budgets.length > 0 && instance.budgets.every((budget) => budget.statuscode === DGE_BUDGET_STATUS.reviewCompleted)
    )
    const allocationReadyEntities = data.instances.filter((instance) => instance.statuscode === DGE_INSTANCE_STATUS.reviewCompletedByDge)
    const publishedEntities = data.instances.filter((instance) => instance.statuscode === DGE_INSTANCE_STATUS.reviewCompletedByDge)
    const allocationStartedEntities = data.instances.filter(
      (instance) => instance.statuscode === DGE_INSTANCE_STATUS.allocation || instance.statuscode === DGE_INSTANCE_STATUS.utilization
    )
    return {
      finalReview,
      completed,
      clarification,
      qualityCheck,
      allocation,
      utilization,
      publishReadyEntities,
      allocationReadyEntities,
      publishedEntities,
      allocationStartedEntities,
      totalRequested: budgets.reduce((sum, item) => sum + item.requestedBudget, 0),
      totalRecommended: budgets.reduce((sum, item) => sum + item.recommendedBudget, 0),
    }
  }, [data])

  const entityStageRows = useMemo(() => {
    return data.instances.map((instance) => {
      const stage = getDirectorInstanceStageMeta(instance.statuscode)
      const completed = instance.budgets.filter((budget) => budget.statuscode === DGE_BUDGET_STATUS.reviewCompleted).length
      const hasCompletedDgeReviewStage =
        instance.statuscode === DGE_INSTANCE_STATUS.reviewCompletedByDge ||
        instance.statuscode === DGE_INSTANCE_STATUS.allocation ||
        instance.statuscode === DGE_INSTANCE_STATUS.utilization
      const detail = hasCompletedDgeReviewStage
        ? `${instance.budgets.length} projects, DGE review completed`
        : `${instance.budgets.length} projects, ${completed} review completed`

      return { instance, stage: stage.label, detail, progress: stage.progress, accent: stage.accent }
    })
  }, [data.instances])

  const publicationSeries = useMemo(() => {
    const publishReadyOnly = Math.max(stats.publishReadyEntities.length - stats.publishedEntities.length, 0)
    const publishedOnly = Math.max(stats.publishedEntities.length - stats.allocationStartedEntities.length, 0)
    const allocationStarted = stats.allocationStartedEntities.length
    const remaining = Math.max(data.instances.length - publishReadyOnly - publishedOnly - allocationStarted, 0)

    return [
      { name: 'Publish Ready', value: publishReadyOnly, fill: '#286CFF' },
      { name: 'Published', value: publishedOnly, fill: '#0F766E' },
      { name: 'Allocation Started', value: allocationStarted, fill: '#D97706' },
      { name: 'In Progress', value: remaining, fill: '#64748B' },
    ].filter((item) => item.value > 0)
  }, [data.instances.length, stats.allocationStartedEntities.length, stats.publishReadyEntities.length, stats.publishedEntities.length])

  return (
    <StrategyPageShell
      eyebrow="ICT - Strategy Director"
      title="Director Dashboard"
      description="Final DGE review, entity publication readiness, and allocation launch oversight across the selected cycle."
    >
      {error ? (
        <div className="rounded-[18px] border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#B91C1C] dark:border-[#7F1D1D] dark:bg-[#3A1717] dark:text-[#FCA5A5]">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="space-y-5">
          <SkeletonBlock className="h-28" />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => <SkeletonBlock key={index} className="h-36" />)}
          </div>
        </div>
      ) : (
        <section className="space-y-5">
          <div className="overflow-hidden rounded-[24px] border border-[#D9E6F5] bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#162339]">
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EEF5FF] text-[#286CFF] dark:bg-[#286CFF]/15 dark:text-[#BFDBFE]">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#64748B] dark:text-slate-300">Budget Cycle</p>
                  <p className="mt-1 text-sm font-bold text-[#0F172A] dark:text-white">{selectedCycle?.name || 'Current Cycle'}</p>
                </div>
              </div>
              <div className="hidden h-10 w-px bg-[#DCE8F6] lg:block dark:bg-white/10" />
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F5EEFF] text-[#A855F7] dark:bg-[#A855F7]/15 dark:text-[#E9D5FF]">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#64748B] dark:text-slate-300">Director Readiness</p>
                  <p className="mt-1 text-sm font-bold text-[#0F172A] dark:text-white">
                    {stats.finalReview.length} final review, {stats.completed.length} completed, {stats.publishReadyEntities.length} publish-ready entities
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StrategyMetricCard title="Under Final Review" value={stats.finalReview.length} note="Projects awaiting director decision" accent="#286CFF" icon={<ClipboardCheck className="h-5 w-5" />} />
            <StrategyMetricCard title="Review Completed" value={stats.completed.length} note="Projects ready for entity publication" accent="#10B981" icon={<CheckCircle2 className="h-5 w-5" />} />
            <StrategyMetricCard title="Clarification Holds" value={stats.clarification.length} note="Internal DGE clarifications in motion" accent="#F59E0B" icon={<Workflow className="h-5 w-5" />} />
            <StrategyMetricCard title="Publish-Ready Entities" value={stats.publishReadyEntities.length} note="All projects completed by DGE review" accent="#7C3AED" icon={<Building2 className="h-5 w-5" />} />
          </div>

          <div className="grid items-stretch gap-5 lg:grid-cols-2">
            <StrategySectionCard
              title="Final Review Queue"
              description="Director decision lane for projects that cleared quality check."
              headingIcon={<ShieldCheck className="h-5 w-5 text-[#286CFF]" />}
              rightAction={<Link to="/strategy-director/reviewer-queue" className="text-sm font-semibold text-[#286CFF]">Open Queue</Link>}
            >
              <div className="flex flex-1 flex-col justify-center space-y-4">
                {stats.finalReview.slice(0, 4).map((item) => (
                  <div key={item.id} className="rounded-[18px] border border-[#EAF0F6] bg-[#F8FBFF] px-4 py-3 dark:border-white/10 dark:bg-white/5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[#0F172A] dark:text-white">{item.name}</p>
                        <p className="mt-1 text-xs text-[#64748B] dark:text-slate-300">{item.entityName || item.instanceName || 'Unknown entity'}</p>
                      </div>
                      <CurrencyAmount amount={item.recommendedBudget || item.requestedBudget} className="shrink-0 text-sm font-bold text-[#0F172A] dark:text-white" iconSize={12} />
                    </div>
                  </div>
                ))}
                {stats.finalReview.length === 0 ? (
                  <StrategyDashboardEmptyState
                    icon={<ShieldCheck className="h-6 w-6" />}
                    title="Final Review Queue Is Clear"
                    description="No projects are waiting for director review right now. New items will appear here after Strategy Team routes quality-checked budgets forward."
                  />
                ) : null}
              </div>
            </StrategySectionCard>

            <StrategySectionCard
              title="Budget Portfolio"
              description="Requested, recommended, allocated, and utilized budget totals across every entity in the selected cycle."
              headingIcon={<Wallet className="h-5 w-5 text-[#286CFF]" />}
            >
              <div className="flex flex-1 flex-col justify-center space-y-5">
                <BudgetPortfolioGrid budgets={data.budgets} />
                <StrategyProgressBar
                  value={stats.totalRequested > 0 ? Math.min(100, Math.round((stats.totalRecommended / stats.totalRequested) * 100)) : 0}
                  accent="#286CFF"
                />
              </div>
            </StrategySectionCard>
          </div>

          <div className="grid items-stretch gap-5 lg:grid-cols-2">
            <StrategySectionCard
              title="Entity Progress"
              description="Current stage for every entity in the selected cycle."
              headingIcon={<Building2 className="h-5 w-5 text-[#286CFF]" />}
              rightAction={<Link to="/strategy-director/entity-tracker" className="text-sm font-semibold text-[#286CFF]">Open Entity Tracker</Link>}
            >
              <div className="flex flex-1 flex-col justify-start space-y-3">
                {entityStageRows.slice(0, 5).map(({ instance, stage, detail, progress, accent }) => (
                  <div key={instance.id} className="rounded-[18px] border border-[#EAF0F6] bg-[#F8FBFF] px-4 py-3 dark:border-white/10 dark:bg-white/5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[#0F172A] dark:text-white">{instance.entityName || instance.name}</p>
                        <p className="mt-1 text-xs text-[#64748B] dark:text-slate-300">{detail}</p>
                      </div>
                      <span className="shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold" style={{ backgroundColor: `${accent}14`, color: accent }}>
                        {stage}
                      </span>
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
                    description="Entity stages will appear once the selected cycle has participating instances and budget activity."
                  />
                ) : null}
              </div>
            </StrategySectionCard>

            <StrategySectionCard
              title="Entity Publication And Allocation"
              description="Entity-level readiness for publishing DGE review and starting allocation."
              headingIcon={<Rocket className="h-5 w-5 text-[#286CFF]" />}
              rightAction={<Link to="/strategy-director/entity-tracker" className="text-sm font-semibold text-[#286CFF]">Open Entity Tracker</Link>}
            >
              <div className="flex flex-1 flex-col justify-center space-y-5">
                <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
                  <div className="relative mx-auto h-[210px] w-full max-w-[260px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={publicationSeries.length ? publicationSeries : [{ name: 'No Entities', value: 1, fill: '#CBD5E1' }]}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={58}
                          outerRadius={84}
                          paddingAngle={3}
                          strokeWidth={0}
                        >
                          {(publicationSeries.length ? publicationSeries : [{ name: 'No Entities', value: 1, fill: '#CBD5E1' }]).map((entry) => (
                            <Cell key={entry.name} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip content={<EntityPublicationTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-xs font-semibold tracking-[0.06em] text-[#64748B] dark:text-slate-300">Entities</span>
                      <span className="mt-1 text-3xl font-bold text-[#0F172A] dark:text-white">{data.instances.length}</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {[
                      { label: 'Publish Ready', value: stats.publishReadyEntities.length, fill: '#286CFF' },
                      { label: 'Ready to Start Allocation', value: stats.allocationReadyEntities.length, fill: '#5B87FF' },
                      { label: 'Published', value: stats.publishedEntities.length, fill: '#0F766E' },
                      { label: 'Allocation Started', value: stats.allocationStartedEntities.length, fill: '#D97706' },
                    ].map((item) => {
                      const percent = data.instances.length ? Math.round((item.value / data.instances.length) * 100) : 0
                      return (
                        <div key={item.label}>
                          <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                            <div className="flex min-w-0 items-center gap-2">
                              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.fill }} />
                              <span className="truncate font-semibold text-[#0F172A] dark:text-white">{item.label}</span>
                            </div>
                            <span className="shrink-0 text-[#64748B] dark:text-slate-300">{item.value}</span>
                          </div>
                          <StrategyProgressBar value={percent} accent={item.fill} />
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="space-y-3">
                {data.instances.slice(0, 4).map((instance) => {
                  const stage = getDirectorInstanceStageMeta(instance.statuscode)
                  return (
                    <div key={instance.id}>
                      <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                        <span className="font-semibold text-[#0F172A] dark:text-white">{instance.entityName || instance.name}</span>
                        <span className="text-[#64748B] dark:text-slate-300">{stage.label}</span>
                      </div>
                      <StrategyProgressBar value={stage.progress} accent={stage.accent} />
                    </div>
                  )
                })}
                </div>
              </div>
            </StrategySectionCard>
          </div>

          <div className="grid items-stretch gap-5 lg:grid-cols-2">
            <StrategySectionCard
              title="Governance Flow Monitor"
              description="Current volume in quality check, final review, allocation, utilization, and clarification lanes."
              headingIcon={<BarChart3 className="h-5 w-5 text-[#286CFF]" />}
            >
              <div className="flex flex-1 flex-col justify-center space-y-4">
                {[
                  { label: 'Quality Check', value: stats.qualityCheck.length, accent: '#10B981' },
                  { label: 'Final Review', value: stats.finalReview.length, accent: '#286CFF' },
                  { label: 'Clarification Pending', value: stats.clarification.length, accent: '#F59E0B' },
                  { label: 'Allocation', value: stats.allocation.length, accent: '#7C3AED' },
                  { label: 'Utilization', value: stats.utilization.length, accent: '#1E3A8A' },
                ].map((item) => {
                  const share = data.budgets.length ? Math.round((item.value / data.budgets.length) * 100) : 0
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
            </StrategySectionCard>

            <StrategySectionCard
              title="Clarification Monitor"
              description="Director-visible clarification holds across final review, SME follow-up, and strategy follow-up."
              headingIcon={<Workflow className="h-5 w-5 text-[#286CFF]" />}
              rightAction={<Link to="/strategy-director/reviewer-queue?tab=clarification" className="text-sm font-semibold text-[#286CFF]">Open Holds</Link>}
            >
              <div className="flex flex-1 flex-col justify-center space-y-3">
                {stats.clarification.slice(0, 4).map((item) => (
                  <div key={item.id} className="rounded-[18px] border border-[#EAF0F6] bg-[#F8FBFF] px-4 py-3 dark:border-white/10 dark:bg-white/5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[#0F172A] dark:text-white">{item.name}</p>
                        <p className="mt-1 text-xs text-[#64748B] dark:text-slate-300">{item.entityName || item.instanceName || 'Unknown entity'}</p>
                      </div>
                      <span className="shrink-0 rounded-full bg-[#FFF7E6] px-2.5 py-1 text-xs font-semibold text-[#D97706] dark:bg-[#D97706]/15 dark:text-[#FCD34D]">
                        Hold
                      </span>
                    </div>
                  </div>
                ))}
                {stats.clarification.length === 0 ? (
                  <StrategyDashboardEmptyState
                    icon={<Workflow className="h-6 w-6" />}
                    title="No Clarification Holds"
                    description="There are no active director-level clarification holds. If Strategy or SME follow-up is requested, it will surface here."
                  />
                ) : null}
              </div>
            </StrategySectionCard>
          </div>
        </section>
      )}
    </StrategyPageShell>
  )
}
