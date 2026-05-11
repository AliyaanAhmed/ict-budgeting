import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import type { AppInstanceDetail } from '@/services/instanceService'
import {
  getStoredInstanceId,
  getStoredInstanceDetail,
  getAccountIdForRole,
  fetchAndStoreInstance,
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
  const [instanceId, setInstanceId]         = useState<string | null>(null)
  const [instanceDetail, setInstanceDetail] = useState<AppInstanceDetail | null>(null)
  const [instanceLoading, setInstanceLoading] = useState(false)

  const { activeRole }    = useRole()
  const { selectedCycle } = useCycle()

  // Seed from sessionStorage on first mount (set by initInstanceContext() in main.tsx)
  useEffect(() => {
    setInstanceId(getStoredInstanceId())
    setInstanceDetail(getStoredInstanceDetail())
  }, [])

  // Track whether this is the initial effect fire so we skip the loading indicator
  // on first mount (sessionStorage already has fresh data from the boot sequence).
  const isFirstFetch = useRef(true)

  // Re-fetch whenever the active role or selected cycle changes
  useEffect(() => {
    if (!selectedCycle?.id) return

    const accountId = getAccountIdForRole(activeRole)
    if (!accountId) {
      console.warn('[InstanceContext] No account ID for role', activeRole, '— cannot fetch instance')
      return
    }

    const isFirst = isFirstFetch.current
    isFirstFetch.current = false

    // On first mount the boot sequence already fetched the instance, so we
    // silently refresh without showing a loading state to avoid a skeleton flash.
    if (!isFirst) setInstanceLoading(true)

    void fetchAndStoreInstance(selectedCycle.id, accountId).then(detail => {
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
