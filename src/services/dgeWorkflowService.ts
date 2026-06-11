import { Dga_ict_budgetsService } from '@/generated/services/Dga_ict_budgetsService'
import { Dga_ict_budget_instancesService } from '@/generated/services/Dga_ict_budget_instancesService'
import { Dga_ict_budget_line_itemsService } from '@/generated/services/Dga_ict_budget_line_itemsService'
import { getStoredCurrentSme, getStoredStrategyDirectorTeam, getStoredStrategyTeam } from '@/services/dgeRoleContextService'
import {
  DGE_BUDGET_STATUS,
  DGE_INSTANCE_STATUS,
  getSmeAssignmentByPriorityId,
  type DgeBudgetRecord,
} from '@/services/dgePortfolioService'
import { ICT_BUDGET_STATUS } from '@/services/ictBudgetDraftService'
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

  const previousTeamId = currentSmeAssignment?.teamId ?? null
  console.log('[DgeWorkflowService] Strategic priority change sharing resolution:', {
    budgetId: budget.id,
    decision,
    previousTeamId,
    nextTeamId: nextSmeAssignment.teamId,
    willRevoke: decision === 'approve' && Boolean(previousTeamId && previousTeamId !== nextSmeAssignment.teamId),
  })

  if (decision === 'approve' && previousTeamId && previousTeamId !== nextSmeAssignment.teamId) {
    await revokeIctBudgetAccessFromTeam(budget.id, previousTeamId)
  } else {
    console.log('[DgeWorkflowService] Revoke skipped for strategic priority change:', {
      budgetId: budget.id,
      previousTeamId,
      nextTeamId: nextSmeAssignment.teamId,
      reason: decision === 'reject' ? 'reject-does-not-change-sharing' : previousTeamId ? 'same-team' : 'missing-previous-team',
    })
  }

  const result = await Dga_ict_budgetsService.update(budget.id, payload as never)

  assertSuccess(result.success, 'Unable to process strategic priority change review.', result.error ?? null)
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

  await grantIctBudgetAccessToTeam(budget.id, currentSme.teamId)

  const result = await Dga_ict_budgetsService.update(budget.id, {
    statuscode: DGE_BUDGET_STATUS.strategicPriorityChangeUnderReview,
    dga_status_for_adge: 6,
    'ownerid@odata.bind': `/teams(${strategyTeam.teamId})`,
    'dga_previous_strategic_priority@odata.bind': `/dga_strategic_prioritieses(${strategicPriorityId})`,
    'dga_previous_strategic_priorityclassification@odata.bind': `/dga_strategic_prioritieses(${strategicPriorityClassificationId})`,
  } as never)

  assertSuccess(result.success, 'Unable to submit strategic priority change request.', result.error ?? null)
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

  await grantIctBudgetAccessToTeam(budget.id, currentSme.teamId)

  const result = await Dga_ict_budgetsService.update(budget.id, {
    statuscode: DGE_BUDGET_STATUS.underQualityCheck,
    dga_status_for_adge: 6,
    'ownerid@odata.bind': `/teams(${strategyTeam.teamId})`,
    'dga_strategic_alignment_reviewer_systemuser@odata.bind': `/systemusers(${currentUserId})`,
    'dga_sme_reviewer_user@odata.bind': `/systemusers(${currentUserId})`,
  } as never)

  assertSuccess(result.success, 'Unable to route project to quality check.', result.error ?? null)

  await grantIctBudgetAccessToTeam(budget.id, strategyTeam.teamId)
}

export async function routeBudgetToDirectorReview(budget: DgeBudgetRecord) {
  const directorTeam = getStoredStrategyDirectorTeam()
  const strategyTeam = getStoredStrategyTeam()

  if (!directorTeam?.teamId) {
    throw new Error('Strategy Director team is not configured for this workspace.')
  }

  await grantIctBudgetAccessToTeam(budget.id, directorTeam.teamId)

  const result = await Dga_ict_budgetsService.update(budget.id, {
    statuscode: DGE_BUDGET_STATUS.underFinalReview,
    dga_status_for_adge: ICT_BUDGET_STATUS.underDgeReview,
    'ownerid@odata.bind': `/teams(${directorTeam.teamId})`,
  } as never)

  assertSuccess(result.success, 'Unable to route project to Strategy Director.', result.error ?? null)

  if (strategyTeam?.teamId) {
    await grantIctBudgetAccessToTeam(budget.id, strategyTeam.teamId)
  }
}

