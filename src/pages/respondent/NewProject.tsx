import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowUpRight,
  AlertTriangle,
  Bot,
  Briefcase,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  Clock3,
  FileText,
  FolderKanban,
  Layers,
  Lightbulb,
  Loader2,
  MessageSquare,
  Package,
  Paperclip,
  Plus,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Upload,
  User,
  X,
  Zap,
} from 'lucide-react'
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { cn, formatAEDFull } from '@/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { BudgetItemsBuilder } from '@/components/shared/BudgetItemsBuilder'
import {
  SupportingDocumentAiInsights,
  type SupportingDocumentAiInsightItem,
} from '@/components/shared/SupportingDocumentAiInsights'
import { FileUploadDropzone, validateFilesForUpload } from '@/components/shared/FileUploadDropzone'
import { useToast } from '@/context/ToastContext'
import type { BudgetItemDraft } from '@/domain/classification'
import type {
  Dga_ict_budgetsdga_activity_type,
  Dga_ict_budgetsdga_budget_item_type,
  Dga_ict_budgetsdga_category,
} from '@/generated/models/Dga_ict_budgetsModel'
import { DirhamIcon } from '@/components/shared/DirhamIcon'
import { CurrencyAmount } from '@/components/shared/CurrencyAmount'
import {
  createIctBudgetDraft,
  type CreateIctBudgetDraftInput,
} from '@/services/ictBudgetDraftService'
import {
  getStrategicPrioritySuggestions,
  type StrategicPrioritySuggestion,
} from '@/services/aiStrategicSuggestionService'
import {
  evaluateIctBudgetConsiderations,
  type IctBudgetConsiderationsEvaluationResult,
  type PolicyAssessmentItem,
  type PolicyMatchType,
} from '@/services/aiBudgetConsiderationsService'
import {
  evaluateCumulativeSupportingDocuments,
  evaluateSupportingDocument,
  type SupportingDocumentBudgetLine,
  type SupportingDocumentEvaluationSummary,
  type SupportingDocumentSuggestedProjectField,
} from '@/services/aiSupportingDocumentEvaluationService'
import {
  createDocumentSummaryRecords,
  upsertCumulativeSummaryRecord,
} from '@/services/documentAiSummaryStoreService'
import { createBudgetLineItems } from '@/services/budgetLineItemService'
import {
  buildBudgetItemDraft,
  buildClassificationTree,
  getClassificationRecords,
} from '@/services/classificationService'
import { uploadFilesToRecord } from '@/services/fileUploadService'
import {
  getStrategicPriorityOptions,
  type StrategicPriorityOption,
} from '@/services/strategicPriorityService'
import { getStoredInstanceDetail } from '@/services/instanceService'
import { markCurrentInstancePlanningIfFirstProject } from '@/services/instanceService'
import {
  createTechnologyProductForCompany,
  getTechnologyCompanies,
  type TechnologyCompanyOption,
} from '@/services/technologyService'
import {
  createWorkStream,
  getWorkStreamOptions,
  type WorkStreamOption,
} from '@/services/workStreamService'
import {
  getBudgetCopilotChatReply,
  getBudgetCopilotStructuredAnalysis,
  type BudgetCopilotChatMessage,
  type BudgetCopilotRuntimeContext,
} from '@/services/aiBudgetCopilotChatService'
import { triggerIctBudgetAiOverview } from '@/services/ictBudgetAiOverviewService'

type ActivityType = Dga_ict_budgetsdga_activity_type
type BudgetItemType = Dga_ict_budgetsdga_budget_item_type
type CategoryType = Dga_ict_budgetsdga_category

interface LookupSelectOption {
  value: string
  label: string
}

interface MatchedAiSuggestion extends StrategicPrioritySuggestion {
  priorityId: string | null
  classificationId: string | null
  classificationParentId: string | null
}

interface PolicyMatchGroup {
  matchType: PolicyMatchType
  items: PolicyAssessmentItem[]
}

interface UploadedSupportingDocumentAnalysis {
  status: 'queued' | 'analyzing' | 'complete' | 'error'
  parsedSummary: SupportingDocumentEvaluationSummary | null
  rawSummary?: string
  responseTimeMs?: number | null
  error?: string | null
}

interface UploadedSupportingDocumentCumulativeAnalysis {
  status: 'idle' | 'analyzing' | 'complete' | 'error'
  parsedSummary: SupportingDocumentEvaluationSummary | null
  rawSummary?: string
  responseTimeMs?: number | null
  error?: string | null
  sourceFileCount: number
  scopeKey: string | null
}

interface CompletedSupportingDocumentInput {
  id: string
  file: File
  rawSummary: string
  responseTimeMs: number | null
  parsedSummary: SupportingDocumentEvaluationSummary | null
}

interface CopilotPendingSuggestion {
  title: string
  fields: Partial<Record<keyof FormValues, string | string[]>>
  budgetRows: BudgetItemDraft[]
  source: 'chat' | 'document' | 'cumulative' | 'strategic_priority'
  evidence?: string
  reviewFlags?: Array<{ flag?: string; reason?: string; severity?: string }>
  rawModelResponse?: string
}

interface FormValues {
  initiativeName: string
  strategicPriorityId: string
  strategicPriorityClassificationId: string
  workStreamId: string
  technologyCompanyId: string
  technologyProductIds: string[]
  budgetItemType: BudgetItemType | null
  category: CategoryType | null
  plannedStartDate: string
  plannedEndDate: string
  summary: string
  activityType: ActivityType | null
  totalBudgetPaidPreviousYear: string
  totalBudgetPayableFutureYear: string
  totalBudgetPayableNextYear: string
  totalBudgetPayableForYearAfterNext: string
}

type FieldErrorMap = Partial<Record<keyof FormValues | 'budgetItems', string>>

const ACTIVITY_TYPE_OPTIONS: Array<{
  value: ActivityType
  title: string
  description: string
}> = [
  {
    value: 1,
    title: 'Operational Recurring',
    description: 'Recurring operational spend with current and future year obligations.',
  },
  {
    value: 2,
    title: 'Operational Non-Recurring',
    description: 'One-time operational spend without extra year-based budget fields.',
  },
  {
    value: 3,
    title: 'New Project',
    description: 'New delivery initiative with future-year budget planning fields.',
  },
  {
    value: 4,
    title: 'Project Continuation',
    description: 'Continuation of an active project with historical and future spend.',
  },
]

const BUDGET_ITEM_TYPE_OPTIONS: Array<{ value: BudgetItemType; label: string }> = [
  { value: 1, label: 'New Strategic Initiative' },
  { value: 2, label: 'New CAPEX' },
  { value: 3, label: 'Inorganic Growth' },
  { value: 4, label: 'Other' },
]

const CATEGORY_OPTIONS: Array<{ value: CategoryType; label: string }> = [
  { value: 1, label: 'ICT Only' },
  { value: 2, label: 'Part of Any Other Project' },
]

const BUDGET_ASSISTANT_PROMPTS = [
  {
    text: 'Azure data platform project for AED 600K starting December',
  },
  {
    text: 'Maintenance contract for out-of-warranty laptops',
  },
  {
    text: 'Cloud migration project for AED 2M starting Q1 2027',
  },
  {
    text: 'What is the Budget Type field?',
  },
] as const

const INITIAL_FORM_VALUES: FormValues = {
  initiativeName: '',
  strategicPriorityId: '',
  strategicPriorityClassificationId: '',
  workStreamId: '',
  technologyCompanyId: '',
  technologyProductIds: [],
  budgetItemType: null,
  category: null,
  plannedStartDate: '',
  plannedEndDate: '',
  summary: '',
  activityType: null,
  totalBudgetPaidPreviousYear: '',
  totalBudgetPayableFutureYear: '',
  totalBudgetPayableNextYear: '',
  totalBudgetPayableForYearAfterNext: '',
}

function getUploadedFileSignature(file: File) {
  return `${file.name}:${file.size}:${file.lastModified}`
}

function buildCompletedSupportingDocumentInputs(
  files: File[],
  analyses: Record<string, UploadedSupportingDocumentAnalysis>
): CompletedSupportingDocumentInput[] {
  return files
    .map((file) => {
      const signature = getUploadedFileSignature(file)
      const analysis = analyses[signature]

      if (analysis?.status !== 'complete' || !analysis.rawSummary?.trim()) {
        return null
      }

      return {
        id: signature,
        file,
        rawSummary: analysis.rawSummary,
        responseTimeMs: analysis.responseTimeMs ?? null,
        parsedSummary: analysis.parsedSummary,
      }
    })
    .filter(Boolean) as CompletedSupportingDocumentInput[]
}

const VALIDATION_LABELS: Record<keyof FormValues | 'budgetItems', string> = {
  initiativeName: 'Initiative / Budget Item Name',
  strategicPriorityId: 'Strategic Priorities',
  strategicPriorityClassificationId: 'Strategic Priority Classifications',
  workStreamId: 'Work Stream',
  technologyCompanyId: 'Technology (Company)',
  technologyProductIds: 'Technology (Product)',
  budgetItemType: 'ICT Budget Items Type',
  category: 'Category',
  plannedStartDate: 'Planned Start Date',
  plannedEndDate: 'Planned End Date',
  summary: 'Summary / Description',
  activityType: 'Project Budget Type',
  totalBudgetPaidPreviousYear: 'Total Budget Paid Previous Year',
  totalBudgetPayableFutureYear: 'Total Budget Payable Future Years',
  totalBudgetPayableNextYear: 'Total Budget Payable Next Year',
  totalBudgetPayableForYearAfterNext: 'Total Budget Payable For Year After Next',
  budgetItems: 'Budget Account Codes',
}

function formatIntegerInput(value: string) {
  const digitsOnly = value.replace(/[^\d]/g, '')
  if (!digitsOnly) return ''
  return Number.parseInt(digitsOnly, 10).toLocaleString('en-AE')
}

function parseCurrencyValue(value: string) {
  const digitsOnly = value.replace(/[^\d]/g, '')
  if (!digitsOnly) return null
  const parsed = Number.parseInt(digitsOnly, 10)
  return Number.isFinite(parsed) ? parsed : null
}

function truncateAiText(value: string | undefined, maxCharacters: number) {
  const normalized = value?.trim() ?? ''
  if (!normalized) return ''
  if (normalized.length <= maxCharacters) return normalized
  return `${normalized.slice(0, maxCharacters).trimEnd()}...`
}

function limitCopilotText(value: string | undefined, maxCharacters: number) {
  const normalized = value?.trim() ?? ''
  if (!normalized) return ''
  if (normalized.length <= maxCharacters) return normalized
  return `${normalized.slice(0, maxCharacters).trimEnd()}...`
}

function formatCopilotBudgetAmount(amount?: number | null, currency?: string | null) {
  if (typeof amount !== 'number') return null
  return `${currency ? `${currency} ` : ''}${amount.toLocaleString('en-AE')}`
}

function buildCopilotIndividualAnalysisMessage(
  fileName: string,
  summary: SupportingDocumentEvaluationSummary | null
) {
  if (!summary) {
    return [
      '## File Analysis Complete',
      `### ${fileName}`,
      'The file was analyzed, but the response did not contain a usable structured summary.',
    ].join('\n')
  }

  const profile = summary.document_profile
  const fileMeta = (summary as Record<string, unknown>).file as Record<string, unknown> | undefined
  const fileSummary = summary.file_summary
  const evidence = summary.evidence_assessment
  const reviewFlags = summary.review_flags ?? []
  const budgetLines = summary.budget_lines ?? []

  const lines = [
    '## File Analysis Complete',
    `### ${fileName}`,
  ]

  lines.push(
    '',
    '### Document Profile',
    `- Type: ${profile?.document_type ?? 'Not identified'}`,
    `- Vendor / Issuer: ${profile?.issuer_or_vendor ?? 'Not identified'}`,
    `- Recipient / Entity: ${profile?.recipient_or_entity ?? 'Not identified'}`,
    `- Date: ${profile?.document_date ?? 'Not identified'}`,
    `- Pages: ${typeof fileMeta?.page_count === 'number' ? String(fileMeta.page_count) : 'Not identified'}`,
  )

  if (fileSummary?.short_summary) {
    lines.push('', '### File Summary', limitCopilotText(fileSummary.short_summary, 700))
  }

  lines.push(
    '',
    '### Evidence Assessment',
    `- Supports project: ${evidence?.supports_project ?? 'Unclear'}`,
    `- Evidence quality: ${evidence?.evidence_quality ?? 'Unclear'}`,
    `- Evidence score: ${typeof evidence?.evidence_score === 'number' ? evidence.evidence_score : 'Not scored'}`,
  )

  if (budgetLines.length > 0) {
    lines.push('', '### Budget Lines')
    for (const line of budgetLines.slice(0, 3)) {
      lines.push(
        `- ${line.description ?? 'Budget line'}${formatCopilotBudgetAmount(line.amount, line.currency) ? ` — ${formatCopilotBudgetAmount(line.amount, line.currency)}` : ''}`
      )
    }
  }

  if (reviewFlags.length > 0) {
    lines.push('', '### Review Flags')
    for (const flag of reviewFlags.slice(0, 3)) {
      lines.push(`- ${flag.flag ?? 'Review'}: ${flag.reason ?? 'Needs confirmation.'}`)
    }
  }

  lines.push('', 'Use the suggested field card to review extracted fields, budget lines, and account-code guidance.')
  return lines.join('\n')
}

function buildCopilotCumulativeAnalysisMessage(summary: SupportingDocumentEvaluationSummary | null) {
  if (!summary) {
    return [
      '## Cumulative Analysis Complete',
      'The documents were combined, but the cumulative response did not contain a usable structured summary.',
    ].join('\n')
  }

  const record = summary as Record<string, unknown>
  const analysisStatus = record.analysis_status as Record<string, unknown> | undefined
  const sourceFiles = Array.isArray(record.source_files) ? (record.source_files as Array<Record<string, unknown>>) : []
  const fileSummary = summary.file_summary
  const evidence = summary.evidence_assessment
  const reviewFlags = summary.review_flags ?? []
  const recommendedActions = Array.isArray(record.recommended_user_actions)
    ? (record.recommended_user_actions as string[])
    : []

  const lines = ['## Cumulative Analysis Complete']

  if (analysisStatus) {
    lines.push(
      '',
      '### Analysis Status',
      `- Total uploaded files: ${analysisStatus.total_uploaded_files ?? sourceFiles.length}`,
      `- Completed file analyses: ${analysisStatus.completed_file_analyses ?? sourceFiles.length}`,
      `- Pending file analyses: ${analysisStatus.pending_file_analyses ?? 0}`,
      `- Failed file analyses: ${analysisStatus.failed_file_analyses ?? 0}`,
    )
  }

  if (sourceFiles.length > 0) {
    lines.push('', '### Source Files')
    for (const file of sourceFiles.slice(0, 4)) {
      lines.push(
        `- ${String(file.file_name ?? 'Source file')} — ${String(file.document_type ?? 'Document')} (${String(file.evidence_quality ?? 'Unrated')}${typeof file.evidence_score === 'number' ? `, score ${file.evidence_score}` : ''})`
      )
    }
  }

  if (fileSummary?.short_summary) {
    lines.push('', '### Summary', limitCopilotText(fileSummary.short_summary, 900))
  }

  lines.push(
    '',
    '### Evidence Assessment',
    `- Supports project: ${evidence?.supports_project ?? 'Unclear'}`,
    `- Evidence quality: ${evidence?.evidence_quality ?? 'Unclear'}`,
    `- Evidence score: ${typeof evidence?.evidence_score === 'number' ? evidence.evidence_score : 'Not scored'}`,
  )

  if (reviewFlags.length > 0) {
    lines.push('', '### Review Flags')
    for (const flag of reviewFlags.slice(0, 4)) {
      lines.push(`- ${flag.flag ?? 'Review'}: ${flag.reason ?? 'Needs confirmation.'}`)
    }
  }

  if (recommendedActions.length > 0) {
    lines.push('', '### Recommended User Actions')
    for (const action of recommendedActions.slice(0, 4)) {
      lines.push(`- ${action}`)
    }
  }

  lines.push('', 'The suggested field card now reflects the combined evidence from all analyzed files.')
  return lines.join('\n')
}

function buildCopilotBudgetConsiderationMessage(
  result: IctBudgetConsiderationsEvaluationResult
) {
  const overall = result.overallAssessment
  const matchGroups = result.assessmentItems.slice(0, 4)
  const matchLabel = overall.hasPotentialConflict
    ? 'Potential Conflict'
    : overall.hasCoordinationRequirement
      ? 'Coordination Required'
      : overall.hasAllowedWithConditions
        ? 'Allowed With Conditions'
        : 'No Policy Match'

  const lines = [
    '## DGE Budget Considerations',
    `### ${matchLabel}`,
    overall.summary || 'AI reviewed the current project against DGE ICT Budget Considerations.',
  ]

  if (matchGroups.length > 0) {
    lines.push('', '### Policy Matches')
    for (const item of matchGroups) {
      lines.push(`- Policy ${item.policyNumber}: ${item.policyName} — ${item.matchType}`)
      if (item.requiredAction) {
        lines.push(`  Action: ${item.requiredAction}`)
      }
    }
  }

  return lines.join('\n')
}

type CopilotChatMessage = {
  from: 'ai' | 'user'
  text: string
  kind?: 'text' | 'status' | 'document-analysis' | 'cumulative-analysis' | 'policy-analysis'
  title?: string
  detail?: string
  fileName?: string
  summary?: SupportingDocumentEvaluationSummary | null
  policyResult?: IctBudgetConsiderationsEvaluationResult | null
}

function renderCopilotInlineText(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g).filter(Boolean)
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index} className="font-semibold text-[#0F172A] dark:text-white">{part.slice(2, -2)}</strong>
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={index} className="rounded bg-[#F6EBFF] px-1.5 py-0.5 text-[0.95em] font-medium text-[#7E22CE] dark:bg-white/10 dark:text-[#E9D5FF]">{part.slice(1, -1)}</code>
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={index} className="italic">{part.slice(1, -1)}</em>
    }
    return <Fragment key={index}>{part}</Fragment>
  })
}

function renderCopilotMessageText(text: string) {
  const lines = text.split('\n')
  const elements: React.ReactNode[] = []
  let bulletBuffer: string[] = []
  let numberedBuffer: string[] = []

  const flushBullets = (keyPrefix: string) => {
    if (bulletBuffer.length === 0) return
    elements.push(
      <ul key={`${keyPrefix}-bullets-${elements.length}`} className="ml-4 list-disc space-y-1 text-sm leading-6">
        {bulletBuffer.map((bullet, index) => (
          <li key={`${keyPrefix}-bullet-${index}`}>{renderCopilotInlineText(bullet)}</li>
        ))}
      </ul>
    )
    bulletBuffer = []
  }

  const flushNumbers = (keyPrefix: string) => {
    if (numberedBuffer.length === 0) return
    elements.push(
      <ol key={`${keyPrefix}-numbers-${elements.length}`} className="ml-5 list-decimal space-y-2 text-sm leading-6">
        {numberedBuffer.map((item, index) => (
          <li key={`${keyPrefix}-number-${index}`}>{renderCopilotInlineText(item)}</li>
        ))}
      </ol>
    )
    numberedBuffer = []
  }

  lines.forEach((line, index) => {
    const trimmed = line.trim()
    if (!trimmed) {
      flushBullets(`line-${index}`)
      flushNumbers(`line-${index}`)
      return
    }

    if (trimmed.startsWith('- ')) {
      flushNumbers(`line-${index}`)
      bulletBuffer.push(trimmed.slice(2))
      return
    }

    const numberedMatch = trimmed.match(/^\d+\.\s+(.*)$/)
    if (numberedMatch) {
      flushBullets(`line-${index}`)
      numberedBuffer.push(numberedMatch[1])
      return
    }

    flushBullets(`line-${index}`)
    flushNumbers(`line-${index}`)

    if (trimmed.startsWith('## ')) {
      elements.push(
        <h3 key={`h2-${index}`} className="text-base font-bold text-[#A855F7] dark:text-[#E9D5FF]">
          {renderCopilotInlineText(trimmed.slice(3))}
        </h3>
      )
      return
    }

    if (trimmed.startsWith('### ')) {
      elements.push(
        <h4 key={`h3-${index}`} className="text-sm font-semibold text-[#7E22CE] dark:text-[#E9D5FF]">
          {renderCopilotInlineText(trimmed.slice(4))}
        </h4>
      )
      return
    }

    elements.push(
      <p key={`p-${index}`} className="text-sm leading-6 text-[#334155] dark:text-slate-100">
        {renderCopilotInlineText(trimmed)}
      </p>
    )
  })

  flushBullets('final')
  flushNumbers('final')
  return <div className="space-y-2">{elements}</div>
}

function formatAiFieldValue(value: string | string[] | undefined) {
  if (!value) return '-'
  return Array.isArray(value) ? value.join(', ') : value
}

function getDocumentSummaryBudgetTotal(summary: SupportingDocumentEvaluationSummary | null) {
  return (summary?.budget_lines ?? []).reduce((sum, line) => sum + (line.amount ?? 0), 0)
}

function hasPendingSupportingDocumentAnalysis(
  files: File[],
  analyses: Record<string, UploadedSupportingDocumentAnalysis>,
  completedInputs: CompletedSupportingDocumentInput[],
  cumulativeAnalysis: UploadedSupportingDocumentCumulativeAnalysis
) {
  if (files.length === 0) return false

  for (const file of files) {
    const signature = getUploadedFileSignature(file)
    const status = analyses[signature]?.status ?? 'queued'
    if (status === 'queued' || status === 'analyzing' || status === 'error') {
      return true
    }
  }

  if (completedInputs.length !== files.length) {
    return true
  }

  if (completedInputs.length > 1 && cumulativeAnalysis.status !== 'complete') {
    return true
  }

  return false
}

