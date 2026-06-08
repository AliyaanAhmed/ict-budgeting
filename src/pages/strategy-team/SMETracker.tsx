import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, CircleAlert, Clock3, Sparkles, TriangleAlert, Users, Workflow } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { useCycle } from '@/context/CycleContext'
import { StrategyPageShell, StrategyPill, StrategyProgressBar } from './StrategyTeamShell'
import { DGE_BUDGET_STATUS, getDgePortfolioData, getSmeTrackerGroups } from '@/services/dgePortfolioService'
import { cn } from '@/lib/utils'

type FilterKey = 'Total SME Teams' | 'Teams On Track' | 'Teams Behind' | 'Overdue Reviews' | 'Clarification Blocked' | 'High-Risk Workloads'

function SkeletonBlock({ className }: { className: string }) {
  return <div className={cn('animate-pulse rounded-2xl bg-[#EAF0F6] dark:bg-white/10', className)} />
}

function CircularMetric({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: string
}) {
  const pct = Math.max(8, Math.min(100, value === 0 ? 8 : value))
  return (
    <div className="rounded-[18px] border border-[#EAF0F6] bg-white p-3 dark:border-white/10 dark:bg-white/5">
      <div className="flex items-center gap-3">
        <div
          className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full"
          style={{ background: `conic-gradient(${tone} ${pct}%, #EEF3F8 ${pct}% 100%)` }}
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-xs font-bold text-[#0F172A] dark:bg-[#1E293B] dark:text-white">
            {value}
          </div>
        </div>
        <div className="min-w-0">
          <p className="text-[12px] font-medium text-[#0F172A] dark:text-white">{label}</p>
        </div>
      </div>
    </div>
  )
}

function AiSmeMonitor() {
  const sections = [
    {
      title: 'Lagging Teams',
      icon: Users,
      items: [
        ['Smart City', 'Single reviewer capacity issue'],
        ['Cloud Infrastructure', '4 wrongly routed projects'],
        ['Digital Services', '18 clarification-pending items'],
      ],
    },
    {
      title: 'Likely Miss Deadline',
      icon: Clock3,
      items: [
        ['Smart City', '2 days behind at current pace'],
        ['Digital Services', 'At risk if clarifications not resolved'],
      ],
    },
    {
      title: 'Clarification-Driven Delays',
      icon: TriangleAlert,
      items: [
        ['Digital Services (18 pending)', 'ADGE response delays'],
        ['Cloud Infrastructure (12 pending)', 'Mixed ADGE/DGE delays'],
      ],
    },
    {
      title: 'Wrong Routing Impact',
      icon: Workflow,
      items: [
        ['Cloud Infrastructure (4 projects)', 'Should be Cybersecurity'],
        ['Data & Analytics (3 projects)', 'Should be Cloud Infrastructure'],
      ],
    },
    {
      title: 'Quality Risk Teams',
      icon: CircleAlert,
      items: [
        ['Digital Services', '9 weak evidence reviews'],
        ['Healthcare Digitization', '5 weak evidence, 1 inconsistent'],
      ],
    },
    {
      title: 'Suggested Actions',
      icon: ArrowRight,
      items: [
        ['Action', 'Assign additional reviewer to Smart City'],
        ['Action', 'Reassign 4 misrouted projects from Cloud Infrastructure'],
        ['Action', 'Escalate 6 overdue clarifications in Digital Services'],
        ['Action', 'Send reminder to ADDA and DMT ADGEs'],
      ],
    },
  ] as const

  return (
    <Card className="overflow-hidden rounded-[24px] border-[#E9D5FF] bg-white shadow-[0_12px_30px_rgba(168,85,247,0.08)] dark:border-white/10 dark:bg-[#1E293B]">
      <div className="bg-gradient-to-b from-[#FDF8FF] to-white px-5 py-4 dark:from-[#2A123D] dark:to-[#1E293B]">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#A855F7] text-white shadow-[0_12px_24px_rgba(168,85,247,0.24)]">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-[16px] font-semibold text-[#0F172A] dark:text-white">AI SME Monitor</h2>
              <span className="rounded-full bg-[#F5EEFF] px-2.5 py-1 text-xs font-semibold text-[#A855F7] dark:bg-[#A855F7]/15 dark:text-[#E9D5FF]">
                Governance View
              </span>
            </div>
            <p className="mt-1 text-sm leading-6 text-[#475569] dark:text-slate-300">
              Portfolio-level signals across teams, delay pressure, routing risk, and likely follow-up actions.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4 p-5">
        {sections.map((section) => {
          const Icon = section.icon
          return (
            <div key={section.title} className="rounded-[20px] border border-[#E9D5FF] bg-white p-4 dark:border-white/10 dark:bg-white/5">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F5EEFF] text-[#A855F7] dark:bg-[#A855F7]/15 dark:text-[#E9D5FF]">
                  <Icon className="h-4 w-4" />
                </div>
                <p className="text-sm font-semibold text-[#0F172A] dark:text-white">{section.title}</p>
              </div>
              <div className="mt-3 space-y-3">
                {section.items.map(([label, detail]) => (
                  <div key={`${section.title}-${label}-${detail}`} className="rounded-[14px] bg-white dark:bg-transparent">
                    <p className="text-sm font-semibold text-[#0F172A] dark:text-white">{label}</p>
                    <p className="mt-1 text-sm leading-6 text-[#64748B] dark:text-slate-300">{detail}</p>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

function SmeTrackerSkeleton() {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <SkeletonBlock key={index} className="h-9 w-36 rounded-full" />
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,2.2fr)_minmax(300px,0.95fr)]">
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, index) => (
            <Card key={index} className="overflow-hidden rounded-[22px] border-[#D9E6F5] bg-white dark:border-white/10 dark:bg-[#162339]">
              <CardContent className="space-y-4 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <SkeletonBlock className="h-10 w-10 rounded-xl" />
                    <div className="space-y-2">
                      <SkeletonBlock className="h-5 w-56" />
                      <SkeletonBlock className="h-4 w-36" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <SkeletonBlock className="h-8 w-20 rounded-full" />
                    <SkeletonBlock className="h-8 w-12 rounded-full" />
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {Array.from({ length: 6 }).map((__, metricIndex) => (
                    <SkeletonBlock key={metricIndex} className="h-18 w-full rounded-[18px]" />
                  ))}
                </div>
                <SkeletonBlock className="h-36 w-full rounded-[20px]" />
              </CardContent>
            </Card>
          ))}
        </div>
        <SkeletonBlock className="h-[720px] w-full rounded-[24px]" />
      </div>
    </div>
  )
}

export default function SMETracker() {
  const { selectedCycle } = useCycle()
  const [activeFilter, setActiveFilter] = useState<FilterKey>('Total SME Teams')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [groups, setGroups] = useState<ReturnType<typeof getSmeTrackerGroups>>([])

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      if (!selectedCycle?.id) {
        if (!cancelled) {
          setGroups([])
          setLoading(false)
        }
        return
      }

      setLoading(true)
      setError(null)

      try {
        const portfolio = await getDgePortfolioData(selectedCycle.id)
        if (!cancelled) {
          setGroups(getSmeTrackerGroups(portfolio))
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load SME tracker data.')
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

  const filters = useMemo(() => {
    const overdueReviews = groups.reduce(
      (sum, group) =>
        sum +
        group.budgets.filter((budget) => budget.statuscode === DGE_BUDGET_STATUS.clarificationPending).length,
      0
    )
    const clarificationBlocked = groups.reduce(
      (sum, group) =>
        sum +
        group.budgets.filter((budget) => budget.statuscode === DGE_BUDGET_STATUS.clarificationPending).length,
      0
    )
    const teamsBehind = groups.filter(
      (group) =>
        group.budgets.filter((budget) => budget.statuscode === DGE_BUDGET_STATUS.underSmeReview).length >
        group.budgets.filter((budget) => budget.statuscode === DGE_BUDGET_STATUS.underQualityCheck).length
    ).length
    const teamsOnTrack = Math.max(0, groups.length - teamsBehind)

    return [
      { label: 'Total SME Teams' as const, value: groups.length },
      { label: 'Teams On Track' as const, value: teamsOnTrack },
      { label: 'Teams Behind' as const, value: teamsBehind },
      { label: 'Overdue Reviews' as const, value: overdueReviews },
      { label: 'Clarification Blocked' as const, value: clarificationBlocked },
      { label: 'High-Risk Workloads' as const, value: groups.filter((group) => group.budgets.length > 5).length },
    ]
  }, [groups])

  return (
    <StrategyPageShell
      eyebrow="ICT - Strategy Team"
      title="SME Tracker"
      description="Monitor SME review activity organized by strategic priority. Spot bottlenecks, workload concerns, and review momentum."
    >
      <section className="space-y-5">
        {error ? (
          <div className="rounded-[18px] border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#B91C1C] dark:border-[#7F1D1D] dark:bg-[#3A1717] dark:text-[#FCA5A5]">
            {error}
          </div>
        ) : null}

        <div className="flex flex-wrap gap-3">
          {filters.map((filter) => {
            const active = activeFilter === filter.label
            return (
              <button
                key={filter.label}
                type="button"
                onClick={() => setActiveFilter(filter.label)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? 'border-[var(--primary)] bg-[var(--primary)] text-white'
                    : 'border border-[#E2E8F0] bg-white text-[#0F172A] hover:bg-[#F1F5F9] dark:border-white/10 dark:bg-[#1E293B] dark:text-white dark:hover:bg-white/5'
                }`}
              >
                <span className="text-sm font-medium">{filter.label}</span>
                <span className={`rounded-full px-1.5 py-0.5 text-xs font-bold ${active ? 'bg-white/20' : 'bg-[#F1F5F9] dark:bg-white/10'}`}>
                  {filter.value}
                </span>
              </button>
            )
          })}
        </div>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,2.2fr)_minmax(300px,0.95fr)]">
          <div className="space-y-4">
            {loading ? (
              <SmeTrackerSkeleton />
            ) : groups.length === 0 ? (
              <Card className="overflow-hidden rounded-[22px] border-[#D9E6F5] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#162339]">
                <CardContent className="p-5 text-sm text-[#64748B] dark:text-slate-300">No SME assignments or budgets were found for the selected cycle.</CardContent>
              </Card>
            ) : (
              groups.map((group, index) => {
                const assigned = group.budgets.length
                const reviewedStatuses: number[] = [
                  DGE_BUDGET_STATUS.underQualityCheck,
                  DGE_BUDGET_STATUS.underFinalReview,
                  DGE_BUDGET_STATUS.reviewCompleted,
                ]
                const reviewed = group.budgets.filter((budget) => reviewedStatuses.includes(budget.statuscode)).length
                const pending = group.budgets.filter((budget) => budget.statuscode === DGE_BUDGET_STATUS.underSmeReview).length
                const clarif = group.budgets.filter((budget) => budget.statuscode === DGE_BUDGET_STATUS.clarificationPending).length
                const dueSoon = group.budgets.filter((budget) => budget.statuscode === DGE_BUDGET_STATUS.strategicPriorityChangeUnderReview).length
                const avgConfidence =
                  assigned > 0
                    ? Math.round(group.budgets.reduce((sum, budget) => sum + (budget.aiConfidenceScore ?? 0), 0) / assigned)
                    : 0
                const statusTone = pending > reviewed ? 'amber' : reviewed > 0 ? 'teal' : 'blue'

                return (
                  <Card
                    key={group.assignment.strategicPriorityId}
                    className="overflow-hidden rounded-[22px] border-[#D9E6F5] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.06)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#BFD4FF] hover:shadow-[0_18px_36px_rgba(15,23,42,0.10)] dark:border-white/10 dark:bg-[#162339]"
                  >
                    <CardContent className="p-0">
                      <div className="flex flex-wrap items-start justify-between gap-4 px-5 py-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EEF5FF] text-sm font-bold text-[#286CFF] dark:bg-[#286CFF]/15 dark:text-[#BFDBFE]">
                              {String(index + 1).padStart(2, '0')}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-lg font-bold text-[#0F172A] dark:text-white">{group.assignment.strategicPriorityName}</p>
                              <p className="text-xs text-[#64748B] dark:text-slate-300">{group.assignment.teamName}</p>
                            </div>
                          </div>
                          <p className="mt-2 text-sm leading-6 text-[#475569] dark:text-slate-300">
                            {assigned} budgets in the selected cycle currently map to this SME track.
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <StrategyPill tone={statusTone}>{pending > reviewed ? 'Backlog' : reviewed > 0 ? 'On Track' : 'Waiting'}</StrategyPill>
                          <span className="inline-flex items-center rounded-full bg-[#EEF5FF] px-3 py-1 text-xs font-semibold text-[#286CFF] dark:bg-[#286CFF]/15 dark:text-[#BFDBFE]">
                            {assigned} budgets
                          </span>
                        </div>
                      </div>

                      <div className="px-5 pb-5">
                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                          {[
                            { label: 'Assigned', value: assigned, tone: '#286CFF' },
                            { label: 'Reviewed', value: reviewed, tone: '#008a65' },
                            { label: 'Pending', value: pending, tone: '#D0A600' },
                            { label: 'Clarif.', value: clarif, tone: '#9955DC' },
                            { label: 'Overdue', value: clarif, tone: '#EF4444' },
                            { label: 'Due Soon', value: dueSoon, tone: '#F97316' },
                          ].map((item) => (
                            <CircularMetric key={item.label} label={item.label} value={item.value} tone={item.tone} />
                          ))}
                        </div>

                        <div className="mt-4 rounded-[20px] p-4 dark:bg-[#1E293B]">
                          <div className="mb-3 flex items-center justify-between">
                            <div>
                              <p className="text-sm font-semibold text-[#0F172A] dark:text-white">Completion</p>
                              <p className="text-xs text-[#64748B] dark:text-slate-300">Current throughput and backlog balance</p>
                            </div>
                            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#286CFF] dark:bg-white/10 dark:text-[#BFDBFE]">
                              {avgConfidence}%
                            </span>
                          </div>
                          <StrategyProgressBar
                            value={assigned > 0 ? Math.round((reviewed / assigned) * 100) : 0}
                            accent="#286CFF"
                          />
                          <div className="mt-3 grid gap-3 sm:grid-cols-3">
                            {[
                              { label: 'Avg Turnaround', value: `${Math.max(1, Math.round((pending + clarif + 1) / 2))}.0 days` },
                              { label: 'High-Risk', value: `${group.budgets.filter((budget) => (budget.aiConfidenceScore ?? 100) < 60).length} projects` },
                              { label: 'Routing Impact', value: `${group.budgets.filter((budget) => budget.statuscode === DGE_BUDGET_STATUS.strategicPriorityChangeUnderReview).length} change requests` },
                            ].map((item) => (
                              <div key={item.label} className="rounded-[16px] border border-[#EAF0F6] bg-white px-3 py-3 dark:border-white/10 dark:bg-white/5">
                                <p className="text-[12px] font-medium text-[#64748B] dark:text-slate-300">{item.label}</p>
                                <p className="mt-2 text-sm font-bold text-[#0F172A] dark:text-white">{item.value}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="mt-4 flex justify-end">
                          <button
                            type="button"
                            className="inline-flex items-center gap-2 rounded-2xl bg-[#286CFF] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1F5BFF]"
                          >
                            Open SME Queue
                            <ArrowRight className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>

          <div className="self-start">
            <AiSmeMonitor />
          </div>
        </div>
      </section>
    </StrategyPageShell>
  )
}
