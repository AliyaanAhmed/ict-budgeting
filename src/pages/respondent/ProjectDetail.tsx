import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useBeforeUnload, useLocation, useParams, Link, useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowLeft,
  ArrowUpRight,
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
  ClipboardCheck,
  Clock3,
  Download,
  Edit,
  FileCheck2,
  FileText,
  FolderKanban,
  History,
  Info,
  Layers,
  Lightbulb,
  Loader2,
  MessageSquare,
  Package,
  Pencil,
  Plus,
  Save,
  Send,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  UserCheck,
  WalletCards,
  X,
  Zap,
  BarChart2,
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
import { projects, currentUser } from '@/data/db'
import type { Clarification, ClarificationReply } from '@/data/db'
import type { Project } from '@/domain/types'
import { StatusBadge, RiskBadge } from '@/components/shared/StatusBadge'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { CurrencyAmount } from '@/components/shared/CurrencyAmount'
import { DirhamIcon } from '@/components/shared/DirhamIcon'
import { ClarificationModal } from '@/components/shared/ClarificationModal'
import { ClarificationThread } from '@/components/shared/ClarificationThread'
import { ConfirmationModal } from '@/components/shared/ConfirmationModal'
import { ClassificationPickerModal } from '@/components/shared/ClassificationPickerModal'
import { useInstance } from '@/context/InstanceContext'
import { useToast } from '@/context/ToastContext'
import { useRoleProjects } from '@/hooks/useRoleProjects'
import { cn } from '@/lib/utils'
import { formatAEDFull } from '@/lib/utils'
import type { BudgetItemDraft } from '@/domain/classification'
import {
  buildBudgetItemDraft,
  buildClassificationTree,
  getClassificationRecords,
} from '@/services/classificationService'
import {
  ACTIVITY_TYPE_OPTIONS,
  BUDGET_ITEM_TYPE_OPTIONS,
  CATEGORY_OPTIONS,
  INITIAL_ICT_BUDGET_FORM_VALUES,
  formatIntegerInput,
  getVisibleBudgetFields,
  toCurrencyFieldLabel,
  type ActivityType,
  type BudgetItemType,
  type CategoryType,
  type IctBudgetFieldErrorMap,
  type IctBudgetFormValues,
} from '@/features/ictBudgetForm'
import {
  createBudgetLineItems,
  deleteBudgetLineItem,
  getBudgetLineItemsByBudgetId,
  toBudgetItemDraft,
  updateBudgetLineItemAmount,
  type BudgetLineItemRecord,
} from '@/services/budgetLineItemService'
import {
  deleteIctBudgetDraft,
  getIctBudgetDraftById,
  ICT_BUDGET_STATUS,
  updateIctBudgetStatus,
  updateIctBudgetDraft,
} from '@/services/ictBudgetDraftService'
import {
  getStrategicPriorityOptions,
  type StrategicPriorityOption,
} from '@/services/strategicPriorityService'
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
import { projectService } from '@/services/projectService'
import { uploadFilesToRecord } from '@/services/fileUploadService'
import { FileUploadDropzone } from '@/components/shared/FileUploadDropzone'
import {
  addClarificationReply,
  closeClarification,
  getClarificationsByBudgetId,
  raiseBudgetClarification,
} from '@/services/clarificationService'
import { SESSION_CURRENT_ROLE_KEY } from '@/context/RoleContext'
import { SESSION_USER_ID_KEY, SESSION_USER_TEAMS_KEY, type UserTeam } from '@/services/userContextService'
import {
  associateTechnologyProduct,
  disassociateTechnologyProduct,
  retrieveSharePointDocumentsByBudget,
  type WebApiPortalDocument,
} from '@/services/webApiForPortalService'
import { deleteSharePointDocument } from '@/services/fileDeleteService'
import { getAuditLogsByBudgetId, type AuditLogEntry } from '@/services/auditLogService'
import {
  SupportingDocumentAiInsights,
  type SupportingDocumentAiInsightItem,
} from '@/components/shared/SupportingDocumentAiInsights'
import {
  evaluateSupportingDocument,
  parseSupportingDocumentEvaluationSummary,
  type SupportingDocumentBudgetLine,
  type SupportingDocumentEvaluationSummary,
  type SupportingDocumentSuggestedProjectField,
} from '@/services/aiSupportingDocumentEvaluationService'
import {
  buildBudgetItemDraftFromSuggestedAccountCode,
  getComputedSupportingDocumentAccountCodeSuggestions,
  type ComputedSupportingDocumentAccountCodeSuggestion,
} from '@/features/supportingDocumentAccountCodes'
import { prepareSupportingDocumentFile } from '@/services/supportingDocumentPreparationService'
import {
  createDocumentSummaryRecords,
  deleteDocumentSummaryRecordsByDocumentName,
  getAllAiSummaryRecordsByBudgetId,
  getDocumentSummaryRecordsByBudgetId,
  invalidateBudgetOverviewRecord,
  invalidateCumulativeSummaryRecord,
  syncBudgetAiFlagsFromBudgetOverview,
  type StoredBudgetAiSummaryRecord,
  type StoredBudgetOverviewRecord,
  type StoredDocumentSummaryRecord,
} from '@/services/documentAiSummaryStoreService'
import {
  evaluateIctBudgetConsiderations,
  type IctBudgetConsiderationsEvaluationResult,
  type PolicyAssessmentItem,
  type PolicyMatchType,
} from '@/services/aiBudgetConsiderationsService'
import {
  getStrategicPrioritySuggestions,
  type StrategicPrioritySuggestion,
} from '@/services/aiStrategicSuggestionService'
import { getStoredInstanceDetail } from '@/services/instanceService'

// ─── Static helpers ───────────────────────────────────────────────────────────

interface PolicyMatchGroup {
  matchType: PolicyMatchType
  items: PolicyAssessmentItem[]
}

const PENDING_NEW_AI_RECORD = '__pending_new_ai_record__'

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

function truncatePolicyCopy(text: string, maxCharacters: number) {
  const normalized = text.trim()
  if (normalized.length <= maxCharacters) {
    return { text: normalized, truncated: false }
  }
  return {
    text: `${normalized.slice(0, maxCharacters).trimEnd()}...`,
    truncated: true,
  }
}

function BudgetConsiderationCompactCards({
  groups,
}: {
  groups: PolicyMatchGroup[]
}) {
  const [tooltip, setTooltip] = useState<null | {
    top: number
    left: number
    title: string
    reason: string
    action: string
  }>(null)
  const closeTimerRef = useRef<number | null>(null)

  const clearCloseTimer = () => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
  }

  const scheduleClose = () => {
    clearCloseTimer()
    closeTimerRef.current = window.setTimeout(() => setTooltip(null), 120)
  }

  useEffect(() => {
    if (!tooltip) return
    const handle = () => setTooltip(null)
    window.addEventListener('scroll', handle, true)
    window.addEventListener('resize', handle)
    return () => {
      window.removeEventListener('scroll', handle, true)
      window.removeEventListener('resize', handle)
    }
  }, [tooltip])

  const tooltipNode = tooltip
    ? createPortal(
        <div
          className="fixed z-[1000] w-80 rounded-2xl border border-[#E9D5FF] bg-white px-4 py-3 text-left shadow-[0_18px_45px_rgba(15,23,42,0.18)] dark:border-white/10 dark:bg-[#10203A]/95"
          style={{ top: tooltip.top, left: tooltip.left }}
          onMouseEnter={clearCloseTimer}
          onMouseLeave={scheduleClose}
        >
          <p className="text-sm font-semibold text-[#A855F7] dark:text-[#E9D5FF]">Reason</p>
          <p className="mt-1 text-sm leading-6 text-[#475569] dark:text-slate-100">{tooltip.reason || 'No reason provided.'}</p>
          <p className="mt-3 text-sm font-semibold text-[#A855F7] dark:text-[#E9D5FF]">Recommended Action</p>
          <p className="mt-1 text-sm leading-6 text-[#475569] dark:text-slate-100">{tooltip.action || 'No recommended action provided.'}</p>
        </div>,
        document.body
      )
    : null

  return (
    <div className="grid gap-3 lg:grid-cols-3">
      {tooltipNode}
      {groups.flatMap((group) => {
        const accent = toMatchTypeAccent(group.matchType)

        return group.items.map((item) => (
          <article
            key={`${item.policyNumber}-${item.policyName}-${group.matchType}`}
            className="group relative z-0 overflow-visible rounded-2xl border border-[#E9D5FF] bg-white px-4 py-4 shadow-sm transition-transform duration-200 hover:z-20 hover:-translate-y-0.5 dark:border-white/10 dark:bg-[#1E293B]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-start gap-2">
                  <div className={cn('mt-0.5 shrink-0', accent.text)}>
                    {group.matchType === 'Potential Conflict' ? (
                      <AlertTriangle className="h-4 w-4" />
                    ) : group.matchType === 'Coordination Required' ? (
                      <Layers className="h-4 w-4" />
                    ) : (
                      <Lightbulb className="h-4 w-4" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold leading-5 text-[#0F172A] dark:text-white">
                      {toDisplayText(item.policyName) || 'Policy match'}
                    </p>
                    <p className="mt-1 text-xs text-[#64748B] dark:text-slate-300">
                      Policy {item.policyNumber}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className={cn('inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold', accent.sofbadge)}>
                    <span className={cn('h-1.5 w-1.5 rounded-full', accent.dot)} />
                    {item.matchType}
                  </span>
                  <span className="inline-flex items-center rounded-full border border-[#D7E4F4] bg-white px-2.5 py-1 text-xs font-semibold text-[#286CFF] dark:border-white/10 dark:bg-white/10 dark:text-[#BFDBFE]">
                    Probability {item.relevanceScore ?? '-'}
                  </span>
                </div>
              </div>

              <div className="relative shrink-0">
                <span className="sr-only">{toDisplayText(item.policyName) || 'policy match'}</span>
                <button
                  type="button"
                  className="peer inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#E9D5FF] bg-[#FDF7FF] text-[#A855F7] transition-colors dark:border-white/10 dark:bg-white/10 dark:text-[#E9D5FF]"
                  aria-label={`View details for ${toDisplayText(item.policyName) || 'policy match'}`}
                  onMouseEnter={(event) => {
                    clearCloseTimer()
                    const rect = event.currentTarget.getBoundingClientRect()
                    setTooltip({
                      top: Math.max(8, rect.top - 16 - 180),
                      left: Math.min(window.innerWidth - 336, Math.max(8, rect.right - 320)),
                      title: toDisplayText(item.policyName) || 'policy match',
                      reason: toDisplayText(item.reason),
                      action: toDisplayText(item.requiredAction),
                    })
                  }}
                  onMouseLeave={scheduleClose}
                  onFocus={(event) => {
                    clearCloseTimer()
                    const rect = event.currentTarget.getBoundingClientRect()
                    setTooltip({
                      top: Math.max(8, rect.top - 16 - 180),
                      left: Math.min(window.innerWidth - 336, Math.max(8, rect.right - 320)),
                      title: toDisplayText(item.policyName) || 'policy match',
                      reason: toDisplayText(item.reason),
                      action: toDisplayText(item.requiredAction),
                    })
                  }}
                  onBlur={scheduleClose}
                >
                  <Info className="h-4 w-4" />
                </button>
              </div>
            </div>
          </article>
        ))
      })}
    </div>
  )
}

type AiFieldAssistProps = {
  fieldLabel: string
  suggestedValue: string
  isOpen: boolean
  canApply: boolean
  onToggle: () => void
  onApply: () => void
  helperText?: string
}

function AiFieldAssistTrigger({
  fieldLabel,
  suggestedValue,
  isOpen,
  canApply,
  onToggle,
  onApply,
  helperText,
}: AiFieldAssistProps) {
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return
    const handleMouseDown = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        onToggle()
      }
    }
    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [isOpen, onToggle])

  return (
    <div ref={wrapperRef} className="relative shrink-0">
      <button
        type="button"
        onClick={onToggle}
        className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#E9D5FF] bg-[#FDF7FF] text-[#A855F7] transition-all hover:border-[#D8B4FE] hover:bg-[#FAF5FF] dark:border-white/10 dark:bg-white/5 dark:text-[#E9D5FF]"
        aria-label={`${fieldLabel} suggested by AI`}
      >
        <Sparkles className="h-3.5 w-3.5" />
      </button>

      {isOpen ? (
        <div className="absolute right-0 top-[calc(100%+8px)] z-30 w-72 rounded-2xl border border-[#E9D5FF] bg-white p-3 shadow-[0_18px_42px_rgba(15,23,42,0.14)] dark:border-white/10 dark:bg-[#1E293B]">
          <div className="flex items-start gap-2.5">
            <div className="mt-0.5 shrink-0 text-[#A855F7] dark:text-[#E9D5FF]">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#0F172A] dark:text-white">AI suggested this field</p>
            </div>
          </div>
          <div className="mt-3">
            <p className="text-[11px] font-semibold text-[#64748B] dark:text-slate-300">{fieldLabel}</p>
            <p className="mt-1 whitespace-pre-line text-sm text-[#0F172A] dark:text-white">{suggestedValue}</p>
          </div>
          {canApply ? (
            <button
              type="button"
              onClick={onApply}
              className="mt-3 inline-flex items-center gap-2 rounded-xl bg-[#A855F7] px-3 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#9333EA] active:bg-[#7E22CE]"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Apply Suggestion
            </button>
          ) : (
            <p className="mt-3 text-xs leading-5 text-[#64748B] dark:text-slate-300">
              {helperText ?? 'Switch the form to Edit mode to apply this AI suggestion.'}
            </p>
          )}
        </div>
      ) : null}
    </div>
  )
}

function Field({
  label,
  value,
  aiAssist,
  highlighted = false,
}: {
  label: string
  value?: string | null
  aiAssist?: React.ReactNode
  highlighted?: boolean
}) {
  return (
    <div
      className={cn(
        'relative rounded-xl border border-[#EAF0F6] bg-[#F8FBFF] px-3 py-3 dark:border-white/10 dark:bg-white/5'
      )}
    >
      {highlighted ? (
        <div className="pointer-events-none absolute inset-0 z-[1] bg-[linear-gradient(90deg,rgba(168,85,247,0)_0%,rgba(168,85,247,0.06)_28%,rgba(216,180,254,0.12)_50%,rgba(168,85,247,0.06)_72%,rgba(168,85,247,0)_100%)] animate-aiMagicSweep" />
      ) : null}
      <div className="mb-1 flex items-center justify-between gap-3">
        <p className="text-xs font-semibold text-[#64748B] dark:text-slate-200">{label}</p>
        {aiAssist}
      </div>
      <p className="text-sm font-medium text-[#0F172A] dark:text-white">{value || '-'}</p>
    </div>
  )
}

function SectionIcon({ icon: Icon }: { icon: React.ElementType }) {
  return (
    <div className="mt-1 shrink-0 text-[#0F172A] dark:text-white">
      <Icon className="h-6 w-6" />
    </div>
  )
}

