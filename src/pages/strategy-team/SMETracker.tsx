import { Fragment, useEffect, useId, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, CheckCircle2, ChevronDown, CircleAlert, Search, Workflow } from 'lucide-react'
import { useCycle } from '@/context/CycleContext'
import { StrategyPageShell, StrategyProgressBar } from './StrategyTeamShell'
import { DGE_BUDGET_STATUS, getDgePortfolioData, getSmeTrackerGroups, type DgeBudgetRecord } from '@/services/dgePortfolioService'
import { ICT_BUDGET_STATUS } from '@/services/ictBudgetDraftService'
import { cn } from '@/lib/utils'

type TrackerGroup = ReturnType<typeof getSmeTrackerGroups>[number]
type ReviewSummary = ReturnType<typeof getSummary>
const reviewedStatuses: number[] = [DGE_BUDGET_STATUS.underQualityCheck, DGE_BUDGET_STATUS.underFinalReview, DGE_BUDGET_STATUS.reviewCompleted]
const metrics = [
  { key: 'total', label: 'Total Assigned', short: 'Assigned', color: '#286CFF', tint: '#EEF5FF' },
  { key: 'awaiting', label: 'Awaiting Review', short: 'Awaiting', color: '#B45309', tint: '#FFFBEB' },
  { key: 'sme', label: 'Clarification Needed (SME)', short: 'SME CR', color: '#B91C1C', tint: '#FEF2F2' },
  { key: 'adge', label: 'Clarification Needed (ADGE)', short: 'ADGE CR', color: '#9F1239', tint: '#FFF1F2' },
  { key: 'reviewed', label: 'Reviewed Items', short: 'Reviewed', color: '#047857', tint: '#ECFDF5' },
] as const
const panelClass = 'min-w-0 rounded-2xl border border-[#DCE6F1] bg-white shadow-[0_3px_14px_rgba(15,23,42,0.025)] dark:border-white/10 dark:bg-[#162339]'
const projectHref = (budget: DgeBudgetRecord) => `/strategy-team/projects/${budget.id}`

function getSummary(budgets: DgeBudgetRecord[]) {
  return {
    total: budgets.length,
    awaiting: budgets.filter((b) => b.statuscode === DGE_BUDGET_STATUS.underSmeReview).length,
    sme: budgets.filter((b) => b.statuscode === DGE_BUDGET_STATUS.clarificationPending && b.statusForAdge !== ICT_BUDGET_STATUS.clarificationPending).length,
    adge: budgets.filter((b) => b.statuscode === DGE_BUDGET_STATUS.clarificationPending && b.statusForAdge === ICT_BUDGET_STATUS.clarificationPending).length,
    reviewed: budgets.filter((b) => reviewedStatuses.includes(b.statuscode)).length,
  }
}

function Progress({ summary }: { summary: ReviewSummary }) {
  const value = summary.total ? Math.round(summary.reviewed / summary.total * 100) : 0
  return <div className="flex items-center gap-3"><span className="text-xs font-semibold tabular-nums text-[#286CFF] dark:text-blue-300">{value}%</span><div className="min-w-16 flex-1"><StrategyProgressBar value={value} accent="#286CFF" /></div></div>
}

function SummaryStrip({ summary }: { summary: ReviewSummary }) {
  return (
    <div className="grid grid-cols-2 gap-y-5 border-y border-[#E8EEF5] px-5 py-5 dark:border-white/10 sm:grid-cols-3 lg:grid-cols-5">
      {metrics.map((metric, index) => (
        <div key={metric.key} className={cn('px-3 lg:px-5', index > 0 && 'lg:border-l lg:border-[#E5EBF3] lg:dark:border-white/10')}>
          <div className="flex items-start gap-2 text-xs leading-5 text-[#64748B] dark:text-slate-300"><span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: metric.color }} />{metric.label}</div>
          <p className="mt-2 pl-4 text-2xl font-bold tabular-nums text-[#0F172A] dark:text-white">{summary[metric.key]}</p>
        </div>
      ))}
    </div>
  )
}

