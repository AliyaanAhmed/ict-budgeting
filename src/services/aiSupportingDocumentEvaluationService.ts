import {
  PowerAppV2_GetCumulativeDocumentSummaryfromCompassService,
  PowerAppV2_GetDocumentSummaryfromCompassService,
} from '@/generated'
import { prepareSupportingDocumentFile } from '@/services/supportingDocumentPreparationService'

export interface SupportingDocumentProfile {
  document_type?: string
  document_date?: string
  issuer_or_vendor?: string
  recipient_or_entity?: string
  formality_level?: string
  document_purpose?: string
}

export interface SupportingDocumentKeyFact {
  type?: string
  label?: string
  value?: string
  currency?: string | null
  source_location?: string
}

export interface SupportingDocumentFileSummary {
  short_summary?: string
  detailed_summary?: string
  key_facts?: SupportingDocumentKeyFact[]
  extracted_technologies?: string[]
  risks_or_gaps?: string[]
}

export interface SupportingDocumentEvidenceAssessment {
  supports_project?: string
  evidence_quality?: string
  evidence_score?: number
  reason?: string
  recommended_user_action?: string
  supported_claims?: string[]
  missing_information?: string[]
  contradictions_or_conflicts?: string[]
}

export interface SupportingDocumentSuggestedProjectField {
  field_key?: string
  field_label?: string
  suggested_value?: string | string[]
  confidence?: number
  evidence?: string
  needs_user_confirmation?: boolean
}

export interface SupportingDocumentBudgetLine {
  line_number?: number
  description?: string
  amount?: number
  currency?: string
  amount_period?: string
  vat_treatment?: string
  source_location?: string
}

export interface SupportingDocumentClassificationPath {
  l1?: string
  l2?: string
  l3?: string
}

export interface SupportingDocumentAccountCodeSuggestion {
  rank?: number
  account_code?: string
  classification_path?: SupportingDocumentClassificationPath
  expense_type?: string
  mapped_budget_line_numbers?: number[]
  requested_budget?: number
  currency?: string
  account_code_confidence?: number
  budget_amount_confidence?: number
  reason?: string
  evidence?: string
  needs_user_confirmation?: boolean
}

export interface SupportingDocumentReviewFlag {
  severity?: string
  flag?: string
  reason?: string
  source_location?: string
}

export interface SupportingDocumentEvaluationSummary {
  evaluation_version?: string
  document_profile?: SupportingDocumentProfile
  file_summary?: SupportingDocumentFileSummary
  evidence_assessment?: SupportingDocumentEvidenceAssessment
  suggested_project_fields?: SupportingDocumentSuggestedProjectField[]
  budget_lines?: SupportingDocumentBudgetLine[]
  account_code_suggestions?: SupportingDocumentAccountCodeSuggestion[]
  review_flags?: SupportingDocumentReviewFlag[]
}

export interface SupportingDocumentFlowFileInput {
  filename: string
  fileResponse: string
}

function normalizeText(value: string) {
  return value.trim().replace(/\s+/g, ' ')
}

function isFlowFailureSummary(value: unknown) {
  if (typeof value !== 'string') return false

  const normalized = value.trim().toLowerCase()
  return (
    normalized.includes('summary request failed') ||
    normalized.includes('unexpected error occured') ||
    normalized.includes('unexpected error occurred')
  )
}

function extractJsonPayload(value: string) {
  const trimmed = value.trim()
  const firstBrace = trimmed.indexOf('{')
  const lastBrace = trimmed.lastIndexOf('}')

  if (firstBrace === -1 || lastBrace <= firstBrace) {
    return trimmed
  }

  return trimmed.slice(firstBrace, lastBrace + 1)
}

