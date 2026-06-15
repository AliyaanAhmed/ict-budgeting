import { useEffect, useState } from 'react'
import { Search, Download, LayoutList, LayoutGrid, ListFilter, Eye, Sparkles } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import type { Project, ProjectStatus } from '@/domain/types'
import { useRoleProjects } from '@/hooks/useRoleProjects'
import { useCycle } from '@/context/CycleContext'
import { useInstance } from '@/context/InstanceContext'
import { useToast } from '@/context/ToastContext'
import { usePortfolioSummary } from '@/hooks/usePortfolioSummary'
import { ProjectTable } from '@/components/shared/ProjectTable'
import { AiPortfolioSummary } from '@/components/shared/AiPortfolioSummary'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { RiskLevelBadge } from '@/components/shared/AiPortfolioSummary'
import { getProjectAiReviewFlags } from '@/services/documentAiSummaryStoreService'
import { exportProjectsToExcel } from '@/services/projectExportService'
import type { PortfolioSummaryPayload } from '@/services/portfolioSummaryService'
import { getPortfolioProjectInsight } from '@/services/portfolioSummaryService'
import { getStoredInstanceDetail } from '@/services/instanceService'
import { DGE_INSTANCE_STATUS } from '@/services/dgePortfolioService'
import { DirhamIcon } from '@/components/shared/DirhamIcon'

type FilterTab = 'all' | 'pending-approval' | 'clarification' | 'approved' | 'submitted-dge'
type StatusFilter = 'all-statuses' | ProjectStatus
type BudgetTypeFilter =
  | 'all-budget-types'
  | 'Operational Recurring'
  | 'Operational Non-Recurring'
  | 'New Project'
  | 'Project Continuation'
type AiReviewFlagFilter = 'all-ai-review-flags' | string

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

function AiScore({ score }: { score: number }) {
  const tone =
    score >= 85
      ? 'border-green-200 bg-green-50 text-green-700 dark:border-green-700/30 dark:bg-green-900/20 dark:text-green-300'
      : score >= 65
        ? 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-700/30 dark:bg-amber-900/20 dark:text-amber-300'
        : 'border-red-200 bg-red-50 text-red-700 dark:border-red-700/30 dark:bg-red-900/20 dark:text-red-300'
  return <span className={cn('inline-flex shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold', tone)}>{score}%</span>
}

function ProjectAiFlagTags({ project, portfolioSummary }: { project: Project; portfolioSummary: PortfolioSummaryPayload | null }) {
  const flags = getProjectAiReviewFlags(project.aiReviewFlags).filter((flag) => flag.severity !== 'Low')
  if (flags.length === 0) return null

  return (
    <p className="mt-3 text-sm leading-6 text-[#475569] dark:text-slate-300">
      {flags.map((flag, index) => (
        <span key={`${project.id}-${flag.key}`}>
          {flag.label}
          {index < flags.length - 1 ? ', ' : ''}
        </span>
      ))}
    </p>
  )
}

