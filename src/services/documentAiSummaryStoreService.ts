import type {
  Dga_ict_ai_summaries,
  Dga_ict_ai_summariesBase,
  Dga_ict_ai_summariesdga_role_context,
  Dga_ict_ai_summariesdga_summary_category,
  Dga_ict_ai_summariesdga_summary_stage,
  Dga_ict_ai_summariesdga_summary_type,
} from '@/generated/models/Dga_ict_ai_summariesModel'
import type {
  Dga_ict_budgetsBase,
  Dga_ict_budgetsdga_ai_flags,
} from '@/generated/models/Dga_ict_budgetsModel'
import type { Dga_ict_document_summariesBase } from '@/generated/models/Dga_ict_document_summariesModel'
import { Dga_ict_budgetsService } from '@/generated/services/Dga_ict_budgetsService'
import { Dga_ict_ai_summariesService } from '@/generated/services/Dga_ict_ai_summariesService'
import { Dga_ict_document_summariesService } from '@/generated/services/Dga_ict_document_summariesService'
import {
  parseSupportingDocumentEvaluationSummary,
  type SupportingDocumentEvaluationSummary,
} from '@/services/aiSupportingDocumentEvaluationService'

export interface BudgetOverviewOverallAssessment {
  readiness_status?: string
  one_line_summary?: string
  executive_summary?: string
  primary_strengths?: string[]
  primary_risks?: string[]
}

export interface BudgetOverviewDocumentEvidence {
  evidence_score?: number
  supports_project?: boolean
  applicability?: string
  readiness_gap_count?: number
}

export interface BudgetOverviewProjectFieldsScore {
  evaluated_count?: number
  match_count?: number
  close_match_count?: number
  mismatch_count?: number
  not_evaluated_count?: number
}

export interface BudgetOverviewBudgetAccountScore {
  line_item_count?: number
  account_code_match_count?: number
  amount_match_count?: number
  currency_match?: boolean
  expense_type_match?: boolean
}

export interface BudgetOverviewStrategicAlignmentScore {
  match_type?: string
  requires_review?: boolean
  severity?: string
}

export interface BudgetOverviewScoreInputs {
  document_evidence?: BudgetOverviewDocumentEvidence
  project_fields?: BudgetOverviewProjectFieldsScore
  budget_account?: BudgetOverviewBudgetAccountScore
  strategic_alignment?: BudgetOverviewStrategicAlignmentScore
}

export interface BudgetOverviewReviewFlag {
  flag?: boolean
  label?: string
  severity?: string
  reason?: string
}

export interface BudgetOverviewReviewFlags {
  evidence_risk?: BudgetOverviewReviewFlag
  strategic_alignment_risk?: BudgetOverviewReviewFlag
  budget_accuracy_risk?: BudgetOverviewReviewFlag
  clarification_required?: BudgetOverviewReviewFlag
  dge_budget_consideration_risk?: BudgetOverviewReviewFlag
}

export interface BudgetOverviewRoleAction {
  action_id?: string
  severity?: string
  message?: string
  linked_issue_id?: string
}

export interface BudgetOverviewRoleViewRespondent {
  summary?: string
  must_fix?: BudgetOverviewRoleAction[]
  should_review?: BudgetOverviewRoleAction[]
}

export interface BudgetOverviewRoleViewReviewer {
  summary?: string
  review_focus?: Array<{ focus_id?: string; priority?: string; message?: string; linked_issue_id?: string }>
  validated_items?: Array<{ category?: string; item?: string; evidence?: string[] }>
  questions_for_respondent?: Array<{ question_id?: string; priority?: string; message?: string }>
}

export interface BudgetOverviewRoleViewApprover {
  executive_summary?: string
  decision_recommendation?: string
  approval_conditions?: BudgetOverviewRoleAction[]
  material_risks?: Array<{ risk_id?: string; severity?: string; message?: string }>
}

export interface BudgetOverviewRoleViews {
  respondent?: BudgetOverviewRoleViewRespondent
  reviewer?: BudgetOverviewRoleViewReviewer
  approver?: BudgetOverviewRoleViewApprover
}

