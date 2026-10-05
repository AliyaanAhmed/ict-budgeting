export function getSmeDecisionMatch(raw: string | null | undefined, actual?: number | null) {
  const ai = parseSmeAiRecommendation(raw)
  if (!ai || (actual !== 1 && actual !== 2)) return 'unavailable'
  return ai.recommended === actual ? 'matched' : 'mismatched'
}

export function canShowStrategyAiRecommendation(status?: number | null) {
  return status != null && [776140007, 776140008, 776140009, 776140011, 776140012, 776140013, 776140014, 776140015].includes(status)
}

export function parseSmeAiRecommendation(raw: string | null | undefined) {
  if (!raw) return null
  try {
    const data = JSON.parse(raw)
    const quality = data?.score_inputs?.sme_review_quality
    const expectedDecision = String(quality?.ai_expected_sme_decision ?? '').trim().toLowerCase()
    const recommended = ['not recommended', 'not recommend'].includes(expectedDecision)
      ? 1
      : ['recommended', 'recommend'].includes(expectedDecision)
        ? 2
        : null
    if (!recommended) return null
    const reason = typeof quality?.ai_expected_decision_reason === 'string'
      ? quality.ai_expected_decision_reason
      : ''

    return { recommended: recommended as 1 | 2, reason, rejectionReason: null }
  } catch {
    return null
  }
}
