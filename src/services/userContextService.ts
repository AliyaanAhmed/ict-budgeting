import { getContext } from '@microsoft/power-apps/app'
import { SystemusersService } from '@/generated/services/SystemusersService'
import { TeammembershipsService } from '@/generated/services/TeammembershipsService'
import { TeamsService } from '@/generated/services/TeamsService'
import { AccountsService } from '@/generated/services/AccountsService'
import { Dga_module_configurationsService } from '@/generated/services/Dga_module_configurationsService'

export const SESSION_USER_KEY                         = 'ict_app_user'
export const SESSION_USER_TEAMS_KEY                   = 'userTeams'
export const SESSION_RESPONDENT_ACCOUNT_KEY           = 'respondentAccount'
export const SESSION_RESPONDENT_ACCOUNT_NAME_KEY      = 'respondentAccountName'
export const SESSION_RESPONDENT_MODULE_CONFIG_ID_KEY  = 'respondentModuleConfigId'
export const SESSION_REVIEWER_ACCOUNT_KEY             = 'reviewerAccount'
export const SESSION_REVIEWER_ACCOUNT_NAME_KEY        = 'reviewerAccountName'
export const SESSION_REVIEWER_MODULE_CONFIG_ID_KEY    = 'reviewerModuleConfigId'
export const SESSION_APPROVER_ACCOUNT_KEY             = 'approverAccount'
export const SESSION_APPROVER_ACCOUNT_NAME_KEY        = 'approverAccountName'
export const SESSION_APPROVER_MODULE_CONFIG_ID_KEY    = 'approverModuleConfigId'

export type TeamRole = 'Respondent' | 'Reviewer' | 'Approver'

export interface UserTeam {
  teamid: string
  name:   string
  role:   TeamRole
}

const ROLE_ACCOUNT_SESSION_KEY: Record<TeamRole, string> = {
  Respondent: SESSION_RESPONDENT_ACCOUNT_KEY,
  Reviewer:   SESSION_REVIEWER_ACCOUNT_KEY,
  Approver:   SESSION_APPROVER_ACCOUNT_KEY,
}

const ROLE_ACCOUNT_NAME_SESSION_KEY: Record<TeamRole, string> = {
  Respondent: SESSION_RESPONDENT_ACCOUNT_NAME_KEY,
  Reviewer:   SESSION_REVIEWER_ACCOUNT_NAME_KEY,
  Approver:   SESSION_APPROVER_ACCOUNT_NAME_KEY,
}

const ROLE_MODULE_CONFIG_SESSION_KEY: Record<TeamRole, string> = {
  Respondent: SESSION_RESPONDENT_MODULE_CONFIG_ID_KEY,
  Reviewer:   SESSION_REVIEWER_MODULE_CONFIG_ID_KEY,
  Approver:   SESSION_APPROVER_MODULE_CONFIG_ID_KEY,
}

