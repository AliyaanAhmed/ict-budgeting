import React, { createContext, useContext, useEffect, useState } from 'react'
import type { Role } from '@/data/db'
import type { UserTeam } from '@/services/userContextService'
import { SESSION_USER_TEAMS_KEY } from '@/services/userContextService'
import {
  getStoredCurrentSme,
  getStoredSmeAssignments,
  getStoredStrategyTeam,
  setStoredCurrentSme,
  type DgeSmeAssignment,
} from '@/services/dgeRoleContextService'
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

const ADGE_ROLES: Role[] = ['Respondent', 'Reviewer', 'Approver']

function parseStoredRoleDisplay(value: string | null): Role | null {
  const normalized = value?.trim() || ''
  if (normalized === 'ICT - Respondent') return 'Respondent'
  if (normalized === 'ICT - Reviewer') return 'Reviewer'
  if (normalized === 'ICT - Approver') return 'Approver'
  if (normalized === 'ICT Admin') return 'ICT Admin'
  if (normalized === 'ICT - Strategy Team') return 'ICT - Strategy Team'
  if (normalized === 'ICT - SME Team') return 'ICT - SME Team'
  return null
}

export interface RoleOption {
  key: string
  role: Role
  label: string
  subtitle?: string
  smeAssignment?: DgeSmeAssignment
}

interface RoleContextType {
  activeRole: Role | null
  activeRoleOptionKey: string | null
  setActiveRole: (role: Role) => void
  setActiveRoleOption: (optionKey: string) => void
  availableRoles: Role[]
  availableRoleOptions: RoleOption[]
  hasAnyRole: boolean
  rolesResolved: boolean
}

