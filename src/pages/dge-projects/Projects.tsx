import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Clock,
  Download,
  Eye,
  LayoutGrid,
  LayoutList,
  ListFilter,
  Search,
  Sparkles,
} from 'lucide-react'
import type { Project, ProjectStatus } from '@/domain/types'
import { useCycle } from '@/context/CycleContext'
import { useRole } from '@/context/RoleContext'
import { useToast } from '@/context/ToastContext'
import { ProjectTable } from '@/components/shared/ProjectTable'
import { DirhamIcon } from '@/components/shared/DirhamIcon'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { exportProjectsToExcel } from '@/services/projectExportService'
import { getProjectAiReviewFlags } from '@/services/documentAiSummaryStoreService'
import {
  DGE_BUDGET_STATUS,
  getCurrentSmeBudgets,
  getDgePortfolioData,
  type DgeBudgetRecord,
} from '@/services/dgePortfolioService'

type DgeProjectRole = 'strategy-team' | 'strategy-director' | 'sme-team'
type StatusFilter = 'all-statuses' | string
type DgeProjectTab = 'all' | 'active' | 'clarification' | 'completed'
type StrategyPhase = 'planning' | 'dge-review' | 'allocation' | 'utilization'
type StrategyStatusTab = string

interface DgeProjectsProps {
  role: DgeProjectRole
}

const pageConfig: Record<DgeProjectRole, { title: string; description: string; linkBase: string; exportRole: string }> = {
  'strategy-team': {
    title: 'Projects',
    description: 'All selected-cycle entity projects available to Strategy Team governance.',
    linkBase: '/strategy-team/projects',
    exportRole: 'Strategy Team',
  },
  'strategy-director': {
    title: 'Projects',
    description: 'All selected-cycle entity projects available to Strategy Director review.',
    linkBase: '/strategy-director/projects',
    exportRole: 'Strategy Director',
  },
  'sme-team': {
    title: 'Projects',
    description: 'Projects in the selected cycle that belong to the current SME strategic domain.',
    linkBase: '/sme-team/projects',
    exportRole: 'SME Team',
  },
}

const STRATEGY_PHASES: Array<{ id: StrategyPhase; label: string; description: string }> = [
  { id: 'planning', label: 'Planning', description: 'Drafting and ADGE approval movement' },
  { id: 'dge-review', label: 'DGE Review', description: 'Strategy, SME, quality, and director review' },
  { id: 'allocation', label: 'Allocation', description: 'Allocation submission and approval' },
  { id: 'utilization', label: 'Utilization', description: 'Utilization execution and completion' },
]

const STRATEGY_PHASE_STATUS_TABS: Record<StrategyPhase, Array<{ id: StrategyStatusTab; label: string; statuses: number[] | null }>> = {
  planning: [
    { id: 'drafting', label: 'Drafting', statuses: [DGE_BUDGET_STATUS.draft] },
    { id: 'reviewer', label: 'Reviewer', statuses: [DGE_BUDGET_STATUS.underReviewerReview, DGE_BUDGET_STATUS.reviewerReviewCompleted] },
    { id: 'approver', label: 'Approver', statuses: [DGE_BUDGET_STATUS.underApproverReview, DGE_BUDGET_STATUS.approvedByApprover] },
    { id: 'clarification', label: 'Clarification', statuses: [DGE_BUDGET_STATUS.clarificationPending] },
  ],
  'dge-review': [
    { id: 'all', label: 'All', statuses: null },
    { id: 'strategic-alignment-review', label: 'Strategic Alignment Review', statuses: [DGE_BUDGET_STATUS.underStrategicAlignmentReview] },
    { id: 'sme-review', label: 'SME Review', statuses: [DGE_BUDGET_STATUS.underSmeReview] },
    { id: 'quality-check-review', label: 'Quality Check Review', statuses: [DGE_BUDGET_STATUS.underQualityCheck] },
    { id: 'director-review', label: 'Director Review', statuses: [DGE_BUDGET_STATUS.underFinalReview] },
    { id: 'strategic-priority-cr', label: 'Strategic Priority CR', statuses: [DGE_BUDGET_STATUS.strategicPriorityChangeUnderReview] },
    { id: 'clarification', label: 'Clarification', statuses: [DGE_BUDGET_STATUS.clarificationPending] },
  ],
  allocation: [
    { id: 'pending-with-respondent', label: 'Pending with Respondent', statuses: [DGE_BUDGET_STATUS.allocationInProgress] },
    { id: 'pending-with-approver', label: 'Pending with Approver', statuses: [DGE_BUDGET_STATUS.allocationInReview] },
  ],
  utilization: [
    { id: 'all', label: 'All', statuses: [DGE_BUDGET_STATUS.utilizationInProgress, DGE_BUDGET_STATUS.utilizationCompleted] },
  ],
}

