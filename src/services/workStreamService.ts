import type { Dga_work_streamsBase } from '@/generated/models/Dga_work_streamsModel'
import { Dga_work_streamsService } from '@/generated/services/Dga_work_streamsService'

export interface WorkStreamOption {
  id: string
  name: string
}

export async function getWorkStreamOptions() {
  const result = await Dga_work_streamsService.getAll({
    select: ['dga_work_streamid', 'dga_name'],
    orderBy: ['dga_name asc'],
  })

  return (result.data ?? [])
    .map((record) => {
      if (!record.dga_work_streamid || !record.dga_name) {
        return null
      }

      return {
        id: record.dga_work_streamid,
        name: record.dga_name,
      } satisfies WorkStreamOption
    })
    .filter((record): record is WorkStreamOption => record !== null)
}

export async function createWorkStream(name: string) {
  const result = await Dga_work_streamsService.create({
    dga_name: name.trim(),
  } as Partial<Omit<Dga_work_streamsBase, 'dga_work_streamid'>> as Omit<
    Dga_work_streamsBase,
    'dga_work_streamid'
  >)

  const created = result.data
  if (!created?.dga_work_streamid || !created.dga_name) {
    throw new Error('Work stream was created, but the response was incomplete.')
  }

  return {
    id: created.dga_work_streamid,
    name: created.dga_name,
  } satisfies WorkStreamOption
}