export async function completeDirectorReview(budget: DgeBudgetRecord) {
  const directorTeam = getStoredStrategyDirectorTeam()
  const budgetResult = await Dga_ict_budgetsService.get(budget.id, {
    select: ['dga_ict_budgetid', 'dga_recommended'],
  })

  const recommended = budgetResult.data?.dga_recommended ?? null
  const planningOutcome =
    recommended === 2
      ? 1
      : recommended === 1
        ? 2
        : null

  const result = await Dga_ict_budgetsService.update(budget.id, {
    statuscode: DGE_BUDGET_STATUS.reviewCompleted,
    dga_status_for_adge: ICT_BUDGET_STATUS.underDgeReview,
    ...(planningOutcome != null ? { dga_planning_outcome: planningOutcome } : {}),
    ...(directorTeam?.teamId ? { 'ownerid@odata.bind': `/teams(${directorTeam.teamId})` } : {}),
  } as never)

  assertSuccess(result.success, 'Unable to complete director review.', result.error ?? null)
}

export async function assignDirectorClarificationToStrategy(budget: DgeBudgetRecord) {
  const strategyTeam = getStoredStrategyTeam()
  const directorTeam = getStoredStrategyDirectorTeam()

  if (!strategyTeam?.teamId) {
    throw new Error('Strategy Team is not configured for this workspace.')
  }

  if (!directorTeam?.teamId) {
    throw new Error('Strategy Director team is not configured for this workspace.')
  }

  await grantIctBudgetAccessToTeam(budget.id, directorTeam.teamId)

  const result = await Dga_ict_budgetsService.update(budget.id, {
    statuscode: DGE_BUDGET_STATUS.clarificationPending,
    dga_status_for_adge: ICT_BUDGET_STATUS.underDgeReview,
    'ownerid@odata.bind': `/teams(${strategyTeam.teamId})`,
  } as never)

  assertSuccess(result.success, 'Unable to assign clarification to Strategy Team.', result.error ?? null)

  await grantIctBudgetAccessToTeam(budget.id, strategyTeam.teamId)
}

export async function assignDirectorClarificationToSme(budget: DgeBudgetRecord) {
  const directorTeam = getStoredStrategyDirectorTeam()
  const smeAssignment = budget.smeReviewerTeamId
    ? { teamId: budget.smeReviewerTeamId }
    : getSmeAssignmentByPriorityId(budget.strategicPriorityId)

  if (!smeAssignment?.teamId) {
    throw new Error('No SME team is mapped on this project.')
  }

  if (!directorTeam?.teamId) {
    throw new Error('Strategy Director team is not configured for this workspace.')
  }

  await grantIctBudgetAccessToTeam(budget.id, directorTeam.teamId)

  const result = await Dga_ict_budgetsService.update(budget.id, {
    statuscode: DGE_BUDGET_STATUS.clarificationPending,
    dga_status_for_adge: ICT_BUDGET_STATUS.underDgeReview,
    'ownerid@odata.bind': `/teams(${smeAssignment.teamId})`,
    'dga_sme_reviewer_team@odata.bind': `/teams(${smeAssignment.teamId})`,
  } as never)

  assertSuccess(result.success, 'Unable to assign clarification to SME.', result.error ?? null)

  await grantIctBudgetAccessToTeam(budget.id, smeAssignment.teamId)
}

export async function returnStrategyClarificationToDirector(budgetId: string) {
  const directorTeam = getStoredStrategyDirectorTeam()
  if (!directorTeam?.teamId) {
    throw new Error('Strategy Director team is not configured for this workspace.')
  }

  const result = await Dga_ict_budgetsService.update(budgetId, {
    statuscode: DGE_BUDGET_STATUS.underFinalReview,
    dga_status_for_adge: ICT_BUDGET_STATUS.underDgeReview,
    'ownerid@odata.bind': `/teams(${directorTeam.teamId})`,
  } as never)

  assertSuccess(result.success, 'Unable to return project to Strategy Director.', result.error ?? null)
  await grantIctBudgetAccessToTeam(budgetId, directorTeam.teamId)
}

export async function publishDgeReviewedInstance(instanceId: string) {
  const result = await Dga_ict_budget_instancesService.update(instanceId, {
    statuscode: DGE_INSTANCE_STATUS.reviewCompletedByDge,
  } as never)

  assertSuccess(result.success, 'Unable to publish entity review completion.', result.error ?? null)
}

export async function startInstanceAllocation(instanceId: string, budgetIds: string[]) {
  const instanceResult = await Dga_ict_budget_instancesService.update(instanceId, {
    statuscode: DGE_INSTANCE_STATUS.allocation,
  } as never)

  assertSuccess(instanceResult.success, 'Unable to start allocation for this entity.', instanceResult.error ?? null)

  await Promise.all(
    budgetIds.map(async (budgetId) => {
      const result = await Dga_ict_budgetsService.update(budgetId, {
        statuscode: DGE_BUDGET_STATUS.allocationInProgress,
        dga_status_for_adge: ICT_BUDGET_STATUS.underDgeReview,
      } as never)

      assertSuccess(result.success, 'Unable to move project into allocation.', result.error ?? null)
    })
  )
}
