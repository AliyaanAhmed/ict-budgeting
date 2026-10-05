const visibleStatuses = new Set([776140007, 776140008, 776140009, 776140011, 776140012, 776140013, 776140014, 776140015])

export function SmeReviewScore({ status, score, variant = 'badge' }: { status?: number | null; score?: number | null; variant?: 'badge' | 'card' }) {
  if (!visibleStatuses.has(status ?? 0)) return null
  const displayScore = typeof score === 'number' && Number.isFinite(score) ? `${score}%` : 'Not Available'
  if (variant === 'card') {
    return (
      <div className="rounded-xl bg-[#F0FDFA] px-3 py-3 text-center dark:bg-teal-950/30">
        <p className="text-xs font-semibold text-[#64748B]">SME Review Score</p>
        <p className="text-lg font-bold tabular-nums text-[#0F766E] dark:text-teal-200">{displayScore}</p>
      </div>
    )
  }
  return (
    <span className="inline-flex flex-wrap items-center gap-2 rounded-xl border border-[#CDEFEA] bg-[#F0FDFA] px-3 py-2 text-xs font-semibold text-[#0F766E] dark:border-teal-800 dark:bg-teal-950/30 dark:text-teal-200">
      SME Review Score
      <span className="tabular-nums">{displayScore}</span>
    </span>
  )
}
