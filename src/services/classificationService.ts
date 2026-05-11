import type {
  BudgetItemDraft,
  ClassificationNode,
  ClassificationRecord,
  ClassificationSearchResult,
} from '@/domain/classification'
import { classificationsApi } from '@/services/classificationsApiProvider'

function sortByName<T extends { name: string }>(items: T[]) {
  return [...items].sort((left, right) => left.name.localeCompare(right.name))
}

export async function getClassificationRecords() {
  return classificationsApi.getAll()
}

export function buildClassificationTree(records: ClassificationRecord[]) {
  const nodeMap = new Map<string, ClassificationNode>(
    records.map((record) => [record.id, { ...record, children: [] }])
  )

  const roots: ClassificationNode[] = []

  nodeMap.forEach((node) => {
    if (!node.parentId) {
      roots.push(node)
      return
    }

    const parent = nodeMap.get(node.parentId)
    if (parent) {
      parent.children.push(node)
    }
  })

  const sortTree = (items: ClassificationNode[]): ClassificationNode[] =>
    sortByName(items).map((item) => ({ ...item, children: sortTree(item.children) }))

  return {
    roots: sortTree(roots),
    nodeMap,
  }
}

export function getClassificationPath(nodeId: string, nodeMap: Map<string, ClassificationNode>) {
  const path: ClassificationNode[] = []
  let current = nodeMap.get(nodeId) ?? null

  while (current) {
    path.unshift(current)
    current = current.parentId ? nodeMap.get(current.parentId) ?? null : null
  }

  return path
}

export function buildBudgetItemDraft(nodeId: string, nodeMap: Map<string, ClassificationNode>): BudgetItemDraft | null {
  const path = getClassificationPath(nodeId, nodeMap)
  if (path.length !== 4) return null

  const [l1, l2, l3, gl] = path

  return {
    id: gl.id,
    accountName: gl.name,
    l1: l1.name,
    l2: l2.name,
    l3: l3.name,
    glCode: gl.name,
    accountGroup: gl.accountGroup ?? null,
    description: gl.description ?? null,
    ebsCode: gl.ebsCode ?? 'N/A',
    fusionCode: gl.fusionCode ?? 'N/A',
    expenseTypeValue: gl.expenseTypeValue,
    expenseTypeLabel: gl.expenseTypeLabel,
    budgetRequested: 0,
  }
}

export function searchClassificationBudgetAccounts(
  records: ClassificationRecord[],
  nodeMap: Map<string, ClassificationNode>,
  term: string
) {
  const normalizedTerm = term.trim().toLowerCase()
  if (normalizedTerm.length < 2) return []

  return records
    .filter((record) => record.level === 4)
    .filter((record) =>
      [record.name, record.ebsCode, record.fusionCode].some((value) =>
        value?.toLowerCase().includes(normalizedTerm)
      )
    )
    .map((record) => {
      const path = getClassificationPath(record.id, nodeMap)
      if (path.length !== 4) return null
      const [l1, l2, l3, gl] = path

      return {
        id: gl.id,
        accountName: gl.name,
        ebsCode: gl.ebsCode,
        fusionCode: gl.fusionCode,
        expenseTypeLabel: gl.expenseTypeLabel,
        pathIds: {
          l1Id: l1.id,
          l2Id: l2.id,
          l3Id: l3.id,
          glId: gl.id,
        },
        pathLabels: {
          l1: l1.name,
          l2: l2.name,
          l3: l3.name,
        },
      } satisfies ClassificationSearchResult
    })
    .filter((result): result is ClassificationSearchResult => result !== null)
    .slice(0, 8)
}
