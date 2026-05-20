import { getClient } from '@microsoft/power-apps/data'
import { dataSourcesInfo } from '../../.power/schemas/appschemas/dataSourcesInfo'
import { getBudgetCopilotChatPrompt } from '@/services/repoPromptService'

const AI_DIRECT_CALL_DATA_SOURCE = 'dga_customwebapi'
const AI_DIRECT_CALL_OPERATION = 'dga_CustomWebApi'
const AI_ENDPOINT = 'https://api.core42.ai/v1/responses'
const AI_API_KEY = '4836e67e85f8489694433f56e98af88f'
const AI_MODEL = 'gpt-5.1'

const STRUCTURED_ANALYSIS_INSTRUCTION = [
  'Run structured extraction mode for the latest conversation.',
  'Return valid JSON only.',
  'Set assistant_message to an empty string.',
  'Use next_action ask_more, suggest_fields, explain_only, or refuse.',
  'Return suggested_project_fields when they can be supported from the conversation or current document evidence.',
  'Return budget_lines when the conversation or document evidence supports them.',
  'Return warnings and missing_information when useful.',
].join('\n')

interface DirectCallBody {
  action: 'directCall'
  endpoint: string
  apikey: string
  model: string
  prompt: string
}

export interface BudgetCopilotChatMessage {
  role: 'assistant' | 'user'
  content: string
}

export interface BudgetCopilotRuntimeContext {
  current_form_state: unknown
  uploaded_documents: unknown[]
  file_analyses: unknown[]
  cumulative_analysis: unknown | null
  budget_rows: unknown[]
  pending_suggestions: unknown | null
  entity_name: string
}

function formatConversationTranscript(messages: BudgetCopilotChatMessage[]) {
  return messages
    .filter((message) => message.content.trim())
    .map((message) => `${message.role === 'assistant' ? 'Assistant' : 'User'}: ${message.content.trim()}`)
    .join('\n\n')
}

function buildPrompt(params: {
  systemPrompt: string
  runtimeContext: BudgetCopilotRuntimeContext
  messages: BudgetCopilotChatMessage[]
  instruction: string
}) {
  return [
    params.systemPrompt.trim(),
    '',
    'Runtime context for the current ICT budget project:',
    JSON.stringify(params.runtimeContext, null, 2),
    '',
    'Conversation transcript:',
    formatConversationTranscript(params.messages) || '[No conversation yet]',
    '',
    params.instruction.trim(),
  ].join('\n')
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

  const objectStart = trimmed.indexOf('{')
  const objectEnd = trimmed.lastIndexOf('}')
  if (objectStart >= 0 && objectEnd > objectStart) {
    return tryParseJson(trimmed.slice(objectStart, objectEnd + 1))
  }

  const arrayStart = trimmed.indexOf('[')
  const arrayEnd = trimmed.lastIndexOf(']')
  if (arrayStart >= 0 && arrayEnd > arrayStart) {
    return tryParseJson(trimmed.slice(arrayStart, arrayEnd + 1))
  }

  return null
}

function extractTextFromResult(payload: unknown): string {
  if (!payload) return ''

  if (typeof payload === 'string') {
    const parsed = tryParseJson(payload)
    if (parsed !== null) {
      return extractTextFromResult(parsed)
    }
    return payload
  }

  if (typeof payload !== 'object') {
    return String(payload)
  }

  // Handle Core42 output array directly (e.g. when recursed from the `output` key)
  if (Array.isArray(payload)) {
    const parts: string[] = []
    for (const item of payload) {
      if (typeof item !== 'object' || item === null) continue
      const content = (item as Record<string, unknown>).content
      if (!Array.isArray(content)) continue
      for (const contentItem of content) {
        if (typeof contentItem !== 'object' || contentItem === null) continue
        const text = (contentItem as Record<string, unknown>).text
        if (typeof text === 'string' && text.trim()) {
          parts.push(text)
        }
      }
    }
    if (parts.length > 0) return parts.join('\n').trim()
    return ''
  }

  const record = payload as Record<string, unknown>

  if (typeof record.output_text === 'string' && record.output_text.trim()) {
    return record.output_text
  }

  const prioritizedKeys = ['generateAIResponse', 'response', 'result', 'output', 'message', 'data', 'retrieveResponse']
  for (const key of prioritizedKeys) {
    if (!(key in record)) continue
    const nestedText = extractTextFromResult(record[key])
    if (nestedText.trim()) {
      return nestedText
    }
  }

  return JSON.stringify(payload)
}

async function callBudgetCopilotPrompt(prompt: string) {
  const requestBody: DirectCallBody = {
    action: 'directCall',
    endpoint: AI_ENDPOINT,
    apikey: AI_API_KEY,
    model: AI_MODEL,
    prompt,
  }

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

  if (!result.success) {
    const message =
      result.error instanceof Error
        ? result.error.message
        : String(result.error?.message ?? result.error ?? 'Budget Copilot request failed.')
    throw new Error(message)
  }

  return {
    rawResponse: result.data,
    text: extractTextFromResult(result.data),
  }
}

export async function getBudgetCopilotChatReply(input: {
  messages: BudgetCopilotChatMessage[]
  runtimeContext: BudgetCopilotRuntimeContext
}) {
  const systemPrompt = await getBudgetCopilotChatPrompt()
  const prompt = buildPrompt({
    systemPrompt,
    runtimeContext: input.runtimeContext,
    messages: input.messages,
    instruction:
      'Reply as Budget Copilot. Be concise, helpful, and focused on ICT budget project creation. Do not return JSON. Keep suggestions advisory until the user applies them.',
  })

  return callBudgetCopilotPrompt(prompt)
}

export async function getBudgetCopilotStructuredAnalysis(input: {
  messages: BudgetCopilotChatMessage[]
  runtimeContext: BudgetCopilotRuntimeContext
}) {
  const systemPrompt = await getBudgetCopilotChatPrompt()
  const prompt = buildPrompt({
    systemPrompt,
    runtimeContext: input.runtimeContext,
    messages: input.messages,
    instruction: STRUCTURED_ANALYSIS_INSTRUCTION,
  })

  const result = await callBudgetCopilotPrompt(prompt)
  return {
    ...result,
    parsed: typeof result.text === 'string' ? extractJsonCandidate(result.text) : null,
  }
}
