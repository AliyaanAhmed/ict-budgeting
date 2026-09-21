import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, CheckCircle2, Clock3, FolderSearch, MessageSquareMore, Users, Workflow } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCycle } from '@/context/CycleContext'
import {
  DGE_BUDGET_STATUS,
  getDgePortfolioData,
  getSmeTrackerGroups,
  type DgePortfolioData,
} from '@/services/dgePortfolioService'
import {
  StrategyDashboardEmptyState,
  StrategyMetricCard,
  StrategyPageShell,
  StrategyPill,
  StrategyProgressBar,
  StrategySectionCard,
} from '@/pages/strategy-team/StrategyTeamShell'

function SkeletonBlock({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-2xl bg-[#EAF0F6] dark:bg-white/10 ${className}`} />
}

export default function StrategyDirectorSMETracker() {
  const { selectedCycle } = useCycle()
  const [data, setData] = useState<DgePortfolioData>({ instances: [], budgets: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      if (!selectedCycle?.id) {
        setData({ instances: [], budgets: [] })
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)
      try {
        const portfolio = await getDgePortfolioData(selectedCycle.id)
        if (!cancelled) setData(portfolio)
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : 'Unable to load SME tracker.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [selectedCycle?.id])

  const groups = useMemo(() => getSmeTrackerGroups(data), [data])
  const metrics = useMemo(() => {
    const assigned = groups.reduce((sum, group) => sum + group.budgets.length, 0)
    const inReview = groups.reduce(
      (sum, group) => sum + group.budgets.filter((budget) => budget.statuscode === DGE_BUDGET_STATUS.underSmeReview).length,
      0
    )
    const completedStatuses: number[] = [
      DGE_BUDGET_STATUS.underQualityCheck,
      DGE_BUDGET_STATUS.underFinalReview,
      DGE_BUDGET_STATUS.reviewCompleted,
    ]
    const completed = groups.reduce(
      (sum, group) =>
        sum +
        group.budgets.filter((budget) => completedStatuses.includes(budget.statuscode)).length,
      0
    )
    const clarification = groups.reduce(
      (sum, group) => sum + group.budgets.filter((budget) => budget.statuscode === DGE_BUDGET_STATUS.clarificationPending).length,
      0
    )
    const changeRequests = groups.reduce(
      (sum, group) => sum + group.budgets.filter((budget) => budget.statuscode === DGE_BUDGET_STATUS.strategicPriorityChangeUnderReview).length,
      0
    )

    return {
      assigned,
      inReview,
      completed,
      clarification,
      changeRequests,
      completion: assigned ? Math.round((completed / assigned) * 100) : 0,
    }
  }, [groups])

  return (
    <StrategyPageShell
      eyebrow="ICT - Strategy Director"
      title="SME Tracker"
      description="Director-level view of SME progress, review throughput, clarification pressure, and strategic routing exceptions."
    >
      {error ? (
        <div className="rounded-[18px] border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#B91C1C] dark:border-[#7F1D1D] dark:bg-[#3A1717] dark:text-[#FCA5A5]">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => <SkeletonBlock key={index} className="h-36" />)}
          </div>
          <SkeletonBlock className="h-[520px]" />
        </div>
      ) : (
        <section className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StrategyMetricCard title="Assigned Reviews" value={metrics.assigned} note="Projects routed to SME teams" accent="#286CFF" icon={<Users className="h-5 w-5" />} />
            <StrategyMetricCard title="Under SME Review" value={metrics.inReview} note="Currently with SME reviewers" accent="#7C3AED" icon={<Clock3 className="h-5 w-5" />} />
            <StrategyMetricCard title="SME Completed" value={metrics.completed} note="Moved beyond SME review" accent="#10B981" icon={<CheckCircle2 className="h-5 w-5" />} />
            <StrategyMetricCard title="Clarification / Change" value={metrics.clarification + metrics.changeRequests} note="Blocked or routing exception" accent="#F97316" icon={<MessageSquareMore className="h-5 w-5" />} />
          </div>

          <StrategySectionCard
            title="SME Progress"
            description="Progress by SME track with current workload, completed reviews, clarification pressure, and routing changes."
            headingIcon={<Workflow className="h-5 w-5 text-[#286CFF]" />}
          >
            <div className="mb-5 rounded-[22px] border border-[#DCE8F6] bg-[#F8FBFF] p-4 dark:border-white/10 dark:bg-white/5">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-semibold text-[#0F172A] dark:text-white">Overall SME completion</span>
                <span className="font-bold text-[#286CFF] dark:text-[#BFDBFE]">{metrics.completion}%</span>
              </div>
              <StrategyProgressBar value={metrics.completion} accent="#286CFF" />
            </div>

            {groups.length === 0 ? (
              <StrategyDashboardEmptyState
                icon={<FolderSearch className="h-6 w-6" />}
                title="No SME Work Found"
                description="No SME assignments or SME-routed projects were found for the selected cycle."
              />
            ) : (
              <div className="grid gap-4 xl:grid-cols-2">
                {groups.map((group) => {
                  const assigned = group.budgets.length
                  const completedStatuses: number[] = [
                    DGE_BUDGET_STATUS.underQualityCheck,
                    DGE_BUDGET_STATUS.underFinalReview,
                    DGE_BUDGET_STATUS.reviewCompleted,
                  ]
                  const completed = group.budgets.filter((budget) => completedStatuses.includes(budget.statuscode)).length
                  const inReview = group.budgets.filter((budget) => budget.statuscode === DGE_BUDGET_STATUS.underSmeReview).length
                  const clarification = group.budgets.filter((budget) => budget.statuscode === DGE_BUDGET_STATUS.clarificationPending).length
                  const progress = assigned ? Math.round((completed / assigned) * 100) : 0

                  return (
                    <div key={group.assignment.strategicPriorityId} className="rounded-[22px] border border-[#DCE8F6] bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.05)] transition-all hover:-translate-y-0.5 hover:border-[#BFD4FF] dark:border-white/10 dark:bg-[#18263F]">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-base font-bold text-[#0F172A] dark:text-white">{group.assignment.strategicPriorityName}</p>
                          <p className="mt-1 text-sm text-[#64748B] dark:text-slate-300">{group.assignment.teamName}</p>
                        </div>
                        <StrategyPill tone={progress >= 70 ? 'teal' : progress > 0 ? 'blue' : 'amber'}>{progress}% complete</StrategyPill>
                      </div>
                      <div className="mt-4">
                        <StrategyProgressBar value={progress} accent={progress >= 70 ? '#10B981' : '#286CFF'} />
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                        {[
                          ['Assigned', assigned],
                          ['In Review', inReview],
                          ['Completed', completed],
                          ['Clarification', clarification],
                        ].map(([label, value]) => (
                          <div key={label} className="rounded-[16px] border border-[#EAF0F6] bg-[#F8FBFF] p-3 dark:border-white/10 dark:bg-white/5">
                            <p className="text-xs font-semibold text-[#64748B] dark:text-slate-300">{label}</p>
                            <p className="mt-1 text-xl font-bold text-[#0F172A] dark:text-white">{value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            <div className="mt-5 flex justify-end">
              <Button asChild className="rounded-2xl bg-[#286CFF] text-white hover:bg-[#0C65F5]">
                <Link to="/strategy-director/reviewer-queue">
                  Open Director Queue
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </StrategySectionCard>
        </section>
      )}
    </StrategyPageShell>
  )
}
