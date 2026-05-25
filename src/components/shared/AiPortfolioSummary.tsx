import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  ChevronDown,
  CircleAlert,
  Clock3,
  CopyPlus,
  Info,
  MessageSquare,
  RefreshCcw,
  Scale,
  ShieldAlert,
  Sparkles,
} from 'lucide-react'
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
  const dashboardHref =
    role === 'reviewer'
      ? '/reviewer/dashboard'
      : role === 'approver'
        ? '/approver/dashboard'
        : '/respondent/dashboard'

  const counts = useMemo(() => getPortfolioCounts(summary), [summary])
  const roleView = useMemo(() => getPortfolioSummaryRoleView(summary, role), [summary, role])
  const roleSummary = useMemo(
    () => resolvePortfolioTemplate(roleView?.summary_template ?? roleView?.summary, summary),
    [roleView?.summary_template, roleView?.summary, summary]
  )
  const planningSummary = useMemo(
    () => resolvePortfolioTemplate(roleView?.planning_cycle_summary_template, summary),
    [roleView?.planning_cycle_summary_template, summary]
  )
  const recommendedActions = useMemo(
    () => getRoleRecommendedActions(summary, role),
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
          summary: resolvePortfolioTemplate(bucket?.summary_template, summary),
        }))
        .filter((e) => e.count > 0),
    [summary]
  )
  const currentProjectInsight = useMemo(
    () =>
      currentProjectId ? getPortfolioProjectInsight(summary, currentProjectId, role) : null,
    [currentProjectId, role, summary]
  )

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
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#A855F7] dark:text-[#E9D5FF]">
                {currentProjectInsight.isRoleFocusProject
                  ? 'Priority focus project'
                  : 'Portfolio context'}
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
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#A855F7] dark:text-[#E9D5FF]">
                  AI flags on this project
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
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#A855F7] dark:text-[#E9D5FF]">
                Issue breakdown
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
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#A855F7] dark:text-[#E9D5FF]">
                  Next actions
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

  /* ── PROJECTS variant (compact) ────────────────────────────────── */
  if (compact) {
    return (
      <section className="overflow-hidden rounded-2xl border border-[#E9D5FF] bg-gradient-to-br from-[#FDF7FF] to-white shadow-[0_4px_16px_rgba(168,85,247,0.05)] dark:border-white/10 dark:from-[#2A123D]/70 dark:to-[#1E293B]">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex w-full items-center gap-3 px-5 py-4 text-left"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F5EEFF] dark:bg-[#A855F7]/20">
            <Sparkles className="h-4 w-4 text-[#A855F7] dark:text-[#E9D5FF]" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-bold text-[#0F172A] dark:text-white">{title}</p>
              <span className="rounded-full border border-[#A855F726] bg-[#FDF8FF] px-2 py-0.5 text-xs font-semibold text-[#A855F7] dark:border-white/10 dark:bg-white/5 dark:text-[#E9D5FF]">
                Live
              </span>
            </div>
            <p className="mt-0.5 line-clamp-1 text-xs text-[#64748B] dark:text-slate-400">
              {roleSummary ||
                'Role-specific portfolio intelligence for the current planning cycle.'}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <SeverityPill level="high" count={counts.highRiskProjects} />
            {counts.clarificationOpen > 0 && (
              <span className="hidden items-center gap-1.5 rounded-full border border-[#DBEAFE] bg-[#EFF6FF] px-2.5 py-1 text-xs font-semibold text-[#2563EB] sm:inline-flex dark:border-white/10 dark:bg-white/5 dark:text-blue-300">
                <MessageSquare className="h-3 w-3" />
                {counts.clarificationOpen}
              </span>
            )}
            <ChevronDown
              className={cn(
                'h-4 w-4 text-[#94A3B8] transition-transform dark:text-slate-400',
                expanded && 'rotate-180'
              )}
            />
          </div>
        </button>

        {expanded && (
          <div className="border-t border-[#E9D5FF]/70 px-5 pb-5 pt-4 dark:border-white/10">
            {/* Quick stats as pills */}
            <div className="mb-4 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E9D5FF] bg-white px-2.5 py-1 text-xs font-medium text-[#475569] dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                <span className="font-bold text-[#0F172A] dark:text-white">{counts.totalProjects}</span>
                Projects
              </span>
              {counts.highRiskProjects > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E9D5FF] bg-white px-2.5 py-1 text-xs font-medium text-[#475569] dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#DC2626]" />
                  <span className="font-bold text-[#0F172A] dark:text-white">{counts.highRiskProjects}</span>
                  High Risk
                </span>
              )}
              {counts.mediumRiskProjects > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E9D5FF] bg-white px-2.5 py-1 text-xs font-medium text-[#475569] dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#D97706]" />
                  <span className="font-bold text-[#0F172A] dark:text-white">{counts.mediumRiskProjects}</span>
                  Medium
                </span>
              )}
              {clarificationBreakdown.attentionTotal > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E9D5FF] bg-white px-2.5 py-1 text-xs font-medium text-[#475569] dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                  <MessageSquare className="h-3 w-3 text-[#A855F7]" />
                  <span className="font-bold text-[#0F172A] dark:text-white">{clarificationBreakdown.attentionTotal}</span>
                  Clarifications
                </span>
              )}
            </div>

            {/* Issue categories */}
            {issueCategories.length > 0 && (
              <div className="mb-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.06em] text-[#A855F7] dark:text-[#E9D5FF]">
                  Issue Categories
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {issueCategories.slice(0, 5).map((cat) => (
                    <span
                      key={cat.label}
                      className="inline-flex items-center gap-1.5 rounded-full border border-[#E9D5FF] bg-white px-2.5 py-1 text-xs font-medium text-[#475569] dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
                    >
                      <span className="font-bold text-[#A855F7] dark:text-[#E9D5FF]">{cat.count}</span>
                      {cat.label}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Top 2 focus projects */}
            {focusProjects.length > 0 && (
              <div className="mb-4 space-y-1.5">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.06em] text-[#A855F7] dark:text-[#E9D5FF]">
                  Priority Focus
                </p>
                {focusProjects.slice(0, 2).map((project) => {
                  const inner = (
                    <>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-[#0F172A] dark:text-white">
                          {project.name}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-[#64748B] dark:text-slate-400">
                          {project.projectId}
                          {project.status ? ` · ${project.status}` : ''}
                        </p>
                      </div>
                      {project.riskLevel && <RiskLevelBadge riskLevel={project.riskLevel} />}
                    </>
                  )
                  if (project.href) {
                    return (
                      <Link
                        key={project.projectId}
                        to={project.href}
                        className="flex items-center gap-3 rounded-[16px] border border-[#F0D9FF] bg-white px-3 py-2.5 transition-colors hover:bg-[#FDF8FF] dark:border-white/10 dark:bg-white/5"
                      >
                        {inner}
                      </Link>
                    )
                  }
                  return (
                    <div
                      key={project.projectId}
                      className="flex items-center gap-3 rounded-[16px] border border-[#F0D9FF] bg-white px-3 py-2.5 dark:border-white/10 dark:bg-white/5"
                    >
                      {inner}
                    </div>
                  )
                })}
              </div>
            )}

            {/* Top action */}
            {recommendedActions[0] && (
              <div className="mb-4 flex items-start gap-2 rounded-xl border border-[#A855F726] bg-[#FDF8FF]/80 px-3 py-3 dark:border-white/10 dark:bg-white/5">
                <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#A855F7]" />
                <p className="text-xs leading-5 text-[#475569] dark:text-slate-300">{recommendedActions[0]}</p>
              </div>
            )}

            {/* View Full Analysis */}
            <Link
              to={dashboardHref}
              className="flex w-full items-center justify-center gap-2 rounded-[16px] border border-[#E9D5FF] bg-white px-4 py-3 text-sm font-semibold text-[#A855F7] transition-colors hover:bg-[#FDF8FF] dark:border-white/10 dark:bg-white/5 dark:text-[#E9D5FF] dark:hover:bg-white/10"
            >
              View Full Portfolio Analysis
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </section>
    )
  }

  /* ── DASHBOARD variant (full) ──────────────────────────────────── */
  const dashboardActions = recommendedActions.slice(0, 5)
  const hasPriorityItems = counts.highRiskProjects > 0 || counts.clarificationOpen > 0 || aiFlags.length > 0

  return (
    <section
      title="AI scans all projects for quality gaps, documentation issues, budget anomalies, and strategic alignment concerns to guide review priorities."
      className="overflow-hidden rounded-[28px] border border-[#E9D5FF] bg-gradient-to-b from-[#FDF7FF] to-white shadow-[0_12px_30px_rgba(15,23,42,0.06)] dark:border-white/10 dark:from-[#2A123D] dark:to-[#1E293B]"
    >
      {/* ── Header button ── */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-start justify-between gap-4 px-6 py-5 text-left transition-colors hover:bg-white/30 dark:hover:bg-white/5"
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
          {/* Planning cycle banner */}
          {planningSummary && (
            <div className="flex items-start gap-3 rounded-[22px] border border-[#E9D5FF] bg-white px-4 py-4 shadow-sm dark:border-white/10 dark:bg-[#1E293B]">
              <div className="mt-0.5 shrink-0 text-[#A855F7]">
                <Clock3 className="h-4 w-4" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[#0F172A] dark:text-white">Planning Cycle</p>
                <p className="mt-1 text-sm text-[#64748B] dark:text-slate-100">{planningSummary}</p>
              </div>
              {summary?.instance_context?.planning_end_date && (
                <span className="shrink-0 rounded-full border border-[#E9D5FF] bg-white/80 px-2.5 py-0.5 text-xs font-semibold text-[#64748B] dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                  Due {summary.instance_context.planning_end_date}
                </span>
              )}
            </div>
          )}

          {/* 2-column grid */}
          <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
            {/* LEFT column */}
            <div className="space-y-4">
              {/* Risk Distribution */}
              <div className="rounded-[22px] border border-[#E9D5FF] bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#1E293B]">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.06em] text-[#A855F7] dark:text-[#E9D5FF]">
                  Risk Distribution
                </p>
                {counts.totalProjects > 0 && (
                  <div className="mb-3 flex h-2 w-full overflow-hidden rounded-full bg-[#F5EEFF] dark:bg-white/10">
                    {(['high', 'medium', 'low'] as const).map((level) => {
                      const val =
                        level === 'high'
                          ? counts.highRiskProjects
                          : level === 'medium'
                            ? counts.mediumRiskProjects
                            : counts.lowRiskProjects
                      const pct = Math.round((val / counts.totalProjects) * 100)
                      const colors = { high: '#DC2626', medium: '#D97706', low: '#059669' }
                      return pct > 0 ? (
                        <div key={level} style={{ width: `${pct}%`, backgroundColor: colors[level] }} />
                      ) : null
                    })}
                  </div>
                )}
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                  {(['high', 'medium', 'low'] as const).map((level) => {
                    const cfg = SEVERITY_CONFIG[level]
                    const val =
                      level === 'high'
                        ? counts.highRiskProjects
                        : level === 'medium'
                          ? counts.mediumRiskProjects
                          : counts.lowRiskProjects
                    return (
                      <div key={level} className="flex items-center gap-1.5">
                        <span
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ backgroundColor: cfg.color }}
                        />
                        <span className="text-sm font-bold text-[#0F172A] dark:text-white">{val}</span>
                        <span className="text-xs text-[#64748B] dark:text-slate-400">{cfg.label}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Clarification Status */}
              <div className="rounded-[22px] border border-[#E9D5FF] bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#1E293B]">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.06em] text-[#A855F7] dark:text-[#E9D5FF]">
                  Clarification Status
                </p>
                <div className="space-y-2.5">
                  {[
                    { label: 'Already Raised', count: clarificationBreakdown.alreadyRaised, dot: '#DC2626' },
                    { label: 'Potential', count: clarificationBreakdown.potential, dot: '#D97706' },
                    { label: 'Total Attention', count: clarificationBreakdown.attentionTotal, dot: '#A855F7' },
                  ].map((row) => (
                    <div key={row.label} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ backgroundColor: row.dot }}
                        />
                        <span className="text-sm text-[#475569] dark:text-slate-300">{row.label}</span>
                      </div>
                      <span className="rounded-full border border-[#E9D5FF] bg-[#FDF8FF] px-2.5 py-0.5 text-xs font-bold text-[#7C3AED] dark:border-white/10 dark:bg-white/5 dark:text-[#E9D5FF]">
                        {row.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Workflow pipeline */}
              {workflowStatuses.length > 0 && (
                <div className="rounded-[22px] border border-[#E9D5FF] bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#1E293B]">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.06em] text-[#A855F7] dark:text-[#E9D5FF]">
                    Workflow Pipeline
                  </p>
                  <div className="space-y-2.5">
                    {workflowStatuses.map((s) => {
                      const pct =
                        counts.totalProjects > 0
                          ? Math.round((s.count / counts.totalProjects) * 100)
                          : 0
                      return (
                        <div key={s.label}>
                          <div className="mb-1 flex items-center justify-between">
                            <span className="text-xs font-medium capitalize text-[#475569] dark:text-slate-300">
                              {s.label.replace(/_/g, ' ')}
                            </span>
                            <span className="text-xs font-bold text-[#0F172A] dark:text-white">
                              {s.count}
                            </span>
                          </div>
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#F5EEFF] dark:bg-white/10">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-[#A855F7] to-[#C084FC]"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT column */}
            <div className="space-y-4">
              {/* AI review flags */}
              {aiFlags.length > 0 && (
                <div className="rounded-[22px] border border-[#E9D5FF] bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#1E293B]">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.06em] text-[#A855F7] dark:text-[#E9D5FF]">
                    AI Review Flags
                  </p>
                  <div className="space-y-3">
                    {aiFlags.map((flag) => {
                      const IconComp = FLAG_ICONS[flag.key] ?? ShieldAlert
                      const severityLabel = FLAG_SEVERITY[flag.key] ?? 'Warning'
                      const titleText =
                        FLAG_TITLE_FN[flag.key]?.(flag.count) ??
                        `${flag.count} project${flag.count !== 1 ? 's' : ''} flagged for ${flag.label.toLowerCase()}.`
                      return (
                        <div
                          key={flag.key}
                          className="flex items-start justify-between gap-3 rounded-[16px] border border-[#F0D9FF] bg-[#FDF8FF]/70 px-3 py-3 dark:border-white/10 dark:bg-white/5"
                        >
                          <div className="flex items-start gap-2.5">
                            <div className="mt-0.5 shrink-0 text-[#A855F7]">
                              <IconComp className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-[#0F172A] dark:text-white">
                                {titleText}
                              </p>
                              {flag.summary && (
                                <p className="mt-0.5 text-xs text-[#64748B] dark:text-slate-100">
                                  {flag.summary}
                                </p>
                              )}
                            </div>
                          </div>
                          <span className="inline-flex shrink-0 items-center rounded-full bg-[#FDF8FF] px-2.5 py-1 text-xs font-semibold text-[#A855F7] dark:bg-[#A855F7]/15 dark:text-[#E9D5FF]">
                            {severityLabel}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Issue categories */}
              {issueCategories.length > 0 && (
                <div className="rounded-[22px] border border-[#E9D5FF] bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#1E293B]">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.06em] text-[#A855F7] dark:text-[#E9D5FF]">
                    Issue Categories
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {issueCategories.map((cat) => (
                      <span
                        key={cat.label}
                        className="inline-flex items-center gap-1.5 rounded-full border border-[#E9D5FF] bg-[#FDF8FF] px-2.5 py-1 text-xs font-medium text-[#475569] dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
                      >
                        <span className="font-bold text-[#A855F7] dark:text-[#E9D5FF]">{cat.count}</span>
                        {cat.label}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {aiFlags.length === 0 && issueCategories.length === 0 && (
                <div className="rounded-[22px] border border-dashed border-[#E9D5FF] bg-white p-4 text-center dark:border-white/10 dark:bg-[#1E293B]">
                  <p className="text-sm text-[#64748B] dark:text-slate-400">
                    No critical flags detected in the current portfolio.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Focus projects — full width */}
          {focusProjects.length > 0 && (
            <div className="rounded-[22px] border border-[#E9D5FF] bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#1E293B]">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.06em] text-[#A855F7] dark:text-[#E9D5FF]">
                {role === 'respondent'
                  ? 'Your Priority Projects'
                  : role === 'reviewer'
                    ? 'Projects to Review'
                    : 'Projects for Decision'}
              </p>
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {focusProjects.map((project) => {
                  const inner = (
                    <>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-[#0F172A] dark:text-white">
                          {project.name}
                        </p>
                        <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                          <span className="text-xs text-[#64748B] dark:text-slate-400">
                            {project.projectId}
                          </span>
                          {project.status && (
                            <span className="text-xs text-[#94A3B8] dark:text-slate-500">
                              · {project.status}
                            </span>
                          )}
                        </div>
                        {project.categories.length > 0 && (
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {project.categories.map((cat) => (
                              <span
                                key={cat}
                                className="rounded-full border border-[#F0D9FF] bg-[#FDF8FF] px-1.5 py-0.5 text-[10px] font-medium text-[#7C3AED] dark:border-white/10 dark:bg-white/5 dark:text-[#E9D5FF]"
                              >
                                {cat}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1.5">
                        {project.riskLevel && <RiskLevelBadge riskLevel={project.riskLevel} />}
                        <div className="flex gap-1.5">
                          {(['high', 'medium', 'low'] as const).map((level) => {
                            const n = project.issueCounts[level]
                            if (!n) return null
                            const cfg = SEVERITY_CONFIG[level]
                            return (
                              <span
                                key={level}
                                className="rounded-full border px-1.5 py-0.5 text-[10px] font-bold"
                                style={{ backgroundColor: cfg.bg, borderColor: cfg.border, color: cfg.color }}
                              >
                                {n}
                              </span>
                            )
                          })}
                        </div>
                      </div>
                    </>
                  )
                  const sharedClass =
                    'flex items-start gap-3 rounded-[16px] border border-[#F0D9FF] bg-[#FDF8FF]/60 px-3 py-3 dark:border-white/10 dark:bg-white/5'
                  if (project.href) {
                    return (
                      <Link
                        key={project.projectId}
                        to={project.href}
                        className={cn(sharedClass, 'transition-colors hover:bg-[#FDF8FF] dark:hover:bg-white/10')}
                      >
                        {inner}
                      </Link>
                    )
                  }
                  return (
                    <div key={project.projectId} className={sharedClass}>
                      {inner}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Role actions — full width */}
          {dashboardActions.length > 0 && (
            <div className="rounded-[22px] border border-[#E9D5FF] bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#1E293B]">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.06em] text-[#A855F7] dark:text-[#E9D5FF]">
                {role === 'respondent'
                  ? 'Recommended Actions'
                  : role === 'reviewer'
                    ? 'Recommended Review Actions'
                    : 'Recommended Decision Actions'}
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {dashboardActions.map((action, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2.5 rounded-[14px] border border-[#F0D9FF] bg-[#FDF8FF]/60 px-3 py-3 dark:border-white/10 dark:bg-white/5"
                  >
                    <Sparkles
                      className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#A855F7] dark:text-[#E9D5FF]"
                      aria-hidden="true"
                    />
                    <span className="text-sm text-[#475569] dark:text-slate-100">{action}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
