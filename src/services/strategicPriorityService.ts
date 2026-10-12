import { Dga_strategic_prioritiesesService } from '@/generated/services/Dga_strategic_prioritiesesService'

export interface StrategicPriorityOption {
  id: string
  name: string
  parentId: string | null
  parentName: string | null
}

const SELECT_FIELDS = [
  'dga_strategic_prioritiesid',
  'dga_name',
  '_dga_parent_strategic_priorities_value',
]

export async function getStrategicPriorityOptions() {
  const result = await Dga_strategic_prioritiesesService.getAll({
    select: SELECT_FIELDS,
    orderBy: ['dga_name asc'],
  })

  return (result.data ?? [])
    .map((record) => {
      const id = record.dga_strategic_prioritiesid
      const name = record.dga_name

      if (!id || !name) {
        return null
      }

      return {
        id,
        name,
        parentId: record._dga_parent_strategic_priorities_value ?? null,
        parentName: record.dga_parent_strategic_prioritiesname ?? null,
      } satisfies StrategicPriorityOption
    })
    .filter((record): record is StrategicPriorityOption => record !== null)
}

