import React, { createContext, useContext, useEffect, useState } from 'react'
import type { AppInstanceDetail } from '@/services/instanceService'
import {
  SESSION_INSTANCE_DETAIL_KEY,
  SESSION_INSTANCE_ID_KEY,
  fetchAndStoreInstance,
  getAccountIdForRole,
  getStoredInstanceDetail,
  getStoredInstanceId,
} from '@/services/instanceService'
import { useCycle } from '@/context/CycleContext'
import { useRole } from '@/context/RoleContext'

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

  useEffect(() => {
    if (!selectedCycle?.id || !activeRole) return

    if (activeRole === 'ICT - Strategy Team' || activeRole === 'ICT - SME Team' || activeRole === 'ICT Admin') {
      sessionStorage.removeItem(SESSION_INSTANCE_ID_KEY)
      sessionStorage.removeItem(SESSION_INSTANCE_DETAIL_KEY)
      setInstanceId(null)
      setInstanceDetail(null)
      setInstanceLoading(false)
      return
    }

    const accountId = getAccountIdForRole(activeRole)
    if (!accountId) {
      sessionStorage.removeItem(SESSION_INSTANCE_ID_KEY)
      sessionStorage.removeItem(SESSION_INSTANCE_DETAIL_KEY)
      setInstanceId(null)
      setInstanceDetail(null)
      setInstanceLoading(false)
      return
    }

    setInstanceLoading(true)

    void fetchAndStoreInstance(selectedCycle.id, accountId).then((detail) => {
      setInstanceId(detail?.id ?? null)
      setInstanceDetail(detail)
      setInstanceLoading(false)
    }).catch(() => {
      sessionStorage.removeItem(SESSION_INSTANCE_ID_KEY)
      sessionStorage.removeItem(SESSION_INSTANCE_DETAIL_KEY)
      setInstanceId(null)
      setInstanceDetail(null)
      setInstanceLoading(false)
    })
  }, [activeRole, selectedCycle?.id])

  return (
    <InstanceContext.Provider value={{ instanceId, instanceDetail, instanceLoading }}>
      {children}
    </InstanceContext.Provider>
  )
}

export function useInstance() {
  return useContext(InstanceContext)
}