export interface BudgetOverviewRecommendedOption {
  rank?: number
  strategic_priority?: string
  strategic_priority_classification?: string
  relevance_score?: number
  reason?: string
}

export interface BudgetOverviewStrategicAlignment {
  submitted_priority?: string
  submitted_classification?: string
  recommended_options?: BudgetOverviewRecommendedOption[]
  selected_match?: string
  recommended_change?: {
    strategic_priority?: string
    strategic_priority_classification?: string
    reason?: string
  }
}

export interface BudgetOverviewIssue {
  issue_id?: string
  severity?: string
  category?: string
  title?: string
  description?: string
  recommended_action?: string
  affects_score?: boolean
}

export interface BudgetOverviewData {
  evaluation_version?: string
  overall_assessment?: BudgetOverviewOverallAssessment
  score_inputs?: BudgetOverviewScoreInputs
  ai_review_flags?: BudgetOverviewReviewFlags
  role_views?: BudgetOverviewRoleViews
  strategic_alignment?: BudgetOverviewStrategicAlignment
  issues?: BudgetOverviewIssue[]
  clarifications?: {
    has_clarifications?: boolean
    summary_message?: string
  }
  recommended_next_actions?: Array<{ priority?: number; role?: string; action?: string }>
  validated_items?: Array<{ category?: string; item?: string }>
}

export interface StoredBudgetOverviewRecord {
  id: string
  budgetId: string | null
  isValid: boolean
  responseJson: string
  responseTime: number | null
  modifiedOn: string | null
  parsedData: BudgetOverviewData | null
}

export interface StoredDocumentSummaryRecord {
  id: string
  budgetId: string | null
  documentName: string
  documentSummary: string
  parsedSummary: SupportingDocumentEvaluationSummary | null
}

export interface StoredBudgetAiSummaryRecord {
  id: string
  budgetId: string | null
  isValid: boolean
  responseJson: string
  responseTime: number | null
  modifiedOn: string | null
  parsedSummary: SupportingDocumentEvaluationSummary | null
}

export interface CreateDocumentSummaryInput {
  budgetId: string
  documentName: string
  documentSummary: string
}

export interface UpsertCumulativeSummaryInput {
  budgetId: string
  responseJson: string
  responseTime: number | null
  isValid?: boolean
}

const CUMULATIVE_ROLE_CONTEXT: Dga_ict_ai_summariesdga_role_context = 1
const CUMULATIVE_SUMMARY_CATEGORY: Dga_ict_ai_summariesdga_summary_category = 8
const CUMULATIVE_SUMMARY_STAGE: Dga_ict_ai_summariesdga_summary_stage = 1
const CUMULATIVE_SUMMARY_TYPE: Dga_ict_ai_summariesdga_summary_type = 1
const BUDGET_OVERVIEW_SUMMARY_CATEGORY: Dga_ict_ai_summariesdga_summary_category = 1
const BUDGET_OVERVIEW_AI_FLAG_MAP = {
  evidence_risk: 1,
  dge_budget_consideration_risk: 2,
  strategic_alignment_risk: 3,
  budget_accuracy_risk: 4,
  clarification_required: 8,
} as const satisfies Partial<Record<keyof BudgetOverviewReviewFlags, Dga_ict_budgetsdga_ai_flags>>

function hasBudgetOverviewFields(value: unknown): value is BudgetOverviewData {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const record = value as Record<string, unknown>
  return 'overall_assessment' in record || 'score_inputs' in record
}

function extractOpenAiTextPayload(value: unknown): string | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const record = value as Record<string, unknown>
  const output = record['output']
  if (!Array.isArray(output) || output.length === 0) return null
  const firstOutput = output[0] as Record<string, unknown>
  const content = firstOutput?.['content']
  if (!Array.isArray(content) || content.length === 0) return null
  const firstContent = content[0] as Record<string, unknown>
  const text = firstContent?.['text']
  return typeof text === 'string' ? text : null
}

