import type { RiskLevel } from '@/data/db'
import type {
  Dga_ict_ai_summariesdga_summary_category,
  Dga_ict_ai_summariesdga_summary_stage,
  Dga_ict_ai_summariesdga_summary_type,
} from '@/generated/models/Dga_ict_ai_summariesModel'
import { Dga_ict_ai_summariesService } from '@/generated/services/Dga_ict_ai_summariesService'
import { SESSION_INSTANCE_ID_KEY } from '@/services/instanceService'

const PORTFOLIO_SUMMARY_CATEGORY: Dga_ict_ai_summariesdga_summary_category = 2
const PORTFOLIO_SUMMARY_STAGE: Dga_ict_ai_summariesdga_summary_stage = 1
const PORTFOLIO_SUMMARY_TYPE: Dga_ict_ai_summariesdga_summary_type = 2

export type PortfolioRole = 'respondent' | 'reviewer' | 'approver'
export type PortfolioSeverityKey = 'high' | 'medium' | 'low'

type ProjectIdMap = Record<string, string[]>

interface PortfolioProjectBucket {
  project_ids?: string[]
  summary_template?: string
  budget_consideration_flag_project_ids?: ProjectIdMap
}

interface PortfolioFieldDistribution {
  project_ids_by_value?: Record<string, string[]>
  summary_template?: string
}

export interface PortfolioIssueValueRow {
  budget_reference_id?: string
  project_name?: string
  severity?: Partial<Record<PortfolioSeverityKey, number>>
  categories?: Record<string, number>
}

interface PortfolioCalculationSources {
  project_ids?: string[]
  status_project_ids?: Record<string, string[]>
  issue_value_rows?: PortfolioIssueValueRow[]
  issue_project_ids?: {
    severity?: Partial<Record<PortfolioSeverityKey, string[]>>
    categories?: Record<string, string[]>
  }
  ai_review_flag_project_ids?: Record<string, string[]>
  budget_consideration_flag_project_ids?: Record<string, string[]>
  clarification_project_ids?: Record<string, string[]>
  field_distribution_project_ids?: Record<string, PortfolioFieldDistribution>
}

interface PortfolioStatistics {
  issue_severity?: Partial<Record<PortfolioSeverityKey, PortfolioProjectBucket>>
  issue_categories?: Record<string, PortfolioProjectBucket>
  ai_review_flags?: Record<string, PortfolioProjectBucket>
  clarification?: Record<string, PortfolioProjectBucket>
}

interface PortfolioRoleView {
  summary?: string
  summary_template?: string
  planning_cycle_summary_template?: string
  priority_actions?: string[]
  review_focus?: string[]
  decision_focus?: string[]
  focus_projects?: string[]
}

export interface PortfolioSummaryPayload {
  evaluation_version?: string
  entity_identity?: {
    entity_name?: string
    entity_abbreviation?: string
  }
  instance_context?: {
    instance_status?: string
    planning_end_date?: string
  }
  calculation_sources?: PortfolioCalculationSources
  portfolio_statistics?: PortfolioStatistics
  /** Some prompt versions emit these at root level instead of inside portfolio_statistics */
  ai_review_flags?: Record<string, PortfolioProjectBucket>
  clarification?: Record<string, PortfolioProjectBucket>
  role_views?: Partial<Record<PortfolioRole, PortfolioRoleView>>
  recommended_next_actions?: Array<{
    role?: string
    text?: string
  }>
}

export interface PortfolioSummaryRecord {
  id: string
  instanceId: string
  modifiedOn: string | null
  responseJson: string
  parsedSummary: PortfolioSummaryPayload | null
}

export interface PortfolioProjectInsight {
  riskLevel: RiskLevel | null
  matchedSeverity: PortfolioSeverityKey | null
  categories: string[]
  activeFlags: string[]
  budgetConsiderationFlags: string[]
  clarificationState: 'already_raised' | 'potential_clarification' | 'attention_union' | null
  issueCounts: {
    high: number
    medium: number
    low: number
  }
  isRoleFocusProject: boolean
}

