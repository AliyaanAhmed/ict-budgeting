import { getContext } from '@microsoft/power-apps/app'
import { AccountsService } from '@/generated/services/AccountsService'
import { Dga_module_configurationsService } from '@/generated/services/Dga_module_configurationsService'
import { Dga_module_typesService } from '@/generated/services/Dga_module_typesService'
import { SystemusersService } from '@/generated/services/SystemusersService'
import { TeammembershipsService } from '@/generated/services/TeammembershipsService'
import { TeamsService } from '@/generated/services/TeamsService'

export const SESSION_USER_KEY = 'ict_app_user'
export const SESSION_USER_ID_KEY = 'userID'
export const SESSION_MODULE_TYPE_ID_KEY = 'moduleTypeID'
export const SESSION_MODULE_CONFIG_TEAM_IDS_KEY = 'moduleConfigTeamIDs'
export const SESSION_USER_TEAMS_KEY = 'userTeams'
export const SESSION_RESPONDENT_ACCOUNT_KEY = 'respondentAccount'
export const SESSION_RESPONDENT_ACCOUNT_NAME_KEY = 'respondentAccountName'
export const SESSION_RESPONDENT_MODULE_CONFIG_ID_KEY = 'respondentModuleConfigId'
export const SESSION_REVIEWER_ACCOUNT_KEY = 'reviewerAccount'
export const SESSION_REVIEWER_ACCOUNT_NAME_KEY = 'reviewerAccountName'
export const SESSION_REVIEWER_MODULE_CONFIG_ID_KEY = 'reviewerModuleConfigId'
export const SESSION_APPROVER_ACCOUNT_KEY = 'approverAccount'
export const SESSION_APPROVER_ACCOUNT_NAME_KEY = 'approverAccountName'
export const SESSION_APPROVER_MODULE_CONFIG_ID_KEY = 'approverModuleConfigId'

export type TeamRole = 'Respondent' | 'Reviewer' | 'Approver'

export interface UserTeam {
  teamid: string
  name: string
  role: TeamRole
}

export interface ModuleConfigTeamIds {
  respondentTeamId: string | null
  reviewerTeamId: string | null
  approverTeamId: string | null
  strategyTeamId: string | null
}

export interface AppUserContext {
  appId: string
  environmentId: string
  queryParams: Record<string, string>
  fullName: string
  objectId: string
  tenantId: string
  userPrincipalName: string
  sessionId: string
  systemUserId: string
  domainName: string
  internalEmail: string
  jobTitle: string
  businessUnitId: string
  businessUnitName: string
  organizationId: string
  organizationName: string
}

const EMPTY_MODULE_CONFIG_TEAM_IDS: ModuleConfigTeamIds = {
  respondentTeamId: null,
  reviewerTeamId: null,
  approverTeamId: null,
  strategyTeamId: null,
}

const ROLE_ACCOUNT_SESSION_KEY: Record<TeamRole, string> = {
  Respondent: SESSION_RESPONDENT_ACCOUNT_KEY,
  Reviewer: SESSION_REVIEWER_ACCOUNT_KEY,
  Approver: SESSION_APPROVER_ACCOUNT_KEY,
}

const ROLE_ACCOUNT_NAME_SESSION_KEY: Record<TeamRole, string> = {
  Respondent: SESSION_RESPONDENT_ACCOUNT_NAME_KEY,
  Reviewer: SESSION_REVIEWER_ACCOUNT_NAME_KEY,
  Approver: SESSION_APPROVER_ACCOUNT_NAME_KEY,
}

const ROLE_MODULE_CONFIG_SESSION_KEY: Record<TeamRole, string> = {
  Respondent: SESSION_RESPONDENT_MODULE_CONFIG_ID_KEY,
  Reviewer: SESSION_REVIEWER_MODULE_CONFIG_ID_KEY,
  Approver: SESSION_APPROVER_MODULE_CONFIG_ID_KEY,
}

function setSessionJson(key: string, value: unknown) {
  sessionStorage.setItem(key, JSON.stringify(value))
}

function storeModuleTypeId(moduleTypeId: string | null) {
  if (moduleTypeId) {
    sessionStorage.setItem(SESSION_MODULE_TYPE_ID_KEY, moduleTypeId)
  } else {
    sessionStorage.removeItem(SESSION_MODULE_TYPE_ID_KEY)
  }
}

