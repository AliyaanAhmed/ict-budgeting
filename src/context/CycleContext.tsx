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
  cyclesResolved: boolean
  hasCycles: boolean
}

const CycleContext = createContext<CycleContextType>({
  cyclesData: null,
  selectedCycle: null,
  setSelectedCycle: () => {},
  cyclesResolved: false,
  hasCycles: false,
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
    <CycleContext.Provider value={{ cyclesData, selectedCycle, setSelectedCycle, cyclesResolved, hasCycles: Boolean(cyclesData?.allCycles.length) }}>
      {children}
    </CycleContext.Provider>
  )
}

export function useCycle() {
  return useContext(CycleContext)
}