function hasPortfolioSummaryFields(value: unknown): value is PortfolioSummaryPayload {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false
  const record = value as Record<string, unknown>
  return 'portfolio_statistics' in record || 'calculation_sources' in record || 'role_views' in record
}

function extractOpenAiTextPayload(value: unknown): string | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const record = value as Record<string, unknown>
  const output = record.output
  if (!Array.isArray(output) || output.length === 0) return null

  for (const outputEntry of output) {
    const content = (outputEntry as Record<string, unknown>).content
    if (!Array.isArray(content)) continue

    for (const contentEntry of content) {
      const text = (contentEntry as Record<string, unknown>).text
      if (typeof text === 'string' && text.trim()) {
        return text
      }
    }
  }

  return null
}

function sanitizeTemplateTextNodes(value: unknown, visited = new WeakSet<object>()): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeTemplateTextNodes(item, visited))
  }

  if (!value || typeof value !== 'object') {
    return value
  }

  if (visited.has(value)) {
    return value
  }
  visited.add(value)

  const record = value as Record<string, unknown>
  if (typeof record.text_template === 'string') {
    return record.text_template.trim()
  }
  if (typeof record.text === 'string') {
    return record.text.trim()
  }
  if (typeof record.value === 'string') {
    return record.value.trim()
  }

  return Object.fromEntries(
    Object.entries(record).map(([key, nestedValue]) => [
      key,
      sanitizeTemplateTextNodes(nestedValue, visited),
    ])
  )
}

function findPortfolioSummaryPayload(value: unknown, visited = new Set<unknown>()): PortfolioSummaryPayload | null {
  if (!value) return null

  let current: unknown = value
  if (typeof current === 'string') {
    try {
      current = JSON.parse(current)
    } catch {
      return null
    }
  }

  if (hasPortfolioSummaryFields(current)) return current as PortfolioSummaryPayload
  if (!current || typeof current !== 'object') return null
  if (visited.has(current)) return null
  visited.add(current)

  const openAiText = extractOpenAiTextPayload(current)
  if (openAiText) {
    const result = findPortfolioSummaryPayload(openAiText, visited)
    if (result) return result
  }

  if (Array.isArray(current)) {
    for (const item of current) {
      const result = findPortfolioSummaryPayload(item, visited)
      if (result) return result
    }
    return null
  }

  for (const nestedValue of Object.values(current as Record<string, unknown>)) {
    const result = findPortfolioSummaryPayload(nestedValue, visited)
    if (result) return result
  }

  return null
}

export function parsePortfolioSummaryData(value: unknown): PortfolioSummaryPayload | null {
  if (!value) return null

  try {
    const parsed = findPortfolioSummaryPayload(value)
    return parsed ? (sanitizeTemplateTextNodes(parsed) as PortfolioSummaryPayload) : null
  } catch (error) {
    console.warn('[PortfolioSummary] Failed to parse portfolio summary:', error)
    return null
  }
}

export function getAiReviewFlags(summary: PortfolioSummaryPayload | null | undefined) {
  return summary?.portfolio_statistics?.ai_review_flags ?? summary?.ai_review_flags ?? {}
}

export function getClarificationGroups(summary: PortfolioSummaryPayload | null | undefined) {
  return summary?.portfolio_statistics?.clarification ?? summary?.clarification ?? {}
}

function normalizeProjectId(value: string | null | undefined) {
  return value?.trim().toUpperCase() ?? ''
}

function includesProject(projectIds: string[] | undefined, budgetReferenceId: string) {
  const normalizedTarget = normalizeProjectId(budgetReferenceId)
  return projectIds?.some((projectId) => normalizeProjectId(projectId) === normalizedTarget) ?? false
}

function findIssueRow(
  summary: PortfolioSummaryPayload | null | undefined,
  budgetReferenceId: string
) {
  const normalizedTarget = normalizeProjectId(budgetReferenceId)
  return (
    summary?.calculation_sources?.issue_value_rows?.find(
      (row) => normalizeProjectId(row.budget_reference_id) === normalizedTarget
    ) ?? null
  )
}

export function getPortfolioSummaryRoleView(
  summary: PortfolioSummaryPayload | null | undefined,
  role: PortfolioRole
) {
  return summary?.role_views?.[role] ?? null
}

