import { Dga_ict_budget_instancesService } from '@/generated/services/Dga_ict_budget_instancesService'
import { Dga_ict_budgetsService } from '@/generated/services/Dga_ict_budgetsService'
import type { TeamRole } from '@/services/userContextService'
import {
  SESSION_RESPONDENT_ACCOUNT_KEY,
  SESSION_REVIEWER_ACCOUNT_KEY,
  SESSION_APPROVER_ACCOUNT_KEY,
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
      ],
      filter: `_dga_cycle_value eq ${cycleId} and _dga_entity_value eq ${accountId}`,
      top: 1,
    })

    if (!result.success || !result.data?.length) {
      return null
    }

    const rec = result.data[0]
    const detail: AppInstanceDetail = {
      id:                 rec.dga_ict_budget_instanceid,
      name:               rec.dga_name,
      abbr:               rec.dga_entity_abbr ?? '',
      planningStartDate:  rec.dga_planning_start_date ?? '',
      planningEndDate:    rec.dga_planning_end_date ?? '',
    }

    sessionStorage.setItem(SESSION_INSTANCE_ID_KEY,     detail.id)
    sessionStorage.setItem(SESSION_INSTANCE_DETAIL_KEY, JSON.stringify(detail))
    return detail
  } catch (err) {
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
      return
    }

    const currentCycle = getStoredCurrentCycle()
    if (!currentCycle?.id) {
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

  return true
}
