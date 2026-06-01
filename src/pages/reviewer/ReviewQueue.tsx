import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Check,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  FileX,
  Inbox,
  ListFilter,
  Loader2,
  MessageSquare,
  Search,
  Send,
  Sparkles,
  WalletCards,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { RiskBadge } from '@/components/shared/StatusBadge'
import { CurrencyAmount } from '@/components/shared/CurrencyAmount'
import { cn } from '@/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ClarificationModal } from '@/components/shared/ClarificationModal'
import { ConfirmationModal } from '@/components/shared/ConfirmationModal'
import { useInstance } from '@/context/InstanceContext'
import { useToast } from '@/context/ToastContext'
import { useQueueCounts } from '@/context/QueueCountsContext'
import { useRoleProjects } from '@/hooks/useRoleProjects'
import { projectService } from '@/services/projectService'
import { getAllAiSummaryRecordsByBudgetId, invalidateBudgetOverviewRecord, type StoredBudgetOverviewRecord } from '@/services/documentAiSummaryStoreService'
import type { ClarificationPayload, ReviewQueueProject } from '@/domain/types'

function toDisplayText(value: unknown): string {
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (Array.isArray(value)) return value.map((item) => toDisplayText(item)).filter(Boolean).join(', ')
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>
    if (typeof record.text_template === 'string') return record.text_template.trim()
    if (typeof record.text === 'string') return record.text.trim()
    if (typeof record.value === 'string') return record.value.trim()
  }
  return ''
}

type ReviewFilter = 'all' | 'to-review' | 'reviewed' | 'clarification'
type BudgetTypeFilter = 'all' | 'Operational Recurring' | 'Operational Non-Recurring' | 'New Project' | 'Project Continuation'

function statusAccent(status: ReviewQueueProject['status']) {
  if (status === 'To Review') return '#286CFF'
  if (status === 'Reviewed') return '#22C55E'
  return '#F59E0B'
}

function statusBadgeClass(status: string) {
  if (status === 'To Review') return 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
  if (status === 'Reviewed') return 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
  return 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'
}

const toneConfig = {
  blue:  { accent: '#286CFF', border: '#D4E4FF', iconBg: '#E7F0FF', iconColor: '#286CFF', badge: 'Live queue' },
  green: { accent: '#16A34A', border: '#CDEFD7', iconBg: '#EAF9EF', iconColor: '#16A34A', badge: 'Completed' },
  amber: { accent: '#D97706', border: '#F6E4B4', iconBg: '#FFF3D9', iconColor: '#D97706', badge: 'Action needed' },
  red:   { accent: '#DC2626', border: '#FFD1D1', iconBg: '#FFF0F0', iconColor: '#DC2626', badge: 'Monitor' },
} as const

function QueueStat({ label, value, icon: Icon, tone = 'blue', sub, onClick, active = false }: {
  label: string
  value: React.ReactNode
  icon: React.ElementType
  tone?: keyof typeof toneConfig
  sub?: string
  onClick?: () => void
  active?: boolean
}) {
  const c = toneConfig[tone]
  const isClickable = Boolean(onClick)
  return (
    <button
      type="button"
      onClick={onClick}
      className="group overflow-hidden rounded-[24px] border bg-white px-4 py-5 shadow-none transition-all duration-300 hover:-translate-y-0.5 hover:border-[#286CFF] hover:bg-[#F8FBFF] dark:bg-[#18263F] sm:px-5 sm:py-6"
      style={{ borderColor: active ? '#286CFF' : c.border }}
      disabled={!isClickable}
      aria-pressed={active}
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
    </button>
  )
}

function AiInsightRow({ confidence, children }: {
  confidence: number
  children: React.ReactNode
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#E9D5FF] bg-white dark:border-white/10 dark:bg-[#1E293B]">
      <div className="flex items-center gap-3 bg-gradient-to-b from-[#FDF7FF] to-white px-4 py-3 dark:from-[#2A123D] dark:to-[#1E293B]">
        <Sparkles className="h-4 w-4 shrink-0 text-[#A855F7] dark:text-[#E9D5FF]" />
        <span className="text-sm font-semibold text-[#0F172A] dark:text-white">Review Insights</span>
        {confidence > 0 && (
          <span className="rounded-full border border-[#E9D5FF] bg-white px-2.5 py-1 text-xs font-medium text-[#64748B] dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
            {confidence}% confidence
          </span>
        )}
      </div>
      <div className="border-t border-[#E9D5FF] bg-white px-4 py-4 dark:border-white/10 dark:bg-[#1E293B]">{children}</div>
    </div>
  )
}