function ClassificationDetails({ budgets }: { budgets: DgeBudgetRecord[] }) {
  const [query, setQuery] = useState('')
  const [clarificationsOnly, setClarificationsOnly] = useState(false)
  const [page, setPage] = useState(1)
  const pageSize = 8
  const search = query.trim().toLowerCase()
  const filtered = budgets.filter((budget) =>
    (!clarificationsOnly || budget.statuscode === DGE_BUDGET_STATUS.clarificationPending) &&
    [budget.budgetRefId, budget.name, budget.entityName, budget.instanceName, budget.smeReviewerTeamName, budget.ownerName, budget.statusLabel]
      .some((value) => value?.toLowerCase().includes(search))
  )
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, pageCount)
  const start = (currentPage - 1) * pageSize
  const visibleProjects = filtered.slice(start, start + pageSize)
  const controlClass = 'rounded-lg border border-[#D8E4F3] bg-white px-3 py-1.5 text-xs font-medium text-[#475569] transition-colors hover:border-[#286CFF] hover:text-[#286CFF] disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:bg-white/5 dark:text-slate-300'
  return (
    <div className="min-w-0 rounded-xl border border-[#DFEAF8] bg-[#F8FBFF] dark:border-white/10 dark:bg-white/5">
      <div className="flex flex-wrap items-center justify-between gap-3 p-4">
        <h4 className="text-sm font-semibold text-[#0F172A] dark:text-white">Projects <span className="ml-1 text-xs font-normal text-[#64748B] dark:text-slate-400">{budgets.length}</span></h4>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-[#475569] dark:text-slate-300">
            <input type="checkbox" checked={clarificationsOnly} onChange={(event) => { setClarificationsOnly(event.target.checked); setPage(1) }} className="accent-[#286CFF]" />
            Clarifications only
          </label>
          <label className="flex items-center gap-2 rounded-lg border border-[#D8E4F3] bg-white px-3 py-2 focus-within:border-[#286CFF] dark:border-white/10 dark:bg-white/5">
            <Search className="h-3.5 w-3.5 text-[#64748B]" />
            <input aria-label="Search projects in this classification" placeholder="Search projects or entities" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1) }} className="w-48 bg-transparent text-xs text-[#0F172A] outline-none dark:text-white" />
          </label>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] table-fixed text-left text-xs">
          <caption className="sr-only">Projects in this classification</caption>
          <thead className="border-y border-[#E3EBF5] text-[#64748B] dark:border-white/10 dark:text-slate-400">
            <tr><th scope="col" className="w-[36%] px-4 py-2 font-medium">Project</th><th scope="col" className="w-[22%] px-3 py-2 font-medium">Entity</th><th scope="col" className="w-[22%] px-3 py-2 font-medium">Status</th><th scope="col" className="w-[20%] px-3 py-2 font-medium">Assigned to</th></tr>
          </thead>
          <tbody className="divide-y divide-[#E3EBF5] dark:divide-white/10">
            {visibleProjects.map((budget) => <tr key={budget.id} className="transition-colors hover:bg-white/80 dark:hover:bg-white/5">
              <td className="px-4 py-2.5"><Link to={projectHref(budget)} className="block truncate font-semibold text-[#286CFF] hover:underline dark:text-blue-300" title={`${budget.budgetRefId} ${budget.name}`}>{budget.budgetRefId || budget.name}</Link>{budget.budgetRefId && <p title={budget.name} className="mt-0.5 truncate text-[#475569] dark:text-slate-300">{budget.name}</p>}</td>
              <td className="px-3 py-2.5 text-[#475569] dark:text-slate-300"><span className="block truncate" title={budget.entityName || budget.instanceName || 'Entity unavailable'}>{budget.entityName || budget.instanceName || 'Entity unavailable'}</span></td>
              <td className="px-3 py-2.5"><span title={budget.statusLabel} className={cn('block truncate', budget.statuscode === DGE_BUDGET_STATUS.clarificationPending ? 'text-[#9F1239] dark:text-rose-300' : 'text-[#475569] dark:text-slate-300')}>{budget.statusLabel}</span></td>
              <td className="px-3 py-2.5 text-[#475569] dark:text-slate-300"><span className="block truncate" title={budget.smeReviewerTeamName || budget.ownerName || 'Not assigned'}>{budget.smeReviewerTeamName || budget.ownerName || 'Not assigned'}</span></td>
            </tr>)}
            {!filtered.length && <tr><td colSpan={4} className="px-4 py-8 text-center text-[#64748B] dark:text-slate-400">No projects match these filters.</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E3EBF5] px-4 py-3 text-xs text-[#64748B] dark:border-white/10 dark:text-slate-400">
        <span role="status">{filtered.length ? `${start + 1}-${Math.min(start + pageSize, filtered.length)} of ${filtered.length} projects` : '0 projects'}</span>
        <div className="flex items-center gap-3">
          <button type="button" className={controlClass} disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>Previous</button>
          <span>Page {currentPage} of {pageCount}</span>
          <button type="button" className={controlClass} disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)}>Next</button>
        </div>
      </div>
    </div>
  )
}

