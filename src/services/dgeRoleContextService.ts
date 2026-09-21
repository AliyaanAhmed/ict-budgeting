import { Dga_strategic_prioritiesesService } from '@/generated/services/Dga_strategic_prioritiesesService'
import { Dga_module_configurationsService } from '@/generated/services/Dga_module_configurationsService'
import { SystemusersService } from '@/generated/services/SystemusersService'
import { TeammembershipsService } from '@/generated/services/TeammembershipsService'
import { TeamsService } from '@/generated/services/TeamsService'
import {
  SESSION_MODULE_CONFIG_TEAM_IDS_KEY,
  SESSION_MODULE_TYPE_ID_KEY,
  type ModuleConfigTeamIds,
} from '@/services/userContextService'

export const SESSION_DGE_SME_ASSIGNMENTS_KEY = 'dgeSmeAssignments'
export const SESSION_DGE_STRATEGY_TEAM_KEY = 'dgeStrategyTeam'
export const SESSION_DGE_STRATEGY_DIRECTOR_TEAM_KEY = 'dgeStrategyDirectorTeam'
export const SESSION_CURRENT_SME_KEY = 'currentSME'

export interface DgeRoleUser {
  id: string
  fullName: string
  email: string
}

export interface DgeSmeAssignment {
  strategicPriorityId: string
  strategicPriorityName: string
  teamId: string
  teamName: string
  users: DgeRoleUser[]
}

export interface DgeStrategyTeamConfig {
  teamId: string
  teamName: string
  users: DgeRoleUser[]
}

export type DgeTeamConfig = DgeStrategyTeamConfig

function setSessionJson(key: string, value: unknown) {
  sessionStorage.setItem(key, JSON.stringify(value))
}

