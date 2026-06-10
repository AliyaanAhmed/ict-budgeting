import { Dga_ict_budgetsService } from '@/generated/services/Dga_ict_budgetsService'
import { Dga_ict_budget_line_itemsService } from '@/generated/services/Dga_ict_budget_line_itemsService'
import { getStoredCurrentSme, getStoredStrategyTeam } from '@/services/dgeRoleContextService'
import {
  DGE_BUDGET_STATUS,
  getSmeAssignmentByPriorityId,
  type DgeBudgetRecord,
} from '@/services/dgePortfolioService'
import { grantIctBudgetAccessToTeam, revokeIctBudgetAccessFromTeam } from '@/services/recordShareService'

function assertSuccess(success: boolean | undefined, message: string, error?: { message?: string } | null) {
  if (!success) {
    throw new Error(error?.message?.trim() || message)
  }
}

async function prepareRecommendedBudgetForQualityCheck(budgetId: string) {
  const budgetResult = await Dga_ict_budgetsService.get(budgetId, {
    select: ['dga_ict_budgetid', 'dga_recommended', 'dga_rejection_reason', 'dga_rejection_justification'],
  })

  const budget = budgetResult.data
  const recommended = budget?.dga_recommended ?? null
  const rejectionReason = budget?.dga_rejection_reason ?? null
  const rejectionJustification = budget?.dga_rejection_justification?.trim() || ''

  if (recommended == null) {
    throw new Error('Recommended must be selected before routing this project to quality check.')
  }

  const lineItemsResult = await Dga_ict_budget_line_itemsService.getAll({
    select: ['dga_ict_budget_line_itemid', 'dga_budget_requested', 'dga_budget_recommended'],
    filter: `_dga_ict_budget_value eq ${budgetId}`,
  })

  const lineItems = lineItemsResult.data ?? []

  if (recommended === 2) {
    await Promise.all(
      lineItems
        .filter((item) => item.dga_ict_budget_line_itemid)
        .map((item) =>
          Dga_ict_budget_line_itemsService.update(item.dga_ict_budget_line_itemid!, {
            dga_budget_recommended: Number((item.dga_budget_recommended ?? item.dga_budget_requested ?? 0).toFixed(4)),
          } as never)
        )
    )
    return
  }

  if (!rejectionReason || !rejectionJustification) {
    throw new Error('Rejection Reason and Rejection Justification are required when Recommended is set to No.')
  }

  await Promise.all(
    lineItems
      .filter((item) => item.dga_ict_budget_line_itemid)
      .map((item) =>
        Dga_ict_budget_line_itemsService.update(item.dga_ict_budget_line_itemid!, {
          dga_budget_recommended: 0,
        } as never)
      )
  )
}

export async function validateBudgetReadyForQualityCheck(budgetId: string) {
  const budgetResult = await Dga_ict_budgetsService.get(budgetId, {
    select: ['dga_ict_budgetid', 'dga_recommended', 'dga_rejection_reason', 'dga_rejection_justification'],
  })

  const budget = budgetResult.data
  const recommended = budget?.dga_recommended ?? null
  const rejectionReason = budget?.dga_rejection_reason ?? null
  const rejectionJustification = budget?.dga_rejection_justification?.trim() || ''

  if (recommended == null) {
    throw new Error('Recommended must be selected before routing this project to quality check.')
  }

  if (recommended === 1 && (!rejectionReason || !rejectionJustification)) {
    throw new Error('Rejection Reason and Rejection Justification are required when Recommended is set to No.')
  }
}

export async function updateBudgetStrategicClassification(
  budgetIds: string[],
  strategicPriorityId: string,
  strategicPriorityClassificationId: string
) {
  await Promise.all(
    budgetIds.map(async (budgetId) => {
      const result = await Dga_ict_budgetsService.update(budgetId, {
        'dga_strategic_priority@odata.bind': `/dga_strategic_prioritieses(${strategicPriorityId})`,
        'dga_strategic_priority_classification@odata.bind': `/dga_strategic_prioritieses(${strategicPriorityClassificationId})`,
      })

      assertSuccess(result.success, 'Unable to update strategic priority and classification.', result.error ?? null)
    })
  )
}

export async function sendBudgetsToSme(budgets: DgeBudgetRecord[]) {
  const strategyTeam = getStoredStrategyTeam()

  await Promise.all(
    budgets.map(async (budget) => {
      const smeAssignment = getSmeAssignmentByPriorityId(budget.strategicPriorityId)
      if (!smeAssignment?.teamId) {
        throw new Error(`No SME team mapping found for ${budget.strategicPriorityName || 'this strategic priority'}.`)
      }

      const result = await Dga_ict_budgetsService.update(budget.id, {
        statuscode: DGE_BUDGET_STATUS.underSmeReview,
        dga_status_for_adge: 6,
        'ownerid@odata.bind': `/teams(${smeAssignment.teamId})`,
        'dga_sme_reviewer_team@odata.bind': `/teams(${smeAssignment.teamId})`,
      } as never)

      assertSuccess(result.success, 'Unable to assign project to SME team.', result.error ?? null)

      if (strategyTeam?.teamId) {
        await grantIctBudgetAccessToTeam(budget.id, strategyTeam.teamId)
      }
    })
  )
}

