import type { Clarification, ClarificationReply } from '@/data/db'
import { dataSourcesInfo } from '../../.power/schemas/appschemas/dataSourcesInfo'
import { getPowerSdkInstance } from '../../node_modules/@microsoft/power-apps/dist/internal/data/core/runtime/getRuntimeContext.js'
import {
  Dga_ict_clarificationsService,
} from '@/generated/services/Dga_ict_clarificationsService'
import { Dga_ict_budgetsService } from '@/generated/services/Dga_ict_budgetsService'
import { Dga_ict_budget_instancesService } from '@/generated/services/Dga_ict_budget_instancesService'
import { Dga_module_configurationsService } from '@/generated/services/Dga_module_configurationsService'
import type {
  Dga_ict_clarifications,
  Dga_ict_clarificationsBase,
  Dga_ict_clarificationsdga_clarification_stage,
  Dga_ict_clarificationsdga_record_type,
  Dga_ict_clarificationsdga_scope,
  Dga_ict_clarificationsstatuscode,
} from '@/generated/models/Dga_ict_clarificationsModel'
import {
  SESSION_MODULE_CONFIG_TEAM_IDS_KEY,
  SESSION_MODULE_TYPE_ID_KEY,
  SESSION_USER_ID_KEY,
  type ModuleConfigTeamIds,
} from '@/services/userContextService'
import { uploadFilesToRecord } from '@/services/fileUploadService'

export interface RaiseClarificationInput {
  budgetId: string
  message: string
  raisedByRole: 'Reviewer' | 'Approver' | 'Strategy Team' | 'Strategy Director' | 'SME Team'
  clarificationStage?: Dga_ict_clarificationsdga_clarification_stage
  scope?: Dga_ict_clarificationsdga_scope
  raisedToTeamId?: string | null
  files?: File[]
}

export interface AddClarificationReplyInput {
  budgetId: string
  parentClarificationId: string
  message: string
  currentRole: 'Respondent' | 'Reviewer' | 'Approver' | 'Strategy Team' | 'Strategy Director' | 'SME Team'
  files?: File[]
}

const CLARIFICATION_SERVICE_VERSION = 'clarification-service-2026-05-12-c'

const CLARIFICATION_STAGE_PLANNING = 1 as Dga_ict_clarificationsdga_clarification_stage
const CLARIFICATION_STAGE_DGE_REVIEW = 2 as Dga_ict_clarificationsdga_clarification_stage
const RECORD_TYPE_COMMENT = 1 as Dga_ict_clarificationsdga_record_type
const RECORD_TYPE_CLARIFICATION = 2 as Dga_ict_clarificationsdga_record_type
const SCOPE_INTERNAL_ENTITY = 2 as Dga_ict_clarificationsdga_scope
const SCOPE_EXTERNAL = 1 as Dga_ict_clarificationsdga_scope
const SCOPE_INTERNAL_DGE = 3 as Dga_ict_clarificationsdga_scope
const STATUS_OPEN = 1 as Dga_ict_clarificationsstatuscode
const STATUS_RESPONDED = 776140002 as Dga_ict_clarificationsstatuscode
const STATUS_CLOSED = 776140003 as Dga_ict_clarificationsstatuscode

function normalizeRole(roleLabel: string | null | undefined): 'Respondent' | 'Reviewer' | 'Approver' | 'Strategy Team' | 'Strategy Director' | 'SME Team' {
  const normalized = roleLabel?.trim().toLowerCase() ?? ''
  if (normalized.includes('strategy director')) return 'Strategy Director'
  if (normalized.includes('strategy')) return 'Strategy Team'
  if (normalized.includes('sme')) return 'SME Team'
  if (normalized.includes('review')) return 'Reviewer'
  if (normalized.includes('approv')) return 'Approver'
  return 'Respondent'
}

