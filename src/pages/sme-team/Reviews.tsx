import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Eye,
  FileText,
  FolderSearch,
  Layers,
  MessageSquareDot,
  ScanSearch,
  Sparkles,
  Workflow,
} from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ConfirmationModal } from '@/components/shared/ConfirmationModal'
import { CurrencyAmount } from '@/components/shared/CurrencyAmount'
import { useCycle } from '@/context/CycleContext'
import { useRole } from '@/context/RoleContext'
import { useToast } from '@/context/ToastContext'
import { cn } from '@/lib/utils'
import { StrategyPageShell, StrategyPill } from '@/pages/strategy-team/StrategyTeamShell'
import { getStoredCurrentSme, getStoredSmeAssignments } from '@/services/dgeRoleContextService'
import {
  DGE_BUDGET_STATUS,
  getCurrentSmeBudgets,
  getDgePortfolioData,
  type DgeBudgetRecord,
} from '@/services/dgePortfolioService'
import {
  requestStrategicPriorityChange,
  routeBudgetToQualityCheck,
  validateBudgetReadyForQualityCheck,
} from '@/services/dgeWorkflowService'
import { getStrategicPriorityOptions, type StrategicPriorityOption } from '@/services/strategicPriorityService'
import { ICT_BUDGET_STATUS } from '@/services/ictBudgetDraftService'
import { raiseBudgetClarification } from '@/services/clarificationService'
import { Dga_ict_budgetsService } from '@/generated/services/Dga_ict_budgetsService'

type QueueFilterKey =
  | 'all'
  | 'under-sme-review'
  | 'change-under-review'
  | 'clarification-required'
  | 'clarification-raised'
  | 'under-quality-check'

const FILTER_STATUS_MAP: Record<QueueFilterKey, number[] | null> = {
  all: null,
  'under-sme-review': [DGE_BUDGET_STATUS.underSmeReview],
  'change-under-review': [DGE_BUDGET_STATUS.strategicPriorityChangeUnderReview],
  'clarification-required': [DGE_BUDGET_STATUS.clarificationPending],
  'clarification-raised': [DGE_BUDGET_STATUS.clarificationPending],
  'under-quality-check': [DGE_BUDGET_STATUS.underQualityCheck],
}

const SME_QUEUE_VISIBLE_STATUSES = new Set<number>([
  DGE_BUDGET_STATUS.underSmeReview,
  DGE_BUDGET_STATUS.strategicPriorityChangeUnderReview,
  DGE_BUDGET_STATUS.clarificationPending,
  DGE_BUDGET_STATUS.underQualityCheck,
])

const PAGE_SIZE = 6

function trimPriorityLabel(value: string | null | undefined) {
  if (!value) return '-'
  return value.split(' - ')[0]?.trim() || value
}

