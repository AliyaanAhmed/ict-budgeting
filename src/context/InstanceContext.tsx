import React, { createContext, useContext, useEffect, useRef, useState } from 'react'
import type { AppInstanceDetail } from '@/services/instanceService'
import {
  fetchAndStoreInstance,
  getAccountIdForRole,
  getStoredInstanceDetail,
  getStoredInstanceId,
} from '@/services/instanceService'
import { useRole } from '@/context/RoleContext'
import { useCycle } from '@/context/CycleContext'

interface InstanceContextType {
  instanceId: string | null
  instanceDetail: AppInstanceDetail | null
  instanceLoading: boolean
}

const InstanceContext = createContext<InstanceContextType>({
  instanceId: null,
  instanceDetail: null,
  instanceLoading: false,
})

export function InstanceProvider({ children }: { children: React.ReactNode }) {
  const [instanceId, setInstanceId] = useState<string | null>(null)
  const [instanceDetail, setInstanceDetail] = useState<AppInstanceDetail | null>(null)
  const [instanceLoading, setInstanceLoading] = useState(false)

  const { activeRole } = useRole()
  const { selectedCycle } = useCycle()

  useEffect(() => {
    setInstanceId(getStoredInstanceId())
    setInstanceDetail(getStoredInstanceDetail())
  }, [])

  const isFirstFetch = useRef(true)

  useEffect(() => {
    if (!selectedCycle?.id || !activeRole) return

    if (activeRole !== 'Respondent' && activeRole !== 'Reviewer' && activeRole !== 'Approver') {
      setInstanceId(null)
      setInstanceDetail(null)
      setInstanceLoading(false)
      return
    }

    const accountId = getAccountIdForRole(activeRole)
    if (!accountId) {
      setInstanceId(null)
      setInstanceDetail(null)
      setInstanceLoading(false)
      console.warn('[InstanceContext] No account ID for role', activeRole, '- cannot fetch instance')
      return
    }

    const isFirst = isFirstFetch.current
    isFirstFetch.current = false

    if (!isFirst) setInstanceLoading(true)

    void fetchAndStoreInstance(selectedCycle.id, accountId).then((detail) => {
      setInstanceId(detail?.id ?? null)
      setInstanceDetail(detail)
      if (!isFirst) setInstanceLoading(false)
    })
  }, [activeRole, selectedCycle?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <InstanceContext.Provider value={{ instanceId, instanceDetail, instanceLoading }}>
      {children}
    </InstanceContext.Provider>
  )
}

export function useInstance() {
  return useContext(InstanceContext)
}
