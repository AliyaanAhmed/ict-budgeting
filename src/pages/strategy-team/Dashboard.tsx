import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Bell,
  BrainCircuit,
  CalendarClock,
  CheckCircle2,
  CircleAlert,
  ClipboardList,
  Clock3,
  Layers,
  MessageSquare,
  Radar,
  ShieldAlert,
  Sparkles,
  Workflow,
  Users,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { StrategyAiPanel, StrategyMetricCard, StrategyPageShell, StrategyPill, StrategyProgressBar } from './StrategyTeamShell'
import { entityProgressRows, smeTracks, strategyStats, strategyWorkflowCards } from './strategyTeamData'

function MiniLink({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-2 rounded-full border border-[#D7E4F4] bg-white px-3 py-1.5 text-sm font-semibold text-[#286CFF] transition-colors hover:border-[#B0DBFF] hover:bg-[#EEF5FF] dark:border-white/10 dark:bg-white/5 dark:text-[#BFDBFE]"
    >
      {label}
      <ArrowRight className="h-3.5 w-3.5" />
    </Link>
  )
}

export default function StrategyTeamDashboard() {
  return (
    <StrategyPageShell
      eyebrow="ICT - Strategy Team"
      title="Strategy Team Dashboard"
      description="A high-access governance workspace for the strategy team to steer alignment, oversee entities, monitor SMEs, and keep DGE readiness moving across the full portfolio."
    >
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {strategyStats.map((item) => (
          <StrategyMetricCard
            key={item.label}
            title={item.label}
            value={item.value}
            note={item.note}
            accent={item.accent}
            icon={<item.icon className="h-4.5 w-4.5" />}
          />
        ))}
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Card className="overflow-hidden rounded-[28px] border-[#D9E6F5] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#162339]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Layers className="h-5 w-5 text-[#286CFF]" />
                  <h2 className="text-xl font-bold text-[#0F172A] dark:text-white">ADGE Governance</h2>
                </div>
                <p className="mt-1 text-sm text-[#64748B] dark:text-slate-300">
                  All entity progress with budget, route, and completion signals before DGE handoff.
                </p>
              </div>
              <MiniLink to="/strategy-team/entity-tracker" label="Open tracker" />
            </div>
            <div className="mt-5 space-y-3">
              {entityProgressRows.slice(0, 3).map((entity) => (
                <div key={entity.code} className="rounded-[22px] border border-[#DCE6F6] bg-[#F8FBFF] p-4 dark:border-white/10 dark:bg-white/5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-[#0F172A] dark:text-white">{entity.name}</p>
                        <StrategyPill tone="blue">{entity.code}</StrategyPill>
                      </div>
                      <p className="mt-1 text-xs text-[#64748B] dark:text-slate-300">{entity.insight}</p>
                    </div>
                    <span className="text-sm font-semibold text-[#286CFF] dark:text-[#BFDBFE]">{entity.completion}%</span>
                  </div>
                  <div className="mt-3">
                    <StrategyProgressBar value={entity.completion} accent={entity.completion > 70 ? '#14B8A6' : '#286CFF'} />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-[#64748B] dark:text-slate-300">
                    <span className="rounded-full bg-white px-2.5 py-1 dark:bg-white/5">Budget {entity.budget.toLocaleString('en-AE')} AED</span>
                    <span className="rounded-full bg-white px-2.5 py-1 dark:bg-white/5">{entity.totalProjects} projects</span>
                    <span className="rounded-full bg-white px-2.5 py-1 dark:bg-white/5">SME routed {entity.smeRouted}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <StrategyAiPanel title="AI Risk Snapshot">
          <div className="space-y-3">
            <div className="rounded-[20px] border border-[#EAF0F6] bg-white p-4 dark:border-white/10 dark:bg-white/5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[#0F172A] dark:text-white">High risk exposure</p>
                  <p className="mt-1 text-sm leading-6 text-[#64748B] dark:text-slate-300">
                    6 projects need policy or scope correction before routing to SMEs.
                  </p>
                </div>
                <ShieldAlert className="h-5 w-5 text-[#F97316]" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-[20px] border border-[#DCE6F6] bg-[#F8FBFF] p-4 dark:border-white/10 dark:bg-white/5">
                <p className="text-xs font-semibold text-[#64748B] dark:text-slate-300">AI flags</p>
                <p className="mt-2 text-2xl font-bold text-[#0F172A] dark:text-white">14</p>
              </div>
              <div className="rounded-[20px] border border-[#DCE6F6] bg-[#F8FBFF] p-4 dark:border-white/10 dark:bg-white/5">
                <p className="text-xs font-semibold text-[#64748B] dark:text-slate-300">Exception items</p>
                <p className="mt-2 text-2xl font-bold text-[#0F172A] dark:text-white">7</p>
              </div>
            </div>
            <div className="rounded-[20px] border border-dashed border-[#D7E4F4] bg-white p-4 dark:border-white/10 dark:bg-white/5">
              <p className="text-sm font-semibold text-[#0F172A] dark:text-white">AI guidance</p>
              <p className="mt-2 text-sm leading-6 text-[#64748B] dark:text-slate-300">
                Prioritise AI, cloud, and security submissions first because they show the highest overlap with DGE-wide patterns.
              </p>
            </div>
          </div>
        </StrategyAiPanel>
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Card className="overflow-hidden rounded-[28px] border-[#D9E6F5] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#162339]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-[#286CFF]" />
                  <h2 className="text-xl font-bold text-[#0F172A] dark:text-white">Strategic Alignment</h2>
                </div>
                <p className="mt-1 text-sm text-[#64748B] dark:text-slate-300">
                  Bulk routing lane for adjusting priorities, classifications, and SME ownership.
                </p>
              </div>
              <MiniLink to="/strategy-team/strategic-alignment" label="Open table" />
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              {strategyWorkflowCards.slice(0, 2).map((card) => (
                <div key={card.title} className="rounded-[22px] border border-[#DCE6F6] bg-[#F8FBFF] p-4 dark:border-white/10 dark:bg-white/5">
                  <p className="text-sm font-semibold text-[#0F172A] dark:text-white">{card.title}</p>
                  <p className="mt-1 text-xs leading-5 text-[#64748B] dark:text-slate-300">{card.description}</p>
                  <div className="mt-3 flex items-center justify-between border-t border-[#EEF3F8] pt-3 dark:border-white/10">
                    <span className="text-2xl font-bold text-[#0F172A] dark:text-white">{card.value}</span>
                    <StrategyPill tone="violet">{card.badge}</StrategyPill>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-[28px] border-[#D9E6F5] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#162339]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-[#286CFF]" />
                  <h2 className="text-xl font-bold text-[#0F172A] dark:text-white">SME Oversight</h2>
                </div>
                <p className="mt-1 text-sm text-[#64748B] dark:text-slate-300">
                  One lane per strategic priority with live routing, confidence, and backlog signals.
                </p>
              </div>
              <MiniLink to="/strategy-team/sme-tracker" label="Open SME view" />
            </div>
            <div className="mt-5 space-y-3">
              {smeTracks.slice(0, 3).map((track) => (
                <div key={track.priority} className="rounded-[22px] border border-[#DCE6F6] bg-[#F8FBFF] p-4 dark:border-white/10 dark:bg-white/5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[#0F172A] dark:text-white">{track.priority}</p>
                      <p className="mt-1 text-xs text-[#64748B] dark:text-slate-300">{track.ownerTeam}</p>
                    </div>
                    <StrategyPill tone={track.status === 'On Track' ? 'teal' : track.status === 'Backlog' ? 'violet' : 'amber'}>{track.status}</StrategyPill>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-[#64748B] dark:text-slate-300">
                    <span>{track.averageConfidence}% confidence</span>
                    <span>{track.awaitingSME} awaiting SME</span>
                  </div>
                  <div className="mt-2">
                    <StrategyProgressBar value={track.averageConfidence} accent={track.status === 'On Track' ? '#14B8A6' : '#286CFF'} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Card className="overflow-hidden rounded-[28px] border-[#D9E6F5] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#162339]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-[#286CFF]" />
                  <h2 className="text-xl font-bold text-[#0F172A] dark:text-white">Clarification Governance</h2>
                </div>
                <p className="mt-1 text-sm text-[#64748B] dark:text-slate-300">
                  Track unresolved questions before they block strategy approval or SME routing.
                </p>
              </div>
              <MiniLink to="/strategy-team/quality-check" label="Open QC" />
            </div>
            <div className="mt-5 space-y-3">
              {[
                '7 clarification loops are still open across AI, cloud, and security workstreams.',
                '3 projects need additional evidence before they can move to SME review.',
                '2 exceptions are waiting for DGE governance confirmation.',
              ].map((item, index) => (
                <div key={item} className="flex items-start gap-3 rounded-[22px] border border-[#DCE6F6] bg-[#F8FBFF] p-4 dark:border-white/10 dark:bg-white/5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#EEF5FF] text-[#286CFF] dark:bg-[#286CFF]/15 dark:text-[#BFDBFE]">
                    {index + 1}
                  </div>
                  <p className="text-sm leading-6 text-[#475569] dark:text-slate-300">{item}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-[28px] border-[#D9E6F5] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#162339]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <CalendarClock className="h-5 w-5 text-[#286CFF]" />
                  <h2 className="text-xl font-bold text-[#0F172A] dark:text-white">Deadline And Exception Monitor</h2>
                </div>
                <p className="mt-1 text-sm text-[#64748B] dark:text-slate-300">
                  Watch deadlines, exceptions, and unresolved approval bottlenecks across the portfolio.
                </p>
              </div>
              <MiniLink to="/strategy-team/entity-tracker" label="Open entity view" />
            </div>
            <div className="mt-5 space-y-3">
              {[
                { title: 'DGE submission window', detail: '91 days remaining', accent: '#286CFF' },
                { title: 'Policy exceptions', detail: '4 items require escalation', accent: '#F97316' },
                { title: 'SME backlog pressure', detail: '12 projects need quicker review', accent: '#A855F7' },
              ].map((item) => (
                <div key={item.title} className="rounded-[22px] border border-[#DCE6F6] bg-[#F8FBFF] p-4 dark:border-white/10 dark:bg-white/5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[#0F172A] dark:text-white">{item.title}</p>
                      <p className="mt-1 text-sm text-[#64748B] dark:text-slate-300">{item.detail}</p>
                    </div>
                    <div className="flex h-9 w-9 items-center justify-center rounded-full" style={{ backgroundColor: `${item.accent}14`, color: item.accent }}>
                      <Clock3 className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Card className="overflow-hidden rounded-[28px] border-[#D9E6F5] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#162339]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <BrainCircuit className="h-5 w-5 text-[#286CFF]" />
                  <h2 className="text-xl font-bold text-[#0F172A] dark:text-white">Quality Check</h2>
                </div>
                <p className="mt-1 text-sm text-[#64748B] dark:text-slate-300">
                  Items needing governance review before they can move deeper into the DGE journey.
                </p>
              </div>
              <MiniLink to="/strategy-team/quality-check" label="Open QC" />
            </div>
            <div className="mt-5 space-y-3">
              {[
                '4 items are awaiting QC.',
                '1 AI-driven submission needs policy validation.',
                '3 projects are ready to be passed onward after checks.',
              ].map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-[22px] border border-[#EAF0F6] bg-white p-4 dark:border-white/10 dark:bg-white/5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#EEF5FF] text-[#286CFF] dark:bg-[#286CFF]/15 dark:text-[#BFDBFE]">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <p className="text-sm leading-6 text-[#475569] dark:text-slate-300">{item}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <StrategyAiPanel title="AI Governance Lens">
          <div className="space-y-3">
            <div className="rounded-[20px] border border-[#EAF0F6] bg-white p-4 dark:border-white/10 dark:bg-white/5">
              <p className="text-sm font-semibold text-[#0F172A] dark:text-white">Overall readout</p>
              <p className="mt-1 text-sm leading-6 text-[#64748B] dark:text-slate-300">
                Strategy has enough visibility to prioritize high-risk AI, cloud, and security items while keeping the rest moving through the queue.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-[20px] border border-[#DCE6F6] bg-[#F8FBFF] p-4 dark:border-white/10 dark:bg-white/5">
                <p className="text-xs font-semibold text-[#64748B] dark:text-slate-300">Route now</p>
                <p className="mt-2 text-2xl font-bold text-[#0F172A] dark:text-white">18</p>
              </div>
              <div className="rounded-[20px] border border-[#DCE6F6] bg-[#F8FBFF] p-4 dark:border-white/10 dark:bg-white/5">
                <p className="text-xs font-semibold text-[#64748B] dark:text-slate-300">Hold</p>
                <p className="mt-2 text-2xl font-bold text-[#0F172A] dark:text-white">6</p>
              </div>
            </div>
          </div>
        </StrategyAiPanel>
      </section>
    </StrategyPageShell>
  )
}
