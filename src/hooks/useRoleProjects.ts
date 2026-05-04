import { useEffect, useState } from 'react'
import type { Project } from '@/domain/types'
import { projectService } from '@/services/projectService'

export function useRoleProjects(role: 'respondent' | 'reviewer', search: string, tab: string) {
  const [items, setItems] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const load = async () => {
      setLoading(true)
      const status = projectService.buildRoleStatusFilter(role, tab)
      const filters = { search, status }
      const data = role === 'respondent'
        ? await projectService.getRespondentProjects(filters)
        : await projectService.getReviewerProjects(filters)

      if (mounted) {
        setItems(data)
        setLoading(false)
      }
    }

    void load()

    return () => {
      mounted = false
    }
  }, [role, search, tab])

  return { items, loading }
}
