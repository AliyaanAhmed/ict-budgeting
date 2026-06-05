import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  Eye,
  FileWarning,
  Info,
  ListFilter,
  MessageSquareDot,
  Scale,
  Search,
  Send,
  ShieldAlert,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CurrencyAmount } from '@/components/shared/CurrencyAmount'
import { cn } from '@/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { StrategyPageShell } from '@/pages/strategy-team/StrategyTeamShell'
import { reviewsTabs, smeReviews } from './smeTeamData'

type ReviewTab = (typeof reviewsTabs)[number]['id']
type EntityFilter = 'all' | 'Abu Dhabi Digital Authority' | 'Department of Municipalities' | 'Abu Dhabi Housing Authority' | 'Department of Health'

function getRiskBadge(risk: string) {
  if (risk === 'High') return 'border-[#FECACA] bg-[#FEF2F2] text-[#DC2626] dark:border-[#DC2626]/30 dark:bg-[#DC2626]/12 dark:text-[#FCA5A5]'
  if (risk === 'Medium') return 'border-[#FDE68A] bg-[#FFF8E8] text-[#B45309] dark:border-[#B45309]/30 dark:bg-[#3A2810] dark:text-[#F6D28A]'
  return 'border-[#BBF7D0] bg-[#EEF9F1] text-[#16A34A] dark:border-[#16A34A]/30 dark:bg-[#123123] dark:text-[#86EFAC]'
}

function matchesTab(status: string, tab: ReviewTab, hasMismatch: boolean) {
  if (tab === 'all') return true
  if (tab === 'to-review') return status === 'To Review'
  if (tab === 'reviewed') return status === 'Reviewed'
  if (tab === 'clarification') return status === 'Clarification Raised'
  if (tab === 'to-respond') return status === 'To Respond'
  if (tab === 'priority-mismatch') return hasMismatch
  return true
}

function QueueActionButton({
  icon: Icon,
  children,
  variant = 'outline',
  disabled = false,
}: {
  icon: React.ElementType
  children: React.ReactNode
  variant?: 'outline' | 'default'
  disabled?: boolean
}) {
  return (
    <Button
      variant={variant}
      size="sm"
      disabled={disabled}
      className={cn(
        'h-9 rounded-lg px-3 text-sm',
        variant === 'default'
          ? 'bg-blue-600 text-white hover:bg-blue-700'
          : 'border-blue-300 text-blue-700 hover:border-[#043DFF] hover:bg-blue-100 hover:text-[#043DFF]'
      )}
    >
      <Icon className="mr-1 h-4 w-4" />
      {children}
    </Button>
  )
}

