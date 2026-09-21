import { PowerAppV2_CallUploadFileFlowService } from '@/generated/services/PowerAppV2_CallUploadFileFlowService'
import { prepareSupportingDocumentFile } from '@/services/supportingDocumentPreparationService'

const UPLOAD_TARGET_URL =
  'https://15ab284543e0e696a0c3fc6bd63330.55.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/0505788ca25042198ed8c5d0384b5a42/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=uNYDB3aKWPwTps6dh0H4OG90VKU7E8QHmsLFcWcfFIU'

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    console.log(`[FileUpload] Reading file as base64: ${file.name} (${file.size} bytes, type: ${file.type})`)
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      const base64 = result.split(',')[1] ?? ''
      console.log(`[FileUpload] Base64 conversion done for: ${file.name}; encoded length: ${base64.length} chars`)
      resolve(base64)
    }
    reader.onerror = (event) => {
      console.error(`[FileUpload] FileReader error for: ${file.name}`, event)
      reject(new Error(`Failed to read file: ${file.name}`))
    }
    reader.readAsDataURL(file)
  })
}

// Extract the fileurl value from Power Automate's response JSON string.
// The response format is: "File Uploaded Successfully - {\"fileurl\":\"https://...url with spaces...\", ...}"
// A standard URL regex breaks on spaces, so we match by key name instead.
function extractFileurlFromString(str: string): string | null {
  const match = str.match(/"fileurl"\s*:\s*"([^"]+)"/i)
  return match?.[1]?.trim() || null
}

function extractUploadedFileUrl(result: unknown, excludedUrls: string[]): string | null {
  if (!result || typeof result !== 'object') return null
  const data = (result as Record<string, unknown>).data

  // Primary path: look for fileurl in result.data.response (the nested JSON string)
  if (data && typeof data === 'object') {
    const response = (data as Record<string, unknown>).response
    if (typeof response === 'string') {
      const url = extractFileurlFromString(response)
      if (url && !excludedUrls.includes(url)) {
        console.log('[FileUpload] Extracted fileurl from response JSON:', url)
        return url
      }
    }
  }

  // Secondary path: look for fileurl anywhere in result (handles varied response shapes)
  const resultStr = JSON.stringify(result)
  const url = extractFileurlFromString(resultStr)
  if (url && !excludedUrls.includes(url)) {
    console.log('[FileUpload] Extracted fileurl via JSON.stringify fallback:', url)
    return url
  }

  console.warn('[FileUpload] Could not extract fileurl from result:', result)
  return null
}

export async function uploadFileToRecord(recordId: string, file: File): Promise<string | null> {
  const { preparedFile: fileToUpload } = await prepareSupportingDocumentFile(file)
  const ext = (fileToUpload.name.split('.').pop() ?? '').toLowerCase()

  console.log('[FileUpload] Starting upload')
  console.log(`[FileUpload]   Record ID : ${recordId}`)
  console.log(`[FileUpload]   File name : ${file.name}`)
  console.log(`[FileUpload]   Upload as : ${fileToUpload.name}`)
  console.log(`[FileUpload]   File type : ${ext}`)
  console.log(`[FileUpload]   File size : ${fileToUpload.size} bytes`)

  const fileContent = await fileToBase64(fileToUpload)

  const payload = JSON.stringify({
    recordId,
    uploadedFile: {
      fileName: fileToUpload.name,
      fileType: ext,
      fileContent,
      folderPath: recordId,
    },
  })

  console.log('[FileUpload] Calling PowerAppV2 upload flow via Power Apps runtime...')

  const result = await PowerAppV2_CallUploadFileFlowService.Run({
    text: payload,
    text_1: UPLOAD_TARGET_URL,
  })

  console.log('[FileUpload] Connector result:', result)

  if (result.error) {
    console.error(`[FileUpload] Upload failed for "${fileToUpload.name}":`, result.error)
    throw new Error(`Upload failed for "${fileToUpload.name}": ${result.error.message ?? JSON.stringify(result.error)}`)
  }

  const uploadedUrl = extractUploadedFileUrl(result, [UPLOAD_TARGET_URL])
  console.log(`[FileUpload] Uploaded URL for "${fileToUpload.name}":`, uploadedUrl)
  console.log(`[FileUpload] Upload successful for: ${fileToUpload.name}`)
  return uploadedUrl
}

export async function uploadFilesToRecord(recordId: string, files: File[]): Promise<string[]> {
  console.log(`[FileUpload] Uploading ${files.length} file(s) to record: ${recordId}`)
  const uploadedUrls: string[] = []

  for (let i = 0; i < files.length; i++) {
    console.log(`[FileUpload] File ${i + 1}/${files.length}: ${files[i].name}`)
    const uploadedUrl = await uploadFileToRecord(recordId, files[i])
    if (uploadedUrl) uploadedUrls.push(uploadedUrl)
  }

  console.log(`[FileUpload] All ${files.length} file(s) uploaded successfully.`)
  return uploadedUrls
}
