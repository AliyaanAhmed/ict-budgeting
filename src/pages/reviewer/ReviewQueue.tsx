import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Download, ChevronDown, Clock, FileX, CheckCircle2, ListFilter } from 'lucide-react'
import { reviewQueueProjects, currentCycle } from '@/data/db'
import { Button } from '@/components/ui/button'
import { RiskBadge } from '@/components/shared/StatusBadge'
import { CurrencyAmount } from '@/components/shared/CurrencyAmount'
import { cn } from '@/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ClarificationModal } from '@/components/shared/ClarificationModal'
import { useToast } from '@/context/ToastContext'

export default function ReviewQueue() {
  const [activeFilter, setActiveFilter] = useState<'to-review' | 'reviewed' | 'clarification'>('to-review')
  const [search, setSearch] = useState('')
  const [expandedAi, setExpandedAi] = useState<string | null>(null)
  const [clarificationProject, setClarificationProject] = useState<string | null>(null)
  const { showSuccessToast } = useToast()

  const toReview = reviewQueueProjects.filter((p) => p.status === 'To Review').length
  const reviewed = reviewQueueProjects.filter((p) => p.status === 'Reviewed').length
  const clarification = reviewQueueProjects.filter((p) => p.status === 'Clarification Pending').length
  const avgReadiness = Math.round(reviewQueueProjects.reduce((s, p) => s + p.aiConfidence, 0) / reviewQueueProjects.length)
  const missingDocs = reviewQueueProjects.filter((p) => p.hasMissingDocs).length

  const filtered = reviewQueueProjects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) || p.entity.toLowerCase().includes(search.toLowerCase())
  )

  const statusBadge = (status: string) => {
    const config: Record<string, string> = {
      'To Review': 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
      'Reviewed': 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400',
      'Clarification Pending': 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
    }
    return config[status] ?? 'bg-slate-100 text-slate-600'
  }

  return (
    <div className="space-y-5 w-full max-w-none">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A] dark:text-white">Review Queue</h1>
          <p className="text-sm text-[#475569] dark:text-slate-200 mt-1">
            Submitted by Respondent: {reviewQueueProjects.length} &bull; Reviewed by You: {reviewed}/{reviewQueueProjects.length}
          </p>
          <p className="text-xs text-[#286CFF] font-medium mt-1">FY2026 ICT Budget Cycle · Submission Deadline: {currentCycle.daysRemaining} days</p>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'To Review', value: toReview, color: 'text-amber-600 dark:text-white' },
          { label: 'Reviewed', value: reviewed, color: 'text-green-600 dark:text-white' },
          { label: 'Clarification Pending', value: clarification, color: 'text-orange-600 dark:text-white' },
          { label: 'Avg Readiness', value: `${avgReadiness}%`, color: 'text-blue-600 dark:text-white' },
          { label: 'Missing Docs', value: missingDocs, color: 'text-red-600 dark:text-white' },
        ].map((s) => (
          <div key={s.label} className="rounded-[10px] border border-[#E2E8F0] dark:border-white/10 bg-white dark:bg-[#1E293B] p-3 text-center shadow-sm">
            <p className={cn('text-2xl font-bold font-mono', s.color)}>{s.value}</p>
            <p className="text-xs text-[#475569] dark:text-white mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Bulk actions */}
      <div className="flex items-center gap-3 rounded-[10px] border border-[#E2E8F0] dark:border-white/10 bg-white dark:bg-[#1E293B] p-3 flex-wrap">
        <label className="flex items-center gap-2 text-sm text-[#475569] dark:text-slate-200 cursor-pointer">
          <input type="checkbox" className="rounded border-[#CBD5E1]" />
          Select items for bulk actions
        </label>
        <div className="flex items-center gap-2 ml-auto flex-wrap">
          <Button variant="outline" size="sm" disabled>Mark Reviewed</Button>
          <Button variant="outline" size="sm" disabled>Raise Clarification</Button>
          <Button size="sm" disabled>Submit to Approver</Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {[
          { id: 'to-review' as const, label: 'To Review', count: toReview },
          { id: 'reviewed' as const, label: 'Reviewed', count: reviewed },
          { id: 'clarification' as const, label: 'Clarification', count: clarification },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
              activeFilter === tab.id
                ? 'bg-[var(--primary)] text-white'
                : 'bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-white/10 text-[#475569] dark:text-slate-200 hover:bg-[#F1F5F9] dark:hover:bg-white/5'
            )}
          >
            {tab.label}
            <span className={cn('rounded-full px-1.5 py-0.5 text-xs font-bold', activeFilter === tab.id ? 'bg-white/20' : 'bg-[#F1F5F9] dark:bg-white/10')}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8] dark:text-white" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by project name, entity, or ID..."
            className="w-full h-9 pl-9 pr-4 rounded-[8px] border border-[#E2E8F0] dark:border-white/10 bg-white dark:bg-[#1E293B] text-sm text-[#0F172A] dark:text-white placeholder:text-[#94A3B8] focus:outline-none focus:ring-1 focus:ring-[#286CFF]"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {['High AI Risk', 'Clarification Likely', 'Recently Updated'].map((chip) => (
            <button key={chip} className="inline-flex items-center gap-1.5 rounded-full border border-[#E2E8F0] dark:border-white/10 bg-white dark:bg-[#1E293B] px-3 py-1 text-xs font-medium text-[#475569] dark:text-slate-200 hover:border-[#286CFF] hover:text-[#286CFF] transition-colors">
              {chip}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2 flex-wrap">
          <div className="w-[210px]">
            <Select defaultValue="all-entities">
              <SelectTrigger>
                <span className="inline-flex w-full items-center gap-2 whitespace-nowrap">
                  <ListFilter className="h-4 w-4 text-[var(--muted-foreground)]" />
                  <SelectValue className="truncate" placeholder="All Entities" />
                </span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-entities">All Entities</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="w-[210px]">
            <Select defaultValue="newest-submitted">
              <SelectTrigger>
                <span className="inline-flex w-full items-center gap-2 whitespace-nowrap">
                  <ListFilter className="h-4 w-4 text-[var(--muted-foreground)]" />
                  <SelectValue className="truncate" placeholder="Newest Submitted" />
                </span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest-submitted">Newest Submitted</SelectItem>
                <SelectItem value="oldest-submitted">Oldest Submitted</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button variant="ai" size="sm">
            Ask AI
          </Button>
        </div>
      </div>

      {/* Project Cards */}
      <div className="space-y-4">
        {filtered.map((proj) => (
          <div
            key={proj.id}
            className={cn(
              'rounded-[12px] border bg-white dark:bg-[#1E293B] shadow-sm overflow-hidden',
              proj.riskLevel === 'High' ? 'border-red-200 dark:border-red-700/30' : 'border-[#E2E8F0] dark:border-white/10',
              proj.hasMissingDocs && 'border-l-4 border-l-red-400'
            )}
          >
            <div className="p-5">
              {/* Top row */}
              <div className="mb-3">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <h3 className="font-semibold text-[#0F172A] dark:text-white">{proj.name}</h3>
                  <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', statusBadge(proj.status))}>
                    {proj.status}
                  </span>
                  <RiskBadge risk={proj.riskLevel} />
                  {proj.hasMissingDocs && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 px-2 py-0.5 text-xs font-medium">
                      <FileX className="h-3 w-3" />
                      Missing Docs
                    </span>
                  )}
                </div>
                <div className="flex items-end justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-x-2 gap-y-1 text-xs text-[#475569] dark:text-slate-200 flex-wrap">
                    <span>{proj.entity}</span>
                    <span>·</span>
                    <span>{proj.glCodeCount} GL codes</span>
                    <span>·</span>
                    <span>CapEx: <CurrencyAmount amount={proj.capex} className="font-semibold" /></span>
                    <span>OpEx: <CurrencyAmount amount={proj.opex} className="font-semibold" /></span>
                    <span>·</span>
                    <span>By {proj.submittedBy}</span>
                    <span>·</span>
                    <span>Submitted {proj.submittedDate}</span>
                    <span>·</span>
                    <span>Updated {proj.updatedDate}</span>
                  </div>
                  <div className="text-end shrink-0">
                    <p className="text-xs text-[#475569] dark:text-slate-200 uppercase tracking-wide mb-1">Requested Budget</p>
                    <CurrencyAmount amount={proj.requestedBudget} className="text-xl font-bold text-[#0F172A] dark:text-white" iconSize={16} />
                  </div>
                </div>
              </div>

              {/* Clarification overdue */}
              {proj.status === 'Clarification Pending' && proj.clarificationWith && (
                <div className="mb-3 flex items-center gap-2 rounded-[8px] bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-700/30 px-3 py-2">
                  <Clock className="h-4 w-4 text-amber-600 shrink-0" />
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    Pending with {proj.clarificationWith} &bull;{' '}
                    <span className="font-semibold text-red-600">{proj.clarificationOverdue} days overdue</span>
                  </p>
                </div>
              )}

              {/* AI Insights */}
              <div className="mb-3">
                <div
                  className="flex items-center gap-2 cursor-pointer rounded-[8px] bg-[var(--surface)] border border-[var(--border)] px-3 py-2"
                  onClick={() => setExpandedAi(expandedAi === proj.id ? null : proj.id)}
                >
                  <span className="text-[var(--ai-accent)]">?</span>
                  <span className="text-xs font-medium text-[var(--ai-accent)]">AI Review Insights</span>
                  <span className="text-xs text-[var(--muted-foreground)]">· {proj.aiConfidence}% Confidence</span>
                  <span className="ml-auto text-xs text-[var(--muted-foreground)] font-medium">Coming Soon</span>
                  <ChevronDown className={cn('h-4 w-4 text-[var(--ai-accent)] ml-1 transition-transform', expandedAi === proj.id && 'rotate-180')} />
                </div>
                {expandedAi === proj.id && (
                  <div className="mt-2 rounded-[8px] bg-[var(--surface)] border border-[var(--border)] px-4 py-3">
                    <p className="text-xs text-[var(--muted-foreground)]">
                      AI analysis will appear here once configured - budget alignment check, document completeness review, and risk flag summary.
                    </p>
                    <a href="#" className="mt-2 inline-block text-xs text-[var(--ai-accent)] font-medium hover:underline">Ask AI for detailed analysis ?</a>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setClarificationProject(proj.name)}
                >
                  Raise Clarification
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/reviewer/review-queue/${proj.id}`}>Review</Link>
                </Button>
                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                  <CheckCircle2 className="h-4 w-4" />
                  Mark Reviewed
                </Button>
              </div>
            </div>
          </div>
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
    </div>
  )
}








