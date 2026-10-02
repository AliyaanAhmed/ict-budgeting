import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Search, Workflow } from 'lucide-react'
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
  { key: 'sme', label: 'SME Clarification', short: 'SME Clarification', color: '#B91C1C', tint: '#FEF2F2' },
  { key: 'adge', label: 'ADGE Clarification', short: 'ADGE Clarification', color: '#9F1239', tint: '#FFF1F2' },
  { key: 'reviewed', label: 'Reviewed Items', short: 'Reviewed', color: '#047857', tint: '#ECFDF5' },
] as const
const panelClass = 'min-w-0 rounded-2xl border border-[#DCE6F1] bg-white shadow-[0_3px_14px_rgba(15,23,42,0.025)] dark:border-white/10 dark:bg-[#162339]'

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
    <div className="grid gap-3 border-b border-[#E8EEF5] px-5 pb-5 dark:border-white/10 sm:grid-cols-2 xl:grid-cols-5">
      {metrics.map((metric) => (
        <div key={metric.key} className="rounded-[18px] border border-[#EAF0F6] bg-[#F8FBFF] px-4 py-3 dark:border-white/10 dark:bg-white/5">
          <p className="text-xs font-medium text-[#64748B] dark:text-slate-300">{metric.label}</p>
          <p className="mt-2 text-sm font-semibold tabular-nums dark:!text-slate-100" style={{ color: metric.color }}>{summary[metric.key]}</p>
        </div>
      ))}
    </div>
  )
}

function ClassificationTable({ budgets, projectBasePath, strategicPriority }: { budgets: DgeBudgetRecord[]; projectBasePath: string; strategicPriority: string }) {
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
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="border-b border-[#E8EEF5] text-[13px] text-[#64748B] dark:border-white/10 dark:text-slate-400"><tr className="h-14">
            <th scope="col" className="w-[34%] px-5 py-0 align-middle font-semibold">Classification</th>
            {metrics.map((metric) => <th key={metric.key} scope="col" title={metric.label} className="px-2 py-0 text-center align-middle font-semibold">{metric.short}</th>)}
            <th scope="col" className="min-w-[115px] px-3 py-0 align-middle font-semibold">Progress</th><th scope="col" className="px-4 py-0 align-middle font-semibold">Status</th>
          </tr></thead>
          <tbody className="divide-y divide-[#E8EEF5] dark:divide-white/10">
            {[...classifications.entries()].map(([key, group]) => {
              const summary = getSummary(group.budgets)
              const pending = summary.sme + summary.adge > 0
              const href = `${projectBasePath}?priority=${encodeURIComponent(strategicPriority)}&classification=${encodeURIComponent(key)}`
              return <tr key={key} className="transition-colors hover:bg-[#F8FBFF] dark:hover:bg-white/5">
                  <th scope="row" className="px-5 py-4 font-medium"><Link to={href} className="group inline-flex max-w-full items-center gap-2 rounded text-left font-semibold text-[#286CFF] outline-none hover:underline focus-visible:ring-2 focus-visible:ring-[#286CFF] dark:text-blue-300"><span className="break-words leading-5">{group.name}</span><ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" /></Link></th>
                  {metrics.map((metric) => <td key={metric.key} className="px-2 py-4 text-center"><span className="inline-flex min-w-8 justify-center rounded-full px-2 py-1 text-xs font-semibold tabular-nums dark:brightness-90" style={{ color: summary[metric.key] ? metric.color : '#64748B', backgroundColor: summary[metric.key] ? metric.tint : 'transparent' }}>{summary[metric.key]}</span></td>)}
                  <td className="px-3 py-4"><Progress summary={summary} /></td>
                  <td className="px-4 py-4"><span className={cn('inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-medium', pending ? 'bg-[#FFF1F2] text-[#9F1239] dark:bg-red-900/25 dark:text-rose-300' : summary.reviewed === summary.total ? 'bg-[#ECFDF5] text-[#047857] dark:bg-emerald-900/25 dark:text-emerald-300' : 'bg-[#F1F5F9] text-[#475569] dark:bg-white/10 dark:text-slate-300')}>{pending ? 'Needs Clarification' : summary.reviewed === summary.total ? 'Reviewed' : summary.awaiting ? 'Awaiting Review' : 'In Progress'}</span></td>
                </tr>
            })}
          </tbody>
        </table>
      </div>
      {!budgets.length && <p className="px-5 py-8 text-sm text-[#64748B] dark:text-slate-400">No assigned projects in this priority for the current cycle.</p>}
    </div>
  )
}

function PrioritySection({ group, projectBasePath, queueHref, queueLabel }: { group: TrackerGroup; projectBasePath: string; queueHref: string; queueLabel: string }) {
  const summary = getSummary(group.budgets)
  const pending = summary.sme + summary.adge
  return <section className={cn(panelClass, 'overflow-hidden')}>
    <div className="flex flex-wrap items-center gap-4 px-5 py-5">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EEF5FF] text-[#286CFF] dark:bg-blue-500/15"><Workflow className="h-5 w-5" /></span>
      <div className="min-w-0 flex-1"><h2 className="break-words text-lg font-bold text-[#0F172A] dark:text-white">{group.assignment.strategicPriorityName}</h2><p className="mt-1 text-xs text-[#64748B] dark:text-slate-300">{group.assignment.teamName}</p></div>
      {pending > 0 && <span className="rounded-full bg-[#FFF1F2] px-3 py-1.5 text-xs font-medium text-[#9F1239] dark:bg-rose-900/25 dark:text-rose-300">{pending} Clarification{pending === 1 ? '' : 's'} Pending</span>}
      <div className="w-44"><p className="mb-2 text-xs text-[#64748B] dark:text-slate-300">Reviewed</p><Progress summary={summary} /></div>
      <Link to={queueHref} className="inline-flex items-center gap-3 rounded-xl bg-[#286CFF] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1D4ED8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#286CFF]">{queueLabel}<ArrowRight className="h-4 w-4" /></Link>
    </div>
    <SummaryStrip summary={summary} />
    <ClassificationTable budgets={group.budgets} projectBasePath={projectBasePath} strategicPriority={group.budgets.find((budget) => budget.strategicPriorityId)?.strategicPriorityId || group.assignment.strategicPriorityId || group.assignment.strategicPriorityName} />
  </section>
}

