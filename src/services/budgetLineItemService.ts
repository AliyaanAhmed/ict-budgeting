import type { BudgetItemDraft, ClassificationNode } from '@/domain/classification'
import {
  buildClassificationTree,
  getClassificationPath,
  getClassificationRecords,
} from '@/services/classificationService'
import { Dga_ict_budget_line_itemsService } from '@/generated/services/Dga_ict_budget_line_itemsService'
import type {
  Dga_ict_budget_line_items,
  Dga_ict_budget_line_itemsBase,
} from '@/generated/models/Dga_ict_budget_line_itemsModel'

const SELECT_FIELDS = [
  'dga_ict_budget_line_itemid',
  'dga_budget_requested',
  '_dga_classification_value',
  'dga_ebs_account_code',
  'dga_fusion_account_code',
  '_dga_ict_budget_value',
  'dga_name',
]

export interface BudgetLineItemRecord {
  id: string
  budgetId: string | null
  classificationId: string | null
  accountName: string
  l1: string
  l2: string
  l3: string
  accountGroup: string | null
  description: string | null
  expenseTypeValue: number | null
  expenseTypeLabel: string | null
  ebsCode: string
  fusionCode: string
  budgetRequested: number
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

function buildCreateRecord(projectId: string, item: BudgetItemDraft) {
  return {
    'dga_ict_budget@odata.bind': `/dga_ict_budgets(${projectId})`,
    'dga_classification@odata.bind': `/dga_classifications(${item.id})`,
    dga_name: item.accountName,
    dga_account_group: item.accountGroup ?? undefined,
    dga_description: item.description ?? undefined,
    dga_fusion_account_code: item.fusionCode === 'N/A' ? null : item.fusionCode,
    dga_ebs_account_code: item.ebsCode === 'N/A' ? null : item.ebsCode,
    dga_budget_requested: Number(item.budgetRequested.toFixed(4)),
    dga_expense_type: item.expenseTypeValue ?? undefined,
    dga_added_in_allocation: 1,
  } as Partial<Omit<Dga_ict_budget_line_itemsBase, 'dga_ict_budget_line_itemid'>> as Omit<
    Dga_ict_budget_line_itemsBase,
    'dga_ict_budget_line_itemid'
  >
}

function normalizeLineItem(
  record: Dga_ict_budget_line_items,
  nodeMap: Map<string, ClassificationNode>
): BudgetLineItemRecord | null {
  const id = asString(record.dga_ict_budget_line_itemid)
  const accountName = asString(record.dga_name)

  if (!id || !accountName) {
    return null
  }

  const classificationId = asString(record._dga_classification_value)
  const classificationPath = classificationId ? getClassificationPath(classificationId, nodeMap) : []
  const [, l2Node, l3Node, glNode] = classificationPath
  const l1Node = classificationPath[0]

  return {
    id,
    budgetId: asString(record._dga_ict_budget_value),
    classificationId,
    accountName,
    l1: l1Node?.name ?? '-',
    l2: l2Node?.name ?? '-',
    l3: l3Node?.name ?? '-',
    accountGroup: glNode?.accountGroup ?? null,
    description: glNode?.description ?? null,
    expenseTypeValue: glNode?.expenseTypeValue ?? null,
    expenseTypeLabel: glNode?.expenseTypeLabel ?? null,
    ebsCode: asString(record.dga_ebs_account_code) ?? glNode?.ebsCode ?? 'N/A',
    fusionCode: asString(record.dga_fusion_account_code) ?? glNode?.fusionCode ?? 'N/A',
    budgetRequested: asNumber(record.dga_budget_requested) ?? 0,
  }
}

export async function createBudgetLineItems(projectId: string, items: BudgetItemDraft[]) {
  await Promise.all(items.map((item) => Dga_ict_budget_line_itemsService.create(buildCreateRecord(projectId, item))))
}

export async function updateBudgetLineItemAmount(lineItemId: string, budgetRequested: number) {
  await Dga_ict_budget_line_itemsService.update(lineItemId, {
    dga_budget_requested: Number(budgetRequested.toFixed(4)),
  } as Partial<Omit<Dga_ict_budget_line_itemsBase, 'dga_ict_budget_line_itemid'>>)
}

export async function deleteBudgetLineItem(lineItemId: string) {
  await Dga_ict_budget_line_itemsService.delete(lineItemId)
}

export async function getBudgetLineItemsByBudgetId(projectId: string) {
  const [lineItemResult, classificationRecords] = await Promise.all([
    Dga_ict_budget_line_itemsService.getAll({
      select: SELECT_FIELDS,
      filter: `_dga_ict_budget_value eq ${projectId}`,
      orderBy: ['dga_name asc'],
    }),
    getClassificationRecords(),
  ])

  const { nodeMap } = buildClassificationTree(classificationRecords)

  return (lineItemResult.data ?? [])
    .map((record) => normalizeLineItem(record, nodeMap))
    .filter((record): record is BudgetLineItemRecord => record !== null)
}

export async function getBudgetLineItemsByBudgetIds(projectIds: string[]) {
  const normalizedIds = Array.from(new Set(projectIds.map((id) => id.trim()).filter(Boolean)))
  if (!normalizedIds.length) {
    return [] as BudgetLineItemRecord[]
  }

  const serverFilter =
    normalizedIds.length === 1 ? `_dga_ict_budget_value eq ${normalizedIds[0]}` : undefined

  const [lineItemResult, classificationRecords] = await Promise.all([
    Dga_ict_budget_line_itemsService.getAll({
      select: SELECT_FIELDS,
      ...(serverFilter ? { filter: serverFilter } : {}),
      orderBy: ['dga_name asc'],
    }),
    getClassificationRecords(),
  ])

  const allowedProjectIds = new Set(normalizedIds)
  const { nodeMap } = buildClassificationTree(classificationRecords)

  return (lineItemResult.data ?? [])
    .filter((record) => {
      const budgetId = asString(record._dga_ict_budget_value)
      return budgetId ? allowedProjectIds.has(budgetId) : false
    })
    .map((record) => normalizeLineItem(record, nodeMap))
    .filter((record): record is BudgetLineItemRecord => record !== null)
}

export function toBudgetItemDraft(item: BudgetLineItemRecord): BudgetItemDraft {
  return {
    id: item.classificationId ?? item.id,
    accountName: item.accountName,
    l1: item.l1,
    l2: item.l2,
    l3: item.l3,
    glCode: item.accountName,
    accountGroup: item.accountGroup,
    description: item.description,
    ebsCode: item.ebsCode,
    fusionCode: item.fusionCode,
    expenseTypeValue: item.expenseTypeValue,
    expenseTypeLabel: item.expenseTypeLabel,
    budgetRequested: item.budgetRequested,
  }
}
