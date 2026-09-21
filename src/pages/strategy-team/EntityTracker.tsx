import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, CalendarPlus, Check, ChevronDown, Clock3, CircleCheckBig, Route, Search, Sparkles, Waypoints } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { DatePickerField } from '@/components/shared/DatePickerField'
import { cn } from '@/lib/utils'
import { useCycle } from '@/context/CycleContext'
import { useToast } from '@/context/ToastContext'
import { StrategyPageShell, StrategyPill } from './StrategyTeamShell'
import { Dga_ict_ai_summariesService } from '@/generated/services/Dga_ict_ai_summariesService'
import type { Dga_ict_ai_summaries } from '@/generated/models/Dga_ict_ai_summariesModel'
import {
  DGE_BUDGET_STATUS,
  DGE_INSTANCE_STATUS,
  extendDgePortfolioInstances,
  getBudgetStageBucket,
  getDgePortfolioData,
  getInstanceStageFilterLabel,
  type DgeInstanceRecord,
} from '@/services/dgePortfolioService'

const stages = ['All Stages', 'Planning', 'DGE Review', 'Allocation', 'Utilization'] as const
const stepStages = ['Planning', 'DGE Review', 'Review Completed', 'Allocation', 'Utilization'] as const
type ExtendMode = 'allocation' | 'utilization'
type EntityAiSummary = {
  id: string
  name: string | null
  referenceRecordId: string
  modifiedOn: string | null
  responseJson: string
  parsed: Record<string, unknown> | null
}

const stepIcons = {
  Planning: Clock3,
  'DGE Review': Route,
  'Review Completed': CircleCheckBig,
  Allocation: Waypoints,
  Utilization: ArrowRight,
} as const

function SkeletonBlock({ className }: { className: string }) {
  return <div className={cn('animate-pulse rounded-2xl bg-[#EAF0F6] dark:bg-white/10', className)} />
}

function chunkArray<T>(items: T[], size: number) {
  const chunks: T[][] = []
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size))
  }
  return chunks
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

function getNestedObject(source: Record<string, unknown> | null, path: string[]) {
  let current: unknown = source
  for (const key of path) {
    if (!current || typeof current !== 'object' || Array.isArray(current)) return null
    current = (current as Record<string, unknown>)[key]
  }
  return current && typeof current === 'object' && !Array.isArray(current) ? current as Record<string, unknown> : null
}

function getProjectIds(source: Record<string, unknown> | null, path: string[]) {
  const node = getNestedObject(source, path)
  const projectIds = node?.project_ids
  return Array.isArray(projectIds) ? projectIds.filter((item): item is string => typeof item === 'string') : []
}

function getStringValue(source: Record<string, unknown> | null, path: string[]) {
  let current: unknown = source
  for (const key of path) {
    if (!current || typeof current !== 'object' || Array.isArray(current)) return ''
    current = (current as Record<string, unknown>)[key]
  }
  return typeof current === 'string' ? current.trim() : ''
}

function getStringArray(source: Record<string, unknown> | null, path: string[]) {
  let current: unknown = source
  for (const key of path) {
    if (!current || typeof current !== 'object' || Array.isArray(current)) return []
    current = (current as Record<string, unknown>)[key]
  }
  return Array.isArray(current) ? current.filter((item): item is string => typeof item === 'string' && item.trim().length > 0) : []
}

function getHighlightTemplates(source: Record<string, unknown> | null) {
  const highlights = source?.cycle_highlights
  if (!Array.isArray(highlights)) return []
  const values = getTemplateValueMap(source)

  return highlights
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      const highlight = item as Record<string, unknown>
      const includeWhen = highlight.include_when
      if (includeWhen && typeof includeWhen === 'object') {
        const condition = includeWhen as Record<string, unknown>
        const metric = typeof condition.metric === 'string' ? condition.metric : ''
        const operator = typeof condition.operator === 'string' ? condition.operator : ''
        const value = typeof condition.value === 'number' ? condition.value : 0
        const current = values[metric as keyof typeof values] ?? 0
        const shouldInclude =
          operator === '>'
            ? current > value
            : operator === '>='
              ? current >= value
              : operator === '<'
                ? current < value
                : operator === '<='
                  ? current <= value
                  : operator === '=='
                    ? current === value
                    : true
        if (!shouldInclude) return null
      }

      return highlight.text_template
    })
    .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
}

function getTemplateValueMap(source: Record<string, unknown> | null) {
  const calculationSources = getNestedObject(source, ['calculation_sources'])
  const planning = getNestedObject(calculationSources, ['planning'])
  const allocation = getNestedObject(calculationSources, ['allocation'])
  const utilization = getNestedObject(calculationSources, ['utilization'])
  const entityIds = calculationSources?.entity_ids

  return {
    total_entity_count: Array.isArray(entityIds) ? entityIds.length : 0,
    submitted_to_dge_count: getStringArray(planning, ['submitted_to_dge_entity_ids']).length,
    not_submitted_to_dge_count: getStringArray(planning, ['not_submitted_to_dge_entity_ids']).length,
    under_dge_review_count: getStringArray(planning, ['under_dge_review_entity_ids']).length,
    dge_review_completed_count: getStringArray(planning, ['dge_review_completed_entity_ids']).length,
    currently_in_allocation_count: getStringArray(allocation, ['currently_in_allocation_entity_ids']).length,
    allocation_not_started_count: getStringArray(allocation, ['not_started_entity_ids']).length,
    allocation_in_progress_count: getStringArray(allocation, ['in_progress_entity_ids']).length,
    allocation_with_approver_count: getStringArray(allocation, ['with_approver_entity_ids']).length,
    allocation_partially_completed_count: getStringArray(allocation, ['partially_completed_entity_ids']).length,
    allocation_completed_count: getStringArray(allocation, ['completed_entity_ids']).length,
    currently_in_utilization_count: getStringArray(utilization, ['currently_in_utilization_entity_ids']).length,
    utilization_in_progress_count: getStringArray(utilization, ['in_progress_entity_ids']).length,
    utilization_partially_completed_count: getStringArray(utilization, ['partially_completed_entity_ids']).length,
    utilization_completed_count: getStringArray(utilization, ['completed_entity_ids']).length,
  }
}

function resolveSummaryTemplate(template: string, source: Record<string, unknown> | null) {
  const values = getTemplateValueMap(source)
  return template.replace(/\{([^}]+)\}/g, (_, key: string) => String(values[key as keyof typeof values] ?? 0))
}

