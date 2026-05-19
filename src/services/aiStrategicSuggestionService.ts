import { getClient } from '@microsoft/power-apps/data'
import { dataSourcesInfo } from '../../.power/schemas/appschemas/dataSourcesInfo'
import { getStrategicPrioritySuggestionPrompt } from '@/services/aiPromptService'

const AI_DIRECT_CALL_DATA_SOURCE = 'dga_customwebapi'
const AI_DIRECT_CALL_OPERATION = 'dga_CustomWebApi'
const AI_ENDPOINT = 'https://api.core42.ai/v1/responses'
const AI_API_KEY = '4836e67e85f8489694433f56e98af88f'
const AI_MODEL = 'gpt-5.1'

export interface StrategicPrioritySuggestion {
  rank: number
  strategicPriority: string
  strategicPriorityClassification: string
  relevanceScore: number
  reason: string
}

export interface StrategicPrioritySuggestionResult {
  promptId: string
  promptUsecase: string
  formattedPrompt: string
  recommendations: StrategicPrioritySuggestion[]
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

function normalizeRecommendation(item: Record<string, unknown>) {
  const rank = Number(item.Rank ?? item.rank ?? 0)
  const relevanceScore = Number(item['Relevance Score'] ?? item.relevanceScore ?? item.score ?? 0)
  const strategicPriority = String(item['Strategic Priority'] ?? item.strategicPriority ?? '').trim()
  const strategicPriorityClassification = String(
    item['Strategic Priority Classification'] ?? item.strategicPriorityClassification ?? ''
  ).trim()
  const reason = String(item.Reason ?? item.reason ?? '').trim()

  if (!strategicPriority || !strategicPriorityClassification) {
    return null
  }

  return {
    rank: Number.isFinite(rank) && rank > 0 ? rank : 0,
    strategicPriority,
    strategicPriorityClassification,
    relevanceScore: Number.isFinite(relevanceScore) ? relevanceScore : 0,
    reason,
  } satisfies StrategicPrioritySuggestion
}

function extractRecommendationsFromOutputContent(payload: Record<string, unknown>) {
  const output = payload.output
  if (!Array.isArray(output)) {
    return []
  }

  for (const outputItem of output) {
    if (typeof outputItem !== 'object' || outputItem === null) {
      continue
    }

    const content = (outputItem as Record<string, unknown>).content
    if (!Array.isArray(content)) {
      continue
    }

    for (const contentItem of content) {
      if (typeof contentItem !== 'object' || contentItem === null) {
        continue
      }

      const textPayload = (contentItem as Record<string, unknown>).text
      const nested = toRecommendationArray(textPayload)
      if (nested.length > 0) {
        return nested
      }
    }
  }

  return []
}

function toRecommendationArray(payload: unknown): StrategicPrioritySuggestion[] {
  if (Array.isArray(payload)) {
    return payload
      .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
      .map(normalizeRecommendation)
      .filter((item): item is StrategicPrioritySuggestion => item !== null)
      .sort((left, right) => left.rank - right.rank)
  }

  if (typeof payload === 'string') {
    const parsed = extractJsonCandidate(payload)
    return parsed === null ? [] : toRecommendationArray(parsed)
  }

  if (typeof payload === 'object' && payload !== null) {
    const objectPayload = payload as Record<string, unknown>

    const prioritizedKeys = ['generateAIResponse', 'response', 'result', 'output', 'message', 'data', 'retrieveResponse']
    for (const key of prioritizedKeys) {
      if (key in objectPayload) {
        const nested = toRecommendationArray(objectPayload[key])
        if (nested.length > 0) {
          return nested
        }
      }
    }

    const outputRecommendations = extractRecommendationsFromOutputContent(objectPayload)
    if (outputRecommendations.length > 0) {
      return outputRecommendations
    }

    const singleRecommendation = normalizeRecommendation(objectPayload)
    if (singleRecommendation) {
      return [singleRecommendation]
    }
  }

  return []
}

export async function getStrategicPrioritySuggestions(input: {
  entityName: string
  projectName: string
  projectDescription: string
}) {
  const entityName = normalizeText(input.entityName)
  const projectName = normalizeText(input.projectName)
  const projectDescription = normalizeText(input.projectDescription)

  if (!projectName || !projectDescription) {
    throw new Error('Project Name and Project Description are required for AI suggestions.')
  }

  const promptTemplate = await getStrategicPrioritySuggestionPrompt()
  console.log('[AiStrategicSuggestionService] Prompt template from dga_ai_prompt:', promptTemplate)

  const formattedPrompt = buildPrompt(promptTemplate.prompt, {
    entityName,
    projectName,
    projectDescription,
  })

  console.log('[AiStrategicSuggestionService] Prompt interpolation values:', {
    entityName,
    projectName,
    projectDescription,
  })
  console.log('[AiStrategicSuggestionService] Final formatted prompt for custom API:', formattedPrompt)

  const requestBody: DirectCallBody = {
    action: 'directCall',
    endpoint: AI_ENDPOINT,
    apikey: AI_API_KEY,
    model: AI_MODEL,
    prompt: formattedPrompt,
  }

  console.log('[AiStrategicSuggestionService] Calling AI custom API with body:', requestBody)

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

  console.log('[AiStrategicSuggestionService] AI custom API result:', result)

  if (!result.success) {
    const message =
      result.error instanceof Error
        ? result.error.message
        : String(result.error?.message ?? result.error ?? 'AI strategic suggestion request failed.')
    throw new Error(message)
  }

  const recommendations = toRecommendationArray(result.data)
  console.log('[AiStrategicSuggestionService] Parsed AI recommendations:', recommendations)

  if (recommendations.length === 0) {
    throw new Error('AI response did not include any Strategic Priority recommendations.')
  }

  return {
    promptId: promptTemplate.id,
    promptUsecase: promptTemplate.usecase,
    formattedPrompt,
    recommendations,
    rawResponse: result.data,
  } satisfies StrategicPrioritySuggestionResult
}