function DetailSection({
  id,
  title,
  description,
  icon,
  children,
  action,
  titleAdornment,
  noShadow = false,
}: {
  id?: string
  title: string
  description?: string
  icon: React.ElementType
  children: React.ReactNode
  action?: React.ReactNode
  titleAdornment?: React.ReactNode
  noShadow?: boolean
}) {
  return (
    <section
      id={id}
      className={cn(
        'scroll-mt-6 rounded-2xl border border-[#DDEBFF] bg-white p-4 dark:border-white/10 dark:bg-[#1E293B] sm:p-6',
        noShadow ? 'shadow-none' : 'shadow-[0_12px_30px_rgba(15,23,42,0.06)]'
      )}
    >
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-2.5">
          <SectionIcon icon={icon} />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-bold text-[var(--foreground)]">{title}</h3>
              {titleAdornment}
            </div>
            {description && <p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--muted-foreground)]">{description}</p>}
          </div>
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

function EditField({
  label,
  required,
  error,
  children,
  aiAssist,
  highlighted = false,
}: {
  label: string
  required?: boolean
  error?: string
  children: React.ReactNode
  aiAssist?: React.ReactNode
  highlighted?: boolean
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3">
        <label className="text-sm font-medium text-[#0F172A] dark:text-white">
          {label}{required && <span className="ml-1 text-red-500">*</span>}
        </label>
        {aiAssist}
      </div>
      {children}
      {error && <p className="text-xs font-medium text-[#B42318]">{error}</p>}
    </div>
  )
}

function normalizeFormValuesForComparison(values: IctBudgetFormValues) {
  return {
    ...values,
    technologyProductIds: [...values.technologyProductIds].sort(),
  }
}

function normalizeBudgetLineItemsForComparison(items: BudgetLineItemRecord[]) {
  return [...items]
    .map((item) => ({
      id: item.id,
      budgetRequested: item.budgetRequested,
    }))
    .sort((left, right) => left.id.localeCompare(right.id))
}

function EditDatePickerField({
  value,
  onChange,
  placeholder = 'Pick a date',
  invalid,
  minDate,
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  invalid?: boolean
  minDate?: string
}) {
  const pickerRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [viewMonth, setViewMonth] = useState(() => (value ? new Date(`${value}T00:00:00`) : new Date()))

  const selectedDate = value ? new Date(`${value}T00:00:00`) : null
  const minimumDate = minDate ? new Date(`${minDate}T00:00:00`) : null
  const today = new Date()
  const calendarStart = startOfWeek(startOfMonth(viewMonth))
  const calendarEnd = endOfWeek(endOfMonth(viewMonth))
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })
  const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
  const formattedValue = selectedDate ? format(selectedDate, 'MMM d, yyyy') : placeholder

  useEffect(() => {
    if (!open || !minimumDate) return
    const selectedMonth = selectedDate ?? viewMonth
    if (selectedMonth < startOfMonth(minimumDate)) {
      setViewMonth(minimumDate)
    }
  }, [minimumDate, open, selectedDate, viewMonth])

  const selectDate = (date: Date) => {
    if (minimumDate && date < minimumDate) return
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
          'inline-flex h-10 w-full shrink-0 items-center justify-start gap-2 whitespace-nowrap rounded-xl border border-slate-200 bg-white px-4 py-2 text-left text-sm font-normal shadow-sm transition-colors duration-150 outline-none hover:border-[#043DFF] hover:bg-[#E7F5FF] hover:text-[#043DFF] active:bg-[#D3EDFF] focus-visible:ring-2 focus-visible:ring-[#286CFF] focus-visible:ring-offset-2 dark:border-white/10 dark:bg-[#1E293B] dark:text-white dark:hover:bg-white/5',
          invalid ? 'border-[#F04438] bg-[#FFF5F5] dark:bg-[#2B1E24]' : '',
          selectedDate ? 'text-[#0F172A] dark:text-white' : 'text-[#64748B]'
        )}
      >
        <CalendarDays className="mr-2 h-4 w-4 shrink-0 text-[#0F172A] dark:text-white" />
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
                  const disabledDate = Boolean(minimumDate && date < minimumDate)

                  return (
                    <button
                      key={date.toISOString()}
                      type="button"
                      disabled={disabledDate}
                      onClick={() => selectDate(date)}
                      className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-lg p-2 text-sm font-normal leading-none text-[#286CFF] transition-colors outline-none hover:bg-[#E7F5FF] active:bg-[#D3EDFF] focus-visible:ring-2 focus-visible:ring-[#286CFF] focus-visible:ring-offset-2 dark:hover:bg-white/10',
                        !currentMonth && 'text-[#94A3B8]',
                        disabledDate && 'cursor-not-allowed text-[#CBD5E1] hover:bg-transparent dark:text-slate-600',
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

function AiCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[#B0DBFF] bg-gradient-to-b from-[#E7F5FF] to-white p-4 shadow-md dark:border-white/10 dark:from-[#10213B] dark:to-[#1E293B]">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#286CFF] to-[#4F98FF] text-white shadow-lg shadow-blue-200 dark:shadow-none">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <p className="font-semibold text-slate-900 dark:text-white">{title}</p>
          <p className="text-xs text-slate-500 dark:text-slate-300">AI-assisted review signal</p>
        </div>
      </div>
      {children}
    </div>
  )
}

function AiSignal({ label, value, tone = 'blue' }: { label: string; value: string; tone?: 'blue' | 'green' | 'amber' | 'red' }) {
  const toneClass = {
    blue: 'bg-[#E7F5FF] text-[#286CFF] border-[#B0DBFF]',
    green: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700/30',
    amber: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-700/30',
    red: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-700/30',
  }[tone]

  return (
    <div className={cn('rounded-xl border px-3 py-3', toneClass)}>
      <p className="text-xs font-medium opacity-80">{label}</p>
      <p className="mt-1 text-lg font-bold">{value}</p>
    </div>
  )
}

function DynamicStatusBadge({ status, fallbackStatus }: { status?: string | null; fallbackStatus: string }) {
  const resolvedStatus = status?.trim() || fallbackStatus
  return <StatusBadge status={resolvedStatus as never} />
}

function EmptyAiActionCard({
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

type WorkflowRole = 'Respondent' | 'Reviewer' | 'Approver'
type WorkflowAction =
  | 'delete-project'
  | 'submit-reviewer'
  | 'complete-review'
  | 'submit-approver'
  | 'approve-project'
type PendingClarificationReply = {
  clarificationId: string
  message: string
  files?: File[]
  returnToRole: 'Reviewer' | 'Approver'
}

interface DetailSuggestionRow {
  id: string
  section: string
  title: string
  value: string
  detail?: string
  confidence?: number | null
  kind: 'summary' | 'field' | 'account-code'
  field?: SupportingDocumentSuggestedProjectField
  accountCodeSuggestion?: ComputedSupportingDocumentAccountCodeSuggestion
  actionable: boolean
}

const WORKFLOW_STATUSCODE_BY_STATUS: Partial<Record<Project['status'], number>> = {
  Draft: 1,
  'Submitted to Reviewer': 776140001,
  'Reviewer Review Completed': 576610001,
  'Clarification Required': 776140010,
  'Submitted to Approver': 776140002,
  Approved: 776140003,
  'Submitted to DGE': 776140004,
}

function getWorkflowOwner(status: string): WorkflowRole | null {
  if (status === 'Draft' || status === 'Clarification Required') return 'Respondent'
  if (status === 'Submitted to Reviewer' || status === 'Reviewer Review Completed') return 'Reviewer'
  if (status === 'Submitted to Approver' || status === 'Approved') return 'Approver'
  return null
}

function getWorkflowOwnerByStatusCode(statusCode: number | null | undefined, fallbackStatus?: string): WorkflowRole | null {
  switch (statusCode) {
    case 1:
    case 776140010:
      return 'Respondent'
    case 776140001:
    case 576610001:
      return 'Reviewer'
    case 776140002:
    case 776140003:
      return 'Approver'
    default:
      return fallbackStatus ? getWorkflowOwner(fallbackStatus) : null
  }
}

function normalizeStoredRole(roleLabel: string | null): WorkflowRole | null {
  const value = roleLabel?.trim().toLowerCase() ?? ''
  if (value.includes('review')) return 'Reviewer'
  if (value.includes('approv')) return 'Approver'
  if (value.includes('respond')) return 'Respondent'
  return null
}

function getStoredUserTeams(): UserTeam[] {
  const raw = sessionStorage.getItem(SESSION_USER_TEAMS_KEY)
  if (!raw) return []

  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as UserTeam[]) : []
  } catch {
    return []
  }
}

function getRoleTeamId(role: WorkflowRole): string | null {
  return getStoredUserTeams().find((team) => team.role === role)?.teamid?.trim() || null
}

function isProjectOwnedByCurrentContext(project: Project, role: WorkflowRole) {
  const ownerId = project.ownerId?.trim() || null
  const ownerType = project.ownerType?.trim().toLowerCase() || null
  if (!ownerId) return false

  const roleTeamId = getRoleTeamId(role)
  if ((ownerType === 'team' || ownerType === 'ownerid') && roleTeamId && ownerId === roleTeamId) {
    return true
  }

  const userId = sessionStorage.getItem(SESSION_USER_ID_KEY)?.trim()
  if ((ownerType === 'systemuser' || ownerType === 'ownerid') && userId && ownerId === userId) {
    return true
  }

  return false
}

function canRoleEdit(project: Project, role: WorkflowRole) {
  return (
    getWorkflowOwnerByStatusCode(project.statusCode, project.status) === role &&
    isProjectOwnedByCurrentContext(project, role)
  )
}

function workflowActionDetails(
  action: WorkflowAction,
  role: WorkflowRole,
  options?: { directToDge?: boolean }
) {
  const directToDge = options?.directToDge === true

  if (action === 'delete-project') {
    return {
      title: 'Delete this project?',
      description:
        'This will permanently delete the ICT budget record and remove it from the workflow.',
      confirmLabel: 'Delete Project',
      tone: 'danger' as const,
    }
  }

  if (action === 'submit-reviewer') {
    return {
      title: 'Submit to Reviewer?',
      description:
        'This will lock respondent changes and move the project into reviewer assessment.',
      confirmLabel: 'Submit to Reviewer',
      tone: 'primary' as const,
    }
  }

  if (action === 'submit-approver') {
    return {
      title: 'Submit to Approver?',
      description:
        'This will move the project forward to approver review for final decisioning.',
      confirmLabel: 'Submit to Approver',
      tone: 'primary' as const,
    }
  }

  if (action === 'complete-review') {
    return {
      title: 'Mark as Reviewed?',
      description:
        'This will mark the reviewer assessment as completed and keep the project with the reviewer until it is submitted to the approver.',
      confirmLabel: 'Mark as Reviewed',
      tone: 'primary' as const,
    }
  }

  return {
    title:
      role === 'Approver'
        ? directToDge
          ? 'Submit this project to DGE?'
          : 'Approve this project?'
        : 'Complete this action?',
    description:
      role === 'Approver' && directToDge
        ? 'This cycle already has a DGE submission, so this project will move directly into DGE strategic alignment review.'
        : 'This will mark the project as approved by the approver and close the approval stage.',
    confirmLabel: role === 'Approver' && directToDge ? 'Submit to DGE' : 'Approve Project',
    tone: 'primary' as const,
  }
}

function SkeletonBlock({ className }: { className: string }) {
  return <div className={cn('animate-pulse rounded-xl bg-gradient-to-r from-[#E8EEF8] via-[#F4F7FB] to-[#E8EEF8] bg-[length:200%_100%] dark:from-white/10 dark:via-white/5 dark:to-white/10', className)} />
}

function toPlainTextSummary(value: string | null | undefined) {
  if (!value?.trim()) {
    return ''
  }

  if (typeof window !== 'undefined' && typeof window.document !== 'undefined') {
    const container = window.document.createElement('div')
    container.innerHTML = value
    return (container.textContent || container.innerText || '').trim()
  }

  return value
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function splitStoredFileUrls(value: string | undefined) {
  return (value ?? '')
    .split(/[,\n]/)
    .map((url) => url.trim())
    .filter(Boolean)
}

function normalizeDocumentUrl(value: string | null | undefined) {
  if (!value?.trim()) return null

  try {
    const parsed = new URL(value)
    const pathname = decodeURIComponent(parsed.pathname).replace(/\/+$/, '')
    return `${parsed.origin}${pathname}`.toLowerCase()
  } catch {
    return value.trim().replace(/[?#].*$/, '').replace(/\/+$/, '').toLowerCase()
  }
}

function getFileNameFromUrl(value: string) {
  try {
    const parsed = new URL(value)
    const pathname = decodeURIComponent(parsed.pathname)
    const segments = pathname.split('/').filter(Boolean)
    return segments[segments.length - 1] || value
  } catch {
    const sanitized = value.split(/[?#]/)[0]
    const segments = sanitized.split('/').filter(Boolean)
    return decodeURIComponent(segments[segments.length - 1] || value)
  }
}

function DetailPageLoadingShell() {
  return (
    <div className="w-full space-y-5 lg:pr-24 xl:pr-28 2xl:pr-32">
      <div className="rounded-2xl border border-[#DDEBFF] bg-white px-4 py-5 shadow-[0_10px_26px_rgba(15,23,42,0.05)] dark:border-white/10 dark:bg-[#1E293B] sm:px-6">
        <SkeletonBlock className="mb-4 h-3 w-56" />
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <SkeletonBlock className="h-10 w-[360px] max-w-full" />
            <SkeletonBlock className="h-4 w-[280px] max-w-full" />
            <SkeletonBlock className="h-4 w-[220px] max-w-full" />
          </div>
          <div className="grid grid-cols-3 gap-2 sm:min-w-[420px]">
            <SkeletonBlock className="h-20 w-full" />
            <SkeletonBlock className="h-20 w-full" />
            <SkeletonBlock className="h-20 w-full" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_390px]">
        <div className="space-y-5">
          {[0, 1, 2, 3].map((index) => (
            <div key={index} className="rounded-2xl border border-[#DDEBFF] bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#1E293B]">
              <div className="mb-5 flex items-start gap-4">
                <SkeletonBlock className="h-12 w-12 rounded-2xl" />
                <div className="flex-1 space-y-2">
                  <SkeletonBlock className="h-6 w-52" />
                  <SkeletonBlock className="h-4 w-full max-w-[420px]" />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <SkeletonBlock className="h-16 w-full" />
                <SkeletonBlock className="h-16 w-full" />
                <SkeletonBlock className="h-16 w-full" />
                <SkeletonBlock className="h-16 w-full" />
              </div>
            </div>
          ))}
        </div>

        <aside className="space-y-5">
          <div className="rounded-2xl border border-[#DDEBFF] bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#1E293B]">
            <SkeletonBlock className="mb-4 h-5 w-32" />
            <div className="space-y-3">
              <SkeletonBlock className="h-10 w-full" />
              <SkeletonBlock className="h-10 w-full" />
              <SkeletonBlock className="h-10 w-full" />
            </div>
          </div>
          <div className="rounded-2xl border border-[#DDEBFF] bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#1E293B]">
            <SkeletonBlock className="mb-4 h-5 w-40" />
            <div className="space-y-3">
              <SkeletonBlock className="h-16 w-full" />
              <SkeletonBlock className="h-16 w-full" />
            </div>
          </div>
        </aside>
      </div>
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
  options: Array<{ value: string; label: string }>
  icon: React.ElementType
  disabled?: boolean
  invalid?: boolean
}) {
  return (
    <Select value={value || undefined} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger
        className={cn(
          'h-10 rounded-xl border bg-white shadow-sm transition-colors hover:border-[var(--primary-light)] focus:ring-[var(--primary)] dark:border-white/10 dark:bg-[#1E293B]',
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
          <Icon className="h-4 w-4 shrink-0 text-[#0F172A] dark:text-white" />
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
          'h-10 rounded-xl bg-white pl-9 shadow-sm dark:bg-[#1E293B]',
          invalid ? 'border-[#F04438]' : 'border-[#D9E6F7]'
        )}
      />
    </div>
  )
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
          'flex h-10 w-full items-center justify-between rounded-xl border bg-white px-4 text-left shadow-sm transition-colors hover:border-[var(--primary-light)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] dark:border-white/10 dark:bg-[#1E293B]',
          invalid ? 'border-[#F04438]' : 'border-[#D9E6F7]',
          disabled && 'cursor-not-allowed bg-[#F8FAFC] text-[#94A3B8] opacity-80 dark:bg-white/5'
        )}
      >
        <span className="inline-flex min-w-0 items-center gap-5">
          <Package className="h-4 w-4 shrink-0 text-[#0F172A] dark:text-white" />
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
                      'flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-colors',
                      selected
                        ? 'bg-[#EEF4FF] text-[#286CFF]'
                        : 'hover:bg-[#F8FBFF] text-[#0F172A] dark:text-white dark:hover:bg-white/5'
                    )}
                  >
                    <div>
                      <p className="text-sm font-semibold">{product.name}</p>
                      <p className="text-xs text-[#64748B] dark:text-slate-300">{product.typeLabel}</p>
                    </div>
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

function BudgetItemsTable({
  items,
  loading,
  error,
  editable,
  savingId,
  deletingId,
  onChangeBudgetRequested,
  onDelete,
}: {
  items: BudgetLineItemRecord[]
  loading: boolean
  error: string | null
  editable: boolean
  savingId: string | null
  deletingId: string | null
  onChangeBudgetRequested: (lineItemId: string, amount: number) => void
  onDelete: (item: BudgetLineItemRecord) => void
}) {
  const [draftAmounts, setDraftAmounts] = useState<Record<string, string>>({})

  useEffect(() => {
    setDraftAmounts(
      Object.fromEntries(items.map((item) => [item.id, item.budgetRequested > 0 ? formatAEDFull(item.budgetRequested) : '']))
    )
  }, [items])

  if (loading) {
    return (
      <div className="rounded-xl border border-[#DDEBFF] bg-[#F8FBFF] px-4 py-6 text-sm text-[#64748B] dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
        Loading budget line items...
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl border border-[#FFD4D1] bg-[#FFF5F5] px-4 py-6 text-sm text-[#B42318] dark:border-[#EA4F49]/40 dark:bg-[#EA4F49]/10">
        {error}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-[#DDEBFF] bg-[#F8FBFF] px-4 py-6 text-sm text-[#64748B] dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
        No budget line items have been created for this project yet.
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[#DDEBFF] bg-white dark:border-white/10 dark:bg-[#0F172A]/20">
      <table className="w-full text-sm">
        <thead className="hidden bg-[#F8FAFC] md:table-header-group dark:bg-white/5">
          <tr>
            {['Account Name', 'Classification', 'EBS Fusion Code', 'Budget Requested', 'Action'].map((header) => (
              <th key={header} className="whitespace-nowrap px-4 py-3 text-start text-xs font-bold text-[#64748B] dark:text-slate-200">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const classificationLabel = item.expenseTypeLabel ?? 'Not Set'
            const isCapex = classificationLabel.toLowerCase() === 'capex'
            const draftValue = draftAmounts[item.id] ?? String(item.budgetRequested)
            const normalizedDraftValue = draftValue.replace(/,/g, '')
            const parsedAmount = Number(normalizedDraftValue)
            const isValidAmount = draftValue.trim().length > 0 && Number.isFinite(parsedAmount) && parsedAmount > 0
            const isSaving = savingId === item.id
            const isDeleting = deletingId === item.id

            return (
              <tr key={item.id} className="block border-t border-[#F1F5F9] p-4 dark:border-white/5 md:table-row md:p-0">
                <td className="block py-2 font-medium text-[#0F172A] dark:text-white md:table-cell md:px-4 md:py-3">{item.accountName}</td>
                <td className="block py-2 md:table-cell md:px-4 md:py-3">
                  <div className="text-xs text-[#475569] dark:text-slate-200">{item.l1} / {item.l2} / {item.l3}</div>
                  <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', isCapex ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' : 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400')}>
                    {classificationLabel}
                  </span>
                </td>
                <td className="block py-2 text-xs font-mono text-[#475569] dark:text-slate-200 md:table-cell md:px-4 md:py-3">
                  EBS {item.ebsCode} / Fusion {item.fusionCode}
                </td>
                <td className="block py-2 font-semibold text-[#0F172A] dark:text-white md:table-cell md:px-4 md:py-3">
                  {editable ? (
                    <div className="relative min-w-[190px]">
                      <DirhamIcon width={16} height={16} color="#286CFF" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" />
                      <Input
                        inputMode="decimal"
                        value={draftValue}
                        onChange={(event) => {
                          const digitsAndDecimal = event.target.value.replace(/[^\d.]/g, '')
                          const [integerPart = '', decimalPart] = digitsAndDecimal.split('.')
                          const normalizedInteger = integerPart.replace(/^0+(?=\d)/, '') || (integerPart ? '0' : '')
                          const formattedInteger = normalizedInteger ? formatAEDFull(Number(normalizedInteger)) : ''
                          const nextValue = decimalPart !== undefined
                            ? `${formattedInteger}.${decimalPart.slice(0, 4)}`
                            : formattedInteger

                          setDraftAmounts((current) => ({ ...current, [item.id]: nextValue }))
                          const nextNumericValue = decimalPart !== undefined
                            ? Number(`${normalizedInteger || '0'}.${decimalPart.slice(0, 4)}`)
                            : Number(normalizedInteger || '0')
                          onChangeBudgetRequested(item.id, Number.isFinite(nextNumericValue) ? nextNumericValue : 0)
                        }}
                        placeholder="-"
                        className={cn(
                          'h-10 rounded-xl bg-white pl-9 pr-3 text-sm font-semibold focus-visible:ring-[#286CFF]/20 dark:border-white/10 dark:bg-[#1E293B]',
                          isValidAmount || draftValue.trim().length === 0 ? 'border-[#D9E6F7]' : 'border-[#F04438] bg-[#FFF5F5] dark:bg-[#2B1E24]'
                        )}
                      />
                    </div>
                  ) : (
                    item.budgetRequested > 0 ? (
                      <CurrencyAmount amount={item.budgetRequested} full className="font-semibold text-[#0F172A] dark:text-white" iconSize={14} />
                    ) : (
                      <span className="text-sm font-semibold text-[#94A3B8] dark:text-slate-400">-</span>
                    )
                  )}
                </td>
                <td className="block py-2 md:table-cell md:px-4 md:py-3">
                  <div className="flex items-center gap-2">
                    {editable ? (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-9 w-9 rounded-xl border-[#F5C2C7] p-0 text-[#B42318] hover:bg-[#FFF1F3] hover:text-[#B42318] dark:border-[#B42318]/30 dark:text-[#FCA5A5]"
                          disabled={isSaving || isDeleting}
                          onClick={() => onDelete(item)}
                          title={isDeleting ? 'Deleting' : 'Delete'}
                          aria-label={isDeleting ? `Deleting ${item.accountName}` : `Delete ${item.accountName}`}
                        >
                          <Trash2 className={cn('h-4 w-4', isDeleting && 'animate-pulse')} />
                        </Button>
                      </>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-1 text-xs font-semibold text-green-700 dark:bg-green-900/20 dark:text-green-300">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Synced
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

const GUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// ─── Section registry (used by nav + IntersectionObserver) ───────────────────

const FORM_SECTIONS = [
  { id: 'sec-details',        label: 'Project Details',     icon: ClipboardCheck },
  { id: 'sec-timelines',      label: 'Project Timeline',    icon: CalendarDays   },
  { id: 'sec-summary',        label: 'Project Summary',     icon: FileText       },
  { id: 'sec-budget',         label: 'Budget Account Codes', icon: WalletCards   },
  { id: 'sec-documents',      label: 'Documents',           icon: FileCheck2     },
  { id: 'sec-clarifications', label: 'Clarifications',      icon: MessageSquare  },
]

const VALIDATION_LABELS: Record<keyof IctBudgetFieldErrorMap, string> = {
  initiativeName: 'Initiative / Budget Item Name',
  strategicPriorityId: 'Strategic Priority',
  strategicPriorityClassificationId: 'Strategic Priority Classifications',
  workStreamId: 'Work Stream',
  technologyCompanyId: 'Technology (Company)',
  technologyProductIds: 'Technology (Product)',
  budgetItemType: 'ICT Budget Items Type',
  plannedStartDate: 'Planned Start Date',
  plannedEndDate: 'Planned End Date',
  summary: 'Summary / Description',
  activityType: 'Project Budget Type',
  category: 'Category',
  totalBudgetPaidPreviousYear: 'Total Budget Paid Previous Year',
  totalBudgetPayableFutureYear: 'Total Budget Payable Future Years',
  totalBudgetPayableNextYear: 'Total Budget Payable Next Year',
  totalBudgetPayableForYearAfterNext: 'Total Budget Payable For Year After Next',
  budgetItems: 'Budget Account Codes',
}

interface UploadedSupportingDocumentAnalysis {
  fileName: string
  fileSize: number | null
  fileLastModified: number | null
  uploadedToSharePoint: boolean
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

interface MatchedAiSuggestion extends StrategicPrioritySuggestion {
  priorityId: string | null
  classificationId: string | null
  classificationParentId: string | null
}

function getUploadedFileSignature(file: File) {
  return `${file.name}:${file.size}:${file.lastModified}`
}

function createUploadedSupportingDocumentAnalysis(file: File): UploadedSupportingDocumentAnalysis {
  return {
    fileName: file.name,
    fileSize: file.size,
    fileLastModified: file.lastModified,
    uploadedToSharePoint: false,
    status: 'queued',
    parsedSummary: null,
    rawSummary: '',
    responseTimeMs: null,
    error: null,
  }
}

function truncateAiText(value: string | undefined, maxCharacters: number) {
  const normalized = value?.trim() ?? ''
  if (!normalized) return ''
  if (normalized.length <= maxCharacters) return normalized
  return `${normalized.slice(0, maxCharacters).trimEnd()}...`
}

function formatAiFieldValue(value: string | string[] | undefined) {
  if (!value) return '-'
  return Array.isArray(value) ? value.join(', ') : value
}

function toDisplayText(value: unknown): string {
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (Array.isArray(value)) {
    return value.map((item) => toDisplayText(item)).filter(Boolean).join(', ')
  }
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>
    if (typeof record.text_template === 'string') return record.text_template.trim()
    if (typeof record.text === 'string') return record.text.trim()
    if (typeof record.value === 'string') return record.value.trim()
  }
  return ''
}

function getDocumentSummaryBudgetTotal(summary: SupportingDocumentEvaluationSummary | null) {
  return (summary?.budget_lines ?? []).reduce((sum, line) => sum + (line.amount ?? 0), 0)
}

function resolveAiFieldMapping(field: SupportingDocumentSuggestedProjectField) {
  const key = field.field_key?.trim().toLowerCase() ?? ''
  const label = field.field_label?.trim().toLowerCase() ?? ''
  if (key === 'project_name') return 'initiativeName' as const
  if (key === 'project_description') return 'summary' as const
  if (key === 'category') return 'category' as const
  if (key === 'technology_company') return 'technologyCompany' as const
  if (
    key === 'activity_type' ||
    key === 'project_budget_type' ||
    key === 'budget_type' ||
    label === 'project budget type'
  ) {
    return 'activityType' as const
  }
  return null
}

function resolveManualAiFieldSuggestion(
  field: SupportingDocumentSuggestedProjectField,
  technologyCompanies: TechnologyCompanyOption[]
): {
  patch: Partial<IctBudgetFormValues>
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
      ? { patch: { category: matched.value as CategoryType } }
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

  if (mapping === 'activityType') {
    const normalized = rawValue.trim().toLowerCase()
    const matched = ACTIVITY_TYPE_OPTIONS.find(
      (option) =>
        option.title.toLowerCase() === normalized ||
        option.title.toLowerCase().includes(normalized) ||
        normalized.includes(option.title.toLowerCase())
    )

    return matched
      ? { patch: { activityType: matched.value as ActivityType } }
      : {
          patch: {},
          error: `Project Budget Type "${rawValue}" does not match any available option.`,
        }
  }

  return { patch: {} }
}

function resolveStrategicSuggestionSelection(
  suggestion: Pick<
    MatchedAiSuggestion,
    'priorityId' | 'classificationId' | 'classificationParentId' | 'strategicPriority' | 'strategicPriorityClassification'
  >,
  strategicPriorities: StrategicPriorityOption[]
) {
  const resolvedPriority =
    (suggestion.priorityId
      ? strategicPriorities.find((option) => option.id === suggestion.priorityId && !option.parentId)
      : undefined) ??
    strategicPriorities.find(
      (option) => !option.parentId && labelsMatch(option.name, suggestion.strategicPriority)
    ) ??
    null

  const resolvedClassification =
    (suggestion.classificationId
      ? strategicPriorities.find((option) => option.id === suggestion.classificationId && Boolean(option.parentId))
      : undefined) ??
    strategicPriorities.find((option) => {
      if (!option.parentId) return false
      if (!labelsMatch(option.name, suggestion.strategicPriorityClassification)) return false
      if (!resolvedPriority) return true
      return option.parentId === resolvedPriority.id
    }) ??
    null

  return {
    priorityId: resolvedPriority?.id ?? null,
    classificationId: resolvedClassification?.id ?? null,
    classificationParentId: resolvedClassification?.parentId ?? resolvedPriority?.id ?? null,
  }
}

function labelsMatch(left: string, right: string) {
  const normalize = (value: string) =>
    value
      .trim()
      .toLowerCase()
      .replace(/&/g, 'and')
      .replace(/[^a-z0-9]+/g, ' ')
      .replace(/\s+/g, ' ')

  const normalizedLeft = normalize(left)
  const normalizedRight = normalize(right)

  return (
    normalizedLeft === normalizedRight ||
    normalizedLeft.includes(normalizedRight) ||
    normalizedRight.includes(normalizedLeft)
  )
}

function ScrollSpySectionRail({
  sections,
  activeSection,
  onNavigate,
}: {
  sections: typeof FORM_SECTIONS
  activeSection: string
  onNavigate: (sectionId: string) => void
}) {
  if (typeof document === 'undefined') return null

  return createPortal(
    <nav aria-label="Form section navigation" className="fixed right-4 top-[50vh] z-[80] hidden -translate-y-1/2 lg:block">
      <div className="relative rounded-2xl border border-[#DDEBFF] bg-white/90 p-1.5 shadow-[0_16px_38px_rgba(15,23,42,0.12)] backdrop-blur-md dark:border-white/10 dark:bg-[#1E293B]/90">
        <div className="pointer-events-none absolute bottom-5 left-1/2 top-5 w-px -translate-x-1/2 bg-[#DDEBFF] dark:bg-white/10" />
        <div className="relative space-y-1.5">
          {sections.map((section) => {
            const Icon = section.icon
            const isActive = activeSection === section.id
            return (
              <button
                key={section.id}
                type="button"
                title={section.label}
                aria-label={`Go to ${section.label}`}
                aria-current={isActive ? 'step' : undefined}
                onClick={() => onNavigate(section.id)}
                className={cn(
                  'group relative flex h-10 w-10 items-center justify-center rounded-xl border transition-all duration-150',
                  isActive
                    ? 'border-[#286CFF] bg-[#286CFF] text-white shadow-[0_10px_24px_rgba(40,108,255,0.28)]'
                    : 'border-[#EAF0F6] bg-white text-[#64748B] hover:border-[#B0DBFF] hover:bg-[#E7F5FF] hover:text-[#286CFF] dark:border-white/10 dark:bg-[#1E293B] dark:text-slate-300 dark:hover:bg-[#286CFF]/15'
                )}
              >
                <Icon className="h-4 w-4" />
                <span
                  className={cn(
                    'pointer-events-none absolute right-full mr-3 min-w-max rounded-lg border border-[#DDEBFF] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#0F172A] opacity-0 shadow-sm transition-all duration-150 group-hover:translate-x-0 group-hover:opacity-100 dark:border-white/10 dark:bg-[#1E293B] dark:text-white',
                    isActive ? 'translate-x-0' : 'translate-x-1'
                  )}
                >
                  {section.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </nav>,
    document.body
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────

function ChangeLogTable({
  logs,
  loading,
  error,
}: {
  logs: AuditLogEntry[]
  loading: boolean
  error: string | null
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#DDEBFF] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#1E293B]">
      <div className="border-b border-[#EAF0F6] bg-[#F8FBFF] px-5 py-4 dark:border-white/10 dark:bg-white/5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E7F5FF] text-[#286CFF] dark:bg-[#286CFF]/15">
            <History className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#0F172A] dark:text-white">Change Logs</h2>
            <p className="text-sm text-[#64748B] dark:text-slate-200">Audit trail of recent updates made to this budget submission.</p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] dark:border-white/10 dark:bg-white/5">
              {['Field Name', 'New Value', 'Old Value', 'Updated By', 'Updated On'].map((header) => (
                <th key={header} className="whitespace-nowrap px-4 py-3 text-start text-xs font-semibold text-[#475569] dark:text-slate-200">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-[#64748B] dark:text-slate-200">
                  Loading audit logs...
                </td>
              </tr>
            )}
            {!loading && error && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-red-600 dark:text-red-300">
                  {error}
                </td>
              </tr>
            )}
            {!loading && !error && logs.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-[#64748B] dark:text-slate-200">
                  No audit logs found for this ICT budget.
                </td>
              </tr>
            )}
            {!loading && !error && logs.map((log) => (
              <tr key={log.id} className="border-b border-[#F1F5F9] transition-colors hover:bg-[#F8FAFC] dark:border-white/5 dark:hover:bg-white/5">
                <td className="px-4 py-3 font-semibold text-[#0F172A] dark:text-white">{log.fieldName}</td>
                <td className="px-4 py-3 text-[#0F172A] dark:text-white">{log.newValue}</td>
                <td className="px-4 py-3 text-[#64748B] dark:text-slate-200">{log.oldValue}</td>
                <td className="px-4 py-3 text-[#286CFF]">{log.updatedBy}</td>
                <td className="whitespace-nowrap px-4 py-3 text-[#64748B] dark:text-slate-200">{log.updatedOn}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function BudgetOverviewCard({
  record,
  loading,
  error,
}: {
  record: StoredBudgetOverviewRecord | null
  loading: boolean
  error: string | null
}) {
  const data = record?.parsedData ?? null

  const assessment = data?.overall_assessment
  const scores = data?.score_inputs
  const technicalScore = data?.strategic_alignment?.recommended_options?.[0]?.relevance_score ?? null
  const strengths = (assessment?.primary_strengths ?? []).map((item) => toDisplayText(item)).filter(Boolean)
  const risks = (assessment?.primary_risks ?? []).map((item) => toDisplayText(item)).filter(Boolean)
  const executiveSummary = toDisplayText(assessment?.executive_summary)
  const readinessStatus = toDisplayText(assessment?.readiness_status)

  const pf = scores?.project_fields
  const pfTotal = (pf?.evaluated_count ?? 0)
  const pfMatched = (pf?.match_count ?? 0) + (pf?.close_match_count ?? 0)
  const pfPercentage = pfTotal > 0 ? Math.min(100, Math.round((pfMatched / pfTotal) * 100)) : 0
  const ba = scores?.budget_account
  const baLabel = !ba
    ? null
    : (ba.account_code_match_count ?? 0) >= (ba.line_item_count ?? 1) && (ba.amount_match_count ?? 0) >= (ba.line_item_count ?? 1)
      ? 'Full'
      : (ba.account_code_match_count ?? 0) > 0 || (ba.amount_match_count ?? 0) > 0
        ? 'Partial'
        : 'Missing'

  function readinessAccent(status?: string) {
    if (!status) return { dot: 'bg-[#94A3B8]', badge: 'border-[#E2E8F0] bg-[#F8FAFC] text-[#64748B] dark:border-white/10 dark:bg-white/5 dark:text-slate-300' }
    const lower = status.toLowerCase()
    if (lower.includes('ready') && !lower.includes('condition') && !lower.includes('not')) {
      return { dot: 'bg-[#10B981]', badge: 'border-[#A7F3D0] bg-[#ECFDF5] text-[#065F46] dark:border-emerald-500/30 dark:bg-emerald-900/20 dark:text-emerald-300' }
    }
    if (lower.includes('condition') || lower.includes('partial')) {
      return { dot: 'bg-[#F59E0B]', badge: 'border-[#FDE68A] bg-[#FFFBEB] text-[#92400E] dark:border-amber-500/30 dark:bg-amber-900/20 dark:text-amber-300' }
    }
    return { dot: 'bg-[#EF4444]', badge: 'border-[#FECACA] bg-[#FEF2F2] text-[#991B1B] dark:border-red-500/30 dark:bg-red-900/20 dark:text-red-300' }
  }

  const readiness = readinessAccent(readinessStatus)

  return (
    <div className="rounded-2xl border border-[#E9D5FF] bg-gradient-to-b from-[#FDF7FF] to-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)] dark:border-white/10 dark:from-[#2A123D] dark:to-[#1E293B]">
      <div className="mb-4 flex items-start gap-3">
        <div className="mt-0.5 shrink-0 text-[#A855F7] dark:text-[#E9D5FF]">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold text-[#A855F7] dark:text-[#E9D5FF]">Budget Overview</p>
          <p className="text-xs text-[#64748B] dark:text-slate-300">AI-generated budget readiness assessment</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 rounded-xl border border-dashed border-[#E9D5FF] bg-[#FDF8FF] px-3 py-4 text-sm text-[#A855F7] dark:border-white/10 dark:bg-white/5 dark:text-[#E9D5FF]">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading budget overview...
        </div>
      ) : error ? (
        <div className="rounded-xl border border-[#F5C2C7] bg-[#FFF1F3] px-3 py-3 text-sm text-[#B42318] dark:border-[#B42318]/30 dark:bg-[#3B1118] dark:text-[#FCA5A5]">
          {error}
        </div>
      ) : !record || !data ? (
        <EmptyAiActionCard
          description="Budget overview will appear here once an AI readiness assessment has been generated for this budget."
          icon={Sparkles}
        />
      ) : (
        <div className="space-y-3">
          {readinessStatus && (
            <div className="rounded-xl border border-[#A855F726] bg-[#FDF8FF] px-3 py-3 dark:border-white/10 dark:bg-white/5">
              <p className="mb-2 text-[11px] font-semibold text-[#64748B] dark:text-slate-300">Readiness Status</p>
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 shrink-0 rounded-full ${readiness.dot}`} />
                <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${readiness.badge}`}>
                  {readinessStatus}
                </span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            {typeof scores?.document_evidence?.evidence_score === 'number' && (
              <div className="rounded-xl border border-[#F0D9FF] bg-white px-3 py-2.5 dark:border-white/10 dark:bg-white/5">
                <p className="text-[11px] font-semibold text-[#A855F7] dark:text-[#E9D5FF]">Doc Evidence</p>
                <p className="mt-1 text-lg font-bold text-[#0F172A] dark:text-white">{scores.document_evidence.evidence_score}%</p>
              </div>
            )}
            {pfTotal > 0 && (
              <div className="rounded-xl border border-[#F0D9FF] bg-white px-3 py-2.5 dark:border-white/10 dark:bg-white/5">
                <p className="text-[11px] font-semibold text-[#A855F7] dark:text-[#E9D5FF]">Project Fields</p>
                <p className="mt-1 text-lg font-bold text-[#0F172A] dark:text-white">{pfPercentage}%</p>
              </div>
            )}
            {baLabel && (
              <div className="rounded-xl border border-[#F0D9FF] bg-white px-3 py-2.5 dark:border-white/10 dark:bg-white/5">
                <p className="text-[11px] font-semibold text-[#A855F7] dark:text-[#E9D5FF]">Budget Account</p>
                <p className="mt-1 text-sm font-bold text-[#0F172A] dark:text-white">{baLabel}</p>
              </div>
            )}
            {scores?.strategic_alignment?.match_type && (
              <div className="rounded-xl border border-[#F0D9FF] bg-white px-3 py-2.5 dark:border-white/10 dark:bg-white/5">
                <p className="text-[11px] font-semibold text-[#A855F7] dark:text-[#E9D5FF]">Strategic Fit</p>
                <p className="mt-1 text-sm font-bold text-[#0F172A] dark:text-white">{scores.strategic_alignment.match_type}</p>
              </div>
            )}
          </div>

          {technicalScore !== null && (
            <div className="rounded-xl border border-[#A855F726] bg-[#FDF8FF] px-3 py-3 dark:border-white/10 dark:bg-white/5">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[11px] font-semibold text-[#64748B] dark:text-slate-300">Technical Score</p>
                <span className="text-sm font-bold text-[#A855F7] dark:text-[#E9D5FF]">{technicalScore}</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#E9D5FF] dark:bg-white/10">
                <div
                  className="h-full rounded-full bg-[#A855F7] transition-all"
                  style={{ width: `${Math.min(100, technicalScore)}%` }}
                />
              </div>
            </div>
          )}

          {executiveSummary && (
            <div className="rounded-xl border border-[#A855F726] bg-[#FDF8FF] px-3 py-3 dark:border-white/10 dark:bg-white/5">
              <p className="mb-1.5 text-[11px] font-semibold text-[#64748B] dark:text-slate-300">Executive Summary</p>
              <p className="text-xs leading-5 text-[#475569] dark:text-slate-200">{executiveSummary}</p>
            </div>
          )}

          {(strengths.length > 0 || risks.length > 0) && (
            <div className="grid grid-cols-2 gap-2">
              {strengths.length > 0 && (
                <div className="rounded-xl border border-[#A7F3D0] bg-[#ECFDF5] px-3 py-3 dark:border-emerald-500/20 dark:bg-emerald-900/10">
                  <p className="mb-1.5 text-[11px] font-semibold text-[#065F46] dark:text-emerald-300">Strengths</p>
                  <ul className="space-y-1">
                    {strengths.slice(0, 3).map((s, i) => (
                      <li key={i} className="text-[11px] leading-4 text-[#047857] dark:text-emerald-200">· {s}</li>
                    ))}
                  </ul>
                </div>
              )}
              {risks.length > 0 && (
                <div className="rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-3 py-3 dark:border-red-500/20 dark:bg-red-900/10">
                  <p className="mb-1.5 text-[11px] font-semibold text-[#991B1B] dark:text-red-300">Risks</p>
                  <ul className="space-y-1">
                    {risks.slice(0, 3).map((r, i) => (
                      <li key={i} className="text-[11px] leading-4 text-[#DC2626] dark:text-red-200">· {r}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {record.modifiedOn && (
            <p className="text-[11px] text-[#94A3B8] dark:text-slate-500">
              Last updated {new Date(record.modifiedOn).toLocaleDateString('en-AE', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function InteractiveBudgetOverviewCard({
  record,
  loading,
  error,
  currentRole,
  confidenceScore,
  isRefreshing,
  policyLoading,
  policyError,
  policyResult,
  policyMatchGroups,
  fileInsightItems,
}: {
  record: StoredBudgetOverviewRecord | null
  loading: boolean
  error: string | null
  currentRole: 'Respondent' | 'Reviewer' | 'Approver'
  confidenceScore: number
  isRefreshing: boolean
  policyLoading: boolean
  policyError: string | null
  policyResult: IctBudgetConsiderationsEvaluationResult | null
  policyMatchGroups: PolicyMatchGroup[]
  fileInsightItems: SupportingDocumentAiInsightItem[]
}) {
  const [expanded, setExpanded] = useState(false)
  const [expandedPolicyTextSections, setExpandedPolicyTextSections] = useState<Record<string, boolean>>({})
  const data = record?.parsedData ?? null
  const assessment = data?.overall_assessment
  const scores = data?.score_inputs
  const strengths = (assessment?.primary_strengths ?? []).map((item) => toDisplayText(item)).filter(Boolean)
  const risks = (assessment?.primary_risks ?? []).map((item) => toDisplayText(item)).filter(Boolean)
  const issues = data?.issues ?? []
  const nextActions = data?.recommended_next_actions ?? []
  const reviewFlags = data?.ai_review_flags
  const readinessStatus = toDisplayText(assessment?.readiness_status)
  const policyOverallSummary = toDisplayText(policyResult?.overallAssessment.summary)

  const roleSummary =
    currentRole === 'Reviewer'
      ? toDisplayText(data?.role_views?.reviewer?.summary)
      : currentRole === 'Approver'
        ? toDisplayText(data?.role_views?.approver?.executive_summary)
        : toDisplayText(data?.role_views?.respondent?.summary)

  const roleBullets =
    currentRole === 'Respondent'
      ? [
          ...(data?.role_views?.respondent?.must_fix ?? []).map((item) => item.message).filter(Boolean),
          ...(data?.role_views?.respondent?.should_review ?? []).map((item) => item.message).filter(Boolean),
        ]
      : currentRole === 'Reviewer'
        ? [
            ...(data?.role_views?.reviewer?.review_focus ?? []).map((item) => item.message).filter(Boolean),
            ...(data?.role_views?.reviewer?.questions_for_respondent ?? []).map((item) => item.message).filter(Boolean),
          ]
        : [
            ...(data?.role_views?.approver?.approval_conditions ?? []).map((item) => item.message).filter(Boolean),
            ...(data?.role_views?.approver?.material_risks ?? []).map((item) => item.message).filter(Boolean),
          ]
  const normalizedRoleBullets = roleBullets.map((item) => toDisplayText(item)).filter(Boolean)

  const pf = scores?.project_fields
  const pfTotal = pf?.evaluated_count ?? 0
  const pfMatched = (pf?.match_count ?? 0) + (pf?.close_match_count ?? 0)
  const pfPercentage = pfTotal > 0 ? Math.min(100, Math.round((pfMatched / pfTotal) * 100)) : 0
  const ba = scores?.budget_account
  const baLabel = !ba
    ? null
    : (ba.account_code_match_count ?? 0) >= (ba.line_item_count ?? 1) && (ba.amount_match_count ?? 0) >= (ba.line_item_count ?? 1)
      ? 'Full'
      : (ba.account_code_match_count ?? 0) > 0 || (ba.amount_match_count ?? 0) > 0
        ? 'Partial'
        : 'Missing'

  function readinessAccent(status?: string) {
    if (!status) return { dot: 'bg-[#94A3B8]', badge: 'border-[#E2E8F0] bg-[#F8FAFC] text-[#64748B] dark:border-white/10 dark:bg-white/5 dark:text-slate-300' }
    const lower = status.toLowerCase()
    if (lower.includes('ready') && !lower.includes('condition') && !lower.includes('not')) {
      return { dot: 'bg-[#10B981]', badge: 'border-[#A7F3D0] bg-[#ECFDF5] text-[#065F46] dark:border-emerald-500/30 dark:bg-emerald-900/20 dark:text-emerald-300' }
    }
    if (lower.includes('condition') || lower.includes('partial')) {
      return { dot: 'bg-[#F59E0B]', badge: 'border-[#FDE68A] bg-[#FFFBEB] text-[#92400E] dark:border-amber-500/30 dark:bg-amber-900/20 dark:text-amber-300' }
    }
    return { dot: 'bg-[#EF4444]', badge: 'border-[#FECACA] bg-[#FEF2F2] text-[#991B1B] dark:border-red-500/30 dark:bg-red-900/20 dark:text-red-300' }
  }

  const readiness = readinessAccent(readinessStatus)
  const confidenceTone =
    confidenceScore >= 80 ? 'green' : confidenceScore >= 60 ? 'amber' : 'red'
  const hasPolicyMatch = policyResult?.overallAssessment.hasPolicyMatch ?? false
  const hasExpandablePolicyContent = policyLoading || Boolean(policyError) || Boolean(policyResult)
  const canExpand = Boolean(data) || hasExpandablePolicyContent
  const policyConflictCount =
    policyMatchGroups.find((group) => group.matchType === 'Potential Conflict')?.items.length ?? 0
  const policyCoordinationCount =
    policyMatchGroups.find((group) => group.matchType === 'Coordination Required')?.items.length ?? 0
  const policyConditionalCount =
    policyMatchGroups.find((group) => group.matchType === 'Allowed With Conditions')?.items.length ?? 0
  const fileEvidenceItems = fileInsightItems
    .map((item) => ({
      id: item.id,
      name: item.file.name,
      score: item.parsedSummary?.evidence_assessment?.evidence_score ?? null,
      quality: item.parsedSummary?.evidence_assessment?.evidence_quality ?? null,
      status: item.status,
    }))
    .filter((item) => item.name.trim())

  const activeAiFlags = [
    reviewFlags?.evidence_risk?.flag
      ? {
          key: 'evidence_risk',
          label: reviewFlags.evidence_risk.label || 'Evidence Risk',
          severity: reviewFlags.evidence_risk.severity || 'Medium',
          reason: reviewFlags.evidence_risk.reason || '',
        }
      : null,
    reviewFlags?.dge_budget_consideration_risk?.flag
      ? {
          key: 'dge_budget_consideration_risk',
          label: reviewFlags.dge_budget_consideration_risk.label || 'DGE Budget Consideration Risk',
          severity: reviewFlags.dge_budget_consideration_risk.severity || 'High',
          reason: reviewFlags.dge_budget_consideration_risk.reason || '',
        }
      : null,
    reviewFlags?.strategic_alignment_risk?.flag
      ? {
          key: 'strategic_alignment_risk',
          label: reviewFlags.strategic_alignment_risk.label || 'Strategic Alignment Risk',
          severity: reviewFlags.strategic_alignment_risk.severity || 'Medium',
          reason: reviewFlags.strategic_alignment_risk.reason || '',
        }
      : null,
    reviewFlags?.budget_accuracy_risk?.flag
      ? {
          key: 'budget_accuracy_risk',
          label: reviewFlags.budget_accuracy_risk.label || 'Budget Accuracy Risk',
          severity: reviewFlags.budget_accuracy_risk.severity || 'High',
          reason: reviewFlags.budget_accuracy_risk.reason || '',
        }
      : null,
    reviewFlags?.clarification_required?.flag
      ? {
          key: 'clarification_required',
          label: 'May Required Clarification',
          severity: reviewFlags.clarification_required.severity || 'High',
          reason: reviewFlags.clarification_required.reason || '',
        }
      : null,
  ]
    .filter((flag): flag is { key: string; label: string; severity: string; reason: string } => Boolean(flag))
    .filter((flag) => flag.severity.trim().toLowerCase() !== 'low')

  function aiFlagTone(severity?: string) {
    const normalized = severity?.toLowerCase()
    if (normalized === 'high') {
      return 'border-[#F5C2C7] bg-[#FFF1F3] text-[#B42318] dark:border-[#B42318]/30 dark:bg-[#3B1118] dark:text-[#FCA5A5]'
    }
    if (normalized === 'medium') {
      return 'border-[#E2E8F0] bg-white text-[#92400E] dark:border-white/10 dark:bg-white/5 dark:text-[#F6D28A]'
    }
    return 'border-[#E2E8F0] bg-white text-[#475569] dark:border-white/10 dark:bg-white/5 dark:text-[#CBD5E1]'
  }

  const togglePolicyTextSection = (sectionKey: string) => {
    setExpandedPolicyTextSections((current) => ({
      ...current,
      [sectionKey]: !current[sectionKey],
    }))
  }

  const renderPolicyCards = () => <BudgetConsiderationCompactCards groups={policyMatchGroups} />

  function fileEvidenceTone(score: number | null, status: SupportingDocumentAiInsightItem['status']) {
    if (status === 'analyzing' || status === 'queued') {
      return {
        card: 'border-[#E9D5FF] bg-[#FDF7FF] dark:border-white/10 dark:bg-white/5',
        score: 'text-[#A855F7] dark:text-[#E9D5FF]',
      }
    }
    if (status === 'error') {
      return {
        card: 'border-[#E9D5FF] bg-[#FDF7FF] dark:border-white/10 dark:bg-white/5',
        score: 'text-[#B42318] dark:text-[#FCA5A5]',
      }
    }
    if ((score ?? 0) >= 80) {
      return {
        card: 'border-[#E9D5FF] bg-[#FDF7FF] dark:border-white/10 dark:bg-white/5',
        score: 'text-[#16794B] dark:text-[#86EFAC]',
      }
    }
    if ((score ?? 0) >= 60) {
      return {
        card: 'border-[#E9D5FF] bg-[#FDF7FF] dark:border-white/10 dark:bg-white/5',
        score: 'text-[#286CFF] dark:text-[#AFC9FF]',
      }
    }
    return {
      card: 'border-[#E9D5FF] bg-[#FDF7FF] dark:border-white/10 dark:bg-white/5',
      score: 'text-[#B7791F] dark:text-[#F6D28A]',
    }
  }

  const overviewMetricCards = (
    <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-5">
      {typeof scores?.document_evidence?.evidence_score === 'number' && (
        <div className="rounded-xl border border-[#F0D9FF] bg-white px-3 py-3 dark:border-white/10 dark:bg-white/5">
          <p className="text-[11px] font-semibold text-[#0F172A] dark:text-white">Document Evidence</p>
          <p className="mt-2 text-lg font-bold text-[#0F172A] dark:text-white">{scores.document_evidence.evidence_score}%</p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#F3E8FF] dark:bg-white/10">
            <div
              className="h-full rounded-full bg-[#A855F7]"
              style={{ width: `${Math.min(100, scores.document_evidence.evidence_score)}%` }}
            />
          </div>
        </div>
      )}
      {pfTotal > 0 && (
        <div className="rounded-xl border border-[#F0D9FF] bg-white px-3 py-3 dark:border-white/10 dark:bg-white/5">
          <p className="text-[11px] font-semibold text-[#0F172A] dark:text-white">Project Fields</p>
          <p className="mt-2 text-lg font-bold text-[#0F172A] dark:text-white">{pfPercentage}%</p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#F3E8FF] dark:bg-white/10">
            <div className="h-full rounded-full bg-[#A855F7]" style={{ width: `${pfPercentage}%` }} />
          </div>
        </div>
      )}
      <div className="rounded-xl border border-[#F0D9FF] bg-white px-3 py-3 dark:border-white/10 dark:bg-white/5">
        <p className="text-[11px] font-semibold text-[#0F172A] dark:text-white">AI Confidence</p>
        <p className="mt-2 text-lg font-bold text-[#0F172A] dark:text-white">{confidenceScore}%</p>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#F3E8FF] dark:bg-white/10">
          <div className="h-full rounded-full bg-[#A855F7]" style={{ width: `${Math.min(100, confidenceScore)}%` }} />
        </div>
      </div>
      {baLabel && (
        <div className="rounded-xl border border-[#F0D9FF] bg-white px-3 py-3 dark:border-white/10 dark:bg-white/5">
          <p className="text-[11px] font-semibold text-[#0F172A] dark:text-white">Budget Account</p>
          <p className="mt-2 text-lg font-bold text-[#0F172A] dark:text-white">{baLabel}</p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#F3E8FF] dark:bg-white/10">
            <div
              className="h-full rounded-full bg-[#A855F7]"
              style={{ width: `${baLabel === 'Full' ? 100 : baLabel === 'Partial' ? 60 : 20}%` }}
            />
          </div>
        </div>
      )}
      {scores?.strategic_alignment?.match_type && (
        <div className="rounded-xl border border-[#F0D9FF] bg-white px-3 py-3 dark:border-white/10 dark:bg-white/5">
          <p className="text-[11px] font-semibold text-[#0F172A] dark:text-white">Strategic Fit</p>
          <p className="mt-2 text-lg font-bold text-[#0F172A] dark:text-white">{scores.strategic_alignment.match_type}</p>
        </div>
      )}
    </div>
  )

  const collapsedPolicySummary = (
    <div className="mt-4 rounded-2xl border border-[#E9D5FF] bg-[#FDF8FF] px-4 py-4 dark:border-white/10 dark:bg-white/5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <Sparkles className="h-5 w-5 shrink-0 text-[#A855F7] dark:text-[#E9D5FF]" />
            <p className="text-base font-semibold text-[#0F172A] dark:text-white">AI Budget Consideration</p>
          </div>
          <p className="mt-2 text-sm leading-6 text-[#64748B] dark:text-slate-300">
            {policyLoading
              ? 'Refreshing policy alignment for this budget.'
              : policyError
                ? 'Policy results are temporarily unavailable.'
                : hasPolicyMatch
                  ? 'Policy counts are shown here. Expand to review the matched policies.'
                  : policyOverallSummary || 'No policy result available yet.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {policyLoading ? (
            <span className="inline-flex items-center gap-2 rounded-full border border-[#E9D5FF] bg-[#FDF7FF] px-3 py-1 text-xs font-semibold text-[#A855F7] dark:border-white/10 dark:bg-white/5 dark:text-[#E9D5FF]">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Evaluating
            </span>
          ) : policyError ? (
            <span className="rounded-full border border-[#F5C2C7] bg-[#FFF1F3] px-3 py-1 text-xs font-semibold text-[#B42318] dark:border-[#B42318]/30 dark:bg-[#3B1118] dark:text-[#FCA5A5]">
              Unavailable
            </span>
          ) : hasPolicyMatch ? (
            <>
              {policyConflictCount > 0 && (
                <span className="rounded-full border border-[#FECACA] bg-[#FEF2F2] px-3 py-1 text-xs font-semibold text-[#DC2626] dark:border-[#DC2626]/30 dark:bg-[#DC2626]/12 dark:text-[#FCA5A5]">
                  Potential Conflict ({policyConflictCount})
                </span>
              )}
              {policyCoordinationCount > 0 && (
                <span className="rounded-full border border-[#FDE68A] bg-[#FFF8E8] px-3 py-1 text-xs font-semibold text-[#B45309] dark:border-[#B45309]/30 dark:bg-[#3A2810] dark:text-[#F6D28A]">
                  Coordination Required ({policyCoordinationCount})
                </span>
              )}
              {policyConditionalCount > 0 && (
                <span className="rounded-full border border-[#BBF7D0] bg-[#EEF9F1] px-3 py-1 text-xs font-semibold text-[#16A34A] dark:border-[#16A34A]/30 dark:bg-[#123123] dark:text-[#86EFAC]">
                  Allowed Conditions ({policyConditionalCount})
                </span>
              )}
            </>
          ) : (
            <span className="rounded-full border border-[#BBF7D0] bg-[#ECFDF3] px-3 py-1 text-xs font-semibold text-[#027A48] dark:border-[#027A48]/30 dark:bg-[#027A48]/12 dark:text-[#A6F4C5]">
              Cleared by AI
            </span>
          )}
        </div>
      </div>
    </div>
  )

  const fileEvidenceSummary = fileEvidenceItems.length > 0 ? (
    <div className="mt-4 rounded-2xl border border-[#E9D5FF] bg-[#FDF8FF] px-4 py-4 dark:border-white/10 dark:bg-white/5">
      <div className="mb-3 flex items-center gap-2.5">
        <FileText className="h-5 w-5 shrink-0 text-[#A855F7] dark:text-[#E9D5FF]" />
        <p className="text-base font-semibold text-[#0F172A] dark:text-white">File Evidence Scores</p>
      </div>
      <div className="grid gap-2 md:grid-cols-2">
        {fileEvidenceItems.map((item) => (
          <div
            key={item.id}
            className={cn(
              'rounded-xl border px-3 py-3 transition-colors',
              fileEvidenceTone(item.score, item.status).card
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{item.name}</p>
                <p className="mt-1 text-[11px] opacity-80">
                  {item.status === 'complete'
                    ? item.quality ?? 'Evidence scored'
                    : item.status === 'error'
                      ? 'Analysis unavailable'
                      : 'Analysis in progress'}
                </p>
              </div>
              <span className={cn('shrink-0 text-base font-bold', fileEvidenceTone(item.score, item.status).score)}>
                {item.status === 'complete' && typeof item.score === 'number'
                  ? `${item.score}`
                  : item.status === 'error'
                    ? 'Err'
                    : '...'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  ) : null

  const expandedPolicySection = (
    <div className="space-y-4">
      <div className="mt-4 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-[#A855F7] dark:text-[#E9D5FF]" />
        <p className="text-base font-semibold text-[#0F172A] dark:text-white">AI Budget Consideration</p>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between" style={{ marginTop: 0 }}>
        <div className="min-w-0">
          <p className="text-sm leading-6 text-[#64748B] dark:text-slate-300">
            {policyLoading
              ? 'Refreshing policy alignment for this budget.'
              : policyError
                ? 'Policy results are temporarily unavailable.'
                : hasPolicyMatch
                  ? 'Matched policy guidance is shown below for review.'
                  : policyOverallSummary || 'No policy result available yet.'}
          </p>
        </div>

        {!policyLoading && !policyError ? (
          <div className="flex flex-wrap gap-2">
            {hasPolicyMatch ? (
              <>
                {policyConflictCount > 0 && (
                  <span className="rounded-full border border-[#FECACA] bg-[#FEF2F2] px-3 py-1 text-xs font-semibold text-[#DC2626] dark:border-[#DC2626]/30 dark:bg-[#DC2626]/12 dark:text-[#FCA5A5]">
                    Potential Conflict ({policyConflictCount})
                  </span>
                )}
                {policyCoordinationCount > 0 && (
                  <span className="rounded-full border border-[#FDE68A] bg-[#FFF8E8] px-3 py-1 text-xs font-semibold text-[#B45309] dark:border-[#B45309]/30 dark:bg-[#3A2810] dark:text-[#F6D28A]">
                    Coordination Required ({policyCoordinationCount})
                  </span>
                )}
                {policyConditionalCount > 0 && (
                  <span className="rounded-full border border-[#BBF7D0] bg-[#EEF9F1] px-3 py-1 text-xs font-semibold text-[#16A34A] dark:border-[#16A34A]/30 dark:bg-[#123123] dark:text-[#86EFAC]">
                    Allowed Conditions ({policyConditionalCount})
                  </span>
                )}
              </>
            ) : policyResult ? (
              <span className="rounded-full border border-[#BBF7D0] bg-[#ECFDF3] px-3 py-1 text-xs font-semibold text-[#027A48] dark:border-[#027A48]/30 dark:bg-[#027A48]/12 dark:text-[#A6F4C5]">
                Cleared by AI
              </span>
            ) : null}
          </div>
        ) : null}
      </div>

      {policyLoading ? (
        <div className="w-full rounded-2xl border border-[#E9D5FF] bg-[#FDF7FF] px-4 py-4 text-sm text-[#A855F7] dark:border-white/10 dark:bg-white/5 dark:text-[#E9D5FF]">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-current" />
            Evaluating ICT Budget Considerations policies...
          </div>
        </div>
      ) : policyError ? (
        <div className="rounded-2xl border border-[#FFD4D1] bg-[#FFF5F5] px-4 py-4 text-sm text-[#B42318] dark:border-[#EA4F49]/40 dark:bg-[#EA4F49]/10">
          {policyError}
        </div>
      ) : hasPolicyMatch ? (
        renderPolicyCards()
      ) : policyResult ? (
        <div className="rounded-xl border border-[#DCE8F6] bg-white px-4 py-4 shadow-[0_10px_25px_rgba(15,23,42,0.04)] dark:border-white/10 dark:bg-white/5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#E8F8F3] text-[#0F9D7A] dark:bg-[#0F9D7A]/15 dark:text-[#9CE7D4]">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <div>
              <p className="font-semibold text-[#0F172A] dark:text-white">No policy conflict detected</p>
              <p className="mt-1 text-sm leading-6 text-[#64748B] dark:text-slate-100">
                {policyOverallSummary}
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )

  return (
    <div className="relative overflow-visible rounded-[28px] border border-[#E9D5FF] bg-white dark:border-white/10 dark:bg-[#1E293B]">
      <button
        type="button"
        onClick={() => canExpand && setExpanded((value) => !value)}
        className="relative block w-full rounded-[28px] bg-gradient-to-b from-[#FDF7FF] to-white px-8 py-5 text-left transition-colors hover:bg-white/30 dark:from-[#2A123D] dark:to-[#1E293B] dark:hover:bg-white/5"
      >
        <div className="flex items-start gap-3 pr-14">
          <div className="mt-1 shrink-0 text-[#A855F7]">
            <Sparkles className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-bold text-[#0F172A] dark:text-white">
              Budget Overview
            </h2>
            {data && roleSummary ? (
              <p className="mt-1 text-sm text-[#475569] dark:text-slate-100">
                {roleSummary}
              </p>
            ) : null}
            {data && (activeAiFlags.length > 0 || isRefreshing) ? (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {activeAiFlags.map((flag) => (
                  <span key={flag.key} className="group relative inline-flex">
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold',
                        aiFlagTone(flag.severity)
                      )}
                    >
                      {flag.label} ({flag.severity})
                    </span>
                    {flag.reason ? (
                      <span className="pointer-events-none absolute left-1/2 top-full z-30 mt-2 w-72 -translate-x-1/2 rounded-2xl border border-[#E2E8F0] bg-white px-3 py-2 text-xs leading-5 text-[#475569] opacity-0 shadow-[0_18px_45px_rgba(15,23,42,0.12)] transition-all duration-200 group-hover:translate-y-1 group-hover:opacity-100 dark:border-white/10 dark:bg-[#10203A]/95 dark:text-slate-100">
                        {toDisplayText(flag.reason)}
                      </span>
                    ) : null}
                  </span>
                ))}
                {isRefreshing && (
                  <span className="inline-flex items-center gap-2 rounded-full border border-[#E9D5FF] bg-[#FDF7FF] px-2.5 py-1 text-xs font-semibold text-[#A855F7] dark:border-white/10 dark:bg-white/5 dark:text-[#E9D5FF]">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Refreshing
                  </span>
                )}
              </div>
            ) : null}
            {!expanded && data ? overviewMetricCards : null}
            {!data ? (
              <div className="mt-4 w-full">
                <EmptyAiActionCard
                  description="Budget overview will appear here once an AI readiness assessment has been generated for this budget."
                  icon={Sparkles}
                />
              </div>
            ) : null}
            {!expanded ? collapsedPolicySummary : null}
          </div>
        </div>
        <div className="absolute right-8 top-5 flex flex-col items-end gap-2">
          {record?.modifiedOn && (
            <span className="text-[11px] text-[#94A3B8] dark:text-slate-500">
              Updated {new Date(record.modifiedOn).toLocaleString('en-AE', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              })}
            </span>
          )}
          {canExpand ? (
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#E9D5FF] bg-white text-[#A855F7] shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-[#E9D5FF]">
              <ChevronDown
                className={cn(
                  'h-5 w-5 shrink-0 transition-transform',
                  expanded && 'rotate-180'
                )}
              />
            </span>
          ) : null}
        </div>
      </button>

      {loading ? (
        <div className="mx-16 mb-5 flex items-center gap-2 rounded-2xl border border-dashed border-[#E9D5FF] bg-[#FDF8FF] px-4 py-4 text-sm text-[#A855F7] dark:border-white/10 dark:bg-white/5 dark:text-[#E9D5FF]">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading budget overview...
        </div>
      ) : error ? (
        <div className="mx-16 mb-5 rounded-2xl border border-[#F5C2C7] bg-[#FFF1F3] px-4 py-4 text-sm text-[#B42318] dark:border-[#B42318]/30 dark:bg-[#3B1118] dark:text-[#FCA5A5]">
          {error}
        </div>
      ) : !record || !data ? (
        <>
          {canExpand ? (
            <div className={cn('grid transition-all duration-300 ease-out', expanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0')}>
              <div className="overflow-hidden">
                <div className="space-y-5 px-24 pb-5">
                  {expandedPolicySection}
                </div>
              </div>
            </div>
          ) : null}
        </>
      ) : (
        <div className={cn('grid transition-all duration-300 ease-out', expanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0')}>
          <div className="overflow-hidden">
            <div className="space-y-5 px-24 pb-5">
              {(roleSummary || roleBullets.length > 0) && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-[#A855F7] dark:text-[#E9D5FF]" />
                    <p className="text-base font-semibold text-[#0F172A] dark:text-white">
                      {currentRole} View
                    </p>
                  </div>
                  <div className="rounded-2xl border border-[#EAF0F6] bg-white px-4 py-4 dark:border-white/10 dark:bg-white/5">
                    {normalizedRoleBullets.length > 0 && (
                      <ul className="space-y-2">
                        {normalizedRoleBullets.slice(0, 6).map((message, index) => (
                          <li key={`${currentRole}-view-${index}`} className="flex items-start gap-2 text-sm leading-6 text-[#475569] dark:text-slate-200">
                            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#A855F7] dark:bg-[#E9D5FF]" />
                            <span>{message}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}

              {overviewMetricCards}

              {expandedPolicySection}

              {(strengths.length > 0 || risks.length > 0) && (
                <div className="grid gap-3 lg:grid-cols-2">
                  {strengths.length > 0 && (
                    <div className="rounded-2xl border border-[#DCFCE7] bg-[#F6FEF9] px-4 py-4 dark:border-emerald-500/20 dark:bg-emerald-900/10">
                      <p className="mb-2 text-sm font-semibold text-[#166534] dark:text-emerald-300">Strengths</p>
                      <ul className="space-y-2">
                        {strengths.slice(0, 4).map((strength, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm leading-5 text-[#166534] dark:text-emerald-200">
                            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#16A34A] dark:bg-emerald-300" />
                            <span>{strength}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {risks.length > 0 && (
                    <div className="rounded-2xl border border-[#FCE7F3] bg-[#FFF7FB] px-4 py-4 dark:border-pink-500/20 dark:bg-pink-900/10">
                      <p className="mb-2 text-sm font-semibold text-[#9D174D] dark:text-pink-300">Risks</p>
                      <ul className="space-y-2">
                        {risks.slice(0, 4).map((risk, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm leading-5 text-[#9D174D] dark:text-pink-200">
                            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#DB2777] dark:bg-pink-300" />
                            <span>{risk}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {(issues.length > 0 || nextActions.length > 0) && (
                <div className="grid gap-3 lg:grid-cols-2">
                  {issues.length > 0 && (
                    <div className="rounded-2xl border border-[#E2E8F0] bg-[#F8FBFF] px-4 py-4 dark:border-white/10 dark:bg-white/5">
                      <p className="mb-2 text-sm font-semibold text-[#0F172A] dark:text-white">Key Issues</p>
                      <ul className="space-y-2">
                        {issues.slice(0, 4).map((issue) => (
                          <li key={issue.issue_id ?? issue.title} className="flex items-start gap-2 text-sm leading-6 text-[#334155] dark:text-slate-100">
                            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#0F172A] dark:bg-white" />
                            <span>{toDisplayText(issue.title)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {nextActions.length > 0 && (
                    <div className="rounded-2xl border border-[#E2E8F0] bg-[#F8FBFF] px-4 py-4 dark:border-white/10 dark:bg-white/5">
                      <p className="mb-2 text-sm font-semibold text-[#0F172A] dark:text-white">Recommended Next Actions</p>
                      <ul className="space-y-2">
                        {nextActions.slice(0, 4).map((action) => (
                          <li key={`${action.priority ?? 'p'}-${action.action ?? 'action'}`} className="flex items-start gap-2 text-sm leading-6 text-[#334155] dark:text-slate-100">
                            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#0F172A] dark:bg-white" />
                            <span>{toDisplayText(action.action)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const { pathname } = location
  const navigate = useNavigate()
  const { instanceId } = useInstance()
  const { runActionToast, showErrorToast, showSuccessToast } = useToast()

  const emptyProject: Project = useMemo(
    () => ({
      id: id ?? 'UNKNOWN-BUDGET',
      ictBudgetId: undefined,
      name: 'Loading project...',
      strategicPriority: '-',
      classification: '-',
      category: '-',
      requestedBudget: 0,
      budgetItems: [],
      status: 'Draft',
      approvalStatus: 'Draft',
      pendingWith: null,
      submittedBy: '-',
      submittedDate: '-',
      lastModified: '-',
      plannedStartDate: '',
      plannedEndDate: '',
      workStream: '-',
      budgetType: '-',
      technology: { company: '-', product: '' },
      summary: '',
      documents: [],
      clarifications: [],
      aiScore: 0,
      riskLevel: null,
      capex: 0,
      opex: 0,
    }),
    [id]
  )
  const [projectData, setProjectData] = useState<Project | null>(null)
  const [projectLoading, setProjectLoading] = useState(true)
  const [projectError, setProjectError] = useState<string | null>(null)
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([])
  const [auditLogsLoading, setAuditLogsLoading] = useState(false)
  const [auditLogsError, setAuditLogsError] = useState<string | null>(null)
  const project = projectData ?? projects.find((p) => p.id === id) ?? emptyProject
  const ictBudgetId = project.ictBudgetId ?? (id && GUID_PATTERN.test(id) ? id : null)
  const hasDataverseBudgetProject = Boolean(ictBudgetId && GUID_PATTERN.test(ictBudgetId))

  const isReviewerView = pathname.includes('/reviewer/')
  const isApproverView = pathname.includes('/approver/')
  const isGovernanceView = isReviewerView || isApproverView

  const routeRole: WorkflowRole = isReviewerView ? 'Reviewer' : isApproverView ? 'Approver' : 'Respondent'
  const currentRole = normalizeStoredRole(sessionStorage.getItem(SESSION_CURRENT_ROLE_KEY)) ?? routeRole
  const roleProjectScope =
    currentRole === 'Reviewer' ? 'reviewer' : currentRole === 'Approver' ? 'approver' : 'respondent'
  const { items: cycleProjects } = useRoleProjects(roleProjectScope, instanceId)
  const backHref = isReviewerView ? '/reviewer/review-queue' : isApproverView ? '/approver/approval-queue' : '/respondent/projects'
  const homeHref = isReviewerView ? '/reviewer/dashboard' : isApproverView ? '/approver/dashboard' : '/respondent/dashboard'
  const queueLabel = isReviewerView ? 'Review Queue' : isApproverView ? 'Approval Queue' : 'My Projects'
  const pageTitle = project.name
  const confidence = typeof project.aiScore === 'number' ? project.aiScore : 0
  const confidenceTone = confidence >= 80 ? 'green' : confidence >= 60 ? 'amber' : 'red'
  const riskTone = project.riskLevel === 'High' ? 'red' : project.riskLevel === 'Medium' ? 'amber' : project.riskLevel === 'Low' ? 'green' : 'slate'
  const budgetFit = project.riskLevel === 'High' || confidence < 60 ? 'Needs Review' : confidence < 80 ? 'Review' : 'Aligned'
  const budgetFitTone = budgetFit === 'Aligned' ? 'green' : budgetFit === 'Review' ? 'amber' : 'red'
  const actionContextLabel = isApproverView ? 'Approver decision controls' : 'Reviewer decision controls'
  const hasCycleDgeSubmission = cycleProjects.some(
    (cycleProject) =>
      cycleProject.status === 'Submitted to DGE' && cycleProject.statusCode === 776140004
  )
  const workflowOwner = getWorkflowOwnerByStatusCode(project.statusCode, project.status)
  const isCurrentOwner = isProjectOwnedByCurrentContext(project, currentRole)
  const canCurrentRoleEdit = canRoleEdit(project, currentRole)
  const canDeleteProject =
    currentRole === 'Respondent' &&
    isCurrentOwner &&
    (project.statusCode === 1 || (project.statusCode == null && project.status === 'Draft'))
  const canSubmitToReviewer =
    currentRole === 'Respondent' &&
    isCurrentOwner &&
    (project.statusCode === 1 || (project.statusCode == null && project.status === 'Draft'))
  const canSubmitToApprover =
    currentRole === 'Reviewer' &&
    isCurrentOwner &&
    (
      (hasCycleDgeSubmission &&
        (project.statusCode === 776140001 ||
          (project.statusCode == null && project.status === 'Submitted to Reviewer'))) ||
      project.statusCode === 576610001 ||
      (project.statusCode == null && project.status === 'Reviewer Review Completed')
    )
  const canCompleteReview =
    currentRole === 'Reviewer' &&
    isCurrentOwner &&
    !hasCycleDgeSubmission &&
    (project.statusCode === 776140001 ||
      (project.statusCode == null && project.status === 'Submitted to Reviewer'))
  const canApproveProject =
    currentRole === 'Approver' &&
    isCurrentOwner &&
    (project.statusCode === 776140002 ||
      (project.statusCode == null && project.status === 'Submitted to Approver'))
  const canRaiseClarification =
    ((currentRole === 'Reviewer' &&
      (project.statusCode === 776140001 ||
        project.statusCode === 576610001 ||
        (project.statusCode == null && (project.status === 'Submitted to Reviewer' || project.status === 'Reviewer Review Completed')))) ||
      (currentRole === 'Approver' &&
        (project.statusCode === 776140002 ||
          project.statusCode === 776140003 ||
          (project.statusCode == null && (project.status === 'Submitted to Approver' || project.status === 'Approved'))))) &&
    isCurrentOwner
  const approverUsesDirectDgeFlow =
    currentRole === 'Approver' &&
    hasCycleDgeSubmission &&
    isCurrentOwner &&
    (project.statusCode === 776140002 ||
      (project.statusCode == null && project.status === 'Submitted to Approver'))
  const showPendingNotice = workflowOwner !== null && (workflowOwner !== currentRole || !isCurrentOwner)
  const pendingNoticeText = workflowOwner
    ? `This project is currently pending with ${workflowOwner}. You can continue the clarification thread below, but edit and workflow actions are locked until it returns to ${currentRole}${!isCurrentOwner ? ' and is assigned to your team or user ownership' : ''}.`
    : 'This project has completed the current workflow stage and is now read-only.'

  useEffect(() => {
    let cancelled = false

    const loadProject = async () => {
      if (!id) {
        setProjectData(null)
        setProjectLoading(false)
        return
      }

      setProjectLoading(true)
      setProjectError(null)

      try {
        const resolvedProject = await projectService.getProjectById(id)
        if (cancelled) return

        if (!resolvedProject) {
          setProjectData(null)
          setProjectError(`Unable to find a budget record for "${id}".`)
          return
        }

        setProjectData(resolvedProject)
      } catch (error) {
        if (cancelled) return
        setProjectData(null)
        setProjectError(
          error instanceof Error ? error.message : 'Unable to load the selected project.'
        )
      } finally {
        if (!cancelled) {
          setProjectLoading(false)
        }
      }
    }

    void loadProject()

    return () => {
      cancelled = true
    }
  }, [id])

  // ── Edit Mode State ──────────────────────────────────────────────────────────
  const [isEditMode, setIsEditMode] = useState(false)
  const [showLogs, setShowLogs] = useState(false)
  const [lookupLoading, setLookupLoading] = useState(false)
  const [lookupError, setLookupError] = useState<string | null>(null)
  const [savingIctBudget, setSavingIctBudget] = useState(false)
  const [ictBudgetLoading, setIctBudgetLoading] = useState(false)
  const [ictBudgetError, setIctBudgetError] = useState<string | null>(null)
  const [strategicPriorities, setStrategicPriorities] = useState<StrategicPriorityOption[]>([])
  const [workStreams, setWorkStreams] = useState<WorkStreamOption[]>([])
  const [technologyCompanies, setTechnologyCompanies] = useState<TechnologyCompanyOption[]>([])
  const [formValues, setFormValues] = useState<IctBudgetFormValues>(INITIAL_ICT_BUDGET_FORM_VALUES)
  const [savedFormValues, setSavedFormValues] = useState<IctBudgetFormValues>(INITIAL_ICT_BUDGET_FORM_VALUES)
  const [savedTechnologyProductNames, setSavedTechnologyProductNames] = useState<string[]>(
    project.technology.product
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean)
  )
  const [ictBudgetCreatedByName, setIctBudgetCreatedByName] = useState<string | null>(null)
  const [ictBudgetCreatedOn, setIctBudgetCreatedOn] = useState<string | null>(null)
  const [ictBudgetModifiedOn, setIctBudgetModifiedOn] = useState<string | null>(null)
  const [ictBudgetRespondentName, setIctBudgetRespondentName] = useState<string | null>(null)
  const [ictBudgetReviewerName, setIctBudgetReviewerName] = useState<string | null>(null)
  const [ictBudgetApproverName, setIctBudgetApproverName] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<IctBudgetFieldErrorMap>({})
  const [workStreamModalOpen, setWorkStreamModalOpen] = useState(false)
  const [technologyProductModalOpen, setTechnologyProductModalOpen] = useState(false)
  const [newWorkStreamName, setNewWorkStreamName] = useState('')
  const [newTechnologyProductName, setNewTechnologyProductName] = useState('')
  const [budgetModalOpen, setBudgetModalOpen] = useState(false)
  const [budgetItemsLoading, setBudgetItemsLoading] = useState(false)
  const [budgetItemsError, setBudgetItemsError] = useState<string | null>(null)
  const [budgetLineItems, setBudgetLineItems] = useState<BudgetLineItemRecord[]>([])
  const [savedBudgetLineItems, setSavedBudgetLineItems] = useState<BudgetLineItemRecord[]>([])
  const [savingBudgetLineItemId, setSavingBudgetLineItemId] = useState<string | null>(null)
  const [deletingBudgetLineItemId, setDeletingBudgetLineItemId] = useState<string | null>(null)
  const [lineItemToDelete, setLineItemToDelete] = useState<BudgetLineItemRecord | null>(null)
  const [pendingWorkflowAction, setPendingWorkflowAction] = useState<WorkflowAction | null>(null)
  const [pendingNavigationHref, setPendingNavigationHref] = useState<string | null>(null)

  // ── File Upload (edit mode) ──────────────────────────────────────────────────
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [supportingDocumentAnalyses, setSupportingDocumentAnalyses] = useState<Record<string, UploadedSupportingDocumentAnalysis>>({})
  const supportingDocumentAnalysisInFlightRef = useRef<Set<string>>(new Set())
  const [documentUploadInFlight, setDocumentUploadInFlight] = useState(false)
  const [persistedDocumentSummaries, setPersistedDocumentSummaries] = useState<StoredDocumentSummaryRecord[]>([])
  const [persistedDocumentSummariesLoading, setPersistedDocumentSummariesLoading] = useState(false)
  const [persistedDocumentSummariesError, setPersistedDocumentSummariesError] = useState<string | null>(null)
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
  const [storedCumulativeSummaryRecord, setStoredCumulativeSummaryRecord] = useState<StoredBudgetAiSummaryRecord | null>(null)
  const [budgetOverviewRecord, setBudgetOverviewRecord] = useState<StoredBudgetOverviewRecord | null>(null)
  const lastSyncedBudgetOverviewAiFlagsKeyRef = useRef<string | null>(null)
  const [pendingBudgetOverviewRefreshModifiedOn, setPendingBudgetOverviewRefreshModifiedOn] = useState<string | null>(null)
  const [pendingCumulativeRefreshModifiedOn, setPendingCumulativeRefreshModifiedOn] = useState<string | null>(null)
  const [detailAiSuggestionLoading, setDetailAiSuggestionLoading] = useState(false)
  const [detailAiSuggestionError, setDetailAiSuggestionError] = useState<string | null>(null)
  const [detailAiSuggestions, setDetailAiSuggestions] = useState<StrategicPrioritySuggestion[]>([])
  const [detailAiSuggestionExpanded, setDetailAiSuggestionExpanded] = useState(false)
  const [detailActionSummaryExpanded, setDetailActionSummaryExpanded] = useState(false)
  const [detailPolicyEvaluationLoading, setDetailPolicyEvaluationLoading] = useState(false)
  const [detailPolicyEvaluationError, setDetailPolicyEvaluationError] = useState<string | null>(null)
  const [detailPolicyEvaluationResult, setDetailPolicyEvaluationResult] = useState<IctBudgetConsiderationsEvaluationResult | null>(null)
  const [aiApplyingAccountCode, setAiApplyingAccountCode] = useState(false)
  const [openAiAssistField, setOpenAiAssistField] = useState<string | null>(null)
  const [animatedAiFields, setAnimatedAiFields] = useState<string[]>([])
  const [selectedDetailSuggestionIds, setSelectedDetailSuggestionIds] = useState<string[]>([])
  const [detailSuggestionApplyLoading, setDetailSuggestionApplyLoading] = useState(false)
  const detailSuggestionAutoSelectionKeyRef = useRef<string | null>(null)
  const [localClarifications, setLocalClarifications] = useState<Clarification[]>(project.clarifications)
  const [clarificationsLoading, setClarificationsLoading] = useState(false)
  const [clarificationModalOpen, setClarificationModalOpen] = useState(false)
  const [pendingClarificationReply, setPendingClarificationReply] = useState<PendingClarificationReply | null>(null)

  const applyBudgetOverviewAiInsights = useCallback((overview: StoredBudgetOverviewRecord['parsedData']) => {
    const strategicAlignment = overview?.strategic_alignment
    const recommendedOptions = strategicAlignment?.recommended_options ?? []
    const mappedSuggestions = recommendedOptions
      .map((option, index) => ({
        rank: Number(option.rank ?? index + 1) || index + 1,
        strategicPriority: toDisplayText(option.strategic_priority) || 'Unknown',
        strategicPriorityClassification: toDisplayText(option.strategic_priority_classification) || 'Unknown',
        relevanceScore: Number(option.relevance_score ?? 0) || 0,
        reason: toDisplayText(option.reason),
      }))
      .filter((suggestion) => suggestion.strategicPriority && suggestion.strategicPriorityClassification)
      .sort((left, right) => left.rank - right.rank)

    const policyAlignment = (overview as {
      budget_policy_alignment?: {
        has_potential_conflict?: boolean
        has_coordination_requirement?: boolean
        has_allowed_with_conditions?: boolean
        summary?: string
        policy_matches?: Array<{
          policy_number?: string
          dge_budget_consideration?: string
          match_type?: string
          relevance_score?: number
          required_action?: string
          strategic_area?: string
          evidence_from_project?: string[]
          reason?: string
        }>
      }
    })?.budget_policy_alignment

    const mappedAssessmentItems = (policyAlignment?.policy_matches ?? [])
      .map((item) => {
        const matchType = String(item.match_type ?? '').trim()
        return {
          policyNumber: toDisplayText(item.policy_number),
          policyName: toDisplayText(item.dge_budget_consideration),
          strategicArea: toDisplayText(item.strategic_area),
          matchType:
            matchType === 'Potential Conflict'
              ? ('Potential Conflict' as const)
              : matchType === 'Allowed With Conditions'
                ? ('Allowed With Conditions' as const)
                : ('Coordination Required' as const),
          relevanceScore: Number(item.relevance_score ?? 0) || 0,
          reason: toDisplayText(item.reason || item.required_action),
          evidenceFromProject: Array.isArray(item.evidence_from_project)
            ? item.evidence_from_project.map((value) => toDisplayText(value)).filter(Boolean)
            : [],
          requiredAction: toDisplayText(item.required_action),
        } satisfies PolicyAssessmentItem
      })
      .filter((item) => item.policyNumber && item.policyName)

    setDetailAiSuggestions(mappedSuggestions)
    setDetailPolicyEvaluationResult({
      assessmentItems: mappedAssessmentItems,
      overallAssessment: {
        hasPolicyMatch: Boolean(policyAlignment?.has_potential_conflict || policyAlignment?.has_coordination_requirement || policyAlignment?.has_allowed_with_conditions),
        hasPotentialConflict: Boolean(policyAlignment?.has_potential_conflict),
        hasCoordinationRequirement: Boolean(policyAlignment?.has_coordination_requirement),
        hasAllowedWithConditions: Boolean(policyAlignment?.has_allowed_with_conditions),
        summary: toDisplayText(policyAlignment?.summary),
      },
      promptId: '',
      promptUsecase: '',
      formattedPrompt: '',
      rawResponse: overview ?? null,
    })
    setDetailAiSuggestionError(null)
    setDetailPolicyEvaluationError(null)
    setDetailAiSuggestionLoading(false)
    setDetailPolicyEvaluationLoading(false)
  }, [])

  // ── SharePoint documents ─────────────────────────────────────────────────────
  const [sharepointDocs, setSharepointDocs] = useState<WebApiPortalDocument[]>([])
  const [sharepointDocsLoading, setSharepointDocsLoading] = useState(false)
  const latestOpenClarification = [...localClarifications]
    .filter((clarification) => clarification.status === 'Open')
    .sort((left, right) => (right.date || '').localeCompare(left.date || ''))[0] ?? null
  const clarificationReturnRole =
    currentRole === 'Respondent' &&
    project.status === 'Clarification Required' &&
    latestOpenClarification &&
    (latestOpenClarification.raisedBy === 'Reviewer' || latestOpenClarification.raisedBy === 'Approver')
      ? latestOpenClarification.raisedBy
      : null
  const showClarificationReturnNotice = Boolean(clarificationReturnRole)
  const clarificationFileUrls = useMemo(() => {
    const urls = new Set<string>()
    for (const clarification of localClarifications) {
      for (const url of splitStoredFileUrls(clarification.fileUrl)) {
        const normalized = normalizeDocumentUrl(url)
        if (normalized) urls.add(normalized)
      }
      for (const reply of clarification.replies) {
        for (const url of splitStoredFileUrls(reply.fileUrl)) {
          const normalized = normalizeDocumentUrl(url)
          if (normalized) urls.add(normalized)
        }
      }
    }
    return urls
  }, [localClarifications])
  const supportingDocuments = useMemo<WebApiPortalDocument[]>(() => {
    const normalizedExisting = new Set<string>()
    const merged = [...sharepointDocs]

    for (const doc of sharepointDocs) {
      const normalized = normalizeDocumentUrl(doc.absoluteurl)
      if (normalized) {
        normalizedExisting.add(normalized)
      }
    }

    for (const normalizedUrl of clarificationFileUrls) {
      if (normalizedExisting.has(normalizedUrl)) continue

      const fileName = getFileNameFromUrl(normalizedUrl)
      const extension = fileName.includes('.') ? fileName.split('.').pop()?.toLowerCase() ?? null : null

      merged.push({
        sharepointdocumentid: `clarification-url:${normalizedUrl}`,
        documentid: null,
        fullname: fileName,
        relativelocation: fileName,
        sharepointcreatedon: null,
        filetype: extension,
        absoluteurl: normalizedUrl,
        modified: null,
        sharepointmodifiedby: null,
        title: fileName,
        readurl: normalizedUrl,
        editurl: null,
        author: null,
        ischeckedout: false,
        locationid: null,
        iconclassname: null,
      })
    }

    return merged
  }, [clarificationFileUrls, sharepointDocs])
  const aiSupportingDocuments = useMemo(
    () =>
      supportingDocuments.filter((doc) => {
        const normalizedUrl = normalizeDocumentUrl(doc.absoluteurl)
        return !normalizedUrl || !clarificationFileUrls.has(normalizedUrl)
      }),
    [clarificationFileUrls, supportingDocuments]
  )
  const aiSupportingDocumentByName = useMemo(
    () =>
      new Map(
        aiSupportingDocuments.map((doc) => [
          (doc.fullname || doc.title || 'Document').trim().toLowerCase(),
          doc,
        ])
      ),
    [aiSupportingDocuments]
  )
  const clarificationDocumentNames = useMemo(
    () =>
      new Set(
        supportingDocuments
          .filter((doc) => {
            const normalizedUrl = normalizeDocumentUrl(doc.absoluteurl)
            return Boolean(normalizedUrl && clarificationFileUrls.has(normalizedUrl))
          })
          .map((doc) => (doc.fullname || doc.title || 'Document').trim().toLowerCase())
      ),
    [clarificationFileUrls, supportingDocuments]
  )
  const hasSupportingDocuments =
      supportingDocuments.length > 0 || (!hasDataverseBudgetProject && project.documents.length > 0)
  const documentStatus = sharepointDocsLoading ? 'Loading' : hasSupportingDocuments ? 'Complete' : 'Missing'
  const documentTone =
    documentStatus === 'Complete' ? 'green' : documentStatus === 'Loading' ? 'blue' : 'red'
  const detailEntityName = getStoredInstanceDetail()?.name?.trim() || currentUser.entity

  const refreshPersistedDocumentSummaries = useCallback(async (options?: { quiet?: boolean }) => {
    if (!ictBudgetId) return

    if (!options?.quiet) {
      setPersistedDocumentSummariesLoading(true)
    }
    setPersistedDocumentSummariesError(null)
    try {
      const [documentSummaries, { cumulativeRecord, budgetOverviewRecord: overviewRecord }] = await Promise.all([
        getDocumentSummaryRecordsByBudgetId(ictBudgetId),
        getAllAiSummaryRecordsByBudgetId(ictBudgetId),
      ])

      const budgetOverviewSyncKey = overviewRecord?.id
        ? `${overviewRecord.id}:${overviewRecord.modifiedOn ?? 'no-modified-on'}`
        : null

      if (
        budgetOverviewSyncKey &&
        overviewRecord?.parsedData &&
        budgetOverviewSyncKey !== lastSyncedBudgetOverviewAiFlagsKeyRef.current
      ) {
        try {
          await syncBudgetAiFlagsFromBudgetOverview(ictBudgetId, overviewRecord.parsedData)
          lastSyncedBudgetOverviewAiFlagsKeyRef.current = budgetOverviewSyncKey
        } catch (error) {
          console.error('[ProjectDetail] Failed to sync dga_ai_flags from Budget Overview:', error)
        }
      }

      const nextBudgetOverviewModifiedOn = overviewRecord?.modifiedOn ?? null
      const nextCumulativeModifiedOn = cumulativeRecord?.modifiedOn ?? null

      if (
        pendingBudgetOverviewRefreshModifiedOn !== null &&
        nextBudgetOverviewModifiedOn !== null &&
        (
          pendingBudgetOverviewRefreshModifiedOn === PENDING_NEW_AI_RECORD ||
          nextBudgetOverviewModifiedOn !== pendingBudgetOverviewRefreshModifiedOn
        )
      ) {
        setPendingBudgetOverviewRefreshModifiedOn(null)
      }

      if (
        pendingCumulativeRefreshModifiedOn !== null &&
        nextCumulativeModifiedOn !== null &&
        nextCumulativeModifiedOn !== pendingCumulativeRefreshModifiedOn
      ) {
        setPendingCumulativeRefreshModifiedOn(null)
      }

      setPersistedDocumentSummaries(documentSummaries)
      setBudgetOverviewRecord(overviewRecord)
      setStoredCumulativeSummaryRecord(cumulativeRecord)
      setSupportingDocumentCumulativeAnalysis((current) => {
        const rawSummary = cumulativeRecord?.responseJson ?? ''
        const parsedSummary =
          cumulativeRecord?.parsedSummary ??
          parseSupportingDocumentEvaluationSummary(rawSummary) ??
          (current.rawSummary === rawSummary ? current.parsedSummary : null)

        return {
          status: pendingCumulativeRefreshModifiedOn !== null
            ? 'analyzing'
            : !cumulativeRecord
            ? 'idle'
            : rawSummary
                ? (parsedSummary ? 'complete' : 'error')
                : 'idle',
          parsedSummary,
          rawSummary,
          responseTimeMs: cumulativeRecord?.responseTime ?? null,
          error: rawSummary && !parsedSummary
            ? 'The stored cumulative summary could not be parsed into action cards.'
            : null,
          sourceFileCount: documentSummaries.length,
          scopeKey: documentSummaries.map((item) => `${item.id}:${item.documentSummary.length}`).join('|') || null,
        }
      })

      if (id) {
        const refreshedProject = await projectService.getProjectById(id)
        if (refreshedProject) {
          setProjectData(refreshedProject)
        }
      }

      return {
        documentSummaries,
        cumulativeRecord,
        budgetOverviewRecord: overviewRecord,
      }
    } catch (error) {
      setPersistedDocumentSummariesError(
        error instanceof Error ? error.message : 'Unable to load stored AI document summaries.'
      )
    } finally {
      if (!options?.quiet) {
        setPersistedDocumentSummariesLoading(false)
      }
    }
  }, [id, ictBudgetId, pendingBudgetOverviewRefreshModifiedOn, pendingCumulativeRefreshModifiedOn])


  const fallbackBudgetItems = useMemo<BudgetLineItemRecord[]>(
    () =>
      project.budgetItems.map((item) => ({
        id: item.id,
        budgetId: null,
        classificationId: item.id,
        accountName: item.accountName,
        l1: item.l1,
        l2: item.l2,
        l3: item.l3,
        accountGroup: null,
        description: null,
        expenseTypeValue: null,
        expenseTypeLabel: item.classification,
        ebsCode: item.ebsFusionCode,
        fusionCode: item.glCode,
        budgetRequested: item.budgetRequested,
      })),
    [project.budgetItems]
  )

  const topLevelStrategicPriorities = useMemo(
    () => strategicPriorities.filter((priority) => !priority.parentId),
    [strategicPriorities]
  )
  const strategicPriorityClassifications = useMemo(
    () =>
      strategicPriorities.filter(
        (priority) => priority.parentId === formValues.strategicPriorityId
      ),
    [formValues.strategicPriorityId, strategicPriorities]
  )
  const selectedTechnologyCompany = useMemo(
    () =>
      technologyCompanies.find((company) => company.id === formValues.technologyCompanyId) ?? null,
    [formValues.technologyCompanyId, technologyCompanies]
  )

  const visibleBudgetFields = useMemo(
    () => getVisibleBudgetFields(formValues.activityType),
    [formValues.activityType]
  )
  const hasUnsavedFormFieldChanges = useMemo(
    () =>
      JSON.stringify(normalizeFormValuesForComparison(formValues)) !==
      JSON.stringify(normalizeFormValuesForComparison(savedFormValues)),
    [formValues, savedFormValues]
  )
  const hasUnsavedBudgetAccountCodeChanges = useMemo(
    () =>
      JSON.stringify(normalizeBudgetLineItemsForComparison(budgetLineItems)) !==
      JSON.stringify(normalizeBudgetLineItemsForComparison(savedBudgetLineItems)),
    [budgetLineItems, savedBudgetLineItems]
  )
  const hasUnsavedChanges = useMemo(() => {
    if (!isEditMode) return false

    return (
      hasUnsavedFormFieldChanges ||
      hasUnsavedBudgetAccountCodeChanges ||
      uploadedFiles.length > 0 ||
      documentUploadInFlight
    )
  }, [documentUploadInFlight, hasUnsavedBudgetAccountCodeChanges, hasUnsavedFormFieldChanges, isEditMode, uploadedFiles.length])

  const detailMatchedAiSuggestions = useMemo<MatchedAiSuggestion[]>(
    () =>
      detailAiSuggestions.map((suggestion) => {
        const resolved = resolveStrategicSuggestionSelection(
          {
            ...suggestion,
            priorityId: null,
            classificationId: null,
            classificationParentId: null,
          },
          strategicPriorities
        )

        return {
          ...suggestion,
          priorityId: resolved.priorityId,
          classificationId: resolved.classificationId,
          classificationParentId: resolved.classificationParentId,
        }
      }),
    [detailAiSuggestions, strategicPriorities]
  )
  const topDetailAiSuggestion = detailMatchedAiSuggestions[0] ?? null

  const persistedDocumentSummaryByName = useMemo(
    () =>
      new Map(
        persistedDocumentSummaries.map((item) => [item.documentName.trim().toLowerCase(), item])
      ),
    [persistedDocumentSummaries]
  )

  const detailSupportingDocumentInsightItems = useMemo<SupportingDocumentAiInsightItem[]>(() => {
    const localAnalysisByName = new Map(
      Object.values(supportingDocumentAnalyses).map((analysis) => [
        analysis.fileName.trim().toLowerCase(),
        analysis,
      ])
    )

    const items: SupportingDocumentAiInsightItem[] = aiSupportingDocuments.map((doc) => {
      const name = (doc.fullname || doc.title || 'Document').trim()
      const stored = persistedDocumentSummaryByName.get(name.toLowerCase()) ?? null
      const localAnalysis = localAnalysisByName.get(name.toLowerCase()) ?? null

      if (!stored && localAnalysis && localAnalysis.status !== 'error') {
        return null
      }

      return {
        id: stored?.id ?? `stored:${name.toLowerCase()}`,
        file: { name, size: null },
        status: stored ? 'complete' : 'error',
        parsedSummary: stored?.parsedSummary ?? null,
        rawSummary: stored?.documentSummary,
        error: stored ? null : 'No persisted AI summary is currently available for this document.',
      }
    }).filter(Boolean) as SupportingDocumentAiInsightItem[]

    for (const [signature, analysis] of Object.entries(supportingDocumentAnalyses)) {
      const normalizedName = analysis.fileName.trim().toLowerCase()
      const hasPersistedSummary = persistedDocumentSummaryByName.has(normalizedName)
      if (analysis.status === 'complete' && hasPersistedSummary) {
        continue
      }
      if (analysis.status === 'error' && hasPersistedSummary) {
        continue
      }

      items.unshift({
        id: signature,
        file: {
          name: analysis.fileName,
          size: analysis.fileSize,
        },
        status: analysis.status,
        parsedSummary: analysis.parsedSummary ?? null,
        rawSummary: analysis.rawSummary,
        error: analysis.error,
      })
    }

    return items
  }, [aiSupportingDocuments, persistedDocumentSummaryByName, supportingDocumentAnalyses])

  const detailUploadedFileStatuses = useMemo<Record<string, 'uploading' | 'analyzing' | 'error'>>(
    () =>
      Object.fromEntries(
        uploadedFiles.flatMap((file) => {
          const signature = getUploadedFileSignature(file)
          const analysis = supportingDocumentAnalyses[signature]
          if (!analysis) {
            return [[`${file.name}::${file.size}::${file.lastModified}`, 'uploading' as const]]
          }

          const nextStatus =
            analysis.status === 'queued'
              ? 'uploading'
              : analysis.status === 'analyzing'
                ? 'analyzing'
                : analysis.status === 'error'
                  ? 'error'
                  : null

          return nextStatus
            ? [[`${file.name}::${file.size}::${file.lastModified}`, nextStatus]]
            : []
        })
      ),
    [supportingDocumentAnalyses, uploadedFiles]
  )

  const completedPersistedDocumentInputs = useMemo(
    () =>
      persistedDocumentSummaries
        .filter(
          (item) =>
            item.documentSummary.trim() &&
            !clarificationDocumentNames.has(item.documentName.trim().toLowerCase())
        )
        .map((item) => ({
          id: item.id,
          filename: item.documentName,
          rawSummary: item.documentSummary,
        })),
    [clarificationDocumentNames, persistedDocumentSummaries]
  )

  const resolvedCumulativeParsedSummary = useMemo(
    () =>
      supportingDocumentCumulativeAnalysis.parsedSummary ??
      parseSupportingDocumentEvaluationSummary(supportingDocumentCumulativeAnalysis.rawSummary ?? ''),
    [supportingDocumentCumulativeAnalysis.parsedSummary, supportingDocumentCumulativeAnalysis.rawSummary]
  )

  const actionSupportingDocumentSummary = useMemo(() => {
    const hasMultipleCompletedFiles = completedPersistedDocumentInputs.length > 1

    if (hasMultipleCompletedFiles && supportingDocumentCumulativeAnalysis.status === 'analyzing') {
      return {
        type: 'cumulative' as const,
        fileCount: Math.max(
          supportingDocumentCumulativeAnalysis.sourceFileCount,
          completedPersistedDocumentInputs.length,
          1
        ),
        parsedSummary: resolvedCumulativeParsedSummary,
        loading: true,
        error: null,
      }
    }

    if (hasMultipleCompletedFiles && resolvedCumulativeParsedSummary) {
      return {
        type: 'cumulative' as const,
        fileCount: Math.max(completedPersistedDocumentInputs.length, 1),
        parsedSummary: resolvedCumulativeParsedSummary,
        loading: false,
        error: supportingDocumentCumulativeAnalysis.error,
      }
    }

    const latestSingle = completedPersistedDocumentInputs[completedPersistedDocumentInputs.length - 1] ?? null
    const latestStoredSingle =
      latestSingle ? persistedDocumentSummaries.find((item) => item.id === latestSingle.id) ?? null : null

    return {
      type: 'single' as const,
      fileCount: latestSingle ? 1 : 0,
      parsedSummary: latestStoredSingle?.parsedSummary ?? null,
      loading: false,
      error: supportingDocumentCumulativeAnalysis.error,
    }
  }, [completedPersistedDocumentInputs, persistedDocumentSummaries, resolvedCumulativeParsedSummary, supportingDocumentCumulativeAnalysis])

  const actionSummary = actionSupportingDocumentSummary.parsedSummary
  const actionSuggestedFields = actionSummary?.suggested_project_fields ?? []
  const actionAccountCodes = getComputedSupportingDocumentAccountCodeSuggestions(actionSummary)
  const actionBudgetLines: SupportingDocumentBudgetLine[] = []
  const actionAccountCode = actionSummary?.account_code_suggestions?.[0] ?? null
  const actionDocumentSummary = actionSummary?.file_summary ?? null
  const actionEvidenceAssessment = actionSummary?.evidence_assessment ?? null
  const actionBudgetTotal = getDocumentSummaryBudgetTotal(actionSummary ?? null)
  const detailSuggestionRows = useMemo<DetailSuggestionRow[]>(() => {
    const rows: DetailSuggestionRow[] = []
    actionSuggestedFields.forEach((field, index) => {
      rows.push({
        id: `field-${field.field_key ?? field.field_label ?? index}-${index}`,
        section: 'Suggested Fields',
        title: field.field_label ?? field.field_key ?? 'Suggested Field',
        value: formatAiFieldValue(field.suggested_value),
        confidence: typeof field.confidence === 'number' ? field.confidence : null,
        kind: 'field',
        field,
        actionable: resolveAiFieldMapping(field) !== null,
      })
    })

    actionAccountCodes.forEach((suggestion, index) => {
      const classificationPath = [
        suggestion.classificationPath?.l1,
        suggestion.classificationPath?.l2,
        suggestion.classificationPath?.l3,
      ]
        .filter(Boolean)
        .join(' / ')
      const mappedLinesLabel =
        suggestion.mappedLineNumbers.length > 0
          ? `Mapped lines ${suggestion.mappedLineNumbers.join(', ')}`
          : 'Mapped amount pending confirmation'

      rows.push({
        id: `account-code-${suggestion.accountCode || index}-${index}`,
        section: 'Account Codes',
        title: suggestion.displayLabel,
        value: classificationPath || suggestion.reason || 'AI mapped this spend to a suggested account code.',
        detail: [
          suggestion.expenseType || null,
          mappedLinesLabel,
          suggestion.mappedBudget > 0 ? formatAEDFull(suggestion.mappedBudget) : null,
        ]
          .filter(Boolean)
          .join(' • '),
        confidence: suggestion.confidence,
        kind: 'account-code',
        accountCodeSuggestion: suggestion,
        actionable: true,
      })
    })

    return rows
  }, [
    actionAccountCodes,
    actionDocumentSummary,
    actionEvidenceAssessment,
    actionSuggestedFields,
  ])
  const detailReadOnlyRows = useMemo(
    () => detailSuggestionRows.filter((row) => row.kind === 'summary'),
    [detailSuggestionRows]
  )
  const detailSelectableRows = useMemo(
    () => detailSuggestionRows.filter((row) => row.actionable),
    [detailSuggestionRows]
  )
  const detailSuggestionSelectionKey = useMemo(
    () => detailSelectableRows.map((row) => row.id).join('|'),
    [detailSelectableRows]
  )
  const detailActionSummaryText =
    toDisplayText(actionDocumentSummary?.short_summary) ||
    toDisplayText(actionDocumentSummary?.detailed_summary) ||
    toDisplayText(actionEvidenceAssessment?.reason) ||
    ''
  const detailActionSummaryPreview = truncateAiText(detailActionSummaryText, 220)
  const detailActionSummaryCanExpand = detailActionSummaryPreview.length < detailActionSummaryText.length
  const canApplyDetailAi = currentRole === 'Respondent' && isEditMode && canCurrentRoleEdit
  const isActionSummaryCombined =
    actionSupportingDocumentSummary.type === 'cumulative' &&
    actionSupportingDocumentSummary.fileCount > 1
  const showDetailSupportingDocumentSummary =
    isActionSummaryCombined && detailActionSummaryText.trim().length > 0

  useEffect(() => {
    const nextSelectedIds = detailSelectableRows.map((row) => row.id)

    if (!detailSuggestionSelectionKey) {
      detailSuggestionAutoSelectionKeyRef.current = null
      setSelectedDetailSuggestionIds((current) => (current.length === 0 ? current : []))
      return
    }

    if (detailSuggestionAutoSelectionKeyRef.current === detailSuggestionSelectionKey) {
      return
    }

    detailSuggestionAutoSelectionKeyRef.current = detailSuggestionSelectionKey
    setSelectedDetailSuggestionIds(nextSelectedIds)
  }, [detailSelectableRows, detailSuggestionSelectionKey])

  useEffect(() => {
    if (animatedAiFields.length === 0) return
    const timeout = window.setTimeout(() => {
      setAnimatedAiFields([])
    }, 1600)

    return () => window.clearTimeout(timeout)
  }, [animatedAiFields])

  const aiSuggestedFieldByMapping = useMemo(() => {
    const lookup = new Map<string, SupportingDocumentSuggestedProjectField>()
    for (const field of actionSuggestedFields) {
      const mapping = resolveAiFieldMapping(field)
      if (mapping && !lookup.has(mapping)) {
        lookup.set(mapping, field)
      }
    }
    return lookup
  }, [actionSuggestedFields])

  function isAiSuggestionApplied(mapping: string, field: SupportingDocumentSuggestedProjectField) {
    const rawValue = Array.isArray(field.suggested_value)
      ? field.suggested_value.join(', ')
      : String(field.suggested_value ?? '')
    const normalized = rawValue.trim().toLowerCase()

    if (mapping === 'initiativeName') {
      return formValues.initiativeName.trim().toLowerCase() === normalized
    }

    if (mapping === 'summary') {
      return formValues.summary.trim().toLowerCase() === normalized
    }

    if (mapping === 'category') {
      const selectedCategory = CATEGORY_OPTIONS.find((option) => option.value === formValues.category)
      return (selectedCategory?.label.trim().toLowerCase() ?? '') === normalized
    }

    if (mapping === 'technologyCompany') {
      const selectedName = selectedTechnologyCompany?.name.trim().toLowerCase() ?? ''
      return selectedName === normalized || selectedName.includes(normalized) || normalized.includes(selectedName)
    }

    if (mapping === 'activityType') {
      const selectedActivityType = ACTIVITY_TYPE_OPTIONS.find(
        (option) => option.value === formValues.activityType
      )
      const selectedTitle = selectedActivityType?.title.trim().toLowerCase() ?? ''
      return selectedTitle === normalized || selectedTitle.includes(normalized) || normalized.includes(selectedTitle)
    }

    return false
  }

  function animateAiFieldUpdate(fieldKey: string) {
    setAnimatedAiFields((current) => Array.from(new Set([...current, fieldKey])))
  }

  function applyAiAssistField(fieldKey: string, field: SupportingDocumentSuggestedProjectField) {
    if (!isEditMode) {
      return
    }

    applyAiFieldSuggestion(field)
    animateAiFieldUpdate(fieldKey)
    setOpenAiAssistField(null)
  }

  function buildAiAssist(fieldKey: string, fieldLabel: string) {
    const field = aiSuggestedFieldByMapping.get(fieldKey)
    if (!field) return null
    if (isAiSuggestionApplied(fieldKey, field)) return null

    return (
      <AiFieldAssistTrigger
        fieldLabel={fieldLabel}
        suggestedValue={formatAiFieldValue(field.suggested_value)}
        isOpen={openAiAssistField === fieldKey}
        canApply={isEditMode}
        onToggle={() => setOpenAiAssistField((current) => (current === fieldKey ? null : fieldKey))}
        onApply={() => applyAiAssistField(fieldKey, field)}
      />
    )
  }

  function buildStrategicAiAssist(type: 'priority' | 'classification') {
    const suggestion = topDetailAiSuggestion
    if (!suggestion) return null

    const fieldLabel =
      type === 'priority' ? 'Strategic Priority' : 'Strategic Priority Classifications'
    const suggestedValue =
      type === 'priority'
        ? suggestion.strategicPriority
        : suggestion.strategicPriorityClassification

    if (!suggestedValue?.trim()) return null

    const isApplied =
      type === 'priority'
        ? formValues.strategicPriorityId === suggestion.priorityId
        : formValues.strategicPriorityClassificationId === suggestion.classificationId

    if (isApplied) return null

    return (
      <AiFieldAssistTrigger
        fieldLabel={fieldLabel}
        suggestedValue={suggestedValue}
        isOpen={openAiAssistField === `strategic-${type}`}
        canApply={false}
        onToggle={() =>
          setOpenAiAssistField((current) =>
            current === `strategic-${type}` ? null : `strategic-${type}`
          )
        }
        onApply={() => {}}
        helperText="Switch the form to Edit mode to apply this AI recommendation from the Strategic Priority section."
      />
    )
  }

  const detailPolicyMatchGroups = useMemo<PolicyMatchGroup[]>(() => {
    const assessmentItems = detailPolicyEvaluationResult?.assessmentItems ?? []
    const order: PolicyMatchType[] = ['Potential Conflict', 'Coordination Required', 'Allowed With Conditions']
    return order
      .map((matchType) => ({
        matchType,
        items: assessmentItems.filter((item) => item.matchType === matchType),
      }))
      .filter((group) => group.items.length > 0)
  }, [detailPolicyEvaluationResult])

  const detailAiSuggestionCard = detailAiSuggestionError ? (
    <div className="rounded-2xl border border-[#FFD4D1] bg-[#FFF5F5] px-4 py-3 text-sm text-[#B42318] dark:border-[#EA4F49]/40 dark:bg-[#EA4F49]/10">
      {detailAiSuggestionError}
    </div>
  ) : detailMatchedAiSuggestions.length === 0 && detailAiSuggestionLoading ? (
    <div className="rounded-2xl border border-[#E9D5FF] bg-[#FDF7FF] px-4 py-3 text-sm text-[#A855F7] dark:border-white/10 dark:bg-white/5 dark:text-[#E9D5FF]">
      <div className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        Retrieving Strategic Priority and Classification recommendations...
      </div>
    </div>
  ) : detailMatchedAiSuggestions.length > 0 ? (
    <div className="space-y-3">
      {topDetailAiSuggestion && (
        <div className="relative overflow-hidden rounded-xl border border-[#E9D5FF] bg-white dark:border-white/10 dark:bg-[#1E293B]">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <Sparkles className="absolute left-5 top-3 h-4 w-4 text-[#A855F7]/[0.12] dark:text-[#E9D5FF]/[0.12]" />
            <Bot className="absolute left-16 bottom-3 h-5 w-5 text-[#A855F7]/[0.12] dark:text-[#E9D5FF]/[0.12]" />
            <Sparkles className="absolute left-[34%] top-1/2 h-4 w-4 -translate-y-1/2 text-[#A855F7]/[0.1] dark:text-[#E9D5FF]/[0.1]" />
            <Bot className="absolute left-1/2 top-3 h-4 w-4 -translate-x-1/2 text-[#A855F7]/[0.1] dark:text-[#E9D5FF]/[0.1]" />
            <Sparkles className="absolute right-24 top-3 h-5 w-5 text-[#A855F7]/[0.12] dark:text-[#E9D5FF]/[0.12]" />
            <Bot className="absolute right-36 bottom-3 h-6 w-6 text-[#A855F7]/[0.12] dark:text-[#E9D5FF]/[0.12]" />
            <Sparkles className="absolute right-8 bottom-4 h-4 w-4 text-[#A855F7]/[0.12] dark:text-[#E9D5FF]/[0.12]" />
          </div>
          <div
            className={cn(
              'bg-gradient-to-b from-[#FDF7FF] to-white px-4 py-3 dark:from-[#2A123D] dark:to-[#1E293B]',
              detailAiSuggestionExpanded && 'border-b border-[#E9D5FF] dark:border-white/10'
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="mb-2 flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#A855F7]/12 text-[#A855F7] dark:bg-[#A855F7]/12 dark:text-[#E9D5FF]">
                    <Sparkles className="h-3.5 w-3.5" />
                  </div>
                  <h4 className="text-sm font-medium text-[#0F172A] dark:text-white">AI Recommendation</h4>
                </div>

                <div className="flex flex-col gap-2 xl:flex-row xl:flex-wrap xl:items-center xl:gap-3">
                  <div className="min-w-0 rounded-xl bg-white/80 px-3 py-2 dark:bg-white/5">
                    <p className="truncate text-sm text-[#475569] dark:text-slate-300">
                      <span className="font-medium text-[#64748B] dark:text-slate-400">Suggested Strategic Priority:</span>{' '}
                      <span className="font-semibold text-[#A855F7] dark:text-[#E9D5FF]">{topDetailAiSuggestion.strategicPriority}</span>
                    </p>
                  </div>
                  <div className="min-w-0 rounded-xl bg-white/80 px-3 py-2 dark:bg-white/5">
                    <p className="truncate text-sm text-[#475569] dark:text-slate-300">
                      <span className="font-medium text-[#64748B] dark:text-slate-400">Suggested Strategic Priority Classification:</span>{' '}
                      <span className="font-semibold text-[#A855F7] dark:text-[#E9D5FF]">{topDetailAiSuggestion.strategicPriorityClassification}</span>
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setDetailAiSuggestionExpanded((current) => !current)}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#E9D5FF] bg-white/90 text-[#A855F7] transition-colors hover:bg-[#FAF5FF] dark:border-white/10 dark:bg-white/10 dark:text-[#E9D5FF] dark:hover:bg-white/15"
                aria-label={detailAiSuggestionExpanded ? 'Hide details' : 'View details'}
                title={detailAiSuggestionExpanded ? 'Hide details' : 'View details'}
              >
                <ChevronDown className={cn('h-4 w-4 transition-transform', detailAiSuggestionExpanded && 'rotate-180')} />
              </button>
            </div>

            {canApplyDetailAi && (
              <div className="mt-3 flex justify-start">
                <Button
                  type="button"
                  className="h-9 rounded-xl bg-[#A855F7] px-4 text-sm text-white hover:bg-[#9333EA]"
                  onClick={() => applyAiSuggestion(topDetailAiSuggestion, 'both')}
                  disabled={
                    !resolveStrategicSuggestionSelection(topDetailAiSuggestion, strategicPriorities).priorityId ||
                    !resolveStrategicSuggestionSelection(topDetailAiSuggestion, strategicPriorities).classificationId
                  }
                >
                  <Sparkles className="h-4 w-4" />
                  Apply
                </Button>
              </div>
            )}
          </div>

          {detailAiSuggestionExpanded && (
            <div className="rounded-b-xl bg-white px-3 py-3 dark:bg-[#1E293B]">
              <div className="grid gap-3 xl:grid-cols-2">
                {detailMatchedAiSuggestions.map((suggestion) => {
                  const isApplied =
                    formValues.strategicPriorityId === suggestion.priorityId &&
                    formValues.strategicPriorityClassificationId === suggestion.classificationId
                  const canApplySuggestion = Boolean(suggestion.priorityId) && Boolean(suggestion.classificationId)

                  return (
                    <div
                      key={`${suggestion.rank}-${suggestion.strategicPriority}-${suggestion.strategicPriorityClassification}`}
                      className={cn(
                        'rounded-2xl border bg-white p-4 transition-colors dark:bg-white/5',
                        isApplied
                          ? 'border-[#A855F7]'
                          : 'border-[#E9D5FF] dark:border-white/10'
                      )}
                    >
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div>
                          <div className="inline-flex items-center rounded-full bg-[#FAF5FF] px-2.5 py-1 text-xs font-semibold text-[#0F172A] dark:bg-[#A855F7]/15 dark:text-white">
                            Option {suggestion.rank}
                          </div>
                          <div className="mt-2 space-y-2">
                            <div>
                              <p className="text-xs font-medium text-[#64748B] dark:text-slate-300">Strategic Priority</p>
                              <p className="text-sm font-bold text-[#0F172A] dark:text-white">{suggestion.strategicPriority}</p>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-[#64748B] dark:text-slate-300">Classification</p>
                              <p className="text-sm font-bold text-[#0F172A] dark:text-white">{suggestion.strategicPriorityClassification}</p>
                            </div>
                          </div>
                        </div>
                        <div className="rounded-xl bg-[#FAF5FF] px-3 py-2 text-center dark:bg-white/10">
                          <p className="text-xs font-semibold text-[#0F172A] dark:text-white">Rank</p>
                          <p className="mt-1 text-lg font-bold text-[#A855F7] dark:text-[#E9D5FF]">{suggestion.rank}</p>
                        </div>
                      </div>
                      <p className="text-sm leading-6 text-[#475569] dark:text-slate-200">
                        {toDisplayText(suggestion.reason) || 'AI identified this as a likely strategic match.'}
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button
                          type="button"
                          className="h-10 rounded-xl bg-[#A855F7] px-4 text-sm text-white hover:bg-[#9333EA]"
                          onClick={() => applyAiSuggestion(suggestion, 'both')}
                          disabled={!canApplySuggestion}
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
  ) : (
    <div className="rounded-xl border border-[#E9D5FF] bg-white/80 px-3 py-4 text-sm text-[#64748B] dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
      No AI strategic recommendation is available for this budget yet.
    </div>
  )

  const detailAiSuggestionStatusCard =
    detailAiSuggestionError ? (
      <div className="rounded-2xl border border-[#FFD4D1] bg-[#FFF5F5] px-4 py-3 text-sm text-[#B42318] dark:border-[#EA4F49]/40 dark:bg-[#EA4F49]/10">
        {detailAiSuggestionError}
      </div>
    ) : detailAiSuggestionLoading ? (
      <div className="rounded-2xl border border-[#E9D5FF] bg-[#FDF7FF] px-4 py-3 text-sm text-[#A855F7] dark:border-white/10 dark:bg-white/5 dark:text-[#E9D5FF]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Retrieving Strategic Priority and Classification recommendations...
        </div>
      </div>
    ) : null

  const detailBudgetOverviewCard = (
    <InteractiveBudgetOverviewCard
      record={budgetOverviewRecord}
      loading={persistedDocumentSummariesLoading}
      error={persistedDocumentSummariesError}
      currentRole={currentRole}
      confidenceScore={confidence}
      isRefreshing={pendingBudgetOverviewRefreshModifiedOn !== null}
      policyLoading={detailPolicyEvaluationLoading}
      policyError={detailPolicyEvaluationError}
      policyResult={detailPolicyEvaluationResult}
      policyMatchGroups={detailPolicyMatchGroups}
      fileInsightItems={detailSupportingDocumentInsightItems}
    />
  )

  const clarificationQuickPrompts = useMemo(() => {
    const clarificationData = budgetOverviewRecord?.parsedData?.clarifications
    const prompts = [
      clarificationData?.summary_message ?? '',
      ...(clarificationData?.items?.map((item) => item.message ?? '') ?? []),
    ]

    return Array.from(new Set(prompts.map((prompt) => prompt.trim()).filter(Boolean))).slice(0, 4)
  }, [budgetOverviewRecord])

  const detailDocumentActionCards = isEditMode ? (
      <div className="space-y-4">
        <div className="rounded-2xl border border-[#E9D5FF] bg-white shadow-sm dark:border-white/10 dark:bg-[#1E293B]">
          <div className="flex items-center justify-between gap-3 border-b border-[#F1E4FF] px-4 py-4 dark:border-white/10">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 shrink-0 text-[#A855F7] dark:text-[#E9D5FF]">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-[#0F172A] dark:text-white" style={{fontSize: 15}}>Suggested Project Fields</p>
               
              </div>
            </div>
            {canApplyDetailAi && detailSelectableRows.length > 0 && !actionSupportingDocumentSummary.loading ? (
              <button
                type="button"
                onClick={() => void applySelectedDetailSuggestions()}
                disabled={selectedDetailSuggestionIds.length === 0 || detailSuggestionApplyLoading}
                className="inline-flex items-center gap-2 whitespace-nowrap rounded-xl bg-[linear-gradient(135deg,#A855F7_0%,#8B5CF6_100%)] px-4 py-2.5 text-xs font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
              >
                {detailSuggestionApplyLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                Apply Suggestions
              </button>
            ) : null}
          </div>

          {actionSupportingDocumentSummary.loading ? (
            <div className="flex items-center gap-2 px-4 py-4 text-sm text-[#64748B] dark:text-slate-300">
              <Loader2 className="h-4 w-4 animate-spin text-[#A855F7] dark:text-[#E9D5FF]" />
              Analyzing the uploaded document and preparing suggestions...
            </div>
          ) : actionSupportingDocumentSummary.error ? (
            <div className="mx-4 my-4 rounded-xl border border-[#F5C2C7] bg-[#FFF1F3] px-3 py-3 text-sm text-[#B42318] dark:border-[#B42318]/30 dark:bg-[#3B1118] dark:text-[#FCA5A5]">
              {actionSupportingDocumentSummary.error}
            </div>
          ) : detailSuggestionRows.length > 0 ? (
            <div className="space-y-4 px-4 py-4">
              {detailReadOnlyRows.length > 0 ? (
                <div className="rounded-2xl border border-[#EAF0F6] bg-[#F8FBFF] px-4 py-4 dark:border-white/10 dark:bg-white/5">
                  <div className="space-y-4">
                    {detailReadOnlyRows.map((row) => (
                      <div key={row.id} className="border-b border-[#E5EDF6] pb-4 last:border-b-0 last:pb-0 dark:border-white/10">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-[11px] font-semibold text-[#64748B] dark:text-slate-300">{row.section}</p>
                            <p className="mt-0.5 text-sm font-medium text-[#0F172A] dark:text-white">{row.title}</p>
                          </div>
                          {typeof row.confidence === 'number' && (
                            <span className="rounded-full border border-[#D7E4F4] bg-white px-2 py-0.5 text-[11px] font-semibold text-[#286CFF] dark:border-white/10 dark:bg-white/10 dark:text-[#BFDBFE]">
                              {row.confidence}%
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-sm leading-6 text-[#475569] dark:text-slate-300">{row.value}</p>
                        {row.detail ? (
                          <p className="mt-1 text-xs text-[#64748B] dark:text-slate-400">{row.detail}</p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {detailSelectableRows.length > 0 ? (
                canApplyDetailAi ? (
                  <div className="divide-y divide-[#EEF2F7] bg-white px-4 dark:divide-white/10 dark:bg-[#1E293B]">
                      {detailSelectableRows.map((row) => {
                        const checked = selectedDetailSuggestionIds.includes(row.id)

                        return (
                          <label key={row.id} className="flex items-start gap-3 py-3 cursor-pointer">
                            <span className="relative mt-0.5 shrink-0">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(event) => {
                                  setSelectedDetailSuggestionIds((current) =>
                                    event.target.checked
                                      ? [...current, row.id]
                                      : current.filter((item) => item !== row.id)
                                  )
                                }}
                                className="sr-only"
                              />
                              <span
                                className={cn(
                                  'flex h-5 w-5 items-center justify-center rounded-md border transition-colors',
                                  checked
                                    ? 'border-[#A855F7] bg-[#A855F7] text-white'
                                    : 'border-[#CBD5E1] bg-white text-transparent dark:border-white/15 dark:bg-white/5'
                                )}
                              >
                                <Check className={cn('h-3.5 w-3.5', checked ? 'opacity-100' : 'opacity-0')} />
                              </span>
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-start justify-between gap-2">
                                <div className="min-w-0">
                                  {row.kind !== 'field' ? (
                                    <p className="text-[11px] font-semibold text-[#64748B] dark:text-slate-300">{row.section}</p>
                                  ) : null}
                                  <p className="mt-0.5 text-sm font-medium text-[#0F172A] dark:text-white">{row.title}</p>
                                </div>
                                {typeof row.confidence === 'number' && (
                                  <span className="rounded-full border border-[#D7E4F4] bg-white px-2 py-0.5 text-[11px] font-semibold text-[#286CFF] dark:border-white/10 dark:bg-white/10 dark:text-[#BFDBFE]">
                                    {row.confidence}%
                                  </span>
                                )}
                              </div>
                              <p className="mt-1 text-sm leading-6 text-[#475569] dark:text-slate-300">{row.value}</p>
                              {row.detail ? (
                                <p className="mt-1 text-xs text-[#64748B] dark:text-slate-400">{row.detail}</p>
                              ) : null}
                            </div>
                          </label>
                        )
                      })}
                  </div>
                ) : (
                  <div className="divide-y divide-[#EEF2F7] bg-white px-4 dark:divide-white/10 dark:bg-[#1E293B]">
                      {detailSelectableRows.map((row) => (
                        <div key={row.id} className="flex items-start gap-3 py-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <div className="min-w-0">
                                {row.kind !== 'field' ? (
                                  <p className="text-[11px] font-semibold text-[#64748B] dark:text-slate-300">{row.section}</p>
                                ) : null}
                                <p className="mt-0.5 text-sm font-medium text-[#0F172A] dark:text-white">{row.title}</p>
                              </div>
                              {typeof row.confidence === 'number' && (
                                <span className="rounded-full border border-[#D7E4F4] bg-white px-2 py-0.5 text-[11px] font-semibold text-[#286CFF] dark:border-white/10 dark:bg-white/10 dark:text-[#BFDBFE]">
                                  {row.confidence}%
                                </span>
                              )}
                            </div>
                            <p className="mt-1 text-sm leading-6 text-[#475569] dark:text-slate-300">{row.value}</p>
                            {row.detail ? (
                              <p className="mt-1 text-xs text-[#64748B] dark:text-slate-400">{row.detail}</p>
                            ) : null}
                          </div>
                        </div>
                      ))}
                  </div>
                )
              ) : null}
            </div>
          ) : (
            <EmptyAiActionCard
              description="Upload a supporting document to review one consolidated set of suggested summary details, fields, and account guidance."
              icon={Sparkles}
            />
          )}
        </div>

        {false && currentRole === 'Respondent' && (
          <div className="group rounded-2xl border border-[#E9D5FF] bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-[#1E293B]">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="shrink-0 text-[#A855F7] dark:text-[#E9D5FF]">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#A855F7] dark:text-[#E9D5FF]">Suggested Project Fields</p>
                  <p className="text-xs text-[#64748B] dark:text-slate-300">Apply-ready suggestions</p>
                </div>
              </div>
              {actionSuggestedFields.length > 0 && !actionSupportingDocumentSummary.loading && canApplyDetailAi ? (
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
            {actionSupportingDocumentSummary.loading ? (
              <div className="flex items-center gap-2 rounded-xl border border-dashed border-[#E9D5FF] bg-[#FDF7FF] px-3 py-4 text-sm text-[#A855F7] dark:border-white/10 dark:bg-white/5 dark:text-[#E9D5FF]">
                <Loader2 className="h-4 w-4 animate-spin" />
                Synthesizing field suggestions...
              </div>
            ) : actionSupportingDocumentSummary.error ? (
              <div className="rounded-xl border border-[#F5C2C7] bg-[#FFF1F3] px-3 py-3 text-sm text-[#B42318] dark:border-[#B42318]/30 dark:bg-[#3B1118] dark:text-[#FCA5A5]">
                {actionSupportingDocumentSummary.error}
              </div>
            ) : actionSuggestedFields.length > 0 ? (
              <div className="space-y-2">
                {actionSuggestedFields.slice(0, 4).map((field: SupportingDocumentSuggestedProjectField) => {
                  const canApply = resolveAiFieldMapping(field) !== null
                  return (
                    <div key={field.field_key ?? field.field_label} className="relative rounded-xl border border-[#EAF0F6] bg-[#F8FBFF] px-3 py-3 dark:border-white/10 dark:bg-white/5">
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
                            <span className="rounded-full bg-white px-2 py-1 text-[11px] font-bold text-[#A855F7] dark:bg-white/10 dark:text-[#E9D5FF]">
                              {field.confidence}%
                            </span>
                          )}
                          {canApplyDetailAi && (
                            <button
                              type="button"
                              onClick={() => applyAiFieldSuggestion(field)}
                              disabled={!canApply}
                              className="inline-flex items-center gap-1 rounded-lg border border-[#E9D5FF] bg-white px-2 py-1 text-[11px] font-semibold text-[#A855F7] shadow-sm transition-colors hover:bg-[#FAF5FF] disabled:opacity-40 dark:border-white/10 dark:bg-white/5 dark:text-[#E9D5FF]"
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
              <EmptyAiActionCard
                description="Upload and analyze a supporting document to see AI-suggested project fields here."
                icon={Sparkles}
              />
            )}
          </div>
        )}

        {false && (
        <div className="group rounded-2xl border border-[#E9D5FF] bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-[#1E293B]">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="shrink-0 text-[#A855F7] dark:text-[#E9D5FF]">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#A855F7] dark:text-[#E9D5FF]">Account Code Suggestions</p>
                <p className="text-xs text-[#64748B] dark:text-slate-300">Mapped AI account guidance with summed budget amounts</p>
              </div>
            </div>
          </div>
          {actionSupportingDocumentSummary.loading ? (
            <div className="flex items-center gap-2 rounded-xl border border-dashed border-[#E9D5FF] bg-[#FDF7FF] px-3 py-4 text-sm text-[#A855F7] dark:border-white/10 dark:bg-white/5 dark:text-[#E9D5FF]">
              <Loader2 className="h-4 w-4 animate-spin" />
              Resolving account code suggestions...
            </div>
          ) : actionAccountCodes.length > 0 ? (
            <div className="space-y-3">
              {actionAccountCodes.map((suggestion) => {
                const classificationPath = [
                  suggestion.classificationPath?.l1,
                  suggestion.classificationPath?.l2,
                  suggestion.classificationPath?.l3,
                ]
                  .filter(Boolean)
                  .join(' / ')

                return (
                  <div
                    key={`${suggestion.accountCode}-${suggestion.displayLabel}`}
                    className="rounded-xl border border-[#EAF0F6] bg-[#F8FBFF] px-3 py-3 dark:border-white/10 dark:bg-white/5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#0F172A] dark:text-white">{suggestion.displayLabel}</p>
                        <p className="mt-1 text-xs text-[#64748B] dark:text-slate-300">
                          {[suggestion.expenseType || null, classificationPath || null]
                            .filter(Boolean)
                            .join(' • ') || 'Suggested account classification'}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        {suggestion.confidence !== null && (
                          <span className="inline-flex rounded-full border border-[#E9D5FF] bg-white px-2 py-0.5 text-[11px] font-bold text-[#A855F7] dark:border-white/10 dark:bg-white/10 dark:text-[#E9D5FF]">
                            {suggestion.confidence}%
                          </span>
                        )}
                        <p className="mt-2 text-sm font-bold text-[#A855F7] dark:text-[#E9D5FF]">
                          {suggestion.mappedBudget > 0 ? formatAEDFull(suggestion.mappedBudget) : '-'}
                        </p>
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-[#64748B] dark:text-slate-300">
                      {suggestion.mappedLineNumbers.length > 0
                        ? `Mapped from budget lines ${suggestion.mappedLineNumbers.join(', ')}`
                        : 'Mapped amount pending confirmation.'}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[#475569] dark:text-slate-200">
                      {truncateAiText(toDisplayText(suggestion.reason), 200) || 'AI account-code rationale will appear here.'}
                    </p>
                    {canApplyDetailAi && (
                      <Button
                        type="button"
                        className="mt-3 w-full gap-2 rounded-xl bg-[#A855F7] text-white hover:bg-[#9333EA]"
                        onClick={() => void applyAiAccountCodeSuggestion(suggestion)}
                        disabled={aiApplyingAccountCode}
                      >
                        <Sparkles className="h-4 w-4" />
                        {aiApplyingAccountCode ? 'Applying...' : 'Add to Budget Line Items'}
                      </Button>
                    )}
                  </div>
                )
              })}
              <div className="rounded-xl border border-[#E9D5FF] bg-white px-3 py-3 dark:border-white/10 dark:bg-white/5">
                <p className="text-[11px] font-semibold text-[#64748B] dark:text-slate-300">Total Mapped Amount</p>
                <CurrencyAmount amount={actionBudgetTotal} full className="mt-1 text-sm font-bold text-[#A855F7]" />
              </div>
            </div>
          ) : (
            <EmptyAiActionCard
              description="When the AI can infer likely GL/account-code matches, they will appear here with mapped budget totals."
              icon={Sparkles}
            />
          )}
        </div>
        )}

        {false && (
        <div className="group rounded-2xl border border-[#E9D5FF] bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-[#1E293B]">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="shrink-0 text-[#A855F7] dark:text-[#E9D5FF]">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#A855F7] dark:text-[#E9D5FF]">Budget Lines</p>
                <p className="text-xs text-[#64748B] dark:text-slate-300">Extracted financial evidence</p>
              </div>
            </div>
          </div>
          {actionSupportingDocumentSummary.loading ? (
            <div className="flex items-center gap-2 rounded-xl border border-dashed border-[#E9D5FF] bg-[#FDF7FF] px-3 py-4 text-sm text-[#A855F7] dark:border-white/10 dark:bg-white/5 dark:text-[#E9D5FF]">
              <Loader2 className="h-4 w-4 animate-spin" />
              Consolidating budget lines...
            </div>
          ) : actionBudgetLines.length > 0 ? (
            <div className="space-y-2">
              {actionBudgetLines.slice(0, 3).map((line: SupportingDocumentBudgetLine, index: number) => (
                <div key={`${line.line_number ?? index}-${line.description ?? 'budget-line'}`} className="relative rounded-xl border border-[#EAF0F6] bg-[#F8FBFF] px-3 py-3 dark:border-white/10 dark:bg-white/5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#0F172A] dark:text-white">{line.description ?? 'Budget line'}</p>
                      <p className="mt-1 text-xs text-[#64748B] dark:text-slate-300">
                        {line.amount_period ?? 'One-time'}{line.vat_treatment ? ` • VAT ${line.vat_treatment}` : ''}
                      </p>
                    </div>
                    <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-[#A855F7] dark:bg-white/10 dark:text-[#E9D5FF]">
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
            <EmptyAiActionCard
              description="Budget line suggestions will appear here once the document includes usable commercials or financial evidence."
              icon={Sparkles}
            />
          )}
        </div>
        )}

        {false && currentRole === 'Respondent' && (
          <div className="group rounded-2xl border border-[#E9D5FF] bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-[#1E293B]">
            <div className="mb-3 flex items-center gap-3">
              <div className="shrink-0 text-[#A855F7] dark:text-[#E9D5FF]">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#A855F7] dark:text-[#E9D5FF]">Account Code Suggestion</p>
                <p className="text-xs text-[#64748B] dark:text-slate-300">Suggested mapping for the extracted spend</p>
              </div>
            </div>
            {actionSupportingDocumentSummary.loading ? (
              <div className="flex items-center gap-2 rounded-xl border border-dashed border-[#E9D5FF] bg-[#FDF7FF] px-3 py-4 text-sm text-[#A855F7] dark:border-white/10 dark:bg-white/5 dark:text-[#E9D5FF]">
                <Loader2 className="h-4 w-4 animate-spin" />
                Resolving account code suggestions...
              </div>
            ) : actionAccountCode ? (
              <div className="space-y-3">
                <div className="relative rounded-xl border border-[#EAF0F6] bg-[#F8FBFF] px-3 py-3 dark:border-white/10 dark:bg-white/5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold text-[#64748B] dark:text-slate-300">Primary Account Code</p>
                      <p className="mt-1 text-sm font-bold text-[#0F172A] dark:text-white">{actionAccountCode?.account_code ?? '-'}</p>
                      {typeof actionAccountCode?.requested_budget === 'number' && (
                        <div className="mt-1.5 flex items-center gap-1.5">
                          <p className="text-[10px] font-semibold text-[#64748B] dark:text-slate-300">Requested</p>
                          <CurrencyAmount amount={actionAccountCode?.requested_budget ?? 0} full className="text-xs font-bold text-[#A855F7] dark:text-[#E9D5FF]" />
                        </div>
                      )}
                    </div>
                    {typeof actionAccountCode?.account_code_confidence === 'number' && (
                      <span className="rounded-full border border-[#E9D5FF] bg-white px-2 py-1 text-[11px] font-bold text-[#A855F7] dark:border-white/10 dark:bg-white/10 dark:text-[#E9D5FF]">
                        {actionAccountCode?.account_code_confidence}%
                      </span>
                    )}
                  </div>
                </div>
                <div className="grid gap-2 sm:grid-cols-3">
                  {(['l1', 'l2', 'l3'] as const).map((level) => (
                    <div key={level} className="relative rounded-xl border border-[#EAF0F6] bg-[#F8FBFF] px-3 py-2.5 dark:border-white/10 dark:bg-white/5">
                      <p className="text-[11px] font-semibold text-[#64748B] dark:text-slate-300">{level.replace(/^l/i, 'L')}</p>
                      <p className="mt-1 text-xs font-semibold text-[#0F172A] dark:text-white">
                        {actionAccountCode?.classification_path?.[level] ?? '-'}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="relative rounded-xl border border-[#EAF0F6] bg-[#F8FBFF] px-3 py-3 text-sm text-[#475569] dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
                  {truncateAiText(toDisplayText(actionAccountCode?.reason), 180) || 'AI account-code rationale will appear here.'}
                </div>
                {canApplyDetailAi && (
                  <Button
                    type="button"
                    className="w-full gap-2 rounded-xl bg-[#A855F7] text-white hover:bg-[#9333EA]"
                    onClick={() => void applyAiAccountCodeSuggestion()}
                    disabled={aiApplyingAccountCode}
                  >
                    <Sparkles className="h-4 w-4" />
                    {aiApplyingAccountCode ? 'Applying...' : 'Add to Budget Line Items'}
                  </Button>
                )}
              </div>
            ) : (
              <EmptyAiActionCard
                description="When the AI can infer a likely GL/account-code match, it will show that recommendation here."
                icon={Sparkles}
              />
            )}
          </div>
        )}

      </div>
  ) : null

  useBeforeUnload((event) => {
    if (!isEditMode || !hasUnsavedChanges) return
    event.preventDefault()
    event.returnValue = ''
  })

  const updateField = <K extends keyof IctBudgetFormValues>(
    field: K,
    value: IctBudgetFormValues[K]
  ) => {
    setFormValues((prev) => ({ ...prev, [field]: value }))
    setFieldErrors((prev) => {
      if (!prev[field]) return prev
      const nextErrors = { ...prev }
      delete nextErrors[field]
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

  const toggleTechnologyProduct = (productId: string) => {
    setFormValues((prev) => ({
      ...prev,
      technologyProductIds: prev.technologyProductIds.includes(productId)
        ? prev.technologyProductIds.filter((id) => id !== productId)
        : [...prev.technologyProductIds, productId],
    }))
  }

  const handleCancelEdit = () => {
    setFormValues(savedFormValues)
    setBudgetLineItems(savedBudgetLineItems)
    setFieldErrors({})
    setUploadedFiles([])
    setIsEditMode(false)
  }

  const handleProtectedNavigation = (event: React.MouseEvent, to: string) => {
    if (isEditMode && hasUnsavedChanges) {
      event.preventDefault()
      setPendingNavigationHref(to)
    }
  }

  useEffect(() => {
    let cancelled = false
    let budgetStage = false

    const loadLookupsAndBudget = async () => {
      setLookupLoading(true)
      setIctBudgetLoading(Boolean(hasDataverseBudgetProject))

      try {
        const [priorityOptions, workStreamOptions, technologyOptions] = await Promise.all([
          getStrategicPriorityOptions(),
          getWorkStreamOptions(),
          getTechnologyCompanies(),
        ])

        if (cancelled) return

        setStrategicPriorities(priorityOptions)
        setWorkStreams(workStreamOptions)
        setTechnologyCompanies(technologyOptions)
        setLookupError(null)
        budgetStage = true

        if (hasDataverseBudgetProject && ictBudgetId) {
          const retrievedBudget = await getIctBudgetDraftById(
            ictBudgetId,
            technologyOptions,
            project.technology.product
              .split(',')
              .map((value) => value.trim())
              .filter(Boolean)
          )

          if (cancelled) return

          setFormValues(retrievedBudget.formValues)
          setSavedFormValues(retrievedBudget.formValues)
          setSavedTechnologyProductNames(retrievedBudget.displayTechnologyProducts)
          setIctBudgetCreatedByName(retrievedBudget.createdByName)
          setIctBudgetCreatedOn(retrievedBudget.createdOn)
          setIctBudgetModifiedOn(retrievedBudget.modifiedOn)
          setIctBudgetRespondentName(retrievedBudget.respondentName)
          setIctBudgetReviewerName(retrievedBudget.reviewerName)
          setIctBudgetApproverName(retrievedBudget.approverName)
          setIctBudgetError(null)
        } else {
          const fallbackFormValues: IctBudgetFormValues = {
            ...INITIAL_ICT_BUDGET_FORM_VALUES,
            initiativeName: project.name,
            plannedStartDate: project.plannedStartDate,
            plannedEndDate: project.plannedEndDate,
            summary: toPlainTextSummary(project.summary),
          }

          setFormValues(fallbackFormValues)
          setSavedFormValues(fallbackFormValues)
          setSavedTechnologyProductNames(
            project.technology.product
              .split(',')
              .map((value) => value.trim())
              .filter(Boolean)
          )
          setIctBudgetCreatedByName(project.submittedBy)
          setIctBudgetCreatedOn(null)
          setIctBudgetModifiedOn(null)
        }
      } catch (error) {
        if (cancelled) return
        const message =
          error instanceof Error ? error.message : 'Unable to load ICT budget details.'
        if (budgetStage) {
          setIctBudgetError(message)
        } else {
          setLookupError(message)
        }
      } finally {
        if (!cancelled) {
          setLookupLoading(false)
          setIctBudgetLoading(false)
        }
      }
    }

    void loadLookupsAndBudget()

    return () => {
      cancelled = true
    }
  }, [hasDataverseBudgetProject, ictBudgetId, project.name, project.plannedEndDate, project.plannedStartDate, project.summary, project.technology.product])

  useEffect(() => {
    if (!ictBudgetId) return
    void refreshPersistedDocumentSummaries()
  }, [ictBudgetId, refreshPersistedDocumentSummaries])

  useEffect(() => {
    if (!ictBudgetId) return
    if (persistedDocumentSummariesLoading) return
    if (budgetOverviewRecord) return
    if (pendingBudgetOverviewRefreshModifiedOn !== null) return
    if (persistedDocumentSummariesError) return

    setPendingBudgetOverviewRefreshModifiedOn(PENDING_NEW_AI_RECORD)
  }, [
    budgetOverviewRecord,
    ictBudgetId,
    pendingBudgetOverviewRefreshModifiedOn,
    persistedDocumentSummariesError,
    persistedDocumentSummariesLoading,
  ])

  useEffect(() => {
    if (!ictBudgetId) return

    const shouldPoll =
      pendingCumulativeRefreshModifiedOn !== null ||
      pendingBudgetOverviewRefreshModifiedOn !== null

    if (!shouldPoll) return

    const intervalId = window.setInterval(() => {
      void refreshPersistedDocumentSummaries({ quiet: true })
    }, 5000)

    return () => window.clearInterval(intervalId)
  }, [
    ictBudgetId,
    pendingBudgetOverviewRefreshModifiedOn,
    pendingCumulativeRefreshModifiedOn,
    refreshPersistedDocumentSummaries,
  ])

  useEffect(() => {
    if (!isEditMode) return
    const activeSignatures = new Set(uploadedFiles.map((file) => getUploadedFileSignature(file)))

    setSupportingDocumentAnalyses((current) => {
      const nextEntries = Object.entries(current).filter(([signature, analysis]) => {
        if (activeSignatures.has(signature)) {
          return true
        }

        if (analysis.status === 'queued' || analysis.status === 'analyzing') {
          return true
        }

        if (analysis.status === 'complete') {
          return !persistedDocumentSummaryByName.has(analysis.fileName.trim().toLowerCase())
        }

        return false
      })
      return Object.fromEntries(nextEntries)
    })
  }, [isEditMode, persistedDocumentSummaryByName, uploadedFiles])

  useEffect(() => {
    if (!isEditMode || uploadedFiles.length === 0) return

    setSupportingDocumentAnalyses((current) => {
      const next = { ...current }
      for (const file of uploadedFiles) {
        const signature = getUploadedFileSignature(file)
        if (!next[signature]) {
          next[signature] = createUploadedSupportingDocumentAnalysis(file)
        }
      }
      return next
    })
  }, [isEditMode, uploadedFiles])

  useEffect(() => {
    if (!isEditMode || !ictBudgetId) return

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
      setDocumentUploadInFlight(true)

      void (async () => {
        try {
          const preparedUpload = await prepareSupportingDocumentFile(file)
          const uploadedFileName = preparedUpload.preparedFile.name.trim().toLowerCase()

          await uploadFilesToRecord(ictBudgetId, [file])

          const refreshedDocs = await refreshSharepointDocs()
          const uploadedDocumentConfirmed = (refreshedDocs ?? []).some((doc) => {
            const name = (doc.fullname || doc.title || '').trim().toLowerCase()
            return name === uploadedFileName
          })

          setSupportingDocumentAnalyses((current) => ({
            ...current,
            [signature]: {
              ...(current[signature] ?? createUploadedSupportingDocumentAnalysis(file)),
              uploadedToSharePoint: uploadedDocumentConfirmed,
              status: 'analyzing',
              error: null,
            },
          }))

          if (uploadedDocumentConfirmed) {
            setUploadedFiles((current) =>
              current.filter((existing) => getUploadedFileSignature(existing) !== signature)
            )
          }

          const response = await evaluateSupportingDocument({ file })
          const nextStatus = response.parsedSummary ? 'complete' : 'error'
          const nextError = response.parsedSummary
            ? null
            : 'The automate response did not contain a usable structured summary.'

          setSupportingDocumentAnalyses((current) => ({
            ...current,
            [signature]: {
              ...(current[signature] ?? createUploadedSupportingDocumentAnalysis(file)),
              status: nextStatus,
              uploadedToSharePoint: true,
              parsedSummary: response.parsedSummary,
              rawSummary: response.summary,
              responseTimeMs: response.responseTimeMs,
              error: nextError,
            },
          }))

          if (response.parsedSummary && response.summary.trim()) {
            await createDocumentSummaryRecords([
              {
                budgetId: ictBudgetId,
                documentName: response.analysisFileName ?? preparedUpload.preparedFile.name,
                documentSummary: response.summary,
              },
            ])
            await syncCumulativeSummaryForBudget(ictBudgetId)
            const [refreshed] = await Promise.all([
              refreshPersistedDocumentSummaries({ quiet: true }),
              refreshSharepointDocs(),
            ])
            setPendingCumulativeRefreshModifiedOn(
              refreshed?.cumulativeRecord?.modifiedOn ?? storedCumulativeSummaryRecord?.modifiedOn ?? null
            )
          }

          setUploadedFiles((current) =>
            current.filter((existing) => getUploadedFileSignature(existing) !== signature)
          )
        } catch (error) {
          setSupportingDocumentAnalyses((current) => ({
            ...current,
            [signature]: {
              ...(current[signature] ?? createUploadedSupportingDocumentAnalysis(file)),
              status: 'error',
              error: error instanceof Error ? error.message : 'Document upload or evaluation failed.',
            },
          }))
        } finally {
          supportingDocumentAnalysisInFlightRef.current.delete(signature)
          setDocumentUploadInFlight(supportingDocumentAnalysisInFlightRef.current.size > 0)
        }
      })()
    }
  }, [ictBudgetId, isEditMode, supportingDocumentAnalyses, uploadedFiles])

  const runDetailAiEvaluations = useCallback(
    async (nameOverride?: string, descriptionOverride?: string) => {
      const projectName = (nameOverride ?? formValues.initiativeName).trim()
      const projectDescription = (descriptionOverride ?? formValues.summary).trim()

      if (!projectName || !projectDescription) {
        setDetailAiSuggestions([])
        setDetailPolicyEvaluationResult(null)
        return
      }

      setDetailAiSuggestionLoading(true)
      setDetailAiSuggestionError(null)
      setDetailPolicyEvaluationLoading(true)
      setDetailPolicyEvaluationError(null)

      try {
        const [suggestions, policy] = await Promise.all([
          getStrategicPrioritySuggestions({
            entityName: detailEntityName,
            projectName,
            projectDescription,
          }),
          evaluateIctBudgetConsiderations({
            entityName: detailEntityName,
            projectName,
            projectDescription,
          }),
        ])

        setDetailAiSuggestions(suggestions.recommendations)
        setDetailPolicyEvaluationResult(policy)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'AI recommendation retrieval failed.'
        setDetailAiSuggestionError(message)
        setDetailPolicyEvaluationError(message)
      } finally {
        setDetailAiSuggestionLoading(false)
        setDetailPolicyEvaluationLoading(false)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [detailEntityName, formValues.initiativeName, formValues.summary]
  )

  useEffect(() => {
    if (persistedDocumentSummariesLoading) {
      return
    }

    const overviewAiData = budgetOverviewRecord?.parsedData as (StoredBudgetOverviewRecord['parsedData'] & {
      budget_policy_alignment?: {
        has_potential_conflict?: boolean
        has_coordination_requirement?: boolean
        has_allowed_with_conditions?: boolean
        summary?: string
        policy_matches?: Array<{
          policy_number?: string
          dge_budget_consideration?: string
          match_type?: string
          relevance_score?: number
          required_action?: string
          strategic_area?: string
          evidence_from_project?: string[]
          reason?: string
        }>
      }
    }) | null
    if (overviewAiData?.strategic_alignment || overviewAiData?.budget_policy_alignment) {
      applyBudgetOverviewAiInsights(overviewAiData)
      return
    }

    const name = formValues.initiativeName.trim()
    const desc = formValues.summary.trim()
    if (!name || !desc) {
      setDetailAiSuggestions([])
      setDetailPolicyEvaluationResult(null)
      return
    }

    let cancelled = false

    void (async () => {
      setDetailAiSuggestionLoading(true)
      setDetailAiSuggestionError(null)
      setDetailPolicyEvaluationLoading(true)
      setDetailPolicyEvaluationError(null)

      try {
        const [suggestions, policy] = await Promise.all([
          getStrategicPrioritySuggestions({
            entityName: detailEntityName,
            projectName: name,
            projectDescription: desc,
          }),
          evaluateIctBudgetConsiderations({
            entityName: detailEntityName,
            projectName: name,
            projectDescription: desc,
          }),
        ])

        if (cancelled) return
        setDetailAiSuggestions(suggestions.recommendations)
        setDetailPolicyEvaluationResult(policy)
      } catch (error) {
        if (cancelled) return
        const message = error instanceof Error ? error.message : 'AI recommendation retrieval failed.'
        setDetailAiSuggestionError(message)
        setDetailPolicyEvaluationError(message)
      } finally {
        if (!cancelled) {
          setDetailAiSuggestionLoading(false)
          setDetailPolicyEvaluationLoading(false)
        }
      }
    })()

    return () => {
      cancelled = true
    }
    // Only re-fire on page load (savedFormValues) or explicit blur triggers
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applyBudgetOverviewAiInsights, budgetOverviewRecord, detailEntityName, formValues.initiativeName, formValues.summary, persistedDocumentSummariesLoading, savedFormValues.initiativeName, savedFormValues.summary])

  const validateForm = () => {
    const nextErrors: IctBudgetFieldErrorMap = {}

    if (!formValues.initiativeName.trim()) {
      nextErrors.initiativeName = 'Initiative / Budget Item Name is required.'
    }
    if (!formValues.strategicPriorityId) {
      nextErrors.strategicPriorityId = 'Strategic Priority is required.'
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

    if (displayedBudgetItems.length === 0) {
      nextErrors.budgetItems = 'Add at least one budget account code before continuing.'
    } else if (displayedBudgetItems.some((item) => item.budgetRequested <= 0)) {
      nextErrors.budgetItems = 'Each budget account code must have a requested budget greater than zero.'
    }

    setFieldErrors(nextErrors)
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

  const saveProjectChanges = async (options?: { exitEditMode?: boolean }) => {
    if (!hasDataverseBudgetProject || !ictBudgetId) {
      showErrorToast(
        'ICT budget unavailable',
        'This project is not linked to a Dataverse ICT budget record.'
      )
      return
    }

    if (!validateForm()) {
      return false
    }

    const shouldInvalidateBudgetOverview =
      hasUnsavedFormFieldChanges || hasUnsavedBudgetAccountCodeChanges

    setSavingIctBudget(true)
    try {
      await runActionToast(
        async () => {
          await updateIctBudgetDraft(ictBudgetId, formValues)
          if (shouldInvalidateBudgetOverview) {
            await invalidateBudgetOverviewRecord(ictBudgetId)
          }

          const originalProductIds = new Set(savedFormValues.technologyProductIds)
          const updatedProductIds = new Set(formValues.technologyProductIds)
          const toAssociate = formValues.technologyProductIds.filter((id) => !originalProductIds.has(id))
          const toDisassociate = savedFormValues.technologyProductIds.filter((id) => !updatedProductIds.has(id))

          if (toAssociate.length > 0 || toDisassociate.length > 0) {
            console.log('[ProjectDetail] Technology product changes detected:', { toAssociate, toDisassociate })
            await Promise.all([
              ...toAssociate.map((productId) => associateTechnologyProduct(ictBudgetId, productId)),
              ...toDisassociate.map((productId) => disassociateTechnologyProduct(ictBudgetId, productId)),
            ])
          }

          const changedBudgetLineItems = budgetLineItems.filter((item) => {
            const savedItem = savedBudgetLineItems.find((saved) => saved.id === item.id)
            return savedItem && savedItem.budgetRequested !== item.budgetRequested
          })

          if (changedBudgetLineItems.length > 0) {
            await Promise.all(
              changedBudgetLineItems.map((item) => updateBudgetLineItemAmount(item.id, item.budgetRequested))
            )
          }

          setSavedFormValues(formValues)
          setSavedBudgetLineItems(budgetLineItems)
          setSavedTechnologyProductNames(
            selectedTechnologyCompany?.products
              .filter((product) => formValues.technologyProductIds.includes(product.id))
              .map((product) => product.name) ?? []
          )
          setIctBudgetError(null)
        },
        {
          processingTitle: 'Saving changes',
          processingDescription: 'Updating the ICT budget record in Dataverse...',
          successTitle: 'Changes saved',
          successDescription: 'The project details have been updated successfully.',
          errorTitle: 'Unable to save changes',
          minDurationMs: 1800,
        }
      )

      if (shouldInvalidateBudgetOverview) {
        const refreshed = await refreshPersistedDocumentSummaries({ quiet: true })
        setPendingBudgetOverviewRefreshModifiedOn(
          refreshed?.budgetOverviewRecord?.modifiedOn ?? budgetOverviewRecord?.modifiedOn ?? null
        )
      }

      if (options?.exitEditMode !== false) {
        setIsEditMode(false)
      }
      return true
    } finally {
      setSavingIctBudget(false)
    }
  }

  const handleSaveEdit = async () => {
    await saveProjectChanges()
  }

  const handleSaveBeforeNavigation = async () => {
    if (!pendingNavigationHref) return

    const saveSucceeded = await saveProjectChanges({ exitEditMode: false })
    if (saveSucceeded) {
      navigate(pendingNavigationHref)
      setPendingNavigationHref(null)
    }
  }

  const handleDiscardAndNavigate = () => {
    if (!pendingNavigationHref) return
    navigate(pendingNavigationHref)
    setPendingNavigationHref(null)
  }

  const handleKeepEditing = () => {
    setPendingNavigationHref(null)
  }

  const syncLocalWorkflowState = (nextStatus: Project['status']) => {
    setProjectData((current) =>
      current
        ? {
            ...current,
            status: nextStatus,
            approvalStatus: nextStatus,
            statusCode: WORKFLOW_STATUSCODE_BY_STATUS[nextStatus] ?? current.statusCode ?? null,
            pendingWith: getWorkflowOwnerByStatusCode(
              WORKFLOW_STATUSCODE_BY_STATUS[nextStatus] ?? current.statusCode ?? null,
              nextStatus
            ),
          }
        : current
    )
  }

  const prepareWorkflowAction = async (action: WorkflowAction) => {
    if (action === 'delete-project') {
      setPendingWorkflowAction(action)
      return
    }

    if (action === 'submit-reviewer') {
      if (!validateForm()) return
      if (sharepointDocsLoading && uploadedFiles.length === 0) {
        showErrorToast(
          'Documents still loading',
          'Please wait for supporting documents to finish loading before submitting to reviewer.'
        )
        return
      }
      if (!hasSupportingDocuments && uploadedFiles.length === 0) {
        showErrorToast(
          'Supporting document required',
          'Upload at least one supporting document before submitting to reviewer.'
        )
        return
      }
    }

    if (isEditMode) {
      try {
        const saveSucceeded = await saveProjectChanges({ exitEditMode: false })
        if (!saveSucceeded) return
      } catch {
        return
      }
    }

    setPendingWorkflowAction(action)
  }

  const handleConfirmWorkflowAction = async () => {
    if (!pendingWorkflowAction || !ictBudgetId) return

    if (pendingWorkflowAction === 'delete-project') {
      await runActionToast(
        async () => {
          await deleteIctBudgetDraft(ictBudgetId)
        },
        {
          processingTitle: 'Deleting project',
          processingDescription: 'Removing the ICT budget record from Dataverse...',
          successTitle: 'Project deleted',
          successDescription: 'The project was deleted successfully.',
          errorTitle: 'Unable to delete project',
          minDurationMs: 1600,
        }
      )
      setPendingWorkflowAction(null)
      navigate(backHref)
      return
    }

    if (pendingWorkflowAction === 'submit-reviewer') {
      if (!validateForm()) return
      if (sharepointDocsLoading) {
        showErrorToast(
          'Documents still loading',
          'Please wait for supporting documents to finish loading before submitting to reviewer.'
        )
        return
      }
      if (!hasSupportingDocuments) {
        showErrorToast(
          'Supporting document required',
          'Upload at least one supporting document before submitting to reviewer.'
        )
        return
      }

      await runActionToast(
        async () => {
          console.log('[ProjectDetail] Submitting ICT budget to reviewer — assigning to Reviewer team, sharing ReadAccess with Respondent team:', {
            ictBudgetId,
            status: ICT_BUDGET_STATUS.underReviewerReview,
            targetOwner: 'Reviewer',
          })
          await updateIctBudgetStatus(
            ictBudgetId,
            ICT_BUDGET_STATUS.underReviewerReview,
            'Reviewer',
            'Respondent',
            'Respondent',
            'A budget item has been submitted to Reviewer for review.'
          )
          await invalidateBudgetOverviewRecord(ictBudgetId)
          syncLocalWorkflowState('Submitted to Reviewer')
          setIsEditMode(false)
        },
        {
          processingTitle: 'Submitting to reviewer',
          processingDescription: 'Validating fields and moving the project into reviewer review...',
          successTitle: 'Submitted to reviewer',
          successDescription: 'The project is now with the reviewer.',
          errorTitle: 'Unable to submit to reviewer',
          minDurationMs: 1800,
        }
      )
      setPendingWorkflowAction(null)
      return
    }

    if (pendingWorkflowAction === 'complete-review') {
      await runActionToast(
        async () => {
          console.log('[ProjectDetail] Completing reviewer assessment without reassignment:', {
            ictBudgetId,
            status: ICT_BUDGET_STATUS.reviewerReviewCompleted,
            actorRole: 'Reviewer',
          })
          await updateIctBudgetStatus(
            ictBudgetId,
            ICT_BUDGET_STATUS.reviewerReviewCompleted,
            undefined,
            undefined,
            'Reviewer'
          )
          await invalidateBudgetOverviewRecord(ictBudgetId)
          syncLocalWorkflowState('Reviewer Review Completed')
          setIsEditMode(false)
        },
        {
          processingTitle: 'Completing review',
          processingDescription: 'Marking the reviewer assessment as completed...',
          successTitle: 'Review completed',
          successDescription: 'The project is ready for reviewer submission to the approver.',
          errorTitle: 'Unable to complete review',
          minDurationMs: 1800,
        }
      )
      setPendingWorkflowAction(null)
      return
    }

    if (pendingWorkflowAction === 'submit-approver') {
      await runActionToast(
        async () => {
          console.log('[ProjectDetail] Submitting ICT budget to approver — assigning to Approver team, sharing ReadAccess with Reviewer team:', {
            ictBudgetId,
            status: ICT_BUDGET_STATUS.underApproverReview,
            targetOwner: 'Approver',
          })
          await updateIctBudgetStatus(
            ictBudgetId,
            ICT_BUDGET_STATUS.underApproverReview,
            'Approver',
            'Reviewer',
            'Reviewer',
            'A budget item has been submitted to Approver for final review.'
          )
          await invalidateBudgetOverviewRecord(ictBudgetId)
          syncLocalWorkflowState('Submitted to Approver')
          setIsEditMode(false)
        },
        {
          processingTitle: 'Submitting to approver',
          processingDescription: hasCycleDgeSubmission
            ? 'Moving the project directly into approver review without the extra reviewer-completed stage...'
            : 'Moving the project into approver review...',
          successTitle: 'Submitted to approver',
          successDescription: 'The project is now with the approver.',
          errorTitle: 'Unable to submit to approver',
          minDurationMs: 1800,
        }
      )
      setPendingWorkflowAction(null)
      return
    }

    await runActionToast(
      async () => {
        if (approverUsesDirectDgeFlow) {
          console.log('[ProjectDetail] Directly submitting ICT budget to DGE from approver stage:', {
            ictBudgetId,
            status: ICT_BUDGET_STATUS.underDgeReview,
            targetOwner: 'Strategy',
          })
          await updateIctBudgetStatus(
            ictBudgetId,
            ICT_BUDGET_STATUS.underDgeReview,
            'Strategy',
            'Approver',
            'Approver',
            'A budget item has been submitted to DGE for strategic alignment review.'
          )
          await invalidateBudgetOverviewRecord(ictBudgetId)
          syncLocalWorkflowState('Submitted to DGE')
        } else {
          console.log('[ProjectDetail] Approving ICT budget without owner reassignment:', {
            ictBudgetId,
            status: ICT_BUDGET_STATUS.approvedByApprover,
          })
          await updateIctBudgetStatus(
            ictBudgetId,
            ICT_BUDGET_STATUS.approvedByApprover,
            undefined,
            'Approver',
            'Approver'
          )
          await invalidateBudgetOverviewRecord(ictBudgetId)
          syncLocalWorkflowState('Approved')
        }
        setIsEditMode(false)
      },
      {
        processingTitle: approverUsesDirectDgeFlow ? 'Submitting to DGE' : 'Approving project',
        processingDescription: approverUsesDirectDgeFlow
          ? 'Submitting the ICT budget directly into DGE strategic alignment review...'
          : 'Marking the ICT budget as approved by the approver...',
        successTitle: approverUsesDirectDgeFlow ? 'Submitted to DGE' : 'Project approved',
        successDescription: approverUsesDirectDgeFlow
          ? 'The project has been sent directly to DGE successfully.'
          : 'The project has been approved successfully.',
        errorTitle: approverUsesDirectDgeFlow ? 'Unable to submit to DGE' : 'Unable to approve project',
        minDurationMs: 1800,
      }
    )
    setPendingWorkflowAction(null)
  }

  const handleCreateWorkStream = async () => {
    const trimmedName = newWorkStreamName.trim()
    if (!trimmedName) {
      showErrorToast('Work stream name required', 'Enter a work stream name before creating it.')
      return
    }

    const created = await runActionToast(() => createWorkStream(trimmedName), {
      processingTitle: 'Creating work stream',
      processingDescription: 'Saving the new work stream to Dataverse...',
      successTitle: 'Work stream created',
      successDescription: 'The new work stream is now available in the dropdown.',
      errorTitle: 'Work stream creation failed',
    })

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
        processingDescription:
          'Creating the product and associating it with the selected company...',
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

  function applyAiFieldSuggestion(
    field: SupportingDocumentSuggestedProjectField,
    suppressRefresh = false,
  ) {
    const result = resolveManualAiFieldSuggestion(field, technologyCompanies)

    if (result.error) {
      showErrorToast('Suggestion not applied', result.error)
      return
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

    if (result.patch.activityType !== undefined) {
      handleActivityTypeChange(result.patch.activityType as ActivityType)
    }

    if (!suppressRefresh && result.appliedName?.trim() && formValues.summary.trim()) {
      setSavedFormValues((prev) => ({ ...prev, initiativeName: result.appliedName ?? prev.initiativeName }))
    }
  }

  function applyAllAiFieldSuggestions() {
    const aggregatedPatch: Partial<IctBudgetFormValues> = {}
    const failedMessages: string[] = []

    for (const field of actionSuggestedFields) {
      const result = resolveManualAiFieldSuggestion(field, technologyCompanies)
      if (result.error) {
        failedMessages.push(result.error)
        continue
      }
      Object.assign(aggregatedPatch, result.patch)
    }

    if (Object.keys(aggregatedPatch).length > 0) {
      setFormValues((prev) => {
        if (aggregatedPatch.activityType === undefined) {
          return {
            ...prev,
            ...aggregatedPatch,
          }
        }

        const nextVisibleFields = getVisibleBudgetFields(
          aggregatedPatch.activityType as ActivityType
        )

        return {
          ...prev,
          ...aggregatedPatch,
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
        }
      })

      setFieldErrors((prev) => {
        const nextErrors = { ...prev }
        Object.keys(aggregatedPatch).forEach((key) => {
          delete nextErrors[key as keyof IctBudgetFieldErrorMap]
        })
        if (aggregatedPatch.technologyCompanyId !== undefined) {
          delete nextErrors.technologyProductIds
        }
        if (aggregatedPatch.activityType !== undefined) {
          delete nextErrors.activityType
          delete nextErrors.totalBudgetPaidPreviousYear
          delete nextErrors.totalBudgetPayableFutureYear
          delete nextErrors.totalBudgetPayableNextYear
          delete nextErrors.totalBudgetPayableForYearAfterNext
        }
        return nextErrors
      })
    }

    if (failedMessages.length > 0) {
      showErrorToast(
        'Some suggestions could not be applied',
        failedMessages.join('\n')
      )
    }
  }

  function applyAiSuggestion(
    suggestion: MatchedAiSuggestion,
    mode: 'both' | 'priority' | 'classification'
  ) {
    const resolved = resolveStrategicSuggestionSelection(suggestion, strategicPriorities)
    const nextPriorityId =
      mode === 'priority' || mode === 'both'
        ? resolved.priorityId
        : resolved.classificationParentId ?? formValues.strategicPriorityId
    const nextClassificationId =
      mode === 'priority'
        ? ''
        : resolved.classificationId ?? ''

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

  async function applyAiAccountCodeSuggestion(suggestion?: (typeof actionAccountCodes)[number]) {
    if (!suggestion) return

    setAiApplyingAccountCode(true)

    try {
      const classificationRecords = await getClassificationRecords()
      const { nodeMap } = buildClassificationTree(classificationRecords)
      const draft = buildBudgetItemDraftFromSuggestedAccountCode(suggestion, nodeMap)
      if (!draft) {
        showErrorToast(
          'Account code not found',
          `No GL account matching "${suggestion.rawAccountLabel}" was found in the classification tree.`
        )
        return
      }

      const existingIds = new Set(displayedBudgetItems.map((item) => item.id))
      if (existingIds.has(draft.id)) {
        showErrorToast('Already added', 'This account code is already in the budget line items.')
        return
      }

      const nextBudgetLineItem: BudgetLineItemRecord = {
        id: draft.id,
        budgetId: ictBudgetId ?? null,
        classificationId: draft.id,
        accountName: draft.accountName,
        l1: draft.l1,
        l2: draft.l2,
        l3: draft.l3,
        accountGroup: draft.accountGroup,
        description: draft.description,
        expenseTypeValue: draft.expenseTypeValue,
        expenseTypeLabel: draft.expenseTypeLabel,
        ebsCode: draft.ebsCode,
        fusionCode: draft.fusionCode,
        budgetRequested: suggestion.mappedBudget,
      }

      setBudgetLineItems((prev) => [...prev, nextBudgetLineItem])
      setBudgetItemsError(null)
      setFieldErrors((prev) => {
        const next = { ...prev }
        delete next.budgetItems
        return next
      })
    } catch (error) {
      showErrorToast(
        'Apply failed',
        error instanceof Error ? error.message : 'Could not apply the account code suggestion.'
      )
    } finally {
      setAiApplyingAccountCode(false)
    }
  }

  async function applySelectedDetailSuggestions() {
    const selectedRows = detailSuggestionRows.filter((row) => selectedDetailSuggestionIds.includes(row.id))
    if (selectedRows.length === 0) {
      showErrorToast('No suggestions selected', 'Select at least one suggestion before applying.')
      return
    }

    setDetailSuggestionApplyLoading(true)

    try {
      const selectedFields = selectedRows
        .filter((row): row is DetailSuggestionRow & { field: SupportingDocumentSuggestedProjectField } => row.kind === 'field' && Boolean(row.field))
        .map((row) => row.field)
      const selectedAccountCodes = selectedRows
        .filter((row): row is DetailSuggestionRow & { accountCodeSuggestion: ComputedSupportingDocumentAccountCodeSuggestion } => row.kind === 'account-code' && Boolean(row.accountCodeSuggestion))
        .map((row) => row.accountCodeSuggestion)
      const failedMessages: string[] = []

      selectedFields.forEach((field) => {
        const result = resolveManualAiFieldSuggestion(field, technologyCompanies)
        if (result.error) {
          failedMessages.push(result.error)
          return
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
      })

      if (selectedAccountCodes.length > 0) {
        const classificationRecords = await getClassificationRecords()
        const { nodeMap } = buildClassificationTree(classificationRecords)
        const existingIds = new Set(displayedBudgetItems.map((item) => item.id))
        const draftsToAdd: BudgetLineItemRecord[] = []

        selectedAccountCodes.forEach((suggestion) => {
          const draft = buildBudgetItemDraftFromSuggestedAccountCode(suggestion, nodeMap)
          if (!draft) {
            failedMessages.push(`No GL account matching "${suggestion.rawAccountLabel}" was found in the classification tree.`)
            return
          }
          if (existingIds.has(draft.id) || draftsToAdd.some((item) => item.id === draft.id)) {
            return
          }

          draftsToAdd.push({
            id: draft.id,
            budgetId: ictBudgetId ?? null,
            classificationId: draft.id,
            accountName: draft.accountName,
            l1: draft.l1,
            l2: draft.l2,
            l3: draft.l3,
            accountGroup: draft.accountGroup,
            description: draft.description,
            expenseTypeValue: draft.expenseTypeValue,
            expenseTypeLabel: draft.expenseTypeLabel,
            ebsCode: draft.ebsCode,
            fusionCode: draft.fusionCode,
            budgetRequested: suggestion.mappedBudget,
          })
        })

        if (draftsToAdd.length > 0) {
          setBudgetLineItems((prev) => [...prev, ...draftsToAdd])
          setBudgetItemsError(null)
          setFieldErrors((prev) => {
            const next = { ...prev }
            delete next.budgetItems
            return next
          })
        }
      }

      if (failedMessages.length > 0) {
        showErrorToast('Some suggestions could not be applied', failedMessages.join('\n'))
      }
    } catch (error) {
      showErrorToast(
        'Suggestions not applied',
        error instanceof Error ? error.message : 'Could not apply the selected suggestions.'
      )
    } finally {
      setDetailSuggestionApplyLoading(false)
    }
  }

  const persistUploadedDocumentSummariesForBudget = async (budgetId: string) => {
    const completedUploads = uploadedFiles
      .map((file) => {
        const signature = getUploadedFileSignature(file)
        const analysis = supportingDocumentAnalyses[signature]
        if (analysis?.status !== 'complete' || !analysis.rawSummary?.trim()) {
          return null
        }

        return {
          file,
          rawSummary: analysis.rawSummary,
        }
      })
      .filter(Boolean) as Array<{ file: File; rawSummary: string }>

    if (completedUploads.length === 0) {
      return
    }

    await createDocumentSummaryRecords(
      completedUploads.map((item) => ({
        budgetId,
        documentName: item.file.name,
        documentSummary: item.rawSummary,
      }))
    )
  }

  const syncCumulativeSummaryForBudget = async (budgetId: string) => {
    await invalidateCumulativeSummaryRecord(budgetId)
  }

  // ── Clarification State ──────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false

    const loadClarifications = async () => {
      if (!ictBudgetId) {
        setLocalClarifications(project.clarifications)
        return
      }

      setClarificationsLoading(true)

      try {
        const clarifications = await getClarificationsByBudgetId(ictBudgetId)
        if (!cancelled) {
          setLocalClarifications(clarifications)
        }
      } catch (error) {
        console.error('[ProjectDetail] Failed to load clarifications:', error)
        if (!cancelled) {
          setLocalClarifications([])
        }
      } finally {
        if (!cancelled) {
          setClarificationsLoading(false)
        }
      }
    }

    void loadClarifications()

    return () => {
      cancelled = true
    }
  }, [ictBudgetId, project.clarifications])

  const handleDeleteDocument = async (doc: WebApiPortalDocument) => {
    if (doc.sharepointdocumentid.startsWith('clarification-url:')) {
      return
    }
    if (ictBudgetId) {
      setSupportingDocumentCumulativeAnalysis((current) => ({
        ...current,
        status: 'analyzing',
        error: null,
        sourceFileCount: Math.max(
          current.sourceFileCount > 0 ? current.sourceFileCount - 1 : persistedDocumentSummaries.length - 1,
          0
        ),
      }))
    }
    await deleteSharePointDocument(doc)
    if (ictBudgetId && doc.fullname) {
      await deleteDocumentSummaryRecordsByDocumentName(ictBudgetId, doc.fullname)
      await syncCumulativeSummaryForBudget(ictBudgetId)
      const refreshed = await refreshPersistedDocumentSummaries({ quiet: true })
      setPendingCumulativeRefreshModifiedOn(
        refreshed?.cumulativeRecord?.modifiedOn ?? storedCumulativeSummaryRecord?.modifiedOn ?? null
      )
    }
    setSharepointDocs((prev) => prev.filter((d) => d.sharepointdocumentid !== doc.sharepointdocumentid))
  }

  const handleDeleteDetailInsightItem = useCallback(
    async (item: SupportingDocumentAiInsightItem) => {
      const documentName = item.file.name.trim().toLowerCase()
      const mappedDoc = aiSupportingDocumentByName.get(documentName)
      if (!mappedDoc) {
        return
      }

      await handleDeleteDocument(mappedDoc)
    },
    [aiSupportingDocumentByName, handleDeleteDocument]
  )

  const refreshSharepointDocs = async () => {
    if (!ictBudgetId) return []
    try {
      const docs = await retrieveSharePointDocumentsByBudget(ictBudgetId)
      setSharepointDocs(docs)
      return docs
    } catch (err) {
      console.error('[ProjectDetail] Failed to refresh SharePoint docs:', err)
      return []
    }
  }

  const submitClarificationReply = (
    clarificationId: string,
    message: string,
    files?: File[],
    returnToRole?: 'Reviewer' | 'Approver'
  ) => {
    if (!ictBudgetId) {
      setLocalClarifications((prev) =>
        prev.map((clarification) => {
          if (clarification.id !== clarificationId) return clarification
          const newReply: ClarificationReply = {
            id: `${clarificationId}-R${clarification.replies.length + 1}`,
            fromRole: currentRole,
            fromRoleLabel:
              currentRole === 'Reviewer'
                ? 'ICT - Reviewer'
                : currentRole === 'Approver'
                  ? 'Approver'
                  : 'Respondent',
            fromName: currentUser.name,
            message,
            date: new Date().toISOString().split('T')[0],
          }
          return { ...clarification, replies: [...clarification.replies, newReply] }
        }),
      )
      showSuccessToast('Reply sent', 'Your response has been added to the clarification thread.')
      return
    }

    void runActionToast(
      async () => {
        await addClarificationReply({
          budgetId: ictBudgetId,
          parentClarificationId: clarificationId,
          message,
          currentRole,
          files,
        })

        if (currentRole === 'Respondent' && returnToRole) {
          const nextStatus =
            returnToRole === 'Reviewer'
              ? ICT_BUDGET_STATUS.underReviewerReview
              : ICT_BUDGET_STATUS.underApproverReview
          const nextProjectStatus =
            returnToRole === 'Reviewer'
              ? 'Submitted to Reviewer'
              : 'Submitted to Approver'

          console.log('[ProjectDetail] Respondent first clarification reply submitted — returning ICT budget to governance owner:', {
            ictBudgetId,
            clarificationId,
            returnToRole,
            status: nextStatus,
            targetOwner: returnToRole,
          })

          await updateIctBudgetStatus(
            ictBudgetId,
            nextStatus,
            returnToRole,
            'Respondent',
            'Respondent',
            returnToRole === 'Reviewer'
              ? 'A clarification response has been submitted back to Reviewer.'
              : 'A clarification response has been submitted back to Approver.'
          )
          await invalidateBudgetOverviewRecord(ictBudgetId)
          syncLocalWorkflowState(nextProjectStatus)
        }

        const clarifications = await getClarificationsByBudgetId(ictBudgetId)
        setLocalClarifications(clarifications)
        if (files?.length) void refreshSharepointDocs()
      },
      {
        processingTitle: 'Sending reply',
        processingDescription: 'Adding your response to the clarification thread...',
        successTitle: 'Reply sent',
        successDescription: 'Your response has been added to the clarification thread.',
        errorTitle: 'Unable to send reply',
        minDurationMs: 1200,
      }
    )
  }

  const handleClarificationReply = (clarificationId: string, message: string, files?: File[]) => {
    const clarification = localClarifications.find((item) => item.id === clarificationId)
    const firstReplyReturnToRole =
      clarification?.raisedBy === 'Reviewer' || clarification?.raisedBy === 'Approver'
        ? clarification.raisedBy
        : null
    const isRespondentFirstReply =
      currentRole === 'Respondent' &&
      clarification &&
      firstReplyReturnToRole &&
      clarification.replies.length === 0

    if (isRespondentFirstReply) {
      setPendingClarificationReply({
        clarificationId,
        message,
        files,
        returnToRole: firstReplyReturnToRole,
      })
      return
    }

    submitClarificationReply(clarificationId, message, files)
  }

  const handleConfirmClarificationReplyHandoff = () => {
    if (!pendingClarificationReply) return

    const { clarificationId, message, files, returnToRole } = pendingClarificationReply
    setPendingClarificationReply(null)
    submitClarificationReply(clarificationId, message, files, returnToRole)
  }

  const handleClarificationClose = (clarificationId: string) => {
    if (!ictBudgetId) {
      setLocalClarifications((prev) =>
        prev.map((clarification) =>
          clarification.id !== clarificationId
            ? clarification
            : { ...clarification, status: 'Closed' as const, closedAt: new Date().toISOString().split('T')[0] },
        ),
      )
      showSuccessToast('Clarification closed', 'This clarification has been closed and the respondent has been notified.')
      return
    }

    void runActionToast(
      async () => {
        await closeClarification(clarificationId)
        const clarifications = await getClarificationsByBudgetId(ictBudgetId)
        setLocalClarifications(clarifications)
      },
      {
        processingTitle: 'Closing clarification',
        processingDescription: 'Marking this clarification thread as closed...',
        successTitle: 'Clarification closed',
        successDescription: 'This clarification has been closed and the respondent has been notified.',
        errorTitle: 'Unable to close clarification',
        minDurationMs: 1200,
      }
    )
  }

  const handleRaiseClarification = ({ message, files }: { message: string; files?: File[] }) => {
    const raisedByRole = isApproverView ? 'Approver' : 'Reviewer'

    if (!ictBudgetId) {
      const newClarification: Clarification = {
        id: `CLR-${Date.now()}`,
        raisedBy: raisedByRole,
        raisedByLabel: raisedByRole === 'Reviewer' ? 'ICT - Reviewer' : 'Approver',
        raisedByName: currentUser.name,
        raisedTo: 'Respondent',
        message,
        status: 'Open',
        date: new Date().toISOString().split('T')[0],
        replies: [],
      }
      setLocalClarifications((prev) => [newClarification, ...prev])
      showSuccessToast('Clarification raised', 'The respondent has been notified and will see this in their review form.')
      return
    }

    void runActionToast(
      async () => {
        await raiseBudgetClarification({
          budgetId: ictBudgetId,
          message,
          raisedByRole,
          files,
        })
        console.log('[ProjectDetail] Raising clarification — assigning ICT budget back to Respondent team' + (raisedByRole === 'Approver' ? ', sharing ReadAccess with Approver team' : '') + ':', {
          ictBudgetId,
          raisedByRole,
          status: ICT_BUDGET_STATUS.clarificationPending,
          targetOwner: 'Respondent',
        })
        await updateIctBudgetStatus(
          ictBudgetId,
          ICT_BUDGET_STATUS.clarificationPending,
          'Respondent',
          raisedByRole,
          raisedByRole,
          raisedByRole === 'Reviewer'
            ? 'A budget item has been returned to Respondent for clarification.'
            : 'A budget item has been returned to Respondent for approver clarification.'
        )
        await invalidateBudgetOverviewRecord(ictBudgetId)
        const clarifications = await getClarificationsByBudgetId(ictBudgetId)
        setLocalClarifications(clarifications)
        if (files?.length) void refreshSharepointDocs()
        syncLocalWorkflowState('Clarification Required')
      },
      {
        processingTitle: 'Raising clarification',
        processingDescription: 'Opening the clarification thread and returning the project to the respondent...',
        successTitle: 'Clarification raised',
        successDescription: 'The respondent has been notified and the project is now awaiting clarification.',
        errorTitle: 'Unable to raise clarification',
        minDurationMs: 1500,
      }
    )
  }

  const showClarificationSection = clarificationsLoading || localClarifications.length > 0 || isGovernanceView

  // ── Section navigation ───────────────────────────────────────────────────────
  const displayedBudgetItems = hasDataverseBudgetProject ? budgetLineItems : fallbackBudgetItems
  const pendingActionAccountCodes = useMemo(
    () =>
      actionAccountCodes.filter((suggestion) => {
        const normalizedAccountName = suggestion.accountName.trim().toLowerCase()
        const normalizedAccountCode = suggestion.accountCode.trim().toLowerCase()
        const normalizedRawLabel = suggestion.rawAccountLabel.trim().toLowerCase()
        const normalizedDisplayLabel = suggestion.displayLabel.trim().toLowerCase()

        return !displayedBudgetItems.some((item) => {
          const accountName = item.accountName.trim().toLowerCase()
          const ebsCode = (item.ebsCode ?? '').trim().toLowerCase()
          const fusionCode = (item.fusionCode ?? '').trim().toLowerCase()

          return (
            accountName === normalizedAccountName ||
            accountName === normalizedRawLabel ||
            accountName === normalizedDisplayLabel ||
            accountName.includes(normalizedAccountName) ||
            normalizedAccountName.includes(accountName) ||
            accountName.includes(normalizedDisplayLabel) ||
            normalizedDisplayLabel.includes(accountName) ||
            ebsCode === normalizedAccountCode ||
            fusionCode === normalizedAccountCode ||
            ebsCode === normalizedDisplayLabel ||
            fusionCode === normalizedDisplayLabel
          )
        })
      }),
    [actionAccountCodes, displayedBudgetItems]
  )

  async function applyPendingAiAccountCodeSuggestions() {
    if (pendingActionAccountCodes.length === 0) return

    setAiApplyingAccountCode(true)

    try {
      const classificationRecords = await getClassificationRecords()
      const { nodeMap } = buildClassificationTree(classificationRecords)
      const existingIds = new Set(displayedBudgetItems.map((item) => item.id))
      const nextBudgetLineItems: BudgetLineItemRecord[] = []
      const failedMessages: string[] = []

      for (const suggestion of pendingActionAccountCodes) {
        const draft = buildBudgetItemDraftFromSuggestedAccountCode(suggestion, nodeMap)
        if (!draft) {
          failedMessages.push(`No GL account matching "${suggestion.rawAccountLabel}" was found.`)
          continue
        }
        if (existingIds.has(draft.id)) {
          continue
        }

        existingIds.add(draft.id)
        nextBudgetLineItems.push({
          id: draft.id,
          budgetId: ictBudgetId ?? null,
          classificationId: draft.id,
          accountName: draft.accountName,
          l1: draft.l1,
          l2: draft.l2,
          l3: draft.l3,
          accountGroup: draft.accountGroup,
          description: draft.description,
          expenseTypeValue: draft.expenseTypeValue,
          expenseTypeLabel: draft.expenseTypeLabel,
          ebsCode: draft.ebsCode,
          fusionCode: draft.fusionCode,
          budgetRequested: suggestion.mappedBudget,
        })
      }

      if (nextBudgetLineItems.length > 0) {
        setBudgetLineItems((prev) => [...prev, ...nextBudgetLineItems])
        setBudgetItemsError(null)
        setFieldErrors((prev) => {
          const next = { ...prev }
          delete next.budgetItems
          return next
        })
      }

      if (nextBudgetLineItems.length === 0 && failedMessages.length === 0) {
        showErrorToast('Already added', 'All suggested account codes are already in the budget line items.')
      } else if (failedMessages.length > 0) {
        showErrorToast('Some account codes could not be applied', failedMessages.join('\n'))
      }
    } catch (error) {
      showErrorToast(
        'Apply failed',
        error instanceof Error ? error.message : 'Could not apply the account code suggestions.'
      )
    } finally {
      setAiApplyingAccountCode(false)
      setOpenAiAssistField(null)
    }
  }

  function buildBudgetAccountCodesAssist() {
    const firstPendingSuggestion = pendingActionAccountCodes[0]
    if (!firstPendingSuggestion) return null

    const suggestionLabel = pendingActionAccountCodes
      .map((suggestion) => suggestion.displayLabel)
      .join('\n')

    return (
      <AiFieldAssistTrigger
        fieldLabel="Budget Account Codes"
        suggestedValue={suggestionLabel}
        isOpen={openAiAssistField === 'budgetItems'}
        canApply={isEditMode}
        onToggle={() => setOpenAiAssistField((current) => (current === 'budgetItems' ? null : 'budgetItems'))}
        onApply={() => void applyPendingAiAccountCodeSuggestions()}
        helperText="Switch the form to Edit mode to add the AI-suggested account codes from here."
      />
    )
  }
  const budgetTotal = hasDataverseBudgetProject
    ? displayedBudgetItems.reduce((total, item) => total + item.budgetRequested, 0)
    : project.requestedBudget
  const existingBudgetDrafts = useMemo<BudgetItemDraft[]>(
    () =>
      displayedBudgetItems
        .filter((item) => item.classificationId)
        .map((item) => toBudgetItemDraft(item)),
    [displayedBudgetItems]
  )

  useEffect(() => {
    let cancelled = false

    if (!hasDataverseBudgetProject) {
      setBudgetLineItems([])
      setSavedBudgetLineItems([])
      setBudgetItemsError(null)
      setBudgetItemsLoading(false)
      return
    }

    const loadBudgetLineItems = async () => {
      setBudgetItemsLoading(true)
      try {
        const items = await getBudgetLineItemsByBudgetId(ictBudgetId!)
        if (cancelled) return
        setBudgetLineItems(items)
        setSavedBudgetLineItems(items)
        setBudgetItemsError(null)
      } catch (error) {
        if (cancelled) return
        setBudgetLineItems([])
        setSavedBudgetLineItems([])
        setBudgetItemsError(error instanceof Error ? error.message : 'Unable to load budget line items.')
      } finally {
        if (!cancelled) {
          setBudgetItemsLoading(false)
        }
      }
    }

    void loadBudgetLineItems()

    return () => {
      cancelled = true
    }
  }, [hasDataverseBudgetProject, ictBudgetId])

  // ── Load SharePoint documents ────────────────────────────────────────────────
  useEffect(() => {
    if (!ictBudgetId) return
    let cancelled = false
    setSharepointDocsLoading(true)
    retrieveSharePointDocumentsByBudget(ictBudgetId)
      .then((docs) => { if (!cancelled) setSharepointDocs(docs) })
      .catch((err: unknown) => {
        console.error('[ProjectDetail] Failed to load SharePoint docs:', err)
        if (!cancelled) setSharepointDocs([])
      })
      .finally(() => { if (!cancelled) setSharepointDocsLoading(false) })
    return () => { cancelled = true }
  }, [ictBudgetId])

  useEffect(() => {
    if (!showLogs) return

    if (!ictBudgetId) {
      setAuditLogs([])
      setAuditLogsError(null)
      setAuditLogsLoading(false)
      return
    }

    let cancelled = false

    const loadAuditLogs = async () => {
      setAuditLogsLoading(true)
      setAuditLogsError(null)

      try {
        const logs = await getAuditLogsByBudgetId(ictBudgetId)
        if (cancelled) return
        setAuditLogs(logs)
      } catch (error) {
        if (cancelled) return
        setAuditLogs([])
        setAuditLogsError(error instanceof Error ? error.message : 'Unable to load audit logs.')
      } finally {
        if (!cancelled) {
          setAuditLogsLoading(false)
        }
      }
    }

    void loadAuditLogs()

    return () => {
      cancelled = true
    }
  }, [showLogs, ictBudgetId])

  const handleCreateBudgetItems = async (items: BudgetItemDraft[]) => {
    if (!hasDataverseBudgetProject) {
      showErrorToast('Budget items unavailable', 'This project is not linked to a Dataverse ICT budget record.')
      return
    }

    const createdItems = await runActionToast(
      async () => {
        await createBudgetLineItems(ictBudgetId!, items)
        await invalidateBudgetOverviewRecord(ictBudgetId!)
        const refreshedItems = await getBudgetLineItemsByBudgetId(ictBudgetId!)
        setBudgetLineItems(refreshedItems)
        setSavedBudgetLineItems(refreshedItems)
        setBudgetItemsError(null)
        setFieldErrors((current) => {
          if (!current.budgetItems) return current
          const next = { ...current }
          delete next.budgetItems
          return next
        })
        return refreshedItems
      },
      {
        processingTitle: 'Creating budget line items',
        processingDescription: 'Saving the selected GL codes and refreshing the budget grid.',
        successTitle: 'Budget line items created',
        successDescription: `${items.length} budget line item${items.length > 1 ? 's were' : ' was'} added successfully.`,
        errorTitle: 'Unable to create budget line items',
      }
    )

    setBudgetLineItems(createdItems)
    setSavedBudgetLineItems(createdItems)
  }

  const handleBudgetRequestedChange = (lineItemId: string, amount: number) => {
    setBudgetLineItems((current) =>
      current.map((item) =>
        item.id === lineItemId ? { ...item, budgetRequested: amount } : item
      )
    )
    setFieldErrors((current) => {
      if (!current.budgetItems) return current
      const next = { ...current }
      delete next.budgetItems
      return next
    })
  }

  const handleConfirmDeleteBudgetLineItem = async () => {
    if (!lineItemToDelete) return

    const lineItemId = lineItemToDelete.id
    setDeletingBudgetLineItemId(lineItemId)

    try {
      await runActionToast(
        async () => {
          await deleteBudgetLineItem(lineItemId)
          await invalidateBudgetOverviewRecord(ictBudgetId!)
          setBudgetLineItems((current) => current.filter((item) => item.id !== lineItemId))
          setSavedBudgetLineItems((current) => current.filter((item) => item.id !== lineItemId))
        },
        {
          processingTitle: 'Deleting budget line item',
          processingDescription: 'Removing the selected line item from this project budget.',
          successTitle: 'Budget line item deleted',
          successDescription: 'The selected line item was removed successfully.',
          errorTitle: 'Unable to delete budget line item',
          minDurationMs: 1800,
        }
      )
      setLineItemToDelete(null)
    } finally {
      setDeletingBudgetLineItemId(null)
    }
  }

  const visibleSectionIds = [
    'sec-details',
    'sec-timelines',
    'sec-summary',
    'sec-budget',
    ...(!isEditMode ? ['sec-documents'] : []),
    ...(showClarificationSection ? ['sec-clarifications'] : []),
  ]

  const [activeSection, setActiveSection] = useState('sec-details')

  const scrollToSection = (sectionId: string) => {
    const target = document.getElementById(sectionId)
    if (!target) return

    const navbarOffset = 88
    const top = target.getBoundingClientRect().top + window.scrollY - navbarOffset
    window.scrollTo({ top, behavior: 'smooth' })
  }

  useEffect(() => {
    const updateActiveSection = () => {
      const navbarBottom = 64
      const usableMiddle = navbarBottom + (window.innerHeight - navbarBottom) / 2
      const candidates = visibleSectionIds
        .map((sid) => {
          const element = document.getElementById(sid)
          if (!element) return null
          const rect = element.getBoundingClientRect()
          const sectionMiddle = rect.top + rect.height / 2
          const containsMiddle = rect.top <= usableMiddle && rect.bottom >= usableMiddle
          return {
            id: sid,
            distance: containsMiddle ? 0 : Math.abs(sectionMiddle - usableMiddle),
          }
        })
        .filter(Boolean) as { id: string; distance: number }[]

      const closest = candidates.sort((a, b) => a.distance - b.distance)[0]
      if (closest) setActiveSection(closest.id)
    }

    updateActiveSection()
    window.addEventListener('scroll', updateActiveSection, { passive: true })
    window.addEventListener('resize', updateActiveSection)
    return () => {
      window.removeEventListener('scroll', updateActiveSection)
      window.removeEventListener('resize', updateActiveSection)
    }
  }, [isEditMode, showClarificationSection, visibleSectionIds.join('|')])

  // ── Display values (from saved form after edit, or original project) ─────────
  const savedStrategicPriority =
    topLevelStrategicPriorities.find(
      (priority) => priority.id === savedFormValues.strategicPriorityId
    ) ?? null
  const savedStrategicPriorityClassification =
    strategicPriorities.find(
      (priority) => priority.id === savedFormValues.strategicPriorityClassificationId
    ) ?? null
  const savedWorkStream =
    workStreams.find((workStream) => workStream.id === savedFormValues.workStreamId) ?? null
  const savedTechnologyCompany =
    technologyCompanies.find(
      (company) => company.id === savedFormValues.technologyCompanyId
    ) ?? null
  const savedTechnologyProductLabel =
    savedTechnologyProductNames.length > 0
      ? savedTechnologyProductNames.join(', ')
      : project.technology.product || '-'
  const savedBudgetItemTypeLabel =
    BUDGET_ITEM_TYPE_OPTIONS.find((option) => option.value === savedFormValues.budgetItemType)?.label ??
    '-'
  const savedCategoryLabel =
    CATEGORY_OPTIONS.find((option) => option.value === savedFormValues.category)?.label ?? '-'
  const savedActivityTypeLabel =
    ACTIVITY_TYPE_OPTIONS.find((option) => option.value === savedFormValues.activityType)?.title ?? '-'
  const headerCreatedBy = ictBudgetCreatedByName || project.submittedBy
  const creationCreatedOnLabel = ictBudgetCreatedOn
    ? ictBudgetCreatedOn
    : project.submittedDate
  const creationModifiedOnLabel = ictBudgetModifiedOn
    ? ictBudgetModifiedOn
    : project.lastModified
  const resolvedStatusLabel = project.status

  const display = {
    budgetRefId: project.id,
    name: savedFormValues.initiativeName || project.name,
    strategicPriority: savedStrategicPriority?.name || project.strategicPriority,
    classification: savedStrategicPriorityClassification?.name || project.classification,
    workStream: savedWorkStream?.name || project.workStream,
    budgetType: savedBudgetItemTypeLabel,
    category: savedCategoryLabel,
    budgetActivityType: savedActivityTypeLabel,
    technologyCompany: savedTechnologyCompany?.name || project.technology.company,
    technologyProduct: savedTechnologyProductLabel,
    plannedStartDate: savedFormValues.plannedStartDate
      ? format(new Date(`${savedFormValues.plannedStartDate}T00:00:00`), 'MMM d, yyyy')
      : project.plannedStartDate,
    plannedEndDate: savedFormValues.plannedEndDate
      ? format(new Date(`${savedFormValues.plannedEndDate}T00:00:00`), 'MMM d, yyyy')
      : project.plannedEndDate,
    summary: savedFormValues.summary || toPlainTextSummary(project.summary),
    status: resolvedStatusLabel,
    createdBy: headerCreatedBy,
    createdOn: creationCreatedOnLabel,
    modifiedOn: creationModifiedOnLabel,
  }

  if (projectLoading && !projectData) {
    return <DetailPageLoadingShell />
  }

  return (
    <div className="w-full space-y-5 lg:pr-24 xl:pr-28 2xl:pr-32">
      {/* Page Header */}
      <div className="rounded-2xl border border-[#DDEBFF] bg-white px-4 py-5 shadow-[0_10px_26px_rgba(15,23,42,0.05)] dark:border-white/10 dark:bg-[#1E293B] sm:px-6">
        <nav className="mb-4 flex flex-wrap items-center gap-1 text-xs text-[#64748B] dark:text-slate-200">
          <Link to={homeHref} onClick={(event) => handleProtectedNavigation(event, homeHref)} className="hover:text-[#286CFF]">Home</Link>
          <span>/</span>
          <Link to={backHref} onClick={(event) => handleProtectedNavigation(event, backHref)} className="hover:text-[#286CFF]">{queueLabel}</Link>
          <span>/</span>
          <span className="text-[#0F172A] dark:text-white">{display.name}</span>
        </nav>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <Link to={backHref} onClick={(event) => handleProtectedNavigation(event, backHref)} className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-[#475569] transition-colors hover:text-[#286CFF] dark:text-slate-200">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
            {display.budgetRefId ? (
              <p className="mb-1 text-xs font-medium text-[#475569] dark:text-slate-300">
                {display.budgetRefId}
              </p>
            ) : null}
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-[#0F172A] dark:text-white sm:text-3xl">
                {display.name}
              </h1>
              <DynamicStatusBadge status={display.status} fallbackStatus={project.status} />
              <RiskBadge risk={project.riskLevel} />
              {/* Edit mode indicator chip */}
              {isEditMode && (
                <span
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#286CFF] px-3 py-1 text-xs font-bold text-white shadow-sm"
                  style={{ animation: 'fadeInUp 0.2s ease-out' }}
                >
                  <Pencil className="h-3 w-3" />
                  Editing
                </span>
              )}
            </div>
            <div className="mt-2 max-w-3xl space-y-1">
              <p className="text-sm font-medium text-[#475569] dark:text-slate-200">
                Created By: <span className="font-semibold text-[#0F172A] dark:text-white">{display.createdBy}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-3">
            {/* Edit button — only shown in view mode */}
            <div className="flex flex-wrap justify-end gap-2">
              <div className="inline-flex rounded-xl border border-[#DDEBFF] bg-white p-1 shadow-sm dark:border-white/10 dark:bg-[#1E293B]">
                <button
                  type="button"
                  onClick={() => setShowLogs(false)}
                  className={cn(
                    'inline-flex h-8 items-center gap-2 rounded-lg px-3 text-sm font-semibold transition-colors',
                    !showLogs
                      ? 'bg-[#286CFF] text-white shadow-sm'
                      : 'text-[#64748B] hover:bg-[#F8FBFF] hover:text-[#286CFF] dark:text-slate-200 dark:hover:bg-white/5'
                  )}
                >
                  <ClipboardCheck className="h-4 w-4" />
                  Project Details
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowLogs(true)
                    setIsEditMode(false)
                  }}
                  className={cn(
                    'inline-flex h-8 items-center gap-2 rounded-lg px-3 text-sm font-semibold transition-colors',
                    showLogs
                      ? 'bg-[#286CFF] text-white shadow-sm'
                      : 'text-[#64748B] hover:bg-[#F8FBFF] hover:text-[#286CFF] dark:text-slate-200 dark:hover:bg-white/5'
                  )}
                >
                  <History className="h-4 w-4" />
                  Project Logs
                </button>
              </div>

              {!isEditMode && !showLogs && canCurrentRoleEdit && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsEditMode(true)}
                  className="h-9 gap-2 rounded-xl border-[#DDEBFF] text-[#475569] hover:border-[#286CFF] hover:text-[#286CFF] dark:border-white/10 dark:text-slate-200"
                >
                  <Pencil className="h-4 w-4" />
                  Edit
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:min-w-[420px]">
              <div
                className={cn(
                  'rounded-xl px-3 py-3 text-center dark:bg-white/5',
                  confidenceTone === 'green'
                    ? 'bg-[#ECFDF3]'
                    : confidenceTone === 'amber'
                      ? 'bg-[#FFF8E8]'
                      : 'bg-[#FFF1F3]'
                )}
              >
                <p className="text-xs font-semibold text-[#64748B]">AI Confidence</p>
                <p
                  className={cn(
                    'text-lg font-bold',
                    confidenceTone === 'green'
                      ? 'text-[#16794B]'
                      : confidenceTone === 'amber'
                        ? 'text-[#B7791F]'
                        : 'text-[#B42318]'
                  )}
                >
                  {confidence}%
                </p>
              </div>
              <div className="rounded-xl bg-[#EFF6FF] px-3 py-3 text-center dark:bg-white/5">
                <p className="text-xs font-semibold text-[#64748B]">Documents</p>
                <p
                  className={cn(
                    'text-lg font-bold',
                    documentStatus === 'Complete'
                      ? 'text-green-600'
                      : documentStatus === 'Loading'
                        ? 'text-[#286CFF]'
                        : 'text-amber-600'
                  )}
                >
                  {documentStatus}
                </p>
              </div>
              <div className="rounded-xl bg-[#EFF6FF] px-3 py-3 text-center dark:bg-white/5">
                <p className="text-xs font-semibold text-[#64748B]">Budget</p>
                <CurrencyAmount amount={budgetTotal} className="justify-center text-lg font-bold text-[#0F172A] dark:text-white" iconSize={15} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit mode notice banner */}
      {isEditMode && !showLogs && (
        <div
          className="flex flex-wrap items-center gap-3 rounded-2xl border border-[#286CFF]/30 bg-[#EFF6FF] px-4 py-3 shadow-sm dark:border-[#286CFF]/20 dark:bg-[#10213B]"
          style={{ animation: 'fadeInUp 0.2s ease-out' }}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#286CFF] text-white">
            <Edit className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-[#286CFF]">Editing Mode Active</p>
            <p className="text-xs text-[#64748B] dark:text-slate-300">
              Modify the fields below. Respondents can also reply to open clarifications in this mode.
            </p>
          </div>
        </div>
      )}

        {!showLogs && !isEditMode && (
          <div
            className={cn(
              'flex flex-wrap items-start gap-3 rounded-2xl border px-4 py-3 shadow-sm',
              showClarificationReturnNotice
                ? 'border-[#C7D2FE] bg-[#EEF2FF] dark:border-[#6366F1]/30 dark:bg-[#1E1B4B]/35'
                : showPendingNotice
                ? 'border-[#F5D0A9] bg-[#FFF7ED] dark:border-[#EA580C]/30 dark:bg-[#431407]/40'
                : 'border-[#BFD8FF] bg-[#EFF6FF] dark:border-[#286CFF]/20 dark:bg-[#10213B]'
            )}
          >
            <div
              className={cn(
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white',
                showClarificationReturnNotice
                  ? 'bg-[#6366F1]'
                  : showPendingNotice
                    ? 'bg-[#F97316]'
                    : 'bg-[#286CFF]'
              )}
            >
              {showClarificationReturnNotice ? (
                <MessageSquare className="h-4 w-4" />
              ) : showPendingNotice ? (
                <History className="h-4 w-4" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p
                className={cn(
                  'text-sm font-semibold',
                  showClarificationReturnNotice
                    ? 'text-[#4338CA] dark:text-indigo-300'
                    : showPendingNotice
                      ? 'text-[#C2410C] dark:text-orange-300'
                      : 'text-[#286CFF]'
                )}
              >
                {showClarificationReturnNotice
                  ? `Reply Returns To ${clarificationReturnRole}`
                  : showPendingNotice
                  ? `Pending with ${workflowOwner}`
                  : canCurrentRoleEdit
                    ? `${currentRole} actions available`
                    : 'Read-only workflow state'}
              </p>
              <p className="text-xs text-[#64748B] dark:text-slate-300">
                {showClarificationReturnNotice
                  ? `Reply to the latest clarification below and this ICT budget will automatically be assigned back to ${clarificationReturnRole}. You do not need to submit it manually from Quick Actions.`
                  : showPendingNotice
                  ? pendingNoticeText
                  : canCurrentRoleEdit
                    ? `This project is currently assigned to ${currentRole}. You can edit it and continue the workflow actions from the panel on the right.`
                  : 'This project is currently read-only, but the clarification thread remains available for all roles.'}
            </p>
          </div>
        </div>
      )}

      {!showLogs && (lookupLoading || ictBudgetLoading) && (
        <div className="rounded-2xl border border-[#DDEBFF] bg-[#F8FBFF] px-4 py-3 text-sm text-[#475569] dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
          Loading Dataverse project details...
        </div>
      )}

      {!showLogs && projectLoading && (
        <div className="rounded-2xl border border-[#DDEBFF] bg-[#F8FBFF] px-4 py-3 text-sm text-[#475569] dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
          Resolving project record...
        </div>
      )}

      {!showLogs && projectError && (
        <div className="rounded-2xl border border-[#FFD4D1] bg-[#FFF5F5] px-4 py-3 text-sm text-[#B42318] dark:border-[#EA4F49]/40 dark:bg-[#EA4F49]/10">
          {projectError}
        </div>
      )}

      {!showLogs && lookupError && (
        <div className="rounded-2xl border border-[#FFD4D1] bg-[#FFF5F5] px-4 py-3 text-sm text-[#B42318] dark:border-[#EA4F49]/40 dark:bg-[#EA4F49]/10">
          {lookupError}
        </div>
      )}

      {!showLogs && ictBudgetError && (
        <div className="rounded-2xl border border-[#FFD4D1] bg-[#FFF5F5] px-4 py-3 text-sm text-[#B42318] dark:border-[#EA4F49]/40 dark:bg-[#EA4F49]/10">
          {ictBudgetError}
        </div>
      )}

      {!showLogs && <ScrollSpySectionRail
        sections={FORM_SECTIONS.filter((section) => visibleSectionIds.includes(section.id))}
        activeSection={activeSection}
        onNavigate={scrollToSection}
      />}

      {showLogs && (
        <ChangeLogTable
          logs={auditLogs}
          loading={auditLogsLoading}
          error={auditLogsError}
        />
      )}

      {!showLogs && detailBudgetOverviewCard}

      {/* Main grid */}
      <div className={cn('grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_390px]', showLogs && 'hidden')}>

        {/* ── Left column: view or edit content ──────────────────────────────── */}
        <div
          key={isEditMode ? 'edit-mode' : 'view-mode'}
          className="space-y-5"
          style={{ animation: 'fadeInUp 0.25s ease-out' }}
        >
          {isEditMode ? (
            /* ════ EDIT MODE SECTIONS ════════════════════════════════════════ */
            <>
              <DetailSection id="sec-details" title="Project Details" description="Core submission information and strategic alignment." icon={ClipboardCheck}>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                  <EditField
                    label="Initiative / Budget Item Name"
                    required
                    error={fieldErrors.initiativeName}
                    aiAssist={buildAiAssist('initiativeName', 'Initiative / Budget Item Name')}
                    highlighted={animatedAiFields.includes('initiativeName')}
                  >
                      <Input
                        value={formValues.initiativeName}
                        onChange={(e) => updateField('initiativeName', e.target.value)}
                        onBlur={() => void runDetailAiEvaluations(formValues.initiativeName, formValues.summary)}
                        className={cn(
                          'h-10 rounded-xl bg-white focus-visible:ring-[#286CFF]/20 dark:border-white/10 dark:bg-[#1E293B]',
                          fieldErrors.initiativeName ? 'border-[#F04438]' : 'border-[#D9E6F7]'
                        )}
                      />
                    </EditField>
                  </div>
                  <EditField
                    label="Strategic Priority"
                    required
                    error={fieldErrors.strategicPriorityId}
                  >
                    <LookupSelect
                      value={formValues.strategicPriorityId}
                      onChange={handleStrategicPriorityChange}
                      placeholder="Select strategic priority"
                      options={topLevelStrategicPriorities.map((priority) => ({
                        value: priority.id,
                        label: priority.name,
                      }))}
                      icon={Layers}
                      disabled={lookupLoading || ictBudgetLoading}
                      invalid={Boolean(fieldErrors.strategicPriorityId)}
                    />
                  </EditField>
                  <EditField
                    label="Strategic Priority Classifications"
                    required
                    error={fieldErrors.strategicPriorityClassificationId}
                  >
                    <LookupSelect
                      value={formValues.strategicPriorityClassificationId}
                      onChange={(value) => updateField('strategicPriorityClassificationId', value)}
                      placeholder={
                        formValues.strategicPriorityId
                          ? 'Select strategic priority classification'
                          : 'Select strategic priority first'
                      }
                      options={strategicPriorityClassifications.map((priority) => ({
                        value: priority.id,
                        label: priority.name,
                      }))}
                      icon={FolderKanban}
                      disabled={!formValues.strategicPriorityId || lookupLoading || ictBudgetLoading}
                      invalid={Boolean(fieldErrors.strategicPriorityClassificationId)}
                    />
                  </EditField>
                  <div className="md:col-span-2">
                    {detailAiSuggestionCard}
                  </div>
                  <EditField label="Work Stream" error={fieldErrors.workStreamId}>
                    <div className="space-y-2">
                      <LookupSelect
                        value={formValues.workStreamId}
                        onChange={(value) => updateField('workStreamId', value)}
                        placeholder="Select work stream"
                        options={workStreams.map((workStream) => ({
                          value: workStream.id,
                          label: workStream.name,
                        }))}
                        icon={Briefcase}
                        disabled={lookupLoading || ictBudgetLoading}
                        invalid={Boolean(fieldErrors.workStreamId)}
                      />
                      <Button
                        variant="ghost"
                        className="h-auto justify-start rounded-none px-0 py-0 text-[var(--primary)] hover:bg-transparent hover:text-[#043DFF] hover:underline disabled:text-[#94A3B8] disabled:no-underline"
                        onClick={() => setWorkStreamModalOpen(true)}
                        disabled={lookupLoading || ictBudgetLoading}
                      >
                        <Plus className="h-4 w-4" />
                        Create Work Stream
                      </Button>
                    </div>
                  </EditField>
                  <EditField label="ICT Budget Items Type" required error={fieldErrors.budgetItemType}>
                    <LookupSelect
                      value={formValues.budgetItemType ? String(formValues.budgetItemType) : ''}
                      onChange={(value) => updateField('budgetItemType', Number(value) as BudgetItemType)}
                      placeholder="Select ICT budget item type"
                      options={BUDGET_ITEM_TYPE_OPTIONS.map((option) => ({
                        value: String(option.value),
                        label: option.label,
                      }))}
                      icon={Package}
                      disabled={lookupLoading || ictBudgetLoading}
                      invalid={Boolean(fieldErrors.budgetItemType)}
                    />
                  </EditField>
                  <EditField
                    label="Category"
                    aiAssist={buildAiAssist('category', 'Category')}
                    highlighted={animatedAiFields.includes('category')}
                  >
                    <LookupSelect
                      value={formValues.category ? String(formValues.category) : ''}
                      onChange={(value) => updateField('category', Number(value) as CategoryType)}
                      placeholder="Select category"
                      options={CATEGORY_OPTIONS.map((option) => ({
                        value: String(option.value),
                        label: option.label,
                      }))}
                      icon={FolderKanban}
                      disabled={lookupLoading || ictBudgetLoading}
                    />
                  </EditField>
                  <EditField
                    label="Technology (Company)"
                    error={fieldErrors.technologyCompanyId}
                    aiAssist={buildAiAssist('technologyCompany', 'Technology (Company)')}
                    highlighted={animatedAiFields.includes('technologyCompany')}
                  >
                    <LookupSelect
                      value={formValues.technologyCompanyId}
                      onChange={handleTechnologyCompanyChange}
                      placeholder="Select technology company"
                      options={technologyCompanies.map((company) => ({
                        value: company.id,
                        label: company.name,
                      }))}
                      icon={Building2}
                      disabled={lookupLoading || ictBudgetLoading}
                      invalid={Boolean(fieldErrors.technologyCompanyId)}
                    />
                  </EditField>
                  <EditField label="Technology (Product)" error={fieldErrors.technologyProductIds}>
                    <div className="space-y-2">
                      <ProductMultiSelect
                        products={selectedTechnologyCompany?.products ?? []}
                        selectedIds={formValues.technologyProductIds}
                        disabled={!selectedTechnologyCompany || lookupLoading || ictBudgetLoading}
                        onToggle={toggleTechnologyProduct}
                        invalid={Boolean(fieldErrors.technologyProductIds)}
                      />
                      <Button
                        variant="ghost"
                        className="h-auto justify-start rounded-none px-0 py-0 text-[var(--primary)] hover:bg-transparent hover:text-[#043DFF] hover:underline disabled:text-[#94A3B8] disabled:no-underline"
                        onClick={() => setTechnologyProductModalOpen(true)}
                        disabled={!selectedTechnologyCompany || lookupLoading || ictBudgetLoading}
                      >
                        <Plus className="h-4 w-4" />
                        Create Technology Product
                      </Button>
                    </div>
                  </EditField>
                </div>
              </DetailSection>

              <DetailSection id="sec-timelines" title="Project Timeline" description="Planned delivery window for review and governance assessment." icon={CalendarDays}>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <EditField label="Planned Start Date" required error={fieldErrors.plannedStartDate}>
                    <EditDatePickerField
                      value={formValues.plannedStartDate}
                      onChange={(value) => updateField('plannedStartDate', value)}
                      invalid={Boolean(fieldErrors.plannedStartDate)}
                    />
                  </EditField>
                  <EditField label="Planned End Date" required error={fieldErrors.plannedEndDate}>
                    <EditDatePickerField
                      value={formValues.plannedEndDate}
                      onChange={(value) => updateField('plannedEndDate', value)}
                      invalid={Boolean(fieldErrors.plannedEndDate)}
                      minDate={formValues.plannedStartDate || undefined}
                    />
                  </EditField>
                </div>
              </DetailSection>

              <DetailSection id="sec-summary" title="Project Summary" description="Business need, expected outcomes, beneficiaries, and delivery approach." icon={FileText}>
                <EditField
                  label="Summary / Description"
                  required
                  error={fieldErrors.summary}
                  aiAssist={buildAiAssist('summary', 'Summary / Description')}
                  highlighted={animatedAiFields.includes('summary')}
                >
                  <Textarea
                    rows={6}
                    value={formValues.summary}
                    onChange={(e) => updateField('summary', e.target.value)}
                    onBlur={() => void runDetailAiEvaluations(formValues.initiativeName, formValues.summary)}
                    className={cn(
                      'resize-none rounded-xl bg-white focus-visible:ring-[#286CFF]/20 dark:border-white/10 dark:bg-[#1E293B]',
                      fieldErrors.summary ? 'border-[#F04438] bg-[#FFF5F5] dark:bg-[#2B1E24]' : 'border-[#D9E6F7]'
                    )}
                  />
                </EditField>
              </DetailSection>

              {/* Budget line items are editable through the classification picker modal */}
              <DetailSection
                title="Project Budget Type & Budget Account Codes"
                id="sec-budget"
                description="Create and review project budget line items from the classification hierarchy."
                icon={WalletCards}
                titleAdornment={buildBudgetAccountCodesAssist()}
                action={
                  <div className="rounded-xl bg-[#EFF6FF] px-4 py-2 text-end dark:bg-white/5">
                    <p className="text-xs font-semibold text-[#64748B] dark:text-slate-200">Total Requested Budget</p>
                    <CurrencyAmount amount={budgetTotal} full className="text-xl font-bold text-[#0F172A] dark:text-white" iconSize={18} />
                  </div>
                }
              >
                <div className="mb-6 space-y-4 rounded-2xl border border-[#DDEBFF] bg-[#F8FBFF] p-4 dark:border-white/10 dark:bg-white/5">
                  <EditField
                    label="Project Budget Type"
                    required
                    error={fieldErrors.activityType}
                    aiAssist={buildAiAssist('activityType', 'Project Budget Type')}
                  >
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
                              <p className="text-sm text-[#0F172A] dark:text-white" style={{fontWeight: 600}}>{option.title}</p>
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
                  </EditField>

                  {visibleBudgetFields.length > 0 && (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {visibleBudgetFields.map((field) => (
                        <EditField key={field} label={toCurrencyFieldLabel(field)} required>
                          <CurrencyField
                            value={formValues[field]}
                            onChange={(value) => updateField(field, value)}
                            invalid={Boolean(fieldErrors[field])}
                          />
                        </EditField>
                      ))}
                    </div>
                  )}
                </div>
                {hasDataverseBudgetProject && (
                  <div className="mb-4 flex justify-end">
                    <Button onClick={() => setBudgetModalOpen(true)} className="gap-2 rounded-xl text-white" style={{ backgroundColor: '#286CFF' }}>
                      <Layers className="h-4 w-4" />
                      Add Budget Account Code
                    </Button>
                  </div>
                )}
                <BudgetItemsTable
                  items={displayedBudgetItems}
                  loading={budgetItemsLoading}
                  error={budgetItemsError}
                  editable
                  savingId={savingBudgetLineItemId}
                  deletingId={deletingBudgetLineItemId}
                  onChangeBudgetRequested={handleBudgetRequestedChange}
                  onDelete={setLineItemToDelete}
                />
                {fieldErrors.budgetItems && (
                  <p className="mt-3 text-xs font-medium text-[#B42318]">{fieldErrors.budgetItems}</p>
                )}
              </DetailSection>

              {/* Documents section in edit mode */}
              <DetailSection
                title="Supporting Documents"
                description="Upload additional supporting files for this budget record."
                icon={FileCheck2}
                noShadow
              >
                {currentRole === 'Respondent' && (
                  <FileUploadDropzone
                    files={uploadedFiles}
                    onChange={setUploadedFiles}
                    compact={supportingDocuments.length > 0}
                    hideFileList
                    fileStatuses={detailUploadedFileStatuses}
                  />
                )}
                {showDetailSupportingDocumentSummary && (
                  <div className="mt-4 rounded-2xl border border-[#E9D5FF] bg-[#FDF8FF] px-4 py-4 dark:border-white/10 dark:bg-white/5">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 shrink-0 text-[#A855F7] dark:text-[#E9D5FF]">
                        <Sparkles className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#0F172A] dark:text-white">Supporting Documents Summary</p>
                        <p className="mt-1 text-sm leading-6 text-[#475569] dark:text-slate-300">
                          {detailActionSummaryText}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                {(detailSupportingDocumentInsightItems.length > 0 || persistedDocumentSummariesLoading || persistedDocumentSummariesError) && (
                  <div className="mt-4">
                    {persistedDocumentSummariesError && detailSupportingDocumentInsightItems.length === 0 ? (
                      <div className="rounded-xl border border-[#F5C2C7] bg-[#FFF1F3] px-4 py-3 text-sm text-[#B42318] dark:border-[#B42318]/30 dark:bg-[#3B1118]">
                        {persistedDocumentSummariesError}
                      </div>
                    ) : (
                      <SupportingDocumentAiInsights
                        items={detailSupportingDocumentInsightItems}
                        onDeleteItem={currentRole === 'Respondent' && isEditMode ? handleDeleteDetailInsightItem : undefined}
                      />
                    )}
                  </div>
                )}
              </DetailSection>

              {/* Clarifications section always visible in edit mode (respondent can reply) */}
              {showClarificationSection && (
                <DetailSection
                  id="sec-clarifications"
                  title="Clarifications"
                  description="Open threads from Reviewer and Approver. Reply to each clarification below."
                  icon={MessageSquare}
                >
                  <ClarificationThread
                    clarifications={localClarifications}
                    currentRole={currentRole}
                    isEditMode={isEditMode}
                    onReply={handleClarificationReply}
                    onClose={handleClarificationClose}
                    sharepointDocs={supportingDocuments}
                  />
                </DetailSection>
              )}

              {/* Save bar at the bottom of edit sections */}
              <div className="rounded-2xl border border-[#DDEBFF] bg-white p-4 shadow-[0_14px_34px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-[#1E293B]">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                  <p className="text-sm text-[#64748B] dark:text-slate-200">Review all changes before saving.</p>
                  <div className="flex flex-wrap gap-2 xl:justify-end">
                    <Button variant="outline" onClick={handleCancelEdit} className="rounded-xl border-slate-300 dark:border-slate-500/50">Cancel</Button>
                    <Button variant="outline" onClick={() => void handleSaveEdit()} disabled={savingIctBudget} className="gap-2 rounded-xl border-slate-300 dark:border-slate-500/50">
                      <Save className="h-4 w-4" />
                      {savingIctBudget ? 'Saving...' : 'Save Changes'}
                    </Button>
                    {canRaiseClarification && (
                      <Button
                        variant="outline"
                        className="gap-2 rounded-xl"
                        onClick={() => setClarificationModalOpen(true)}
                      >
                        <MessageSquare className="h-4 w-4" />
                        Raise Clarification
                      </Button>
                    )}
                    {canCompleteReview && (
                      <Button
                        className="gap-2 rounded-xl"
                        onClick={() => void prepareWorkflowAction('complete-review')}
                      >
                        <Check className="h-4 w-4" />
                        Mark as Reviewed
                      </Button>
                    )}
                    {canSubmitToApprover && (
                      <Button
                        className="gap-2 rounded-xl"
                        onClick={() => void prepareWorkflowAction('submit-approver')}
                      >
                        <Send className="h-4 w-4" />
                        Submit to Approver
                      </Button>
                    )}
                    {canApproveProject && (
                      <Button
                        className="gap-2 rounded-xl"
                        onClick={() => void prepareWorkflowAction('approve-project')}
                      >
                        <ShieldCheck className="h-4 w-4" />
                        {approverUsesDirectDgeFlow ? 'Submit to DGE' : 'Approve Project'}
                      </Button>
                    )}
                    {canSubmitToReviewer && (
                      <Button
                        className="gap-2 rounded-xl"
                        onClick={() => void prepareWorkflowAction('submit-reviewer')}
                      >
                        <Send className="h-4 w-4" />
                        Submit to Reviewer
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* ════ VIEW MODE SECTIONS ═════════════════════════════════════════ */
            <>
              <DetailSection id="sec-details" title="Project Details" description="Core submission information and strategic alignment." icon={ClipboardCheck}>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <Field
                    label="Initiative / Budget Item Name"
                    value={display.name}
                    aiAssist={buildAiAssist('initiativeName', 'Initiative / Budget Item Name')}
                    highlighted={animatedAiFields.includes('initiativeName')}
                  />
                  <Field
                    label="Strategic Priority"
                    value={display.strategicPriority}
                    aiAssist={buildStrategicAiAssist('priority')}
                  />
                  <Field
                    label="Strategic Priority Classifications"
                    value={display.classification}
                    aiAssist={buildStrategicAiAssist('classification')}
                  />
                  <Field label="Work Stream" value={display.workStream} />
                  <Field label="ICT Budget Item Type" value={display.budgetType} />
                  <Field
                    label="Category"
                    value={display.category}
                    aiAssist={buildAiAssist('category', 'Category')}
                    highlighted={animatedAiFields.includes('category')}
                  />
                  <Field
                    label="Technology (Company)"
                    value={display.technologyCompany}
                    aiAssist={buildAiAssist('technologyCompany', 'Technology (Company)')}
                    highlighted={animatedAiFields.includes('technologyCompany')}
                  />
                  <Field label="Technology (Product)" value={display.technologyProduct} />
                </div>
                {detailAiSuggestionStatusCard && (
                  <div className="mt-4">
                    {detailAiSuggestionStatusCard}
                  </div>
                )}
              </DetailSection>

              <DetailSection id="sec-timelines" title="Project Timeline" description="Planned delivery window for review and governance assessment." icon={CalendarDays}>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <Field label="Planned Start Date" value={display.plannedStartDate} />
                  <Field label="Planned End Date" value={display.plannedEndDate} />
                </div>
              </DetailSection>

              <DetailSection id="sec-summary" title="Project Summary" description="Business need, expected outcomes, beneficiaries, and delivery approach." icon={FileText}>
                <div
                  className={cn(
                    'rounded-xl border border-[#EAF0F6] bg-[#F8FBFF] p-4 transition-all duration-500 dark:border-white/10 dark:bg-white/5',
                    animatedAiFields.includes('summary') && 'border-[#D8B4FE] bg-[#FDF7FF] shadow-[0_0_0_4px_rgba(168,85,247,0.12)]'
                  )}
                >
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold text-[#64748B] dark:text-slate-200">Summary / Description</p>
                    {buildAiAssist('summary', 'Summary / Description')}
                  </div>
                  <p className="text-sm leading-7 text-[#0F172A] dark:text-white">{display.summary}</p>
                </div>
              </DetailSection>

              <DetailSection
                title="Project Budget Type & Budget Account Codes"
                id="sec-budget"
                description="Account-level spend breakdown for review validation."
                icon={WalletCards}
                titleAdornment={buildBudgetAccountCodesAssist()}
                action={
                  <div className="rounded-xl bg-[#EFF6FF] px-4 py-2 text-end dark:bg-white/5">
                    <p className="text-xs font-semibold text-[#64748B] dark:text-slate-200">Total Requested Budget</p>
                    <CurrencyAmount amount={budgetTotal} full className="text-xl font-bold text-[#0F172A] dark:text-white" iconSize={18} />
                  </div>
                }
              >
                <div className="mb-6 space-y-3 rounded-2xl border border-[#DDEBFF] bg-[#F8FBFF] p-4 dark:border-white/10 dark:bg-white/5">
                  <Field
                    label="Project Budget Type"
                    value={display.budgetActivityType}
                    aiAssist={buildAiAssist('activityType', 'Project Budget Type')}
                    highlighted={animatedAiFields.includes('activityType')}
                  />
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {getVisibleBudgetFields(savedFormValues.activityType).map((field) => (
                      <div key={field} className="rounded-xl border border-[#EAF0F6] bg-white px-3 py-3 dark:border-white/10 dark:bg-[#1E293B]">
                        <p className="mb-1 text-xs font-semibold text-[#64748B] dark:text-slate-200">
                          {toCurrencyFieldLabel(field)}
                        </p>
                        <CurrencyAmount
                          amount={Number(savedFormValues[field].replace(/,/g, '') || 0)}
                          full
                          className="text-sm font-semibold text-[#0F172A] dark:text-white"
                          iconSize={14}
                        />
                      </div>
                    ))}
                  </div>
                </div>
                <BudgetItemsTable
                  items={displayedBudgetItems}
                  loading={budgetItemsLoading}
                  error={budgetItemsError}
                  editable={false}
                  savingId={savingBudgetLineItemId}
                  deletingId={deletingBudgetLineItemId}
                  onChangeBudgetRequested={handleBudgetRequestedChange}
                  onDelete={setLineItemToDelete}
                />
                {fieldErrors.budgetItems && (
                  <p className="mt-3 text-xs font-medium text-[#B42318]">{fieldErrors.budgetItems}</p>
                )}
              </DetailSection>

              <DetailSection id="sec-documents" title="Supporting Documents" description="Evidence attached to support budget, procurement, and delivery assumptions." icon={FileCheck2}>
                {showDetailSupportingDocumentSummary && (
                  <div className="rounded-2xl border border-[#E9D5FF] bg-[#FDF8FF] px-4 py-4 dark:border-white/10 dark:bg-white/5">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 shrink-0 text-[#A855F7] dark:text-[#E9D5FF]">
                        <Sparkles className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#0F172A] dark:text-white">Supporting Documents Summary</p>
                        <p className="mt-1 text-sm leading-6 text-[#475569] dark:text-slate-300">
                          {detailActionSummaryText}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                {(detailSupportingDocumentInsightItems.length > 0 || persistedDocumentSummariesLoading || persistedDocumentSummariesError) && (
                  <div className={cn(showDetailSupportingDocumentSummary && 'mt-4')}>
                    {persistedDocumentSummariesError && detailSupportingDocumentInsightItems.length === 0 ? (
                      <div className="rounded-xl border border-[#F5C2C7] bg-[#FFF1F3] px-4 py-3 text-sm text-[#B42318] dark:border-[#B42318]/30 dark:bg-[#3B1118]">
                        {persistedDocumentSummariesError}
                      </div>
                    ) : (
                      <SupportingDocumentAiInsights items={detailSupportingDocumentInsightItems} />
                    )}
                  </div>
                )}
              </DetailSection>

              {/* Clarification section — shown when any clarifications exist, or governance view */}
              {showClarificationSection && (
                <DetailSection
                  id="sec-clarifications"
                  title="Clarifications"
                  description="Clarification threads raised during review. Each thread stays open until resolved."
                  icon={MessageSquare}
                >
                  <ClarificationThread
                    clarifications={localClarifications}
                    currentRole={currentRole}
                    isEditMode={isEditMode}
                    onReply={handleClarificationReply}
                    onClose={handleClarificationClose}
                    sharepointDocs={supportingDocuments}
                  />
                </DetailSection>
              )}
            </>
          )}
        </div>

        {/* ── Right aside ─────────────────────────────────────────────────── */}
        <aside className="space-y-5">

          {/* ── Section navigator ── */}
          {isGovernanceView ? (
            <>
              <Card className="rounded-2xl border-[#DDEBFF] shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
                <CardContent className="p-4">
                  <div className="mb-3 flex items-center gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#BFD8FF] bg-[#EFF6FF] text-[#286CFF] dark:border-white/10 dark:bg-white/5 dark:text-blue-400">
                      <Bot className="h-4 w-4" />
                    </div>
                    <p className="font-semibold text-[#0F172A] dark:text-white">Recommended Actions</p>
                  </div>
                  <div className="space-y-2">
                    {isEditMode && (
                      <>
                        <Button
                          variant="outline"
                          className="w-full justify-start gap-2 border-slate-300 dark:border-slate-500/50"
                          onClick={() => void handleSaveEdit()}
                          disabled={savingIctBudget}
                        >
                          <Save className="h-4 w-4" />
                          {savingIctBudget ? 'Saving...' : 'Save Changes'}
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full justify-start gap-2 border-slate-300 dark:border-slate-500/50"
                          onClick={handleCancelEdit}
                        >
                          <X className="h-4 w-4" />
                          Cancel
                        </Button>
                      </>
                    )}
                    {canCurrentRoleEdit && !isEditMode && (
                      <Button
                        variant="outline"
                        className="w-full justify-start gap-2"
                        onClick={() => setIsEditMode(true)}
                      >
                        <Pencil className="h-4 w-4" />
                        Edit Details
                      </Button>
                    )}
                    {canRaiseClarification && (
                      <Button
                        variant="outline"
                        className="w-full justify-start gap-2"
                        onClick={() => setClarificationModalOpen(true)}
                      >
                        <MessageSquare className="h-4 w-4" />
                        Raise Clarification
                      </Button>
                    )}
                    {canCompleteReview && (
                      <Button
                        className="w-full justify-start gap-2"
                        onClick={() => void prepareWorkflowAction('complete-review')}
                      >
                        <Check className="h-4 w-4" />
                        Mark as Reviewed
                      </Button>
                    )}
                    {canSubmitToApprover && (
                      <Button
                        className="w-full justify-start gap-2"
                        onClick={() => void prepareWorkflowAction('submit-approver')}
                      >
                        <Send className="h-4 w-4" />
                        Submit to Approver
                      </Button>
                    )}
                    {canApproveProject && (
                      <Button
                        className="w-full justify-start gap-2"
                        onClick={() => void prepareWorkflowAction('approve-project')}
                      >
                        <ShieldCheck className="h-4 w-4" />
                        {approverUsesDirectDgeFlow ? 'Submit to DGE' : 'Approve Project'}
                      </Button>
                    )}
                    {!canCurrentRoleEdit && !canRaiseClarification && !canCompleteReview && !canSubmitToApprover && !canApproveProject && (
                      <p className="text-xs text-[#475569] dark:text-slate-200">
                        This record is currently pending with another role, so workflow actions are locked here.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="overflow-hidden rounded-2xl border-[#DDEBFF] shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
                <CardContent className="p-4">
                  <div className="mb-3 flex items-center gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#BFD8FF] bg-[#EFF6FF] text-[#286CFF] dark:border-white/10 dark:bg-white/5 dark:text-blue-400">
                      <UserCheck className="h-4 w-4" />
                    </div>
                    <p className="font-semibold text-[#0F172A] dark:text-white">Activity</p>
                  </div>
                  <div className="divide-y divide-[#F1F5F9] dark:divide-white/5">
                    {(
                      [
                        { role: 'Respondent', name: ictBudgetRespondentName, color: '#10B981', bg: '#D1FAE5', icon: UserCheck },
                        { role: 'Reviewer',   name: ictBudgetReviewerName,   color: '#F59E0B', bg: '#FEF3C7', icon: ClipboardCheck },
                        { role: 'Approver',   name: ictBudgetApproverName,   color: '#286CFF', bg: '#DBEAFE', icon: ShieldCheck },
                      ] as const
                    ).map(({ role, name, color, bg, icon: RoleIcon }) => (
                      <div key={role} className="group flex items-center gap-3 py-2.5 transition-colors duration-150 first:pt-0 last:pb-0">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-transform duration-150 group-hover:scale-110" style={{ backgroundColor: bg, color }}>
                          <RoleIcon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-medium tracking-wide text-[#94A3B8] dark:text-slate-400">{role}</p>
                          <p className="truncate text-sm font-semibold text-[#0F172A] dark:text-white">
                            {name ?? <span className="font-normal text-[#94A3B8] dark:text-slate-500">—</span>}
                          </p>
                        </div>
                        <div className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: name ? color : '#CBD5E1' }} />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {detailDocumentActionCards}
            </>
          ) : (
            <>
              <Card className="rounded-2xl border-[#DDEBFF] shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
                <CardContent className="space-y-2 p-4">
                  <div className="mb-1 flex items-center gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#BFD8FF] bg-[#EFF6FF] text-[#286CFF] dark:border-white/10 dark:bg-white/5 dark:text-blue-400">
                      <Zap className="h-4 w-4" />
                    </div>
                    <p className="font-semibold text-[#0F172A] dark:text-white">Quick Actions</p>
                  </div>
                  {isEditMode && (
                    <>
                        <Button
                          variant="outline"
                          className="w-full justify-start gap-2 border-slate-300 dark:border-slate-500/50"
                          onClick={() => void handleSaveEdit()}
                          disabled={savingIctBudget}
                        >
                        <Save className="h-4 w-4" />
                        {savingIctBudget ? 'Saving...' : 'Save Changes'}
                      </Button>
                        <Button
                          variant="outline"
                          className="w-full justify-start gap-2 border-slate-300 dark:border-slate-500/50"
                          onClick={handleCancelEdit}
                        >
                          <X className="h-4 w-4" />
                          Cancel
                      </Button>
                    </>
                  )}
                  {(canCurrentRoleEdit || canSubmitToReviewer || canDeleteProject) ? (
                    <>
                      {canCurrentRoleEdit && !isEditMode && (
                        <Button
                          variant="outline"
                          className="w-full justify-start gap-2"
                          onClick={() => setIsEditMode(true)}
                        >
                          <Edit className="h-4 w-4" />
                          Edit Project
                        </Button>
                      )}
                      {canSubmitToReviewer && (
                        <Button
                          className="w-full justify-start gap-2"
                          onClick={() => void prepareWorkflowAction('submit-reviewer')}
                        >
                          <Send className="h-4 w-4" />
                          Submit to Reviewer
                        </Button>
                      )}
                      {canDeleteProject && (
                        <Button
                          variant="destructive"
                          className="w-full justify-start gap-2"
                          onClick={() => void prepareWorkflowAction('delete-project')}
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete Project
                        </Button>
                      )}
                    </>
                  ) : (
                    <>
                      <p className="text-xs text-[#475569] dark:text-slate-200">
                        Project is currently in the governance workflow. It can still be discussed in the clarification thread, but respondent changes are locked until it returns.
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card className="overflow-hidden rounded-2xl border-[#DDEBFF] shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
                <CardContent className="p-4">
                  <div className="mb-3 flex items-center gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#BFD8FF] bg-[#EFF6FF] text-[#286CFF] dark:border-white/10 dark:bg-white/5 dark:text-blue-400">
                      <UserCheck className="h-4 w-4" />
                    </div>
                    <p className="font-semibold text-[#0F172A] dark:text-white">Activity</p>
                  </div>
                  <div className="divide-y divide-[#F1F5F9] dark:divide-white/5">
                    {(
                      [
                        { role: 'Respondent', name: ictBudgetRespondentName, color: '#10B981', bg: '#D1FAE5', icon: UserCheck },
                        { role: 'Reviewer',   name: ictBudgetReviewerName,   color: '#F59E0B', bg: '#FEF3C7', icon: ClipboardCheck },
                        { role: 'Approver',   name: ictBudgetApproverName,   color: '#286CFF', bg: '#DBEAFE', icon: ShieldCheck },
                      ] as const
                    ).map(({ role, name, color, bg, icon: RoleIcon }) => (
                      <div key={role} className="group flex items-center gap-3 py-2.5 transition-colors duration-150 first:pt-0 last:pb-0">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-transform duration-150 group-hover:scale-110" style={{ backgroundColor: bg, color }}>
                          <RoleIcon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-medium tracking-wide text-[#94A3B8] dark:text-slate-400">{role}</p>
                          <p className="truncate text-sm font-semibold text-[#0F172A] dark:text-white">
                            {name ?? <span className="font-normal text-[#94A3B8] dark:text-slate-500">—</span>}
                          </p>
                        </div>
                        <div className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: name ? color : '#CBD5E1' }} />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-[#DDEBFF] shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
                <CardContent className="space-y-3 p-4">
                  <div className="mb-1 flex items-center gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#BFD8FF] bg-[#EFF6FF] text-[#286CFF] dark:border-white/10 dark:bg-white/5 dark:text-blue-400">
                      <FileText className="h-4 w-4" />
                    </div>
                    <p className="font-semibold text-[#0F172A] dark:text-white">Project Creation Details</p>
                  </div>
                  <Field label="Created By" value={display.createdBy} />
                  <Field label="Created On" value={display.createdOn} />
                  <Field label="Modified On" value={display.modifiedOn} />
                </CardContent>
              </Card>

              {detailDocumentActionCards}

              <Card className="rounded-2xl border-[#DDEBFF] shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
                <CardContent className="space-y-2 p-4">
                  <div className="mb-1 flex items-center gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#BFD8FF] bg-[#EFF6FF] text-[#286CFF] dark:border-white/10 dark:bg-white/5 dark:text-blue-400">
                      <BarChart2 className="h-4 w-4" />
                    </div>
                    <p className="font-semibold text-[#0F172A] dark:text-white">Project Signals</p>
                  </div>
                  <div className="rounded-xl border border-[#EAF0F6] bg-[#F8FBFF] px-3 py-3 dark:border-white/10 dark:bg-white/5">
                    <p className="text-xs font-semibold text-[#64748B] dark:text-slate-200">Status</p>
                    <div className="mt-2"><DynamicStatusBadge status={display.status} fallbackStatus={project.status} /></div>
                  </div>
                  <div className="rounded-xl border border-[#EAF0F6] bg-[#F8FBFF] px-3 py-3 dark:border-white/10 dark:bg-white/5">
                    <p className="text-xs font-semibold text-[#64748B] dark:text-slate-200">Risk Level</p>
                    <div className="mt-2"><RiskBadge risk={project.riskLevel} /></div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

        </aside>
      </div>

      {/* Clarification raise modal */}
      <ClassificationPickerModal
        open={budgetModalOpen}
        onOpenChange={setBudgetModalOpen}
        existingItems={existingBudgetDrafts}
        onCreate={handleCreateBudgetItems}
      />
      <ConfirmationModal
        open={lineItemToDelete !== null}
        onOpenChange={(open) => {
          if (!open) {
            setLineItemToDelete(null)
          }
        }}
        title="Delete this budget line item?"
        description={
          lineItemToDelete
            ? `This will permanently remove "${lineItemToDelete.accountName}" from the project budget grid.`
            : 'This will permanently remove the selected budget line item.'
        }
        confirmLabel="Delete Line Item"
        cancelLabel="Keep Item"
        onConfirm={() => void handleConfirmDeleteBudgetLineItem()}
        tone="danger"
        meta={
          lineItemToDelete ? (
            <p className="text-sm font-medium text-[#475569] dark:text-slate-200">
              {lineItemToDelete.l1} / {lineItemToDelete.l2} / {lineItemToDelete.l3}
            </p>
          ) : null
        }
      />
      <Dialog
        open={pendingNavigationHref !== null}
        onOpenChange={(open) => {
          if (!open) {
            handleKeepEditing()
          }
        }}
      >
        <DialogContent className="max-w-[520px] overflow-hidden rounded-[28px] border border-[#DDEBFF] p-0 shadow-[0_18px_50px_rgba(15,23,42,0.16)] dark:border-white/10">
          <div className="border-b border-[#B0DBFF] bg-[linear-gradient(135deg,#F8FBFF_0%,#E7F5FF_100%)] px-6 py-6 dark:border-white/10 dark:bg-[linear-gradient(135deg,#10213B_0%,#1E293B_100%)]">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#286CFF_0%,#4F98FF_100%)] text-white shadow-[0_10px_24px_rgba(40,108,255,0.28)]">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-1 inline-flex items-center rounded-full border border-[#B0DBFF] bg-white/80 px-2 py-0.5 text-[10px] font-semibold text-[#286CFF] shadow-sm dark:border-white/10 dark:bg-white/10 dark:text-blue-200">
                  Leave Page
                </div>
                <DialogTitle className="text-[18px] font-bold leading-snug text-[#0F172A] dark:text-white">
                  Unsaved Changes
                </DialogTitle>
                <p className="mt-1 text-[13px] font-medium text-[#64748B] dark:text-slate-300">
                  {display.name}
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-4 bg-white px-6 py-5 dark:bg-[#1E293B]">
            <DialogDescription className="text-sm leading-relaxed text-[#475569] dark:text-slate-300">
              If you leave this page now, your latest edits will be lost unless you save them first.
            </DialogDescription>
            <div className="rounded-2xl border border-[#DDEBFF] bg-[#F8FBFF] p-4 shadow-[0_10px_26px_rgba(15,23,42,0.05)] dark:border-white/10 dark:bg-white/5">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#64748B] dark:text-slate-300">
                Unsaved Items
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <div className={cn(
                  'rounded-2xl border px-3 py-3 transition-colors',
                  hasUnsavedFormFieldChanges
                    ? 'border-[#B0DBFF] bg-white shadow-sm dark:border-white/10 dark:bg-[#1E293B]'
                    : 'border-transparent bg-[#EFF6FF]/80 opacity-60 dark:bg-white/5'
                )}>
                  <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-[#E7F5FF] text-[#286CFF] dark:bg-white/10 dark:text-blue-200">
                    <FileText className="h-4 w-4" />
                  </div>
                  <p className="text-sm font-semibold text-[#0F172A] dark:text-white">Form Fields</p>
                  <p className="mt-1 text-xs text-[#64748B] dark:text-slate-300">
                    {hasUnsavedFormFieldChanges ? 'Edited and waiting to save' : 'No pending edits'}
                  </p>
                </div>
                <div className={cn(
                  'rounded-2xl border px-3 py-3 transition-colors',
                  hasUnsavedBudgetAccountCodeChanges
                    ? 'border-[#B0DBFF] bg-white shadow-sm dark:border-white/10 dark:bg-[#1E293B]'
                    : 'border-transparent bg-[#EFF6FF]/80 opacity-60 dark:bg-white/5'
                )}>
                  <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-[#E7F5FF] text-[#286CFF] dark:bg-white/10 dark:text-blue-200">
                    <Layers className="h-4 w-4" />
                  </div>
                  <p className="text-sm font-semibold text-[#0F172A] dark:text-white">Budget Account Codes</p>
                  <p className="mt-1 text-xs text-[#64748B] dark:text-slate-300">
                    {hasUnsavedBudgetAccountCodeChanges ? 'Amounts or items were updated' : 'No pending edits'}
                  </p>
                </div>
                <div className={cn(
                  'rounded-2xl border px-3 py-3 transition-colors',
                  uploadedFiles.length > 0
                    ? 'border-[#B0DBFF] bg-white shadow-sm dark:border-white/10 dark:bg-[#1E293B]'
                    : 'border-transparent bg-[#EFF6FF]/80 opacity-60 dark:bg-white/5'
                )}>
                  <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-[#E7F5FF] text-[#286CFF] dark:bg-white/10 dark:text-blue-200">
                    <Upload className="h-4 w-4" />
                  </div>
                  <p className="text-sm font-semibold text-[#0F172A] dark:text-white">Supporting Files</p>
                  <p className="mt-1 text-xs text-[#64748B] dark:text-slate-300">
                    {uploadedFiles.length > 0 ? `${uploadedFiles.length} file${uploadedFiles.length === 1 ? '' : 's'} ready to upload` : 'No pending uploads'}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-[#E2E8F0] bg-white px-6 py-4 dark:border-white/10 dark:bg-[#1E293B]">
            <Button
              variant="outline"
              onClick={handleKeepEditing}
              className="h-11 rounded-xl border-[#DDEBFF] px-5 text-sm font-medium text-[#64748B] hover:border-[#B0DBFF] hover:bg-[#F8FBFF] dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/5"
            >
              Keep Editing
            </Button>
            <Button
              variant="outline"
              onClick={handleDiscardAndNavigate}
              className="h-11 rounded-xl border-slate-300 px-5 text-sm font-medium text-[#64748B] hover:bg-[#F8FAFC] dark:border-slate-500/50 dark:text-slate-200 dark:hover:bg-white/5"
            >
              Discard Changes
            </Button>
            <Button
              onClick={() => void handleSaveBeforeNavigation()}
              disabled={savingIctBudget}
              className="h-11 rounded-xl px-5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(40,108,255,0.24)]"
            >
              {savingIctBudget ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <ConfirmationModal
        open={pendingWorkflowAction !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPendingWorkflowAction(null)
          }
        }}
        title={
          pendingWorkflowAction
            ? workflowActionDetails(pendingWorkflowAction, currentRole, {
                directToDge: pendingWorkflowAction === 'approve-project' && approverUsesDirectDgeFlow,
              }).title
            : 'Confirm action'
        }
        description={
          pendingWorkflowAction
            ? workflowActionDetails(pendingWorkflowAction, currentRole, {
                directToDge: pendingWorkflowAction === 'approve-project' && approverUsesDirectDgeFlow,
              }).description
            : 'Please confirm this workflow action.'
        }
        confirmLabel={
          pendingWorkflowAction
            ? workflowActionDetails(pendingWorkflowAction, currentRole, {
                directToDge: pendingWorkflowAction === 'approve-project' && approverUsesDirectDgeFlow,
              }).confirmLabel
            : 'Confirm'
        }
        cancelLabel="Cancel"
        onConfirm={() => void handleConfirmWorkflowAction()}
        tone={
          pendingWorkflowAction
            ? workflowActionDetails(pendingWorkflowAction, currentRole, {
                directToDge: pendingWorkflowAction === 'approve-project' && approverUsesDirectDgeFlow,
              }).tone
            : 'primary'
        }
        meta={
          <p className="text-sm font-medium text-[#475569] dark:text-slate-200">
            {display.name}
          </p>
        }
      />
      <ConfirmationModal
        open={pendingClarificationReply !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPendingClarificationReply(null)
          }
        }}
        title={`Send Reply And Return To ${pendingClarificationReply?.returnToRole ?? 'Reviewer'}?`}
        description={
          pendingClarificationReply
            ? `After this reply is submitted, the ICT budget will be assigned back to the ${pendingClarificationReply.returnToRole.toLowerCase()} and the workflow status will move back to ${pendingClarificationReply.returnToRole === 'Reviewer' ? 'reviewer review' : 'approver review'}.`
            : 'After this reply is submitted, the ICT budget will be reassigned in the workflow.'
        }
        confirmLabel={`Reply And Return To ${pendingClarificationReply?.returnToRole ?? 'Reviewer'}`}
        cancelLabel="Keep Editing"
        onConfirm={handleConfirmClarificationReplyHandoff}
        tone="primary"
        meta={
          <p className="text-sm font-medium text-[#475569] dark:text-slate-200">
            {display.name}
          </p>
        }
      />
      <ClarificationModal
        open={clarificationModalOpen}
        onOpenChange={setClarificationModalOpen}
        projectName={display.name}
        onSubmit={handleRaiseClarification}
        quickPrompts={clarificationQuickPrompts}
      />
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
              <EditField label="Work Stream Name" required>
                <Input
                  value={newWorkStreamName}
                  onChange={(event) => setNewWorkStreamName(event.target.value)}
                  className="h-12 rounded-xl border-[#D9E6F7]"
                  placeholder="Enter work stream name"
                />
              </EditField>
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
              <EditField label="Technology Product Name" required>
                <Input
                  value={newTechnologyProductName}
                  onChange={(event) => setNewTechnologyProductName(event.target.value)}
                  className="h-12 rounded-xl border-[#D9E6F7]"
                  placeholder="Enter technology product name"
                />
              </EditField>
              {selectedTechnologyCompany && (
                <div className="rounded-2xl border border-[#DDEBFF] bg-[#F8FBFF] px-4 py-3 text-sm text-[#475569]">
                  Company association: <span className="font-semibold text-[#0F172A]">{selectedTechnologyCompany.name}</span>
                </div>
              )}
            </div>
            <DialogFooter className="mt-6">
              <Button variant="outline" className="rounded-xl" onClick={() => setTechnologyProductModalOpen(false)}>
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
