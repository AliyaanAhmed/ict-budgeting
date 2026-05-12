import { ICTBudget_Clarifications_UploadFilesinSharepointService } from '@/generated/services/ICTBudget_Clarifications_UploadFilesinSharepointService'

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

  console.log(`[FileUpload] Calling Power Automate connector via Power Apps runtime...`)

  const result = await ICTBudget_Clarifications_UploadFilesinSharepointService.Run({
    recordId,
    uploadedFile: {
      fileName: file.name,
      fileType: ext,
      fileContent,
      folderPath: recordId,
    },
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
