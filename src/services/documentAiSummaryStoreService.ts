import type {
  Dga_ict_ai_summariesBase,
  Dga_ict_ai_summariesdga_role_context,
  Dga_ict_ai_summariesdga_summary_category,
  Dga_ict_ai_summariesdga_summary_stage,
  Dga_ict_ai_summariesdga_summary_type,
} from '@/generated/models/Dga_ict_ai_summariesModel'
import type { Dga_ict_document_summariesBase } from '@/generated/models/Dga_ict_document_summariesModel'
import { Dga_ict_ai_summariesService } from '@/generated/services/Dga_ict_ai_summariesService'
import { Dga_ict_document_summariesService } from '@/generated/services/Dga_ict_document_summariesService'
import {
  parseSupportingDocumentEvaluationSummary,
  type SupportingDocumentEvaluationSummary,
} from '@/services/aiSupportingDocumentEvaluationService'

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
