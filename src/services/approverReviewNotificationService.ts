import { Dga_ict_budgetsService } from '@/generated/services/Dga_ict_budgetsService'
import { PowerAppV2_ICTBudget_OnModifyStatustoUnderApproverReview_SendEmailtoApproverService } from '@/generated/services/PowerAppV2_ICTBudget_OnModifyStatustoUnderApproverReview_SendEmailtoApproverService'

const UNDER_APPROVER_REVIEW = 3

function getOperationError(error: unknown, fallback: string) {
  if (error && typeof error === 'object' && 'message' in error) {
    const message = String(error.message).trim()
    if (message) return message
  }
  return fallback
}

export async function notifyApproverWhenInstanceIsReady(): Promise<boolean> {
  const instanceId = sessionStorage.getItem('instanceID')?.replace(/[{}]/g, '').trim()
  if (!instanceId) throw new Error('The current ICT budget instance ID is missing from the session.')

  const budgetsResult = await Dga_ict_budgetsService.getAll({
    select: ['dga_ict_budgetid', 'dga_status_for_adge'],
    filter: `_dga_ict_budget_instance_value eq ${instanceId}`,
    maxPageSize: 500,
  })

  if (!budgetsResult.success) {
    throw new Error(getOperationError(budgetsResult.error, 'Unable to verify whether every project is with the approver.'))
  }

  const budgets = budgetsResult.data ?? []
  const allSubmittedToApprover =
    budgets.length > 0 &&
    budgets.every((budget) => Number(budget.dga_status_for_adge) === UNDER_APPROVER_REVIEW)

  if (!allSubmittedToApprover) return false

  const flowResult = await PowerAppV2_ICTBudget_OnModifyStatustoUnderApproverReview_SendEmailtoApproverService.Run({
    text: instanceId,
  })

  if (!flowResult.success) {
    throw new Error(getOperationError(flowResult.error, 'All projects were submitted, but the Approver notification could not be sent.'))
  }

  return true
}