function QueueSkeleton() {
  return (
    <div className="space-y-5">
      <div className="animate-pulse rounded-[28px] border border-[#E9D5FF] bg-white p-6 dark:border-white/10 dark:bg-[#1E293B]">
        <div className="h-5 w-56 rounded bg-[#EAF0F6] dark:bg-white/10" />
        <div className="mt-3 h-4 w-full max-w-3xl rounded bg-[#EAF0F6] dark:bg-white/10" />
        <div className="mt-2 h-4 w-full max-w-2xl rounded bg-[#EAF0F6] dark:bg-white/10" />
      </div>
      <div className="animate-pulse rounded-[22px] border border-[#D9E6F5] bg-white p-4 dark:border-white/10 dark:bg-[#162339]">
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-9 w-36 rounded-full bg-[#EAF0F6] dark:bg-white/10" />
          ))}
        </div>
      </div>
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="animate-pulse rounded-[22px] border border-[#D9E6F5] bg-white p-5 dark:border-white/10 dark:bg-[#162339]">
            <div className="h-5 w-2/5 rounded bg-[#EAF0F6] dark:bg-white/10" />
            <div className="mt-3 h-4 w-1/2 rounded bg-[#EAF0F6] dark:bg-white/10" />
            <div className="mt-4 grid gap-3 lg:grid-cols-3">
              <div className="h-24 rounded-[18px] bg-[#EAF0F6] dark:bg-white/10" />
              <div className="h-24 rounded-[18px] bg-[#EAF0F6] dark:bg-white/10" />
              <div className="h-24 rounded-[18px] bg-[#EAF0F6] dark:bg-white/10" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function SmeTeamReviews() {
  const { selectedCycle } = useCycle()
  const { activeRoleOptionKey } = useRole()
  const currentSme = useMemo(() => getStoredCurrentSme(), [activeRoleOptionKey])
  const { runActionToast } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [budgets, setBudgets] = useState<DgeBudgetRecord[]>([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<QueueFilterKey>('all')
  const [entityFilter, setEntityFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [summaryExpanded, setSummaryExpanded] = useState(false)
  const [priorityOptions, setPriorityOptions] = useState<StrategicPriorityOption[]>([])
  const [changeBudget, setChangeBudget] = useState<DgeBudgetRecord | null>(null)
  const [changePriorityId, setChangePriorityId] = useState('')
  const [changeClassificationId, setChangeClassificationId] = useState('')
  const [qualityCheckBudget, setQualityCheckBudget] = useState<DgeBudgetRecord | null>(null)
  const [clarificationBudget, setClarificationBudget] = useState<DgeBudgetRecord | null>(null)
  const [clarificationMessage, setClarificationMessage] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const rawFilter = searchParams.get('filter')
    const incomingFilter =
      rawFilter === 'clarification-pending'
        ? 'clarification-required'
        : (rawFilter as QueueFilterKey | null)
    if (incomingFilter && incomingFilter in FILTER_STATUS_MAP && incomingFilter !== filter) {
      setFilter(incomingFilter)
    }
  }, [filter, searchParams])

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
        const [portfolio, options] = await Promise.all([
          getDgePortfolioData(selectedCycle.id),
          getStrategicPriorityOptions(),
        ])

        if (!cancelled) {
          setBudgets(
            getCurrentSmeBudgets(portfolio, currentSme).filter((budget) =>
              SME_QUEUE_VISIBLE_STATUSES.has(budget.statuscode)
            )
          )
          setPriorityOptions(options)
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load SME review queue.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [currentSme?.strategicPriorityId, selectedCycle?.id])

  const refreshQueue = async () => {
    if (!selectedCycle?.id) return
    const portfolio = await getDgePortfolioData(selectedCycle.id)
    setBudgets(
      getCurrentSmeBudgets(portfolio, currentSme).filter((budget) =>
        SME_QUEUE_VISIBLE_STATUSES.has(budget.statuscode)
      )
    )
  }

  const entityOptions = useMemo(
    () => [
      'all',
      ...new Set(
        budgets
          .map((budget) => budget.entityName || budget.instanceName)
          .filter((value): value is string => Boolean(value))
      ),
    ],
    [budgets]
  )

  const priorityLookup = useMemo(
    () => new Map(priorityOptions.map((option) => [option.id, option.name])),
    [priorityOptions]
  )

  const smeAssignmentByPriority = useMemo(
    () => new Map(getStoredSmeAssignments().map((assignment) => [assignment.strategicPriorityId, assignment.teamName])),
    []
  )

  const tabs = useMemo(() => {
    const countByStatus = (statuscodes: number[]) =>
      budgets.filter((budget) => statuscodes.includes(budget.statuscode)).length
    const clarificationRequiredCount = budgets.filter(
      (budget) =>
        budget.statuscode === DGE_BUDGET_STATUS.clarificationPending &&
        budget.statusForAdge !== ICT_BUDGET_STATUS.clarificationPending
    ).length
    const clarificationRaisedCount = budgets.filter(
      (budget) =>
        budget.statuscode === DGE_BUDGET_STATUS.clarificationPending &&
        budget.statusForAdge === ICT_BUDGET_STATUS.clarificationPending
    ).length

    return [
      { key: 'all' as const, label: 'All', count: budgets.length },
      {
        key: 'under-sme-review' as const,
        label: 'Under SME Review',
        count: countByStatus([DGE_BUDGET_STATUS.underSmeReview]),
      },
      {
        key: 'change-under-review' as const,
        label: 'Strategic Priority Change Under Review',
        count: countByStatus([DGE_BUDGET_STATUS.strategicPriorityChangeUnderReview]),
      },
      {
        key: 'clarification-required' as const,
        label: 'Clarification Required',
        count: clarificationRequiredCount,
      },
      {
        key: 'clarification-raised' as const,
        label: 'Clarification Raised',
        count: clarificationRaisedCount,
      },
      {
        key: 'under-quality-check' as const,
        label: 'Under Quality Check',
        count: countByStatus([DGE_BUDGET_STATUS.underQualityCheck]),
      },
    ]
  }, [budgets])

  const filteredBudgets = useMemo(() => {
    const allowedStatuses = FILTER_STATUS_MAP[filter]
    return budgets.filter((budget) => {
      const matchesStatus = !allowedStatuses || allowedStatuses.includes(budget.statuscode)
      const matchesClarificationBucket =
        filter === 'clarification-required'
          ? budget.statuscode === DGE_BUDGET_STATUS.clarificationPending &&
            budget.statusForAdge !== ICT_BUDGET_STATUS.clarificationPending
          : filter === 'clarification-raised'
            ? budget.statuscode === DGE_BUDGET_STATUS.clarificationPending &&
              budget.statusForAdge === ICT_BUDGET_STATUS.clarificationPending
            : true
      const entityLabel = budget.entityName || budget.instanceName || ''
      const matchesEntity = entityFilter === 'all' || entityLabel === entityFilter
      const matchesSearch =
        !search.trim() ||
        [
          budget.budgetRefId,
          budget.name,
          budget.summary,
          entityLabel,
          budget.strategicPriorityName,
          budget.strategicPriorityClassificationName,
        ]
          .join(' ')
          .toLowerCase()
          .includes(search.toLowerCase())

      return matchesStatus && matchesClarificationBucket && matchesEntity && matchesSearch
    })
  }, [budgets, entityFilter, filter, search])

  const pagedBudgets = useMemo(() => {
    const startIndex = (page - 1) * PAGE_SIZE
    return filteredBudgets.slice(startIndex, startIndex + PAGE_SIZE)
  }, [filteredBudgets, page])

  const totalPages = Math.max(1, Math.ceil(filteredBudgets.length / PAGE_SIZE))

  useEffect(() => {
    setPage(1)
  }, [entityFilter, filter, search])

  const handleFilterChange = (nextFilter: QueueFilterKey) => {
    setFilter(nextFilter)
    setPage(1)
    const nextParams = new URLSearchParams(searchParams)
    if (nextFilter === 'all') {
      nextParams.delete('filter')
    } else {
      nextParams.set('filter', nextFilter)
    }
    setSearchParams(nextParams, { replace: true })
  }

  const changeClassificationOptions = useMemo(
    () => priorityOptions.filter((option) => option.parentId === changePriorityId),
    [changePriorityId, priorityOptions]
  )

  const openChangeRequestModal = (budget: DgeBudgetRecord) => {
    setChangeBudget(budget)
    setChangePriorityId(budget.strategicPriorityId ?? '')
    setChangeClassificationId(budget.strategicPriorityClassificationId ?? '')
  }

  const handleSubmitChangeRequest = async () => {
    if (!changeBudget || !changePriorityId || !changeClassificationId) return

    setSaving(true)
    setError(null)
    try {
      await runActionToast(
        async () => {
          await requestStrategicPriorityChange(changeBudget, changePriorityId, changeClassificationId)
          await refreshQueue()
          setChangeBudget(null)
        },
        {
          processingTitle: 'Submitting change request',
          processingDescription: 'Sending the strategic priority change back to Strategy Team for review...',
          successTitle: 'Change request submitted',
          successDescription: 'The project is now waiting for Strategy Team review.',
          errorTitle: 'Unable to submit change request',
          minDurationMs: 1400,
        }
      )
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Unable to submit change request.')
    } finally {
      setSaving(false)
    }
  }

  const handleRouteToQualityCheck = async () => {
    if (!qualityCheckBudget) return

    setSaving(true)
    setError(null)
    try {
      await runActionToast(
        async () => {
          await routeBudgetToQualityCheck(qualityCheckBudget)
          await refreshQueue()
          setQualityCheckBudget(null)
        },
        {
          processingTitle: 'Routing to quality check',
          processingDescription: 'Updating status and handing the project back to Strategy Team quality check...',
          successTitle: 'Project routed to quality check',
          successDescription: 'The project is now under quality check.',
          errorTitle: 'Unable to route to quality check',
          minDurationMs: 1400,
        }
      )
    } catch (actionError) {
    } finally {
      setSaving(false)
    }
  }

  const handleSubmitClarification = async () => {
    if (!clarificationBudget || !clarificationMessage.trim()) return

    setSaving(true)
    setError(null)
    try {
      await runActionToast(
        async () => {
          await raiseBudgetClarification({
            budgetId: clarificationBudget.id,
            message: clarificationMessage,
            raisedByRole: 'SME Team',
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

          await refreshQueue()
          setClarificationBudget(null)
          setClarificationMessage('')
        },
        {
          processingTitle: 'Raising clarification',
          processingDescription: 'Opening an external clarification thread for the ADGE Respondent...',
          successTitle: 'Clarification raised',
          successDescription: 'The project is now awaiting ADGE response.',
          errorTitle: 'Unable to raise clarification',
          minDurationMs: 1400,
        }
      )
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Unable to raise clarification.')
    } finally {
      setSaving(false)
    }
  }

  const prepareRouteToQualityCheck = async (budget: DgeBudgetRecord) => {
    try {
      await runActionToast(
        async () => {
          await validateBudgetReadyForQualityCheck(budget.id)
        },
        {
          processingTitle: 'Validating SME recommendation',
          processingDescription: 'Checking required recommendation fields before quality check routing...',
          successTitle: 'Validation complete',
          successDescription: 'This project is ready to be routed to quality check.',
          errorTitle: 'Unable to route to quality check',
          minDurationMs: 900,
        }
      )
      setQualityCheckBudget(budget)
    } catch {
      return
    }
  }

  const summaryCounts = useMemo(() => {
    const toReview = budgets.filter((budget) => budget.statuscode === DGE_BUDGET_STATUS.underSmeReview).length
    const changeReview = budgets.filter(
      (budget) => budget.statuscode === DGE_BUDGET_STATUS.strategicPriorityChangeUnderReview
    ).length
    const qualityCheck = budgets.filter((budget) => budget.statuscode === DGE_BUDGET_STATUS.underQualityCheck).length
    return { toReview, changeReview, qualityCheck }
  }, [budgets])

  const currentPriorityDisplay = changeBudget
    ? trimPriorityLabel(
        priorityLookup.get(changeBudget.strategicPriorityId ?? '') || changeBudget.strategicPriorityName
      )
    : '-'

  const currentClassificationDisplay = changeBudget
    ? trimPriorityLabel(
        priorityLookup.get(changeBudget.strategicPriorityClassificationId ?? '') ||
          changeBudget.strategicPriorityClassificationName
      )
    : '-'

  const currentTargetSmeDisplay = changeBudget
    ? smeAssignmentByPriority.get(changeBudget.strategicPriorityId ?? '') || currentSme?.teamName || '-'
    : currentSme?.teamName || '-'

  return (
    <StrategyPageShell
      eyebrow="ICT - SME Team"
      title="SME Review Queue"
      description="Review only the projects assigned to your strategic domain, request priority changes when needed, and route strong recommendations to quality check."
    >
      <div className="space-y-5">
        <section className="overflow-hidden rounded-[28px] border border-[#E9D5FF] bg-white dark:border-white/10 dark:bg-[#1E293B]">
          <button
            type="button"
            onClick={() => setSummaryExpanded((value) => !value)}
            className="flex w-full items-start justify-between gap-4 bg-gradient-to-b from-[#FDF7FF] to-white px-6 py-5 text-left transition-colors hover:bg-white/30 dark:from-[#2A123D] dark:to-[#1E293B] dark:hover:bg-white/5"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#A855F7] text-white shadow-[0_12px_24px_rgba(168,85,247,0.24)]">
                <Sparkles className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base font-semibold text-[#0F172A] dark:text-white">AI Review Summary</h2>
                  <span className="inline-flex rounded-full bg-[#F5EEFF] px-2.5 py-1 text-xs font-semibold text-[#A855F7] dark:bg-[#A855F7]/15 dark:text-[#E9D5FF]">
                    {currentSme?.teamName || 'SME Domain'}
                  </span>
                </div>
                <p className="mt-1 text-sm leading-6 text-[#475569] dark:text-slate-300">
                  {summaryCounts.toReview} projects still need SME review, {summaryCounts.changeReview} are waiting on strategic priority change approval, and {summaryCounts.qualityCheck} have already moved into quality check for this domain.
                </p>
              </div>
            </div>
            <ChevronDown className={cn('mt-1 h-5 w-5 shrink-0 text-[#64748B] transition-transform dark:text-slate-300', summaryExpanded && 'rotate-180')} />
          </button>

          {summaryExpanded ? (
            <div className="border-t border-[#E9D5FF] px-6 py-5 dark:border-white/10">
              <div className="grid gap-4 lg:grid-cols-3">
                <div className="rounded-[18px] border border-[#EAF0F6] bg-[#F8FBFF] p-4 dark:border-white/10 dark:bg-white/5">
                  <div className="flex items-center gap-2">
                    <Clock3 className="h-4 w-4 text-[#286CFF]" />
                    <p className="text-sm font-semibold text-[#0F172A] dark:text-white">Queue Pressure</p>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-[#475569] dark:text-slate-300">
                    Focus first on items under SME review so turnaround stays ahead of quality check routing.
                  </p>
                </div>
                <div className="rounded-[18px] border border-[#EAF0F6] bg-[#F8FBFF] p-4 dark:border-white/10 dark:bg-white/5">
                  <div className="flex items-center gap-2">
                    <Workflow className="h-4 w-4 text-[#A855F7]" />
                    <p className="text-sm font-semibold text-[#0F172A] dark:text-white">Change Requests</p>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-[#475569] dark:text-slate-300">
                    Projects asking for strategic priority change stay visible here until Strategy Team approves or rejects them.
                  </p>
                </div>
                <div className="rounded-[18px] border border-[#EAF0F6] bg-[#F8FBFF] p-4 dark:border-white/10 dark:bg-white/5">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#10B981]" />
                    <p className="text-sm font-semibold text-[#0F172A] dark:text-white">Quality Check Ready</p>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-[#475569] dark:text-slate-300">
                    Route high-confidence reviews to quality check once the strategic mapping and evidence are stable.
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </section>

        {error ? (
          <div className="rounded-[18px] border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#B91C1C] dark:border-[#7F1D1D] dark:bg-[#3A1717] dark:text-[#FCA5A5]">
            {error}
          </div>
        ) : null}

        {loading ? (
          <QueueSkeleton />
        ) : (
          <>
            <div className="rounded-[22px] border border-[#D9E6F5] bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#162339]">
              <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex flex-wrap gap-2">
                  {tabs.map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => handleFilterChange(tab.key)}
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                        filter === tab.key
                          ? 'bg-[var(--primary)] text-white'
                          : 'border border-[#E2E8F0] bg-white text-[#0F172A] hover:bg-[#F1F5F9] dark:border-white/10 dark:bg-[#1E293B] dark:text-white dark:hover:bg-white/5'
                      )}
                    >
                      {tab.label}
                      <span
                        className={cn(
                          'rounded-full px-1.5 py-0.5 text-xs font-bold',
                          filter === tab.key ? 'bg-white/20' : 'bg-[#F1F5F9] dark:bg-white/10'
                        )}
                      >
                        {tab.count}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="flex flex-1 flex-col gap-2 lg:flex-row xl:max-w-[620px] xl:justify-end">
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search by project, entity, or classification"
                    className="h-10 rounded-xl border-[#DDEBFF]"
                  />
                  <Select value={entityFilter} onValueChange={setEntityFilter}>
                    <SelectTrigger className="h-10 rounded-xl border-[#DDEBFF] lg:w-[260px]">
                      <div className="flex items-center gap-2">
                        <ScanSearch className="h-4 w-4 text-[#64748B]" />
                        <SelectValue placeholder="All Entities" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      {entityOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option === 'all' ? 'All Entities' : option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {pagedBudgets.length === 0 ? (
                <Card className="overflow-hidden rounded-[22px] border border-[#D9E6F5] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#162339]">
                  <CardContent className="flex flex-col items-center justify-center px-6 py-16 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#EEF5FF] text-[#286CFF] dark:bg-[#286CFF]/15 dark:text-[#BFDBFE]">
                      <FolderSearch className="h-6 w-6" />
                    </div>
                    <p className="mt-4 text-sm font-semibold text-[#0F172A] dark:text-white">No SME review projects found</p>
                    <p className="mt-1 max-w-lg text-sm leading-6 text-[#64748B] dark:text-slate-300">
                      No projects in the current SME domain matched the selected queue filter and search criteria.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                pagedBudgets.map((budget) => {
                  const entityLabel = budget.entityName || budget.instanceName || 'Unknown Entity'
                  const priorityLabel = trimPriorityLabel(budget.strategicPriorityName)
                  const classificationLabel = trimPriorityLabel(budget.strategicPriorityClassificationName)
                  const metaParts = [
                    entityLabel,
                    priorityLabel && priorityLabel !== '-' ? priorityLabel : null,
                    classificationLabel && classificationLabel !== '-' ? classificationLabel : null,
                  ].filter((value): value is string => Boolean(value))
                  const canRequestChange = budget.statuscode === DGE_BUDGET_STATUS.underSmeReview
                  const canRaiseClarification = budget.statuscode === DGE_BUDGET_STATUS.underSmeReview
                  const canRouteToQuality =
                    budget.statuscode === DGE_BUDGET_STATUS.underSmeReview ||
                    budget.statuscode === DGE_BUDGET_STATUS.clarificationPending

                  return (
                    <article
                      key={budget.id}
                      className="overflow-hidden rounded-[22px] border border-[#D9E6F5] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_34px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-[#162339]"
                    >
                      <div className="p-5">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono text-xs text-[#94A3B8]">{budget.budgetRefId}</span>
                              <StrategyPill
                                tone={
                                  budget.statuscode === DGE_BUDGET_STATUS.underQualityCheck
                                    ? 'amber'
                                    : budget.statuscode === DGE_BUDGET_STATUS.strategicPriorityChangeUnderReview
                                      ? 'violet'
                                      : 'blue'
                                }
                                className="whitespace-nowrap"
                              >
                                {budget.statusLabel}
                              </StrategyPill>
                            </div>

                            <h3 className="mt-2 text-xl font-bold text-[#0F172A] dark:text-white">{budget.name}</h3>
                            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[#64748B] dark:text-slate-300">
                              {metaParts.map((part, index) => (
                                <span
                                  key={`${budget.id}-${part}-${index}`}
                                  className={index === 0 ? undefined : 'text-[#0F172A] dark:text-white'}
                                >
                                  {index > 0 ? `• ${part}` : part}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="rounded-[18px] border border-[#DDEBFF] bg-[#F8FBFF] px-4 py-3 text-left dark:border-white/10 dark:bg-white/5 lg:min-w-[210px] lg:text-end">
                            <p className="text-xs font-semibold text-[#286CFF]">Requested Budget</p>
                            <CurrencyAmount amount={budget.requestedBudget} className="mt-1 text-xl font-bold text-[#0F172A] dark:text-white" iconSize={15} />
                          </div>
                        </div>

                        <div className="mt-4 grid gap-3 xl:grid-cols-[1.15fr_1fr_0.9fr]">
                          <div className="rounded-[18px] border border-[#DCE8F6] bg-[#F8FBFF] p-4 dark:border-white/10 dark:bg-white/5">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-[#286CFF]" />
                              <p className="text-sm font-semibold text-[#0F172A] dark:text-white">Project Summary</p>
                            </div>
                            <p className="mt-3 text-sm leading-6 text-[#475569] dark:text-slate-300">
                              {budget.summary || 'No project summary provided for this budget item.'}
                            </p>
                          </div>

                          <div className="overflow-hidden rounded-[18px] border border-[#E9D5FF] bg-white dark:border-white/10 dark:bg-[#1E293B]">
                            <div className="flex items-center gap-2 bg-gradient-to-b from-[#FDF7FF] to-white px-4 py-3 dark:from-[#2A123D] dark:to-[#1E293B]">
                              <Sparkles className="h-4 w-4 text-[#A855F7]" />
                              <span className="text-sm font-semibold text-[#0F172A] dark:text-white">AI Review Insight</span>
                            </div>
                            <div className="border-t border-[#E9D5FF] px-4 py-4 dark:border-white/10">
                              <p className="text-sm leading-6 text-[#475569] dark:text-slate-300">
                                {budget.statuscode === DGE_BUDGET_STATUS.strategicPriorityChangeUnderReview
                                  ? 'This project is waiting for Strategy Team to review the requested strategic priority change before SME review can resume.'
                                  : budget.statuscode === DGE_BUDGET_STATUS.underQualityCheck
                                    ? 'The project has left SME review and is now in quality check, but remains visible here as part of your domain throughput.'
                                    : `${trimPriorityLabel(budget.strategicPriorityName)} remains the active SME lane. Review the evidence, confirm the classification, and route only stable items to quality check.`}
                              </p>
                            </div>
                          </div>

                          <div className="rounded-[18px] border border-[#DCE8F6] bg-white p-4 dark:border-white/10 dark:bg-[#1B2A41]">
                            <p className="text-sm font-semibold text-[#0F172A] dark:text-white">Review Signals</p>
                            <div className="mt-3 space-y-2 text-sm text-[#475569] dark:text-slate-300">
                              <div className="flex items-center justify-between gap-3">
                                <span>Target SME</span>
                                <span className="font-medium text-[#0F172A] dark:text-white">{smeAssignmentByPriority.get(budget.strategicPriorityId ?? '') || currentSme?.teamName || '-'}</span>
                              </div>
                              <div className="flex items-center justify-between gap-3">
                                <span>Confidence</span>
                                <span className="font-medium text-[#0F172A] dark:text-white">
                                  {budget.aiConfidenceScore !== null ? `${budget.aiConfidenceScore}%` : 'N/A'}
                                </span>
                              </div>
                              <div className="flex items-center justify-between gap-3">
                                <span>Documents</span>
                                <span className="font-medium text-[#0F172A] dark:text-white">{budget.sharePointUrl ? 'Linked' : 'Missing'}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-col gap-2 border-t border-[#EEF3F8] pt-4 dark:border-white/10 sm:flex-row sm:flex-wrap sm:justify-end">
                          <Button variant="outline" size="sm" className="h-9 rounded-lg px-3" asChild>
                            <Link to={`/sme-team/reviews/${budget.id}`}>
                              <Eye className="mr-1 h-4 w-4" />
                              View Details
                            </Link>
                          </Button>

                          {canRequestChange ? (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-9 rounded-lg border-blue-300 px-3 text-blue-700 hover:border-[#043DFF] hover:bg-blue-100 hover:text-[#043DFF]"
                              onClick={() => openChangeRequestModal(budget)}
                            >
                              <Layers className="mr-1 h-4 w-4" />
                              Request Strategic Priority Change
                            </Button>
                          ) : null}

                          {canRaiseClarification ? (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-9 rounded-lg border-[#D7E4F4] px-3 text-[#286CFF] hover:bg-[#EEF5FF]"
                              onClick={() => {
                                setClarificationBudget(budget)
                                setClarificationMessage('')
                              }}
                            >
                              <MessageSquareDot className="mr-1 h-4 w-4" />
                              Raise Clarification
                            </Button>
                          ) : null}

                          {canRouteToQuality ? (
                            <Button
                              type="button"
                              size="sm"
                              className="h-9 rounded-lg bg-blue-600 px-3 text-white hover:bg-blue-700"
                              onClick={() => void prepareRouteToQualityCheck(budget)}
                            >
                              <ArrowRight className="mr-1 h-4 w-4" />
                              Route to Quality Check
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    </article>
                  )
                })
              )}
            </div>

            <div className="flex flex-col gap-3 rounded-[22px] border border-[#D9E6F5] bg-white px-4 py-3 shadow-[0_12px_30px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#162339] sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-[#64748B] dark:text-slate-300">
                Showing {(page - 1) * PAGE_SIZE + (pagedBudgets.length ? 1 : 0)}-{(page - 1) * PAGE_SIZE + pagedBudgets.length} of {filteredBudgets.length} projects
              </p>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 rounded-lg px-3"
                  disabled={page <= 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  Previous
                </Button>
                <span className="text-sm font-medium text-[#0F172A] dark:text-white">
                  {page} / {totalPages}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 rounded-lg px-3"
                  disabled={page >= totalPages}
                  onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      <Dialog open={Boolean(changeBudget)} onOpenChange={(open) => !open && setChangeBudget(null)}>
        <DialogContent className="max-w-4xl overflow-hidden rounded-[30px] border border-[#D9E6F5] bg-white p-0 shadow-[0_28px_70px_rgba(15,23,42,0.18)] dark:border-white/10 dark:bg-[#162339]">
          <div className="border-b border-[#EEF3F8] bg-[linear-gradient(180deg,#F8FBFF_0%,#FFFFFF_100%)] px-7 py-6 dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.04)_0%,rgba(255,255,255,0.02)_100%)]">
            <DialogHeader className="space-y-0">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#286CFF_0%,#4F98FF_100%)] text-white shadow-[0_14px_28px_rgba(40,108,255,0.18)]">
                  <Workflow className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <DialogTitle className="text-xl font-semibold text-[#0F172A] dark:text-white">Request Strategic Priority Change</DialogTitle>
                  <DialogDescription className="mt-1 text-sm leading-6 text-[#64748B] dark:text-slate-300">
                    Submit a revised strategic priority and classification to Strategy Team without changing the current live mapping yet.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
          </div>

          {changeBudget ? (
            <div className="max-h-[70vh] overflow-y-auto px-7 py-6">
              <div className="rounded-[22px] border border-[#DCE8F6] bg-[#F8FBFF] p-5 dark:border-white/10 dark:bg-white/5">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-base font-semibold text-[#0F172A] dark:text-white">{changeBudget.name}</p>
                  <span className="rounded-full bg-[#EEF5FF] px-2.5 py-1 text-xs font-semibold text-[#286CFF] dark:bg-[#286CFF]/15 dark:text-[#BFDBFE]">
                    {changeBudget.budgetRefId}
                  </span>
                </div>
                <p className="mt-1 text-sm text-[#64748B] dark:text-slate-300">
                  {changeBudget.entityName || changeBudget.instanceName || 'Unknown Entity'}
                </p>

                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  <div className="rounded-[18px] border border-[#DCE8F6] bg-white p-4 dark:border-white/10 dark:bg-[#1B2A41]">
                    <p className="text-sm font-semibold text-[#0F172A] dark:text-white">Current Strategic Priority</p>
                    <p className="mt-2 text-sm text-[#475569] dark:text-slate-300">
                      {currentPriorityDisplay}
                    </p>
                    <p className="mt-3 text-sm font-semibold text-[#0F172A] dark:text-white">Current Classification</p>
                    <p className="mt-2 text-sm text-[#475569] dark:text-slate-300">
                      {currentClassificationDisplay}
                    </p>
                    <p className="mt-3 text-sm font-semibold text-[#0F172A] dark:text-white">Target SME</p>
                    <p className="mt-2 text-sm text-[#475569] dark:text-slate-300">
                      {currentTargetSmeDisplay}
                    </p>
                  </div>

                  <div className="overflow-hidden rounded-[18px] border border-[#E9D5FF] bg-white dark:border-white/10 dark:bg-[#1E293B]">
                    <div className="flex items-center gap-2 bg-gradient-to-b from-[#FDF7FF] to-white px-4 py-3 dark:from-[#2A123D] dark:to-[#1E293B]">
                      <Sparkles className="h-4 w-4 text-[#A855F7]" />
                      <span className="text-sm font-semibold text-[#0F172A] dark:text-white">AI Review Note</span>
                    </div>
                    <div className="border-t border-[#E9D5FF] px-4 py-4 dark:border-white/10">
                      <p className="text-sm leading-6 text-[#475569] dark:text-slate-300">
                        Use this only when the project clearly belongs to a different strategic lane or classification than the currently assigned one.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 lg:grid-cols-2">
                  <div>
                    <p className="mb-2 text-sm font-semibold text-[#0F172A] dark:text-white">Requested Strategic Priority</p>
                    <Select
                      value={changePriorityId}
                      onValueChange={(value) => {
                        setChangePriorityId(value)
                        setChangeClassificationId('')
                      }}
                    >
                      <SelectTrigger className="h-12 rounded-[14px] border-[#D7E4F4] bg-white px-4 dark:border-white/10 dark:bg-white/5">
                        <div className="flex items-center gap-2 text-left">
                          <Layers className="h-4 w-4 text-[#286CFF]" />
                          <SelectValue placeholder="Select strategic priority" />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        {priorityOptions
                          .filter((option) => !option.parentId)
                          .map((option) => (
                            <SelectItem key={option.id} value={option.id}>
                              {option.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <p className="mb-2 text-sm font-semibold text-[#0F172A] dark:text-white">Requested Classification</p>
                    <Select value={changeClassificationId} onValueChange={setChangeClassificationId}>
                      <SelectTrigger className="h-12 rounded-[14px] border-[#D7E4F4] bg-white px-4 dark:border-white/10 dark:bg-white/5">
                        <div className="flex items-center gap-2 text-left">
                          <Workflow className="h-4 w-4 text-[#286CFF]" />
                          <SelectValue placeholder="Select classification" />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        {changeClassificationOptions.map((option) => (
                          <SelectItem key={option.id} value={option.id}>
                            {option.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          <DialogFooter className="border-t border-[#EEF3F8] px-6 pb-6 pt-4 dark:border-white/10">
            <Button variant="outline" className="rounded-2xl border-[#D7E4F4] text-[#286CFF]" onClick={() => setChangeBudget(null)}>
              Cancel
            </Button>
            <Button
              className="rounded-2xl bg-[#286CFF] text-white hover:bg-[#0C65F5]"
              disabled={saving || !changePriorityId || !changeClassificationId}
              onClick={() => void handleSubmitChangeRequest()}
            >
              Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmationModal
        open={Boolean(qualityCheckBudget)}
        onOpenChange={(open) => !open && setQualityCheckBudget(null)}
        title="Route to Quality Check?"
        description="This will move the selected project to Under Quality Check, assign it to Strategy Team, and keep SME visibility for the domain reviewer."
        confirmLabel="Route to Quality Check"
        onConfirm={() => void handleRouteToQualityCheck()}
        tone="primary"
      />

      <Dialog open={Boolean(clarificationBudget)} onOpenChange={(open) => !open && setClarificationBudget(null)}>
        <DialogContent className="max-w-[620px] overflow-hidden rounded-[28px] border border-[#D9E6F5] bg-white p-0 dark:border-white/10 dark:bg-[#162339]">
          <div className="border-b border-[#EEF3F8] bg-white px-6 py-5 dark:border-white/10 dark:bg-[#162339]">
            <DialogHeader>
              <DialogTitle>Raise Clarification</DialogTitle>
              <DialogDescription>Send an external clarification request to the ADGE Respondent.</DialogDescription>
            </DialogHeader>
          </div>
          <div className="space-y-4 px-6 py-5">
            {clarificationBudget ? (
              <div className="rounded-[18px] border border-[#DDEBFF] bg-[#F8FBFF] px-4 py-3 dark:border-white/10 dark:bg-white/5">
                <p className="text-sm font-semibold text-[#0F172A] dark:text-white">{clarificationBudget.name}</p>
                <p className="mt-1 text-xs text-[#64748B] dark:text-slate-300">
                  {clarificationBudget.budgetRefId} · {clarificationBudget.entityName || clarificationBudget.instanceName || 'Unknown Entity'}
                </p>
              </div>
            ) : null}
            <Textarea
              value={clarificationMessage}
              onChange={(event) => setClarificationMessage(event.target.value)}
              placeholder="Describe what the ADGE Respondent needs to clarify..."
              className="min-h-[140px] rounded-2xl border-[#D7E4F4]"
            />
          </div>
          <DialogFooter className="border-t border-[#EEF3F8] px-6 py-4 dark:border-white/10">
            <Button variant="outline" className="rounded-2xl" onClick={() => setClarificationBudget(null)}>
              Cancel
            </Button>
            <Button
              className="rounded-2xl bg-[#286CFF] text-white hover:bg-[#0C65F5]"
              onClick={() => void handleSubmitClarification()}
              disabled={!clarificationMessage.trim() || saving}
            >
              Raise Clarification
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </StrategyPageShell>
  )
}