function tryParseJson(value: string): unknown {
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
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

function hasMajorHeadings(value: unknown): value is SupportingDocumentEvaluationSummary {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false

  const record = value as Record<string, unknown>
  return (
    'document_profile' in record ||
    'file_summary' in record ||
    'evidence_assessment' in record ||
    'suggested_project_fields' in record ||
    'budget_lines' in record ||
    'account_code_suggestions' in record
  )
}

function normalizeSerializedJsonString(value: string) {
  return value
    .trim()
    .replace(/^"+|"+$/g, '')
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
}

function unwrapJsonLayers(value: unknown, maxDepth = 6): unknown {
  let current = value

  for (let depth = 0; depth < maxDepth; depth += 1) {
    if (hasMajorHeadings(current)) {
      return current
    }

    if (typeof current !== 'string') {
      return current
    }

    const trimmed = current.trim()
    const attempts = [
      trimmed,
      normalizeSerializedJsonString(trimmed),
      extractJsonPayload(trimmed),
      extractJsonPayload(normalizeSerializedJsonString(trimmed)),
    ]

    let parsedNext: unknown = null

    for (const attempt of attempts) {
      const parsed = tryParseJson(attempt)
      if (parsed !== null) {
        parsedNext = parsed
        break
      }
    }

    if (parsedNext === null) {
      return current
    }

    current = parsedNext
  }

  return current
}

function findStructuredSummary(value: unknown, visited = new Set<unknown>()): SupportingDocumentEvaluationSummary | null {
  const unwrapped = unwrapJsonLayers(value)

  if (hasMajorHeadings(unwrapped)) {
    return unwrapped
  }

  if (!unwrapped || typeof unwrapped !== 'object') {
    return null
  }

  if (visited.has(unwrapped)) {
    return null
  }
  visited.add(unwrapped)

  if (Array.isArray(unwrapped)) {
    for (const item of unwrapped) {
      const match = findStructuredSummary(item, visited)
      if (match) return match
    }
    return null
  }

  for (const nestedValue of Object.values(unwrapped as Record<string, unknown>)) {
    const match = findStructuredSummary(nestedValue, visited)
    if (match) return match
  }

  return null
}

export function parseSupportingDocumentEvaluationSummary(value: unknown): SupportingDocumentEvaluationSummary | null {
  if (!value) return null

  try {
    const parsed = findStructuredSummary(value)
    return parsed ? (sanitizeTemplateTextNodes(parsed) as SupportingDocumentEvaluationSummary) : null
  } catch (error) {
    console.warn('[AiSupportingDocumentEvaluationService] Failed to parse document evaluation summary:', error)
    return null
  }
}

function blobToBase64(blob: Blob, readErrorLabel: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      const result = reader.result as string
      const base64 = result.split(',')[1] ?? ''
      resolve(base64)
    }

    reader.onerror = () => {
      reject(new Error(readErrorLabel))
    }

    reader.readAsDataURL(blob)
  })
}

export async function evaluateSupportingDocument(input: {
  file: File
}) {
  const file = input.file
  const fileName = normalizeText(file.name)
  const { preparedFile: fileForAnalysis } = await prepareSupportingDocumentFile(file)
  const mimeType = normalizeText(fileForAnalysis.type || 'application/octet-stream')
  const base64Content = await blobToBase64(
    fileForAnalysis,
    `Failed to prepare supporting document for AI analysis: ${file.name}`
  )
  const startedAt = Date.now()

  const flowInput = {
    fileContent: {
      name: fileForAnalysis.name,
      contentBytes: base64Content,
      mimeType,
    },
  }

  console.log('[AiSupportingDocumentEvaluationService] Calling Power Automate flow with file payload:', {
    fileName,
    analysisFileName: fileForAnalysis.name,
    mimeType,
    base64Length: base64Content.length,
    flowInput,
  })

  const result = await PowerAppV2_GetDocumentSummaryfromCompassService.Run(flowInput)
  const responseTimeMs = Date.now() - startedAt

  console.log('[AiSupportingDocumentEvaluationService] Power Automate response:', result)

  if (!result.success) {
    const message =
      result.error instanceof Error
        ? result.error.message
        : String(result.error?.message ?? result.error ?? 'Document summary flow request failed.')
    throw new Error(message)
  }

  if (isFlowFailureSummary(result.data?.summary)) {
    throw new Error('AI document analysis did not complete for this file. Please try again.')
  }

  return {
    fileName: file.name,
    analysisFileName: fileForAnalysis.name,
    mimeType,
    base64Length: base64Content.length,
    responseTimeMs,
    summary: result.data?.summary ?? '',
    rawResponse: result.data,
    parsedSummary: parseSupportingDocumentEvaluationSummary(result.data?.summary ?? result.data),
  }
}

export async function evaluateCumulativeSupportingDocuments(input: {
  fileInputs: SupportingDocumentFlowFileInput[]
}) {
  const startedAt = Date.now()
  const normalizedInputs = input.fileInputs
    .map((item) => ({
      filename: normalizeText(item.filename),
      fileResponse: item.fileResponse.trim(),
    }))
    .filter((item) => item.filename && item.fileResponse)

  const flowInput = {
    text: JSON.stringify({
      fileInputs: normalizedInputs,
    }),
  }

  console.log('[AiSupportingDocumentEvaluationService] Calling cumulative document summary flow:', {
    fileCount: normalizedInputs.length,
    flowInput,
  })

  const result = await PowerAppV2_GetCumulativeDocumentSummaryfromCompassService.Run(flowInput)
  const responseTimeMs = Date.now() - startedAt

  console.log('[AiSupportingDocumentEvaluationService] Cumulative document summary response:', result)

  if (!result.success) {
    const message =
      result.error instanceof Error
        ? result.error.message
        : String(result.error?.message ?? result.error ?? 'Cumulative document summary flow request failed.')
    throw new Error(message)
  }

  if (isFlowFailureSummary(result.data?.summary)) {
    throw new Error('AI cumulative document analysis did not complete. Please try again.')
  }

  return {
    summary: result.data?.summary ?? '',
    responseTimeMs,
    rawResponse: result.data,
    parsedSummary: parseSupportingDocumentEvaluationSummary(result.data?.summary ?? result.data),
  }
}