const STRATEGY_PHASE_STATUS_CODES: Record<StrategyPhase, Set<number>> = {
  planning: new Set(STRATEGY_PHASE_STATUS_TABS.planning.flatMap((tab) => tab.statuses ?? [])),
  'dge-review': new Set(STRATEGY_PHASE_STATUS_TABS['dge-review'].flatMap((tab) => tab.statuses ?? [])),
  allocation: new Set(STRATEGY_PHASE_STATUS_TABS.allocation.flatMap((tab) => tab.statuses ?? [])),
  utilization: new Set(STRATEGY_PHASE_STATUS_TABS.utilization.flatMap((tab) => tab.statuses ?? [])),
}

function formatDate(value: string | null | undefined) {
  if (!value) return 'N/A'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'N/A'
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function trimPriorityLabel(value: string | null | undefined) {
  return value?.replace(/\s+-\s+SP\d+$/i, '').trim() || ''
}

function formatBudgetValue(amount: number) {
  return amount.toLocaleString('en-AE')
}

function BudgetCardLabel({ children }: { children: string }) {
  return (
    <p className="inline-flex items-center gap-1.5 text-xs text-[#64748B] dark:text-slate-200">
      <DirhamIcon width={12} height={12} color="currentColor" />
      <span>{children}</span>
    </p>
  )
}

function DgeStatusBadge({ status }: { status: string }) {
  const className =
    {
      'Under Strategic Alignment Review': 'bg-[#EEF5FF] text-[#286CFF] dark:bg-[#286CFF]/15 dark:text-[#BFDBFE]',
      'Under SME Review': 'bg-cyan-50 text-cyan-700 dark:bg-cyan-900/20 dark:text-cyan-300',
      'Strategic Priority Change Under Review': 'bg-violet-50 text-violet-700 dark:bg-violet-900/20 dark:text-violet-300',
      'Under Quality Check': 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300',
      'Under Final Review': 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300',
      'Review Completed': 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300',
      'Clarification Pending': 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
    }[status] ?? 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-100'

  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap', className)}>
      {status}
    </span>
  )
}

function mapDgeBudgetToProject(budget: DgeBudgetRecord): Project {
  const statusLabel = budget.statusLabel || 'Unknown'
  const status = statusLabel as ProjectStatus
  const strategicPriority = trimPriorityLabel(budget.strategicPriorityName) || '-'
  const classification = trimPriorityLabel(budget.strategicPriorityClassificationName) || '-'
  const refId = budget.budgetRefId || budget.id

  return {
    id: refId,
    ictBudgetId: budget.id,
    aiReviewFlags: budget.aiReviewFlags,
    ownerId: budget.ownerId,
    ownerType: budget.ownerType,
    statusCode: budget.statuscode,
    statusForAdgeLabel: statusLabel,
    name: budget.name,
    strategicPriority,
    classification,
    category: '-',
    requestedBudget: budget.requestedBudget,
    recommendedBudget: budget.recommendedBudget,
    allocatedBudget: budget.allocatedBudget,
    utilizedBudget: budget.utilizedBudget,
    planningOutcome: budget.planningOutcome,
    addedInAllocation: budget.addedInAllocation,
    budgetItems: [],
    status,
    approvalStatus: statusLabel,
    pendingWith: budget.ownerName || '-',
    submittedBy: budget.entityName || budget.instanceName || 'Unknown Entity',
    submittedDate: formatDate(null),
    lastModified: formatDate(null),
    plannedStartDate: 'N/A',
    plannedEndDate: 'N/A',
    workStream: budget.instanceName || budget.entityName || '-',
    budgetType: '-',
    technology: { company: '-', product: '-' },
    summary: budget.summary || '',
    documents: budget.sharePointUrl ? [{ name: 'Supporting document folder', size: '', uploadedDate: '' }] : [],
    clarifications: [],
    aiScore: budget.aiConfidenceScore ?? 0,
    riskLevel: null,
    capex: 0,
    opex: 0,
  }
}

function DgeProjectListSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-2xl border border-[#DDEBFF] bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#1E293B]"
        >
          <div className="animate-pulse space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2">
                <div className="h-3 w-20 rounded-full bg-[#E7EEF8] dark:bg-white/10" />
                <div className="h-5 w-52 rounded-full bg-[#E7EEF8] dark:bg-white/10" />
              </div>
              <div className="h-7 w-16 rounded-full bg-[#E7EEF8] dark:bg-white/10" />
            </div>
            <div className="flex gap-2">
              <div className="h-6 w-24 rounded-full bg-[#E7EEF8] dark:bg-white/10" />
              <div className="h-6 w-20 rounded-full bg-[#E7EEF8] dark:bg-white/10" />
            </div>
            <div className="h-20 rounded-xl bg-[#F4F8FC] dark:bg-white/10" />
            <div className="grid grid-cols-2 gap-2">
              <div className="h-16 rounded-xl bg-[#F4F8FC] dark:bg-white/10" />
              <div className="h-16 rounded-xl bg-[#F4F8FC] dark:bg-white/10" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function DgeProjectCard({ project, linkBase }: { project: Project; linkBase: string }) {
  const pendingClarification = project.statusForAdgeLabel === 'Clarification Pending'

  return (
    <article className="group overflow-hidden rounded-2xl border border-[#DDEBFF] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#286CFF] hover:shadow-[0_18px_40px_rgba(40,108,255,0.12)] dark:border-white/10 dark:bg-[#1E293B]">
      <div className="p-4">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs text-[#94A3B8]">{project.id}</span>
              {pendingClarification ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
                  <Clock className="h-3.5 w-3.5" />
                  Clarification
                </span>
              ) : null}
            </div>
            <Link
              to={`${linkBase}/${project.id}`}
              className="line-clamp-2 text-base font-bold text-[#0F172A] transition-colors group-hover:text-[#286CFF] dark:text-white"
            >
              {project.name}
            </Link>
          </div>
          <span className="inline-flex shrink-0 rounded-full border border-[#DDEBFF] bg-[#EEF5FF] px-2.5 py-1 text-xs font-semibold text-[#286CFF] dark:border-white/10 dark:bg-[#286CFF]/15 dark:text-[#BFDBFE]">
            {project.aiScore}%
          </span>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <DgeStatusBadge status={project.statusForAdgeLabel || project.status} />
        </div>

        <div className="mb-4 rounded-xl border border-[#EAF0F6] bg-[#F8FBFF] p-3 dark:border-white/10 dark:bg-white/5">
          <p className="text-xs font-semibold text-[#64748B] dark:text-slate-200">Strategic Priority</p>
          <p className="mt-1 text-sm font-medium text-[#0F172A] dark:text-white">{project.strategicPriority}</p>
          <p className="mt-1 text-xs text-[#64748B] dark:text-slate-200">{project.classification}</p>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-[#EFF6FF] px-3 py-2 dark:bg-white/5">
            <BudgetCardLabel>Requested Budget</BudgetCardLabel>
            <p className="text-sm font-bold text-[#0F172A] dark:text-white">{formatBudgetValue(project.requestedBudget)}</p>
          </div>
          <div className="rounded-xl bg-[#EFF6FF] px-3 py-2 dark:bg-white/5">
            <BudgetCardLabel>Recommended Budget</BudgetCardLabel>
            <p className="text-sm font-bold text-[#0F172A] dark:text-white">{formatBudgetValue(project.recommendedBudget ?? 0)}</p>
          </div>
          <div className="rounded-xl bg-[#EFF6FF] px-3 py-2 dark:bg-white/5">
            <BudgetCardLabel>Allocated Budget</BudgetCardLabel>
            <p className="text-sm font-bold text-[#0F172A] dark:text-white">{formatBudgetValue(project.allocatedBudget ?? 0)}</p>
          </div>
          <div className="rounded-xl bg-[#EFF6FF] px-3 py-2 dark:bg-white/5">
            <BudgetCardLabel>Utilized Budget</BudgetCardLabel>
            <p className="text-sm font-bold text-[#0F172A] dark:text-white">{formatBudgetValue(project.utilizedBudget ?? 0)}</p>
          </div>
          <div className="rounded-xl bg-[#EFF6FF] px-3 py-2 dark:bg-white/5">
            <p className="text-xs text-[#64748B] dark:text-slate-200">Pending With</p>
            <p className="truncate text-sm font-bold text-[#0F172A] dark:text-white">{project.pendingWith || '-'}</p>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-[#EAF0F6] pt-3 dark:border-white/10">
          <span className="truncate text-xs text-[#64748B] dark:text-slate-200">{project.submittedBy}</span>
          <Link
            to={`${linkBase}/${project.id}`}
            className="inline-flex items-center gap-1 rounded-lg bg-[#E7F5FF] px-2.5 py-1.5 text-xs font-bold text-[#286CFF] transition-colors hover:bg-[#D3EDFF] hover:text-[#043DFF] dark:bg-[#286CFF]/15 dark:hover:bg-[#286CFF]/25"
          >
            <Eye className="h-3.5 w-3.5" />
            View
          </Link>
        </div>
      </div>
    </article>
  )
}

export default function DgeProjects({ role }: DgeProjectsProps) {
  const { selectedCycle } = useCycle()
  const { activeRole } = useRole()
  const { runActionToast } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const config = pageConfig[role]
  const cycleName = selectedCycle?.name ?? 'ICT Budget Cycle'
  const [budgets, setBudgets] = useState<DgeBudgetRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table')
  const [hasActiveTableFilters, setHasActiveTableFilters] = useState(false)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all-statuses')
  const [entityFilter, setEntityFilter] = useState('all-entities')
  const [aiFlagFilter, setAiFlagFilter] = useState('all-ai-review-flags')
  const [strategyPhase, setStrategyPhase] = useState<StrategyPhase>('dge-review')
  const [strategyStatusTab, setStrategyStatusTab] = useState<StrategyStatusTab>('all')
  const [exporting, setExporting] = useState(false)
  const strategyPhaseTouchedRef = useRef(false)

  useEffect(() => {
    const status = searchParams.get('status')
    setStatusFilter(status || 'all-statuses')
  }, [searchParams])

  useEffect(() => {
    let active = true

    const load = async () => {
      if (!selectedCycle?.id) {
        setBudgets([])
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)
      try {
        const portfolio = await getDgePortfolioData(selectedCycle.id)
        const scopedBudgets = role === 'sme-team' ? getCurrentSmeBudgets(portfolio) : portfolio.budgets
        if (active) setBudgets(scopedBudgets)
      } catch (err) {
        console.error('[DgeProjects] Failed to load projects:', err)
        if (active) setError(err instanceof Error ? err.message : 'Unable to load DGE projects.')
      } finally {
        if (active) setLoading(false)
      }
    }

    void load()

    return () => {
      active = false
    }
  }, [role, selectedCycle?.id])

  const projects = useMemo(() => budgets.map(mapDgeBudgetToProject), [budgets])

  const statusOptions = useMemo(
    () => Array.from(new Set(projects.map((project) => project.statusForAdgeLabel || project.status))).filter(Boolean).sort(),
    [projects]
  )

  const entityOptions = useMemo(
    () => Array.from(new Set(projects.map((project) => project.submittedBy).filter(Boolean))).sort(),
    [projects]
  )

  const strategyPhaseTabs = useMemo(
    () =>
      STRATEGY_PHASES.map((phase) => ({
        ...phase,
        count: projects.filter((project) => STRATEGY_PHASE_STATUS_CODES[phase.id].has(project.statusCode ?? -1)).length,
      })),
    [projects]
  )

  useEffect(() => {
    if (role !== 'strategy-team' || strategyPhaseTouchedRef.current || !strategyPhaseTabs.some((phase) => phase.count > 0)) return
    const busiestPhase = [...strategyPhaseTabs].sort((left, right) => right.count - left.count)[0]
    if (busiestPhase?.id && busiestPhase.id !== strategyPhase) {
      setStrategyPhase(busiestPhase.id)
    }
  }, [role, strategyPhase, strategyPhaseTabs])

  const strategyStatusTabs = useMemo(() => {
    const phaseStatusCodes = STRATEGY_PHASE_STATUS_CODES[strategyPhase]
    const phaseProjects = projects.filter((project) => phaseStatusCodes.has(project.statusCode ?? -1))
    return STRATEGY_PHASE_STATUS_TABS[strategyPhase].map((tab) => ({
      ...tab,
      count: tab.statuses
        ? phaseProjects.filter((project) => tab.statuses?.includes(project.statusCode ?? -1)).length
        : phaseProjects.length,
    }))
  }, [projects, strategyPhase])

  useEffect(() => {
    const validTabs = new Set(STRATEGY_PHASE_STATUS_TABS[strategyPhase].map((tab) => tab.id))
    if (!validTabs.has(strategyStatusTab)) {
      setStrategyStatusTab(STRATEGY_PHASE_STATUS_TABS[strategyPhase][0]?.id ?? 'all')
    }
    setStatusFilter('all-statuses')
  }, [strategyPhase, strategyStatusTab])

  const strategyPhaseStatusOptions = useMemo(() => {
    if (role !== 'strategy-team') return statusOptions
    const phaseStatusCodes = STRATEGY_PHASE_STATUS_CODES[strategyPhase]
    return Array.from(
      new Set(
        projects
          .filter((project) => phaseStatusCodes.has(project.statusCode ?? -1))
          .map((project) => project.statusForAdgeLabel || project.status)
      )
    )
      .filter(Boolean)
      .sort()
  }, [projects, role, statusOptions, strategyPhase])

  const aiFlagOptions = useMemo(() => {
    const flagLookup = new Map<string, string>()
    projects.forEach((project) => {
      getProjectAiReviewFlags(project.aiReviewFlags).forEach((flag) => {
        flagLookup.set(flag.key, flag.label)
      })
    })
    return Array.from(flagLookup, ([key, label]) => ({ key, label })).sort((left, right) => left.label.localeCompare(right.label))
  }, [projects])

  const tabs = useMemo<Array<{ id: DgeProjectTab; label: string; count: number }>>(() => {
    const openStatuses = new Set(['Under Strategic Alignment Review', 'Under SME Review', 'Under Quality Check', 'Under Final Review'])
    return [
      { id: 'all', label: 'All Projects', count: projects.length },
      { id: 'active', label: 'Active DGE Review', count: projects.filter((project) => openStatuses.has(project.statusForAdgeLabel || project.status)).length },
      { id: 'clarification', label: 'Clarification Pending', count: projects.filter((project) => (project.statusForAdgeLabel || project.status) === 'Clarification Pending').length },
      { id: 'completed', label: 'Review Completed', count: projects.filter((project) => (project.statusForAdgeLabel || project.status) === 'Review Completed').length },
    ]
  }, [projects])

  const [activeTab, setActiveTab] = useState<DgeProjectTab>('all')

  const filtered = projects.filter((project) => {
    const normalizedSearch = search.trim().toLowerCase()
    const dgeStatus = project.statusForAdgeLabel || project.status
    const aiFlagKeys = getProjectAiReviewFlags(project.aiReviewFlags).map((flag) => flag.key)
    const activeStrategyStatusTab = STRATEGY_PHASE_STATUS_TABS[strategyPhase].find((tab) => tab.id === strategyStatusTab)
    const matchesSearch =
      !normalizedSearch ||
      project.name.toLowerCase().includes(normalizedSearch) ||
      project.id.toLowerCase().includes(normalizedSearch) ||
      project.submittedBy.toLowerCase().includes(normalizedSearch) ||
      project.strategicPriority.toLowerCase().includes(normalizedSearch) ||
      project.classification.toLowerCase().includes(normalizedSearch)
    const matchesStatus = statusFilter === 'all-statuses' || dgeStatus === statusFilter
    const matchesEntity = entityFilter === 'all-entities' || project.submittedBy === entityFilter
    const matchesAiFlag =
      aiFlagFilter === 'all-ai-review-flags' ||
      (aiFlagFilter === 'none' && aiFlagKeys.length === 0) ||
      aiFlagKeys.includes(aiFlagFilter)
    const matchesLegacyTab =
      activeTab === 'all' ||
      (activeTab === 'active' && ['Under Strategic Alignment Review', 'Under SME Review', 'Under Quality Check', 'Under Final Review'].includes(dgeStatus)) ||
      (activeTab === 'clarification' && dgeStatus === 'Clarification Pending') ||
      (activeTab === 'completed' && dgeStatus === 'Review Completed')
    const matchesStrategyPhase = STRATEGY_PHASE_STATUS_CODES[strategyPhase].has(project.statusCode ?? -1)
    const matchesStrategyStatusTab =
      !activeStrategyStatusTab ||
      !activeStrategyStatusTab.statuses ||
      activeStrategyStatusTab.statuses.includes(project.statusCode ?? -1)

    return (
      matchesSearch &&
      matchesStatus &&
      matchesEntity &&
      matchesAiFlag &&
      (role === 'strategy-team' ? matchesStrategyPhase && matchesStrategyStatusTab : matchesLegacyTab)
    )
  })

  const handleExport = async () => {
    setExporting(true)
    try {
      await runActionToast(
        () => exportProjectsToExcel(filtered, config.exportRole),
        {
          processingTitle: 'Preparing Excel export',
          processingDescription: `Building a formatted workbook for ${filtered.length} project${filtered.length === 1 ? '' : 's'}.`,
          successTitle: 'Excel exported',
          successDescription: 'The project workbook was downloaded successfully.',
          errorTitle: 'Export failed',
          minDurationMs: 1200,
        }
      )
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="w-full space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A] dark:text-white">{config.title}</h1>
          <p className="mt-1 text-sm text-[#475569] dark:text-slate-200">{cycleName}</p>
          <p className="mt-1 text-sm text-[#64748B] dark:text-slate-300">{config.description}</p>
        </div>
      </div>

      {role === 'strategy-team' ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            {strategyPhaseTabs.map((phase) => (
              <button
                key={phase.id}
                type="button"
                onClick={() => {
                  strategyPhaseTouchedRef.current = true
                  setStrategyPhase(phase.id)
                }}
                className={cn(
                  'group inline-flex min-h-12 items-center gap-3 rounded-2xl border px-4 py-2 text-left transition-all duration-200',
                  strategyPhase === phase.id
                    ? 'border-[#286CFF] bg-[#EEF5FF] text-[#286CFF] shadow-[0_10px_24px_rgba(40,108,255,0.10)] dark:border-[#4F98FF] dark:bg-[#286CFF]/15 dark:text-[#BFDBFE]'
                    : 'border-[#DCE8F6] bg-white text-[#0F172A] hover:border-[#BFD4FF] hover:bg-[#F8FBFF] dark:border-white/10 dark:bg-[#1E293B] dark:text-white dark:hover:bg-white/5'
                )}
              >
                <span>
                  <span className="block text-sm font-bold">{phase.label}</span>
                  <span className="block text-[11px] font-medium text-[#64748B] dark:text-slate-300">{phase.description}</span>
                </span>
                <span className={cn('rounded-full px-2 py-0.5 text-xs font-bold', strategyPhase === phase.id ? 'bg-white text-[#286CFF] dark:bg-white/10 dark:text-[#BFDBFE]' : 'bg-[#F1F5F9] text-[#64748B] dark:bg-white/10 dark:text-slate-200')}>
                  {phase.count}
                </span>
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {strategyStatusTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStrategyStatusTab(tab.id)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                  strategyStatusTab === tab.id
                    ? 'bg-[var(--primary)] text-white'
                    : 'border border-[#E2E8F0] bg-transparent text-[#0F172A] hover:bg-[#F1F5F9] dark:border-white/10 dark:text-white dark:hover:bg-white/5'
                )}
              >
                {tab.label}
                <span className={cn('rounded-full px-1.5 py-0.5 text-xs font-bold', strategyStatusTab === tab.id ? 'bg-white/20' : 'bg-[#F1F5F9] dark:bg-white/10')}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                activeTab === tab.id
                  ? 'bg-[var(--primary)] text-white'
                  : 'border border-[#E2E8F0] bg-white text-[#0F172A] hover:bg-[#F1F5F9] dark:border-white/10 dark:bg-[#1E293B] dark:text-white dark:hover:bg-white/5'
              )}
            >
              {tab.label}
              <span className={cn('rounded-full px-1.5 py-0.5 text-xs font-bold', activeTab === tab.id ? 'bg-white/20' : 'bg-[#F1F5F9] dark:bg-white/10')}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      )}

      {error ? (
        <div className="rounded-2xl border border-[#FFD4D1] bg-[#FFF5F5] px-4 py-3 text-sm text-[#B42318]">
          {error}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search projects..." className="pl-9" />
        </div>
        <div className="w-[240px]">
          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value)
              const next = new URLSearchParams(searchParams)
              if (value === 'all-statuses') next.delete('status')
              else next.set('status', value)
              setSearchParams(next, { replace: true })
            }}
          >
            <SelectTrigger>
              <span className="inline-flex w-full items-center gap-2 whitespace-nowrap">
                <ListFilter className="h-4 w-4 text-[var(--muted-foreground)]" />
                <SelectValue className="truncate" placeholder="Status" />
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-statuses">Status</SelectItem>
              {strategyPhaseStatusOptions.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-[240px]">
          <Select value={entityFilter} onValueChange={setEntityFilter}>
            <SelectTrigger>
              <span className="inline-flex w-full items-center gap-2 whitespace-nowrap">
                <ListFilter className="h-4 w-4 text-[var(--muted-foreground)]" />
                <SelectValue className="truncate" placeholder="Entity" />
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-entities">Entity</SelectItem>
              {entityOptions.map((entity) => (
                <SelectItem key={entity} value={entity}>
                  {entity}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-[240px]">
          <Select value={aiFlagFilter} onValueChange={setAiFlagFilter}>
            <SelectTrigger>
              <span className="inline-flex w-full items-center gap-2 whitespace-nowrap">
                <Sparkles className="h-4 w-4 text-[#A855F7] dark:text-[#E9D5FF]" />
                <SelectValue className="truncate" placeholder="AI Review Flag" />
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-ai-review-flags">AI Review Flag</SelectItem>
              <SelectItem value="none">No AI Review Flag</SelectItem>
              {aiFlagOptions.map((flag) => (
                <SelectItem key={flag.key} value={flag.key}>
                  {flag.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => void handleExport()} disabled={exporting || loading}>
            <Download className="h-4 w-4" />
            {exporting ? 'Exporting...' : 'Export'}
          </Button>
          <div className="flex overflow-hidden rounded-[8px] border border-[#E2E8F0] dark:border-white/10">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={cn(
                'p-2 transition-colors',
                viewMode === 'table'
                  ? 'bg-[var(--primary)] text-white'
                  : 'bg-white text-[#475569] hover:bg-[#F1F5F9] dark:bg-[#1E293B] dark:text-slate-200 dark:hover:bg-white/5'
              )}
            >
              <LayoutList className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={cn(
                'p-2 transition-colors',
                viewMode === 'cards'
                  ? 'bg-[var(--primary)] text-white'
                  : 'bg-white text-[#475569] hover:bg-[#F1F5F9] dark:bg-[#1E293B] dark:text-slate-200 dark:hover:bg-white/5'
              )}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div
        className={cn(
          viewMode === 'table' &&
            'overflow-hidden rounded-[12px] border border-[#E2E8F0] bg-white shadow-sm dark:border-white/10 dark:bg-[#1E293B]'
        )}
      >
        {loading ? (
          <div className="p-4">
            <DgeProjectListSkeleton />
          </div>
        ) : viewMode === 'table' ? (
          <ProjectTable
            projects={filtered}
            linkBase={config.linkBase}
            showCreatedBy
            showAiScore
            budgetColumnMode="all"
            onFilterStateChange={setHasActiveTableFilters}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((project) => (
              <DgeProjectCard key={project.id} project={project} linkBase={config.linkBase} />
            ))}
          </div>
        )}
        {!(viewMode === 'table' && hasActiveTableFilters) && (
          <div className="border-t border-[#F1F5F9] px-5 py-3 text-sm text-[#475569] dark:border-white/5 dark:text-slate-200">
            Showing {filtered.length} project{filtered.length === 1 ? '' : 's'}
          </div>
        )}
      </div>
      <span className="sr-only">{activeRole}</span>
    </div>
  )
}
