import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BadgeCheck,
  ChevronDown,
  CircleAlert,
  Clock3,
  CopyPlus,
  Handshake,
  Info,
  MessageSquare,
  RefreshCcw,
  Scale,
  ShieldAlert,
  Sparkles,
  TriangleAlert,
} from 'lucide-react'
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
import { cn } from '@/lib/utils'
import type { Project } from '@/domain/types'
import type { PortfolioRole, PortfolioSummaryPayload } from '@/services/portfolioSummaryService'
import {
  getAiReviewFlags,
  getClarificationGroups,
  getPortfolioCounts,
  getPortfolioProjectInsight,
  getPortfolioSummaryRoleView,
  getRoleRecommendedActions,
  resolvePortfolioTemplate,
} from '@/services/portfolioSummaryService'

type Variant = 'dashboard' | 'projects' | 'detail'

interface AiPortfolioSummaryProps {
  role: PortfolioRole
  summary: PortfolioSummaryPayload | null
  loading: boolean
  error: string | null
  projects?: Project[]
  variant?: Variant
  title?: string
  projectHrefBuilder?: (projectId: string) => string
  currentProjectId?: string | null
}

const SEVERITY_CONFIG = {
  high: {
    label: 'High',
    sublabel: 'Highest signal',
    color: '#DC2626',
    bg: '#FEF2F2',
    border: '#FECACA',
    pill: 'border-red-200 bg-red-50 text-red-700 dark:border-red-700/30 dark:bg-red-900/20 dark:text-red-300',
  },
  medium: {
    label: 'Medium',
    sublabel: 'Watch closely',
    color: '#D97706',
    bg: '#FFFBEB',
    border: '#FDE68A',
    pill: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-700/30 dark:bg-amber-900/20 dark:text-amber-300',
  },
  low: {
    label: 'Low',
    sublabel: 'Lower signal',
    color: '#059669',
    bg: '#F0FDF4',
    border: '#BBF7D0',
    pill: 'border-green-200 bg-green-50 text-green-700 dark:border-green-700/30 dark:bg-green-900/20 dark:text-green-300',
  },
} as const

type IconComponent = React.ComponentType<{ className?: string }>

const FLAG_ICONS: Partial<Record<string, IconComponent>> = {
  evidence_risk: ShieldAlert,
  budget_accuracy_risk: Scale,
  strategic_alignment_risk: CircleAlert,
  dge_budget_consideration_risk: CopyPlus,
}

const FLAG_SEVERITY: Record<string, string> = {
  evidence_risk: 'Critical',
  budget_accuracy_risk: 'Warning',
  strategic_alignment_risk: 'Warning',
  dge_budget_consideration_risk: 'Info',
}

const FLAG_TITLE_FN: Record<string, (n: number) => string> = {
  evidence_risk: (n) => `${n} project${n !== 1 ? 's' : ''} flagged for incomplete or missing evidence.`,
  budget_accuracy_risk: (n) => `${n} project${n !== 1 ? 's' : ''} have budget accuracy risks.`,
  strategic_alignment_risk: (n) => `${n} project${n !== 1 ? 's' : ''} show weak strategic alignment justification.`,
  dge_budget_consideration_risk: (n) => `${n} project${n !== 1 ? 's' : ''} have DGE budget consideration exposure.`,
}

const AI_CHART_PALETTE = ['#6D28D9', '#8B5CF6', '#A855F7', '#C084FC', '#DDD6FE', '#E9D5FF'] as const
const RISK_CHART_COLORS = {
  high: '#7E22CE',
  medium: '#A855F7',
  low: '#D8B4FE',
} as const

function formatSectionHeading(value: string) {
  return value
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function formatFlagLabel(value: string) {
  return value
    .replace(/_/g, ' ')
    .replace(/\bhas\b/gi, '')
    .replace(/\bis\b/gi, '')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/\s{2,}/g, ' ')
    .trim()
}

function findProject(projectList: Project[], projectId: string) {
  const norm = projectId.trim().toUpperCase()
  return (
    projectList.find((p) => p.id.trim().toUpperCase() === norm) ??
    projectList.find((p) => p.ictBudgetId?.trim().toUpperCase() === norm) ??
    null
  )
}

function shortenLabel(value: string, max = 24) {
  const trimmed = value.trim()
  if (trimmed.length <= max) return trimmed
  return `${trimmed.slice(0, max - 1).trimEnd()}…`
}

function toDisplayText(value: unknown): string {
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (Array.isArray(value)) {
    return value
      .map((item) => toDisplayText(item))
      .filter(Boolean)
      .join(', ')
  }
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>
    if (typeof record.text_template === 'string') return record.text_template.trim()
    if (typeof record.value === 'string') return record.value.trim()
    if (typeof record.label === 'string') return record.label.trim()
  }
  return ''
}

function ChartCard({
  title,
  description,
  children,
  className,
}: {
  title: string
  description?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('min-w-0 overflow-hidden rounded-[22px] border border-[#E9D5FF] bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#1E293B]', className)}>
      <div className="mb-3">
        <p className="text-sm font-semibold tracking-[0.02em] text-[#0F172A] dark:text-white">{title}</p>
        {description ? (
          <p className="mt-1 text-xs text-[#64748B] dark:text-slate-400">{description}</p>
        ) : null}
      </div>
      {children}
    </div>
  )
}

function ChartTooltipCard({
  title,
  rows,
}: {
  title: string
  rows: Array<{ label: string; value: React.ReactNode; color?: string }>
}) {
  return (
    <div className="min-w-[180px] rounded-2xl border border-[#E9D5FF] bg-white/95 p-3 shadow-[0_18px_45px_rgba(15,23,42,0.14)] backdrop-blur dark:border-white/10 dark:bg-[#10203A]/95">
      <p className="text-xs font-semibold text-[#0F172A] dark:text-white">{title}</p>
      <div className="mt-2 space-y-1.5">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-4 text-xs">
            <span className="inline-flex items-center gap-2 text-[#475569] dark:text-slate-200">
              {row.color ? (
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: row.color }} />
              ) : null}
              {row.label}
            </span>
            <span className="font-semibold text-[#0F172A] dark:text-white">{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function RiskDistributionTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const entry = payload[0]
  return (
    <ChartTooltipCard
      title={entry.name}
      rows={[
        { label: 'Projects', value: entry.value, color: entry.payload.fill },
        { label: 'Share', value: `${entry.payload.share}%`, color: entry.payload.fill },
      ]}
    />
  )
}

function SimpleBarTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const entry = payload[0]
  return (
    <ChartTooltipCard
      title={label}
      rows={[{ label: 'Projects', value: entry.value, color: entry.color }]}
    />
  )
}

function SeverityPill({
  level,
  count,
}: {
  level: keyof typeof SEVERITY_CONFIG
  count: number
}) {
  if (count === 0) return null
  const cfg = SEVERITY_CONFIG[level]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold',
        cfg.pill
      )}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: cfg.color }}
      />
      {count} {cfg.label}
    </span>
  )
}

export function RiskLevelBadge({ riskLevel }: { riskLevel: 'High' | 'Medium' | 'Low' }) {
  const key = riskLevel.toLowerCase() as keyof typeof SEVERITY_CONFIG
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold',
        SEVERITY_CONFIG[key].pill
      )}
    >
      {riskLevel} Risk
    </span>
  )
}

function LoadingBlock({ compact }: { compact: boolean }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-[#E9D5FF] bg-gradient-to-br from-[#FDF7FF] to-white shadow-[0_8px_24px_rgba(168,85,247,0.06)] dark:border-white/10 dark:from-[#2A123D]/80 dark:to-[#1E293B]">
      <div className={cn('animate-pulse p-5', !compact && 'sm:p-6')}>
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 shrink-0 rounded-full bg-[#F0D9FF] dark:bg-white/10" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-36 rounded-full bg-[#F0D9FF] dark:bg-white/10" />
            <div className="h-3 w-full max-w-sm rounded-full bg-[#F0D9FF] dark:bg-white/10" />
          </div>
          <div className="h-5 w-16 rounded-full bg-[#F0D9FF] dark:bg-white/10" />
        </div>
        {!compact && (
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-20 rounded-2xl bg-[#F5EEFF] dark:bg-white/5"
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

function EmptyBlock({ message }: { message: string }) {
  return (
    <section className="rounded-2xl border border-dashed border-[#A855F726] bg-[#FDF8FF]/60 px-5 py-4 dark:border-white/10 dark:bg-white/5">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F5EEFF] dark:bg-white/10">
          <Sparkles className="h-4 w-4 text-[#A855F7] dark:text-[#E9D5FF]" />
        </div>
        <div>
          <p className="text-sm font-semibold text-[#0F172A] dark:text-white">AI Portfolio Intelligence</p>
          <p className="mt-0.5 text-xs text-[#64748B] dark:text-slate-400">{message}</p>
        </div>
      </div>
    </section>
  )
}

export function AiPortfolioSummary({
  role,
  summary,
  loading,
  error,
  projects = [],
  variant = 'dashboard',
  title = 'AI Portfolio Summary',
  projectHrefBuilder,
  currentProjectId,
}: AiPortfolioSummaryProps) {
  const compact = variant === 'projects'
  const [expanded, setExpanded] = useState(false)
  const [compactTab, setCompactTab] = useState<
    'overview' | 'flags' | 'actions' | 'aiReviewFlag' | 'recommendedAction' | 'dgeBudgetConsideration'
  >('aiReviewFlag')
  const dashboardHref =
    role === 'reviewer'
      ? '/reviewer/dashboard'
      : role === 'approver'
        ? '/approver/dashboard'
        : '/respondent/dashboard'

  const counts = useMemo(() => getPortfolioCounts(summary), [summary])
  const roleView = useMemo(() => getPortfolioSummaryRoleView(summary, role), [summary, role])
  const roleSummary = useMemo(
    () => toDisplayText(resolvePortfolioTemplate(roleView?.summary_template ?? roleView?.summary, summary)),
    [roleView?.summary_template, roleView?.summary, summary]
  )
  const planningSummary = useMemo(
    () => toDisplayText(resolvePortfolioTemplate(roleView?.planning_cycle_summary_template, summary)),
    [roleView?.planning_cycle_summary_template, summary]
  )
  const recommendedActions = useMemo(
    () => getRoleRecommendedActions(summary, role).map((action) => toDisplayText(action)).filter(Boolean),
    [summary, role]
  )
  const issueCategories = useMemo(
    () =>
      Object.entries(summary?.portfolio_statistics?.issue_categories ?? {})
        .map(([label, bucket]) => ({ label, count: bucket?.project_ids?.length ?? 0 }))
        .filter((e) => e.count > 0)
        .sort((a, b) => b.count - a.count),
    [summary]
  )
  const workflowStatuses = useMemo(
    () =>
      Object.entries(summary?.calculation_sources?.status_project_ids ?? {})
        .map(([label, ids]) => ({ label, count: ids.length }))
        .filter((e) => e.count > 0)
        .sort((a, b) => b.count - a.count)
        .slice(0, 6),
    [summary]
  )
  const clarificationBreakdown = useMemo(() => {
    const groups = getClarificationGroups(summary)
    return {
      alreadyRaised: groups.already_raised?.project_ids?.length ?? 0,
      potential: groups.potential_clarification?.project_ids?.length ?? 0,
      attentionTotal: groups.attention_union?.project_ids?.length ?? 0,
    }
  }, [summary])
  const focusProjects = useMemo(() => {
    const ids = roleView?.focus_projects ?? []
    return ids.map((projectId) => {
      const matched = findProject(projects, projectId)
      const insight = getPortfolioProjectInsight(summary, projectId, role)
      return {
        projectId,
        name: matched?.name ?? projectId,
        status: matched?.status ?? null,
        riskLevel: insight.riskLevel,
        issueCounts: insight.issueCounts,
        categories: insight.categories.slice(0, 3),
        href: projectHrefBuilder ? projectHrefBuilder(projectId) : null,
      }
    })
  }, [projectHrefBuilder, projects, role, roleView?.focus_projects, summary])
  const aiFlags = useMemo(
    () =>
      Object.entries(getAiReviewFlags(summary))
        .map(([key, bucket]) => ({
          key,
          label: formatFlagLabel(key),
          count: bucket?.project_ids?.length ?? 0,
          summary: toDisplayText(resolvePortfolioTemplate(bucket?.summary_template, summary)),
        }))
        .filter((e) => e.count > 0),
    [summary]
  )
  const budgetConsiderationItems = useMemo(() => {
    const source =
      summary?.calculation_sources?.budget_consideration_flag_project_ids ??
      summary?.portfolio_statistics?.ai_review_flags?.dge_budget_consideration_risk?.budget_consideration_flag_project_ids

    const summaryText = toDisplayText(resolvePortfolioTemplate(
      summary?.portfolio_statistics?.ai_review_flags?.dge_budget_consideration_risk?.summary_template,
      summary
    ))

    const groups = [
      {
        key: 'has_potential_conflict',
        label: 'Potential Conflict',
        icon: TriangleAlert,
        description: 'These projects may have direct overlap or policy conflict with DGE-managed scope.',
        projectIds: source?.has_potential_conflict ?? [],
        tone:
          'border-[#FECACA] bg-[#FEF2F2] text-[#B42318] dark:border-red-500/30 dark:bg-red-900/20 dark:text-red-300',
      },
      {
        key: 'has_coordination_required',
        label: 'Coordination Required',
        icon: Handshake,
        description: 'These projects can move forward, but DGE coordination is expected before final approval.',
        projectIds: source?.has_coordination_required ?? [],
        tone:
          'border-[#FDE68A] bg-[#FFF8E8] text-[#B45309] dark:border-[#B45309]/30 dark:bg-[#3A2810] dark:text-[#F6D28A]',
      },
      {
        key: 'has_allowed_with_conditions',
        label: 'Allowed With Conditions',
        icon: BadgeCheck,
        description: 'These projects appear supportable when the stated conditions are documented and satisfied.',
        projectIds: source?.has_allowed_with_conditions ?? [],
        tone:
          'border-[#BBF7D0] bg-[#EEF9F1] text-[#16A34A] dark:border-[#16A34A]/30 dark:bg-[#123123] dark:text-[#86EFAC]',
      },
    ]

    return { summaryText, groups }
  }, [summary])
  const currentProjectInsight = useMemo(
    () =>
      currentProjectId ? getPortfolioProjectInsight(summary, currentProjectId, role) : null,
    [currentProjectId, role, summary]
  )
  const riskChartData = useMemo(() => {
    const total = Math.max(counts.totalProjects, 1)
    return (['high', 'medium', 'low'] as const)
      .map((level) => {
        const count =
          level === 'high'
            ? counts.highRiskProjects
            : level === 'medium'
              ? counts.mediumRiskProjects
              : counts.lowRiskProjects
        return {
          key: level,
          name: `${SEVERITY_CONFIG[level].label} Risk`,
          value: count,
          share: Math.round((count / total) * 100),
          fill: RISK_CHART_COLORS[level],
        }
      })
      .filter((entry) => entry.value > 0)
  }, [counts.highRiskProjects, counts.lowRiskProjects, counts.mediumRiskProjects, counts.totalProjects])
  const clarificationChartData = useMemo(
    () => [
      {
        label: 'Already Raised',
        shortLabel: 'Raised',
        count: clarificationBreakdown.alreadyRaised,
        fill: '#7E22CE',
      },
      {
        label: 'Potential Clarification',
        shortLabel: 'Potential',
        count: clarificationBreakdown.potential,
        fill: '#A855F7',
      },
      {
        label: 'Needs Attention',
        shortLabel: 'Attention',
        count: clarificationBreakdown.attentionTotal,
        fill: '#D8B4FE',
      },
    ].filter((entry) => entry.count > 0),
    [clarificationBreakdown.alreadyRaised, clarificationBreakdown.attentionTotal, clarificationBreakdown.potential]
  )
  const workflowChartData = useMemo(
    () =>
      workflowStatuses.map((status, index) => ({
        label: formatSectionHeading(status.label),
        shortLabel: shortenLabel(formatSectionHeading(status.label), 18),
        count: status.count,
        fill: AI_CHART_PALETTE[index % AI_CHART_PALETTE.length],
      })),
    [workflowStatuses]
  )
  const issueCategoryChartData = useMemo(
    () =>
      issueCategories.slice(0, 6).map((category, index) => ({
        label: category.label,
        shortLabel: shortenLabel(category.label, 20),
        count: category.count,
        fill: AI_CHART_PALETTE[index % AI_CHART_PALETTE.length],
      })),
    [issueCategories]
  )
  const focusProjectChartData = useMemo(
    () =>
      [...focusProjects]
        .map((project) => {
          const totalIssues =
            project.issueCounts.high + project.issueCounts.medium + project.issueCounts.low
          return {
            ...project,
            shortLabel: shortenLabel(project.name, 26),
            totalIssues,
          }
        })
        .sort((left, right) => right.totalIssues - left.totalIssues)
        .slice(0, 8),
    [focusProjects]
  )

  const hasPriorityItems = counts.highRiskProjects > 0 || counts.clarificationOpen > 0 || aiFlags.length > 0

  if (loading) return <LoadingBlock compact={compact} />
  if (error) return <EmptyBlock message={error} />
  if (!summary)
    return (
      <EmptyBlock message="No portfolio intelligence record is available yet for this planning instance." />
    )

  /* ── DETAIL variant ─────────────────────────────────────────────── */
  if (variant === 'detail' && currentProjectId && currentProjectInsight) {
    const detailActions = recommendedActions.slice(0, 2)
    return (
      <section className="overflow-hidden rounded-2xl border border-[#E9D5FF] bg-gradient-to-br from-[#FDF7FF] to-white shadow-[0_8px_24px_rgba(168,85,247,0.07)] dark:border-white/10 dark:from-[#2A123D]/80 dark:to-[#1E293B]">
        <div className="flex items-center gap-3 border-b border-[#E9D5FF]/70 px-5 py-4 dark:border-white/10">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F5EEFF] dark:bg-[#A855F7]/20">
            <Sparkles className="h-4 w-4 text-[#A855F7] dark:text-[#E9D5FF]" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-[#0F172A] dark:text-white">AI Portfolio Context</p>
            <p className="text-xs text-[#64748B] dark:text-slate-400">
              Portfolio signals for this project in the current planning cycle
            </p>
          </div>
          {currentProjectInsight.riskLevel && (
            <RiskLevelBadge riskLevel={currentProjectInsight.riskLevel} />
          )}
        </div>

        <div className="grid gap-4 p-5 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="space-y-3">
            <div className="rounded-xl border border-[#F0D9FF] bg-white/80 p-4 dark:border-white/10 dark:bg-[#1E293B]/60">
              <p className="text-xs font-semibold tracking-[0.02em] text-[#A855F7] dark:text-[#E9D5FF]">
                {currentProjectInsight.isRoleFocusProject
                  ? 'Priority Focus Project'
                  : 'Portfolio Context'}
              </p>
              <p className="mt-2 text-sm leading-6 text-[#334155] dark:text-slate-300">
                {currentProjectInsight.isRoleFocusProject
                  ? 'This project is in the role-specific priority focus set for the current planning cycle. Review it first.'
                  : roleSummary ||
                    'This project is part of the AI-scored portfolio for the current planning instance.'}
              </p>
              {currentProjectInsight.categories.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {currentProjectInsight.categories.slice(0, 5).map((cat) => (
                    <span
                      key={cat}
                      className="rounded-full border border-[#E9D5FF] bg-[#FDF8FF] px-2.5 py-1 text-xs font-medium text-[#7C3AED] dark:border-white/10 dark:bg-white/5 dark:text-[#E9D5FF]"
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {(currentProjectInsight.activeFlags.length > 0 ||
              currentProjectInsight.budgetConsiderationFlags.length > 0) && (
              <div className="rounded-xl border border-[#A855F726] bg-[#FDF8FF]/80 p-3 dark:border-white/10 dark:bg-white/5">
                <p className="text-xs font-semibold tracking-[0.02em] text-[#A855F7] dark:text-[#E9D5FF]">
                  AI Flags on This Project
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {currentProjectInsight.activeFlags.map((flag) => (
                    <span
                      key={flag}
                      className="rounded-full border border-[#DDD6FE] bg-white px-2.5 py-1 text-xs font-semibold text-[#7C3AED] dark:border-white/10 dark:bg-[#1E293B] dark:text-[#E9D5FF]"
                    >
                      {formatFlagLabel(flag)}
                    </span>
                  ))}
                  {currentProjectInsight.budgetConsiderationFlags.map((flag) => (
                    <span
                      key={flag}
                      className="rounded-full border border-[#E9D5FF] bg-white px-2.5 py-1 text-xs font-medium text-[#64748B] dark:border-white/10 dark:bg-[#1E293B] dark:text-slate-300"
                    >
                      {formatFlagLabel(flag)}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="rounded-xl border border-[#F0D9FF] bg-white/80 p-4 dark:border-white/10 dark:bg-[#1E293B]/60">
              <p className="text-xs font-semibold tracking-[0.02em] text-[#A855F7] dark:text-[#E9D5FF]">
                Issue Breakdown
              </p>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {(['high', 'medium', 'low'] as const).map((level) => {
                  const cfg = SEVERITY_CONFIG[level]
                  const val = currentProjectInsight.issueCounts[level]
                  return (
                    <div
                      key={level}
                      className="rounded-xl border p-2.5 text-center"
                      style={{ backgroundColor: cfg.bg, borderColor: cfg.border }}
                    >
                      <p
                        className="text-xl font-bold leading-tight"
                        style={{ color: cfg.color }}
                      >
                        {val}
                      </p>
                      <p className="mt-0.5 text-xs font-medium" style={{ color: cfg.color }}>
                        {cfg.label}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>

            {detailActions.length > 0 && (
              <div className="rounded-xl border border-[#F0D9FF] bg-white/80 p-4 dark:border-white/10 dark:bg-[#1E293B]/60">
                <p className="text-xs font-semibold tracking-[0.02em] text-[#A855F7] dark:text-[#E9D5FF]">
                  Next Actions
                </p>
                <div className="mt-2 space-y-2">
                  {detailActions.map((action, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#A855F7]" />
                      <p className="text-xs leading-5 text-[#475569] dark:text-slate-300">
                        {action}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    )
  }

  /* ── PROJECTS variant (compact, tabbed) ────────────────────────── */
  if (compact) {
    const hasFlags = aiFlags.length > 0
    const hasActions = recommendedActions.length > 0
    const hasBudgetConsideration = budgetConsiderationItems.groups.some((group) => group.projectIds.length > 0)

    return (
      <section className="overflow-hidden rounded-[28px] border border-[#E9D5FF] bg-white dark:border-white/10 dark:bg-[#1E293B]">

        {/* ── Header ── */}
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex w-full items-start justify-between gap-4 bg-gradient-to-b from-[#FDF7FF] to-white px-6 py-5 text-left transition-colors hover:bg-white/30 dark:from-[#2A123D] dark:to-[#1E293B] dark:hover:bg-white/5"
        >
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#A855F7] text-white shadow-[0_12px_24px_rgba(168,85,247,0.24)]">
              <Sparkles className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-bold text-[#0F172A] dark:text-white">{title}</h2>
                {hasPriorityItems && (
                  <span className="rounded-full bg-[#FDF8FF] px-2.5 py-1 text-[11px] font-semibold text-[#A855F7] dark:bg-[#A855F7]/15 dark:text-[#E9D5FF]">
                    Action Required
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-[#475569] dark:text-slate-300">
                {roleSummary || 'Role-specific portfolio intelligence for the current planning cycle.'}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <div className="hidden items-center gap-3 text-xs sm:flex">
              <span className="text-[#64748B] dark:text-slate-400">
                <span className="font-bold text-[#0F172A] dark:text-white">{counts.totalProjects}</span> projects
              </span>
              {counts.highRiskProjects > 0 && (
                <span className="text-[#A855F7] dark:text-[#E9D5FF]">{counts.highRiskProjects} flagged</span>
              )}
            </div>
            <ChevronDown
              className={cn(
                'h-4 w-4 text-[#94A3B8] transition-transform dark:text-slate-400',
                expanded && 'rotate-180'
              )}
              aria-hidden="true"
            />
          </div>
        </button>

        {/* ── Expanded panel ── */}
        {expanded && (
          <div className="space-y-4 border-t border-[#E9D5FF] px-6 pb-3 pt-5 dark:border-white/10">
            <div className="flex flex-wrap items-center gap-2">
              {(
                [
                  { key: 'aiReviewFlag', label: hasFlags ? `AI Review Flag (${aiFlags.length})` : 'AI Review Flag' },
                  { key: 'recommendedAction', label: 'Recommended Action' },
                  { key: 'dgeBudgetConsideration', label: 'DGE Budget Consideration' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setCompactTab(tab.key)}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
                    compactTab === tab.key
                      ? 'border-[#A855F7] bg-[#A855F7] text-white'
                      : 'border-[#E9D5FF] bg-white text-[#64748B] hover:border-[#C084FC] hover:bg-[#FDF8FF] hover:text-[#A855F7] dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-[#E9D5FF]'
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* ── Tab: Overview ── */}
            {compactTab === 'overview' && (
              <div className="space-y-3 px-5 pb-5 pt-4">

                {/* All 3 charts in one row */}
                <div className="grid grid-cols-3 gap-3">

                  {/* Risk Distribution — donut */}
                  <div className="rounded-[16px] border border-[#E9D5FF] bg-white p-3 dark:border-white/10 dark:bg-[#1E293B]">
                    <p className="mb-1.5 text-xs font-semibold text-[#A855F7] dark:text-[#E9D5FF]">Risk</p>
                    {riskChartData.length > 0 ? (
                      <>
                        <div className="h-[120px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={riskChartData}
                                dataKey="value"
                                nameKey="name"
                                innerRadius={28}
                                outerRadius={46}
                                paddingAngle={3}
                                stroke="none"
                              >
                                {riskChartData.map((entry) => (
                                  <Cell key={entry.key} fill={entry.fill} />
                                ))}
                              </Pie>
                              <Tooltip content={<RiskDistributionTooltip />} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="mt-1.5 space-y-1.5">
                          {riskChartData.map((entry) => (
                            <div key={entry.key} className="flex items-center justify-between gap-1">
                              <span className="inline-flex items-center gap-1.5 text-xs text-[#475569] dark:text-slate-400">
                                <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: entry.fill }} />
                                <span className="truncate">{entry.name}</span>
                              </span>
                              <span className="shrink-0 text-xs font-bold text-[#0F172A] dark:text-white">{entry.value}</span>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <p className="py-6 text-center text-xs text-[#64748B] dark:text-slate-400">No data</p>
                    )}
                  </div>

                  {/* Clarification Status — vertical bar */}
                  <div className="rounded-[16px] border border-[#E9D5FF] bg-white p-3 dark:border-white/10 dark:bg-[#1E293B]">
                    <p className="mb-1.5 text-xs font-semibold text-[#A855F7] dark:text-[#E9D5FF]">Clarification</p>
                    {clarificationChartData.length > 0 ? (
                      <>
                        <div className="h-[120px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={clarificationChartData}
                              margin={{ top: 4, right: 2, left: -22, bottom: 0 }}
                            >
                              <CartesianGrid vertical={false} stroke="#F3E8FF" strokeDasharray="3 3" />
                              <XAxis
                                dataKey="shortLabel"
                                tickLine={false}
                                axisLine={false}
                                tick={{ fill: '#94A3B8', fontSize: 12 }}
                              />
                              <YAxis
                                allowDecimals={false}
                                tickLine={false}
                                axisLine={false}
                                tick={{ fill: '#94A3B8', fontSize: 12 }}
                              />
                              <Tooltip content={<SimpleBarTooltip />} cursor={{ fill: '#F5EEFF' }} />
                              <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={32}>
                                {clarificationChartData.map((entry) => (
                                  <Cell key={entry.label} fill={entry.fill} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="mt-1.5 space-y-1.5">
                          {clarificationChartData.map((entry) => (
                            <div key={entry.label} className="flex items-center justify-between gap-1">
                              <span className="inline-flex items-center gap-1.5 text-xs text-[#475569] dark:text-slate-400">
                                <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: entry.fill }} />
                                <span className="truncate">{entry.label}</span>
                              </span>
                              <span className="shrink-0 text-xs font-bold text-[#0F172A] dark:text-white">{entry.count}</span>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <p className="py-6 text-center text-xs text-[#64748B] dark:text-slate-400">None</p>
                    )}
                  </div>

                  {/* Issue Categories — horizontal bar */}
                  <div className="rounded-[16px] border border-[#E9D5FF] bg-white p-3 dark:border-white/10 dark:bg-[#1E293B]">
                    <p className="mb-1.5 text-xs font-semibold text-[#A855F7] dark:text-[#E9D5FF]">Issue Categories</p>
                    {issueCategoryChartData.length > 0 ? (
                      <div style={{ height: Math.max(120, issueCategoryChartData.slice(0, 5).length * 26 + 20) }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={issueCategoryChartData.slice(0, 5).map((e) => ({
                              ...e,
                              shortLabel: shortenLabel(e.label, 9),
                            }))}
                            layout="vertical"
                            margin={{ top: 0, right: 6, left: 0, bottom: 0 }}
                          >
                            <CartesianGrid horizontal={false} stroke="#F3E8FF" strokeDasharray="3 3" />
                            <XAxis
                              type="number"
                              allowDecimals={false}
                              tickLine={false}
                              axisLine={false}
                              tick={{ fill: '#94A3B8', fontSize: 12 }}
                            />
                            <YAxis
                              type="category"
                              dataKey="shortLabel"
                              width={58}
                              tickLine={false}
                              axisLine={false}
                              tick={{ fill: '#475569', fontSize: 12 }}
                            />
                            <Tooltip content={<SimpleBarTooltip />} cursor={{ fill: '#F5EEFF' }} />
                            <Bar dataKey="count" radius={[0, 6, 6, 0]} maxBarSize={20}>
                              {issueCategoryChartData.slice(0, 5).map((entry) => (
                                <Cell key={entry.label} fill={entry.fill} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <p className="py-6 text-center text-xs text-[#64748B] dark:text-slate-400">None</p>
                    )}
                  </div>
                </div>

                {/* Focus pills */}
                {focusProjects.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-semibold text-[#A855F7] dark:text-[#E9D5FF]">
                      {role === 'respondent' ? 'Your Focus' : role === 'reviewer' ? 'To Review' : 'For Decision'}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {focusProjects.slice(0, 4).map((project) => {
                        const pill = (
                          <>
                            <span className="max-w-[160px] truncate text-xs font-medium text-[#0F172A] dark:text-white">
                              {project.name}
                            </span>
                            {project.riskLevel && <RiskLevelBadge riskLevel={project.riskLevel} />}
                          </>
                        )
                        const cls = 'inline-flex items-center gap-1.5 rounded-full border border-[#E9D5FF] bg-white px-2.5 py-1 transition-colors hover:border-[#C084FC] hover:bg-[#FDF8FF] dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10'
                        return project.href ? (
                          <Link key={project.projectId} to={project.href} className={cls}>{pill}</Link>
                        ) : (
                          <span key={project.projectId} className={cls}>{pill}</span>
                        )
                      })}
                      {focusProjects.length > 4 && (
                        <span className="inline-flex items-center rounded-full border border-[#E9D5FF] bg-white px-2.5 py-1 text-xs text-[#64748B] dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
                          +{focusProjects.length - 4} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Tab: Flags ── */}
            {compactTab === 'aiReviewFlag' && (
              <div className="space-y-3">
                {hasFlags ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {aiFlags.map((flag) => {
                      const IconComp = FLAG_ICONS[flag.key] ?? ShieldAlert
                      const severityLabel = FLAG_SEVERITY[flag.key] ?? 'Warning'
                      return (
                        <div key={flag.key} className="flex items-start gap-3">
                          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F5EEFF] text-[#A855F7] dark:bg-[#A855F7]/15 dark:text-[#E9D5FF]">
                            <IconComp className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-semibold text-[#0F172A] dark:text-white">
                                {formatSectionHeading(flag.label)}:
                              </p>
                              <span className="rounded-full border border-[#E9D5FF] bg-[#FDF8FF] px-2 py-0.5 text-[11px] font-semibold text-[#A855F7] dark:border-white/10 dark:bg-white/5 dark:text-[#E9D5FF]">
                                {severityLabel}
                              </span>
                              <span className="rounded-full border border-[#E2E8F0] bg-white px-2 py-0.5 text-[11px] font-semibold text-[#475569] dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                                {flag.count} project{flag.count !== 1 ? 's' : ''}
                              </span>
                            </div>
                            {toDisplayText(flag.summary) && (
                              <p className="mt-1 text-sm leading-6 text-[#64748B] dark:text-slate-200">{toDisplayText(flag.summary)}</p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="py-3 text-center text-sm text-[#64748B] dark:text-slate-400">
                    No AI review flags detected for this portfolio.
                  </p>
                )}
              </div>
            )}

            {compactTab === 'recommendedAction' && (
              <div className="space-y-3">
                {hasActions ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {recommendedActions.slice(0, 6).map((action, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#A855F7] dark:text-[#E9D5FF]" aria-hidden="true" />
                        <span className="text-sm leading-6 text-[#475569] dark:text-slate-200">{action}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="py-3 text-center text-sm text-[#64748B] dark:text-slate-400">
                    No recommended actions at this time.
                  </p>
                )}
              </div>
            )}

            {compactTab === 'dgeBudgetConsideration' && (
              <div className="space-y-4">
                {budgetConsiderationItems.summaryText && (
                  <p className="text-sm leading-6 text-[#64748B] dark:text-slate-200">
                    {budgetConsiderationItems.summaryText}
                  </p>
                )}
                {hasBudgetConsideration ? (
                  <div className="grid gap-3 lg:grid-cols-3">
                    {budgetConsiderationItems.groups.map((group) => (
                      <div
                        key={group.key}
                        className="flex h-full flex-col rounded-2xl border border-[#EAF0F6] bg-white px-4 py-4 dark:border-white/10 dark:bg-white/5"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <group.icon className="h-4 w-4 shrink-0 text-[#A855F7] dark:text-[#E9D5FF]" />
                              <p className="text-sm font-semibold text-[#0F172A] dark:text-white">{group.label}</p>
                            </div>
                            <p className="mt-1 text-sm leading-6 text-[#64748B] dark:text-slate-200">
                              {group.description}
                            </p>
                          </div>
                          <span
                            className={cn(
                              'shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold',
                              group.projectIds.length > 0
                                ? group.tone
                                : 'border-[#E2E8F0] bg-white text-[#64748B] dark:border-white/10 dark:bg-white/5 dark:text-slate-300'
                            )}
                          >
                            {group.projectIds.length}
                          </span>
                        </div>

                        <div className="mt-4">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#64748B] dark:text-slate-400">
                            Affected Projects
                          </p>
                          {group.projectIds.length > 0 ? (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {group.projectIds.map((projectId) => {
                                const href = projectHrefBuilder ? projectHrefBuilder(projectId) : null
                                const project = findProject(projects, projectId)
                                const label = project?.id ?? projectId
                                const cls =
                                  'rounded-full border border-[#D7E4F4] bg-[#F8FBFF] px-2.5 py-1 text-[11px] font-medium text-[#286CFF] transition-colors hover:border-[#A855F7] hover:text-[#A855F7] dark:border-white/10 dark:bg-white/5 dark:text-[#BFDBFE] dark:hover:text-[#E9D5FF]'
                                return href ? (
                                  <Link key={projectId} to={href} className={cls}>
                                    {label}
                                  </Link>
                                ) : (
                                  <span key={projectId} className={cls}>
                                    {label}
                                  </span>
                                )
                              })}
                            </div>
                          ) : (
                            <p className="mt-2 text-sm text-[#94A3B8] dark:text-slate-500">
                              No projects in this group.
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="py-3 text-center text-sm text-[#64748B] dark:text-slate-400">
                    No DGE budget consideration items detected for this portfolio.
                  </p>
                )}
              </div>
            )}

            {compactTab === 'flags' && (
              <div className="px-5 pb-5 pt-4">
                {hasFlags ? (
                  <div className="space-y-2">
                    {aiFlags.map((flag) => {
                      const IconComp = FLAG_ICONS[flag.key] ?? ShieldAlert
                      const severityLabel = FLAG_SEVERITY[flag.key] ?? 'Warning'
                      const titleText =
                        FLAG_TITLE_FN[flag.key]?.(flag.count) ??
                        `${flag.count} project${flag.count !== 1 ? 's' : ''} flagged for ${flag.label.toLowerCase()}.`
                      return (
                        <div
                          key={flag.key}
                          className="flex items-start justify-between gap-3 rounded-[14px] border border-[#F0D9FF] bg-[#FDF8FF]/70 px-3 py-3 transition-colors hover:border-[#C084FC] hover:bg-[#FDF8FF] dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                        >
                          <div className="flex items-start gap-2.5">
                            <div className="mt-0.5 shrink-0 text-[#A855F7]">
                              <IconComp className="h-3.5 w-3.5" />
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-[#0F172A] dark:text-white">{titleText}</p>
                              {toDisplayText(flag.summary) && (
                                <p className="mt-0.5 text-[11px] leading-4 text-[#64748B] dark:text-slate-400">{toDisplayText(flag.summary)}</p>
                              )}
                            </div>
                          </div>
                          <span className="shrink-0 rounded-full bg-[#FDF8FF] px-2 py-0.5 text-[10px] font-semibold text-[#A855F7] dark:bg-[#A855F7]/15 dark:text-[#E9D5FF]">
                            {severityLabel}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="py-3 text-center text-sm text-[#64748B] dark:text-slate-400">
                    No AI flags detected for this portfolio.
                  </p>
                )}
              </div>
            )}

            {/* ── Tab: Actions ── */}
            {compactTab === 'actions' && (
              <div className="px-5 pb-5 pt-4 space-y-2">
                {hasActions ? (
                  recommendedActions.slice(0, 4).map((action, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2.5 rounded-[14px] border border-[#F0D9FF] bg-[#FDF8FF]/60 px-3 py-3 dark:border-white/10 dark:bg-white/5"
                    >
                      <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#A855F7]" aria-hidden="true" />
                      <p className="text-xs leading-5 text-[#475569] dark:text-slate-300">{action}</p>
                    </div>
                  ))
                ) : (
                  <p className="py-3 text-center text-sm text-[#64748B] dark:text-slate-400">
                    No recommended actions at this time.
                  </p>
                )}
              </div>
            )}

            {/* ── View Full Analysis (always visible) ── */}
            <div className="px-5 pb-4 pt-3">
              <Link
                to={dashboardHref}
                className="flex w-full items-center justify-center gap-2 rounded-[16px] border border-[#E9D5FF] bg-[#FDF8FF] px-4 py-3 text-sm font-semibold text-[#A855F7] shadow-sm transition-colors hover:border-[#C084FC] hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-[#E9D5FF] dark:hover:bg-white/10"
              >
                View Full AI Portfolio Summary
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

          </div>
        )}
      </section>
    )
  }

  /* ── DASHBOARD variant (full) ──────────────────────────────────── */
  const dashboardActions = recommendedActions.slice(0, 5)

  return (
    <section
      title="AI scans all projects for quality gaps, documentation issues, budget anomalies, and strategic alignment concerns to guide review priorities."
      className="overflow-hidden rounded-[28px] border border-[#E9D5FF] bg-white dark:border-white/10 dark:bg-[#1E293B]"
    >
      {/* ── Header button ── */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-start justify-between gap-4 bg-gradient-to-b from-[#FDF7FF] to-white px-6 py-5 text-left transition-colors hover:bg-white/30 dark:from-[#2A123D] dark:to-[#1E293B] dark:hover:bg-white/5"
      >
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#A855F7] text-white shadow-[0_16px_30px_rgba(168,85,247,0.24)]">
            <Sparkles className="h-6 w-6" aria-hidden="true" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold text-[#0F172A] dark:text-white">{title}</h2>
              <span className="group relative inline-flex">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-[#D7E4F4] bg-white/80 text-[#64748B] transition-colors hover:border-[#286CFF] hover:text-[#286CFF] dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:hover:border-[#4F98FF] dark:hover:text-white">
                  <Info className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
                <span className="pointer-events-none absolute left-1/2 top-full z-30 mt-2 w-64 -translate-x-1/2 rounded-2xl border border-[#DCE6F1] bg-white/95 px-3 py-2 text-xs leading-5 text-[#475569] opacity-0 shadow-[0_18px_45px_rgba(15,23,42,0.14)] transition-all duration-200 group-hover:translate-y-1 group-hover:opacity-100 dark:border-white/10 dark:bg-[#10203A]/95 dark:text-slate-100">
                  AI scans all submitted projects for quality gaps, documentation issues, budget anomalies, duplicate scope, and strategic alignment concerns to guide review priorities.
                </span>
              </span>
              {hasPriorityItems && (
                <span className="inline-flex items-center rounded-full bg-[#FDF8FF] px-2.5 py-1 text-xs font-semibold text-[#A855F7] dark:bg-[#A855F7]/15 dark:text-[#E9D5FF]">
                  Action Required
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-[#475569] dark:text-slate-100">
              {roleSummary || 'AI portfolio intelligence for the current planning cycle.'}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-4">
          <div className="hidden items-center gap-4 text-sm md:flex">
            <span className="text-[#0F172A] dark:text-white">
              {counts.totalProjects}{' '}
              <span className="text-[#64748B] dark:text-slate-100">projects</span>
            </span>
            {counts.highRiskProjects > 0 && (
              <span className="text-[#A855F7] dark:text-[#E9D5FF]">
                {counts.highRiskProjects}{' '}
                <span className="text-[#64748B] dark:text-slate-100">high risk</span>
              </span>
            )}
            {counts.clarificationOpen > 0 && (
              <span className="text-[#C084FC] dark:text-[#E9D5FF]">
                {counts.clarificationOpen}{' '}
                <span className="text-[#64748B] dark:text-slate-100">
                  clarification{counts.clarificationOpen !== 1 ? 's' : ''}
                </span>
              </span>
            )}
            <RefreshCcw className="h-4 w-4 text-[#64748B] dark:text-slate-100" aria-hidden="true" />
          </div>
          <ChevronDown
            className={cn(
              'h-5 w-5 text-[#64748B] transition-transform dark:text-slate-100',
              expanded && 'rotate-180'
            )}
            aria-hidden="true"
          />
        </div>
      </button>

      {/* ── Expanded content ── */}
      {expanded && (
        <div className="border-t border-[#E9D5FF] px-6 pb-6 pt-5 dark:border-white/10 space-y-4">

          {/* ── 1. Planning cycle ── */}
          

          {/* ── 2. AI Review Flags (full width) ── */}
          {aiFlags.length > 0 && (
            <div className="px-1">
              <h3 className="text-base font-semibold text-[#0F172A] dark:text-white">AI Review Flags</h3>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                {aiFlags.map((flag) => {
                  const IconComp = FLAG_ICONS[flag.key] ?? ShieldAlert
                  const severityLabel = FLAG_SEVERITY[flag.key] ?? 'Warning'
                  return (
                    <div key={flag.key} className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F5EEFF] text-[#A855F7] dark:bg-[#A855F7]/15 dark:text-[#E9D5FF]">
                        <IconComp className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-[#0F172A] dark:text-white">
                            {formatSectionHeading(flag.label)}:
                          </p>
                          <span className="rounded-full border border-[#E9D5FF] bg-[#FDF8FF] px-2 py-0.5 text-[11px] font-semibold text-[#A855F7] dark:border-white/10 dark:bg-white/5 dark:text-[#E9D5FF]">
                            {severityLabel}
                          </span>
                        </div>
                        {toDisplayText(flag.summary) && (
                          <p className="mt-1 text-sm leading-6 text-[#64748B] dark:text-slate-200">{toDisplayText(flag.summary)}</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── 3. Recommended Actions (full width) ── */}
          {dashboardActions.length > 0 && (
            <div className="px-1">
              <h3 className="text-base font-semibold text-[#0F172A] dark:text-white">
                {role === 'respondent'
                  ? 'Recommended Actions'
                  : role === 'reviewer'
                    ? 'Recommended Review Actions'
                    : 'Recommended Decision Actions'}
              </h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {dashboardActions.map((action, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <Sparkles
                      className="mt-0.5 h-4 w-4 shrink-0 text-[#A855F7] dark:text-[#E9D5FF]"
                      aria-hidden="true"
                    />
                    <span className="text-sm leading-6 text-[#475569] dark:text-slate-200">{action}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── 4. Charts 2×2 grid ── */}
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Risk Distribution */}
            <ChartCard
              title="Risk Distribution"
              description={`${counts.totalProjects} projects · risk breakdown`}
            >
              {riskChartData.length > 0 ? (
                <div className="space-y-3">
                  <div className="h-[180px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={riskChartData}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={48}
                          outerRadius={72}
                          paddingAngle={3}
                          stroke="none"
                        >
                          {riskChartData.map((entry) => (
                            <Cell key={entry.key} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip content={<RiskDistributionTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-1.5">
                    {riskChartData.map((entry) => (
                      <div
                        key={entry.key}
                        className="flex items-center justify-between rounded-xl border border-[#F0D9FF] bg-[#FDF8FF]/60 px-3 py-2 dark:border-white/10 dark:bg-white/5"
                      >
                        <span className="inline-flex items-center gap-2 text-sm text-[#475569] dark:text-slate-300">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.fill }} />
                          {entry.name}
                        </span>
                        <span className="text-sm font-semibold text-[#0F172A] dark:text-white">
                          {entry.value} · {entry.share}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="py-4 text-sm text-[#64748B] dark:text-slate-300">No risk signals yet.</p>
              )}
            </ChartCard>

            {/* Workflow Pipeline */}
            {workflowStatuses.length > 0 && (
              <ChartCard
                title="Workflow Pipeline"
                description="Projects by workflow stage"
              >
                <div style={{ height: Math.max(180, workflowChartData.length * 40 + 20) }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={workflowChartData}
                      layout="vertical"
                      margin={{ top: 4, right: 12, left: 0, bottom: 4 }}
                    >
                      <CartesianGrid horizontal={false} stroke="#F3E8FF" />
                      <XAxis
                        type="number"
                        allowDecimals={false}
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: '#64748B', fontSize: 12 }}
                      />
                      <YAxis
                        type="category"
                        dataKey="shortLabel"
                        width={88}
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: '#475569', fontSize: 12 }}
                      />
                      <Tooltip content={<SimpleBarTooltip />} cursor={{ fill: '#F5EEFF' }} />
                      <Bar dataKey="count" radius={[0, 8, 8, 0]} maxBarSize={28}>
                        {workflowChartData.map((entry) => (
                          <Cell key={entry.label} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>
            )}

            {/* Issue Categories */}
            {issueCategories.length > 0 && (
              <ChartCard
                title="Issue Categories"
                description="Top issue groups across the portfolio"
              >
                <div style={{ height: Math.max(180, issueCategoryChartData.length * 40 + 20) }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={issueCategoryChartData}
                      layout="vertical"
                      margin={{ top: 4, right: 12, left: 0, bottom: 4 }}
                    >
                      <CartesianGrid horizontal={false} stroke="#F3E8FF" />
                      <XAxis
                        type="number"
                        allowDecimals={false}
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: '#64748B', fontSize: 12 }}
                      />
                      <YAxis
                        type="category"
                        dataKey="shortLabel"
                        width={104}
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: '#475569', fontSize: 12 }}
                      />
                      <Tooltip content={<SimpleBarTooltip />} cursor={{ fill: '#F5EEFF' }} />
                      <Bar dataKey="count" radius={[0, 8, 8, 0]} maxBarSize={28}>
                        {issueCategoryChartData.map((entry) => (
                          <Cell key={entry.label} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>
            )}

          {/* ── 5. Priority Focus (compact pills) ── */}
          {focusProjects.length > 0 && (
            <div className="rounded-[22px] border border-[#E9D5FF] bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#1E293B]">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-sm font-semibold tracking-[0.02em] text-[#0F172A] dark:text-white">
                  Your Priority Focus
                </p>
                {focusProjects.length > 5 && (
                  <span className="text-xs text-[#64748B] dark:text-slate-400">
                    Showing 5 of {focusProjects.length}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {focusProjectChartData.slice(0, 5).map((project) => {
                  const pill = (
                    <>
                      <span className="max-w-[200px] truncate text-sm font-medium text-[#0F172A] dark:text-white">
                        {project.name}
                      </span>
                      {project.riskLevel && <RiskLevelBadge riskLevel={project.riskLevel} />}
                    </>
                  )
                  const pillClass =
                    'inline-flex items-center gap-2 rounded-full border border-[#E9D5FF] bg-[#FDF8FF] px-3 py-1.5 dark:border-white/10 dark:bg-white/5'
                  if (project.href) {
                    return (
                      <Link
                        key={project.projectId}
                        to={project.href}
                        className={cn(pillClass, 'transition-colors hover:border-[#C084FC] hover:bg-white dark:hover:bg-white/10')}
                      >
                        {pill}
                      </Link>
                    )
                  }
                  return (
                    <span key={project.projectId} className={pillClass}>
                      {pill}
                    </span>
                  )
                })}
                {focusProjects.length > 5 && (
                  <span className="inline-flex items-center rounded-full border border-[#E9D5FF] bg-[#FDF8FF] px-3 py-1.5 text-xs text-[#64748B] dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
                    +{focusProjects.length - 5} more
                  </span>
                )}
              </div>
            </div>
          )}
          </div>

        </div>
      )}
    </section>
  )
}
