import React, { createContext, useContext, useState } from 'react'
import type { Role } from '@/data/db'

interface RoleContextType {
  activeRole: Role
  setActiveRole: (role: Role) => void
}

const RoleContext = createContext<RoleContextType>({
  activeRole: 'Respondent',
  setActiveRole: () => {},
})

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [activeRole, setActiveRole] = useState<Role>('Respondent')
  return (
    <RoleContext.Provider value={{ activeRole, setActiveRole }}>
      {children}
    </RoleContext.Provider>
  )
}

export function useRole() {
  return useContext(RoleContext)
}