function findBudgetOverviewData(value: unknown, visited = new Set<unknown>()): BudgetOverviewData | null {
  if (!value) return null

  let current: unknown = value
  if (typeof current === 'string') {
    try {
      current = JSON.parse(current)
    } catch {
      return null
    }
  }

  if (hasBudgetOverviewFields(current)) return current as BudgetOverviewData
  if (!current || typeof current !== 'object') return null
  if (visited.has(current)) return null
  visited.add(current)

  const openAiText = extractOpenAiTextPayload(current)
  if (openAiText) {
    const result = findBudgetOverviewData(openAiText, visited)
    if (result) return result
  }

  if (Array.isArray(current)) {
    for (const item of current) {
      const result = findBudgetOverviewData(item, visited)
      if (result) return result
    }
    return null
  }

  for (const nestedValue of Object.values(current as Record<string, unknown>)) {
    const result = findBudgetOverviewData(nestedValue, visited)
    if (result) return result
  }

  return null
}

export function parseBudgetOverviewData(value: unknown): BudgetOverviewData | null {
  if (!value) return null
  try {
    const rawResponse = typeof value === 'string' ? value : JSON.stringify(value, null, 2)
    console.log('[BudgetOverview] Raw dga_response_json:', rawResponse)

    const topLevelParsed =
      typeof value === 'string'
        ? (() => {
            try {
              return JSON.parse(value)
            } catch {
              return null
            }
          })()
        : value

    console.log('[BudgetOverview] Top-level parsed payload:', topLevelParsed)

    const extractedOpenAiText = extractOpenAiTextPayload(topLevelParsed)
    if (extractedOpenAiText) {
      console.log('[BudgetOverview] Extracted OpenAI output_text:', extractedOpenAiText)
    }

    const parsedBudgetOverview = findBudgetOverviewData(value)
    console.log('[BudgetOverview] Final parsed BudgetOverviewData:', parsedBudgetOverview)
    return parsedBudgetOverview
  } catch (error) {
    console.warn('[DocumentAiSummaryStore] Failed to parse budget overview data:', error)
    return null
  }
}

export function getBudgetAiFlagsFromBudgetOverview(
  parsedData: BudgetOverviewData | null | undefined
): Dga_ict_budgetsdga_ai_flags[] {
  if (!parsedData?.ai_review_flags) {
    return []
  }

  const nextFlags = Object.entries(BUDGET_OVERVIEW_AI_FLAG_MAP).reduce<Dga_ict_budgetsdga_ai_flags[]>(
    (flags, [key, optionValue]) => {
      const reviewFlag = parsedData.ai_review_flags?.[key as keyof BudgetOverviewReviewFlags]
      if (reviewFlag?.flag) {
        flags.push(optionValue)
      }
      return flags
    },
    []
  )

  return Array.from(new Set(nextFlags)).sort((left, right) => Number(left) - Number(right))
}

export async function syncBudgetAiFlagsFromBudgetOverview(
  budgetId: string,
  parsedData: BudgetOverviewData | null | undefined
) {
  const aiFlags = getBudgetAiFlagsFromBudgetOverview(parsedData)
  console.log('[BudgetOverview] Syncing dga_ai_flags from ai_review_flags:', {
    budgetId,
    aiFlags,
    aiReviewFlags: parsedData?.ai_review_flags ?? null,
  })

  const result = await Dga_ict_budgetsService.update(
    budgetId,
    {
      dga_ai_flags: aiFlags,
    } as Partial<Omit<Dga_ict_budgetsBase, 'dga_ict_budgetid'>>
  )

  if (!result.success) {
    throw new Error(result.error?.message?.trim() || 'Failed to sync AI flags to the ICT budget.')
  }
}

