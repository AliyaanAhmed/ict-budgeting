import { getClient } from '@microsoft/power-apps/data'
import { dataSourcesInfo } from '../../.power/schemas/appschemas/dataSourcesInfo'
import { getIctBudgetConsiderationsEvaluationPrompt } from '@/services/aiPromptService'

const AI_DIRECT_CALL_DATA_SOURCE = 'dga_customwebapi'
const AI_DIRECT_CALL_OPERATION = 'dga_CustomWebApi'
const AI_ENDPOINT = 'https://api.core42.ai/v1/responses'
const AI_API_KEY = '4836e67e85f8489694433f56e98af88f'
const AI_MODEL = 'gpt-5.1'

export type PolicyMatchType =
  | 'Potential Conflict'
  | 'Coordination Required'
  | 'Allowed With Conditions'

export interface PolicyAssessmentItem {
  policyNumber: string
  policyName: string
  strategicArea: string
  matchType: PolicyMatchType
  relevanceScore: number
  reason: string
  evidenceFromProject: string[]
  requiredAction: string
}

export interface PolicyOverallAssessment {
  hasPolicyMatch: boolean
  hasPotentialConflict: boolean
  hasCoordinationRequirement: boolean
  hasAllowedWithConditions: boolean
  summary: string
}

export interface IctBudgetConsiderationsEvaluationResult {
  promptId: string
  promptUsecase: string
  formattedPrompt: string
  assessmentItems: PolicyAssessmentItem[]
  overallAssessment: PolicyOverallAssessment
  rawResponse: unknown
}

interface DirectCallBody {
  action: 'directCall'
  endpoint: string
  apikey: string
  model: string
  prompt: string
}

function normalizeText(value: string) {
  return value.trim().replace(/\s+/g, ' ')
}

function escapePromptValue(value: string) {
  return value.trim()
}

function buildPrompt(template: string, values: { entityName: string; projectName: string; projectDescription: string }) {
  return template
    .replace(/\{\{ENTITY_NAME\}\}/g, escapePromptValue(values.entityName))
    .replace(/\{\{PROJECT_NAME\}\}/g, escapePromptValue(values.projectName))
    .replace(/\{\{PROJECT_DESCRIPTION\}\}/g, escapePromptValue(values.projectDescription))
}

