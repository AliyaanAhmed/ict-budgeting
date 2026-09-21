import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  MessageSquare,
  Search,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  Workflow,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { StrategyPageShell, StrategyPill } from './StrategyTeamShell'
import { useCycle } from '@/context/CycleContext'
import { useToast } from '@/context/ToastContext'
import { CurrencyAmount } from '@/components/shared/CurrencyAmount'
import { getClarificationsByBudgetId, raiseBudgetClarification } from '@/services/clarificationService'
import { Dga_ict_budgetsService } from '@/generated/services/Dga_ict_budgetsService'
import { DGE_BUDGET_STATUS, getDgePortfolioData, type DgeBudgetRecord } from '@/services/dgePortfolioService'
import { routeBudgetToDirectorReview } from '@/services/dgeWorkflowService'
import { ICT_BUDGET_STATUS } from '@/services/ictBudgetDraftService'
import { getStoredStrategyTeam } from '@/services/dgeRoleContextService'
import { grantIctBudgetAccessToTeam } from '@/services/recordShareService'

const tabs = ['All', 'Under Quality Check', 'Under Final Review', 'Clarification Pending'] as const
const QUALITY_CHECK_VISIBLE_STATUSES: number[] = [
  DGE_BUDGET_STATUS.underQualityCheck,
  DGE_BUDGET_STATUS.underFinalReview,
  DGE_BUDGET_STATUS.clarificationPending,
]

