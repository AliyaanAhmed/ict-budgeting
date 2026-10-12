import { createContext, useCallback, useContext, useState } from 'react'
import type { ReactNode } from 'react'
import { Dga_ict_budgetsService } from '@/generated/services/Dga_ict_budgetsService'

interface QueueCounts {
  reviewCount: number | null
  approvalCount: number | null
  setReviewCount: (n: number) => void
  setApprovalCount: (n: number) => void
  refreshReviewCount: () => Promise<number>
  refreshApprovalCount: () => Promise<number>
}

const QueueCountsContext = createContext<QueueCounts>({
  reviewCount: null,
  approvalCount: null,
  setReviewCount: () => {},
  setApprovalCount: () => {},
  refreshReviewCount: async () => 0,
  refreshApprovalCount: async () => 0,
})

export function QueueCountsProvider({ children }: { children: ReactNode }) {
  const [reviewCount, setReviewCount] = useState<number | null>(null)
  const [approvalCount, setApprovalCount] = useState<number | null>(null)
  const refreshReviewCount = useCallback(async () => {
    const result = await Dga_ict_budgetsService.getAll({
      select: ['dga_ict_budgetid'],
      filter: 'dga_status_for_adge eq 2',
    })
    const nextCount = result.data?.length ?? 0
    setReviewCount(nextCount)
    return nextCount
  }, [])

  const refreshApprovalCount = useCallback(async () => {
    const result = await Dga_ict_budgetsService.getAll({
      select: ['dga_ict_budgetid'],
      filter: 'dga_status_for_adge eq 3',
    })
    const nextCount = result.data?.length ?? 0
    setApprovalCount(nextCount)
    return nextCount
  }, [])

  return (
    <QueueCountsContext.Provider
      value={{
        reviewCount,
        approvalCount,
        setReviewCount,
        setApprovalCount,
        refreshReviewCount,
        refreshApprovalCount,
      }}
    >
      {children}
    </QueueCountsContext.Provider>
  )
}

export function useQueueCounts() {
  return useContext(QueueCountsContext)
}
