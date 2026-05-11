import React, { createContext, useContext, useState, useEffect } from 'react'
import type { Role } from '@/data/db'
import type { UserTeam } from '@/services/userContextService'
import { SESSION_USER_TEAMS_KEY } from '@/services/userContextService'

export const SESSION_CURRENT_ROLE_KEY = 'currentRole'

const ROLE_DISPLAY_NAME: Record<Role, string> = {
  Respondent: 'ICT - Respondent',
  Reviewer: 'ICT - Reviewer',
  Approver: 'ICT - Approver',
  'ICT Admin': 'ICT Admin',
}

const ALL_ROLES: Role[] = ['Respondent', 'Reviewer', 'Approver', 'ICT Admin']

interface RoleContextType {
  activeRole: Role
  setActiveRole: (role: Role) => void
  availableRoles: Role[]
}

const RoleContext = createContext<RoleContextType>({
  activeRole: 'Respondent',
  setActiveRole: () => {},
  availableRoles: ALL_ROLES,
})

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [activeRole, setActiveRoleState] = useState<Role>('Respondent')
  const [availableRoles, setAvailableRoles] = useState<Role[]>(ALL_ROLES)

  useEffect(() => {
    const raw = sessionStorage.getItem(SESSION_USER_TEAMS_KEY)
    if (raw) {
      try {
        const teams: UserTeam[] = JSON.parse(raw)
        // Extract roles that exist in the ALL_ROLES list
        const teamRoles = teams
          .map(t => t.role as Role)
          .filter(r => (ALL_ROLES as string[]).includes(r))

        if (teamRoles.length > 0) {
          // Always include ICT Admin alongside team-based roles
          const roles: Role[] = [...new Set([...teamRoles, 'ICT Admin' as Role])]
          setAvailableRoles(roles)
          // Set first team role (not ICT Admin) as the active default
          setActiveRoleState(teamRoles[0])
          sessionStorage.setItem(SESSION_CURRENT_ROLE_KEY, ROLE_DISPLAY_NAME[teamRoles[0]])
        } else {
          // No team memberships found — show all roles as fallback
          sessionStorage.setItem(SESSION_CURRENT_ROLE_KEY, ROLE_DISPLAY_NAME['Respondent'])
        }
      } catch {
        sessionStorage.setItem(SESSION_CURRENT_ROLE_KEY, ROLE_DISPLAY_NAME['Respondent'])
      }
    } else {
      // No teams in storage (local dev or before init) — keep all roles
      sessionStorage.setItem(SESSION_CURRENT_ROLE_KEY, ROLE_DISPLAY_NAME['Respondent'])
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
