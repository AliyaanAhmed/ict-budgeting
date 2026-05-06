import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  ChevronDown,
  Clock,
  Download,
  Eye,
  FileX,
  ListFilter,
  MessageSquare,
  Search,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react'
import { reviewQueueProjects, currentCycle } from '@/data/db'
import { Button } from '@/components/ui/button'
import { RiskBadge } from '@/components/shared/StatusBadge'
import { CurrencyAmount } from '@/components/shared/CurrencyAmount'
import { cn } from '@/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ClarificationModal } from '@/components/shared/ClarificationModal'
import { useToast } from '@/context/ToastContext'

type ReviewFilter = 'to-review' | 'reviewed' | 'clarification'

function QueueStat({ label, value, icon: Icon, tone = 'blue' }: { label: string; value: React.ReactNode; icon: React.ElementType; tone?: 'blue' | 'green' | 'amber' | 'red' }) {
  const toneClass = {
    blue: 'bg-[#E7F5FF] text-[#286CFF] border-[#B0DBFF]',
    green: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700/30',
    amber: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-700/30',
    red: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-700/30',
  }[tone]

  return (
    <div className="rounded-2xl border border-[#DDEBFF] bg-white p-4 shadow-[0_10px_26px_rgba(15,23,42,0.05)] dark:border-white/10 dark:bg-[#1E293B]">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-[#64748B] dark:text-slate-200">{label}</p>
        <span className={cn('flex h-9 w-9 items-center justify-center rounded-xl border', toneClass)}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div className="text-2xl font-bold text-[#0F172A] dark:text-white">{value}</div>
    </div>
  )
}

function AiInsightRow({ expanded, onClick, confidence, children }: { expanded: boolean; onClick: () => void; confidence: number; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[#B0DBFF] bg-gradient-to-b from-[#E7F5FF] to-white dark:border-white/10 dark:from-[#10213B] dark:to-[#1E293B]">
      <button onClick={onClick} className="flex w-full items-center gap-2 px-3 py-2.5 text-left">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#286CFF] to-[#4F98FF] text-white shadow-sm">
          <Sparkles className="h-4 w-4" />
        </span>
        <span className="text-sm font-semibold text-[#0F172A] dark:text-white">AI Review Insights</span>
        <span className="text-xs text-[#64748B] dark:text-slate-200">{confidence}% confidence</span>
        <ChevronDown className={cn('ml-auto h-4 w-4 text-[#286CFF] transition-transform', expanded && 'rotate-180')} />
      </button>
      {expanded && <div className="border-t border-[#B0DBFF]/70 px-4 py-3 dark:border-white/10">{children}</div>}
    </div>
  )
}

function SelectionControl({ selected, onClick, label }: { selected: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-all',
        selected
          ? 'border-[#286CFF] bg-gradient-to-br from-[#286CFF] to-[#4F98FF] text-white shadow-md shadow-blue-100'
          : 'border-[#BFD8FF] bg-white text-transparent hover:border-[#286CFF] hover:bg-[#E7F5FF] dark:border-white/10 dark:bg-white/5'
      )}
    >
      <CheckCircle2 className="h-5 w-5" />
    </button>
  )
}

