import { getClient } from '@microsoft/power-apps/data'
import { dataSourcesInfo } from '../../.power/schemas/appschemas/dataSourcesInfo'

const AI_PROMPT_DATA_SOURCE = 'dga_ai_prompts'
const STRATEGIC_PRIORITY_USECASE_MATCH = 'Strategic Priority & Classification Suggestion'
const ICT_BUDGET_CONSIDERATIONS_USECASE_MATCH = 'ICT Budget Considerations Evaluation Prompt'

interface AiPromptRecord {
  dga_ai_promptid?: string
  dga_ai_usecase?: string
  dga_prompt?: string
}

export interface AiPromptTemplate {
  id: string
  usecase: string
  prompt: string
}

let aiPromptTemplatesPromise: Promise<AiPromptTemplate[]> | null = null

function cleanPromptText(value: string) {
  return value
    .replace(/\r\n/g, '\n')
    .replace(/^#{1,6}\s*/gm, '')
    .replace(/^[-*]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    .replace(/\n{2,}/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join('\n')
}

function normalizePromptRecord(record: AiPromptRecord) {
  if (!record.dga_ai_promptid || !record.dga_prompt?.trim()) {
    return null
  }

  return {
    id: record.dga_ai_promptid,
    usecase: record.dga_ai_usecase?.trim() || 'Unknown AI Prompt Use Case',
    prompt: cleanPromptText(record.dga_prompt),
  } satisfies AiPromptTemplate
}

async function loadAllAiPrompts() {
  const client = getClient(dataSourcesInfo)
  const result = await client.retrieveMultipleRecordsAsync<AiPromptRecord>(AI_PROMPT_DATA_SOURCE, {
    select: ['dga_ai_promptid', 'dga_ai_usecase', 'dga_prompt'],
  })

  console.log('[AiPromptService] dga_ai_prompt query result:', result)

  if (!result.success) {
    const message =
      result.error instanceof Error
        ? result.error.message
        : String(result.error?.message ?? result.error ?? 'Unable to load AI prompts.')
    throw new Error(message)
  }

  const records = Array.isArray(result.data) ? result.data : []
  console.log('[AiPromptService] Retrieved dga_ai_prompt records:', records)

  const templates = records
    .map(normalizePromptRecord)
    .filter((record): record is AiPromptTemplate => record !== null)

  console.log('[AiPromptService] Normalized dga_ai_prompt templates:', templates)

  if (templates.length === 0) {
    throw new Error('No valid AI prompt records were found in dga_ai_prompt.')
  }

  return templates
}

async function getAllAiPromptTemplates() {
  if (!aiPromptTemplatesPromise) {
    aiPromptTemplatesPromise = loadAllAiPrompts().catch((error) => {
      aiPromptTemplatesPromise = null
      throw error
    })
  }

  return aiPromptTemplatesPromise
}

async function getPromptByUsecaseContains(usecaseMatch: string, notFoundMessage: string) {
  const templates = await getAllAiPromptTemplates()
  const normalizedNeedle = usecaseMatch.trim().toLowerCase()
  const template =
    templates.find((item) => item.usecase.toLowerCase().includes(normalizedNeedle)) ?? null

  console.log('[AiPromptService] Filtered dga_ai_prompt template:', {
    usecaseMatch,
    template,
  })

  if (!template) {
    throw new Error(notFoundMessage)
  }

  return template
}

export async function getStrategicPrioritySuggestionPrompt() {
  return getPromptByUsecaseContains(
    STRATEGIC_PRIORITY_USECASE_MATCH,
    'No AI prompt record was found for Strategic Priority suggestions.'
  )
}

export async function getIctBudgetConsiderationsEvaluationPrompt() {
  return getPromptByUsecaseContains(
    ICT_BUDGET_CONSIDERATIONS_USECASE_MATCH,
    'No AI prompt record was found for ICT Budget Considerations Evaluation Prompt.'
  )
}
