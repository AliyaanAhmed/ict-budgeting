import { getClient } from '@microsoft/power-apps/data'
import { dataSourcesInfo } from '../../.power/schemas/appschemas/dataSourcesInfo'
import {
  SESSION_MODULE_CONFIG_TEAM_IDS_KEY,
  type ModuleConfigTeamIds,
  type TeamRole,
} from '@/services/userContextService'

const DATA_SOURCE_KEY = 'dga_webapiforportal'
const OPERATION_NAME = 'dga_WebApiForPortal'

interface GrantAccessRequestBody {
  actionName: 'grandaccess' | 'revokeeaccess'
  isAdmin: boolean
  userId: string
  tableName: 'dga_ict_budget'
  relatedId: string
  targetId: string
  fetchXml: 'read'
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

function getShareTargetTeamId(role: TeamRole) {
  const teamIds = getStoredModuleConfigTeamIds()

  if (role === 'Respondent') return teamIds?.respondentTeamId?.trim() || null
  if (role === 'Reviewer') return teamIds?.reviewerTeamId?.trim() || null
  return teamIds?.approverTeamId?.trim() || null
}

async function updateIctBudgetAccessForTeam(
  budgetId: string,
  targetTeamId: string,
  actionName: GrantAccessRequestBody['actionName']
) {
  const client = getClient(dataSourcesInfo)
  const requestBody: GrantAccessRequestBody = {
    actionName,
    isAdmin: true,
    userId: '',
    tableName: 'dga_ict_budget',
    relatedId: budgetId,
    targetId: targetTeamId,
    fetchXml: 'read',
  }

  console.log('[RecordShareService] Calling dga_WebApiForPortal access update:', {
    budgetId,
    actionName,
    targetTeamId,
    requestBody,
  })

  const result = await client.executeAsync<GrantAccessRequestBody, unknown>({
    dataverseRequest: {
      action: 'customapi',
      parameters: {
        operationName: OPERATION_NAME,
        tableName: DATA_SOURCE_KEY,
        body: requestBody,
      },
    },
  })

  console.log('[RecordShareService] Access update response:', result)
  console.log('[RecordShareService] result.success:', result.success)
  console.log('[RecordShareService] result.data:', result.data)
  console.log('[RecordShareService] result.error:', result.error)

  if (!result.success) {
    const errMsg =
      result.error instanceof Error
        ? result.error.message
        : String(result.error?.message ?? result.error ?? 'Unknown custom API error')
    throw new Error(`Failed to ${actionName === 'grandaccess' ? 'share' : 'revoke'} ICT budget access: ${errMsg}`)
  }
}

export async function grantIctBudgetAccessToTeam(budgetId: string, targetTeamId: string): Promise<void> {
  await updateIctBudgetAccessForTeam(budgetId, targetTeamId, 'grandaccess')
}

export async function revokeIctBudgetAccessFromTeam(budgetId: string, targetTeamId: string): Promise<void> {
  await updateIctBudgetAccessForTeam(budgetId, targetTeamId, 'revokeeaccess')
}

export async function shareIctBudgetWithRoleTeam(
  budgetId: string,
  role: TeamRole
): Promise<void> {
  const targetTeamId = getShareTargetTeamId(role)

  if (!targetTeamId) {
    throw new Error(`Unable to resolve ${role.toLowerCase()} team id for ICT budget sharing.`)
  }

  await grantIctBudgetAccessToTeam(budgetId, targetTeamId)
}
