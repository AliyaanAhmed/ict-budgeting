import type { ClassificationRecord, ClassificationLevel } from '@/domain/classification'
import type { ClassificationsApi } from '@/api/classificationsApi'
import { Dga_classificationsService } from '@/generated/services/Dga_classificationsService'
import type { Dga_classifications } from '@/generated/models/Dga_classificationsModel'

const SELECT_FIELDS = [
  'dga_classificationid',
  'dga_arabic_name',
  'dga_classification_level',
  'dga_ebs_account_code',
  'dga_expense_type',
  'dga_fusion_account_code',
  'dga_name',
  '_dga_parent_classification_value',
]

function pushClassificationDebug(message: string, details?: unknown) {
  const timestamp = new Date().toISOString()
  console.debug(`[classification-api] ${timestamp} ${message}`, details ?? '')
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null
}

function asNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function asLevel(value: unknown): ClassificationLevel | null {
  const level = asNumber(value)
  return level === 1 || level === 2 || level === 3 || level === 4 ? level : null
}

function getAnnotation(record: Dga_classifications, key: string) {
  return asString((record as unknown as Record<string, unknown>)[key])
}

function normalizeClassification(record: Dga_classifications): ClassificationRecord | null {
  const id = asString(record.dga_classificationid)
  const name = asString(record.dga_name)
  const parentId = asString(record._dga_parent_classification_value)
  const level = asLevel(record.dga_classification_level)

  if (!id || !name || !level) {
    return null
  }

  return {
    id,
    name,
    arabicName: asString(record.dga_arabic_name),
    level,
    levelLabel: getAnnotation(record, 'dga_classification_level@OData.Community.Display.V1.FormattedValue') ?? `Level ${level}`,
    parentId,
    parentName: getAnnotation(record, '_dga_parent_classification_value@OData.Community.Display.V1.FormattedValue') ?? asString(record.dga_parent_classificationname),
    parentLookupLogicalName: getAnnotation(record, '_dga_parent_classification_value@Microsoft.Dynamics.CRM.lookuplogicalname'),
    ebsCode: asString(record.dga_ebs_account_code),
    fusionCode: asString(record.dga_fusion_account_code),
    expenseTypeValue: asNumber(record.dga_expense_type),
    expenseTypeLabel: getAnnotation(record, 'dga_expense_type@OData.Community.Display.V1.FormattedValue') ?? asString(record.dga_expense_typename),
  }
}

export const dataverseClassificationsApi: ClassificationsApi = {
  async getAll() {
    pushClassificationDebug('Requesting dga_classifications via generated service', {
      select: SELECT_FIELDS,
      orderBy: ['dga_name asc'],
    })

    const result = await Dga_classificationsService.getAll({
      select: SELECT_FIELDS,
      orderBy: ['dga_name asc'],
    })

    pushClassificationDebug('Generated service response received', {
      count: result.data?.length ?? 0,
    })

    return (result.data ?? [])
      .map(normalizeClassification)
      .filter((item): item is ClassificationRecord => item !== null)
  },
}