async function fetchUserTeamsAndAccounts(systemUserId: string): Promise<void> {
  console.log('[UserContext][Teams] ── fetchUserTeamsAndAccounts ENTERED ──')
  console.log('[UserContext][Teams] systemUserId:', systemUserId)

  // ── Step 1: get all team IDs the user belongs to via the teammembership intersect table ──
  console.log('[UserContext][Teams] Step 1: Fetching teammemberships...')
  let teamIds: string[] = []

  try {
    const membResult = await TeammembershipsService.getAll({
      select: ['teamid', 'systemuserid'],
      filter: `systemuserid eq ${systemUserId}`,
    })
    console.log('[UserContext][Teams] TeammembershipsService.getAll() result:', membResult)

    if (!membResult.success || !membResult.data?.length) {
      console.warn('[UserContext][Teams] No team memberships found — user may not belong to any team')
      return
    }

    teamIds = membResult.data.map(m => m.teamid).filter(Boolean)
    console.log('[UserContext][Teams] Team IDs found:', teamIds)
  } catch (err) {
    console.error('[UserContext][Teams] TeammembershipsService.getAll() FAILED:', err)
    return
  }

  if (!teamIds.length) {
    console.warn('[UserContext][Teams] teamIds array is empty after mapping — nothing to process')
    return
  }

  // ── Step 2: query dga_module_configuration filtering across all three role columns ──
  // Each module config links a respondent/reviewer/approver team to an account.
  // We build one OR filter covering all three role columns × all team IDs.
  const respondentClauses = teamIds.map(id => `_dga_respondent_team_value eq ${id}`)
  const reviewerClauses   = teamIds.map(id => `_dga_reviewer_team_value eq ${id}`)
  const approverClauses   = teamIds.map(id => `_dga_approver_team_value eq ${id}`)
  const moduleFilter = [...respondentClauses, ...reviewerClauses, ...approverClauses].join(' or ')

  console.log('[UserContext][Teams] Step 2: Fetching module configurations...')
  console.log('[UserContext][Teams] Module config filter:', moduleFilter)

  try {
    const modResult = await Dga_module_configurationsService.getAll({
      select: [
        'dga_module_configurationid',
        'dga_name',
        '_dga_account_value',
        '_dga_respondent_team_value',
        '_dga_reviewer_team_value',
        '_dga_approver_team_value',
      ],
      filter: moduleFilter,
    })
    console.log('[UserContext][Teams] Dga_module_configurationsService.getAll() result:', modResult)

    if (!modResult.success || !modResult.data?.length) {
      console.warn('[UserContext][Teams] No module configurations matched the user\'s teams')
      return
    }

    // ── Step 2a: collect role→teamId, role→accountId, role→moduleConfigId ──
    const teamIdSet         = new Set(teamIds)
    const roleTeamMap:         Partial<Record<TeamRole, string>> = {}
    const roleAccountMap:      Partial<Record<TeamRole, string>> = {}
    const roleModuleConfigMap: Partial<Record<TeamRole, string>> = {}

    for (const config of modResult.data) {
      console.log('[UserContext][Teams] Module config:', config.dga_module_configurationid, '|', config.dga_name)
      console.log('[UserContext][Teams]   respondent:', config._dga_respondent_team_value)
      console.log('[UserContext][Teams]   reviewer:  ', config._dga_reviewer_team_value)
      console.log('[UserContext][Teams]   approver:  ', config._dga_approver_team_value)
      console.log('[UserContext][Teams]   account:   ', config._dga_account_value)

      const pickRole = (teamId: string | undefined, role: TeamRole) => {
        if (!teamId || !teamIdSet.has(teamId)) return
        if (!roleTeamMap[role])    roleTeamMap[role]    = teamId
        if (!roleAccountMap[role] && config._dga_account_value)
          roleAccountMap[role] = config._dga_account_value
        if (!roleModuleConfigMap[role] && config.dga_module_configurationid)
          roleModuleConfigMap[role] = config.dga_module_configurationid
      }
      pickRole(config._dga_respondent_team_value, 'Respondent')
      pickRole(config._dga_reviewer_team_value,   'Reviewer')
      pickRole(config._dga_approver_team_value,   'Approver')
    }
    console.log('[UserContext][Teams] roleTeamMap:         ', roleTeamMap)
    console.log('[UserContext][Teams] roleAccountMap:      ', roleAccountMap)
    console.log('[UserContext][Teams] roleModuleConfigMap: ', roleModuleConfigMap)

    // ── Step 3: fetch actual team names from the team table ──
    const roleTeamIds = Object.values(roleTeamMap).filter(Boolean) as string[]
    const teamNameMap: Record<string, string> = {}

    if (roleTeamIds.length) {
      const teamFilter = roleTeamIds.map(id => `teamid eq ${id}`).join(' or ')
      console.log('[UserContext][Teams] Step 3: Fetching team names, filter:', teamFilter)
      try {
        const teamsResult = await TeamsService.getAll({
          select: ['teamid', 'name'],
          filter: teamFilter,
        })
        console.log('[UserContext][Teams] TeamsService.getAll() result:', teamsResult)
        if (teamsResult.success && teamsResult.data) {
          for (const t of teamsResult.data) {
            if (t.teamid && t.name) teamNameMap[t.teamid] = t.name
          }
        }
      } catch (err) {
        console.error('[UserContext][Teams] TeamsService.getAll() FAILED:', err)
      }
    }
    console.log('[UserContext][Teams] teamNameMap:', teamNameMap)

    // ── Step 4: fetch account names (unique account IDs only) ──
    const uniqueAccountIds = [...new Set(Object.values(roleAccountMap).filter(Boolean) as string[])]
    const accountNameMap: Record<string, string> = {}

    for (const accountId of uniqueAccountIds) {
      console.log('[UserContext][Teams] Step 4: Fetching account name for:', accountId)
      try {
        const accResult = await AccountsService.get(accountId, { select: ['accountid', 'name'] })
        console.log('[UserContext][Teams] AccountsService.get() result:', accResult)
        if (accResult.success && accResult.data?.name) {
          accountNameMap[accountId] = accResult.data.name
        }
      } catch (err) {
        console.error('[UserContext][Teams] AccountsService.get() FAILED for', accountId, ':', err)
      }
    }
    console.log('[UserContext][Teams] accountNameMap:', accountNameMap)

    // ── Step 5: build userTeams with resolved names ──
    const userTeams: UserTeam[] = []
    for (const role of (['Respondent', 'Reviewer', 'Approver'] as TeamRole[])) {
      const teamId = roleTeamMap[role]
      if (!teamId) continue
      userTeams.push({ teamid: teamId, name: teamNameMap[teamId] ?? teamId, role })
    }

    console.log('[UserContext][Teams] Final userTeams:', JSON.stringify(userTeams, null, 2))
    sessionStorage.setItem(SESSION_USER_TEAMS_KEY, JSON.stringify(userTeams))
    console.log('[UserContext][Teams] ✓ sessionStorage["userTeams"] set with', userTeams.length, 'teams')

    for (const role of (['Respondent', 'Reviewer', 'Approver'] as TeamRole[])) {
      const accountId      = roleAccountMap[role]
      const accountName    = accountId ? (accountNameMap[accountId] ?? '') : undefined
      const moduleConfigId = roleModuleConfigMap[role]

      if (accountId) {
        sessionStorage.setItem(ROLE_ACCOUNT_SESSION_KEY[role],      accountId)
        sessionStorage.setItem(ROLE_ACCOUNT_NAME_SESSION_KEY[role], accountName ?? '')
        console.log(`[UserContext][Teams] ✓ sessionStorage["${ROLE_ACCOUNT_SESSION_KEY[role]}"] = "${accountId}"`)
        console.log(`[UserContext][Teams] ✓ sessionStorage["${ROLE_ACCOUNT_NAME_SESSION_KEY[role]}"] = "${accountName}"`)
      } else {
        console.log(`[UserContext][Teams] No account for role "${role}" — account keys not set`)
      }

      if (moduleConfigId) {
        sessionStorage.setItem(ROLE_MODULE_CONFIG_SESSION_KEY[role], moduleConfigId)
        console.log(`[UserContext][Teams] ✓ sessionStorage["${ROLE_MODULE_CONFIG_SESSION_KEY[role]}"] = "${moduleConfigId}"`)
      } else {
        console.log(`[UserContext][Teams] No module config ID for role "${role}" — key not set`)
      }
    }
  } catch (err) {
    console.error('[UserContext][Teams] Dga_module_configurationsService.getAll() FAILED:', err)
  }

  console.log('[UserContext][Teams] ── fetchUserTeamsAndAccounts COMPLETE ──')
}

