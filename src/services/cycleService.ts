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

function classifyCycles(cycles: AppCycle[]): { currentCycle: AppCycle | null; previousCycle: AppCycle | null } {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const currentCycle =
    cycles.find(c => {
      const start = new Date(c.startDate)
      const end = new Date(c.endDate)
      start.setHours(0, 0, 0, 0)
      end.setHours(23, 59, 59, 999)
      return today >= start && today <= end
    }) ?? null

  const previousCycle =
    cycles
      .filter(c => {
        const end = new Date(c.endDate)
        end.setHours(23, 59, 59, 999)
        return end < today
      })
      .sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime())[0] ?? null

  return { currentCycle, previousCycle }
}

export async function initCycleContext(): Promise<void> {
  console.log('[CycleService] ── initCycleContext ENTERED ──')
  try {
    // Fetch all ICT cycles directly — dga_module_types is NOT registered in
    // dataSourcesInfo so we skip the two-step module-type lookup.
    // dga_module_typename (the Dataverse formatted lookup value) is returned
    // automatically when we select _dga_module_type_value, so we can filter
    // client-side for ICT Budgeting cycles.
    console.log('[CycleService] Fetching cycles from dga_cycles...')
    const cycleResult = await Dga_cyclesService.getAll({
      select: [
        'dga_cycleid',
        'dga_name',
        '_dga_module_type_value',
        'dga_planned_start_date',
        'dga_planned_end_date',
      ],
    })
    console.log('[CycleService] Dga_cyclesService.getAll() result:', cycleResult)

    if (!cycleResult.success) {
      console.error('[CycleService] Cycle fetch returned success=false:', cycleResult)
      return
    }

    if (!cycleResult.data?.length) {
      console.warn('[CycleService] No cycle records returned from Dataverse')
      return
    }

    // Filter client-side: keep only ICT Budgeting cycles using the formatted
    // lookup name that Dataverse includes with the lookup ID field.
    let cycles = cycleResult.data
    const ictCycles = cycles.filter(c => {
      const typeName: string = (c as unknown as Record<string, unknown>)['dga_module_typename'] as string ?? ''
      return typeName.toLowerCase().includes('ict')
    })

    // Use filtered list if it has results, otherwise fall back to all cycles
    if (ictCycles.length > 0) {
      cycles = ictCycles
      console.log('[CycleService] Filtered to', ictCycles.length, 'ICT cycle(s)')
    } else {
      console.log('[CycleService] Module type name filter matched nothing — using all', cycles.length, 'cycle(s)')
    }

    const allCycles: AppCycle[] = cycles
      .filter(c => c.dga_cycleid && c.dga_name && c.dga_planned_start_date && c.dga_planned_end_date)
      .map(c => ({
        id: c.dga_cycleid,
        name: c.dga_name,
        startDate: c.dga_planned_start_date,
        endDate: c.dga_planned_end_date,
      }))

    if (!allCycles.length) {
      console.warn('[CycleService] No valid cycle records after mapping (missing required fields?)')
      return
    }

    console.log('[CycleService] Final cycle list:', allCycles.map(c => c.name))

    const { currentCycle, previousCycle } = classifyCycles(allCycles)
    console.log('[CycleService] Current cycle:', currentCycle?.name ?? 'none')
    console.log('[CycleService] Previous cycle:', previousCycle?.name ?? 'none')

    const sessionData: CyclesSessionData = { allCycles, currentCycle, previousCycle }
    sessionStorage.setItem(SESSION_CYCLES_KEY, JSON.stringify(sessionData))

    // Default selected = current cycle if it exists, otherwise first in list
    const defaultCycle = currentCycle ?? allCycles[0]
    sessionStorage.setItem(SESSION_CURRENT_CYCLE_KEY, JSON.stringify(defaultCycle))

    console.log('[CycleService] ✓ sessionStorage["cycles"] set with', allCycles.length, 'cycle(s)')
    console.log('[CycleService] ✓ sessionStorage["currentCycle"] =', defaultCycle.name)
    console.log('[CycleService] ── initCycleContext COMPLETE ──')
  } catch (err) {
    console.error('[CycleService] initCycleContext THREW an error:', err)
  }
}

export function getStoredCycles(): CyclesSessionData | null {
  const raw = sessionStorage.getItem(SESSION_CYCLES_KEY)
  if (!raw) return null
  try { return JSON.parse(raw) as CyclesSessionData } catch { return null }
}

export function getStoredCurrentCycle(): AppCycle | null {
  const raw = sessionStorage.getItem(SESSION_CURRENT_CYCLE_KEY)
  if (!raw) return null
  try { return JSON.parse(raw) as AppCycle } catch { return null }
}