function mapStoredBudgetOverviewRecord(record: Dga_ict_ai_summaries | undefined): StoredBudgetOverviewRecord | null {
  if (!record || !record.dga_ict_ai_summaryid) return null

  const responseJson = typeof record.dga_response_json === 'string' ? record.dga_response_json : ''
  console.log('[BudgetOverview] Dataverse Budget Overview record:', {
    id: record.dga_ict_ai_summaryid,
    budgetId: record._dga_referencerecordid_value ?? null,
    summaryCategory: record.dga_summary_category ?? null,
    isValid: record.dga_is_valid ?? false,
    modifiedOn: typeof record.modifiedon === 'string' ? record.modifiedon : null,
    responseTime: typeof record.dga_response_time === 'number' ? record.dga_response_time : null,
  })

  return {
    id: record.dga_ict_ai_summaryid,
    budgetId: record._dga_referencerecordid_value ?? null,
    isValid: record.dga_is_valid ?? false,
    responseJson,
    responseTime: typeof record.dga_response_time === 'number' ? record.dga_response_time : null,
    modifiedOn: typeof record.modifiedon === 'string' ? record.modifiedon : null,
    parsedData: responseJson ? parseBudgetOverviewData(responseJson) : null,
  }
}

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

function asDocumentCreatePayload(input: CreateDocumentSummaryInput) {
  return {
    'dga_ict_budget@odata.bind': `/dga_ict_budgets(${input.budgetId})`,
    dga_document_name: input.documentName.trim(),
    dga_document_summary: input.documentSummary,
  } as Partial<Omit<Dga_ict_document_summariesBase, 'dga_ict_document_summaryid'>> as Omit<
    Dga_ict_document_summariesBase,
    'dga_ict_document_summaryid'
  >
}

function asCumulativeCreatePayload(input: UpsertCumulativeSummaryInput) {
  return {
    'dga_ReferenceRecordId_dga_ict_budget@odata.bind': `/dga_ict_budgets(${input.budgetId})`,
    dga_name: 'Cumulative Supporting Document Summary',
    dga_role_context: CUMULATIVE_ROLE_CONTEXT,
    dga_summary_category: CUMULATIVE_SUMMARY_CATEGORY,
    dga_summary_stage: CUMULATIVE_SUMMARY_STAGE,
    dga_summary_type: CUMULATIVE_SUMMARY_TYPE,
    dga_is_valid: input.isValid ?? true,
    dga_response_time: input.responseTime ?? undefined,
    dga_response_json: input.responseJson,
  } as unknown as Omit<
    Dga_ict_ai_summariesBase,
    'dga_ict_ai_summaryid'
  >
}

function asCumulativeUpdatePayload(input: UpsertCumulativeSummaryInput) {
  return {
    dga_is_valid: input.isValid ?? true,
    dga_response_time: input.responseTime ?? undefined,
    dga_response_json: input.responseJson,
  } as Partial<Omit<Dga_ict_ai_summariesBase, 'dga_ict_ai_summaryid'>>
}

function mapStoredDocumentSummaryRecord(
  record: Awaited<ReturnType<typeof Dga_ict_document_summariesService.getAll>>['data'][number]
): StoredDocumentSummaryRecord | null {
  if (!record.dga_ict_document_summaryid || !record.dga_document_name || !record.dga_document_summary) {
    return null
  }

  return {
    id: record.dga_ict_document_summaryid,
    budgetId: record._dga_ict_budget_value ?? null,
    documentName: record.dga_document_name,
    documentSummary: record.dga_document_summary,
    parsedSummary: parseSupportingDocumentEvaluationSummary(record.dga_document_summary),
  }
}

function mapStoredCumulativeSummaryRecord(
  record: Awaited<ReturnType<typeof Dga_ict_ai_summariesService.getAll>>['data'][number] | undefined
): StoredBudgetAiSummaryRecord | null {
  if (!record) {
    return null
  }

  if (!record.dga_ict_ai_summaryid) {
    return null
  }

  const responseJson = typeof record.dga_response_json === 'string' ? record.dga_response_json : ''

  return {
    id: record.dga_ict_ai_summaryid,
    budgetId: record._dga_referencerecordid_value ?? null,
    isValid: record.dga_is_valid ?? false,
    responseJson,
    responseTime: typeof record.dga_response_time === 'number' ? record.dga_response_time : null,
    modifiedOn: typeof record.modifiedon === 'string' ? record.modifiedon : null,
    parsedSummary: responseJson ? parseSupportingDocumentEvaluationSummary(responseJson) : null,
  }
}