const RoleContext = createContext<RoleContextType>({
  activeRole: null,
  activeRoleOptionKey: null,
  setActiveRole: () => {},
  setActiveRoleOption: () => {},
  availableRoles: [],
  availableRoleOptions: [],
  hasAnyRole: false,
  rolesResolved: false,
})

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [activeRole, setActiveRoleState] = useState<Role | null>(() =>
    parseStoredRoleDisplay(sessionStorage.getItem(SESSION_CURRENT_ROLE_KEY))
  )
  const [activeRoleOptionKey, setActiveRoleOptionKey] = useState<string | null>(null)
  const [availableRoles, setAvailableRoles] = useState<Role[]>([])
  const [availableRoleOptions, setAvailableRoleOptions] = useState<RoleOption[]>([])
  const [rolesResolved, setRolesResolved] = useState(false)

  useEffect(() => {
    let cancelled = false

    const syncAvailableRoles = async () => {
      const raw = sessionStorage.getItem(SESSION_USER_TEAMS_KEY)
      let resolvedAdgeRoles: Role[] = []
      const resolvedRoleOptions: RoleOption[] = []

      if (raw) {
        try {
          const teams: UserTeam[] = JSON.parse(raw)
          const teamRoles = teams
            .map((team) => team.role as Role)
            .filter((role) => (ADGE_ROLES as string[]).includes(role))

          if (teamRoles.length > 0) {
            resolvedAdgeRoles = [...new Set(teamRoles)]
          }
        } catch {
        }
      }

      for (const role of resolvedAdgeRoles) {
        resolvedRoleOptions.push({
          key: role,
          role,
          label: ROLE_DISPLAY_NAME[role],
        })
      }

      const currentUserId = sessionStorage.getItem('userID')?.trim() || ''
      const strategyTeam = getStoredStrategyTeam()
      if (strategyTeam?.users.some((user) => user.id === currentUserId)) {
        resolvedRoleOptions.push({
          key: 'strategy-team',
          role: 'ICT - Strategy Team',
          label: 'ICT - Strategy Team',
          subtitle: 'Cross-entity governance',
        })
      }

      const smeAssignments = getStoredSmeAssignments().filter((assignment) =>
        assignment.users.some((user) => user.id === currentUserId)
      )

      for (const assignment of smeAssignments) {
        resolvedRoleOptions.push({
          key: `sme:${assignment.strategicPriorityId}`,
          role: 'ICT - SME Team',
          label: 'ICT - SME Team',
          subtitle: assignment.strategicPriorityName,
          smeAssignment: assignment,
        })
      }

      try {
        const isSystemAdmin = await currentUserHasSystemAdministratorRole()
        if (isSystemAdmin) {
          resolvedRoleOptions.push({
            key: 'ICT Admin',
            role: 'ICT Admin',
            label: 'ICT Admin',
          })
        }
      } catch (error) {
        console.error('[RoleContext] Failed to determine System Administrator access:', error)
      }

      const uniqueRoles = [...new Set(resolvedRoleOptions.map((option) => option.role))]
      const storedRoleDisplay = sessionStorage.getItem(SESSION_CURRENT_ROLE_KEY)?.trim() || ''
      const storedCurrentSme = getStoredCurrentSme()
      const preferredOption =
        (storedRoleDisplay === ROLE_DISPLAY_NAME['ICT - SME Team'] && storedCurrentSme
          ? resolvedRoleOptions.find(
              (option) =>
                option.role === 'ICT - SME Team' &&
                option.smeAssignment?.strategicPriorityId === storedCurrentSme.strategicPriorityId
            )
          : null) ??
        resolvedRoleOptions.find((option) => option.label === storedRoleDisplay) ??
        resolvedRoleOptions[0] ??
        null

      if (!cancelled) {
        setAvailableRoles(uniqueRoles)
        setAvailableRoleOptions(resolvedRoleOptions)

        if (preferredOption) {
          setActiveRoleState(preferredOption.role)
          setActiveRoleOptionKey(preferredOption.key)
          sessionStorage.setItem(SESSION_CURRENT_ROLE_KEY, ROLE_DISPLAY_NAME[preferredOption.role])
          if (preferredOption.role === 'ICT - SME Team') {
            setStoredCurrentSme(preferredOption.smeAssignment ?? null)
          }
        } else {
          setActiveRoleState(null)
          setActiveRoleOptionKey(null)
          sessionStorage.removeItem(SESSION_CURRENT_ROLE_KEY)
          setStoredCurrentSme(null)
        }

        setRolesResolved(true)
      }
    }

    void syncAvailableRoles()

    return () => {
      cancelled = true
    }
  }, [])

  const setActiveRole = (role: Role) => {
    const matchingOption =
      availableRoleOptions.find((option) => option.role === role) ??
      availableRoleOptions[0] ?? {
        key: role,
        role,
        label: ROLE_DISPLAY_NAME[role],
      }

    setActiveRoleState(role)
    setActiveRoleOptionKey(matchingOption.key)
    sessionStorage.setItem(SESSION_CURRENT_ROLE_KEY, ROLE_DISPLAY_NAME[role])
    if (role === 'ICT - SME Team') {
      setStoredCurrentSme(matchingOption.smeAssignment ?? null)
    }
  }

  const setActiveRoleOption = (optionKey: string) => {
    const option = availableRoleOptions.find((item) => item.key === optionKey)
    if (!option) return

    setActiveRoleState(option.role)
    setActiveRoleOptionKey(option.key)
    sessionStorage.setItem(SESSION_CURRENT_ROLE_KEY, ROLE_DISPLAY_NAME[option.role])
    if (option.role === 'ICT - SME Team') {
      setStoredCurrentSme(option.smeAssignment ?? null)
    }
  }

  return (
    <RoleContext.Provider
      value={{
        activeRole,
        activeRoleOptionKey,
        setActiveRole,
        setActiveRoleOption,
        availableRoles,
        availableRoleOptions,
        hasAnyRole: availableRoleOptions.length > 0,
        rolesResolved,
      }}
    >
      {children}
    </RoleContext.Provider>
  )
}

export function useRole() {
  return useContext(RoleContext)
}
