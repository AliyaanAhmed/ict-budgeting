import { Dga_ict_budget_instancesService } from '@/generated/services/Dga_ict_budget_instancesService'
import { Dga_ict_budgetsService } from '@/generated/services/Dga_ict_budgetsService'
import { Dga_module_configurationsService } from '@/generated/services/Dga_module_configurationsService'
import type { ModuleConfigTeamIds, TeamRole } from '@/services/userContextService'
import {
  SESSION_RESPONDENT_ACCOUNT_KEY,
  SESSION_REVIEWER_ACCOUNT_KEY,
  SESSION_APPROVER_ACCOUNT_KEY,
  SESSION_MODULE_CONFIG_TEAM_IDS_KEY,
} from '@/services/userContextService'
import { SESSION_USER_TEAMS_KEY } from '@/services/userContextService'
import type { Role } from '@/data/db'
import { getStoredCurrentCycle } from '@/services/cycleService'

export const SESSION_INSTANCE_ID_KEY     = 'instanceID'
export const SESSION_INSTANCE_DETAIL_KEY = 'instanceDetail'

export interface AppInstanceDetail {
  id: string
  name: string
  abbr: string
  planningStartDate: string
  planningEndDate: string
  statuscode?: number | null
  moduleConfigurationId?: string | null
}

const ROLE_ACCOUNT_KEY: Record<TeamRole, string> = {
  Respondent: SESSION_RESPONDENT_ACCOUNT_KEY,
  Reviewer:   SESSION_REVIEWER_ACCOUNT_KEY,
  Approver:   SESSION_APPROVER_ACCOUNT_KEY,
}

export function getAccountIdForRole(role: Role): string | null {
  const key = ROLE_ACCOUNT_KEY[role as TeamRole]
  if (!key) return null
  return sessionStorage.getItem(key) || null
}

function getStoredModuleConfigTeamIds(): ModuleConfigTeamIds {
  const raw = sessionStorage.getItem(SESSION_MODULE_CONFIG_TEAM_IDS_KEY)
  if (!raw) {
    return {
      respondentTeamId: null,
      reviewerTeamId: null,
      approverTeamId: null,
      strategyTeamId: null,
    }
  }

  try {
    return {
      respondentTeamId: null,
      reviewerTeamId: null,
      approverTeamId: null,
      strategyTeamId: null,
      ...(JSON.parse(raw) as Partial<ModuleConfigTeamIds>),
    }
  } catch {
    return {
      respondentTeamId: null,
      reviewerTeamId: null,
      approverTeamId: null,
      strategyTeamId: null,
    }
  }
}

async function refreshModuleConfigTeamIdsForInstance(moduleConfigurationId: string | null): Promise<void> {
  const existing = getStoredModuleConfigTeamIds()

  if (!moduleConfigurationId) {
    sessionStorage.setItem(
      SESSION_MODULE_CONFIG_TEAM_IDS_KEY,
      JSON.stringify({
        ...existing,
        respondentTeamId: null,
        reviewerTeamId: null,
        approverTeamId: null,
      })
    )
    return
  }

  try {
    const result = await Dga_module_configurationsService.get(moduleConfigurationId, {
      select: [
        'dga_module_configurationid',
        '_dga_respondent_team_value',
        '_dga_reviewer_team_value',
        '_dga_approver_team_value',
      ],
    })

    const record = result.data
    sessionStorage.setItem(
      SESSION_MODULE_CONFIG_TEAM_IDS_KEY,
      JSON.stringify({
        ...existing,
        respondentTeamId: record?._dga_respondent_team_value ?? null,
        reviewerTeamId: record?._dga_reviewer_team_value ?? null,
        approverTeamId: record?._dga_approver_team_value ?? null,
      })
    )
  } catch {
    sessionStorage.setItem(
      SESSION_MODULE_CONFIG_TEAM_IDS_KEY,
      JSON.stringify({
        ...existing,
        respondentTeamId: null,
        reviewerTeamId: null,
        approverTeamId: null,
      })
    )
  }
}

export function clearStoredInstanceContext(options: { clearAdgeTeamIds?: boolean } = {}): void {
  sessionStorage.removeItem(SESSION_INSTANCE_ID_KEY)
  sessionStorage.removeItem(SESSION_INSTANCE_DETAIL_KEY)
  if (options.clearAdgeTeamIds) {
    void refreshModuleConfigTeamIdsForInstance(null)
  }
}

function patchStoredInstanceDetail(patch: Partial<AppInstanceDetail>): void {
  const current = getStoredInstanceDetail()
  if (!current) return
  sessionStorage.setItem(SESSION_INSTANCE_DETAIL_KEY, JSON.stringify({ ...current, ...patch }))
}

