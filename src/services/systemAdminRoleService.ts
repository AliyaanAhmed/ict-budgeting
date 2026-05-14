import { RolesService } from '@/generated/services/RolesService'
import { SystemuserrolescollectionService } from '@/generated/services/SystemuserrolescollectionService'
import { SESSION_USER_ID_KEY } from '@/services/userContextService'

function normalizeRoleName(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? ''
}

export async function userHasSystemAdministratorRole(userId: string) {
  console.log('[SystemAdminRoleService] Checking System Administrator role for user:', userId)
  const relationshipOptions = {
    select: ['systemuserroleid', 'systemuserid', 'roleid'],
    filter: `systemuserid eq ${userId}`,
  }
  console.log('[SystemAdminRoleService] Relationship request options:', relationshipOptions)

  const relationshipResult = await SystemuserrolescollectionService.getAll(relationshipOptions)
  console.log('[SystemAdminRoleService] Relationship raw result:', relationshipResult)

  if (!relationshipResult.success) {
    console.error('[SystemAdminRoleService] Relationship lookup failed:', relationshipResult.error)
    throw new Error(
      relationshipResult.error?.message?.trim() || 'Failed to retrieve system user role links.'
    )
  }

  const roleIds = [...new Set((relationshipResult.data ?? []).map((item) => item.roleid).filter(Boolean))]
  console.log('[SystemAdminRoleService] Role ids from relationship table:', roleIds)

  if (!roleIds.length) {
    console.log('[SystemAdminRoleService] No related role ids found for user.')
    return false
  }

  const roleFilter = roleIds.map((roleId) => `roleid eq ${roleId}`).join(' or ')
  const roleOptions = {
    select: ['roleid', 'name'],
    filter: roleFilter,
  }
  console.log('[SystemAdminRoleService] Role request options:', roleOptions)

  const roleResult = await RolesService.getAll(roleOptions)
  console.log('[SystemAdminRoleService] Role raw result:', roleResult)

  if (!roleResult.success) {
    console.error('[SystemAdminRoleService] Role detail lookup failed:', roleResult.error)
    throw new Error(roleResult.error?.message?.trim() || 'Failed to retrieve role details.')
  }

  const rawRoles = (roleResult.data ?? []).map((role) => ({
    roleid: role.roleid,
    name: role.name,
  }))
  console.log('[SystemAdminRoleService] Resolved roles:', rawRoles)

  const hasRole = rawRoles.some((role) => normalizeRoleName(role.name) === 'system administrator')
  console.log('[SystemAdminRoleService] Has System Administrator role:', hasRole)
  return hasRole
}

export async function currentUserHasSystemAdministratorRole() {
  const userId = sessionStorage.getItem(SESSION_USER_ID_KEY)?.trim()
  console.log('[SystemAdminRoleService] sessionStorage userID:', userId ?? null)
  if (!userId) return false
  return userHasSystemAdministratorRole(userId)
}