export async function createDocumentSummaryRecord(input: CreateDocumentSummaryInput) {
  const result = await Dga_ict_document_summariesService.create(asDocumentCreatePayload(input))
  if (!result.success) {
    throw new Error(result.error?.message?.trim() || 'Failed to create ICT document summary record.')
  }
  return result.data?.dga_ict_document_summaryid ?? null
}

export async function createDocumentSummaryRecords(inputs: CreateDocumentSummaryInput[]) {
  await Promise.all(inputs.map((input) => createDocumentSummaryRecord(input)))
}

export async function getDocumentSummaryRecordsByBudgetId(budgetId: string) {
  const result = await Dga_ict_document_summariesService.getAll({
    select: [
      'dga_ict_document_summaryid',
      'dga_document_name',
      'dga_document_summary',
      '_dga_ict_budget_value',
      'createdon',
    ],
    filter: `_dga_ict_budget_value eq ${budgetId}`,
    orderBy: ['createdon asc'],
  })

  if (!result.success) {
    throw new Error(result.error?.message?.trim() || 'Failed to retrieve ICT document summaries.')
  }

  return (result.data ?? [])
    .map(mapStoredDocumentSummaryRecord)
    .filter((record): record is StoredDocumentSummaryRecord => record !== null)
}

export async function deleteDocumentSummaryRecordsByDocumentName(budgetId: string, documentName: string) {
  const normalizedName = documentName.trim().toLowerCase()
  const records = await getDocumentSummaryRecordsByBudgetId(budgetId)
  const matches = records.filter((record) => record.documentName.trim().toLowerCase() === normalizedName)
  await Promise.all(matches.map((record) => Dga_ict_document_summariesService.delete(record.id)))
}

export async function getLatestCumulativeSummaryByBudgetId(budgetId: string) {
  const result = await Dga_ict_ai_summariesService.getAll({
    select: [
      'dga_ict_ai_summaryid',
      'dga_is_valid',
      'dga_response_json',
      'dga_response_time',
      '_dga_referencerecordid_value',
      'dga_summary_category',
      'dga_summary_stage',
      'dga_summary_type',
      'createdon',
      'modifiedon',
    ],
    filter: `_dga_referencerecordid_value eq ${budgetId} and dga_summary_category eq ${CUMULATIVE_SUMMARY_CATEGORY} and dga_summary_stage eq ${CUMULATIVE_SUMMARY_STAGE} and dga_summary_type eq ${CUMULATIVE_SUMMARY_TYPE}`,
    orderBy: ['createdon desc'],
    top: 1,
  })

  if (!result.success) {
    throw new Error(result.error?.message?.trim() || 'Failed to retrieve cumulative AI summary.')
  }

  return mapStoredCumulativeSummaryRecord(result.data?.[0]) ?? null
}

export async function upsertCumulativeSummaryRecord(input: UpsertCumulativeSummaryInput) {
  const existing = await getLatestCumulativeSummaryByBudgetId(input.budgetId)

  if (existing) {
    const result = await Dga_ict_ai_summariesService.update(existing.id, asCumulativeUpdatePayload(input))
    if (!result.success) {
      throw new Error(result.error?.message?.trim() || 'Failed to update cumulative AI summary.')
    }
    return existing.id
  }

  const createPayload = asCumulativeCreatePayload(input)
  console.log('[DocumentAiSummaryStore] Creating cumulative AI summary record with payload:', {
    budgetId: input.budgetId,
    responseTime: input.responseTime,
    responseJsonLength: input.responseJson.length,
    payload: createPayload,
  })

  try {
    const result = await Dga_ict_ai_summariesService.create(createPayload)
    console.log('[DocumentAiSummaryStore] Cumulative AI summary create result:', result)
    if (!result.success) {
      throw new Error(result.error?.message?.trim() || 'Failed to create cumulative AI summary.')
    }

    return result.data?.dga_ict_ai_summaryid ?? null
  } catch (error) {
    console.error('[DocumentAiSummaryStore] Cumulative AI summary create threw, retrying lookup:', error)

    for (const delayMs of [150, 400, 900]) {
      await wait(delayMs)
      const refreshed = await getLatestCumulativeSummaryByBudgetId(input.budgetId)
      console.log('[DocumentAiSummaryStore] Cumulative AI summary lookup after create attempt:', {
        budgetId: input.budgetId,
        delayMs,
        found: Boolean(refreshed),
        recordId: refreshed?.id ?? null,
      })
      if (refreshed) {
        return refreshed.id
      }
    }

    throw error instanceof Error
      ? error
      : new Error('Failed to create cumulative AI summary.')
  }
}

