import type {
  Dga_ict_budgetsBase,
  Dga_ict_budgetsdga_activity_type,
  Dga_ict_budgetsdga_budget_item_type,
  Dga_ict_budgetsdga_category,
  Dga_ict_budgetsdga_status_for_adge,
} from '@/generated/models/Dga_ict_budgetsModel'
import { SESSION_INSTANCE_ID_KEY, SESSION_INSTANCE_DETAIL_KEY } from '@/services/instanceService'
import {
  SESSION_MODULE_CONFIG_TEAM_IDS_KEY,
  SESSION_USER_ID_KEY,
  SESSION_USER_TEAMS_KEY,
  type ModuleConfigTeamIds,
  type UserTeam,
} from '@/services/userContextService'
import { Dga_ict_budgetsService } from '@/generated/services/Dga_ict_budgetsService'
import { Dga_ict_budget_dga_technology_productsetService } from '@/generated/services/Dga_ict_budget_dga_technology_productsetService'
import { shareIctBudgetWithRoleTeam } from '@/services/recordShareService'
import { createNotificationForRole } from '@/services/appNotificationService'
import {
  INITIAL_ICT_BUDGET_FORM_VALUES,
  parseCurrencyValue,
  type IctBudgetFormValues,
} from '@/features/ictBudgetForm'
import type { TechnologyCompanyOption } from '@/services/technologyService'
import type { IOperationResult } from '@microsoft/power-apps/data'

export interface CreateIctBudgetDraftInput {
  initiativeName: string
  strategicPriorityId: string
  strategicPriorityClassificationId: string
  workStreamId: string | null
  technologyCompanyId: string | null
  technologyProductIds: string[]
  plannedStartDate: string
  plannedEndDate: string
  summary: string
  activityType: Dga_ict_budgetsdga_activity_type
  budgetItemType: Dga_ict_budgetsdga_budget_item_type
  category: Dga_ict_budgetsdga_category | null
  totalBudgetPaidPreviousYear: number | null
  totalBudgetPayableFutureYear: number | null
  totalBudgetPayableNextYear: number | null
  totalBudgetPayableForYearAfterNext: number | null
}

export interface RetrievedIctBudgetDraft {
  id: string
  formValues: IctBudgetFormValues
  displayTechnologyProducts: string[]
  createdByName: string | null
  createdOn: string | null
  modifiedOn: string | null
  statusLabel: string | null
  respondentName: string | null
  reviewerName: string | null
  approverName: string | null
  smeReviewerTeamId: string | null
  recommendedLabel: string | null
  rejectedByName: string | null
  previousStrategicPriorityId: string | null
  previousStrategicPriorityName: string | null
  previousStrategicPriorityClassificationId: string | null
  previousStrategicPriorityClassificationName: string | null
}

export interface CreatedIctBudgetDraft {
  id: string
  budgetRefId: string | null
}

export const ICT_BUDGET_STATUS = {
  draft: 1,
  underReviewerReview: 2,
  underApproverReview: 3,
  approvedByApprover: 4,
  clarificationPending: 5,
  underDgeReview: 6,
  reviewerReviewCompleted: 12,
} as const

type WorkflowStatusForAdge = Dga_ict_budgetsdga_status_for_adge | 12

type WorkflowTargetOwner = 'Respondent' | 'Reviewer' | 'Approver' | 'Strategy'

function getFormattedAnnotation(record: unknown, key: string) {
  const value = (record as Record<string, unknown> | null)?.[key]
  return typeof value === 'string' && value.trim() ? value : null
}

function getOperationErrorMessage(result: unknown, fallback: string) {
  const message = (result as { error?: { message?: string } } | null)?.error?.message
  return typeof message === 'string' && message.trim() ? message : fallback
}