function toRoleLabel(role: 'Respondent' | 'Reviewer' | 'Approver' | 'Strategy Team' | 'Strategy Director' | 'SME Team') {
  if (role === 'Strategy Director') return 'ICT - Strategy Director'
  if (role === 'Strategy Team') return 'ICT - Strategy Team'
  if (role === 'SME Team') return 'ICT - SME Team'
  if (role === 'Reviewer') return 'ICT - Reviewer'
  if (role === 'Approver') return 'Approver'
  return 'Respondent'
}

function toIsoDate(value: Date = new Date()) {
  return value.toISOString()
}

function toIsoDateOnly(value: Date = new Date()) {
  return value.toISOString().slice(0, 10)
}

function getStoredUserId() {
  return sessionStorage.getItem(SESSION_USER_ID_KEY)?.trim() || null
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

function toLookupBinding(entitySetName: string, id: string | null | undefined) {
  return id ? `/${entitySetName}(${id})` : undefined
}

function getFormattedAnnotation(record: unknown, key: string) {
  const value = (record as Record<string, unknown> | null)?.[key]
  return typeof value === 'string' && value.trim() ? value : null
}

function buildClarificationName(recordType: 'Clarification' | 'Comment', role: 'Respondent' | 'Reviewer' | 'Approver' | 'Strategy Team' | 'Strategy Director' | 'SME Team') {
  return `${recordType} - ${toRoleLabel(role)} - ${toIsoDateOnly()}`
}

function getScopeLabel(
  scope: Dga_ict_clarificationsdga_scope | null | undefined
): 'External' | 'Internal (Entity)' | 'Internal (DGE)' {
  if (scope === SCOPE_EXTERNAL) return 'External'
  if (scope === SCOPE_INTERNAL_DGE) return 'Internal (DGE)'
  return 'Internal (Entity)'
}

function getStageLabel(
  stage: Dga_ict_clarificationsdga_clarification_stage | null | undefined
): Clarification['stage'] | undefined {
  if (stage === 1) return 'Planning'
  if (stage === 2) return 'In DGE Review'
  if (stage === 3) return 'Allocation'
  if (stage === 4) return 'Utilization'
  return undefined
}

async function resolveRespondentTeamIdForBudget(budgetId: string): Promise<string | null> {
  const storedTeamIds = getStoredModuleConfigTeamIds()
  const storedRespondentTeamId = storedTeamIds?.respondentTeamId?.trim() || null
  if (storedRespondentTeamId) {
    return storedRespondentTeamId
  }

  const moduleTypeId = sessionStorage.getItem(SESSION_MODULE_TYPE_ID_KEY)?.trim() || null
  if (!moduleTypeId) {
    return null
  }

  const budgetResult = await Dga_ict_budgetsService.get(budgetId, {
    select: ['dga_ict_budgetid', '_dga_ict_budget_instance_value'],
  })
  const instanceId = budgetResult.data?._dga_ict_budget_instance_value?.trim() || null
  if (!instanceId) {
    return null
  }

  const instanceResult = await Dga_ict_budget_instancesService.get(instanceId, {
    select: ['dga_ict_budget_instanceid', '_dga_entity_value'],
  })
  const accountId = instanceResult.data?._dga_entity_value?.trim() || null
  if (!accountId) {
    return null
  }

  const configResult = await Dga_module_configurationsService.getAll({
    select: ['dga_module_configurationid', '_dga_respondent_team_value'],
    filter: `_dga_account_value eq ${accountId} and _dga_module_type_value eq ${moduleTypeId}`,
    top: 1,
  })

  const respondentTeamId = configResult.data?.[0]?._dga_respondent_team_value?.trim() || null
  if (respondentTeamId) {
    sessionStorage.setItem(
      SESSION_MODULE_CONFIG_TEAM_IDS_KEY,
      JSON.stringify({
        respondentTeamId,
        reviewerTeamId: storedTeamIds?.reviewerTeamId ?? null,
        approverTeamId: storedTeamIds?.approverTeamId ?? null,
        strategyTeamId: storedTeamIds?.strategyTeamId ?? null,
      } satisfies ModuleConfigTeamIds)
    )
  }

  console.log(`[ClarificationService ${CLARIFICATION_SERVICE_VERSION}] Resolved respondent team for budget:`, {
    budgetId,
    moduleTypeId,
    instanceId,
    accountId,
    respondentTeamId,
  })

  return respondentTeamId
}

function mapReply(record: Dga_ict_clarifications): ClarificationReply {
  const role = normalizeRole(record.dga_raised_by_role)

  return {
    id: record.dga_ict_clarificationid,
    fromRole: role,
    fromRoleLabel: record.dga_raised_by_role?.trim() || toRoleLabel(role),
    fromName:
      record.dga_raised_byname?.trim() ||
      getFormattedAnnotation(record, '_dga_raised_by_value@OData.Community.Display.V1.FormattedValue') ||
      'Unknown User',
    message: record.dga_description?.trim() || '',
    fileUrl: record.dga_file_url?.trim() || undefined,
    date: record.createdon?.slice(0, 10) || record.dga_response_date?.slice(0, 10) || toIsoDateOnly(),
  }
}

function mapClarification(record: Dga_ict_clarifications, replies: ClarificationReply[]): Clarification {
  const role = normalizeRole(record.dga_raised_by_role)
  const status = record.statuscode === STATUS_CLOSED || record.statuscodename === 'Closed' ? 'Closed' : 'Open'

  return {
    id: record.dga_ict_clarificationid,
    raisedBy: role,
    raisedByLabel: record.dga_raised_by_role?.trim() || toRoleLabel(role),
    raisedByName:
      record.dga_raised_byname?.trim() ||
      getFormattedAnnotation(record, '_dga_raised_by_value@OData.Community.Display.V1.FormattedValue') ||
      'Unknown User',
    raisedTo:
      record.dga_raised_toname?.trim() ||
      getFormattedAnnotation(record, '_dga_raised_to_value@OData.Community.Display.V1.FormattedValue') ||
      'Respondent',
    scope: getScopeLabel(record.dga_scope),
    stage: getStageLabel(record.dga_clarification_stage),
    message: record.dga_description?.trim() || '',
    fileUrl: record.dga_file_url?.trim() || undefined,
    status,
    date: record.dga_clarification_raised_date?.slice(0, 10) || record.createdon?.slice(0, 10) || toIsoDateOnly(),
    dueDate: record.dga_clarification_due_date?.slice(0, 10),
    closedAt: status === 'Closed' ? record.modifiedon?.slice(0, 10) || record.dga_response_date?.slice(0, 10) : undefined,
    replies,
  }
}

async function createClarificationRecord(
  payload: Record<string, unknown>
) {
  console.log(`[ClarificationService ${CLARIFICATION_SERVICE_VERSION}] Create payload:`, payload)

  const runtime = await getPowerSdkInstance(dataSourcesInfo)
  const runtimeAny = runtime as unknown as {
    _clientProvider: {
      getDataClientAsync(): Promise<{
        createDataAsync<TRequest, TResponse>(
          url: string,
          apiId: string,
          tableName: string,
          body: TRequest,
          context?: Record<string, unknown>
        ): Promise<{
          success: boolean
          data?: TResponse
          error?: { message?: string }
        }>
      }>
      getMetadataClientAsync(): Promise<{
        getAppDataSourceConfigsAsync(): Promise<{
          success: boolean
          data?: Record<string, {
            runtimeUrl?: string
            logicalName?: string
            entitySetName?: string
          }>
          error?: { message?: string }
        }>
      }>
    }
  }

  const metadataClient = await runtimeAny._clientProvider.getMetadataClientAsync()
  const configResult = await metadataClient.getAppDataSourceConfigsAsync()

  if (!configResult.success || !configResult.data) {
    throw new Error(configResult.error?.message || 'Unable to resolve Dataverse configuration for clarifications.')
  }

  const clarificationConfig = Object.values(configResult.data).find(
    (config) =>
      config.logicalName === 'dga_ict_clarifications' ||
      config.entitySetName === 'dga_ict_clarifications'
  )

  const runtimeUrl = clarificationConfig?.runtimeUrl?.trim()
  if (!runtimeUrl) {
    throw new Error('Unable to resolve Dataverse runtime URL for dga_ict_clarifications.')
  }

  const instanceUrlMatch = runtimeUrl.match(/^(https?:\/\/[^/]+)/i)
  const instanceUrl = instanceUrlMatch?.[1] ?? runtimeUrl.replace(/\/api\/data\/v[0-9.]+\/?$/i, '')
  const requestUrl = `${instanceUrl.replace(/\/$/, '')}/api/data/v9.0/dga_ict_clarifications`

  const dataClient = await runtimeAny._clientProvider.getDataClientAsync()
  const result = await dataClient.createDataAsync<Record<string, unknown>, Dga_ict_clarifications>(
    requestUrl,
    'Dataverse',
    'dga_ict_clarifications',
    payload,
    {
      operationName: 'clarificationService.createClarificationRecord',
      datasetName: 'default.cds',
      isDataVerseOperation: true,
    }
  )

  console.log('[ClarificationService] Create result:', result)

  if (!result.success || !result.data?.dga_ict_clarificationid) {
    throw new Error(result.error?.message || 'Unable to create clarification record.')
  }

  return result.data
}

async function uploadClarificationFiles(budgetId: string, files: File[] | undefined) {
  if (!files?.length) return null

  console.log('[ClarificationService] Uploading clarification attachment(s) to ICT budget folder:', {
    budgetId,
    fileCount: files.length,
  })

  const uploadedUrls = await uploadFilesToRecord(budgetId, files)
  const fileUrl = uploadedUrls.join(', ').trim() || null

  console.log('[ClarificationService] Clarification uploaded file URL(s):', fileUrl)
  return fileUrl
}

export async function getClarificationsByBudgetId(budgetId: string): Promise<Clarification[]> {
  if (!budgetId) return []

  try {
    const result = await Dga_ict_clarificationsService.getAll({
      select: [
        'dga_ict_clarificationid',
        'dga_clarification_due_date',
        'dga_clarification_raised_date',
        'createdon',
        'modifiedon',
        'dga_description',
        'dga_file_url',
        'dga_clarification_stage',
        'dga_scope',
        '_dga_ict_budget_value',
        '_dga_parent_clarificaiton_value',
        '_dga_raised_by_value',
        'dga_raised_by_role',
        '_dga_raised_to_value',
        'dga_record_type',
        'dga_response_date',
        'statuscode',
      ],
      filter: `_dga_ict_budget_value eq ${budgetId}`,
      orderBy: ['createdon asc'],
    })

    if (!result.success || !result.data?.length) {
      return []
    }

    const allRecords = result.data.filter((record): record is Dga_ict_clarifications =>
      Boolean(record.dga_ict_clarificationid)
    )

    const replyGroups = new Map<string, ClarificationReply[]>()
    for (const record of allRecords) {
      if (record.dga_record_type !== RECORD_TYPE_COMMENT || !record._dga_parent_clarificaiton_value) continue
      const parentId = record._dga_parent_clarificaiton_value
      const existing = replyGroups.get(parentId) ?? []
      existing.push(mapReply(record))
      replyGroups.set(parentId, existing)
    }

    return allRecords
      .filter(
        (record) =>
          record.dga_record_type === RECORD_TYPE_CLARIFICATION ||
          (record.dga_record_type !== RECORD_TYPE_COMMENT && !record._dga_parent_clarificaiton_value)
      )
      .sort((left, right) => (right.createdon || '').localeCompare(left.createdon || ''))
      .map((record) =>
        mapClarification(
          record,
          (replyGroups.get(record.dga_ict_clarificationid) ?? []).sort((left, right) =>
            left.date.localeCompare(right.date)
          )
        )
      )
  } catch (error) {
    console.error('[ClarificationService] Failed to retrieve clarifications:', error)
    return []
  }
}

export async function raiseBudgetClarification({
  budgetId,
  message,
  raisedByRole,
  clarificationStage,
  scope,
  raisedToTeamId,
  files,
}: RaiseClarificationInput): Promise<void> {
  const userId = getStoredUserId()
  const respondentTeamId =
    raisedToTeamId?.trim() ||
    (await resolveRespondentTeamIdForBudget(budgetId))

  if (!respondentTeamId) {
    throw new Error(
      'Respondent team id could not be resolved for this clarification, so dga_raised_to_team cannot be set.'
    )
  }

  const uploadedFileUrl = await uploadClarificationFiles(budgetId, files)

  const payload = {
    dga_name: buildClarificationName('Clarification', raisedByRole),
    dga_description: message.trim(),
    ...(uploadedFileUrl ? { dga_file_url: uploadedFileUrl } : {}),
    dga_clarification_stage: clarificationStage ?? CLARIFICATION_STAGE_PLANNING,
    dga_record_type: RECORD_TYPE_CLARIFICATION,
    dga_scope: scope ?? SCOPE_INTERNAL_ENTITY,
    dga_clarification_raised_date: toIsoDate(),
    dga_raised_by_role: toRoleLabel(raisedByRole),
    statuscode: STATUS_OPEN,
    'dga_ict_budget@odata.bind': toLookupBinding('dga_ict_budgets', budgetId),
    'dga_raised_by_systemuser@odata.bind': toLookupBinding('systemusers', userId),
    'dga_raised_to_team@odata.bind': toLookupBinding('teams', respondentTeamId),
  } as Record<string, unknown>

  await createClarificationRecord(payload)
}

export async function addClarificationReply({
  budgetId,
  parentClarificationId,
  message,
  currentRole,
  files,
}: AddClarificationReplyInput): Promise<void> {
  const userId = getStoredUserId()
  const today = toIsoDate()
  const uploadedFileUrl = await uploadClarificationFiles(budgetId, files)

  await createClarificationRecord({
    dga_name: buildClarificationName('Comment', currentRole),
    dga_description: message.trim(),
    ...(uploadedFileUrl ? { dga_file_url: uploadedFileUrl } : {}),
    dga_clarification_stage:
      currentRole === 'Strategy Team' || currentRole === 'Strategy Director' || currentRole === 'SME Team'
        ? CLARIFICATION_STAGE_DGE_REVIEW
        : CLARIFICATION_STAGE_PLANNING,
    dga_record_type: RECORD_TYPE_COMMENT,
    dga_scope:
      currentRole === 'Strategy Team' || currentRole === 'Strategy Director' || currentRole === 'SME Team'
        ? SCOPE_INTERNAL_DGE
        : SCOPE_INTERNAL_ENTITY,
    dga_response_date: today,
    dga_raised_by_role: toRoleLabel(currentRole),
    statuscode: STATUS_OPEN,
    'dga_ict_budget@odata.bind': toLookupBinding('dga_ict_budgets', budgetId),
    'dga_parent_clarificaiton@odata.bind': toLookupBinding('dga_ict_clarifications', parentClarificationId),
    'dga_raised_by_systemuser@odata.bind': toLookupBinding('systemusers', userId),
  })

  const parentUpdate: Partial<Omit<Dga_ict_clarificationsBase, 'dga_ict_clarificationid'>> = {
    dga_response_date: today,
  }

  if (currentRole === 'Respondent') {
    parentUpdate.statuscode = STATUS_RESPONDED
  }

  await Dga_ict_clarificationsService.update(parentClarificationId, parentUpdate)
}

export async function closeClarification(clarificationId: string): Promise<void> {
  await Dga_ict_clarificationsService.update(clarificationId, {
    statuscode: STATUS_CLOSED,
    dga_response_date: toIsoDate(),
  })
}
