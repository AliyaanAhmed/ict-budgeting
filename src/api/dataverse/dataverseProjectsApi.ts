import type { ProjectsApi } from '@/api/projectsApi'
import { SESSION_INSTANCE_ID_KEY } from '@/services/instanceService'
import {
  SESSION_MODULE_CONFIG_TEAM_IDS_KEY,
  SESSION_USER_ID_KEY,
  SESSION_USER_TEAMS_KEY,
  type ModuleConfigTeamIds,
  type UserTeam,
} from '@/services/userContextService'
import {
  getClarificationsByBudgetId,
  raiseBudgetClarification,
} from '@/services/clarificationService'
import { getBudgetLineItemsByBudgetIds } from '@/services/budgetLineItemService'
import { shareIctBudgetWithRoleTeam } from '@/services/recordShareService'
import { createNotificationForRole } from '@/services/appNotificationService'
import {
  getLatestPortfolioSummaryByCurrentInstance,
  getLatestPlanningPortfolioSummaryByCurrentInstance,
  getPortfolioProjectInsight,
} from '@/services/portfolioSummaryService'
import type {
  Project,
  ReviewQueueProject,
  ApprovalQueueProject,
  CreateProjectPayload,
  ClarificationPayload,
  ProjectLookups,
  RoleProjectFilters,
  ProjectStatus,
} from '@/domain/types'
import type { Dga_ict_budgetsdga_status_for_adge } from '@/generated/models/Dga_ict_budgetsModel'
import { Dga_ict_budgetsService } from '@/generated/services/Dga_ict_budgetsService'

type WorkflowStatusForAdge = Dga_ict_budgetsdga_status_for_adge | 12
type WorkflowTargetOwner = 'Respondent' | 'Reviewer' | 'Approver' | 'Strategy'

const ICT_BUDGET_SELECT_FIELDS = [
  'dga_ict_budgetid',
  'dga_budget_ref_id',
  'dga_ai_flags',
  'dga_activity_type',
  'dga_summary',
  '_createdby_value',
  'dga_initiative_project_requirement_name',
  '_ownerid_value',
  'dga_status_for_adge',
  'statuscode',
  '_dga_strategic_priority_value',
  '_dga_strategic_priority_classification_value',
  'dga_total_budget_requested',
  'dga_total_budget_recommended',
  'dga_total_budget_allocated',
  'dga_total_budget_utilized',
  'dga_planning_outcome',
  'dga_added_in_allocation',
  'dga_ai_confidence_score',
  'createdon',
  'modifiedon',
] as const

const EMPTY_LOOKUPS: ProjectLookups = {
  strategicPriorities: [],
  strategicClassifications: [],
  workStreams: [],
  budgetItemTypes: [],
  technologyCompanies: [],
  technologyProducts: [],
  categories: [],
  budgetTypes: [],
}

function getFormattedAnnotation(record: unknown, key: string) {
  const value = (record as Record<string, unknown> | null)?.[key]
  return typeof value === 'string' && value.trim() ? value : null
}

function getStoredModuleConfigTeamIds(): ModuleConfigTeamIds | null {
  const raw = sessionStorage.getItem(SESSION_MODULE_CONFIG_TEAM_IDS_KEY)
  if (!raw) return null

  try {
    return JSON.parse(raw) as ModuleConfigTeamIds
  } catch {
    return null
  }
}

function getStoredUserTeams(): UserTeam[] {
  const raw = sessionStorage.getItem(SESSION_USER_TEAMS_KEY)
  if (!raw) return []

  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as UserTeam[]) : []
  } catch {
    return []
  }
}

