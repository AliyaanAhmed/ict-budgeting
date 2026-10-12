import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

const source = readFileSync(new URL('../src/services/portfolioSummaryService.ts', import.meta.url), 'utf8')
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText
const exports = {}
vm.runInNewContext(compiled, { exports, require: () => ({}) })
const summarize = exports.getPortfolioRoleStatusSummary
const summary = {
  calculation_sources: {
    status_project_ids: {
      Draft: ['BID-1', 'bid-1', ' BID-2 ', ''],
      'Clarification Pending': ['BID-3'],
      'Under Reviewer Review': ['BID-4'],
      'Reviewer Review Completed': ['BID-5', 'BID-6'],
      'Under Approver Review': ['BID-7'],
      'Approved by Approver': [],
    },
  },
  role_views: { respondent: { summary_template: 'Incorrect count: {unknown_count}' } },
}

test('respondent counts unique BID arrays without AI placeholders', () => {
  assert.equal(summarize(summary, 'respondent'), 'You have 2 projects in Draft and 1 project with clarifications pending.')
})
test('reviewer uses its two workflow arrays', () => {
  assert.equal(summarize(summary, 'reviewer'), 'You have 1 project under review and 2 projects reviewed but not yet routed to the approver.')
})
test('approver uses pending and approved arrays', () => {
  assert.equal(summarize(summary, 'approver'), 'You have 1 project pending with you and 0 projects approved by you.')
})
test('missing status data does not produce misleading zero counts', () => {
  assert.equal(summarize(null, 'respondent'), '')
  assert.equal(summarize({}, 'reviewer'), '')
})