function normalizePolicyMatchType(value: unknown) {
  const normalized = toDisplayText(value).trim().toLowerCase()
  if (normalized === 'potential conflict') return 'Potential Conflict' as const
  if (normalized === 'coordination required') return 'Coordination Required' as const
  if (normalized === 'allowed with conditions') return 'Allowed With Conditions' as const
  return null
}

function getBudgetOverviewPolicyCounts(parsed: StoredBudgetOverviewRecord['parsedData']) {
  const counts = {
    potentialConflict: 0,
    coordinationRequired: 0,
    allowedWithConditions: 0,
  }

  const visited = new Set<unknown>()

  const visit = (value: unknown) => {
    if (!value || visited.has(value)) return
    if (typeof value !== 'object') return
    visited.add(value)

    if (Array.isArray(value)) {
      value.forEach((item) => {
        const matchType = normalizePolicyMatchType(
          (item as Record<string, unknown>)?.matchType ?? (item as Record<string, unknown>)?.['Match Type']
        )
        if (matchType === 'Potential Conflict') counts.potentialConflict += 1
        if (matchType === 'Coordination Required') counts.coordinationRequired += 1
        if (matchType === 'Allowed With Conditions') counts.allowedWithConditions += 1
        visit(item)
      })
      return
    }

    const record = value as Record<string, unknown>
    Object.values(record).forEach(visit)
  }

  visit(parsed)

  return counts
}

