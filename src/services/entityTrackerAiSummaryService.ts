import type { Dga_ict_ai_summaries } from '@/generated/models/Dga_ict_ai_summariesModel'
import { Dga_ict_ai_summariesService } from '@/generated/services/Dga_ict_ai_summariesService'

export type EntityAiSummary = {
  id: string
  name: string | null
  referenceRecordId: string
  modifiedOn: string | null
  responseJson: string
  parsed: Record<string, unknown> | null
  isValid: boolean | null
}

function parseJsonObject(value: string | null | undefined): Record<string, unknown> | null {
  if (!value?.trim()) return null
  try {
    const parsed = JSON.parse(value)
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as Record<string, unknown> : null
  } catch {
    return null
  }
}

function extractOpenAiOutputJson(responseJson: string) {
  const wrapper = parseJsonObject(responseJson)
  if (!wrapper) return null

  if (Array.isArray(wrapper.output)) {
    for (const outputItem of wrapper.output) {
      if (!outputItem || typeof outputItem !== 'object') continue
      const content = (outputItem as Record<string, unknown>).content
      if (!Array.isArray(content)) continue
      for (const contentItem of content) {
        if (!contentItem || typeof contentItem !== 'object') continue
        const text = (contentItem as Record<string, unknown>).text
        const parsedText = typeof text === 'string' ? parseJsonObject(text) : null
        if (parsedText) return parsedText
      }
    }
  }

  return wrapper
}

function toEntityAiSummary(record: Dga_ict_ai_summaries): EntityAiSummary | null {
  if (!record.dga_ict_ai_summaryid || !record._dga_referencerecordid_value) return null
  const responseJson = typeof record.dga_response_json === 'string' ? record.dga_response_json : ''
  return {
    id: record.dga_ict_ai_summaryid,
    name: record.dga_name ?? null,
    referenceRecordId: record._dga_referencerecordid_value,
    modifiedOn: typeof record.modifiedon === 'string' ? record.modifiedon : null,
    responseJson,
    parsed: extractOpenAiOutputJson(responseJson),
    isValid: typeof record.dga_is_valid === 'boolean' ? record.dga_is_valid : null,
  }
}

const summarySelect = [
  'dga_ict_ai_summaryid',
  '_dga_referencerecordid_value',
  'dga_response_json',
  'dga_name',
  'dga_summary_category',
  'dga_summary_type',
  'dga_is_valid',
  'modifiedon',
  'createdon',
] as const

export async function getEntityAiSummariesByInstanceIds(instanceIds: string[]) {
  const summariesByInstance = new Map<string, EntityAiSummary>()
  const uniqueIds = Array.from(new Set(instanceIds.filter(Boolean)))
  const chunks = Array.from({ length: Math.ceil(uniqueIds.length / 15) }, (_, index) => uniqueIds.slice(index * 15, index * 15 + 15))
  if (!chunks.length) return summariesByInstance

  const results = await Promise.all(chunks.map((chunk) => Dga_ict_ai_summariesService.getAll({
    select: [...summarySelect],
    filter: `(${chunk.map((instanceId) => `_dga_referencerecordid_value eq ${instanceId}`).join(' or ')})`,
    orderBy: ['modifiedon desc', 'createdon desc'],
    maxPageSize: 500,
  })))

  results.flatMap((result) => result.data ?? []).map(toEntityAiSummary).forEach((summary) => {
    if (summary && !summariesByInstance.has(summary.referenceRecordId)) summariesByInstance.set(summary.referenceRecordId, summary)
  })
  return summariesByInstance
}

export function getCurrentCycleIdFromStorage() {
  if (typeof window === 'undefined') return null
  const rawCycle = window.sessionStorage.getItem('currentCycle')
  if (!rawCycle) return null
  try {
    const parsed = JSON.parse(rawCycle) as { id?: unknown }
    return typeof parsed.id === 'string' && parsed.id.trim() ? parsed.id.trim() : null
  } catch {
    return null
  }
}

export async function getCycleAiSummaryByCycleId(cycleId: string) {
  if (!cycleId) return null
  const result = await Dga_ict_ai_summariesService.getAll({
    select: [...summarySelect],
    filter: `_dga_referencerecordid_value eq ${cycleId}`,
    orderBy: ['modifiedon desc', 'createdon desc'],
    top: 1,
    maxPageSize: 1,
  })
  return result.data?.[0] ? toEntityAiSummary(result.data[0]) : null
}