function SummaryAccordion({ budgets }: { budgets: DgeBudgetRecord[] }) {
  const [open, setOpen] = useState(false)

  const underQualityCheck = budgets.filter((item) => item.statuscode === DGE_BUDGET_STATUS.underQualityCheck).length
  const underFinalReview = budgets.filter((item) => item.statuscode === DGE_BUDGET_STATUS.underFinalReview).length
  const clarificationPending = budgets.filter((item) => item.statuscode === DGE_BUDGET_STATUS.clarificationPending).length
  const lowConfidence = budgets.filter((item) => (item.aiConfidenceScore ?? 0) > 0 && (item.aiConfidenceScore ?? 0) < 75).length

  return (
    <Card className="overflow-hidden rounded-[28px] border-[#E9D5FF] bg-white shadow-[0_14px_30px_rgba(168,85,247,0.08)] dark:border-white/10 dark:bg-[#1E293B]">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-start justify-between gap-4 bg-gradient-to-b from-[#FDF8FF] via-white to-white px-6 py-5 text-left transition-colors hover:bg-white/40 dark:from-[#2A123D] dark:via-[#1F1B2E] dark:to-[#1E293B] dark:hover:bg-white/5"
      >
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#A855F7] text-white shadow-[0_12px_24px_rgba(168,85,247,0.24)]">
            <Sparkles className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-[16px] font-semibold text-[#0F172A] dark:text-white">AI Quality Check Summary</h2>
              <span className="inline-flex rounded-full bg-[#F5EEFF] px-2.5 py-1 text-xs font-semibold text-[#A855F7] dark:bg-[#A855F7]/15 dark:text-[#E9D5FF]">
                Governing View
              </span>
            </div>
            <p className="mt-1 text-sm leading-6 text-[#475569] dark:text-slate-100">
              Portfolio-level quality signals for strategy-owned items that are now in quality check, final review, or clarification hold.
            </p>
          </div>
        </div>
        {open ? <ChevronUp className="mt-1 h-5 w-5 shrink-0 text-[#64748B] dark:text-slate-300" /> : <ChevronDown className="mt-1 h-5 w-5 shrink-0 text-[#64748B] dark:text-slate-300" />}
      </button>

      {open ? (
        <div className="border-t border-[#E9D5FF] px-6 py-5 dark:border-white/10">
          <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-4">
            <div>
              <div className="mb-3 flex items-center gap-2 text-[#F97316]">
                <ShieldCheck className="h-4 w-4" />
                <p className="text-sm font-semibold text-[#0F172A] dark:text-white">Confidence Analysis</p>
              </div>
              <ul className="space-y-2 text-sm leading-6 text-[#475569] dark:text-slate-300">
                <li className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#F97316]" /><span><strong>{lowConfidence}</strong> low-confidence items need closer governance review</span></li>
                <li className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#F97316]" /><span><strong>{underQualityCheck}</strong> projects are still in live quality-check assessment</span></li>
              </ul>
            </div>

            <div>
              <div className="mb-3 flex items-center gap-2 text-[#10B981]">
                <ShieldCheck className="h-4 w-4" />
                <p className="text-sm font-semibold text-[#0F172A] dark:text-white">Recommendation Quality</p>
              </div>
              <ul className="space-y-2 text-sm leading-6 text-[#475569] dark:text-slate-300">
                <li className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#10B981]" /><span><strong>{underFinalReview}</strong> projects are ready for deeper strategy review</span></li>
                <li className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#10B981]" /><span>Use final review to validate recommendation quality before director routing</span></li>
              </ul>
            </div>

            <div>
              <div className="mb-3 flex items-center gap-2 text-[#EF4444]">
                <TriangleAlert className="h-4 w-4" />
                <p className="text-sm font-semibold text-[#0F172A] dark:text-white">Clarification Pressure</p>
              </div>
              <ul className="space-y-2 text-sm leading-6 text-[#475569] dark:text-slate-300">
                <li className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#EF4444]" /><span><strong>{clarificationPending}</strong> quality-check items are waiting on clarification before they can move forward</span></li>
              </ul>
            </div>

            <div>
              <div className="mb-3 flex items-center gap-2 text-[#A855F7]">
                <Workflow className="h-4 w-4" />
                <p className="text-sm font-semibold text-[#0F172A] dark:text-white">Routing Outlook</p>
              </div>
              <ul className="space-y-2 text-sm leading-6 text-[#475569] dark:text-slate-300">
                <li className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#A855F7]" /><span><strong>{underFinalReview}</strong> items are positioned for director routing next</span></li>
              </ul>
            </div>
          </div>
        </div>
      ) : null}
    </Card>
  )
}

type ClarificationTarget = 'adge' | 'sme'

export default function QualityCheck() {
  const { selectedCycle } = useCycle()
  const { runActionToast } = useToast()
  const strategyTeamId = getStoredStrategyTeam()?.teamId?.trim() || null
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>('All')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [budgets, setBudgets] = useState<DgeBudgetRecord[]>([])
  const [directorClarificationBudgetIds, setDirectorClarificationBudgetIds] = useState<Set<string>>(new Set())
  const [clarificationBudget, setClarificationBudget] = useState<DgeBudgetRecord | null>(null)
  const [clarificationTarget, setClarificationTarget] = useState<ClarificationTarget>('adge')
  const [clarificationMessage, setClarificationMessage] = useState('')

  const resolveDirectorClarificationBudgetIds = async (items: DgeBudgetRecord[]) => {
    const clarificationItems = items.filter((budget) => budget.statuscode === DGE_BUDGET_STATUS.clarificationPending)
    const matches = await Promise.all(
      clarificationItems.map(async (budget) => {
        const clarifications = await getClarificationsByBudgetId(budget.id)
        return clarifications.some(
          (clarification) => clarification.status === 'Open' && clarification.raisedBy === 'Strategy Director'
        )
          ? budget.id
          : null
      })
    )
    return new Set(matches.filter((id): id is string => Boolean(id)))
  }

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
          const visibleBudgets = portfolio.budgets.filter((budget) => QUALITY_CHECK_VISIBLE_STATUSES.includes(budget.statuscode))
          const directorClarificationIds = await resolveDirectorClarificationBudgetIds(visibleBudgets)
          setBudgets(visibleBudgets)
          setDirectorClarificationBudgetIds(directorClarificationIds)
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load quality check projects.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [selectedCycle?.id])

  const tabCounts = useMemo(
    () =>
      tabs.map((tab) => ({
        label: tab,
        count:
          tab === 'All'
            ? budgets.length
            : tab === 'Under Quality Check'
              ? budgets.filter((item) => item.statuscode === DGE_BUDGET_STATUS.underQualityCheck).length
              : tab === 'Under Final Review'
                ? budgets.filter((item) => item.statuscode === DGE_BUDGET_STATUS.underFinalReview).length
                : budgets.filter((item) => item.statuscode === DGE_BUDGET_STATUS.clarificationPending).length,
      })),
    [budgets]
  )

  const filteredItems = useMemo(() => {
    const searched = budgets.filter((item) =>
      `${item.budgetRefId} ${item.name} ${item.entityName} ${item.strategicPriorityClassificationName} ${item.strategicPriorityName}`.toLowerCase().includes(search.toLowerCase())
    )

    return searched.filter((item) =>
      activeTab === 'Under Quality Check'
        ? item.statuscode === DGE_BUDGET_STATUS.underQualityCheck
        : activeTab === 'Under Final Review'
          ? item.statuscode === DGE_BUDGET_STATUS.underFinalReview
          : activeTab === 'Clarification Pending'
            ? item.statuscode === DGE_BUDGET_STATUS.clarificationPending
            : true
    )
  }, [activeTab, budgets, search])

  const refresh = async () => {
    if (!selectedCycle?.id) return
    const portfolio = await getDgePortfolioData(selectedCycle.id)
    const visibleBudgets = portfolio.budgets.filter((budget) => QUALITY_CHECK_VISIBLE_STATUSES.includes(budget.statuscode))
    const directorClarificationIds = await resolveDirectorClarificationBudgetIds(visibleBudgets)
    setBudgets(visibleBudgets)
    setDirectorClarificationBudgetIds(directorClarificationIds)
  }

  const handleRouteToDirector = async (budget: DgeBudgetRecord) => {
    await runActionToast(
      async () => {
        await routeBudgetToDirectorReview(budget)
        await refresh()
      },
      {
        processingTitle: 'Routing to director',
        processingDescription: 'Moving this project into final review...',
        successTitle: 'Routed to director',
        successDescription: 'The project is now under final review.',
        errorTitle: 'Unable to route to director',
        minDurationMs: 1200,
      }
    )
  }

  const handleSubmitClarification = async () => {
    if (!clarificationBudget || !clarificationMessage.trim()) return

    await runActionToast(
      async () => {
        if (clarificationTarget === 'adge') {
          await raiseBudgetClarification({
            budgetId: clarificationBudget.id,
            message: clarificationMessage,
            raisedByRole: 'Strategy Team',
            clarificationStage: 2,
            scope: 1,
          })

          const result = await Dga_ict_budgetsService.update(clarificationBudget.id, {
            statuscode: DGE_BUDGET_STATUS.clarificationPending,
            dga_status_for_adge: ICT_BUDGET_STATUS.clarificationPending,
          } as never)

          if (!result.success) {
            throw new Error(result.error?.message || 'Unable to raise clarification to ADGE.')
          }
        } else {
          if (!clarificationBudget.smeReviewerTeamId) {
            throw new Error('No SME team is mapped on this project.')
          }

          const strategyTeam = getStoredStrategyTeam()
          if (!strategyTeam?.teamId) {
            throw new Error('Strategy Team is not configured for this workspace.')
          }

          await raiseBudgetClarification({
            budgetId: clarificationBudget.id,
            message: clarificationMessage,
            raisedByRole: 'Strategy Team',
            clarificationStage: 2,
            scope: 3,
            raisedToTeamId: clarificationBudget.smeReviewerTeamId,
          })

          await grantIctBudgetAccessToTeam(clarificationBudget.id, strategyTeam.teamId)

          const result = await Dga_ict_budgetsService.update(clarificationBudget.id, {
            statuscode: DGE_BUDGET_STATUS.clarificationPending,
            dga_status_for_adge: ICT_BUDGET_STATUS.underDgeReview,
            'ownerid@odata.bind': `/teams(${clarificationBudget.smeReviewerTeamId})`,
          } as never)

          if (!result.success) {
            throw new Error(result.error?.message || 'Unable to raise clarification to SME.')
          }
        }

        await refresh()
        setClarificationBudget(null)
        setClarificationMessage('')
        setClarificationTarget('adge')
      },
      {
        processingTitle: 'Raising clarification',
        processingDescription:
          clarificationTarget === 'adge'
            ? 'Creating external clarification for ADGE...'
            : 'Creating internal DGE clarification for SME...',
        successTitle: 'Clarification raised',
        successDescription:
          clarificationTarget === 'adge'
            ? 'The project is now awaiting ADGE clarification.'
            : 'The project is now awaiting SME clarification.',
        errorTitle: 'Unable to raise clarification',
        minDurationMs: 1400,
      }
    )
  }

  return (
    <StrategyPageShell
      eyebrow="ICT - Strategy Team"
      title="Quality Check"
      description="Validate strategic quality before the portfolio advances. This view shows live projects in quality check, final review, and clarification hold."
    >
      <section className="space-y-5">
        <SummaryAccordion budgets={budgets} />

        {error ? (
          <div className="rounded-[18px] border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#B91C1C] dark:border-[#7F1D1D] dark:bg-[#3A1717] dark:text-[#FCA5A5]">
            {error}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search QC projects..."
              className="h-10 rounded-2xl border-[#D7E4F4] bg-white pl-10 text-sm dark:border-white/10 dark:bg-[#1E293B]"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {tabCounts.map((tab) => (
              <button
                key={tab.label}
                type="button"
                onClick={() => setActiveTab(tab.label)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                  activeTab === tab.label
                    ? 'border-[var(--primary)] bg-[var(--primary)] text-white shadow-[0_10px_22px_rgba(40,108,255,0.18)]'
                    : 'border border-[#E2E8F0] bg-white text-[#0F172A] hover:bg-[#F1F5F9] dark:border-white/10 dark:bg-[#1E293B] dark:text-white dark:hover:bg-white/5'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`rounded-full px-1.5 py-0.5 text-xs font-bold ${activeTab === tab.label ? 'bg-white/20' : 'bg-[#F1F5F9] dark:bg-white/10'}`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {!loading && filteredItems.length === 0 ? (
            <Card className="rounded-[22px] border-[#DCE6F6] bg-white shadow-[0_10px_24px_rgba(15,23,42,0.05)] dark:border-white/10 dark:bg-[#162339]">
              <CardContent className="px-5 py-10 text-center">
                <Workflow className="mx-auto h-8 w-8 text-[#94A3B8]" />
                <p className="mt-3 text-sm font-semibold text-[#0F172A] dark:text-white">No quality-check projects found</p>
                <p className="mt-1 text-sm text-[#64748B] dark:text-slate-300">No live projects matched this status filter.</p>
              </CardContent>
            </Card>
          ) : null}

          {filteredItems.map((item) => {
            const isDirectorClarification = directorClarificationBudgetIds.has(item.id)
            const isDirectorClarificationAssignedToStrategy =
              isDirectorClarification &&
              Boolean(
                strategyTeamId &&
                item.ownerId?.trim() === strategyTeamId
              )
            return (
            <Card key={item.id} className="overflow-hidden rounded-[24px] border-[#D9E6F5] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#162339]">
              <CardContent className="p-5">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-lg font-bold text-[#0F172A] dark:text-white">{item.name}</p>
                        <StrategyPill tone={item.statuscode === DGE_BUDGET_STATUS.underFinalReview ? 'teal' : item.statuscode === DGE_BUDGET_STATUS.clarificationPending ? 'amber' : 'blue'}>
                          {item.statusLabel}
                        </StrategyPill>
                      </div>
                      <p className="mt-1 text-sm text-[#64748B] dark:text-slate-300">
                        {item.entityName || item.instanceName || 'Unknown Entity'}
                      </p>
                    </div>
                    <div className="shrink-0 text-left lg:text-right">
                      <CurrencyAmount amount={item.recommendedBudget || item.requestedBudget} className="text-xl font-bold text-[#0F172A] dark:text-white" iconSize={16} />
                      <p className="text-xs text-[#64748B] dark:text-slate-300">Recommended Budget</p>
                    </div>
                  </div>

                  <p className="max-w-3xl text-sm leading-6 text-[#475569] dark:text-slate-200">
                    {item.summary || 'No summary is available for this project.'}
                  </p>

                  <div className="hidden">
                    <div className="flex flex-col rounded-[20px] border border-[#EAF0F6] bg-white p-4 dark:border-white/10 dark:bg-[#17243A]">
                      <label className="mb-2 block text-xs font-medium tracking-wide text-[#0F172A] dark:text-white">SME Recommendation</label>
                      <div className="mb-3 inline-flex items-center gap-2 rounded-lg border border-[#4A9D5C]/30 bg-[#4A9D5C]/10 px-4 py-2">
                        <ShieldCheck className="h-5 w-5 text-[#4A9D5C]" />
                        <span className="font-medium text-[#4A9D5C]">{item.recommendedBudget > 0 ? 'Recommended — Approve' : 'Not yet finalized'}</span>
                      </div>
                      <p className="text-sm leading-6 text-[#0F172A] dark:text-white">
                        {item.summary || 'No SME summary is available yet for this project.'}
                      </p>
                    </div>

                    <div className="flex flex-col rounded-[20px] border border-[#E9D5FF] bg-[#FDF8FF] p-4 dark:border-white/10 dark:bg-[#2A123D]">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold tracking-wide text-[#0F172A] dark:text-white">AI Quality Insight</span>
                        <Sparkles className="h-4 w-4 text-[#A855F7]" />
                      </div>
                      <p className="mt-2 text-sm leading-6 text-[#0F172A] dark:text-white">
                        {item.aiConfidenceScore !== null
                          ? `AI confidence is ${item.aiConfidenceScore}%. Review the recommendation, evidence quality, and whether this item is ready for director routing.`
                          : 'AI confidence is not available yet. Review the recommendation and evidence before final routing.'}
                      </p>
                    </div>

                    <div className="flex flex-col rounded-[20px] border border-[#EAF0F6] bg-white p-4 dark:border-white/10 dark:bg-[#17243A]">
                      <label className="mb-2 block text-xs font-medium tracking-wide text-[#0F172A] dark:text-white">Budget Adjustment</label>
                      <div className="mb-3">
                        <div className="flex items-center gap-3">
                          <CurrencyAmount amount={item.requestedBudget} className="text-sm text-[#94A3B8] line-through" iconSize={13} />
                          <CurrencyAmount amount={item.recommendedBudget || item.requestedBudget} className="text-sm font-semibold text-[#0F172A] dark:text-white" iconSize={13} />
                        </div>
                      </div>
                      <div className="mt-auto">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-[#286CFF]">
                              {item.aiConfidenceScore !== null ? `${item.aiConfidenceScore}% Confidence` : 'Confidence unavailable'}
                            </span>
                            <span className="h-1.5 w-1.5 rounded-full bg-[#4F98FF]" />
                          </div>
                          <div className="h-1.5 rounded-full bg-[#E7F5FF]">
                            <div
                              className="h-1.5 rounded-full"
                              style={{
                                background: 'linear-gradient(to right, rgb(160, 213, 171), rgb(74, 157, 92))',
                                width: `${Math.max(8, item.aiConfidenceScore ?? 0)}%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-1 flex flex-wrap justify-end gap-2 border-t border-[#EEF3F8] pt-4 dark:border-white/10">
                    <div className="hidden">
                      <ShieldCheck className="h-4 w-4 text-[#286CFF]" />
                      {item.statusLabel}
                    </div>
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button asChild variant="outline" className="rounded-lg border-[#D7E4F4] text-[#286CFF]">
                        <Link to={`/strategy-team/projects/${item.id}`}>
                          <ExternalLink className="h-4 w-4" />
                          View Detail
                        </Link>
                      </Button>
                      {item.statuscode === DGE_BUDGET_STATUS.underQualityCheck && !isDirectorClarificationAssignedToStrategy ? (
                        <Button
                          type="button"
                          variant="outline"
                          className="inline-flex items-center gap-2 rounded-lg border border-[#D7E4F4] bg-white px-3 py-2 text-sm font-medium text-[#286CFF] transition-colors hover:bg-[#EEF5FF] dark:border-white/10 dark:bg-[#1E293B] dark:text-white dark:hover:bg-white/5"
                          onClick={() => setClarificationBudget(item)}
                        >
                          <MessageSquare className="h-4 w-4" />
                          Raise Clarification
                        </Button>
                      ) : null}
                      {item.statuscode === DGE_BUDGET_STATUS.underQualityCheck || isDirectorClarificationAssignedToStrategy ? (
                        <Button
                          type="button"
                          className="inline-flex items-center gap-2 rounded-lg border border-[#043DFF] bg-[#286CFF] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[#0C65F5]"
                          onClick={() => void handleRouteToDirector(item)}
                        >
                          <Workflow className="h-4 w-4" />
                          Route to Director
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            )
          })}
        </div>
      </section>

      <Dialog open={Boolean(clarificationBudget)} onOpenChange={(open) => !open && setClarificationBudget(null)}>
        <DialogContent className="max-w-[620px] overflow-hidden rounded-[28px] border border-[#D9E6F5] bg-white p-0 dark:border-white/10 dark:bg-[#162339]">
          <div className="border-b border-[#EEF3F8] bg-white px-6 py-5 dark:border-white/10 dark:bg-[#162339]">
            <DialogHeader>
              <DialogTitle>Raise Clarification</DialogTitle>
              <DialogDescription>
                Choose whether this clarification goes back to ADGE or to the SME reviewer team.
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="space-y-4 px-6 py-5">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setClarificationTarget('adge')}
                className={`rounded-full px-3 py-1.5 text-sm font-medium ${clarificationTarget === 'adge' ? 'bg-[#286CFF] text-white' : 'border border-[#D7E4F4] bg-white text-[#0F172A]'}`}
              >
                From ADGE
              </button>
              <button
                type="button"
                onClick={() => setClarificationTarget('sme')}
                className={`rounded-full px-3 py-1.5 text-sm font-medium ${clarificationTarget === 'sme' ? 'bg-[#286CFF] text-white' : 'border border-[#D7E4F4] bg-white text-[#0F172A]'}`}
              >
                From SME
              </button>
            </div>
            <Textarea
              value={clarificationMessage}
              onChange={(event) => setClarificationMessage(event.target.value)}
              rows={5}
              className="rounded-2xl border-[#D7E4F4]"
              placeholder={
                clarificationTarget === 'adge'
                  ? 'Explain what ADGE needs to clarify before quality check can continue...'
                  : 'Explain what the SME team must clarify before this project can proceed...'
              }
            />
          </div>
          <DialogFooter className="border-t border-[#EEF3F8] px-6 pb-6 pt-4 dark:border-white/10">
            <Button variant="outline" className="rounded-2xl" onClick={() => setClarificationBudget(null)}>
              Cancel
            </Button>
            <Button className="rounded-2xl bg-[#286CFF] text-white hover:bg-[#0C65F5]" onClick={() => void handleSubmitClarification()} disabled={!clarificationMessage.trim()}>
              Raise Clarification
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </StrategyPageShell>
  )
}
