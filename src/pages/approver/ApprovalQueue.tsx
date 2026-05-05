import { Sparkles, ChevronDown, Download, ListFilter, Undo2, Eye, Search } from 'lucide-react'
import { approvalQueueProjects } from '@/data/db'
import { Button } from '@/components/ui/button'
import { RiskBadge } from '@/components/shared/StatusBadge'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CurrencyAmount } from '@/components/shared/CurrencyAmount'
import { ClarificationModal } from '@/components/shared/ClarificationModal'
import { useToast } from '@/context/ToastContext'

export default function ApprovalQueue() {
  const [activeFilter, setActiveFilter] = useState<'pending' | 'approved' | 'clarification'>('pending')
  const [search, setSearch] = useState('')
  const [expandedAi, setExpandedAi] = useState<string | null>(null)
  const [aiPortfolioExpanded, setAiPortfolioExpanded] = useState(false)
  const [clarificationProject, setClarificationProject] = useState<string | null>(null)
  const { showSuccessToast } = useToast()

  const totalRequested = approvalQueueProjects.reduce((s, p) => s + p.requestedBudget, 0)
  const pendingCount = approvalQueueProjects.length
  const approvedCount = approvalQueueProjects.filter((p) => (p as { status?: string }).status === 'Approved').length
  const clarificationCount = approvalQueueProjects.filter((p) => (p as { status?: string }).status?.includes('Clarification')).length

  return (
    <div className="space-y-5 w-full max-w-none">
      <div className="flex items-start justify-between gap-4">
        <div>
          <nav className="text-xs text-[#475569] dark:text-slate-200 mb-2">Home › Approver Queue</nav>
          <h1 className="text-2xl font-bold text-[#0F172A] dark:text-white">Approver Queue</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="inline-flex items-center rounded-full bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 px-2.5 py-0.5 text-xs font-medium">Reviewer Approved</span>
            <span className="text-xs text-[#475569] dark:text-slate-200">{approvalQueueProjects.length} Items</span>
          </div>
        </div>
        <Button variant="ai" size="sm">
          <Sparkles className="h-4 w-4" />
          Ask AI
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Amount Requested', value: <CurrencyAmount amount={totalRequested} full className="text-xl font-bold" iconSize={16} /> },
          { label: 'Amount Approved', value: <CurrencyAmount amount={0} full className="text-xl font-bold" iconSize={16} /> },
          { label: 'Total Items', value: approvalQueueProjects.length },
          { label: 'Pending Review', value: approvalQueueProjects.length, sub: 'Action needed', amber: true },
        ].map((s) => (
          <div key={s.label} className="rounded-[12px] border border-[#E2E8F0] dark:border-white/10 bg-white dark:bg-[#1E293B] p-4 shadow-sm">
            <p className="text-xs font-medium text-[#475569] dark:text-slate-200 uppercase tracking-wide mb-1">{s.label}</p>
            <div className={cn('text-xl font-bold dark:text-white', s.amber ? 'text-amber-600' : 'text-[#0F172A] dark:text-white')}>{s.value}</div>
            {s.sub && <p className="text-xs text-[#475569] dark:text-white mt-1">{s.sub}</p>}
          </div>
        ))}
      </div>

      <div className="rounded-[10px] border border-dashed border-[#D946EF] bg-[#d946ef1a] overflow-hidden">
        <button
          onClick={() => setAiPortfolioExpanded(!aiPortfolioExpanded)}
          className="ai-panel-trigger"
        >
          <Sparkles className="h-4 w-4 text-[var(--ai-accent)] shrink-0" />
          <span className="ai-panel-title">AI Portfolio Summary</span>
          <span className="text-xs text-[#D946EF]">• High Portfolio Risk • 3 need attention</span>
          <ChevronDown className={cn('h-4 w-4 text-[var(--ai-accent)] ml-auto transition-transform', aiPortfolioExpanded && 'rotate-180')} />
        </button>
        {aiPortfolioExpanded && (
          <div className="px-4 pb-4">
            <p className="text-sm text-[#D946EF]">
              AI portfolio analysis will appear here once configured.
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 rounded-[10px] border border-[#E2E8F0] dark:border-white/10 bg-white dark:bg-[#1E293B] p-3 flex-wrap">
        <label className="flex items-center gap-2 text-sm text-[#475569] dark:text-slate-200 cursor-pointer">
          <input type="checkbox" className="rounded border-[#CBD5E1]" />
          Select items for bulk actions
        </label>
        <div className="flex items-center gap-2 ml-auto flex-wrap">
          <Button variant="outline" size="sm" disabled>Approve Selected</Button>
          <Button variant="outline" size="sm" disabled>Return for Clarification</Button>
          <Button size="sm" disabled>Submit to DGE</Button>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { id: 'pending' as const, label: 'Pending', count: pendingCount },
            { id: 'approved' as const, label: 'Approved', count: approvedCount },
            { id: 'clarification' as const, label: 'Clarification', count: clarificationCount },
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

        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8] dark:text-white" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by project name, entity, or ID..."
            className="w-full h-9 pl-9 pr-4 rounded-[8px] border border-[#E2E8F0] dark:border-white/10 bg-white dark:bg-[#1E293B] text-sm text-[#0F172A] dark:text-white placeholder:text-[#94A3B8] focus:outline-none focus:ring-1 focus:ring-[#286CFF]"
          />
        </div>

        <div className="w-[210px]">
          <Select defaultValue="all-risks">
            <SelectTrigger>
              <span className="inline-flex w-full items-center gap-2 whitespace-nowrap">
                <ListFilter className="h-4 w-4 text-[var(--muted-foreground)]" />
                <SelectValue className="truncate" placeholder="All Risks" />
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-risks">All Risks</SelectItem>
              <SelectItem value="high-risk">High Risk</SelectItem>
              <SelectItem value="medium-risk">Medium Risk</SelectItem>
              <SelectItem value="low-risk">Low Risk</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="w-[210px]">
          <Select defaultValue="all-categories">
            <SelectTrigger>
              <span className="inline-flex w-full items-center gap-2 whitespace-nowrap">
                <ListFilter className="h-4 w-4 text-[var(--muted-foreground)]" />
                <SelectValue className="truncate" placeholder="All Categories" />
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-categories">All Categories</SelectItem>
              <SelectItem value="infrastructure">Infrastructure</SelectItem>
              <SelectItem value="applications">Applications</SelectItem>
              <SelectItem value="security">Security</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button variant="outline" size="sm" className="ml-auto"><Download className="h-4 w-4" />Export</Button>
      </div>

      <div className="space-y-4">
        {approvalQueueProjects.map((proj) => (
          <div
            key={proj.id}
            className={cn(
              'rounded-[12px] border bg-white dark:bg-[#1E293B] shadow-sm overflow-hidden',
              proj.riskLevel === 'High' ? 'border-red-200 dark:border-red-700/30 border-l-4 border-l-red-400' : 'border-[#E2E8F0] dark:border-white/10'
            )}
          >
            <div className="p-5">
              <div className="flex items-start gap-4 flex-wrap mb-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <span className="text-xs font-mono text-[#94A3B8] dark:text-white">{proj.id}</span>
                    <RiskBadge risk={proj.riskLevel} />
                  </div>
                  <h3 className="text-lg font-bold text-[#0F172A] dark:text-white">{proj.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-[#475569] dark:text-slate-200 mt-1 flex-wrap">
                    <span>{proj.entity}</span>
                    <span>•</span>
                    <span className="inline-flex items-center rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 px-2 py-0.5 text-xs font-medium">{proj.budgetType}</span>
                    <span className="inline-flex items-center rounded-full bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-100 px-2 py-0.5 text-xs font-medium">{proj.budgetCategory}</span>
                  </div>
                </div>
                <div className="text-end shrink-0">
                  <p className="text-xs text-[#475569] dark:text-slate-200 uppercase tracking-wide">Requested Budget</p>
                  <CurrencyAmount amount={proj.requestedBudget} className="text-2xl font-bold text-[#0F172A] dark:text-white" iconSize={18} />
                </div>
              </div>

              <div className="mb-4">
                <div
                  className="flex items-center gap-2 cursor-pointer rounded-[8px] bg-[var(--surface)] border border-[var(--border)] dark:border-white/10 px-3 py-2.5"
                  onClick={() => setExpandedAi(expandedAi === proj.id ? null : proj.id)}
                >
                  <Sparkles className="h-3.5 w-3.5 text-[var(--ai-accent)]" />
                  <span className="text-xs font-medium text-[var(--ai-accent)]">AI GENERATED</span>
                  <span className="text-xs text-[var(--muted-foreground)]">• {proj.aiConfidence}% Confidence</span>
                  <span className="ml-auto text-xs text-[var(--muted-foreground)]">Ask AI ?</span>
                </div>
                {expandedAi === proj.id && (
                  <div className="mt-2 rounded-[8px] bg-[var(--surface)] border border-[var(--border)] dark:border-white/10 px-4 py-3">
                    <p className="text-xs text-[var(--muted-foreground)]">{proj.summary}</p>
                  </div>
                )}
              </div>

              <p className="text-sm text-[#475569] dark:text-slate-200 mb-4">{proj.summary}</p>

              <div className="flex items-center justify-between gap-3 flex-wrap pt-3 border-t border-[#F1F5F9] dark:border-white/5">
                <div className="flex items-center gap-2 text-xs text-[#475569] dark:text-slate-200">
                  <span>{proj.glCodeCount} budget codes</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <span className="h-4 w-4 rounded-full bg-[#F1F5F9] dark:bg-white/10 inline-flex items-center justify-center text-[10px]">?</span>
                    Reviewed by {proj.reviewedBy}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setClarificationProject(proj.name)}>
                    <Undo2 className="h-4 w-4" />
                    Return for Edit
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/approver/approval-queue/${proj.id}`}>
                      <Eye className="h-4 w-4" />
                      Review
                    </Link>
                  </Button>
                </div>
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
          showSuccessToast('Returned with clarification', 'The project has been sent back for clarification and is awaiting an updated response.')
          setClarificationProject(null)
        }}
      />
    </div>
  )
}