export async function reviewStrategicPriorityChange(
  budget: DgeBudgetRecord,
  decision: 'approve' | 'reject'
) {
  const currentSmeAssignment = getSmeAssignmentByPriorityId(budget.strategicPriorityId)
  const requestedSmeAssignment = getSmeAssignmentByPriorityId(budget.previousStrategicPriorityId)

  const nextPriorityId =
    decision === 'approve' ? budget.previousStrategicPriorityId : budget.strategicPriorityId
  const nextClassificationId =
    decision === 'approve'
      ? budget.previousStrategicPriorityClassificationId
      : budget.strategicPriorityClassificationId

  const nextSmeAssignment = getSmeAssignmentByPriorityId(nextPriorityId)
  if (!nextSmeAssignment?.teamId) {
    throw new Error('Unable to resolve the target SME team for the selected strategic priority.')
  }

  console.log('[DgeWorkflowService] Reviewing strategic priority change:', {
    budgetId: budget.id,
    budgetName: budget.name,
    decision,
    currentPriorityId: budget.strategicPriorityId,
    currentPriorityName: budget.strategicPriorityName,
    requestedPriorityId: budget.previousStrategicPriorityId,
    requestedPriorityName: budget.previousStrategicPriorityName,
    currentSmeAssignment,
    requestedSmeAssignment,
    nextPriorityId,
    nextClassificationId,
    nextSmeAssignment,
  })

  const payload: Record<string, unknown> = {
    statuscode: DGE_BUDGET_STATUS.underSmeReview,
    dga_status_for_adge: 6,
    'ownerid@odata.bind': `/teams(${nextSmeAssignment.teamId})`,
    'dga_sme_reviewer_team@odata.bind': `/teams(${nextSmeAssignment.teamId})`,
    'dga_previous_strategic_priority@odata.bind': null,
    'dga_previous_strategic_priorityclassification@odata.bind': null,
  }

  if (decision === 'approve') {
    payload['dga_strategic_priority@odata.bind'] = nextPriorityId
      ? `/dga_strategic_prioritieses(${nextPriorityId})`
      : null
    payload['dga_strategic_priority_classification@odata.bind'] = nextClassificationId
      ? `/dga_strategic_prioritieses(${nextClassificationId})`
      : null
  }

  const result = await Dga_ict_budgetsService.update(budget.id, payload as never)

  assertSuccess(result.success, 'Unable to process strategic priority change review.', result.error ?? null)

  const previousTeamId =
    decision === 'approve' ? currentSmeAssignment?.teamId ?? null : requestedSmeAssignment?.teamId ?? null
  console.log('[DgeWorkflowService] Strategic priority change sharing resolution:', {
    budgetId: budget.id,
    decision,
    previousTeamId,
    nextTeamId: nextSmeAssignment.teamId,
    willRevoke: Boolean(previousTeamId && previousTeamId !== nextSmeAssignment.teamId),
  })

  if (previousTeamId && previousTeamId !== nextSmeAssignment.teamId) {
    await revokeIctBudgetAccessFromTeam(budget.id, previousTeamId)
  } else {
    console.log('[DgeWorkflowService] Revoke skipped for strategic priority change:', {
      budgetId: budget.id,
      previousTeamId,
      nextTeamId: nextSmeAssignment.teamId,
      reason: previousTeamId ? 'same-team' : 'missing-previous-team',
    })
  }

  await grantIctBudgetAccessToTeam(budget.id, nextSmeAssignment.teamId)
}

export async function requestStrategicPriorityChange(
  budget: DgeBudgetRecord,
  strategicPriorityId: string,
  strategicPriorityClassificationId: string
) {
  const strategyTeam = getStoredStrategyTeam()
  const currentSme = getStoredCurrentSme()

  if (!strategyTeam?.teamId) {
    throw new Error('Strategy Team is not configured for this workspace.')
  }

  if (!currentSme?.teamId) {
    throw new Error('Current SME domain is missing from session storage.')
  }

  const result = await Dga_ict_budgetsService.update(budget.id, {
    statuscode: DGE_BUDGET_STATUS.strategicPriorityChangeUnderReview,
    dga_status_for_adge: 6,
    'ownerid@odata.bind': `/teams(${strategyTeam.teamId})`,
    'dga_previous_strategic_priority@odata.bind': `/dga_strategic_prioritieses(${strategicPriorityId})`,
    'dga_previous_strategic_priorityclassification@odata.bind': `/dga_strategic_prioritieses(${strategicPriorityClassificationId})`,
  } as never)

  assertSuccess(result.success, 'Unable to submit strategic priority change request.', result.error ?? null)

  await Promise.all([
    grantIctBudgetAccessToTeam(budget.id, strategyTeam.teamId),
    grantIctBudgetAccessToTeam(budget.id, currentSme.teamId),
  ])
}

export async function routeBudgetToQualityCheck(budget: DgeBudgetRecord) {
  const strategyTeam = getStoredStrategyTeam()
  const currentSme = getStoredCurrentSme()
  const currentUserId = sessionStorage.getItem('userID')?.trim() || ''

  if (!strategyTeam?.teamId) {
    throw new Error('Strategy Team is not configured for this workspace.')
  }

  if (!currentSme?.teamId) {
    throw new Error('Current SME domain is missing from session storage.')
  }

  if (!currentUserId) {
    throw new Error('Current user id is missing from session storage.')
  }

  await prepareRecommendedBudgetForQualityCheck(budget.id)

  const result = await Dga_ict_budgetsService.update(budget.id, {
    statuscode: DGE_BUDGET_STATUS.underQualityCheck,
    dga_status_for_adge: 6,
    'ownerid@odata.bind': `/teams(${strategyTeam.teamId})`,
    'dga_strategic_alignment_reviewer_systemuser@odata.bind': `/systemusers(${currentUserId})`,
    'dga_sme_reviewer_user@odata.bind': `/systemusers(${currentUserId})`,
  } as never)

  assertSuccess(result.success, 'Unable to route project to quality check.', result.error ?? null)

  await Promise.all([
    grantIctBudgetAccessToTeam(budget.id, strategyTeam.teamId),
    grantIctBudgetAccessToTeam(budget.id, currentSme.teamId),
  ])
}
