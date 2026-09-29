import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

const source = readFileSync(new URL('../src/services/largeDocumentAnalysisService.ts', import.meta.url), 'utf8')
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText

function harness(responses, { abortOnWait = false, flowFails = false, overviewId = 'overview-id' } = {}) {
  const controller = new AbortController()
  const waits = []
  const calls = []
  let reads = 0
  const exports = {}
  vm.runInNewContext(compiled, {
    exports, AbortController, DOMException,
    FileReader: class {
      readAsDataURL() { this.result = 'data:application/pdf;base64,ZmFrZQ=='; this.onload() }
    },
    setTimeout: (callback, ms) => {
      waits.push(ms)
      queueMicrotask(() => abortOnWait ? controller.abort() : callback())
      return waits.length
    },
    clearTimeout: () => {},
    require: (name) => name.includes('LargeFileService') ? {
      PowerAppV2_GetDocumentSummaryfromCompass_LargeFileService: {
        Run: async (payload) => { calls.push(payload); return flowFails ? { success: false, error: { message: 'Rejected' } } : { success: true } },
      },
    } : {
      ensureCumulativeSummaryRecord: async () => ({ id: 'cumulative-id' }),
      getBudgetOverviewRecordsByBudgetIds: async (ids) => {
        assert.deepEqual(Array.from(ids), ['budget-id'])
        return new Map(overviewId ? [['budget-id', { id: overviewId }]] : [])
      },
      getDocumentSummaryRecordsByBudgetId: async () => {
        assert.ok(reads < responses.length, 'Unexpected extra polling request')
        return responses[reads++]
      },
    },
  })
  return { service: exports, controller, waits, calls, readCount: () => reads }
}
const record = (statusCode, id = 'new') => ({ id, documentName: 'report.pdf', statusCode, modifiedOn: 'new-time', documentSummary: '' })
const input = (h, onStatus = () => {}) => ({ budgetId: 'budget-id', file: { name: 'report.pdf', type: 'application/pdf' }, signal: h.controller.signal, onStatus })

test('waits five seconds then ten seconds, ignores old same-name summary, stops on completion', async () => {
  const old = record(576610001, 'old')
  const h = harness([[old], [old], [old, record(576610005)], [old, record(576610001)]])
  const statuses = []
  await h.service.startLargeDocumentAnalysis(input(h, (r) => statuses.push(r.statusCode)))
  assert.deepEqual(h.waits, [5000, 10000, 10000])
  assert.deepEqual(statuses, [576610005, 576610001])
  assert.equal(h.readCount(), 4)
  assert.equal(h.calls[0].text, 'budget-id')
  assert.equal(h.calls[0].text_1, 'cumulative-id')
  assert.equal(h.calls[0].text_2, 'overview-id')
  assert.equal(h.calls[0].fileContent.contentBytes, 'ZmFrZQ==')
  assert.equal(h.calls[0].fileContent.name, 'report.pdf')
  assert.equal(h.calls[0].fileContent.mimeType, 'application/pdf')
  assert.equal('file' in h.calls[0], false)
})

test('uses the existing Compass MIME fallback when the file type is missing', async () => {
  const h = harness([[], [record(576610001)]])
  await h.service.startLargeDocumentAnalysis({ ...input(h), file: { name: 'report.pdf', type: '' } })
  assert.equal(h.calls[0].fileContent.mimeType, 'application/octet-stream')
})

test('does not substitute the cumulative ID when no budget overview exists', async () => {
  const h = harness([[], [record(576610001)]], { overviewId: null })
  await h.service.startLargeDocumentAnalysis(input(h))
  assert.equal(h.calls[0].text_2, '')
  assert.equal(h.calls[0].text_1, 'cumulative-id')
})

for (const code of [576610002, 576610003, 576610004]) {
  test(`stops on terminal status ${code}`, async () => {
    const h = harness([[], [record(code)]])
    await h.service.startLargeDocumentAnalysis(input(h))
    assert.deepEqual(h.waits, [5000])
    assert.equal(h.readCount(), 2)
  })
}

test('leaving the page cancels polling before any status request', async () => {
  const h = harness([[]], { abortOnWait: true })
  await assert.rejects(h.service.startLargeDocumentAnalysis(input(h)), { name: 'AbortError' })
  assert.equal(h.readCount(), 1)
})

test('flow rejection does not start a polling loop', async () => {
  const h = harness([[]], { flowFails: true })
  await assert.rejects(h.service.startLargeDocumentAnalysis(input(h)), /Rejected/)
  assert.equal(h.waits.length, 0)
})

test('stored records map to distinct states and legacy summaries remain completed', () => {
  const h = harness([])
  for (const [code, state] of [[576610001, 'complete'], [576610002, 'error'], [576610003, 'cancelled'], [576610004, 'incomplete'], [576610005, 'queued']]) {
    assert.equal(h.service.getDocumentAnalysisStatus(record(code)), state)
  }
  assert.equal(h.service.getDocumentAnalysisStatus({ ...record(1), documentSummary: '{}' }), 'complete')
  assert.equal(h.readCount(), 0)
  assert.equal(h.service.LARGE_DOCUMENT_THRESHOLD, 512000)
})
