import { useEffect, useMemo, useState } from 'react'
import {
  ArrowRight,
  Building2,
  ChevronDown,
  CircleAlert,
  FolderSearch,
  Filter,
  Layers,
  Sparkles,
  Workflow,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { useCycle } from '@/context/CycleContext'
import { StrategyPageShell, StrategyPill, StrategyProgressBar } from './StrategyTeamShell'
import {
  DGE_BUDGET_STATUS,
  getDgePortfolioData,
  getStrategyAlignmentBudgets,
  type DgeBudgetRecord,
} from '@/services/dgePortfolioService'
import { updateBudgetStrategicClassification, sendBudgetsToSme, reviewStrategicPriorityChange } from '@/services/dgeWorkflowService'
import { getStrategicPriorityOptions, type StrategicPriorityOption } from '@/services/strategicPriorityService'

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

function trimPriorityLabel(value: string | null | undefined) {
  if (!value) return ''
  return value.split(' - ')[0]?.trim() || value
}

export default function StrategicAlignment() {
  const { selectedCycle } = useCycle()
  const [search, setSearch] = useState('')
  const [priorityFilter, setPriorityFilter] = useState<string>('All')
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTER_OPTIONS)[number]>('All')
  const [entityFilter, setEntityFilter] = useState<string>('All')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [classificationModalOpen, setClassificationModalOpen] = useState(false)
  const [changeRequestModalOpen, setChangeRequestModalOpen] = useState(false)
  const [priorities, setPriorities] = useState<StrategicPriorityOption[]>([])
  const [classificationDraft, setClassificationDraft] = useState({ priorityId: '', classificationId: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [budgets, setBudgets] = useState<DgeBudgetRecord[]>([])

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
  const classificationOptions = useMemo(
    () => priorities.filter((option) => option.parentId === classificationDraft.priorityId),
    [classificationDraft.priorityId, priorities]
  )

  const entityOptions = useMemo(
    () => ['All', ...new Set(budgets.map((budget) => budget.instanceName).filter((name): name is string => Boolean(name)))],
    [budgets]
  )

  const priorityCounts = useMemo(() => {
    const base = budgets.filter((budget) => {
      const matchesEntity = entityFilter === 'All' || budget.instanceName === entityFilter
      const matchesStatus = statusFilter === 'All' || budget.statusLabel === statusFilter
      const matchesSearch =
        !search.trim() ||
        [budget.budgetRefId, budget.name, budget.instanceName, budget.strategicPriorityName, budget.strategicPriorityClassificationName]
          .join(' ')
          .toLowerCase()
          .includes(search.toLowerCase())
      return matchesEntity && matchesStatus && matchesSearch
    })

    return [
      { label: 'All', count: base.length },
      ...parentPriorities.map((option) => ({
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
          budget.instanceName,
          budget.strategicPriorityName,
          budget.strategicPriorityClassificationName,
          budget.smeReviewerTeamName,
        ]
          .join(' ')
          .toLowerCase()
          .includes(search.toLowerCase())

      const matchesPriority = priorityFilter === 'All' || trimPriorityLabel(budget.strategicPriorityName) === priorityFilter
      const matchesStatus = statusFilter === 'All' || budget.statusLabel === statusFilter
      const matchesEntity = entityFilter === 'All' || budget.instanceName === entityFilter
      return matchesSearch && matchesPriority && matchesStatus && matchesEntity
    })
  }, [budgets, entityFilter, priorityFilter, search, statusFilter])

  const selectedBudgets = useMemo(
    () => budgets.filter((budget) => selectedIds.includes(budget.id)),
    [budgets, selectedIds]
  )

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
    const first = selectedBudgets[0]
    if (!first) return
    setClassificationDraft({
      priorityId: first.strategicPriorityId ?? '',
      classificationId: first.strategicPriorityClassificationId ?? '',
    })
    setClassificationModalOpen(true)
  }

  const refreshData = async () => {
    if (!selectedCycle?.id) return
    const portfolio = await getDgePortfolioData(selectedCycle.id)
    setBudgets(getStrategyAlignmentBudgets(portfolio))
  }

  const handleApplyClassification = async () => {
    if (!classificationDraft.priorityId || !classificationDraft.classificationId || selectedBudgets.length === 0) return
    setSaving(true)
    setError(null)
    try {
      await updateBudgetStrategicClassification(
        selectedBudgets.map((budget) => budget.id),
        classificationDraft.priorityId,
        classificationDraft.classificationId
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
    setSaving(true)
    setError(null)
    try {
      await sendBudgetsToSme(selectedBudgets)
      await refreshData()
      setSelectedIds([])
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
      await reviewStrategicPriorityChange(selectedChangeRequestBudget, decision)
      await refreshData()
      setChangeRequestModalOpen(false)
      setSelectedIds([])
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Unable to process the strategic priority change request.')
    } finally {
      setSaving(false)
    }
  }

  const toggleSelected = (id: string) => {
    setSelectedIds((current) => (current.includes(id) ? current.filter((value) => value !== id) : [...current, id]))
  }

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
                <Filter className="h-4 w-4 text-[#286CFF]" />
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
                  <p className="mb-3 text-xs font-semibold tracking-[0.14em] text-[#64748B] dark:text-slate-300">
                    Strategic Priority
                  </p>
                  <div className="space-y-1.5">
                    {priorityCounts.map((option) => {
                      const active = priorityFilter === option.label
                      return (
                        <button
                          key={option.label}
                          type="button"
                          onClick={() => setPriorityFilter(option.label)}
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
                  <p className="mb-2 text-xs font-semibold tracking-[0.12em] text-[#64748B] dark:text-slate-300">Entity</p>
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
                  <p className="mb-2 text-xs font-semibold tracking-[0.12em] text-[#64748B] dark:text-slate-300">Status</p>
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
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-[#286CFF]" aria-hidden="true">
                    <path d="M21 10.656V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h12.344" />
                    <path d="m9 11 3 3L22 4" />
                  </svg>
                  <span className="text-sm font-medium text-[#286CFF] dark:text-[#93C5FD]">
                    {selectedBudgets.length} projects selected
                  </span>
                </div>
                <div className="flex items-center gap-2">
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
                        onClick={() => void handleSendToSme()}
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

              <div className="mt-5 overflow-hidden rounded-[12px] border border-[#DCE6F6] bg-white dark:border-white/10 dark:bg-[#1B2A41]">
                <div className="grid grid-cols-[40px_1.4fr_1fr_1fr_1fr_1fr_120px] gap-3 border-b border-[#EEF3F8] px-4 py-3 text-sm font-semibold text-[#0F172A] dark:border-white/10 dark:text-white">
                  <span />
                  <span className="text-left">Project Name</span>
                  <span className="text-left">Strategic Priority</span>
                  <span>Strategic Priority Classification</span>
                  <span className="text-left">Status</span>
                  <span>SME Team</span>
                  <span className="text-left">Budget</span>
                </div>
                <div className="divide-y divide-[#EEF3F8] dark:divide-white/10">
                  {loading ? (
                    <div className="px-4 py-8 text-sm text-[#64748B] dark:text-slate-300">Loading strategic alignment records...</div>
                  ) : filteredBudgets.length === 0 ? (
                    <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#EEF5FF] text-[#286CFF] dark:bg-[#286CFF]/15 dark:text-[#BFDBFE]">
                        <FolderSearch className="h-5 w-5" />
                      </div>
                      <p className="mt-4 text-sm font-semibold text-[#0F172A] dark:text-white">No projects found</p>
                      <p className="mt-1 max-w-md text-sm leading-6 text-[#64748B] dark:text-slate-300">
                        No strategic alignment records matched the current search and filter combination.
                      </p>
                    </div>
                  ) : (
                    filteredBudgets.map((budget) => {
                      const selected = selectedIds.includes(budget.id)
                      const progressValue =
                        budget.requestedBudget > 0 && budget.recommendedBudget > 0
                          ? Math.min(100, Math.round((budget.recommendedBudget / budget.requestedBudget) * 100))
                          : budget.aiConfidenceScore ?? 0

                      return (
                        <div key={budget.id} className="grid grid-cols-[40px_1.4fr_1fr_1fr_1fr_1fr_120px] gap-3 px-4 py-4 hover:bg-[#F8FBFF] dark:hover:bg-white/5">
                          <div className="pt-1">
                            <input
                              type="checkbox"
                              checked={selected}
                              onChange={() => toggleSelected(budget.id)}
                              className="h-4 w-4 rounded border-[#D7E4F4] text-[#286CFF] focus:ring-[#286CFF]"
                            />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-[#0F172A] dark:text-white">{budget.name}</p>
                            <p className="mt-1 text-xs text-[#64748B] dark:text-slate-300">
                              {budget.budgetRefId} · {budget.instanceName || 'Unknown Entity'}
                            </p>
                          </div>
                          <div className="pt-1 text-sm text-[#475569] dark:text-slate-300">{trimPriorityLabel(budget.strategicPriorityName) || '-'}</div>
                          <div className="pt-1 text-sm text-[#475569] dark:text-slate-300">{budget.strategicPriorityClassificationName || '-'}</div>
                          <div className="pt-1">
                            <StrategyPill tone={budget.statuscode === DGE_BUDGET_STATUS.strategicPriorityChangeUnderReview ? 'violet' : budget.statuscode === DGE_BUDGET_STATUS.underQualityCheck ? 'amber' : 'blue'}>
                              {budget.statusLabel}
                            </StrategyPill>
                          </div>
                          <div className="pt-1 text-sm text-[#475569] dark:text-slate-300">{budget.smeReviewerTeamName || '-'}</div>
                          <div className="pt-1">
                            <div className="mb-2 flex items-center justify-between text-xs text-[#64748B] dark:text-slate-300">
                              <span>{budget.requestedBudget.toLocaleString('en-AE')} AED</span>
                              <span>{progressValue}%</span>
                            </div>
                            <StrategyProgressBar
                              value={progressValue}
                              accent={
                                budget.statuscode === DGE_BUDGET_STATUS.strategicPriorityChangeUnderReview
                                  ? '#A855F7'
                                  : budget.statuscode === DGE_BUDGET_STATUS.underQualityCheck
                                    ? '#D97706'
                                    : '#286CFF'
                              }
                            />
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
        <DialogContent className="max-w-2xl overflow-hidden p-0">
          <div className="border-b border-[#EEF3F8] px-6 py-5 dark:border-white/10">
            <DialogHeader className="space-y-1">
              <DialogTitle>Update Strategic Priority And Classification</DialogTitle>
              <DialogDescription>
                Apply a new strategic priority and dependent classification to the selected project set.
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="grid gap-4 px-6 py-5 sm:grid-cols-2">
            <div>
              <p className="mb-2 text-sm font-semibold text-[#0F172A] dark:text-white">Strategic Priority</p>
              <Select
                value={classificationDraft.priorityId}
                onValueChange={(value) => setClassificationDraft({ priorityId: value, classificationId: '' })}
              >
                <SelectTrigger className="h-11 rounded-[10px] border-[#D7E4F4] bg-white dark:border-white/10 dark:bg-white/5">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-[#286CFF]" />
                    <SelectValue placeholder="Select priority" />
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
                value={classificationDraft.classificationId}
                onValueChange={(value) => setClassificationDraft((current) => ({ ...current, classificationId: value }))}
              >
                <SelectTrigger className="h-11 rounded-[10px] border-[#D7E4F4] bg-white dark:border-white/10 dark:bg-white/5">
                  <div className="flex items-center gap-2">
                    <Workflow className="h-4 w-4 text-[#286CFF]" />
                    <SelectValue placeholder="Select classification" />
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
          <DialogFooter className="border-t border-[#EEF3F8] px-6 pb-6 pt-4 dark:border-white/10">
            <Button variant="outline" className="rounded-2xl border-[#D7E4F4] text-[#286CFF]" onClick={() => setClassificationModalOpen(false)}>
              Cancel
            </Button>
            <Button
              className="rounded-2xl bg-[#286CFF] text-white hover:bg-[#0C65F5]"
              disabled={saving || !classificationDraft.priorityId || !classificationDraft.classificationId}
              onClick={() => void handleApplyClassification()}
            >
              Apply to Selected
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={changeRequestModalOpen} onOpenChange={setChangeRequestModalOpen}>
        <DialogContent className="max-w-2xl overflow-hidden p-0">
          <div className="border-b border-[#EEF3F8] px-6 py-5 dark:border-white/10">
            <DialogHeader className="space-y-1">
              <DialogTitle>Strategic Priority Change Request</DialogTitle>
              <DialogDescription>
                Review the current and requested strategic priority mapping before returning the project to SME review.
              </DialogDescription>
            </DialogHeader>
          </div>
          {selectedChangeRequestBudget ? (
            <div className="space-y-4 px-6 py-5">
              <div>
                <p className="text-sm font-semibold text-[#0F172A] dark:text-white">{selectedChangeRequestBudget.name}</p>
                <p className="mt-1 text-xs text-[#64748B] dark:text-slate-300">{selectedChangeRequestBudget.budgetRefId}</p>
              </div>
              {[
                ['Strategic Priority', selectedChangeRequestBudget.strategicPriorityName || '-'],
                ['Strategic Priority Classification', selectedChangeRequestBudget.strategicPriorityClassificationName || '-'],
                ['Requested Strategic Priority', selectedChangeRequestBudget.previousStrategicPriorityName || '-'],
                ['Requested Strategic Priority Classification', selectedChangeRequestBudget.previousStrategicPriorityClassificationName || '-'],
              ].map(([label, value]) => (
                <div key={label} className="rounded-[18px] border border-[#EAF0F6] bg-[#F8FBFF] px-4 py-3 dark:border-white/10 dark:bg-white/5">
                  <p className="text-xs font-semibold tracking-[0.12em] text-[#64748B] dark:text-slate-400">{label}</p>
                  <p className="mt-2 text-sm font-semibold text-[#0F172A] dark:text-white">{value}</p>
                </div>
              ))}
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
    </StrategyPageShell>
  )
}
