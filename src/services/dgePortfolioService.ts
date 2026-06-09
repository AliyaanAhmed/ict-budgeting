import { Dga_ict_budgetsService } from '@/generated/services/Dga_ict_budgetsService'
import { Dga_ict_budget_instancesService } from '@/generated/services/Dga_ict_budget_instancesService'
import { getStoredCurrentSme, getStoredSmeAssignments, type DgeSmeAssignment } from '@/services/dgeRoleContextService'

export const DGE_BUDGET_STATUS = {
  draft: 1,
  inactive: 2,
  underReviewerReview: 776140001,
  underApproverReview: 776140002,
  approvedByApprover: 776140003,
  underStrategicAlignmentReview: 776140004,
  underSmeReview: 776140005,
  strategicPriorityChangeUnderReview: 776140006,
  underQualityCheck: 776140007,
  underFinalReview: 776140008,
  reviewCompleted: 776140009,
  clarificationPending: 776140010,
  allocationInProgress: 776140011,
  allocationInReview: 776140012,
  allocationCompleted: 776140013,
  utilizationInProgress: 776140014,
  utilizationCompleted: 776140015,
  reviewerReviewCompleted: 576610001,
} as const

export const DGE_INSTANCE_STATUS = {
  published: 776140001,
  planning: 776140002,
  underDgeReview: 776140003,
  reviewCompletedByDge: 776140004,
  allocation: 776140005,
  utilization: 776140006,
} as const

export const DGE_STRATEGY_ALIGNMENT_VISIBLE_STATUSES = new Set<number>([
  DGE_BUDGET_STATUS.underStrategicAlignmentReview,
  DGE_BUDGET_STATUS.underSmeReview,
  DGE_BUDGET_STATUS.strategicPriorityChangeUnderReview,
  DGE_BUDGET_STATUS.underQualityCheck,
])

export interface DgeBudgetRecord {
  id: string
  budgetRefId: string
  name: string
  summary: string
  statuscode: number
  statusLabel: string
  statusForAdge: number | null
  strategicPriorityId: string | null
  strategicPriorityName: string | null
  strategicPriorityClassificationId: string | null
  strategicPriorityClassificationName: string | null
  previousStrategicPriorityId: string | null
  previousStrategicPriorityName: string | null
  previousStrategicPriorityClassificationId: string | null
  previousStrategicPriorityClassificationName: string | null
  requestedBudget: number
  recommendedBudget: number
  allocatedBudget: number
  utilizedBudget: number
  aiConfidenceScore: number | null
  ownerId: string | null
  ownerName: string | null
  instanceId: string | null
  instanceName: string | null
  entityName: string | null
  smeReviewerTeamId: string | null
  smeReviewerTeamName: string | null
}

export interface DgeInstanceRecord {
  id: string
  cycleId: string | null
  entityId: string | null
  entityName: string
  entityAbbr: string
  name: string
  planningStartDate: string | null
  planningEndDate: string | null
  submissionDate: string | null
  statuscode: number
  statusLabel: string
  budgets: DgeBudgetRecord[]
}

export interface DgePortfolioData {
  instances: DgeInstanceRecord[]
  budgets: DgeBudgetRecord[]
}

function chunkArray<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size))
  }
  return chunks
}

function normalizeString(value: string | null | undefined) {
  return value?.trim() || ''
}

function getBudgetStatusLabel(statuscode: number | null | undefined, fallback?: string | null) {
  if (fallback?.trim()) return fallback

  switch (statuscode) {
    case DGE_BUDGET_STATUS.draft:
      return 'Draft'
    case DGE_BUDGET_STATUS.underReviewerReview:
      return 'Under Reviewer Review'
    case DGE_BUDGET_STATUS.underApproverReview:
      return 'Under Approver Review'
    case DGE_BUDGET_STATUS.approvedByApprover:
      return 'Approved by Approver'
    case DGE_BUDGET_STATUS.underStrategicAlignmentReview:
      return 'Under Strategic Alignment Review'
    case DGE_BUDGET_STATUS.underSmeReview:
      return 'Under SME Review'
    case DGE_BUDGET_STATUS.strategicPriorityChangeUnderReview:
      return 'Strategic Priority Change Under Review'
    case DGE_BUDGET_STATUS.underQualityCheck:
      return 'Under Quality Check'
    case DGE_BUDGET_STATUS.underFinalReview:
      return 'Under Final Review'
    case DGE_BUDGET_STATUS.reviewCompleted:
      return 'Review Completed'
    case DGE_BUDGET_STATUS.clarificationPending:
      return 'Clarification Pending'
    case DGE_BUDGET_STATUS.allocationInProgress:
      return 'Allocation in Progress'
    case DGE_BUDGET_STATUS.allocationInReview:
      return 'Allocation in Review'
    case DGE_BUDGET_STATUS.allocationCompleted:
      return 'Allocation Completed'
    case DGE_BUDGET_STATUS.utilizationInProgress:
      return 'Utilization in Progress'
    case DGE_BUDGET_STATUS.utilizationCompleted:
      return 'Utilization Completed'
    case DGE_BUDGET_STATUS.reviewerReviewCompleted:
      return 'Reviewer Review Completed'
    default:
      return 'Unknown'
  }
}

