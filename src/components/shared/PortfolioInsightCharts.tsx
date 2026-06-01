import { Sparkles } from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { dashboardPalette } from '@/lib/dashboardPalette'
import { Card, CardContent } from '@/components/ui/card'
import type { PortfolioSummaryPayload } from '@/services/portfolioSummaryService'

type ChartKey = 'aiReviewFlags' | 'issues' | 'budgetConsideration'

interface PortfolioInsightChartsProps {
  summary: PortfolioSummaryPayload | null
  chartKeys?: ChartKey[]
}

type ChartDatum = {
  key: string
  label: string
  shortLabel: string
  count: number
  projectIds: string[]
  fill: string
}

const CHART_KEYS: ChartKey[] = ['aiReviewFlags', 'issues', 'budgetConsideration']
const DASHBOARD_SERIES = [
  dashboardPalette.primary,
  dashboardPalette.primarySoft,
  dashboardPalette.pipelineBlue,
  dashboardPalette.chartBlue,
  dashboardPalette.primaryMuted,
  dashboardPalette.primaryDark,
] as const

function shortenLabel(value: string, max = 20) {
  const trimmed = value.trim()
  if (trimmed.length <= max) return trimmed
  return `${trimmed.slice(0, max - 1).trimEnd()}...`
}

function ProjectIdTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const datum = payload[0]?.payload
  if (!datum) return null

  return (
    <div className="min-w-[220px] rounded-2xl border border-[#DCE6F1] bg-white/95 p-3 shadow-[0_18px_45px_rgba(15,23,42,0.14)] backdrop-blur dark:border-white/10 dark:bg-[#10203A]/95">
      <p className="text-xs font-semibold text-[#0F172A] dark:text-white">{label ?? datum.label}</p>
      <div className="mt-2 flex items-center justify-between gap-4 text-xs">
        <span className="inline-flex items-center gap-2 text-[#475569] dark:text-slate-200">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: datum.fill }} />
          Projects
        </span>
        <span className="font-semibold text-[#0F172A] dark:text-white">{datum.count}</span>
      </div>
      {datum.projectIds?.length > 0 ? (
        <div className="mt-3">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#64748B] dark:text-slate-400">
            Project IDs
          </p>
          <div className="flex flex-wrap gap-1">
            {datum.projectIds.map((id: string) => (
              <span
                key={id}
                className="rounded-full border border-[#D7E4F4] bg-[#F8FBFF] px-2 py-0.5 text-[11px] font-medium text-[#286CFF] dark:border-white/10 dark:bg-white/5 dark:text-[#BFDBFE]"
              >
                {id}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}

function DashboardInsightCard({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <Card
      title={description}
      className="overflow-hidden rounded-[28px] border-[#D9E6F5] bg-white shadow-none dark:border-white/10 dark:bg-[#162339]"
    >
      <CardContent className="flex h-full flex-col p-6">
        <div className="mb-5">
          <div className="flex flex-wrap items-center gap-2">
            <Sparkles className="h-5 w-5 shrink-0 text-[#A855F7]" />
            <h3 className="text-xl font-bold text-[#0F172A] dark:text-white">{title}</h3>
          </div>
          <p className="mt-1 text-sm text-[#64748B] dark:text-slate-100">{description}</p>
        </div>
        <div className="flex flex-1 flex-col justify-center">{children}</div>
      </CardContent>
    </Card>
  )
}

function buildAiReviewFlagData(summary: PortfolioSummaryPayload | null): ChartDatum[] {
  const source = summary?.portfolio_statistics?.ai_review_flags ?? summary?.ai_review_flags ?? {}

  return Object.entries(source)
    .map(([key, bucket], index) => ({
      key,
      label: key
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase()),
      shortLabel: shortenLabel(
        key
          .replace(/_/g, ' ')
          .replace(/\b\w/g, (char) => char.toUpperCase()),
        18
      ),
      count: bucket?.project_ids?.length ?? 0,
      projectIds: bucket?.project_ids ?? [],
      fill: DASHBOARD_SERIES[index % DASHBOARD_SERIES.length],
    }))
    .filter((entry) => entry.count > 0)
}

function buildIssueSeverityData(summary: PortfolioSummaryPayload | null): ChartDatum[] {
  const severity = summary?.portfolio_statistics?.issue_severity ?? {}
  return [
    {
      key: 'high',
      label: 'High',
      shortLabel: 'High',
      count: severity.high?.project_ids?.length ?? 0,
      projectIds: severity.high?.project_ids ?? [],
      fill: dashboardPalette.primaryDark,
    },
    {
      key: 'medium',
      label: 'Medium',
      shortLabel: 'Medium',
      count: severity.medium?.project_ids?.length ?? 0,
      projectIds: severity.medium?.project_ids ?? [],
      fill: dashboardPalette.primary,
    },
    {
      key: 'low',
      label: 'Low',
      shortLabel: 'Low',
      count: severity.low?.project_ids?.length ?? 0,
      projectIds: severity.low?.project_ids ?? [],
      fill: dashboardPalette.primarySoft,
    },
  ].filter((entry) => entry.count > 0)
}

function buildIssueCategoryData(summary: PortfolioSummaryPayload | null): ChartDatum[] {
  const categories = summary?.portfolio_statistics?.issue_categories ?? {}

  return Object.entries(categories)
    .map(([label, bucket], index) => ({
      key: label,
      label,
      shortLabel: shortenLabel(label, 22),
      count: bucket?.project_ids?.length ?? 0,
      projectIds: bucket?.project_ids ?? [],
      fill: DASHBOARD_SERIES[index % DASHBOARD_SERIES.length],
    }))
    .filter((entry) => entry.count > 0)
    .sort((left, right) => right.count - left.count)
    .slice(0, 6)
}

function buildBudgetConsiderationData(summary: PortfolioSummaryPayload | null): ChartDatum[] {
  const flags =
    summary?.calculation_sources?.budget_consideration_flag_project_ids ??
    summary?.portfolio_statistics?.ai_review_flags?.dge_budget_consideration_risk?.budget_consideration_flag_project_ids

  if (!flags) return []

  return [
    {
      key: 'has_potential_conflict',
      label: 'Potential Conflict',
      shortLabel: 'Conflict',
      count: flags.has_potential_conflict?.length ?? 0,
      projectIds: flags.has_potential_conflict ?? [],
      fill: dashboardPalette.primaryDark,
    },
    {
      key: 'has_coordination_required',
      label: 'Coordination Required',
      shortLabel: 'Coordination',
      count: flags.has_coordination_required?.length ?? 0,
      projectIds: flags.has_coordination_required ?? [],
      fill: dashboardPalette.primary,
    },
    {
      key: 'has_allowed_with_conditions',
      label: 'Allowed Conditions',
      shortLabel: 'Conditions',
      count: flags.has_allowed_with_conditions?.length ?? 0,
      projectIds: flags.has_allowed_with_conditions ?? [],
      fill: dashboardPalette.primarySoft,
    },
  ]
}

function AiReviewFlagsChart({ summary }: { summary: PortfolioSummaryPayload | null }) {
  const data = buildAiReviewFlagData(summary)

  return (
    <DashboardInsightCard
      title="AI Review Flags"
      description="Portfolio projects grouped by AI review-flag type."
    >
      {data.length > 0 ? (
        <div style={{ height: Math.max(230, data.length * 46 + 26) }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 4, right: 12, left: 0, bottom: 4 }}>
              <CartesianGrid horizontal={false} stroke="#EAF0F6" />
              <XAxis
                type="number"
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#64748B', fontSize: 12 }}
              />
              <YAxis
                type="category"
                dataKey="label"
                width={190}
                tickLine={false}
                axisLine={false}
                interval={0}
                tick={{ fill: '#475569', fontSize: 12 }}
              />
              <Tooltip content={<ProjectIdTooltip />} cursor={{ fill: '#F8FBFF' }} />
              <Bar dataKey="count" radius={[0, 10, 10, 0]} maxBarSize={30}>
                {data.map((entry) => (
                  <Cell key={entry.key} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="py-10 text-center text-sm text-[#64748B] dark:text-slate-300">No AI review flags in this portfolio yet.</p>
      )}
    </DashboardInsightCard>
  )
}

function IssuesChart({ summary }: { summary: PortfolioSummaryPayload | null }) {
  const severityData = buildIssueSeverityData(summary)
  const categoryData = buildIssueCategoryData(summary)

  return (
    <DashboardInsightCard
      title="Issues"
      description="Issue severity and category distribution across the entity portfolio."
    >
      {severityData.length > 0 || categoryData.length > 0 ? (
        <div className="grid gap-4 xl:grid-cols-[0.82fr_1.18fr]">
          <div className="rounded-[22px] border border-[#DCE8F6] bg-[#F8FBFF] p-4 dark:border-white/10 dark:bg-[#1B2A41]">
            <p className="mb-3 text-sm font-semibold text-[#0F172A] dark:text-white">Severity</p>
            {severityData.length > 0 ? (
              <>
                <div className="h-[185px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={severityData}
                        dataKey="count"
                        nameKey="label"
                        innerRadius={42}
                        outerRadius={68}
                        paddingAngle={3}
                        stroke="none"
                      >
                        {severityData.map((entry) => (
                          <Cell key={entry.key} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip content={<ProjectIdTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2">
                  {severityData.map((entry) => (
                    <div
                      key={entry.key}
                      className="flex items-center justify-between rounded-xl border border-[#DCE8F6] bg-white px-3 py-2 dark:border-white/10 dark:bg-[#162339]"
                    >
                      <span className="inline-flex items-center gap-2 text-sm text-[#475569] dark:text-slate-300">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.fill }} />
                        {entry.label}
                      </span>
                      <span className="text-sm font-semibold text-[#0F172A] dark:text-white">{entry.count}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="py-10 text-center text-sm text-[#64748B] dark:text-slate-300">No severity signals available.</p>
            )}
          </div>

          <div>
            <p className="mb-3 text-sm font-semibold text-[#0F172A] dark:text-white">Categories</p>
            {categoryData.length > 0 ? (
              <div style={{ height: Math.max(260, categoryData.length * 42 + 20) }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryData} layout="vertical" margin={{ top: 4, right: 12, left: 0, bottom: 4 }}>
                    <CartesianGrid horizontal={false} stroke="#EAF0F6" />
                    <XAxis
                      type="number"
                      allowDecimals={false}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: '#64748B', fontSize: 12 }}
                    />
                    <YAxis
                      type="category"
                      dataKey="label"
                      width={190}
                      tickLine={false}
                      axisLine={false}
                      interval={0}
                      tick={{ fill: '#475569', fontSize: 12 }}
                    />
                    <Tooltip content={<ProjectIdTooltip />} cursor={{ fill: '#F8FBFF' }} />
                    <Bar dataKey="count" radius={[0, 10, 10, 0]} maxBarSize={28}>
                      {categoryData.map((entry) => (
                        <Cell key={entry.key} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="py-10 text-center text-sm text-[#64748B] dark:text-slate-300">No issue categories available.</p>
            )}
          </div>
        </div>
      ) : (
        <p className="py-10 text-center text-sm text-[#64748B] dark:text-slate-300">No issue insights in the portfolio yet.</p>
      )}
    </DashboardInsightCard>
  )
}

function BudgetConsiderationChart({ summary }: { summary: PortfolioSummaryPayload | null }) {
  const data = buildBudgetConsiderationData(summary)

  return (
    <DashboardInsightCard
      title="Budget Consideration"
      description="Projects grouped by DGE budget consideration outcome."
    >
      {data.length > 0 ? (
        <div className="space-y-4">
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="#EAF0F6" strokeDasharray="3 3" />
                <XAxis
                  dataKey="shortLabel"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#64748B', fontSize: 12 }}
                />
                <YAxis
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#64748B', fontSize: 12 }}
                />
                <Tooltip content={<ProjectIdTooltip />} cursor={{ fill: '#F8FBFF' }} />
                <Bar dataKey="count" radius={[10, 10, 0, 0]} maxBarSize={46}>
                  {data.map((entry) => (
                    <Cell key={entry.key} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {data.map((entry) => (
              <div
                key={entry.key}
                className="rounded-[20px] border border-[#DCE8F6] bg-[#F8FBFF] p-4 dark:border-white/10 dark:bg-[#1B2A41]"
              >
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.fill }} />
                  <p className="text-sm font-semibold text-[#0F172A] dark:text-white">{entry.label}</p>
                </div>
                <p className="mt-2 text-2xl font-bold text-[#0F172A] dark:text-white">{entry.count}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="py-10 text-center text-sm text-[#64748B] dark:text-slate-300">No budget consideration flags in this portfolio yet.</p>
      )}
    </DashboardInsightCard>
  )
}

export function PortfolioInsightCharts({
  summary,
  chartKeys = CHART_KEYS,
}: PortfolioInsightChartsProps) {
  return (
    <>
      {chartKeys.includes('aiReviewFlags') && <AiReviewFlagsChart summary={summary} />}
      {chartKeys.includes('issues') && <IssuesChart summary={summary} />}
      {chartKeys.includes('budgetConsideration') && <BudgetConsiderationChart summary={summary} />}
    </>
  )
}