function getTargetOwnerBinding(target: WorkflowTargetOwner) {
  const moduleConfigTeamIds = getStoredModuleConfigTeamIds()
  const configuredTeamId =
    target === 'Respondent'
      ? moduleConfigTeamIds?.respondentTeamId
      : target === 'Reviewer'
        ? moduleConfigTeamIds?.reviewerTeamId
        : target === 'Approver'
          ? moduleConfigTeamIds?.approverTeamId
          : moduleConfigTeamIds?.strategyTeamId

  console.log('[DataverseProjectsApi] Resolving target owner binding:', {
    target,
    moduleConfigTeamIds,
    configuredTeamId,
  })

  if (configuredTeamId?.trim()) {
    const binding = { 'ownerid@odata.bind': `/teams(${configuredTeamId.trim()})` }
    console.log('[DataverseProjectsApi] Using module configuration team binding:', binding)
    return binding
  }

  const fallbackTeamId = getStoredUserTeams().find((team) => team.role === target)?.teamid?.trim()
  if (fallbackTeamId) {
    const binding = { 'ownerid@odata.bind': `/teams(${fallbackTeamId})` }
    console.log('[DataverseProjectsApi] Using userTeams fallback binding:', binding)
    return binding
  }

  const currentUserId = sessionStorage.getItem(SESSION_USER_ID_KEY)?.trim()
  if (target === 'Respondent' && currentUserId) {
    const binding = { 'ownerid@odata.bind': `/systemusers(${currentUserId})` }
    console.log('[DataverseProjectsApi] Using current user fallback binding:', binding)
    return binding
  }

  console.warn('[DataverseProjectsApi] No owner binding resolved for target:', target)
  return {}
}

const STATUS_CODE_MAP: Partial<Record<WorkflowStatusForAdge, number>> = {
  2: 776140001, // Submitted to Reviewer
  3: 776140002, // Submitted to Approver
  4: 776140003, // Approved
  5: 776140010, // Clarification Required
  6: 776140004, // Under DGE Review
  12: 576610001, // Reviewer Review Completed
}

function getActorRoleBinding(role: 'Respondent' | 'Reviewer' | 'Approver') {
  const currentUserId = sessionStorage.getItem(SESSION_USER_ID_KEY)?.trim()
  if (!currentUserId) {
    console.warn('[DataverseProjectsApi] No current user id found for workflow actor binding:', role)
    return {}
  }

  const key =
    role === 'Respondent'
      ? 'dga_respondent_systemuser@odata.bind'
      : role === 'Reviewer'
        ? 'dga_reviewer_systemuser@odata.bind'
        : 'dga_approver_systemuser@odata.bind'

  const binding = { [key]: `/systemusers(${currentUserId})` }
  console.log('[DataverseProjectsApi] Using workflow actor binding:', { role, currentUserId, binding })
  return binding
}

async function updateBudgetWorkflow(
  projectId: string,
  status: WorkflowStatusForAdge,
  targetOwner?: WorkflowTargetOwner,
  shareWithRole?: 'Respondent' | 'Reviewer' | 'Approver',
  actorRole?: 'Respondent' | 'Reviewer' | 'Approver',
  notificationText?: string
) {
  const statuscode = STATUS_CODE_MAP[status]
  const payload = {
    dga_status_for_adge: status,
    ...(statuscode !== undefined ? { statuscode } : {}),
    ...(targetOwner ? getTargetOwnerBinding(targetOwner) : {}),
    ...(actorRole ? getActorRoleBinding(actorRole) : {}),
  } as Record<string, unknown>

  console.log('[DataverseProjectsApi] Updating workflow with payload:', {
    projectId,
    status,
    statuscode: statuscode ?? null,
    targetOwner: targetOwner ?? null,
    actorRole: actorRole ?? null,
    payload,
  })

  await Dga_ict_budgetsService.update(projectId, payload)

  if (shareWithRole) {
    console.log('[DataverseProjectsApi] Sharing ICT budget after workflow update:', {
      projectId,
      status,
      targetOwner,
      shareWithRole,
    })
    await shareIctBudgetWithRoleTeam(projectId, shareWithRole)
  }

  if (targetOwner && notificationText?.trim()) {
    await createNotificationForRole(
      targetOwner,
      await buildBudgetNotificationText(projectId, notificationText.trim())
    )
  }
}

