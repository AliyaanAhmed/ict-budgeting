import { Sparkles, ChevronDown, Download, ListFilter, Undo2, Eye } from 'lucide-react'
import { approvalQueueProjects } from '@/data/db'
import { Button } from '@/components/ui/button'
import { RiskBadge } from '@/components/shared/StatusBadge'
import { formatAED, formatAEDFull } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function ApprovalQueue() {
  const [activeFilter, setActiveFilter] = useState<'Pending' | 'Approved' | 'Clarification'>('Pending')
  const [expandedAi, setExpandedAi] = useState<string | null>(null)
  const [aiPortfolioExpanded, setAiPortfolioExpanded] = useState(false)

  const totalRequested = approvalQueueProjects.reduce((s, p) => s + p.requestedBudget, 0)

  return (
    <div className="space-y-5 max-w-[900px]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <nav className="text-xs text-[#475569] dark:text-slate-400 mb-2">Home › Approver Queue</nav>
          <h1 className="text-2xl font-bold text-[#0F172A] dark:text-white">Approver Queue</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="inline-flex items-center rounded-full bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 px-2.5 py-0.5 text-xs font-medium">REVIEWER APPROVED</span>
            <span className="text-sm text-[#475569] dark:text-slate-400">{approvalQueueProjects.length} Items</span>
          </div>
        </div>
        <Button variant="ai" size="sm">
          <Sparkles className="h-4 w-4" />
          Ask AI
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Amount Requested', value: formatAEDFull(totalRequested) },
          { label: 'Amount Approved', value: 'AED 0' },
          { label: 'Total Items', value: approvalQueueProjects.length },
          { label: 'Pending Review', value: approvalQueueProjects.length, sub: 'Action needed', amber: true },
        ].map((s) => (
          <div key={s.label} className="rounded-[12px] border border-[#E2E8F0] dark:border-white/10 bg-white dark:bg-[#1E293B] p-4 shadow-sm">
            <p className="text-xs font-medium text-[#475569] dark:text-slate-400 uppercase tracking-wide mb-1">{s.label}</p>
            <p className={cn('text-xl font-bold font-mono', s.amber ? 'text-amber-600' : 'text-[#0F172A] dark:text-white')}>{s.value}</p>
            {s.sub && <p className="text-xs text-[#475569] dark:text-slate-400 mt-1">{s.sub}</p>}
          </div>
        ))}
      </div>

      <div className="rounded-[10px] border border-dashed border-[#3A7CA5] bg-[#EAF4FB] dark:bg-cyan-950/20 overflow-hidden">
        <button
          onClick={() => setAiPortfolioExpanded(!aiPortfolioExpanded)}
          className="flex w-full items-center gap-3 px-4 py-3 text-left"
        >
          <Sparkles className="h-4 w-4 text-[#1D4E89] shrink-0" />
          <span className="text-sm font-medium text-[#1D4E89] dark:text-cyan-300">AI Portfolio Summary</span>
          <span className="text-xs text-[#1D4E89]/70 dark:text-cyan-300/70">• High Portfolio Risk • 3 need attention</span>
          <ChevronDown className={cn('h-4 w-4 text-[#1D4E89] ml-auto transition-transform', aiPortfolioExpanded && 'rotate-180')} />
        </button>
        {aiPortfolioExpanded && (
          <div className="px-4 pb-4">
            <p className="text-sm text-[#1D4E89]/70 dark:text-cyan-300/70">
              AI portfolio analysis will appear here once configured.
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1 rounded-[8px] border border-[#E2E8F0] dark:border-white/10 bg-white dark:bg-[#1E293B] p-1">
          {(['Pending', 'Approved', 'Clarification'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={cn(
                'flex items-center gap-1.5 rounded-[6px] px-3 py-1.5 text-sm font-medium transition-colors',
                activeFilter === f
                  ? 'bg-[#1D4E89] text-white'
                  : 'text-[#475569] dark:text-slate-400 hover:bg-[#F1F5F9] dark:hover:bg-white/5'
              )}
            >
              {f}
              {f === 'Pending' && (
                <span className={cn('rounded-full px-1.5 py-0.5 text-xs font-bold', activeFilter === f ? 'bg-white/20' : 'bg-[#F1F5F9] dark:bg-white/10')}>
                  {approvalQueueProjects.length}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="w-[180px]">
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

        <div className="w-[190px]">
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
                    <span className="text-xs font-mono text-[#94A3B8]">{proj.id}</span>
                    <RiskBadge risk={proj.riskLevel} />
                  </div>
                  <h3 className="text-lg font-bold text-[#0F172A] dark:text-white">{proj.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-[#475569] dark:text-slate-400 mt-1 flex-wrap">
                    <span>{proj.entity}</span>
                    <span>•</span>
                    <span className="inline-flex items-center rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 px-2 py-0.5 text-xs font-medium">{proj.budgetType}</span>
                    <span className="inline-flex items-center rounded-full bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 px-2 py-0.5 text-xs font-medium">{proj.budgetCategory}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-[#475569] dark:text-slate-400 uppercase tracking-wide">Requested Budget</p>
                  <p className="text-2xl font-bold font-mono text-[#0F172A] dark:text-white">{formatAED(proj.requestedBudget)}</p>
                </div>
              </div>

              <div className="mb-4">
                <div
                  className="flex items-center gap-2 cursor-pointer rounded-[8px] bg-[#EAF4FB] dark:bg-cyan-950/20 border border-[#B9D8EB] dark:border-cyan-700 px-3 py-2.5"
                  onClick={() => setExpandedAi(expandedAi === proj.id ? null : proj.id)}
                >
                  <Sparkles className="h-3.5 w-3.5 text-[#1D4E89]" />
                  <span className="text-xs font-medium text-[#1D4E89] dark:text-cyan-300">AI GENERATED</span>
                  <span className="text-xs text-[#1D4E89]/70 dark:text-cyan-300/70">• {proj.aiConfidence}% Confidence</span>
                  <span className="ml-auto text-xs text-[#1D4E89]/60">Ask AI ?</span>
                </div>
                {expandedAi === proj.id && (
                  <div className="mt-2 rounded-[8px] bg-[#EAF4FB] dark:bg-cyan-950/20 border border-[#B9D8EB] dark:border-cyan-700 px-4 py-3">
                    <p className="text-xs text-[#1D4E89]/80 dark:text-cyan-300/80">{proj.summary}</p>
                  </div>
                )}
              </div>

              <p className="text-sm text-[#475569] dark:text-slate-400 mb-4">{proj.summary}</p>

              <div className="flex items-center justify-between gap-3 flex-wrap pt-3 border-t border-[#F1F5F9] dark:border-white/5">
                <div className="flex items-center gap-2 text-xs text-[#475569] dark:text-slate-400">
                  <span>{proj.glCodeCount} budget codes</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <span className="h-4 w-4 rounded-full bg-[#F1F5F9] dark:bg-white/10 inline-flex items-center justify-center text-[10px]">?</span>
                    Reviewed by {proj.reviewedBy}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm"><Undo2 className="h-4 w-4" />Return for Edit</Button>
                  <Button variant="outline" size="sm"><Eye className="h-4 w-4" />Review</Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

