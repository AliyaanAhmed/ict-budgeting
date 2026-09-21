import { useEffect, useState } from 'react'
import type { PortfolioRole, PortfolioSummaryRecord } from '@/services/portfolioSummaryService'
import {
  getLatestPortfolioSummaryByCurrentInstance,
  getLatestPlanningPortfolioSummaryByCurrentInstance,
} from '@/services/portfolioSummaryService'

export function usePortfolioSummary(_role: PortfolioRole, instanceId: string | null = null) {
  const [record, setRecord] = useState<PortfolioSummaryRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    const load = async () => {
      setLoading(true)
      setError(null)

      try {
        const latest =
          (await getLatestPlanningPortfolioSummaryByCurrentInstance()) ??
          (await getLatestPortfolioSummaryByCurrentInstance())
        if (mounted) {
          setRecord(latest)
        }
      } catch (loadError) {
        if (mounted) {
          setRecord(null)
          setError(loadError instanceof Error ? loadError.message : 'Unable to load AI portfolio summary.')
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    void load()

    return () => {
      mounted = false
    }
  }, [instanceId])

  return {
    record,
    summary: record?.parsedSummary ?? null,
    loading,
    error,
  }
}
