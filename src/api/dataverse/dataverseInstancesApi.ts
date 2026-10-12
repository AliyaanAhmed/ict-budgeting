import type { InstanceRecord, ModuleConfigOption } from '@/domain/cycle'
import { Dga_ict_budget_instancesService } from '@/generated/services/Dga_ict_budget_instancesService'
import type { Dga_ict_budget_instances, Dga_ict_budget_instancesBase } from '@/generated/models/Dga_ict_budget_instancesModel'
import { Dga_module_configurationsService } from '@/generated/services/Dga_module_configurationsService'
import type { Dga_module_configurations } from '@/generated/models/Dga_module_configurationsModel'

const INSTANCE_SELECT = [
  'dga_ict_budget_instanceid',
  '_dga_cycle_value',
  '_dga_entity_value',
  'dga_entity_abbr',
  '_dga_module_configuration_value',
  'dga_name',
  'dga_planning_end_date',
  'dga_planning_start_date',
  'statuscode',
]

const MODULE_CONFIG_SELECT = [
  'dga_module_configurationid',
  '_dga_account_value',
  'dga_name',
]

function annotation<T extends object>(record: T, key: string): string | null {
  const v = (record as Record<string, unknown>)[key]
  return typeof v === 'string' && v.trim() ? v : null
}

function asStr(value: unknown): string | null {
  return typeof value === 'string' && (value as string).trim() ? (value as string) : null
}

function normalizeInstance(record: Dga_ict_budget_instances): InstanceRecord | null {
  const id = asStr(record.dga_ict_budget_instanceid)
  const name = asStr(record.dga_name)
  if (!id || !name) return null

  return {
    id,
    name,
    entityId: asStr(record._dga_entity_value),
    entityName:
      annotation(record, '_dga_entity_value@OData.Community.Display.V1.FormattedValue') ??
      asStr(record.dga_entityname),
    entityAbbr: asStr(record.dga_entity_abbr),
    moduleConfigName:
      annotation(record, '_dga_module_configuration_value@OData.Community.Display.V1.FormattedValue') ??
      asStr(record.dga_module_configurationname),
    planningStartDate: record.dga_planning_start_date?.slice(0, 10) ?? null,
    planningEndDate: record.dga_planning_end_date?.slice(0, 10) ?? null,
    planningStartDateFormatted: annotation(record, 'dga_planning_start_date@OData.Community.Display.V1.FormattedValue'),
    planningEndDateFormatted: annotation(record, 'dga_planning_end_date@OData.Community.Display.V1.FormattedValue'),
    statusCode: typeof record.statuscode === 'number' ? record.statuscode : null,
    statusLabel:
      annotation(record, 'statuscode@OData.Community.Display.V1.FormattedValue') ??
      asStr(record.statuscodename),
  }
}

function normalizeModuleConfig(record: Dga_module_configurations): ModuleConfigOption | null {
  const id = asStr(record.dga_module_configurationid)
  const name = asStr(record.dga_name)
  const accountId = asStr(record._dga_account_value)
  if (!id || !name || !accountId) return null

  const accountName =
    annotation(record, '_dga_account_value@OData.Community.Display.V1.FormattedValue') ??
    asStr(record.dga_accountname) ??
    name

  return { id, name, accountId, accountName }
}

export async function getInstancesByCycleId(cycleId: string): Promise<InstanceRecord[]> {
  const result = await Dga_ict_budget_instancesService.getAll({
    select: INSTANCE_SELECT,
    filter: `_dga_cycle_value eq ${cycleId}`,
    orderBy: ['dga_name asc'],
  })
  return (result.data ?? []).map(normalizeInstance).filter((r): r is InstanceRecord => r !== null)
}

export async function getExistingInstanceEntityIds(cycleId: string): Promise<Set<string>> {
  const result = await Dga_ict_budget_instancesService.getAll({
    select: ['dga_ict_budget_instanceid', '_dga_entity_value'],
    filter: `_dga_cycle_value eq ${cycleId}`,
  })
  const ids = new Set<string>()
  for (const record of result.data ?? []) {
    const v = (record as unknown as Record<string, unknown>)['_dga_entity_value']
    if (typeof v === 'string' && v.trim()) ids.add(v)
  }
  return ids
}

export async function createInstance(
  cycleId: string,
  accountId: string,
  moduleConfigId: string,
  instanceName: string,
): Promise<void> {
  await Dga_ict_budget_instancesService.create({
    'dga_cycle@odata.bind': `/dga_cycles(${cycleId})`,
    'dga_entity@odata.bind': `/accounts(${accountId})`,
    'dga_module_configuration@odata.bind': `/dga_module_configurations(${moduleConfigId})`,
    dga_name: instanceName,
  } as Omit<Dga_ict_budget_instancesBase, 'dga_ict_budget_instanceid'>)
}

export async function getModuleConfigurations(): Promise<ModuleConfigOption[]> {
  const result = await Dga_module_configurationsService.getAll({
    select: MODULE_CONFIG_SELECT,
    orderBy: ['dga_name asc'],
  })
  return (result.data ?? [])
    .map(normalizeModuleConfig)
    .filter((r): r is ModuleConfigOption => r !== null)
}
