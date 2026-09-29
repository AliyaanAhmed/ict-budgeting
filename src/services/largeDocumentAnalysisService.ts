import { PowerAppV2_GetDocumentSummaryfromCompass_LargeFileService } from '@/generated/services/PowerAppV2_GetDocumentSummaryfromCompass_LargeFileService'
import { ensureCumulativeSummaryRecord, getBudgetOverviewRecordsByBudgetIds, getDocumentSummaryRecordsByBudgetId, type StoredDocumentSummaryRecord } from './documentAiSummaryStoreService'

export const LARGE_DOCUMENT_THRESHOLD = 500 * 1024
export type DocumentAnalysisStatus = 'uploading' | 'queued' | 'analyzing' | 'complete' | 'error' | 'cancelled' | 'incomplete'

export function getDocumentAnalysisStatus(record: StoredDocumentSummaryRecord): DocumentAnalysisStatus {
  switch (record.statusCode) {
    case 576610001: return 'complete'
    case 576610002: return 'error'
    case 576610003: return 'cancelled'
    case 576610004: return 'incomplete'
    case 576610005: return 'queued'
    default: return record.documentSummary.trim() ? 'complete' : 'incomplete'
  }
}

const summaryRequests = new Map<string, ReturnType<typeof ensureCumulativeSummaryRecord>>()
async function getSummaryId(budgetId: string) {
  let request = summaryRequests.get(budgetId)
  if (!request) {
    request = ensureCumulativeSummaryRecord(budgetId)
    summaryRequests.set(budgetId, request)
  }
  try { return (await request).id } finally { summaryRequests.delete(budgetId) }
}

function waitForPoll(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    signal.throwIfAborted()
    const abort = () => { clearTimeout(timer); reject(new DOMException('Aborted', 'AbortError')) }
    const timer = setTimeout(() => { signal.removeEventListener('abort', abort); resolve() }, ms)
    signal.addEventListener('abort', abort, { once: true })
  })
}

export async function startLargeDocumentAnalysis(input: {
  budgetId: string
  file: File
  signal: AbortSignal
  onStatus: (record: StoredDocumentSummaryRecord) => void
  onAccepted?: () => void
}) {
  const { budgetId, file, signal, onStatus } = input
  const baseline = await getDocumentSummaryRecordsByBudgetId(budgetId)
  const summaryId = await getSummaryId(budgetId)
  const overviewRecords = await getBudgetOverviewRecordsByBudgetIds([budgetId])
  const budgetOverviewId = overviewRecords.get(budgetId)?.id ?? ''
  signal.throwIfAborted()
  const contentBytes = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '')
    reader.onerror = () => reject(new Error('Unable to read the uploaded document.'))
    reader.readAsDataURL(file)
  })
  signal.throwIfAborted()
  // Match the existing Compass flow's file payload, including its MIME metadata.
  const flowInput = {
    fileContent: {
      name: file.name,
      contentBytes,
      mimeType: (file.type || 'application/octet-stream').trim().replace(/\s+/g, ' '),
    },
    text: budgetId,
    text_1: summaryId,
    // An empty value means no category-1 overview exists for this budget yet.
    text_2: budgetOverviewId,
  }
  const result = await PowerAppV2_GetDocumentSummaryfromCompass_LargeFileService.Run(flowInput)
  if (!result.success || result.error) throw new Error(result.error?.message || 'Unable to start large-file analysis.')
  signal.throwIfAborted()
  input.onAccepted?.()
  const previous = new Map(baseline.map((record) => [record.id, record.modifiedOn]))
  let trackedId: string | null = null
  await waitForPoll(5000, signal)
  while (!signal.aborted) {
    const records = await getDocumentSummaryRecordsByBudgetId(budgetId)
    signal.throwIfAborted()
    // Do not accept a stale summary from a previous upload with the same name.
    const record = records.slice().reverse().find((candidate) => trackedId
      ? candidate.id === trackedId
      : candidate.documentName.trim().toLowerCase() === file.name.trim().toLowerCase() &&
        (!previous.has(candidate.id) || previous.get(candidate.id) !== candidate.modifiedOn))
    if (record) {
      trackedId = record.id
      onStatus(record)
      if (getDocumentAnalysisStatus(record) !== 'queued') return record
    }
    await waitForPoll(10000, signal)
  }
  signal.throwIfAborted()
}
