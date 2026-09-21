export type ClassificationLevel = 1 | 2 | 3 | 4

export interface ClassificationRecord {
  id: string
  name: string
  arabicName: string | null
  level: ClassificationLevel
  levelLabel: string
  parentId: string | null
  parentName: string | null
  parentLookupLogicalName: string | null
  accountGroup: string | null
  description: string | null
  ebsCode: string | null
  fusionCode: string | null
  expenseTypeValue: number | null
  expenseTypeLabel: string | null
}

export interface ClassificationNode extends ClassificationRecord {
  children: ClassificationNode[]
}

export interface ClassificationSearchResult {
  id: string
  accountName: string
  ebsCode: string | null
  fusionCode: string | null
  expenseTypeLabel: string | null
  pathIds: {
    l1Id: string
    l2Id: string
    l3Id: string
    glId: string
  }
  pathLabels: {
    l1: string
    l2: string
    l3: string
  }
}

export interface BudgetItemDraft {
  id: string
  accountName: string
  l1: string
  l2: string
  l3: string
  glCode: string
  accountGroup: string | null
  description: string | null
  ebsCode: string
  fusionCode: string
  expenseTypeValue: number | null
  expenseTypeLabel: string | null
  budgetRequested: number
}