function CopilotStatusMessage({
  title,
  detail,
}: {
  title: string
  detail?: string
}) {
  return (
    <div className="overflow-hidden rounded-[22px] border border-[#E9D5FF] bg-white px-4 py-4 shadow-sm dark:border-white/10 dark:bg-[#1E293B]">
      <div className="flex items-start gap-3">
        <div className="relative mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#E9D5FF] bg-[#FAF5FF] text-[#A855F7] dark:border-white/10 dark:bg-white/10 dark:text-[#E9D5FF]">
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-[#0F172A] dark:text-white">{title}</p>
            <span className="text-xs font-medium text-[#A855F7] dark:text-[#E9D5FF]">Working</span>
          </div>
          <p className="mt-1 text-sm leading-6 text-[#475569] dark:text-slate-200">{detail ?? 'Working on your request.'}</p>
          <div className="mt-3 space-y-2">
            <div className="h-2 w-[92%] animate-pulse rounded-full bg-[#F1F5F9] dark:bg-white/10" />
            <div className="h-2 w-[84%] animate-pulse rounded-full bg-[#F1F5F9] dark:bg-white/10" />
            <div className="h-2 w-[70%] animate-pulse rounded-full bg-[#F1F5F9] dark:bg-white/10" />
          </div>
        </div>
      </div>
    </div>
  )
}

function BudgetAssistantWelcomeCard({
  onPromptSelect,
}: {
  onPromptSelect: (prompt: string) => void
}) {
  return (
    <div className="space-y-5 py-2">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F3E8FF] text-[#A855F7]">
          <Sparkles className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <h4 className="text-xl font-bold text-[#0F172A] dark:text-white">Welcome to Budget Assistant</h4>
          <p className="mt-1 text-sm text-[#475569] dark:text-slate-300">
            Your AI-powered guide for ICT budget creation.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#F3E8FF] text-[#A855F7]">
            <MessageSquare className="h-3.5 w-3.5" />
          </div>
          <p className="mt-0.5 text-sm text-[#334155] dark:text-slate-200">
            Describe your ICT project and I&apos;ll suggest fields for you to review before applying.
          </p>
        </div>
        <div className="flex items-start gap-3">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#F3E8FF] text-[#A855F7]">
            <Lightbulb className="h-3.5 w-3.5" />
          </div>
          <p className="mt-0.5 text-sm text-[#334155] dark:text-slate-200">
            Ask about any form field and get tailored guidance based on your project context.
          </p>
        </div>
        <div className="flex items-start gap-3">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#F3E8FF] text-[#A855F7]">
            <FileText className="h-3.5 w-3.5" />
          </div>
          <p className="mt-0.5 text-sm text-[#334155] dark:text-slate-200">
            Upload a supporting document and I&apos;ll extract budget insights and evidence scores.
          </p>
        </div>
      </div>

      <div>
        <div className="mb-2.5 flex items-center gap-2">
          <Zap className="h-3.5 w-3.5 text-[#A855F7]" />
          <p className="text-[11px] font-semibold text-[#64748B] dark:text-slate-400">
            Try asking
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {BUDGET_ASSISTANT_PROMPTS.map(({ text }) => (
            <button
              key={text}
              type="button"
              onClick={() => onPromptSelect(text)}
              className="group rounded-xl border border-[#E9D5FF] px-3 py-2.5 text-left transition-all hover:border-[#D8B4FE] hover:bg-[#FAF5FF] dark:border-white/10 dark:hover:bg-white/10"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-start gap-2.5">
                  <Zap className="mt-0.5 h-4 w-4 shrink-0 text-[#A855F7] dark:text-[#E9D5FF]" />
                  <p className="text-sm leading-5 text-[#334155] dark:text-slate-100">{text}</p>
                </div>
                <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 text-[#C084FC] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 dark:text-[#E9D5FF]" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function BudgetAssistantLandingHero({
  chatInput,
  chatStagedFile,
  copilotBusy,
  copilotTyping,
  mode,
  onInputChange,
  onSend,
  onPromptSelect,
  onUploadClick,
  onCheckBudgetConsideration,
  onRemoveStagedFile,
  onToggleMode,
  canCheckBudgetConsideration,
  projectFieldSuggestionsLoading,
}: {
  chatInput: string
  chatStagedFile: File | null
  copilotBusy: boolean
  copilotTyping: boolean
  mode: 'manual' | 'ai'
  onInputChange: (value: string) => void
  onSend: () => void
  onPromptSelect: (prompt: string) => void
  onUploadClick: () => void
  onCheckBudgetConsideration: () => void
  onRemoveStagedFile: () => void
  onToggleMode: () => void
  canCheckBudgetConsideration: boolean
  projectFieldSuggestionsLoading: boolean
}) {
  return (
    <section
      className="animate-landingHeroFadeIn relative flex flex-1 flex-col overflow-hidden rounded-[32px] border border-[#E9D5FF] bg-[linear-gradient(180deg,#FFFFFF_0%,#FFF8FF_28%,#F9FBFF_58%,#FFFFFF_100%)] px-6 py-4 shadow-[0_22px_56px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-[linear-gradient(180deg,#1E1630_0%,#171125_40%,#1E293B_100%)] sm:px-8 sm:py-4 lg:px-10 lg:py-4"
      style={{ minHeight: '85vh' }}
    >
      <div className="pointer-events-none absolute inset-0 opacity-[0.75] dark:opacity-[0.32]" style={{ backgroundImage: 'radial-gradient(circle at center, rgba(168,85,247,0.18) 1px, transparent 1.2px)', backgroundSize: '16px 16px' }} />
      <div className="pointer-events-none absolute inset-0 opacity-[0.45] dark:opacity-[0.16]" style={{ backgroundImage: 'radial-gradient(circle at center, rgba(216,180,254,0.3) 0.8px, transparent 1px)', backgroundSize: '24px 24px', backgroundPosition: '8px 8px' }} />
      <div className="pointer-events-none absolute -left-24 top-14 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(168,85,247,0.14),transparent_70%)] blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-8 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(192,132,252,0.18),transparent_72%)] blur-3xl" />
      <div className="absolute right-6 top-4 z-[2] sm:right-8 lg:right-10">
        <div className="flex shrink-0 items-center justify-center gap-3 rounded-2xl border border-[#DDEBFF] bg-white/88 px-4 py-3 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
          <User className={cn('h-5 w-5 shrink-0', mode === 'manual' ? 'text-[var(--primary)]' : 'text-[#94A3B8]')} />
          <span className={cn('shrink-0 text-sm font-bold', mode === 'manual' ? 'text-[var(--primary)]' : 'text-[#94A3B8]')}>Manual</span>
          <button
            onClick={onToggleMode}
            className={cn('relative h-6 w-12 shrink-0 overflow-hidden rounded-full p-1 transition-colors', mode === 'ai' ? 'bg-[var(--primary)]' : 'bg-[#CBD5E1]')}
            aria-label="Toggle input mode"
          >
            <div className={cn('h-4 w-4 rounded-full bg-white shadow transition-transform', mode === 'ai' ? 'translate-x-6' : 'translate-x-0')} />
          </button>
          <span className={cn('shrink-0 text-sm font-bold', mode === 'ai' ? 'text-[var(--primary)]' : 'text-[#94A3B8]')}>Budget Assistant</span>
          <Bot className={cn('h-5 w-5 shrink-0', mode === 'ai' ? 'text-[var(--primary)]' : 'text-[#94A3B8]')} />
        </div>
      </div>

      <div className="relative z-[1] mx-auto flex w-full max-w-6xl flex-1 flex-col">
        <div className="relative mx-auto flex max-w-5xl items-center justify-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#E9D5FF] bg-white/90 px-4 py-2 text-sm font-semibold text-[#A855F7] shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/10 dark:text-[#E9D5FF]">
            <Sparkles className="h-4 w-4" />
            Budget Assistant
          </div>
        </div>
        <div className="relative mx-auto max-w-4xl text-center">
          <div className="pointer-events-none absolute left-[calc(100%+3rem)] top-2 hidden opacity-40 dark:opacity-20 xl:block">
            <div className="relative h-28 w-40">
              <Sparkles className="absolute right-0 top-0 h-8 w-8 text-[#A855F7]" />
              <Bot className="absolute right-10 top-10 h-10 w-10 text-[#C084FC]" />
              <Layers className="absolute right-24 top-4 h-7 w-7 text-[#D8B4FE]" />
              <FileText className="absolute right-20 top-16 h-6 w-6 text-[#E9D5FF]" />
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-[#0F172A] [text-wrap:balance] dark:text-white sm:text-4xl lg:text-5xl">
            Start your ICT budget with AI.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-[#475569] dark:text-slate-300 sm:text-lg">
            Describe the initiative, attach supporting evidence, or ask about any field. Once the conversation begins, the working draft form will appear for you to refine.
          </p>
        </div>

        <div className="mx-auto mt-10 max-w-5xl">
          <div className="copilot-snake-shell rounded-[30px] p-[3px]">
            <div className="rounded-[29px] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(253,247,255,0.94))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] backdrop-blur dark:bg-[linear-gradient(180deg,rgba(20,14,33,0.98),rgba(30,41,59,0.96))] dark:shadow-[inset_0_1px_0_rgba(168,85,247,0.08)] sm:p-5">
              {chatStagedFile ? (
                <div className="mb-4 flex items-center gap-2 rounded-2xl border border-[#E9D5FF] bg-[#FDF7FF] px-4 py-3 dark:border-white/10 dark:bg-white/5">
                  <FileText className="h-4 w-4 shrink-0 text-[#A855F7]" />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-[#334155] dark:text-white">{chatStagedFile.name}</span>
                  <button
                    type="button"
                    onClick={onRemoveStagedFile}
                    className="shrink-0 rounded-full p-0.5 text-[#94A3B8] hover:text-[#A855F7] dark:hover:text-[#E9D5FF]"
                    aria-label="Remove attached file"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : null}

              <Textarea
                value={chatInput}
                onChange={(event) => onInputChange(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault()
                    onSend()
                  }
                }}
                rows={5}
                placeholder={chatStagedFile ? 'Add a note about this file (optional)...' : 'Describe the ICT budget you want to create...'}
                className="min-h-[220px] resize-none border-0 bg-transparent px-3 py-3 text-base leading-7 text-[#0F172A] shadow-none focus-visible:ring-0 dark:bg-transparent dark:text-white dark:placeholder:text-slate-500 sm:min-h-[260px] sm:text-lg"
              />

              <div className="mt-4 flex flex-col gap-3 border-t border-[#F0D9FF] pt-4 dark:border-white/10 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onUploadClick}
                    disabled={copilotBusy}
                    className="h-11 rounded-2xl border-[#E9D5FF] bg-white/80 px-4 text-[#A855F7] hover:bg-[#FDF7FF] dark:border-white/10 dark:bg-white/5"
                  >
                    <Paperclip className="h-4 w-4" />
                    Upload Document
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onCheckBudgetConsideration}
                    disabled={copilotBusy || !canCheckBudgetConsideration}
                    className="h-11 rounded-2xl border-[#E9D5FF] bg-white/80 px-4 text-[#A855F7] hover:bg-[#FDF7FF] dark:border-white/10 dark:bg-white/5"
                  >
                    <Sparkles className="h-4 w-4" />
                    Check Budget Consideration
                  </Button>
                </div>

                  <Button
                    type="button"
                    className="h-11 rounded-2xl bg-[#A855F7] px-5 text-white shadow-[0_14px_30px_rgba(168,85,247,0.22)] hover:bg-[#9333EA]"
                    onClick={onSend}
                  disabled={copilotBusy || (!chatInput.trim() && !chatStagedFile)}
                >
                  {copilotBusy || copilotTyping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Start Draft
                </Button>
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            {BUDGET_ASSISTANT_PROMPTS.map(({ text }) => (
              <button
                key={text}
                type="button"
                onClick={() => onPromptSelect(text)}
                className="inline-flex items-center gap-2 rounded-full border border-[#E9D5FF] bg-white/90 px-4 py-2.5 text-sm font-medium text-[#475569] shadow-sm transition-colors hover:border-[#D8B4FE] hover:bg-[#FAF5FF] hover:text-[#0F172A] dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
              >
                <Zap className="h-4 w-4 shrink-0 text-[#A855F7] dark:text-[#E9D5FF]" />
                <span>{text}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function CopilotDocumentAnalysisMessage({
  fileName,
  summary,
}: {
  fileName: string
  summary: SupportingDocumentEvaluationSummary | null
}) {
  const profile = summary?.document_profile
  const fileSummary = summary?.file_summary
  const evidence = summary?.evidence_assessment
  const budgetLines = summary?.budget_lines ?? []
  const reviewFlags = summary?.review_flags ?? []

  return (
    <div className="overflow-hidden rounded-2xl border border-[#E9D5FF] bg-white shadow-sm dark:border-white/10 dark:bg-[#1E293B]">
      <div className="border-b border-[#E9D5FF] px-4 py-4 dark:border-white/10">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[#A855F7]">
            <FileText className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#A855F7] dark:text-[#E9D5FF]">Individual File Analysis Complete</p>
            <h4 className="mt-1 truncate text-base font-bold text-[#0F172A] dark:text-white">{fileName}</h4>
            <p className="mt-1 text-sm leading-6 text-[#475569] dark:text-slate-200">
              {limitCopilotText(fileSummary?.short_summary ?? 'The file was analyzed and mapped into project evidence.', 320)}
            </p>
          </div>
        </div>
      </div>
      <div className="space-y-3 px-4 py-4">
        <div className="grid gap-3">
          <div className="rounded-xl border border-[#E9D5FF] bg-white px-3 py-3 dark:border-white/10 dark:bg-white/5">
            <p className="text-[11px] font-semibold text-[#64748B] dark:text-slate-300">Document Profile</p>
            <div className="mt-2 space-y-1.5 text-sm text-[#334155] dark:text-slate-200">
              <p><span className="font-semibold">Type:</span> {profile?.document_type ?? 'Not identified'}</p>
              <p><span className="font-semibold">Vendor:</span> {profile?.issuer_or_vendor ?? 'Not identified'}</p>
              <p><span className="font-semibold">Entity:</span> {profile?.recipient_or_entity ?? 'Not identified'}</p>
            </div>
          </div>
          <div className="rounded-xl border border-[#E9D5FF] bg-white px-3 py-3 dark:border-white/10 dark:bg-white/5">
            <p className="text-[11px] font-semibold text-[#64748B] dark:text-slate-300">Evidence Assessment</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="rounded-full border border-[#E9D5FF] bg-[#F3E8FF] px-2.5 py-1 text-xs font-semibold text-[#7E22CE] dark:bg-[#A855F7]/15 dark:text-[#E9D5FF]">
                Supports Project: {evidence?.supports_project ?? 'Unclear'}
              </span>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-[#475569] dark:bg-white/10 dark:text-slate-200">
                Quality Score: {typeof evidence?.evidence_score === 'number' ? evidence.evidence_score : 'N/A'}
              </span>
            </div>
            <p className="mt-2 text-sm leading-6 text-[#475569] dark:text-slate-200">
              {limitCopilotText(evidence?.reason ?? evidence?.recommended_user_action ?? 'The AI extracted evidence quality and project support signals from the file.', 220)}
            </p>
          </div>
        </div>
        {(budgetLines.length > 0 || reviewFlags.length > 0) && (
          <div className="grid gap-3">
            {budgetLines.length > 0 && (
              <div className="rounded-xl border border-[#E9D5FF] bg-white px-3 py-3 dark:border-white/10 dark:bg-white/5">
                <p className="text-[11px] font-semibold text-[#64748B] dark:text-slate-300">Budget Lines</p>
                <div className="mt-2 space-y-2">
                  {budgetLines.slice(0, 2).map((line, index) => (
                    <div key={`${fileName}-line-${index}`} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 dark:border-white/10 dark:bg-white/5">
                      <p className="text-sm font-semibold text-[#0F172A] dark:text-white">{line.description ?? 'Budget line'}</p>
                      <p className="mt-1 text-xs text-[#64748B] dark:text-slate-300">{formatCopilotBudgetAmount(line.amount, line.currency) ?? 'Amount pending confirmation'}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {reviewFlags.length > 0 && (
              <div className="rounded-xl border border-[#E9D5FF] bg-white px-3 py-3 dark:border-white/10 dark:bg-white/5">
                <p className="text-[11px] font-semibold text-[#64748B] dark:text-slate-300">Review Flags</p>
                <div className="mt-2 space-y-2">
                  {reviewFlags.slice(0, 2).map((flag, index) => (
                    <div key={`${fileName}-flag-${index}`} className="rounded-xl border border-red-100 bg-white px-3 py-2 dark:border-white/10 dark:bg-white/5">
                      <p className="text-sm font-semibold text-[#B42318] dark:text-[#FCA5A5]">{flag.flag ?? 'Review'}</p>
                      <p className="mt-1 text-xs leading-5 text-[#475569] dark:text-[#FECACA]">{flag.reason ?? 'Needs confirmation.'}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function CopilotCumulativeAnalysisMessage({
  summary,
}: {
  summary: SupportingDocumentEvaluationSummary | null
}) {
  const record = (summary ?? {}) as Record<string, unknown>
  const sourceFiles = Array.isArray(record.source_files) ? (record.source_files as Array<Record<string, unknown>>) : []
  const fileSummary = summary?.file_summary
  const evidence = summary?.evidence_assessment
  const reviewFlags = summary?.review_flags ?? []
  const recommendedActions = Array.isArray(record.recommended_user_actions)
    ? (record.recommended_user_actions as string[])
    : []

  return (
    <div className="overflow-hidden rounded-2xl border border-[#E9D5FF] bg-white shadow-sm dark:border-white/10 dark:bg-[#1E293B]">
      <div className="border-b border-[#E9D5FF] px-4 py-4 dark:border-white/10">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[#A855F7]">
            <Layers className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#A855F7] dark:text-[#E9D5FF]">Cumulative Analysis Complete</p>
            <h4 className="mt-1 text-base font-bold text-[#0F172A] dark:text-white">Combined Evidence View</h4>
            <p className="mt-1 text-sm leading-6 text-[#475569] dark:text-slate-200">
              {limitCopilotText(fileSummary?.short_summary ?? 'The uploaded files were combined into one cumulative project evidence summary.', 360)}
            </p>
          </div>
        </div>
      </div>
      <div className="space-y-3 px-4 py-4">
        {sourceFiles.length > 0 && (
          <div className="rounded-xl border border-[#E9D5FF] bg-white px-3 py-3 dark:border-white/10 dark:bg-white/5">
            <p className="text-[11px] font-semibold text-[#64748B] dark:text-slate-300">Source Files</p>
            <div className="mt-2 space-y-2">
              {sourceFiles.slice(0, 3).map((file, index) => (
                <div key={`source-${index}`} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 dark:border-white/10 dark:bg-white/5">
                  <p className="text-sm font-semibold text-[#0F172A] dark:text-white">{String(file.file_name ?? 'Source file')}</p>
                  <p className="mt-1 text-xs text-[#64748B] dark:text-slate-300">
                    {String(file.document_type ?? 'Document')} - {String(file.evidence_quality ?? 'Unrated')}
                    {typeof file.evidence_score === 'number' ? ` (Score ${file.evidence_score})` : ''}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-[#E9D5FF] bg-white px-3 py-3 dark:border-white/10 dark:bg-white/5">
            <p className="text-[11px] font-semibold text-[#64748B] dark:text-slate-300">Evidence Assessment</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="rounded-full border border-[#E9D5FF] bg-[#F3E8FF] px-2.5 py-1 text-xs font-semibold text-[#7E22CE] dark:bg-[#A855F7]/15 dark:text-[#E9D5FF]">
                Supports Project: {evidence?.supports_project ?? 'Unclear'}
              </span>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-[#475569] dark:bg-white/10 dark:text-slate-200">
                Quality Score: {typeof evidence?.evidence_score === 'number' ? evidence.evidence_score : 'N/A'}
              </span>
            </div>
            <p className="mt-2 text-sm leading-6 text-[#475569] dark:text-slate-200">
              {limitCopilotText(evidence?.reason ?? 'The AI combined all completed files into one evidence assessment.', 250)}
            </p>
          </div>
          <div className="rounded-xl border border-[#E9D5FF] bg-white px-3 py-3 dark:border-white/10 dark:bg-white/5">
            <p className="text-[11px] font-semibold text-[#64748B] dark:text-slate-300">Recommended Actions</p>
            <div className="mt-2 space-y-2">
              {(recommendedActions.length > 0 ? recommendedActions.slice(0, 3) : ['Review the combined suggestions card before applying fields into the draft.']).map((action, index) => (
                <div key={`action-${index}`} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm leading-6 text-[#334155] dark:border-white/10 dark:bg-white/10 dark:text-slate-200">
                  {action}
                </div>
              ))}
            </div>
          </div>
        </div>
        {reviewFlags.length > 0 && (
          <div className="rounded-xl border border-[#E9D5FF] bg-white px-3 py-3 dark:border-white/10 dark:bg-white/5">
            <p className="text-[11px] font-semibold text-[#64748B] dark:text-slate-300">Review Flags</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {reviewFlags.slice(0, 4).map((flag, index) => (
                <div key={`cumulative-flag-${index}`} className="rounded-xl border border-red-100 bg-white px-3 py-2 dark:border-white/10 dark:bg-white/5">
                  <p className="text-sm font-semibold text-[#B42318] dark:text-[#FCA5A5]">{flag.flag ?? 'Review'}</p>
                  <p className="mt-1 text-xs leading-5 text-[#475569] dark:text-[#FECACA]">{flag.reason ?? 'Needs confirmation.'}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function CopilotPolicyAnalysisMessage({
  result,
}: {
  result: IctBudgetConsiderationsEvaluationResult
}) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)
  const overall = result.overallAssessment
  const conflictCount = result.assessmentItems.filter((i) => i.matchType === 'Potential Conflict').length
  const coordinationCount = result.assessmentItems.filter((i) => i.matchType === 'Coordination Required').length
  const allowedCount = result.assessmentItems.filter((i) => i.matchType === 'Allowed With Conditions').length

  return (
    <div className="overflow-hidden rounded-2xl border border-[#E9D5FF] bg-white shadow-sm dark:border-white/10 dark:bg-[#1E293B]">
      <div className="border-b border-[#E9D5FF] px-4 py-4 dark:border-white/10">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[#A855F7]">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-[#A855F7] dark:text-[#E9D5FF]">DGE Budget Considerations</p>
            <h4 className="mt-1 text-base font-bold text-[#0F172A] dark:text-white">Policy Review</h4>
            <p className="mt-1 text-sm leading-6 text-[#475569] dark:text-slate-200">
              {overall.summary || 'AI reviewed the project against DGE ICT Budget Considerations.'}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {conflictCount > 0 && (
                <span className="rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700">
                  {conflictCount} Potential Conflict{conflictCount !== 1 ? 's' : ''}
                </span>
              )}
              {coordinationCount > 0 && (
                <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                  {coordinationCount} Coordination Required
                </span>
              )}
              {allowedCount > 0 && (
                <span className="rounded-full border border-green-200 bg-green-50 px-2.5 py-0.5 text-xs font-semibold text-green-700">
                  {allowedCount} Allowed With Conditions
                </span>
              )}
              {result.assessmentItems.length === 0 && (
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                  No Policy Matches
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
      <div>
        {result.assessmentItems.slice(0, 4).map((item, index) => {
          const isExpanded = expandedIndex === index
          const tagClass =
            item.matchType === 'Potential Conflict'
              ? 'bg-red-50 text-red-700 border border-red-200'
              : item.matchType === 'Coordination Required'
                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                : 'bg-green-50 text-green-700 border border-green-200'
          return (
            <div key={`policy-${index}`} className="border-b border-[#F0D9FF] last:border-0 dark:border-white/10">
              <button
                type="button"
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-white/5"
                onClick={() => setExpandedIndex(isExpanded ? null : index)}
              >
                <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-[#0F172A] dark:text-white">
                    {item.policyName}
                  </span>
                  <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-semibold', tagClass)}>
                    {item.matchType}
                  </span>
                </div>
                <ChevronDown className={cn('h-4 w-4 shrink-0 text-[#94A3B8] transition-transform duration-200', isExpanded && 'rotate-180')} />
              </button>
              {isExpanded && (
                <div className="px-4 pb-3 pt-0 text-sm leading-6 text-[#475569] dark:text-slate-200">
                  {item.requiredAction || 'No specific action required.'}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function renderCopilotChatMessageContent(message: CopilotChatMessage) {
  if (message.kind === 'status') {
    return <CopilotStatusMessage title={message.title ?? 'Working'} detail={message.detail} />
  }
  if (message.kind === 'document-analysis') {
    return <CopilotDocumentAnalysisMessage fileName={message.fileName ?? 'Uploaded file'} summary={message.summary ?? null} />
  }
  if (message.kind === 'cumulative-analysis') {
    return <CopilotCumulativeAnalysisMessage summary={message.summary ?? null} />
  }
  if (message.kind === 'policy-analysis' && message.policyResult) {
    return <CopilotPolicyAnalysisMessage result={message.policyResult} />
  }

  return renderCopilotMessageText(message.text)
}

function renderCopilotMessage(text: string) {
  const lines = text.split('\n')
  return lines.map((line, lineIndex) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/)
    return (
      <span key={lineIndex}>
        {lineIndex > 0 && <br />}
        {parts.map((part, partIndex) =>
          part.startsWith('**') && part.endsWith('**') ? (
            <strong key={partIndex}>{part.slice(2, -2)}</strong>
          ) : (
            part
          )
        )}
      </span>
    )
  })
}

function EmptyActionCard({
  description,
  icon: Icon,
}: {
  description: string
  icon: React.ElementType
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-dashed border-[#A855F726] bg-[#FDF8FF] px-4 py-5 text-sm text-[#64748B] dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
      <div className="mt-0.5 shrink-0 text-[#A855F7] dark:text-[#E9D5FF]">
        <Icon className="h-5 w-5" />
      </div>
      <p className="leading-6">{description}</p>
    </div>
  )
}

function getVisibleBudgetFields(activityType: ActivityType | null) {
  switch (activityType) {
    case 1:
    case 4:
      return [
        'totalBudgetPaidPreviousYear',
        'totalBudgetPayableFutureYear',
        'totalBudgetPayableNextYear',
        'totalBudgetPayableForYearAfterNext',
      ] as BudgetCurrencyField[]
    case 2:
      return [] as BudgetCurrencyField[]
    case 3:
      return [
        'totalBudgetPayableFutureYear',
        'totalBudgetPayableNextYear',
        'totalBudgetPayableForYearAfterNext',
      ] as BudgetCurrencyField[]
    default:
      return [] as BudgetCurrencyField[]
  }
}

type BudgetCurrencyField =
  | 'totalBudgetPaidPreviousYear'
  | 'totalBudgetPayableFutureYear'
  | 'totalBudgetPayableNextYear'
  | 'totalBudgetPayableForYearAfterNext'

function toCurrencyFieldLabel(field: BudgetCurrencyField) {
  switch (field) {
    case 'totalBudgetPaidPreviousYear':
      return 'Total Budget Paid Previous Year'
    case 'totalBudgetPayableFutureYear':
      return 'Total Budget Payable Future Years'
    case 'totalBudgetPayableNextYear':
      return 'Total Budget Payable Next Year'
    case 'totalBudgetPayableForYearAfterNext':
      return 'Total Budget Payable For Year After Next'
    default:
      return ''
  }
}

function buildCreateDraftPayload(values: FormValues): CreateIctBudgetDraftInput {
  return {
    initiativeName: values.initiativeName,
    strategicPriorityId: values.strategicPriorityId,
    strategicPriorityClassificationId: values.strategicPriorityClassificationId,
    workStreamId: values.workStreamId || null,
    technologyCompanyId: values.technologyCompanyId || null,
    technologyProductIds: values.technologyProductIds,
    plannedStartDate: values.plannedStartDate,
    plannedEndDate: values.plannedEndDate,
    summary: values.summary,
    activityType: values.activityType as ActivityType,
    budgetItemType: values.budgetItemType as BudgetItemType,
    category: values.category,
    totalBudgetPaidPreviousYear: parseCurrencyValue(values.totalBudgetPaidPreviousYear),
    totalBudgetPayableFutureYear: parseCurrencyValue(values.totalBudgetPayableFutureYear),
    totalBudgetPayableNextYear: parseCurrencyValue(values.totalBudgetPayableNextYear),
    totalBudgetPayableForYearAfterNext: parseCurrencyValue(values.totalBudgetPayableForYearAfterNext),
  }
}

function validateDraftState(input: {
  values: FormValues
  budgetItems: BudgetItemDraft[]
  setFieldErrors: React.Dispatch<React.SetStateAction<FieldErrorMap>>
  setBudgetItemsError: React.Dispatch<React.SetStateAction<string | null>>
  showErrorToast: (title: string, description?: string) => void
}) {
  const nextErrors: FieldErrorMap = {}
  const visibleBudgetFields = getVisibleBudgetFields(input.values.activityType)

  if (!input.values.initiativeName.trim()) {
    nextErrors.initiativeName = 'Initiative / Budget Item Name is required.'
  }
  if (!input.values.strategicPriorityId) {
    nextErrors.strategicPriorityId = 'Strategic Priorities is required.'
  }
  if (!input.values.strategicPriorityClassificationId) {
    nextErrors.strategicPriorityClassificationId = 'Strategic Priority Classifications is required.'
  }
  if (!input.values.budgetItemType) {
    nextErrors.budgetItemType = 'ICT Budget Items Type is required.'
  }
  if (!input.values.plannedStartDate) {
    nextErrors.plannedStartDate = 'Planned Start Date is required.'
  }
  if (!input.values.plannedEndDate) {
    nextErrors.plannedEndDate = 'Planned End Date is required.'
  }
  if (!input.values.summary.trim()) {
    nextErrors.summary = 'Summary / Description is required.'
  }
  if (!input.values.activityType) {
    nextErrors.activityType = 'Project Budget Type is required.'
  }

  visibleBudgetFields.forEach((field) => {
    if (!input.values[field]) {
      nextErrors[field] = `${toCurrencyFieldLabel(field)} is required.`
    }
  })

  if (input.budgetItems.length === 0) {
    nextErrors.budgetItems = 'Add at least one budget account code before saving the draft.'
  } else if (input.budgetItems.some((item) => item.budgetRequested <= 0)) {
    nextErrors.budgetItems = 'Each budget account code must have a requested budget greater than zero.'
  }

  input.setFieldErrors(nextErrors)
  input.setBudgetItemsError(nextErrors.budgetItems ?? null)

  if (Object.keys(nextErrors).length > 0) {
    const missingFields = Object.keys(nextErrors).map(
      (key) => VALIDATION_LABELS[key as keyof typeof VALIDATION_LABELS]
    )
    input.showErrorToast(
      'Complete required fields',
      `Please review:\n${missingFields.map((field) => `• ${field}`).join('\n')}`
    )
    return false
  }

  return true
}

function FormField({
  label,
  required,
  hint,
  error,
  children,
}: {
  label: string
  required?: boolean
  hint?: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <label className="text-sm font-medium text-[#0F172A] dark:text-white">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        {hint && <span className="hidden text-xs font-medium text-[#94A3B8] sm:inline">{hint}</span>}
      </div>
      {children}
      {error && <p className="text-xs font-medium text-[#B42318]">{error}</p>}
    </div>
  )
}

function LookupSelect({
  value,
  onChange,
  placeholder,
  options,
  icon: Icon,
  disabled,
  invalid,
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
  options: LookupSelectOption[]
  icon: React.ElementType
  disabled?: boolean
  invalid?: boolean
}) {
  return (
    <Select value={value || undefined} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger
        className={cn(
          'h-12 rounded-xl border bg-white shadow-sm transition-colors hover:border-[var(--primary-light)] focus:ring-[var(--primary)] dark:border-white/10 dark:bg-[#1E293B]',
          invalid ? 'border-[#F04438]' : 'border-[#D9E6F7]'
        )}
      >
        <span
          style={{ gap: '15px' }}
          className={cn(
            'inline-flex w-full min-w-0 items-center whitespace-nowrap',
            value ? 'font-semibold text-[#0F172A] dark:text-white' : 'text-[#64748B]'
          )}
        >
          <Icon className="h-4 w-4 shrink-0 text-[var(--primary)]" />
          <SelectValue placeholder={placeholder} />
        </span>
      </SelectTrigger>
      <SelectContent className="rounded-xl">
        {options.length === 0 ? (
          <div className="px-3 py-2 text-sm text-[#64748B]">No options available.</div>
        ) : (
          options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  )
}

function DatePickerField({
  value,
  onChange,
  placeholder = 'Pick a date',
  invalid,
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  invalid?: boolean
}) {
  const pickerRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [viewMonth, setViewMonth] = useState(() => (value ? new Date(`${value}T00:00:00`) : new Date()))

  const selectedDate = value ? new Date(`${value}T00:00:00`) : null
  const today = new Date()
  const calendarStart = startOfWeek(startOfMonth(viewMonth))
  const calendarEnd = endOfWeek(endOfMonth(viewMonth))
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })
  const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
  const formattedValue = selectedDate ? format(selectedDate, 'MMM d, yyyy') : placeholder

  useEffect(() => {
    if (!open) return

    const handlePointerDown = (event: MouseEvent) => {
      if (!pickerRef.current) return
      const target = event.target
      if (target instanceof Node && !pickerRef.current.contains(target)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [open])

  const selectDate = (date: Date) => {
    onChange(format(date, 'yyyy-MM-dd'))
    setViewMonth(date)
    setOpen(false)
  }

  return (
    <div ref={pickerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={cn(
          'inline-flex h-12 w-full shrink-0 items-center justify-start gap-2 whitespace-nowrap rounded-xl border bg-white px-4 py-2 text-left text-sm font-normal transition-colors duration-150 outline-none hover:border-[#043DFF] hover:bg-[#E7F5FF] hover:text-[#043DFF] active:bg-[#D3EDFF] focus-visible:ring-2 focus-visible:ring-[#286CFF] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-[#1E293B] dark:text-white dark:hover:bg-white/5',
          invalid ? 'border-[#F04438]' : 'border-slate-200',
          selectedDate ? 'text-[#0F172A]' : 'text-[#64748B]'
        )}
      >
        <CalendarDays className="mr-2 h-4 w-4 shrink-0" />
        <span>{formattedValue}</span>
      </button>

      {open && (
        <div
          role="dialog"
          className="absolute left-1/2 top-full z-50 mt-2 w-auto -translate-x-1/2 rounded-md border border-[#DDEBFF] bg-white p-0 text-[#0F172A] shadow-md outline-none dark:border-white/10 dark:bg-[#1E293B] dark:text-white"
        >
          <div className="w-fit bg-white p-3 dark:bg-[#1E293B]">
            <div className="relative flex w-full flex-col gap-4">
              <nav className="absolute inset-x-0 top-0 flex w-full items-center justify-between" aria-label="Calendar navigation">
                <button
                  type="button"
                  onClick={() => setViewMonth((month) => subMonths(month, 1))}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-transparent p-0 text-[#286CFF] transition-colors hover:bg-[#E7F5FF] active:bg-[#D3EDFF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#286CFF] focus-visible:ring-offset-2"
                  aria-label="Go to the previous month"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMonth((month) => addMonths(month, 1))}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-transparent p-0 text-[#286CFF] transition-colors hover:bg-[#E7F5FF] active:bg-[#D3EDFF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#286CFF] focus-visible:ring-offset-2"
                  aria-label="Go to the next month"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </nav>

              <div className="flex h-8 w-full items-center justify-center px-8">
                <span className="select-none text-sm font-medium">{format(viewMonth, 'MMMM yyyy')}</span>
              </div>

              <div className="grid w-56 grid-cols-7 gap-y-2">
                {weekDays.map((day) => (
                  <div key={day} className="flex h-8 items-center justify-center rounded-md text-[0.8rem] font-normal text-[#64748B] dark:text-slate-300">
                    {day}
                  </div>
                ))}

                {days.map((date) => {
                  const selected = selectedDate ? isSameDay(date, selectedDate) : false
                  const currentMonth = isSameMonth(date, viewMonth)
                  const isToday = isSameDay(date, today)

                  return (
                    <button
                      key={date.toISOString()}
                      type="button"
                      onClick={() => selectDate(date)}
                      className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-lg p-2 text-sm font-normal leading-none text-[#286CFF] transition-colors outline-none hover:bg-[#E7F5FF] active:bg-[#D3EDFF] focus-visible:ring-2 focus-visible:ring-[#286CFF] focus-visible:ring-offset-2 dark:hover:bg-white/10',
                        !currentMonth && 'text-[#94A3B8]',
                        isToday && !selected && 'bg-[#E7F5FF] text-[#043DFF]',
                        selected && 'bg-[#286CFF] text-white hover:bg-[#286CFF] hover:text-white'
                      )}
                      aria-label={format(date, 'EEEE, MMMM do, yyyy')}
                    >
                      {format(date, 'd')}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function CurrencyField({
  value,
  onChange,
  invalid,
}: {
  value: string
  onChange: (value: string) => void
  invalid?: boolean
}) {
  return (
    <div className="relative">
      <DirhamIcon
        width={16}
        height={16}
        color="#286CFF"
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
      />
      <Input
        inputMode="numeric"
        value={value}
        onChange={(event) => onChange(formatIntegerInput(event.target.value))}
        placeholder="0"
        className={cn(
          'h-12 rounded-xl bg-white pl-9 shadow-sm dark:bg-[#1E293B]',
          invalid ? 'border-[#F04438]' : 'border-[#D9E6F7]'
        )}
      />
    </div>
  )
}

function FormSection({
  title,
  description,
  icon: Icon,
  children,
  action,
  noIconBg,
}: {
  title: string
  description: string
  icon: React.ElementType
  children: React.ReactNode
  action?: React.ReactNode
  noIconBg?: boolean
}) {
  return (
    <section className="rounded-2xl border border-[#DDEBFF] bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#1E293B] sm:p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className={cn('flex items-start', noIconBg ? 'gap-2.5' : 'gap-4')}>
          {noIconBg ? (
            <div className="mt-1 shrink-0 text-[#0F172A] dark:text-white">
              <Icon className="h-6 w-6" />
            </div>
          ) : (
            <div className="flex h-12 w-12 shrink-0 items-start justify-center pt-[10px] rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] text-[#0F172A] dark:border-white/10 dark:bg-white/5 dark:text-white">
              <Icon className="h-6 w-6" />
            </div>
          )}
          <div>
            <h3 className="mb-1 text-lg font-bold text-[var(--foreground)]">{title}</h3>
            <p className="max-w-2xl text-sm leading-6 text-[var(--muted-foreground)]">{description}</p>
          </div>
        </div>
        {action}
      </div>
      <div>{children}</div>
    </section>
  )
}

function normalizeAiLabel(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s*-\s*[a-z]{1,6}\d{1,10}\s*$/giu, '')
    .replace(/\s*\(\s*[a-z]{1,6}\d{1,10}\s*\)\s*$/giu, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function labelsMatch(left: string, right: string) {
  const normalizedLeft = normalizeAiLabel(left)
  const normalizedRight = normalizeAiLabel(right)

  return (
    normalizedLeft === normalizedRight ||
    normalizedLeft.includes(normalizedRight) ||
    normalizedRight.includes(normalizedLeft)
  )
}

// For strategic priority options whose Dataverse names may have trailing numbers or codes.
// Checks one-directionally: does the Dataverse option name contain the AI-suggested term?
function spNameMatch(optionName: string, term: string) {
  const t = term.toLowerCase().trim()
  if (!t) return false
  return optionName.toLowerCase().includes(t) || labelsMatch(optionName, term)
}

function resolveAiFieldMapping(
  field: SupportingDocumentSuggestedProjectField,
): 'initiativeName' | 'summary' | 'category' | 'technologyCompany' | null {
  const key = (field.field_key ?? '').toLowerCase()
  const label = (field.field_label ?? '').toLowerCase()

  if (
    key === 'project_name' ||
    key === 'name' ||
    label.includes('project name') ||
    label.includes('initiative') ||
    label.includes('budget item')
  ) {
    return 'initiativeName'
  }
  if (
    key === 'description' ||
    key === 'project_description' ||
    key === 'summary' ||
    label.includes('description') ||
    label.includes('summary')
  ) {
    return 'summary'
  }
  if (key === 'category' || label === 'category') {
    return 'category'
  }
  if (key.includes('technology') || label.includes('technology') || label.includes('company')) {
    return 'technologyCompany'
  }
  return null
}

function resolveManualAiFieldSuggestion(
  field: SupportingDocumentSuggestedProjectField,
  technologyCompanies: TechnologyCompanyOption[]
): {
  patch: Partial<FormValues>
  appliedName?: string
  appliedDescription?: string
  error?: string
} {
  const mapping = resolveAiFieldMapping(field)
  if (!mapping) {
    return { patch: {} }
  }

  const rawValue = Array.isArray(field.suggested_value)
    ? field.suggested_value.join(', ')
    : String(field.suggested_value ?? '')

  if (mapping === 'initiativeName') {
    return {
      patch: { initiativeName: rawValue },
      appliedName: rawValue,
    }
  }

  if (mapping === 'summary') {
    return {
      patch: { summary: rawValue },
      appliedDescription: rawValue,
    }
  }

  if (mapping === 'category') {
    const matched = CATEGORY_OPTIONS.find(
      (opt) => opt.label.toLowerCase() === rawValue.toLowerCase()
    )

    return matched
      ? { patch: { category: matched.value } }
      : {
          patch: {},
          error: `Category "${rawValue}" does not match any available category option.`,
        }
  }

  if (mapping === 'technologyCompany') {
    const normalized = rawValue.toLowerCase()
    const matched = technologyCompanies.find(
      (company) =>
        company.name.toLowerCase() === normalized ||
        company.name.toLowerCase().includes(normalized) ||
        normalized.includes(company.name.toLowerCase())
    )

    return matched
      ? {
          patch: {
            technologyCompanyId: matched.id,
            technologyProductIds: [],
          },
        }
      : {
          patch: {},
          error: `Technology Company "${rawValue}" does not match any available option.`,
        }
  }

  return { patch: {} }
}

function normalizeCopilotSuggestedFieldKey(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

function mapCopilotSuggestedFieldKey(rawKey: string, rawLabel: string, normalizedValue: string): keyof FormValues | null {
  const key = normalizeCopilotSuggestedFieldKey(rawKey)
  const label = normalizeCopilotSuggestedFieldKey(rawLabel)
  const candidates = [key, label]

  if (candidates.includes('project_name') || candidates.includes('initiative_budget_item_name') || candidates.includes('initiative_name')) return 'initiativeName'
  if (candidates.includes('project_description') || candidates.includes('summary_description') || candidates.includes('summary')) return 'summary'
  if (candidates.includes('category')) return 'category'
  if (candidates.includes('technology_company') || candidates.includes('technology')) return 'technologyCompanyId'
  if (candidates.includes('technology_product') || candidates.includes('technology_products')) return 'technologyProductIds'
  if (candidates.includes('planned_start_date') || candidates.includes('start_date')) return 'plannedStartDate'
  if (candidates.includes('planned_end_date') || candidates.includes('end_date')) return 'plannedEndDate'
  if (candidates.includes('work_stream') || candidates.includes('program_name')) return 'workStreamId'
  if (candidates.includes('strategic_priority')) return 'strategicPriorityId'
  if (candidates.includes('strategic_priority_classification')) return 'strategicPriorityClassificationId'
  if (candidates.includes('budget_item_type') || candidates.includes('ict_budget_items_type')) return 'budgetItemType'
  if (candidates.includes('budget_item_classification') || candidates.includes('budget_type') || candidates.includes('project_budget_type')) return 'activityType'

  if (normalizedValue && candidates.includes('project_type')) return 'budgetItemType'
  return null
}

function collectCopilotSuggestedFields(analysis: Record<string, unknown>): Partial<Record<keyof FormValues, string | string[]>> {
  const nextFields: Partial<Record<keyof FormValues, string | string[]>> = {}

  const suggestedFields = Array.isArray(analysis.suggested_project_fields)
    ? (analysis.suggested_project_fields as Array<Record<string, unknown>>)
    : []

  for (const field of suggestedFields) {
    const rawValue = field.suggested_value
    if (rawValue === null || rawValue === undefined) continue

    const stringValue = Array.isArray(rawValue)
      ? rawValue.filter((item): item is string => typeof item === 'string')
      : String(rawValue).trim()

    const normalizedValue = Array.isArray(stringValue)
      ? stringValue.join(', ').trim()
      : stringValue

    const mappedKey = mapCopilotSuggestedFieldKey(
      String(field.field_key ?? ''),
      String(field.field_label ?? ''),
      normalizedValue
    )

    if (!mappedKey) continue
    nextFields[mappedKey] = stringValue
  }

  return nextFields
}

function buildBudgetItemsFromSupportingDocumentSummary(summary: Record<string, unknown>) {
  const accountCodeSuggestions = Array.isArray(summary.account_code_suggestions)
    ? (summary.account_code_suggestions as Array<Record<string, unknown>>)
    : []
  const budgetLines = Array.isArray(summary.budget_lines)
    ? (summary.budget_lines as SupportingDocumentBudgetLine[])
    : []

  return accountCodeSuggestions.reduce<BudgetItemDraft[]>((items, suggestion, index) => {
    const accountCode = String(suggestion.account_code ?? '').trim()
    if (!accountCode) return items

    const lineNumberMatches = Array.isArray(suggestion.mapped_budget_line_numbers)
      ? (suggestion.mapped_budget_line_numbers as number[])
      : []
    const matchedLine = budgetLines.find((line) => lineNumberMatches.includes(line.line_number ?? -1)) ?? budgetLines[index] ?? null

    items.push({
      id: `copilot-${accountCode}-${index}`,
      accountName: accountCode,
      l1: String((suggestion.classification_path as Record<string, unknown> | undefined)?.l1 ?? 'Pending L1'),
      l2: String((suggestion.classification_path as Record<string, unknown> | undefined)?.l2 ?? 'Pending L2'),
      l3: String((suggestion.classification_path as Record<string, unknown> | undefined)?.l3 ?? 'Pending L3'),
      ebsCode: '',
      fusionCode: '',
      glCode: accountCode,
      accountGroup: null,
      description: null,
      expenseTypeValue: null,
      expenseTypeLabel: String(suggestion.expense_type ?? 'Pending'),
      budgetRequested: typeof suggestion.requested_budget === 'number'
        ? suggestion.requested_budget
        : typeof matchedLine?.amount === 'number'
          ? matchedLine.amount
          : 0,
    })

    return items
  }, [])
}

function toMatchTypeAccent(matchType: PolicyMatchType) {
  if (matchType === 'Potential Conflict') {
    return {
      badge: 'border-[#F5C2C7] bg-[#FFF1F3] text-[#B42318] dark:border-[#B42318]/30 dark:bg-[#B42318]/10 dark:text-[#FCA5A5]',
      sofbadge: 'border-[#FECACA] text-[#DC2626] dark:border-[#DC2626]/30 dark:text-[#FCA5A5]',
      dot: 'bg-[#DC2626]',
      text: 'text-[#DC2626] dark:text-[#FCA5A5]',
      icon: 'bg-[#FEE4E2] text-[#B42318] dark:bg-[#B42318]/15 dark:text-[#FCA5A5]',
      card: 'border-[#F5C2C7]',
    }
  }

  if (matchType === 'Coordination Required') {
    return {
      badge: 'border-[#F3D7A0] bg-[#FFF8E8] text-[#B7791F] dark:border-[#B7791F]/30 dark:bg-[#3A2810] dark:text-[#F6D28A]',
      sofbadge: 'border-[#FDE68A] text-[#B45309] dark:border-[#B45309]/30 dark:text-[#F6D28A]',
      dot: 'bg-[#F59E0B]',
      text: 'text-[#B45309] dark:text-[#F6D28A]',
      icon: 'bg-[#FDECC8] text-[#B7791F] dark:bg-[#B7791F]/15 dark:text-[#F6D28A]',
      card: 'border-[#F3D7A0]',
    }
  }

  return {
    badge: 'border-[#CFE9D9] bg-[#EEF9F1] text-[#16794B] dark:border-[#16794B]/30 dark:bg-[#123123] dark:text-[#86EFAC]',
    sofbadge: 'border-[#BBF7D0] text-[#16A34A] dark:border-[#16A34A]/30 dark:text-[#86EFAC]',
    dot: 'bg-[#22C55E]',
    text: 'text-[#16A34A] dark:text-[#86EFAC]',
    icon: 'bg-[#DCFCE7] text-[#16794B] dark:bg-[#16794B]/15 dark:text-[#86EFAC]',
    card: 'border-[#CFE9D9]',
  }
}

function getPolicyPanelTheme(matchType: PolicyMatchType | 'No Policy Match') {
  if (matchType === 'Potential Conflict') {
    return {
      panel: 'border-[#F6C9CF] bg-[#FFF8FA] dark:border-[#5D3240] dark:bg-[#26131C]',
      hover: 'hover:bg-white/30 dark:hover:bg-white/5',
      pill: 'bg-[#FFF1F2] text-[#DC2626] dark:bg-[#DC2626]/15 dark:text-[#FCA5A5]',
    }
  }

  if (matchType === 'Coordination Required') {
    return {
      panel: 'border-[#F3D7A0] bg-[#FFFBF0] dark:border-[#7A5A1F] dark:bg-[#2F2310]',
      hover: 'hover:bg-[#FFF8E8]/80 dark:hover:bg-white/5',
      pill: 'bg-[#FFF1CF] text-[#B7791F] dark:bg-[#B7791F]/15 dark:text-[#F6D28A]',
    }
  }

  if (matchType === 'Allowed With Conditions') {
    return {
      panel: 'border-[#CDEFD7] bg-[#F7FCF8] dark:border-[#29583C] dark:bg-[#13281E]',
      hover: 'hover:bg-[#F7FCF8]/80 dark:hover:bg-white/5',
      pill: 'bg-[#ECFDF3] text-[#027A48] dark:bg-[#027A48]/15 dark:text-[#A6F4C5]',
    }
  }

  return {
    panel: 'border-[#CDEFD7] bg-[#F7FCF8] dark:border-[#29583C] dark:bg-[#13281E]',
    hover: 'hover:bg-[#F7FCF8]/80 dark:hover:bg-white/5',
    pill: 'bg-[#ECFDF3] text-[#027A48] dark:bg-[#027A48]/15 dark:text-[#A6F4C5]',
  }
}

function truncatePolicyCopy(text: string, maxCharacters: number) {
  const normalized = text.trim()
  if (normalized.length <= maxCharacters) {
    return {
      text: normalized,
      truncated: false,
    }
  }

  return {
    text: `${normalized.slice(0, maxCharacters).trimEnd()}...`,
    truncated: true,
  }
}

function ProductMultiSelect({
  products,
  selectedIds,
  disabled,
  onToggle,
  invalid,
}: {
  products: TechnologyCompanyOption['products']
  selectedIds: string[]
  disabled?: boolean
  onToggle: (id: string) => void
  invalid?: boolean
}) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current) return
      const target = event.target
      if (target instanceof Node && !containerRef.current.contains(target)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [open])

  const selectedProducts = products.filter((product) => selectedIds.includes(product.id))
  const triggerLabel =
    selectedProducts.length === 0
      ? 'Select one or more products'
      : selectedProducts.map((product) => product.name).join(', ')

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        className={cn(
          'flex h-12 w-full items-center justify-between rounded-xl border bg-white px-4 text-left shadow-sm transition-colors hover:border-[var(--primary-light)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] dark:border-white/10 dark:bg-[#1E293B]',
          invalid ? 'border-[#F04438]' : 'border-[#D9E6F7]',
          disabled && 'cursor-not-allowed bg-[#F8FAFC] text-[#94A3B8] opacity-80 dark:bg-white/5'
        )}
      >
        <span className="inline-flex min-w-0 items-center gap-5">
          <Package className="h-4 w-4 shrink-0 text-[var(--primary)]" />
          <span className={cn('truncate text-sm', selectedProducts.length === 0 && 'text-[#64748B]')}>
            {disabled ? 'Select technology company first' : triggerLabel}
          </span>
        </span>
        <ChevronDown className={cn('h-4 w-4 shrink-0 text-[#64748B] transition-transform', open && 'rotate-180')} />
      </button>

      {!disabled && open && (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 rounded-2xl border border-[#DDEBFF] bg-white shadow-[0_18px_42px_rgba(15,23,42,0.12)] dark:border-white/10 dark:bg-[#1E293B]">
          <div className="max-h-[250px] overflow-y-auto p-2">
            {products.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#DDEBFF] bg-[#F8FBFF] px-4 py-6 text-center text-sm text-[#64748B] dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                No products are associated with this company yet.
              </div>
            ) : (
              products.map((product) => {
                const selected = selectedIds.includes(product.id)
                return (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => onToggle(product.id)}
                    className={cn(
                      'mb-2 flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition-colors last:mb-0',
                      selected
                        ? 'border-[#4A6FFF] bg-[#EEF3FF]'
                        : 'border-[#D9E6F7] bg-white hover:border-[#B0DBFF] hover:bg-[#F8FBFF] dark:border-white/10 dark:bg-[#0F172A]/20 dark:hover:bg-white/5'
                    )}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className={cn(
                          'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors',
                          selected
                            ? 'border-[#4A6FFF] bg-[#4A6FFF] text-white'
                            : 'border-[#CBD5E1] bg-white text-transparent dark:bg-transparent'
                        )}
                      >
                        <Check className="h-3.5 w-3.5" />
                      </div>
                      <span className="truncate text-sm font-medium text-[#334155] dark:text-slate-100">
                        {product.name}
                      </span>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function NewProject() {
  const [mode, setMode] = useState<'manual' | 'ai'>('ai')
  const [budgetItems, setBudgetItems] = useState<BudgetItemDraft[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatMessages, setChatMessages] = useState<CopilotChatMessage[]>([])
  const [optionSelected, setOptionSelected] = useState(false)
  const [formValues, setFormValues] = useState<FormValues>(INITIAL_FORM_VALUES)
  const [fieldErrors, setFieldErrors] = useState<FieldErrorMap>({})
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [budgetItemsError, setBudgetItemsError] = useState<string | null>(null)
  const [lookupLoading, setLookupLoading] = useState(false)
  const [lookupError, setLookupError] = useState<string | null>(null)
  const [aiSuggestionLoading, setAiSuggestionLoading] = useState(false)
  const [aiSuggestionError, setAiSuggestionError] = useState<string | null>(null)
  const [aiSuggestions, setAiSuggestions] = useState<StrategicPrioritySuggestion[]>([])
  const [aiPromptUsecase, setAiPromptUsecase] = useState<string | null>(null)
  const [lastAiRequestedSignature, setLastAiRequestedSignature] = useState<string | null>(null)
  const [aiSuggestionsNeedRefresh, setAiSuggestionsNeedRefresh] = useState(false)
  const [aiSuggestionExpanded, setAiSuggestionExpanded] = useState(false)
  const [policyEvaluationLoading, setPolicyEvaluationLoading] = useState(false)
  const [policyEvaluationError, setPolicyEvaluationError] = useState<string | null>(null)
  const [policyEvaluationResult, setPolicyEvaluationResult] = useState<IctBudgetConsiderationsEvaluationResult | null>(null)
  const [policyEvaluationExpanded, setPolicyEvaluationExpanded] = useState(false)
  const [expandedPolicyTextSections, setExpandedPolicyTextSections] = useState<Record<string, boolean>>({})
  const [aiApplyingAccountCode, setAiApplyingAccountCode] = useState(false)
  const [supportingDocumentAnalyses, setSupportingDocumentAnalyses] = useState<Record<string, UploadedSupportingDocumentAnalysis>>({})
  const supportingDocumentAnalysisInFlightRef = useRef<Set<string>>(new Set())
  const [supportingDocumentCumulativeAnalysis, setSupportingDocumentCumulativeAnalysis] = useState<UploadedSupportingDocumentCumulativeAnalysis>({
    status: 'idle',
    parsedSummary: null,
    rawSummary: '',
    responseTimeMs: null,
    error: null,
    sourceFileCount: 0,
    scopeKey: null,
  })
  const supportingDocumentCumulativeInFlightRef = useRef<string | null>(null)
  const [copilotFormValues, setCopilotFormValues] = useState<FormValues>(INITIAL_FORM_VALUES)
  const [copilotFieldErrors, setCopilotFieldErrors] = useState<FieldErrorMap>({})
  const [copilotBudgetItems, setCopilotBudgetItems] = useState<BudgetItemDraft[]>([])
  const [copilotBudgetItemsError, setCopilotBudgetItemsError] = useState<string | null>(null)
  const [copilotUploadedFiles, setCopilotUploadedFiles] = useState<File[]>([])
  const [copilotSupportingDocumentAnalyses, setCopilotSupportingDocumentAnalyses] = useState<Record<string, UploadedSupportingDocumentAnalysis>>({})
  const copilotSupportingDocumentAnalysisInFlightRef = useRef<Set<string>>(new Set())
  const [copilotSupportingDocumentCumulativeAnalysis, setCopilotSupportingDocumentCumulativeAnalysis] = useState<UploadedSupportingDocumentCumulativeAnalysis>({
    status: 'idle',
    parsedSummary: null,
    rawSummary: '',
    responseTimeMs: null,
    error: null,
    sourceFileCount: 0,
    scopeKey: null,
  })
  const copilotSupportingDocumentCumulativeInFlightRef = useRef<string | null>(null)
  const [copilotPendingSuggestion, setCopilotPendingSuggestion] = useState<CopilotPendingSuggestion | null>(null)
  const [copilotBusy, setCopilotBusy] = useState(false)
  const [copilotTyping, setCopilotTyping] = useState(false)
  const [copilotAiSuggestionLoading, setCopilotAiSuggestionLoading] = useState(false)
  const [copilotAiSuggestionError, setCopilotAiSuggestionError] = useState<string | null>(null)
  const [copilotAiSuggestions, setCopilotAiSuggestions] = useState<StrategicPrioritySuggestion[]>([])
  const [copilotAiPromptUsecase, setCopilotAiPromptUsecase] = useState<string | null>(null)
  const [copilotLastAiRequestedSignature, setCopilotLastAiRequestedSignature] = useState<string | null>(null)
  const [copilotAiSuggestionsNeedRefresh, setCopilotAiSuggestionsNeedRefresh] = useState(false)
  const [copilotBudgetConsiderationResult, setCopilotBudgetConsiderationResult] = useState<IctBudgetConsiderationsEvaluationResult | null>(null)
  const [copilotBudgetConsiderationLoading, setCopilotBudgetConsiderationLoading] = useState(false)
  const [copilotBudgetConsiderationError, setCopilotBudgetConsiderationError] = useState<string | null>(null)
  const [copilotWorkspaceView, setCopilotWorkspaceView] = useState<'chat' | 'suggestions'>('chat')
  const [copilotFormRevealed, setCopilotFormRevealed] = useState(false)
  const [chatStagedFile, setChatStagedFile] = useState<File | null>(null)
  const [suggestionFlashOn, setSuggestionFlashOn] = useState(false)
  const [copilotAltSuggestionApplied, setCopilotAltSuggestionApplied] = useState(false)
  const chatFileInputRef = useRef<HTMLInputElement>(null)
  const chatScrollRef = useRef<HTMLDivElement>(null)
  const shownCopilotDocumentSummaryRef = useRef<Set<string>>(new Set())
  const prevSuggestionCountRef = useRef(0)
  const shownCopilotCumulativeSummaryScopeRef = useRef<string | null>(null)

  useEffect(() => {
    const el = chatScrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [chatMessages])

  useEffect(() => {
    const count = copilotPendingSuggestion ? Object.keys(copilotPendingSuggestion.fields).length : 0
    if (count > prevSuggestionCountRef.current) {
      prevSuggestionCountRef.current = count
      setSuggestionFlashOn(true)
    } else {
      prevSuggestionCountRef.current = count
    }
  }, [copilotPendingSuggestion])

  const [strategicPriorities, setStrategicPriorities] = useState<StrategicPriorityOption[]>([])
  const [workStreams, setWorkStreams] = useState<WorkStreamOption[]>([])
  const [technologyCompanies, setTechnologyCompanies] = useState<TechnologyCompanyOption[]>([])
  const [workStreamModalOpen, setWorkStreamModalOpen] = useState(false)
  const [newWorkStreamName, setNewWorkStreamName] = useState('')
  const [technologyProductModalOpen, setTechnologyProductModalOpen] = useState(false)
  const [newTechnologyProductName, setNewTechnologyProductName] = useState('')
  const navigate = useNavigate()
  const { runActionToast, showErrorToast } = useToast()

  const strategicPriorityParentOptions = useMemo(
    () =>
      strategicPriorities
        .filter((option) => !option.parentId)
        .map((option) => ({ value: option.id, label: option.name })),
    [strategicPriorities]
  )

  const strategicPriorityClassificationOptions = useMemo(
    () =>
      strategicPriorities
        .filter((option) => option.parentId === formValues.strategicPriorityId)
        .map((option) => ({ value: option.id, label: option.name })),
    [formValues.strategicPriorityId, strategicPriorities]
  )

  const copilotStrategicPriorityClassificationOptions = useMemo(
    () =>
      strategicPriorities
        .filter((option) => option.parentId === copilotFormValues.strategicPriorityId)
        .map((option) => ({ value: option.id, label: option.name })),
    [copilotFormValues.strategicPriorityId, strategicPriorities]
  )

  const matchedAiSuggestions = useMemo<MatchedAiSuggestion[]>(
    () =>
      aiSuggestions.map((suggestion) => {
        const priorityRecord =
          strategicPriorities.find(
            (option) =>
              !option.parentId && spNameMatch(option.name, suggestion.strategicPriority)
          ) ?? null
        const classificationRecord =
          strategicPriorities.find((option) => {
            if (!option.parentId) return false
            if (!spNameMatch(option.name, suggestion.strategicPriorityClassification)) return false
            if (!priorityRecord) return true
            return option.parentId === priorityRecord.id
          }) ?? null

        return {
          ...suggestion,
          priorityId: priorityRecord?.id ?? null,
          classificationId: classificationRecord?.id ?? null,
          classificationParentId: classificationRecord?.parentId ?? null,
        }
      }),
    [aiSuggestions, strategicPriorities]
  )

  const matchedCopilotAiSuggestions = useMemo<MatchedAiSuggestion[]>(
    () =>
      copilotAiSuggestions.map((suggestion) => {
        const priorityRecord =
          strategicPriorities.find(
            (option) => !option.parentId && spNameMatch(option.name, suggestion.strategicPriority)
          ) ?? null
        const classificationRecord =
          strategicPriorities.find((option) => {
            if (!option.parentId) return false
            if (!spNameMatch(option.name, suggestion.strategicPriorityClassification)) return false
            if (!priorityRecord) return true
            return option.parentId === priorityRecord.id
          }) ?? null

        return {
          ...suggestion,
          priorityId: priorityRecord?.id ?? null,
          classificationId: classificationRecord?.id ?? null,
          classificationParentId: classificationRecord?.parentId ?? null,
        }
      }),
    [copilotAiSuggestions, strategicPriorities]
  )
  const topAiSuggestion = matchedAiSuggestions[0] ?? null
  const policyMatchGroups = useMemo<PolicyMatchGroup[]>(
    () => {
      const items = policyEvaluationResult?.assessmentItems ?? []
      const order: PolicyMatchType[] = [
        'Potential Conflict',
        'Coordination Required',
        'Allowed With Conditions',
      ]

      return order
        .map((matchType) => ({
          matchType,
          items: items.filter((item) => item.matchType === matchType),
        }))
        .filter((group) => group.items.length > 0)
    },
    [policyEvaluationResult]
  )
  const defaultPolicyPanelMatchType = useMemo<PolicyMatchType | 'No Policy Match'>(() => {
    if (!policyEvaluationResult?.overallAssessment.hasPolicyMatch) {
      return 'No Policy Match'
    }
    if (policyEvaluationResult.overallAssessment.hasPotentialConflict) {
      return 'Potential Conflict'
    }
    if (policyEvaluationResult.overallAssessment.hasCoordinationRequirement) {
      return 'Coordination Required'
    }
      return 'Allowed With Conditions'
  }, [policyEvaluationResult])
  const policyPanelTheme = getPolicyPanelTheme(defaultPolicyPanelMatchType)
  const togglePolicyTextSection = (sectionKey: string) => {
    setExpandedPolicyTextSections((current) => ({
      ...current,
      [sectionKey]: !current[sectionKey],
    }))
  }

  useEffect(() => {
    if (mode !== 'manual') return
    const activeSignatures = new Set(uploadedFiles.map((file) => getUploadedFileSignature(file)))

    setSupportingDocumentAnalyses((current) => {
      const nextEntries = Object.entries(current).filter(([signature]) => activeSignatures.has(signature))
      return Object.fromEntries(nextEntries)
    })
  }, [mode, uploadedFiles])

  useEffect(() => {
    if (mode !== 'manual' || uploadedFiles.length === 0) return

    setSupportingDocumentAnalyses((current) => {
      const next = { ...current }
      for (const file of uploadedFiles) {
        const signature = getUploadedFileSignature(file)
        if (!next[signature]) {
          next[signature] = {
            status: 'queued',
            parsedSummary: null,
            rawSummary: '',
            responseTimeMs: null,
            error: null,
          }
        }
      }
      return next
    })
  }, [mode, uploadedFiles])

  useEffect(() => {
    if (mode !== 'manual') return

    const queuedFiles = uploadedFiles.filter((file) => {
      const signature = getUploadedFileSignature(file)
      return (
        supportingDocumentAnalyses[signature]?.status === 'queued' &&
        !supportingDocumentAnalysisInFlightRef.current.has(signature)
      )
    })

    if (queuedFiles.length === 0) return

    for (const file of queuedFiles) {
      const signature = getUploadedFileSignature(file)
      supportingDocumentAnalysisInFlightRef.current.add(signature)

      setSupportingDocumentAnalyses((current) => ({
        ...current,
        [signature]: {
          ...(current[signature] ?? {
            parsedSummary: null,
            rawSummary: '',
            responseTimeMs: null,
            error: null,
          }),
          status: 'analyzing',
          error: null,
        },
      }))

      void evaluateSupportingDocument({ file })
        .then((response) => {
          console.log('[NewProject] ICT Supporting Document Evaluation flow response:', {
            fileName: file.name,
            response,
          })

          setSupportingDocumentAnalyses((current) => ({
            ...current,
            [signature]: {
              status: response.parsedSummary ? 'complete' : 'error',
              parsedSummary: response.parsedSummary,
              rawSummary: response.summary,
              responseTimeMs: response.responseTimeMs,
              error: response.parsedSummary
                ? null
                : 'The automate response did not contain a usable structured summary.',
            },
          }))
        })
        .catch((error) => {
          console.error('[NewProject] ICT Supporting Document Evaluation flow request failed:', error)
          setSupportingDocumentAnalyses((current) => ({
            ...current,
                [signature]: {
                  ...(current[signature] ?? {
                    parsedSummary: null,
                    rawSummary: '',
                    responseTimeMs: null,
                  }),
                  status: 'error',
                  error: error instanceof Error ? error.message : 'Document evaluation failed.',
            },
          }))
        })
        .finally(() => {
          supportingDocumentAnalysisInFlightRef.current.delete(signature)
        })
    }
  }, [mode, supportingDocumentAnalyses, uploadedFiles])

  useEffect(() => {
    if (mode !== 'ai') return
    const activeSignatures = new Set(copilotUploadedFiles.map((file) => getUploadedFileSignature(file)))

    setCopilotSupportingDocumentAnalyses((current) => {
      const nextEntries = Object.entries(current).filter(([signature]) => activeSignatures.has(signature))
      return Object.fromEntries(nextEntries)
    })
  }, [copilotUploadedFiles, mode])

  useEffect(() => {
    if (mode !== 'ai' || copilotUploadedFiles.length === 0) return

    setCopilotSupportingDocumentAnalyses((current) => {
      const next = { ...current }
      for (const file of copilotUploadedFiles) {
        const signature = getUploadedFileSignature(file)
        if (!next[signature]) {
          next[signature] = {
            status: 'queued',
            parsedSummary: null,
            rawSummary: '',
            responseTimeMs: null,
            error: null,
          }
        }
      }
      return next
    })
  }, [copilotUploadedFiles, mode])

  useEffect(() => {
    if (mode !== 'ai') return

    const queuedFiles = copilotUploadedFiles.filter((file) => {
      const signature = getUploadedFileSignature(file)
      return (
        copilotSupportingDocumentAnalyses[signature]?.status === 'queued' &&
        !copilotSupportingDocumentAnalysisInFlightRef.current.has(signature)
      )
    })

    if (queuedFiles.length === 0) return

    for (const file of queuedFiles) {
      const signature = getUploadedFileSignature(file)
      copilotSupportingDocumentAnalysisInFlightRef.current.add(signature)

      setCopilotSupportingDocumentAnalyses((current) => ({
        ...current,
        [signature]: {
          ...(current[signature] ?? {
            parsedSummary: null,
            rawSummary: '',
            responseTimeMs: null,
            error: null,
          }),
          status: 'analyzing',
          error: null,
        },
      }))

      void evaluateSupportingDocument({ file })
        .then((response) => {
          setCopilotSupportingDocumentAnalyses((current) => ({
            ...current,
            [signature]: {
              status: response.parsedSummary ? 'complete' : 'error',
              parsedSummary: response.parsedSummary,
              rawSummary: response.summary,
              responseTimeMs: response.responseTimeMs,
              error: response.parsedSummary
                ? null
                : 'The automate response did not contain a usable structured summary.',
            },
          }))
        })
        .catch((error) => {
          console.error('[NewProject] Copilot supporting document evaluation request failed:', error)
          setCopilotSupportingDocumentAnalyses((current) => ({
            ...current,
            [signature]: {
              ...(current[signature] ?? {
                parsedSummary: null,
                rawSummary: '',
                responseTimeMs: null,
              }),
              status: 'error',
              error: error instanceof Error ? error.message : 'Document evaluation failed.',
            },
          }))
        })
        .finally(() => {
          copilotSupportingDocumentAnalysisInFlightRef.current.delete(signature)
        })
    }
  }, [copilotSupportingDocumentAnalyses, copilotUploadedFiles, mode])

  const supportingDocumentInsightItems = useMemo<SupportingDocumentAiInsightItem[]>(
    () =>
      uploadedFiles.map((file) => {
        const id = getUploadedFileSignature(file)
        const analysis = supportingDocumentAnalyses[id]

        return {
          id,
          file,
          status: analysis?.status ?? 'queued',
          parsedSummary: analysis?.parsedSummary ?? null,
          rawSummary: analysis?.rawSummary,
          error: analysis?.error,
        }
      }),
    [supportingDocumentAnalyses, uploadedFiles]
  )
  const completedSupportingDocumentInputs = useMemo(
    () => buildCompletedSupportingDocumentInputs(uploadedFiles, supportingDocumentAnalyses),
    [supportingDocumentAnalyses, uploadedFiles]
  )
  const copilotSupportingDocumentInsightItems = useMemo<SupportingDocumentAiInsightItem[]>(
    () =>
      copilotUploadedFiles.map((file) => {
        const id = getUploadedFileSignature(file)
        const analysis = copilotSupportingDocumentAnalyses[id]

        return {
          id,
          file,
          status: analysis?.status ?? 'queued',
          parsedSummary: analysis?.parsedSummary ?? null,
          rawSummary: analysis?.rawSummary,
          error: analysis?.error,
        }
      }),
    [copilotSupportingDocumentAnalyses, copilotUploadedFiles]
  )
  const completedCopilotSupportingDocumentInputs = useMemo(
    () => buildCompletedSupportingDocumentInputs(copilotUploadedFiles, copilotSupportingDocumentAnalyses),
    [copilotSupportingDocumentAnalyses, copilotUploadedFiles]
  )
  const completedSupportingDocumentScopeKey = useMemo(
    () =>
      completedSupportingDocumentInputs
        .map((item) => `${item.id}:${item.rawSummary.length}`)
        .join('|'),
    [completedSupportingDocumentInputs]
  )
  const completedCopilotSupportingDocumentScopeKey = useMemo(
    () =>
      completedCopilotSupportingDocumentInputs
        .map((item) => `${item.id}:${item.rawSummary.length}`)
        .join('|'),
    [completedCopilotSupportingDocumentInputs]
  )

  useEffect(() => {
    if (mode !== 'manual') return

    if (completedSupportingDocumentInputs.length <= 1) {
      supportingDocumentCumulativeInFlightRef.current = null
      setSupportingDocumentCumulativeAnalysis({
        status: 'idle',
        parsedSummary: null,
        rawSummary: '',
        responseTimeMs: null,
        error: null,
        sourceFileCount: completedSupportingDocumentInputs.length,
        scopeKey: completedSupportingDocumentInputs.length === 1 ? completedSupportingDocumentScopeKey : null,
      })
      return
    }

    if (
      supportingDocumentCumulativeAnalysis.scopeKey === completedSupportingDocumentScopeKey &&
      (
        supportingDocumentCumulativeAnalysis.status === 'complete' ||
        supportingDocumentCumulativeAnalysis.status === 'analyzing' ||
        supportingDocumentCumulativeAnalysis.status === 'error'
      )
    ) {
      return
    }

    if (supportingDocumentCumulativeInFlightRef.current === completedSupportingDocumentScopeKey) {
      return
    }

    supportingDocumentCumulativeInFlightRef.current = completedSupportingDocumentScopeKey
    setSupportingDocumentCumulativeAnalysis({
      status: 'analyzing',
      parsedSummary: null,
      rawSummary: '',
      responseTimeMs: null,
      error: null,
      sourceFileCount: completedSupportingDocumentInputs.length,
      scopeKey: completedSupportingDocumentScopeKey,
    })

    void evaluateCumulativeSupportingDocuments({
      fileInputs: completedSupportingDocumentInputs.map((item) => ({
        filename: item.file.name,
        fileResponse: item.rawSummary,
      })),
    })
      .then((response) => {
        setSupportingDocumentCumulativeAnalysis({
          status: response.parsedSummary ? 'complete' : 'error',
          parsedSummary: response.parsedSummary,
          rawSummary: response.summary,
          responseTimeMs: response.responseTimeMs,
          error: response.parsedSummary
            ? null
            : 'The cumulative automate response did not contain a usable structured summary.',
          sourceFileCount: completedSupportingDocumentInputs.length,
          scopeKey: completedSupportingDocumentScopeKey,
        })
      })
      .catch((error) => {
        console.error('[NewProject] ICT cumulative supporting document summary flow request failed:', error)
        setSupportingDocumentCumulativeAnalysis({
          status: 'error',
          parsedSummary: null,
          rawSummary: '',
          responseTimeMs: null,
          error: error instanceof Error ? error.message : 'Cumulative document evaluation failed.',
          sourceFileCount: completedSupportingDocumentInputs.length,
          scopeKey: completedSupportingDocumentScopeKey,
        })
      })
      .finally(() => {
        if (supportingDocumentCumulativeInFlightRef.current === completedSupportingDocumentScopeKey) {
          supportingDocumentCumulativeInFlightRef.current = null
        }
      })
  }, [
    completedSupportingDocumentInputs,
    completedSupportingDocumentScopeKey,
    mode,
    supportingDocumentCumulativeAnalysis.scopeKey,
    supportingDocumentCumulativeAnalysis.status,
  ])

  useEffect(() => {
    if (mode !== 'ai') return

    if (completedCopilotSupportingDocumentInputs.length <= 1) {
      copilotSupportingDocumentCumulativeInFlightRef.current = null
      setCopilotSupportingDocumentCumulativeAnalysis({
        status: 'idle',
        parsedSummary: null,
        rawSummary: '',
        responseTimeMs: null,
        error: null,
        sourceFileCount: completedCopilotSupportingDocumentInputs.length,
        scopeKey: completedCopilotSupportingDocumentInputs.length === 1 ? completedCopilotSupportingDocumentScopeKey : null,
      })
      return
    }

    if (
      copilotSupportingDocumentCumulativeAnalysis.scopeKey === completedCopilotSupportingDocumentScopeKey &&
      (
        copilotSupportingDocumentCumulativeAnalysis.status === 'complete' ||
        copilotSupportingDocumentCumulativeAnalysis.status === 'analyzing' ||
        copilotSupportingDocumentCumulativeAnalysis.status === 'error'
      )
    ) {
      return
    }

    if (copilotSupportingDocumentCumulativeInFlightRef.current === completedCopilotSupportingDocumentScopeKey) {
      return
    }

    copilotSupportingDocumentCumulativeInFlightRef.current = completedCopilotSupportingDocumentScopeKey
    setCopilotSupportingDocumentCumulativeAnalysis({
      status: 'analyzing',
      parsedSummary: null,
      rawSummary: '',
      responseTimeMs: null,
      error: null,
      sourceFileCount: completedCopilotSupportingDocumentInputs.length,
      scopeKey: completedCopilotSupportingDocumentScopeKey,
    })

    void evaluateCumulativeSupportingDocuments({
      fileInputs: completedCopilotSupportingDocumentInputs.map((item) => ({
        filename: item.file.name,
        fileResponse: item.rawSummary,
      })),
    })
      .then((response) => {
        setCopilotSupportingDocumentCumulativeAnalysis({
          status: response.parsedSummary ? 'complete' : 'error',
          parsedSummary: response.parsedSummary,
          rawSummary: response.summary,
          responseTimeMs: response.responseTimeMs,
          error: response.parsedSummary
            ? null
            : 'The cumulative automate response did not contain a usable structured summary.',
          sourceFileCount: completedCopilotSupportingDocumentInputs.length,
          scopeKey: completedCopilotSupportingDocumentScopeKey,
        })
      })
      .catch((error) => {
        console.error('[NewProject] Copilot cumulative supporting document summary flow request failed:', error)
        setCopilotSupportingDocumentCumulativeAnalysis({
          status: 'error',
          parsedSummary: null,
          rawSummary: '',
          responseTimeMs: null,
          error: error instanceof Error ? error.message : 'Cumulative document evaluation failed.',
          sourceFileCount: completedCopilotSupportingDocumentInputs.length,
          scopeKey: completedCopilotSupportingDocumentScopeKey,
        })
      })
      .finally(() => {
        if (copilotSupportingDocumentCumulativeInFlightRef.current === completedCopilotSupportingDocumentScopeKey) {
          copilotSupportingDocumentCumulativeInFlightRef.current = null
        }
      })
  }, [
    completedCopilotSupportingDocumentInputs,
    completedCopilotSupportingDocumentScopeKey,
    copilotSupportingDocumentCumulativeAnalysis.scopeKey,
    copilotSupportingDocumentCumulativeAnalysis.status,
    mode,
  ])

  const activeSupportingDocumentSummary = useMemo(() => {
    if (completedSupportingDocumentInputs.length > 1) {
      if (supportingDocumentCumulativeAnalysis.status === 'complete' && supportingDocumentCumulativeAnalysis.parsedSummary) {
        return {
          type: 'cumulative' as const,
          fileCount: completedSupportingDocumentInputs.length,
          parsedSummary: supportingDocumentCumulativeAnalysis.parsedSummary,
          loading: false,
          error: supportingDocumentCumulativeAnalysis.error,
        }
      }

      if (supportingDocumentCumulativeAnalysis.status === 'analyzing') {
        return {
          type: 'cumulative' as const,
          fileCount: completedSupportingDocumentInputs.length,
          parsedSummary: null,
          loading: true,
          error: null,
        }
      }

      if (supportingDocumentCumulativeAnalysis.status === 'error') {
        return {
          type: 'cumulative' as const,
          fileCount: completedSupportingDocumentInputs.length,
          parsedSummary: null,
          loading: false,
          error: supportingDocumentCumulativeAnalysis.error,
        }
      }
    }

    const latestSingle = completedSupportingDocumentInputs[completedSupportingDocumentInputs.length - 1] ?? null
    if (!latestSingle) {
      return {
        type: 'single' as const,
        fileCount: 0,
        parsedSummary: null,
        loading: uploadedFiles.length > 0,
        error: null,
      }
    }

    return {
      type: 'single' as const,
      fileCount: 1,
      parsedSummary: latestSingle.parsedSummary,
      loading: false,
      error: null,
    }
  }, [completedSupportingDocumentInputs, supportingDocumentCumulativeAnalysis, uploadedFiles.length])
  const activeCopilotSupportingDocumentSummary = useMemo(() => {
    if (completedCopilotSupportingDocumentInputs.length > 1) {
      if (copilotSupportingDocumentCumulativeAnalysis.status === 'complete' && copilotSupportingDocumentCumulativeAnalysis.parsedSummary) {
        return {
          type: 'cumulative' as const,
          fileCount: completedCopilotSupportingDocumentInputs.length,
          parsedSummary: copilotSupportingDocumentCumulativeAnalysis.parsedSummary,
          loading: false,
          error: copilotSupportingDocumentCumulativeAnalysis.error,
        }
      }

      if (copilotSupportingDocumentCumulativeAnalysis.status === 'analyzing') {
        return {
          type: 'cumulative' as const,
          fileCount: completedCopilotSupportingDocumentInputs.length,
          parsedSummary: copilotSupportingDocumentCumulativeAnalysis.parsedSummary,
          loading: true,
          error: null,
        }
      }

      if (copilotSupportingDocumentCumulativeAnalysis.status === 'error') {
        return {
          type: 'cumulative' as const,
          fileCount: completedCopilotSupportingDocumentInputs.length,
          parsedSummary: null,
          loading: false,
          error: copilotSupportingDocumentCumulativeAnalysis.error,
        }
      }
    }

    const latestSingle = completedCopilotSupportingDocumentInputs[completedCopilotSupportingDocumentInputs.length - 1] ?? null
    return {
      type: 'single' as const,
      fileCount: latestSingle ? 1 : 0,
      parsedSummary: latestSingle?.parsedSummary ?? null,
      loading: copilotUploadedFiles.length > 0,
      error: null,
    }
  }, [completedCopilotSupportingDocumentInputs, copilotSupportingDocumentCumulativeAnalysis, copilotUploadedFiles.length])

  useEffect(() => {
    if (mode !== 'ai') return
    if (!activeCopilotSupportingDocumentSummary.parsedSummary) return

    stageCopilotSuggestionFromAnalysis(
      activeCopilotSupportingDocumentSummary.parsedSummary as unknown as Record<string, unknown>,
      activeCopilotSupportingDocumentSummary.type === 'cumulative'
        ? 'Synthesized from combined supporting documents.'
        : 'Synthesized from the latest supporting document.',
      activeCopilotSupportingDocumentSummary.type === 'cumulative' &&
        activeCopilotSupportingDocumentSummary.fileCount > 1
        ? 'cumulative'
        : 'document'
    )
    void mergeStrategicPriorityIntoSuggestion(
      activeCopilotSupportingDocumentSummary.parsedSummary as unknown as Record<string, unknown>
    )
  }, [activeCopilotSupportingDocumentSummary, mode])

  useEffect(() => {
    if (mode !== 'ai') return

    for (const item of copilotSupportingDocumentInsightItems) {
      if (item.status !== 'complete' || !item.parsedSummary) continue
      if (shownCopilotDocumentSummaryRef.current.has(item.id)) continue

      shownCopilotDocumentSummaryRef.current.add(item.id)
      setChatMessages((prev) => [
        ...prev,
        {
          from: 'ai',
          kind: 'document-analysis',
          fileName: item.file.name,
          summary: item.parsedSummary,
          text: buildCopilotIndividualAnalysisMessage(item.file.name, item.parsedSummary),
        },
      ])
    }
  }, [copilotSupportingDocumentInsightItems, mode])

  useEffect(() => {
    if (mode !== 'ai') return
    if (completedCopilotSupportingDocumentInputs.length <= 1) {
      shownCopilotCumulativeSummaryScopeRef.current = null
      return
    }

    if (
      copilotSupportingDocumentCumulativeAnalysis.status === 'analyzing' &&
      copilotSupportingDocumentCumulativeAnalysis.scopeKey &&
      shownCopilotCumulativeSummaryScopeRef.current !== copilotSupportingDocumentCumulativeAnalysis.scopeKey
    ) {
      shownCopilotCumulativeSummaryScopeRef.current = `loading:${copilotSupportingDocumentCumulativeAnalysis.scopeKey}`
      setChatMessages((prev) => [
        ...prev,
        {
          from: 'ai',
          kind: 'status',
          title: 'Cumulative Analysis In Progress',
          detail: `Combining ${completedCopilotSupportingDocumentInputs.length} analyzed files into one project-wide evidence view.`,
          text: `## Cumulative Analysis In Progress\nCombining ${completedCopilotSupportingDocumentInputs.length} analyzed files into one project-wide evidence view.`,
        },
      ])
      return
    }

    if (
      copilotSupportingDocumentCumulativeAnalysis.status === 'complete' &&
      copilotSupportingDocumentCumulativeAnalysis.parsedSummary &&
      copilotSupportingDocumentCumulativeAnalysis.scopeKey &&
      shownCopilotCumulativeSummaryScopeRef.current !== copilotSupportingDocumentCumulativeAnalysis.scopeKey
    ) {
      shownCopilotCumulativeSummaryScopeRef.current = copilotSupportingDocumentCumulativeAnalysis.scopeKey
      setChatMessages((prev) => {
        const next = [...prev]
        const lastIndex = next.length - 1
        const message: CopilotChatMessage = {
          from: 'ai',
          kind: 'cumulative-analysis',
          summary: copilotSupportingDocumentCumulativeAnalysis.parsedSummary,
          text: buildCopilotCumulativeAnalysisMessage(copilotSupportingDocumentCumulativeAnalysis.parsedSummary),
        }
        if (lastIndex >= 0 && next[lastIndex].from === 'ai' && next[lastIndex].kind === 'status') {
          next[lastIndex] = message
          return next
        }
        return [...prev, message]
      })
      return
    }

    if (
      copilotSupportingDocumentCumulativeAnalysis.status === 'error' &&
      copilotSupportingDocumentCumulativeAnalysis.scopeKey &&
      shownCopilotCumulativeSummaryScopeRef.current !== copilotSupportingDocumentCumulativeAnalysis.scopeKey
    ) {
      shownCopilotCumulativeSummaryScopeRef.current = copilotSupportingDocumentCumulativeAnalysis.scopeKey
      setChatMessages((prev) => {
        const next = [...prev]
        const lastIndex = next.length - 1
        const message: CopilotChatMessage = {
          from: 'ai',
          kind: 'text',
          text: `## Cumulative Analysis Failed\n${copilotSupportingDocumentCumulativeAnalysis.error ?? 'I could not combine the uploaded documents into one cumulative summary.'}`,
        }
        if (lastIndex >= 0 && next[lastIndex].from === 'ai' && next[lastIndex].kind === 'status') {
          next[lastIndex] = message
          return next
        }
        return [...prev, message]
      })
    }
  }, [
    completedCopilotSupportingDocumentInputs.length,
    copilotSupportingDocumentCumulativeAnalysis.error,
    copilotSupportingDocumentCumulativeAnalysis.parsedSummary,
    copilotSupportingDocumentCumulativeAnalysis.scopeKey,
    copilotSupportingDocumentCumulativeAnalysis.status,
    mode,
  ])
  const actionSummary = activeSupportingDocumentSummary.parsedSummary
  const latestCompletedSupportingDocument = completedSupportingDocumentInputs[completedSupportingDocumentInputs.length - 1] ?? null
  const actionSummarySourceLabel =
    activeSupportingDocumentSummary.type === 'cumulative' && activeSupportingDocumentSummary.fileCount > 1
      ? `Cumulative summary across ${activeSupportingDocumentSummary.fileCount} files`
      : latestCompletedSupportingDocument?.file.name ?? 'Single document summary'
  const actionSuggestedFields = actionSummary?.suggested_project_fields ?? []
  const actionBudgetLines = actionSummary?.budget_lines ?? []
  const actionAccountCode = actionSummary?.account_code_suggestions?.[0] ?? null
  const actionDocumentSummary = actionSummary?.file_summary ?? null
  const actionEvidenceAssessment = actionSummary?.evidence_assessment ?? null
  const actionBudgetTotal = getDocumentSummaryBudgetTotal(actionSummary ?? null)
  const copilotActionSummary = activeCopilotSupportingDocumentSummary.parsedSummary
  const latestCompletedCopilotSupportingDocument =
    completedCopilotSupportingDocumentInputs[completedCopilotSupportingDocumentInputs.length - 1] ?? null
  const copilotActionSummarySourceLabel =
    activeCopilotSupportingDocumentSummary.type === 'cumulative' &&
    activeCopilotSupportingDocumentSummary.fileCount > 1
      ? `Cumulative summary across ${activeCopilotSupportingDocumentSummary.fileCount} files`
      : latestCompletedCopilotSupportingDocument?.file.name ?? 'Single document summary'
  const copilotActionSuggestedFields = copilotActionSummary?.suggested_project_fields ?? []
  const copilotActionBudgetLines = copilotActionSummary?.budget_lines ?? []
  const copilotActionAccountCode = copilotActionSummary?.account_code_suggestions?.[0] ?? null
  const copilotActionDocumentSummary = copilotActionSummary?.file_summary ?? null
  const copilotActionEvidenceAssessment = copilotActionSummary?.evidence_assessment ?? null
  const copilotActionBudgetTotal = getDocumentSummaryBudgetTotal(copilotActionSummary ?? null)
  const copilotSuggestedFieldCount = copilotPendingSuggestion
    ? Object.keys(copilotPendingSuggestion.fields).length
    : 0
  const copilotProjectNameForAi = (
    copilotFormValues.initiativeName ||
    (typeof copilotPendingSuggestion?.fields?.initiativeName === 'string'
      ? copilotPendingSuggestion.fields.initiativeName
      : '')
  ).trim()
  const copilotProjectDescriptionForAi = (
    copilotFormValues.summary ||
    (typeof copilotPendingSuggestion?.fields?.summary === 'string'
      ? copilotPendingSuggestion.fields.summary
      : '')
  ).trim()
  const canCheckCopilotBudgetConsideration = Boolean(
    copilotProjectNameForAi && copilotProjectDescriptionForAi
  )
  const isCopilotProjectFieldSuggestionLoading =
    copilotAiSuggestionLoading || (copilotBusy && optionSelected)
  const isManualSaveBlockedByAiAnalysis = hasPendingSupportingDocumentAnalysis(
    uploadedFiles,
    supportingDocumentAnalyses,
    completedSupportingDocumentInputs,
    supportingDocumentCumulativeAnalysis
  )
  const isCopilotSaveBlockedByAiAnalysis = hasPendingSupportingDocumentAnalysis(
    copilotUploadedFiles,
    copilotSupportingDocumentAnalyses,
    completedCopilotSupportingDocumentInputs,
    copilotSupportingDocumentCumulativeAnalysis
  )

  const copilotFileEvidenceScores = useMemo<Record<string, number | null>>(() => {
    const result: Record<string, number | null> = {}
    for (const file of copilotUploadedFiles) {
      const dropzoneKey = `${file.name}::${file.size}::${file.lastModified}`
      const sig = getUploadedFileSignature(file)
      const score = copilotSupportingDocumentAnalyses[sig]?.parsedSummary?.evidence_assessment?.evidence_score ?? null
      result[dropzoneKey] = typeof score === 'number' ? score : null
    }
    return result
  }, [copilotUploadedFiles, copilotSupportingDocumentAnalyses])

  const persistSupportingDocumentAiRecordsForBudget = async (
    budgetId: string,
    completedInputs: CompletedSupportingDocumentInput[],
    cumulativeAnalysis: UploadedSupportingDocumentCumulativeAnalysis
  ) => {
    if (completedInputs.length === 0) {
      return
    }

    await createDocumentSummaryRecords(
      completedInputs.map((item) => ({
        budgetId,
        documentName: item.file.name,
        documentSummary: item.rawSummary,
      }))
    )

    if (completedInputs.length === 1) {
      const single = completedInputs[0]
      await upsertCumulativeSummaryRecord({
        budgetId,
        responseJson: single.rawSummary,
        responseTime: single.responseTimeMs,
      })
      return
    }

    let cumulativeResponseJson = cumulativeAnalysis.rawSummary?.trim() || ''
    let cumulativeResponseTime = cumulativeAnalysis.responseTimeMs ?? null

    if (!cumulativeResponseJson) {
      const cumulativeResponse = await evaluateCumulativeSupportingDocuments({
        fileInputs: completedInputs.map((item) => ({
          filename: item.file.name,
          fileResponse: item.rawSummary,
        })),
      })

      cumulativeResponseJson = cumulativeResponse.summary
      cumulativeResponseTime = cumulativeResponse.responseTimeMs
    }

    if (!cumulativeResponseJson) {
      return
    }

    await upsertCumulativeSummaryRecord({
      budgetId,
      responseJson: cumulativeResponseJson,
      responseTime: cumulativeResponseTime,
    })
  }

  const workStreamOptions = useMemo(
    () => workStreams.map((option) => ({ value: option.id, label: option.name })),
    [workStreams]
  )

  const technologyCompanyOptions = useMemo(
    () => technologyCompanies.map((option) => ({ value: option.id, label: option.name })),
    [technologyCompanies]
  )

  const selectedTechnologyCompany = useMemo(
    () => technologyCompanies.find((company) => company.id === formValues.technologyCompanyId) ?? null,
    [formValues.technologyCompanyId, technologyCompanies]
  )

  const selectedCopilotTechnologyCompany = useMemo(
    () => technologyCompanies.find((company) => company.id === copilotFormValues.technologyCompanyId) ?? null,
    [copilotFormValues.technologyCompanyId, technologyCompanies]
  )

  const visibleBudgetFields = useMemo(
    () => getVisibleBudgetFields(formValues.activityType),
    [formValues.activityType]
  )

  const copilotVisibleBudgetFields = useMemo(
    () => getVisibleBudgetFields(copilotFormValues.activityType),
    [copilotFormValues.activityType]
  )

  const totalRequested = useMemo(
    () => budgetItems.reduce((sum, item) => sum + item.budgetRequested, 0),
    [budgetItems]
  )

  const copilotTotalRequested = useMemo(
    () => copilotBudgetItems.reduce((sum, item) => sum + item.budgetRequested, 0),
    [copilotBudgetItems]
  )

  useEffect(() => {
    let cancelled = false

    const loadLookups = async () => {
      setLookupLoading(true)
      setLookupError(null)

      try {
        const [strategicPriorityData, workStreamData, technologyData] = await Promise.all([
          getStrategicPriorityOptions(),
          getWorkStreamOptions(),
          getTechnologyCompanies(),
        ])

        if (cancelled) return

        setStrategicPriorities(strategicPriorityData)
        setWorkStreams(workStreamData)
        setTechnologyCompanies(technologyData)
      } catch (error) {
        if (cancelled) return
        setLookupError(error instanceof Error ? error.message : 'Unable to load Dataverse lookups.')
      } finally {
        if (!cancelled) {
          setLookupLoading(false)
        }
      }
    }

    void loadLookups()

    return () => {
      cancelled = true
    }
  }, [])

  const updateField = <K extends keyof FormValues>(field: K, value: FormValues[K]) => {
    setFormValues((prev) => ({ ...prev, [field]: value }))
    setFieldErrors((prev) => {
      if (!prev[field]) return prev
      const nextErrors = { ...prev }
      delete nextErrors[field]
      return nextErrors
    })

    if (field === 'initiativeName' || field === 'summary') {
      setAiSuggestionError(null)
      setAiSuggestionsNeedRefresh(true)
      setPolicyEvaluationError(null)

      const nextValue = typeof value === 'string' ? value.trim() : ''
      const pairedValue =
        field === 'initiativeName' ? formValues.summary.trim() : formValues.initiativeName.trim()

      if (!nextValue || !pairedValue) {
        setAiSuggestions([])
        setAiPromptUsecase(null)
        setLastAiRequestedSignature(null)
        setPolicyEvaluationResult(null)
        setPolicyEvaluationExpanded(false)
      }
    }
  }

  const updateCopilotField = <K extends keyof FormValues>(field: K, value: FormValues[K]) => {
    setCopilotFormValues((prev) => ({ ...prev, [field]: value }))
    setCopilotFieldErrors((prev) => {
      if (!prev[field]) return prev
      const nextErrors = { ...prev }
      delete nextErrors[field]
      return nextErrors
    })

    if (field === 'initiativeName' || field === 'summary') {
      setCopilotAiSuggestionError(null)
      setCopilotAiSuggestionsNeedRefresh(true)
      setCopilotBudgetConsiderationError(null)
    }
  }

  const refreshAiSuggestions = async (nameOverride?: string, descriptionOverride?: string) => {
    const projectName = (nameOverride ?? formValues.initiativeName).trim()
    const projectDescription = (descriptionOverride ?? formValues.summary).trim()

    if (!projectName || !projectDescription) {
      return
    }

    const entityName = getStoredInstanceDetail()?.name?.trim() || ''
    const requestSignature = JSON.stringify({
      entityName,
      projectName,
      projectDescription,
    })

    if (!nameOverride && !descriptionOverride && !aiSuggestionsNeedRefresh && requestSignature === lastAiRequestedSignature) {
      return
    }

    setAiSuggestionLoading(true)
    setAiSuggestionError(null)
    setPolicyEvaluationLoading(true)
    setPolicyEvaluationError(null)

    try {
      const response = await getStrategicPrioritySuggestions({
        entityName,
        projectName,
        projectDescription,
      })

      setAiSuggestions(response.recommendations)
      setAiPromptUsecase(response.promptUsecase)
      setLastAiRequestedSignature(requestSignature)
      setAiSuggestionsNeedRefresh(false)
    } catch (error) {
      setAiSuggestionError(
        error instanceof Error ? error.message : 'Unable to retrieve AI suggestions.'
      )
    } finally {
      setAiSuggestionLoading(false)
    }

    try {
      const policyEvaluationResponse = await evaluateIctBudgetConsiderations({
        entityName,
        projectName,
        projectDescription,
      })

      console.log(
        '[NewProject] ICT Budget Considerations Evaluation custom API response:',
        policyEvaluationResponse
      )
      setPolicyEvaluationResult(policyEvaluationResponse)
    } catch (policyEvaluationError) {
      setPolicyEvaluationError(
        policyEvaluationError instanceof Error
          ? policyEvaluationError.message
          : 'Unable to retrieve ICT Budget Considerations evaluation.'
      )
      setPolicyEvaluationResult(null)
    } finally {
      setPolicyEvaluationLoading(false)
    }
  }

  const refreshCopilotAiSuggestions = async (nameOverride?: string, descriptionOverride?: string) => {
    const projectName = (
      nameOverride ??
      (copilotFormValues.initiativeName ||
        (typeof copilotPendingSuggestion?.fields?.initiativeName === 'string'
          ? copilotPendingSuggestion.fields.initiativeName : ''))
    ).trim()
    const projectDescription = (
      descriptionOverride ??
      (copilotFormValues.summary ||
        (typeof copilotPendingSuggestion?.fields?.summary === 'string'
          ? copilotPendingSuggestion.fields.summary : ''))
    ).trim()

    if (!projectName || !projectDescription) {
      return
    }

    const entityName = getStoredInstanceDetail()?.name?.trim() || ''
    const requestSignature = JSON.stringify({ entityName, projectName, projectDescription })

    if (
      !nameOverride &&
      !descriptionOverride &&
      !copilotAiSuggestionsNeedRefresh &&
      requestSignature === copilotLastAiRequestedSignature
    ) {
      return
    }

    setCopilotAiSuggestionLoading(true)
    setCopilotAiSuggestionError(null)

    try {
      const response = await getStrategicPrioritySuggestions({
        entityName,
        projectName,
        projectDescription,
      })

      setCopilotAiSuggestions(response.recommendations)
      setCopilotAiPromptUsecase(response.promptUsecase)
      setCopilotLastAiRequestedSignature(requestSignature)
      setCopilotAiSuggestionsNeedRefresh(false)
    } catch (error) {
      setCopilotAiSuggestionError(
        error instanceof Error ? error.message : 'Unable to retrieve AI suggestions.'
      )
    } finally {
      setCopilotAiSuggestionLoading(false)
    }
  }

  const runCopilotBudgetConsiderationCheck = async (
    nameOverride?: string,
    descriptionOverride?: string
  ) => {
    const projectName = (
      nameOverride ??
      (copilotFormValues.initiativeName ||
        (typeof copilotPendingSuggestion?.fields?.initiativeName === 'string'
          ? copilotPendingSuggestion.fields.initiativeName : ''))
    ).trim()
    const projectDescription = (
      descriptionOverride ??
      (copilotFormValues.summary ||
        (typeof copilotPendingSuggestion?.fields?.summary === 'string'
          ? copilotPendingSuggestion.fields.summary : ''))
    ).trim()

    if (!projectName || !projectDescription) {
      showErrorToast(
        'Missing project context',
        'Add both the project name and summary before running AI Budget Considerations.'
      )
      return
    }

    setCopilotBudgetConsiderationLoading(true)
    setCopilotBudgetConsiderationError(null)
    setCopilotWorkspaceView('chat')
    setChatMessages((prev) => [
      ...prev,
      {
        from: 'ai',
        kind: 'status',
        title: 'Checking DGE Budget Considerations',
        detail: 'Reviewing the current project context against the budget consideration policies.',
        text: 'Checking DGE Budget Considerations...',
      },
    ])

    try {
      const response = await evaluateIctBudgetConsiderations({
        entityName: getStoredInstanceDetail()?.name?.trim() || '',
        projectName,
        projectDescription,
      })
      setCopilotBudgetConsiderationResult(response)
      setChatMessages((prev) => {
        const next = [...prev]
        const lastIndex = next.length - 1
        if (lastIndex >= 0 && next[lastIndex].from === 'ai' && next[lastIndex].kind === 'status') {
          next[lastIndex] = {
            from: 'ai',
            kind: 'policy-analysis',
            policyResult: response,
            text: buildCopilotBudgetConsiderationMessage(response),
          }
          return next
        }
        return [
          ...prev,
          {
            from: 'ai',
            kind: 'policy-analysis',
            policyResult: response,
            text: buildCopilotBudgetConsiderationMessage(response),
          },
        ]
      })
    } catch {
      setCopilotBudgetConsiderationResult(null)
      setCopilotBudgetConsiderationError('Unable to retrieve ICT Budget Considerations evaluation.')
      setChatMessages((prev) => {
        const next = [...prev]
        const lastIndex = next.length - 1
        const errorText = 'The DGE Budget Considerations check could not be completed right now. This is usually a temporary service issue — please try again in a moment.'
        if (lastIndex >= 0 && next[lastIndex].from === 'ai' && next[lastIndex].kind === 'status') {
          next[lastIndex] = { from: 'ai', kind: 'text', text: errorText }
          return next
        }
        return [...prev, { from: 'ai', kind: 'text', text: errorText }]
      })
    } finally {
      setCopilotBudgetConsiderationLoading(false)
    }
  }

  const buildCopilotRuntimeContext = (): BudgetCopilotRuntimeContext => ({
    current_form_state: copilotFormValues,
    uploaded_documents: copilotUploadedFiles.map((file) => ({
      name: file.name,
      size: file.size,
      signature: getUploadedFileSignature(file),
    })),
    file_analyses: completedCopilotSupportingDocumentInputs.map((item) => ({
      fileName: item.file.name,
      summary: item.parsedSummary,
    })),
    cumulative_analysis: activeCopilotSupportingDocumentSummary.parsedSummary,
    budget_rows: copilotBudgetItems,
    pending_suggestions: copilotPendingSuggestion,
    entity_name: getStoredInstanceDetail()?.name?.trim() || '',
  })

  const toCopilotChatHistory = (messages: { from: 'ai' | 'user'; text: string }[]): BudgetCopilotChatMessage[] =>
    messages.map((message) => ({
      role: message.from === 'ai' ? 'assistant' : 'user',
      content: message.text,
    }))

  const simulateCopilotAssistantMessage = async (targetText: string) => {
    setCopilotTyping(true)
    setChatMessages((prev) => {
      const next = [...prev]
      const lastIndex = next.length - 1
      if (lastIndex >= 0 && next[lastIndex].from === 'ai' && next[lastIndex].kind === 'status') {
        next[lastIndex] = { from: 'ai', kind: 'text', text: '' }
        return next
      }
      return [...prev, { from: 'ai', kind: 'text', text: '' }]
    })

    let current = ''
    while (current.length < targetText.length) {
      const remaining = targetText.length - current.length
      const chunkSize = remaining > 140 ? 14 : remaining > 60 ? 8 : 4
      current = targetText.slice(0, current.length + chunkSize)
      setChatMessages((prev) => {
        const next = [...prev]
        const index = next.length - 1
        if (index >= 0 && next[index].from === 'ai') {
          next[index] = { ...next[index], text: current }
        }
        return next
      })
      await new Promise((resolve) => window.setTimeout(resolve, 18))
    }

    setCopilotTyping(false)
  }

  const clearCopilotWorkspace = () => {
    setChatInput('')
    setOptionSelected(false)
    setCopilotWorkspaceView('chat')
    setCopilotFormRevealed(false)
    setChatMessages([])
    setCopilotFormValues(INITIAL_FORM_VALUES)
    setCopilotFieldErrors({})
    setCopilotBudgetItems([])
    setCopilotBudgetItemsError(null)
    setCopilotUploadedFiles([])
    setCopilotSupportingDocumentAnalyses({})
    setCopilotSupportingDocumentCumulativeAnalysis({
      status: 'idle',
      parsedSummary: null,
      rawSummary: '',
      responseTimeMs: null,
      error: null,
      sourceFileCount: 0,
      scopeKey: null,
    })
    setCopilotPendingSuggestion(null)
    setCopilotAiSuggestions([])
    setCopilotAiSuggestionError(null)
    setCopilotAiPromptUsecase(null)
    setCopilotLastAiRequestedSignature(null)
    setCopilotAiSuggestionsNeedRefresh(false)
    setCopilotBudgetConsiderationResult(null)
    setCopilotBudgetConsiderationError(null)
    shownCopilotDocumentSummaryRef.current.clear()
    shownCopilotCumulativeSummaryScopeRef.current = null
  }

  const handleCopilotChatFileSelection = (file: File | null) => {
    if (!file) {
      return
    }

    const {
      validFiles,
      rejectedZeroKb,
      rejectedOversize,
      rejectedRestrictedType,
      rejectedUnsupportedType,
    } = validateFilesForUpload({
      incoming: [file],
      existingFiles: copilotUploadedFiles,
      accept: '.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.jpg,.jpeg',
      maxSizeMB: 20,
    })

    if (rejectedZeroKb.length > 0) {
      showErrorToast(
        'Empty files are not allowed',
        `${rejectedZeroKb.join(', ')} ${rejectedZeroKb.length === 1 ? 'is' : 'are'} 0 KB and cannot be uploaded.`
      )
    }
    if (rejectedOversize.length > 0) {
      showErrorToast(
        'File size exceeded',
        `${rejectedOversize.join(', ')} ${rejectedOversize.length === 1 ? 'is' : 'are'} larger than 20 MB and cannot be uploaded.`
      )
    }
    if (rejectedRestrictedType.length > 0) {
      showErrorToast(
        'Restricted file type',
        `${rejectedRestrictedType.join(', ')} ${rejectedRestrictedType.length === 1 ? 'is' : 'are'} not allowed for security reasons.`
      )
    }
    if (rejectedUnsupportedType.length > 0) {
      showErrorToast(
        'Unsupported file type',
        `${rejectedUnsupportedType.join(', ')} ${rejectedUnsupportedType.length === 1 ? 'is' : 'are'} not in the supported file types list.`
      )
    }

    const validFile = validFiles[0] ?? null
    if (!validFile) {
      return
    }

    setCopilotWorkspaceView('chat')
    if (!copilotBusy) {
      void sendCopilotPromptWithFile(validFile, chatInput)
    } else {
      setChatStagedFile(validFile)
    }
  }

  // Types into the last existing AI message rather than appending a new one
  const simulateCopilotAssistantMessageInPlace = async (targetText: string) => {
    setCopilotTyping(true)
    let current = ''
    while (current.length < targetText.length) {
      const remaining = targetText.length - current.length
      const chunkSize = remaining > 140 ? 14 : remaining > 60 ? 8 : 4
      current = targetText.slice(0, current.length + chunkSize)
      setChatMessages((prev) => {
        const next = [...prev]
        const lastIndex = next.length - 1
        if (lastIndex >= 0 && next[lastIndex].from === 'ai') {
          next[lastIndex] = { ...next[lastIndex], text: current }
        }
        return next
      })
      await new Promise((resolve) => window.setTimeout(resolve, 18))
    }
    setCopilotTyping(false)
  }

  const stageCopilotSuggestionFromAnalysis = (
    parsed: Record<string, unknown> | null,
    assistantText: string,
    source: CopilotPendingSuggestion['source'],
    extraFields?: Partial<Record<keyof FormValues, string | string[]>>
  ) => {
    if (!parsed && !extraFields) return
    const baseFields = parsed ? collectCopilotSuggestedFields(parsed) : {}
    const nextFields = { ...baseFields, ...(extraFields ?? {}) }
    const nextBudgetRows = parsed ? buildBudgetItemsFromSupportingDocumentSummary(parsed) : []
    const reviewFlags = parsed && Array.isArray(parsed.review_flags)
      ? (parsed.review_flags as Array<Record<string, unknown>>).map((flag) => ({
          flag: String(flag.flag ?? ''),
          reason: String(flag.reason ?? ''),
          severity: String(flag.severity ?? ''),
        }))
      : []

    if (Object.keys(nextFields).length === 0 && nextBudgetRows.length === 0) {
      return
    }

    setCopilotPendingSuggestion({
      title:
        source === 'cumulative'
          ? 'Suggestions From Combined Documents'
          : source === 'document'
            ? 'Suggestions From Supporting Documents'
            : 'Suggestions From This Conversation',
      fields: nextFields,
      budgetRows: nextBudgetRows,
      source,
      evidence: assistantText,
      reviewFlags,
      rawModelResponse: JSON.stringify(parsed),
    })
  }

  const mergeStrategicPriorityIntoSuggestion = async (
    structuredParsed: Record<string, unknown> | null
  ) => {
    const extracted = structuredParsed ? collectCopilotSuggestedFields(structuredParsed) : {}
    const name = ((extracted.initiativeName as string | undefined) ?? copilotFormValues.initiativeName).trim()
    const desc = ((extracted.summary as string | undefined) ?? copilotFormValues.summary).trim()
    if (!name || !desc) return

    try {
      const entityName = getStoredInstanceDetail()?.name?.trim() || ''
      const response = await getStrategicPrioritySuggestions({ entityName, projectName: name, projectDescription: desc })
      const top = response.recommendations[0]
      if (!top) return

      setCopilotAiSuggestions(response.recommendations)
      setCopilotAiPromptUsecase(response.promptUsecase)

      const priorityRecord = strategicPriorities.find(
        (opt) => !opt.parentId && spNameMatch(opt.name, top.strategicPriority)
      ) ?? null
      const classificationRecord = priorityRecord
        ? strategicPriorities.find(
            (opt) => opt.parentId === priorityRecord.id && spNameMatch(opt.name, top.strategicPriorityClassification)
          ) ?? null
        : null

      if (!priorityRecord?.id) return

      // Store names (not IDs) — applyCopilotFieldPatch does fuzzy name→ID resolution at apply time
      const priorityExtraFields: Partial<Record<keyof FormValues, string | string[]>> = {
        strategicPriorityId: priorityRecord.name,
      }
      if (classificationRecord?.id) {
        priorityExtraFields.strategicPriorityClassificationId = classificationRecord.name
      }

      setCopilotPendingSuggestion((prev) => {
        if (!prev) return prev
        return { ...prev, fields: { ...prev.fields, ...priorityExtraFields } }
      })
    } catch {
      // non-blocking — strategic priority merge failure does not affect chat flow
    }
  }

  const sendCopilotPrompt = async (messageText: string) => {
    const trimmed = messageText.trim()
    if (!trimmed || copilotBusy) return

    setCopilotBusy(true)
    setCopilotWorkspaceView('chat')
    setCopilotFormRevealed(true)
    setOptionSelected(true)
    setChatMessages((prev) => [
      ...prev,
      { from: 'user', text: trimmed },
      {
        from: 'ai',
        kind: 'status',
        title: 'Thinking',
        detail: 'Understanding your request and preparing the next guided response.',
        text: 'Thinking...',
      },
    ])
    setChatInput('')

    const nextMessages: Array<{ from: 'ai' | 'user'; text: string }> = [
      ...chatMessages,
      { from: 'user', text: trimmed },
    ]
    let chatReplyText = ''
    try {
      const runtimeContext = buildCopilotRuntimeContext()
      const chatReply = await getBudgetCopilotChatReply({
        messages: toCopilotChatHistory(nextMessages),
        runtimeContext,
      })
      chatReplyText = chatReply.text

      await simulateCopilotAssistantMessage(
        chatReply.text.trim() ||
          'I reviewed that and prepared draft guidance for the budget form. Review the staged suggestions before applying them.'
      )

      // Secondary extraction — silently ignored if it fails so the visible reply is never replaced
      try {
        const structured = await getBudgetCopilotStructuredAnalysis({
          messages: toCopilotChatHistory([
            ...nextMessages,
            { from: 'ai', text: chatReply.text },
          ]),
          runtimeContext,
        })
        const parsedAnalysis = structured.parsed && typeof structured.parsed === 'object'
          ? (structured.parsed as Record<string, unknown>)
          : null
        stageCopilotSuggestionFromAnalysis(parsedAnalysis, chatReply.text, 'chat')
        void mergeStrategicPriorityIntoSuggestion(parsedAnalysis)
      } catch {
        // Structured extraction failure — does not affect the visible reply
      }
    } catch (error) {
      // Only show an error when the primary reply call itself fails (e.g. network/timeout)
      const isServiceError =
        error instanceof Error &&
        (error.message.includes('504') ||
          error.message.includes('timeout') ||
          error.message.includes('Timeout') ||
          error.message.includes('network') ||
          error.message.includes('Failed to fetch'))
      if (isServiceError || !chatReplyText) {
        setChatMessages((prev) => {
          const next = [...prev]
          const lastIndex = next.length - 1
          const errorText = 'Something went wrong while preparing a reply. Please try again — your previous message is still saved.'
          if (lastIndex >= 0 && next[lastIndex].from === 'ai' && next[lastIndex].kind === 'status') {
            next[lastIndex] = { from: 'ai', kind: 'text', text: errorText }
            return next
          }
          return [...prev, { from: 'ai', kind: 'text', text: errorText }]
        })
      }
    } finally {
      setCopilotBusy(false)
      setCopilotTyping(false)
    }
  }

  const handleOptionSelect = (label: string) => {
    void sendCopilotPrompt(label)
  }

  const handleSend = () => {
    if (chatStagedFile) {
      void sendCopilotPromptWithFile(chatStagedFile, chatInput)
    } else {
      void sendCopilotPrompt(chatInput)
    }
  }

  const sendCopilotPromptWithFile = async (file: File, text?: string) => {
    if (copilotBusy) return

    const signature = getUploadedFileSignature(file)
    const userText = text?.trim()
      ? `${text.trim()}\n\nAttached file: ${file.name}`
      : `Attached file: ${file.name}`

    setCopilotBusy(true)
    setCopilotWorkspaceView('chat')
    setCopilotFormRevealed(true)
    setOptionSelected(true)
    setChatInput('')
    setChatStagedFile(null)

    // Add file to the shared uploaded-files pool (right-side panel + cumulative analysis)
    setCopilotUploadedFiles((prev) =>
      prev.some((f) => getUploadedFileSignature(f) === signature) ? prev : [...prev, file]
    )

    // Pre-mark as analyzing so the background useEffect skips it
    copilotSupportingDocumentAnalysisInFlightRef.current.add(signature)
    setCopilotSupportingDocumentAnalyses((current) => ({
      ...current,
      [signature]: { status: 'analyzing', parsedSummary: null, rawSummary: '', responseTimeMs: null, error: null },
    }))

    setChatMessages((prev) => [...prev, { from: 'user', text: userText }])

    // Placeholder "analyzing" message
    setChatMessages((prev) => [
      ...prev,
      {
        from: 'ai',
        kind: 'status',
        title: 'File Analysis In Progress',
        detail: `${file.name} is being read and mapped into project evidence. This may take a few minutes.`,
        text: `## File Analysis In Progress\n### ${file.name}\nReading the file and extracting evidence for the draft.`,
      },
    ])

    try {
      const analysisResponse = await evaluateSupportingDocument({ file })

      const analysisEntry: UploadedSupportingDocumentAnalysis = {
        status: analysisResponse.parsedSummary ? 'complete' : 'error',
        parsedSummary: analysisResponse.parsedSummary,
        rawSummary: analysisResponse.summary,
        responseTimeMs: analysisResponse.responseTimeMs,
        error: analysisResponse.parsedSummary
          ? null
          : 'The response did not contain a usable structured summary.',
      }
      setCopilotSupportingDocumentAnalyses((current) => ({ ...current, [signature]: analysisEntry }))
      const parsedSummaryRecord = analysisResponse.parsedSummary as unknown as Record<string, unknown> | null
      if (parsedSummaryRecord) {
        stageCopilotSuggestionFromAnalysis(
          parsedSummaryRecord,
          buildCopilotIndividualAnalysisMessage(file.name, analysisResponse.parsedSummary),
          'document'
        )
        void mergeStrategicPriorityIntoSuggestion(parsedSummaryRecord)
      }

      const analysisMessage = buildCopilotIndividualAnalysisMessage(file.name, analysisResponse.parsedSummary)

      setChatMessages((prev) => {
        const next = [...prev]
        const lastIndex = next.length - 1
        if (lastIndex >= 0 && next[lastIndex].from === 'ai') {
          next[lastIndex] = {
            from: 'ai',
            kind: 'document-analysis',
            fileName: file.name,
            summary: analysisResponse.parsedSummary,
            text: analysisMessage,
          }
        }
        return next
      })
      shownCopilotDocumentSummaryRef.current.add(signature)
    } catch {
      setCopilotSupportingDocumentAnalyses((current) => ({
        ...current,
        [signature]: {
          status: 'error',
          parsedSummary: null,
          rawSummary: '',
          responseTimeMs: null,
          error: 'Document analysis failed.',
        },
      }))
      setChatMessages((prev) => {
        const next = [...prev]
        const lastIndex = next.length - 1
        if (lastIndex >= 0 && next[lastIndex].from === 'ai') {
          next[lastIndex] = {
            from: 'ai',
            kind: 'text',
            text: `We weren't able to analyse **${file.name}** right now. This can happen due to a temporary service issue. Please try uploading the file again.`,
          }
        }
        return next
      })
    } finally {
      copilotSupportingDocumentAnalysisInFlightRef.current.delete(signature)
      setCopilotBusy(false)
      setCopilotTyping(false)
    }
  }

  const applyAiSuggestion = (
    suggestion: MatchedAiSuggestion,
    mode: 'both' | 'priority' | 'classification'
  ) => {
    const nextPriorityId =
      mode === 'priority' || mode === 'both'
        ? suggestion.priorityId
        : suggestion.classificationParentId ?? formValues.strategicPriorityId
    const nextClassificationId =
      mode === 'priority'
        ? ''
        : suggestion.classificationId ?? ''

    if (!nextPriorityId) {
      showErrorToast(
        'Suggestion could not be applied',
        'The recommended Strategic Priority could not be matched to a live Dataverse option.'
      )
      return
    }

    if ((mode === 'classification' || mode === 'both') && !nextClassificationId) {
      showErrorToast(
        'Suggestion could not be applied',
        'The recommended Strategic Priority Classification could not be matched to a live Dataverse option.'
      )
      return
    }

    setFormValues((prev) => ({
      ...prev,
      strategicPriorityId: nextPriorityId,
      strategicPriorityClassificationId: nextClassificationId,
    }))

    setFieldErrors((prev) => {
      const nextErrors = { ...prev }
      delete nextErrors.strategicPriorityId
      delete nextErrors.strategicPriorityClassificationId
      return nextErrors
    })
  }

  const handleStrategicPriorityChange = (value: string) => {
    setFormValues((prev) => ({
      ...prev,
      strategicPriorityId: value,
      strategicPriorityClassificationId: '',
    }))
    setFieldErrors((prev) => {
      const nextErrors = { ...prev }
      delete nextErrors.strategicPriorityId
      delete nextErrors.strategicPriorityClassificationId
      return nextErrors
    })
  }

  const applyCopilotAiSuggestion = (
    suggestion: MatchedAiSuggestion,
    mode: 'both' | 'priority' | 'classification'
  ) => {
    const nextPriorityId =
      mode === 'priority' || mode === 'both'
        ? suggestion.priorityId
        : (suggestion.classificationParentId ?? copilotFormValues.strategicPriorityId) || null

    const nextClassificationId =
      mode === 'classification' || mode === 'both'
        ? suggestion.classificationId
        : null

    if ((mode === 'priority' || mode === 'both') && !nextPriorityId) {
      showErrorToast(
        'Suggestion could not be applied',
        'The recommended Strategic Priority could not be matched to a live Dataverse option.'
      )
      return
    }

    if ((mode === 'classification' || mode === 'both') && !nextClassificationId) {
      showErrorToast(
        'Suggestion could not be applied',
        'The recommended Strategic Priority Classification could not be matched to a live Dataverse option.'
      )
      return
    }

    setCopilotFormValues((prev) => {
      const next = { ...prev }
      if (mode === 'priority' || mode === 'both') {
        next.strategicPriorityId = nextPriorityId!
        next.strategicPriorityClassificationId = ''
      }
      if ((mode === 'classification' || mode === 'both') && nextClassificationId) {
        next.strategicPriorityClassificationId = nextClassificationId
      }
      return next
    })

    setCopilotFieldErrors((prev) => {
      const nextErrors = { ...prev }
      delete nextErrors.strategicPriorityId
      delete nextErrors.strategicPriorityClassificationId
      return nextErrors
    })
  }

  const handleApplyAlternateCopilotAiSuggestion = (suggestion: MatchedAiSuggestion) => {
    applyCopilotAiSuggestion(suggestion, 'both')
    setCopilotAltSuggestionApplied(true)
    window.setTimeout(() => setCopilotAltSuggestionApplied(false), 1400)
  }

  const handleCopilotStrategicPriorityChange = (value: string) => {
    setCopilotFormValues((prev) => ({
      ...prev,
      strategicPriorityId: value,
      strategicPriorityClassificationId: '',
    }))
    setCopilotFieldErrors((prev) => {
      const nextErrors = { ...prev }
      delete nextErrors.strategicPriorityId
      delete nextErrors.strategicPriorityClassificationId
      return nextErrors
    })
  }

  const handleTechnologyCompanyChange = (value: string) => {
    setFormValues((prev) => ({
      ...prev,
      technologyCompanyId: value,
      technologyProductIds: [],
    }))
    setFieldErrors((prev) => {
      const nextErrors = { ...prev }
      delete nextErrors.technologyCompanyId
      delete nextErrors.technologyProductIds
      return nextErrors
    })
  }

  const handleCopilotTechnologyCompanyChange = (value: string) => {
    setCopilotFormValues((prev) => ({
      ...prev,
      technologyCompanyId: value,
      technologyProductIds: [],
    }))
    setCopilotFieldErrors((prev) => {
      const nextErrors = { ...prev }
      delete nextErrors.technologyCompanyId
      delete nextErrors.technologyProductIds
      return nextErrors
    })
  }

  const handleActivityTypeChange = (value: ActivityType) => {
    const nextVisibleFields = getVisibleBudgetFields(value)

    setFormValues((prev) => ({
      ...prev,
      activityType: value,
      totalBudgetPaidPreviousYear: nextVisibleFields.includes('totalBudgetPaidPreviousYear')
        ? prev.totalBudgetPaidPreviousYear
        : '',
      totalBudgetPayableFutureYear: nextVisibleFields.includes('totalBudgetPayableFutureYear')
        ? prev.totalBudgetPayableFutureYear
        : '',
      totalBudgetPayableNextYear: nextVisibleFields.includes('totalBudgetPayableNextYear')
        ? prev.totalBudgetPayableNextYear
        : '',
      totalBudgetPayableForYearAfterNext: nextVisibleFields.includes(
        'totalBudgetPayableForYearAfterNext'
      )
        ? prev.totalBudgetPayableForYearAfterNext
        : '',
    }))

    setFieldErrors((prev) => {
      const nextErrors = { ...prev }
      delete nextErrors.activityType
      delete nextErrors.totalBudgetPaidPreviousYear
      delete nextErrors.totalBudgetPayableFutureYear
      delete nextErrors.totalBudgetPayableNextYear
      delete nextErrors.totalBudgetPayableForYearAfterNext
      return nextErrors
    })
  }

  const handleCopilotActivityTypeChange = (value: ActivityType) => {
    const nextVisibleFields = getVisibleBudgetFields(value)

    setCopilotFormValues((prev) => ({
      ...prev,
      activityType: value,
      totalBudgetPaidPreviousYear: nextVisibleFields.includes('totalBudgetPaidPreviousYear')
        ? prev.totalBudgetPaidPreviousYear
        : '',
      totalBudgetPayableFutureYear: nextVisibleFields.includes('totalBudgetPayableFutureYear')
        ? prev.totalBudgetPayableFutureYear
        : '',
      totalBudgetPayableNextYear: nextVisibleFields.includes('totalBudgetPayableNextYear')
        ? prev.totalBudgetPayableNextYear
        : '',
      totalBudgetPayableForYearAfterNext: nextVisibleFields.includes(
        'totalBudgetPayableForYearAfterNext'
      )
        ? prev.totalBudgetPayableForYearAfterNext
        : '',
    }))

    setCopilotFieldErrors((prev) => {
      const nextErrors = { ...prev }
      delete nextErrors.activityType
      delete nextErrors.totalBudgetPaidPreviousYear
      delete nextErrors.totalBudgetPayableFutureYear
      delete nextErrors.totalBudgetPayableNextYear
      delete nextErrors.totalBudgetPayableForYearAfterNext
      return nextErrors
    })
  }

  const toggleTechnologyProduct = (productId: string) => {
    setFormValues((prev) => ({
      ...prev,
      technologyProductIds: prev.technologyProductIds.includes(productId)
        ? prev.technologyProductIds.filter((id) => id !== productId)
        : [...prev.technologyProductIds, productId],
    }))
  }

  const toggleCopilotTechnologyProduct = (productId: string) => {
    setCopilotFormValues((prev) => ({
      ...prev,
      technologyProductIds: prev.technologyProductIds.includes(productId)
        ? prev.technologyProductIds.filter((id) => id !== productId)
        : [...prev.technologyProductIds, productId],
    }))
  }

  const handleCreateWorkStream = async () => {
    const trimmedName = newWorkStreamName.trim()
    if (!trimmedName) {
      showErrorToast('Work stream name required', 'Enter a work stream name before creating it.')
      return
    }

    const created = await runActionToast(
      () => createWorkStream(trimmedName),
      {
        processingTitle: 'Creating work stream',
        processingDescription: 'Saving the new work stream to Dataverse...',
        successTitle: 'Work stream created',
        successDescription: 'The new work stream is now available in the dropdown.',
        errorTitle: 'Work stream creation failed',
      }
    )

    setWorkStreams((prev) =>
      [...prev, created].sort((left, right) => left.name.localeCompare(right.name))
    )
    setFormValues((prev) => ({ ...prev, workStreamId: created.id }))
    setNewWorkStreamName('')
    setWorkStreamModalOpen(false)
  }

  const handleCreateTechnologyProduct = async () => {
    const trimmedName = newTechnologyProductName.trim()
    if (!trimmedName) {
      showErrorToast('Product name required', 'Enter a product name before creating it.')
      return
    }

    if (!formValues.technologyCompanyId) {
      showErrorToast(
        'Select a technology company first',
        'A technology company must be selected before creating a new product.'
      )
      return
    }

    const created = await runActionToast(
      () => createTechnologyProductForCompany(formValues.technologyCompanyId, trimmedName),
      {
        processingTitle: 'Creating technology product',
        processingDescription: 'Creating the product and associating it with the selected company...',
        successTitle: 'Technology product created',
        successDescription: 'The new product is ready to select for this budget item.',
        errorTitle: 'Technology product creation failed',
      }
    )

    setTechnologyCompanies((prev) =>
      prev.map((company) =>
        company.id !== formValues.technologyCompanyId
          ? company
          : {
              ...company,
              products: [...company.products, created].sort((left, right) =>
                left.name.localeCompare(right.name)
              ),
            }
      )
    )

    setFormValues((prev) => ({
      ...prev,
      technologyProductIds: prev.technologyProductIds.includes(created.id)
        ? prev.technologyProductIds
        : [...prev.technologyProductIds, created.id],
    }))
    setNewTechnologyProductName('')
    setTechnologyProductModalOpen(false)
  }

  const validateForm = () => {
    const nextErrors: FieldErrorMap = {}

    if (!formValues.initiativeName.trim()) {
      nextErrors.initiativeName = 'Initiative / Budget Item Name is required.'
    }
    if (!formValues.strategicPriorityId) {
      nextErrors.strategicPriorityId = 'Strategic Priorities is required.'
    }
    if (!formValues.strategicPriorityClassificationId) {
      nextErrors.strategicPriorityClassificationId =
        'Strategic Priority Classifications is required.'
    }
    if (!formValues.budgetItemType) {
      nextErrors.budgetItemType = 'ICT Budget Items Type is required.'
    }
    if (!formValues.plannedStartDate) {
      nextErrors.plannedStartDate = 'Planned Start Date is required.'
    }
    if (!formValues.plannedEndDate) {
      nextErrors.plannedEndDate = 'Planned End Date is required.'
    }
    if (!formValues.summary.trim()) {
      nextErrors.summary = 'Summary / Description is required.'
    }
    if (!formValues.activityType) {
      nextErrors.activityType = 'Project Budget Type is required.'
    }

    visibleBudgetFields.forEach((field) => {
      if (!formValues[field]) {
        nextErrors[field] = `${toCurrencyFieldLabel(field)} is required.`
      }
    })

    if (budgetItems.length === 0) {
      nextErrors.budgetItems = 'Add at least one budget account code before saving the draft.'
    } else if (budgetItems.some((item) => item.budgetRequested <= 0)) {
      nextErrors.budgetItems = 'Each budget account code must have a requested budget greater than zero.'
    }

    setFieldErrors(nextErrors)
    setBudgetItemsError(nextErrors.budgetItems ?? null)

    if (Object.keys(nextErrors).length > 0) {
      const missingFields = Object.keys(nextErrors).map((key) => VALIDATION_LABELS[key as keyof typeof VALIDATION_LABELS])
      showErrorToast(
        'Complete required fields',
        `Please review:\n${missingFields.map((field) => `• ${field}`).join('\n')}`
      )
      return false
    }

    return true
  }

  const handleSaveDraft = async () => {
    if (isManualSaveBlockedByAiAnalysis) {
      showErrorToast(
        'AI document analysis still running',
        'Wait for all uploaded documents to finish individual and cumulative AI analysis before saving the draft.'
      )
      return
    }

    if (!validateForm()) {
      return
    }

    const payload: CreateIctBudgetDraftInput = {
      initiativeName: formValues.initiativeName,
      strategicPriorityId: formValues.strategicPriorityId,
      strategicPriorityClassificationId: formValues.strategicPriorityClassificationId,
      workStreamId: formValues.workStreamId || null,
      technologyCompanyId: formValues.technologyCompanyId || null,
      technologyProductIds: formValues.technologyProductIds,
      plannedStartDate: formValues.plannedStartDate,
      plannedEndDate: formValues.plannedEndDate,
      summary: formValues.summary,
      activityType: formValues.activityType as ActivityType,
      budgetItemType: formValues.budgetItemType as BudgetItemType,
      category: formValues.category,
      totalBudgetPaidPreviousYear: parseCurrencyValue(formValues.totalBudgetPaidPreviousYear),
      totalBudgetPayableFutureYear: parseCurrencyValue(formValues.totalBudgetPayableFutureYear),
      totalBudgetPayableNextYear: parseCurrencyValue(formValues.totalBudgetPayableNextYear),
      totalBudgetPayableForYearAfterNext: parseCurrencyValue(
        formValues.totalBudgetPayableForYearAfterNext
      ),
    }

    const createdBudget = await runActionToast(
      async () => {
        const budget = await createIctBudgetDraft(payload)
        await createBudgetLineItems(budget.id, budgetItems)
        return budget
      },
      {
        processingTitle: 'Saving draft',
        processingDescription:
          'Creating the ICT budget, associating technologies, and saving budget line items...',
        successTitle: 'Draft saved successfully',
        successDescription: 'The Create Project draft has been created in Dataverse.',
        errorTitle: 'Draft save failed',
        minDurationMs: 3600,
      }
    )

    if (uploadedFiles.length > 0) {
      try {
        await runActionToast(
          () => uploadFilesToRecord(createdBudget.id, uploadedFiles),
          {
            processingTitle: 'Uploading documents',
            processingDescription: `Uploading ${uploadedFiles.length} supporting document${uploadedFiles.length !== 1 ? 's' : ''}...`,
            successTitle: 'Documents uploaded',
            successDescription: `${uploadedFiles.length} document${uploadedFiles.length !== 1 ? 's' : ''} uploaded successfully.`,
            errorTitle: 'Document upload failed',
            minDurationMs: 2000,
          }
        )
      } catch (uploadErr) {
        console.error('[FileUpload] Upload failed — draft was saved successfully, documents were not uploaded.', uploadErr)
        showErrorToast(
          'Documents not uploaded',
          'The budget draft was saved but document upload failed. Check the browser console for details.'
        )
        navigate(`/respondent/projects/${createdBudget.budgetRefId ?? createdBudget.id}`)
        return
      }
      if (completedSupportingDocumentInputs.length > 0) {
        try {
          await runActionToast(
            () =>
              persistSupportingDocumentAiRecordsForBudget(
                createdBudget.id,
                completedSupportingDocumentInputs,
                supportingDocumentCumulativeAnalysis
              ),
            {
              processingTitle: 'Saving AI summaries',
              processingDescription: 'Storing individual and cumulative document summaries in Dataverse...',
              successTitle: 'AI summaries saved',
              successDescription: 'Supporting-document AI summaries were linked to the draft.',
              errorTitle: 'AI summary save failed',
              minDurationMs: 1200,
            }
          )
        } catch (summaryError) {
          console.error('[NewProject] Draft and documents saved, but AI summary persistence failed.', summaryError)
          showErrorToast(
            'AI summaries not saved',
            'The draft and files were saved successfully, but the AI document summaries could not be persisted.'
          )
        }
      }
    }

    try {
      await triggerIctBudgetAiOverview(createdBudget.id)
    } catch (error) {
      console.error('[NewProject] AI overview flow trigger failed after draft save.', error)
      showErrorToast(
        'AI overview trigger failed',
        'The draft was saved, but the AI Budget Overview flow could not be triggered.'
      )
    }

    try {
      await markCurrentInstancePlanningIfFirstProject()
    } catch (error) {
      console.error('[NewProject] ICT budget instance status update failed after first draft save.', error)
      showErrorToast(
        'Instance status update failed',
        'The draft was saved, but the ICT budget instance could not be moved to Planning.'
      )
    }

    navigate(`/respondent/projects/${createdBudget.budgetRefId ?? createdBudget.id}`)
  }

  const validateCopilotForm = () =>
    validateDraftState({
      values: copilotFormValues,
      budgetItems: copilotBudgetItems,
      setFieldErrors: setCopilotFieldErrors,
      setBudgetItemsError: setCopilotBudgetItemsError,
      showErrorToast,
    })

  const saveDraftFromState = async (input: {
    values: FormValues
    budgetRows: BudgetItemDraft[]
    files: File[]
    completedInputs: CompletedSupportingDocumentInput[]
    cumulativeAnalysis: UploadedSupportingDocumentCumulativeAnalysis
  }) => {
    if (
      hasPendingSupportingDocumentAnalysis(
        input.files,
        copilotSupportingDocumentAnalyses,
        input.completedInputs,
        input.cumulativeAnalysis
      )
    ) {
      showErrorToast(
        'AI document analysis still running',
        'Wait for all uploaded documents to finish individual and cumulative AI analysis before saving the draft.'
      )
      return
    }

    const createdBudget = await runActionToast(
      async () => {
        const budget = await createIctBudgetDraft(buildCreateDraftPayload(input.values))
        await createBudgetLineItems(budget.id, input.budgetRows)
        return budget
      },
      {
        processingTitle: 'Saving draft',
        processingDescription:
          'Creating the ICT budget, associating technologies, and saving budget line items...',
        successTitle: 'Draft saved successfully',
        successDescription: 'The Create Project draft has been created in Dataverse.',
        errorTitle: 'Draft save failed',
        minDurationMs: 3600,
      }
    )

    if (input.files.length > 0) {
      try {
        await runActionToast(() => uploadFilesToRecord(createdBudget.id, input.files), {
          processingTitle: 'Uploading documents',
          processingDescription: `Uploading ${input.files.length} supporting document${input.files.length !== 1 ? 's' : ''}...`,
          successTitle: 'Documents uploaded',
          successDescription: `${input.files.length} document${input.files.length !== 1 ? 's' : ''} uploaded successfully.`,
          errorTitle: 'Document upload failed',
          minDurationMs: 2000,
        })
      } catch (uploadErr) {
        console.error('[FileUpload] Upload failed — draft was saved successfully, documents were not uploaded.', uploadErr)
        showErrorToast(
          'Documents not uploaded',
          'The budget draft was saved but document upload failed. Check the browser console for details.'
        )
        navigate(`/respondent/projects/${createdBudget.budgetRefId ?? createdBudget.id}`)
        return
      }

      if (input.completedInputs.length > 0) {
        try {
          await runActionToast(
            () =>
              persistSupportingDocumentAiRecordsForBudget(
                createdBudget.id,
                input.completedInputs,
                input.cumulativeAnalysis
              ),
            {
              processingTitle: 'Saving AI summaries',
              processingDescription:
                'Storing individual and cumulative document summaries in Dataverse...',
              successTitle: 'AI summaries saved',
              successDescription: 'Supporting-document AI summaries were linked to the draft.',
              errorTitle: 'AI summary save failed',
              minDurationMs: 1200,
            }
          )
        } catch (summaryError) {
          console.error('[NewProject] Draft and documents saved, but AI summary persistence failed.', summaryError)
          showErrorToast(
            'AI summaries not saved',
            'The draft and files were saved successfully, but the AI document summaries could not be persisted.'
          )
        }
      }
    }

    try {
      await triggerIctBudgetAiOverview(createdBudget.id)
    } catch (error) {
      console.error('[NewProject] AI overview flow trigger failed after draft save.', error)
      showErrorToast(
        'AI overview trigger failed',
        'The draft was saved, but the AI Budget Overview flow could not be triggered.'
      )
    }

    try {
      await markCurrentInstancePlanningIfFirstProject()
    } catch (error) {
      console.error('[NewProject] ICT budget instance status update failed after first draft save.', error)
      showErrorToast(
        'Instance status update failed',
        'The draft was saved, but the ICT budget instance could not be moved to Planning.'
      )
    }

    navigate(`/respondent/projects/${createdBudget.budgetRefId ?? createdBudget.id}`)
  }

  const handleCopilotSaveDraft = async () => {
    if (!validateCopilotForm()) return

    await saveDraftFromState({
      values: copilotFormValues,
      budgetRows: copilotBudgetItems,
      files: copilotUploadedFiles,
      completedInputs: completedCopilotSupportingDocumentInputs,
      cumulativeAnalysis: copilotSupportingDocumentCumulativeAnalysis,
    })
  }

  const applyAiFieldSuggestion = (
    field: SupportingDocumentSuggestedProjectField,
    suppressRefresh = false,
  ): { appliedName?: string; appliedDescription?: string } => {
    const result = resolveManualAiFieldSuggestion(field, technologyCompanies)

    if (result.error) {
      showErrorToast('Suggestion not applied', result.error)
      return {}
    }

    if (result.patch.initiativeName !== undefined) {
      updateField('initiativeName', result.patch.initiativeName)
    }

    if (result.patch.summary !== undefined) {
      updateField('summary', result.patch.summary)
    }

    if (result.patch.category !== undefined) {
      updateField('category', result.patch.category)
    }

    if (result.patch.technologyCompanyId !== undefined) {
      handleTechnologyCompanyChange(result.patch.technologyCompanyId)
    }

    if (!suppressRefresh) {
      const name = (result.appliedName ?? formValues.initiativeName).trim()
      const desc = (result.appliedDescription ?? formValues.summary).trim()
      if (name && desc) void refreshAiSuggestions(name, desc)
    }

    return {
      appliedName: result.appliedName,
      appliedDescription: result.appliedDescription,
    }
  }

  const applyAllAiFieldSuggestions = () => {
    let appliedName: string | undefined
    let appliedDescription: string | undefined
    const aggregatedPatch: Partial<FormValues> = {}
    const failedMessages: string[] = []

    for (const field of actionSuggestedFields) {
      const result = resolveManualAiFieldSuggestion(field, technologyCompanies)
      if (result.error) {
        failedMessages.push(result.error)
        continue
      }

      Object.assign(aggregatedPatch, result.patch)
      if (result.appliedName !== undefined) appliedName = result.appliedName
      if (result.appliedDescription !== undefined) appliedDescription = result.appliedDescription
    }

    if (Object.keys(aggregatedPatch).length > 0) {
      setFormValues((prev) => ({
        ...prev,
        ...aggregatedPatch,
      }))

      setFieldErrors((prev) => {
        const nextErrors = { ...prev }
        Object.keys(aggregatedPatch).forEach((key) => {
          delete nextErrors[key as keyof FieldErrorMap]
        })
        if (aggregatedPatch.technologyCompanyId !== undefined) {
          delete nextErrors.technologyProductIds
        }
        return nextErrors
      })
    }

    const name = (appliedName ?? formValues.initiativeName).trim()
    const desc = (appliedDescription ?? formValues.summary).trim()
    if (name && desc) void refreshAiSuggestions(name, desc)

    if (failedMessages.length > 0) {
      showErrorToast(
        'Some suggestions could not be applied',
        failedMessages.join('\n')
      )
    }
  }

  const applyAiAccountCodeSuggestion = async () => {
    if (!actionAccountCode?.account_code) return

    setAiApplyingAccountCode(true)

    try {
      const classificationRecords = await getClassificationRecords()
      const { nodeMap } = buildClassificationTree(classificationRecords)
      const searchTerm = actionAccountCode.account_code.trim().toLowerCase()

      let matchedId: string | null = null

      for (const [id, node] of nodeMap.entries()) {
        if (node.level !== 4) continue
        const nodeName = (node.name ?? '').toLowerCase()
        if (
          nodeName.includes(searchTerm) ||
          searchTerm.includes(nodeName) ||
          (node.ebsCode ?? '').toLowerCase() === searchTerm ||
          (node.fusionCode ?? '').toLowerCase() === searchTerm
        ) {
          matchedId = id
          break
        }
      }

      if (!matchedId) {
        const segments = searchTerm.split(/\s*-\s*/).filter((s) => s.length >= 2)
        for (const seg of segments) {
          if (matchedId) break
          for (const [id, node] of nodeMap.entries()) {
            if (node.level !== 4) continue
            const nodeName = (node.name ?? '').toLowerCase()
            if (nodeName.includes(seg) || seg.includes(nodeName)) {
              matchedId = id
              break
            }
          }
        }
      }

      if (!matchedId) {
        showErrorToast(
          'Account code not found',
          `No GL account matching "${actionAccountCode.account_code}" was found in the classification tree.`
        )
        return
      }

      const draft = buildBudgetItemDraft(matchedId, nodeMap)
      if (!draft) {
        showErrorToast('Apply failed', 'Could not build a budget item from the matched account code.')
        return
      }

      const existingIds = new Set(budgetItems.map((item) => item.id))
      if (existingIds.has(draft.id)) {
        showErrorToast('Already added', 'This account code is already in the budget line items.')
        return
      }

      setBudgetItems((prev) => [
        ...prev,
        { ...draft, budgetRequested: actionAccountCode.requested_budget ?? 0 },
      ])
      setBudgetItemsError(null)
      setFieldErrors((prev) => {
        const next = { ...prev }
        delete next.budgetItems
        return next
      })
    } catch (err) {
      showErrorToast(
        'Apply failed',
        err instanceof Error ? err.message : 'Could not apply the account code suggestion.'
      )
    } finally {
      setAiApplyingAccountCode(false)
    }
  }

  const applyCopilotFieldPatch = (patch: Partial<Record<keyof FormValues, string | string[]>>) => {
    const nextValues = { ...copilotFormValues }
    let pendingTechnologyProductValue: string | string[] | undefined

    for (const [key, value] of Object.entries(patch) as Array<[keyof FormValues, string | string[]]>) {
      if (value === undefined || value === null) continue

      if (key === 'initiativeName' || key === 'summary' || key === 'plannedStartDate' || key === 'plannedEndDate') {
        nextValues[key] = Array.isArray(value) ? value.join(', ') : value
        continue
      }

      if (key === 'category') {
        const raw = Array.isArray(value) ? value[0] ?? '' : value
        const matched = CATEGORY_OPTIONS.find((option) => option.label.toLowerCase() === raw.toLowerCase())
        if (matched) nextValues.category = matched.value
        continue
      }

      if (key === 'budgetItemType') {
        const raw = Array.isArray(value) ? value[0] ?? '' : value
        const matched = BUDGET_ITEM_TYPE_OPTIONS.find((option) => option.label.toLowerCase() === raw.toLowerCase())
        if (matched) nextValues.budgetItemType = matched.value
        continue
      }

      if (key === 'activityType') {
        const raw = Array.isArray(value) ? value[0] ?? '' : value
        const matched = ACTIVITY_TYPE_OPTIONS.find((option) => option.title.toLowerCase() === raw.toLowerCase())
        if (matched) nextValues.activityType = matched.value
        continue
      }

      if (key === 'technologyCompanyId') {
        const raw = Array.isArray(value) ? value[0] ?? '' : value
        const matched = technologyCompanies.find(
          (company) =>
            company.name.toLowerCase() === raw.toLowerCase() ||
            company.name.toLowerCase().includes(raw.toLowerCase()) ||
            raw.toLowerCase().includes(company.name.toLowerCase())
        )
        if (matched) {
          nextValues.technologyCompanyId = matched.id
          nextValues.technologyProductIds = []
        }
        continue
      }

      if (key === 'technologyProductIds') {
        pendingTechnologyProductValue = value
        continue
      }

      if (key === 'workStreamId') {
        const raw = Array.isArray(value) ? value[0] ?? '' : value
        const matched = workStreams.find((stream) => labelsMatch(stream.name, raw))
        if (matched) nextValues.workStreamId = matched.id
        continue
      }

      if (key === 'strategicPriorityId') {
        const raw = Array.isArray(value) ? value[0] ?? '' : value
        const matched = strategicPriorities.find((option) => !option.parentId && spNameMatch(option.name, raw))
        if (matched) {
          nextValues.strategicPriorityId = matched.id
          nextValues.strategicPriorityClassificationId = ''
        }
        continue
      }

      if (key === 'strategicPriorityClassificationId') {
        const raw = Array.isArray(value) ? value[0] ?? '' : value
        const matched = strategicPriorities.find(
          (option) =>
            Boolean(option.parentId) &&
            spNameMatch(option.name, raw) &&
            (!nextValues.strategicPriorityId || option.parentId === nextValues.strategicPriorityId)
        )
        if (matched) {
          nextValues.strategicPriorityClassificationId = matched.id
          if (!nextValues.strategicPriorityId && matched.parentId) {
            nextValues.strategicPriorityId = matched.parentId
          }
        }
      }
    }

    if (pendingTechnologyProductValue !== undefined) {
      const rawValues = Array.isArray(pendingTechnologyProductValue)
        ? pendingTechnologyProductValue
        : [pendingTechnologyProductValue]
      const selectedCompany =
        technologyCompanies.find((company) => company.id === nextValues.technologyCompanyId) ?? null

      if (selectedCompany) {
        nextValues.technologyProductIds = selectedCompany.products
          .filter((product) =>
            rawValues.some(
              (raw) =>
                product.name.toLowerCase() === raw.toLowerCase() ||
                product.name.toLowerCase().includes(raw.toLowerCase()) ||
                raw.toLowerCase().includes(product.name.toLowerCase())
            )
          )
          .map((product) => product.id)
      }
    }

    setCopilotFormValues(nextValues)
    setCopilotFieldErrors((prev) => {
      const nextErrors = { ...prev }
      Object.keys(patch).forEach((key) => delete nextErrors[key as keyof FieldErrorMap])
      return nextErrors
    })
  }

  const applyCopilotPendingSuggestion = async () => {
    if (!copilotPendingSuggestion) return
    applyCopilotFieldPatch(copilotPendingSuggestion.fields)

    // Apply AI-matched strategic priority using pre-resolved IDs for reliable resolution
    const topAiSuggestion = matchedCopilotAiSuggestions[0]
    if (topAiSuggestion?.priorityId) {
      setCopilotFormValues((prev) => ({
        ...prev,
        strategicPriorityId: topAiSuggestion.priorityId!,
        strategicPriorityClassificationId: topAiSuggestion.classificationId ?? '',
      }))
      setCopilotFieldErrors((prev) => {
        const next = { ...prev }
        delete next.strategicPriorityId
        delete next.strategicPriorityClassificationId
        return next
      })
    }

    if (copilotPendingSuggestion.budgetRows.length > 0) {
      try {
        const classificationRecords = await getClassificationRecords()
        const { nodeMap } = buildClassificationTree(classificationRecords)
        const resolvedItems: BudgetItemDraft[] = []

        for (const row of copilotPendingSuggestion.budgetRows) {
          // Already has a real classification GUID — use as-is
          if (!row.id.startsWith('copilot-')) {
            resolvedItems.push(row)
            continue
          }

          // Resolve the GL code string to a real classification record
          const searchTerm = row.glCode.trim().toLowerCase()
          let matchedId: string | null = null

          for (const [id, node] of nodeMap.entries()) {
            if (node.level !== 4) continue
            const nodeName = (node.name ?? '').toLowerCase()
            if (
              nodeName.includes(searchTerm) ||
              searchTerm.includes(nodeName) ||
              (node.ebsCode ?? '').toLowerCase() === searchTerm ||
              (node.fusionCode ?? '').toLowerCase() === searchTerm
            ) {
              matchedId = id
              break
            }
          }

          if (!matchedId) continue

          const draft = buildBudgetItemDraft(matchedId, nodeMap)
          if (draft) resolvedItems.push({ ...draft, budgetRequested: row.budgetRequested })
        }

        if (resolvedItems.length > 0) {
          setCopilotBudgetItems((prev) => {
            const existing = new Set(prev.map((item) => item.id))
            const additions = resolvedItems.filter((item) => !existing.has(item.id))
            return additions.length > 0 ? [...prev, ...additions] : prev
          })
          setCopilotBudgetItemsError(null)
        }
      } catch (error) {
        showErrorToast(
          'Budget items not applied',
          error instanceof Error ? error.message : 'Could not resolve GL codes to classification records.'
        )
      }
    }

    setCopilotPendingSuggestion(null)
  }

  const applyCopilotDocumentFieldSuggestion = (field: SupportingDocumentSuggestedProjectField) => {
    const mapped = collectCopilotSuggestedFields({
      suggested_project_fields: [field],
    })
    if (Object.keys(mapped).length === 0) {
      showErrorToast('Suggestion could not be applied', 'This field could not be mapped to the draft.')
      return
    }
    applyCopilotFieldPatch(mapped)
  }

  const applyAllCopilotDocumentFieldSuggestions = () => {
    const mapped = collectCopilotSuggestedFields({
      suggested_project_fields: copilotActionSuggestedFields,
    })
    if (Object.keys(mapped).length === 0) return
    applyCopilotFieldPatch(mapped)
  }

  const applyCopilotAccountCodeSuggestion = async () => {
    if (!copilotActionAccountCode?.account_code) return

    try {
      const classificationRecords = await getClassificationRecords()
      const { nodeMap } = buildClassificationTree(classificationRecords)
      const searchTerm = copilotActionAccountCode.account_code.trim().toLowerCase()

      let matchedId: string | null = null

      for (const [id, node] of nodeMap.entries()) {
        if (node.level !== 4) continue
        const nodeName = (node.name ?? '').toLowerCase()
        if (
          nodeName.includes(searchTerm) ||
          searchTerm.includes(nodeName) ||
          (node.ebsCode ?? '').toLowerCase() === searchTerm ||
          (node.fusionCode ?? '').toLowerCase() === searchTerm
        ) {
          matchedId = id
          break
        }
      }

      if (!matchedId) {
        showErrorToast(
          'Account code not found',
          `No GL account matching "${copilotActionAccountCode.account_code}" was found in the classification tree.`
        )
        return
      }

      const draft = buildBudgetItemDraft(matchedId, nodeMap)
      if (!draft) return

      setCopilotBudgetItems((prev) => {
        if (prev.some((item) => item.id === draft.id)) return prev
        return [...prev, { ...draft, budgetRequested: copilotActionAccountCode.requested_budget ?? 0 }]
      })
      setCopilotBudgetItemsError(null)
    } catch (error) {
      showErrorToast(
        'Apply failed',
        error instanceof Error ? error.message : 'Could not apply the account code suggestion.'
      )
    }
  }

  const showCreateHeader = !(mode === 'ai' && !copilotFormRevealed)

  return (
    <div className="w-full space-y-6">
      {showCreateHeader ? (
      <div className="rounded-2xl border border-[#DDEBFF] bg-white px-4 py-5 shadow-[0_10px_26px_rgba(15,23,42,0.05)] dark:border-white/10 dark:bg-[#1E293B] sm:px-6">
        <nav className="mb-4 flex flex-wrap items-center gap-1 text-xs text-[#64748B]">
          <Link to="/respondent/dashboard" className="hover:text-[var(--primary)]">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <Link to="/respondent/projects" className="hover:text-[var(--primary)]">My Dashboard</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-[var(--foreground)]">New Budget Item</span>
        </nav>

        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-2xl min-w-0">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)] sm:text-3xl lg:text-[32px]">Create New Project</h1>
            <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
              Capture scope, strategic alignment, budget logic, and account-level budget lines directly against Dataverse.
            </p>
          </div>

          <div className="flex shrink-0 flex-col gap-3 lg:flex-row xl:items-center">
            <div className="flex shrink-0 items-center justify-center gap-3 rounded-2xl border border-[#DDEBFF] bg-white px-4 py-3 shadow-sm dark:border-white/10 dark:bg-white/5">
              <User className={cn('h-5 w-5 shrink-0', mode === 'manual' ? 'text-[var(--primary)]' : 'text-[#94A3B8]')} />
              <span className={cn('shrink-0 text-sm font-bold', mode === 'manual' ? 'text-[var(--primary)]' : 'text-[#94A3B8]')}>Manual</span>
              <button
                onClick={() => setMode(mode === 'manual' ? 'ai' : 'manual')}
                className={cn('relative h-6 w-12 shrink-0 overflow-hidden rounded-full p-1 transition-colors', mode === 'ai' ? 'bg-[var(--primary)]' : 'bg-[#CBD5E1]')}
                aria-label="Toggle input mode"
              >
                <div className={cn('h-4 w-4 rounded-full bg-white shadow transition-transform', mode === 'ai' ? 'translate-x-6' : 'translate-x-0')} />
              </button>
              <span className={cn('shrink-0 text-sm font-bold', mode === 'ai' ? 'text-[var(--primary)]' : 'text-[#94A3B8]')}>Budget Assistant</span>
              <Bot className={cn('h-5 w-5 shrink-0', mode === 'ai' ? 'text-[var(--primary)]' : 'text-[#94A3B8]')} />
            </div>
            <Button
              className="h-11 shrink-0 rounded-xl bg-[var(--primary)] px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#1F5BFF] active:bg-[#1A4ED8]"
              onClick={() => mode === 'manual' ? void handleSaveDraft() : void handleCopilotSaveDraft()}
              disabled={mode === 'manual' ? isManualSaveBlockedByAiAnalysis : isCopilotSaveBlockedByAiAnalysis}
            >
              Save Draft
            </Button>
          </div>
        </div>
      </div>
      ) : null}

      {mode === 'manual' ? (
        <>
          {lookupError && (
            <div className="rounded-2xl border border-[#FFD4D1] bg-[#FFF5F5] px-4 py-3 text-sm text-[#B42318]">
              {lookupError}
            </div>
          )}

          {(policyEvaluationLoading || policyEvaluationError || policyEvaluationResult) && (
            <section>
              {policyEvaluationLoading ? (
                <div className="rounded-2xl border border-[#E9D5FF] bg-[#FDF7FF] px-4 py-3 text-sm text-[#A855F7] dark:border-white/10 dark:bg-white/5 dark:text-[#E9D5FF]">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-current" />
                    Evaluating ICT Budget Considerations policies...
                  </div>
                </div>
              ) : policyEvaluationError ? (
                <div className="rounded-2xl border border-[#FFD4D1] bg-[#FFF5F5] px-4 py-4 text-sm text-[#B42318] dark:border-[#EA4F49]/40 dark:bg-[#EA4F49]/10 sm:px-6">
                  {policyEvaluationError}
                </div>
              ) : policyEvaluationResult ? (
                <div className="relative overflow-hidden rounded-2xl border border-[#E9D5FF] bg-gradient-to-b from-[#FDF8FF] to-white shadow-[0_12px_30px_rgba(15,23,42,0.06)] dark:border-white/10 dark:from-[#2A123D] dark:to-[#1E293B]">
                  <button
                    type="button"
                    onClick={() => {
                      if (policyEvaluationResult.overallAssessment.hasPolicyMatch) {
                        setPolicyEvaluationExpanded((value) => !value)
                      }
                    }}
                    className="flex w-full items-start justify-between gap-4 px-6 py-5 text-left"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1 shrink-0 text-[#A855F7]">
                        <Sparkles className="h-6 w-6" />
                      </div>
                      <div className="min-w-0">
                        <h2 className="text-xl font-bold text-[#0F172A] dark:text-white">
                          AI Budget Considerations
                        </h2>
                        <p className="mt-0.5 text-sm text-[#475569] dark:text-slate-300">
                          {policyEvaluationResult.overallAssessment.hasPolicyMatch
                            ? 'AI screened this project against DGE ICT Budget Considerations and highlighted the policies that need attention.'
                            : policyEvaluationResult.overallAssessment.summary}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-3">
                      {policyEvaluationResult.overallAssessment.hasPolicyMatch ? (
                        <div className="flex flex-wrap items-center justify-end gap-1.5">
                          {policyEvaluationResult.overallAssessment.hasPotentialConflict && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-[#FECACA] px-2.5 py-1 text-xs font-semibold text-[#DC2626] dark:border-[#DC2626]/30 dark:text-[#FCA5A5]">
                              <span className="h-1.5 w-1.5 rounded-full bg-[#DC2626]" />
                              {policyMatchGroups.find((group) => group.matchType === 'Potential Conflict')?.items.length ?? 0} conflict
                            </span>
                          )}
                          {policyEvaluationResult.overallAssessment.hasCoordinationRequirement && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-[#FDE68A] px-2.5 py-1 text-xs font-semibold text-[#B45309] dark:border-[#B45309]/30 dark:text-[#F6D28A]">
                              <span className="h-1.5 w-1.5 rounded-full bg-[#F59E0B]" />
                              {policyMatchGroups.find((group) => group.matchType === 'Coordination Required')?.items.length ?? 0} coordination
                            </span>
                          )}
                          {policyEvaluationResult.overallAssessment.hasAllowedWithConditions && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-[#BBF7D0] px-2.5 py-1 text-xs font-semibold text-[#16A34A] dark:border-[#16A34A]/30 dark:text-[#86EFAC]">
                              <span className="h-1.5 w-1.5 rounded-full bg-[#22C55E]" />
                              {policyMatchGroups.find((group) => group.matchType === 'Allowed With Conditions')?.items.length ?? 0} conditional
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full border border-[#BBF7D0] px-2.5 py-1 text-xs font-semibold text-[#16A34A] dark:border-[#16A34A]/30 dark:text-[#86EFAC]">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#22C55E]" />
                          Cleared by AI
                        </span>
                      )}
                      {policyEvaluationResult.overallAssessment.hasPolicyMatch && (
                        <div className="flex items-center gap-2 rounded-full bg-white/70 px-3 py-1.5 text-sm font-semibold text-[#A855F7] shadow-sm dark:bg-white/10 dark:text-[#E9D5FF]">
                          <span>{policyEvaluationExpanded ? 'Collapse' : 'Expand'}</span>
                          <ChevronDown
                            className={cn(
                              'h-4 w-4 transition-transform',
                              policyEvaluationExpanded && 'rotate-180'
                            )}
                          />
                        </div>
                      )}
                    </div>
                  </button>

                  <div className="px-6 pb-5">
                    {policyEvaluationResult.overallAssessment.hasPolicyMatch ? (
                      <>
                        <div className="p-0">
                          {policyEvaluationExpanded ? (
                            <div className="grid gap-4 lg:grid-cols-3">
                              {policyMatchGroups.flatMap((group) => {
                                const accent = toMatchTypeAccent(group.matchType)

                                return group.items.map((item) => {
                                  const reasonKey = `${item.policyNumber}-${item.policyName}-reason`
                                  const actionKey = `${item.policyNumber}-${item.policyName}-action`
                                  const truncatedReason = truncatePolicyCopy(item.reason, 100)
                                  const truncatedAction = truncatePolicyCopy(item.requiredAction, 92)
                                  const showFullReason = expandedPolicyTextSections[reasonKey] === true
                                  const showFullAction = expandedPolicyTextSections[actionKey] === true
                                  return (
                                    <article
                                      key={`${item.policyNumber}-${item.policyName}-detail`}
                                      className="overflow-hidden rounded-2xl border border-[#E9D5FF] bg-white transition-transform duration-300 hover:-translate-y-0.5 dark:border-white/10 dark:bg-[#1E293B]"
                                    >
                                      <div className="border-b border-[#F0D9FF] px-4 py-3.5 dark:border-white/10">
                                        <div className="flex items-start gap-3">
                                          <div className={cn('mt-0.5 shrink-0', accent.text)}>
                                            {group.matchType === 'Potential Conflict' ? (
                                              <AlertTriangle className="h-5 w-5" />
                                            ) : group.matchType === 'Coordination Required' ? (
                                              <Layers className="h-5 w-5" />
                                            ) : (
                                              <Lightbulb className="h-5 w-5" />
                                            )}
                                          </div>
                                          <div className="min-w-0 flex-1">
                                            <div className="mb-1">
                                              <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em]', accent.sofbadge)}>
                                                <span className={cn('h-1.5 w-1.5 rounded-full', accent.dot)} />
                                                {item.matchType}
                                              </span>
                                            </div>
                                            <h3 className="text-sm font-semibold leading-5 text-[#0F172A] dark:text-white">
                                              {item.policyName}
                                            </h3>
                                            <p className="mt-1 text-xs text-[#64748B] dark:text-slate-300">
                                              Policy {item.policyNumber}
                                            </p>
                                          </div>
                                          <div className="shrink-0 text-right">
                                            <p className="text-xl font-bold text-[#A855F7]">
                                              {item.relevanceScore}
                                            </p>
                                            <p className="text-[10px] uppercase tracking-[0.12em] text-[#94A3B8] dark:text-slate-400">
                                              Probability
                                            </p>
                                          </div>
                                        </div>
                                      </div>

                                      <div className="px-4 py-3.5">
                                        <p className="mb-3 text-xs leading-relaxed text-[#475569] dark:text-slate-200">
                                          {showFullReason ? item.reason : truncatedReason.text}
                                          {truncatedReason.truncated && (
                                            <button
                                              type="button"
                                              onClick={() => togglePolicyTextSection(reasonKey)}
                                              className="ml-2 font-semibold text-[#A855F7] hover:underline"
                                            >
                                              {showFullReason ? 'Less' : 'More'}
                                            </button>
                                          )}
                                        </p>

                                        <div className="mb-3 flex items-center gap-2">
                                          <Clock3 className="h-4 w-4 text-[#94A3B8]" />
                                          <span className="text-xs text-[#64748B] dark:text-slate-300">Policy Area:</span>
                                          <span className="text-xs font-semibold text-[#0F172A] dark:text-white">
                                            {item.strategicArea}
                                          </span>
                                        </div>

                                        <div className="mb-3 rounded-xl border border-[#A855F726] bg-[#FDF8FF] p-3 dark:border-white/10 dark:bg-white/5">
                                          <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#A855F7] dark:text-[#E9D5FF]">
                                            Recommended Action
                                          </p>
                                          <p className="text-xs leading-relaxed text-[#475569] dark:text-slate-200">
                                            {showFullAction ? item.requiredAction : truncatedAction.text}
                                            {truncatedAction.truncated && (
                                              <button
                                                type="button"
                                                onClick={() => togglePolicyTextSection(actionKey)}
                                                className="ml-2 font-semibold text-[#A855F7] hover:underline dark:text-[#E9D5FF]"
                                              >
                                                {showFullAction ? 'Less' : 'More'}
                                              </button>
                                            )}
                                          </p>
                                        </div>

                                      </div>
                                    </article>
                                  )
                                })
                              })}
                            </div>
                          ) : (
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                              {policyMatchGroups
                                .flatMap((group) =>
                                  group.items.map((item) => ({ group, item }))
                                )
                                .map(({ group, item }) => {
                                  const accent = toMatchTypeAccent(group.matchType)

                                  return (
                                    <div
                                      key={`${item.policyNumber}-${item.policyName}-preview`}
                                      className="rounded-2xl border border-[#E9D5FF] bg-white px-3 py-3 shadow-sm dark:border-white/10 dark:bg-[#1E293B]"
                                    >
                                      <div className="flex items-start gap-2.5">
                                        <div className={cn('mt-0.5 shrink-0', accent.text)}>
                                          {group.matchType === 'Potential Conflict' ? (
                                            <AlertTriangle className="h-4 w-4" />
                                          ) : group.matchType === 'Coordination Required' ? (
                                            <Layers className="h-4 w-4" />
                                          ) : (
                                            <CheckCircle2 className="h-4 w-4" />
                                          )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                          <div className="flex items-center justify-between gap-2">
                                            <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em]', accent.sofbadge)}>
                                              <span className={cn('h-1.5 w-1.5 rounded-full', accent.dot)} />
                                              {item.matchType}
                                            </span>
                                            <span className="text-xs font-bold text-[#A855F7] dark:text-[#E9D5FF]">
                                              {item.relevanceScore}
                                            </span>
                                          </div>
                                          <p className="mt-1.5 line-clamp-2 text-sm font-semibold leading-5 text-[#0F172A] dark:text-white">
                                            {item.policyName}
                                          </p>
                                          <p className="mt-1 text-[11px] text-[#64748B] dark:text-slate-300">
                                            Policy {item.policyNumber}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  )
                                })}
                            </div>
                          )}
                        </div>

                        {!policyEvaluationExpanded && (
                          <p className="mt-3 text-sm text-[#64748B] dark:text-slate-200">
                            Expand to review all matched policies with their reason, evidence, and required action.
                          </p>
                        )}
                      </>
                    ) : (
                      <div className="rounded-xl border border-[#DCE8F6] bg-white px-4 py-4 shadow-[0_10px_25px_rgba(15,23,42,0.04)] dark:border-white/10 dark:bg-white/5">
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#E8F8F3] text-[#0F9D7A] dark:bg-[#0F9D7A]/15 dark:text-[#9CE7D4]">
                            <CheckCircle2 className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-semibold text-[#0F172A] dark:text-white">No policy conflict detected</p>
                            <p className="mt-1 text-sm leading-6 text-[#64748B] dark:text-slate-100">
                              {policyEvaluationResult.overallAssessment.summary}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </section>
          )}

          <div className="grid gap-5 xl:grid-cols-[minmax(0,7fr)_minmax(320px,3fr)]">
            <div className="min-w-0 space-y-5">
            <FormSection
              title="Project Details"
              description="Define the initiative, strategic alignment, work stream, technology, and item type using live Dataverse lookups."
              icon={ClipboardList}
              noIconBg
              action={
                lookupLoading ? (
                  <div className="inline-flex items-center gap-2 rounded-full border border-[#DDEBFF] bg-[#F8FBFF] px-3 py-2 text-xs font-semibold text-[#286CFF]">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading Lookups
                  </div>
                ) : null
              }
            >
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <FormField
                    label="Initiative / Budget Item Name"
                    required
                    error={fieldErrors.initiativeName}
                  >
                    <Input
                      value={formValues.initiativeName}
                      onChange={(event) => updateField('initiativeName', event.target.value)}
                      onBlur={() => void refreshAiSuggestions()}
                      className={cn(
                        'h-12 rounded-xl bg-white shadow-sm transition-colors hover:border-[var(--primary-light)] focus-visible:ring-[var(--primary)]',
                        fieldErrors.initiativeName ? 'border-[#F04438]' : 'border-[#D9E6F7]'
                      )}
                      placeholder="Example: Cloud Migration Platform for Citizen Services"
                    />
                  </FormField>
                </div>

                <FormField
                  label="Strategic Priorities"
                  required
                  error={fieldErrors.strategicPriorityId}
                >
                  <LookupSelect
                    value={formValues.strategicPriorityId}
                    onChange={handleStrategicPriorityChange}
                    placeholder="Select parent strategic priority"
                    options={strategicPriorityParentOptions}
                    icon={Layers}
                    disabled={lookupLoading}
                    invalid={Boolean(fieldErrors.strategicPriorityId)}
                  />
                </FormField>

                <FormField
                  label="Strategic Priority Classifications"
                  required
                  error={fieldErrors.strategicPriorityClassificationId}
                >
                  <LookupSelect
                    value={formValues.strategicPriorityClassificationId}
                    onChange={(value) => updateField('strategicPriorityClassificationId', value)}
                    placeholder="Select strategic priority classification"
                    options={strategicPriorityClassificationOptions}
                    icon={FolderKanban}
                    disabled={!formValues.strategicPriorityId || lookupLoading}
                    invalid={Boolean(fieldErrors.strategicPriorityClassificationId)}
                  />
                </FormField>

                <div className="md:col-span-2">
                  {aiSuggestionError ? (
                    <div className="rounded-2xl border border-[#FFD4D1] bg-[#FFF5F5] px-4 py-3 text-sm text-[#B42318] dark:border-[#EA4F49]/40 dark:bg-[#EA4F49]/10">
                      {aiSuggestionError}
                    </div>
                  ) : aiSuggestions.length === 0 && aiSuggestionLoading ? (
                    <div className="rounded-2xl border border-[#E9D5FF] bg-[#FDF7FF] px-4 py-3 text-sm text-[#A855F7] dark:border-white/10 dark:bg-white/5 dark:text-[#E9D5FF]">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Retrieving Strategic Priority and Classification recommendations...
                      </div>
                    </div>
                  ) : aiSuggestions.length > 0 ? (
                    <div className="space-y-3">
                      {aiSuggestionsNeedRefresh && (
                        <div className="rounded-2xl border border-[#FDE68A] bg-[#FFFBEB] px-4 py-3 text-xs font-medium text-[#B45309] dark:border-[#B45309]/30 dark:bg-[#3B2A12]/50 dark:text-amber-300">
                          Inputs changed. Blur the Project Name or Summary again to refresh AI recommendations.
                        </div>
                      )}

                      {topAiSuggestion && (
                        <div className="relative overflow-hidden rounded-2xl border border-[#E9D5FF] bg-gradient-to-b from-[#FDF7FF] to-white shadow-[0_12px_30px_rgba(15,23,42,0.06)] dark:border-white/10 dark:from-[#2A123D] dark:to-[#1E293B]">
                          <div className="pointer-events-none absolute inset-0 overflow-hidden">
                            <Sparkles className="absolute left-5 top-3 h-4 w-4 text-[#A855F7]/[0.12] dark:text-[#E9D5FF]/[0.12]" />
                            <Bot className="absolute left-16 bottom-3 h-5 w-5 text-[#A855F7]/[0.12] dark:text-[#E9D5FF]/[0.12]" />
                            <Sparkles className="absolute left-[34%] top-1/2 h-4 w-4 -translate-y-1/2 text-[#A855F7]/[0.1] dark:text-[#E9D5FF]/[0.1]" />
                            <Bot className="absolute left-1/2 top-3 h-4 w-4 -translate-x-1/2 text-[#A855F7]/[0.1] dark:text-[#E9D5FF]/[0.1]" />
                            <Sparkles className="absolute right-24 top-3 h-5 w-5 text-[#A855F7]/[0.12] dark:text-[#E9D5FF]/[0.12]" />
                            <Bot className="absolute right-36 bottom-3 h-6 w-6 text-[#A855F7]/[0.12] dark:text-[#E9D5FF]/[0.12]" />
                            <Sparkles className="absolute right-8 bottom-4 h-4 w-4 text-[#A855F7]/[0.12] dark:text-[#E9D5FF]/[0.12]" />
                          </div>
                          <div className="flex w-full flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
                            <div className="min-w-0 flex-1">
                              <div className="mb-2 flex items-center gap-2">
                                <div className="shrink-0 text-[#A855F7] dark:text-[#E9D5FF]">
                                  <Sparkles className="h-4 w-4" />
                                </div>
                                <h4 className="text-sm font-medium text-[#0F172A] dark:text-white">
                                  AI Recommendation
                                </h4>
                              </div>

                              <div className="flex flex-col gap-2 xl:flex-row xl:flex-wrap xl:items-center xl:gap-3">
                                <div className="min-w-0 rounded-xl border border-[#F0D9FF] bg-white px-3 py-2 dark:border-white/10 dark:bg-white/5">
                                  <p className="truncate text-sm text-[#475569] dark:text-slate-300">
                                    <span className="font-medium text-[#64748B] dark:text-slate-400">Suggested Strategic Priority:</span>{' '}
                                    <span className="font-semibold text-[#A855F7] dark:text-[#E9D5FF]">{topAiSuggestion.strategicPriority}</span>
                                  </p>
                                </div>
                                <div className="min-w-0 rounded-xl border border-[#F0D9FF] bg-white px-3 py-2 dark:border-white/10 dark:bg-white/5">
                                  <p className="truncate text-sm text-[#475569] dark:text-slate-300">
                                    <span className="font-medium text-[#64748B] dark:text-slate-400">Suggested Strategic Priority Classification:</span>{' '}
                                    <span className="font-semibold text-[#A855F7] dark:text-[#E9D5FF]">{topAiSuggestion.strategicPriorityClassification}</span>
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="flex shrink-0 flex-wrap items-center gap-2">
                              <Button
                                type="button"
                                className="h-9 rounded-xl bg-[#A855F7] px-4 text-sm text-white hover:bg-[#9333EA]"
                                onClick={() => applyAiSuggestion(topAiSuggestion, 'both')}
                                disabled={!topAiSuggestion.priorityId || !topAiSuggestion.classificationId}
                              >
                                <Sparkles className="h-4 w-4" />
                                Apply
                              </Button>
                              <button
                                type="button"
                                onClick={() => setAiSuggestionExpanded((current) => !current)}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#E9D5FF] bg-white text-[#A855F7] transition-colors hover:bg-[#FDF7FF] dark:border-white/10 dark:bg-white/10 dark:text-[#E9D5FF] dark:hover:bg-white/15"
                                aria-label={aiSuggestionExpanded ? 'Hide details' : 'View details'}
                                title={aiSuggestionExpanded ? 'Hide details' : 'View details'}
                              >
                                <ChevronDown className={cn('h-4 w-4 transition-transform', aiSuggestionExpanded && 'rotate-180')} />
                              </button>
                            </div>
                          </div>

                          {aiSuggestionExpanded && (
                            <div className="border-t border-[#E9D5FF] bg-white px-3 py-3 dark:border-white/10 dark:bg-[#1E293B]">
                              <div className="grid gap-3 xl:grid-cols-2">
                                {matchedAiSuggestions.map((suggestion) => {
                                  const isApplied =
                                    formValues.strategicPriorityId === suggestion.priorityId &&
                                    formValues.strategicPriorityClassificationId === suggestion.classificationId

                                  return (
                                    <div
                                      key={`${suggestion.rank}-${suggestion.strategicPriority}-${suggestion.strategicPriorityClassification}`}
                                      className={cn(
                                        'rounded-2xl border bg-white p-4 shadow-sm transition-colors dark:bg-white/5',
                                        isApplied
                                          ? 'border-[#A855F7] shadow-[0_10px_24px_rgba(168,85,247,0.16)]'
                                          : 'border-[#E9D5FF] dark:border-white/10'
                                      )}
                                    >
                                      <div className="mb-3 flex items-start justify-between gap-3">
                                          <div>
                                          <div className="inline-flex items-center rounded-full border border-[#E9D5FF] bg-white px-2.5 py-1 text-xs font-semibold text-[#0F172A] dark:border-white/10 dark:bg-white/10 dark:text-white">
                                            Option {suggestion.rank}
                                          </div>
                                          <div className="mt-2 space-y-2">
                                            <div>
                                              <p className="text-xs font-medium text-[#64748B] dark:text-slate-300">
                                                Strategic Priority
                                              </p>
                                              <p className="text-sm font-bold text-[#0F172A] dark:text-white">
                                                {suggestion.strategicPriority}
                                              </p>
                                            </div>
                                            <div>
                                              <p className="text-xs font-medium text-[#64748B] dark:text-slate-300">
                                                Classification
                                              </p>
                                              <p className="text-sm font-bold text-[#0F172A] dark:text-white">
                                                {suggestion.strategicPriorityClassification}
                                              </p>
                                            </div>
                                          </div>
                                        </div>
                                        <div className="rounded-xl border border-[#E9D5FF] bg-white px-3 py-2 text-center dark:border-white/10 dark:bg-white/10">
                                          <p className="text-xs font-semibold text-[#64748B] dark:text-slate-300">
                                            Score
                                          </p>
                                          <p className="text-base font-bold text-[#A855F7]">{suggestion.relevanceScore}</p>
                                        </div>
                                      </div>

                                      <p className="text-sm leading-6 text-[#64748B] dark:text-slate-300">
                                        {suggestion.reason || 'AI did not provide a written reason for this recommendation.'}
                                      </p>

                                      <div className="mt-4 flex flex-wrap gap-2">
                                        <Button
                                          type="button"
                                          className="h-10 rounded-xl bg-[#A855F7] px-4 text-sm text-white hover:bg-[#9333EA]"
                                          onClick={() => applyAiSuggestion(suggestion, 'both')}
                                          disabled={!suggestion.priorityId || !suggestion.classificationId}
                                        >
                                          <Sparkles className="h-4 w-4" />
                                          {isApplied ? 'Applied' : 'Apply'}
                                        </Button>
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : null
                  }
                </div>

                <FormField label="Work Stream" error={fieldErrors.workStreamId}>
                  <div className="space-y-2">
                    <LookupSelect
                      value={formValues.workStreamId}
                      onChange={(value) => updateField('workStreamId', value)}
                      placeholder="Select work stream"
                      options={workStreamOptions}
                      icon={Briefcase}
                      disabled={lookupLoading}
                      invalid={Boolean(fieldErrors.workStreamId)}
                    />
                    <Button
                      variant="ghost"
                      className="h-auto justify-start rounded-none px-0 py-0 text-[var(--primary)] hover:bg-transparent hover:text-[#043DFF] hover:underline"
                      onClick={() => setWorkStreamModalOpen(true)}
                    >
                      <Plus className="h-4 w-4" />
                      Create Work Stream
                    </Button>
                  </div>
                </FormField>

                <FormField
                  label="ICT Budget Items Type"
                  required
                  error={fieldErrors.budgetItemType}
                >
                  <LookupSelect
                    value={formValues.budgetItemType ? String(formValues.budgetItemType) : ''}
                    onChange={(value) => updateField('budgetItemType', Number(value) as BudgetItemType)}
                    placeholder="Select ICT budget item type"
                    options={BUDGET_ITEM_TYPE_OPTIONS.map((option) => ({
                      value: String(option.value),
                      label: option.label,
                    }))}
                    icon={Package}
                    invalid={Boolean(fieldErrors.budgetItemType)}
                  />
                </FormField>

                <FormField label="Category">
                  <LookupSelect
                    value={formValues.category ? String(formValues.category) : ''}
                    onChange={(value) => updateField('category', Number(value) as CategoryType)}
                    placeholder="Select category"
                    options={CATEGORY_OPTIONS.map((option) => ({
                      value: String(option.value),
                      label: option.label,
                    }))}
                    icon={FolderKanban}
                  />
                </FormField>

                <FormField label="Technology (Company)" error={fieldErrors.technologyCompanyId}>
                  <LookupSelect
                    value={formValues.technologyCompanyId}
                    onChange={handleTechnologyCompanyChange}
                    placeholder="Select technology company"
                    options={technologyCompanyOptions}
                    icon={Building2}
                    disabled={lookupLoading}
                    invalid={Boolean(fieldErrors.technologyCompanyId)}
                  />
                </FormField>

                <FormField label="Technology (Product)" error={fieldErrors.technologyProductIds}>
                  <div className="space-y-2">
                    <ProductMultiSelect
                      products={selectedTechnologyCompany?.products ?? []}
                      selectedIds={formValues.technologyProductIds}
                      disabled={!selectedTechnologyCompany || lookupLoading}
                      onToggle={toggleTechnologyProduct}
                      invalid={Boolean(fieldErrors.technologyProductIds)}
                    />
                    <Button
                      variant="ghost"
                      className="h-auto justify-start rounded-none px-0 py-0 text-[var(--primary)] hover:bg-transparent hover:text-[#043DFF] hover:underline disabled:text-[#94A3B8] disabled:no-underline"
                      onClick={() => setTechnologyProductModalOpen(true)}
                      disabled={!selectedTechnologyCompany || lookupLoading}
                    >
                      <Plus className="h-4 w-4" />
                      Create Technology Product
                    </Button>
                  </div>
                </FormField>
              </div>
            </FormSection>

            <FormSection
              title="Project Timeline"
              description="Set planned delivery dates so reviewers can understand the funding window."
              icon={CalendarDays}
              noIconBg
            >
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  label="Planned Start Date"
                  required
                  error={fieldErrors.plannedStartDate}
                >
                  <DatePickerField
                    value={formValues.plannedStartDate}
                    onChange={(value) => updateField('plannedStartDate', value)}
                    invalid={Boolean(fieldErrors.plannedStartDate)}
                  />
                </FormField>
                <FormField
                  label="Planned End Date"
                  required
                  error={fieldErrors.plannedEndDate}
                >
                  <DatePickerField
                    value={formValues.plannedEndDate}
                    onChange={(value) => updateField('plannedEndDate', value)}
                    invalid={Boolean(fieldErrors.plannedEndDate)}
                  />
                </FormField>
              </div>
            </FormSection>

            <FormSection
              title="Project Summary"
              description="Explain the business need, expected outcome, beneficiaries, and delivery approach."
              icon={FileText}
              noIconBg
            >
              <FormField
                label="Summary / Description"
                required
                error={fieldErrors.summary}
              >
                <Textarea
                  value={formValues.summary}
                  onChange={(event) => updateField('summary', event.target.value)}
                  onBlur={() => void refreshAiSuggestions()}
                  rows={6}
                  className={cn(
                    'rounded-xl bg-white shadow-sm focus-visible:ring-[var(--primary)]',
                    fieldErrors.summary ? 'border-[#F04438]' : 'border-[#D9E6F7]'
                  )}
                  placeholder="Describe the problem, proposed solution, departments impacted, measurable benefits, and any dependencies..."
                />
              </FormField>
            </FormSection>

            <FormSection
              title="Project Budget Type"
              description="Select the budget type. The required budget fields below will adapt to your selection."
              icon={CircleDollarSign}
              noIconBg
            >
              <div className="space-y-4">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  {ACTIVITY_TYPE_OPTIONS.map((option) => {
                    const selected = formValues.activityType === option.value
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => handleActivityTypeChange(option.value)}
                        className={cn(
                          'rounded-2xl border p-4 text-left transition-colors',
                          selected
                            ? 'border-[#286CFF] bg-[#EEF4FF]'
                            : 'border-[#DDEBFF] bg-white hover:border-[#B0DBFF] hover:bg-[#F8FBFF] dark:border-white/10 dark:bg-[#0F172A]/20 dark:hover:bg-white/5'
                        )}
                      >
                        <div className="flex w-full items-center justify-between gap-3">
                          <p className="text-sm font-bold text-[#0F172A] dark:text-white">{option.title}</p>
                          <div
                            className={cn(
                              'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border',
                              selected
                                ? 'border-[#286CFF] bg-[#286CFF] text-white'
                                : 'border-[#CBD5E1] text-transparent'
                            )}
                          >
                            <Check className="h-3.5 w-3.5" />
                          </div>
                        </div>
                        <p className="mt-1.5 text-xs leading-5 text-[#64748B] dark:text-slate-300">
                          {option.description}
                        </p>
                      </button>
                    )
                  })}
                </div>
                {fieldErrors.activityType && (
                  <p className="text-xs font-medium text-[#B42318]">{fieldErrors.activityType}</p>
                )}

                {visibleBudgetFields.length > 0 && (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {visibleBudgetFields.map((field) => (
                      <FormField
                        key={field}
                        label={toCurrencyFieldLabel(field)}
                        required
                        error={fieldErrors[field]}
                      >
                        <CurrencyField
                          value={formValues[field]}
                          onChange={(value) => updateField(field, value)}
                          invalid={Boolean(fieldErrors[field])}
                        />
                      </FormField>
                    ))}
                  </div>
                )}
              </div>
            </FormSection>

            <FormSection
              title="Budget Account Codes"
              description="Add account-level amounts and GL classifications for the requested budget."
              icon={CircleDollarSign}
              noIconBg
            >
              <BudgetItemsBuilder
                items={budgetItems}
                onChange={(items) => {
                  setBudgetItems(items)
                  if (items.length > 0 && items.every((item) => item.budgetRequested > 0)) {
                    setBudgetItemsError(null)
                    setFieldErrors((prev) => {
                      if (!prev.budgetItems) return prev
                      const nextErrors = { ...prev }
                      delete nextErrors.budgetItems
                      return nextErrors
                    })
                  }
                }}
              />
              {budgetItemsError && (
                <p className="mt-3 text-xs font-medium text-[#B42318]">{budgetItemsError}</p>
              )}
            </FormSection>

          <section className="rounded-2xl border border-[#DDEBFF] bg-white shadow-none dark:border-white/10 dark:bg-[#1E293B]">
            <div className="border-b border-[#DDEBFF] px-4 py-4 dark:border-white/10 sm:px-6">
              <div className="flex items-start gap-4">
                <div className="mt-1 shrink-0 text-[var(--primary)]">
                  <Upload className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#0F172A] dark:text-white">Supporting Documents</h3>
                  <p className="mt-0.5 text-sm text-[#475569] dark:text-slate-300">
                    Attach business cases, cost sheets, quotations, or technical evidence. Documents are uploaded when you save the draft.
                  </p>
                </div>
              </div>
            </div>
            <div className="p-4 sm:p-6">
              <FileUploadDropzone files={uploadedFiles} onChange={setUploadedFiles} />
              {uploadedFiles.length > 0 && (
                <SupportingDocumentAiInsights items={supportingDocumentInsightItems} />
              )}
            </div>
          </section>

            <div className="rounded-2xl border border-[#DDEBFF] bg-white p-4 shadow-[0_14px_34px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-[#1E293B] sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3 text-sm text-[#64748B] dark:text-slate-200">
                  <CheckCircle2 className="h-5 w-5 text-[var(--primary)]" />
                  <span>Save Draft validates required fields, creates the ICT budget, associates technology products, and creates budget line items.</span>
                </div>
                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
                  <Button
                    variant="outline"
                    asChild
                    className="h-11 w-full rounded-xl border-[#CBD5E1] px-5 font-semibold text-[#334155] hover:bg-[#F8FAFC] hover:text-[#0F172A] sm:w-auto"
                  >
                    <Link to="/respondent/projects">Cancel</Link>
                  </Button>
                  <Button
                    className="h-11 w-full rounded-xl bg-[var(--primary)] px-5 font-semibold text-white shadow-sm transition-colors hover:bg-[#1F5BFF] active:bg-[#1A4ED8] sm:w-auto"
                    onClick={() => void handleSaveDraft()}
                    disabled={isManualSaveBlockedByAiAnalysis}
                  >
                    Save Draft
                  </Button>
                </div>
              </div>
            </div>
          </div>

            <aside className="space-y-4">
              <div className="rounded-2xl border border-[#E9D5FF] bg-gradient-to-b from-[#FDF7FF] to-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)] dark:border-white/10 dark:from-[#2A123D] dark:to-[#1E293B]">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 shrink-0 text-[#A855F7]">
                      <Sparkles className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-[#0F172A] dark:text-white">AI Action Cards</h3>
                      <p className="text-xs text-[#64748B] dark:text-slate-300">
                        {activeSupportingDocumentSummary.loading
                          ? 'Preparing aggregate document guidance...'
                          : actionSummarySourceLabel}
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full border border-[#E9D5FF] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#A855F7] dark:border-white/10 dark:bg-white/10 dark:text-[#E9D5FF]">
                    {activeSupportingDocumentSummary.type === 'cumulative' && activeSupportingDocumentSummary.fileCount > 1 ? 'Combined' : 'Single'}
                  </span>
                </div>

                <div className="space-y-4">
                  <div className="group rounded-2xl border border-[#E9D5FF] bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-[#1E293B]">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="shrink-0 text-[#A855F7] dark:text-[#E9D5FF]">
                          <Layers className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[#A855F7] dark:text-[#E9D5FF]">Suggested Project Fields</p>
                          <p className="text-xs text-[#64748B] dark:text-slate-300">Apply-ready suggestions</p>
                        </div>
                      </div>
                      {actionSuggestedFields.length > 0 && !activeSupportingDocumentSummary.loading ? (
                        <button
                          type="button"
                          onClick={applyAllAiFieldSuggestions}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-[#A855F7] px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[#9333EA] active:bg-[#7E22CE]"
                        >
                          <Check className="h-3 w-3" />
                          Apply All
                        </button>
                      ) : null}
                    </div>
                    {activeSupportingDocumentSummary.loading ? (
                      <div className="flex items-center gap-2 rounded-xl border border-dashed border-[#E9D5FF] bg-[#FDF7FF] px-3 py-4 text-sm text-[#A855F7] dark:border-white/10 dark:bg-white/5 dark:text-[#E9D5FF]">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Synthesizing field suggestions...
                      </div>
                    ) : activeSupportingDocumentSummary.error ? (
                      <div className="rounded-xl border border-[#F5C2C7] bg-[#FFF1F3] px-3 py-3 text-sm text-[#B42318] dark:border-[#B42318]/30 dark:bg-[#3B1118] dark:text-[#FCA5A5]">
                        {activeSupportingDocumentSummary.error}
                      </div>
                    ) : actionSuggestedFields.length > 0 ? (
                      <div className="space-y-2">
                        {actionSuggestedFields.slice(0, 4).map((field) => {
                          const canApply = resolveAiFieldMapping(field) !== null
                          return (
                            <div key={field.field_key ?? field.field_label} className="rounded-xl border border-[#A855F726] bg-[#FDF8FF] px-3 py-3 dark:border-white/10 dark:bg-white/5">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                  <p className="text-[11px] font-semibold text-[#64748B] dark:text-slate-300">
                                    {field.field_label ?? field.field_key ?? 'Suggested Field'}
                                  </p>
                                  <p className="mt-1 text-sm font-semibold text-[#0F172A] dark:text-white">
                                    {formatAiFieldValue(field.suggested_value)}
                                  </p>
                                </div>
                                <div className="flex shrink-0 flex-col items-end gap-1.5">
                                  {typeof field.confidence === 'number' && (
                                    <span className="rounded-full border border-[#BFCFFF] bg-white px-2 py-1 text-[11px] font-bold text-[#286CFF] dark:border-white/10 dark:bg-white/10 dark:text-[#93C5FD]">
                                      {field.confidence}%
                                    </span>
                                  )}
                                  {canApply && (
                                    <button
                                      type="button"
                                      onClick={() => applyAiFieldSuggestion(field)}
                                      className="inline-flex items-center gap-1 rounded-lg border border-[#E9D5FF] bg-white px-2 py-1 text-[11px] font-semibold text-[#A855F7] shadow-sm transition-colors hover:bg-[#FAF5FF] dark:border-white/10 dark:bg-white/5 dark:text-[#E9D5FF]"
                                    >
                                      <Check className="h-2.5 w-2.5" />
                                      Apply
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <EmptyActionCard
                        description="Upload and analyze a supporting document to see AI-suggested project fields here."
                        icon={Layers}
                      />
                    )}
                  </div>

                  <div className="group rounded-2xl border border-[#E9D5FF] bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-[#1E293B]">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="shrink-0 text-[#A855F7] dark:text-[#E9D5FF]">
                          <CircleDollarSign className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[#A855F7] dark:text-[#E9D5FF]">Budget Lines</p>
                          <p className="text-xs text-[#64748B] dark:text-slate-300">Extracted financial evidence</p>
                        </div>
                      </div>
                    </div>
                    {activeSupportingDocumentSummary.loading ? (
                      <div className="flex items-center gap-2 rounded-xl border border-dashed border-[#E9D5FF] bg-[#FDF7FF] px-3 py-4 text-sm text-[#A855F7] dark:border-white/10 dark:bg-white/5 dark:text-[#E9D5FF]">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Consolidating budget lines...
                      </div>
                    ) : actionBudgetLines.length > 0 ? (
                      <div className="space-y-2">
                        {actionBudgetLines.slice(0, 3).map((line, index) => (
                          <div key={`${line.line_number ?? index}-${line.description ?? 'budget-line'}`} className="rounded-xl border border-[#A855F726] bg-[#FDF8FF] px-3 py-3 dark:border-white/10 dark:bg-white/5">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-[#0F172A] dark:text-white">{line.description ?? 'Budget line'}</p>
                                <p className="mt-1 text-xs text-[#64748B] dark:text-slate-300">
                                  {line.amount_period ?? 'One-time'}{line.vat_treatment ? ` • VAT ${line.vat_treatment}` : ''}
                                </p>
                              </div>
                              <span className="rounded-full border border-[#BFCFFF] bg-white px-2.5 py-1 text-xs font-bold text-[#286CFF] dark:border-white/10 dark:bg-white/10 dark:text-[#93C5FD]">
                                {line.currency ? `${line.currency} ` : ''}{(line.amount ?? 0).toLocaleString('en-AE')}
                              </span>
                            </div>
                          </div>
                        ))}
                        <div className="rounded-xl border border-[#E9D5FF] bg-white px-3 py-3 dark:border-white/10 dark:bg-white/5">
                              <p className="text-[11px] font-semibold text-[#64748B] dark:text-slate-300">Total Extracted Amount</p>
                          <CurrencyAmount amount={actionBudgetTotal} full className="mt-1 text-sm font-bold text-[#A855F7]" />
                        </div>
                      </div>
                    ) : (
                      <EmptyActionCard
                        description="Budget line suggestions will appear here once the document includes usable commercials or financial evidence."
                        icon={CircleDollarSign}
                      />
                    )}
                  </div>

                  <div className="group rounded-2xl border border-[#E9D5FF] bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-[#1E293B]">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="shrink-0 text-[#A855F7] dark:text-[#E9D5FF]">
                          <CheckCircle2 className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[#A855F7] dark:text-[#E9D5FF]">Account Code Suggestion</p>
                          <p className="text-xs text-[#64748B] dark:text-slate-300">Best-fit GL recommendation</p>
                        </div>
                      </div>
                    </div>
                    {activeSupportingDocumentSummary.loading ? (
                      <div className="flex items-center gap-2 rounded-xl border border-dashed border-[#E9D5FF] bg-[#FDF7FF] px-3 py-4 text-sm text-[#A855F7] dark:border-white/10 dark:bg-white/5 dark:text-[#E9D5FF]">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Mapping account code recommendation...
                      </div>
                    ) : actionAccountCode ? (
                      <div className="space-y-3">
                        <div className="rounded-xl border border-[#A855F726] bg-[#FDF8FF] px-3 py-3 dark:border-white/10 dark:bg-white/5">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-[11px] font-semibold text-[#64748B] dark:text-slate-300">Primary Account Code</p>
                              <p className="mt-1 text-sm font-bold text-[#0F172A] dark:text-white">{actionAccountCode.account_code ?? '-'}</p>
                              {typeof actionAccountCode.requested_budget === 'number' && (
                                <div className="mt-1.5 flex items-center gap-1.5">
                                  <p className="text-[10px] font-semibold text-[#64748B] dark:text-slate-300">Requested</p>
                                  <CurrencyAmount amount={actionAccountCode.requested_budget} full className="text-xs font-bold text-[#A855F7] dark:text-[#E9D5FF]" />
                                </div>
                              )}
                            </div>
                            {typeof actionAccountCode.account_code_confidence === 'number' && (
                              <span className="rounded-full border border-[#BFCFFF] bg-white px-2 py-1 text-[11px] font-bold text-[#286CFF] dark:border-white/10 dark:bg-white/10 dark:text-[#93C5FD]">
                                {actionAccountCode.account_code_confidence}%
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="grid gap-2 sm:grid-cols-3">
                          {(['l1', 'l2', 'l3'] as const).map((level) => (
                            <div key={level} className="rounded-xl border border-[#A855F726] bg-[#FDF8FF] px-3 py-2.5 dark:border-white/10 dark:bg-white/5">
                              <p className="text-[11px] font-semibold text-[#64748B] dark:text-slate-300">{level.replace(/^l/i, 'L')}</p>
                              <p className="mt-1 text-xs font-semibold text-[#0F172A] dark:text-white">
                                {actionAccountCode.classification_path?.[level] ?? '-'}
                              </p>
                            </div>
                          ))}
                        </div>
                        <div className="rounded-xl border border-[#A855F726] bg-[#FDF8FF] px-3 py-3 text-sm text-[#475569] dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
                          {truncateAiText(actionAccountCode.reason, 180) || 'AI account-code rationale will appear here.'}
                        </div>
                        <button
                          type="button"
                          onClick={() => void applyAiAccountCodeSuggestion()}
                          disabled={aiApplyingAccountCode}
                          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#A855F7] py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#9333EA] active:bg-[#7E22CE] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {aiApplyingAccountCode ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Adding to budget...
                            </>
                          ) : (
                            <>
                              <Plus className="h-4 w-4" />
                              Add to Budget Line Items
                            </>
                          )}
                        </button>
                      </div>
                    ) : (
                      <EmptyActionCard
                        description="When the AI can infer a likely GL/account-code match, it will show that recommendation here."
                        icon={CheckCircle2}
                      />
                    )}
                  </div>

                  <div className="group rounded-2xl border border-[#E9D5FF] bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-[#1E293B]">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="shrink-0 text-[#A855F7] dark:text-[#E9D5FF]">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[#A855F7] dark:text-[#E9D5FF]">Summary</p>
                          <p className="text-xs text-[#64748B] dark:text-slate-300">Cross-document AI readout</p>
                        </div>
                      </div>
                    </div>
                    {activeSupportingDocumentSummary.loading ? (
                      <div className="flex items-center gap-2 rounded-xl border border-dashed border-[#E9D5FF] bg-[#FDF7FF] px-3 py-4 text-sm text-[#A855F7] dark:border-white/10 dark:bg-white/5 dark:text-[#E9D5FF]">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Building the current summary card...
                      </div>
                    ) : actionDocumentSummary || actionEvidenceAssessment ? (
                      <div className="space-y-3">
                        <div className="rounded-xl border border-[#A855F726] bg-[#FDF8FF] px-3 py-3 dark:border-white/10 dark:bg-white/5">
                          <p className="text-sm leading-6 text-[#475569] dark:text-slate-200">
                            {actionDocumentSummary?.short_summary
                              ?? actionDocumentSummary?.detailed_summary
                              ?? actionEvidenceAssessment?.reason
                              ?? 'The current AI summary will appear here after analysis.'}
                          </p>
                        </div>
                        {(actionEvidenceAssessment?.recommended_user_action || actionEvidenceAssessment?.evidence_score) && (
                          <div className="rounded-xl border border-[#E9D5FF] bg-white px-3 py-3 dark:border-white/10 dark:bg-white/5">
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-[11px] font-semibold text-[#64748B] dark:text-slate-300">Evidence Snapshot</p>
                              {typeof actionEvidenceAssessment?.evidence_score === 'number' && (
                                <span className="rounded-full border border-[#E9D5FF] bg-white px-2 py-1 text-[11px] font-bold text-[#A855F7] dark:border-white/10 dark:bg-white/5 dark:text-[#E9D5FF]">
                                  {actionEvidenceAssessment.evidence_score}
                                </span>
                              )}
                            </div>
                            <p className="mt-2 text-sm leading-6 text-[#475569] dark:text-slate-200">
                              {actionEvidenceAssessment?.recommended_user_action ?? actionEvidenceAssessment?.reason}
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <EmptyActionCard
                        description="As soon as the first document finishes analysis, the current AI summary will appear here."
                        icon={FileText}
                      />
                    )}
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </>
      ) : !copilotFormRevealed ? (
        <div className="flex flex-col">
          <input
            ref={chatFileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.jpg,.jpeg"
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null
              handleCopilotChatFileSelection(file)
              event.target.value = ''
            }}
          />
          <BudgetAssistantLandingHero
            chatInput={chatInput}
            chatStagedFile={chatStagedFile}
            copilotBusy={copilotBusy}
            copilotTyping={copilotTyping}
            mode={mode}
            onInputChange={setChatInput}
            onSend={handleSend}
            onPromptSelect={handleOptionSelect}
            onUploadClick={() => chatFileInputRef.current?.click()}
            onCheckBudgetConsideration={() => void runCopilotBudgetConsiderationCheck()}
            onRemoveStagedFile={() => setChatStagedFile(null)}
            onToggleMode={() => setMode('manual')}
            canCheckBudgetConsideration={canCheckCopilotBudgetConsideration}
            projectFieldSuggestionsLoading={isCopilotProjectFieldSuggestionLoading}
          />
        </div>
      ) : (
        <div className="grid gap-6 transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] xl:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)]">
          <div
            className="space-y-6 animate-copilotChatCompact xl:sticky xl:top-20 xl:self-start"
          >
            <div className="relative h-[680px] xl:h-[calc(100vh-6rem)]">
              <section
                className={cn(
                  'absolute inset-0 flex h-full flex-col overflow-hidden rounded-[28px] border border-[#E9D5FF] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.06)] transition-all duration-300 ease-out dark:border-white/10 dark:bg-[#1E293B]',
                  copilotWorkspaceView === 'chat'
                    ? 'translate-y-0 opacity-100 pointer-events-auto'
                    : '-translate-y-2 opacity-0 pointer-events-none'
                )}
              >
                <div className="flex items-start justify-between gap-4 border-b border-[#F0D9FF] bg-gradient-to-b from-[#FDF7FF] to-white px-5 py-4 dark:border-white/10 dark:from-[#2A123D] dark:to-[#1E293B]">
                  <div className="flex items-center gap-3">
                    <div className="shrink-0 text-[#A855F7]">
                      <Sparkles className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-[#0F172A] dark:text-white">Budget Assistant</h3>
                      <p className="text-xs text-[#64748B] dark:text-slate-300">
                        Guided draft creation using chat, AI suggestions, and supporting documents.
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" className="rounded-xl text-[#A855F7] hover:bg-[#F6EBFF] hover:text-[#9333EA]" onClick={clearCopilotWorkspace}>
                    <RefreshCw className="h-4 w-4" />
                    Clear
                  </Button>
                </div>

                <div className="flex min-h-0 flex-1 flex-col gap-4 px-5 py-5">
                  <div
                    ref={chatScrollRef}
                    className="min-h-0 flex-1 overflow-y-auto rounded-2xl border border-[#F0D9FF] bg-white p-6 dark:border-white/10 dark:bg-[#140E21]/60"
                  >
                    <div className="space-y-4 pr-1">
                      {chatMessages.map((msg, i) => (
                        <div key={i} className={cn('flex gap-3', msg.from === 'user' ? 'justify-end' : 'justify-start')}>
                          {msg.from === 'ai' && (
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#A855F7_0%,#C084FC_100%)] text-white shadow-sm">
                              <Bot className="h-4 w-4" />
                            </div>
                          )}
                          <div
                            className={cn(
                              'max-w-[92%] rounded-2xl px-4 py-3 text-sm shadow-sm',
                              msg.from === 'ai'
                                ? msg.kind && msg.kind !== 'text'
                                  ? 'rounded-tl-none bg-transparent p-0 shadow-none'
                                  : 'rounded-tl-none border border-[#F0D9FF] bg-white text-[#334155] dark:border-white/10 dark:bg-[#1E293B] dark:text-white'
                                : 'rounded-tr-none bg-[#A855F7] text-white'
                            )}
                          >
                            {msg.from === 'ai'
                              ? renderCopilotChatMessageContent(msg)
                              : <p className="whitespace-pre-line leading-6">{msg.text}</p>}
                          </div>
                        </div>
                      ))}

                      {!optionSelected && chatMessages.length === 0 && (
                        <BudgetAssistantWelcomeCard onPromptSelect={handleOptionSelect} />
                      )}

                    </div>
                  </div>

                  {chatStagedFile && (
                  <div className="flex items-center gap-2 rounded-xl border border-[#E9D5FF] bg-[#FDF7FF] px-3 py-2 dark:border-white/10 dark:bg-white/5">
                    <FileText className="h-4 w-4 shrink-0 text-[#A855F7]" />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-[#334155] dark:text-white">{chatStagedFile.name}</span>
                    <button
                      type="button"
                      onClick={() => setChatStagedFile(null)}
                      className="shrink-0 rounded-full p-0.5 text-[#94A3B8] hover:text-[#A855F7] dark:hover:text-[#E9D5FF]"
                      aria-label="Remove attached file"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}

                <input
                  ref={chatFileInputRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.jpg,.jpeg"
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null
                    handleCopilotChatFileSelection(file)
                    event.target.value = ''
                  }}
                />

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => chatFileInputRef.current?.click()}
                    disabled={copilotBusy}
                    className={cn(
                      'h-10 rounded-xl border-[#E9D5FF] text-[#A855F7] hover:bg-[#FDF7FF]',
                      chatStagedFile && 'bg-[#FDF7FF]'
                    )}
                  >
                    <Paperclip className="h-4 w-4" />
                    Upload File
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void runCopilotBudgetConsiderationCheck()}
                    disabled={copilotBusy || !canCheckCopilotBudgetConsideration}
                    className="h-10 rounded-xl border-[#E9D5FF] text-[#A855F7] hover:bg-[#FDF7FF]"
                  >
                    <Bot className="h-4 w-4" />
                    Check Budget Consideration
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCopilotWorkspaceView((prev) => (prev === 'chat' ? 'suggestions' : 'chat'))}
                    onAnimationEnd={() => setSuggestionFlashOn(false)}
                    className={cn(
                      'h-9 rounded-xl border border-[#E9D5FF] px-3 text-sm text-[#A855F7] hover:bg-[#FDF7FF]',
                      suggestionFlashOn && 'suggestion-blink'
                    )}
                  >
                    {isCopilotProjectFieldSuggestionLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    Project Field Suggestions ({copilotSuggestedFieldCount})
                  </Button>
                </div>

                  <div className="flex gap-2">
                    <Input
                      value={chatInput}
                      onChange={(event) => setChatInput(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' && !event.shiftKey) {
                          event.preventDefault()
                          handleSend()
                        }
                      }}
                      placeholder={chatStagedFile ? 'Add a note about this file (optional)...' : 'Describe the project, ask for help, or provide additional details...'}
                      className="h-11 rounded-xl border-[#E9D5FF] bg-white shadow-sm focus-visible:ring-[#A855F7] dark:border-white/10 dark:bg-[#1E293B]"
                    />

                    <Button
                      type="button"
                      className="h-11 rounded-xl bg-[#A855F7] px-4 text-white hover:bg-[#9333EA]"
                      onClick={handleSend}
                      disabled={copilotBusy || (!chatInput.trim() && !chatStagedFile)}
                    >
                      {copilotBusy || copilotTyping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </section>

              <section
                className={cn(
                  'absolute inset-0 flex h-full flex-col overflow-hidden rounded-[28px] border border-[#E9D5FF] bg-white transition-all duration-300 ease-out dark:border-white/10 dark:bg-[#1E293B]',
                  copilotWorkspaceView === 'suggestions'
                    ? 'translate-y-0 opacity-100 pointer-events-auto'
                    : 'translate-y-full opacity-0 pointer-events-none'
                )}
              >
                <div className="shrink-0 border-b border-[#F0D9FF] bg-gradient-to-b from-[#FDF7FF] to-white px-5 py-4 dark:border-white/10 dark:from-[#2A123D] dark:to-[#1E293B]">
                  <div className="flex justify-center">
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-8 rounded-xl border border-[#ac5cf757] bg-white px-3 text-sm text-[#A855F7] hover:bg-[#A855F7] hover:text-white dark:border-[#ac5cf757] dark:bg-white/5 dark:text-[#E9D5FF] dark:hover:bg-[#A855F7] dark:hover:text-white"
                      onClick={() => setCopilotWorkspaceView('chat')}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Back to Budget Assistant
                    </Button>
                  </div>
                  <div className="mt-3 flex items-center gap-2.5">
                    <div className="shrink-0 text-[#A855F7]">
                      <Sparkles className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-bold text-[#0F172A] dark:text-white">Project Field Suggestions</h3>
                  </div>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
                  <div className="space-y-4 pr-1">
                    {Object.entries(copilotPendingSuggestion?.fields ?? {}).length > 0 || copilotAiSuggestionLoading || matchedCopilotAiSuggestions.length > 0 ? (
                      <div className="grid gap-3 sm:grid-cols-2">
                        {Object.entries(copilotPendingSuggestion?.fields ?? {})
                          .filter(([key]) => !matchedCopilotAiSuggestions[0] || (key !== 'strategicPriorityId' && key !== 'strategicPriorityClassificationId'))
                          .map(([key, value]) => (
                            <div key={key} className="rounded-xl border border-[#E9D5FF] bg-white px-3 py-3 dark:border-white/10 dark:bg-white/5">
                              <p className="text-[11px] font-semibold text-[#64748B] dark:text-slate-300">{VALIDATION_LABELS[key as keyof typeof VALIDATION_LABELS] ?? key}</p>
                              <p className="mt-1 text-sm font-semibold text-[#0F172A] dark:text-white">{Array.isArray(value) ? value.join(', ') : value}</p>
                            </div>
                          ))}
                        {copilotAiSuggestionLoading ? (
                          <>
                            <div className="rounded-xl border border-[#E9D5FF] bg-white px-3 py-3 dark:border-white/10 dark:bg-white/5">
                              <p className="text-[11px] font-semibold text-[#64748B] dark:text-slate-300">Strategic Priorities</p>
                              <div className="mt-1 flex items-center gap-1.5 text-xs text-[#A855F7]"><Loader2 className="h-3 w-3 animate-spin" />Loading...</div>
                            </div>
                            <div className="rounded-xl border border-[#E9D5FF] bg-white px-3 py-3 dark:border-white/10 dark:bg-white/5">
                              <p className="text-[11px] font-semibold text-[#64748B] dark:text-slate-300">Strategic Priority Classifications</p>
                              <div className="mt-1 flex items-center gap-1.5 text-xs text-[#A855F7]"><Loader2 className="h-3 w-3 animate-spin" />Loading...</div>
                            </div>
                          </>
                        ) : matchedCopilotAiSuggestions[0] ? (
                          <>
                            <div className="rounded-xl border border-[#E9D5FF] bg-white px-3 py-3 dark:border-white/10 dark:bg-white/5">
                              <p className="text-[11px] font-semibold text-[#64748B] dark:text-slate-300">Strategic Priorities</p>
                              <p className="mt-1 text-sm font-semibold text-[#0F172A] dark:text-white">{matchedCopilotAiSuggestions[0].strategicPriority}</p>
                            </div>
                            <div className="rounded-xl border border-[#E9D5FF] bg-white px-3 py-3 dark:border-white/10 dark:bg-white/5">
                              <p className="text-[11px] font-semibold text-[#64748B] dark:text-slate-300">Strategic Priority Classifications</p>
                              <p className="mt-1 text-sm font-semibold text-[#0F172A] dark:text-white">{matchedCopilotAiSuggestions[0].strategicPriorityClassification}</p>
                            </div>
                          </>
                        ) : copilotAiSuggestionError ? (
                          <div className="col-span-2 rounded-xl border border-red-100 bg-white px-3 py-3 text-sm text-[#B42318] dark:border-white/10 dark:bg-white/5">{copilotAiSuggestionError}</div>
                        ) : null}
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-[#E9D5FF] bg-white px-4 py-6 text-center text-sm text-[#64748B] dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                        Start the conversation, upload a document, or ask for help to generate suggested fields.
                      </div>
                    )}

                    {(copilotPendingSuggestion?.budgetRows?.length ?? 0) > 0 && (
                      <div className="rounded-xl border border-[#E9D5FF] bg-white px-4 py-3 dark:border-white/10 dark:bg-white/5">
                        <p className="text-sm font-semibold text-[#A855F7] dark:text-[#E9D5FF]">Budget Rows Preview</p>
                        <div className="mt-2 space-y-2">
                          {(copilotPendingSuggestion?.budgetRows ?? []).map((row) => (
                            <div key={row.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 dark:border-white/10 dark:bg-white/5">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-[#0F172A] dark:text-white">{row.accountName}</p>
                                <p className="text-xs text-[#64748B] dark:text-slate-300">{row.l1} - {row.l2} - {row.l3}</p>
                              </div>
                              <CurrencyAmount amount={row.budgetRequested} full className="text-sm font-bold text-[#A855F7]" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {matchedCopilotAiSuggestions.length > 1 && (
                      <div className="rounded-xl border border-[#E9D5FF]/70 bg-[#FDF7FF]/70 px-3 py-3 dark:border-white/10 dark:bg-white/5">
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-[#A855F7] dark:text-[#E9D5FF]">Alternate Strategic Priority</p>
                            <p className="mt-1 text-xs text-[#64748B] dark:text-slate-300">
                              {matchedCopilotAiSuggestions[1].strategicPriority} · {matchedCopilotAiSuggestions[1].strategicPriorityClassification}
                            </p>
                          </div>
                          <Button
                            className={cn(
                              'h-8 rounded-xl border px-3 text-xs font-semibold transition-all duration-300',
                              copilotAltSuggestionApplied
                                ? 'scale-[1.03] border-[#A855F7] bg-[#A855F7] text-white shadow-[0_10px_24px_rgba(168,85,247,0.18)]'
                                : 'border-[#E9D5FF] bg-white text-[#A855F7] hover:bg-[#A855F7] hover:text-white dark:border-white/10 dark:bg-white/10 dark:text-[#E9D5FF] dark:hover:bg-[#A855F7] dark:hover:text-white'
                            )}
                            onClick={() => handleApplyAlternateCopilotAiSuggestion(matchedCopilotAiSuggestions[1])}
                          >
                            <Check className="h-3.5 w-3.5" />
                            {copilotAltSuggestionApplied ? 'Applied' : 'Apply'}
                          </Button>
                        </div>
                      </div>
                    )}

                  </div>
                </div>

                <div className="shrink-0 border-t border-[#F0D9FF] px-5 py-4 dark:border-white/10">
                  <Button
                    type="button"
                    className="h-11 w-full rounded-xl bg-[#A855F7] text-sm text-white hover:bg-[#9333EA]"
                    onClick={() => void applyCopilotPendingSuggestion()}
                    disabled={!copilotPendingSuggestion}
                  >
                    <Sparkles className="h-4 w-4" />
                    Apply Suggestions
                  </Button>
                </div>
              </section>
            </div>

            {false && (copilotPendingSuggestion || copilotAiSuggestionLoading || copilotAiSuggestionError || matchedCopilotAiSuggestions.length > 0) && (
              <section className="rounded-2xl border border-[#E9D5FF] bg-gradient-to-b from-[#FDF7FF] to-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.06)] dark:border-white/10 dark:from-[#241735] dark:to-[#1E293B]">
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-base font-bold text-[#A855F7] dark:text-[#E9D5FF]">{copilotPendingSuggestion?.title ?? 'Suggested Project Fields'}</h3>
                    <p className="mt-1 text-sm text-[#64748B] dark:text-slate-300">
                      Suggestions are staged first. Review them, then apply them into the draft when you are ready.
                    </p>
                  </div>
                  <Button className="rounded-xl bg-[#A855F7] text-white hover:bg-[#9333EA]" onClick={() => void applyCopilotPendingSuggestion()} disabled={!copilotPendingSuggestion}>
                    <Check className="h-4 w-4" />
                    Apply Suggestions
                  </Button>
                </div>
                <div className="space-y-3">
                  {(copilotAiSuggestionLoading || copilotAiSuggestionError || matchedCopilotAiSuggestions.length > 0) && (
                    <div className="rounded-xl border border-[#F0D9FF] bg-white px-4 py-4 dark:border-white/10 dark:bg-white/5">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-[#A855F7] dark:text-[#E9D5FF]">Strategic Priority And Classification Recommendations</p>
                          <p className="text-xs text-[#64748B] dark:text-slate-300">{copilotAiPromptUsecase ?? 'AI-matched against strategic priorities'}</p>
                        </div>
                        <Button variant="outline" className="rounded-xl border-[#E9D5FF] text-[#A855F7]" onClick={() => void refreshCopilotAiSuggestions()}>
                          <RefreshCw className="h-4 w-4" />
                          Refresh
                        </Button>
                      </div>
                      {copilotAiSuggestionLoading ? (
                        <div className="flex items-center gap-2 text-sm text-[#A855F7]"><Loader2 className="h-4 w-4 animate-spin" />Preparing strategic-priority matches...</div>
                      ) : copilotAiSuggestionError ? (
                        <div className="rounded-xl border border-[#FFD4D1] bg-[#FFF5F5] px-3 py-3 text-sm text-[#B42318]">{copilotAiSuggestionError}</div>
                      ) : (
                        <div className="space-y-3">
                          {matchedCopilotAiSuggestions.slice(0, 2).map((suggestion, index) => (
                            <div key={`${suggestion.strategicPriority}-${suggestion.strategicPriorityClassification}`} className="rounded-xl border border-[#F0D9FF] bg-[#FDF7FF] px-4 py-3 dark:border-white/10 dark:bg-white/5">
                              <div className="mb-2 flex items-center justify-between gap-3">
                                <p className="text-xs font-semibold text-[#0F172A] dark:text-white">Option {index + 1}</p>
                                <Button className="rounded-xl bg-[#A855F7] text-white hover:bg-[#9333EA]" onClick={() => applyCopilotAiSuggestion(suggestion, 'both')}>
                                  <Check className="h-4 w-4" />
                                  Apply
                                </Button>
                              </div>
                              <div className="space-y-2">
                                <div>
                                  <p className="text-[11px] font-semibold text-[#64748B] dark:text-slate-300">Suggested Strategic Priority</p>
                                  <p className="mt-1 text-sm font-semibold text-[#0F172A] dark:text-white">{suggestion.strategicPriority}</p>
                                </div>
                                <div>
                                  <p className="text-[11px] font-semibold text-[#64748B] dark:text-slate-300">Suggested Strategic Priority Classification</p>
                                  <p className="mt-1 text-sm font-semibold text-[#0F172A] dark:text-white">{suggestion.strategicPriorityClassification}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {Object.entries(copilotPendingSuggestion?.fields ?? {}).length > 0 && (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {Object.entries(copilotPendingSuggestion?.fields ?? {}).map(([key, value]) => (
                        <div key={key} className="rounded-xl border border-[#F0D9FF] bg-white px-3 py-3 dark:border-white/10 dark:bg-white/5">
                          <p className="text-[11px] font-semibold text-[#64748B] dark:text-slate-300">{VALIDATION_LABELS[key as keyof typeof VALIDATION_LABELS] ?? key}</p>
                          <p className="mt-1 text-sm font-semibold text-[#0F172A] dark:text-white">{Array.isArray(value) ? value.join(', ') : value}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  {(copilotPendingSuggestion?.budgetRows?.length ?? 0) > 0 && (
                    <div className="rounded-xl border border-[#F0D9FF] bg-white px-4 py-3 dark:border-white/10 dark:bg-white/5">
                      <p className="text-sm font-semibold text-[#A855F7] dark:text-[#E9D5FF]">Budget Rows Preview</p>
                      <div className="mt-2 space-y-2">
                        {(copilotPendingSuggestion?.budgetRows ?? []).map((row) => (
                          <div key={row.id} className="flex items-center justify-between gap-3 rounded-xl bg-[#FDF7FF] px-3 py-2 dark:bg-white/5">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-[#0F172A] dark:text-white">{row.accountName}</p>
                              <p className="text-xs text-[#64748B] dark:text-slate-300">{row.l1} • {row.l2} • {row.l3}</p>
                            </div>
                            <CurrencyAmount amount={row.budgetRequested} full className="text-sm font-bold text-[#A855F7]" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}
          </div>

          <div className="space-y-6 animate-copilotFormReveal">
            <FormSection
              title="Project Details"
              description="Review and refine the project details prepared with Budget Assistant. Nothing is final until you save the draft."
              icon={ClipboardList}
              noIconBg
            >
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField label="Initiative / Budget Item Name" required error={copilotFieldErrors.initiativeName}>
                  <Input value={copilotFormValues.initiativeName} onChange={(event) => updateCopilotField('initiativeName', event.target.value)} className={cn('h-12 rounded-xl bg-white shadow-sm dark:bg-[#1E293B]', copilotFieldErrors.initiativeName ? 'border-[#F04438]' : 'border-[#D9E6F7]')} />
                </FormField>
                <FormField label="Strategic Priorities" required error={copilotFieldErrors.strategicPriorityId}>
                  <LookupSelect value={copilotFormValues.strategicPriorityId} onChange={handleCopilotStrategicPriorityChange} placeholder="Select parent strategic priority" options={strategicPriorityParentOptions} icon={TrendingUp} disabled={lookupLoading} invalid={Boolean(copilotFieldErrors.strategicPriorityId)} />
                </FormField>
                <FormField label="Strategic Priority Classification" required error={copilotFieldErrors.strategicPriorityClassificationId}>
                  <LookupSelect value={copilotFormValues.strategicPriorityClassificationId} onChange={(value) => updateCopilotField('strategicPriorityClassificationId', value)} placeholder="Select strategic priority classification" options={copilotStrategicPriorityClassificationOptions} icon={Layers} disabled={!copilotFormValues.strategicPriorityId || lookupLoading} invalid={Boolean(copilotFieldErrors.strategicPriorityClassificationId)} />
                </FormField>
                <FormField label="Work Stream" error={copilotFieldErrors.workStreamId}>
                  <LookupSelect value={copilotFormValues.workStreamId} onChange={(value) => updateCopilotField('workStreamId', value)} placeholder="Select work stream" options={workStreamOptions} icon={Briefcase} disabled={lookupLoading} invalid={Boolean(copilotFieldErrors.workStreamId)} />
                </FormField>
                <FormField label="ICT Budget Items Type" required error={copilotFieldErrors.budgetItemType}>
                  <LookupSelect value={copilotFormValues.budgetItemType ? String(copilotFormValues.budgetItemType) : ''} onChange={(value) => updateCopilotField('budgetItemType', Number(value) as BudgetItemType)} placeholder="Select ICT budget item type" options={BUDGET_ITEM_TYPE_OPTIONS.map((option) => ({ value: String(option.value), label: option.label }))} icon={Package} invalid={Boolean(copilotFieldErrors.budgetItemType)} />
                </FormField>
                <FormField label="Category">
                  <LookupSelect value={copilotFormValues.category ? String(copilotFormValues.category) : ''} onChange={(value) => updateCopilotField('category', Number(value) as CategoryType)} placeholder="Select category" options={CATEGORY_OPTIONS.map((option) => ({ value: String(option.value), label: option.label }))} icon={FolderKanban} />
                </FormField>
                <FormField label="Technology (Company)" error={copilotFieldErrors.technologyCompanyId}>
                  <LookupSelect value={copilotFormValues.technologyCompanyId} onChange={handleCopilotTechnologyCompanyChange} placeholder="Select technology company" options={technologyCompanyOptions} icon={Building2} disabled={lookupLoading} invalid={Boolean(copilotFieldErrors.technologyCompanyId)} />
                </FormField>
                <FormField label="Technology (Product)" error={copilotFieldErrors.technologyProductIds}>
                  <ProductMultiSelect products={selectedCopilotTechnologyCompany?.products ?? []} selectedIds={copilotFormValues.technologyProductIds} disabled={!selectedCopilotTechnologyCompany || lookupLoading} onToggle={toggleCopilotTechnologyProduct} invalid={Boolean(copilotFieldErrors.technologyProductIds)} />
                </FormField>
              </div>
            </FormSection>

            <FormSection title="Project Timeline" description="Set the expected delivery window for this budget request." icon={CalendarDays} noIconBg>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField label="Planned Start Date" required error={copilotFieldErrors.plannedStartDate}>
                  <DatePickerField value={copilotFormValues.plannedStartDate} onChange={(value) => updateCopilotField('plannedStartDate', value)} invalid={Boolean(copilotFieldErrors.plannedStartDate)} />
                </FormField>
                <FormField label="Planned End Date" required error={copilotFieldErrors.plannedEndDate}>
                  <DatePickerField value={copilotFormValues.plannedEndDate} onChange={(value) => updateCopilotField('plannedEndDate', value)} invalid={Boolean(copilotFieldErrors.plannedEndDate)} />
                </FormField>
              </div>
            </FormSection>

            <FormSection title="Project Summary" description="Capture the business need, scope, beneficiaries, and expected outcome." icon={FileText} noIconBg>
              <FormField label="Summary / Description" required error={copilotFieldErrors.summary}>
                <Textarea value={copilotFormValues.summary} onChange={(event) => updateCopilotField('summary', event.target.value)} rows={6} className={cn('rounded-xl bg-white shadow-sm focus-visible:ring-[#A855F7]', copilotFieldErrors.summary ? 'border-[#F04438]' : 'border-[#D9E6F7]')} />
              </FormField>
            </FormSection>

            <FormSection title="Project Budget Type" description="Select the budget type. The required financial fields below will adapt accordingly." icon={CircleDollarSign} noIconBg>
              <div className="space-y-4">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  {ACTIVITY_TYPE_OPTIONS.map((option) => {
                    const selected = copilotFormValues.activityType === option.value
                    return (
                      <button key={option.value} type="button" onClick={() => handleCopilotActivityTypeChange(option.value)} className={cn('rounded-2xl border p-4 text-left transition-colors', selected ? 'border-[#A855F7] bg-[#FDF7FF]' : 'border-[#DDEBFF] bg-white hover:border-[#D8B4FE] hover:bg-[#FDF7FF] dark:border-white/10 dark:bg-[#0F172A]/20 dark:hover:bg-white/5')}>
                        <div className="flex w-full items-center justify-between gap-3">
                          <p className="text-sm font-bold text-[#0F172A] dark:text-white">{option.title}</p>
                          <div className={cn('flex h-5 w-5 shrink-0 items-center justify-center rounded-full border', selected ? 'border-[#A855F7] bg-[#A855F7] text-white' : 'border-[#CBD5E1] text-transparent')}>
                            <Check className="h-3.5 w-3.5" />
                          </div>
                        </div>
                        <p className="mt-1.5 text-xs leading-5 text-[#64748B] dark:text-slate-300">{option.description}</p>
                      </button>
                    )
                  })}
                </div>
                {copilotFieldErrors.activityType && <p className="text-xs font-medium text-[#B42318]">{copilotFieldErrors.activityType}</p>}
                {copilotVisibleBudgetFields.length > 0 && (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {copilotVisibleBudgetFields.map((field) => (
                      <FormField key={field} label={toCurrencyFieldLabel(field)} required error={copilotFieldErrors[field]}>
                        <CurrencyField value={copilotFormValues[field]} onChange={(value) => updateCopilotField(field, value)} invalid={Boolean(copilotFieldErrors[field])} />
                      </FormField>
                    ))}
                  </div>
                )}
              </div>
            </FormSection>

            <FormSection title="Budget Account Codes" description="Review the GL lines the copilot or documents suggested, and add or adjust them before saving." icon={CircleDollarSign} noIconBg>
              <BudgetItemsBuilder
                items={copilotBudgetItems}
                onChange={(items) => {
                  setCopilotBudgetItems(items)
                  if (items.length > 0 && items.every((item) => item.budgetRequested > 0)) {
                    setCopilotBudgetItemsError(null)
                    setCopilotFieldErrors((prev) => {
                      if (!prev.budgetItems) return prev
                      const nextErrors = { ...prev }
                      delete nextErrors.budgetItems
                      return nextErrors
                    })
                  }
                }}
              />
              {copilotBudgetItemsError && <p className="mt-3 text-xs font-medium text-[#B42318]">{copilotBudgetItemsError}</p>}
            </FormSection>

            <section className="rounded-2xl border border-[#DDEBFF] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#1E293B]">
              <div className="border-b border-[#DDEBFF] px-4 py-4 dark:border-white/10 sm:px-6">
                <div className="flex items-start gap-2.5">
                  <div className="mt-1 shrink-0 text-[var(--primary)]">
                    <Upload className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#0F172A] dark:text-white">Supporting Documents Preview</h3>
                    <p className="mt-0.5 text-sm text-[#475569] dark:text-slate-300">
                      Files are analyzed immediately for AI guidance, but they are uploaded only when you save the draft.
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-5 p-4 sm:p-6">
                <FileUploadDropzone files={copilotUploadedFiles} onChange={setCopilotUploadedFiles} fileScores={copilotFileEvidenceScores} />
              </div>
            </section>

            <div className="rounded-2xl border border-[#DDEBFF] bg-white p-4 shadow-[0_14px_34px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-[#1E293B] sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3 text-sm text-[#64748B] dark:text-slate-200">
                  <CheckCircle2 className="h-5 w-5 text-[#A855F7]" />
                  <span>Save Draft uses the same safe create flow as manual mode, including file upload and AI-summary persistence after the budget record is created.</span>
                </div>
                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
                  <Button
                    variant="outline"
                    asChild
                    className="h-11 w-full rounded-xl border-[#CBD5E1] px-5 font-semibold text-[#334155] hover:bg-[#F8FAFC] hover:text-[#0F172A] sm:w-auto"
                  >
                  <Link to="/respondent/projects">Cancel</Link>
                </Button>
                  <Button
                    className="h-11 w-full rounded-xl bg-[var(--primary)] px-5 font-semibold text-white shadow-sm transition-colors hover:bg-[#1F5BFF] active:bg-[#1A4ED8] sm:w-auto"
                    onClick={() => void handleCopilotSaveDraft()}
                    disabled={isCopilotSaveBlockedByAiAnalysis}
                  >
                    Save Draft
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <Dialog open={workStreamModalOpen} onOpenChange={setWorkStreamModalOpen}>
        <DialogContent className="max-w-[520px] p-0">
          <div className="p-6">
            <DialogHeader className="pr-10">
              <DialogTitle>Create Work Stream</DialogTitle>
              <DialogDescription>
                Add a work stream record to Dataverse and select it for this budget item.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-6 space-y-3">
              <FormField label="Work Stream Name" required>
                <Input
                  value={newWorkStreamName}
                  onChange={(event) => setNewWorkStreamName(event.target.value)}
                  className="h-12 rounded-xl border-[#D9E6F7]"
                  placeholder="Enter work stream name"
                />
              </FormField>
            </div>
            <DialogFooter className="mt-6">
              <Button variant="outline" className="rounded-xl" onClick={() => setWorkStreamModalOpen(false)}>
                Cancel
              </Button>
              <Button className="rounded-xl" onClick={() => void handleCreateWorkStream()}>
                Create Work Stream
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={technologyProductModalOpen} onOpenChange={setTechnologyProductModalOpen}>
        <DialogContent className="max-w-[520px] p-0">
          <div className="p-6">
            <DialogHeader className="pr-10">
              <DialogTitle>Create Technology Product</DialogTitle>
              <DialogDescription>
                This creates a new product record, associates it with the selected technology company, and makes it available for selection.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-6 space-y-3">
              <FormField label="Technology Product Name" required>
                <Input
                  value={newTechnologyProductName}
                  onChange={(event) => setNewTechnologyProductName(event.target.value)}
                  className="h-12 rounded-xl border-[#D9E6F7]"
                  placeholder="Enter technology product name"
                />
              </FormField>
              {selectedTechnologyCompany && (
                <div className="rounded-2xl border border-[#DDEBFF] bg-[#F8FBFF] px-4 py-3 text-sm text-[#475569]">
                  Company association: <span className="font-semibold text-[#0F172A]">{selectedTechnologyCompany.name}</span>
                </div>
              )}
            </div>
            <DialogFooter className="mt-6">
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={() => setTechnologyProductModalOpen(false)}
              >
                Cancel
              </Button>
              <Button className="rounded-xl" onClick={() => void handleCreateTechnologyProduct()}>
                Create Product
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
