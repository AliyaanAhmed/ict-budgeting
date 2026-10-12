import type { CycleRecord, ModuleTypeOption } from '@/domain/cycle'
import { Dga_cyclesService } from '@/generated/services/Dga_cyclesService'
import type { Dga_cycles, Dga_cyclesBase } from '@/generated/models/Dga_cyclesModel'
import { Dga_module_typesService } from '@/generated/services/Dga_module_typesService'
import type { Dga_module_types } from '@/generated/models/Dga_module_typesModel'

const SELECT_FIELDS = [
  'dga_cycleid',
  'dga_name',
  '_dga_module_type_value',
  'dga_planned_end_date',
  'dga_planned_start_date',
  'statuscode',
]

function annotation(record: Dga_cycles, key: string): string | null {
  const v = (record as unknown as Record<string, unknown>)[key]
  return typeof v === 'string' && v.trim() ? v : null
}

function asStr(value: unknown): string | null {
  return typeof value === 'string' && (value as string).trim() ? (value as string) : null
}

function normalizeCycle(record: Dga_cycles): CycleRecord | null {
  const id = asStr(record.dga_cycleid)
  const name = asStr(record.dga_name)
  if (!id || !name) return null

  const statusCode = typeof record.statuscode === 'number' ? record.statuscode : 1

  return {
    id,
    name,
    moduleTypeId: asStr(record._dga_module_type_value),
    moduleTypeLabel: annotation(record, '_dga_module_type_value@OData.Community.Display.V1.FormattedValue'),
    plannedStartDate: record.dga_planned_start_date?.slice(0, 10) ?? null,
    plannedEndDate: record.dga_planned_end_date?.slice(0, 10) ?? null,
    plannedStartDateFormatted: annotation(record, 'dga_planned_start_date@OData.Community.Display.V1.FormattedValue'),
    plannedEndDateFormatted: annotation(record, 'dga_planned_end_date@OData.Community.Display.V1.FormattedValue'),
    statusCode,
    statusLabel: annotation(record, 'statuscode@OData.Community.Display.V1.FormattedValue') ?? asStr(record.statuscodename) ?? 'Unknown',
  }
}

export async function getAllCycles(): Promise<CycleRecord[]> {
  const result = await Dga_cyclesService.getAll({
    select: SELECT_FIELDS,
    orderBy: ['dga_name asc'],
  })
  if (!result.success) {
    throw new Error(result.error?.message?.trim() || 'Failed to load assessment cycles.')
  }
  return (result.data ?? []).map(normalizeCycle).filter((r): r is CycleRecord => r !== null)
}

export async function getCycleById(id: string): Promise<CycleRecord | null> {
  const result = await Dga_cyclesService.get(id, { select: SELECT_FIELDS })
  if (!result.success) {
    throw new Error(result.error?.message?.trim() || 'Failed to load assessment cycle.')
  }
  if (!result.data) return null
  return normalizeCycle(result.data)
}

export async function updateCycleFields(
  id: string,
  name: string,
  plannedStartDate: string,
  plannedEndDate: string,
): Promise<void> {
  const result = await Dga_cyclesService.update(id, {
    dga_name: name,
    dga_planned_start_date: plannedStartDate,
    dga_planned_end_date: plannedEndDate,
  } as Partial<Omit<Dga_cyclesBase, 'dga_cycleid'>>)
  if (!result.success) {
    throw new Error(result.error?.message?.trim() || 'Failed to update assessment cycle.')
  }
}

export async function updateCycleStatus(id: string, statuscode: number): Promise<void> {
  const result = await Dga_cyclesService.update(id, {
    statuscode,
  } as Partial<Omit<Dga_cyclesBase, 'dga_cycleid'>>)
  if (!result.success) {
    throw new Error(result.error?.message?.trim() || 'Failed to update cycle status.')
  }
}

export async function getModuleTypes(): Promise<ModuleTypeOption[]> {
  const result = await Dga_module_typesService.getAll({
    select: ['dga_module_typeid', 'dga_module_name'],
    orderBy: ['dga_module_name asc'],
  })
  if (!result.success) {
    throw new Error(result.error?.message?.trim() || 'Failed to load module types.')
  }
  return (result.data ?? [])
    .map((r: Dga_module_types) => {
      const id = typeof r.dga_module_typeid === 'string' && r.dga_module_typeid.trim() ? r.dga_module_typeid : null
      const name = typeof r.dga_module_name === 'string' && r.dga_module_name.trim() ? r.dga_module_name : null
      if (!id || !name) return null
      return { id, name }
    })
    .filter((r): r is ModuleTypeOption => r !== null)
}

export async function createCycle(
  name: string,
  moduleTypeId: string,
  plannedStartDate: string,
  plannedEndDate: string,
): Promise<string> {
  const result = await Dga_cyclesService.create({
    dga_name: name,
    dga_planned_start_date: plannedStartDate,
    dga_planned_end_date: plannedEndDate,
    'dga_module_type@odata.bind': `/dga_module_types(${moduleTypeId})`,
  } as Omit<Dga_cyclesBase, 'dga_cycleid'>)
  if (!result.success) {
    throw new Error(result.error?.message?.trim() || 'Failed to create assessment cycle.')
  }
  if (!result.data?.dga_cycleid) throw new Error('Cycle creation did not return an ID')
  return result.data.dga_cycleid
}
