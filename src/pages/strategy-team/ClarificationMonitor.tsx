import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Bot,
  Building2,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  Clock3,
  MessageSquareMore,
  Search,
  ShieldQuestion,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CurrencyAmount } from '@/components/shared/CurrencyAmount'
import { useCycle } from '@/context/CycleContext'
import type { Clarification } from '@/data/db'
import { cn } from '@/lib/utils'
import { getClarificationsByBudgetId } from '@/services/clarificationService'
import { getProjectAiReviewFlags, type ProjectAiReviewFlagSeverity } from '@/services/documentAiSummaryStoreService'
import {
  type DgeBudgetRecord,
  getDgePortfolioData,
} from '@/services/dgePortfolioService'
import {
  StrategyDashboardEmptyState,
  StrategyMetricCard,
  StrategyPageShell,
  StrategyPill,
} from './StrategyTeamShell'

type ClarificationType = 'within-dge' | 'dge-to-adge' | 'adge-to-adge'
type ClarificationStatusFilter = 'all' | 'open' | 'closed'

type MonitorItem = {
  id: string
  type: ClarificationType
  budget: DgeBudgetRecord
  clarification: Clarification
  latestMessage: string
  latestActivityDate: string
}

const TYPE_META: Record<ClarificationType, { label: string; description: string; accent: string; bg: string }> = {
  'within-dge': {
    label: 'Within DGE',
    description: 'Strategy, Director, and SME clarification loops',
    accent: '#9333EA',
    bg: 'bg-[#F5EEFF] text-[#9333EA] dark:bg-[#9333EA]/15 dark:text-[#E9D5FF]',
  },
  'dge-to-adge': {
    label: 'DGE TO ADGE',
    description: 'DGE questions waiting on ADGE entity response',
    accent: '#286CFF',
    bg: 'bg-[#EEF5FF] text-[#286CFF] dark:bg-[#286CFF]/15 dark:text-[#BFDBFE]',
  },
  'adge-to-adge': {
    label: 'ADGE TO ADGE',
    description: 'Entity-side respondent, reviewer, and approver loops',
    accent: '#0F9D8A',
    bg: 'bg-[#ECFEFF] text-[#0F9D8A] dark:bg-[#0F9D8A]/15 dark:text-[#99F6E4]',
  },
}

const STAGE_OPTIONS = ['Planning', 'In DGE Review', 'Allocation', 'Utilization'] as const

function getClarificationType(clarification: Clarification): ClarificationType {
  if (clarification.scope === 'Internal (DGE)') return 'within-dge'
  if (clarification.scope === 'External') return 'dge-to-adge'
  return 'adge-to-adge'
}