export default function SmeTeamReviews() {
  const [activeTab, setActiveTab] = useState<ReviewTab>('all')
  const [search, setSearch] = useState('')
  const [entityFilter, setEntityFilter] = useState<EntityFilter>('all')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [summaryExpanded, setSummaryExpanded] = useState(false)

  const filteredProjects = useMemo(() => {
    return smeReviews.filter((project) => {
      const matchesText =
        !search.trim() ||
        project.name.toLowerCase().includes(search.toLowerCase()) ||
        project.id.toLowerCase().includes(search.toLowerCase()) ||
        project.entity.toLowerCase().includes(search.toLowerCase())
      const matchesEntity = entityFilter === 'all' || project.entity === entityFilter
      const matchesStatus = matchesTab(project.status, activeTab, project.hasMismatch)
      return matchesText && matchesEntity && matchesStatus
    })
  }, [activeTab, entityFilter, search])

  const allVisibleSelected = filteredProjects.length > 0 && filteredProjects.every((project) => selectedIds.includes(project.id))

  const toggleProject = (id: string) => {
    setSelectedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]))
  }

  const toggleAllVisible = () => {
    if (allVisibleSelected) {
      setSelectedIds((current) => current.filter((id) => !filteredProjects.some((project) => project.id === id)))
      return
    }
    const visibleIds = filteredProjects.map((project) => project.id)
    setSelectedIds((current) => Array.from(new Set([...current, ...visibleIds])))
  }

  return (
    <StrategyPageShell
      eyebrow="ICT - SME Team"
      title="Reviews"
      description="Review assigned DGE projects, raise clarifications, check AI guidance, and route completed recommendations back into strategy quality check."
    >
      <div className="space-y-5">
        <section
          title="AI scans assigned SME reviews for backlog pressure, clarification blockers, quality confidence, and strategic mismatch signals."
          className="overflow-hidden rounded-[28px] border border-[#E9D5FF] bg-white dark:border-white/10 dark:bg-[#1E293B]"
        >
          <button
            type="button"
            onClick={() => setSummaryExpanded((value) => !value)}
            className="flex w-full items-start justify-between gap-4 bg-gradient-to-b from-[#FDF7FF] to-white px-6 py-5 text-left transition-colors hover:bg-white/30 dark:from-[#2A123D] dark:to-[#1E293B] dark:hover:bg-white/5"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#A855F7] text-white shadow-[0_16px_30px_rgba(168,85,247,0.24)]">
                <Sparkles className="h-6 w-6" aria-hidden="true" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-bold text-[#0F172A] dark:text-white">AI Review Summary</h2>
                  <span className="inline-flex items-center rounded-full bg-[#FDF8FF] px-2.5 py-1 text-xs font-semibold text-[#A855F7] dark:bg-[#A855F7]/15 dark:text-[#E9D5FF]">
                    Action Required
                  </span>
                </div>
                <p className="mt-1 text-sm text-[#475569] dark:text-slate-100">
                  38 projects are currently assigned to the SME team. 14 still need review, 4 are blocked by clarification, 3 show strategic mismatch risk, and 2 are trending toward deadline pressure if left untouched.
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-4">
              <div className="hidden items-center gap-4 text-sm md:flex">
                <span className="text-[#0F172A] dark:text-white">38 <span className="text-[#64748B] dark:text-slate-100">projects</span></span>
                <span className="text-[#A855F7] dark:text-[#E9D5FF]">3 <span className="text-[#64748B] dark:text-slate-100">priority mismatches</span></span>
                <span className="text-[#C084FC] dark:text-[#E9D5FF]">4 <span className="text-[#64748B] dark:text-slate-100">clarification blockers</span></span>
                <Info className="h-4 w-4 text-[#64748B] dark:text-slate-100" aria-hidden="true" />
              </div>
              <ChevronDown className={cn('h-5 w-5 text-[#64748B] transition-transform dark:text-slate-100', summaryExpanded && 'rotate-180')} aria-hidden="true" />
            </div>
          </button>
          {summaryExpanded && (
            <div className="space-y-4 border-t border-[#E9D5FF] px-6 pb-6 pt-5 dark:border-white/10">
              <div className="grid gap-4 xl:grid-cols-3">
                <div className="rounded-[22px] border border-[#EAF0F6] bg-white p-4 dark:border-white/10 dark:bg-white/5">
                  <div className="flex items-center gap-2">
                    <MessageSquareDot className="h-4 w-4 text-[#A855F7] dark:text-[#E9D5FF]" />
                    <p className="text-sm font-semibold text-[#0F172A] dark:text-white">Clarification Pressure</p>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[#475569] dark:text-slate-300">4 active clarification threads are pausing closure, with the strongest pressure in cloud, AI, and cross-entity platform submissions.</p>
                </div>
                <div className="rounded-[22px] border border-[#EAF0F6] bg-white p-4 dark:border-white/10 dark:bg-white/5">
                  <div className="flex items-center gap-2">
                    <Scale className="h-4 w-4 text-[#286CFF] dark:text-[#BFDBFE]" />
                    <p className="text-sm font-semibold text-[#0F172A] dark:text-white">Strategy Change Requests</p>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[#475569] dark:text-slate-300">3 projects likely need Strategy Team intervention because their current strategic priority or classification appears misaligned.</p>
                </div>
                <div className="rounded-[22px] border border-[#EAF0F6] bg-white p-4 dark:border-white/10 dark:bg-white/5">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-[#D97706] dark:text-[#FCD34D]" />
                    <p className="text-sm font-semibold text-[#0F172A] dark:text-white">Deadline Risk</p>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[#475569] dark:text-slate-300">2 projects are likely to miss the expected SME turnaround window unless they move to quality check this week.</p>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  'Review the 3 likely misclassified projects before routing them deeper into SME review.',
                  'Push clarification closures for the 4 blocked projects before they affect quality check throughput.',
                  'Move high-confidence reviews to quality check faster to free capacity for backlog items.',
                  'Escalate missing-document items early so they do not consume SME turnaround time.',
                ].map((action) => (
                  <div key={action} className="flex items-start gap-2.5">
                    <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#A855F7] dark:text-[#E9D5FF]" aria-hidden="true" />
                    <span className="text-sm leading-6 text-[#475569] dark:text-slate-200">{action}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        <div className="rounded-2xl border border-[#DDEBFF] bg-white p-3 dark:border-white/10 dark:bg-[#1E293B]">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
            <div className="flex flex-wrap gap-2">
              {reviewsTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                    activeTab === tab.id
                      ? 'bg-[var(--primary)] text-white'
                      : 'border border-[#E2E8F0] bg-white text-[#0F172A] hover:bg-[#F1F5F9] dark:border-white/10 dark:bg-[#1E293B] dark:text-white dark:hover:bg-white/5'
                  )}
                >
                  {tab.label}
                  <span
                    className={cn(
                      'rounded-full px-1.5 py-0.5 text-xs font-bold',
                      activeTab === tab.id ? 'bg-white/20' : 'bg-[#F1F5F9] dark:bg-white/10'
                    )}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            <div className="flex flex-1 flex-col gap-2 lg:flex-row xl:justify-end">
              <div className="relative min-w-0 flex-1 xl:max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by project name, ID, or entity"
                  className="h-10 w-full rounded-xl border border-[#DDEBFF] bg-white pl-9 pr-4 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#286CFF]/15 dark:border-white/10 dark:bg-[#0F172A]/30 dark:text-white"
                />
              </div>
              <Select value={entityFilter} onValueChange={(value) => setEntityFilter(value as EntityFilter)}>
                <SelectTrigger className="h-10 rounded-xl border-[#DDEBFF] lg:w-[240px]">
                  <span className="inline-flex w-full items-center gap-2 whitespace-nowrap">
                    <ListFilter className="h-4 w-4 text-[#64748B]" />
                    <SelectValue placeholder="All Entities" />
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Entities</SelectItem>
                  <SelectItem value="Abu Dhabi Digital Authority">Abu Dhabi Digital Authority</SelectItem>
                  <SelectItem value="Department of Municipalities">Department of Municipalities</SelectItem>
                  <SelectItem value="Abu Dhabi Housing Authority">Abu Dhabi Housing Authority</SelectItem>
                  <SelectItem value="Department of Health">Department of Health</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[#DDEBFF] bg-white p-3 dark:border-white/10 dark:bg-[#1E293B]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={toggleAllVisible}
              className={cn(
                'inline-flex h-7 w-7 items-center justify-center rounded-full border transition-all',
                allVisibleSelected
                  ? 'border-transparent bg-[#286CFF] text-white'
                  : 'border-[#BFD8FF] bg-white text-transparent hover:border-[#286CFF] hover:bg-[#E7F5FF] dark:border-white/10 dark:bg-white/5'
              )}
            >
              <CheckCircle2 className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                {selectedIds.length} projects selected
              </span>
            </div>
            <div className="flex flex-wrap gap-2 sm:ml-auto">
              <QueueActionButton icon={Scale} disabled={selectedIds.length === 0}>
                Request Classification Change ({selectedIds.length})
              </QueueActionButton>
              <QueueActionButton icon={MessageSquareDot} disabled={selectedIds.length === 0}>
                Raise Clarification ({selectedIds.length})
              </QueueActionButton>
              <QueueActionButton icon={Send} variant="default" disabled={selectedIds.length === 0}>
                Send to Quality Check ({selectedIds.length})
              </QueueActionButton>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {filteredProjects.map((project) => (
            <article
              key={project.id}
              className={cn(
                'overflow-hidden rounded-2xl border bg-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(15,23,42,0.08)] dark:bg-[#1E293B]',
                selectedIds.includes(project.id) ? 'border-[#286CFF] ring-2 ring-[#286CFF]/10' : 'border-[#DDEBFF] dark:border-white/10'
              )}
            >
              <div className="p-4 sm:p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex min-w-0 flex-1 gap-3">
                    <button
                      type="button"
                      onClick={() => toggleProject(project.id)}
                      className={cn(
                        'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-all',
                        selectedIds.includes(project.id)
                          ? 'border-transparent bg-[#286CFF] text-white'
                          : 'border-[#BFD8FF] bg-white text-transparent hover:border-[#286CFF] hover:bg-[#E7F5FF] dark:border-white/10 dark:bg-white/5'
                      )}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs text-[#94A3B8]">{project.id}</span>
                        <span className="inline-flex items-center rounded-full bg-[#EEF5FF] px-2.5 py-1 text-xs font-medium text-[#286CFF] dark:bg-[#286CFF]/15 dark:text-[#BFDBFE]">
                          {project.status}
                        </span>
                        <span className={cn('inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold', getRiskBadge(project.risk))}>
                          {project.risk} Risk
                        </span>
                        {project.hasMismatch && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#FFF8E8] px-2.5 py-1 text-xs font-semibold text-[#B45309] dark:bg-[#3A2810] dark:text-[#FCD34D]">
                            <Scale className="h-3 w-3" />
                            Priority mismatch
                          </span>
                        )}
                        {project.missingDocs && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#FEF2F2] px-2.5 py-1 text-xs font-semibold text-[#DC2626] dark:bg-[#DC2626]/12 dark:text-[#FCA5A5]">
                            <FileWarning className="h-3 w-3" />
                            Missing docs
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-bold text-[#0F172A] dark:text-white">{project.name}</h3>
                      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#475569] dark:text-slate-200">
                        <span>{project.entity}</span>
                        <span>/</span>
                        <span>{project.strategicPriority}</span>
                        <span>/</span>
                        <span>{project.classification}</span>
                        <span>/</span>
                        <span>{project.team}</span>
                        <span>/</span>
                        <span>{project.submittedDate}</span>
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 rounded-xl border border-[#DDEBFF] bg-[#F8FBFF] px-4 py-3 text-left lg:text-end dark:border-white/10 dark:bg-white/5">
                    <div className="mb-1 flex items-center justify-between gap-3 lg:justify-end">
                      <p className="text-xs font-semibold text-[#286CFF]">Requested Budget</p>
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#E7F0FF] text-[#286CFF]">
                        <Sparkles className="h-3.5 w-3.5" />
                      </div>
                    </div>
                    <CurrencyAmount amount={project.requestedBudget} className="text-xl font-bold text-[#0F172A] dark:text-white" iconSize={16} />
                  </div>
                </div>

                <div className="mt-4 grid gap-3 lg:grid-cols-[0.95fr_1.05fr]">
                  <div className="rounded-2xl border border-[#DDEBFF] bg-[#F8FBFF] p-4 dark:border-white/10 dark:bg-white/5">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="h-4 w-4 text-[#286CFF]" />
                      <p className="text-sm font-semibold text-[#0F172A] dark:text-white">SME Review Context</p>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-[#475569] dark:text-slate-300">
                      {project.clarificationState === 'None'
                        ? 'Review recommendation is ready to progress once SME confirms evidence sufficiency, budget reasonability, and strategic fit.'
                        : project.clarificationState}
                    </p>
                  </div>

                  <div className="overflow-hidden rounded-2xl border border-[#E9D5FF] bg-white dark:border-white/10 dark:bg-[#1E293B]">
                    <div className="flex items-center gap-3 bg-gradient-to-b from-[#FDF7FF] to-white px-4 py-3 dark:from-[#2A123D] dark:to-[#1E293B]">
                      <Sparkles className="h-4 w-4 shrink-0 text-[#A855F7] dark:text-[#E9D5FF]" />
                      <span className="text-sm font-semibold text-[#0F172A] dark:text-white">AI Review Insight</span>
                      <span className="rounded-full border border-[#E9D5FF] bg-white px-2.5 py-1 text-xs font-medium text-[#64748B] dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
                        {project.confidence}% confidence
                      </span>
                    </div>
                    <div className="border-t border-[#E9D5FF] bg-white px-4 py-4 dark:border-white/10 dark:bg-[#1E293B]">
                      <p className="text-sm leading-6 text-[#475569] dark:text-slate-300">{project.aiInsight}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-2 border-t border-[#EAF0F6] pt-4 dark:border-white/10 sm:flex-row sm:justify-end">
                  <QueueActionButton icon={MessageSquareDot}>Raise Clarification</QueueActionButton>
                  <QueueActionButton icon={Scale}>Request Classification Change</QueueActionButton>
                  <Button variant="outline" size="sm" className="h-9 rounded-lg px-3" asChild>
                    <Link to="/sme-team/reviews">
                      <Eye className="mr-1 h-4 w-4" />
                      View Details
                    </Link>
                  </Button>
                  <QueueActionButton icon={ArrowRight} variant="default">
                    Route to Quality Check
                  </QueueActionButton>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </StrategyPageShell>
  )
}