function getInstanceStatusLabel(statuscode: number | null | undefined, fallback?: string | null) {
  if (fallback?.trim()) return fallback

  switch (statuscode) {
    case DGE_INSTANCE_STATUS.published:
      return 'Published'
    case DGE_INSTANCE_STATUS.planning:
      return 'Planning'
    case DGE_INSTANCE_STATUS.underDgeReview:
      return 'Under DGE Review'
    case DGE_INSTANCE_STATUS.reviewCompletedByDge:
      return 'Review Completed'
    case DGE_INSTANCE_STATUS.allocation:
      return 'Allocation'
    case DGE_INSTANCE_STATUS.utilization:
      return 'Utilization'
    default:
      return 'Unknown'
  }
}

function mapBudgetRecord(record: Awaited<ReturnType<typeof Dga_ict_budgetsService.getAll>>['data'][number]): DgeBudgetRecord | null {
  if (!record.dga_ict_budgetid) return null

  const strategicPriorityName =
    normalizeString(record.dga_strategic_priorityname) ||
    normalizeString((record.dga_strategic_priority as { dga_name?: string } | null | undefined)?.dga_name) ||
    null

  const strategicPriorityClassificationName =
    normalizeString(record.dga_strategic_priority_classificationname) ||
    normalizeString(
      (record.dga_strategic_priority_classification as { dga_name?: string } | null | undefined)?.dga_name
    ) ||
    null

  const previousStrategicPriorityName =
    normalizeString(record.dga_previous_strategic_priorityname) ||
    normalizeString((record.dga_previous_strategic_priority as { dga_name?: string } | null | undefined)?.dga_name) ||
    null

  const previousStrategicPriorityClassificationName =
    normalizeString(record.dga_previous_strategic_priorityclassificationname) ||
    normalizeString(
      (record.dga_previous_strategic_priorityclassification as { dga_name?: string } | null | undefined)?.dga_name
    ) ||
    null

  const instanceName =
    normalizeString(record.dga_ict_budget_instancename) ||
    normalizeString((record.dga_ict_budget_instance as { dga_name?: string } | null | undefined)?.dga_name) ||
    null

  const smeReviewerTeamName =
    normalizeString(record.dga_sme_reviewer_teamname) ||
    normalizeString((record.dga_sme_reviewer_team as { name?: string } | null | undefined)?.name) ||
    null

  return {
    id: record.dga_ict_budgetid,
    budgetRefId: normalizeString(record.dga_budget_ref_id) || record.dga_ict_budgetid,
    name: normalizeString(record.dga_initiative_project_requirement_name) || 'Untitled Project',
    summary: normalizeString(record.dga_summary),
    statuscode: Number(record.statuscode ?? 0),
    statusLabel: getBudgetStatusLabel(record.statuscode ?? null, record.statuscodename ?? null),
    statusForAdge: typeof record.dga_status_for_adge === 'number' ? record.dga_status_for_adge : null,
    strategicPriorityId: record._dga_strategic_priority_value ?? null,
    strategicPriorityName,
    strategicPriorityClassificationId: record._dga_strategic_priority_classification_value ?? null,
    strategicPriorityClassificationName,
    previousStrategicPriorityId: record._dga_previous_strategic_priority_value ?? null,
    previousStrategicPriorityName,
    previousStrategicPriorityClassificationId: record._dga_previous_strategic_priorityclassification_value ?? null,
    previousStrategicPriorityClassificationName,
    requestedBudget: Number(record.dga_total_budget_requested ?? 0),
    recommendedBudget: Number(record.dga_total_budget_recommended ?? 0),
    allocatedBudget: Number(record.dga_total_budget_allocated ?? 0),
    utilizedBudget: Number(record.dga_total_budget_utilized ?? 0),
    aiConfidenceScore:
      typeof record.dga_ai_confidence_score === 'number' ? record.dga_ai_confidence_score : null,
    ownerId: record.ownerid ?? null,
    ownerName: normalizeString(record.owneridname) || null,
    instanceId: record._dga_ict_budget_instance_value ?? null,
    instanceName,
    entityName: instanceName,
    smeReviewerTeamId: record._dga_sme_reviewer_team_value ?? null,
    smeReviewerTeamName,
  }
}