function ProjectCard({ project, portfolioSummary }: { project: Project; portfolioSummary: PortfolioSummaryPayload | null }) {
  const dynamicRisk = portfolioSummary
    ? getPortfolioProjectInsight(portfolioSummary, project.ictBudgetId ?? project.id, 'approver').riskLevel
    : null
  const instanceStatusCode = getStoredInstanceDetail()?.statuscode ?? null
  const showRecommended = typeof instanceStatusCode === 'number' && instanceStatusCode >= DGE_INSTANCE_STATUS.reviewCompletedByDge
  const showAllocated = typeof instanceStatusCode === 'number' && instanceStatusCode >= DGE_INSTANCE_STATUS.allocation
  const showUtilized = typeof instanceStatusCode === 'number' && instanceStatusCode >= DGE_INSTANCE_STATUS.utilization

  return (
    <article className="group overflow-hidden rounded-2xl border border-[#DDEBFF] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#286CFF] hover:shadow-[0_18px_40px_rgba(40,108,255,0.12)] dark:border-white/10 dark:bg-[#1E293B]">
      <div className="p-4">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs text-[#94A3B8]">{project.id}</span>
              <StatusBadge status={project.status} />
              {dynamicRisk && <RiskLevelBadge riskLevel={dynamicRisk} />}
            </div>
            <Link to={`/approver/approval-queue/${project.id}`} className="line-clamp-2 text-base font-bold text-[#0F172A] transition-colors group-hover:text-[#286CFF] dark:text-white">
              {project.name}
            </Link>
          </div>
          <AiScore score={project.aiScore} />
        </div>

        <div className="mb-4 rounded-xl border border-[#EAF0F6] bg-[#F8FBFF] p-3 dark:border-white/10 dark:bg-white/5">
          <p className="text-xs font-semibold text-[#64748B] dark:text-slate-200">Strategic Priority</p>
          <p className="mt-1 text-sm font-medium text-[#0F172A] dark:text-white">{project.strategicPriority}</p>
          <p className="mt-1 text-xs text-[#64748B] dark:text-slate-200">{project.classification}</p>
        </div>
        <ProjectAiFlagTags project={project} portfolioSummary={portfolioSummary} />

        <div className="mb-4 grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-[#EFF6FF] px-3 py-2 dark:bg-white/5">
            <BudgetCardLabel>Requested Budget</BudgetCardLabel>
            <p className="text-sm font-bold text-[#0F172A] dark:text-white">{formatBudgetValue(project.requestedBudget)}</p>
          </div>
          {showRecommended && (
            <div className="rounded-xl bg-[#EFF6FF] px-3 py-2 dark:bg-white/5">
              <BudgetCardLabel>Recommended Budget</BudgetCardLabel>
              <p className="text-sm font-bold text-[#0F172A] dark:text-white">{formatBudgetValue(project.recommendedBudget ?? 0)}</p>
            </div>
          )}
          {showAllocated && (
            <div className="rounded-xl bg-[#EFF6FF] px-3 py-2 dark:bg-white/5">
              <BudgetCardLabel>Allocated Budget</BudgetCardLabel>
              <p className="text-sm font-bold text-[#0F172A] dark:text-white">{formatBudgetValue(project.allocatedBudget ?? 0)}</p>
            </div>
          )}
          {showUtilized && (
            <div className="rounded-xl bg-[#EFF6FF] px-3 py-2 dark:bg-white/5">
              <BudgetCardLabel>Utilized Budget</BudgetCardLabel>
              <p className="text-sm font-bold text-[#0F172A] dark:text-white">{formatBudgetValue(project.utilizedBudget ?? 0)}</p>
            </div>
          )}
          <div className="rounded-xl bg-[#EFF6FF] px-3 py-2 dark:bg-white/5">
            <p className="text-xs text-[#64748B] dark:text-slate-200">Budget Type</p>
            <p className="text-sm font-bold text-[#0F172A] dark:text-white">{project.budgetType}</p>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-[#EAF0F6] pt-3 dark:border-white/10">
          <span className="truncate text-xs text-[#64748B] dark:text-slate-200">Pending With {project.pendingWith || '-'}</span>
          <Link to={`/approver/approval-queue/${project.id}`} className="inline-flex items-center gap-1 rounded-lg bg-[#E7F5FF] px-2.5 py-1.5 text-xs font-bold text-[#286CFF] transition-colors hover:bg-[#D3EDFF] hover:text-[#043DFF] dark:bg-[#286CFF]/15 dark:hover:bg-[#286CFF]/25">
            <Eye className="h-3.5 w-3.5" />
            View
          </Link>
        </div>
      </div>
    </article>
  )
}

function ProjectListSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="overflow-hidden rounded-2xl border border-[#DDEBFF] bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#1E293B]">
          <div className="animate-pulse space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2">
                <div className="h-3 w-20 rounded-full bg-[#E7EEF8]" />
                <div className="h-5 w-52 rounded-full bg-[#E7EEF8]" />
              </div>
              <div className="h-7 w-16 rounded-full bg-[#E7EEF8]" />
            </div>
            <div className="flex gap-2">
              <div className="h-6 w-24 rounded-full bg-[#E7EEF8]" />
              <div className="h-6 w-20 rounded-full bg-[#E7EEF8]" />
            </div>
            <div className="h-20 rounded-xl bg-[#F4F8FC]" />
            <div className="grid grid-cols-2 gap-2">
              <div className="h-16 rounded-xl bg-[#F4F8FC]" />
              <div className="h-16 rounded-xl bg-[#F4F8FC]" />
            </div>
            <div className="h-10 rounded-xl bg-[#F4F8FC]" />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function ApproverProjects() {
  const { selectedCycle } = useCycle()
  const { instanceId } = useInstance()
  const { runActionToast } = useToast()
  const cycleName = selectedCycle?.name ?? 'ICT Budget Cycle'
  const { items: projects, loading, error } = useRoleProjects('approver', instanceId)
  const { summary: portfolioSummary, loading: portfolioLoading, error: portfolioError } = usePortfolioSummary('approver', instanceId)
  const [searchParams, setSearchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState<FilterTab>('all')
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table')
  const [hasActiveTableFilters, setHasActiveTableFilters] = useState(false)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all-statuses')
  const [budgetTypeFilter, setBudgetTypeFilter] = useState<BudgetTypeFilter>('all-budget-types')
  const [aiReviewFlagFilter, setAiReviewFlagFilter] = useState<AiReviewFlagFilter>('all-ai-review-flags')
  const [exporting, setExporting] = useState(false)
  const aiReviewFlagOptions = Array.from(
    new Map(
      projects
        .flatMap((project) => getProjectAiReviewFlags(project.aiReviewFlags).filter((flag) => flag.severity !== 'Low'))
        .map((flag) => [flag.key, { key: flag.key, label: flag.label }])
    ).values()
  )
  const selectedAiReviewFlagLabel =
    aiReviewFlagFilter === 'all-ai-review-flags'
      ? 'AI Review Flag'
      : aiReviewFlagOptions.find((option) => option.key === aiReviewFlagFilter)?.label ?? 'AI Review Flag'

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab === 'pending-approval' || tab === 'clarification' || tab === 'approved' || tab === 'submitted-dge' || tab === 'all') {
      setActiveTab(tab)
      return
    }

    setActiveTab('all')
  }, [searchParams])

  const tabs = [
    { id: 'all' as const, label: 'All Projects', count: projects.length },
    { id: 'pending-approval' as const, label: 'Pending Approval', count: projects.filter((project) => project.status === 'Submitted to Approver').length },
    { id: 'clarification' as const, label: 'Clarification Required', count: projects.filter((project) => project.status === 'Clarification Required').length },
    { id: 'approved' as const, label: 'Approved', count: projects.filter((project) => project.status === 'Approved').length },
    { id: 'submitted-dge' as const, label: 'Submitted to DGE', count: projects.filter((project) => project.status === 'Submitted to DGE').length },
  ]

  const filtered = projects.filter((project) => {
    const normalizedSearch = search.trim().toLowerCase()
    const matchesSearch =
      !normalizedSearch ||
      project.name.toLowerCase().includes(normalizedSearch) ||
      project.id.toLowerCase().includes(normalizedSearch)
    const matchesTab =
      activeTab === 'all' ||
      (activeTab === 'pending-approval' && project.status === 'Submitted to Approver') ||
      (activeTab === 'clarification' && project.status === 'Clarification Required') ||
      (activeTab === 'approved' && project.status === 'Approved') ||
      (activeTab === 'submitted-dge' && project.status === 'Submitted to DGE')
    const matchesStatus = statusFilter === 'all-statuses' || project.status === statusFilter
    const matchesBudgetType =
      budgetTypeFilter === 'all-budget-types' || project.budgetType === budgetTypeFilter
    const matchesAiReviewFlag =
      aiReviewFlagFilter === 'all-ai-review-flags' ||
      getProjectAiReviewFlags(project.aiReviewFlags)
        .filter((flag) => flag.severity !== 'Low')
        .some((flag) => flag.key === aiReviewFlagFilter)

    return matchesSearch && matchesTab && matchesStatus && matchesBudgetType && matchesAiReviewFlag
  })

  const handleExport = async () => {
    setExporting(true)
    try {
      await runActionToast(
        () => exportProjectsToExcel(filtered, 'Approver'),
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
      <div>
        <h1 className="text-2xl font-bold text-[#0F172A] dark:text-white">Projects</h1>
        <p className="mt-1 text-sm text-[#475569] dark:text-slate-200">{cycleName}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id)
              const nextParams = new URLSearchParams(searchParams)
              if (tab.id === 'all') {
                nextParams.delete('tab')
              } else {
                nextParams.set('tab', tab.id)
              }
              setSearchParams(nextParams, { replace: true })
            }}
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

      {error && (
        <div className="rounded-2xl border border-[#FFD4D1] bg-[#FFF5F5] px-4 py-3 text-sm text-[#B42318]">
          {error}
        </div>
      )}

      <AiPortfolioSummary
        role="approver"
        summary={portfolioSummary}
        loading={portfolioLoading}
        error={portfolioError}
        projects={projects}
        variant="projects"
        projectHrefBuilder={(projectId) => `/approver/approval-queue/${projectId}`}
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search projects..." className="pl-9" />
        </div>
        <div className="w-[210px]">
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
            <SelectTrigger>
              <span className="inline-flex w-full items-center gap-2 whitespace-nowrap">
                <ListFilter className="h-4 w-4 text-[var(--muted-foreground)]" />
                <SelectValue className="truncate" placeholder="Status" />
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-statuses">Status</SelectItem>
              <SelectItem value="Draft">Draft</SelectItem>
              <SelectItem value="Clarification Required">Clarification Required</SelectItem>
              <SelectItem value="Submitted to Reviewer">Submitted to Reviewer</SelectItem>
              <SelectItem value="Submitted to Approver">Submitted to Approver</SelectItem>
              <SelectItem value="Approved">Approved</SelectItem>
              <SelectItem value="Submitted to DGE">Submitted to DGE</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-[210px]">
          <Select value={budgetTypeFilter} onValueChange={(value) => setBudgetTypeFilter(value as BudgetTypeFilter)}>
            <SelectTrigger>
              <span className="inline-flex w-full items-center gap-2 whitespace-nowrap">
                <ListFilter className="h-4 w-4 text-[var(--muted-foreground)]" />
                <SelectValue className="truncate" placeholder="Budget Type" />
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-budget-types">Budget Type</SelectItem>
              <SelectItem value="Operational Recurring">Operational Recurring</SelectItem>
              <SelectItem value="Operational Non-Recurring">Operational Non-Recurring</SelectItem>
              <SelectItem value="New Project">New Project</SelectItem>
              <SelectItem value="Project Continuation">Project Continuation</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-[240px]">
          <Select value={aiReviewFlagFilter} onValueChange={(value) => setAiReviewFlagFilter(value as AiReviewFlagFilter)}>
            <SelectTrigger>
              <span className="inline-flex w-full items-center gap-2 whitespace-nowrap">
                <Sparkles className="h-4 w-4 text-[#A855F7] dark:text-[#E9D5FF]" />
                <span className="truncate text-[#A855F7] dark:text-[#E9D5FF]">{selectedAiReviewFlagLabel}</span>
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-ai-review-flags">AI Review Flag</SelectItem>
              {aiReviewFlagOptions.map((option) => (
                <SelectItem key={option.key} value={option.key}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => void handleExport()} disabled={exporting || loading}><Download className="h-4 w-4" />{exporting ? 'Exporting...' : 'Export'}</Button>
          <div className="flex overflow-hidden rounded-[8px] border border-[#E2E8F0] dark:border-white/10">
            <button onClick={() => setViewMode('table')} className={cn('p-2 transition-colors', viewMode === 'table' ? 'bg-[var(--primary)] text-white' : 'bg-white text-[#475569] hover:bg-[#F1F5F9] dark:bg-[#1E293B] dark:text-slate-200 dark:hover:bg-white/5')}><LayoutList className="h-4 w-4" /></button>
            <button onClick={() => setViewMode('cards')} className={cn('p-2 transition-colors', viewMode === 'cards' ? 'bg-[var(--primary)] text-white' : 'bg-white text-[#475569] hover:bg-[#F1F5F9] dark:bg-[#1E293B] dark:text-slate-200 dark:hover:bg-white/5')}><LayoutGrid className="h-4 w-4" /></button>
          </div>
        </div>
      </div>

      <div className={cn(viewMode === 'table' && 'overflow-hidden rounded-[12px] border border-[#E2E8F0] bg-white shadow-sm dark:border-white/10 dark:bg-[#1E293B]')}>
        {loading ? (
          <div className="p-4">
            <ProjectListSkeleton />
          </div>
        ) : viewMode === 'table' ? (
          <ProjectTable
            projects={filtered}
            linkBase="/approver/approval-queue"
            showCreatedBy
            showAiScore
            portfolioSummary={portfolioSummary}
            onFilterStateChange={setHasActiveTableFilters}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((project) => (
              <ProjectCard key={project.id} project={project} portfolioSummary={portfolioSummary} />
            ))}
          </div>
        )}
        {!(viewMode === 'table' && hasActiveTableFilters) && (
          <div className="border-t border-[#F1F5F9] px-5 py-3 text-sm text-[#475569] dark:border-white/5 dark:text-slate-200">
            Showing {filtered.length} project{filtered.length === 1 ? '' : 's'}
          </div>
        )}
      </div>
    </div>
  )
}
