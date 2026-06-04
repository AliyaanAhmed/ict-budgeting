import { useMemo, useState } from 'react'
import { ChevronDown, ChevronUp, Filter, ShieldCheck, Sparkles, TriangleAlert, Workflow } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { StrategyAiPanel, StrategyPageShell, StrategyPill, StrategyProgressBar } from './StrategyTeamShell'
import { qualityCheckItems } from './strategyTeamData'

const tabs = ['All', 'Recommended', 'Not Recommended', 'Clarification Pending'] as const

export default function QualityCheck() {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>('All')
  const [sortMode, setSortMode] = useState<'confidence' | 'name'>('confidence')
  const [openItem, setOpenItem] = useState<string>('QC-001')

  const filteredItems = useMemo(() => {
    const items =
      activeTab === 'Recommended'
        ? qualityCheckItems.filter((item) => item.severity === 'Info')
        : activeTab === 'Not Recommended'
          ? qualityCheckItems.filter((item) => item.severity === 'Critical')
          : activeTab === 'Clarification Pending'
            ? qualityCheckItems.filter((item) => item.statuscode.includes('Awaiting'))
            : qualityCheckItems

    return [...items].sort((left, right) => {
      if (sortMode === 'name') return left.name.localeCompare(right.name)
      return right.confidence - left.confidence
    })
  }, [activeTab, sortMode])

  return (
    <StrategyPageShell
      eyebrow="ICT - Strategy Team"
      title="Quality Check"
      description="Validate strategic quality before the portfolio advances. The view highlights confidence, evidence strength, and what needs closer governance review."
    >
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Awaiting Qc', value: 4, accent: '#286CFF', icon: <ShieldCheck className="h-4.5 w-4.5" /> },
          { label: 'Routed To Director', value: 0, accent: '#14B8A6', icon: <Workflow className="h-4.5 w-4.5" /> },
          { label: 'Clarification Pending', value: 1, accent: '#F97316', icon: <TriangleAlert className="h-4.5 w-4.5" /> },
          { label: 'Average Confidence', value: '75%', accent: '#286CFF', icon: <Sparkles className="h-4.5 w-4.5" /> },
        ].map((metric) => (
          <div key={metric.label} className="overflow-hidden rounded-[20px] border border-[#DCE6F6] bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#18263F] sm:p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-[#0F172A] dark:text-white">{metric.label}</p>
                <p className="mt-3 text-3xl font-bold text-[#0F172A] dark:text-white">{metric.value}</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-full" style={{ backgroundColor: `${metric.accent}14`, color: metric.accent }}>
                {metric.icon}
              </div>
            </div>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.12fr)_minmax(320px,0.88fr)]">
        <Card className="overflow-hidden rounded-[22px] border-[#D9E6F5] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#162339]">
          <CardContent className="p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 rounded-full border border-[#D7E4F4] bg-white px-3 py-2 text-sm font-semibold text-[#286CFF] dark:border-white/10 dark:bg-white/5 dark:text-[#BFDBFE]">
                  <Filter className="h-4 w-4" />
                  Filter
                </div>
                <div className="flex flex-wrap gap-2">
                  {tabs.map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveTab(tab)}
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                        activeTab === tab
                          ? 'bg-[#286CFF] text-white'
                          : 'bg-[#F8FBFF] text-[#475569] hover:bg-[#EEF5FF] hover:text-[#286CFF]'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Select value={sortMode} onValueChange={(value) => setSortMode(value as 'confidence' | 'name')}>
                  <SelectTrigger className="h-11 rounded-2xl border-[#D7E4F4] bg-white dark:border-white/10 dark:bg-white/5">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="confidence">Confidence</SelectItem>
                    <SelectItem value="name">Project name</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-5 rounded-[22px] border border-[#E9D5FF] bg-[#FDF8FF] p-4 shadow-[0_12px_30px_rgba(168,85,247,0.06)] dark:border-white/10 dark:bg-[#2A123D]">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4.5 w-4.5 text-[#A855F7]" />
                <p className="font-semibold text-[#0F172A] dark:text-white">AI Quality Check Summary</p>
                <StrategyPill tone="violet">1 Low Confidence</StrategyPill>
              </div>
              <p className="mt-2 text-sm leading-6 text-[#64748B] dark:text-slate-300">
                1 project has low confidence and may need closer review, 2 items should be refined before QC approval, and 1 still requires clarification.
              </p>
            </div>

            <div className="mt-5 space-y-3">
              {filteredItems.map((item) => {
                const open = openItem === item.id
                return (
                  <Card key={item.id} className="overflow-hidden rounded-[20px] border-[#DCE6F6] bg-white shadow-[0_8px_20px_rgba(15,23,42,0.04)] dark:border-white/10 dark:bg-[#1B2A41]">
                    <CardContent className="p-0">
                      <button
                        type="button"
                        onClick={() => setOpenItem((current) => (current === item.id ? '' : item.id))}
                        className="flex w-full items-start justify-between gap-4 px-4 py-4 text-left transition-colors hover:bg-[#F8FBFF] dark:hover:bg-white/5"
                      >
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-[#0F172A] dark:text-white">
                              {item.id} {item.name}
                            </p>
                            <StrategyPill tone={item.severity === 'Critical' ? 'amber' : item.severity === 'Warning' ? 'blue' : 'teal'}>
                              {item.severity}
                            </StrategyPill>
                          </div>
                          <p className="mt-1 text-xs text-[#64748B] dark:text-slate-300">
                            {item.entity} · {item.classification} · {item.priority}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-lg font-bold text-[#0F172A] dark:text-white">{item.confidence}%</p>
                            <p className="text-xs text-[#64748B] dark:text-slate-300">Confidence</p>
                          </div>
                          {open ? <ChevronUp className="h-5 w-5 text-[#64748B]" /> : <ChevronDown className="h-5 w-5 text-[#64748B]" />}
                        </div>
                      </button>

                      <div className="px-4 pb-4">
                        <StrategyProgressBar value={item.confidence} accent={item.severity === 'Critical' ? '#F97316' : item.severity === 'Warning' ? '#286CFF' : '#14B8A6'} />

                        {open && (
                          <div className="mt-4 grid gap-4 lg:grid-cols-3">
                            <div className="rounded-[20px] border border-[#EAF0F6] bg-[#F8FBFF] p-4 dark:border-white/10 dark:bg-white/5">
                              <p className="text-xs font-semibold text-[#64748B] dark:text-slate-300">SME Recommendation</p>
                              <p className="mt-2 text-sm leading-6 text-[#0F172A] dark:text-white">{item.qaOutcome}</p>
                            </div>
                            <div className="rounded-[20px] border border-[#EAF0F6] bg-[#F8FBFF] p-4 dark:border-white/10 dark:bg-white/5">
                              <p className="text-xs font-semibold text-[#64748B] dark:text-slate-300">AI Quality Insight</p>
                              <p className="mt-2 text-sm leading-6 text-[#0F172A] dark:text-white">{item.adjustment}</p>
                            </div>
                            <div className="rounded-[20px] border border-[#EAF0F6] bg-[#F8FBFF] p-4 dark:border-white/10 dark:bg-white/5">
                              <p className="text-xs font-semibold text-[#64748B] dark:text-slate-300">Governance Next Step</p>
                              <p className="mt-2 text-sm leading-6 text-[#0F172A] dark:text-white">
                                Hold or route to the strategy director if policy context remains incomplete.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <StrategyAiPanel title="AI Qc Navigator">
          <div className="space-y-3">
            <div className="rounded-[20px] border border-[#E9D5FF] bg-white p-4 dark:border-white/10 dark:bg-white/5">
              <p className="text-sm font-semibold text-[#0F172A] dark:text-white">Qc Focus</p>
              <p className="mt-1 text-sm leading-6 text-[#64748B] dark:text-slate-300">
                The AI hub submission is the top QC candidate because it needs both strategic and policy confirmation.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-[20px] border border-[#E9D5FF] bg-[#FDF8FF] p-4 dark:border-white/10 dark:bg-white/5">
                <p className="text-xs font-semibold text-[#64748B] dark:text-slate-300">Pass Ready</p>
                <p className="mt-2 text-2xl font-bold text-[#0F172A] dark:text-white">3</p>
              </div>
              <div className="rounded-[20px] border border-[#E9D5FF] bg-[#FDF8FF] p-4 dark:border-white/10 dark:bg-white/5">
                <p className="text-xs font-semibold text-[#64748B] dark:text-slate-300">Needs Hold</p>
                <p className="mt-2 text-2xl font-bold text-[#0F172A] dark:text-white">1</p>
              </div>
            </div>
            <div className="rounded-[20px] border border-dashed border-[#E9D5FF] bg-white p-4 dark:border-white/10 dark:bg-white/5">
              <p className="text-sm font-semibold text-[#0F172A] dark:text-white">Expected Follow-up</p>
              <p className="mt-2 text-sm leading-6 text-[#64748B] dark:text-slate-300">
                If confidence remains below threshold, route to the Strategy Director with a compact explanation of the gap.
              </p>
            </div>
          </div>
        </StrategyAiPanel>
      </section>
    </StrategyPageShell>
  )
}
