import { SharepointdocumentsService } from '@/generated/services/SharepointdocumentsService'

export interface SharePointFile {
  id: string
  name: string
  fileType: string
  absoluteUrl: string
  readUrl: string
  editUrl: string
  author: string
  modified: string
  sharepointCreatedOn: string
  relativePath: string
  isCheckedOut: boolean
  iconClassName: string
}

export async function getUploadedFiles(budgetId: string): Promise<SharePointFile[]> {
  console.log(`[FileRetrieval] Fetching SharePoint documents for budget: ${budgetId}`)

  const result = await SharepointdocumentsService.getAll({
    filter: `_regardingobjectid_value eq ${budgetId} and isrecursivefetch eq true`,
    select: [
      'sharepointdocumentid',
      'fullname',
      'filetype',
      'absoluteurl',
      'readurl',
      'editurl',
      'author',
      'modified',
      'sharepointcreatedon',
      'relativelocation',
      'ischeckedout',
      'iconclassname',
    ],
    orderBy: ['relativelocation asc'],
  })

  console.log(`[FileRetrieval] Raw result:`, result)

  if (result.error) {
    console.error(`[FileRetrieval] Failed to fetch documents:`, result.error)
    throw new Error(`Failed to fetch documents: ${result.error.message ?? JSON.stringify(result.error)}`)
  }

  const files = (result.data ?? []).map<SharePointFile>(doc => ({
    id: doc.sharepointdocumentid,
    name: doc.fullname ?? '',
    fileType: doc.filetype ?? '',
    absoluteUrl: doc.absoluteurl ?? '',
    readUrl: doc.readurl ?? '',
    editUrl: doc.editurl ?? '',
    author: doc.author ?? '',
    modified: doc.modified ?? '',
    sharepointCreatedOn: doc.sharepointcreatedon ?? '',
    relativePath: doc.relativelocation ?? '',
    isCheckedOut: doc.ischeckedout ?? false,
    iconClassName: doc.iconclassname ?? '',
  }))

  console.log(`[FileRetrieval] Found ${files.length} file(s):`, files.map((f: SharePointFile) => f.name))
  return files
}
