import { PowerAppV2_CallUploadFileFlowService } from '@/generated/services/PowerAppV2_CallUploadFileFlowService'

const UPLOAD_TARGET_URL =
  'https://15ab284543e0e696a0c3fc6bd63330.55.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/0505788ca25042198ed8c5d0384b5a42/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=uNYDB3aKWPwTps6dh0H4OG90VKU7E8QHmsLFcWcfFIU'

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    console.log(`[FileUpload] Reading file as base64: ${file.name} (${file.size} bytes, type: ${file.type})`)
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      const base64 = result.split(',')[1] ?? ''
      console.log(`[FileUpload] Base64 conversion done for: ${file.name} — encoded length: ${base64.length} chars`)
      resolve(base64)
    }
    reader.onerror = (event) => {
      console.error(`[FileUpload] FileReader error for: ${file.name}`, event)
      reject(new Error(`Failed to read file: ${file.name}`))
    }
    reader.readAsDataURL(file)
  })
}

export async function uploadFileToRecord(recordId: string, file: File): Promise<void> {
  const ext = (file.name.split('.').pop() ?? '').toLowerCase()

  console.log(`[FileUpload] ── Starting upload ──────────────────────────`)
  console.log(`[FileUpload]   Record ID : ${recordId}`)
  console.log(`[FileUpload]   File name : ${file.name}`)
  console.log(`[FileUpload]   File type : ${ext}`)
  console.log(`[FileUpload]   File size : ${file.size} bytes`)

  const fileContent = await fileToBase64(file)

  const payload = JSON.stringify({
    recordId,
    uploadedFile: {
      fileName: file.name,
      fileType: ext,
      fileContent,
      folderPath: recordId,
    },
  })

  console.log(`[FileUpload] Calling PowerAppV2 upload flow via Power Apps runtime...`)

  const result = await PowerAppV2_CallUploadFileFlowService.Run({
    text: payload,
    text_1: UPLOAD_TARGET_URL,
  })

  console.log(`[FileUpload] Connector result:`, result)

  if (result.error) {
    console.error(`[FileUpload] Upload failed for "${file.name}":`, result.error)
    throw new Error(`Upload failed for "${file.name}": ${result.error.message ?? JSON.stringify(result.error)}`)
  }

  console.log(`[FileUpload] ✓ Upload successful for: ${file.name}`)
}

export async function uploadFilesToRecord(recordId: string, files: File[]): Promise<void> {
  console.log(`[FileUpload] Uploading ${files.length} file(s) to record: ${recordId}`)
  for (let i = 0; i < files.length; i++) {
    console.log(`[FileUpload] File ${i + 1}/${files.length}: ${files[i].name}`)
    await uploadFileToRecord(recordId, files[i])
  }
  console.log(`[FileUpload] All ${files.length} file(s) uploaded successfully.`)
}