export function resolvePortfolioTemplate(
  template: string | null | undefined,
  summary: PortfolioSummaryPayload | null | undefined
) {
  if (!template?.trim()) return ''

  const projectCount = summary?.calculation_sources?.project_ids?.length ?? 0
  const aiFlags = getAiReviewFlags(summary)
  const clarifications = getClarificationGroups(summary)
  const statusIds = summary?.calculation_sources?.status_project_ids ?? {}
  const fieldDist = summary?.calculation_sources?.field_distribution_project_ids ?? {}
  const totalProjects = projectCount || 1

  const respondentOwned =
    (statusIds['Draft']?.length ?? 0) + (statusIds['Clarification Pending']?.length ?? 0)
  const withReviewer =
    (statusIds['Under Reviewer Review']?.length ?? 0) +
    (statusIds['Reviewer Review Completed']?.length ?? 0)
  const withApprover = statusIds['Under Approver Review']?.length ?? 0
  const approvedCount = statusIds['Approved by Approver']?.length ?? 0

  function pct(count: number) {
    return `${Math.round((count / totalProjects) * 100)}%`
  }

  function topN(fieldKey: string, n: number, type: 'label' | 'count' | 'pct') {
    const dist = fieldDist[fieldKey]?.project_ids_by_value ?? {}
    const sorted = Object.entries(dist)
      .map(([label, ids]) => ({ label, count: ids.length }))
      .sort((a, b) => b.count - a.count)
    const entry = sorted[n - 1]
    if (!entry) return ''
    if (type === 'label') return entry.label
    if (type === 'count') return String(entry.count)
    return pct(entry.count)
  }

  const replacements: Record<string, string | number> = {
    project_count: projectCount,
    stage_respondent_owned_count: respondentOwned,
    stage_with_reviewer_count: withReviewer,
    stage_with_approver_count: withApprover,
    stage_approved_count: approvedCount,
    ai_flag_evidence_risk_count: aiFlags.evidence_risk?.project_ids?.length ?? 0,
    ai_flag_budget_accuracy_risk_count: aiFlags.budget_accuracy_risk?.project_ids?.length ?? 0,
    ai_flag_strategic_alignment_risk_count: aiFlags.strategic_alignment_risk?.project_ids?.length ?? 0,
    ai_flag_dge_budget_consideration_risk_count:
      aiFlags.dge_budget_consideration_risk?.project_ids?.length ?? 0,
    clarification_already_raised_count: clarifications.already_raised?.project_ids?.length ?? 0,
    clarification_potential_count: clarifications.potential_clarification?.project_ids?.length ?? 0,
    clarification_attention_total_count: clarifications.attention_union?.project_ids?.length ?? 0,
    strategic_priority_top_1_label: topN('strategic_priority', 1, 'label'),
    strategic_priority_top_1_count: topN('strategic_priority', 1, 'count'),
    strategic_priority_top_1_pct: topN('strategic_priority', 1, 'pct'),
    strategic_priority_top_2_label: topN('strategic_priority', 2, 'label'),
    strategic_priority_top_2_count: topN('strategic_priority', 2, 'count'),
    strategic_priority_top_2_pct: topN('strategic_priority', 2, 'pct'),
    strategic_priority_top_3_label: topN('strategic_priority', 3, 'label'),
    strategic_priority_top_3_count: topN('strategic_priority', 3, 'count'),
    strategic_priority_top_3_pct: topN('strategic_priority', 3, 'pct'),
    technology_company_top_1_label: topN('technology_company', 1, 'label'),
    technology_company_top_1_count: topN('technology_company', 1, 'count'),
    technology_company_top_1_pct: topN('technology_company', 1, 'pct'),
    technology_company_top_2_label: topN('technology_company', 2, 'label'),
    technology_company_top_2_count: topN('technology_company', 2, 'count'),
    technology_company_top_2_pct: topN('technology_company', 2, 'pct'),
    technology_company_top_3_label: topN('technology_company', 3, 'label'),
    technology_company_top_3_count: topN('technology_company', 3, 'count'),
    technology_company_top_3_pct: topN('technology_company', 3, 'pct'),
  }

  return template.replace(/\{([^}]+)\}/g, (_, key: string) => {
    const val = replacements[key]
    if (val !== undefined) return `${val}`
    if (key.endsWith('_count')) return '0'
    if (key.endsWith('_pct')) return '0%'
    return ''
  })
}

