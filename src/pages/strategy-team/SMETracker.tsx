import { useState } from 'react'
import { BrainCircuit, ChevronDown, ChevronUp, Sparkles, Users, Workflow } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { StrategyAiPanel, StrategyPageShell, StrategyPill, StrategyProgressBar } from './StrategyTeamShell'
import { smeTracks } from './strategyTeamData'

export default function SMETracker() {
  const [openPriority, setOpenPriority] = useState<string>('Artificial Intelligence')

  return (
    <StrategyPageShell
      eyebrow="ICT - Strategy Team"
      title="SME Tracker"
      description="Monitor SME review activity organized by strategic priority. Spot bottlenecks, workload concerns, and review momentum."
    >
      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            {[
              { label: 'Strategic Priorities', value: 8, sub: 'Active areas', tone: '#286CFF' },
              { label: 'SME Teams', value: 26, sub: 'Across all priorities', tone: '#14B8A6' },
              { label: 'Reviews Done', value: 742, sub: 'of 1,284', tone: '#286CFF' },
              { label: 'Avg Workload', value: '68%', sub: 'Team utilization', tone: '#F97316' },
            ].map((s) => (
              <div key={s.label} className="rounded-[22px] border border-[#D9E6F5] bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.05)] dark:border-white/10 dark:bg-[#162339]">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.tone }} />
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#64748B] dark:text-slate-300">{s.label}</p>
                </div>
                <p className="mt-3 text-2xl font-bold text-[#0F172A] dark:text-white">{s.value}</p>
                <p className="mt-1 text-xs text-[#64748B] dark:text-slate-300">{s.sub}</p>
              </div>
            ))}
          </div>

          <Card className="overflow-hidden rounded-[22px] border-[#D9E6F5] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#162339]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-[#286CFF]" />
                    <h2 className="text-xl font-bold text-[#0F172A] dark:text-white">Review Throughput By Strategic Priority</h2>
                  </div>
                  <p className="mt-1 text-sm text-[#64748B] dark:text-slate-300">Reviewed versus pending projects</p>
                </div>
                <StrategyPill tone="blue">Priority based</StrategyPill>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-3">
                {smeTracks.map((track) => {
                  const expanded = openPriority === track.priority
                  return (
                    <Card key={track.priority} className="overflow-hidden rounded-[22px] border-[#D9E6F5] bg-white shadow-[0_8px_20px_rgba(15,23,42,0.04)] dark:border-white/10 dark:bg-[#1B2A41]">
                      <CardContent className="p-0">
                        <button
                          type="button"
                          onClick={() => setOpenPriority((current) => (current === track.priority ? '' : track.priority))}
                          className="flex w-full items-start justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-[#F8FBFF] dark:hover:bg-white/5"
                        >
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EEF5FF] text-sm font-bold text-[#286CFF] dark:bg-[#286CFF]/15 dark:text-[#BFDBFE]">
                                {track.priority.split(' ')[0].slice(0, 3).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="text-lg font-bold text-[#0F172A] dark:text-white">{track.priority}</p>
                                <p className="text-xs text-[#64748B] dark:text-slate-300">{track.ownerTeam}</p>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <p className="text-sm font-semibold text-[#286CFF] dark:text-[#BFDBFE]">{track.averageConfidence}% Confidence</p>
                              <p className="text-xs text-[#64748B] dark:text-slate-300">{track.projects} Projects · {track.awaitingSME} Awaiting SME</p>
                            </div>
                            {expanded ? <ChevronUp className="h-5 w-5 text-[#64748B]" /> : <ChevronDown className="h-5 w-5 text-[#64748B]" />}
                          </div>
                        </button>

                        <div className="px-5 pb-5">
                          <StrategyProgressBar
                            value={track.averageConfidence}
                            accent={track.status === 'On Track' ? '#14B8A6' : track.status === 'Backlog' ? '#A855F7' : '#286CFF'}
                          />

                          <div className="mt-4 grid gap-3 sm:grid-cols-4">
                            {[
                              { label: 'Routed', value: track.routed },
                              { label: 'Completed', value: track.completed },
                              { label: 'Awaiting SME', value: track.awaitingSME },
                              { label: 'Projects', value: track.projects },
                            ].map((item) => (
                              <div key={item.label} className="rounded-[18px] border border-[#EAF0F6] bg-[#F8FBFF] p-3 dark:border-white/10 dark:bg-white/5">
                                <p className="text-[11px] font-semibold tracking-[0.12em] text-[#64748B] dark:text-slate-400">{item.label}</p>
                                <p className="mt-2 text-2xl font-bold text-[#0F172A] dark:text-white">{item.value}</p>
                              </div>
                            ))}
                          </div>

                          {expanded && (
                            <div className="mt-4 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
                            <div className="rounded-[20px] border border-[#E9D5FF] bg-white p-4 dark:border-white/10 dark:bg-[#1E293B]">
                              <div className="flex items-center gap-2">
                                  <Workflow className="h-4.5 w-4.5 text-[#A855F7]" />
                                  <p className="text-sm font-semibold text-[#0F172A] dark:text-white">Routing Health</p>
                                </div>
                                <p className="mt-2 text-sm leading-6 text-[#64748B] dark:text-slate-300">{track.nextAction}</p>
                                <div className="mt-4 grid grid-cols-2 gap-3">
                                  <div className="rounded-[18px] border border-[#E9D5FF] bg-white p-3 dark:border-white/10 dark:bg-[#1B2A41]">
                                    <p className="text-xs font-semibold tracking-[0.12em] text-[#64748B] dark:text-slate-400">Confidence</p>
                                    <p className="mt-2 text-xl font-bold text-[#0F172A] dark:text-white">{track.averageConfidence}%</p>
                                  </div>
                                  <div className="rounded-[18px] border border-[#E9D5FF] bg-white p-3 dark:border-white/10 dark:bg-[#1B2A41]">
                                    <p className="text-xs font-semibold tracking-[0.12em] text-[#64748B] dark:text-slate-400">Status</p>
                                    <p className="mt-2 text-xl font-bold text-[#0F172A] dark:text-white">{track.status}</p>
                                  </div>
                                </div>
                              </div>

                              <div className="rounded-[20px] border border-[#E9D5FF] bg-[#FDF8FF] p-4 dark:border-white/10 dark:bg-[#2A123D]">
                                <div className="flex items-center gap-2">
                                  <BrainCircuit className="h-4.5 w-4.5 text-[#A855F7]" />
                                  <p className="text-sm font-semibold text-[#0F172A] dark:text-white">AI Recommendations</p>
                                </div>
                                <div className="mt-3 space-y-3">
                                  {[
                                    'Use the strongest evidence to close the AI backlog first.',
                                    'Move low-risk digital experience items straight to QC.',
                                    'Keep security items under tighter scrutiny this cycle.',
                                  ].map((item, index) => (
                                    <div key={item} className="flex items-start gap-3 rounded-[18px] border border-[#E9D5FF] bg-white p-3 dark:border-white/10 dark:bg-[#1B2A41]">
                                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F5EEFF] text-xs font-bold text-[#A855F7] dark:bg-[#A855F7]/15 dark:text-[#E9D5FF]">
                                        {index + 1}
                                      </div>
                                      <p className="text-sm leading-6 text-[#475569] dark:text-slate-300">{item}</p>
                                    </div>
                                  ))}
                                </div>
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
        </div>

        <aside className="space-y-5">
          <StrategyAiPanel title="SME Operations Assistant">
            <div className="space-y-3">
              {[
                { title: 'Energy Transition is critical', detail: 'Only 31% reviewed with 95% workload. Reassign 12 projects to free capacity.', tag: 'Bottleneck' },
                { title: 'Education team overloaded', detail: '92% workload across 5 reviewers. Consider adding 1 reviewer or extending window.', tag: 'Workload' },
                { title: 'Mobility SME falling behind', detail: '47% completion vs cycle target of 65%. AI suggests batch review for low-budget items.', tag: 'Pace' },
                { title: 'Strong momentum in Health', detail: '84% reviewed, 0 risks. Use as model for Energy team realignment.', tag: 'Positive' },
              ].map((item) => (
                <div key={item.title} className="rounded-[18px] border border-[#DDEBFF] bg-white p-4 dark:border-white/10 dark:bg-[#1E293B]">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold text-[#0F172A] dark:text-white">{item.title}</p>
                    <StrategyPill tone="blue">{item.tag}</StrategyPill>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[#64748B] dark:text-slate-300">{item.detail}</p>
                </div>
              ))}
            </div>
          </StrategyAiPanel>

          <Card className="overflow-hidden rounded-[22px] border-[#D9E6F5] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#162339]">
            <CardContent className="p-4">
              <p className="text-sm font-semibold text-[#0F172A] dark:text-white">Review Outcomes</p>
              <p className="mt-1 text-sm text-[#64748B] dark:text-slate-300">Across SME decisions</p>
              <div className="mt-4 space-y-3 text-[12px]">
                {[
                  { label: 'Approve', val: 482, pct: 65, tone: '#14B8A6' },
                  { label: 'Revise', val: 178, pct: 24, tone: '#286CFF' },
                  { label: 'Reject', val: 52, pct: 7, tone: '#EF4444' },
                  { label: 'Hold', val: 30, pct: 4, tone: '#94A3B8' },
                ].map((o) => (
                  <div key={o.label}>
                    <div className="mb-1 flex items-center justify-between">
                      <span>{o.label}</span>
                      <span className="tabular-nums text-[#64748B] dark:text-slate-300">{o.val}</span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-[#EEF3F8] dark:bg-white/10">
                      <div className="h-full rounded-full" style={{ width: `${o.pct}%`, backgroundColor: o.tone }} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-[22px] border-[#D9E6F5] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#162339]">
            <CardContent className="p-4">
              <p className="text-sm font-semibold text-[#0F172A] dark:text-white">Team Activity</p>
              <p className="mt-1 text-sm text-[#64748B] dark:text-slate-300">Last 24 hours</p>
              <div className="mt-4 space-y-3">
                {[
                  { team: 'Digital Services SME', actions: 38 },
                  { team: 'Health Systems SME', actions: 32 },
                  { team: 'Finance SME', actions: 24 },
                  { team: 'Education SME', actions: 17 },
                ].map((t) => (
                  <div key={t.team} className="flex items-center gap-3">
                    <Sparkles className="h-3.5 w-3.5 text-[#286CFF]" />
                    <div className="min-w-0 flex-1 text-[12px] font-medium text-[#0F172A] dark:text-white">{t.team}</div>
                    <span className="text-[11px] tabular-nums text-[#64748B] dark:text-slate-300">{t.actions} actions</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </aside>
      </section>
    </StrategyPageShell>
  )
}
