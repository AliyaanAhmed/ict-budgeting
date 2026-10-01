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
    const mode = String(quality?.scoring_mode ?? '').trim().toLowerCase()
    const recommended = mode === 'rejection' ? 1 : ['recommendation', 'recommended'].includes(mode) ? 2 : null
    if (!recommended) return null
    const reason = typeof quality.reason === 'string' ? quality.reason :
      quality.criteria?.rejection_decision_correctness?.reason ?? ''
    // Actual SME values are historical decisions, not AI suggestions.
    const category = String(quality.suggested_rejection_reason ?? quality.rejection_reason ?? quality.reason ?? '').trim().toLowerCase()
    const rejectionReason = category === 'not advised' ? 1 : category === 'not ict related' ? 2 : category === 'no evidence provided' ? 3 : null
    return { recommended: recommended as 1 | 2, reason: typeof reason === 'string' ? reason : '', rejectionReason: rejectionReason as 1 | 2 | 3 | null }
  } catch {
    return null
  }
}