function formatDate(value?: string | null) {
  if (!value) return 'Not set'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleDateString('en-AE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function getLatestActivity(clarification: Clarification) {
  const latestReply = [...clarification.replies].sort((left, right) => right.date.localeCompare(left.date))[0]
  return {
    message: latestReply?.message || clarification.message,
    date: latestReply?.date || clarification.closedAt || clarification.date,
  }
}

function getBudgetTotal(budget: DgeBudgetRecord) {
  return budget.utilizedBudget || budget.allocatedBudget || budget.recommendedBudget || budget.requestedBudget || 0
}

function getRiskPillClass(severity: ProjectAiReviewFlagSeverity) {
  if (severity === 'High') return 'bg-[#FFF1F1] text-[#EF4444] dark:bg-[#EF4444]/15 dark:text-[#FCA5A5]'
  if (severity === 'Medium') return 'bg-[#FFF7E6] text-[#D97706] dark:bg-[#D97706]/15 dark:text-[#FCD34D]'
  return 'bg-[#EEF5FF] text-[#286CFF] dark:bg-[#286CFF]/15 dark:text-[#BFDBFE]'
}

function BudgetChip({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="rounded-[16px] border border-[#DCE8F6] bg-[#F8FBFF] px-3 py-2 dark:border-white/10 dark:bg-white/5">
      <p className="text-[11px] font-semibold text-[#64748B] dark:text-slate-300">{label}</p>
      <CurrencyAmount amount={value} className="mt-1 text-sm font-bold text-[#0F172A] dark:text-white" iconColor={accent} iconSize={12} />
    </div>
  )
}

function ClarificationCard({
  item,
  expanded,
  onToggle,
}: {
  item: MonitorItem
  expanded: boolean
  onToggle: () => void
}) {
  const { budget, clarification, type } = item
  const typeMeta = TYPE_META[type]
  const riskFlags = getProjectAiReviewFlags(budget.aiReviewFlags)
  const isOpen = clarification.status === 'Open'
  const hasReplies = clarification.replies.length > 0

  return (
    <article className="group relative overflow-hidden rounded-[26px] border border-[#D9E6F5] bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.06)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#286CFF] hover:shadow-[0_18px_42px_rgba(40,108,255,0.10)] dark:border-white/10 dark:bg-[#162339]">
      <div className="pointer-events-none absolute right-0 top-0 h-28 w-28 rounded-bl-full opacity-60" style={{ background: `radial-gradient(circle at top right, ${typeMeta.accent}24, transparent 68%)` }} />
      <div className="relative flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold', typeMeta.bg)}>
              {typeMeta.label}
            </span>
            <span className={cn(
              'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold',
              isOpen
                ? 'bg-[#FFF7E6] text-[#D97706] dark:bg-[#D97706]/15 dark:text-[#FCD34D]'
                : 'bg-[#ECFDF3] text-[#15803D] dark:bg-[#15803D]/15 dark:text-[#86EFAC]'
            )}>
              {isOpen ? <Clock3 className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
              {clarification.status}
            </span>
            {clarification.stage ? <StrategyPill tone="blue">{clarification.stage}</StrategyPill> : null}
          </div>

          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#64748B] dark:text-slate-300">
              {budget.budgetRefId || 'ICT Budget'}
            </p>
            <h2 className="mt-1 text-xl font-bold text-[#0F172A] transition-colors group-hover:text-[#286CFF] dark:text-white">
              {budget.name}
            </h2>
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#64748B] dark:text-slate-200">
              {budget.summary || 'No project summary has been captured for this ICT budget yet.'}
            </p>
          </div>
        </div>

        <div className="grid min-w-[230px] gap-2 rounded-[20px] border border-[#DCE8F6] bg-[#F8FBFF] p-3 dark:border-white/10 dark:bg-white/5">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#0F172A] dark:text-white">
            <Building2 className="h-4 w-4 text-[#286CFF]" />
            <span className="truncate">{budget.entityName || budget.instanceName || 'Unknown Entity'}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#64748B] dark:text-slate-300">
            <CalendarClock className="h-3.5 w-3.5 text-[#286CFF]" />
            Latest activity {formatDate(item.latestActivityDate)}
          </div>
        </div>
      </div>

      <div className="relative mt-5 overflow-hidden rounded-[22px] border border-[#D8E7FF] bg-[#F8FBFF] dark:border-white/10 dark:bg-white/5">
        <div className="flex items-start gap-3">
          <div className="ml-4 mt-4 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#286CFF] text-white shadow-[0_12px_24px_rgba(40,108,255,0.20)]">
            <MessageSquareMore className="h-4.5 w-4.5" />
          </div>
          <div className="min-w-0 flex-1 p-4 pl-0">
            <button
              type="button"
              onClick={onToggle}
              className="flex w-full items-start justify-between gap-4 text-left"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#64748B] dark:text-slate-300">
                  <span>Clarification</span>
                  <span className="h-1 w-1 rounded-full bg-[#94A3B8]" />
                  <span>{clarification.raisedByLabel || clarification.raisedBy}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-[#286CFF]" />
                  <span>{clarification.raisedTo || 'Assigned team'}</span>
                </div>
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-[#334155] dark:text-slate-100">
                  {clarification.message || 'No clarification message available.'}
                </p>
              </div>
              <span className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-bold text-[#286CFF] shadow-sm dark:bg-white/10 dark:text-[#BFDBFE]">
                {clarification.replies.length} {clarification.replies.length === 1 ? 'reply' : 'replies'}
                <ChevronDown className={cn('h-3.5 w-3.5 transition-transform duration-200', expanded && 'rotate-180')} />
              </span>
            </button>

            {expanded ? (
              <div className="mt-4 space-y-3 border-t border-[#DCE8F6] pt-4 dark:border-white/10">
                {hasReplies ? (
                  clarification.replies.map((reply) => (
                    <div key={reply.id} className="rounded-[18px] border border-[#DCE8F6] bg-white px-4 py-3 dark:border-white/10 dark:bg-[#162339]">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-xs font-bold text-[#0F172A] dark:text-white">{reply.fromRoleLabel || reply.fromRole}</p>
                        <span className="text-xs font-semibold text-[#64748B] dark:text-slate-300">{formatDate(reply.date)}</span>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-[#475569] dark:text-slate-100">{reply.message || 'No reply message available.'}</p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[18px] border border-dashed border-[#BED3F3] bg-white px-4 py-3 text-sm text-[#64748B] dark:border-white/10 dark:bg-[#162339] dark:text-slate-300">
                    No replies yet.
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <BudgetChip label="Requested" value={budget.requestedBudget} accent="#286CFF" />
        <BudgetChip label="Recommended" value={budget.recommendedBudget} accent="#10B981" />
        <BudgetChip label="Allocated" value={budget.allocatedBudget} accent="#7C3AED" />
        <BudgetChip label="Utilized" value={budget.utilizedBudget} accent="#F59E0B" />
      </div>

      <div className="mt-4 flex flex-col gap-3 border-t border-[#EEF3F8] pt-4 dark:border-white/10 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          <StrategyPill tone="teal">{budget.strategicPriorityName || 'No strategic priority'}</StrategyPill>
          {riskFlags.length ? (
            riskFlags.slice(0, 4).map((flag) => (
              <span key={flag.key} className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold', getRiskPillClass(flag.severity))}>
                {flag.label}
              </span>
            ))
          ) : (
            <StrategyPill tone="amber">No AI Risk</StrategyPill>
          )}
        </div>
        <Button asChild variant="outline" className="h-10 shrink-0 rounded-2xl">
          <Link to={`/strategy-team/projects/${budget.id}`}>
            Open Project
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </article>
  )
}

export default function StrategyClarificationMonitor() {
  const { selectedCycle } = useCycle()
  const [items, setItems] = useState<MonitorItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeType, setActiveType] = useState<ClarificationType>('within-dge')
  const [entityFilter, setEntityFilter] = useState('all')
  const [stageFilter, setStageFilter] = useState('all')
  const [aiFlagFilter, setAiFlagFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState<ClarificationStatusFilter>('all')
  const [query, setQuery] = useState('')
  const [expandedClarificationIds, setExpandedClarificationIds] = useState<Record<string, boolean>>({})

  useEffect(() => {
    let cancelled = false

    async function loadClarifications() {
      if (!selectedCycle?.id) {
        setItems([])
        return
      }

      setLoading(true)
      setError(null)
      try {
        const portfolio = await getDgePortfolioData(selectedCycle.id)
        const clarificationGroups = await Promise.all(
          portfolio.budgets.map(async (budget) => ({
            budget,
            clarifications: await getClarificationsByBudgetId(budget.id),
          }))
        )

        if (cancelled) return

        const nextItems = clarificationGroups.flatMap(({ budget, clarifications }) =>
          clarifications.map((clarification) => {
            const latest = getLatestActivity(clarification)
            return {
              id: `${budget.id}-${clarification.id}`,
              type: getClarificationType(clarification),
              budget,
              clarification,
              latestMessage: latest.message,
              latestActivityDate: latest.date,
            }
          })
        )

        setItems(nextItems.sort((left, right) => right.latestActivityDate.localeCompare(left.latestActivityDate)))
      } catch (loadError) {
        if (!cancelled) {
          console.error('[ClarificationMonitor] Failed to load clarification monitor data:', loadError)
          setError(loadError instanceof Error ? loadError.message : 'Unable to load clarifications.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadClarifications()

    return () => {
      cancelled = true
    }
  }, [selectedCycle?.id])

  const entityOptions = useMemo(() => {
    const lookup = new Map<string, string>()
    items.forEach((item) => {
      const id = item.budget.instanceId || item.budget.entityName || item.budget.instanceName
      if (!id) return
      lookup.set(id, item.budget.entityName || item.budget.instanceName || 'Unknown Entity')
    })
    return [...lookup.entries()].sort((left, right) => left[1].localeCompare(right[1]))
  }, [items])

  const aiFlagOptions = useMemo(() => {
    const flags = new Map<string, string>()
    items.forEach((item) => {
      getProjectAiReviewFlags(item.budget.aiReviewFlags).forEach((flag) => {
        flags.set(flag.key, flag.label)
      })
    })
    return [...flags.entries()].sort((left, right) => left[1].localeCompare(right[1]))
  }, [items])

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return items.filter((item) => {
      if (item.type !== activeType) return false
      if (entityFilter !== 'all') {
        const entityKey = item.budget.instanceId || item.budget.entityName || item.budget.instanceName
        if (entityKey !== entityFilter) return false
      }
      if (stageFilter !== 'all' && item.clarification.stage !== stageFilter) return false
      if (statusFilter !== 'all' && item.clarification.status.toLowerCase() !== statusFilter) return false
      if (aiFlagFilter === 'none' && item.budget.aiReviewFlags.length > 0) return false
      if (aiFlagFilter !== 'all' && aiFlagFilter !== 'none') {
        const itemFlags = getProjectAiReviewFlags(item.budget.aiReviewFlags).map((flag) => flag.key)
        if (!itemFlags.includes(aiFlagFilter)) return false
      }
      if (!normalizedQuery) return true

      const searchable = [
        item.budget.name,
        item.budget.budgetRefId,
        item.budget.entityName,
        item.budget.instanceName,
        item.budget.statusLabel,
        item.budget.strategicPriorityName,
        item.clarification.message,
        item.latestMessage,
        item.clarification.raisedByLabel,
        item.clarification.raisedByName,
        item.clarification.raisedTo,
      ].join(' ').toLowerCase()

      return searchable.includes(normalizedQuery)
    })
  }, [activeType, aiFlagFilter, entityFilter, items, query, stageFilter, statusFilter])

  const typeCounts = useMemo(() => {
    return items.reduce<Record<ClarificationType, number>>(
      (counts, item) => {
        counts[item.type] += 1
        return counts
      },
      { 'within-dge': 0, 'dge-to-adge': 0, 'adge-to-adge': 0 }
    )
  }, [items])

  const openCount = filteredItems.filter((item) => item.clarification.status === 'Open').length
  const closedCount = filteredItems.filter((item) => item.clarification.status === 'Closed').length
  const impactedEntities = new Set(filteredItems.map((item) => item.budget.instanceId || item.budget.entityName).filter(Boolean)).size
  return (
    <StrategyPageShell
      eyebrow="ICT - STRATEGY TEAM"
      title="Clarification Monitor"
      description="Track clarification loops across DGE and ADGE, filter by entity, stage, AI signal, and quickly jump into the underlying ICT budget record."
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StrategyMetricCard title="Clarifications" value={filteredItems.length} note="Matching the active monitor view" accent="#286CFF" icon={<MessageSquareMore className="h-5 w-5" />} />
        <StrategyMetricCard title="Open Threads" value={openCount} note="Still requiring action or follow-up" accent="#D97706" icon={<Clock3 className="h-5 w-5" />} />
        <StrategyMetricCard title="Closed Threads" value={closedCount} note="Resolved clarification records" accent="#15803D" icon={<CheckCircle2 className="h-5 w-5" />} />
        <StrategyMetricCard title="Entities" value={impactedEntities} note="ADGE entities represented in results" accent="#9333EA" icon={<Building2 className="h-5 w-5" />} />
      </section>

      <section className="space-y-4">
        <div className="inline-flex max-w-full gap-1 overflow-x-auto rounded-[18px] bg-[#EAF2FF] p-1 dark:bg-white/5">
          {(Object.keys(TYPE_META) as ClarificationType[]).map((type) => {
            const meta = TYPE_META[type]
            const active = activeType === type
            return (
              <button
                key={type}
                type="button"
                onClick={() => setActiveType(type)}
                className={cn(
                  'inline-flex h-11 shrink-0 items-center gap-2 rounded-[14px] px-4 text-sm font-bold transition-all duration-200',
                  active
                    ? 'bg-[#286CFF] text-white shadow-[0_12px_26px_rgba(40,108,255,0.24)]'
                    : 'text-[#286CFF] hover:bg-white/70 dark:text-[#BFDBFE] dark:hover:bg-white/10'
                )}
              >
                <span>{meta.label}</span>
                <span className={cn(
                  'rounded-full px-2 py-0.5 text-xs font-bold',
                  active ? 'bg-white/20 text-white' : 'bg-white text-[#286CFF] dark:bg-white/10 dark:text-[#BFDBFE]'
                )}>
                  {typeCounts[type]}
                </span>
              </button>
            )
          })}
        </div>

        <div className="grid gap-3 rounded-[24px] bg-transparent p-1 lg:grid-cols-[minmax(220px,1fr)_180px_180px_180px_180px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search project, entity, message..."
              className="h-11 rounded-2xl bg-white pl-9 shadow-none dark:bg-[#1B2A41]"
            />
          </div>
          <Select value={entityFilter} onValueChange={setEntityFilter}>
            <SelectTrigger className="h-11 rounded-2xl bg-white shadow-none dark:bg-[#1B2A41]">
              <SelectValue placeholder="Entity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All entities</SelectItem>
              {entityOptions.map(([id, label]) => (
                <SelectItem key={id} value={id}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={stageFilter} onValueChange={setStageFilter}>
            <SelectTrigger className="h-11 rounded-2xl bg-white shadow-none dark:bg-[#1B2A41]">
              <SelectValue placeholder="Stage" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All stages</SelectItem>
              {STAGE_OPTIONS.map((stage) => (
                <SelectItem key={stage} value={stage}>{stage}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={aiFlagFilter} onValueChange={setAiFlagFilter}>
            <SelectTrigger className="h-11 rounded-2xl bg-white shadow-none dark:bg-[#1B2A41]">
              <SelectValue placeholder="AI Review Flag" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All AI flags</SelectItem>
              <SelectItem value="none">No AI Flag</SelectItem>
              {aiFlagOptions.map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as ClarificationStatusFilter)}>
            <SelectTrigger className="h-11 rounded-2xl bg-white shadow-none dark:bg-[#1B2A41]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </section>

      <section>
        {error ? (
          <div className="rounded-2xl border border-[#FFD4D1] bg-[#FFF5F5] px-4 py-3 text-sm text-[#B42318]">
            {error}
          </div>
        ) : loading ? (
          <div className="grid gap-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-[280px] animate-pulse rounded-[26px] border border-[#D9E6F5] bg-[#F8FBFF] dark:border-white/10 dark:bg-white/5" />
            ))}
          </div>
        ) : filteredItems.length ? (
          <div className="grid gap-4">
            {filteredItems.map((item) => (
              <ClarificationCard
                key={item.id}
                item={item}
                expanded={Boolean(expandedClarificationIds[item.id])}
                onToggle={() =>
                  setExpandedClarificationIds((current) => ({
                    ...current,
                    [item.id]: !current[item.id],
                  }))
                }
              />
            ))}
          </div>
        ) : (
          <StrategyDashboardEmptyState
            icon={activeType === 'within-dge' ? <Bot className="h-6 w-6" /> : activeType === 'dge-to-adge' ? <ShieldQuestion className="h-6 w-6" /> : <Users className="h-6 w-6" />}
            title="No clarifications found"
            description="Try another direction tab or relax the entity, stage, AI flag, status, or search filters."
          />
        )}
      </section>
    </StrategyPageShell>
  )
}
