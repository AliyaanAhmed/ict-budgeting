import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  Bot,
  Check,
  CheckCircle2,
  ChevronDown,
  Download,
  Eye,
  ListFilter,
  Search,
  ShieldCheck,
  Sparkles,
  Undo2,
  WalletCards,
} from 'lucide-react'
import { approvalQueueProjects } from '@/data/db'
import { Button } from '@/components/ui/button'
import { RiskBadge } from '@/components/shared/StatusBadge'
import { cn } from '@/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CurrencyAmount } from '@/components/shared/CurrencyAmount'
import { ClarificationModal } from '@/components/shared/ClarificationModal'
import { useToast } from '@/context/ToastContext'

type ApprovalFilter = 'pending' | 'approved' | 'clarification'

function QueueStat({ label, value, icon: Icon, tone = 'blue', sub }: { label: string; value: React.ReactNode; icon: React.ElementType; tone?: 'blue' | 'green' | 'amber' | 'red'; sub?: string }) {
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
        <span className={cn('flex h-9 w-9 items-center justify-center rounded-xl border', toneClass)}><Icon className="h-4 w-4" /></span>
      </div>
      <div className="text-2xl font-bold text-[#0F172A] dark:text-white">{value}</div>
      {sub && <p className="mt-1 text-xs text-[#64748B] dark:text-slate-200">{sub}</p>}
    </div>
  )
}

function AiPanel({ expanded, onClick, children }: { expanded: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#B0DBFF] bg-gradient-to-b from-[#E7F5FF] to-white shadow-md dark:border-white/10 dark:from-[#10213B] dark:to-[#1E293B]">
      <button onClick={onClick} className="flex w-full items-center gap-3 bg-gradient-to-r from-[#286CFF]/5 to-transparent px-4 py-3 text-left">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#286CFF] to-[#4F98FF] text-white shadow-sm"><Sparkles className="h-5 w-5" /></span>
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

function SelectionControl({ selected, onClick, label }: { selected: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-all',
        selected
          ? 'border-transparent bg-[#286CFF] text-white shadow-sm shadow-blue-100'
          : 'border-[#BFD8FF] bg-white text-transparent hover:border-[#286CFF] hover:bg-[#E7F5FF] dark:border-white/10 dark:bg-white/5'
      )}
    >
      {selected && <Check className="h-4 w-4" />}
    </button>
  )
}