function BudgetOverviewInsight({ ictBudgetId }: { ictBudgetId: string }) {
  const [data, setData] = useState<StoredBudgetOverviewRecord | null>(null)
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    if (!ictBudgetId) { setLoadingData(false); return }
    let mounted = true
    getAllAiSummaryRecordsByBudgetId(ictBudgetId)
      .then(({ budgetOverviewRecord }) => {
        if (mounted) { setData(budgetOverviewRecord); setLoadingData(false) }
      })
      .catch(() => { if (mounted) setLoadingData(false) })
    return () => { mounted = false }
  }, [ictBudgetId])

  if (loadingData) {
    return (
      <div className="flex items-center gap-2 py-2 text-xs text-[#64748B]">
        <Loader2 className="h-3.5 w-3.5 animate-spin text-[#A855F7]" />
        <span>Analysing project...</span>
      </div>
    )
  }

  const parsed = data?.parsedData
  if (!parsed) {
    return (
      <p className="rounded-xl bg-[#F8FAFC] px-3 py-2.5 text-xs text-[#94A3B8] dark:bg-white/5 dark:text-slate-400">
        AI budget overview not yet available for this project.
      </p>
    )
  }

  const overall = parsed.overall_assessment
  const summary = toDisplayText(overall?.executive_summary)
  const evidenceScore = parsed.score_inputs?.document_evidence?.evidence_score
  const pf = parsed.score_inputs?.project_fields
  const pfTotal = pf?.evaluated_count ?? 0
  const pfMatched = (pf?.match_count ?? 0) + (pf?.close_match_count ?? 0)
  const pfPercentage = pfTotal > 0 ? Math.min(100, Math.round((pfMatched / pfTotal) * 100)) : 0
  const strategicFit = toDisplayText(parsed.score_inputs?.strategic_alignment?.match_type)
  const budgetAccount = parsed.score_inputs?.budget_account
  const budgetAccountLabel = !budgetAccount
    ? '-'
    : (budgetAccount.account_code_match_count ?? 0) >= (budgetAccount.line_item_count ?? 1) &&
        (budgetAccount.amount_match_count ?? 0) >= (budgetAccount.line_item_count ?? 1)
      ? 'Full'
      : (budgetAccount.account_code_match_count ?? 0) > 0 || (budgetAccount.amount_match_count ?? 0) > 0
        ? 'Partial'
        : 'Missing'
  const aiFlags = [
    parsed.ai_review_flags?.evidence_risk?.flag
      ? { key: 'evidence_risk', label: toDisplayText(parsed.ai_review_flags.evidence_risk.label) || 'Evidence Risk', severity: toDisplayText(parsed.ai_review_flags.evidence_risk.severity) || 'High' }
      : null,
    parsed.ai_review_flags?.dge_budget_consideration_risk?.flag
      ? { key: 'dge_budget_consideration_risk', label: toDisplayText(parsed.ai_review_flags.dge_budget_consideration_risk.label) || 'DGE Budget Consideration Risk', severity: toDisplayText(parsed.ai_review_flags.dge_budget_consideration_risk.severity) || 'Medium' }
      : null,
    parsed.ai_review_flags?.strategic_alignment_risk?.flag
      ? { key: 'strategic_alignment_risk', label: toDisplayText(parsed.ai_review_flags.strategic_alignment_risk.label) || 'Strategic Alignment Risk', severity: toDisplayText(parsed.ai_review_flags.strategic_alignment_risk.severity) || 'Medium' }
      : null,
    parsed.ai_review_flags?.budget_accuracy_risk?.flag
      ? { key: 'budget_accuracy_risk', label: toDisplayText(parsed.ai_review_flags.budget_accuracy_risk.label) || 'Budget Accuracy Risk', severity: toDisplayText(parsed.ai_review_flags.budget_accuracy_risk.severity) || 'High' }
      : null,
    parsed.ai_review_flags?.clarification_required?.flag
      ? { key: 'clarification_required', label: 'May Require Clarification', severity: toDisplayText(parsed.ai_review_flags.clarification_required.severity) || 'High' }
      : null,
  ].filter((flag): flag is { key: string; label: string; severity: string } => Boolean(flag))
    .filter((flag) => flag.severity.toLowerCase() !== 'low')
  const policyCounts = getBudgetOverviewPolicyCounts(parsed)

  return (
    <div className="space-y-3">
      {summary && (
        <div className="rounded-2xl border border-[#EAF0F6] bg-[#F8FBFF] px-3.5 py-3 dark:border-white/10 dark:bg-white/5">
          <p className="line-clamp-3 text-xs leading-5 text-[#475569] dark:text-slate-300">{summary}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          {evidenceScore !== undefined && (
            <div className="rounded-2xl border border-[#E7EEF8] bg-white px-3 py-3 dark:border-white/10 dark:bg-[#243248]">
              <p className="mb-2 text-xs font-semibold text-[#0F172A] dark:text-white">Document Evidence</p>
              <div className="flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#E7EEF8] dark:bg-white/10">
                  <div className="h-full rounded-full bg-[#286CFF] transition-all" style={{ width: `${Math.min(100, Math.round(evidenceScore))}%` }} />
                </div>
                <span className="tabular-nums text-xs font-bold text-[#286CFF]">{Math.round(evidenceScore)}%</span>
              </div>
            </div>
          )}
          {pfTotal > 0 && (
            <div className="rounded-2xl border border-[#E7EEF8] bg-white px-3 py-3 dark:border-white/10 dark:bg-[#243248]">
              <p className="mb-2 text-xs font-semibold text-[#0F172A] dark:text-white">Project Fields</p>
              <div className="flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#E7EEF8] dark:bg-white/10">
                  <div className="h-full rounded-full bg-[#A855F7] transition-all" style={{ width: `${pfPercentage}%` }} />
                </div>
                <span className="tabular-nums text-xs font-bold text-[#A855F7]">{pfPercentage}%</span>
              </div>
            </div>
          )}
          <div className="rounded-2xl border border-[#E7EEF8] bg-white px-3 py-3 dark:border-white/10 dark:bg-[#243248]">
            <p className="mb-2 text-xs font-semibold text-[#0F172A] dark:text-white">Budget Account</p>
            <p className="text-xs font-bold text-[#0F172A] dark:text-white">{budgetAccountLabel}</p>
          </div>
          <div className="rounded-2xl border border-[#E7EEF8] bg-white px-3 py-3 dark:border-white/10 dark:bg-[#243248]">
            <p className="mb-2 text-xs font-semibold text-[#0F172A] dark:text-white">Strategic Fit</p>
            <p className="text-xs font-bold text-[#0F172A] dark:text-white">{strategicFit || '-'}</p>
          </div>
      </div>

      {aiFlags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {aiFlags.map((flag) => (
            <span
              key={flag.key}
              className={cn(
                'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold',
                flag.severity.toLowerCase() === 'high'
                  ? 'border-[#FECACA] bg-[#FEF2F2] text-[#DC2626] dark:border-[#DC2626]/30 dark:bg-[#DC2626]/12 dark:text-[#FCA5A5]'
                  : 'border-[#FDE68A] bg-[#FFF8E8] text-[#B45309] dark:border-[#B45309]/30 dark:bg-[#3A2810] dark:text-[#F6D28A]'
              )}
            >
              {flag.label}
            </span>
          ))}
        </div>
      )}

      <div className="rounded-2xl border border-[#E9D5FF] bg-[#FDF8FF] px-4 py-3 dark:border-white/10 dark:bg-white/5">
        <div className="flex items-center gap-2.5">
          <Sparkles className="h-4 w-4 shrink-0 text-[#A855F7] dark:text-[#E9D5FF]" />
          <p className="text-sm font-semibold text-[#0F172A] dark:text-white">AI Budget Consideration</p>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="rounded-full border border-[#FECACA] bg-[#FEF2F2] px-3 py-1 text-xs font-semibold text-[#DC2626] dark:border-[#DC2626]/30 dark:bg-[#DC2626]/12 dark:text-[#FCA5A5]">
            Potential Conflict ({policyCounts.potentialConflict})
          </span>
          <span className="rounded-full border border-[#FDE68A] bg-[#FFF8E8] px-3 py-1 text-xs font-semibold text-[#B45309] dark:border-[#B45309]/30 dark:bg-[#3A2810] dark:text-[#F6D28A]">
            Coordination Required ({policyCounts.coordinationRequired})
          </span>
          <span className="rounded-full border border-[#BBF7D0] bg-[#EEF9F1] px-3 py-1 text-xs font-semibold text-[#16A34A] dark:border-[#16A34A]/30 dark:bg-[#123123] dark:text-[#86EFAC]">
            Allowed With Conditions ({policyCounts.allowedWithConditions})
          </span>
        </div>
      </div>
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
            <div className="h-8 w-24 rounded-xl bg-[#E7EEF8] dark:bg-white/10" />
            <div className="h-8 w-20 rounded-xl bg-[#E7EEF8] dark:bg-white/10" />
            <div className="h-8 w-32 rounded-xl bg-[#E7EEF8] dark:bg-white/10" />
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

export default function ReviewQueue() {
  const { instanceId } = useInstance()
  const { items: cycleProjects } = useRoleProjects('reviewer', instanceId)
  const [projects, setProjects] = useState<ReviewQueueProject[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState<ReviewFilter>('all')
  const [search, setSearch] = useState('')
  const [budgetTypeFilter, setBudgetTypeFilter] = useState<BudgetTypeFilter>('all')
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest')
  const [clarificationProject, setClarificationProject] = useState<ReviewQueueProject | null>(null)
  const [bulkClarificationOpen, setBulkClarificationOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [pendingSubmit, setPendingSubmit] = useState<string[] | null>(null)
  const { runActionToast } = useToast()
  const { setReviewCount } = useQueueCounts()
  const hasCycleDgeSubmission = cycleProjects.some(
    (cycleProject) =>
      cycleProject.status === 'Submitted to DGE' && cycleProject.statusCode === 776140004
  )

  useEffect(() => {
    let mounted = true
    setLoading(true)
    setFetchError(null)
    projectService.getReviewQueue()
      .then(data => {
        if (mounted) {
          setProjects(data)
          setLoading(false)
          setReviewCount(data.filter(p => p.status === 'To Review').length)
        }
      })
      .catch(err => {
        if (mounted) {
          setFetchError(err instanceof Error ? err.message : 'Unable to load review queue.')
          setLoading(false)
        }
      })
    return () => { mounted = false }
  }, [setReviewCount])

  const toReviewCount = projects.filter(p => p.status === 'To Review').length
  const reviewedCount = projects.filter(p => p.status === 'Reviewed').length
  const clarificationCount = projects.filter(p => p.status === 'Clarification Pending').length
  const totalBudget = projects.reduce((s, p) => s + p.requestedBudget, 0)

  const filtered = projects
    .filter(p => {
      const q = search.trim().toLowerCase()
      const matchesSearch = !q || p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q)
      const matchesTab =
        activeFilter === 'all' ? true :
        activeFilter === 'to-review' ? p.status === 'To Review' :
        activeFilter === 'reviewed' ? p.status === 'Reviewed' :
        p.status === 'Clarification Pending'
      const matchesBudget = budgetTypeFilter === 'all' || p.budgetType === budgetTypeFilter
      return matchesSearch && matchesTab && matchesBudget
    })
    .sort((a, b) =>
      sortOrder === 'newest'
        ? b.submittedDateRaw.localeCompare(a.submittedDateRaw)
        : a.submittedDateRaw.localeCompare(b.submittedDateRaw)
    )

  const isProjectActionable = (project: ReviewQueueProject) =>
    project.isActionable !== false &&
    (
      project.status === 'To Review' ||
      (!hasCycleDgeSubmission && project.status === 'Reviewed')
    )

  const visibleActionableIds = filtered.filter(isProjectActionable).map(p => p.id)
  const allVisibleSelected = visibleActionableIds.length > 0 && visibleActionableIds.every(id => selectedIds.includes(id))
  const completableSelected = hasCycleDgeSubmission
    ? []
    : selectedIds.filter(id => {
        const project = projects.find(p => p.id === id)
        return Boolean(project && project.status === 'To Review' && isProjectActionable(project))
      })
  const submittableSelected = selectedIds.filter(id => {
    const project = projects.find(p => p.id === id)
    if (!project || !isProjectActionable(project)) return false
    return hasCycleDgeSubmission ? project.status === 'To Review' : project.status === 'Reviewed'
  })
  const clarificationSelected = selectedIds.filter(id => {
    const project = projects.find(p => p.id === id)
    return Boolean(project && (project.status === 'To Review' || project.status === 'Reviewed') && isProjectActionable(project))
  })

  const toggleSelected = (id: string) =>
    setSelectedIds(prev => {
      const project = projects.find(p => p.id === id)
      if (!project || !isProjectActionable(project)) {
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

  const handleCompleteReview = async (projectIds: string[]) => {
    await runActionToast(
      async () => {
        for (const id of projectIds) {
          await projectService.reviewerCompleteReview(getIctId(id))
        }
        await Promise.allSettled(projectIds.map(id => {
          const ictId = getIctId(id)
          return ictId ? invalidateBudgetOverviewRecord(ictId) : Promise.resolve()
        }))
        setProjects(prev => {
          const updated = prev.map(p => projectIds.includes(p.id) ? { ...p, status: 'Reviewed' as const } : p)
          setReviewCount(updated.filter(p => p.status === 'To Review').length)
          return updated
        })
        setSelectedIds(prev => prev.filter(id => !projectIds.includes(id)))
      },
      {
        processingTitle: 'Completing review',
        processingDescription: `Completing reviewer assessment for ${projectIds.length} project${projectIds.length === 1 ? '' : 's'}...`,
        successTitle: 'Review completed',
        successDescription: `${projectIds.length} project${projectIds.length === 1 ? '' : 's'} marked ready for approver submission.`,
        errorTitle: 'Unable to complete review',
        minDurationMs: 1400,
      }
    )
  }

  const handleSubmitToApprover = async (projectIds: string[]) => {
    await runActionToast(
      async () => {
        for (const id of projectIds) {
          await projectService.reviewerApprove(getIctId(id))
        }
        await Promise.allSettled(projectIds.map(id => {
          const ictId = getIctId(id)
          return ictId ? invalidateBudgetOverviewRecord(ictId) : Promise.resolve()
        }))
        setProjects(prev => {
          const updated = prev.filter(p => !projectIds.includes(p.id))
          setReviewCount(updated.filter(p => p.status === 'To Review').length)
          return updated
        })
        setSelectedIds(prev => prev.filter(id => !projectIds.includes(id)))
      },
      {
        processingTitle: 'Submitting to approver',
        processingDescription: hasCycleDgeSubmission
          ? `Forwarding ${projectIds.length} project${projectIds.length === 1 ? '' : 's'} directly to approver review...`
          : `Forwarding ${projectIds.length} project${projectIds.length === 1 ? '' : 's'} to approver review...`,
        successTitle: 'Submitted to approver',
        successDescription: `${projectIds.length} project${projectIds.length === 1 ? '' : 's'} forwarded successfully.`,
        errorTitle: 'Unable to submit to approver',
        minDurationMs: 1400,
      }
    )
    setPendingSubmit(null)
  }

  const handleRaiseClarification = async (projectIds: string[], payload: ClarificationPayload) => {
    await runActionToast(
      async () => {
        for (const id of projectIds) {
          await projectService.reviewerRaiseClarification(getIctId(id), payload)
        }
        await Promise.allSettled(projectIds.map(id => {
          const ictId = getIctId(id)
          return ictId ? invalidateBudgetOverviewRecord(ictId) : Promise.resolve()
        }))
        setProjects(prev => {
          const updated = prev.map(p => projectIds.includes(p.id) ? { ...p, status: 'Clarification Pending' as const } : p)
          setReviewCount(updated.filter(p => p.status === 'To Review').length)
          return updated
        })
        setSelectedIds(prev => prev.filter(id => !projectIds.includes(id)))
      },
      {
        processingTitle: 'Raising clarification',
        processingDescription: `Sending ${projectIds.length} project${projectIds.length === 1 ? '' : 's'} back for clarification...`,
        successTitle: 'Clarification raised',
        successDescription: `${projectIds.length} project owner${projectIds.length === 1 ? '' : 's'} notified.`,
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
            <nav className="mb-2 text-xs text-[#64748B] dark:text-slate-200">Home / Reviewer / Review Queue</nav>
            <h1 className="text-2xl font-bold tracking-tight text-[#0F172A] dark:text-white sm:text-3xl">Review Queue</h1>
            <p className="mt-2 text-sm leading-6 text-[#475569] dark:text-slate-200">
              Review respondent submissions, complete reviewer assessment, raise clarifications, and then submit ready items to the approver.
            </p>
          </div>
          <div className="rounded-2xl border border-[#E9D5FF] bg-gradient-to-b from-[#FDF7FF] to-white px-4 py-3 dark:border-white/10 dark:from-[#2A123D] dark:to-[#1E293B]">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 shrink-0 text-[#A855F7]" />
              <div>
                <p className="text-sm font-bold text-[#0F172A] dark:text-white">AI Queue Summary</p>
                <p className="text-xs text-[#64748B] dark:text-slate-200">
                  {loading ? '—' : `${toReviewCount} to review / ${clarificationCount} awaiting clarification`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <QueueStat
          label="To Review"
          value={loading ? '—' : toReviewCount}
          icon={Clock}
          tone="amber"
          sub="Waiting for reviewer action"
          onClick={() => setActiveFilter('to-review')}
          active={activeFilter === 'to-review'}
        />
        <QueueStat
          label="Reviewed"
          value={loading ? '—' : reviewedCount}
          icon={CheckCircle2}
          tone="green"
          sub="Ready for approver submission"
          onClick={() => setActiveFilter('reviewed')}
          active={activeFilter === 'reviewed'}
        />
        <QueueStat
          label="Clarification"
          value={loading ? '—' : clarificationCount}
          icon={MessageSquare}
          tone="red"
          sub="Returned for respondent input"
          onClick={() => setActiveFilter('clarification')}
          active={activeFilter === 'clarification'}
        />
        <QueueStat
          label="Total Budget"
          value={loading ? '—' : <CurrencyAmount amount={totalBudget} className="text-3xl font-bold leading-none" iconSize={18} />}
          icon={WalletCards}
          tone="blue"
          sub="Combined value of items in scope"
        />
      </div>

      <div className="hidden grid grid-cols-2 gap-3 xl:grid-cols-4">
        <QueueStat label="To Review" value={loading ? '—' : toReviewCount} icon={Clock} tone="amber" />
        <QueueStat label="Reviewed" value={loading ? '—' : reviewedCount} icon={CheckCircle2} tone="green" />
        <QueueStat label="Clarification" value={loading ? '—' : clarificationCount} icon={MessageSquare} tone="amber" />
        <QueueStat
          label="Total Budget"
          value={loading ? '—' : <CurrencyAmount amount={totalBudget} className="text-2xl font-bold" iconSize={16} />}
          icon={WalletCards}
          tone="blue"
        />
      </div>

      {/* ── Filter bar ── */}
      <div className="rounded-2xl border border-[#DDEBFF] bg-white p-3 dark:border-white/10 dark:bg-[#1E293B]">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <div className="flex flex-wrap gap-2">
            {([
              { id: 'all' as const, label: 'All', count: projects.length },
              { id: 'to-review' as const, label: 'To Review', count: toReviewCount },
              { id: 'reviewed' as const, label: 'Reviewed', count: reviewedCount },
              { id: 'clarification' as const, label: 'Clarification', count: clarificationCount },
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
                {clarificationSelected.length > 0 && clarificationSelected.length < selectedIds.length && (
                  <span className="ml-1 text-amber-600">({clarificationSelected.length} actionable)</span>
                )}
              </span>
            </span>
          </div>
          <div className="flex flex-wrap gap-2 sm:ml-auto">
            <Button
              variant="outline"
              size="sm"
              disabled={clarificationSelected.length === 0}
              onClick={() => setBulkClarificationOpen(true)}
            >
              <MessageSquare className="h-4 w-4" />Raise Clarification
            </Button>
            {!hasCycleDgeSubmission && (
              <Button
                variant="outline"
                size="sm"
                disabled={completableSelected.length === 0}
                onClick={() => void handleCompleteReview(completableSelected)}
              >
                <Check className="h-4 w-4" />Mark as Reviewed
              </Button>
            )}
            <Button
              size="sm"
              disabled={submittableSelected.length === 0}
              onClick={() => setPendingSubmit(submittableSelected)}
            >
              <Send className="h-4 w-4" />Submit to Approver
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
            const isActionable = isProjectActionable(proj)
            const isCompletable = !hasCycleDgeSubmission && proj.status === 'To Review' && isActionable
            const isSubmittable = (hasCycleDgeSubmission ? proj.status === 'To Review' : proj.status === 'Reviewed') && isActionable
            const canClarify = (proj.status === 'To Review' || proj.status === 'Reviewed') && isActionable
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
                          {proj.hasMissingDocs && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/20 dark:text-red-300">
                              <FileX className="h-3 w-3" />Missing Docs
                            </span>
                          )}
                        </div>
                        <h3 className="text-lg font-bold text-[#0F172A] dark:text-white">{proj.name}</h3>
                        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#475569] dark:text-slate-200">
                          {proj.budgetType && proj.budgetType !== '-' && <><span>{proj.budgetType}</span><span>/</span></>}
                          {proj.statusForAdgeLabel && proj.statusForAdgeLabel !== '-' && <><span>{proj.statusForAdgeLabel}</span><span>/</span></>}
                          <span>{proj.updatedDate && proj.updatedDate !== '-' ? `Updated ${proj.updatedDate}` : `Submitted ${proj.submittedDate}`}</span>
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
                      <CurrencyAmount amount={proj.requestedBudget} className="text-xl font-bold text-[#0F172A] dark:text-white" iconSize={16} />
                    </div>
                  </div>

                  {/* Clarification banner */}
                  {proj.status === 'Clarification Pending' && proj.clarificationWith && (
                    <div className="mt-4 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 dark:border-amber-700/30 dark:bg-amber-900/10">
                      <Clock className="h-4 w-4 shrink-0 text-amber-600" />
                      <p className="text-xs text-amber-700 dark:text-amber-300">
                        Pending with {proj.clarificationWith}
                        {proj.clarificationOverdue !== undefined && (
                          <span className="ml-1 font-semibold text-red-600">/ {proj.clarificationOverdue} days overdue</span>
                        )}
                      </p>
                    </div>
                  )}

                  {/* AI + CapEx/OpEx row */}
                  <div className="mt-4 flex flex-col gap-3 sm:ml-10 lg:flex-row lg:items-start">
                    <div className="min-w-0 flex-1">
                      <AiInsightRow
                        confidence={proj.aiConfidence}
                      >
                        <BudgetOverviewInsight ictBudgetId={proj.ictBudgetId} />
                      </AiInsightRow>
                    </div>
                    <div className="grid shrink-0 grid-cols-2 gap-2 lg:w-[220px] lg:grid-cols-1">
                      <div className="rounded-xl border border-[#EAF0F6] bg-[#F8FBFF] px-3 py-2 dark:border-white/10 dark:bg-white/5">
                        <p className="text-xs text-[#64748B]">CapEx</p>
                        <CurrencyAmount amount={proj.capex} className="font-bold" />
                      </div>
                      <div className="rounded-xl border border-[#EAF0F6] bg-[#F8FBFF] px-3 py-2 dark:border-white/10 dark:bg-white/5">
                        <p className="text-xs text-[#64748B]">OpEx</p>
                        <CurrencyAmount amount={proj.opex} className="font-bold" />
                      </div>
                    </div>
                  </div>

                  {/* Card actions */}
                  <div className="mt-4 flex flex-col gap-2 border-t border-[#EAF0F6] pt-4 dark:border-white/10 sm:ml-10 sm:flex-row sm:justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!canClarify}
                      onClick={() => { if (canClarify) setClarificationProject(proj) }}
                    >
                      <MessageSquare className="h-4 w-4" />Raise Clarification
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/reviewer/review-queue/${proj.id}`}>
                        <Eye className="h-4 w-4" />View Details
                      </Link>
                    </Button>
                    {!hasCycleDgeSubmission && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!isCompletable}
                        className="disabled:opacity-50"
                        onClick={() => { if (isCompletable) void handleCompleteReview([proj.id]) }}
                      >
                        <Check className="h-4 w-4" />Mark as Reviewed
                      </Button>
                    )}
                    <Button
                      size="sm"
                      disabled={!isSubmittable}
                      className="bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                      onClick={() => { if (isSubmittable) setPendingSubmit([proj.id]) }}
                    >
                      <Send className="h-4 w-4" />Submit to Approver
                    </Button>
                  </div>
                </div>
              </article>
            )
          })
        )}
      </div>

      {/* ── Confirm: submit to approver ── */}
      <ConfirmationModal
        open={pendingSubmit !== null}
        onOpenChange={open => { if (!open) setPendingSubmit(null) }}
        title={
          (pendingSubmit?.length ?? 0) === 1
            ? 'Submit to Approver?'
            : `Submit ${pendingSubmit?.length ?? 0} Projects to Approver?`
        }
        description={
          (pendingSubmit?.length ?? 0) === 1
            ? hasCycleDgeSubmission
              ? 'This cycle already has a DGE submission, so the project will move directly to the approver without the intermediate review-completed stage.'
              : 'This will forward the project to the approver for final review. The reviewer will no longer be able to make changes.'
            : hasCycleDgeSubmission
              ? `This will forward ${pendingSubmit?.length ?? 0} projects directly to the approver without the extra review-completed stage.`
              : `This will forward ${pendingSubmit?.length ?? 0} projects to the approver for final review.`
        }
        confirmLabel="Submit to Approver"
        onConfirm={() => { if (pendingSubmit) void handleSubmitToApprover(pendingSubmit) }}
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
        projectName={`${clarificationSelected.length} selected project${clarificationSelected.length === 1 ? '' : 's'}`}
        onSubmit={(payload) => void handleRaiseClarification(clarificationSelected, payload)}
      />
    </div>
  )
}