function mapInstanceRecord(record: Awaited<ReturnType<typeof Dga_ict_budget_instancesService.getAll>>['data'][number]): DgeInstanceRecord | null {
  if (!record.dga_ict_budget_instanceid) return null

  return {
    id: record.dga_ict_budget_instanceid,
    cycleId: record._dga_cycle_value ?? null,
    entityId: record._dga_entity_value ?? null,
    entityName: normalizeString(record.dga_entityname) || normalizeString(record.dga_name) || 'Unknown Entity',
    entityAbbr: normalizeString(record.dga_entity_abbr),
    name: normalizeString(record.dga_name) || normalizeString(record.dga_entityname) || 'Unknown Entity',
    planningStartDate: record.dga_planning_start_date ?? null,
    planningEndDate: record.dga_planning_end_date ?? null,
    submissionDate: record.dga_entity_submission_date ?? null,
    statuscode: Number(record.statuscode ?? 0),
    statusLabel: getInstanceStatusLabel(record.statuscode ?? null, record.statuscodename ?? null),
    budgets: [],
  }
}

async function fetchBudgetsByInstanceIds(instanceIds: string[]): Promise<DgeBudgetRecord[]> {
  if (!instanceIds.length) return []

  const select = [
    'dga_ict_budgetid',
    'dga_budget_ref_id',
    'dga_initiative_project_requirement_name',
    'dga_summary',
    'dga_status_for_adge',
    'statuscode',
    '_dga_strategic_priority_value',
    '_dga_strategic_priority_classification_value',
    '_dga_previous_strategic_priority_value',
    '_dga_previous_strategic_priorityclassification_value',
    'dga_ai_confidence_score',
    'dga_total_budget_requested',
    'dga_total_budget_recommended',
    'dga_total_budget_allocated',
    'dga_total_budget_utilized',
    'ownerid',
    '_dga_ict_budget_instance_value',
    '_dga_sme_reviewer_team_value',
  ]

  const expand = [
    'dga_strategic_priority($select=dga_name)',
    'dga_strategic_priority_classification($select=dga_name)',
    'dga_previous_strategic_priority($select=dga_name)',
    'dga_previous_strategic_priorityclassification($select=dga_name)',
    'dga_ict_budget_instance($select=dga_name)',
    'dga_sme_reviewer_team($select=name)',
  ]

  const chunks = chunkArray(instanceIds, 20)
  const results = await Promise.all(
    chunks.map((chunk) =>
      Dga_ict_budgetsService.getAll({
        select,
        expand,
        filter: chunk.map((instanceId) => `_dga_ict_budget_instance_value eq ${instanceId}`).join(' or '),
        orderBy: ['createdon desc'],
        maxPageSize: 500,
      })
    )
  )

  return results
    .flatMap((result) => result.data ?? [])
    .map(mapBudgetRecord)
    .filter((item): item is DgeBudgetRecord => Boolean(item))
}

export async function getDgePortfolioData(cycleId: string): Promise<DgePortfolioData> {
  if (!cycleId) return { instances: [], budgets: [] }

  const instanceResult = await Dga_ict_budget_instancesService.getAll({
    select: [
      'dga_ict_budget_instanceid',
      '_dga_cycle_value',
      '_dga_entity_value',
      'dga_entity_abbr',
      'dga_entity_submission_date',
      'dga_name',
      'dga_planning_end_date',
      'dga_planning_start_date',
      'statuscode',
    ],
    expand: ['dga_entity($select=name)'],
    filter: `_dga_cycle_value eq ${cycleId}`,
    orderBy: ['dga_name asc'],
    maxPageSize: 500,
  })

  const instances = (instanceResult.data ?? [])
    .map(mapInstanceRecord)
    .filter((item): item is DgeInstanceRecord => Boolean(item))

  if (!instances.length) {
    return { instances: [], budgets: [] }
  }

  const budgets = await fetchBudgetsByInstanceIds(instances.map((instance) => instance.id))
  const budgetsByInstance = new Map<string, DgeBudgetRecord[]>()

  budgets.forEach((budget) => {
    if (!budget.instanceId) return
    const current = budgetsByInstance.get(budget.instanceId) ?? []
    current.push(budget)
    budgetsByInstance.set(budget.instanceId, current)
  })

  const instanceLookup = new Map(
    instances.map((instance) => [
      instance.id,
      { instanceName: instance.name, entityName: instance.entityName },
    ])
  )

  const hydratedBudgets = budgets.map((budget) => {
    const linkedInstance = budget.instanceId ? instanceLookup.get(budget.instanceId) : null
    return {
      ...budget,
      instanceName: budget.instanceName || linkedInstance?.instanceName || null,
      entityName: budget.entityName || linkedInstance?.entityName || linkedInstance?.instanceName || null,
    }
  })

  const hydratedBudgetsByInstance = new Map<string, DgeBudgetRecord[]>()
  hydratedBudgets.forEach((budget) => {
    if (!budget.instanceId) return
    const current = hydratedBudgetsByInstance.get(budget.instanceId) ?? []
    current.push(budget)
    hydratedBudgetsByInstance.set(budget.instanceId, current)
  })

  const hydratedInstances = instances.map((instance) => ({
    ...instance,
    budgets: hydratedBudgetsByInstance.get(instance.id) ?? [],
  }))

  return {
    instances: hydratedInstances,
    budgets: hydratedBudgets,
  }
}

