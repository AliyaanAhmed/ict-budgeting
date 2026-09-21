import { AuditsService } from '@/generated/services/AuditsService'

const AUDIT_SELECT_FIELDS = [
  'auditid',
  'additionalinfo',
  'changedata',
  '_userid_value',
  'createdon',
  'attributemask',
  'objecttypecode',
] as const

type AuditChangedAttribute = {
  logicalName?: string
  oldValue?: unknown
  newValue?: unknown
  oldName?: string | null
  newName?: string | null
}

type AuditChangedData = {
  changedAttributes?: AuditChangedAttribute[]
}

export interface AuditLogEntry {
  id: string
  fieldName: string
  oldValue: string
  newValue: string
  updatedBy: string
  updatedOn: string
}

function getFormattedAnnotation(record: unknown, key: string) {
  const value = (record as Record<string, unknown> | null)?.[key]
  return typeof value === 'string' && value.trim() ? value : null
}

function normalizeFieldLabel(logicalName: string | undefined) {
  if (!logicalName) return 'Field Update'

  const labelMap: Record<string, string> = {
    dga_initiative_project_requirement_name: 'Initiative / Budget Item Name',
    dga_strategic_priority: 'Strategic Priority',
    dga_strategic_priority_classification: 'Strategic Priority Classification',
    dga_work_stream: 'Work Stream',
    dga_technology_company: 'Technology Company',
    dga_summary: 'Summary / Description',
    dga_activity_type: 'Budget Type',
    dga_budget_item_type: 'ICT Budget Items Type',
    dga_category: 'Category',
    dga_planned_start_date: 'Planned Start Date',
    dga_planned_end_date: 'Planned End Date',
    dga_total_budget_paid_previous_year: 'Total Budget Paid Previous Year',
    dga_total_budget_payable_future_year: 'Total Budget Payable Future Year',
    dga_total_budget_payable_next_year: 'Total Budget Payable Next Year',
    dga_total_budget_payable_for_year_after_next: 'Total Budget Payable For Year After Next',
    dga_total_budget_requested: 'Requested Budget',
    dga_status_for_adge: 'Status for ADGE',
    statuscode: 'Status Reason',
    ownerid: 'Owner',
    dga_respondent: 'Respondent',
    dga_reviewer: 'Reviewer',
    dga_approver: 'Approver',
  }

  const direct = labelMap[logicalName]
  if (direct) return direct

  return logicalName
    .replace(/^_+/, '')
    .replace(/_value$/i, '')
    .replace(/^dga_/, '')
    .split('_')
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ')
}

function normalizeDisplayValue(value: unknown, fallbackName?: string | null): string {
  if (typeof fallbackName === 'string' && fallbackName.trim()) {
    return fallbackName.trim()
  }
  if (value === null || value === undefined || value === '') {
    return '-'
  }
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No'
  }
  if (typeof value === 'number') {
    return value.toString()
  }
  if (typeof value === 'string') {
    return value.trim() || '-'
  }
  if (Array.isArray(value)) {
    return value.length > 0 ? value.map((item) => normalizeDisplayValue(item)).join(', ') : '-'
  }
  return String(value)
}

function parseChangedAttributes(changedata: string | null | undefined): AuditChangedAttribute[] {
  if (!changedata?.trim()) return []

  try {
    const parsed = JSON.parse(changedata) as AuditChangedData
    return Array.isArray(parsed.changedAttributes) ? parsed.changedAttributes : []
  } catch {
    return []
  }
}

function formatAuditTimestamp(record: unknown, rawCreatedOn: string | null | undefined) {
  const formatted = getFormattedAnnotation(record, 'createdon@OData.Community.Display.V1.FormattedValue')
  if (formatted) return formatted
  if (!rawCreatedOn) return '-'

  const date = new Date(rawCreatedOn)
  if (Number.isNaN(date.getTime())) return rawCreatedOn

  return date.toLocaleString('en-AE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export async function getAuditLogsByBudgetId(budgetId: string) {
  const result = await AuditsService.getAll({
    select: [...AUDIT_SELECT_FIELDS],
    filter: `_objectid_value eq ${budgetId}`,
    orderBy: ['createdon desc'],
  })

  if (!result.success) {
    const message = result.error?.message?.trim() || 'Unable to load audit logs.'
    throw new Error(message)
  }

  const rows: AuditLogEntry[] = []

  for (const record of result.data ?? []) {
    const changedAttributes = parseChangedAttributes(record.changedata)
    const updatedBy =
      getFormattedAnnotation(record, '_userid_value@OData.Community.Display.V1.FormattedValue') ||
      'Unknown User'
    const updatedOn = formatAuditTimestamp(record, record.createdon)

    if (changedAttributes.length === 0) {
      const fallbackText = normalizeDisplayValue(record.additionalinfo)
      rows.push({
        id: record.auditid,
        fieldName: 'Audit Event',
        oldValue: '-',
        newValue: fallbackText === '-' ? 'Record updated' : fallbackText,
        updatedBy,
        updatedOn,
      })
      continue
    }

    changedAttributes.forEach((attribute, index) => {
      rows.push({
        id: `${record.auditid}-${index}`,
        fieldName: normalizeFieldLabel(attribute.logicalName),
        oldValue: normalizeDisplayValue(attribute.oldValue, attribute.oldName),
        newValue: normalizeDisplayValue(attribute.newValue, attribute.newName),
        updatedBy,
        updatedOn,
      })
    })
  }

  return rows
}
