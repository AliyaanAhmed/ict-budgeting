import { useEffect, useState } from 'react'
import type { Project } from '@/domain/types'
import { projectService } from '@/services/projectService'

export function useRoleProjects(
  role: 'respondent' | 'reviewer' | 'approver',
  instanceId: string | null = null
) {
  const [items, setItems] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    const load = async () => {
      setLoading(true)
      setError(null)

      try {
        const data = role === 'respondent'
          ? await projectService.getRespondentProjects()
          : role === 'reviewer'
            ? await projectService.getReviewerProjects()
            : await projectService.getApproverProjects()

        if (mounted) {
          setItems(data)
        }
      } catch (loadError) {
        if (mounted) {
          setItems([])
          setError(loadError instanceof Error ? loadError.message : 'Unable to load projects.')
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
  }, [role, instanceId])

  return { items, loading, error }
}