function assertOperationSucceeded<T>(result: IOperationResult<T>, fallbackMessage: string) {
  if (!result.success) {
    throw new Error(getOperationErrorMessage(result, fallbackMessage))
  }
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

  console.log('[IctBudgetDraftService] moduleConfigTeamIDs for target owner lookup:', {
    target,
    moduleConfigTeamIds,
    configuredTeamId,
  })

  if (configuredTeamId?.trim()) {
    const binding = { 'ownerid@odata.bind': `/teams(${configuredTeamId.trim()})` }
    console.log('[IctBudgetDraftService] Using module configuration team owner binding:', binding)
    return binding
  }

  const fallbackTeamId = getStoredUserTeams().find((team) => team.role === target)?.teamid?.trim()
  if (fallbackTeamId) {
    const binding = { 'ownerid@odata.bind': `/teams(${fallbackTeamId})` }
    console.log('[IctBudgetDraftService] Using fallback userTeams owner binding:', binding)
    return binding
  }

  const currentUserId = sessionStorage.getItem(SESSION_USER_ID_KEY)?.trim()
  if (target === 'Respondent' && currentUserId) {
    const binding = { 'ownerid@odata.bind': `/systemusers(${currentUserId})` }
    console.log('[IctBudgetDraftService] Using fallback current user owner binding:', binding)
    return binding
  }

  console.warn('[IctBudgetDraftService] No owner binding could be resolved for workflow target:', target)
  return {}
}

function getActorRoleBinding(role: WorkflowTargetOwner) {
  const currentUserId = sessionStorage.getItem(SESSION_USER_ID_KEY)?.trim()
  if (!currentUserId) {
    console.warn('[IctBudgetDraftService] No current user id found for workflow actor binding:', role)
    return {}
  }

  const key =
    role === 'Respondent'
      ? 'dga_respondent_systemuser@odata.bind'
      : role === 'Reviewer'
        ? 'dga_reviewer_systemuser@odata.bind'
        : 'dga_approver_systemuser@odata.bind'

  const binding = { [key]: `/systemusers(${currentUserId})` }
  console.log('[IctBudgetDraftService] Using workflow actor binding:', { role, currentUserId, binding })
  return binding
}

function toLookupBinding(entitySet: string, id: string | null) {
  return id ? `/${entitySet}(${id})` : undefined
}

function toBoundLookupValue(entitySet: string, id: string) {
  return `/${entitySet}(${id})`
}

function matchTechnologyProductIds(
  companyId: string,
  technologyCompanies: TechnologyCompanyOption[],
  fallbackDisplayNames: string[]
) {
  if (fallbackDisplayNames.length === 0) {
    return []
  }

  const selectedCompany = technologyCompanies.find((company) => company.id === companyId)
  if (!selectedCompany) {
    return []
  }

  const normalizedNames = fallbackDisplayNames.map((name) => name.trim().toLowerCase()).filter(Boolean)

  return selectedCompany.products
    .filter((product) => normalizedNames.includes(product.name.trim().toLowerCase()))
    .map((product) => product.id)
}

function toCurrencyInputValue(value: number | null | undefined) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    return ''
  }

  return value.toLocaleString('en-AE')
}

function toDisplayTechnologyProducts(
  selectedProductIds: string[],
  companyId: string,
  technologyCompanies: TechnologyCompanyOption[],
  fallbackDisplayNames: string[]
) {
  if (selectedProductIds.length === 0) {
    return fallbackDisplayNames
  }

  const selectedCompany = technologyCompanies.find((company) => company.id === companyId)
  if (!selectedCompany) {
    return fallbackDisplayNames
  }

  const matchedNames = selectedCompany.products
    .filter((product) => selectedProductIds.includes(product.id))
    .map((product) => product.name)

  return matchedNames.length > 0 ? matchedNames : fallbackDisplayNames
}

