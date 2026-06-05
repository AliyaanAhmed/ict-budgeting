import { useMemo, useState } from 'react'
import { ArrowRight, ChevronDown, ChevronUp, Clock3, CircleCheckBig, Info, Route, Sparkles, Waypoints } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { StrategyPageShell, StrategyPill, StrategyProgressBar } from './StrategyTeamShell'
import { entityProgressRows } from './strategyTeamData'

const stages = ['All Stages', 'Planning', 'DGE Review', 'Allocation', 'Utilization'] as const
const stageMeta = {
  Planning: { label: 'Planning', accent: '#D8E7FF', chip: 'bg-[#F1F5F9] text-[#64748B] dark:bg-white/10 dark:text-slate-300' },
  'DGE Review': { label: 'DGE Review', accent: '#286CFF', chip: 'bg-[#EEF5FF] text-[#286CFF] dark:bg-[#286CFF]/15 dark:text-[#BFDBFE]' },
  Allocation: { label: 'Allocation', accent: '#4F98FF', chip: 'bg-[#E7F0FF] text-[#1F5BFF] dark:bg-[#1F5BFF]/15 dark:text-[#BFDBFE]' },
  Utilization: { label: 'Utilization', accent: '#16A34A', chip: 'bg-[#ECFDF3] text-[#16794B] dark:bg-[#16794B]/15 dark:text-[#86EFAC]' },
} as const

const stageIcons = {
  Planning: Clock3,
  'DGE Review': Route,
  Allocation: Waypoints,
  Utilization: CircleCheckBig,
} as const

function stageIndex(stage: (typeof stages)[number]) {
  if (stage === 'Planning') return 0
  if (stage === 'DGE Review') return 1
  if (stage === 'Allocation') return 2
  if (stage === 'Utilization') return 3
  return 0
}

