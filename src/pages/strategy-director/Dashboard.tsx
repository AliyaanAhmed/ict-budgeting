import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BarChart3, Building2, CheckCircle2, ClipboardCheck, FileText, ShieldCheck, Workflow } from 'lucide-react'
import { useCycle } from '@/context/CycleContext'
import {
  DGE_BUDGET_STATUS,
  getDgePortfolioData,
  type DgePortfolioData,
} from '@/services/dgePortfolioService'
import {
  StrategyMetricCard,
  StrategyPageShell,
  StrategyProgressBar,
  StrategySectionCard,
} from '@/pages/strategy-team/StrategyTeamShell'
import { CurrencyAmount } from '@/components/shared/CurrencyAmount'

function SkeletonBlock({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-2xl bg-[#EAF0F6] dark:bg-white/10 ${className}`} />
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
    const publishReadyEntities = data.instances.filter(
      (instance) => instance.budgets.length > 0 && instance.budgets.every((budget) => budget.statuscode === DGE_BUDGET_STATUS.reviewCompleted)
    )
    return {
      finalReview,
      completed,
      clarification,
      publishReadyEntities,
      totalRequested: budgets.reduce((sum, item) => sum + item.requestedBudget, 0),
      totalRecommended: budgets.reduce((sum, item) => sum + item.recommendedBudget, 0),
    }
  }, [data])

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
                {stats.finalReview.length === 0 ? <p className="text-sm text-[#64748B] dark:text-slate-300">No projects are currently waiting for director review.</p> : null}
              </div>
            </StrategySectionCard>

            <StrategySectionCard
              title="Budget Recommendation View"
              description="Requested versus recommended posture across the director portfolio."
              headingIcon={<BarChart3 className="h-5 w-5 text-[#286CFF]" />}
            >
              <div className="flex flex-1 flex-col justify-center space-y-5">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[18px] border border-[#EAF0F6] bg-[#F8FBFF] p-4 dark:border-white/10 dark:bg-white/5">
                    <p className="text-sm font-semibold text-[#64748B] dark:text-slate-300">Requested</p>
                    <CurrencyAmount amount={stats.totalRequested} className="mt-3 text-2xl font-bold text-[#0F172A] dark:text-white" iconSize={18} />
                  </div>
                  <div className="rounded-[18px] border border-[#EAF0F6] bg-[#F8FBFF] p-4 dark:border-white/10 dark:bg-white/5">
                    <p className="text-sm font-semibold text-[#64748B] dark:text-slate-300">Recommended</p>
                    <CurrencyAmount amount={stats.totalRecommended} className="mt-3 text-2xl font-bold text-[#0F172A] dark:text-white" iconSize={18} />
                  </div>
                </div>
                <StrategyProgressBar
                  value={stats.totalRequested > 0 ? Math.min(100, Math.round((stats.totalRecommended / stats.totalRequested) * 100)) : 0}
                  accent="#286CFF"
                />
              </div>
            </StrategySectionCard>
          </div>
        </section>
      )}
    </StrategyPageShell>
  )
}
