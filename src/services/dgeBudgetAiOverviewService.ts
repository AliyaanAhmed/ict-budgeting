import { PowerAppV2_GetICTBudgetAIOverview_DGE_Service } from '@/generated/services/PowerAppV2_GetICTBudgetAIOverview_DGE_Service'

export async function triggerDgeBudgetAiOverview(budgetId: string) {
  const normalizedBudgetId = budgetId.trim()
  if (!normalizedBudgetId) {
    throw new Error('ICT budget id is required to trigger the DGE AI overview flow.')
  }

  const result = await PowerAppV2_GetICTBudgetAIOverview_DGE_Service.Run({
    text: normalizedBudgetId,
  })

  if (result.error) {
    throw new Error(result.error.message?.trim() || 'Failed to trigger the DGE ICT Budget AI Overview flow.')
  }
}