function ClassificationTable({ budgets }: { budgets: DgeBudgetRecord[] }) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const tableId = useId()
  const classifications = new Map<string, { name: string; budgets: DgeBudgetRecord[] }>()
  budgets.forEach((budget) => {
    const name = budget.strategicPriorityClassificationName?.trim() || 'Unclassified'
    const key = budget.strategicPriorityClassificationId || name
    const group = classifications.get(key) ?? { name, budgets: [] }
    group.budgets.push(budget)
    classifications.set(key, group)
  })
  return (
    <div className="min-w-0 overflow-hidden">
      <div className="overflow-x-auto pt-4">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="border-b border-[#E8EEF5] text-[13px] text-[#64748B] dark:border-white/10 dark:text-slate-400"><tr>
            <th scope="col" className="w-[34%] px-5 pb-3 font-semibold">Classification</th>
            {metrics.map((metric) => <th key={metric.key} scope="col" title={metric.label} className="px-2 pb-3 text-center font-semibold">{metric.short}</th>)}
            <th scope="col" className="min-w-[115px] px-3 pb-3 font-semibold">Progress</th><th scope="col" className="px-4 pb-3 font-semibold">Status</th>
          </tr></thead>
          <tbody className="divide-y divide-[#E8EEF5] dark:divide-white/10">
            {[...classifications.entries()].map(([key, group], index) => {
              const summary = getSummary(group.budgets)
              const pending = summary.sme + summary.adge > 0
              const isOpen = expanded === key
              const detailsId = `${tableId}-${index}`
              return <Fragment key={key}>
                <tr className={cn('transition-colors hover:bg-[#F8FBFF] dark:hover:bg-white/5', isOpen && 'bg-[#F8FBFF] dark:bg-white/5')}>
                  <th scope="row" className="px-5 py-4 font-medium"><button type="button" aria-expanded={isOpen} aria-controls={isOpen ? detailsId : undefined} onClick={() => setExpanded(isOpen ? null : key)} className="flex w-full items-center gap-3 rounded text-left text-[#0F172A] outline-none focus-visible:ring-2 focus-visible:ring-[#286CFF] dark:text-white"><ChevronDown className={cn('h-4 w-4 shrink-0 text-[#64748B] transition-transform motion-reduce:transition-none', !isOpen && '-rotate-90')} /><span className="break-words leading-5">{group.name}</span></button></th>
                  {metrics.map((metric) => <td key={metric.key} className="px-2 py-4 text-center"><span className="inline-flex min-w-8 justify-center rounded-full px-2 py-1 text-xs font-semibold tabular-nums dark:brightness-90" style={{ color: summary[metric.key] ? metric.color : '#64748B', backgroundColor: summary[metric.key] ? metric.tint : 'transparent' }}>{summary[metric.key]}</span></td>)}
                  <td className="px-3 py-4"><Progress summary={summary} /></td>
                  <td className="px-4 py-4"><span className={cn('inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-medium', pending ? 'bg-[#FFF1F2] text-[#9F1239] dark:bg-red-900/25 dark:text-rose-300' : summary.reviewed === summary.total ? 'bg-[#ECFDF5] text-[#047857] dark:bg-emerald-900/25 dark:text-emerald-300' : 'bg-[#F1F5F9] text-[#475569] dark:bg-white/10 dark:text-slate-300')}>{pending ? 'Needs clarification' : summary.reviewed === summary.total ? 'Reviewed' : summary.awaiting ? 'Awaiting review' : 'In progress'}</span></td>
                </tr>
                {isOpen && <tr id={detailsId}><td colSpan={8} className="px-4 pb-4 pt-1"><ClassificationDetails budgets={group.budgets} /></td></tr>}
              </Fragment>
            })}
          </tbody>
        </table>
      </div>
      {!budgets.length && <p className="px-5 py-8 text-sm text-[#64748B] dark:text-slate-400">No assigned projects in this priority for the current cycle.</p>}
    </div>
  )
}