function EntityStageTracker({
  currentStage,
  breakdown,
}: {
  currentStage: keyof typeof stageMeta
  breakdown: { planning: number; dgeReview: number; allocation: number; utilization: number }
}) {
  const stageOrder = ['Planning', 'DGE Review', 'Allocation', 'Utilization'] as const
  const currentIndex = stageIndex(currentStage)
  const total = Math.max(
    1,
    breakdown.planning + breakdown.dgeReview + breakdown.allocation + breakdown.utilization
  )

  return (
    <div className="space-y-4">
      <div className="rounded-[20px] border border-[#DDEBFF] bg-white px-4 py-4 shadow-[0_12px_30px_rgba(40,108,255,0.05)] dark:border-white/10 dark:bg-[#1E293B]">
        <div className="flex w-full flex-nowrap items-center gap-2 overflow-x-auto pb-1">
          {stageOrder.map((stage, index) => {
            const meta = stageMeta[stage]
            const active = index <= currentIndex
            const StageIcon = stageIcons[stage]
            return (
              <div key={stage} className="flex min-w-0 flex-1 items-center">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div
                    className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-sm font-bold transition-all duration-200',
                      active
                        ? 'border-[#286CFF] bg-[#286CFF] text-white'
                        : 'border-[#D8E7FF] bg-[#EEF3F8] text-[#94A3B8] dark:border-white/10 dark:bg-white/10 dark:text-slate-400'
                    )}
                  >
                    <StageIcon className="h-4.5 w-4.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[#0F172A] dark:text-white">{meta.label}</p>
                    <p className="mt-0.5 text-xs text-[#64748B] dark:text-slate-400">
                      {active ? 'Active' : 'Upcoming'}
                    </p>
                  </div>
                </div>
                {index < stageOrder.length - 1 ? (
                  <div className="mx-2 h-0.5 min-w-[18px] flex-1 overflow-hidden rounded-full bg-[#EEF3F8] dark:bg-white/10">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: index < currentIndex ? '100%' : '0%',
                        backgroundColor: index < currentIndex ? '#286CFF' : '#D8E7FF',
                      }}
                    />
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      </div>

      <div className="rounded-[20px] border border-[#DDEBFF] bg-[#F8FBFF] p-4 shadow-[0_12px_30px_rgba(40,108,255,0.06)] dark:border-white/10 dark:bg-white/5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[#0F172A] dark:text-white">Stage Progress</p>
            <p className="mt-1 text-xs text-[#64748B] dark:text-slate-300">
              Current portfolio status across the entity workflow
            </p>
          </div>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#286CFF] shadow-sm dark:bg-white/10 dark:text-[#BFDBFE]">
            {currentStage}
          </span>
        </div>

        <div className="h-4 overflow-hidden rounded-full bg-[#EEF3F8] dark:bg-white/10">
          <div className="flex h-full w-full">
            <div
              className="flex h-full items-center justify-center text-[11px] font-semibold text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.15)]"
              style={{ width: `${(breakdown.planning / total) * 100}%`, backgroundColor: '#008a65' }}
            >
              {breakdown.planning}
            </div>
            <div
              className="flex h-full items-center justify-center text-[11px] font-semibold text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.15)]"
              style={{ width: `${(breakdown.dgeReview / total) * 100}%`, backgroundColor: '#286CFF' }}
            >
              {breakdown.dgeReview}
            </div>
            <div
              className="flex h-full items-center justify-center text-[11px] font-semibold text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.15)]"
              style={{ width: `${(breakdown.allocation / total) * 100}%`, backgroundColor: '#D0A600' }}
            >
              {breakdown.allocation}
            </div>
            <div
              className="flex h-full items-center justify-center text-[11px] font-semibold text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.15)]"
              style={{ width: `${(breakdown.utilization / total) * 100}%`, backgroundColor: '#9955DC' }}
            >
              {breakdown.utilization}
            </div>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
          {[
            { label: 'Planning', value: breakdown.planning, color: '#008a65' },
            { label: 'DGE Review', value: breakdown.dgeReview, color: '#286CFF' },
            { label: 'Allocation', value: breakdown.allocation, color: '#D0A600' },
            { label: 'Utilization', value: breakdown.utilization, color: '#9955DC' },
          ].map((item) => (
            <div key={item.label} className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-[#64748B] dark:text-slate-300">{item.label}</span>
              <span className="font-semibold text-[#0F172A] dark:text-white">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function EntityInsightsPanel({ entityName, insights }: { entityName: string; insights: string[] }) {
  return (
    <div className="rounded-[20px] border border-[#E9D5FF] bg-[#FDF8FF] p-4 shadow-[0_12px_30px_rgba(168,85,247,0.06)] dark:border-white/10 dark:bg-[#2A123D]">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#A855F7] text-white shadow-[0_12px_24px_rgba(168,85,247,0.24)]">
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-[#0F172A] dark:text-white">AI Portfolio Insights</p>
          <p className="text-xs text-[#64748B] dark:text-slate-300">{entityName}</p>
        </div>
      </div>
      <div className="mt-4 space-y-2">
        {insights.map((insight) => (
          <div
            key={insight}
            className="flex items-start gap-2 rounded-[16px] border border-[#E9D5FF] bg-white px-3 py-2.5 dark:border-white/10 dark:bg-white/5"
          >
            <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#A855F7]" />
            <p className="text-sm leading-6 text-[#475569] dark:text-slate-200">{insight}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function EntityTrackerSummary() {
  const [expanded, setExpanded] = useState(false)
  return (
    <section className="overflow-hidden rounded-[28px] border border-[#E9D5FF] bg-white dark:border-white/10 dark:bg-[#1E293B]">
      <button
        type="button"
        onClick={() => setExpanded((current) => !current)}
        className="flex w-full items-start justify-between gap-4 bg-gradient-to-b from-[#FDF8FF] via-white to-white px-6 py-5 text-left transition-colors hover:bg-white/40 dark:from-[#2A123D] dark:via-[#1F1B2E] dark:to-[#1E293B] dark:hover:bg-white/5"
      >
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#A855F7] text-white shadow-[0_12px_24px_rgba(168,85,247,0.24)]">
            <Sparkles className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-[16px] font-semibold text-[#0F172A] dark:text-white">AI Entity Tracker Summary</h2>
              <span className="inline-flex rounded-full bg-[#F5EEFF] px-2.5 py-1 text-xs font-semibold text-[#A855F7] dark:bg-[#A855F7]/15 dark:text-[#E9D5FF]">
                Governing View
              </span>
            </div>
            <p className="mt-1 text-sm leading-6 text-[#475569] dark:text-slate-100">
              Portfolio-level progress across every participating entity, with stage pressure, routing signals, and governance focus.
            </p>
          </div>
        </div>
        <ChevronDown className={cn('mt-1 h-5 w-5 shrink-0 text-[#64748B] transition-transform dark:text-slate-300', expanded && 'rotate-180')} />
      </button>

      {expanded ? (
        <div className="border-t border-[#DDEBFF] px-6 py-5 dark:border-white/10">
          <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-[22px] border border-[#E9D5FF] bg-[#FDF8FF] p-5 shadow-[0_12px_30px_rgba(168,85,247,0.05)] dark:border-white/10 dark:bg-[#1E293B]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold tracking-[0.14em] text-[#64748B] dark:text-slate-400">Portfolio Snapshot</p>
                  <p className="mt-2 text-2xl font-bold text-[#0F172A] dark:text-white">4 entities in focus</p>
                </div>
                <span className="inline-flex items-center rounded-full border border-[#E9D5FF] bg-white px-3 py-1 text-xs font-semibold text-[#A855F7] dark:border-white/10 dark:bg-white/10 dark:text-[#E9D5FF]">
                  63% average completion
                </span>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {[
                  { label: 'Planning pressure', value: '3', note: 'Largest queue', accent: '#94A3B8' },
                  { label: 'DGE review items', value: '5', note: 'Currently active', accent: '#286CFF' },
                  { label: 'Utilization ready', value: '2', note: 'Near closure', accent: '#16A34A' },
                ].map((item) => (
                    <div key={item.label} className="rounded-[18px] border border-[#E9D5FF] bg-white p-4 shadow-[0_10px_26px_rgba(168,85,247,0.04)] dark:border-white/10 dark:bg-[#1E293B]">
                      <p className="text-xs font-semibold tracking-[0.12em] text-[#64748B] dark:text-slate-400">{item.label}</p>
                      <p className="mt-3 text-2xl font-bold text-[#0F172A] dark:text-white">{item.value}</p>
                    <p className="mt-1 text-xs text-[#64748B] dark:text-slate-300">{item.note}</p>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#EEF3F8] dark:bg-white/10">
                      <div className="h-full rounded-full" style={{ width: `${Number(item.value) * 25}%`, backgroundColor: item.accent }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[22px] border border-[#DDEBFF] bg-[#F8FBFF] p-5 shadow-[0_12px_30px_rgba(40,108,255,0.05)] dark:border-white/10 dark:bg-[#1E293B]">
              <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F5EEFF] text-[#A855F7] dark:bg-[#A855F7]/15 dark:text-[#E9D5FF]">
                    <Info className="h-4.5 w-4.5" />
                  </div>
                <div>
                  <p className="font-semibold text-[#0F172A] dark:text-white">AI Focus Areas</p>
                  <p className="text-xs text-[#64748B] dark:text-slate-300">Signals driving the current portfolio view</p>
                </div>
              </div>
              <div className="mt-4 space-y-3">
                {[
                  'Clarification pressure remains highest in Planning and DGE Review.',
                  'Allocation items are slowing down for one large portfolio cluster.',
                  'Utilization is healthiest where stage handoffs are already complete.',
                ].map((item) => (
                  <div key={item} className="rounded-[18px] border border-[#E9D5FF] bg-white px-4 py-3 text-sm leading-6 text-[#475569] shadow-[0_10px_26px_rgba(168,85,247,0.04)] dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}

function stageMatchesEntity(entityStage: (typeof stages)[number], activeStage: (typeof stages)[number]) {
  if (activeStage === 'All Stages') return true
  return entityStage === activeStage
}

export default function EntityTracker() {
  const [activeStage, setActiveStage] = useState<(typeof stages)[number]>('All Stages')

  const stageCounts = useMemo(
    () =>
      stages.map((stage) => ({
        label: stage,
        count:
          stage === 'All Stages'
            ? entityProgressRows.length
            : entityProgressRows.filter((entity) => entity.currentStage === stage).length,
      })),
    []
  )

  const filteredEntities = useMemo(
    () => entityProgressRows.filter((entity) => stageMatchesEntity(entity.currentStage, activeStage)),
    [activeStage]
  )

  return (
    <StrategyPageShell
      eyebrow="ICT - Strategy Team"
      title="Entity Tracker"
      description="Portfolio-level monitoring for every participating government entity across the budgeting cycle."
    >
      <section className="space-y-5">
        <EntityTrackerSummary />

        <div className="flex items-center gap-2 flex-wrap">
          {stageCounts.map((stage) => (
            <button
              key={stage.label}
              type="button"
              onClick={() => setActiveStage(stage.label)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                activeStage === stage.label
                  ? 'border-[var(--primary)] bg-[var(--primary)] text-white'
                  : 'border border-[#E2E8F0] bg-white text-[#0F172A] hover:bg-[#F1F5F9] dark:border-white/10 dark:bg-[#1E293B] dark:text-white dark:hover:bg-white/5'
              }`}
            >
              <span>{stage.label === 'All Stages' ? 'All Stages' : stage.label}</span>
              <span className={`rounded-full px-1.5 py-0.5 text-xs font-bold ${activeStage === stage.label ? 'bg-white/20' : 'bg-[#F1F5F9] dark:bg-white/10'}`}>
                {stage.count}
              </span>
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {filteredEntities.map((entity) => {
            return (
              <Card
                key={entity.code}
                className="group overflow-hidden rounded-[20px] border-[#D9E6F5] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.06)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_42px_rgba(15,23,42,0.12)] dark:border-white/10 dark:bg-[#162339]"
              >
                <CardContent className="p-0">
                  <div className="flex w-full items-start justify-between gap-4 px-5 py-4 text-left">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EEF5FF] text-sm font-bold text-[#286CFF] dark:bg-[#286CFF]/15 dark:text-[#BFDBFE]">
                          {entity.code}
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate text-lg font-bold text-[#0F172A] dark:text-white">{entity.name}</p>
                            <StrategyPill tone={entity.completion > 70 ? 'teal' : entity.completion > 45 ? 'amber' : 'violet'}>
                              {entity.currentStage}
                            </StrategyPill>
                          </div>
                          <p className="text-xs text-[#64748B] dark:text-slate-300">Lead: {entity.owner}</p>
                        </div>
                      </div>
                      <p className="mt-2 text-sm text-[#64748B] dark:text-slate-300">{entity.insight}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-sm font-semibold text-[#286CFF] dark:text-[#BFDBFE]">{entity.completion}% Complete</p>
                        <p className="text-xs text-[#64748B] dark:text-slate-300">
                          {entity.totalProjects} Projects Â· {entity.budget.toLocaleString('en-AE')} AED
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="px-5 pb-5">
                    <EntityStageTracker currentStage={entity.currentStage} breakdown={entity.stageBreakdown} />

                    <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_0.95fr]">
                      <div className="rounded-[20px] border border-[#DDEBFF] bg-[#F8FBFF] p-4 dark:border-white/10 dark:bg-[#1E293B]">
                        <div className="flex items-center gap-2">
                          <Clock3 className="h-4.5 w-4.5 text-[#286CFF]" />
                          <p className="text-sm font-semibold text-[#0F172A] dark:text-white">Entity Summary</p>
                        </div>
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          {[
                            { label: 'Budget Items', value: entity.totalProjects },
                            { label: 'Strategic Aligned', value: entity.strategicAligned },
                            { label: 'SME Routed', value: entity.smeRouted },
                            { label: 'QC Ready', value: entity.qcReady },
                          ].map((item) => (
                            <div key={item.label} className="rounded-[18px] border border-[#EAF0F6] bg-white p-3 dark:border-white/10 dark:bg-white/5">
                            <p className="text-xs font-semibold tracking-[0.12em] text-[#64748B] dark:text-slate-400">{item.label}</p>
                              <p className="mt-2 text-2xl font-bold text-[#0F172A] dark:text-white">{item.value}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <EntityInsightsPanel entityName={entity.name} insights={entity.aiInsights} />
                    </div>

                    <div className="mt-4 flex justify-end">
                      <button
                        type="button"
                        className="inline-flex items-center gap-2 rounded-2xl bg-[#286CFF] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(40,108,255,0.18)] transition-colors hover:bg-[#1F5BFF]"
                      >
                        View Entity Budgets
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>
    </StrategyPageShell>
  )
}
