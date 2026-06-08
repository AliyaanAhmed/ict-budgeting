import { Link } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import {
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  CircleAlert,
  ClipboardList,
  Clock3,
  FileText,
  GaugeCircle,
  GitBranch,
  Layers,
  MessageSquare,
  PieChart,
  ShieldAlert,
  Sparkles,
  TriangleAlert,
  Users,
  Workflow,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { useCycle } from '@/context/CycleContext'
import { StrategyAiPanel, StrategyMetricCard, StrategyPageShell, StrategyPill, StrategyProgressBar } from './StrategyTeamShell'
import { entityProgressRows, smeTracks } from './strategyTeamData'
import { DGE_BUDGET_STATUS, getBudgetStageBucket, getDgePortfolioData, getInstanceStageFilterLabel, type DgePortfolioData } from '@/services/dgePortfolioService'
import { cn } from '@/lib/utils'

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

function SkeletonBlock({ className }: { className: string }) {
  return <div className={cn('animate-pulse rounded-2xl bg-[#EAF0F6] dark:bg-white/10', className)} />
}

function DashboardSkeleton() {
  return (
    <>
      <section className="overflow-hidden rounded-[24px] border border-[#D9E6F5] bg-white dark:border-white/10 dark:bg-[#162339]">
        <div className="space-y-4 p-5">
          <div className="flex flex-wrap gap-4">
            <SkeletonBlock className="h-12 w-60" />
            <SkeletonBlock className="h-12 w-60" />
          </div>
          <SkeletonBlock className="h-20 w-full rounded-[20px]" />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <SkeletonBlock key={index} className="h-40 w-full rounded-[24px]" />
        ))}
      </section>

      {Array.from({ length: 3 }).map((_, rowIndex) => (
        <section key={rowIndex} className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <SkeletonBlock className="h-[360px] w-full rounded-[28px]" />
          <SkeletonBlock className="h-[360px] w-full rounded-[28px]" />
        </section>
      ))}
    </>
  )
}

