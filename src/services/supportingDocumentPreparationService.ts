import * as XLSX from 'xlsx'

export interface PreparedSupportingDocumentFile {
  originalFile: File
  preparedFile: File
}

function getFileExtension(fileName: string) {
  const normalized = fileName.trim().toLowerCase()
  const lastDotIndex = normalized.lastIndexOf('.')
  return lastDotIndex === -1 ? '' : normalized.slice(lastDotIndex + 1)
}

function isExcelFile(file: File) {
  const extension = getFileExtension(file.name)
  return extension === 'xls' || extension === 'xlsx'
}

function arrayBufferFromFile(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => resolve(reader.result as ArrayBuffer)
    reader.onerror = () => reject(new Error(`Failed to read supporting document: ${file.name}`))

    reader.readAsArrayBuffer(file)
  })
}

function normalizeSheetCellValue(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (value instanceof Date) return value.toISOString()
  return String(value).trim()
}

function workbookToPlainText(workbook: XLSX.WorkBook) {
  const sheetTexts = workbook.SheetNames.map((sheetName) => {
    const worksheet = workbook.Sheets[sheetName]
    const rows = XLSX.utils.sheet_to_json<(string | number | boolean | Date | null)[]>(worksheet, {
      header: 1,
      raw: false,
      defval: '',
      blankrows: false,
    })

    const normalizedRows = rows
      .map((row) =>
        row
          .map((cell) => normalizeSheetCellValue(cell))
          .filter((cell, index, cells) => cell !== '' || index < cells.length - 1)
          .join('\t')
          .trimEnd()
      )
      .filter((row) => row.length > 0)

    const sheetBody = normalizedRows.length > 0 ? normalizedRows.join('\n') : 'No visible data found in this sheet.'

    return [`Sheet: ${sheetName}`, sheetBody].join('\n')
  })

  return sheetTexts.join('\n\n')
}

async function convertExcelFileToPlainText(file: File) {
  try {
    const arrayBuffer = await arrayBufferFromFile(file)
    const workbook = XLSX.read(arrayBuffer, {
      type: 'array',
      cellDates: true,
      dense: true,
    })
    const plainText = workbookToPlainText(workbook).trim()

    if (!plainText) {
      throw new Error('No readable workbook content was found.')
    }

    return plainText
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown spreadsheet parsing error.'
    throw new Error(`Failed to convert Excel file "${file.name}" into text: ${message}`)
  }
}

export async function prepareSupportingDocumentFile(file: File): Promise<PreparedSupportingDocumentFile> {
  if (!isExcelFile(file)) {
    return {
      originalFile: file,
      preparedFile: file,
    }
  }

  const plainText = await convertExcelFileToPlainText(file)
  const baseFileName = file.name.replace(/\.[^.]+$/, '') || file.name
  const preparedFile = new File([plainText], `${baseFileName}.txt`, {
    type: 'text/plain',
    lastModified: file.lastModified,
  })

  return {
    originalFile: file,
    preparedFile,
  }
}
