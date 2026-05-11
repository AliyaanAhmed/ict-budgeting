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
  setSelectedCycle: (cycle: AppCycle) => void
}

const CycleContext = createContext<CycleContextType>({
  cyclesData: null,
  selectedCycle: null,
  setSelectedCycle: () => {},
})

export function CycleProvider({ children }: { children: React.ReactNode }) {
  const [cyclesData, setCyclesData] = useState<CyclesSessionData | null>(null)
  const [selectedCycle, setSelectedCycleState] = useState<AppCycle | null>(null)

  useEffect(() => {
    setCyclesData(getStoredCycles())
    setSelectedCycleState(getStoredCurrentCycle())
  }, [])

  const setSelectedCycle = (cycle: AppCycle) => {
    setSelectedCycleState(cycle)
    sessionStorage.setItem(SESSION_CURRENT_CYCLE_KEY, JSON.stringify(cycle))
  }

  return (
    <CycleContext.Provider value={{ cyclesData, selectedCycle, setSelectedCycle }}>
      {children}
    </CycleContext.Provider>
  )
}

export function useCycle() {
  return useContext(CycleContext)
}
