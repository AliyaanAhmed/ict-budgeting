import { useMemo, useState } from 'react'
import {
  ArrowRight,
  Building2,
  ChevronDown,
  CircleAlert,
  Filter,
  Layers,
  Sparkles,
  Workflow,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { StrategyPageShell, StrategyPill, StrategyProgressBar } from './StrategyTeamShell'
import { strategyProjects } from './strategyTeamData'

const priorityOptions = ['All', 'Artificial Intelligence', 'Digital Infrastructure', 'Digital Security', 'Data & Analytics', 'Digital Experience'] as const
const statusOptions = ['All', 'Strategic Alignment Review', 'Awaiting SME Review', 'Under Strategy Review', 'Under SME Review', 'QC Needed'] as const
const entityOptions = ['All', ...new Set(strategyProjects.map((project) => project.entity))] as const
const classificationOptions: Record<string, string[]> = {
  'Artificial Intelligence': ['Use Case Development', 'AI Adoption / Expansion', 'AI Governance'],
  'Digital Infrastructure': ['Cloud & Hosting', 'Networks & Connectivity', 'Shared Services'],
  'Digital Security': ['Security & Compliance', 'Identity & Access', 'Threat Monitoring'],
  'Data & Analytics': ['Integration Enablement', 'BI & Reporting', 'Data Governance'],
  'Digital Experience': ['Service Design', 'Journey Redesign', 'Front Door Experience'],
}

function AssistantSummary() {
  const [open, setOpen] = useState(false)

  const sections = [
    {
      title: 'Priority Mismatch',
      icon: CircleAlert,
      items: [
        '18 projects likely mapped to wrong strategic priority',
        'DoH has highest cluster: 5 projects',
        'Cybersecurity most common correct priority',
      ],
    },
    {
      title: 'Classification Issues',
      icon: Layers,
      items: [
        '12 projects have weak or broad classification',
        '"Platform Modernization" used too broadly in 4 cases',
        '5 "Enterprise Systems" likely should be "Core Systems"',
      ],
    },
    {
      title: 'Routing Impact',
      icon: Workflow,
      items: [
        '6 projects likely routed to wrong SME team',
        '4 Security projects incorrectly going to Infrastructure Team',
        '2 Data & AI projects misrouted to Innovation Team',
      ],
    },
    {
      title: 'Clarification Likelihood',
      icon: Sparkles,
      items: [
        '9 projects likely need clarification before SME review',
        '3 have weak descriptions, 4 have unclear scope',
        '2 have insufficient supporting evidence',
      ],
    },
    {
      title: 'Entity Patterns',
      icon: Building2,
      items: [
        '5 entities repeatedly select incorrect priorities',
        'ADP and ADDA have highest mismatch rates',
      ],
    },
    {
      title: 'Recommended Actions',
      icon: ArrowRight,
      items: [
        'Open mismatch cases from DoH',
        'Bulk review 5 Cybersecurity reclassifications',
        'Review wrong-routing projects before sending to SME',
      ],
    },
  ] as const

  return (
    <section className="overflow-hidden rounded-[28px] border border-[#E9D5FF] bg-white dark:border-white/10 dark:bg-[#1E293B]">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-start justify-between gap-4 bg-gradient-to-b from-[#FDF7FF] to-white px-6 py-5 text-left transition-colors hover:bg-white/30 dark:from-[#2A123D] dark:to-[#1E293B] dark:hover:bg-white/5"
      >
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#A855F7] text-white shadow-[0_12px_24px_rgba(168,85,247,0.24)]">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-[16px] font-semibold text-[#0F172A] dark:text-white">AI Strategic Alignment Assistant</h2>
              <span className="rounded-full bg-[#FDF8FF] px-2.5 py-1 text-[11px] font-semibold text-[#A855F7] dark:bg-[#A855F7]/15 dark:text-[#E9D5FF]">
                Action Required
              </span>
            </div>
            <p className="mt-1 text-sm text-[#475569] dark:text-slate-300">
              You have high-signal projects that need priority correction, classification cleanup, and routing alignment.
            </p>
          </div>
        </div>
        <ChevronDown className={cn('mt-1 h-4 w-4 text-[#94A3B8] transition-transform dark:text-slate-400', open && 'rotate-180')} />
      </button>

      {open ? (
        <div className="border-t border-[#E9D5FF] px-6 py-5 dark:border-white/10">
          <div className="grid gap-5 lg:grid-cols-2">
            {sections.map((section) => {
              const Icon = section.icon
              return (
                <div key={section.title} className="rounded-[18px] border border-[#EAF0F6] bg-[#F8FBFF] p-4 dark:border-white/10 dark:bg-white/5">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F5EEFF] text-[#A855F7] dark:bg-[#A855F7]/15 dark:text-[#E9D5FF]">
                      <Icon className="h-4 w-4" />
                    </div>
                    <p className="text-sm font-semibold text-[#0F172A] dark:text-white">{section.title}</p>
                  </div>
                  <ul className="mt-3 space-y-2 text-sm leading-6 text-[#64748B] dark:text-slate-300">
                    {section.items.map((item) => (
                      <li key={item} className="flex gap-2">
                        <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#A855F7]" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {[
              'Open Priority Mismatch Cases',
              'Open Wrong Classification Cases',
              'Open Wrong SME Routing Cases',
              'Open Clarification-Likely Cases',
              'Apply AI Suggested Updates',
            ].map((action) => (
              <button
                key={action}
                type="button"
                className="inline-flex items-center gap-2 rounded-2xl border border-[#E9D5FF] bg-white px-4 py-2 text-sm font-semibold text-[#A855F7] transition-colors hover:bg-[#FDF8FF] dark:border-white/10 dark:bg-white/5 dark:text-[#E9D5FF]"
              >
                <ArrowRight className="h-4 w-4" />
                {action}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  )
}

export default function StrategicAlignment() {
  const [search, setSearch] = useState('')
  const [priorityFilter, setPriorityFilter] = useState<(typeof priorityOptions)[number]>('All')
  const [statusFilter, setStatusFilter] = useState<(typeof statusOptions)[number]>('All')
  const [entityFilter, setEntityFilter] = useState<(typeof entityOptions)[number]>('All')
  const [selectedIds, setSelectedIds] = useState<string[]>(['ST-001', 'ST-003'])
  const [modalOpen, setModalOpen] = useState(false)
  const [priorityDraft, setPriorityDraft] = useState<Record<string, { priority: string; classification: string }>>({})

  const priorityCounts = useMemo(
    () =>
      priorityOptions.map((priority) => ({
        label: priority,
        count:
          priority === 'All'
            ? strategyProjects.length
            : strategyProjects.filter((project) => project.strategicPriority === priority).length,
      })),
    []
  )

  const filteredProjects = useMemo(() => {
    return strategyProjects.filter((project) => {
      const matchesSearch =
        !search ||
        [project.id, project.name, project.entity, project.strategicPriority, project.classification, project.smeTeam]
          .join(' ')
          .toLowerCase()
          .includes(search.toLowerCase())
      const matchesPriority = priorityFilter === 'All' || project.strategicPriority === priorityFilter
      const matchesStatus = statusFilter === 'All' || project.statuscode === statusFilter
      const matchesEntity = entityFilter === 'All' || project.entity === entityFilter
      return matchesSearch && matchesPriority && matchesStatus && matchesEntity
    })
  }, [entityFilter, priorityFilter, search, statusFilter])

  const selectedProjects = strategyProjects.filter((project) => selectedIds.includes(project.id))

  const toggleSelected = (id: string) => {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id]
    )
  }

  const updateDraft = (projectId: string, field: 'priority' | 'classification', value: string) => {
    setPriorityDraft((current) => {
      const baseProject = strategyProjects.find((item) => item.id === projectId)
      return {
        ...current,
        [projectId]: {
          priority: current[projectId]?.priority ?? baseProject?.strategicPriority ?? 'Artificial Intelligence',
          classification: current[projectId]?.classification ?? baseProject?.classification ?? '',
          [field]: value,
        },
      }
    })
  }

  return (
    <StrategyPageShell
      eyebrow="ICT - Strategy Team"
      title="Strategic Alignment"
      description="Review submitted projects against strategic priorities. Identify misalignment, duplicates, and projects requiring follow-up."
    >
      <section className="space-y-5">
        <AssistantSummary />
      </section>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="space-y-4">
          <Card className="overflow-hidden rounded-[22px] border-[#D9E6F5] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#162339]">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-[#286CFF]" />
                <p className="text-sm font-semibold text-[#0F172A] dark:text-white">Filters</p>
              </div>

              <div className="mt-4 space-y-4">
                <div className="w-full rounded-[12px] border border-[#D7E4F4] bg-[#F8FBFF] px-3 dark:border-white/10 dark:bg-white/5">
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search project, entity, priority, classification, or SME team"
                    className="h-10 w-full border-0 bg-transparent px-0 text-[#0F172A] shadow-none placeholder:text-[#94A3B8] focus-visible:ring-0 dark:text-white"
                  />
                </div>

                <div>
                  <p className="mb-3 text-xs font-semibold tracking-[0.14em] text-[#64748B] dark:text-slate-300">
                    Strategic Priority
                  </p>
                  <div className="space-y-1.5">
                    {priorityCounts.map((option) => {
                      const active = priorityFilter === option.label
                      return (
                        <button
                          key={option.label}
                          type="button"
                          onClick={() => setPriorityFilter(option.label as (typeof priorityOptions)[number])}
                          className={cn(
                            'flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left transition-colors',
                            active
                              ? 'bg-[#286CFF] text-white shadow-[0_10px_22px_rgba(40,108,255,0.18)] dark:bg-[#286CFF] dark:text-white'
                              : 'bg-white text-[#0F172A] hover:bg-[#F8FBFF] dark:bg-white/5 dark:text-white dark:hover:bg-white/10'
                          )}
                        >
                          <span className="text-sm font-medium">{option.label === 'All' ? 'All Priorities' : option.label}</span>
                          <span
                            className={cn(
                              'text-sm',
                              active ? 'text-white/90' : 'text-[#64748B] dark:text-slate-300'
                            )}
                          >
                            {option.count}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-xs font-semibold tracking-[0.12em] text-[#64748B] dark:text-slate-300">Entity</p>
                  <Select value={entityFilter} onValueChange={(value) => setEntityFilter(value as (typeof entityOptions)[number])}>
                    <SelectTrigger className="h-11 rounded-[10px] border-[#D7E4F4] bg-white dark:border-white/10 dark:bg-white/5">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-[#286CFF]" />
                        <SelectValue placeholder="Entity" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All Entities</SelectItem>
                      {entityOptions.filter((option) => option !== 'All').map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <p className="mb-2 text-xs font-semibold tracking-[0.12em] text-[#64748B] dark:text-slate-300">Status</p>
                  <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as (typeof statusOptions)[number])}>
                    <SelectTrigger className="h-11 rounded-[10px] border-[#D7E4F4] bg-white dark:border-white/10 dark:bg-white/5">
                      <div className="flex items-center gap-2">
                        <Workflow className="h-4 w-4 text-[#286CFF]" />
                        <SelectValue placeholder="Status" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All Statuses</SelectItem>
                      {statusOptions.filter((option) => option !== 'All').map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </aside>

        <section className="space-y-5">
          <Card className="h-full overflow-hidden rounded-[22px] border-[#D9E6F5] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#162339]">
            <CardContent className="p-5">
              <div className="flex flex-col gap-3 border-b border-[#EEF3F8] pb-4 dark:border-white/10 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-2">
                  <div className="inline-flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-[#286CFF]" aria-hidden="true">
                      <path d="M21 10.656V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h12.344" />
                      <path d="m9 11 3 3L22 4" />
                    </svg>
                    <span className="text-sm font-medium text-[#286CFF] dark:text-[#93C5FD]">
                      {selectedProjects.length} projects selected
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-blue-300 bg-white px-3 text-sm font-medium text-blue-700 transition-colors duration-150 hover:border-[#043DFF] hover:bg-blue-100 hover:text-[#043DFF] active:bg-[#D3EDFF] disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-transparent dark:text-white dark:hover:bg-white/5"
                    disabled={selectedProjects.length === 0}
                    onClick={() => setModalOpen(true)}
                  >
                    <Layers className="mr-1 h-4 w-4" />
                    Update Classification
                  </Button>
                  <Button
                    type="button"
                    className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-transparent bg-blue-600 px-3 text-sm font-medium text-white transition-colors duration-150 hover:bg-blue-700 active:bg-[#003CFF] disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={selectedProjects.length === 0}
                  >
                    <Workflow className="mr-1 h-4 w-4" />
                    Send to SME
                  </Button>
                </div>
              </div>

              <div className="mt-5 overflow-hidden rounded-[12px] border border-[#DCE6F6] bg-white dark:border-white/10 dark:bg-[#1B2A41]">
                <div className="grid grid-cols-[40px_1.3fr_1fr_1fr_1fr_1.2fr_120px] gap-3 border-b border-[#EEF3F8] px-4 py-3 text-sm font-semibold text-[#0F172A] dark:border-white/10 dark:text-white">
                  <span />
                  <span className="text-left">Project Name</span>
                  <span className="text-left">Strategic Priority</span>
                  <span>Classification</span>
                  <span className="text-left">Status</span>
                  <span>SME Team</span>
                  <span className="text-left">Budget</span>
                </div>
                <div className="divide-y divide-[#EEF3F8] dark:divide-white/10">
                  {filteredProjects.map((project) => {
                    const selected = selectedIds.includes(project.id)
                    return (
                      <div key={project.id} className="grid grid-cols-[40px_1.3fr_1fr_1fr_1fr_1.2fr_120px] gap-3 px-4 py-4 hover:bg-[#F8FBFF] dark:hover:bg-white/5">
                        <div className="pt-1">
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => toggleSelected(project.id)}
                            className="h-4 w-4 rounded border-[#D7E4F4] text-[#286CFF] focus:ring-[#286CFF]"
                          />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[#0F172A] dark:text-white">{project.name}</p>
                          <p className="mt-1 text-xs text-[#64748B] dark:text-slate-300">
                            {project.id} · {project.entity}
                          </p>
                        </div>
                        <div className="pt-1 text-sm text-[#475569] dark:text-slate-300">{project.strategicPriority}</div>
                        <div className="pt-1 text-sm text-[#475569] dark:text-slate-300">{project.classification}</div>
                        <div className="pt-1 text-sm text-[#475569] dark:text-slate-300">{project.statuscode}</div>
                        <div className="pt-1 text-sm text-[#475569] dark:text-slate-300">{project.smeTeam}</div>
                        <div className="pt-1">
                          <div className="mb-2 flex items-center justify-between text-xs text-[#64748B] dark:text-slate-300">
                            <span>{project.budget.toLocaleString('en-AE')} AED</span>
                            <span>{project.progress}%</span>
                          </div>
                          <StrategyProgressBar
                            value={project.progress}
                            accent={project.risk === 'High' ? '#A855F7' : project.risk === 'Medium' ? '#286CFF' : '#14B8A6'}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-4xl overflow-hidden p-0">
          <div className="border-b border-[#EEF3F8] px-6 py-5 dark:border-white/10">
            <DialogHeader className="space-y-1">
              <DialogTitle>Change Strategic Priority And Classification</DialogTitle>
              <DialogDescription>
                Assign both fields together for the currently selected projects. Classification options will follow the strategic priority family you choose.
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="px-6 py-5">
            <div className="max-h-[58vh] space-y-3 overflow-y-auto pr-1">
              {selectedIds.map((projectId) => {
                const project = strategyProjects.find((item) => item.id === projectId)
                if (!project) return null
                const draftPriority = priorityDraft[project.id]?.priority ?? project.strategicPriority
                const availableClassifications = classificationOptions[draftPriority] ?? []
                return (
                  <div key={project.id} className="rounded-[20px] border border-[#DCE6F6] bg-[#F8FBFF] p-4 dark:border-white/10 dark:bg-white/5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-[#0F172A] dark:text-white">{project.name}</p>
                        <p className="mt-1 text-xs text-[#64748B] dark:text-slate-300">
                          {project.id} · {project.entity}
                        </p>
                      </div>
                      <StrategyPill tone="blue">{project.statuscode}</StrategyPill>
                    </div>

                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <div>
                        <p className="mb-2 text-sm font-semibold text-[#0F172A] dark:text-white">Strategic Priority</p>
                        <Select
                          value={draftPriority}
                          onValueChange={(value) => {
                            updateDraft(project.id, 'priority', value)
                            updateDraft(project.id, 'classification', '')
                          }}
                        >
                          <SelectTrigger className="h-11 rounded-[10px] border-[#D7E4F4] bg-white dark:border-white/10 dark:bg-white/5">
                            <div className="flex items-center gap-2">
                              <Layers className="h-4 w-4 text-[#286CFF]" />
                              <SelectValue placeholder="Select priority" />
                            </div>
                          </SelectTrigger>
                          <SelectContent>
                            {priorityOptions
                              .filter((option) => option !== 'All')
                              .map((option) => (
                                <SelectItem key={option} value={option}>
                                  {option}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <p className="mb-2 text-sm font-semibold text-[#0F172A] dark:text-white">Classification</p>
                        <Select
                          value={priorityDraft[project.id]?.classification || ''}
                          onValueChange={(value) => updateDraft(project.id, 'classification', value)}
                        >
                          <SelectTrigger className="h-11 rounded-[10px] border-[#D7E4F4] bg-white dark:border-white/10 dark:bg-white/5">
                            <div className="flex items-center gap-2">
                              <Workflow className="h-4 w-4 text-[#286CFF]" />
                              <SelectValue placeholder="Select classification" />
                            </div>
                          </SelectTrigger>
                          <SelectContent>
                            {availableClassifications.map((classification) => (
                              <SelectItem key={classification} value={classification}>
                                {classification}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          <DialogFooter className="border-t border-[#EEF3F8] px-6 pb-6 pt-4 dark:border-white/10">
            <Button variant="outline" className="rounded-2xl border-[#D7E4F4] text-[#286CFF]" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button className="rounded-2xl bg-[#286CFF] text-white hover:bg-[#0C65F5]" onClick={() => setModalOpen(false)}>
              Apply to Selected
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </StrategyPageShell>
  )
}