function storeModuleConfigTeamIds(payload: ModuleConfigTeamIds) {
  setSessionJson(SESSION_MODULE_CONFIG_TEAM_IDS_KEY, payload)
}

function mergeStoredModuleConfigTeamIds(partial: Partial<ModuleConfigTeamIds>) {
  const raw = sessionStorage.getItem(SESSION_MODULE_CONFIG_TEAM_IDS_KEY)
  let current = EMPTY_MODULE_CONFIG_TEAM_IDS

  if (raw) {
    try {
      current = {
        ...EMPTY_MODULE_CONFIG_TEAM_IDS,
        ...(JSON.parse(raw) as Partial<ModuleConfigTeamIds>),
      }
    } catch {
      current = EMPTY_MODULE_CONFIG_TEAM_IDS
    }
  }

  storeModuleConfigTeamIds({
    ...current,
    ...partial,
  })
}

async function fetchAndStoreIctBudgetingModuleTypeId(): Promise<string | null> {
  try {
    const result = await Dga_module_typesService.getAll({
      select: ['dga_module_typeid', 'dga_module_name'],
      orderBy: ['dga_module_name asc'],
    })
    const moduleTypes = result.data ?? []
    const match =
      moduleTypes.find((item) => item.dga_module_name?.trim().toLowerCase() === 'ict budgeting') ??
      moduleTypes.find((item) => item.dga_module_name?.trim().toLowerCase().includes('ict'))

    const moduleTypeId =
      typeof match?.dga_module_typeid === 'string' && match.dga_module_typeid.trim()
        ? match.dga_module_typeid.trim()
        : null

    storeModuleTypeId(moduleTypeId)
    return moduleTypeId
  } catch (error) {
    storeModuleTypeId(null)
    return null
  }
}

async function fetchAndStoreModuleConfigTeamIds(accountId: string | null, moduleTypeId: string | null): Promise<void> {
  if (!accountId || !moduleTypeId) {
    storeModuleConfigTeamIds(EMPTY_MODULE_CONFIG_TEAM_IDS)
    return
  }

  const filter = `(_dga_account_value eq ${accountId} and _dga_module_type_value eq ${moduleTypeId})`

  try {
    const result = await Dga_module_configurationsService.getAll({
      select: [
        'dga_module_configurationid',
        '_dga_account_value',
        '_dga_approver_team_value',
        '_dga_respondent_team_value',
        '_dga_reviewer_team_value',
      ],
      filter,
      top: 1,
    })
    const record = result.data?.[0]
    const payload: ModuleConfigTeamIds = {
      respondentTeamId: record?._dga_respondent_team_value ?? null,
      reviewerTeamId: record?._dga_reviewer_team_value ?? null,
      approverTeamId: record?._dga_approver_team_value ?? null,
      strategyTeamId: null,
    }

    storeModuleConfigTeamIds(payload)
  } catch (error) {
    storeModuleConfigTeamIds(EMPTY_MODULE_CONFIG_TEAM_IDS)
  }
}

async function fetchAndStoreStrategyTeamId() {
  try {
    const result = await TeamsService.getAll({
      select: ['teamid', 'name'],
      filter: `name eq 'ICT - Strategy Team'`,
      top: 1,
    })

    const strategyTeamId = result.data?.[0]?.teamid?.trim() || null
    mergeStoredModuleConfigTeamIds({ strategyTeamId })
  } catch {
    mergeStoredModuleConfigTeamIds({ strategyTeamId: null })
  }
}

