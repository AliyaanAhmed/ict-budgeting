import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  Bot,
  Check,
  CheckCircle2,
  ChevronDown,
  Download,
  Eye,
  Inbox,
  ListFilter,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Undo2,
  WalletCards,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { RiskBadge } from '@/components/shared/StatusBadge'
import { cn } from '@/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CurrencyAmount } from '@/components/shared/CurrencyAmount'
import { ClarificationModal } from '@/components/shared/ClarificationModal'
import { ConfirmationModal } from '@/components/shared/ConfirmationModal'
import { useToast } from '@/context/ToastContext'
import { useQueueCounts } from '@/context/QueueCountsContext'
import { projectService } from '@/services/projectService'
import { useCycle } from '@/context/CycleContext'
import { useInstance } from '@/context/InstanceContext'
import { useRoleProjects } from '@/hooks/useRoleProjects'
import type { ApprovalQueueProject, ClarificationPayload } from '@/domain/types'

type ApprovalFilter = 'all' | 'pending' | 'approved' | 'clarification' | 'submitted-dge'
type BudgetTypeFilter = 'all' | 'Operational Recurring' | 'Operational Non-Recurring' | 'New Project' | 'Project Continuation'

const LOCAL_STATUSCODE_BY_STATUS = {
  Approved: 776140003,
  'Submitted to DGE': 776140004,
} as const

function statusAccent(status: ApprovalQueueProject['status']) {
  if (status === 'Pending') return '#286CFF'
  if (status === 'Approved') return '#22C55E'
  if (status === 'Submitted to DGE') return '#7C3AED'
  return '#F59E0B'
}

function statusBadgeClass(status: string) {
  if (status === 'Pending') return 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
  if (status === 'Approved') return 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
  if (status === 'Submitted to DGE') return 'bg-violet-50 text-violet-700 dark:bg-violet-900/20 dark:text-violet-300'
  return 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'
}

const toneConfig = {
  blue:  { accent: '#286CFF', border: '#D4E4FF', iconBg: '#E7F0FF', iconColor: '#286CFF', badge: 'Portfolio value' },
  green: { accent: '#16A34A', border: '#CDEFD7', iconBg: '#EAF9EF', iconColor: '#16A34A', badge: 'Completed' },
  amber: { accent: '#D97706', border: '#F6E4B4', iconBg: '#FFF3D9', iconColor: '#D97706', badge: 'Action needed' },
  red:   { accent: '#DC2626', border: '#FFD1D1', iconBg: '#FFF0F0', iconColor: '#DC2626', badge: 'Returned' },
} as const

