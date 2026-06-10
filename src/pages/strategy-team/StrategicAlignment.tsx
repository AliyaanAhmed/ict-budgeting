import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  ArrowRightLeft,
  Building2,
  CheckCircle2,
  CheckSquare,
  ChevronDown,
  CircleAlert,
  FolderSearch,
  Layers,
  Sparkles,
  Workflow,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ConfirmationModal } from '@/components/shared/ConfirmationModal'
import { cn } from '@/lib/utils'
import { useCycle } from '@/context/CycleContext'
import { useToast } from '@/context/ToastContext'
import { StrategyPageShell, StrategyPill } from './StrategyTeamShell'
import {
  DGE_BUDGET_STATUS,
  getDgePortfolioData,
  getStrategyAlignmentBudgets,
  type DgeBudgetRecord,
} from '@/services/dgePortfolioService'
import {
  reviewStrategicPriorityChange,
  sendBudgetsToSme,
  updateBudgetStrategicClassification,
} from '@/services/dgeWorkflowService'
import { getStrategicPriorityOptions, type StrategicPriorityOption } from '@/services/strategicPriorityService'
import { getStoredSmeAssignments } from '@/services/dgeRoleContextService'

function AssistantSummary() {
  const [open, setOpen] = useState(false)
  const sections = [
    {
      title: 'Priority Mismatch',
      icon: CircleAlert,
      items: [
        '18 projects likely mapped to wrong strategic priority',
        'DoH has highest cluster: 5 projects',
        'Cybersecurity most common correct priority',
      ],
    },
    {
      title: 'Classification Issues',
      icon: Layers,
      items: [
        '12 projects have weak or broad classification',
        '"Platform Modernization" used too broadly in 4 cases',
        '5 "Enterprise Systems" likely should be "Core Systems"',
      ],
    },
    {
      title: 'Routing Impact',
      icon: Workflow,
      items: [
        '6 projects likely routed to wrong SME team',
        '4 Security projects incorrectly going to Infrastructure Team',
        '2 Data & AI projects misrouted to Innovation Team',
      ],
    },
    {
      title: 'Clarification Likelihood',
      icon: Sparkles,
      items: [
        '9 projects likely need clarification before SME review',
        '3 have weak descriptions, 4 have unclear scope',
        '2 have insufficient supporting evidence',
      ],
    },
  ] as const

  return (
    <section className="overflow-hidden rounded-[28px] border border-[#E9D5FF] bg-white dark:border-white/10 dark:bg-[#1E293B]">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-start justify-between gap-4 bg-gradient-to-b from-[#FDF7FF] to-white px-6 py-5 text-left transition-colors hover:bg-white/30 dark:from-[#2A123D] dark:to-[#1E293B] dark:hover:bg-white/5"
      >
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#A855F7] text-white shadow-[0_12px_24px_rgba(168,85,247,0.24)]">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-[16px] font-semibold text-[#0F172A] dark:text-white">AI Strategic Alignment Assistant</h2>
              <span className="rounded-full bg-[#FDF8FF] px-2.5 py-1 text-[11px] font-semibold text-[#A855F7] dark:bg-[#A855F7]/15 dark:text-[#E9D5FF]">
                Action Required
              </span>
            </div>
            <p className="mt-1 text-sm text-[#475569] dark:text-slate-300">
              Focus first on projects with likely priority mismatch, broad classification, and wrong SME routing before they move deeper into DGE review.
            </p>
          </div>
        </div>
        <ChevronDown className={cn('mt-1 h-4 w-4 text-[#94A3B8] transition-transform dark:text-slate-400', open && 'rotate-180')} />
      </button>

      {open ? (
        <div className="border-t border-[#E9D5FF] px-6 py-5 dark:border-white/10">
          <div className="grid gap-4 lg:grid-cols-2">
            {sections.map((section) => {
              const Icon = section.icon
              return (
                <div key={section.title} className="rounded-[18px] border border-[#EAF0F6] bg-[#F8FBFF] p-4 dark:border-white/10 dark:bg-white/5">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F5EEFF] text-[#A855F7] dark:bg-[#A855F7]/15 dark:text-[#E9D5FF]">
                      <Icon className="h-4 w-4" />
                    </div>
                    <p className="text-sm font-semibold text-[#0F172A] dark:text-white">{section.title}</p>
                  </div>
                  <ul className="mt-3 space-y-2 text-sm leading-6 text-[#64748B] dark:text-slate-300">
                    {section.items.map((item) => (
                      <li key={item} className="flex gap-2">
                        <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#A855F7]" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>
        </div>
      ) : null}
    </section>
  )
}

function SkeletonBlock({ className }: { className: string }) {
  return <div className={cn('animate-pulse rounded-2xl bg-[#EAF0F6] dark:bg-white/10', className)} />
}

function StrategicAlignmentSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[300px_minmax(0,1fr)]">
      <aside className="space-y-4">
        <Card className="overflow-hidden rounded-[22px] border-[#D9E6F5] bg-white dark:border-white/10 dark:bg-[#162339]">
          <CardContent className="space-y-4 p-4">
            <SkeletonBlock className="h-5 w-20" />
            <SkeletonBlock className="h-10 w-full rounded-[12px]" />
            <div className="space-y-2">
              <SkeletonBlock className="h-4 w-32" />
              {Array.from({ length: 5 }).map((_, index) => (
                <SkeletonBlock key={index} className="h-12 w-full rounded-2xl" />
              ))}
            </div>
            <SkeletonBlock className="h-11 w-full rounded-[10px]" />
            <SkeletonBlock className="h-11 w-full rounded-[10px]" />
          </CardContent>
        </Card>
      </aside>
      <section className="space-y-5">
        <Card className="overflow-hidden rounded-[22px] border-[#D9E6F5] bg-white dark:border-white/10 dark:bg-[#162339]">
          <CardContent className="p-5">
            <div className="flex items-center justify-between gap-3 border-b border-[#EEF3F8] pb-4 dark:border-white/10">
              <SkeletonBlock className="h-5 w-36" />
              <div className="flex gap-2">
                <SkeletonBlock className="h-9 w-40 rounded-lg" />
                <SkeletonBlock className="h-9 w-32 rounded-lg" />
              </div>
            </div>
            <div className="mt-5 overflow-hidden rounded-[12px] border border-[#DCE6F6] dark:border-white/10">
              <SkeletonBlock className="h-12 w-full rounded-none" />
              <div className="space-y-3 p-4">
                {Array.from({ length: 5 }).map((_, index) => (
                  <SkeletonBlock key={index} className="h-18 w-full rounded-[12px]" />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

const STATUS_FILTER_OPTIONS = [
  'All',
  'Under Strategic Alignment Review',
  'Under SME Review',
  'Strategic Priority Change Under Review',
  'Under Quality Check',
] as const

const PRIORITY_ALL_KEY = '__all__'

interface ProjectClassificationDraft {
  priorityId: string
  classificationId: string
}

function trimPriorityLabel(value: string | null | undefined) {
  if (!value) return ''
  return value.split(' - ')[0]?.trim() || value
}

export default function StrategicAlignment() {
  const { selectedCycle } = useCycle()
  const [search, setSearch] = useState('')
  const [priorityFilter, setPriorityFilter] = useState<string>(PRIORITY_ALL_KEY)
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTER_OPTIONS)[number]>('All')
  const [entityFilter, setEntityFilter] = useState<string>('All')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [classificationModalOpen, setClassificationModalOpen] = useState(false)
  const [changeRequestModalOpen, setChangeRequestModalOpen] = useState(false)
  const [pendingSendToSme, setPendingSendToSme] = useState<string[] | null>(null)
  const [priorities, setPriorities] = useState<StrategicPriorityOption[]>([])
  const [classificationDrafts, setClassificationDrafts] = useState<Record<string, ProjectClassificationDraft>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [budgets, setBudgets] = useState<DgeBudgetRecord[]>([])
  const { runActionToast } = useToast()

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
        const [portfolio, strategicPriorityOptions] = await Promise.all([
          getDgePortfolioData(selectedCycle.id),
          getStrategicPriorityOptions(),
        ])

        if (!cancelled) {
          setBudgets(getStrategyAlignmentBudgets(portfolio))
          setPriorities(strategicPriorityOptions)
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load strategic alignment data.')
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

  const parentPriorities = useMemo(() => priorities.filter((option) => !option.parentId), [priorities])
  const priorityLookup = useMemo(() => new Map(priorities.map((option) => [option.id, option.name])), [priorities])
  const smeAssignmentByPriorityLookup = useMemo(
    () => new Map(getStoredSmeAssignments().map((assignment) => [assignment.strategicPriorityId, assignment.teamName])),
    []
  )
  const smeAssignmentLookup = useMemo(
    () => new Map(getStoredSmeAssignments().map((assignment) => [assignment.teamId, assignment.teamName])),
    []
  )
  const entityOptions = useMemo(
    () => ['All', ...new Set(budgets.map((budget) => budget.entityName || budget.instanceName).filter((name): name is string => Boolean(name)))],
    [budgets]
  )

  const priorityCounts = useMemo(() => {
    const base = budgets.filter((budget) => {
      const matchesEntity = entityFilter === 'All' || (budget.entityName || budget.instanceName) === entityFilter
      const matchesStatus = statusFilter === 'All' || budget.statusLabel === statusFilter
      const matchesSearch =
        !search.trim() ||
        [
          budget.budgetRefId,
          budget.name,
          budget.entityName,
          budget.instanceName,
          budget.strategicPriorityName,
          budget.strategicPriorityClassificationName,
        ]
          .join(' ')
          .toLowerCase()
          .includes(search.toLowerCase())
      return matchesEntity && matchesStatus && matchesSearch
    })

    return [
      { key: PRIORITY_ALL_KEY, label: 'All', count: base.length },
      ...parentPriorities.map((option) => ({
        key: option.id,
        label: trimPriorityLabel(option.name),
        count: base.filter((budget) => budget.strategicPriorityId === option.id).length,
      })),
    ]
  }, [budgets, entityFilter, parentPriorities, search, statusFilter])

  const filteredBudgets = useMemo(() => {
    return budgets.filter((budget) => {
      const matchesSearch =
        !search.trim() ||
        [
          budget.budgetRefId,
          budget.name,
          budget.entityName,
          budget.instanceName,
          budget.strategicPriorityName,
          budget.strategicPriorityClassificationName,
          budget.smeReviewerTeamName,
        ]
          .join(' ')
          .toLowerCase()
          .includes(search.toLowerCase())

      const matchesPriority = priorityFilter === PRIORITY_ALL_KEY || budget.strategicPriorityId === priorityFilter
      const matchesStatus = statusFilter === 'All' || budget.statusLabel === statusFilter
      const matchesEntity = entityFilter === 'All' || (budget.entityName || budget.instanceName) === entityFilter
      return matchesSearch && matchesPriority && matchesStatus && matchesEntity
    })
  }, [budgets, entityFilter, priorityFilter, search, statusFilter])

  const selectedBudgets = useMemo(() => budgets.filter((budget) => selectedIds.includes(budget.id)), [budgets, selectedIds])

  const selectedStatusCodes = [...new Set(selectedBudgets.map((budget) => budget.statuscode))]
  const canShowAlignmentActions =
    selectedBudgets.length > 0 &&
    selectedStatusCodes.length === 1 &&
    selectedStatusCodes[0] === DGE_BUDGET_STATUS.underStrategicAlignmentReview

  const selectedChangeRequestBudget =
    selectedBudgets.length === 1 &&
    selectedBudgets[0].statuscode === DGE_BUDGET_STATUS.strategicPriorityChangeUnderReview
      ? selectedBudgets[0]
      : null

  const openClassificationModal = () => {
    if (!selectedBudgets.length) return
    setClassificationDrafts(
      Object.fromEntries(
        selectedBudgets.map((budget) => [
          budget.id,
          {
            priorityId: budget.strategicPriorityId ?? '',
            classificationId: budget.strategicPriorityClassificationId ?? '',
          },
        ])
      )
    )
    setClassificationModalOpen(true)
  }

  const refreshData = async () => {
    if (!selectedCycle?.id) return
    const portfolio = await getDgePortfolioData(selectedCycle.id)
    setBudgets(getStrategyAlignmentBudgets(portfolio))
  }

  const handleApplyClassification = async () => {
    const validDraftEntries = selectedBudgets
      .map((budget) => ({
        budget,
        draft: classificationDrafts[budget.id],
      }))
      .filter((entry) => entry.draft?.priorityId && entry.draft?.classificationId)

    if (!validDraftEntries.length) return

    setSaving(true)
    setError(null)
    try {
      await Promise.all(
        validDraftEntries.map(({ budget, draft }) =>
          updateBudgetStrategicClassification([budget.id], draft.priorityId, draft.classificationId)
        )
      )
      await refreshData()
      setClassificationModalOpen(false)
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Unable to update classification.')
    } finally {
      setSaving(false)
    }
  }

  const handleSendToSme = async () => {
    if (!canShowAlignmentActions) return
    setError(null)
    const budgetsToSend = pendingSendToSme
      ? selectedBudgets.filter((budget) => pendingSendToSme.includes(budget.id))
      : selectedBudgets
    if (!budgetsToSend.length) return

    setSaving(true)
    try {
      await runActionToast(
        async () => {
          await sendBudgetsToSme(budgetsToSend)
          await refreshData()
          setSelectedIds((current) => current.filter((id) => !budgetsToSend.some((budget) => budget.id === id)))
        },
        {
          processingTitle: 'Sending to SME',
          processingDescription: `Routing ${budgetsToSend.length} project${budgetsToSend.length === 1 ? '' : 's'} to the mapped SME team...`,
          successTitle: 'Projects sent to SME',
          successDescription: `${budgetsToSend.length} project${budgetsToSend.length === 1 ? '' : 's'} routed successfully.`,
          errorTitle: 'Unable to send to SME',
          minDurationMs: 1400,
        }
      )
      setPendingSendToSme(null)
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Unable to send projects to SME.')
    } finally {
      setSaving(false)
    }
  }

  const handleReviewChangeRequest = async (decision: 'approve' | 'reject') => {
    if (!selectedChangeRequestBudget) return
    setSaving(true)
    setError(null)
    try {
      await runActionToast(
        async () => {
          await reviewStrategicPriorityChange(selectedChangeRequestBudget, decision)
          await refreshData()
          setChangeRequestModalOpen(false)
          setSelectedIds([])
        },
        {
          processingTitle: decision === 'approve' ? 'Approving requested change' : 'Rejecting requested change',
          processingDescription:
            decision === 'approve'
              ? 'Updating the project mapping and routing it back to the correct SME team...'
              : 'Clearing the requested change and returning the project to SME review...',
          successTitle: decision === 'approve' ? 'Change approved' : 'Change rejected',
          successDescription:
            decision === 'approve'
              ? 'The new strategic priority mapping is now active.'
              : 'The requested change was cleared and the project was returned to SME review.',
          errorTitle: 'Unable to process strategic change review',
          minDurationMs: 1400,
        }
      )
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Unable to process the strategic priority change request.')
    } finally {
      setSaving(false)
    }
  }

  const toggleSelected = (id: string) => {
    setSelectedIds((current) => (current.includes(id) ? current.filter((value) => value !== id) : [...current, id]))
  }

  const modalProjects = useMemo(
    () =>
      selectedBudgets.map((budget) => {
        const draft = classificationDrafts[budget.id] ?? {
          priorityId: budget.strategicPriorityId ?? '',
          classificationId: budget.strategicPriorityClassificationId ?? '',
        }

        const classificationOptions = priorities.filter((option) => option.parentId === draft.priorityId)

        return {
          budget,
          draft,
          classificationOptions,
          priorityName:
            parentPriorities.find((option) => option.id === draft.priorityId)?.name ||
            priorityLookup.get(draft.priorityId) ||
            'Not selected',
          classificationName:
            classificationOptions.find((option) => option.id === draft.classificationId)?.name ||
            priorityLookup.get(draft.classificationId) ||
            'Not selected',
        }
      }),
    [classificationDrafts, parentPriorities, priorities, priorityLookup, selectedBudgets]
  )

  const readyProjectCount = modalProjects.filter(
    (project) => project.draft.priorityId && project.draft.classificationId
  ).length

  const selectedChangeRequestDetails = selectedChangeRequestBudget
    ? {
        currentPriority:
          trimPriorityLabel(
            priorityLookup.get(selectedChangeRequestBudget.strategicPriorityId ?? '') ||
              selectedChangeRequestBudget.strategicPriorityName
          ) || '-',
        currentClassification:
          trimPriorityLabel(
            priorityLookup.get(selectedChangeRequestBudget.strategicPriorityClassificationId ?? '') ||
              selectedChangeRequestBudget.strategicPriorityClassificationName
          ) || '-',
        requestedPriority:
          trimPriorityLabel(
            priorityLookup.get(selectedChangeRequestBudget.previousStrategicPriorityId ?? '') ||
              selectedChangeRequestBudget.previousStrategicPriorityName
          ) || '-',
        requestedClassification:
          trimPriorityLabel(
            priorityLookup.get(selectedChangeRequestBudget.previousStrategicPriorityClassificationId ?? '') ||
              selectedChangeRequestBudget.previousStrategicPriorityClassificationName
          ) || '-',
      }
    : null

  return (
    <StrategyPageShell
      eyebrow="ICT - Strategy Team"
      title="Strategic Alignment"
      description="Review submitted projects against strategic priorities. Identify misalignment, duplicates, and projects requiring follow-up."
    >
      <section className="space-y-5">
        <AssistantSummary />
        {error ? (
          <div className="rounded-[18px] border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#B91C1C] dark:border-[#7F1D1D] dark:bg-[#3A1717] dark:text-[#FCA5A5]">
            {error}
          </div>
        ) : null}
      </section>

      {loading ? (
        <StrategicAlignmentSkeleton />
      ) : (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[300px_minmax(0,1fr)]">
          <aside className="space-y-4">
            <Card className="overflow-hidden rounded-[22px] border-[#D9E6F5] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#162339]">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-[#286CFF]" />
                  <p className="text-sm font-semibold text-[#0F172A] dark:text-white">Filters</p>
                </div>

                <div className="mt-4 space-y-4">
                  <div className="w-full rounded-[12px] border border-[#D7E4F4] bg-[#F8FBFF] px-3 dark:border-white/10 dark:bg-white/5">
                    <Input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search project, entity, priority, or classification"
                      className="h-10 w-full border-0 bg-transparent px-0 text-[#0F172A] shadow-none placeholder:text-[#94A3B8] focus-visible:ring-0 dark:text-white"
                    />
                  </div>

                  <div>
                    <p className="mb-3 text-sm font-semibold text-[#64748B] dark:text-slate-300">Strategic Priority</p>
                    <div className="space-y-1.5">
                      {priorityCounts.map((option) => {
                        const active = priorityFilter === option.key
                        return (
                          <button
                            key={option.key}
                            type="button"
                            onClick={() => setPriorityFilter(option.key)}
                            className={cn(
                              'flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left transition-colors',
                              active
                                ? 'bg-[#286CFF] text-white dark:bg-[#286CFF] dark:text-white'
                                : 'bg-white text-[#0F172A] hover:bg-[#F8FBFF] dark:bg-white/5 dark:text-white dark:hover:bg-white/10'
                            )}
                          >
                            <span className="text-sm font-medium">{option.label === 'All' ? 'All Priorities' : option.label}</span>
                            <span className={cn('text-sm', active ? 'text-white/90' : 'text-[#64748B] dark:text-slate-300')}>
                              {option.count}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 text-sm font-semibold text-[#64748B] dark:text-slate-300">Entity</p>
                    <Select value={entityFilter} onValueChange={setEntityFilter}>
                      <SelectTrigger className="h-11 rounded-[10px] border-[#D7E4F4] bg-white dark:border-white/10 dark:bg-white/5">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-[#286CFF]" />
                          <SelectValue placeholder="Entity" />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        {entityOptions.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option === 'All' ? 'All Entities' : option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <p className="mb-2 text-sm font-semibold text-[#64748B] dark:text-slate-300">Status</p>
                    <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as (typeof STATUS_FILTER_OPTIONS)[number])}>
                      <SelectTrigger className="h-11 rounded-[10px] border-[#D7E4F4] bg-white dark:border-white/10 dark:bg-white/5">
                        <div className="flex items-center gap-2">
                          <Workflow className="h-4 w-4 text-[#286CFF]" />
                          <SelectValue placeholder="Status" />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_FILTER_OPTIONS.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option === 'All' ? 'All Statuses' : option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </aside>

          <section className="space-y-5">
            <Card className="h-full overflow-hidden rounded-[22px] border-[#D9E6F5] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#162339]">
              <CardContent className="p-5">
                <div className="flex flex-col gap-3 border-b border-[#EEF3F8] pb-4 dark:border-white/10 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#286CFF]" />
                    <span className="text-sm font-medium text-[#286CFF] dark:text-[#93C5FD]">
                      {selectedBudgets.length} projects selected
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {canShowAlignmentActions ? (
                      <>
                        <Button
                          type="button"
                          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-blue-300 bg-white px-3 text-sm font-medium text-blue-700 transition-colors duration-150 hover:border-[#043DFF] hover:bg-blue-100 hover:text-[#043DFF] active:bg-[#D3EDFF] disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-transparent dark:text-white dark:hover:bg-white/5"
                          disabled={saving || selectedBudgets.length === 0}
                          onClick={openClassificationModal}
                        >
                          <Layers className="mr-1 h-4 w-4" />
                          Update Classification
                        </Button>
                        <Button
                          type="button"
                          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-transparent bg-blue-600 px-3 text-sm font-medium text-white transition-colors duration-150 hover:bg-blue-700 active:bg-[#003CFF] disabled:cursor-not-allowed disabled:opacity-50"
                          disabled={saving || selectedBudgets.length === 0}
                          onClick={() => setPendingSendToSme(selectedBudgets.map((budget) => budget.id))}
                        >
                          <Workflow className="mr-1 h-4 w-4" />
                          Send to SME
                        </Button>
                      </>
                    ) : null}

                    {selectedChangeRequestBudget ? (
                      <Button
                        type="button"
                        className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-transparent bg-blue-600 px-3 text-sm font-medium text-white transition-colors duration-150 hover:bg-blue-700 active:bg-[#003CFF] disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={saving}
                        onClick={() => setChangeRequestModalOpen(true)}
                      >
                        <ArrowRight className="mr-1 h-4 w-4" />
                        View Request Change
                      </Button>
                    ) : null}
                  </div>
                </div>

                <div className="mt-5 overflow-x-auto rounded-[12px] border border-[#DCE6F6] bg-white dark:border-white/10 dark:bg-[#1B2A41]">
                <div className="grid min-w-[1280px] grid-cols-[44px_minmax(250px,1.75fr)_minmax(180px,1.1fr)_minmax(220px,1.35fr)_minmax(230px,1.2fr)_minmax(180px,1fr)_minmax(150px,0.9fr)] gap-5 border-b border-[#EEF3F8] px-5 py-3 text-sm font-semibold text-[#0F172A] dark:border-white/10 dark:text-white">
                    <span />
                    <span className="whitespace-nowrap text-left">Project Name</span>
                    <span className="whitespace-nowrap text-left">Strategic Priority</span>
                    <span className="whitespace-nowrap text-left">Strategic Priority Classification</span>
                    <span className="whitespace-nowrap text-left">Status</span>
                    <span className="whitespace-nowrap text-left">Target SME</span>
                    <span className="whitespace-nowrap text-left">Budget</span>
                  </div>
                  <div className="divide-y divide-[#EEF3F8] dark:divide-white/10">
                    {filteredBudgets.length === 0 ? (
                      <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#EEF5FF] text-[#286CFF] dark:bg-[#286CFF]/15 dark:text-[#BFDBFE]">
                          <FolderSearch className="h-6 w-6" />
                        </div>
                        <p className="mt-4 text-sm font-semibold text-[#0F172A] dark:text-white">No projects found</p>
                        <p className="mt-1 max-w-md text-sm leading-6 text-[#64748B] dark:text-slate-300">
                          No strategic alignment records matched the current search and filter combination.
                        </p>
                      </div>
                    ) : (
                      filteredBudgets.map((budget) => {
                        const selected = selectedIds.includes(budget.id)
                        const entityLabel = budget.entityName || budget.instanceName || 'Unknown Entity'
                        const priorityLabel =
                          trimPriorityLabel(budget.strategicPriorityName) ||
                          trimPriorityLabel(priorityLookup.get(budget.strategicPriorityId ?? '') || '') ||
                          '-'
                        const classificationLabel =
                          trimPriorityLabel(budget.strategicPriorityClassificationName) ||
                          trimPriorityLabel(priorityLookup.get(budget.strategicPriorityClassificationId ?? '') || '') ||
                          '-'
                        const smeTeamLabel =
                          budget.smeReviewerTeamName ||
                          (budget.strategicPriorityId ? smeAssignmentByPriorityLookup.get(budget.strategicPriorityId) : null) ||
                          (budget.smeReviewerTeamId ? smeAssignmentLookup.get(budget.smeReviewerTeamId) : null) ||
                          '-'

                        return (
                        <div key={budget.id} className="grid min-w-[1280px] grid-cols-[44px_minmax(250px,1.75fr)_minmax(180px,1.1fr)_minmax(220px,1.35fr)_minmax(230px,1.2fr)_minmax(180px,1fr)_minmax(150px,0.9fr)] gap-5 px-5 py-4 hover:bg-[#F8FBFF] dark:hover:bg-white/5">
                            <div className="pt-1">
                              <input
                                type="checkbox"
                                checked={selected}
                                onChange={() => toggleSelected(budget.id)}
                                className="h-4 w-4 rounded border-[#D7E4F4] text-[#286CFF] focus:ring-[#286CFF]"
                              />
                            </div>
                            <div>
                              <Link
                                to={`/strategy-team/projects/${budget.id}`}
                                className="text-sm font-semibold text-[#0F172A] transition-colors hover:text-[#286CFF] dark:text-white dark:hover:text-[#93C5FD]"
                              >
                                {budget.name}
                              </Link>
                              <p className="mt-1 text-xs text-[#64748B] dark:text-slate-300">
                                {budget.budgetRefId} · {entityLabel}
                              </p>
                            </div>
                            <div className="pt-1 text-sm font-medium text-[#0F172A] dark:text-white">{priorityLabel}</div>
                            <div className="pt-1 text-sm font-medium text-[#0F172A] dark:text-white">{classificationLabel}</div>
                            <div className="pt-1">
                              <StrategyPill
                                tone={
                                  budget.statuscode === DGE_BUDGET_STATUS.strategicPriorityChangeUnderReview
                                    ? 'violet'
                                    : budget.statuscode === DGE_BUDGET_STATUS.underQualityCheck
                                      ? 'amber'
                                      : 'blue'
                                }
                                className="whitespace-nowrap"
                              >
                                {budget.statusLabel}
                              </StrategyPill>
                            </div>
                            <div className="pt-1 text-sm text-[#475569] dark:text-slate-300">{smeTeamLabel}</div>
                            <div className="pt-1">
                              <p className="text-sm font-semibold text-[#0F172A] dark:text-white">
                                AED {budget.requestedBudget.toLocaleString('en-AE')}
                              </p>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      )}

      <Dialog open={classificationModalOpen} onOpenChange={setClassificationModalOpen}>
        <DialogContent className="max-w-6xl overflow-hidden rounded-[30px] border border-[#D9E6F5] bg-white p-0 shadow-[0_28px_70px_rgba(15,23,42,0.18)] dark:border-white/10 dark:bg-[#162339]">
          <div className="border-b border-[#EEF3F8] bg-[linear-gradient(180deg,#F8FBFF_0%,#FFFFFF_100%)] px-7 py-6 dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.04)_0%,rgba(255,255,255,0.02)_100%)]">
            <DialogHeader className="space-y-0">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#286CFF_0%,#4F98FF_100%)] text-white shadow-[0_14px_28px_rgba(40,108,255,0.18)]">
                  <Layers className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <DialogTitle className="text-xl font-semibold text-[#0F172A] dark:text-white">Update Strategic Priority And Classification</DialogTitle>
                  <DialogDescription className="mt-1 text-sm leading-6 text-[#64748B] dark:text-slate-300">
                    Apply a new strategic priority and its dependent classification to the selected project set.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
          </div>

          <div className="max-h-[68vh] overflow-y-auto px-7 py-6">
            <div className="space-y-6">
            <div className="rounded-[22px] border border-[#DCE8F6] bg-[#F8FBFF] p-4 dark:border-white/10 dark:bg-white/5">
              <div className="flex flex-wrap items-center gap-3">
                <div className="inline-flex items-center gap-2 rounded-full bg-[#EEF5FF] px-3 py-1.5 text-sm font-semibold text-[#286CFF] dark:bg-[#286CFF]/15 dark:text-[#BFDBFE]">
                  <CheckSquare className="h-4 w-4" />
                  <span>{selectedBudgets.length} selected</span>
                </div>
                <p className="text-sm text-[#475569] dark:text-slate-300">
                  Update each selected project with its own strategic priority and classification before applying all changes together.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {modalProjects.map(({ budget, draft, classificationOptions }) => (
                <div key={budget.id} className="rounded-[24px] border border-[#DCE8F6] bg-white p-5 shadow-[0_8px_20px_rgba(15,23,42,0.04)] dark:border-white/10 dark:bg-[#1B2A41]">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-base font-semibold text-[#0F172A] dark:text-white">{budget.name}</p>
                      <span className="rounded-full bg-[#EEF5FF] px-2.5 py-1 text-xs font-semibold text-[#286CFF] dark:bg-[#286CFF]/15 dark:text-[#BFDBFE]">
                        {budget.budgetRefId}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-[#64748B] dark:text-slate-300">
                      {budget.entityName || budget.instanceName || 'Unknown Entity'}
                    </p>
                  </div>

                  <div className="mt-5 grid gap-4 xl:grid-cols-2">
                    <div>
                      <p className="mb-2 text-sm font-semibold text-[#0F172A] dark:text-white">Strategic Priority</p>
                      <Select
                        value={draft.priorityId}
                        onValueChange={(value) =>
                          setClassificationDrafts((current) => ({
                            ...current,
                            [budget.id]: {
                              priorityId: value,
                              classificationId: '',
                            },
                          }))
                        }
                      >
                        <SelectTrigger className="h-12 rounded-[14px] border-[#D7E4F4] bg-[#F8FBFF] px-4 dark:border-white/10 dark:bg-white/5">
                          <div className="flex items-center gap-2 text-left">
                            <Layers className="h-4 w-4 text-[#286CFF]" />
                            <SelectValue placeholder="Select strategic priority" />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          {parentPriorities.map((option) => (
                            <SelectItem key={option.id} value={option.id}>
                              {option.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <p className="mb-2 text-sm font-semibold text-[#0F172A] dark:text-white">Strategic Priority Classification</p>
                      <Select
                        value={draft.classificationId}
                        onValueChange={(value) =>
                          setClassificationDrafts((current) => ({
                            ...current,
                            [budget.id]: {
                              ...(current[budget.id] ?? { priorityId: '', classificationId: '' }),
                              classificationId: value,
                            },
                          }))
                        }
                      >
                        <SelectTrigger className="h-12 rounded-[14px] border-[#D7E4F4] bg-[#F8FBFF] px-4 dark:border-white/10 dark:bg-white/5">
                          <div className="flex items-center gap-2 text-left">
                            <Workflow className="h-4 w-4 text-[#286CFF]" />
                            <SelectValue placeholder="Select strategic priority classification" />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          {classificationOptions.map((option) => (
                            <SelectItem key={option.id} value={option.id}>
                              {option.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            </div>
          </div>

          <DialogFooter className="border-t border-[#EEF3F8] px-6 pb-6 pt-4 dark:border-white/10">
            <Button variant="outline" className="rounded-2xl border-[#D7E4F4] text-[#286CFF]" onClick={() => setClassificationModalOpen(false)}>
              Cancel
            </Button>
            <Button
              className="rounded-2xl bg-[#286CFF] text-white hover:bg-[#0C65F5]"
              disabled={saving || readyProjectCount === 0}
              onClick={() => void handleApplyClassification()}
            >
              Apply to Selected
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={changeRequestModalOpen} onOpenChange={setChangeRequestModalOpen}>
        <DialogContent className="max-w-5xl overflow-hidden rounded-[30px] border border-[#D9E6F5] bg-white p-0 shadow-[0_28px_70px_rgba(15,23,42,0.18)] dark:border-white/10 dark:bg-[#162339]">
          <div className="border-b border-[#EEF3F8] bg-[linear-gradient(180deg,#F8FBFF_0%,#FFFFFF_100%)] px-7 py-6 dark:border-white/10 dark:bg-[linear-gradient(180deg,#1B2A41_0%,#162339_100%)]">
            <DialogHeader className="space-y-0">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#286CFF_0%,#4F98FF_100%)] text-white shadow-[0_14px_28px_rgba(40,108,255,0.18)]">
                  <Workflow className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <DialogTitle className="text-xl font-semibold text-[#0F172A] dark:text-white">Strategic Priority Change Request</DialogTitle>
                  <DialogDescription className="mt-1 text-sm leading-6 text-[#64748B] dark:text-slate-300">
                    Compare the active mapping with the SME-requested mapping before sending the project back into SME review.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
          </div>
          {selectedChangeRequestBudget ? (
            <div className="max-h-[72vh] overflow-y-auto px-7 py-6">
              <div className="rounded-[22px] border border-[#DCE8F6] bg-[#F8FBFF] p-5 dark:border-white/10 dark:bg-white/5">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-base font-semibold text-[#0F172A] dark:text-white">{selectedChangeRequestBudget.name}</p>
                  <span className="rounded-full bg-[#EEF5FF] px-2.5 py-1 text-xs font-semibold text-[#286CFF] dark:bg-[#286CFF]/15 dark:text-[#BFDBFE]">
                    {selectedChangeRequestBudget.budgetRefId}
                  </span>
                  <StrategyPill tone="violet" className="whitespace-nowrap">
                    {selectedChangeRequestBudget.statusLabel}
                  </StrategyPill>
                </div>
                <p className="mt-1 text-sm text-[#64748B] dark:text-slate-300">
                  {selectedChangeRequestBudget.entityName || selectedChangeRequestBudget.instanceName || 'Unknown Entity'}
                </p>
              </div>

              <div className="mt-5 grid gap-4 xl:grid-cols-[1fr_auto_1fr] xl:items-center">
                <div className="rounded-[24px] border border-[#DCE8F6] bg-white p-5 shadow-[0_8px_20px_rgba(15,23,42,0.04)] dark:border-white/10 dark:bg-[#1B2A41]">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EEF5FF] text-[#286CFF] dark:bg-[#286CFF]/15 dark:text-[#BFDBFE]">
                      <Layers className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <p className="text-base font-semibold text-[#0F172A] dark:text-white">Current Mapping</p>
                      <p className="text-sm text-[#64748B] dark:text-slate-300">What is active on the project now</p>
                    </div>
                  </div>

                  <div className="mt-5 space-y-4">
                    <div className="rounded-[18px] border border-[#EAF0F6] bg-[#F8FBFF] px-4 py-3 dark:border-white/10 dark:bg-white/5">
                      <p className="text-xs font-semibold tracking-[0.12em] text-[#64748B] dark:text-slate-400">Strategic Priority</p>
                      <p className="mt-2 text-sm font-semibold text-[#0F172A] dark:text-white">{selectedChangeRequestDetails?.currentPriority || '-'}</p>
                    </div>
                    <div className="rounded-[18px] border border-[#EAF0F6] bg-[#F8FBFF] px-4 py-3 dark:border-white/10 dark:bg-white/5">
                      <p className="text-xs font-semibold tracking-[0.12em] text-[#64748B] dark:text-slate-400">Strategic Priority Classification</p>
                      <p className="mt-2 text-sm font-semibold text-[#0F172A] dark:text-white">{selectedChangeRequestDetails?.currentClassification || '-'}</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[linear-gradient(135deg,#EEF5FF_0%,#FFFFFF_100%)] text-[#286CFF] shadow-[0_12px_24px_rgba(40,108,255,0.14)] dark:bg-[linear-gradient(135deg,rgba(40,108,255,0.18)_0%,rgba(255,255,255,0.02)_100%)] dark:text-[#BFDBFE]">
                    <ArrowRightLeft className="h-5 w-5 animate-pulse" />
                  </div>
                </div>

                <div className="rounded-[24px] border border-[#DCE8F6] bg-white p-5 shadow-[0_8px_20px_rgba(15,23,42,0.04)] dark:border-white/10 dark:bg-[#1B2A41]">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EEF5FF] text-[#286CFF] dark:bg-[#286CFF]/15 dark:text-[#BFDBFE]">
                      <Layers className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <p className="text-base font-semibold text-[#0F172A] dark:text-white">Requested Mapping</p>
                      <p className="text-sm text-[#64748B] dark:text-slate-300">What the SME asked Strategy Team to approve</p>
                    </div>
                  </div>

                  <div className="mt-5 space-y-4">
                    <div className="rounded-[18px] border border-[#EAF0F6] bg-[#F8FBFF] px-4 py-3 dark:border-white/10 dark:bg-white/5">
                      <p className="text-xs font-semibold tracking-[0.12em] text-[#64748B] dark:text-slate-400">Requested Strategic Priority</p>
                      <p className="mt-2 text-sm font-semibold text-[#0F172A] dark:text-white">{selectedChangeRequestDetails?.requestedPriority || '-'}</p>
                    </div>
                    <div className="rounded-[18px] border border-[#EAF0F6] bg-[#F8FBFF] px-4 py-3 dark:border-white/10 dark:bg-white/5">
                      <p className="text-xs font-semibold tracking-[0.12em] text-[#64748B] dark:text-slate-400">Requested Strategic Priority Classification</p>
                      <p className="mt-2 text-sm font-semibold text-[#0F172A] dark:text-white">{selectedChangeRequestDetails?.requestedClassification || '-'}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 overflow-hidden rounded-[22px] border border-[#DCE8F6] bg-white dark:border-white/10 dark:bg-[#1E293B]">
                <div className="flex items-center gap-2 bg-gradient-to-b from-[#F8FBFF] to-white px-5 py-4 dark:from-[#1B2A41] dark:to-[#1E293B]">
                  <Workflow className="h-4 w-4 text-[#286CFF]" />
                  <p className="text-sm font-semibold text-[#0F172A] dark:text-white">Review Guidance</p>
                </div>
                <div className="border-t border-[#DCE8F6] px-5 py-4 dark:border-white/10">
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-[16px] border border-[#EAF0F6] bg-[#F8FBFF] p-4 dark:border-white/10 dark:bg-white/5">
                      <p className="text-sm font-semibold text-[#0F172A] dark:text-white">Approve if</p>
                      <p className="mt-2 text-sm leading-6 text-[#475569] dark:text-slate-300">
                        The SME-requested mapping better reflects the project scope, routing, and strategic fit than the current assignment.
                      </p>
                    </div>
                    <div className="rounded-[16px] border border-[#EAF0F6] bg-[#F8FBFF] p-4 dark:border-white/10 dark:bg-white/5">
                      <p className="text-sm font-semibold text-[#0F172A] dark:text-white">Reject if</p>
                      <p className="mt-2 text-sm leading-6 text-[#475569] dark:text-slate-300">
                        The current mapping is already correct and the requested change would route the project away from the right SME domain.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
          <DialogFooter className="border-t border-[#EEF3F8] px-6 pb-6 pt-4 dark:border-white/10">
            <Button variant="outline" className="rounded-2xl border-[#D7E4F4] text-[#286CFF]" onClick={() => setChangeRequestModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="outline" className="rounded-2xl border-[#D7E4F4] text-[#286CFF]" disabled={saving} onClick={() => void handleReviewChangeRequest('reject')}>
              Reject
            </Button>
            <Button className="rounded-2xl bg-[#286CFF] text-white hover:bg-[#0C65F5]" disabled={saving} onClick={() => void handleReviewChangeRequest('approve')}>
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmationModal
        open={pendingSendToSme !== null}
        onOpenChange={(open) => {
          if (!open) setPendingSendToSme(null)
        }}
        title={
          (pendingSendToSme?.length ?? 0) === 1
            ? 'Send to SME?'
            : `Send ${pendingSendToSme?.length ?? 0} Projects to SME?`
        }
        description={
          (pendingSendToSme?.length ?? 0) === 1
            ? 'This will route the selected project to its mapped SME team for domain review.'
            : `This will route ${pendingSendToSme?.length ?? 0} selected projects to their mapped SME teams for domain review.`
        }
        confirmLabel="Send to SME"
        onConfirm={() => void handleSendToSme()}
        tone="primary"
      />
    </StrategyPageShell>
  )
}
