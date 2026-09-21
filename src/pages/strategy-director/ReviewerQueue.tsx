import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ExternalLink, MessageSquare, Search, ShieldCheck, Workflow } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { CurrencyAmount } from '@/components/shared/CurrencyAmount'
import { useCycle } from '@/context/CycleContext'
import { useToast } from '@/context/ToastContext'
import { getClarificationsByBudgetId, raiseBudgetClarification } from '@/services/clarificationService'
import {
  completeDirectorReview,
  assignDirectorClarificationToSme,
  assignDirectorClarificationToStrategy,
} from '@/services/dgeWorkflowService'
import {
  DGE_BUDGET_STATUS,
  getDgePortfolioData,
  type DgeBudgetRecord,
  type DgeInstanceRecord,
} from '@/services/dgePortfolioService'
import { StrategyPageShell, StrategyPill } from '@/pages/strategy-team/StrategyTeamShell'

const tabs = ['All', 'Under Final Review', 'Clarification Pending', 'Review Completed'] as const
const DIRECTOR_QUEUE_STATUSES: number[] = [
  DGE_BUDGET_STATUS.underFinalReview,
  DGE_BUDGET_STATUS.clarificationPending,
  DGE_BUDGET_STATUS.reviewCompleted,
]
type ClarificationTarget = 'strategy' | 'sme'