export function getStrategyAlignmentBudgets(data: DgePortfolioData) {
  return data.budgets.filter((budget) => DGE_STRATEGY_ALIGNMENT_VISIBLE_STATUSES.has(budget.statuscode))
}

export function getCurrentSmeBudgets(data: DgePortfolioData, currentSme: DgeSmeAssignment | null = getStoredCurrentSme()) {
  if (!currentSme?.strategicPriorityId) return []
  return data.budgets.filter((budget) => budget.strategicPriorityId === currentSme.strategicPriorityId)
}

export function getSmeTrackerGroups(data: DgePortfolioData) {
  const assignments = getStoredSmeAssignments()
  return assignments.map((assignment) => {
    const budgets = data.budgets.filter((budget) => budget.strategicPriorityId === assignment.strategicPriorityId)
    return {
      assignment,
      budgets,
    }
  })
}

export function getSmeAssignmentByPriorityId(priorityId: string | null | undefined) {
  if (!priorityId) return null
  return getStoredSmeAssignments().find((assignment) => assignment.strategicPriorityId === priorityId) ?? null
}

export function getInstanceStageFilterLabel(statuscode: number) {
  switch (statuscode) {
    case DGE_INSTANCE_STATUS.planning:
      return 'Planning'
    case DGE_INSTANCE_STATUS.underDgeReview:
    case DGE_INSTANCE_STATUS.reviewCompletedByDge:
      return 'DGE Review'
    case DGE_INSTANCE_STATUS.allocation:
      return 'Allocation'
    case DGE_INSTANCE_STATUS.utilization:
      return 'Utilization'
    default:
      return 'Planning'
  }
}

export function getBudgetStageBucket(statuscode: number) {
  const planningStatuses: number[] = [
    DGE_BUDGET_STATUS.draft,
    DGE_BUDGET_STATUS.underReviewerReview,
    DGE_BUDGET_STATUS.underApproverReview,
    DGE_BUDGET_STATUS.approvedByApprover,
    DGE_BUDGET_STATUS.clarificationPending,
    DGE_BUDGET_STATUS.reviewerReviewCompleted,
  ]

  if (planningStatuses.includes(statuscode)) {
    return 'planning'
  }

  const dgeReviewStatuses: number[] = [
    DGE_BUDGET_STATUS.underStrategicAlignmentReview,
    DGE_BUDGET_STATUS.underSmeReview,
    DGE_BUDGET_STATUS.strategicPriorityChangeUnderReview,
    DGE_BUDGET_STATUS.underQualityCheck,
    DGE_BUDGET_STATUS.underFinalReview,
  ]

  if (dgeReviewStatuses.includes(statuscode)) {
    return 'dgeReview'
  }

  if (statuscode === DGE_BUDGET_STATUS.reviewCompleted) {
    return 'reviewCompleted'
  }

  const allocationStatuses: number[] = [
    DGE_BUDGET_STATUS.allocationInProgress,
    DGE_BUDGET_STATUS.allocationInReview,
    DGE_BUDGET_STATUS.allocationCompleted,
  ]

  if (allocationStatuses.includes(statuscode)) {
    return 'allocation'
  }

  const utilizationStatuses: number[] = [
    DGE_BUDGET_STATUS.utilizationInProgress,
    DGE_BUDGET_STATUS.utilizationCompleted,
  ]

  if (utilizationStatuses.includes(statuscode)) {
    return 'utilization'
  }

  return 'planning'
}