function stripRichTextHtml(value: string | null | undefined) {
  if (!value?.trim()) {
    return ''
  }

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

async function getAssociatedTechnologyProductIds(ictBudgetId: string) {
  const result = await Dga_ict_budget_dga_technology_productsetService.getAll({
    select: ['dga_ict_budgetid', 'dga_technologyid'],
    filter: `dga_ict_budgetid eq ${ictBudgetId}`,
  })

  return (result.data ?? [])
    .map((record) => record.dga_technologyid)
    .filter((id): id is string => Boolean(id))
}


function mapRetrievedBudgetRecord(
  record: Awaited<ReturnType<typeof Dga_ict_budgetsService.get>>['data'],
  technologyCompanies: TechnologyCompanyOption[],
  fallbackTechnologyProducts: string[],
  associatedTechnologyProductIds: string[]
) {
  if (!record?.dga_ict_budgetid) {
    throw new Error('Unable to retrieve the ICT budget record for this project.')
  }

  const strategicPriorityId =
    record._dga_strategic_priority_value ?? record._dga_previous_strategic_priority_value ?? ''
  const strategicPriorityClassificationId =
    record._dga_strategic_priority_classification_value ??
    record._dga_previous_strategic_priorityclassification_value ??
    ''
  const technologyCompanyId = record._dga_technology_company_value ?? ''
  const selectedTechnologyProductIds = associatedTechnologyProductIds.length > 0
    ? associatedTechnologyProductIds
    : technologyCompanyId
    ? matchTechnologyProductIds(
        technologyCompanyId,
        technologyCompanies,
        fallbackTechnologyProducts
      )
    : []

  const formValues: IctBudgetFormValues = {
    ...INITIAL_ICT_BUDGET_FORM_VALUES,
    initiativeName: record.dga_initiative_project_requirement_name ?? '',
    strategicPriorityId,
    strategicPriorityClassificationId,
    workStreamId: record._dga_work_stream_value ?? '',
    technologyCompanyId,
    technologyProductIds: selectedTechnologyProductIds,
    budgetItemType: record.dga_budget_item_type ?? null,
    category: record.dga_category ?? null,
    plannedStartDate: record.dga_planned_start_date?.slice(0, 10) ?? '',
    plannedEndDate: record.dga_planned_end_date?.slice(0, 10) ?? '',
    summary: stripRichTextHtml(record.dga_summary),
    activityType: record.dga_activity_type ?? null,
    totalBudgetPaidPreviousYear: toCurrencyInputValue(record.dga_total_budget_paid_previous_year),
    recommended: record.dga_recommended ?? null,
    rejectionReason: record.dga_rejection_reason ?? null,
    rejectionJustification: record.dga_rejection_justification ?? '',
    rejectedById: record._dga_rejected_by_value ?? '',
    totalBudgetPayableFutureYear: toCurrencyInputValue(record.dga_total_budget_payable_future_year),
    totalBudgetPayableNextYear: toCurrencyInputValue(record.dga_total_budget_payable_next_year),
    totalBudgetPayableForYearAfterNext: toCurrencyInputValue(
      record.dga_total_budget_payable_for_year_after_next
    ),
  }

  return {
    id: record.dga_ict_budgetid,
    formValues,
    displayTechnologyProducts: toDisplayTechnologyProducts(
      selectedTechnologyProductIds,
      technologyCompanyId,
      technologyCompanies,
      fallbackTechnologyProducts
    ),
    createdByName:
      getFormattedAnnotation(
        record,
        '_createdby_value@OData.Community.Display.V1.FormattedValue'
      ) ??
      record.createdbyname ??
      null,
    createdOn:
      getFormattedAnnotation(
        record,
        'createdon@OData.Community.Display.V1.FormattedValue'
      ) ??
      record.createdon ??
      null,
    modifiedOn:
      getFormattedAnnotation(
        record,
        'modifiedon@OData.Community.Display.V1.FormattedValue'
      ) ??
      record.modifiedon ??
      null,
    statusLabel:
      getFormattedAnnotation(
        record,
        'dga_status_for_adge@OData.Community.Display.V1.FormattedValue'
      ) ??
      record.dga_status_for_adgename ??
      null,
    respondentName:
      getFormattedAnnotation(record, '_dga_respondent_value@OData.Community.Display.V1.FormattedValue') ?? null,
    reviewerName:
      getFormattedAnnotation(record, '_dga_reviewer_value@OData.Community.Display.V1.FormattedValue') ?? null,
    approverName:
      getFormattedAnnotation(record, '_dga_approver_value@OData.Community.Display.V1.FormattedValue') ?? null,
    smeReviewerTeamId: record._dga_sme_reviewer_team_value ?? null,
    recommendedLabel:
      getFormattedAnnotation(
        record,
        'dga_recommended@OData.Community.Display.V1.FormattedValue'
      ) ??
      record.dga_recommendedname ??
      null,
    rejectedByName:
      getFormattedAnnotation(record, '_dga_rejected_by_value@OData.Community.Display.V1.FormattedValue') ??
      record.dga_rejected_byname ??
      null,
    previousStrategicPriorityId: record._dga_previous_strategic_priority_value ?? null,
    previousStrategicPriorityName:
      getFormattedAnnotation(
        record,
        '_dga_previous_strategic_priority_value@OData.Community.Display.V1.FormattedValue'
      ) ??
      record.dga_previous_strategic_priorityname ??
      null,
    previousStrategicPriorityClassificationId:
      record._dga_previous_strategic_priorityclassification_value ?? null,
    previousStrategicPriorityClassificationName:
      getFormattedAnnotation(
        record,
        '_dga_previous_strategic_priorityclassification_value@OData.Community.Display.V1.FormattedValue'
      ) ??
      record.dga_previous_strategic_priorityclassificationname ??
      null,
  } satisfies RetrievedIctBudgetDraft
}

export async function createIctBudgetDraft(input: CreateIctBudgetDraftInput) {
  // Resolve the current budget instance and entity abbreviation from sessionStorage
  const instanceId = sessionStorage.getItem(SESSION_INSTANCE_ID_KEY)
  const instanceDetailRaw = sessionStorage.getItem(SESSION_INSTANCE_DETAIL_KEY)
  const entityAbbr: string | undefined = instanceDetailRaw
    ? (JSON.parse(instanceDetailRaw) as { abbr?: string }).abbr
    : undefined

  const payload = {
    dga_initiative_project_requirement_name: input.initiativeName.trim(),
    'dga_strategic_priority@odata.bind': toLookupBinding(
      'dga_strategic_prioritieses',
      input.strategicPriorityId
    ),
    'dga_strategic_priority_classification@odata.bind': toLookupBinding(
      'dga_strategic_prioritieses',
      input.strategicPriorityClassificationId
    ),
    'dga_work_stream@odata.bind': toLookupBinding('dga_work_streams', input.workStreamId),
    'dga_technology_company@odata.bind': toLookupBinding(
      'dga_technologies',
      input.technologyCompanyId
    ),
    'dga_ict_budget_technology_product@odata.bind':
      input.technologyProductIds.length > 0
        ? input.technologyProductIds.map((id) => `/dga_technologies(${id})`)
        : undefined,
    dga_planned_start_date: input.plannedStartDate,
    dga_planned_end_date: input.plannedEndDate,
    dga_summary: input.summary.trim(),
    dga_activity_type: input.activityType,
    dga_added_in_allocation: 1,
    dga_status_for_adge: ICT_BUDGET_STATUS.draft,
    statuscode: 1,
    dga_budget_item_type: input.budgetItemType,
    dga_category: input.category ?? undefined,
    dga_total_budget_paid_previous_year: input.totalBudgetPaidPreviousYear ?? undefined,
    dga_total_budget_payable_future_year: input.totalBudgetPayableFutureYear ?? undefined,
    dga_total_budget_payable_next_year: input.totalBudgetPayableNextYear ?? undefined,
    dga_total_budget_payable_for_year_after_next:
      input.totalBudgetPayableForYearAfterNext ?? undefined,
    // Bind to the current budget instance (cycle + entity combination)
    ...(instanceId
      ? { 'dga_ict_budget_instance@odata.bind': `/dga_ict_budget_instances(${instanceId})` }
      : {}),
    // Store the entity abbreviation from the instance
    ...(entityAbbr ? { dga_abbr_of_entity: entityAbbr } : {}),
    ...getActorRoleBinding('Respondent'),
    ...getTargetOwnerBinding('Respondent'),
  } as Partial<Omit<Dga_ict_budgetsBase, 'dga_ict_budgetid'>> as Omit<
    Dga_ict_budgetsBase,
    'dga_ict_budgetid'
  >

  console.log('[IctBudgetDraftService] Creating ICT budget draft with payload:', payload)

  const result = await Dga_ict_budgetsService.create(payload)
  assertOperationSucceeded(result, 'Failed to create ICT budget draft.')

  if (!result.data?.dga_ict_budgetid) {
    throw new Error('ICT budget record was created, but the response did not include an id.')
  }

  return {
    id: result.data.dga_ict_budgetid,
    budgetRefId: result.data.dga_budget_ref_id?.trim() || null,
  } satisfies CreatedIctBudgetDraft
}

export async function getIctBudgetDraftById(
  ictBudgetId: string,
  technologyCompanies: TechnologyCompanyOption[],
  fallbackTechnologyProducts: string[] = []
) {
  const [result, associatedTechnologyProductIds] = await Promise.all([
    Dga_ict_budgetsService.get(ictBudgetId, {
      select: [
        'dga_ict_budgetid',
        'dga_initiative_project_requirement_name',
        '_dga_strategic_priority_value',
        '_dga_previous_strategic_priority_value',
        '_dga_strategic_priority_classification_value',
        '_dga_previous_strategic_priorityclassification_value',
        '_dga_work_stream_value',
        '_dga_technology_company_value',
        'dga_planned_start_date',
        'dga_planned_end_date',
        'dga_summary',
        'dga_activity_type',
        'dga_budget_item_type',
        'dga_category',
        'dga_status_for_adge',
        'dga_recommended',
        'dga_rejection_reason',
        'dga_rejection_justification',
        '_dga_rejected_by_value',
        '_dga_sme_reviewer_team_value',
        'dga_total_budget_paid_previous_year',
        'dga_total_budget_payable_future_year',
        'dga_total_budget_payable_next_year',
        'dga_total_budget_payable_for_year_after_next',
        '_createdby_value',
        'createdon',
        'modifiedon',
        '_dga_respondent_value',
        '_dga_reviewer_value',
        '_dga_approver_value',
      ],
    }),
    getAssociatedTechnologyProductIds(ictBudgetId),
  ])

  const record = result.data
  return mapRetrievedBudgetRecord(
    record,
    technologyCompanies,
    fallbackTechnologyProducts,
    associatedTechnologyProductIds
  )
}

export async function updateIctBudgetDraft(
  ictBudgetId: string,
  formValues: IctBudgetFormValues
) {
  const currentUserId = sessionStorage.getItem(SESSION_USER_ID_KEY)?.trim() || ''
  const recommendedNo = formValues.recommended === 1
  const payload = {
    dga_initiative_project_requirement_name: formValues.initiativeName.trim(),
    'dga_strategic_priority@odata.bind': toBoundLookupValue(
      'dga_strategic_prioritieses',
      formValues.strategicPriorityId
    ),
    'dga_strategic_priority_classification@odata.bind': toBoundLookupValue(
      'dga_strategic_prioritieses',
      formValues.strategicPriorityClassificationId
    ),
    'dga_work_stream@odata.bind': formValues.workStreamId
      ? toBoundLookupValue('dga_work_streams', formValues.workStreamId)
      : null,
    'dga_technology_company@odata.bind': formValues.technologyCompanyId
      ? toBoundLookupValue('dga_technologies', formValues.technologyCompanyId)
      : null,
    dga_planned_start_date: formValues.plannedStartDate,
    dga_planned_end_date: formValues.plannedEndDate,
    dga_summary: formValues.summary.trim(),
    dga_activity_type: formValues.activityType ?? undefined,
    dga_budget_item_type: formValues.budgetItemType ?? undefined,
    dga_category: formValues.category ?? undefined,
    dga_recommended: formValues.recommended ?? undefined,
    dga_rejection_reason: recommendedNo ? formValues.rejectionReason ?? undefined : null,
    dga_rejection_justification: recommendedNo ? formValues.rejectionJustification.trim() : null,
    'dga_rejected_by@odata.bind':
      recommendedNo && currentUserId ? toBoundLookupValue('systemusers', currentUserId) : null,
    dga_total_budget_paid_previous_year: parseCurrencyValue(
      formValues.totalBudgetPaidPreviousYear
    ) ?? undefined,
    dga_total_budget_payable_future_year: parseCurrencyValue(
      formValues.totalBudgetPayableFutureYear
    ) ?? undefined,
    dga_total_budget_payable_next_year: parseCurrencyValue(
      formValues.totalBudgetPayableNextYear
    ) ?? undefined,
    dga_total_budget_payable_for_year_after_next: parseCurrencyValue(
      formValues.totalBudgetPayableForYearAfterNext
    ) ?? undefined,
  } as Partial<Omit<Dga_ict_budgetsBase, 'dga_ict_budgetid'>>

  console.log('[IctBudgetDraftService] Updating ICT budget draft payload:', {
    ictBudgetId,
    payload,
    technologyProductIds: formValues.technologyProductIds,
  })

  const result = await Dga_ict_budgetsService.update(ictBudgetId, payload)
  assertOperationSucceeded(result, 'Failed to update ICT budget draft.')
}

const STATUS_CODE_MAP: Partial<Record<WorkflowStatusForAdge, number>> = {
  2: 776140001, // Submitted to Reviewer
  3: 776140002, // Submitted to Approver
  4: 776140003, // Approved
  5: 776140010, // Clarification Required
  6: 776140004, // Under DGE Review
  12: 576610001, // Reviewer Review Completed
}

export async function updateIctBudgetStatus(
  ictBudgetId: string,
  status: WorkflowStatusForAdge,
  targetOwner?: WorkflowTargetOwner,
  shareWithRole?: 'Respondent' | 'Reviewer' | 'Approver',
  actorRole?: WorkflowTargetOwner,
  notificationText?: string
) {
  const statuscode = STATUS_CODE_MAP[status]
  const payload = {
    dga_status_for_adge: status,
    ...(statuscode !== undefined ? { statuscode } : {}),
    ...(targetOwner ? getTargetOwnerBinding(targetOwner) : {}),
    ...(actorRole ? getActorRoleBinding(actorRole) : {}),
  } as Record<string, unknown>

  console.log('[IctBudgetDraftService] Updating ICT budget workflow status:', {
    ictBudgetId,
    status,
    statuscode: statuscode ?? null,
    targetOwner: targetOwner ?? null,
    actorRole: actorRole ?? null,
    payload,
  })

  const result = await Dga_ict_budgetsService.update(ictBudgetId, payload)
  assertOperationSucceeded(result, 'Failed to update ICT budget workflow status.')

  if (shareWithRole) {
    console.log('[IctBudgetDraftService] Sharing ICT budget after workflow update:', {
      ictBudgetId,
      shareWithRole,
      status,
      targetOwner: targetOwner ?? null,
    })
    await shareIctBudgetWithRoleTeam(ictBudgetId, shareWithRole)
  }

  if (targetOwner && notificationText?.trim()) {
    await createNotificationForRole(
      targetOwner,
      await buildBudgetNotificationText(ictBudgetId, notificationText.trim())
    )
  }
}

async function buildBudgetNotificationText(ictBudgetId: string, notificationText: string) {
  try {
    const result = await Dga_ict_budgetsService.get(ictBudgetId, {
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
    console.warn('[IctBudgetDraftService] Failed to resolve project name for notification text:', {
      ictBudgetId,
      error,
    })
    return notificationText
  }
}

export async function deleteIctBudgetDraft(ictBudgetId: string) {
  await Dga_ict_budgetsService.delete(ictBudgetId)
}
