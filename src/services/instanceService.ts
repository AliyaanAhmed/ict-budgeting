import { Dga_ict_budget_instancesService } from '@/generated/services/Dga_ict_budget_instancesService'
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
  console.log('[InstanceService] Fetching instance — cycleId:', cycleId, 'accountId:', accountId)
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
    console.log('[InstanceService] Dga_ict_budget_instancesService.getAll() result:', result)

    if (!result.success || !result.data?.length) {
      console.warn('[InstanceService] No instance found for this cycle + account combination')
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
    console.log('[InstanceService] ✓ instanceID =', detail.id, '| abbr =', detail.abbr)
    return detail
  } catch (err) {
    console.error('[InstanceService] fetchAndStoreInstance THREW:', err)
    return null
  }
}

// Called from main.tsx before React renders — uses sessionStorage to determine
// the default role and current cycle.
export async function initInstanceContext(): Promise<void> {
  console.log('[InstanceService] ── initInstanceContext ENTERED ──')
  try {
    // Determine default role from stored teams
    const teamsRaw = sessionStorage.getItem(SESSION_USER_TEAMS_KEY)
    const teams: { role: TeamRole }[] = teamsRaw ? JSON.parse(teamsRaw) : []
    const defaultRole: Role = teams[0]?.role ?? 'Respondent'
    console.log('[InstanceService] Default role for init:', defaultRole)

    const accountId = getAccountIdForRole(defaultRole)
    if (!accountId) {
      console.warn('[InstanceService] No account ID found for role', defaultRole, '— skipping instance fetch')
      return
    }

    const currentCycle = getStoredCurrentCycle()
    if (!currentCycle?.id) {
      console.warn('[InstanceService] No currentCycle in sessionStorage — skipping instance fetch')
      return
    }

    await fetchAndStoreInstance(currentCycle.id, accountId)
    console.log('[InstanceService] ── initInstanceContext COMPLETE ──')
  } catch (err) {
    console.error('[InstanceService] initInstanceContext THREW:', err)
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
