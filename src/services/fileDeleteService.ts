import { ICTBudget_Clarificaitons_DeleteFileFromSharePointService } from '@/generated/services/ICTBudget_Clarificaitons_DeleteFileFromSharePointService'
import type { WebApiPortalDocument } from '@/services/webApiForPortalService'

export async function deleteSharePointDocument(doc: WebApiPortalDocument): Promise<void> {
  const payload = JSON.stringify({
    absoluteUrl: doc.absoluteurl,
    relativeLocation: doc.relativelocation,
    documentId: doc.sharepointdocumentid,
    fileName: doc.fullname,
  })

  console.log('[FileDeleteService] Deleting SharePoint document:', {
    sharepointdocumentid: doc.sharepointdocumentid,
    fullname: doc.fullname,
    relativelocation: doc.relativelocation,
    absoluteurl: doc.absoluteurl,
  })

  const result = await ICTBudget_Clarificaitons_DeleteFileFromSharePointService.Run({
    text: payload,
  })

  console.log('[FileDeleteService] Delete flow result:', result)

  if (result.error) {
    const errMsg = result.error instanceof Error
      ? result.error.message
      : (result.error as { message?: string }).message ?? JSON.stringify(result.error)
    throw new Error(`Delete failed for "${doc.fullname}": ${errMsg}`)
  }
}