function tryParseJson(value: string) {
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

function extractJsonCandidate(value: string) {
  const trimmed = value.trim()
  const direct = tryParseJson(trimmed)
  if (direct !== null) {
    return direct
  }

  const arrayStart = trimmed.indexOf('[')
  const arrayEnd = trimmed.lastIndexOf(']')
  if (arrayStart >= 0 && arrayEnd > arrayStart) {
    const parsedArray = tryParseJson(trimmed.slice(arrayStart, arrayEnd + 1))
    if (parsedArray !== null) {
      return parsedArray
    }
  }

  const objectStart = trimmed.indexOf('{')
  const objectEnd = trimmed.lastIndexOf('}')
  if (objectStart >= 0 && objectEnd > objectStart) {
    return tryParseJson(trimmed.slice(objectStart, objectEnd + 1))
  }

  return null
}

function normalizeMatchType(value: unknown): PolicyMatchType | null {
  const normalized = String(value ?? '').trim().toLowerCase()
  if (normalized === 'potential conflict') return 'Potential Conflict'
  if (normalized === 'coordination required') return 'Coordination Required'
  if (normalized === 'allowed with conditions') return 'Allowed With Conditions'
  return null
}

function normalizePolicyAssessmentItem(item: Record<string, unknown>) {
  const matchType = normalizeMatchType(item['Match Type'] ?? item.matchType)
  if (!matchType) {
    return null
  }

  const policyNumber = String(item['Policy Number'] ?? item.policyNumber ?? '').trim()
  const policyName = String(item['Policy Name'] ?? item.policyName ?? '').trim()
  if (!policyNumber || !policyName) {
    return null
  }

  const evidenceSource = item['Evidence From Project'] ?? item.evidenceFromProject
  const evidence = Array.isArray(evidenceSource)
    ? evidenceSource
        .filter((value: unknown): value is string => typeof value === 'string')
        .map((value: string) => value.trim())
        .filter(Boolean)
    : []

  return {
    policyNumber,
    policyName,
    strategicArea: String(item['Strategic Area'] ?? item.strategicArea ?? '').trim(),
    matchType,
    relevanceScore: Number(item['Relevance Score'] ?? item.relevanceScore ?? 0) || 0,
    reason: String(item.Reason ?? item.reason ?? '').trim(),
    evidenceFromProject: evidence,
    requiredAction: String(item['Required Action'] ?? item.requiredAction ?? '').trim(),
  } satisfies PolicyAssessmentItem
}

function normalizeOverallAssessment(value: Record<string, unknown> | null) {
  return {
    hasPolicyMatch: Boolean(value?.['Has Policy Match'] ?? value?.hasPolicyMatch),
    hasPotentialConflict: Boolean(value?.['Has Potential Conflict'] ?? value?.hasPotentialConflict),
    hasCoordinationRequirement: Boolean(
      value?.['Has Coordination Requirement'] ?? value?.hasCoordinationRequirement
    ),
    hasAllowedWithConditions: Boolean(
      value?.['Has Allowed With Conditions'] ?? value?.hasAllowedWithConditions
    ),
    summary: String(value?.Summary ?? value?.summary ?? '').trim(),
  } satisfies PolicyOverallAssessment
}

function extractAssessmentPayload(payload: unknown): {
  assessmentItems: PolicyAssessmentItem[]
  overallAssessment: PolicyOverallAssessment | null
} | null {
  if (typeof payload === 'string') {
    const parsed = extractJsonCandidate(payload)
    return parsed === null ? null : extractAssessmentPayload(parsed)
  }

  if (typeof payload !== 'object' || payload === null) {
    return null
  }

  const objectPayload = payload as Record<string, unknown>
  const assessment = objectPayload.project_policy_assessment
  const overall = objectPayload.overall_assessment

  if (Array.isArray(assessment) || overall) {
    const assessmentItems = Array.isArray(assessment)
      ? assessment
          .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
          .map(normalizePolicyAssessmentItem)
          .filter((item): item is PolicyAssessmentItem => item !== null)
      : []

    return {
      assessmentItems,
      overallAssessment: normalizeOverallAssessment(
        typeof overall === 'object' && overall !== null ? (overall as Record<string, unknown>) : null
      ),
    }
  }

  const prioritizedKeys = ['generateAIResponse', 'response', 'result', 'output', 'message', 'data', 'retrieveResponse']
  for (const key of prioritizedKeys) {
    if (!(key in objectPayload)) continue
    const nested = extractAssessmentPayload(objectPayload[key])
    if (nested) {
      return nested
    }
  }

  const output = objectPayload.output
  if (Array.isArray(output)) {
    for (const outputItem of output) {
      if (typeof outputItem !== 'object' || outputItem === null) continue
      const content = (outputItem as Record<string, unknown>).content
      if (!Array.isArray(content)) continue

      for (const contentItem of content) {
        if (typeof contentItem !== 'object' || contentItem === null) continue
        const nested = extractAssessmentPayload((contentItem as Record<string, unknown>).text)
        if (nested) {
          return nested
        }
      }
    }
  }

  return null
}

export async function evaluateIctBudgetConsiderations(input: {
  entityName: string
  projectName: string
  projectDescription: string
}) {
  const entityName = normalizeText(input.entityName)
  const projectName = normalizeText(input.projectName)
  const projectDescription = normalizeText(input.projectDescription)

  if (!projectName || !projectDescription) {
    throw new Error('Project Name and Project Description are required for ICT Budget Considerations evaluation.')
  }

  const promptTemplate = await getIctBudgetConsiderationsEvaluationPrompt()
  console.log('[AiBudgetConsiderationsService] Prompt template from dga_ai_prompt:', promptTemplate)

  const formattedPrompt = buildPrompt(promptTemplate.prompt, {
    entityName,
    projectName,
    projectDescription,
  })

  console.log('[AiBudgetConsiderationsService] Prompt interpolation values:', {
    entityName,
    projectName,
    projectDescription,
  })
  console.log('[AiBudgetConsiderationsService] Final formatted prompt for custom API:', formattedPrompt)

  const requestBody: DirectCallBody = {
    action: 'directCall',
    endpoint: AI_ENDPOINT,
    apikey: AI_API_KEY,
    model: AI_MODEL,
    prompt: formattedPrompt,
  }

  console.log('[AiBudgetConsiderationsService] Calling AI custom API with body:', requestBody)

  const client = getClient(dataSourcesInfo)
  const result = await client.executeAsync<DirectCallBody, unknown>({
    dataverseRequest: {
      action: 'customapi',
      parameters: {
        operationName: AI_DIRECT_CALL_OPERATION,
        tableName: AI_DIRECT_CALL_DATA_SOURCE,
        body: requestBody,
      },
    },
  })

  console.log('[AiBudgetConsiderationsService] AI custom API result:', result)

  if (!result.success) {
    const message =
      result.error instanceof Error
        ? result.error.message
        : String(result.error?.message ?? result.error ?? 'AI ICT Budget Considerations request failed.')
    throw new Error(message)
  }

  const parsedAssessment = extractAssessmentPayload(result.data)
  console.log('[AiBudgetConsiderationsService] Parsed ICT Budget Considerations assessment:', parsedAssessment)

  if (!parsedAssessment?.overallAssessment) {
    throw new Error('AI response did not include a valid ICT Budget Considerations assessment.')
  }

  return {
    promptId: promptTemplate.id,
    promptUsecase: promptTemplate.usecase,
    formattedPrompt,
    assessmentItems: parsedAssessment.assessmentItems,
    overallAssessment: parsedAssessment.overallAssessment,
    rawResponse: result.data,
  } satisfies IctBudgetConsiderationsEvaluationResult
}