function AttentionPanel({ budgets }: { budgets: DgeBudgetRecord[] }) {
  const pending = budgets.filter((budget) => budget.statuscode === DGE_BUDGET_STATUS.clarificationPending)
  return <aside className="min-w-0 border-t border-[#E8EEF5] dark:border-white/10 2xl:border-l 2xl:border-t-0">
    <h3 className="border-b border-[#E8EEF5] px-4 py-4 text-base font-bold text-[#0F172A] dark:border-white/10 dark:text-white">Attention needed <span className="ml-1 text-xs font-medium text-[#64748B]">{pending.length}</span></h3>
    {pending.length ? <ul className="divide-y divide-[#E8EEF5] px-4 dark:divide-white/10">{pending.map((budget) => <li key={budget.id}>
      <Link to={projectHref(budget)} className="group flex gap-3 py-4 outline-none focus-visible:ring-2 focus-visible:ring-[#286CFF]">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#FFF1F2] text-[#BE123C] dark:bg-rose-900/25 dark:text-rose-300"><CircleAlert className="h-4 w-4" /></span>
        <div className="min-w-0 flex-1"><p className="break-words text-sm font-semibold text-[#0F172A] group-hover:text-[#286CFF] dark:text-white">{budget.entityName || budget.instanceName || 'Entity unavailable'}</p><p className="mt-1 break-words text-xs leading-5 text-[#64748B] dark:text-slate-300">{budget.name}</p><p className="mt-2 text-xs font-medium text-[#9F1239] dark:text-rose-300">{budget.statusForAdge === ICT_BUDGET_STATUS.clarificationPending ? 'ADGE response needed' : 'SME clarification needed'}</p></div><ArrowRight className="mt-1 h-3.5 w-3.5 shrink-0 text-[#94A3B8] transition-transform group-hover:translate-x-0.5" />
      </Link>
    </li>)}</ul> : <div className="flex gap-3 px-4 py-6"><CheckCircle2 className="h-5 w-5 shrink-0 text-[#059669]" /><p className="text-sm leading-6 text-[#64748B] dark:text-slate-300">No open clarification blockers for this priority.</p></div>}
  </aside>
}

function PrioritySection({ group }: { group: TrackerGroup }) {
  const summary = getSummary(group.budgets)
  const pending = summary.sme + summary.adge
  return <section className={cn(panelClass, 'overflow-hidden')}>
    <div className="flex flex-wrap items-center gap-4 px-5 py-5">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EEF5FF] text-[#286CFF] dark:bg-blue-500/15"><Workflow className="h-5 w-5" /></span>
      <div className="min-w-0 flex-1"><h2 className="break-words text-lg font-bold text-[#0F172A] dark:text-white">{group.assignment.strategicPriorityName}</h2><p className="mt-1 text-xs text-[#64748B] dark:text-slate-300">{group.assignment.teamName}</p></div>
      {pending > 0 && <span className="rounded-full bg-[#FFF1F2] px-3 py-1.5 text-xs font-medium text-[#9F1239] dark:bg-rose-900/25 dark:text-rose-300">{pending} clarification{pending === 1 ? '' : 's'} pending</span>}
      <div className="w-44"><p className="mb-2 text-xs text-[#64748B] dark:text-slate-300">Reviewed</p><Progress summary={summary} /></div>
      <Link to="/strategy-team/projects?phase=dge-review&status=Under%20SME%20Review" className="inline-flex items-center gap-3 rounded-xl bg-[#286CFF] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1D4ED8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#286CFF]">Open SME queue<ArrowRight className="h-4 w-4" /></Link>
    </div>
    <SummaryStrip summary={summary} />
    <div className="grid 2xl:grid-cols-[minmax(0,1fr)_260px]"><ClassificationTable budgets={group.budgets} /><AttentionPanel budgets={group.budgets} /></div>
  </section>
}