function parseSessionJson<T>(key: string): T | null {
  const raw = sessionStorage.getItem(key)
  if (!raw) return null

  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

function getStoredModuleConfigTeamIds(): ModuleConfigTeamIds {
  const parsed = parseSessionJson<Partial<ModuleConfigTeamIds>>(SESSION_MODULE_CONFIG_TEAM_IDS_KEY)
  return {
    respondentTeamId: parsed?.respondentTeamId ?? null,
    reviewerTeamId: parsed?.reviewerTeamId ?? null,
    approverTeamId: parsed?.approverTeamId ?? null,
    strategyTeamId: parsed?.strategyTeamId ?? null,
  }
}

async function seedAdgeModuleConfigTeamIdsForDgeUsers() {
  const current = getStoredModuleConfigTeamIds()
  const hasAdgeTeams = Boolean(
    current.respondentTeamId?.trim() ||
      current.reviewerTeamId?.trim() ||
      current.approverTeamId?.trim()
  )

  if (hasAdgeTeams) {
    return
  }

  const moduleTypeId = sessionStorage.getItem(SESSION_MODULE_TYPE_ID_KEY)?.trim() || ''
  if (!moduleTypeId) {
    return
  }

  try {
    const result = await Dga_module_configurationsService.getAll({
      select: [
        'dga_module_configurationid',
        '_dga_respondent_team_value',
        '_dga_reviewer_team_value',
        '_dga_approver_team_value',
      ],
      filter: `_dga_module_type_value eq ${moduleTypeId}`,
      orderBy: ['dga_module_configurationid asc'],
      top: 1,
    })

    const record = result.data?.[0]
    if (!record) {
      return
    }

    const nextValue: ModuleConfigTeamIds = {
      respondentTeamId: record._dga_respondent_team_value ?? null,
      reviewerTeamId: record._dga_reviewer_team_value ?? null,
      approverTeamId: record._dga_approver_team_value ?? null,
      strategyTeamId: current.strategyTeamId ?? null,
    }

    sessionStorage.setItem(SESSION_MODULE_CONFIG_TEAM_IDS_KEY, JSON.stringify(nextValue))

    console.log('[DgeRoleContextService] Seeded ADGE moduleConfigTeamIDs for DGE user:', {
      moduleTypeId,
      nextValue,
    })
  } catch (error) {
    console.warn('[DgeRoleContextService] Failed to seed ADGE moduleConfigTeamIDs for DGE user:', error)
  }
}

async function getTeamNamesByIds(teamIds: string[]): Promise<Map<string, string>> {
  const result = new Map<string, string>()
  const uniqueTeamIds = [...new Set(teamIds.filter(Boolean))]

  if (!uniqueTeamIds.length) {
    return result
  }

  const teamFilter = uniqueTeamIds.map((teamId) => `teamid eq ${teamId}`).join(' or ')
  const teamsResult = await TeamsService.getAll({
    select: ['teamid', 'name'],
    filter: teamFilter,
  })

  for (const team of teamsResult.data ?? []) {
    if (team.teamid) {
      result.set(team.teamid, team.name ?? 'SME Team')
    }
  }

  return result
}

async function getUsersForTeamIds(teamIds: string[]): Promise<Map<string, DgeRoleUser[]>> {
  const result = new Map<string, DgeRoleUser[]>()
  const uniqueTeamIds = [...new Set(teamIds.filter(Boolean))]

  if (!uniqueTeamIds.length) {
    return result
  }

  const membershipFilter = uniqueTeamIds.map((teamId) => `teamid eq ${teamId}`).join(' or ')
  const memberships = await TeammembershipsService.getAll({
    select: ['teamid', 'systemuserid'],
    filter: membershipFilter,
  })

  const membershipRows = memberships.data ?? []
  const userIds = [...new Set(membershipRows.map((item) => item.systemuserid).filter(Boolean))]
  const userMap = new Map<string, DgeRoleUser>()

  for (const userId of userIds) {
    try {
      const userResult = await SystemusersService.get(userId, {
        select: ['systemuserid', 'fullname', 'internalemailaddress'],
      })
      const record = userResult.data
      if (userResult.success && record?.systemuserid) {
        userMap.set(record.systemuserid, {
          id: record.systemuserid,
          fullName: record.fullname ?? 'Unknown user',
          email: record.internalemailaddress ?? '',
        })
      }
    } catch {
    }
  }

  for (const teamId of uniqueTeamIds) {
    const users = membershipRows
      .filter((item) => item.teamid === teamId && item.systemuserid)
      .map((item) => userMap.get(item.systemuserid))
      .filter((item): item is DgeRoleUser => Boolean(item))
    result.set(teamId, users)
  }

  return result
}

async function fetchAndStoreSmeAssignments(): Promise<DgeSmeAssignment[]> {
  try {
    const prioritiesResult = await Dga_strategic_prioritiesesService.getAll({
      select: [
        'dga_strategic_prioritiesid',
        'dga_name',
        '_dga_parent_strategic_priorities_value',
        '_dga_sme_group_value',
      ],
      filter: `_dga_sme_group_value ne null`,
      orderBy: ['dga_name asc'],
    })

    const priorities = (prioritiesResult.data ?? []).filter(
      (item) => item.dga_strategic_prioritiesid && item.dga_name && item._dga_sme_group_value
    )

    const teamIds = priorities.map((item) => item._dga_sme_group_value as string)
    const [usersByTeam, teamNamesById] = await Promise.all([
      getUsersForTeamIds(teamIds),
      getTeamNamesByIds(teamIds),
    ])

    const assignments = priorities.map((item) => ({
      strategicPriorityId: item.dga_strategic_prioritiesid,
      strategicPriorityName: item.dga_name,
      teamId: item._dga_sme_group_value as string,
      teamName: teamNamesById.get(item._dga_sme_group_value as string) ?? item.dga_sme_groupname ?? 'SME Team',
      users: usersByTeam.get(item._dga_sme_group_value as string) ?? [],
    }))

    setSessionJson(SESSION_DGE_SME_ASSIGNMENTS_KEY, assignments)
    return assignments
  } catch {
    setSessionJson(SESSION_DGE_SME_ASSIGNMENTS_KEY, [])
    return []
  }
}

async function fetchAndStoreDgeTeamByName(
  teamName: string,
  sessionKey: string
): Promise<DgeTeamConfig | null> {
  try {
    const teamResult = await TeamsService.getAll({
      select: ['teamid', 'name'],
      filter: `name eq '${teamName.replace(/'/g, "''")}'`,
      top: 1,
    })

    const team = teamResult.data?.[0]
    if (!team?.teamid) {
      sessionStorage.removeItem(sessionKey)
      return null
    }

    const usersByTeam = await getUsersForTeamIds([team.teamid])
    const config: DgeTeamConfig = {
      teamId: team.teamid,
      teamName: team.name ?? teamName,
      users: usersByTeam.get(team.teamid) ?? [],
    }

    setSessionJson(sessionKey, config)
    return config
  } catch {
    sessionStorage.removeItem(sessionKey)
    return null
  }
}

async function fetchAndStoreStrategyTeam(): Promise<DgeTeamConfig | null> {
  return fetchAndStoreDgeTeamByName('ICT - Strategy Team', SESSION_DGE_STRATEGY_TEAM_KEY)
}

async function fetchAndStoreStrategyDirectorTeam(): Promise<DgeTeamConfig | null> {
  return fetchAndStoreDgeTeamByName('ICT - Strategy Director', SESSION_DGE_STRATEGY_DIRECTOR_TEAM_KEY)
}

export async function initDgeRoleContext(currentUserId: string | null): Promise<void> {
  const [smeAssignments] = await Promise.all([
    fetchAndStoreSmeAssignments(),
    fetchAndStoreStrategyTeam(),
    fetchAndStoreStrategyDirectorTeam(),
  ])

  await seedAdgeModuleConfigTeamIdsForDgeUsers()

  if (!currentUserId) {
    sessionStorage.removeItem(SESSION_CURRENT_SME_KEY)
    return
  }

  const currentSme = parseSessionJson<DgeSmeAssignment>(SESSION_CURRENT_SME_KEY)
  const userAssignments = smeAssignments.filter((assignment) =>
    assignment.users.some((user) => user.id === currentUserId)
  )

  if (!userAssignments.length) {
    sessionStorage.removeItem(SESSION_CURRENT_SME_KEY)
    return
  }

  const matchingStored = currentSme
    ? userAssignments.find((assignment) => assignment.strategicPriorityId === currentSme.strategicPriorityId)
    : null

  setSessionJson(SESSION_CURRENT_SME_KEY, matchingStored ?? userAssignments[0])
}

export function getStoredSmeAssignments(): DgeSmeAssignment[] {
  return parseSessionJson<DgeSmeAssignment[]>(SESSION_DGE_SME_ASSIGNMENTS_KEY) ?? []
}

export function getStoredStrategyTeam(): DgeStrategyTeamConfig | null {
  return parseSessionJson<DgeStrategyTeamConfig>(SESSION_DGE_STRATEGY_TEAM_KEY)
}

export function getStoredStrategyDirectorTeam(): DgeTeamConfig | null {
  return parseSessionJson<DgeTeamConfig>(SESSION_DGE_STRATEGY_DIRECTOR_TEAM_KEY)
}

export function getStoredCurrentSme(): DgeSmeAssignment | null {
  return parseSessionJson<DgeSmeAssignment>(SESSION_CURRENT_SME_KEY)
}

export function setStoredCurrentSme(assignment: DgeSmeAssignment | null) {
  if (!assignment) {
    sessionStorage.removeItem(SESSION_CURRENT_SME_KEY)
    return
  }

  setSessionJson(SESSION_CURRENT_SME_KEY, assignment)
}
