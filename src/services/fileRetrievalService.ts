export interface RetrievedSharePointFile {
  id: string
  documentId: string | null
  name: string
  title: string | null
  fileType: string | null
  relativeLocation: string | null
  absoluteUrl: string | null
  readUrl: string | null
  editUrl: string | null
  author: string | null
  modified: string | null
  createdOn: string | null
  modifiedBy: string | null
  isCheckedOut: boolean
  locationId: string | null
  iconClassName: string | null
}

export async function getSharePointFilesByBudgetId(
  _budgetId: string
): Promise<RetrievedSharePointFile[]> {
  return []
}