function QueueStat({ label, value, icon: Icon, tone = 'blue', sub }: {
  label: string
  value: React.ReactNode
  icon: React.ElementType
  tone?: keyof typeof toneConfig
  sub?: string
}) {
  const c = toneConfig[tone]
  return (
    <div
      className="group overflow-hidden rounded-[24px] border bg-white px-4 py-5 shadow-none transition-all duration-300 hover:-translate-y-0.5 hover:border-[#286CFF] hover:bg-[#F8FBFF] dark:bg-[#18263F] sm:px-5 sm:py-6"
      style={{ borderColor: c.border }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold tracking-[0.04em] text-[#334155] dark:text-slate-50">{label}</p>
          <div className="mt-4 text-3xl font-bold leading-none text-[#0F172A] dark:text-white">{value}</div>
        </div>
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-transform duration-300 group-hover:scale-105"
          style={{ backgroundColor: c.iconBg, color: c.iconColor }}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="mt-5 flex items-center justify-between gap-3">
        <span
          className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold"
          style={{ backgroundColor: `${c.accent}14`, color: c.accent }}
        >
          {c.badge}
        </span>
        {sub ? <p className="text-xs text-[#64748B] dark:text-slate-200">{sub}</p> : null}
      </div>
    </div>
  )
}

function AiPanel({ expanded, onToggle, children }: { expanded: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#B0DBFF] bg-gradient-to-b from-[#E7F5FF] to-white dark:border-white/10 dark:from-[#10213B] dark:to-[#1E293B]">
      <button onClick={onToggle} className="flex w-full items-center gap-3 bg-gradient-to-r from-[#286CFF]/5 to-transparent px-4 py-3 text-left">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#286CFF] to-[#4F98FF] text-white shadow-sm">
          <Sparkles className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm font-bold text-[#0F172A] dark:text-white">AI Portfolio Summary</p>
          <p className="text-xs text-[#64748B] dark:text-slate-200">High-value approvals, risk concentration, and readiness signals</p>
        </div>
        <ChevronDown className={cn('ml-auto h-4 w-4 text-[#286CFF] transition-transform', expanded && 'rotate-180')} />
      </button>
      {expanded && <div className="border-t border-[#B0DBFF]/70 px-4 py-4 dark:border-white/10">{children}</div>}
    </div>
  )
}

function SelectionControl({ selected, onClick, label, disabled = false }: { selected: boolean; onClick: () => void; label: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={selected}
      disabled={disabled}
      onClick={disabled ? undefined : onClick}
      className={cn(
        'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-all',
        selected
          ? 'border-transparent bg-[#286CFF] text-white shadow-sm shadow-blue-100'
          : disabled
            ? 'cursor-not-allowed border-[#E2E8F0] bg-[#F8FAFC] text-transparent dark:border-white/10 dark:bg-white/5'
            : 'border-[#BFD8FF] bg-white text-transparent hover:border-[#286CFF] hover:bg-[#E7F5FF] dark:border-white/10 dark:bg-white/5',
      )}
    >
      {selected && <Check className="h-4 w-4" />}
    </button>
  )
}

function CardSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-2xl border border-[#DDEBFF] bg-white p-4 dark:border-white/10 dark:bg-[#1E293B] sm:p-5">
      <div className="flex gap-3">
        <div className="h-7 w-7 shrink-0 rounded-full bg-[#E7EEF8] dark:bg-white/10" />
        <div className="flex-1 space-y-3">
          <div className="flex justify-between gap-4">
            <div className="space-y-2">
              <div className="h-3 w-32 rounded bg-[#E7EEF8] dark:bg-white/10" />
              <div className="h-5 w-64 rounded bg-[#E7EEF8] dark:bg-white/10" />
              <div className="h-3 w-48 rounded bg-[#E7EEF8] dark:bg-white/10" />
            </div>
            <div className="h-16 w-36 shrink-0 rounded-xl bg-[#F4F8FC] dark:bg-white/5" />
          </div>
          <div className="h-12 rounded-xl bg-[#F4F8FC] dark:bg-white/5" />
          <div className="flex justify-end gap-2 border-t border-[#EAF0F6] pt-3 dark:border-white/10">
            <div className="h-8 w-28 rounded-xl bg-[#E7EEF8] dark:bg-white/10" />
            <div className="h-8 w-20 rounded-xl bg-[#E7EEF8] dark:bg-white/10" />
            <div className="h-8 w-36 rounded-xl bg-[#E7EEF8] dark:bg-white/10" />
          </div>
        </div>
      </div>
    </div>
  )
}

function EmptyState({ search, budgetType }: { search: string; budgetType: string }) {
  const hasFilters = search.trim() || budgetType !== 'all'
  return (
    <div className="rounded-2xl border border-[#DDEBFF] bg-white py-20 text-center dark:border-white/10 dark:bg-[#1E293B]">
      <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-[#F0F7FF] dark:bg-white/5">
        <Inbox className="h-10 w-10 text-[#286CFF]" strokeWidth={1.5} />
      </div>
      <p className="text-base font-bold text-[#0F172A] dark:text-white">No projects here</p>
      <p className="mx-auto mt-2 max-w-xs text-sm text-[#64748B] dark:text-slate-400">
        {hasFilters
          ? 'No projects match your current search or filters. Try adjusting them.'
          : 'This queue is empty. Projects will appear here once they reach the right status.'}
      </p>
      {hasFilters && (
        <p className="mt-3 text-xs font-medium text-[#286CFF]">Try clearing the search or changing the filter.</p>
      )}
    </div>
  )
}

export default function ApprovalQueue() {
  const { selectedCycle } = useCycle()
  const { instanceId } = useInstance()
  const { items: liveProjects } = useRoleProjects('approver', instanceId)
  const [projects, setProjects] = useState<ApprovalQueueProject[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState<ApprovalFilter>('all')
  const [search, setSearch] = useState('')
  const [budgetTypeFilter, setBudgetTypeFilter] = useState<BudgetTypeFilter>('all')
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest')
  const [expandedAiId, setExpandedAiId] = useState<string | null>(null)
  const [aiPortfolioExpanded, setAiPortfolioExpanded] = useState(true)
  const [clarificationProject, setClarificationProject] = useState<ApprovalQueueProject | null>(null)
  const [bulkClarificationOpen, setBulkClarificationOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [pendingApprove, setPendingApprove] = useState<string[] | null>(null)
  const [portfolioSubmittedToDge, setPortfolioSubmittedToDge] = useState(false)
  const [statusOverrides, setStatusOverrides] = useState<Record<string, 'Approved' | 'Submitted to DGE'>>({})
  const { runActionToast } = useToast()
  const { setApprovalCount } = useQueueCounts()

  useEffect(() => {
    let mounted = true
    setLoading(true)
    setFetchError(null)
    projectService.getApprovalQueue()
      .then(data => {
        if (mounted) {
          setProjects(data)
          setLoading(false)
          setApprovalCount(data.filter(p => p.status === 'Pending').length)
        }
      })
      .catch(err => {
        if (mounted) {
          setFetchError(err instanceof Error ? err.message : 'Unable to load approval queue.')
          setLoading(false)
        }
      })
    return () => { mounted = false }
  }, [setApprovalCount])

  const effectiveLiveProjects = useMemo(
    () =>
      liveProjects.map((project) => {
        const override = project.ictBudgetId ? statusOverrides[project.ictBudgetId] : undefined
        if (!override) return project

        return {
          ...project,
          status: override,
          statusCode: LOCAL_STATUSCODE_BY_STATUS[override],
        }
      }),
    [liveProjects, statusOverrides]
  )

  const pendingCount = projects.filter(p => p.status === 'Pending').length
  const approvedCount = projects.filter(p => p.status === 'Approved').length
  const clarificationCount = projects.filter(p => p.status === 'Clarification Pending').length
  const submittedToDgeCount = projects.filter(p => p.status === 'Submitted to DGE').length
  const totalRequested = projects.reduce((s, p) => s + p.requestedBudget, 0)
  const cycleProjectCount = effectiveLiveProjects.length
  const respondentCount = effectiveLiveProjects.filter((project) => project.status === 'Draft' || project.status === 'Clarification Required').length
  const reviewerCount = effectiveLiveProjects.filter((project) => project.status === 'Submitted to Reviewer' || project.status === 'Reviewer Review Completed').length
  const approverOwnedCount = effectiveLiveProjects.filter((project) => project.status === 'Submitted to Approver' || project.status === 'Approved').length
  const allProjectsApproved = cycleProjectCount > 0 && effectiveLiveProjects.every((project) => project.status === 'Approved')
  const hasCycleDgeSubmission = effectiveLiveProjects.some(
    (project) => project.status === 'Submitted to DGE' && project.statusCode === 776140004
  )
  const directDgeFlowActive = hasCycleDgeSubmission
  const portfolioAlreadySubmittedToDge =
    portfolioSubmittedToDge || hasCycleDgeSubmission
  const submitToDgeDisabled = !allProjectsApproved || portfolioAlreadySubmittedToDge

  const filtered = useMemo(() =>
    projects
      .filter(p => {
        const q = search.trim().toLowerCase()
        const matchesSearch = !q || p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q)
        const matchesTab =
          activeFilter === 'all' ? true :
          activeFilter === 'pending' ? p.status === 'Pending' :
          activeFilter === 'approved' ? p.status === 'Approved' :
          activeFilter === 'clarification' ? p.status === 'Clarification Pending' :
          p.status === 'Submitted to DGE'
        const matchesBudget = budgetTypeFilter === 'all' || p.budgetType === budgetTypeFilter
        return matchesSearch && matchesTab && matchesBudget
      })
      .sort((a, b) =>
        sortOrder === 'newest'
          ? b.submittedDateRaw.localeCompare(a.submittedDateRaw)
          : a.submittedDateRaw.localeCompare(b.submittedDateRaw)
      ),
    [projects, activeFilter, search, budgetTypeFilter, sortOrder]
  )

  const visibleActionableIds = filtered.filter(p => p.status === 'Pending').map(p => p.id)
  const allVisibleSelected = visibleActionableIds.length > 0 && visibleActionableIds.every(id => selectedIds.includes(id))
  const actionableSelected = selectedIds.filter(id => projects.find(p => p.id === id)?.status === 'Pending')

  const toggleSelected = (id: string) =>
    setSelectedIds(prev => {
      const project = projects.find(p => p.id === id)
      if (!project || project.status !== 'Pending') {
        return prev
      }
      return prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    })

  const toggleAllVisible = () =>
    setSelectedIds(prev =>
      allVisibleSelected
        ? prev.filter(id => !visibleActionableIds.includes(id))
        : Array.from(new Set([...prev, ...visibleActionableIds]))
    )

  const getIctId = (projectId: string) =>
    projects.find(p => p.id === projectId)?.ictBudgetId ?? ''

  const handleApprove = async (projectIds: string[]) => {
    const ictBudgetIds = projectIds
      .map((id) => getIctId(id))
      .filter(Boolean)

    await runActionToast(
      async () => {
        if (directDgeFlowActive) {
          await projectService.approverSubmitToDge(ictBudgetIds)
        } else {
          for (const id of projectIds) {
            await projectService.approverApprove(getIctId(id))
          }
        }
        setStatusOverrides((prev) => {
          const next = { ...prev }
          for (const ictBudgetId of ictBudgetIds) {
            next[ictBudgetId] = directDgeFlowActive ? 'Submitted to DGE' : 'Approved'
          }
          return next
        })
        setProjects(prev => {
          const updated = prev.map(p =>
            projectIds.includes(p.id)
              ? { ...p, status: directDgeFlowActive ? ('Submitted to DGE' as const) : ('Approved' as const) }
              : p
          )
          setApprovalCount(updated.filter(p => p.status === 'Pending').length)
          return updated
        })
        setSelectedIds(prev => prev.filter(id => !projectIds.includes(id)))
      },
      {
        processingTitle: directDgeFlowActive ? 'Submitting to DGE' : 'Approving project',
        processingDescription: directDgeFlowActive
          ? `Sending ${projectIds.length} project${projectIds.length === 1 ? '' : 's'} directly to DGE review...`
          : `Marking ${projectIds.length} project${projectIds.length === 1 ? '' : 's'} as approved...`,
        successTitle: directDgeFlowActive ? 'Submitted to DGE' : 'Project approved',
        successDescription: directDgeFlowActive
          ? `${projectIds.length} project${projectIds.length === 1 ? '' : 's'} submitted directly to DGE successfully.`
          : `${projectIds.length} project${projectIds.length === 1 ? '' : 's'} approved successfully.`,
        errorTitle: directDgeFlowActive ? 'Unable to submit to DGE' : 'Unable to approve',
        minDurationMs: 1400,
      }
    )
    setPendingApprove(null)
  }

  const handleSubmitToDge = async () => {
    const projectIds = effectiveLiveProjects
      .filter((project) => project.ictBudgetId && project.status === 'Approved')
      .map((project) => project.ictBudgetId as string)

    if (!projectIds.length) {
      return
    }

    await runActionToast(
      async () => {
        await projectService.approverSubmitToDge(projectIds)
        setPortfolioSubmittedToDge(true)
        setStatusOverrides((prev) => {
          const next = { ...prev }
          for (const projectId of projectIds) {
            next[projectId] = 'Submitted to DGE'
          }
          return next
        })
        setProjects((prev) =>
          prev.map((project) =>
            projectIds.includes(project.ictBudgetId)
              ? { ...project, status: 'Submitted to DGE' as const }
              : project
          )
        )
      },
      {
        processingTitle: 'Submitting to DGE',
        processingDescription: 'Assigning approved projects to the strategy team and moving them into DGE review...',
        successTitle: 'Submitted to DGE',
        successDescription: 'All approved projects were submitted to DGE successfully.',
        errorTitle: 'Unable to submit to DGE',
        minDurationMs: 1600,
      }
    )
  }

  const handleRaiseClarification = async (projectIds: string[], payload: ClarificationPayload) => {
    await runActionToast(
      async () => {
        for (const id of projectIds) {
          await projectService.approverRaiseClarification(getIctId(id), payload)
        }
        setProjects(prev => {
          const updated = prev.map(p => projectIds.includes(p.id) ? { ...p, status: 'Clarification Pending' as const } : p)
          setApprovalCount(updated.filter(p => p.status === 'Pending').length)
          return updated
        })
        setSelectedIds(prev => prev.filter(id => !projectIds.includes(id)))
      },
      {
        processingTitle: 'Raising clarification',
        processingDescription: `Returning ${projectIds.length} project${projectIds.length === 1 ? '' : 's'} for clarification...`,
        successTitle: 'Clarification raised',
        successDescription: `${projectIds.length} project${projectIds.length === 1 ? '' : 's'} returned for clarification.`,
        errorTitle: 'Unable to raise clarification',
        minDurationMs: 1400,
      }
    )
    setClarificationProject(null)
    setBulkClarificationOpen(false)
  }

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="rounded-2xl border border-[#DDEBFF] bg-white px-4 py-5 dark:border-white/10 dark:bg-[#1E293B] sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <nav className="mb-2 text-xs text-[#64748B] dark:text-slate-200">Home / Approver / Approval Queue</nav>
            <h1 className="text-2xl font-bold tracking-tight text-[#0F172A] dark:text-white sm:text-3xl">Approver Queue</h1>
            <p className="mt-2 text-sm leading-6 text-[#475569] dark:text-slate-200">
              Review reviewer-cleared submissions, decide final approvals, and return items that need clarification.
            </p>
          </div>
          <div className="rounded-2xl border border-[#B0DBFF] bg-gradient-to-b from-[#E7F5FF] to-white px-4 py-3 dark:border-white/10 dark:from-[#10213B] dark:to-[#1E293B]">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#7C3AED_0%,#9333EA_100%)] text-white shadow-sm">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#0F172A] dark:text-white">AI Approval Summary</p>
                <p className="text-xs text-[#64748B] dark:text-slate-200">
                  {loading ? '—' : `${pendingCount} pending / ${approvedCount} approved`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <QueueStat
          label="Amount Requested"
          value={loading ? '—' : <CurrencyAmount amount={totalRequested} className="text-3xl font-bold leading-none" iconSize={18} />}
          icon={WalletCards}
          tone="blue"
          sub="Current value in approver scope"
        />
        <QueueStat label="Pending Approval" value={loading ? '—' : pendingCount} icon={AlertTriangle} tone="amber" sub="Awaiting final decision" />
        <QueueStat label="Approved" value={loading ? '—' : approvedCount} icon={CheckCircle2} tone="green" sub="Ready for DGE handoff" />
        <QueueStat label="Submitted to DGE" value={loading ? '—' : submittedToDgeCount} icon={Sparkles} tone="red" sub="Already with strategy team" />
      </div>

      <div className="hidden grid grid-cols-2 gap-3 xl:grid-cols-4">
        <QueueStat
          label="Amount Requested"
          value={loading ? '—' : <CurrencyAmount amount={totalRequested} className="text-2xl font-bold" iconSize={16} />}
          icon={WalletCards}
          tone="blue"
        />
        <QueueStat label="Pending Approval" value={loading ? '—' : pendingCount} icon={AlertTriangle} tone="amber" sub="Action needed" />
        <QueueStat label="Approved" value={loading ? '—' : approvedCount} icon={CheckCircle2} tone="green" />
        <QueueStat label="Clarification" value={loading ? '—' : clarificationCount} icon={Sparkles} tone="amber" />
      </div>

      {/* ── AI Portfolio Panel ── */}
      <AiPanel expanded={aiPortfolioExpanded} onToggle={() => setAiPortfolioExpanded(v => !v)}>
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-xl bg-white/85 p-3 dark:bg-white/5">
            <p className="text-xs text-[#64748B]">Projects in cycle</p>
            <p className="mt-1 text-lg font-bold text-[#0F172A] dark:text-white">{cycleProjectCount}</p>
          </div>
          <div className="rounded-xl bg-white/85 p-3 dark:bg-white/5">
            <p className="text-xs text-[#64748B]">With approver</p>
            <p className="mt-1 text-lg font-bold text-green-600">{approverOwnedCount}</p>
          </div>
          <div className="rounded-xl bg-white/85 p-3 dark:bg-white/5">
            <p className="text-xs text-[#64748B]">Submitted to DGE</p>
            <p className="mt-1 text-lg font-bold text-[#7C3AED]">{submittedToDgeCount}</p>
          </div>
        </div>
        <p className="mt-3 text-xs leading-5 text-[#475569] dark:text-slate-200">
          {cycleProjectCount} projects are in this cycle. {respondentCount} are with Respondent, {reviewerCount} are with Reviewer, and {approverOwnedCount} are currently with Approver for final action.
        </p>
      </AiPanel>

      <div className="rounded-[26px] border border-[#D9E6F5] bg-white p-5 shadow-none dark:border-white/10 dark:bg-[#162339]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#286CFF_0%,#4F98FF_100%)] text-white shadow-[0_16px_30px_rgba(40,108,255,0.20)]">
              <Send className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg font-bold text-[#0F172A] dark:text-white">Submit To DGE</p>
              <p className="mt-1 text-sm leading-6 text-[#64748B] dark:text-slate-100">
                Once every project in {selectedCycle?.name ?? 'this cycle'} is approved, move the full ADGE portfolio to the strategy team for DGE review.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-medium">
                <span className="rounded-full bg-[#EEF5FF] px-3 py-1 text-[#286CFF]">{cycleProjectCount} total projects</span>
                <span className="rounded-full bg-[#F0FDF4] px-3 py-1 text-[#16A34A]">{approvedCount} approved</span>
                <span className="rounded-full bg-[#F8FAFC] px-3 py-1 text-[#64748B] dark:bg-white/5 dark:text-slate-100">{respondentCount} respondent / {reviewerCount} reviewer / {approverOwnedCount} approver</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2 lg:min-w-[250px]">
            {portfolioAlreadySubmittedToDge ? (
              <div className="rounded-2xl border border-[#DDD6FE] bg-[#F5F3FF] px-4 py-3 dark:border-[#5B3AA8] dark:bg-[#2A1C4A]">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#7C3AED_0%,#9333EA_100%)] text-white">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#5B21B6] dark:text-[#DDD6FE]">Submitted to DGE</p>
                    <p className="mt-1 text-xs leading-5 text-[#6D28D9] dark:text-slate-100">
                      The ADGE entity has already been handed off to the strategy team. New approver-stage projects will now move directly to DGE.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <Button
                className="h-11 rounded-2xl"
                disabled={submitToDgeDisabled}
                onClick={() => void handleSubmitToDge()}
              >
                <Send className="h-4 w-4" />
                Submit to DGE
              </Button>
            )}
            <p className="text-xs text-[#64748B] dark:text-slate-200">
              {portfolioAlreadySubmittedToDge
                ? 'The approved portfolio has already been submitted to the strategy team.'
                : allProjectsApproved
                  ? 'All cycle projects are approved. The entity is ready for DGE submission.'
                  : 'This stays disabled until every cycle project is approved by the approver.'}
            </p>
          </div>
        </div>
      </div>

      {/* ── Filter bar ── */}
      <div className="rounded-2xl border border-[#DDEBFF] bg-white p-3 dark:border-white/10 dark:bg-[#1E293B]">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <div className="flex flex-wrap gap-2">
            {([
              { id: 'all' as const, label: 'All', count: projects.length },
              { id: 'pending' as const, label: 'Pending', count: pendingCount },
              { id: 'approved' as const, label: 'Approved', count: approvedCount },
              { id: 'clarification' as const, label: 'Clarification', count: clarificationCount },
              { id: 'submitted-dge' as const, label: 'Submitted to DGE', count: submittedToDgeCount },
            ]).map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                className={cn(
                  'inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-colors',
                  activeFilter === tab.id
                    ? 'bg-[#286CFF] text-white shadow-sm'
                    : 'border border-[#DDEBFF] bg-white text-[#475569] hover:border-[#286CFF] hover:text-[#286CFF] dark:border-white/10 dark:bg-white/5 dark:text-slate-200',
                )}
              >
                {tab.label}
                <span className={cn('rounded-full px-2 py-0.5 text-xs', activeFilter === tab.id ? 'bg-white/20' : 'bg-[#EFF6FF] text-[#286CFF] dark:bg-white/10')}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <div className="flex flex-1 flex-col gap-2 lg:flex-row xl:justify-end">
            <div className="relative min-w-0 flex-1 xl:max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by project name"
                className="h-10 w-full rounded-xl border border-[#DDEBFF] bg-white pl-9 pr-4 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#286CFF]/15 dark:border-white/10 dark:bg-[#0F172A]/30 dark:text-white"
              />
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:flex">
              <Select value={budgetTypeFilter} onValueChange={v => setBudgetTypeFilter(v as BudgetTypeFilter)}>
                <SelectTrigger className="h-10 rounded-xl border-[#DDEBFF] lg:w-[200px]">
                  <span className="inline-flex w-full items-center gap-2 whitespace-nowrap">
                    <ListFilter className="h-4 w-4 text-[#64748B]" />
                    <SelectValue placeholder="All Budget Types" />
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Budget Types</SelectItem>
                  <SelectItem value="Operational Recurring">Operational Recurring</SelectItem>
                  <SelectItem value="Operational Non-Recurring">Operational Non-Recurring</SelectItem>
                  <SelectItem value="New Project">New Project</SelectItem>
                  <SelectItem value="Project Continuation">Project Continuation</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortOrder} onValueChange={v => setSortOrder(v as 'newest' | 'oldest')}>
                <SelectTrigger className="h-10 rounded-xl border-[#DDEBFF] lg:w-[180px]">
                  <span className="inline-flex w-full items-center gap-2 whitespace-nowrap">
                    <ListFilter className="h-4 w-4 text-[#64748B]" />
                    <SelectValue />
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" size="sm" className="h-10 rounded-xl">
              <Download className="h-4 w-4" />Export
            </Button>
          </div>
        </div>
      </div>

      {/* ── Bulk selection bar ── */}
      <div className="rounded-2xl border border-[#DDEBFF] bg-white p-3 dark:border-white/10 dark:bg-[#1E293B]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3 text-sm text-[#475569] dark:text-slate-200">
            <SelectionControl selected={allVisibleSelected} onClick={toggleAllVisible} label="Select all visible" />
            <span>
              <span className="font-semibold text-[#0F172A] dark:text-white">Bulk Selection</span>
              <span className="block text-xs text-[#64748B] dark:text-slate-200">
                {selectedIds.length} selected / {filtered.length} visible
                {actionableSelected.length > 0 && actionableSelected.length < selectedIds.length && (
                  <span className="ml-1 text-amber-600">({actionableSelected.length} actionable)</span>
                )}
              </span>
            </span>
          </div>
          <div className="flex flex-wrap gap-2 sm:ml-auto">
            <Button
              variant="outline"
              size="sm"
              disabled={actionableSelected.length === 0}
              onClick={() => setBulkClarificationOpen(true)}
            >
              <Undo2 className="h-4 w-4" />Raise Clarification
            </Button>
            <Button
              size="sm"
              disabled={actionableSelected.length === 0}
              className="bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
              onClick={() => setPendingApprove(actionableSelected)}
            >
              {directDgeFlowActive ? <Send className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
              {directDgeFlowActive ? 'Submit Selected to DGE' : 'Approve Selected'}
            </Button>
          </div>
        </div>
      </div>

      {/* ── Error ── */}
      {fetchError && (
        <div className="rounded-2xl border border-[#FFD4D1] bg-[#FFF5F5] px-4 py-3 text-sm text-[#B42318]">
          {fetchError}
        </div>
      )}

      {/* ── Queue cards ── */}
      <div className="space-y-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
        ) : filtered.length === 0 ? (
          <EmptyState search={search} budgetType={budgetTypeFilter} />
        ) : (
          filtered.map(proj => {
            const accent = statusAccent(proj.status)
            const isSelected = selectedIds.includes(proj.id)
            const isActionable = proj.status === 'Pending'
            const aiExpanded = expandedAiId === proj.id

            return (
              <article
                key={proj.id}
                className={cn(
                  'overflow-hidden rounded-2xl border bg-white transition-all duration-200 hover:-translate-y-0.5 dark:bg-[#1E293B]',
                  isSelected && 'ring-2 ring-[#286CFF]/10',
                )}
                style={{ borderColor: isSelected ? '#286CFF' : `${accent}4D` }}
              >
                <div className="p-4 sm:p-5">
                  {/* Top row */}
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex min-w-0 flex-1 gap-3">
                      <SelectionControl selected={isSelected} disabled={!isActionable} onClick={() => toggleSelected(proj.id)} label={`Select ${proj.name}`} />
                      <div className="min-w-0 flex-1">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs text-[#94A3B8]">{proj.id}</span>
                          <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', statusBadgeClass(proj.status))}>
                            {proj.status}
                          </span>
                          <RiskBadge risk={proj.riskLevel} />
                         
                        </div>
                        <h3 className="text-lg font-bold text-[#0F172A] dark:text-white">{proj.name}</h3>
                        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#475569] dark:text-slate-200">
                          {proj.budgetType && proj.budgetType !== '-' && <><span>{proj.budgetType}</span><span>/</span></>}
                          {proj.glCodeCount > 0 && <><span>{proj.glCodeCount} budget codes</span><span>/</span></>}
                          <span>Reviewed by {proj.reviewedBy}</span>
                          {proj.submittedDate && proj.submittedDate !== '-' && (
                            <><span>/</span><span>Submitted {proj.submittedDate}</span></>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Budget box */}
                    <div
                      className="shrink-0 rounded-xl px-4 py-3 text-left lg:text-end"
                      style={{ background: `${accent}0A`, border: `1px solid ${accent}30` }}
                    >
                      <div className="mb-1 flex items-center justify-between gap-3 lg:justify-end">
                        <p className="text-xs font-semibold" style={{ color: accent }}>Requested Budget</p>
                        <div
                          className="flex h-7 w-7 items-center justify-center rounded-full"
                          style={{ background: `${accent}14`, color: accent }}
                        >
                          <WalletCards className="h-3.5 w-3.5" />
                        </div>
                      </div>
                      <CurrencyAmount amount={proj.requestedBudget} className="text-2xl font-bold text-[#0F172A] dark:text-white" iconSize={18} />
                    </div>
                  </div>

                  {/* AI insight row */}
                  <div className="mt-4 rounded-xl border border-[#B0DBFF] bg-gradient-to-b from-[#E7F5FF] to-white dark:border-white/10 dark:from-[#10213B] dark:to-[#1E293B] sm:ml-10">
                    <button
                      onClick={() => setExpandedAiId(aiExpanded ? null : proj.id)}
                      className="flex w-full items-center gap-2 px-3 py-2.5 text-left"
                    >
                      <Sparkles className="h-4 w-4 text-[#286CFF]" />
                      <span className="text-sm font-semibold text-[#0F172A] dark:text-white">AI Approval Insight</span>
                      {proj.aiConfidence > 0 && (
                        <span className="text-xs text-[#64748B] dark:text-slate-200">{proj.aiConfidence}% confidence</span>
                      )}
                      <ChevronDown className={cn('ml-auto h-4 w-4 text-[#286CFF] transition-transform', aiExpanded && 'rotate-180')} />
                    </button>
                    {aiExpanded && (
                      <div className="border-t border-[#B0DBFF]/70 px-4 py-3 text-xs leading-5 text-[#475569] dark:border-white/10 dark:text-slate-200">
                        {proj.summary || 'AI approval analysis will appear here once configured. Review budget assumptions, evidence, and strategic alignment before approving.'}
                      </div>
                    )}
                  </div>

                  {/* Card actions */}
                  <div className="mt-4 flex flex-col gap-2 border-t border-[#EAF0F6] pt-4 dark:border-white/10 sm:ml-10 sm:flex-row sm:justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!isActionable}
                      onClick={() => { if (isActionable) setClarificationProject(proj) }}
                    >
                      <Undo2 className="h-4 w-4" />Raise Clarification
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/approver/approval-queue/${proj.id}`}>
                        <Eye className="h-4 w-4" />Review
                      </Link>
                    </Button>
                    <Button
                      size="sm"
                      disabled={!isActionable}
                      className="bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                      onClick={() => { if (isActionable) setPendingApprove([proj.id]) }}
                    >
                      {directDgeFlowActive ? <Send className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
                      {directDgeFlowActive ? 'Submit to DGE' : 'Approve Project'}
                    </Button>
                  </div>
                </div>
              </article>
            )
          })
        )}
      </div>

      {/* ── Confirm: approve ── */}
      <ConfirmationModal
        open={pendingApprove !== null}
        onOpenChange={open => { if (!open) setPendingApprove(null) }}
        title={
          (pendingApprove?.length ?? 0) === 1
            ? directDgeFlowActive ? 'Submit Project to DGE?' : 'Approve Project?'
            : directDgeFlowActive ? `Submit ${pendingApprove?.length ?? 0} Projects to DGE?` : `Approve ${pendingApprove?.length ?? 0} Projects?`
        }
        description={
          (pendingApprove?.length ?? 0) === 1
            ? directDgeFlowActive
              ? 'This cycle has already been submitted once to DGE, so this project will move directly into DGE review.'
              : 'This will mark the project as approved and keep it in the approver portfolio until the full entity is submitted to DGE.'
            : directDgeFlowActive
              ? `This will move ${pendingApprove?.length ?? 0} projects directly into DGE review.`
              : `This will approve ${pendingApprove?.length ?? 0} projects and keep them ready for the later DGE submission step.`
        }
        confirmLabel={directDgeFlowActive ? 'Submit to DGE' : 'Approve Project'}
        onConfirm={() => { if (pendingApprove) void handleApprove(pendingApprove) }}
        tone="primary"
      />

      {/* ── Clarification: single card ── */}
      <ClarificationModal
        open={Boolean(clarificationProject)}
        onOpenChange={open => { if (!open) setClarificationProject(null) }}
        projectName={clarificationProject?.name ?? ''}
        onSubmit={(payload) => { if (clarificationProject) void handleRaiseClarification([clarificationProject.id], payload) }}
      />

      {/* ── Clarification: bulk ── */}
      <ClarificationModal
        open={bulkClarificationOpen}
        onOpenChange={setBulkClarificationOpen}
        projectName={`${actionableSelected.length} selected project${actionableSelected.length === 1 ? '' : 's'}`}
        onSubmit={(payload) => void handleRaiseClarification(actionableSelected, payload)}
      />
    </div>
  )
}
