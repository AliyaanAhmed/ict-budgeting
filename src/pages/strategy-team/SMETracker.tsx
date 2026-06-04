import { useState } from 'react'
import { ArrowRight, ChevronDown, ChevronUp, CircleCheckBig, Clock3, Sparkles, TriangleAlert, Users, Workflow } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { StrategyPageShell, StrategyPill, StrategyProgressBar } from './StrategyTeamShell'
import { smeTracks } from './strategyTeamData'

type FilterKey = 'Total SME Teams' | 'Teams On Track' | 'Teams Behind' | 'Overdue Reviews' | 'Clarification Blocked' | 'High-Risk Workloads'

const filters: Array<{
  label: FilterKey
  value: number
}> = [
  { label: 'Total SME Teams', value: 8 },
  { label: 'Teams On Track', value: 3 },
  { label: 'Teams Behind', value: 2 },
  { label: 'Overdue Reviews', value: 28 },
  { label: 'Clarification Blocked', value: 5 },
  { label: 'High-Risk Workloads', value: 6 },
]

function CircularMetric({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: string
}) {
  const pct = Math.max(8, Math.min(100, value / 2))
  return (
    <div className="rounded-[18px] border border-[#EAF0F6] bg-white p-3 dark:border-white/10 dark:bg-white/5">
      <div className="flex items-center gap-3">
        <div
          className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full"
          style={{ background: `conic-gradient(${tone} ${pct}%, #EEF3F8 ${pct}% 100%)` }}
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-xs font-bold text-[#0F172A] dark:bg-[#1E293B] dark:text-white">
            {value}
          </div>
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold tracking-[0.12em] text-[#64748B] dark:text-slate-400">{label}</p>
          <p className="mt-1 text-xs text-[#64748B] dark:text-slate-300">{Math.round(pct)}% of target</p>
        </div>
      </div>
    </div>
  )
}

function AiMonitorAccordion() {
  const [open, setOpen] = useState(false)

  return (
    <section className="overflow-hidden rounded-[28px] border border-[#E9D5FF] bg-white dark:border-white/10 dark:bg-[#1E293B]">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-start justify-between gap-4 bg-gradient-to-b from-[#FDF8FF] to-white px-6 py-5 text-left transition-colors hover:bg-white/30 dark:from-[#2A123D] dark:to-[#1E293B] dark:hover:bg-white/5"
      >
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#A855F7] text-white shadow-[0_12px_24px_rgba(168,85,247,0.24)]">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-[16px] font-semibold text-[#0F172A] dark:text-white">AI Review Insight</h2>
              <span className="rounded-full bg-[#FDF8FF] px-2.5 py-1 text-[11px] font-semibold text-[#A855F7] dark:bg-[#A855F7]/15 dark:text-[#E9D5FF]">
                Action Required
              </span>
            </div>
            <p className="mt-1 text-sm text-[#475569] dark:text-slate-300">
              Static review insight for the SME cycle. Expand to view the current risk signal.
            </p>
          </div>
        </div>
        {open ? <ChevronUp className="mt-1 h-4 w-4 shrink-0 text-[#94A3B8]" /> : <ChevronDown className="mt-1 h-4 w-4 shrink-0 text-[#94A3B8]" />}
      </button>

      {open ? (
        <div className="border-t border-[#E9D5FF] px-6 py-5 dark:border-white/10">
          <div className="flex items-start gap-3 rounded-[18px] border border-[#E9D5FF] bg-white p-4 dark:border-white/10 dark:bg-white/5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F5EEFF] text-[#A855F7] dark:bg-[#A855F7]/15 dark:text-[#E9D5FF]">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#0F172A] dark:text-white">Static review insight</p>
              <p className="mt-1 text-sm leading-6 text-[#64748B] dark:text-slate-300">
                Smart City and Digital Services have the highest clarification pressure this cycle, while Cloud Infrastructure shows the most routing issues and should be reviewed for SME reassignment.
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}

export default function SMETracker() {
  const [activeFilter, setActiveFilter] = useState<FilterKey>('Total SME Teams')

  return (
    <StrategyPageShell
      eyebrow="ICT - Strategy Team"
      title="SME Tracker"
      description="Monitor SME review activity organized by strategic priority. Spot bottlenecks, workload concerns, and review momentum."
    >
      <section className="space-y-5">
        <div className="flex flex-wrap gap-3">
          {filters.map((filter) => {
            const active = activeFilter === filter.label
            return (
              <button
                key={filter.label}
                type="button"
                onClick={() => setActiveFilter(filter.label)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? 'border-[var(--primary)] bg-[var(--primary)] text-white'
                    : 'border border-[#E2E8F0] bg-white text-[#0F172A] hover:bg-[#F1F5F9] dark:border-white/10 dark:bg-[#1E293B] dark:text-white dark:hover:bg-white/5'
                }`}
              >
                <span className="text-sm font-medium">{filter.label}</span>
                <span className={`rounded-full px-1.5 py-0.5 text-xs font-bold ${active ? 'bg-white/20' : 'bg-[#F1F5F9] dark:bg-white/10'}`}>
                  {filter.value}
                </span>
              </button>
            )
          })}
        </div>

        <div className="space-y-4">
          {smeTracks.map((track, index) => (
            <Card key={track.priority} className="overflow-hidden rounded-[22px] border-[#D9E6F5] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#162339]">
              <CardContent className="p-0">
                <div className="flex flex-wrap items-start justify-between gap-4 px-5 py-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EEF5FF] text-sm font-bold text-[#286CFF] dark:bg-[#286CFF]/15 dark:text-[#BFDBFE]">
                        {String(index + 1).padStart(2, '0')}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-lg font-bold text-[#0F172A] dark:text-white">{track.priority}</p>
                        <p className="text-xs text-[#64748B] dark:text-slate-300">{track.ownerTeam}</p>
                      </div>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-[#475569] dark:text-slate-300">{track.nextAction}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StrategyPill tone={track.status === 'On Track' ? 'teal' : track.status === 'Backlog' ? 'violet' : 'amber'}>
                      {track.status}
                    </StrategyPill>
                  </div>
                </div>

                <div className="px-5 pb-5">
                  <div className="rounded-[20px] border border-[#DDEBFF] bg-[#F8FBFF] p-4 dark:border-white/10 dark:bg-[#1E293B]">
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {[
                        { label: 'Assigned', value: 156, tone: '#286CFF' },
                        { label: 'Reviewed', value: 98, tone: '#008a65' },
                        { label: 'Pending', value: 58, tone: '#D0A600' },
                        { label: 'Clarif.', value: 12, tone: '#9955DC' },
                        { label: 'Overdue', value: 8, tone: '#EF4444' },
                        { label: 'Due Soon', value: 15, tone: '#F97316' },
                      ].map((item) => (
                        <CircularMetric key={item.label} label={item.label} value={item.value} tone={item.tone} />
                      ))}
                    </div>

                    <div className="mt-4">
                      <div className="mb-3 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-[#0F172A] dark:text-white">Completion</p>
                          <p className="text-xs text-[#64748B] dark:text-slate-300">Current throughput and backlog balance</p>
                        </div>
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#286CFF] shadow-sm dark:bg-white/10 dark:text-[#BFDBFE]">
                          {track.averageConfidence}%
                        </span>
                      </div>
                      <StrategyProgressBar
                        value={track.averageConfidence}
                        accent={track.status === 'On Track' ? '#008a65' : track.status === 'Backlog' ? '#9955DC' : '#286CFF'}
                      />
                      <div className="mt-3 grid gap-3 sm:grid-cols-3">
                        {[
                          { label: 'Avg Turnaround', value: '2.4 days' },
                          { label: 'High-Risk', value: '14 projects' },
                          { label: 'Routing Impact', value: '4 misrouted' },
                        ].map((item) => (
                          <div key={item.label} className="rounded-[16px] border border-[#EAF0F6] bg-white px-3 py-3 dark:border-white/10 dark:bg-white/5">
                            <p className="text-[11px] font-semibold tracking-[0.12em] text-[#64748B] dark:text-slate-400">{item.label}</p>
                            <p className="mt-2 text-sm font-bold text-[#0F172A] dark:text-white">{item.value}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4">
                      <AiMonitorAccordion />
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end">
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 rounded-2xl bg-[#286CFF] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(40,108,255,0.18)] transition-colors hover:bg-[#1F5BFF]"
                    >
                      Open SME Queue
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </StrategyPageShell>
  )
}