export default function ApprovalQueue() {
  const [activeFilter, setActiveFilter] = useState<ApprovalFilter>('pending')
  const [search, setSearch] = useState('')
  const [expandedAi, setExpandedAi] = useState<string | null>(null)
  const [aiPortfolioExpanded, setAiPortfolioExpanded] = useState(true)
  const [clarificationProject, setClarificationProject] = useState<string | null>(null)
  const [bulkClarificationOpen, setBulkClarificationOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const { showSuccessToast } = useToast()

  const totalRequested = approvalQueueProjects.reduce((s, p) => s + p.requestedBudget, 0)
  const pendingCount = approvalQueueProjects.length
  const approvedCount = approvalQueueProjects.filter((p) => (p as { status?: string }).status === 'Approved').length
  const clarificationCount = approvalQueueProjects.filter((p) => (p as { status?: string }).status?.includes('Clarification')).length
  const avgConfidence = Math.round(approvalQueueProjects.reduce((sum, p) => sum + p.aiConfidence, 0) / Math.max(approvalQueueProjects.length, 1))
  const highRiskCount = approvalQueueProjects.filter((p) => p.riskLevel === 'High').length

  const filtered = useMemo(() => {
    return approvalQueueProjects.filter((p) => {
      const status = (p as { status?: string }).status || 'Pending'
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.entity.toLowerCase().includes(search.toLowerCase()) || p.id.toLowerCase().includes(search.toLowerCase())
      const matchesTab =
        activeFilter === 'pending'
          ? status === 'Pending' || (!status.includes('Approved') && !status.includes('Clarification'))
          : activeFilter === 'approved'
            ? status === 'Approved'
            : status.includes('Clarification')
      return matchesSearch && matchesTab
    })
  }, [activeFilter, search])

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

  return (
    <div className="mx-auto max-w-[1200px] space-y-5">
      <div className="rounded-2xl border border-[#DDEBFF] bg-white px-4 py-5 shadow-[0_10px_26px_rgba(15,23,42,0.05)] dark:border-white/10 dark:bg-[#1E293B] sm:px-6">
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
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#286CFF] to-[#4F98FF] text-white shadow-sm"><Bot className="h-5 w-5" /></div>
              <div>
                <p className="text-sm font-bold text-[#0F172A] dark:text-white">AI Approval Summary</p>
                <p className="text-xs text-[#64748B] dark:text-slate-200">{avgConfidence}% confidence / {highRiskCount} high-risk item(s)</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <QueueStat label="Amount Requested" value={<CurrencyAmount amount={totalRequested} full className="text-2xl font-bold" iconSize={18} />} icon={WalletCards} />
        <QueueStat label="Pending Review" value={pendingCount} icon={AlertTriangle} tone="amber" sub="Action needed" />
        <QueueStat label="Approved" value={approvedCount} icon={CheckCircle2} tone="green" />
        <QueueStat label="AI Confidence" value={`${avgConfidence}%`} icon={Sparkles} />
      </div>

      <AiPanel expanded={aiPortfolioExpanded} onClick={() => setAiPortfolioExpanded(!aiPortfolioExpanded)}>
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-xl bg-white/85 p-3 dark:bg-white/5"><p className="text-xs text-[#64748B]">Portfolio Risk</p><p className="mt-1 text-lg font-bold text-amber-600">Moderate</p></div>
          <div className="rounded-xl bg-white/85 p-3 dark:bg-white/5"><p className="text-xs text-[#64748B]">Ready to Approve</p><p className="mt-1 text-lg font-bold text-green-600">{Math.max(approvalQueueProjects.length - highRiskCount, 0)}</p></div>
          <div className="rounded-xl bg-white/85 p-3 dark:bg-white/5"><p className="text-xs text-[#64748B]">Recommended Focus</p><p className="mt-1 text-sm font-bold text-[#286CFF]">High-value evidence</p></div>
        </div>
        <p className="mt-3 text-xs leading-5 text-[#475569] dark:text-slate-200">AI recommends approving low-risk reviewer-cleared items first, then checking high-value submissions for document evidence and budget concentration.</p>
      </AiPanel>

      <div className="rounded-2xl border border-[#DDEBFF] bg-white p-3 shadow-[0_10px_26px_rgba(15,23,42,0.05)] dark:border-white/10 dark:bg-[#1E293B]">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'pending' as const, label: 'Pending', count: pendingCount },
              { id: 'approved' as const, label: 'Approved', count: approvedCount },
              { id: 'clarification' as const, label: 'Clarification', count: clarificationCount },
            ].map((tab) => (
              <button key={tab.id} onClick={() => setActiveFilter(tab.id)} className={cn('inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-colors', activeFilter === tab.id ? 'bg-[#286CFF] text-white shadow-sm' : 'border border-[#DDEBFF] bg-white text-[#475569] hover:border-[#286CFF] hover:text-[#286CFF] dark:border-white/10 dark:bg-white/5 dark:text-slate-200')}>
                {tab.label}<span className={cn('rounded-full px-2 py-0.5 text-xs', activeFilter === tab.id ? 'bg-white/20' : 'bg-[#EFF6FF] text-[#286CFF] dark:bg-white/10')}>{tab.count}</span>
              </button>
            ))}
          </div>

          <div className="flex flex-1 flex-col gap-2 lg:flex-row xl:justify-end">
            <div className="relative min-w-0 flex-1 xl:max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by Project Names" className="h-10 w-full rounded-xl border border-[#DDEBFF] bg-white pl-9 pr-4 text-sm text-[#0F172A] shadow-sm placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#286CFF]/15 dark:border-white/10 dark:bg-[#0F172A]/30 dark:text-white" />
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:flex">
              <Select defaultValue="all-risks">
                <SelectTrigger className="h-10 rounded-xl border-[#DDEBFF] lg:w-[180px]"><span className="inline-flex w-full items-center gap-2 whitespace-nowrap"><ListFilter className="h-4 w-4 text-[#64748B]" /><SelectValue placeholder="All Risks" /></span></SelectTrigger>
                <SelectContent><SelectItem value="all-risks">All Risks</SelectItem><SelectItem value="high-risk">High Risk</SelectItem><SelectItem value="medium-risk">Medium Risk</SelectItem><SelectItem value="low-risk">Low Risk</SelectItem></SelectContent>
              </Select>
              <Select defaultValue="all-categories">
                <SelectTrigger className="h-10 rounded-xl border-[#DDEBFF] lg:w-[190px]"><span className="inline-flex w-full items-center gap-2 whitespace-nowrap"><ListFilter className="h-4 w-4 text-[#64748B]" /><SelectValue placeholder="All Categories" /></span></SelectTrigger>
                <SelectContent><SelectItem value="all-categories">All Categories</SelectItem><SelectItem value="capex">CapEx</SelectItem><SelectItem value="opex">OpEx</SelectItem><SelectItem value="mixed">Mixed</SelectItem></SelectContent>
              </Select>
            </div>
            <Button variant="outline" size="sm" className="h-10 rounded-xl"><Download className="h-4 w-4" />Export</Button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-[#DDEBFF] bg-white p-3 shadow-[0_10px_26px_rgba(15,23,42,0.05)] dark:border-white/10 dark:bg-[#1E293B]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3 text-left text-sm text-[#475569] dark:text-slate-200">
            <SelectionControl selected={allVisibleSelected} onClick={toggleAllVisible} label="Select all visible approval queue items" />
            <span>
              <span className="font-semibold text-[#0F172A] dark:text-white">Bulk Selection</span>
              <span className="block text-xs text-[#64748B] dark:text-slate-200">{selectedIds.length} selected / {filtered.length} visible</span>
            </span>
          </div>
          <div className="flex flex-wrap gap-2 sm:ml-auto">
            <Button variant="outline" size="sm" disabled={selectedIds.length === 0}>Approve & Submit to DGE</Button>
            <Button variant="outline" size="sm" disabled={selectedIds.length === 0} onClick={() => setBulkClarificationOpen(true)}>Raise Clarification</Button>
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
                  <div className="mb-2 flex flex-wrap items-center gap-2"><span className="font-mono text-xs text-[#94A3B8]">{proj.id}</span><RiskBadge risk={proj.riskLevel} /><span className="rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/20 dark:text-green-300">Reviewer Approved</span></div>
                  <h3 className="text-lg font-bold text-[#0F172A] dark:text-white">{proj.name}</h3>
                  <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#475569] dark:text-slate-200"><span>{proj.entity}</span><span>/</span><span>{proj.budgetType}</span><span>/</span><span>{proj.budgetCategory}</span><span>/</span><span>{proj.glCodeCount} budget codes</span><span>/</span><span>Reviewed by {proj.reviewedBy}</span></div>
                  </div>
                </div>
                <div className="rounded-xl bg-[#F8FBFF] px-4 py-3 text-left dark:bg-white/5 lg:text-end"><p className="mb-1 text-xs font-semibold text-[#64748B] dark:text-slate-200">Requested Budget</p><CurrencyAmount amount={proj.requestedBudget} className="text-2xl font-bold text-[#0F172A] dark:text-white" iconSize={18} /></div>
              </div>

              <div className="mt-4 rounded-xl border border-[#B0DBFF] bg-gradient-to-b from-[#E7F5FF] to-white dark:border-white/10 dark:from-[#10213B] dark:to-[#1E293B] sm:ml-10">
                <button onClick={() => setExpandedAi(expandedAi === proj.id ? null : proj.id)} className="flex w-full items-center gap-2 px-3 py-2.5 text-left"><Sparkles className="h-4 w-4 text-[#286CFF]" /><span className="text-sm font-semibold text-[#0F172A] dark:text-white">AI Approval Insight</span><span className="text-xs text-[#64748B] dark:text-slate-200">{proj.aiConfidence}% confidence</span><ChevronDown className={cn('ml-auto h-4 w-4 text-[#286CFF] transition-transform', expandedAi === proj.id && 'rotate-180')} /></button>
                {expandedAi === proj.id && <div className="border-t border-[#B0DBFF]/70 px-4 py-3 text-xs leading-5 text-[#475569] dark:border-white/10 dark:text-slate-200">{proj.summary}</div>}
              </div>

              <div className="mt-4 flex flex-col gap-2 border-t border-[#EAF0F6] pt-4 dark:border-white/10 sm:ml-10 sm:flex-row sm:justify-end">
                <Button variant="outline" size="sm" onClick={() => setClarificationProject(proj.name)}><Undo2 className="h-4 w-4" />Raise Clarification</Button>
                <Button variant="outline" size="sm" asChild><Link to={`/approver/approval-queue/${proj.id}`}><Eye className="h-4 w-4" />Review</Link></Button>
                <Button size="sm" className="bg-green-600 text-white hover:bg-green-700"><ShieldCheck className="h-4 w-4" />Approve & Submit to DGE</Button>
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
          showSuccessToast('Returned with clarification', 'The project has been sent back for clarification and is awaiting an updated response.')
          setClarificationProject(null)
        }}
      />
      <ClarificationModal
        open={bulkClarificationOpen}
        onOpenChange={setBulkClarificationOpen}
        projectName={`${selectedIds.length} selected project${selectedIds.length === 1 ? '' : 's'}`}
        onSubmit={() => {
          showSuccessToast('Bulk clarification raised', `${selectedIds.length} project${selectedIds.length === 1 ? '' : 's'} returned for clarification.`)
          setBulkClarificationOpen(false)
        }}
      />
    </div>
  )
}
