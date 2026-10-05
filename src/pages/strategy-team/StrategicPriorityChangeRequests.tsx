import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Building2, Check, FolderSearch, GitCompareArrows, Search, Sparkles, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ConfirmationModal } from '@/components/shared/ConfirmationModal'
import { useCycle } from '@/context/CycleContext'
import { useToast } from '@/context/ToastContext'
import { cn } from '@/lib/utils'
import { DGE_BUDGET_STATUS, getDgePortfolioData, type DgeBudgetRecord } from '@/services/dgePortfolioService'
import { reviewStrategicPriorityChange } from '@/services/dgeWorkflowService'
import { getStrategicPriorityOptions } from '@/services/strategicPriorityService'
import { StrategyPageShell } from './StrategyTeamShell'

type AiFilter = 'all' | 'mismatch' | 'aligned'
type PendingDecision = { budgets: DgeBudgetRecord[]; decision: 'approve' | 'reject' } | null

function SelectionControl({ selected, onClick, label }: { selected: boolean; onClick: () => void; label: string }) {
  return (
    <button type="button" aria-label={label} aria-pressed={selected} onClick={onClick} className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-all', selected ? 'border-transparent bg-[#286CFF] text-white shadow-sm shadow-blue-100' : 'border-[#BFD8FF] bg-white text-transparent hover:border-[#286CFF] hover:bg-[#E7F5FF] dark:border-white/10 dark:bg-white/5')}>
      {selected && <Check className="h-4 w-4" />}
    </button>
  )
}

function cleanLabel(value: string | null | undefined) {
  return value?.split(' - ')[0]?.trim() || value?.trim() || '-'
}

function normalize(value: string | null | undefined) {
  return cleanLabel(value).toLowerCase()
}

function requestedAiState(budget: DgeBudgetRecord): 'mismatch' | 'aligned' | 'none' {
  const requestedPriority = normalize(budget.previousStrategicPriorityName)
  const requestedClassification = normalize(budget.previousStrategicPriorityClassificationName)
  const suggestedPriority = normalize(budget.suggestedStrategicPriorityName)
  const suggestedClassification = normalize(budget.suggestedStrategicPriorityClassificationName)
  if ((!suggestedPriority || suggestedPriority === '-') && (!suggestedClassification || suggestedClassification === '-')) return 'none'
  if ((suggestedPriority !== '-' && requestedPriority !== suggestedPriority) || (suggestedClassification !== '-' && requestedClassification !== suggestedClassification)) return 'mismatch'
  return 'aligned'
}

function alignmentTone(state: ReturnType<typeof requestedAiState>) {
  if (state === 'aligned') return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200'
  if (state === 'mismatch') return 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-200'
  return 'border-slate-200 bg-slate-50 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300'
}

export default function StrategicPriorityChangeRequests() {
  const { selectedCycle } = useCycle()
  const { runActionToast } = useToast()
  const [budgets, setBudgets] = useState<DgeBudgetRecord[]>([])
  const [priorityNames, setPriorityNames] = useState<Map<string, string>>(new Map())
  const [search, setSearch] = useState('')
  const [entity, setEntity] = useState('All')
  const [aiFilter, setAiFilter] = useState<AiFilter>('all')
  const [pendingDecision, setPendingDecision] = useState<PendingDecision>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    if (!selectedCycle?.id) { setBudgets([]); setLoading(false); return }
    setLoading(true)
    setError(null)
    try {
      const [portfolio, priorities] = await Promise.all([getDgePortfolioData(selectedCycle.id), getStrategicPriorityOptions()])
      setBudgets(portfolio.budgets.filter((budget) => budget.statuscode === DGE_BUDGET_STATUS.strategicPriorityChangeUnderReview))
      setPriorityNames(new Map(priorities.map((priority) => [priority.id, priority.name])))
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load strategic priority change requests.')
    } finally { setLoading(false) }
  }

  useEffect(() => { void load() }, [selectedCycle?.id])

  const entities = useMemo(() => ['All', ...new Set(budgets.map((budget) => budget.entityName || budget.instanceName).filter((value): value is string => Boolean(value)))], [budgets])
  const filtered = useMemo(() => budgets.filter((budget) => {
    const state = requestedAiState(budget)
    const matchesAi = aiFilter === 'all' || state === aiFilter
    const matchesEntity = entity === 'All' || (budget.entityName || budget.instanceName) === entity
    const haystack = [budget.name, budget.budgetRefId, budget.entityName, budget.instanceName, budget.strategicPriorityName, budget.strategicPriorityClassificationName, budget.previousStrategicPriorityName, budget.previousStrategicPriorityClassificationName].join(' ').toLowerCase()
    return matchesAi && matchesEntity && (!search.trim() || haystack.includes(search.trim().toLowerCase()))
  }), [aiFilter, budgets, entity, search])

  const labelFor = (id: string | null | undefined, fallback: string | null | undefined) => cleanLabel((id ? priorityNames.get(id) : null) || fallback)
  const selectedBudgets = useMemo(() => filtered.filter((budget) => selectedIds.includes(budget.id)), [filtered, selectedIds])
  const allFilteredSelected = filtered.length > 0 && filtered.every((budget) => selectedIds.includes(budget.id))
  const toggleSelected = (id: string) => setSelectedIds((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id])
  const toggleAllFiltered = () => setSelectedIds((current) => {
    const filteredIds = filtered.map((budget) => budget.id)
    return allFilteredSelected ? current.filter((id) => !filteredIds.includes(id)) : [...new Set([...current, ...filteredIds])]
  })

  const confirmDecision = async () => {
    if (!pendingDecision || saving) return
    const { budgets: decisionBudgets, decision } = pendingDecision
    setSaving(true)
    try {
      await runActionToast(async () => {
        for (const budget of decisionBudgets) await reviewStrategicPriorityChange(budget, decision)
      }, {
        processingTitle: decision === 'approve' ? `Approving ${decisionBudgets.length} change request${decisionBudgets.length === 1 ? '' : 's'}` : `Rejecting ${decisionBudgets.length} change request${decisionBudgets.length === 1 ? '' : 's'}`,
        successTitle: decision === 'approve' ? 'Changes approved' : 'Changes rejected',
        successDescription: `${decisionBudgets.length} project${decisionBudgets.length === 1 ? ' has' : 's have'} been returned to SME review.`,
        errorTitle: 'Unable to process strategic priority change',
        minDurationMs: 1200,
      })
      setPendingDecision(null)
      setSelectedIds([])
      await load()
    } finally { setSaving(false) }
  }

  return (
    <StrategyPageShell eyebrow="ICT - Strategy Team" title="Strategic Priority Change Request" description="Review strategic priority changes requested by SME teams and route each project to the appropriate team.">
      <section className="overflow-hidden rounded-[24px] border border-[#DCE6F6] bg-white shadow-[0_10px_28px_rgba(15,23,42,0.05)] dark:border-white/10 dark:bg-[#162339]">
        <div className="flex flex-col gap-3 border-b border-[#E8EEF5] p-4 lg:flex-row lg:items-center dark:border-white/10">
          <div className="flex shrink-0 items-center gap-3 lg:pr-2">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#EEF5FF] text-[#286CFF] dark:bg-[#286CFF]/15 dark:text-blue-200"><GitCompareArrows className="h-5 w-5" /></span>
            <div><p className="text-sm font-semibold text-[#0F172A] dark:text-white">Review queue</p><p className="text-xs text-[#64748B] dark:text-slate-300">{filtered.length} of {budgets.length} requests</p></div>
          </div>
          <div className="relative min-w-0 flex-1 lg:max-w-md">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search projects, priorities, or classifications" className="h-10 rounded-full border-[#D7E4F4] bg-[#F8FBFF] pl-10 dark:border-white/10 dark:bg-white/5" />
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:ml-auto lg:w-[440px]">
            <Select value={entity} onValueChange={setEntity}>
              <SelectTrigger className="h-10 rounded-full border-[#D7E4F4] bg-white dark:border-white/10 dark:bg-white/5"><span className="flex min-w-0 items-center gap-2"><Building2 className="h-4 w-4 shrink-0 text-[#286CFF]" /><SelectValue /></span></SelectTrigger>
              <SelectContent>{entities.map((option) => <SelectItem key={option} value={option}>{option === 'All' ? 'All Entities' : option}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={aiFilter} onValueChange={(value) => setAiFilter(value as AiFilter)}>
              <SelectTrigger className="h-10 rounded-full border-[#E9D5FF] bg-[#FDF7FF] dark:border-purple-900 dark:bg-purple-950/20"><span className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-[#A855F7]" /><SelectValue /></span></SelectTrigger>
              <SelectContent><SelectItem value="all">All AI Alignment</SelectItem><SelectItem value="aligned">AI Aligned</SelectItem><SelectItem value="mismatch">AI Mismatch</SelectItem></SelectContent>
            </Select>
          </div>
        </div>

        {error ? <p className="p-6 text-sm text-red-600 dark:text-red-300">{error}</p> : null}
        <div className="flex flex-col gap-3 border-b border-[#E8EEF5] bg-white px-4 py-3 dark:border-white/10 dark:bg-[#162339] sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <SelectionControl selected={allFilteredSelected} onClick={toggleAllFiltered} label="Select all filtered change requests" />
            <div><p className="text-sm font-semibold text-[#0F172A] dark:text-white">Bulk selection</p><p className="text-xs text-[#64748B] dark:text-slate-300">{selectedBudgets.length} selected / {filtered.length} visible</p></div>
          </div>
          <div className="flex flex-wrap gap-2 sm:ml-auto">
            <Button variant="outline" size="sm" disabled={selectedBudgets.length === 0 || saving} className="rounded-xl border-rose-200 text-rose-700 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-200 dark:hover:bg-rose-950/30" onClick={() => setPendingDecision({ budgets: selectedBudgets, decision: 'reject' })}><X className="h-4 w-4" />Reject Selected</Button>
            <Button size="sm" disabled={selectedBudgets.length === 0 || saving} className="rounded-xl bg-[#286CFF] text-white hover:bg-[#1A5CE8]" onClick={() => setPendingDecision({ budgets: selectedBudgets, decision: 'approve' })}><Check className="h-4 w-4" />Approve Selected</Button>
          </div>
        </div>
        <div className="space-y-3 bg-[#F8FBFF] p-4 dark:bg-[#111C2E] sm:p-5">
          {loading ? Array.from({ length: 3 }).map((_, index) => <div key={index} className="h-36 animate-pulse rounded-[20px] border border-[#E3ECF7] bg-white dark:border-white/10 dark:bg-white/5" />) : filtered.map((budget) => {
            const state = requestedAiState(budget)
            const selected = selectedIds.includes(budget.id)
            return <article key={budget.id} className={cn('group grid gap-5 rounded-[20px] border bg-white p-5 transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-[#AFCBFF] hover:shadow-[0_12px_28px_rgba(40,108,255,0.08)] dark:bg-[#162339] dark:hover:border-[#4F98FF]/50 lg:grid-cols-[minmax(220px,0.8fr)_minmax(460px,1.7fr)_190px] lg:items-center motion-reduce:transform-none motion-reduce:transition-none', selected ? 'border-[#286CFF] shadow-[0_10px_24px_rgba(40,108,255,0.10)] dark:border-[#4F98FF]' : 'border-[#DCE6F6] dark:border-white/10')}>
              <div className="flex min-w-0 items-start gap-3">
                <SelectionControl selected={selected} onClick={() => toggleSelected(budget.id)} label={`Select ${budget.name}`} />
                <div className="min-w-0 flex-1">
                <div className="mb-3 flex flex-wrap items-center gap-2"><span className="rounded-full bg-[#EEF5FF] px-2.5 py-1 text-xs font-semibold text-[#286CFF] dark:bg-[#286CFF]/15 dark:text-blue-200">{budget.budgetRefId}</span><span className={cn('inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold', alignmentTone(state))}>{state === 'aligned' ? 'AI Aligned' : state === 'mismatch' ? 'AI Mismatch' : 'AI Not Available'}</span></div>
                <Link to={`/strategy-team/projects/${budget.id}`} state={{ backTo: '/strategy-team/strategic-priority-change-requests', backLabel: 'Strategic Priority Change Request' }} className="block break-words text-base font-bold leading-6 text-[#0F172A] hover:text-[#286CFF] hover:underline dark:text-white">{budget.name}</Link>
                <p className="mt-1.5 break-words text-xs leading-5 text-[#64748B] dark:text-slate-300">{budget.entityName || budget.instanceName || 'Unknown Entity'}</p>
                </div>
              </div>

              <div className="grid min-w-0 gap-3 rounded-[18px] border border-[#E3ECF7] bg-[#F8FBFF] p-4 dark:border-white/10 dark:bg-white/[0.04] sm:grid-cols-[minmax(0,1fr)_56px_minmax(0,1fr)] sm:items-center sm:gap-0">
                <div className="min-w-0 sm:pr-5"><p className="text-xs font-semibold text-[#64748B] dark:text-slate-400">Previous Selection</p><div className="mt-3"><p className="text-[11px] font-medium text-[#64748B] dark:text-slate-400">Strategic Priority</p><p className="mt-1 break-words text-sm font-semibold leading-5 text-[#334155] dark:text-slate-200">{labelFor(budget.strategicPriorityId, budget.strategicPriorityName)}</p></div><div className="mt-3"><p className="text-[11px] font-medium text-[#64748B] dark:text-slate-400">Strategic Priority Classification</p><p className="mt-1 break-words text-sm leading-5 text-[#475569] dark:text-slate-300">{labelFor(budget.strategicPriorityClassificationId, budget.strategicPriorityClassificationName)}</p></div></div>
                <div className="flex w-full items-center justify-center self-stretch sm:flex-col"><span className="h-px flex-1 bg-[#D7E4F4] sm:h-auto sm:w-px dark:bg-white/10" /><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[#CFE0FF] bg-white text-[#286CFF] shadow-sm dark:border-white/10 dark:bg-[#1B2A41] dark:text-blue-200"><ArrowRight className="h-4 w-4" /></span><span className="h-px flex-1 bg-[#D7E4F4] sm:h-auto sm:w-px dark:bg-white/10" /></div>
                <div className="min-w-0 sm:pl-5"><p className="text-xs font-semibold text-[#286CFF] dark:text-blue-200">Requested Selection</p><div className="mt-3"><p className="text-[11px] font-medium text-[#64748B] dark:text-slate-400">Strategic Priority</p><p className="mt-1 break-words text-sm font-bold leading-5 text-[#0F172A] dark:text-white">{labelFor(budget.previousStrategicPriorityId, budget.previousStrategicPriorityName)}</p></div><div className="mt-3"><p className="text-[11px] font-medium text-[#64748B] dark:text-slate-400">Strategic Priority Classification</p><p className="mt-1 break-words text-sm font-medium leading-5 text-[#334155] dark:text-slate-200">{labelFor(budget.previousStrategicPriorityClassificationId, budget.previousStrategicPriorityClassificationName)}</p></div></div>
              </div>

              <div className="flex gap-2 lg:flex-col"><Button className="h-10 flex-1 rounded-xl bg-[#286CFF] px-4 text-white hover:bg-[#1A5CE8]" onClick={() => setPendingDecision({ budgets: [budget], decision: 'approve' })}><Check className="mr-1.5 h-4 w-4" />Approve</Button><Button variant="outline" className="h-10 flex-1 rounded-xl border-rose-200 px-4 text-rose-700 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-200 dark:hover:bg-rose-950/30" onClick={() => setPendingDecision({ budgets: [budget], decision: 'reject' })}><X className="mr-1.5 h-4 w-4" />Reject</Button></div>
            </article>
          })}
          {!loading && filtered.length === 0 ? <div className="flex flex-col items-center px-5 py-14 text-center"><FolderSearch className="h-8 w-8 text-[#94A3B8]" /><p className="mt-3 text-sm font-semibold text-[#0F172A] dark:text-white">No change requests found</p><p className="mt-1 text-sm text-[#64748B] dark:text-slate-300">No projects match the current search and filters.</p></div> : null}
        </div>
      </section>

      <ConfirmationModal open={pendingDecision !== null} onOpenChange={(open) => { if (!open && !saving) setPendingDecision(null) }} title={pendingDecision?.decision === 'approve' ? `Approve ${pendingDecision.budgets.length} strategic priority change${pendingDecision.budgets.length === 1 ? '' : 's'}?` : `Reject ${pendingDecision?.budgets.length ?? 0} strategic priority change${pendingDecision?.budgets.length === 1 ? '' : 's'}?`} description={pendingDecision?.decision === 'approve' ? 'The requested priorities and classifications will become active, and the projects will return to SME review.' : 'The requested priorities and classifications will be cleared, and the projects will return to SME review with their previous selections.'} confirmLabel={saving ? 'Processing...' : pendingDecision?.decision === 'approve' ? 'Approve Changes' : 'Reject Changes'} tone={pendingDecision?.decision === 'reject' ? 'danger' : 'primary'} meta={<p>{pendingDecision?.budgets.length === 1 ? pendingDecision.budgets[0].name : `${pendingDecision?.budgets.length ?? 0} projects selected`}</p>} onConfirm={() => void confirmDecision()} />
    </StrategyPageShell>
  )
}
