import React, { createContext, useContext, useState, useEffect } from 'react'
import type { Role } from '@/data/db'
import type { UserTeam } from '@/services/userContextService'
import { SESSION_USER_TEAMS_KEY } from '@/services/userContextService'
import { currentUserHasSystemAdministratorRole } from '@/services/systemAdminRoleService'

export const SESSION_CURRENT_ROLE_KEY = 'currentRole'

const ROLE_DISPLAY_NAME: Record<Role, string> = {
  Respondent: 'ICT - Respondent',
  Reviewer: 'ICT - Reviewer',
  Approver: 'ICT - Approver',
  'ICT Admin': 'ICT Admin',
  'ICT - Strategy Team': 'ICT - Strategy Team',
  'ICT - SME Team': 'ICT - SME Team',
}

const NON_ADMIN_ROLES: Role[] = ['Respondent', 'Reviewer', 'Approver']
const STATIC_ROLES: Role[] = [...NON_ADMIN_ROLES, 'ICT - Strategy Team', 'ICT - SME Team']

interface RoleContextType {
  activeRole: Role
  setActiveRole: (role: Role) => void
  availableRoles: Role[]
}

const RoleContext = createContext<RoleContextType>({
  activeRole: 'Respondent',
  setActiveRole: () => {},
  availableRoles: STATIC_ROLES,
})

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [activeRole, setActiveRoleState] = useState<Role>('Respondent')
  const [availableRoles, setAvailableRoles] = useState<Role[]>(STATIC_ROLES)

  useEffect(() => {
    let cancelled = false

    const syncAvailableRoles = async () => {
      const raw = sessionStorage.getItem(SESSION_USER_TEAMS_KEY)
      let resolvedRoles: Role[] = STATIC_ROLES

      if (raw) {
        try {
          const teams: UserTeam[] = JSON.parse(raw)
          const teamRoles = teams
            .map((t) => t.role as Role)
            .filter((r) => (STATIC_ROLES as string[]).includes(r))

          if (teamRoles.length > 0) {
            resolvedRoles = [...new Set(teamRoles)]
            if (!cancelled) {
              setActiveRoleState(teamRoles[0])
              sessionStorage.setItem(SESSION_CURRENT_ROLE_KEY, ROLE_DISPLAY_NAME[teamRoles[0]])
            }
          } else if (!cancelled) {
            sessionStorage.setItem(SESSION_CURRENT_ROLE_KEY, ROLE_DISPLAY_NAME['Respondent'])
          }
        } catch {
          if (!cancelled) {
            sessionStorage.setItem(SESSION_CURRENT_ROLE_KEY, ROLE_DISPLAY_NAME['Respondent'])
          }
        }
      } else if (!cancelled) {
        sessionStorage.setItem(SESSION_CURRENT_ROLE_KEY, ROLE_DISPLAY_NAME['Respondent'])
      }

      try {
        const isSystemAdmin = await currentUserHasSystemAdministratorRole()
        if (isSystemAdmin) {
          resolvedRoles = [...new Set([...resolvedRoles, 'ICT Admin' as Role])]
        }
      } catch (error) {
        console.error('[RoleContext] Failed to determine System Administrator access:', error)
      }

      if (!resolvedRoles.includes('ICT - Strategy Team')) {
        resolvedRoles = [...new Set([...resolvedRoles, 'ICT - Strategy Team' as Role])] as Role[]
      }

      if (!resolvedRoles.includes('ICT - SME Team')) {
        resolvedRoles = [...new Set([...resolvedRoles, 'ICT - SME Team' as Role])] as Role[]
      }

      if (!cancelled) {
        setAvailableRoles(resolvedRoles)
      }
    }

    void syncAvailableRoles()

    return () => {
      cancelled = true
    }
  }, [])

  const setActiveRole = (role: Role) => {
    setActiveRoleState(role)
    sessionStorage.setItem(SESSION_CURRENT_ROLE_KEY, ROLE_DISPLAY_NAME[role])
  }

  return (
    <RoleContext.Provider value={{ activeRole, setActiveRole, availableRoles }}>
      {children}
    </RoleContext.Provider>
  )
}

export function useRole() {
  return useContext(RoleContext)
}