function extractOpenAiOutputJson(responseJson: string) {
  const wrapper = parseJsonObject(responseJson)
  if (!wrapper) return null

  const output = wrapper.output
  if (Array.isArray(output)) {
    for (const outputItem of output) {
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
  }
}

async function getEntityAiSummariesByInstanceIds(instanceIds: string[]) {
  const summariesByInstance = new Map<string, EntityAiSummary>()
  const uniqueInstanceIds = Array.from(new Set(instanceIds.filter(Boolean)))
  if (!uniqueInstanceIds.length) return summariesByInstance

  const chunks = chunkArray(uniqueInstanceIds, 15)
  const results = await Promise.all(
    chunks.map((chunk) =>
      Dga_ict_ai_summariesService.getAll({
        select: [
          'dga_ict_ai_summaryid',
          '_dga_referencerecordid_value',
          'dga_response_json',
          'dga_name',
          'dga_summary_category',
          'dga_summary_type',
          'modifiedon',
          'createdon',
        ],
        filter: `(${chunk.map((instanceId) => `_dga_referencerecordid_value eq ${instanceId}`).join(' or ')})`,
        orderBy: ['modifiedon desc', 'createdon desc'],
        maxPageSize: 500,
      })
    )
  )

  results
    .flatMap((result) => result.data ?? [])
    .map(toEntityAiSummary)
    .filter((summary): summary is EntityAiSummary => Boolean(summary))
    .forEach((summary) => {
      if (!summariesByInstance.has(summary.referenceRecordId)) {
        summariesByInstance.set(summary.referenceRecordId, summary)
      }
    })

  return summariesByInstance
}

function getCurrentCycleIdFromStorage() {
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

async function getCycleAiSummaryByCycleId(cycleId: string) {
  if (!cycleId) return null

  const result = await Dga_ict_ai_summariesService.getAll({
    select: [
      'dga_ict_ai_summaryid',
      '_dga_referencerecordid_value',
      'dga_response_json',
      'dga_name',
      'dga_summary_category',
      'dga_summary_type',
      'modifiedon',
      'createdon',
    ],
    filter: `_dga_referencerecordid_value eq ${cycleId}`,
    orderBy: ['modifiedon desc', 'createdon desc'],
    top: 1,
    maxPageSize: 1,
  })

  const record = result.data?.[0]
  return record ? toEntityAiSummary(record) : null
}

function getActiveStepIndex(instance: DgeInstanceRecord) {
  const stage = getInstanceStageFilterLabel(instance.statuscode)
  if (stage === 'Planning') return 0
  if (stage === 'DGE Review') {
    return instance.statusLabel === 'Review Completed' ? 2 : 1
  }
  if (stage === 'Allocation') return 3
  if (stage === 'Utilization') return 4
  return 0
}

function parseDeadlineDate(value: string | null | undefined) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  date.setHours(0, 0, 0, 0)
  return date
}

function formatLongDate(value: string | null | undefined) {
  const date = parseDeadlineDate(value)
  if (!date) return null
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
}

function getDeadlineDays(value: string | null | undefined) {
  const date = parseDeadlineDate(value)
  if (!date) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.ceil((date.getTime() - today.getTime()) / 86_400_000)
}

function getEntityDeadline(instance: DgeInstanceRecord) {
  const phase = getInstanceStageFilterLabel(instance.statuscode)
  if (phase === 'Planning') return instance.submissionDate
  if (phase === 'DGE Review') return instance.allocationStartDate
  if (phase === 'Allocation') return instance.allocationEndDate
  if (phase === 'Utilization') return instance.utilizationEndDate
  return null
}

function getExtensionCapsuleLabel(instance: DgeInstanceRecord) {
  const phase = getInstanceStageFilterLabel(instance.statuscode)
  if (phase === 'Allocation' && instance.extensionProvidedInAllocation === 2) return 'Allocation Extended'
  if (phase === 'Utilization' && instance.extensionProvidedInUtilization === 2) return 'Utilization Extended'
  return null
}

function getEntityInitials(instance: DgeInstanceRecord) {
  const source = (instance.entityAbbr || instance.entityName || instance.name).trim()
  if (!source) return '--'

  const words = source.split(/\s+/).filter(Boolean)
  if (words.length >= 2) {
    return `${words[0][0] ?? ''}${words[1][0] ?? ''}`.toUpperCase()
  }

  return source.replace(/[^a-zA-Z0-9]/g, '').slice(0, 2).toUpperCase() || '--'
}

function getEntityProjectPhaseParam(instance: DgeInstanceRecord) {
  const phase = getInstanceStageFilterLabel(instance.statuscode)
  if (phase === 'Planning') return 'planning'
  if (phase === 'DGE Review') return 'dge-review'
  if (phase === 'Allocation') return 'allocation'
  if (phase === 'Utilization') return 'utilization'
  return 'planning'
}

function formatRemaining(days: number | null) {
  if (days === null) return null
  if (days < 0) return `${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} overdue`
  return `${days} day${days === 1 ? '' : 's'} remaining`
}

function formatCurrency(amount: number) {
  return `AED ${amount.toLocaleString('en-AE')}`
}

function countStatuses(instance: DgeInstanceRecord, statuses: number[]) {
  return instance.budgets.filter((budget) => statuses.includes(budget.statuscode)).length
}

function sumBudgetField(instance: DgeInstanceRecord, field: 'requestedBudget' | 'recommendedBudget' | 'allocatedBudget' | 'utilizedBudget' | 'utilizedBudgetQ1' | 'utilizedBudgetQ2' | 'utilizedBudgetQ3' | 'utilizedBudgetQ4') {
  return instance.budgets.reduce((sum, budget) => sum + (budget[field] ?? 0), 0)
}

function getEntityPhaseStats(instance: DgeInstanceRecord) {
  const phase = getInstanceStageFilterLabel(instance.statuscode)

  if (phase === 'DGE Review') {
    return [
      { label: 'Strategic Alignment', value: countStatuses(instance, [DGE_BUDGET_STATUS.underStrategicAlignmentReview]) },
      { label: 'SME Review', value: countStatuses(instance, [DGE_BUDGET_STATUS.underSmeReview]) },
      { label: 'Quality Check', value: countStatuses(instance, [DGE_BUDGET_STATUS.underQualityCheck]) },
      { label: 'Director Review', value: countStatuses(instance, [DGE_BUDGET_STATUS.underFinalReview]) },
      { label: 'Requested Budget', value: formatCurrency(sumBudgetField(instance, 'requestedBudget')) },
      { label: 'Recommended Budget', value: formatCurrency(sumBudgetField(instance, 'recommendedBudget')) },
    ]
  }

  if (phase === 'Allocation') {
    return [
      { label: 'Allocation In Progress', value: countStatuses(instance, [DGE_BUDGET_STATUS.allocationInProgress]) },
      { label: 'Allocation In Review', value: countStatuses(instance, [DGE_BUDGET_STATUS.allocationInReview]) },
      { label: 'Allocation Completed', value: countStatuses(instance, [DGE_BUDGET_STATUS.allocationCompleted]) },
      { label: 'Requested Budget', value: formatCurrency(sumBudgetField(instance, 'requestedBudget')) },
      { label: 'Recommended Budget', value: formatCurrency(sumBudgetField(instance, 'recommendedBudget')) },
      { label: 'Allocated Budget', value: formatCurrency(sumBudgetField(instance, 'allocatedBudget')) },
    ]
  }

  if (phase === 'Utilization') {
    const enteredCount = instance.budgets.filter(
      (budget) => budget.utilizedBudget > 0 || budget.statuscode === DGE_BUDGET_STATUS.utilizationCompleted
    ).length

    return [
      { label: 'Utilization Entered', value: `${enteredCount} / ${instance.budgets.length}` },
      { label: 'Q1 Utilization', value: formatCurrency(sumBudgetField(instance, 'utilizedBudgetQ1')) },
      { label: 'Q2 Utilization', value: formatCurrency(sumBudgetField(instance, 'utilizedBudgetQ2')) },
      { label: 'Q3 Utilization', value: formatCurrency(sumBudgetField(instance, 'utilizedBudgetQ3')) },
      { label: 'Q4 Utilization', value: formatCurrency(sumBudgetField(instance, 'utilizedBudgetQ4')) },
      { label: 'Recommended Budget', value: formatCurrency(sumBudgetField(instance, 'recommendedBudget')) },
      { label: 'Allocated Budget', value: formatCurrency(sumBudgetField(instance, 'allocatedBudget')) },
      { label: 'Utilization Budget', value: formatCurrency(sumBudgetField(instance, 'utilizedBudget')) },
    ]
  }

  return [
    { label: 'Draft', value: countStatuses(instance, [DGE_BUDGET_STATUS.draft]) },
    { label: 'Review', value: countStatuses(instance, [DGE_BUDGET_STATUS.underReviewerReview, DGE_BUDGET_STATUS.reviewerReviewCompleted]) },
    { label: 'Approval', value: countStatuses(instance, [DGE_BUDGET_STATUS.underApproverReview, DGE_BUDGET_STATUS.approvedByApprover]) },
    { label: 'Requested Budget', value: formatCurrency(sumBudgetField(instance, 'requestedBudget')) },
  ]
}

function getEntityAiInsightRows(summary: EntityAiSummary | null) {
  const parsed = summary?.parsed
  if (!parsed) return []

  const highRiskProjects = getProjectIds(parsed, ['portfolio_statistics', 'issue_severity', 'high'])
  const evidenceRiskProjects = getProjectIds(parsed, ['portfolio_statistics', 'ai_review_flags', 'evidence_risk'])
  const strategicRiskProjects = getProjectIds(parsed, ['portfolio_statistics', 'ai_review_flags', 'strategic_alignment_risk'])
  const clarificationProjects = getProjectIds(parsed, ['portfolio_statistics', 'clarification', 'attention_union'])
  const recommendedActions = parsed.recommended_next_actions
  const firstAction =
    Array.isArray(recommendedActions)
      ? recommendedActions
          .map((item) => (item && typeof item === 'object' ? (item as Record<string, unknown>).text : null))
          .find((text): text is string => typeof text === 'string' && text.trim().length > 0)
      : null

  return [
    {
      label: 'High Severity',
      count: highRiskProjects.length,
      text:
        highRiskProjects.length > 0
          ? `${highRiskProjects.length} project${highRiskProjects.length === 1 ? '' : 's'} have high-severity AI findings and should be prioritized for governance follow-up.`
          : 'No high-severity AI findings are currently reported for this entity.',
    },
    {
      label: 'Evidence Risk',
      count: evidenceRiskProjects.length,
      text:
        evidenceRiskProjects.length > 0
          ? `${evidenceRiskProjects.length} project${evidenceRiskProjects.length === 1 ? '' : 's'} have evidence gaps or weak supporting documentation.`
          : 'No evidence-risk projects are currently reported for this entity.',
    },
    {
      label: 'Strategic Alignment Risk',
      count: strategicRiskProjects.length,
      text:
        strategicRiskProjects.length > 0
          ? `${strategicRiskProjects.length} project${strategicRiskProjects.length === 1 ? '' : 's'} may need strategic priority or classification correction.`
          : 'No strategic alignment risks are currently reported for this entity.',
    },
    {
      label: 'Clarification Attention',
      count: clarificationProjects.length,
      text:
        clarificationProjects.length > 0
          ? `${clarificationProjects.length} project${clarificationProjects.length === 1 ? '' : 's'} either have clarifications raised or are likely to need clarification.`
          : 'No clarification attention items are currently reported for this entity.',
    },
    firstAction
      ? {
          label: 'Recommended Action',
          count: null,
          text: firstAction,
        }
      : null,
  ].filter((item): item is { label: string; count: number | null; text: string } => Boolean(item))
}

function EntityAiPortfolioInsights({
  entity,
  summary,
  loading,
  error,
}: {
  entity: DgeInstanceRecord
  summary: EntityAiSummary | null
  loading: boolean
  error: string | null
}) {
  const rows = getEntityAiInsightRows(summary)

  return (
    <div className="rounded-[20px] border border-[#E9D5FF] bg-[#FDF8FF] p-4 dark:border-white/10 dark:bg-[#2A123D]">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#A855F7] text-white shadow-[0_12px_24px_rgba(168,85,247,0.24)]">
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-[#0F172A] dark:text-white">AI Portfolio Insights</p>
            {summary?.name ? (
              <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-[#A855F7] dark:bg-white/10 dark:text-[#E9D5FF]">
                {summary.name}
              </span>
            ) : null}
          </div>
          <p className="text-xs text-[#64748B] dark:text-slate-300">{entity.name}</p>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {loading ? (
          Array.from({ length: 3 }).map((_, index) => (
            <SkeletonBlock key={index} className="h-[58px] rounded-[16px] bg-white/80 dark:bg-white/10" />
          ))
        ) : error ? (
          <div className="rounded-[16px] border border-[#FECACA] bg-white px-3 py-2.5 text-sm leading-6 text-[#B91C1C] dark:border-[#7F1D1D] dark:bg-white/5 dark:text-[#FCA5A5]">
            {error}
          </div>
        ) : rows.length > 0 ? (
          rows.slice(0, 5).map((insight) => (
            <div key={`${insight.label}-${insight.text}`} className="flex items-start gap-2 rounded-[16px] border border-[#E9D5FF] bg-white px-3 py-2.5 dark:border-white/10 dark:bg-white/5">
              <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#A855F7]" />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-[#0F172A] dark:text-white">{insight.label}</p>
                  {typeof insight.count === 'number' ? (
                    <span className="rounded-full border border-[#E2E8F0] bg-[#F8FBFF] px-2 py-0.5 text-[11px] font-semibold text-[#475569] dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                      {insight.count}
                    </span>
                  ) : null}
                </div>
                <p className="mt-0.5 text-sm leading-6 text-[#475569] dark:text-slate-200">{insight.text}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-[16px] border border-[#E9D5FF] bg-white px-3 py-2.5 dark:border-white/10 dark:bg-white/5">
            <p className="text-sm font-semibold text-[#0F172A] dark:text-white">No AI summary yet</p>
            <p className="mt-1 text-sm leading-6 text-[#64748B] dark:text-slate-300">
              AI portfolio insights have not been generated for this entity yet.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function formatShortDate(value: string | null | undefined) {
  const date = parseDeadlineDate(value)
  if (!date) return '-'
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function getModeEndDate(instance: DgeInstanceRecord, mode: ExtendMode) {
  return mode === 'allocation' ? instance.allocationEndDate : instance.utilizationEndDate
}

function isNewDateLater(newDate: string, currentDate: string | null | undefined) {
  const next = parseDeadlineDate(newDate)
  const current = parseDeadlineDate(currentDate)
  if (!next || !current) return false
  return next.getTime() > current.getTime()
}

function ExtendPortfolioModal({
  open,
  onOpenChange,
  instances,
  onExtended,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  instances: DgeInstanceRecord[]
  onExtended: () => Promise<void>
}) {
  const { runActionToast } = useToast()
  const [mode, setMode] = useState<ExtendMode>('allocation')
  const [newEndDate, setNewEndDate] = useState('')
  const [reason, setReason] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [validationMessage, setValidationMessage] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setSelectedIds([])
    setSearchTerm('')
    setValidationMessage(null)
  }, [mode])

  useEffect(() => {
    if (!open) {
      setMode('allocation')
      setNewEndDate('')
      setReason('')
      setSearchTerm('')
      setSelectedIds([])
      setValidationMessage(null)
      setSaving(false)
    }
  }, [open])

  const modeInstances = useMemo(
    () =>
      instances.filter((instance) =>
        mode === 'allocation'
          ? instance.statuscode === DGE_INSTANCE_STATUS.allocation
          : instance.statuscode === DGE_INSTANCE_STATUS.utilization
      ),
    [instances, mode]
  )

  const filteredInstances = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()
    if (!normalizedSearch) return modeInstances
    return modeInstances.filter(
      (instance) =>
        instance.name.toLowerCase().includes(normalizedSearch) ||
        instance.entityName.toLowerCase().includes(normalizedSearch) ||
        instance.entityAbbr.toLowerCase().includes(normalizedSearch)
    )
  }, [modeInstances, searchTerm])

  const selectedInstances = useMemo(
    () => modeInstances.filter((instance) => selectedIds.includes(instance.id)),
    [modeInstances, selectedIds]
  )

  const toggleSelected = (instanceId: string) => {
    setSelectedIds((current) =>
      current.includes(instanceId) ? current.filter((id) => id !== instanceId) : [...current, instanceId]
    )
    setValidationMessage(null)
  }

  const validate = () => {
    if (selectedInstances.length === 0) return 'Select at least one entity to extend.'
    if (!newEndDate) return `New ${mode === 'allocation' ? 'allocation' : 'utilization'} end date is required.`
    if (!reason.trim()) return 'Reason is required.'

    const missingCurrentDate = selectedInstances.find((instance) => !getModeEndDate(instance, mode))
    if (missingCurrentDate) {
      return `${missingCurrentDate.entityName || missingCurrentDate.name} does not have a current ${mode === 'allocation' ? 'allocation' : 'utilization'} end date.`
    }

    const invalidDateEntity = selectedInstances.find((instance) => !isNewDateLater(newEndDate, getModeEndDate(instance, mode)))
    if (invalidDateEntity) {
      return `New end date must be later than the current end date for ${invalidDateEntity.entityName || invalidDateEntity.name}.`
    }

    return null
  }

  const handleSubmit = async () => {
    const validation = validate()
    if (validation) {
      setValidationMessage(validation)
      return
    }

    setSaving(true)
    try {
      await runActionToast(
        async () => {
          await extendDgePortfolioInstances(mode, selectedInstances, newEndDate, reason)
          await onExtended()
        },
        {
          processingTitle: 'Extending portfolio',
          processingDescription: `Updating ${selectedInstances.length} ${selectedInstances.length === 1 ? 'entity' : 'entities'}.`,
          successTitle: 'Portfolio extended',
          successDescription: `${mode === 'allocation' ? 'Allocation' : 'Utilization'} end date updated successfully.`,
          errorTitle: 'Extension failed',
          minDurationMs: 1200,
        }
      )
      onOpenChange(false)
    } catch (submitError) {
      setValidationMessage(submitError instanceof Error ? submitError.message : 'Unable to extend portfolio.')
    } finally {
      setSaving(false)
    }
  }

  const modeLabel = mode === 'allocation' ? 'Allocation' : 'Utilization'
  const currentDateLabel = mode === 'allocation' ? 'Allocation dates' : 'Utilization dates'

  return (
    <Dialog open={open} onOpenChange={saving ? undefined : onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-5xl overflow-hidden rounded-[30px] border border-[#D9E6F5] bg-white p-0 shadow-[0_28px_70px_rgba(15,23,42,0.18)] dark:border-white/10 dark:bg-[#162339]">
        <div className="border-b border-[#EEF3F8] px-6 py-5 dark:border-white/10">
          <DialogHeader className="pr-12">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#EEF5FF] text-[#286CFF] dark:bg-[#286CFF]/15 dark:text-[#BFDBFE]">
                <CalendarPlus className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-xl font-semibold text-[#0F172A] dark:text-white">Extend Portfolio</DialogTitle>
                <DialogDescription className="mt-1 text-sm leading-6 text-[#64748B] dark:text-slate-300">
                  Select entities and apply a new phase end date with an extension reason.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="max-h-[calc(90vh-154px)] overflow-y-auto px-6 py-5">
          <div className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
            <div className="space-y-4">
              <div className="rounded-[20px] border border-[#DDEBFF] bg-[#F8FBFF] p-4 dark:border-white/10 dark:bg-white/5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-[#0F172A] dark:text-white">{modeLabel} extension</p>
                    <p className="mt-1 text-xs leading-5 text-[#64748B] dark:text-slate-300">Switch between portfolio phases.</p>
                  </div>
                  <div className="flex items-center gap-2 rounded-full border border-[#DDEBFF] bg-white px-3 py-2 dark:border-white/10 dark:bg-[#162339]">
                    <span className={cn('text-xs font-semibold', mode === 'allocation' ? 'text-[#286CFF]' : 'text-[#64748B] dark:text-slate-300')}>
                      Allocation
                    </span>
                    <Switch
                      checked={mode === 'utilization'}
                      onCheckedChange={(checked) => setMode(checked ? 'utilization' : 'allocation')}
                      disabled={saving}
                    />
                    <span className={cn('text-xs font-semibold', mode === 'utilization' ? 'text-[#286CFF]' : 'text-[#64748B] dark:text-slate-300')}>
                      Utilization
                    </span>
                  </div>
                </div>
              </div>

              <DatePickerField
                id="portfolio-extension-date"
                label={`New ${modeLabel} End Date`}
                value={newEndDate}
                required
                disabled={saving}
                onChange={(value) => {
                  setNewEndDate(value)
                  setValidationMessage(null)
                }}
              />

              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#0F172A] dark:text-white" htmlFor="portfolio-extension-reason">
                  Reason <span className="text-[#EA4F49]">*</span>
                </label>
                <Textarea
                  id="portfolio-extension-reason"
                  value={reason}
                  onChange={(event) => {
                    setReason(event.target.value)
                    setValidationMessage(null)
                  }}
                  disabled={saving}
                  placeholder={`Enter ${modeLabel.toLowerCase()} extension reason`}
                  className="min-h-[150px] rounded-xl"
                />
              </div>

              {validationMessage ? (
                <div className="rounded-2xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm leading-6 text-[#B91C1C] dark:border-[#7F1D1D] dark:bg-[#3A1717] dark:text-[#FCA5A5]">
                  {validationMessage}
                </div>
              ) : null}
            </div>

            <div className="space-y-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#0F172A] dark:text-white">Entities</p>
                  <p className="mt-1 text-xs text-[#64748B] dark:text-slate-300">
                    {selectedInstances.length} selected from {modeInstances.length} {modeLabel.toLowerCase()} entities
                  </p>
                </div>
                <div className="relative sm:w-[260px]">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
                  <Input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Search entity..."
                    disabled={saving}
                    className="h-10 rounded-xl pl-9"
                  />
                </div>
              </div>

              <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
                {filteredInstances.length === 0 ? (
                  <div className="rounded-[18px] border border-dashed border-[#CFE0F5] bg-[#F8FBFF] px-4 py-8 text-center text-sm text-[#64748B] dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                    No {modeLabel.toLowerCase()} entities found.
                  </div>
                ) : (
                  filteredInstances.map((instance) => {
                    const selected = selectedIds.includes(instance.id)
                    return (
                      <button
                        key={instance.id}
                        type="button"
                        onClick={() => toggleSelected(instance.id)}
                        disabled={saving}
                        className={cn(
                          'flex w-full items-start gap-3 rounded-[18px] border px-4 py-3 text-left transition-colors',
                          selected
                            ? 'border-[#286CFF] bg-[#EEF5FF] dark:border-[#4F98FF] dark:bg-[#286CFF]/15'
                            : 'border-[#EAF0F6] bg-white hover:border-[#BFD8FF] hover:bg-[#F8FBFF] dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10'
                        )}
                      >
                        <span
                          className={cn(
                            'mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border leading-none',
                            selected ? 'border-[#286CFF] bg-[#286CFF] text-white' : 'border-[#CBD5E1] bg-white dark:bg-[#162339]'
                          )}
                        >
                          {selected ? <Check className="block h-3.5 w-3.5" strokeWidth={3} /> : null}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-center gap-2">
                            <span className="truncate text-sm font-semibold text-[#0F172A] dark:text-white">{instance.entityName || instance.name}</span>
                            <StrategyPill tone={mode === 'allocation' ? 'amber' : 'teal'}>{instance.statusLabel}</StrategyPill>
                          </span>
                          <span className="mt-1 block text-xs leading-5 text-[#64748B] dark:text-slate-300">
                            {instance.entityAbbr || instance.name.slice(0, 3).toUpperCase()} · {currentDateLabel}:{' '}
                            {mode === 'allocation'
                              ? `${formatShortDate(instance.allocationStartDate)} to ${formatShortDate(instance.allocationEndDate)}`
                              : `${formatShortDate(instance.utilizationStartDate)} to ${formatShortDate(instance.utilizationEndDate)}`}
                          </span>
                        </span>
                      </button>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="border-t border-[#EEF3F8] px-6 py-4 dark:border-white/10">
          <Button variant="outline" className="rounded-2xl border-[#D7E4F4] text-[#286CFF]" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button className="rounded-2xl" onClick={() => void handleSubmit()} disabled={saving}>
            {saving ? 'Saving...' : `Extend ${modeLabel}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function EntityTrackerSummary({
  summary,
  loading,
  error,
}: {
  summary: EntityAiSummary | null
  loading: boolean
  error: string | null
}) {
  const [expanded, setExpanded] = useState(false)
  const parsed = summary?.parsed ?? null
  const executiveSummaryTemplate = getStringValue(parsed, ['cycle_summary', 'executive_summary_template'])
  const executiveSummary = executiveSummaryTemplate
    ? resolveSummaryTemplate(executiveSummaryTemplate, parsed)
    : 'Portfolio-level progress across every participating entity, with stage pressure, routing signals, and governance focus.'
  const highlights = getHighlightTemplates(parsed)
  const resolvedHighlights =
    highlights.length > 0
      ? highlights.map((item) => resolveSummaryTemplate(item, parsed))
      : [
          getStringValue(parsed, ['cycle_summary', 'planning_summary_template']),
          getStringValue(parsed, ['cycle_summary', 'allocation_summary_template']),
          getStringValue(parsed, ['cycle_summary', 'utilization_summary_template']),
        ].filter(Boolean).map((item) => resolveSummaryTemplate(item, parsed))
  const recommendedActions = getStringArray(parsed, ['recommended_next_actions']).map((item) => resolveSummaryTemplate(item, parsed))
  const displayItems = [...resolvedHighlights, ...recommendedActions].filter(Boolean)

  return (
    <section className="overflow-hidden rounded-[28px] border border-[#E9D5FF] bg-white dark:border-white/10 dark:bg-[#1E293B]">
      <button
        type="button"
        onClick={() => setExpanded((current) => !current)}
        className="flex w-full items-start justify-between gap-4 bg-gradient-to-b from-[#FDF8FF] via-white to-white px-6 py-5 text-left transition-colors hover:bg-white/40 dark:from-[#2A123D] dark:via-[#1F1B2E] dark:to-[#1E293B] dark:hover:bg-white/5"
      >
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#A855F7] text-white shadow-[0_12px_24px_rgba(168,85,247,0.24)]">
            <Sparkles className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-[16px] font-semibold text-[#0F172A] dark:text-white">AI Entity Tracker Summary</h2>
              <span className="inline-flex rounded-full bg-[#F5EEFF] px-2.5 py-1 text-xs font-semibold text-[#A855F7] dark:bg-[#A855F7]/15 dark:text-[#E9D5FF]">
                {loading ? 'Loading' : summary?.name ?? 'Governing View'}
              </span>
            </div>
            <p className="mt-1 text-sm leading-6 text-[#475569] dark:text-slate-100">
              {loading ? 'Loading latest AI cycle summary...' : error ? 'Unable to load AI cycle summary right now.' : executiveSummary}
            </p>
          </div>
        </div>
        <ChevronDown className={cn('mt-1 h-5 w-5 shrink-0 text-[#64748B] transition-transform dark:text-slate-300', expanded && 'rotate-180')} />
      </button>

      {expanded ? (
        <div className="border-t border-[#DDEBFF] px-6 py-5 dark:border-white/10">
          {loading ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {Array.from({ length: 3 }).map((_, index) => (
                <SkeletonBlock key={index} className="h-24 rounded-[18px] bg-[#FDF8FF] dark:bg-white/10" />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-[18px] border border-[#FECACA] bg-[#FEF2F2] p-4 text-sm leading-6 text-[#B91C1C] dark:border-[#7F1D1D] dark:bg-[#3A1717] dark:text-[#FCA5A5]">
              {error}
            </div>
          ) : displayItems.length > 0 ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {displayItems.slice(0, 6).map((item) => (
                <div key={item} className="rounded-[18px] border border-[#E9D5FF] bg-[#FDF8FF] p-4 text-sm leading-6 text-[#475569] dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
                  {item}
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-[18px] border border-[#E9D5FF] bg-[#FDF8FF] p-4 dark:border-white/10 dark:bg-white/5">
              <p className="text-sm font-semibold text-[#0F172A] dark:text-white">No AI cycle summary yet</p>
              <p className="mt-1 text-sm leading-6 text-[#64748B] dark:text-slate-300">
                AI Entity Tracker Summary has not been generated for the selected cycle yet.
              </p>
            </div>
          )}
        </div>
      ) : null}
    </section>
  )
}

function EntityTrackerSkeleton() {
  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-[28px] border border-[#E9D5FF] bg-white dark:border-white/10 dark:bg-[#1E293B]">
        <div className="px-6 py-5">
          <div className="flex items-start gap-4">
            <SkeletonBlock className="h-12 w-12 rounded-full" />
            <div className="min-w-0 flex-1 space-y-3">
              <SkeletonBlock className="h-5 w-52" />
              <SkeletonBlock className="h-4 w-full max-w-[520px]" />
            </div>
          </div>
        </div>
      </section>
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 5 }).map((_, index) => (
          <SkeletonBlock key={index} className="h-9 w-28 rounded-full" />
        ))}
      </div>
      {Array.from({ length: 2 }).map((_, index) => (
        <Card key={index} className="overflow-hidden rounded-[20px] border-[#D9E6F5] bg-white dark:border-white/10 dark:bg-[#162339]">
          <CardContent className="space-y-4 p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <SkeletonBlock className="h-11 w-11 rounded-xl" />
                <div className="space-y-2">
                  <SkeletonBlock className="h-5 w-52" />
                  <SkeletonBlock className="h-4 w-36" />
                </div>
              </div>
              <SkeletonBlock className="h-10 w-40 rounded-2xl" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
              {Array.from({ length: 6 }).map((__, itemIndex) => (
                <div key={itemIndex} className="rounded-[18px] border border-[#EAF0F6] bg-[#F8FBFF] p-4 dark:border-white/10 dark:bg-white/5">
                  <SkeletonBlock className="h-3 w-24" />
                  <SkeletonBlock className="mt-3 h-4 w-20" />
                </div>
              ))}
            </div>
            <SkeletonBlock className="h-36 w-full rounded-[20px]" />
            <div className="grid gap-4 lg:grid-cols-[1fr_0.95fr]">
              <SkeletonBlock className="h-36 w-full rounded-[20px]" />
              <SkeletonBlock className="h-36 w-full rounded-[20px]" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function EntityStageTracker({ instance }: { instance: DgeInstanceRecord }) {
  const activeIndex = getActiveStepIndex(instance)
  const breakdown = instance.budgets.reduce(
    (acc, budget) => {
      const bucket = getBudgetStageBucket(budget)
      acc[bucket] += 1
      return acc
    },
    { planning: 0, dgeReview: 0, reviewCompleted: 0, allocation: 0, utilization: 0 }
  )

  const total = Math.max(
    1,
    breakdown.planning + breakdown.dgeReview + breakdown.reviewCompleted + breakdown.allocation + breakdown.utilization
  )

  return (
    <div className="space-y-4">
      <div className="rounded-[20px] border border-[#DDEBFF] bg-white px-4 py-4 dark:border-white/10 dark:bg-[#1E293B]">
        <div className="flex w-full flex-nowrap items-center gap-2 overflow-x-auto pb-1">
          {stepStages.map((stage, index) => {
            const StageIcon = stepIcons[stage]
            const active = index <= activeIndex
            return (
              <div key={stage} className="flex min-w-0 flex-1 items-center">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div
                    className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-sm font-bold transition-all duration-200',
                      active
                        ? 'border-[#286CFF] bg-[#286CFF] text-white'
                        : 'border-[#D8E7FF] bg-[#EEF3F8] text-[#94A3B8] dark:border-white/10 dark:bg-white/10 dark:text-slate-400'
                    )}
                  >
                    <StageIcon className="h-4.5 w-4.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[#0F172A] dark:text-white">{stage}</p>
                    <p className="mt-0.5 text-xs text-[#64748B] dark:text-slate-400">{active ? 'Active' : 'Upcoming'}</p>
                  </div>
                </div>
                {index < stepStages.length - 1 ? (
                  <div className="mx-2 h-0.5 min-w-[18px] flex-1 overflow-hidden rounded-full bg-[#EEF3F8] dark:bg-white/10">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{ width: index < activeIndex ? '100%' : '0%', backgroundColor: '#286CFF' }}
                    />
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      </div>

      <div className="rounded-[20px] border border-[#DDEBFF] bg-[#F8FBFF] p-4 dark:border-white/10 dark:bg-white/5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[#0F172A] dark:text-white">Stage Progress</p>
            <p className="mt-1 text-xs text-[#64748B] dark:text-slate-300">Current project status mix for this entity</p>
          </div>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#286CFF] dark:bg-white/10 dark:text-[#BFDBFE]">
            {instance.statusLabel}
          </span>
        </div>

        <div className="h-4 overflow-hidden rounded-full bg-[#EEF3F8] dark:bg-white/10">
          <div className="flex h-full w-full">
            {[
              { label: 'Planning', value: breakdown.planning, color: '#0F766E', textColor: '#FFFFFF' },
              { label: 'DGE Review', value: breakdown.dgeReview, color: '#1D4ED8', textColor: '#FFFFFF' },
              { label: 'Review Completed', value: breakdown.reviewCompleted, color: '#6D28D9', textColor: '#FFFFFF' },
              { label: 'Allocation', value: breakdown.allocation, color: '#C2410C', textColor: '#FFFFFF' },
              { label: 'Utilization', value: breakdown.utilization, color: '#475569', textColor: '#FFFFFF' },
            ].map((segment) => (
              <div
                key={segment.label}
                className="flex h-full items-center justify-center text-[11px] font-semibold shadow-[inset_0_0_0_1px_rgba(255,255,255,0.15)]"
                style={{ width: `${(segment.value / total) * 100}%`, backgroundColor: segment.color, color: segment.textColor }}
              >
                {segment.value > 0 ? segment.value : ''}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
          {[
            { label: 'Planning', value: breakdown.planning, color: '#0F766E', textColor: '#FFFFFF' },
            { label: 'DGE Review', value: breakdown.dgeReview, color: '#1D4ED8', textColor: '#FFFFFF' },
            { label: 'Review Completed', value: breakdown.reviewCompleted, color: '#6D28D9', textColor: '#FFFFFF' },
            { label: 'Allocation', value: breakdown.allocation, color: '#C2410C', textColor: '#FFFFFF' },
            { label: 'Utilization', value: breakdown.utilization, color: '#475569', textColor: '#FFFFFF' },
          ].map((item) => (
            <div key={item.label} className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-[#64748B] dark:text-slate-300">{item.label}</span>
              <span className="font-semibold text-[#0F172A] dark:text-white">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function EntityTracker() {
  const { selectedCycle } = useCycle()
  const [activeStage, setActiveStage] = useState<(typeof stages)[number]>('All Stages')
  const [instances, setInstances] = useState<DgeInstanceRecord[]>([])
  const [aiSummariesByInstance, setAiSummariesByInstance] = useState<Map<string, EntityAiSummary>>(new Map())
  const [aiSummariesLoading, setAiSummariesLoading] = useState(false)
  const [aiSummariesError, setAiSummariesError] = useState<string | null>(null)
  const [cycleAiSummary, setCycleAiSummary] = useState<EntityAiSummary | null>(null)
  const [cycleAiSummaryLoading, setCycleAiSummaryLoading] = useState(false)
  const [cycleAiSummaryError, setCycleAiSummaryError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [extendModalOpen, setExtendModalOpen] = useState(false)

  const loadPortfolio = useCallback(async (options: { silent?: boolean } = {}) => {
    if (!selectedCycle?.id) {
      setInstances([])
      setAiSummariesByInstance(new Map())
      setAiSummariesError(null)
      setAiSummariesLoading(false)
      setCycleAiSummary(null)
      setCycleAiSummaryError(null)
      setCycleAiSummaryLoading(false)
      setLoading(false)
      return
    }

    if (!options.silent) setLoading(true)
    setError(null)
    try {
      const portfolio = await getDgePortfolioData(selectedCycle.id)
      setInstances(portfolio.instances)
      setAiSummariesLoading(true)
      setCycleAiSummaryLoading(true)
      setAiSummariesError(null)
      setCycleAiSummaryError(null)
      try {
        const cycleId = getCurrentCycleIdFromStorage() ?? selectedCycle.id
        const [summaries, cycleSummary] = await Promise.all([
          getEntityAiSummariesByInstanceIds(portfolio.instances.map((instance) => instance.id)),
          getCycleAiSummaryByCycleId(cycleId),
        ])
        setAiSummariesByInstance(summaries)
        setCycleAiSummary(cycleSummary)
      } catch (summaryError) {
        setAiSummariesByInstance(new Map())
        setCycleAiSummary(null)
        setAiSummariesError(summaryError instanceof Error ? summaryError.message : 'Unable to load AI portfolio insights.')
        setCycleAiSummaryError(summaryError instanceof Error ? summaryError.message : 'Unable to load AI entity tracker summary.')
      } finally {
        setAiSummariesLoading(false)
        setCycleAiSummaryLoading(false)
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load entity tracker data.')
      setAiSummariesByInstance(new Map())
      setAiSummariesError(null)
      setAiSummariesLoading(false)
      setCycleAiSummary(null)
      setCycleAiSummaryError(null)
      setCycleAiSummaryLoading(false)
    } finally {
      if (!options.silent) setLoading(false)
    }
  }, [selectedCycle?.id])

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      if (cancelled) return
      await loadPortfolio()
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [loadPortfolio])

  const stageCounts = useMemo(
    () =>
      stages.map((stage) => ({
        label: stage,
        count:
          stage === 'All Stages'
            ? instances.length
            : instances.filter((instance) => getInstanceStageFilterLabel(instance.statuscode) === stage).length,
      })),
    [instances]
  )

  const filteredEntities = useMemo(
    () =>
      instances.filter((instance) =>
        activeStage === 'All Stages' ? true : getInstanceStageFilterLabel(instance.statuscode) === activeStage
      ),
    [activeStage, instances]
  )

  return (
    <StrategyPageShell
      eyebrow="ICT - Strategy Team"
      title="Entity Tracker"
      description="Portfolio-level monitoring for every participating government entity across the budgeting cycle."
      actions={
        <Button className="h-11 rounded-2xl shadow-none" onClick={() => setExtendModalOpen(true)}>
          <CalendarPlus className="h-4 w-4" />
          Extend Portfolio
        </Button>
      }
    >
      <section className="space-y-5">
        <EntityTrackerSummary
          summary={cycleAiSummary}
          loading={cycleAiSummaryLoading}
          error={cycleAiSummaryError}
        />
        {error ? (
          <div className="rounded-[18px] border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#B91C1C] dark:border-[#7F1D1D] dark:bg-[#3A1717] dark:text-[#FCA5A5]">
            {error}
          </div>
        ) : null}

        <div className="flex items-center gap-2 flex-wrap">
          {stageCounts.map((stage) => (
            <button
              key={stage.label}
              type="button"
              onClick={() => setActiveStage(stage.label)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                activeStage === stage.label
                  ? 'border-[var(--primary)] bg-[var(--primary)] text-white'
                  : 'border border-[#E2E8F0] bg-white text-[#0F172A] hover:bg-[#F1F5F9] dark:border-white/10 dark:bg-[#1E293B] dark:text-white dark:hover:bg-white/5'
              }`}
            >
              <span>{stage.label}</span>
              <span className={`rounded-full px-1.5 py-0.5 text-xs font-bold ${activeStage === stage.label ? 'bg-white/20' : 'bg-[#F1F5F9] dark:bg-white/10'}`}>
                {stage.count}
              </span>
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {loading ? (
            <EntityTrackerSkeleton />
          ) : filteredEntities.length === 0 ? (
            <Card className="overflow-hidden rounded-[20px] border-[#D9E6F5] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#162339]">
              <CardContent className="p-5 text-sm text-[#64748B] dark:text-slate-300">No entities matched the current stage filter.</CardContent>
            </Card>
          ) : (
            filteredEntities.map((entity) => {
              const planningRisk = entity.budgets.filter((budget) => getBudgetStageBucket(budget) === 'planning').length
              const dgeReviewCount = entity.budgets.filter((budget) => getBudgetStageBucket(budget) === 'dgeReview').length
              const reviewCompletedCount = entity.budgets.filter((budget) => getBudgetStageBucket(budget) === 'reviewCompleted').length
              const allocationCount = entity.budgets.filter((budget) => getBudgetStageBucket(budget) === 'allocation').length
              const utilizationCount = entity.budgets.filter((budget) => getBudgetStageBucket(budget) === 'utilization').length
              const deadline = getEntityDeadline(entity)
              const deadlineLabel = formatLongDate(deadline)
              const remainingDays = getDeadlineDays(deadline)
              const remainingLabel = formatRemaining(remainingDays)
              const extensionCapsuleLabel = getExtensionCapsuleLabel(entity)
              const phaseStats = getEntityPhaseStats(entity)
              const entityBudgetUrl = `/strategy-team/projects?entity=${encodeURIComponent(entity.entityName || entity.name)}&phase=${getEntityProjectPhaseParam(entity)}`

              return (
                <Card
                  key={entity.id}
                  className="group overflow-hidden rounded-[20px] border-[#D9E6F5] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.06)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_42px_rgba(15,23,42,0.12)] dark:border-white/10 dark:bg-[#162339]"
                >
                  <CardContent className="p-0">
                    <div className="flex w-full items-start justify-between gap-4 px-5 py-4 text-left">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EEF5FF] text-sm font-bold text-[#286CFF] dark:bg-[#286CFF]/15 dark:text-[#BFDBFE]">
                            {getEntityInitials(entity)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="truncate text-lg font-bold text-[#0F172A] dark:text-white">{entity.name}</p>
                              <StrategyPill tone={entity.statusLabel === 'Planning' ? 'blue' : entity.statusLabel === 'Under DGE Review' ? 'violet' : entity.statusLabel === 'Allocation' ? 'amber' : 'teal'}>
                                {entity.statusLabel}
                              </StrategyPill>
                              <span className="inline-flex items-center rounded-full border border-[#DDEBFF] bg-[#F8FBFF] px-2.5 py-1 text-xs font-semibold text-[#475569] dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
                                End date: {deadlineLabel ?? 'Deadline not set'}
                              </span>
                              {remainingLabel ? (
                                <span
                                  className={cn(
                                    'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold',
                                    remainingDays !== null && remainingDays < 0
                                      ? 'bg-[#FEF2F2] text-[#B91C1C] dark:bg-[#7F1D1D]/30 dark:text-[#FCA5A5]'
                                      : 'bg-[#ECFDF5] text-[#047857] dark:bg-emerald-900/20 dark:text-emerald-300'
                                  )}
                                >
                                  {remainingLabel}
                                </span>
                              ) : null}
                              {extensionCapsuleLabel ? (
                                <span className="inline-flex items-center rounded-full bg-[#F5EEFF] px-2.5 py-1 text-xs font-semibold text-[#9333EA] dark:bg-[#9333EA]/15 dark:text-[#E9D5FF]">
                                  {extensionCapsuleLabel}
                                </span>
                              ) : null}
                            </div>
                            <p className="text-xs text-[#64748B] dark:text-slate-300">
                              {entity.planningStartDate?.slice(0, 10) || '-'} to {entity.planningEndDate?.slice(0, 10) || '-'}
                            </p>
                          </div>
                        </div>
                      </div>
                      <Link
                        to={entityBudgetUrl}
                        className="inline-flex items-center gap-2 rounded-2xl bg-[#286CFF] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1F5BFF]"
                      >
                        View Entity Budgets
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>

                    <div className="border-t border-[#EEF3F8] px-5 py-5 dark:border-white/10">
                      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        {phaseStats.map((item) => (
                          <div key={item.label} className="rounded-[18px] border border-[#EAF0F6] bg-[#F8FBFF] px-4 py-3 dark:border-white/10 dark:bg-white/5">
                            <p className="text-[12px] font-medium text-[#64748B] dark:text-slate-300">{item.label}</p>
                            <p className="mt-2 text-sm font-semibold text-[#0F172A] dark:text-white">{item.value}</p>
                          </div>
                        ))}
                      </div>

                      <div className="mt-4">
                        <EntityStageTracker instance={entity} />
                      </div>

                      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_0.95fr]">
                        <div className="rounded-[20px] border border-[#DDEBFF] bg-[#F8FBFF] p-4 dark:border-white/10 dark:bg-[#1E293B]">
                          <div className="flex items-center gap-2">
                            <Clock3 className="h-4.5 w-4.5 text-[#286CFF]" />
                            <p className="text-sm font-semibold text-[#0F172A] dark:text-white">Portfolio Summary</p>
                          </div>
                          <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            {[
                              { label: 'Planning', value: planningRisk },
                              { label: 'DGE Review', value: dgeReviewCount },
                              { label: 'Review Completed', value: reviewCompletedCount },
                              { label: 'Allocation / Utilization', value: allocationCount + utilizationCount },
                            ].map((item) => (
                              <div key={item.label} className="rounded-[18px] border border-[#EAF0F6] bg-white p-3 dark:border-white/10 dark:bg-white/5">
                                <p className="text-[12px] font-medium text-[#64748B] dark:text-slate-300">{item.label}</p>
                                <p className="mt-2 text-xl font-bold text-[#0F172A] dark:text-white">{item.value}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        <EntityAiPortfolioInsights
                          entity={entity}
                          summary={aiSummariesByInstance.get(entity.id) ?? null}
                          loading={aiSummariesLoading}
                          error={aiSummariesError}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      </section>
      <ExtendPortfolioModal
        open={extendModalOpen}
        onOpenChange={setExtendModalOpen}
        instances={instances}
        onExtended={() => loadPortfolio({ silent: true })}
      />
    </StrategyPageShell>
  )
}
