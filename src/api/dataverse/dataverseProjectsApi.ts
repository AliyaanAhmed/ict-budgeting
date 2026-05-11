import type { ProjectsApi } from '@/api/projectsApi'
import { SESSION_INSTANCE_ID_KEY } from '@/services/instanceService'
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
import { Dga_ict_budgetsService } from '@/generated/services/Dga_ict_budgetsService'

const ICT_BUDGET_SELECT_FIELDS = [
  'dga_ict_budgetid',
  'dga_budget_ref_id',
  'dga_activity_type',
  '_createdby_value',
  'dga_initiative_project_requirement_name',
  '_ownerid_value',
  'dga_status_for_adge',
  '_dga_strategic_priority_value',
  '_dga_strategic_priority_classification_value',
  'dga_total_budget_requested',
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
    default:
      if (formatted === 'Clarification Pending') return 'Clarification Required'
      if (formatted === 'Under Reviewer Review') return 'Submitted to Reviewer'
      if (formatted === 'Under Approver Review') return 'Submitted to Approver'
      if (formatted === 'Approved by Approver') return 'Approved'
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

function mapBudgetRecordToProject(
  record: Awaited<ReturnType<typeof Dga_ict_budgetsService.getAll>>['data'][number]
): Project {
  const statusLabel = getFormattedAnnotation(
    record,
    'dga_status_for_adge@OData.Community.Display.V1.FormattedValue'
  )
  const mappedStatus = mapStatus(record.dga_status_for_adge, statusLabel)

  return {
    id: record.dga_budget_ref_id?.trim() || record.dga_ict_budgetid || 'UNKNOWN-BUDGET',
    ictBudgetId: record.dga_ict_budgetid,
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
    budgetItems: [],
    status: mappedStatus,
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
    summary: '',
    documents: [],
    clarifications: [],
    aiScore: 84,
    riskLevel: 'Low',
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
  const result = await Dga_ict_budgetsService.getAll({
    select: [...ICT_BUDGET_SELECT_FIELDS],
    filter: getInstanceFilter(),
    orderBy: ['modifiedon desc'],
  })

  return (result.data ?? []).map(mapBudgetRecordToProject)
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
      const directResult = await Dga_ict_budgetsService.get(trimmedId, {
        select: [...ICT_BUDGET_SELECT_FIELDS],
      })
      return directResult.data ? mapBudgetRecordToProject(directResult.data) : null
    }

    const result = await Dga_ict_budgetsService.getAll({
      select: [...ICT_BUDGET_SELECT_FIELDS],
      filter: `dga_budget_ref_id eq '${escapeODataString(trimmedId)}'`,
      top: 1,
    })

    const record = result.data?.[0]
    return record ? mapBudgetRecordToProject(record) : null
  },

  async getReviewQueue() {
    const result = await Dga_ict_budgetsService.getAll({
      select: [...ICT_BUDGET_SELECT_FIELDS],
      filter: combineFilters(
        'dga_status_for_adge eq 2 or dga_status_for_adge eq 3 or dga_status_for_adge eq 5',
        getInstanceFilter()
      ),
      orderBy: ['modifiedon desc'],
    })

    return (result.data ?? []).map((record): ReviewQueueProject => {
      const sv = record.dga_status_for_adge
      const queueStatus: ReviewQueueProject['status'] =
        sv === 2 ? 'To Review' : sv === 3 ? 'Reviewed' : 'Clarification Pending'

      return {
        id: record.dga_budget_ref_id?.trim() || record.dga_ict_budgetid || 'UNKNOWN',
        ictBudgetId: record.dga_ict_budgetid || '',
        name: record.dga_initiative_project_requirement_name?.trim() || 'Untitled Budget Item',
        entity: getFormattedAnnotation(record, '_ownerid_value@OData.Community.Display.V1.FormattedValue') || '-',
        status: queueStatus,
        riskLevel: 'Low',
        hasMissingDocs: false,
        requestedBudget: record.dga_total_budget_requested ?? 0,
        capex: 0,
        opex: 0,
        glCodeCount: 0,
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
    const result = await Dga_ict_budgetsService.getAll({
      select: [...ICT_BUDGET_SELECT_FIELDS],
      filter: combineFilters(
        'dga_status_for_adge eq 3 or dga_status_for_adge eq 4 or dga_status_for_adge eq 5',
        getInstanceFilter()
      ),
      orderBy: ['modifiedon desc'],
    })

    return (result.data ?? []).map((record): ApprovalQueueProject => {
      const sv = record.dga_status_for_adge
      const queueStatus: ApprovalQueueProject['status'] =
        sv === 3 ? 'Pending' : sv === 4 ? 'Approved' : 'Clarification Pending'

      return {
        id: record.dga_budget_ref_id?.trim() || record.dga_ict_budgetid || 'UNKNOWN',
        ictBudgetId: record.dga_ict_budgetid || '',
        name: record.dga_initiative_project_requirement_name?.trim() || 'Untitled Budget Item',
        entity: getFormattedAnnotation(record, '_ownerid_value@OData.Community.Display.V1.FormattedValue') || '-',
        status: queueStatus,
        budgetType: mapActivityTypeLabel(record, record.dga_activity_type),
        budgetCategory: '-',
        requestedBudget: record.dga_total_budget_requested ?? 0,
        riskLevel: 'Low',
        aiConfidence: 0,
        summary: '',
        glCodeCount: 0,
        reviewedBy: getFormattedAnnotation(record, '_createdby_value@OData.Community.Display.V1.FormattedValue') || '-',
        submittedDate: formatDate(record, 'createdon@OData.Community.Display.V1.FormattedValue', record.createdon),
        submittedDateRaw: record.createdon ?? '',
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
    await Dga_ict_budgetsService.update(projectId, { dga_status_for_adge: 2 })
  },
  async reviewerApprove(projectId: string) {
    await Dga_ict_budgetsService.update(projectId, { dga_status_for_adge: 3 })
  },
  async reviewerRaiseClarification(projectId: string, _payload: ClarificationPayload) {
    await Dga_ict_budgetsService.update(projectId, { dga_status_for_adge: 5 })
  },
  async approverApprove(projectId: string) {
    await Dga_ict_budgetsService.update(projectId, { dga_status_for_adge: 4 })
  },
  async approverRaiseClarification(projectId: string, _payload: ClarificationPayload) {
    await Dga_ict_budgetsService.update(projectId, { dga_status_for_adge: 5 })
  },
}
