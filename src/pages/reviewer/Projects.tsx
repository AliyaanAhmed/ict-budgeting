import { useState } from 'react'
import { Search, Download, LayoutList, LayoutGrid, ChevronDown, ListFilter, Eye, Sparkles } from 'lucide-react'
import { projects } from '@/data/db'
import { ProjectTable } from '@/components/shared/ProjectTable'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Link } from 'react-router-dom'
import { StatusBadge, RiskBadge } from '@/components/shared/StatusBadge'
import { CurrencyAmount } from '@/components/shared/CurrencyAmount'

type FilterTab = 'all' | 'pending-review' | 'clarification' | 'submitted-approver'

export default function ReviewerProjects() {
  const [activeTab, setActiveTab] = useState<FilterTab>('all')
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table')
  const [aiExpanded, setAiExpanded] = useState(false)

  const tabs: { id: FilterTab; label: string; count: number }[] = [
    { id: 'all', label: 'All Projects', count: projects.length },
    { id: 'pending-review', label: 'Pending Review', count: projects.filter((p) => p.status === 'Submitted to Reviewer').length },
    { id: 'clarification', label: 'Clarification Required', count: projects.filter((p) => p.status === 'Clarification Required').length },
    { id: 'submitted-approver', label: 'Submitted to Approver', count: projects.filter((p) => p.status === 'Submitted to Approver').length },
  ]

  const filtered = projects.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.id.toLowerCase().includes(search.toLowerCase())
    const matchesTab =
      activeTab === 'all' ||
      (activeTab === 'pending-review' && p.status === 'Submitted to Reviewer') ||
      (activeTab === 'clarification' && p.status === 'Clarification Required') ||
      (activeTab === 'submitted-approver' && p.status === 'Submitted to Approver')
    return matchesSearch && matchesTab
  })

  return (
    <div className="space-y-5 max-w-[1400px]">
      <div>
        <h1 className="text-2xl font-bold text-[#0F172A] dark:text-white">Projects</h1>
        <p className="text-sm text-[#475569] dark:text-slate-400 mt-1">Entity-wide project overview</p>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
              activeTab === tab.id
                ? 'bg-[var(--primary)] text-white'
                : 'bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-white/10 text-[#475569] dark:text-slate-400 hover:bg-[#F1F5F9] dark:hover:bg-white/5'
            )}
          >
            {tab.label}
            <span className={cn('rounded-full px-1.5 py-0.5 text-xs font-bold', activeTab === tab.id ? 'bg-white/20' : 'bg-[#F1F5F9] dark:bg-white/10')}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      <div className="rounded-[10px] border border-dashed border-[#D946EF] bg-[#d946ef1a] overflow-hidden">
        <button
          onClick={() => setAiExpanded(!aiExpanded)}
          className="ai-panel-trigger"
        >
          <Sparkles className="h-4 w-4 text-[var(--ai-accent)]" />
          <span className="ai-panel-title">AI Portfolio Summary</span>
          <span className="text-xs text-[#D946EF]">• High Portfolio Risk • {projects.filter(p => p.aiScore < 75 || p.riskLevel === 'High').length} need attention</span>
          <ChevronDown className={cn('h-4 w-4 text-[var(--primary)] ml-auto transition-transform', aiExpanded && 'rotate-180')} />
        </button>
        {aiExpanded && (
          <div className="px-4 pb-4">
            <p className="text-sm text-[#D946EF]">
              AI portfolio analysis will appear here once configured.
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search projects..." className="pl-9" />
        </div>
        <div className="w-[210px]">
          <Select defaultValue="all-priorities">
            <SelectTrigger>
              <span className="inline-flex w-full items-center gap-2 whitespace-nowrap">
                <ListFilter className="h-4 w-4 text-[var(--muted-foreground)]" />
                <SelectValue className="truncate" placeholder="All Priorities" />
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-priorities">All Priorities</SelectItem>
              <SelectItem value="high-priority">High Priority</SelectItem>
              <SelectItem value="medium-priority">Medium Priority</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm"><Download className="h-4 w-4" />Export</Button>
          <div className="flex rounded-[8px] border border-[#E2E8F0] dark:border-white/10 overflow-hidden">
            <button onClick={() => setViewMode('table')} className={cn('p-2 transition-colors', viewMode === 'table' ? 'bg-[var(--primary)] text-white' : 'bg-white dark:bg-[#1E293B] text-[#475569] dark:text-slate-400 hover:bg-[#F1F5F9] dark:hover:bg-white/5')}><LayoutList className="h-4 w-4" /></button>
            <button onClick={() => setViewMode('cards')} className={cn('p-2 transition-colors', viewMode === 'cards' ? 'bg-[var(--primary)] text-white' : 'bg-white dark:bg-[#1E293B] text-[#475569] dark:text-slate-400 hover:bg-[#F1F5F9] dark:hover:bg-white/5')}><LayoutGrid className="h-4 w-4" /></button>
          </div>
        </div>
      </div>

      <div className="rounded-[12px] border border-[#E2E8F0] dark:border-white/10 bg-white dark:bg-[#1E293B] shadow-sm overflow-hidden">
        {viewMode === 'table' ? (
          <ProjectTable projects={filtered} linkBase="/reviewer/review-queue" showCreatedBy />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-4">
            {filtered.map((project) => (
              <div key={project.id} className="rounded-[10px] border border-[#E2E8F0] dark:border-white/10 bg-[#F8FAFC] dark:bg-[#0F172A] p-4">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <Link to={`/reviewer/review-queue/${project.id}`} className="font-semibold text-sm text-[#0F172A] dark:text-white hover:text-[var(--primary)] transition-colors">
                    {project.name}
                  </Link>
                </div>
                <div className="flex items-center gap-2 flex-wrap mb-3">
                  <StatusBadge status={project.status} />
                  <RiskBadge risk={project.riskLevel} />
                </div>
                <p className="text-xs text-[#475569] dark:text-slate-400 mb-3">{project.strategicPriority} • {project.classification}</p>
                <div className="flex items-center justify-between">
                  <CurrencyAmount amount={project.requestedBudget} className="font-semibold text-sm text-[#0F172A] dark:text-white" />
                  <Link to={`/reviewer/review-queue/${project.id}`} className="inline-flex items-center gap-1 text-xs font-medium text-[var(--primary)] hover:underline">
                    <Eye className="h-3.5 w-3.5" />
                    Review
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="px-5 py-3 border-t border-[#F1F5F9] dark:border-white/5 flex items-center gap-4 text-sm text-[#475569] dark:text-slate-400">
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-green-500 inline-block" />{projects.filter(p => p.status === 'Approved').length} Approved</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-500 inline-block" />{projects.filter(p => ['Submitted to Reviewer', 'Submitted to Approver'].includes(p.status)).length} Pending</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-red-500 inline-block" />{projects.filter(p => ['Needs Work', 'Draft', 'Clarification Required'].includes(p.status)).length} Needs Attention</span>
        </div>
      </div>
    </div>
  )
}