async function fetchUserTeamsAndAccounts(systemUserId: string, moduleTypeId: string | null): Promise<void> {
  let memberships
  try {
    memberships = await TeammembershipsService.getAll({
      select: ['teamid', 'systemuserid'],
      filter: `systemuserid eq ${systemUserId}`,
    })
  } catch (error) {
    storeModuleConfigTeamIds(EMPTY_MODULE_CONFIG_TEAM_IDS)
    return
  }

  const teamIds = (memberships.data ?? []).map((item) => item.teamid).filter(Boolean)
  if (!teamIds.length) {
    sessionStorage.setItem(SESSION_USER_TEAMS_KEY, JSON.stringify([]))
    storeModuleConfigTeamIds(EMPTY_MODULE_CONFIG_TEAM_IDS)
    return
  }

  const roleFilter = [
    ...teamIds.map((id) => `_dga_respondent_team_value eq ${id}`),
    ...teamIds.map((id) => `_dga_reviewer_team_value eq ${id}`),
    ...teamIds.map((id) => `_dga_approver_team_value eq ${id}`),
  ].join(' or ')

  const configFilter = moduleTypeId ? `(${roleFilter}) and _dga_module_type_value eq ${moduleTypeId}` : roleFilter

  let moduleConfigs
  try {
    moduleConfigs = await Dga_module_configurationsService.getAll({
      select: [
        'dga_module_configurationid',
        'dga_name',
        '_dga_account_value',
        '_dga_module_type_value',
        '_dga_respondent_team_value',
        '_dga_reviewer_team_value',
        '_dga_approver_team_value',
      ],
      filter: configFilter,
    })
  } catch (error) {
    storeModuleConfigTeamIds(EMPTY_MODULE_CONFIG_TEAM_IDS)
    return
  }

  const configs = moduleConfigs.data ?? []
  if (!configs.length) {
    storeModuleConfigTeamIds(EMPTY_MODULE_CONFIG_TEAM_IDS)
    return
  }

  if (!moduleTypeId) {
    const fallbackModuleTypeId = configs.find((item) => item._dga_module_type_value)?._dga_module_type_value ?? null
    if (fallbackModuleTypeId) {
      storeModuleTypeId(fallbackModuleTypeId)
      moduleTypeId = fallbackModuleTypeId
    }
  }

  const teamIdSet = new Set(teamIds)
  const roleTeamMap: Partial<Record<TeamRole, string>> = {}
  const roleAccountMap: Partial<Record<TeamRole, string>> = {}
  const roleModuleConfigMap: Partial<Record<TeamRole, string>> = {}

  for (const config of configs) {
    const pickRole = (teamId: string | undefined, role: TeamRole) => {
      if (!teamId || !teamIdSet.has(teamId)) return

      if (!roleTeamMap[role]) roleTeamMap[role] = teamId
      if (!roleAccountMap[role] && config._dga_account_value) roleAccountMap[role] = config._dga_account_value
      if (!roleModuleConfigMap[role] && config.dga_module_configurationid) {
        roleModuleConfigMap[role] = config.dga_module_configurationid
      }
    }

    pickRole(config._dga_respondent_team_value, 'Respondent')
    pickRole(config._dga_reviewer_team_value, 'Reviewer')
    pickRole(config._dga_approver_team_value, 'Approver')
  }

  const userTeamIds = Object.values(roleTeamMap).filter(Boolean) as string[]
  const teamNameMap: Record<string, string> = {}

  if (userTeamIds.length) {
    const teamFilter = userTeamIds.map((id) => `teamid eq ${id}`).join(' or ')
    try {
      const teamsResult = await TeamsService.getAll({
        select: ['teamid', 'name'],
        filter: teamFilter,
      })
      for (const team of teamsResult.data ?? []) {
        if (team.teamid && team.name) {
          teamNameMap[team.teamid] = team.name
        }
      }
    } catch {
    }
  }

  const uniqueAccountIds = [...new Set(Object.values(roleAccountMap).filter(Boolean) as string[])]
  const accountNameMap: Record<string, string> = {}

  for (const accountId of uniqueAccountIds) {
    try {
      const accountResult = await AccountsService.get(accountId, { select: ['accountid', 'name'] })
      if (accountResult.success && accountResult.data?.name) {
        accountNameMap[accountId] = accountResult.data.name
      }
    } catch {
    }
  }

  const userTeams: UserTeam[] = (['Respondent', 'Reviewer', 'Approver'] as TeamRole[])
    .map((role) => {
      const teamId = roleTeamMap[role]
      if (!teamId) return null

      return {
        teamid: teamId,
        name: teamNameMap[teamId] ?? teamId,
        role,
      }
    })
    .filter((item): item is UserTeam => item !== null)

  setSessionJson(SESSION_USER_TEAMS_KEY, userTeams)

  for (const role of ['Respondent', 'Reviewer', 'Approver'] as TeamRole[]) {
    const accountId = roleAccountMap[role]
    const accountName = accountId ? accountNameMap[accountId] ?? '' : ''
    const moduleConfigId = roleModuleConfigMap[role] ?? ''

    if (accountId) {
      sessionStorage.setItem(ROLE_ACCOUNT_SESSION_KEY[role], accountId)
      sessionStorage.setItem(ROLE_ACCOUNT_NAME_SESSION_KEY[role], accountName)
    } else {
      sessionStorage.removeItem(ROLE_ACCOUNT_SESSION_KEY[role])
      sessionStorage.removeItem(ROLE_ACCOUNT_NAME_SESSION_KEY[role])
    }

    if (moduleConfigId) {
      sessionStorage.setItem(ROLE_MODULE_CONFIG_SESSION_KEY[role], moduleConfigId)
    } else {
      sessionStorage.removeItem(ROLE_MODULE_CONFIG_SESSION_KEY[role])
    }
  }

  const availableAccountId =
    roleAccountMap.Respondent ??
    roleAccountMap.Reviewer ??
    roleAccountMap.Approver ??
    uniqueAccountIds[0] ??
    null
  await fetchAndStoreModuleConfigTeamIds(availableAccountId, moduleTypeId)
  await fetchAndStoreStrategyTeamId()
}