async function buildBudgetNotificationText(projectId: string, notificationText: string) {
  try {
    const result = await Dga_ict_budgetsService.get(projectId, {
      select: ['dga_initiative_project_requirement_name', 'dga_budget_ref_id'],
    })

    const projectName =
      result.data?.dga_initiative_project_requirement_name?.trim() ||
      result.data?.dga_budget_ref_id?.trim() ||
      ''

    if (!projectName) {
      return notificationText
    }

    return `${projectName}: ${notificationText}`
  } catch (error) {
    console.warn('[DataverseProjectsApi] Failed to resolve project name for notification text:', {
      projectId,
      error,
    })
    return notificationText
  }
}

function formatDate(record: unknown, formattedKey: string, rawValue: string | null | undefined) {
  const formatted = getFormattedAnnotation(record, formattedKey)
  if (formatted) return formatted
  if (!rawValue) return '-'

  const date = new Date(rawValue)
  if (Number.isNaN(date.getTime())) return rawValue
  return date.toLocaleString('en-AE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function mapStatus(value: number | null | undefined, formatted: string | null): ProjectStatus {
  switch (value) {
    case 1:
      return 'Draft'
    case 2:
      return 'Submitted to Reviewer'
    case 3:
      return 'Submitted to Approver'
    case 4:
      return 'Approved'
    case 5:
      return 'Clarification Required'
    case 6:
    case 7:
    case 8:
    case 9:
    case 10:
    case 11:
      return 'Submitted to DGE'
    case 12:
      return 'Reviewer Review Completed'
    default:
      if (formatted === 'Clarification Pending') return 'Clarification Required'
      if (formatted === 'Under Reviewer Review') return 'Submitted to Reviewer'
      if (formatted === 'Reviewer Review Completed') return 'Reviewer Review Completed'
      if (formatted === 'Under Approver Review') return 'Submitted to Approver'
      if (formatted === 'Approved by Approver') return 'Approved'
      if (
        formatted === 'Under DGE Review' ||
        formatted === 'Allocation In Progress' ||
        formatted === 'Allocation In Review' ||
        formatted === 'Allocation Completed' ||
        formatted === 'Utilization in Progress' ||
        formatted === 'Utilization Completed'
      ) {
        return 'Submitted to DGE'
      }
      return 'Draft'
  }
}

function mapActivityTypeLabel(record: unknown, fallbackValue: number | null | undefined) {
  const formatted = getFormattedAnnotation(
    record,
    'dga_activity_type@OData.Community.Display.V1.FormattedValue'
  )

  if (formatted) return formatted

  switch (fallbackValue) {
    case 1:
      return 'Operational Recurring'
    case 2:
      return 'Operational Non-Recurring'
    case 3:
      return 'New Project'
    case 4:
      return 'Project Continuation'
    default:
      return '-'
  }
}

function toPlainTextSummary(value: string | null | undefined) {
  if (!value?.trim()) return ''

  if (typeof window !== 'undefined' && typeof window.document !== 'undefined') {
    const container = window.document.createElement('div')
    container.innerHTML = value
    return (container.textContent || container.innerText || '').trim()
  }

  return value
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function mapBudgetRecordToProject(
  record: Awaited<ReturnType<typeof Dga_ict_budgetsService.getAll>>['data'][number],
  portfolioSummary = null as Awaited<ReturnType<typeof getLatestPlanningPortfolioSummaryByCurrentInstance>> | null,
  clarifications: Project['clarifications'] = []
): Project {
  const statusLabel = getFormattedAnnotation(
    record,
    'dga_status_for_adge@OData.Community.Display.V1.FormattedValue'
  )
  const mappedStatus = mapStatus(record.dga_status_for_adge, statusLabel)
  const ownerId =
    (record as unknown as Record<string, string | undefined>)._ownerid_value ??
    record.ownerid ??
    null

  const portfolioInsight = getPortfolioProjectInsight(
    portfolioSummary?.parsedSummary,
    record.dga_budget_ref_id?.trim() || record.dga_ict_budgetid || ''
  )

  return {
    id: record.dga_budget_ref_id?.trim() || record.dga_ict_budgetid || 'UNKNOWN-BUDGET',
    ictBudgetId: record.dga_ict_budgetid,
    aiReviewFlags: record.dga_ai_flags ?? [],
    ownerId,
    submittedById:
      (record as unknown as Record<string, string | undefined>)._createdby_value ??
      (typeof record.createdby === 'string' ? record.createdby : null) ??
      null,
    ownerType:
      getFormattedAnnotation(record, '_ownerid_value@Microsoft.Dynamics.CRM.lookuplogicalname') ||
      getFormattedAnnotation(record, '_ownerid_value@Microsoft.Dynamics.CRM.associatednavigationproperty') ||
      null,
    statusCode: record.statuscode ?? null,
    name:
      record.dga_initiative_project_requirement_name?.trim() ||
      record.dga_budget_ref_id?.trim() ||
      'Untitled Budget Item',
    strategicPriority:
      getFormattedAnnotation(
        record,
        '_dga_strategic_priority_value@OData.Community.Display.V1.FormattedValue'
      ) || '-',
    classification:
      getFormattedAnnotation(
        record,
        '_dga_strategic_priority_classification_value@OData.Community.Display.V1.FormattedValue'
      ) || '-',
    category: '-',
    requestedBudget: record.dga_total_budget_requested ?? 0,
    recommendedBudget: record.dga_total_budget_recommended ?? 0,
    allocatedBudget: record.dga_total_budget_allocated ?? 0,
    utilizedBudget: record.dga_total_budget_utilized ?? 0,
    planningOutcome: record.dga_planning_outcome ?? null,
    addedInAllocation: record.dga_added_in_allocation ?? null,
    budgetItems: [],
    status: mappedStatus,
    statusForAdgeLabel: statusLabel || mappedStatus,
    approvalStatus: mappedStatus,
    pendingWith:
      getFormattedAnnotation(
        record,
        '_ownerid_value@OData.Community.Display.V1.FormattedValue'
      ) || null,
    submittedBy:
      getFormattedAnnotation(
        record,
        '_createdby_value@OData.Community.Display.V1.FormattedValue'
      ) || 'Unknown User',
    submittedDate: formatDate(
      record,
      'createdon@OData.Community.Display.V1.FormattedValue',
      record.createdon
    ),
    submittedDateRaw: record.createdon ?? undefined,
    lastModified: formatDate(
      record,
      'modifiedon@OData.Community.Display.V1.FormattedValue',
      record.modifiedon
    ),
    lastModifiedRaw: record.modifiedon ?? undefined,
    plannedStartDate: '-',
    plannedEndDate: '-',
    workStream: '-',
    budgetType: mapActivityTypeLabel(record, record.dga_activity_type),
    technology: { company: '-', product: '-' },
    summary: toPlainTextSummary(record.dga_summary),
    documents: [],
    clarifications,
    aiScore: typeof record.dga_ai_confidence_score === 'number' ? record.dga_ai_confidence_score : 0,
    riskLevel: portfolioInsight.riskLevel,
    capex: 0,
    opex: 0,
  }
}

function applyFilters(items: Project[], filters?: RoleProjectFilters) {
  if (!filters) return items

  return items.filter((item) => {
    const normalizedSearch = filters.search?.trim().toLowerCase()
    const matchesSearch =
      !normalizedSearch ||
      item.name.toLowerCase().includes(normalizedSearch) ||
      item.id.toLowerCase().includes(normalizedSearch)
    const matchesStatus = !filters.status?.length || filters.status.includes(item.status)
    return matchesSearch && matchesStatus
  })
}

async function getAllBudgetProjects() {
  const portfolioSummary =
    (await getLatestPlanningPortfolioSummaryByCurrentInstance()) ??
    (await getLatestPortfolioSummaryByCurrentInstance())
  const result = await Dga_ict_budgetsService.getAll({
    select: [...ICT_BUDGET_SELECT_FIELDS],
    filter: getInstanceFilter(),
    orderBy: ['modifiedon desc'],
  })

  const records = result.data ?? []
  const clarificationBudgetIds = records
    .filter((record) => mapStatus(record.dga_status_for_adge, getFormattedAnnotation(record, 'dga_status_for_adge@OData.Community.Display.V1.FormattedValue')) === 'Clarification Required')
    .map((record) => record.dga_ict_budgetid)
    .filter((id): id is string => typeof id === 'string' && id.trim().length > 0)

  const clarificationEntries = await Promise.all(
    clarificationBudgetIds.map(async (budgetId) => [budgetId, await getClarificationsByBudgetId(budgetId)] as const)
  )

  const clarificationsByBudgetId = new Map<string, Project['clarifications']>(clarificationEntries)

  return records.map((record) =>
    mapBudgetRecordToProject(
      record,
      portfolioSummary,
      record.dga_ict_budgetid ? clarificationsByBudgetId.get(record.dga_ict_budgetid) ?? [] : []
    )
  )
}

function escapeODataString(value: string) {
  return value.replace(/'/g, "''")
}

function getInstanceFilter(): string | undefined {
  const id = sessionStorage.getItem(SESSION_INSTANCE_ID_KEY)
  return id ? `_dga_ict_budget_instance_value eq ${id}` : undefined
}

function combineFilters(...parts: (string | undefined)[]): string | undefined {
  const valid = parts.filter(Boolean) as string[]
  if (!valid.length) return undefined
  return valid.length === 1 ? valid[0] : valid.map(p => `(${p})`).join(' and ')
}

export const dataverseProjectsApi: ProjectsApi = {
  async getRespondentProjects(filters?: RoleProjectFilters) {
    return applyFilters(await getAllBudgetProjects(), filters)
  },

  async getReviewerProjects(filters?: RoleProjectFilters) {
    return applyFilters(await getAllBudgetProjects(), filters)
  },

  async getApproverProjects(filters?: RoleProjectFilters) {
    return applyFilters(await getAllBudgetProjects(), filters)
  },

  async getProjectById(projectId: string) {
    const trimmedId = projectId.trim()
    if (!trimmedId) return null

    const guidPattern =
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/

    if (guidPattern.test(trimmedId)) {
      const portfolioSummary =
        (await getLatestPlanningPortfolioSummaryByCurrentInstance()) ??
        (await getLatestPortfolioSummaryByCurrentInstance())
      const directResult = await Dga_ict_budgetsService.get(trimmedId, {
        select: [...ICT_BUDGET_SELECT_FIELDS],
      })
      return directResult.data ? mapBudgetRecordToProject(directResult.data, portfolioSummary) : null
    }

    const portfolioSummary =
      (await getLatestPlanningPortfolioSummaryByCurrentInstance()) ??
      (await getLatestPortfolioSummaryByCurrentInstance())
    const result = await Dga_ict_budgetsService.getAll({
      select: [...ICT_BUDGET_SELECT_FIELDS],
      filter: `dga_budget_ref_id eq '${escapeODataString(trimmedId)}'`,
      top: 1,
    })

    const record = result.data?.[0]
    return record ? mapBudgetRecordToProject(record, portfolioSummary) : null
  },

  async getReviewQueue() {
    const portfolioSummary =
      (await getLatestPlanningPortfolioSummaryByCurrentInstance()) ??
      (await getLatestPortfolioSummaryByCurrentInstance())
    const result = await Dga_ict_budgetsService.getAll({
      select: [...ICT_BUDGET_SELECT_FIELDS],
      filter: combineFilters(
        'dga_status_for_adge eq 2 or dga_status_for_adge eq 3 or dga_status_for_adge eq 4 or dga_status_for_adge eq 5 or dga_status_for_adge eq 6 or dga_status_for_adge eq 7 or dga_status_for_adge eq 8 or dga_status_for_adge eq 9 or dga_status_for_adge eq 10 or dga_status_for_adge eq 11 or dga_status_for_adge eq 12',
        getInstanceFilter()
      ),
      orderBy: ['modifiedon desc'],
    })
    const records = result.data ?? []
    const budgetIds = records
      .map((record) => record.dga_ict_budgetid)
      .filter((id): id is string => typeof id === 'string' && id.trim().length > 0)
    const lineItems = await getBudgetLineItemsByBudgetIds(budgetIds)
    const lineItemsByBudgetId = new Map<string, typeof lineItems>()

    for (const lineItem of lineItems) {
      if (!lineItem.budgetId) continue
      const existing = lineItemsByBudgetId.get(lineItem.budgetId) ?? []
      existing.push(lineItem)
      lineItemsByBudgetId.set(lineItem.budgetId, existing)
    }

    return records.map((record): ReviewQueueProject => {
      const sv = Number(record.dga_status_for_adge ?? 0)
      const queueStatus: ReviewQueueProject['status'] =
        sv === 2 ? 'To Review' : sv === 5 ? 'Clarification Pending' : 'Reviewed'
      const isActionable = sv === 2 || sv === 12
      const budgetId = record.dga_ict_budgetid || ''
      const portfolioInsight = getPortfolioProjectInsight(
        portfolioSummary?.parsedSummary,
        record.dga_budget_ref_id?.trim() || budgetId
      )
      const projectLineItems = lineItemsByBudgetId.get(budgetId) ?? []
      const capex = projectLineItems
        .filter((item) => item.expenseTypeValue === 1)
        .reduce((sum, item) => sum + item.budgetRequested, 0)
      const opex = projectLineItems
        .filter((item) => item.expenseTypeValue === 2)
        .reduce((sum, item) => sum + item.budgetRequested, 0)

      return {
        id: record.dga_budget_ref_id?.trim() || record.dga_ict_budgetid || 'UNKNOWN',
        ictBudgetId: budgetId,
        name: record.dga_initiative_project_requirement_name?.trim() || 'Untitled Budget Item',
        entity: getFormattedAnnotation(record, '_ownerid_value@OData.Community.Display.V1.FormattedValue') || '-',
        status: queueStatus,
        statusCode: record.statuscode ?? null,
        statusForAdgeLabel:
          getFormattedAnnotation(record, 'dga_status_for_adge@OData.Community.Display.V1.FormattedValue') || queueStatus,
        isActionable,
        riskLevel: portfolioInsight.riskLevel,
        hasMissingDocs: false,
        requestedBudget: record.dga_total_budget_requested ?? 0,
        capex,
        opex,
        glCodeCount: projectLineItems.length,
        submittedBy: getFormattedAnnotation(record, '_createdby_value@OData.Community.Display.V1.FormattedValue') || 'Unknown',
        submittedDate: formatDate(record, 'createdon@OData.Community.Display.V1.FormattedValue', record.createdon),
        submittedDateRaw: record.createdon ?? '',
        updatedDate: formatDate(record, 'modifiedon@OData.Community.Display.V1.FormattedValue', record.modifiedon),
        aiScore: 0,
        aiConfidence: 0,
        budgetType: mapActivityTypeLabel(record, record.dga_activity_type),
      }
    })
  },

  async getApprovalQueue() {
    const portfolioSummary =
      (await getLatestPlanningPortfolioSummaryByCurrentInstance()) ??
      (await getLatestPortfolioSummaryByCurrentInstance())
    const result = await Dga_ict_budgetsService.getAll({
      select: [...ICT_BUDGET_SELECT_FIELDS],
      filter: combineFilters(
        'dga_status_for_adge eq 3 or dga_status_for_adge eq 4 or dga_status_for_adge eq 5 or dga_status_for_adge eq 6 or dga_status_for_adge eq 7 or dga_status_for_adge eq 8 or dga_status_for_adge eq 9 or dga_status_for_adge eq 10 or dga_status_for_adge eq 11',
        getInstanceFilter()
      ),
      orderBy: ['modifiedon desc'],
    })
    return (result.data ?? []).map((record): ApprovalQueueProject => {
      const sv = record.dga_status_for_adge
      const queueStatus: ApprovalQueueProject['status'] =
        sv === 3
          ? 'Pending'
          : sv === 4
            ? 'Approved'
            : sv === 5
              ? 'Clarification Pending'
              : 'Submitted to DGE'
      const portfolioInsight = getPortfolioProjectInsight(
        portfolioSummary?.parsedSummary,
        record.dga_budget_ref_id?.trim() || record.dga_ict_budgetid || ''
      )

      return {
        id: record.dga_budget_ref_id?.trim() || record.dga_ict_budgetid || 'UNKNOWN',
        ictBudgetId: record.dga_ict_budgetid || '',
        name: record.dga_initiative_project_requirement_name?.trim() || 'Untitled Budget Item',
        entity: getFormattedAnnotation(record, '_ownerid_value@OData.Community.Display.V1.FormattedValue') || '-',
        status: queueStatus,
        statusForAdgeLabel:
          getFormattedAnnotation(record, 'dga_status_for_adge@OData.Community.Display.V1.FormattedValue') || queueStatus,
        budgetType: mapActivityTypeLabel(record, record.dga_activity_type),
        budgetCategory: '-',
        requestedBudget: record.dga_total_budget_requested ?? 0,
        riskLevel: portfolioInsight.riskLevel,
        aiConfidence: 0,
        summary: '',
        glCodeCount: 0,
        reviewedBy: getFormattedAnnotation(record, '_createdby_value@OData.Community.Display.V1.FormattedValue') || '-',
        submittedDate: formatDate(record, 'createdon@OData.Community.Display.V1.FormattedValue', record.createdon),
        submittedDateRaw: record.createdon ?? '',
        updatedDate: formatDate(record, 'modifiedon@OData.Community.Display.V1.FormattedValue', record.modifiedon),
      }
    })
  },

  async getProjectLookups() {
    return EMPTY_LOOKUPS
  },

  async createProject(_payload: CreateProjectPayload) {
    throw new Error('Project creation is handled by the ICT budget draft service.')
  },

  async submitToReviewer(projectId: string) {
    await updateBudgetWorkflow(
      projectId,
      2,
      'Reviewer',
      'Respondent',
      'Respondent',
      'A budget item has been submitted to Reviewer for review.'
    )
  },
  async reviewerCompleteReview(projectId: string) {
    await updateBudgetWorkflow(projectId, 12, undefined, undefined, 'Reviewer')
  },
  async reviewerApprove(projectId: string) {
    await updateBudgetWorkflow(
      projectId,
      3,
      'Approver',
      'Reviewer',
      'Reviewer',
      'A budget item has been submitted to Approver for final review.'
    )
  },
  async reviewerRaiseClarification(projectId: string, _payload: ClarificationPayload) {
    await raiseBudgetClarification({
      budgetId: projectId,
      message: _payload.message,
      raisedByRole: 'Reviewer',
      files: _payload.files,
    })
    await updateBudgetWorkflow(
      projectId,
      5,
      'Respondent',
      'Reviewer',
      'Reviewer',
      'A budget item has been returned to Respondent for clarification.'
    )
  },
  async approverApprove(projectId: string) {
    await Dga_ict_budgetsService.update(
      projectId,
      {
        dga_status_for_adge: 4,
        statuscode: 776140003,
        ...getActorRoleBinding('Approver'),
      } as Record<string, unknown>
    )
    await shareIctBudgetWithRoleTeam(projectId, 'Approver')
  },
  async approverRaiseClarification(projectId: string, _payload: ClarificationPayload) {
    await raiseBudgetClarification({
      budgetId: projectId,
      message: _payload.message,
      raisedByRole: 'Approver',
      files: _payload.files,
    })
    await updateBudgetWorkflow(
      projectId,
      5,
      'Respondent',
      'Approver',
      'Approver',
      'A budget item has been returned to Respondent for approver clarification.'
    )
  },
  async approverSubmitToDge(projectIds: string[]) {
    for (const projectId of projectIds) {
      await updateBudgetWorkflow(
        projectId,
        6,
        'Strategy',
        'Approver',
        'Approver',
        'A budget item has been submitted to DGE for strategic alignment review.'
      )
    }
  },
}