export function getPortfolioProjectInsight(
  summary: PortfolioSummaryPayload | null | undefined,
  budgetReferenceId: string,
  role?: PortfolioRole
): PortfolioProjectInsight {
  const severityProjectIds = summary?.portfolio_statistics?.issue_severity
  const matchedSeverity: PortfolioSeverityKey | null = includesProject(
    severityProjectIds?.high?.project_ids,
    budgetReferenceId
  )
    ? 'high'
    : includesProject(severityProjectIds?.medium?.project_ids, budgetReferenceId)
      ? 'medium'
      : includesProject(severityProjectIds?.low?.project_ids, budgetReferenceId)
        ? 'low'
        : null

  const issueCategories = Object.entries(summary?.portfolio_statistics?.issue_categories ?? {})
    .filter(([, bucket]) => includesProject(bucket?.project_ids, budgetReferenceId))
    .map(([category]) => category)

  const activeFlags = Object.entries(getAiReviewFlags(summary))
    .filter(([, bucket]) => includesProject(bucket?.project_ids, budgetReferenceId))
    .map(([flag]) => flag)

  const budgetConsiderationFlags = Object.entries(
    summary?.calculation_sources?.budget_consideration_flag_project_ids ?? {}
  )
    .filter(([, projectIds]) => includesProject(projectIds, budgetReferenceId))
    .map(([flag]) => flag)

  const clarificationGroups = getClarificationGroups(summary)
  const clarificationState = includesProject(clarificationGroups.already_raised?.project_ids, budgetReferenceId)
    ? 'already_raised'
    : includesProject(clarificationGroups.potential_clarification?.project_ids, budgetReferenceId)
      ? 'potential_clarification'
      : includesProject(clarificationGroups.attention_union?.project_ids, budgetReferenceId)
        ? 'attention_union'
        : null

  const issueRow = findIssueRow(summary, budgetReferenceId)
  const issueCounts = {
    high: issueRow?.severity?.high ?? 0,
    medium: issueRow?.severity?.medium ?? 0,
    low: issueRow?.severity?.low ?? 0,
  }

  const roleView = role ? getPortfolioSummaryRoleView(summary, role) : null
  const isRoleFocusProject = roleView?.focus_projects
    ? includesProject(roleView.focus_projects, budgetReferenceId)
    : false

  return {
    riskLevel:
      matchedSeverity === 'high'
        ? 'High'
        : matchedSeverity === 'medium'
          ? 'Medium'
          : matchedSeverity === 'low'
            ? 'Low'
            : null,
    matchedSeverity,
    categories: issueCategories,
    activeFlags,
    budgetConsiderationFlags,
    clarificationState,
    issueCounts,
    isRoleFocusProject,
  }
}

export function getPortfolioCounts(summary: PortfolioSummaryPayload | null | undefined) {
  const clarification = getClarificationGroups(summary)
  return {
    totalProjects: summary?.calculation_sources?.project_ids?.length ?? 0,
    highRiskProjects: summary?.portfolio_statistics?.issue_severity?.high?.project_ids?.length ?? 0,
    mediumRiskProjects: summary?.portfolio_statistics?.issue_severity?.medium?.project_ids?.length ?? 0,
    lowRiskProjects: summary?.portfolio_statistics?.issue_severity?.low?.project_ids?.length ?? 0,
    clarificationOpen: clarification.already_raised?.project_ids?.length ?? 0,
    clarificationLikely: clarification.potential_clarification?.project_ids?.length ?? 0,
    clarificationAttention: clarification.attention_union?.project_ids?.length ?? 0,
  }
}