function TrackerSkeleton() {
  return (
    <div aria-label="Loading SME tracker" role="status" className={cn(panelClass, 'animate-pulse overflow-hidden')}>
      <div className="flex items-center gap-4 p-5">
        <div className="h-11 w-11 rounded-xl bg-[#EAF0F6] dark:bg-white/10" />
        <div className="h-6 w-1/3 rounded bg-[#EAF0F6] dark:bg-white/10" />
      </div>
      <div className="grid grid-cols-2 gap-5 border-y border-[#E8EEF5] p-5 dark:border-white/10 lg:grid-cols-5">
        {metrics.map((metric) => <div key={metric.key} className="h-12 rounded bg-[#EAF0F6] dark:bg-white/10" />)}
      </div>
      <div className="grid 2xl:grid-cols-[minmax(0,1fr)_260px]">
        <div className="space-y-4 p-5">
          {[0, 1, 2].map((row) => <div key={row} className="h-12 rounded bg-[#EAF0F6] dark:bg-white/10" />)}
        </div>
        <div className="border-t border-[#E8EEF5] p-5 dark:border-white/10 2xl:border-l 2xl:border-t-0">
          <div className="h-24 rounded bg-[#EAF0F6] dark:bg-white/10" />
        </div>
      </div>
    </div>
  )
}

export default function SMETracker() {
  const { selectedCycle } = useCycle()
  const [groups, setGroups] = useState<TrackerGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  useEffect(() => {
    let cancelled = false
    setGroups([])
    setError(null)
    setLoading(true)
    setQuery('')
    setFilter('all')
    async function load() {
      try {
        if (!selectedCycle?.id) return
        const portfolio = await getDgePortfolioData(selectedCycle.id)
        if (!cancelled) setGroups(getSmeTrackerGroups(portfolio))
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Unable to load SME tracker.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => { cancelled = true }
  }, [selectedCycle?.id])
  const matchesFilter = (group: TrackerGroup, value: string) => {
    const summary = getSummary(group.budgets)
    return value === 'clarification' ? summary.sme + summary.adge > 0 : value === 'awaiting' ? summary.awaiting > 0 : true
  }
  const visible = groups.filter((group) => matchesFilter(group, filter) && `${group.assignment.strategicPriorityName} ${group.assignment.teamName} ${group.budgets.map((b) => b.strategicPriorityClassificationName || '').join(' ')}`.toLowerCase().includes(query.trim().toLowerCase()))
  return <StrategyPageShell eyebrow="ICT - Strategy Team" title="SME Tracker" description="Review classifications, track SME input, and move items towards resolution.">
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">{[{ id: 'all', label: 'All priorities' }, { id: 'awaiting', label: 'Awaiting review' }, { id: 'clarification', label: 'Clarification needed' }].map((tab) => <button key={tab.id} type="button" aria-pressed={filter === tab.id} onClick={() => setFilter(tab.id)} className={cn('inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors', filter === tab.id ? 'border-[#286CFF] bg-[#286CFF] text-white' : 'border-[#DCE6F1] bg-white text-[#475569] hover:bg-[#EEF5FF] dark:border-white/10 dark:bg-[#162339] dark:text-slate-300')}>
          {tab.label}<span className={cn('rounded-full px-1.5 py-0.5 text-xs tabular-nums', filter === tab.id ? 'bg-white/20' : 'bg-[#F1F5F9] dark:bg-white/10')}>{loading ? '-' : groups.filter((group) => matchesFilter(group, tab.id)).length}</span>
        </button>)}</div>
        <label className="flex w-full items-center gap-2 rounded-xl border border-[#DCE6F1] bg-white px-3 py-2.5 focus-within:border-[#286CFF] dark:border-white/10 dark:bg-[#162339] sm:w-72"><Search className="h-4 w-4 shrink-0 text-[#64748B]" /><input aria-label="Search priorities, teams or classifications" placeholder="Search priority or classification" value={query} onChange={(event) => setQuery(event.target.value)} className="min-w-0 w-full bg-transparent text-sm text-[#0F172A] outline-none dark:text-white" /></label>
      </div>
      {loading ? <TrackerSkeleton /> : error ? <p role="alert" className="rounded-xl bg-red-50 p-5 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-300">{error}</p> : visible.length ? <div className="space-y-8">{visible.map((group) => <PrioritySection key={`${selectedCycle?.id}-${group.assignment.strategicPriorityId}`} group={group} />)}</div> : <p className={cn(panelClass, 'p-8 text-center text-sm text-[#64748B] dark:text-slate-300')}>{groups.length ? 'No priorities match your filters.' : 'No SME assignments or projects were found for this cycle.'}</p>}
    </div>
  </StrategyPageShell>
}