export default function ReviewQueue() {
  const [activeFilter, setActiveFilter] = useState<ReviewFilter>('to-review')
  const [search, setSearch] = useState('')
  const [expandedAi, setExpandedAi] = useState<string | null>(null)
  const [clarificationProject, setClarificationProject] = useState<string | null>(null)
  const [bulkClarificationOpen, setBulkClarificationOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const { showSuccessToast } = useToast()

  const toReview = reviewQueueProjects.filter((p) => p.status === 'To Review').length
  const reviewed = reviewQueueProjects.filter((p) => p.status === 'Reviewed').length
  const clarification = reviewQueueProjects.filter((p) => p.status === 'Clarification Pending').length
  const avgReadiness = Math.round(reviewQueueProjects.reduce((s, p) => s + p.aiConfidence, 0) / reviewQueueProjects.length)
  const missingDocs = reviewQueueProjects.filter((p) => p.hasMissingDocs).length

  const filtered = reviewQueueProjects.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.entity.toLowerCase().includes(search.toLowerCase()) || p.id.toLowerCase().includes(search.toLowerCase())
    const matchesTab =
      activeFilter === 'to-review'
        ? p.status === 'To Review'
        : activeFilter === 'reviewed'
          ? p.status === 'Reviewed'
          : p.status === 'Clarification Pending'
    return matchesSearch && matchesTab
  })

  const visibleIds = filtered.map((p) => p.id)
  const selectedVisibleCount = visibleIds.filter((id) => selectedIds.includes(id)).length
  const allVisibleSelected = visibleIds.length > 0 && selectedVisibleCount === visibleIds.length

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
  }

  const toggleAllVisible = () => {
    setSelectedIds((prev) => {
      if (allVisibleSelected) return prev.filter((id) => !visibleIds.includes(id))
      return Array.from(new Set([...prev, ...visibleIds]))
    })
  }

  const statusBadge = (status: string) => {
    const config: Record<string, string> = {
      'To Review': 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
      Reviewed: 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400',
      'Clarification Pending': 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
    }
    return config[status] ?? 'bg-slate-100 text-slate-600'
  }

  return (
    <div className="mx-auto max-w-[1200px] space-y-5">
      <div className="rounded-2xl border border-[#DDEBFF] bg-white px-4 py-5 shadow-[0_10px_26px_rgba(15,23,42,0.05)] dark:border-white/10 dark:bg-[#1E293B] sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <nav className="mb-2 text-xs text-[#64748B] dark:text-slate-200">Home / Reviewer / Review Queue</nav>
            <h1 className="text-2xl font-bold tracking-tight text-[#0F172A] dark:text-white sm:text-3xl">Review Queue</h1>
            <p className="mt-2 text-sm leading-6 text-[#475569] dark:text-slate-200">
              Review respondent submissions, validate evidence, raise clarifications, and forward ready items to the approver.
            </p>
          </div>
          <div className="rounded-2xl border border-[#B0DBFF] bg-gradient-to-b from-[#E7F5FF] to-white px-4 py-3 dark:border-white/10 dark:from-[#10213B] dark:to-[#1E293B]">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#286CFF] to-[#4F98FF] text-white shadow-sm">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#0F172A] dark:text-white">AI Queue Summary</p>
                <p className="text-xs text-[#64748B] dark:text-slate-200">{avgReadiness}% average readiness / {missingDocs} missing document flags</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <QueueStat label="To Review" value={toReview} icon={Clock} tone="amber" />
        <QueueStat label="Reviewed" value={reviewed} icon={CheckCircle2} tone="green" />
        <QueueStat label="Clarification" value={clarification} icon={MessageSquare} tone="amber" />
        <QueueStat label="Avg Readiness" value={`${avgReadiness}%`} icon={Sparkles} />
        <QueueStat label="Missing Docs" value={missingDocs} icon={FileX} tone="red" />
      </div>

      <div className="rounded-2xl border border-[#DDEBFF] bg-white p-3 shadow-[0_10px_26px_rgba(15,23,42,0.05)] dark:border-white/10 dark:bg-[#1E293B]">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'to-review' as const, label: 'To Review', count: toReview },
              { id: 'reviewed' as const, label: 'Reviewed', count: reviewed },
              { id: 'clarification' as const, label: 'Clarification', count: clarification },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                className={cn(
                  'inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-colors',
                  activeFilter === tab.id ? 'bg-[#286CFF] text-white shadow-sm' : 'border border-[#DDEBFF] bg-white text-[#475569] hover:border-[#286CFF] hover:text-[#286CFF] dark:border-white/10 dark:bg-white/5 dark:text-slate-200'
                )}
              >
                {tab.label}
                <span className={cn('rounded-full px-2 py-0.5 text-xs', activeFilter === tab.id ? 'bg-white/20' : 'bg-[#EFF6FF] text-[#286CFF] dark:bg-white/10')}>{tab.count}</span>
              </button>
            ))}
          </div>

          <div className="flex flex-1 flex-col gap-2 lg:flex-row xl:justify-end">
            <div className="relative min-w-0 flex-1 xl:max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by project name, entity, or ID..."
                className="h-10 w-full rounded-xl border border-[#DDEBFF] bg-white pl-9 pr-4 text-sm text-[#0F172A] shadow-sm placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#286CFF]/15 dark:border-white/10 dark:bg-[#0F172A]/30 dark:text-white"
              />
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:flex">
              <Select defaultValue="all-entities">
                <SelectTrigger className="h-10 rounded-xl border-[#DDEBFF] lg:w-[190px]">
                  <span className="inline-flex w-full items-center gap-2 whitespace-nowrap"><ListFilter className="h-4 w-4 text-[#64748B]" /><SelectValue placeholder="All Entities" /></span>
                </SelectTrigger>
                <SelectContent><SelectItem value="all-entities">All Entities</SelectItem></SelectContent>
              </Select>
              <Select defaultValue="newest-submitted">
                <SelectTrigger className="h-10 rounded-xl border-[#DDEBFF] lg:w-[190px]">
                  <span className="inline-flex w-full items-center gap-2 whitespace-nowrap"><ListFilter className="h-4 w-4 text-[#64748B]" /><SelectValue placeholder="Newest Submitted" /></span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest-submitted">Newest Submitted</SelectItem>
                  <SelectItem value="oldest-submitted">Oldest Submitted</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" size="sm" className="h-10 rounded-xl"><Download className="h-4 w-4" />Export</Button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-[#DDEBFF] bg-white p-3 shadow-[0_10px_26px_rgba(15,23,42,0.05)] dark:border-white/10 dark:bg-[#1E293B]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3 text-left text-sm text-[#475569] dark:text-slate-200">
            <SelectionControl selected={allVisibleSelected} onClick={toggleAllVisible} label="Select all visible reviewer queue items" />
            <span>
              <span className="font-semibold text-[#0F172A] dark:text-white">Bulk Selection</span>
              <span className="block text-xs text-[#64748B] dark:text-slate-200">{selectedIds.length} selected / {filtered.length} visible</span>
            </span>
          </div>
          <div className="flex flex-wrap gap-2 sm:ml-auto">
            <Button variant="outline" size="sm" disabled={selectedIds.length === 0}>Mark Reviewed</Button>
            <Button variant="outline" size="sm" disabled={selectedIds.length === 0} onClick={() => setBulkClarificationOpen(true)}>Raise Clarification</Button>
            <Button size="sm" disabled={selectedIds.length === 0}>Submit to Approver</Button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {filtered.map((proj) => (
          <article key={proj.id} className={cn('overflow-hidden rounded-2xl border bg-white shadow-[0_12px_30px_rgba(15,23,42,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#286CFF] hover:shadow-[0_18px_40px_rgba(40,108,255,0.12)] dark:bg-[#1E293B]', selectedIds.includes(proj.id) && 'border-[#286CFF] ring-2 ring-[#286CFF]/10', !selectedIds.includes(proj.id) && (proj.riskLevel === 'High' ? 'border-red-200 dark:border-red-700/30' : 'border-[#DDEBFF] dark:border-white/10'))}>
            <div className="p-4 sm:p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex min-w-0 flex-1 gap-3">
                  <SelectionControl selected={selectedIds.includes(proj.id)} onClick={() => toggleSelected(proj.id)} label={`Select ${proj.name}`} />
                  <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs text-[#94A3B8]">{proj.id}</span>
                    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', statusBadge(proj.status))}>{proj.status}</span>
                    <RiskBadge risk={proj.riskLevel} />
                    {proj.hasMissingDocs && <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/20 dark:text-red-300"><FileX className="h-3 w-3" />Missing Docs</span>}
                  </div>
                  <h3 className="text-lg font-bold text-[#0F172A] dark:text-white">{proj.name}</h3>
                  <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#475569] dark:text-slate-200">
                    <span>{proj.entity}</span><span>/</span><span>{proj.glCodeCount} GL Codes</span><span>/</span><span>By {proj.submittedBy}</span><span>/</span><span>Submitted {proj.submittedDate}</span><span>/</span><span>Updated {proj.updatedDate}</span>
                  </div>
                  </div>
                </div>
                <div className="rounded-xl bg-[#F8FBFF] px-4 py-3 text-left dark:bg-white/5 lg:text-end">
                  <p className="mb-1 text-xs font-semibold text-[#64748B] dark:text-slate-200">Requested Budget</p>
                  <CurrencyAmount amount={proj.requestedBudget} className="text-xl font-bold text-[#0F172A] dark:text-white" iconSize={16} />
                </div>
              </div>

              {proj.status === 'Clarification Pending' && proj.clarificationWith && (
                <div className="mt-4 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 dark:border-amber-700/30 dark:bg-amber-900/10">
                  <Clock className="h-4 w-4 shrink-0 text-amber-600" />
                  <p className="text-xs text-amber-700 dark:text-amber-300">Pending with {proj.clarificationWith} / <span className="font-semibold text-red-600">{proj.clarificationOverdue} days overdue</span></p>
                </div>
              )}

              <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px]">
                <AiInsightRow expanded={expandedAi === proj.id} onClick={() => setExpandedAi(expandedAi === proj.id ? null : proj.id)} confidence={proj.aiConfidence}>
                  <p className="text-xs leading-5 text-[#475569] dark:text-slate-200">AI recommends validating the budget assumptions, document evidence, and strategic alignment before forwarding this request.</p>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <span className="rounded-lg bg-white px-2 py-2 text-center text-xs font-semibold text-[#286CFF] dark:bg-white/5">Scope OK</span>
                    <span className="rounded-lg bg-white px-2 py-2 text-center text-xs font-semibold text-[#286CFF] dark:bg-white/5">Budget Check</span>
                    <span className="rounded-lg bg-white px-2 py-2 text-center text-xs font-semibold text-[#286CFF] dark:bg-white/5">Docs Scan</span>
                  </div>
                </AiInsightRow>
                <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
                  <div className="rounded-xl border border-[#EAF0F6] bg-[#F8FBFF] px-3 py-2 dark:border-white/10 dark:bg-white/5"><p className="text-xs text-[#64748B]">CapEx</p><CurrencyAmount amount={proj.capex} className="font-bold" /></div>
                  <div className="rounded-xl border border-[#EAF0F6] bg-[#F8FBFF] px-3 py-2 dark:border-white/10 dark:bg-white/5"><p className="text-xs text-[#64748B]">OpEx</p><CurrencyAmount amount={proj.opex} className="font-bold" /></div>
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-2 border-t border-[#EAF0F6] pt-4 dark:border-white/10 sm:flex-row sm:justify-end">
                <Button variant="outline" size="sm" onClick={() => setClarificationProject(proj.name)}><MessageSquare className="h-4 w-4" />Raise Clarification</Button>
                <Button variant="outline" size="sm" asChild><Link to={`/reviewer/review-queue/${proj.id}`}><Eye className="h-4 w-4" />Review</Link></Button>
                <Button size="sm" className="bg-green-600 text-white hover:bg-green-700"><CheckCircle2 className="h-4 w-4" />Mark Reviewed</Button>
              </div>
            </div>
          </article>
        ))}
      </div>

      <ClarificationModal
        open={Boolean(clarificationProject)}
        onOpenChange={(open) => {
          if (!open) setClarificationProject(null)
        }}
        projectName={clarificationProject || ''}
        onSubmit={() => {
          showSuccessToast('Clarification request sent', 'The project owner has been notified and the item is awaiting response.')
          setClarificationProject(null)
        }}
      />
      <ClarificationModal
        open={bulkClarificationOpen}
        onOpenChange={setBulkClarificationOpen}
        projectName={`${selectedIds.length} selected project${selectedIds.length === 1 ? '' : 's'}`}
        onSubmit={() => {
          showSuccessToast('Bulk clarification request sent', `${selectedIds.length} project owner${selectedIds.length === 1 ? '' : 's'} notified.`)
          setBulkClarificationOpen(false)
        }}
      />
    </div>
  )
}
