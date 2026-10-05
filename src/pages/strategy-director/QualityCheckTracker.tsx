import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, CheckCircle2, ClipboardCheck, ExternalLink, FolderSearch, MessageSquareMore, ShieldCheck, Sparkles, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CurrencyAmount } from '@/components/shared/CurrencyAmount'
import { SmeAiRecommendation } from '@/components/shared/SmeAiRecommendation'
import { aiFlagTone } from '@/components/shared/aiRiskStyles'
import { useCycle } from '@/context/CycleContext'
import { getProjectAiReviewFlags, parseBudgetOverviewData } from '@/services/documentAiSummaryStoreService'
import { canShowStrategyAiRecommendation, getSmeDecisionMatch } from '@/services/smeAiRecommendation'
import {
  DGE_BUDGET_STATUS,
  getDgePortfolioData,
  type DgeBudgetRecord,
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

function groupByEntity(budgets: DgeBudgetRecord[]) {
  const groups = new Map<string, DgeBudgetRecord[]>()
  budgets.forEach((budget) => {
    const key = budget.entityName || budget.instanceName || 'Unknown Entity'
    groups.set(key, [...(groups.get(key) ?? []), budget])
  })
  return [...groups.entries()].map(([entity, items]) => ({ entity, items }))
}

export default function StrategyDirectorQualityCheckTracker() {
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
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : 'Unable to load quality check tracker.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [selectedCycle?.id])

  const metrics = useMemo(() => {
    const assigned = data.budgets.filter((budget) => budget.statuscode === DGE_BUDGET_STATUS.underQualityCheck)
    const directorReview = data.budgets.filter((budget) => budget.statuscode === DGE_BUDGET_STATUS.underFinalReview)
    const completed = data.budgets.filter((budget) => budget.statuscode === DGE_BUDGET_STATUS.reviewCompleted)
    const clarification = data.budgets.filter((budget) => budget.statuscode === DGE_BUDGET_STATUS.clarificationPending)
    const qualityUniverse = [...assigned, ...directorReview, ...completed]
    const checked = [...directorReview, ...completed]
    const progress = qualityUniverse.length ? Math.round((checked.length / qualityUniverse.length) * 100) : 0

    return {
      assigned,
      directorReview,
      completed,
      clarification,
      qualityUniverse,
      checked,
      progress,
    }
  }, [data.budgets])

  const entityRows = useMemo(() => groupByEntity(metrics.qualityUniverse), [metrics.qualityUniverse])

  return (
    <StrategyPageShell
      eyebrow="ICT - Strategy Director"
      title="Strategy Quality Check Tracker"
      description="Director oversight of Strategy Team quality-check workload, checked projects, Director review handoff, and clarification blockers."
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
            <StrategyMetricCard title="Assigned to Strategy" value={metrics.assigned.length} note="Waiting for quality check" accent="#286CFF" icon={<ClipboardCheck className="h-5 w-5" />} />
            <StrategyMetricCard title="Quality Checked" value={metrics.checked.length} note="Moved to Director or completed" accent="#10B981" icon={<CheckCircle2 className="h-5 w-5" />} />
            <StrategyMetricCard title="Director Review" value={metrics.directorReview.length} note="Ready for final review" accent="#7C3AED" icon={<ShieldCheck className="h-5 w-5" />} />
            <StrategyMetricCard title="Clarification Blocked" value={metrics.clarification.length} note="Returned for clarification" accent="#F97316" icon={<MessageSquareMore className="h-5 w-5" />} />
          </div>

          <section className="grid grid-cols-1 items-stretch gap-5 xl:grid-cols-2">
            <StrategySectionCard
              title="Quality Check Progress"
              description="How much of the Strategy Team quality-check lane has already moved forward."
              className="h-full"
              headingIcon={<ShieldCheck className="h-5 w-5 text-[#286CFF]" />}
            >
              <div className="flex h-full flex-col justify-center">
                <div className="rounded-[24px] border border-[#DCE8F6] bg-[linear-gradient(135deg,#F8FBFF_0%,#EEF5FF_100%)] p-5 dark:border-white/10 dark:bg-[linear-gradient(135deg,#162339_0%,#1B2A41_100%)]">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-[#0F172A] dark:text-white">Strategy Team Quality Lane</p>
                      <p className="mt-2 text-sm text-[#64748B] dark:text-slate-300">{metrics.qualityUniverse.length} projects in quality governance</p>
                    </div>
                    <StrategyPill tone={metrics.progress >= 70 ? 'teal' : 'blue'}>{metrics.progress}% checked</StrategyPill>
                  </div>
                  <div className="mt-5">
                    <StrategyProgressBar value={metrics.progress} accent="#286CFF" />
                  </div>
                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    {([
                      ['Pending QC', metrics.assigned.length, '#286CFF'],
                      ['Director Review', metrics.directorReview.length, '#7C3AED'],
                      ['Completed', metrics.completed.length, '#10B981'],
                    ] as Array<[string, number, string]>).map(([label, value, accent]) => (
                      <div key={label} className="rounded-[18px] border border-[#DCE8F6] bg-white p-4 dark:border-white/10 dark:bg-white/5">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: accent }} />
                        <p className="mt-3 text-xs font-semibold text-[#64748B] dark:text-slate-300">{label}</p>
                        <p className="mt-1 text-2xl font-bold text-[#0F172A] dark:text-white">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </StrategySectionCard>

            <StrategySectionCard
              title="Entity Quality Distribution"
              description="Entities with projects currently inside the Strategy quality-check lane."
              className="h-full"
              headingIcon={<Users className="h-5 w-5 text-[#286CFF]" />}
            >
              {entityRows.length === 0 ? (
                <StrategyDashboardEmptyState
                  icon={<FolderSearch className="h-6 w-6" />}
                  title="No Quality Check Work"
                  description="No projects are currently assigned to the Strategy Team quality-check lane."
                />
              ) : (
                <div className="space-y-3">
                  {entityRows.slice(0, 6).map(({ entity, items }) => {
                    const completed = items.filter((item) => item.statuscode === DGE_BUDGET_STATUS.reviewCompleted).length
                    const progress = items.length ? Math.round((completed / items.length) * 100) : 0
                    return (
                      <div key={entity} className="rounded-[18px] border border-[#DCE8F6] bg-[#FBFDFF] p-4 dark:border-white/10 dark:bg-white/5">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-[#0F172A] dark:text-white">{entity}</p>
                            <p className="mt-1 text-xs text-[#64748B] dark:text-slate-300">{items.length} projects</p>
                          </div>
                          <span className="rounded-full bg-[#EEF5FF] px-2.5 py-1 text-xs font-bold text-[#286CFF] dark:bg-[#286CFF]/15 dark:text-[#BFDBFE]">
                            {progress}%
                          </span>
                        </div>
                        <div className="mt-3">
                          <StrategyProgressBar value={progress} accent="#286CFF" />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </StrategySectionCard>
          </section>

          <StrategySectionCard
            title="Quality Check Worklist"
            description="Latest projects that still need quality check or Director handoff attention."
            headingIcon={<ClipboardCheck className="h-5 w-5 text-[#286CFF]" />}
          >
            {metrics.qualityUniverse.length === 0 ? (
              <StrategyDashboardEmptyState
                icon={<FolderSearch className="h-6 w-6" />}
                title="No Projects Found"
                description="There are no quality-check projects for the selected cycle."
              />
            ) : (
              <div className="space-y-4">
                {metrics.qualityUniverse.slice(0, 8).map((budget) => {
                  const reviewFlags = getProjectAiReviewFlags(budget.aiReviewFlags)
                  const reportedFlags = parseBudgetOverviewData(budget.projectPortfolioForDge)?.ai_review_flags
                  const flagKeys = { 1: 'evidence_risk', 2: 'dge_budget_consideration_risk', 3: 'strategic_alignment_risk', 4: 'budget_accuracy_risk', 8: 'clarification_required' } as const
                  const hasScore = typeof budget.smeReviewScore === 'number' && Number.isFinite(budget.smeReviewScore)
                  const confidence = budget.aiConfidenceScore
                  const hasConfidence = typeof confidence === 'number' && Number.isFinite(confidence)
                  const confidenceColor = !hasConfidence ? 'text-[#64748B] dark:text-slate-300' : confidence >= 80 ? 'text-[#059669] dark:text-emerald-300' : confidence >= 60 ? 'text-[#D97706] dark:text-amber-300' : 'text-[#DC2626] dark:text-red-300'
                  const decisionMatch = canShowStrategyAiRecommendation(budget.statuscode)
                    ? getSmeDecisionMatch(budget.projectPortfolioForDge, budget.recommended)
                    : 'unavailable'

                  return (
                    <Card key={budget.id} className="group rounded-[20px] border-[#DCE6F1] bg-white shadow-[0_4px_16px_rgba(15,23,42,0.035)] transition-[border-color,box-shadow] duration-200 hover:border-[#BFD4FF] hover:shadow-[0_8px_22px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#162339]">
                      <CardContent className="flex min-w-0 flex-col gap-4 p-5">
                          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <Link to={`/strategy-director/projects/${budget.id}`} state={{ backTo: '/strategy-director/quality-check-tracker', backLabel: 'Quality Check Tracker' }} className="break-words rounded text-lg font-bold text-[#0F172A] transition-colors hover:text-[#286CFF] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#286CFF] dark:text-white dark:hover:text-[#BFDBFE]">{budget.name}</Link>
                                <StrategyPill tone={budget.statuscode === DGE_BUDGET_STATUS.reviewCompleted ? 'teal' : budget.statuscode === DGE_BUDGET_STATUS.underFinalReview ? 'violet' : 'blue'}>{budget.statusLabel}</StrategyPill>
                              </div>
                              <p className="mt-1 text-sm text-[#64748B] dark:text-slate-300">{budget.budgetRefId} · {budget.entityName || budget.instanceName || 'Unknown Entity'}</p>
                            </div>
                            <div className="grid shrink-0 grid-cols-2 gap-2 sm:grid-cols-3">
                              <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2 dark:border-white/10 dark:bg-white/5">
                                <p className="text-[10px] font-semibold text-[#64748B] dark:text-slate-300">SME Score</p>
                                <p className="mt-1 text-lg font-bold tabular-nums text-[#0F172A] dark:text-white">{hasScore ? `${budget.smeReviewScore}%` : '–'}</p>
                              </div>
                              <div className="rounded-xl border border-[#E9D5FF] bg-[#FDFBFF] px-3 py-2 dark:border-purple-900/60 dark:bg-purple-950/20">
                                <p className="flex items-center gap-1 text-[10px] font-semibold text-[#7E22CE] dark:text-purple-200"><Sparkles className="h-3 w-3" />AI Confidence</p>
                                <p className={`mt-1 text-lg font-bold tabular-nums ${confidenceColor}`}>{hasConfidence ? `${confidence}%` : '–'}</p>
                              </div>
                              <div className="col-span-2 rounded-xl border border-[#E2E8F0] bg-white px-3 py-2 text-left dark:border-white/10 dark:bg-white/5 sm:col-span-1 sm:text-right">
                                <p className="text-[10px] font-semibold text-[#64748B] dark:text-slate-300">Recommended Budget</p>
                                <CurrencyAmount amount={budget.recommendedBudget || budget.requestedBudget} className="mt-1 text-base font-bold text-[#0F172A] dark:text-white" iconSize={14} />
                              </div>
                            </div>
                          </div>

                          <p className="max-w-3xl text-sm leading-6 text-[#475569] dark:text-slate-200">{budget.summary || 'No summary is available for this project.'}</p>

                          <div className="flex flex-wrap items-center gap-2 border-t border-[#EEF3F8] pt-3 dark:border-white/10">
                            {decisionMatch !== 'unavailable' ? <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${decisionMatch === 'matched' ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200' : 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200'}`}>AI Decision: {decisionMatch === 'matched' ? 'Matched' : 'Mismatched'}</span> : null}
                          </div>

                          {reviewFlags.length > 0 ? <div className="flex flex-wrap items-center gap-2">
                            <p className="mr-1 text-xs font-semibold text-[#64748B] dark:text-slate-300">AI Review Flags</p>
                            {reviewFlags.map((flag) => {
                              const key = flagKeys[flag.code as keyof typeof flagKeys]
                              const reported = key ? reportedFlags?.[key] : undefined
                              const severity = reported?.severity || flag.severity
                              return <span key={flag.key} title={`${severity} Risk${reported?.reason ? `: ${reported.reason}` : ''}`} className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${aiFlagTone(severity)}`}><Sparkles className="h-3 w-3 shrink-0" />{flag.label}<span className="sr-only">: {severity} Risk</span></span>
                            })}
                          </div> : null}

                          <div className="grid auto-rows-fr items-stretch gap-3 sm:grid-cols-2">
                            <div className="rounded-xl border border-[#E2E8F0] bg-[#FAFCFE] p-3 dark:border-white/10 dark:bg-white/5">
                              <p className="text-xs font-semibold text-[#64748B] dark:text-slate-300">Actual SME Decision</p>
                              <span className={`mt-2 inline-flex rounded-full px-3 py-1 text-sm font-semibold ${budget.recommended === 2 ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200' : budget.recommended === 1 ? 'bg-rose-50 text-rose-800 dark:bg-rose-900/30 dark:text-rose-200' : 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300'}`}>{budget.recommended === 2 ? 'Recommended' : budget.recommended === 1 ? 'Not Recommended' : 'Not Yet Finalized'}</span>
                              {budget.recommended === 1 ? <p className="mt-2 text-sm text-[#64748B] dark:text-slate-300">{budget.rejectionReason === 1 ? 'Not Advised' : budget.rejectionReason === 2 ? 'Not ICT Related' : budget.rejectionReason === 3 ? 'No Evidence Provided' : 'No rejection reason provided'}</p> : null}
                            </div>
                            {canShowStrategyAiRecommendation(budget.statuscode) ? <SmeAiRecommendation raw={budget.projectPortfolioForDge} variant="static" /> : null}
                          </div>

                          <div className="flex justify-end border-t border-[#EEF3F8] pt-3 dark:border-white/10">
                            <Button asChild variant="outline" className="rounded-lg border-[#D7E4F4] text-[#286CFF]"><Link to={`/strategy-director/projects/${budget.id}`} state={{ backTo: '/strategy-director/quality-check-tracker', backLabel: 'Quality Check Tracker' }}><ExternalLink className="h-4 w-4" />View Detail</Link></Button>
                          </div>
                      </CardContent>
                    </Card>
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