function TrackerSkeleton() {
  return (
    <div aria-label="Loading SME tracker" role="status" className={cn(panelClass, 'animate-pulse overflow-hidden')}>
      <div className="flex items-center gap-4 p-5">
        <div className="h-11 w-11 rounded-xl bg-[#EAF0F6] dark:bg-white/10" />
        <div className="h-6 w-1/3 rounded bg-[#EAF0F6] dark:bg-white/10" />
      </div>
      <div className="grid gap-3 border-b border-[#E8EEF5] px-5 pb-5 dark:border-white/10 sm:grid-cols-2 xl:grid-cols-5">
        {metrics.map((metric) => <div key={metric.key} className="h-20 rounded-[18px] bg-[#EAF0F6] dark:bg-white/10" />)}
      </div>
      <div className="space-y-4 p-5">
        {[0, 1, 2].map((row) => <div key={row} className="h-12 rounded bg-[#EAF0F6] dark:bg-white/10" />)}
      </div>
    </div>
  )
}

type SMETrackerViewProps = {
  eyebrow: string
  description: string
  projectBasePath: string
  queueHref: string
  queueLabel: string
}

export function SMETrackerView({ eyebrow, description, projectBasePath, queueHref, queueLabel }: SMETrackerViewProps) {
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
  const visible = groups
    .filter((group) => matchesFilter(group, filter) && `${group.assignment.strategicPriorityName} ${group.assignment.teamName} ${group.budgets.map((b) => b.strategicPriorityClassificationName || '').join(' ')}`.toLowerCase().includes(query.trim().toLowerCase()))
    .sort((left, right) => {
      const leftHasClassification = left.budgets.some((budget) => Boolean(budget.strategicPriorityClassificationName?.trim()))
      const rightHasClassification = right.budgets.some((budget) => Boolean(budget.strategicPriorityClassificationName?.trim()))
      return Number(rightHasClassification) - Number(leftHasClassification)
    })
  return <StrategyPageShell eyebrow={eyebrow} title="SME Tracker" description={description}>
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">{[{ id: 'all', label: 'All Priorities' }, { id: 'awaiting', label: 'Awaiting Review' }, { id: 'clarification', label: 'Clarification Needed' }].map((tab) => <button key={tab.id} type="button" aria-pressed={filter === tab.id} onClick={() => setFilter(tab.id)} className={cn('inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors', filter === tab.id ? 'border-[#286CFF] bg-[#286CFF] text-white' : 'border-[#DCE6F1] bg-white text-[#475569] hover:bg-[#EEF5FF] dark:border-white/10 dark:bg-[#162339] dark:text-slate-300')}>
          {tab.label}<span className={cn('rounded-full px-1.5 py-0.5 text-xs tabular-nums', filter === tab.id ? 'bg-white/20' : 'bg-[#F1F5F9] dark:bg-white/10')}>{loading ? '-' : groups.filter((group) => matchesFilter(group, tab.id)).length}</span>
        </button>)}</div>
        <label className="flex w-full items-center gap-2 rounded-xl border border-[#DCE6F1] bg-white px-3 py-2.5 focus-within:border-[#286CFF] dark:border-white/10 dark:bg-[#162339] sm:w-72"><Search className="h-4 w-4 shrink-0 text-[#64748B]" /><input aria-label="Search priorities, teams or classifications" placeholder="Search priority or classification" value={query} onChange={(event) => setQuery(event.target.value)} className="min-w-0 w-full bg-transparent text-sm text-[#0F172A] outline-none dark:text-white" /></label>
      </div>
      {loading ? <TrackerSkeleton /> : error ? <p role="alert" className="rounded-xl bg-red-50 p-5 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-300">{error}</p> : visible.length ? <div className="space-y-8">{visible.map((group) => <PrioritySection key={`${selectedCycle?.id}-${group.assignment.strategicPriorityId}`} group={group} projectBasePath={projectBasePath} queueHref={queueHref} queueLabel={queueLabel} />)}</div> : <p className={cn(panelClass, 'p-8 text-center text-sm text-[#64748B] dark:text-slate-300')}>{groups.length ? 'No priorities match your filters.' : 'No SME assignments or projects were found for this cycle.'}</p>}
    </div>
  </StrategyPageShell>
}

export default function SMETracker() {
  return (
    <SMETrackerView
      eyebrow="ICT - Strategy Team"
      description="Review classifications, track SME input, and move items towards resolution."
      projectBasePath="/strategy-team/projects"
      queueHref="/strategy-team/projects?phase=dge-review&status=Under%20SME%20Review"
      queueLabel="Open SME Queue"
    />
  )
}