export interface AppUserContext {
  // From Power Apps getContext()
  appId: string
  environmentId: string
  queryParams: Record<string, string>
  fullName: string
  objectId: string
  tenantId: string
  userPrincipalName: string
  sessionId: string
  // From Dataverse systemuser record
  systemUserId: string
  domainName: string
  internalEmail: string
  jobTitle: string
  businessUnitId: string
  businessUnitName: string
  organizationId: string
  organizationName: string
}

export async function initUserContext(): Promise<void> {
  console.log('[UserContext] Initializing user context...')
  try {
    const ctx = await getContext()
    console.log('[UserContext] getContext() raw response:', ctx)

    const objectId = ctx.user.objectId ?? ''
    console.log('[UserContext] userId (objectId from AAD):', objectId)

    // Base context from Power Apps runtime
    const userContext: AppUserContext = {
      appId:             ctx.app.appId             ?? '',
      environmentId:     ctx.app.environmentId     ?? '',
      queryParams:       ctx.app.queryParams        ?? {},
      fullName:          ctx.user.fullName          ?? '',
      objectId,
      tenantId:          ctx.user.tenantId          ?? '',
      userPrincipalName: ctx.user.userPrincipalName ?? '',
      sessionId:         ctx.host.sessionId         ?? '',
      systemUserId:      '',
      domainName:        '',
      internalEmail:     '',
      jobTitle:          '',
      businessUnitId:    '',
      businessUnitName:  '',
      organizationId:    '',
      organizationName:  '',
    }

    // Fetch the Dataverse systemuser record using the AAD objectId
    if (objectId) {
      console.log('[UserContext] Fetching Dataverse systemuser record for objectId:', objectId)
      try {
        const result = await SystemusersService.getAll({
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

        console.log('[UserContext] SystemusersService.getAll() raw result:', result)

        if (result.success && result.data && result.data.length > 0) {
          const su = result.data[0]
          console.log('[UserContext] systemuser record found:', su)
          console.log('[UserContext] systemuserid:', su.systemuserid)
          console.log('[UserContext] fullname:', su.fullname)
          console.log('[UserContext] domainname:', su.domainname)
          console.log('[UserContext] internalemailaddress:', su.internalemailaddress)
          console.log('[UserContext] jobtitle:', su.jobtitle)
          console.log('[UserContext] organizationid:', su.organizationid)
          console.log('[UserContext] organizationidname:', su.organizationidname)
          console.log('[UserContext] _businessunitid_value:', su._businessunitid_value)
          console.log('[UserContext] businessunitidname:', su.businessunitidname)

          userContext.systemUserId     = su.systemuserid          ?? ''
          userContext.domainName       = su.domainname            ?? ''
          userContext.internalEmail    = su.internalemailaddress  ?? ''
          userContext.jobTitle         = su.jobtitle              ?? ''
          userContext.businessUnitId   = su._businessunitid_value ?? ''
          userContext.businessUnitName = su.businessunitidname    ?? ''
          userContext.organizationId   = su.organizationid        ?? ''
          userContext.organizationName = su.organizationidname    ?? ''
        } else {
          console.warn('[UserContext] No systemuser record found for objectId:', objectId, '| result:', result)
        }
      } catch (suErr) {
        console.error('[UserContext] Failed to fetch systemuser record:', suErr)
      }
    }

    sessionStorage.setItem(SESSION_USER_KEY, JSON.stringify(userContext))
    console.log('[UserContext] Stored in sessionStorage →', SESSION_USER_KEY, ':', userContext)

    // Fetch teams and role-based accounts before the app renders
    console.log('[UserContext] systemUserId before team fetch:', JSON.stringify(userContext.systemUserId))
    if (userContext.systemUserId) {
      console.log('[UserContext] systemUserId is populated — calling fetchUserTeamsAndAccounts')
      await fetchUserTeamsAndAccounts(userContext.systemUserId)
    } else {
      console.error('[UserContext] systemUserId is EMPTY — fetchUserTeamsAndAccounts will NOT run. Check the systemuser lookup above.')
    }
  } catch (err) {
    console.error('[UserContext] getContext() failed:', err)
    console.warn('[UserContext] sessionStorage key "' + SESSION_USER_KEY + '" will not be set — expected in local dev outside Power Apps runtime.')
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
