import React, { createContext, useContext, useState, useEffect } from 'react'
import type { AppCycle, CyclesSessionData } from '@/services/cycleService'
import {
  getStoredCycles,
  getStoredCurrentCycle,
  SESSION_CURRENT_CYCLE_KEY,
} from '@/services/cycleService'

interface CycleContextType {
  cyclesData: CyclesSessionData | null
  selectedCycle: AppCycle | null
  hasCycles: boolean
  cyclesResolved: boolean
  setSelectedCycle: (cycle: AppCycle) => void
}

const CycleContext = createContext<CycleContextType>({
  cyclesData: null,
  selectedCycle: null,
  hasCycles: false,
  cyclesResolved: false,
  setSelectedCycle: () => {},
})

export function CycleProvider({ children }: { children: React.ReactNode }) {
  const [cyclesData, setCyclesData] = useState<CyclesSessionData | null>(null)
  const [selectedCycle, setSelectedCycleState] = useState<AppCycle | null>(null)
  const [cyclesResolved, setCyclesResolved] = useState(false)

  useEffect(() => {
    setCyclesData(getStoredCycles())
    setSelectedCycleState(getStoredCurrentCycle())
    setCyclesResolved(true)
  }, [])

  const setSelectedCycle = (cycle: AppCycle) => {
    setSelectedCycleState(cycle)
    sessionStorage.setItem(SESSION_CURRENT_CYCLE_KEY, JSON.stringify(cycle))
  }

  return (
    <CycleContext.Provider
      value={{
        cyclesData,
        selectedCycle,
        hasCycles: (cyclesData?.allCycles?.length ?? 0) > 0,
        cyclesResolved,
        setSelectedCycle,
      }}
    >
      {children}
    </CycleContext.Provider>
  )
}

export function useCycle() {
  return useContext(CycleContext)
}