export default function StrategyTeamDashboard() {
  const { selectedCycle } = useCycle()
  const [portfolio, setPortfolio] = useState<DgePortfolioData>({ instances: [], budgets: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      if (!selectedCycle?.id) {
        if (!cancelled) {
          setPortfolio({ instances: [], budgets: [] })
          setLoading(false)
        }
        return
      }

      setLoading(true)
      setError(null)

      try {
        const data = await getDgePortfolioData(selectedCycle.id)
        if (!cancelled) {
          setPortfolio(data)
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load strategy dashboard data.')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [selectedCycle?.id])

  const budgets = portfolio.budgets
  const instances = portfolio.instances

  const entityReadiness = useMemo(() => {
    const submitted = instances.filter((instance) => instance.budgets.length > 0).length
    const inReview = instances.filter((instance) => getInstanceStageFilterLabel(instance.statuscode) === 'DGE Review').length
    const planning = instances.filter((instance) => getInstanceStageFilterLabel(instance.statuscode) === 'Planning').length
    return { submitted, inReview, planning }
  }, [instances])

  const dashboardStats = useMemo(
    () => [
      {
        label: 'Projects in cycle',
        value: budgets.length.toString(),
        note: 'Across all entities',
        accent: '#286CFF',
        icon: ClipboardList,
      },
      {
        label: 'Aligned priorities',
        value: budgets
          .filter(
            (budget) =>
              budget.statuscode === DGE_BUDGET_STATUS.underSmeReview ||
              budget.statuscode === DGE_BUDGET_STATUS.underQualityCheck
          )
          .length.toString(),
        note: 'Ready for SME routing',
        accent: '#14B8A6',
        icon: Sparkles,
      },
      {
        label: 'SME queues active',
        value: budgets.filter((budget) => budget.statuscode === DGE_BUDGET_STATUS.underSmeReview).length.toString(),
        note: 'Currently with SME teams',
        accent: '#9333EA',
        icon: Users,
      },
      {
        label: 'Quality check items',
        value: budgets.filter((budget) => budget.statuscode === DGE_BUDGET_STATUS.underQualityCheck).length.toString(),
        note: 'Awaiting governance review',
        accent: '#F97316',
        icon: BrainCircuit,
      },
    ],
    [budgets]
  )

  const dynamicEntityRows = useMemo(() => {
    return instances.slice(0, 3).map((instance) => {
      const totalBudget = instance.budgets.reduce((sum, budget) => sum + budget.requestedBudget, 0)
      const smeRouted = instance.budgets.filter((budget) => budget.statuscode === DGE_BUDGET_STATUS.underSmeReview).length
      const qualityCheck = instance.budgets.filter((budget) => budget.statuscode === DGE_BUDGET_STATUS.underQualityCheck).length
      const completed = instance.budgets.filter((budget) => getBudgetStageBucket(budget.statuscode) === 'reviewCompleted').length
      const completion = instance.budgets.length ? Math.round(((completed + qualityCheck) / instance.budgets.length) * 100) : 0

      return {
        code: instance.entityAbbr || instance.name.slice(0, 3).toUpperCase(),
        name: instance.name,
        insight: `${instance.budgets.length} projects in cycle, ${smeRouted} with SME, ${qualityCheck} in quality check.`,
        completion,
        budget: totalBudget,
        totalProjects: instance.budgets.length,
        smeRouted,
      }
    })
  }, [instances])

  const alignmentDistribution = useMemo(() => {
    const alignedAndReady = budgets.filter((budget) => budget.statuscode === DGE_BUDGET_STATUS.underSmeReview).length
    const needsClassification = budgets.filter(
      (budget) => budget.statuscode === DGE_BUDGET_STATUS.underStrategicAlignmentReview
    ).length
    const wrongRoutingRisk = budgets.filter(
      (budget) => budget.statuscode === DGE_BUDGET_STATUS.strategicPriorityChangeUnderReview
    ).length
    const holdForClarification = budgets.filter(
      (budget) => budget.statuscode === DGE_BUDGET_STATUS.clarificationPending
    ).length
    const total = Math.max(1, alignedAndReady + needsClassification + wrongRoutingRisk + holdForClarification)

    return [
      { label: 'Aligned and ready', value: alignedAndReady, color: '#286CFF', share: Math.round((alignedAndReady / total) * 100) },
      { label: 'Needs classification review', value: needsClassification, color: '#A855F7', share: Math.round((needsClassification / total) * 100) },
      { label: 'Wrong SME routing risk', value: wrongRoutingRisk, color: '#D97706', share: Math.round((wrongRoutingRisk / total) * 100) },
      { label: 'Hold for clarification', value: holdForClarification, color: '#DC2626', share: Math.round((holdForClarification / total) * 100) },
    ]
  }, [budgets])

  const dynamicSmeTracks = useMemo(() => {
    return smeTracks.map((track) => {
      const matching = budgets.filter((budget) => (budget.strategicPriorityName || '').split(' - ')[0]?.trim() === track.priority)
      if (!matching.length) {
        return { ...track }
      }

      const awaitingSME = matching.filter((budget) => budget.statuscode === DGE_BUDGET_STATUS.underSmeReview).length
      const completed = matching.filter((budget) => budget.statuscode === DGE_BUDGET_STATUS.underQualityCheck).length
      const avgConfidence = Math.round(
        matching.reduce((sum, budget) => sum + (budget.aiConfidenceScore ?? 0), 0) / Math.max(1, matching.length)
      )

      return {
        ...track,
        projects: matching.length,
        routed: awaitingSME,
        completed,
        awaitingSME,
        averageConfidence: avgConfidence,
      }
    }).slice(0, 3)
  }, [budgets])

  return (
    <StrategyPageShell
      eyebrow="ICT - Strategy Team"
      title="Strategy Team Dashboard"
      description="A high-access governance workspace for the strategy team to steer alignment, oversee entities, monitor SMEs, and keep DGE readiness moving across the full portfolio."
    >
      {loading ? (
        <DashboardSkeleton />
      ) : (
        <>
      <section className="overflow-hidden rounded-[24px] border border-[#D9E6F5] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#162339]">
        <div className="p-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-3 lg:gap-6">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EEF5FF] text-[#286CFF] dark:bg-[#286CFF]/15 dark:text-[#BFDBFE]">
                <FileText className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold tracking-[0.08em] text-[#64748B] dark:text-slate-300">Budget Cycle</p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <p className="text-sm font-bold text-[#0F172A] dark:text-white">{selectedCycle?.name || 'No active cycle'}</p>
                  <span className="inline-flex items-center rounded-full bg-[#EEF5FF] px-2.5 py-1 text-xs font-semibold text-[#286CFF] dark:bg-[#286CFF]/15 dark:text-[#BFDBFE]">
                    Under DGE Review
                  </span>
                </div>
              </div>
            </div>

            <div className="hidden h-10 w-px bg-[#DCE8F6] lg:block dark:bg-white/10" />

            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F5EEFF] text-[#A855F7] dark:bg-[#A855F7]/15 dark:text-[#E9D5FF]">
                <Users className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold tracking-[0.08em] text-[#64748B] dark:text-slate-300">Entity Readiness</p>
                <p className="mt-1 text-sm font-bold text-[#0F172A] dark:text-white">
                  {entityReadiness.submitted} submitted, {entityReadiness.inReview} in DGE review, {entityReadiness.planning} still planning
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-[20px] border border-[#DCE8F6] bg-[#F8FBFF] p-3 dark:border-white/10 dark:bg-white/5">
            <div className="flex items-start gap-2">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#A855F7] dark:text-[#E9D5FF]" />
              <p className="text-sm text-[#475569] dark:text-slate-200">
                <span className="font-semibold text-[#0F172A] dark:text-white">AI Summary:</span> Strategy is currently governing {budgets.length} projects across {instances.length} entities. {entityReadiness.inReview} entities are actively under DGE review, {entityReadiness.planning} still need planning-stage intervention, and {budgets.filter((budget) => budget.statuscode === DGE_BUDGET_STATUS.strategicPriorityChangeUnderReview).length} high-signal items should be handled before deeper SME routing.
              </p>
            </div>
          </div>
        </div>
      </section>

      {error ? (
        <div className="rounded-[18px] border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#B91C1C] dark:border-[#7F1D1D] dark:bg-[#3A1717] dark:text-[#FCA5A5]">
          {error}
        </div>
      ) : null}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {dashboardStats.map((item) => (
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
        <Card className="flex h-full flex-col overflow-hidden rounded-[28px] border-[#D9E6F5] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#162339]">
          <CardContent className="flex flex-1 flex-col p-6">
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
              {(dynamicEntityRows.length ? dynamicEntityRows : entityProgressRows.slice(0, 3)).map((entity) => (
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
          <div className="flex flex-1 flex-col justify-center space-y-3">
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
        <Card className="flex h-full flex-col overflow-hidden rounded-[28px] border-[#D9E6F5] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#162339]">
          <CardContent className="flex flex-1 flex-col p-6">
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
            <div className="mt-5 grid flex-1 content-center gap-3 md:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-[22px] border border-[#DCE6F6] bg-[#F8FBFF] p-4 dark:border-white/10 dark:bg-white/5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[#0F172A] dark:text-white">Alignment Distribution</p>
                    <p className="mt-1 text-xs leading-5 text-[#64748B] dark:text-slate-300">Projects by routing quality and strategy confidence.</p>
                  </div>
                  <PieChart className="h-5 w-5 text-[#286CFF]" />
                </div>
                <div className="mt-4 space-y-3">
                  {alignmentDistribution.map((item) => (
                    <div key={item.label}>
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="inline-flex items-center gap-2 font-medium text-[#0F172A] dark:text-white">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                          {item.label}
                        </span>
                        <span className="text-[#475569] dark:text-slate-300">{item.value}</span>
                      </div>
                      <div className="mt-2">
                        <StrategyProgressBar value={item.share} accent={item.color} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                {[
                  { title: 'Bulk updates ready', value: 18, badge: 'Priority review' },
                  { title: 'SME handoff blocked', value: 6, badge: 'Needs action' },
                  { title: 'Misaligned submissions', value: 3, badge: 'Route back' },
                ].map((item) => (
                  <div key={item.title} className="rounded-[22px] border border-[#DCE6F6] bg-white p-4 dark:border-white/10 dark:bg-white/5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-[#0F172A] dark:text-white">{item.title}</p>
                        <p className="mt-2 text-2xl font-bold text-[#0F172A] dark:text-white">{item.value}</p>
                      </div>
                      <StrategyPill tone="violet">{item.badge}</StrategyPill>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="flex h-full flex-col overflow-hidden rounded-[28px] border-[#D9E6F5] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#162339]">
          <CardContent className="flex flex-1 flex-col p-6">
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
              {dynamicSmeTracks.map((track) => (
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
        <Card className="flex h-full flex-col overflow-hidden rounded-[28px] border-[#D9E6F5] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#162339]">
          <CardContent className="flex flex-1 flex-col p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-[#286CFF]" />
                  <h2 className="text-xl font-bold text-[#0F172A] dark:text-white">Clarification Governance</h2>
                </div>
                <p className="mt-1 text-sm text-[#64748B] dark:text-slate-300">
                  Communication flow status.
                </p>
              </div>
              <MiniLink to="/strategy-team/quality-check" label="View All" />
            </div>
            <div className="mt-5 flex flex-1 flex-col justify-center space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {[
                  { label: 'DGE To ADGE', value: '23', accent: '#286CFF' },
                  { label: 'Overdue DGE To ADGE', value: '5', accent: '#DC2626' },
                  { label: 'Within DGE', value: '14', accent: '#A855F7' },
                  { label: 'Avg Response', value: '2.4 days', accent: '#10B981' },
                  { label: 'Repeated Back-And-Forth', value: '4', accent: '#D97706' },
                  { label: 'Non-Responsive ADGEs', value: '2', accent: '#0F172A' },
                ].map((item) => (
                  <div key={item.label} className="rounded-[22px] border border-[#DCE6F6] bg-[#F8FBFF] p-4 dark:border-white/10 dark:bg-white/5">
                    <p className="text-xs font-semibold tracking-[0.08em] text-[#64748B] dark:text-slate-300">{item.label}</p>
                    <p className="mt-3 text-3xl font-bold" style={{ color: item.accent }}>{item.value}</p>
                  </div>
                ))}
              </div>

              <div className="grid gap-3 md:grid-cols-[0.9fr_1.1fr]">
                <div className="rounded-[22px] border border-[#DCE6F6] bg-[#F8FBFF] p-4 dark:border-white/10 dark:bg-white/5">
                  <div className="flex items-center gap-2">
                    <GitBranch className="h-5 w-5 text-[#286CFF]" />
                    <p className="text-sm font-semibold text-[#0F172A] dark:text-white">Highest Pending</p>
                  </div>
                  <div className="mt-4 space-y-3">
                    {[
                      { entity: 'ADDA', count: 5, accent: '#DC2626' },
                      { entity: 'DMT', count: 4, accent: '#D97706' },
                      { entity: 'DoH', count: 3, accent: '#286CFF' },
                    ].map((item) => (
                      <div key={item.entity} className="flex items-center justify-between rounded-[18px] border border-[#E4EDF9] bg-white px-4 py-3 dark:border-white/10 dark:bg-[#162339]">
                        <span className="text-sm font-semibold text-[#0F172A] dark:text-white">{item.entity}</span>
                        <span className="text-lg font-bold" style={{ color: item.accent }}>{item.count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[22px] border border-[#E9D5FF] bg-gradient-to-br from-[#FDF8FF] via-white to-white p-4 dark:border-white/10 dark:from-[#2A123D] dark:via-[#1F1B2E] dark:to-[#1E293B]">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-[#A855F7] dark:text-[#E9D5FF]" />
                    <p className="text-sm font-semibold text-[#0F172A] dark:text-white">AI Insights</p>
                  </div>
                  <div className="mt-4 space-y-3">
                    {[
                      '3 clarifications appear too broad, rephrase them for faster response.',
                      'ADDA and DMT are non-responsive, escalation is recommended.',
                    ].map((item) => (
                      <div key={item} className="flex items-start gap-2.5">
                        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#A855F7] dark:text-[#E9D5FF]" />
                        <span className="text-sm leading-6 text-[#475569] dark:text-slate-200">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-[28px] border-[#D9E6F5] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#162339]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Clock3 className="h-5 w-5 text-[#286CFF]" />
                  <h2 className="text-xl font-bold text-[#0F172A] dark:text-white">Deadline And Exception Monitor</h2>
                </div>
                <p className="mt-1 text-sm text-[#64748B] dark:text-slate-300">
                  Watch deadlines, exceptions, and unresolved approval bottlenecks across the portfolio.
                </p>
              </div>
              <MiniLink to="/strategy-team/entity-tracker" label="Open entity view" />
            </div>
            <div className="mt-5 flex flex-1 flex-col justify-center space-y-4">
              <div className="rounded-[24px] border border-[#DCE6F6] bg-[#F8FBFF] p-4 dark:border-white/10 dark:bg-white/5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <GaugeCircle className="h-5 w-5 text-[#286CFF]" />
                    <p className="text-sm font-semibold text-[#0F172A] dark:text-white">Timeline Heat</p>
                  </div>
                  <StrategyPill tone="amber">Attention needed</StrategyPill>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  {[
                    { title: 'Policy exceptions', value: 4, note: 'Require escalation', accent: '#F97316' },
                    { title: 'Deadline risk items', value: 6, note: 'Likely to slip', accent: '#DC2626' },
                    { title: 'SME backlog pressure', value: 12, note: 'Queue strain', accent: '#A855F7' },
                  ].map((item) => (
                    <div key={item.title} className="rounded-[20px] border border-[#E4EDF9] bg-white p-4 dark:border-white/10 dark:bg-[#162339]">
                      <p className="text-xs font-semibold tracking-[0.08em] text-[#64748B] dark:text-slate-300">{item.title}</p>
                      <p className="mt-2 text-3xl font-bold" style={{ color: item.accent }}>{item.value}</p>
                      <p className="mt-2 text-sm text-[#64748B] dark:text-slate-300">{item.note}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  { title: 'DGE submission window', detail: '91 days remaining before the full DGE review deadline.', icon: Clock3, accent: '#286CFF' },
                  { title: 'Planning-stage entities', detail: '6 entities still need strategy attention before they fully enter DGE review.', icon: Workflow, accent: '#D97706' },
                  { title: 'Quality handoff pressure', detail: '5 projects should move to quality check this week to protect downstream flow.', icon: CircleAlert, accent: '#A855F7' },
                ].map((item) => (
                  <div key={item.title} className="rounded-[22px] border border-[#DCE6F6] bg-white p-4 dark:border-white/10 dark:bg-white/5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: `${item.accent}14`, color: item.accent }}>
                      <item.icon className="h-5 w-5" />
                    </div>
                    <p className="mt-3 text-sm font-semibold text-[#0F172A] dark:text-white">{item.title}</p>
                    <p className="mt-2 text-sm leading-6 text-[#64748B] dark:text-slate-300">{item.detail}</p>
                  </div>
                ))}
              </div>
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
            <div className="mt-5 grid gap-3 md:grid-cols-2 md:items-start">
              <div className="rounded-[22px] border border-[#DCE6F6] bg-[#F8FBFF] p-4 dark:border-white/10 dark:bg-white/5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <BrainCircuit className="h-5 w-5 text-[#286CFF]" />
                    <p className="text-sm font-semibold text-[#0F172A] dark:text-white">QC Flow</p>
                  </div>
                  <span className="text-2xl font-bold text-[#0F172A] dark:text-white">12</span>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3">
                  {[
                    { label: 'Awaiting QC', value: 4, accent: '#286CFF' },
                    { label: 'Ready to route', value: 3, accent: '#10B981' },
                    { label: 'Hold items', value: 5, accent: '#D97706' },
                  ].map((item) => (
                    <div key={item.label} className="rounded-[18px] border border-[#DCE6F6] bg-white p-3 text-center dark:border-white/10 dark:bg-white/5">
                      <p className="text-xl font-bold" style={{ color: item.accent }}>{item.value}</p>
                      <p className="mt-1 text-xs font-medium text-[#64748B] dark:text-slate-300">{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid gap-3">
                {[
                  { title: 'AI-sensitive items', detail: '1 submission needs policy validation before strategy can sign off.', icon: Sparkles, accent: '#A855F7' },
                  { title: 'High-confidence lane', detail: '3 projects are ready to pass onward after governance checks.', icon: CheckCircle2, accent: '#10B981' },
                  { title: 'Clarification before QC', detail: '2 items should not enter QC until evidence gaps are closed.', icon: CircleAlert, accent: '#D97706' },
                ].map((item) => (
                  <div key={item.title} className="rounded-[22px] border border-[#DCE6F6] bg-white p-4 dark:border-white/10 dark:bg-white/5">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: `${item.accent}14`, color: item.accent }}>
                        <item.icon className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#0F172A] dark:text-white">{item.title}</p>
                        <p className="mt-1 text-sm leading-6 text-[#64748B] dark:text-slate-300">{item.detail}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <StrategyAiPanel title="AI Governance Lens">
          <div className="flex flex-1 flex-col justify-center space-y-3">
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
        </>
      )}
    </StrategyPageShell>
  )
}
