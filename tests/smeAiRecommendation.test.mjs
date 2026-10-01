import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

const source = readFileSync(new URL('../src/services/smeAiRecommendation.ts', import.meta.url), 'utf8')
const exports = {}
vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, { exports })
const parse = exports.parseSmeAiRecommendation
test('strategy suggestions start at quality check, not SME review', () => {
  for (const status of [null, 1, 776140004, 776140005, 776140006]) assert.equal(exports.canShowStrategyAiRecommendation(status), false)
  for (const status of [776140007, 776140008, 776140009, 776140011, 776140012, 776140013, 776140014, 776140015]) assert.equal(exports.canShowStrategyAiRecommendation(status), true)
})
const payload = (quality) => JSON.stringify({ score_inputs: { sme_review_quality: quality } })
test('decision matching compares both Yes and No without treating missing data as mismatch', () => {
  const yes = payload({ scoring_mode: 'Recommendation' })
  const no = payload({ scoring_mode: 'Rejection' })
  assert.equal(exports.getSmeDecisionMatch(yes, 2), 'matched')
  assert.equal(exports.getSmeDecisionMatch(no, 1), 'matched')
  assert.equal(exports.getSmeDecisionMatch(yes, 1), 'mismatched')
  assert.equal(exports.getSmeDecisionMatch(no, 2), 'mismatched')
  assert.equal(exports.getSmeDecisionMatch(null, 1), 'unavailable')
  assert.equal(exports.getSmeDecisionMatch(yes, null), 'unavailable')
})

test('rejection maps to No and recognized AI reason', () => {
  const result = parse(payload({ scoring_mode: 'Rejection', reason: 'Not Advised' }))
  assert.equal(result.recommended, 1)
  assert.equal(result.rejectionReason, 1)
})
test('recommendation maps to Yes', () => {
  assert.equal(parse(payload({ scoring_mode: 'Recommendation' })).recommended, 2)
})
test('historical SME reason is not an AI recommendation', () => {
  const result = parse(payload({ scoring_mode: 'Rejection', actual_rejection_reason: 'Not Advised', criteria: { rejection_decision_correctness: { reason: 'Budget evidence is missing.' } } }))
  assert.equal(result.rejectionReason, null)
  assert.equal(result.reason, 'Budget evidence is missing.')
})
test('malformed, missing, and unknown decisions do not produce suggestions', () => {
  for (const raw of [null, '', '{', 'null', '{}', payload({ scoring_mode: 'Needs Clarification' })]) assert.equal(parse(raw), null)
})
