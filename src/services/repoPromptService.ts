import budgetCopilotChatAssistantPrompt from '../../BudgetCopilotStandalone/Prompts/budget-copilot-chat-assistant.md?raw'

const PROMPTS = {
  budgetCopilotChatAssistant: budgetCopilotChatAssistantPrompt,
} as const

export type RepoPromptKey = keyof typeof PROMPTS

export async function getRepoPrompt(key: RepoPromptKey) {
  return PROMPTS[key]
}

export async function getBudgetCopilotChatPrompt() {
  return getRepoPrompt('budgetCopilotChatAssistant')
}