export async function fetchAndStoreInstance(
  cycleId: string,
  accountId: string
): Promise<AppInstanceDetail | null> {
  try {
    const result = await Dga_ict_budget_instancesService.getAll({
      select: [
        'dga_ict_budget_instanceid',
        '_dga_cycle_value',
        '_dga_entity_value',
        'dga_entity_abbr',
        'dga_name',
        'dga_planning_start_date',
        'dga_planning_end_date',
        'statuscode',
        '_dga_module_configuration_value',
      ],
      filter: `_dga_cycle_value eq ${cycleId} and _dga_entity_value eq ${accountId}`,
      top: 1,
    })

    if (!result.success || !result.data?.length) {
      clearStoredInstanceContext({ clearAdgeTeamIds: true })
      return null
    }

    const rec = result.data[0]
    const moduleConfigurationId = rec._dga_module_configuration_value?.trim() || null
    const detail: AppInstanceDetail = {
      id:                 rec.dga_ict_budget_instanceid,
      name:               rec.dga_name,
      abbr:               rec.dga_entity_abbr ?? '',
      planningStartDate:  rec.dga_planning_start_date ?? '',
      planningEndDate:    rec.dga_planning_end_date ?? '',
      statuscode:         typeof rec.statuscode === 'number' ? rec.statuscode : null,
      moduleConfigurationId,
    }

    sessionStorage.setItem(SESSION_INSTANCE_ID_KEY,     detail.id)
    sessionStorage.setItem(SESSION_INSTANCE_DETAIL_KEY, JSON.stringify(detail))
    await refreshModuleConfigTeamIdsForInstance(moduleConfigurationId)
    return detail
  } catch (err) {
    clearStoredInstanceContext({ clearAdgeTeamIds: true })
    return null
  }
}

// Called from main.tsx before React renders — uses sessionStorage to determine
// the default role and current cycle.
export async function initInstanceContext(): Promise<void> {
  try {
    // Determine default role from stored teams
    const teamsRaw = sessionStorage.getItem(SESSION_USER_TEAMS_KEY)
    const teams: { role: TeamRole }[] = teamsRaw ? JSON.parse(teamsRaw) : []
    const defaultRole: Role = teams[0]?.role ?? 'Respondent'

    const accountId = getAccountIdForRole(defaultRole)
    if (!accountId) {
      clearStoredInstanceContext()
      return
    }

    const currentCycle = getStoredCurrentCycle()
    if (!currentCycle?.id) {
      clearStoredInstanceContext()
      return
    }

    await fetchAndStoreInstance(currentCycle.id, accountId)
  } catch (err) {
    return
  }
}

export function getStoredInstanceId(): string | null {
  return sessionStorage.getItem(SESSION_INSTANCE_ID_KEY) || null
}

export function getStoredInstanceDetail(): AppInstanceDetail | null {
  const raw = sessionStorage.getItem(SESSION_INSTANCE_DETAIL_KEY)
  if (!raw) return null
  try { return JSON.parse(raw) as AppInstanceDetail } catch { return null }
}

const INSTANCE_STATUS_PLANNING = 776140002
const INSTANCE_STATUS_DGE_REVIEW = 776140003

export async function markCurrentInstancePlanningIfFirstProject(): Promise<boolean> {
  const instanceId = getStoredInstanceId()
  if (!instanceId) {
    return false
  }

  const budgetsResult = await Dga_ict_budgetsService.getAll({
    select: ['dga_ict_budgetid'],
    filter: `_dga_ict_budget_instance_value eq ${instanceId}`,
    top: 2,
  })

  const budgetCount = budgetsResult.data?.length ?? 0
  if (budgetCount !== 1) {
    return false
  }

  await Dga_ict_budget_instancesService.update(instanceId, {
    statuscode: INSTANCE_STATUS_PLANNING,
  })
  patchStoredInstanceDetail({ statuscode: INSTANCE_STATUS_PLANNING })

  return true
}

export async function updateCurrentInstanceSubmissionDate(submittedAt: Date = new Date()): Promise<void> {
  const instanceId = sessionStorage.getItem(SESSION_INSTANCE_ID_KEY)?.trim() || null
  if (!instanceId) {
    throw new Error('Current ICT budget instance is missing from session storage.')
  }

  await Dga_ict_budget_instancesService.update(instanceId, {
    dga_entity_submission_date: submittedAt.toISOString(),
    statuscode: INSTANCE_STATUS_DGE_REVIEW,
  })
  patchStoredInstanceDetail({ statuscode: INSTANCE_STATUS_DGE_REVIEW })
}
