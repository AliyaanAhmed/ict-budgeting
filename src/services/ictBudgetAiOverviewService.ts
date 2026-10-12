import { PowerAppV2_GetICTBudgetAIOverviewService } from '@/generated/services/PowerAppV2_GetICTBudgetAIOverviewService'

export async function triggerIctBudgetAiOverview(budgetId: string) {
  const normalizedBudgetId = budgetId.trim()
  if (!normalizedBudgetId) {
    throw new Error('ICT budget id is required to trigger the AI overview flow.')
  }

  const result = await PowerAppV2_GetICTBudgetAIOverviewService.Run({
    text: normalizedBudgetId,
  })

  if (result.error) {
    throw new Error(
      result.error.message?.trim() || 'Failed to trigger the ICT Budget AI Overview flow.'
    )
  }
}
