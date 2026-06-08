import { Dga_cyclesService } from '@/generated/services/Dga_cyclesService'

export const SESSION_CYCLES_KEY = 'cycles'
export const SESSION_CURRENT_CYCLE_KEY = 'currentCycle'

export interface AppCycle {
  id: string
  name: string
  startDate: string
  endDate: string
}

export interface CyclesSessionData {
  allCycles: AppCycle[]
  currentCycle: AppCycle | null
  previousCycle: AppCycle | null
}

function classifyCycles(cycles: AppCycle[]): {
  currentCycle: AppCycle | null
  previousCycle: AppCycle | null
} {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const currentCycle =
    cycles.find((c) => {
      const start = new Date(c.startDate)
      const end = new Date(c.endDate)
      start.setHours(0, 0, 0, 0)
      end.setHours(23, 59, 59, 999)
      return today >= start && today <= end
    }) ?? null

  const previousCycle =
    cycles
      .filter((c) => {
        const end = new Date(c.endDate)
        end.setHours(23, 59, 59, 999)
        return end < today
      })
      .sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime())[0] ?? null

  return { currentCycle, previousCycle }
}

export async function initCycleContext(): Promise<void> {
  try {
    const cycleResult = await Dga_cyclesService.getAll({
      select: [
        'dga_cycleid',
        'dga_name',
        '_dga_module_type_value',
        'dga_planned_start_date',
        'dga_planned_end_date',
      ],
    })

    if (!cycleResult.success || !cycleResult.data?.length) {
      return
    }

    let cycles = cycleResult.data
    const ictCycles = cycles.filter((c) => {
      const typeName =
        ((c as unknown as Record<string, unknown>)['dga_module_typename'] as string) ?? ''
      return typeName.toLowerCase().includes('ict')
    })

    if (ictCycles.length > 0) {
      cycles = ictCycles
    }

    const allCycles: AppCycle[] = cycles
      .filter(
        (c) =>
          c.dga_cycleid && c.dga_name && c.dga_planned_start_date && c.dga_planned_end_date
      )
      .map((c) => ({
        id: c.dga_cycleid,
        name: c.dga_name,
        startDate: c.dga_planned_start_date,
        endDate: c.dga_planned_end_date,
      }))

    if (!allCycles.length) {
      return
    }

    const { currentCycle, previousCycle } = classifyCycles(allCycles)

    const sessionData: CyclesSessionData = { allCycles, currentCycle, previousCycle }
    sessionStorage.setItem(SESSION_CYCLES_KEY, JSON.stringify(sessionData))

    const defaultCycle = currentCycle ?? allCycles[0]
    sessionStorage.setItem(SESSION_CURRENT_CYCLE_KEY, JSON.stringify(defaultCycle))
  } catch {
    return
  }
}

export function getStoredCycles(): CyclesSessionData | null {
  const raw = sessionStorage.getItem(SESSION_CYCLES_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as CyclesSessionData
  } catch {
    return null
  }
}

export function getStoredCurrentCycle(): AppCycle | null {
  const raw = sessionStorage.getItem(SESSION_CURRENT_CYCLE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as AppCycle
  } catch {
    return null
  }
}
