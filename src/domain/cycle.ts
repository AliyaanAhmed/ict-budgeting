export const CYCLE_STATUS_DRAFT = 1
export const CYCLE_STATUS_PUBLISHED = 776140001
export const CYCLE_STATUS_COMPLETED = 776140002

export interface CycleRecord {
  id: string
  name: string
  moduleTypeId: string | null
  moduleTypeLabel: string | null
  plannedStartDate: string | null
  plannedEndDate: string | null
  plannedStartDateFormatted: string | null
  plannedEndDateFormatted: string | null
  statusCode: number
  statusLabel: string
}

export interface InstanceRecord {
  id: string
  name: string
  entityId: string | null
  entityName: string | null
  entityAbbr: string | null
  moduleConfigName: string | null
  planningStartDate: string | null
  planningEndDate: string | null
  planningStartDateFormatted: string | null
  planningEndDateFormatted: string | null
  statusCode: number | null
  statusLabel: string | null
}

export interface ModuleConfigOption {
  id: string
  name: string
  accountId: string
  accountName: string
}

export interface ModuleTypeOption {
  id: string
  name: string
}