export async function getAllAiSummaryRecordsByBudgetId(budgetId: string): Promise<{
  cumulativeRecord: StoredBudgetAiSummaryRecord | null
  budgetOverviewRecord: StoredBudgetOverviewRecord | null
}> {
  const result = await Dga_ict_ai_summariesService.getAll({
    select: [
      'dga_ict_ai_summaryid',
      'dga_is_valid',
      'dga_response_json',
      'dga_response_time',
      '_dga_referencerecordid_value',
      'dga_summary_category',
      'dga_summary_stage',
      'dga_summary_type',
      'createdon',
      'modifiedon',
    ],
    filter: `_dga_referencerecordid_value eq ${budgetId}`,
    orderBy: ['createdon desc'],
  })

  if (!result.success) {
    throw new Error(result.error?.message?.trim() || 'Failed to retrieve AI summary records.')
  }

  const records = result.data ?? []
  const cumulativeRecords = records.filter((r) => r.dga_summary_category === CUMULATIVE_SUMMARY_CATEGORY)
  const overviewRecords = records.filter((r) => r.dga_summary_category === BUDGET_OVERVIEW_SUMMARY_CATEGORY)

  return {
    cumulativeRecord: mapStoredCumulativeSummaryRecord(cumulativeRecords[0]),
    budgetOverviewRecord: mapStoredBudgetOverviewRecord(overviewRecords[0]),
  }
}

export async function invalidateCumulativeSummaryRecord(budgetId: string) {
  const existing = await getLatestCumulativeSummaryByBudgetId(budgetId)
  if (!existing) return

  const result = await Dga_ict_ai_summariesService.update(existing.id, {
    dga_is_valid: false,
  } as Partial<Omit<Dga_ict_ai_summariesBase, 'dga_ict_ai_summaryid'>>)

  if (!result.success) {
    throw new Error(result.error?.message?.trim() || 'Failed to invalidate cumulative AI summary.')
  }
}

export async function invalidateBudgetOverviewRecord(budgetId: string) {
  const result = await Dga_ict_ai_summariesService.getAll({
    select: ['dga_ict_ai_summaryid'],
    filter: `_dga_referencerecordid_value eq ${budgetId} and dga_summary_category eq ${BUDGET_OVERVIEW_SUMMARY_CATEGORY}`,
    orderBy: ['createdon desc'],
    top: 1,
  })

  if (!result.success) {
    throw new Error(result.error?.message?.trim() || 'Failed to find budget overview AI summary.')
  }

  const existing = result.data?.[0]
  if (!existing?.dga_ict_ai_summaryid) return

  const update = await Dga_ict_ai_summariesService.update(existing.dga_ict_ai_summaryid, {
    dga_is_valid: false,
  } as Partial<Omit<Dga_ict_ai_summariesBase, 'dga_ict_ai_summaryid'>>)

  if (!update.success) {
    throw new Error(update.error?.message?.trim() || 'Failed to invalidate budget overview AI summary.')
  }
}

export async function clearCumulativeSummaryRecord(budgetId: string) {
  const existing = await getLatestCumulativeSummaryByBudgetId(budgetId)
  if (!existing) return

  const result = await Dga_ict_ai_summariesService.update(existing.id, {
    dga_is_valid: false,
    dga_response_json: null as unknown as string,
    dga_response_time: undefined,
  } as Partial<Omit<Dga_ict_ai_summariesBase, 'dga_ict_ai_summaryid'>>)

  if (!result.success) {
    throw new Error(result.error?.message?.trim() || 'Failed to clear cumulative AI summary.')
  }
}