function SkeletonBlock({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-2xl bg-[#EAF0F6] dark:bg-white/10 ${className}`} />
}

export default function DirectorReviewerQueue() {
  const { selectedCycle } = useCycle()
  const { runActionToast } = useToast()
  const [budgets, setBudgets] = useState<DgeBudgetRecord[]>([])
  const [instances, setInstances] = useState<DgeInstanceRecord[]>([])
  const [directorClarificationBudgetIds, setDirectorClarificationBudgetIds] = useState<Set<string>>(new Set())
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>('All')
  const [instanceFilter, setInstanceFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [clarificationBudget, setClarificationBudget] = useState<DgeBudgetRecord | null>(null)
  const [clarificationTarget, setClarificationTarget] = useState<ClarificationTarget>('strategy')
  const [clarificationMessage, setClarificationMessage] = useState('')

  const refresh = async () => {
    if (!selectedCycle?.id) return
    const portfolio = await getDgePortfolioData(selectedCycle.id)
    const visibleBudgets = portfolio.budgets.filter((budget) => DIRECTOR_QUEUE_STATUSES.includes(budget.statuscode))
    const directorClarificationIds = await resolveDirectorClarificationBudgetIds(visibleBudgets)
    setInstances(portfolio.instances)
    setBudgets(visibleBudgets)
    setDirectorClarificationBudgetIds(directorClarificationIds)
  }

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
        setLoading(false)
        return
      }
      setLoading(true)
      setError(null)
      try {
        const portfolio = await getDgePortfolioData(selectedCycle.id)
        if (cancelled) return
        const visibleBudgets = portfolio.budgets.filter((budget) => DIRECTOR_QUEUE_STATUSES.includes(budget.statuscode))
        const directorClarificationIds = await resolveDirectorClarificationBudgetIds(visibleBudgets)
        setInstances(portfolio.instances)
        setBudgets(visibleBudgets)
        setDirectorClarificationBudgetIds(directorClarificationIds)
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : 'Unable to load director queue.')
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
            : tab === 'Under Final Review'
              ? budgets.filter((item) => item.statuscode === DGE_BUDGET_STATUS.underFinalReview).length
              : tab === 'Clarification Pending'
                ? budgets.filter((item) => item.statuscode === DGE_BUDGET_STATUS.clarificationPending).length
                : budgets.filter((item) => item.statuscode === DGE_BUDGET_STATUS.reviewCompleted).length,
      })),
    [budgets]
  )

  const filteredItems = useMemo(() => {
    const q = search.toLowerCase()
    return budgets.filter((item) => {
      if (activeTab === 'Under Final Review' && item.statuscode !== DGE_BUDGET_STATUS.underFinalReview) return false
      if (activeTab === 'Clarification Pending' && item.statuscode !== DGE_BUDGET_STATUS.clarificationPending) return false
      if (activeTab === 'Review Completed' && item.statuscode !== DGE_BUDGET_STATUS.reviewCompleted) return false
      if (instanceFilter !== 'all' && item.instanceId !== instanceFilter) return false
      return `${item.budgetRefId} ${item.name} ${item.entityName} ${item.strategicPriorityName}`.toLowerCase().includes(q)
    })
  }, [activeTab, budgets, instanceFilter, search])

  const handleCompleteReview = async (budget: DgeBudgetRecord) => {
    await runActionToast(
      async () => {
        await completeDirectorReview(budget)
        await refresh()
      },
      {
        processingTitle: 'Completing review',
        processingDescription: 'Marking this project as DGE review completed...',
        successTitle: 'Review completed',
        successDescription: 'The project is now ready for entity publication checks.',
        errorTitle: 'Unable to complete review',
        minDurationMs: 1200,
      }
    )
  }

  const openDirectorClarification = async (budget: DgeBudgetRecord) => {
    if (budget.statuscode !== DGE_BUDGET_STATUS.clarificationPending) {
      setClarificationBudget(budget)
      return
    }

    const clarifications = await getClarificationsByBudgetId(budget.id)
    const directorThread = clarifications.find((item) => item.status === 'Open' && item.raisedBy === 'Strategy Director')
    if (directorThread?.raisedTo?.toLowerCase().includes('sme')) {
      setClarificationTarget('sme')
    } else {
      setClarificationTarget('strategy')
    }
    setClarificationBudget(budget)
  }

  const handleSubmitClarification = async () => {
    if (!clarificationBudget || !clarificationMessage.trim()) return

    await runActionToast(
      async () => {
        await raiseBudgetClarification({
          budgetId: clarificationBudget.id,
          message: clarificationMessage,
          raisedByRole: 'Strategy Director',
          clarificationStage: 2,
          scope: 3,
          raisedToTeamId:
            clarificationTarget === 'sme'
              ? clarificationBudget.smeReviewerTeamId ?? undefined
              : undefined,
        })

        if (clarificationTarget === 'sme') {
          await assignDirectorClarificationToSme(clarificationBudget)
        } else {
          await assignDirectorClarificationToStrategy(clarificationBudget)
        }

        setClarificationBudget(null)
        setClarificationMessage('')
        setClarificationTarget('strategy')
        await refresh()
      },
      {
        processingTitle: 'Raising clarification',
        processingDescription: clarificationTarget === 'sme' ? 'Sending an internal clarification to SME...' : 'Sending an internal clarification to Strategy Team...',
        successTitle: 'Clarification raised',
        successDescription: 'The project is now pending an internal DGE clarification response.',
        errorTitle: 'Unable to raise clarification',
        minDurationMs: 1400,
      }
    )
  }

  return (
    <StrategyPageShell
      eyebrow="ICT - Strategy Director"
      title="Director Review Queue"
      description="Final review lane for projects routed by Strategy Team after quality check."
    >
      <section className="space-y-5">
        {error ? (
          <div className="rounded-[18px] border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#B91C1C] dark:border-[#7F1D1D] dark:bg-[#3A1717] dark:text-[#FCA5A5]">
            {error}
          </div>
        ) : null}

        <div className="rounded-[24px] border border-[#D9E6F5] bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#162339]">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              {tabCounts.map((tab) => (
                <button
                  key={tab.label}
                  type="button"
                  onClick={() => setActiveTab(tab.label)}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                    activeTab === tab.label
                      ? 'border-[var(--primary)] bg-[var(--primary)] text-white'
                      : 'border-[#E2E8F0] bg-white text-[#0F172A] hover:bg-[#F1F5F9] dark:border-white/10 dark:bg-[#1E293B] dark:text-white dark:hover:bg-white/5'
                  }`}
                >
                  {tab.label}
                  <span className={`rounded-full px-1.5 py-0.5 text-xs font-bold ${activeTab === tab.label ? 'bg-white/20' : 'bg-[#F1F5F9] dark:bg-white/10'}`}>{tab.count}</span>
                </button>
              ))}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative w-full sm:w-72">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
                <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search projects..." className="h-10 rounded-2xl border-[#D7E4F4] pl-10 text-sm" />
              </div>
              <Select value={instanceFilter} onValueChange={setInstanceFilter}>
                <SelectTrigger className="h-10 w-full rounded-2xl border-[#D7E4F4] bg-white sm:w-64 dark:border-white/10 dark:bg-[#1E293B]">
                  <SelectValue placeholder="All entities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Entities</SelectItem>
                  {instances.map((instance) => (
                    <SelectItem key={instance.id} value={instance.id}>{instance.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => <SkeletonBlock key={index} className="h-44" />)}
          </div>
        ) : filteredItems.length === 0 ? (
          <Card className="rounded-[24px] border-[#D9E6F5] bg-white dark:border-white/10 dark:bg-[#162339]">
            <CardContent className="py-12 text-center">
              <ShieldCheck className="mx-auto h-10 w-10 text-[#94A3B8]" />
              <p className="mt-3 text-sm font-semibold text-[#0F172A] dark:text-white">No director review projects found</p>
              <p className="mt-1 text-sm text-[#64748B] dark:text-slate-300">Try another status or entity filter.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredItems.map((item) => (
              <Card key={item.id} className="overflow-hidden rounded-[24px] border-[#D9E6F5] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#162339]">
                <CardContent className="p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-lg font-bold text-[#0F172A] dark:text-white">{item.name}</p>
                        <StrategyPill tone={item.statuscode === DGE_BUDGET_STATUS.reviewCompleted ? 'teal' : item.statuscode === DGE_BUDGET_STATUS.clarificationPending ? 'amber' : 'blue'}>{item.statusLabel}</StrategyPill>
                      </div>
                      <p className="mt-1 text-sm text-[#64748B] dark:text-slate-300">{item.budgetRefId} · {item.entityName || item.instanceName || 'Unknown entity'}</p>
                      <p className="mt-3 max-w-3xl text-sm leading-6 text-[#475569] dark:text-slate-200">{item.summary || 'No summary is available for this project.'}</p>
                    </div>
                    <div className="shrink-0 text-left lg:text-right">
                      <CurrencyAmount amount={item.recommendedBudget || item.requestedBudget} className="text-xl font-bold text-[#0F172A] dark:text-white" iconSize={16} />
                      <p className="text-xs text-[#64748B] dark:text-slate-300">Recommended Budget</p>
                    </div>
                  </div>
                  <div className="mt-5 flex flex-wrap justify-end gap-2 border-t border-[#EEF3F8] pt-4 dark:border-white/10">
                    <Button asChild variant="outline" className="rounded-lg border-[#D7E4F4] text-[#286CFF]">
                      <Link to={`/strategy-director/reviewer-queue/${item.id}`}><ExternalLink className="h-4 w-4" />View Detail</Link>
                    </Button>
                    {item.statuscode === DGE_BUDGET_STATUS.underFinalReview ? (
                      <>
                        <Button variant="outline" className="rounded-lg border-[#D7E4F4] text-[#286CFF]" onClick={() => void openDirectorClarification(item)}>
                          <MessageSquare className="h-4 w-4" />Raise Clarification
                        </Button>
                        <Button className="rounded-lg bg-[#286CFF] text-white hover:bg-[#0C65F5]" onClick={() => void handleCompleteReview(item)}>
                          <Workflow className="h-4 w-4" />Complete Review
                        </Button>
                      </>
                    ) : null}
                    {item.statuscode === DGE_BUDGET_STATUS.clarificationPending && directorClarificationBudgetIds.has(item.id) ? (
                      <Button className="rounded-lg bg-[#286CFF] text-white hover:bg-[#0C65F5]" onClick={() => void handleCompleteReview(item)}>
                        <Workflow className="h-4 w-4" />Complete Review
                      </Button>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <Dialog open={Boolean(clarificationBudget)} onOpenChange={(open) => !open && setClarificationBudget(null)}>
        <DialogContent className="max-w-[620px] overflow-hidden rounded-[28px] border border-[#D9E6F5] bg-white p-0 dark:border-white/10 dark:bg-[#162339]">
          <div className="border-b border-[#EEF3F8] bg-white px-6 py-5 dark:border-white/10 dark:bg-[#162339]">
            <DialogHeader>
              <DialogTitle>Raise Director Clarification</DialogTitle>
              <DialogDescription>Send an internal DGE clarification to Strategy Team or the target SME.</DialogDescription>
            </DialogHeader>
          </div>
          <div className="space-y-4 px-6 py-5">
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'strategy' as const, label: 'To Strategy' },
                { key: 'sme' as const, label: 'To SME' },
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setClarificationTarget(item.key)}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium ${clarificationTarget === item.key ? 'bg-[#286CFF] text-white' : 'border border-[#D7E4F4] bg-white text-[#0F172A]'}`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <Textarea value={clarificationMessage} onChange={(event) => setClarificationMessage(event.target.value)} rows={5} className="rounded-2xl border-[#D7E4F4]" placeholder="Write the clarification request..." />
          </div>
          <DialogFooter className="border-t border-[#EEF3F8] px-6 pb-6 pt-4 dark:border-white/10">
            <Button variant="outline" className="rounded-2xl" onClick={() => setClarificationBudget(null)}>Cancel</Button>
            <Button className="rounded-2xl bg-[#286CFF] text-white hover:bg-[#0C65F5]" onClick={() => void handleSubmitClarification()} disabled={!clarificationMessage.trim()}>Raise Clarification</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </StrategyPageShell>
  )
}