export function getRoleRecommendedActions(
  summary: PortfolioSummaryPayload | null | undefined,
  role: PortfolioRole
) {
  const roleView = getPortfolioSummaryRoleView(summary, role)
  const roleViewActions =
    role === 'respondent'
      ? roleView?.priority_actions ?? []
      : role === 'reviewer'
        ? roleView?.review_focus ?? []
        : roleView?.decision_focus ?? []

  const globalActions = (summary?.recommended_next_actions ?? [])
    .filter((action) => action.role?.trim().toLowerCase() === role)
    .map((action) => action.text?.trim() ?? '')
    .filter(Boolean)

  return Array.from(new Set([...roleViewActions, ...globalActions])).filter(Boolean)
}

export function getFieldDistributionEntries(
  summary: PortfolioSummaryPayload | null | undefined,
  fieldKey: string
) {
  const values =
    summary?.calculation_sources?.field_distribution_project_ids?.[fieldKey]?.project_ids_by_value ?? {}
  const totalProjects = summary?.calculation_sources?.project_ids?.length ?? 0

  return Object.entries(values)
    .map(([label, projectIds]) => ({
      label,
      count: projectIds.length,
      share: totalProjects > 0 ? Math.round((projectIds.length / totalProjects) * 100) : 0,
      projectIds,
    }))
    .sort((left, right) => right.count - left.count)
}

export async function getLatestPortfolioSummaryByCurrentInstance() {
  const instanceId = sessionStorage.getItem(SESSION_INSTANCE_ID_KEY)?.trim()
  if (!instanceId) return null

  const result = await Dga_ict_ai_summariesService.getAll({
    select: [
      'dga_ict_ai_summaryid',
      'dga_response_json',
      'dga_summary_category',
      'dga_summary_stage',
      'dga_summary_type',
      '_dga_referencerecordid_value',
      'modifiedon',
    ],
    filter: `_dga_referencerecordid_value eq ${instanceId} and dga_summary_category eq ${PORTFOLIO_SUMMARY_CATEGORY}`,
    orderBy: ['modifiedon desc'],
    top: 1,
  })

  if (!result.success) {
    throw new Error(result.error?.message?.trim() || 'Failed to retrieve portfolio AI summary.')
  }

  const record = result.data?.[0]
  if (!record?.dga_ict_ai_summaryid) return null

  const responseJson = typeof record.dga_response_json === 'string' ? record.dga_response_json : ''
  return {
    id: record.dga_ict_ai_summaryid,
    instanceId,
    modifiedOn: typeof record.modifiedon === 'string' ? record.modifiedon : null,
    responseJson,
    parsedSummary: responseJson ? parsePortfolioSummaryData(responseJson) : null,
  } as PortfolioSummaryRecord
}

export async function getLatestPlanningPortfolioSummaryByCurrentInstance() {
  const instanceId = sessionStorage.getItem(SESSION_INSTANCE_ID_KEY)?.trim()
  if (!instanceId) return null

  const result = await Dga_ict_ai_summariesService.getAll({
    select: [
      'dga_ict_ai_summaryid',
      'dga_response_json',
      'dga_summary_category',
      'dga_summary_stage',
      'dga_summary_type',
      '_dga_referencerecordid_value',
      'modifiedon',
    ],
    filter:
      `_dga_referencerecordid_value eq ${instanceId} and dga_summary_category eq ${PORTFOLIO_SUMMARY_CATEGORY}` +
      ` and dga_summary_stage eq ${PORTFOLIO_SUMMARY_STAGE} and dga_summary_type eq ${PORTFOLIO_SUMMARY_TYPE}`,
    orderBy: ['modifiedon desc'],
    top: 1,
  })

  if (!result.success) {
    throw new Error(result.error?.message?.trim() || 'Failed to retrieve planning portfolio AI summary.')
  }

  const record = result.data?.[0]
  if (!record?.dga_ict_ai_summaryid) return null

  const responseJson = typeof record.dga_response_json === 'string' ? record.dga_response_json : ''
  return {
    id: record.dga_ict_ai_summaryid,
    instanceId,
    modifiedOn: typeof record.modifiedon === 'string' ? record.modifiedon : null,
    responseJson,
    parsedSummary: responseJson ? parsePortfolioSummaryData(responseJson) : null,
  } as PortfolioSummaryRecord
}