export async function initUserContext(): Promise<void> {
  try {
    const ctx = await getContext()

    const objectId = ctx.user.objectId ?? ''
    const userContext: AppUserContext = {
      appId: ctx.app.appId ?? '',
      environmentId: ctx.app.environmentId ?? '',
      queryParams: ctx.app.queryParams ?? {},
      fullName: ctx.user.fullName ?? '',
      objectId,
      tenantId: ctx.user.tenantId ?? '',
      userPrincipalName: ctx.user.userPrincipalName ?? '',
      sessionId: ctx.host.sessionId ?? '',
      systemUserId: '',
      domainName: '',
      internalEmail: '',
      jobTitle: '',
      businessUnitId: '',
      businessUnitName: '',
      organizationId: '',
      organizationName: '',
    }

    if (objectId) {
      try {
        const systemUsers = await SystemusersService.getAll({
          select: [
            'systemuserid',
            'fullname',
            'domainname',
            'internalemailaddress',
            'jobtitle',
            'azureactivedirectoryobjectid',
            '_businessunitid_value',
          ],
          filter: `azureactivedirectoryobjectid eq ${objectId}`,
        })
        const systemUser = systemUsers.data?.[0]
        if (systemUser) {
          userContext.systemUserId = systemUser.systemuserid ?? ''
          userContext.domainName = systemUser.domainname ?? ''
          userContext.internalEmail = systemUser.internalemailaddress ?? ''
          userContext.jobTitle = systemUser.jobtitle ?? ''
          userContext.businessUnitId = systemUser._businessunitid_value ?? ''
          userContext.businessUnitName = systemUser.businessunitidname ?? ''
          userContext.organizationId = systemUser.organizationid ?? ''
          userContext.organizationName = systemUser.organizationidname ?? ''
        }
      } catch {
      }
    }

    setSessionJson(SESSION_USER_KEY, userContext)

    if (userContext.systemUserId) {
      sessionStorage.setItem(SESSION_USER_ID_KEY, userContext.systemUserId)
    } else {
      sessionStorage.removeItem(SESSION_USER_ID_KEY)
    }

    const moduleTypeId = await fetchAndStoreIctBudgetingModuleTypeId()

    if (userContext.systemUserId) {
      await fetchUserTeamsAndAccounts(userContext.systemUserId, moduleTypeId)
    } else {
      storeModuleConfigTeamIds(EMPTY_MODULE_CONFIG_TEAM_IDS)
    }
  } catch {
    storeModuleTypeId(null)
    storeModuleConfigTeamIds(EMPTY_MODULE_CONFIG_TEAM_IDS)
  }
}

export function getStoredUserContext(): AppUserContext | null {
  const raw = sessionStorage.getItem(SESSION_USER_KEY)
  if (!raw) return null

  try {
    return JSON.parse(raw) as AppUserContext
  } catch {
    return null
  }
}
