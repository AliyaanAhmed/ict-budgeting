import { useEffect, useMemo, useRef, useState } from 'react'
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
  Plus,
  RefreshCw,
  Send,
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
import { FileUploadDropzone } from '@/components/shared/FileUploadDropzone'
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
  type SupportingDocumentEvaluationSummary,
  type SupportingDocumentSuggestedProjectField,
} from '@/services/aiSupportingDocumentEvaluationService'
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
  error?: string | null
}

interface UploadedSupportingDocumentCumulativeAnalysis {
  status: 'idle' | 'analyzing' | 'complete' | 'error'
  parsedSummary: SupportingDocumentEvaluationSummary | null
  rawSummary?: string
  error?: string | null
  sourceFileCount: number
  scopeKey: string | null
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

const COPILOT_OPTIONS = [
  { icon: Sparkles, label: 'New Project', sub: 'Starting fresh, no prior submissions' },
  { icon: RefreshCw, label: 'Continuation of Existing Project', sub: 'Project already exists, requesting additional budget' },
  { icon: TrendingUp, label: 'Phase 2 or Later', sub: 'Subsequent phase of a multi-phase project' },
]

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

function formatAiFieldValue(value: string | string[] | undefined) {
  if (!value) return '-'
  return Array.isArray(value) ? value.join(', ') : value
}

function getDocumentSummaryBudgetTotal(summary: SupportingDocumentEvaluationSummary | null) {
  return (summary?.budget_lines ?? []).reduce((sum, line) => sum + (line.amount ?? 0), 0)
}

function EmptyActionCard({
  description,
  icon: Icon,
}: {
  description: string
  icon: React.ElementType
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-dashed border-[#E9D5FF] bg-[#FDF7FF] px-4 py-5 text-sm text-[#64748B] dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#FAF5FF] text-[#A855F7] dark:bg-[#A855F7]/12 dark:text-[#E9D5FF]">
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
          className={cn(
            'inline-flex w-full min-w-0 items-center gap-5 whitespace-nowrap',
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
}: {
  title: string
  description: string
  icon: React.ElementType
  children: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <section className="rounded-2xl border border-[#DDEBFF] bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#1E293B] sm:p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#BFD8FF] bg-[#EFF6FF] text-[var(--primary)] dark:border-white/10 dark:bg-white/5">
            <Icon className="h-6 w-6" />
          </div>
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

function toMatchTypeAccent(matchType: PolicyMatchType) {
  if (matchType === 'Potential Conflict') {
    return {
      badge: 'border-[#F5C2C7] bg-[#FFF1F3] text-[#B42318] dark:border-[#B42318]/30 dark:bg-[#B42318]/10 dark:text-[#FCA5A5]',
      icon: 'bg-[#FEE4E2] text-[#B42318] dark:bg-[#B42318]/15 dark:text-[#FCA5A5]',
      card: 'border-[#F5C2C7]',
    }
  }

  if (matchType === 'Coordination Required') {
    return {
      badge: 'border-[#E9D5FF] bg-[#FAF5FF] text-[#A855F7] dark:border-white/10 dark:bg-[#A855F7]/10 dark:text-[#E9D5FF]',
      icon: 'bg-[#F3E8FF] text-[#A855F7] dark:bg-[#A855F7]/15 dark:text-[#E9D5FF]',
      card: 'border-[#E9D5FF]',
    }
  }

  return {
    badge: 'border-[#CFE9D9] bg-[#EEF9F1] text-[#16794B] dark:border-[#16794B]/30 dark:bg-[#123123] dark:text-[#86EFAC]',
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
      panel: 'border-[#E9D5FF] bg-[#FDF7FF] dark:border-[#6B3A87] dark:bg-[#271739]',
      hover: 'hover:bg-[#FDF7FF]/80 dark:hover:bg-white/5',
      pill: 'bg-[#FAF5FF] text-[#A855F7] dark:bg-[#A855F7]/15 dark:text-[#E9D5FF]',
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
  const [mode, setMode] = useState<'manual' | 'ai'>('manual')
  const [budgetItems, setBudgetItems] = useState<BudgetItemDraft[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatMessages, setChatMessages] = useState<{ from: 'ai' | 'user'; text: string }[]>([
    {
      from: 'ai',
      text: 'Welcome to the Budget Copilot!\n\nBefore we begin, I need to understand a few things about your project to help you better.',
    },
    {
      from: 'ai',
      text: "Is this a new project you're starting, or is it a continuation of an existing initiative?",
    },
  ])
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
    error: null,
    sourceFileCount: 0,
    scopeKey: null,
  })
  const supportingDocumentCumulativeInFlightRef = useRef<string | null>(null)
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

  const matchedAiSuggestions = useMemo<MatchedAiSuggestion[]>(
    () =>
      aiSuggestions.map((suggestion) => {
        const priorityRecord =
          strategicPriorities.find(
            (option) =>
              !option.parentId && labelsMatch(option.name, suggestion.strategicPriority)
          ) ?? null
        const classificationRecord =
          strategicPriorities.find((option) => {
            if (!option.parentId) return false
            if (!labelsMatch(option.name, suggestion.strategicPriorityClassification)) return false
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
    () =>
      uploadedFiles
        .map((file) => {
          const signature = getUploadedFileSignature(file)
          const analysis = supportingDocumentAnalyses[signature]

          if (analysis?.status !== 'complete' || !analysis.rawSummary?.trim()) {
            return null
          }

          return {
            id: signature,
            file,
            rawSummary: analysis.rawSummary,
            parsedSummary: analysis.parsedSummary,
          }
        })
        .filter(Boolean) as Array<{
        id: string
        file: File
        rawSummary: string
        parsedSummary: SupportingDocumentEvaluationSummary | null
      }>,
    [supportingDocumentAnalyses, uploadedFiles]
  )
  const completedSupportingDocumentScopeKey = useMemo(
    () =>
      completedSupportingDocumentInputs
        .map((item) => `${item.id}:${item.rawSummary.length}`)
        .join('|'),
    [completedSupportingDocumentInputs]
  )

  useEffect(() => {
    if (mode !== 'manual') return

    if (completedSupportingDocumentInputs.length <= 1) {
      supportingDocumentCumulativeInFlightRef.current = null
      setSupportingDocumentCumulativeAnalysis({
        status: 'idle',
        parsedSummary: null,
        rawSummary: '',
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

  const visibleBudgetFields = useMemo(
    () => getVisibleBudgetFields(formValues.activityType),
    [formValues.activityType]
  )

  const totalRequested = useMemo(
    () => budgetItems.reduce((sum, item) => sum + item.budgetRequested, 0),
    [budgetItems]
  )

  useEffect(() => {
    if (mode !== 'manual') return

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
  }, [mode])

  const handleOptionSelect = (label: string) => {
    setChatMessages((prev) => [
      ...prev,
      { from: 'user', text: label },
      { from: 'ai', text: `Great. You selected "${label}". Please describe scope, beneficiaries, budget and timeline.` },
    ])
    setOptionSelected(true)
  }

  const handleSend = () => {
    if (!chatInput.trim()) return
    setChatMessages((prev) => [
      ...prev,
      { from: 'user', text: chatInput },
      { from: 'ai', text: 'Thanks. I am now structuring this into the required budget fields.' },
    ])
    setChatInput('')
  }

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
      }
    }

    navigate(`/respondent/projects/${createdBudget.budgetRefId ?? createdBudget.id}`)
  }

  const applyAiFieldSuggestion = (
    field: SupportingDocumentSuggestedProjectField,
    suppressRefresh = false,
  ): { appliedName?: string; appliedDescription?: string } => {
    const mapping = resolveAiFieldMapping(field)
    if (!mapping) return {}

    const rawValue = Array.isArray(field.suggested_value)
      ? field.suggested_value.join(', ')
      : (field.suggested_value ?? '')

    if (mapping === 'initiativeName') {
      updateField('initiativeName', rawValue)
      if (!suppressRefresh) {
        const desc = formValues.summary.trim()
        if (rawValue.trim() && desc) void refreshAiSuggestions(rawValue.trim(), desc)
      }
      return { appliedName: rawValue }
    }

    if (mapping === 'summary') {
      updateField('summary', rawValue)
      if (!suppressRefresh) {
        const name = formValues.initiativeName.trim()
        if (name && rawValue.trim()) void refreshAiSuggestions(name, rawValue.trim())
      }
      return { appliedDescription: rawValue }
    }

    if (mapping === 'category') {
      const matched = CATEGORY_OPTIONS.find(
        (opt) => opt.label.toLowerCase() === rawValue.toLowerCase()
      )
      if (matched) {
        updateField('category', matched.value)
      } else {
        showErrorToast('Category not matched', `"${rawValue}" does not match any available category option.`)
      }
      return {}
    }

    if (mapping === 'technologyCompany') {
      const normalized = rawValue.toLowerCase()
      const matched = technologyCompanies.find(
        (company) =>
          company.name.toLowerCase() === normalized ||
          company.name.toLowerCase().includes(normalized) ||
          normalized.includes(company.name.toLowerCase())
      )
      if (matched) {
        handleTechnologyCompanyChange(matched.id)
      } else {
        showErrorToast('Company not matched', `"${rawValue}" does not match any available Technology Company.`)
      }
    }

    return {}
  }

  const applyAllAiFieldSuggestions = () => {
    let appliedName: string | undefined
    let appliedDescription: string | undefined

    for (const field of actionSuggestedFields) {
      const result = applyAiFieldSuggestion(field, true)
      if (result.appliedName !== undefined) appliedName = result.appliedName
      if (result.appliedDescription !== undefined) appliedDescription = result.appliedDescription
    }

    const name = (appliedName ?? formValues.initiativeName).trim()
    const desc = (appliedDescription ?? formValues.summary).trim()
    if (name && desc) void refreshAiSuggestions(name, desc)
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

  return (
    <div className="w-full space-y-6">
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

          <div className="flex w-full flex-col gap-3 lg:flex-row xl:w-auto xl:items-center">
            <div className="grid w-full grid-cols-1 gap-2 rounded-2xl border border-[#DDEBFF] bg-white p-2 text-center shadow-sm dark:border-white/10 dark:bg-white/5 sm:grid-cols-3 lg:min-w-[360px] xl:w-auto">
              <div className="rounded-xl bg-[#EFF6FF] px-3 py-2 dark:bg-white/5">
                <p className="text-xs font-semibold text-[#64748B]">Cycle</p>
                <p className="text-sm font-bold text-[#0F172A] dark:text-white">2026</p>
              </div>
              <div className="rounded-xl bg-[#EFF6FF] px-3 py-2 dark:bg-white/5">
                <p className="text-xs font-semibold text-[#64748B]">Status</p>
                <p className="text-sm font-bold text-[#0F172A] dark:text-white">Draft</p>
              </div>
              <div className="rounded-xl bg-[#EFF6FF] px-3 py-2 dark:bg-white/5">
                <p className="text-xs font-semibold text-[#64748B]">Line Item Total</p>
                <CurrencyAmount amount={totalRequested} full className="mt-1 text-sm font-bold text-[#286CFF]" />
              </div>
            </div>

            <div className="flex w-full flex-wrap items-center justify-center gap-3 rounded-2xl border border-[#DDEBFF] bg-white px-4 py-3 shadow-sm dark:border-white/10 dark:bg-white/5 sm:flex-nowrap lg:w-auto">
              <User className={cn('h-4 w-4', mode === 'manual' ? 'text-[var(--primary)]' : 'text-[#94A3B8]')} />
              <span className={cn('text-sm font-bold', mode === 'manual' ? 'text-[var(--primary)]' : 'text-[#94A3B8]')}>Manual</span>
              <button
                onClick={() => setMode(mode === 'manual' ? 'ai' : 'manual')}
                className={cn('relative h-6 w-12 overflow-hidden rounded-full p-1 transition-colors', mode === 'ai' ? 'bg-[var(--primary)]' : 'bg-[#CBD5E1]')}
                aria-label="Toggle input mode"
              >
                <div className={cn('h-4 w-4 rounded-full bg-white shadow transition-transform', mode === 'ai' ? 'translate-x-6' : 'translate-x-0')} />
              </button>
              <span className={cn('text-sm font-bold', mode === 'ai' ? 'text-[var(--primary)]' : 'text-[#94A3B8]')}>AI Copilot</span>
              <Bot className={cn('h-4 w-4', mode === 'ai' ? 'text-[var(--primary)]' : 'text-[#94A3B8]')} />
            </div>
          </div>
        </div>
      </div>

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
                <div className="rounded-2xl border border-[#E9D5FF] bg-white px-4 py-4 text-sm text-[#A855F7] shadow-[0_12px_30px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#241735] dark:text-[#E9D5FF] sm:px-6">
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Evaluating ICT Budget Considerations policies...
                  </div>
                </div>
              ) : policyEvaluationError ? (
                <div className="rounded-2xl border border-[#FFD4D1] bg-[#FFF5F5] px-4 py-4 text-sm text-[#B42318] dark:border-[#EA4F49]/40 dark:bg-[#EA4F49]/10 sm:px-6">
                  {policyEvaluationError}
                </div>
              ) : policyEvaluationResult ? (
                <div
                  className={cn(
                    'relative overflow-hidden rounded-2xl border border-[#E9D5FF] shadow-[0_12px_30px_rgba(15,23,42,0.06)] dark:border-white/10',
                    policyEvaluationExpanded
                      ? 'bg-white dark:bg-[#1E293B]'
                      : 'bg-gradient-to-b from-[#FDF7FF] to-white dark:bg-[linear-gradient(180deg,#241735_0%,#1E293B_100%)]'
                  )}
                >
                  <button
                    type="button"
                    onClick={() => {
                      if (policyEvaluationResult.overallAssessment.hasPolicyMatch) {
                        setPolicyEvaluationExpanded((value) => !value)
                      }
                    }}
                    className={cn(
                      'flex w-full items-start justify-between gap-4 px-6 py-5 text-left transition-colors',
                      policyPanelTheme.hover
                    )}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#A855F7_0%,#C084FC_100%)] text-white shadow-[0_16px_30px_rgba(168,85,247,0.24)]">
                        <Bot className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-xl font-bold text-[#0F172A] dark:text-white">
                            AI Budget Considerations
                          </h2>
                          <span
                            className={cn(
                              'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold',
                              policyEvaluationResult.overallAssessment.hasPotentialConflict
                                ? policyPanelTheme.pill
                                : policyEvaluationResult.overallAssessment.hasPolicyMatch
                                  ? policyPanelTheme.pill
                                  : policyPanelTheme.pill
                            )}
                          >
                            {policyEvaluationResult.overallAssessment.hasPotentialConflict
                              ? 'Potential Conflict Detected'
                              : policyEvaluationResult.overallAssessment.hasPolicyMatch
                                ? 'Policy Match Found'
                                : 'No Policy Match'}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-[#475569] dark:text-slate-100">
                          {policyEvaluationResult.overallAssessment.hasPolicyMatch
                            ? 'AI screened this project against DGE ICT Budget Considerations and highlighted the policies that need attention.'
                            : policyEvaluationResult.overallAssessment.summary}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-3">
                      {policyEvaluationResult.overallAssessment.hasPolicyMatch ? (
                        <div className="flex flex-wrap items-center justify-end gap-2 text-sm">
                          {policyEvaluationResult.overallAssessment.hasPotentialConflict && (
                            <span className="rounded-full bg-[#FFF1F2] px-2.5 py-1 text-[#DC2626] dark:bg-[#DC2626]/15 dark:text-[#FCA5A5]">
                              {policyMatchGroups.find((group) => group.matchType === 'Potential Conflict')?.items.length ?? 0}{' '}
                              <span className="text-[#64748B] dark:text-slate-100">conflicts</span>
                            </span>
                          )}
                          {policyEvaluationResult.overallAssessment.hasCoordinationRequirement && (
                            <span className="rounded-full bg-[#FAF5FF] px-2.5 py-1 text-[#A855F7] dark:bg-[#A855F7]/15 dark:text-[#E9D5FF]">
                              {policyMatchGroups.find((group) => group.matchType === 'Coordination Required')?.items.length ?? 0}{' '}
                              <span className="text-[#64748B] dark:text-slate-100">coordination</span>
                            </span>
                          )}
                          {policyEvaluationResult.overallAssessment.hasAllowedWithConditions && (
                            <span className="rounded-full bg-[#ECFDF3] px-2.5 py-1 text-[#16A34A] dark:bg-[#16A34A]/15 dark:text-[#BBF7D0]">
                              {policyMatchGroups.find((group) => group.matchType === 'Allowed With Conditions')?.items.length ?? 0}{' '}
                              <span className="text-[#64748B] dark:text-slate-100">conditional</span>
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="rounded-full bg-[#ECFDF3] px-2.5 py-1 text-sm font-semibold text-[#027A48] dark:bg-[#027A48]/15 dark:text-[#A6F4C5]">
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
                                  const hasEvidence = item.evidenceFromProject.length > 0

                                  return (
                                    <article
                                      key={`${item.policyNumber}-${item.policyName}-detail`}
                                      className="overflow-hidden rounded-2xl border border-[#E9D5FF] bg-gradient-to-r from-[#FDF7FF] to-white transition-transform duration-300 hover:-translate-y-0.5 dark:border-white/10 dark:from-[#241735] dark:to-[#1A1329]"
                                    >
                                      <div className="border-b border-black/5 px-4 py-3.5 dark:border-white/10">
                                        <div className="flex items-center gap-3">
                                          <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', accent.icon)}>
                                            {group.matchType === 'Potential Conflict' ? (
                                              <AlertTriangle className="h-4 w-4" />
                                            ) : group.matchType === 'Coordination Required' ? (
                                              <Layers className="h-4 w-4" />
                                            ) : (
                                              <Lightbulb className="h-4 w-4" />
                                            )}
                                          </div>
                                          <div className="min-w-0 flex-1">
                                            <div className="mb-1 flex flex-wrap items-center gap-2">
                                              <span className="rounded-full border border-[#E9D5FF] bg-white/80 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#A855F7] dark:border-white/10 dark:bg-white/5 dark:text-[#E9D5FF]">
                                                Prediction
                                              </span>
                                              <span className={cn('rounded-full border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em]', accent.badge)}>
                                                {item.matchType}
                                              </span>
                                            </div>
                                            <h3 className="text-sm font-semibold leading-5 text-slate-800 dark:text-white">
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
                                            <p className="text-[10px] uppercase tracking-[0.12em] text-slate-400 dark:text-slate-300">
                                              Probability
                                            </p>
                                          </div>
                                        </div>
                                      </div>

                                      <div className="px-4 py-3.5">
                                        <p className="mb-3 text-xs leading-relaxed text-slate-600 dark:text-slate-200">
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
                                          <Clock3 className="h-4 w-4 text-slate-400" />
                                          <span className="text-xs text-slate-500 dark:text-slate-300">Policy Area:</span>
                                          <span className="text-xs font-semibold text-slate-700 dark:text-white">
                                            {item.strategicArea}
                                          </span>
                                        </div>

                                        <div className="mb-3 rounded-xl border border-[#DCE8F6] bg-white/75 p-3 dark:border-white/10 dark:bg-white/5">
                                          <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#A855F7] dark:text-[#E9D5FF]">
                                            Recommended Action
                                          </p>
                                          <p className="text-xs text-slate-700 dark:text-slate-100">
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
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                              {policyMatchGroups
                                .flatMap((group) =>
                                  group.items.map((item) => ({ group, item }))
                                )
                                .map(({ group, item }) => {
                                  const accent = toMatchTypeAccent(group.matchType)

                                  return (
                                    <div
                                      key={`${item.policyNumber}-${item.policyName}-preview`}
                                      className="relative overflow-hidden rounded-[18px] border border-[#DDEBFF] bg-white px-3 py-2.5 shadow-[0_8px_20px_rgba(15,23,42,0.04)] dark:border-white/10 dark:bg-[#0F172A]/70"
                                    >
                                      <div className="flex items-center gap-2.5">
                                        <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', accent.icon)}>
                                          {group.matchType === 'Potential Conflict' ? (
                                            <AlertTriangle className="h-3.5 w-3.5" />
                                          ) : group.matchType === 'Coordination Required' ? (
                                            <Layers className="h-3.5 w-3.5" />
                                          ) : (
                                            <CheckCircle2 className="h-3.5 w-3.5" />
                                          )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                          <div className="flex items-center justify-between gap-3">
                                            <span className={cn('inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em]', accent.badge)}>
                                              {item.matchType}
                                            </span>
                                            <span className="text-xs font-bold text-[#A855F7] dark:text-[#E9D5FF]">
                                              {item.relevanceScore}
                                            </span>
                                          </div>
                                          <p className="mt-1.5 line-clamp-2 text-sm font-bold leading-5 text-[#0F172A] dark:text-white">
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
                        <div className="relative overflow-hidden rounded-2xl border border-dashed border-[#E9D5FF] bg-[linear-gradient(90deg,#FDF7FF_0%,#F6EDFF_100%)] shadow-sm dark:border-white/10 dark:bg-[linear-gradient(90deg,#2A123D_0%,#1E293B_100%)]">
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
                                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#A855F7]/12 text-[#A855F7] dark:bg-[#A855F7]/12 dark:text-[#E9D5FF]">
                                  <Sparkles className="h-3.5 w-3.5" />
                                </div>
                                <h4 className="text-sm font-medium text-[#0F172A] dark:text-white">
                                  AI Recommendation
                                </h4>
                              </div>

                              <div className="flex flex-col gap-2 xl:flex-row xl:flex-wrap xl:items-center xl:gap-3">
                                <div className="min-w-0 rounded-xl bg-white/80 px-3 py-2 dark:bg-white/5">
                                  <p className="truncate text-sm text-[#475569] dark:text-slate-300">
                                    <span className="font-medium text-[#64748B] dark:text-slate-400">Suggested Strategic Priority:</span>{' '}
                                    <span className="font-semibold text-[#A855F7] dark:text-[#E9D5FF]">{topAiSuggestion.strategicPriority}</span>
                                  </p>
                                </div>
                                <div className="min-w-0 rounded-xl bg-white/80 px-3 py-2 dark:bg-white/5">
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
                                className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-[#E9D5FF] bg-white/90 px-4 text-sm font-medium text-[#A855F7] transition-colors hover:bg-[#FAF5FF] dark:border-white/10 dark:bg-white/10 dark:text-[#E9D5FF] dark:hover:bg-white/15"
                              >
                                <span>{aiSuggestionExpanded ? 'Hide Details' : 'View Details'}</span>
                                <ChevronDown className={cn('h-4 w-4 transition-transform', aiSuggestionExpanded && 'rotate-180')} />
                              </button>
                            </div>
                          </div>

                          {aiSuggestionExpanded && (
                            <div className="border-t border-[#E9D5FF] bg-white/80 px-3 py-3 dark:border-white/10 dark:bg-[#0F172A]/20">
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
                                          <div className="inline-flex items-center rounded-full bg-[#FAF5FF] px-2.5 py-1 text-xs font-semibold text-[#A855F7] dark:bg-[#A855F7]/15 dark:text-[#E9D5FF]">
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
                                        <div className="rounded-xl bg-[#FAF5FF] px-3 py-2 text-center dark:bg-white/10">
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
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-bold text-[#0F172A] dark:text-white">{option.title}</p>
                            <p className="mt-1 text-xs leading-5 text-[#64748B] dark:text-slate-300">
                              {option.description}
                            </p>
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
                        </div>
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

          <section className="rounded-2xl border border-[#DDEBFF] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#1E293B]">
            <div className="border-b border-[#DDEBFF] px-4 py-4 dark:border-white/10 sm:px-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#BFD8FF] bg-[#EFF6FF] text-[#286CFF] dark:border-white/10 dark:bg-white/5">
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
                  <Button variant="ghost" asChild className="w-full sm:w-auto"><Link to="/respondent/projects">Cancel</Link></Button>
                  <Button variant="outline" className="w-full rounded-xl sm:w-auto" onClick={() => void handleSaveDraft()}>
                    Save Draft
                  </Button>
                </div>
              </div>
            </div>
          </div>

            <aside className="space-y-4">
              <div className="rounded-2xl border border-[#E9D5FF] bg-gradient-to-b from-[#FDF7FF] to-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)] dark:border-white/10 dark:from-[#2A123D] dark:to-[#1E293B]">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#A855F7] text-white shadow-[0_10px_24px_rgba(168,85,247,0.24)]">
                      <Sparkles className="h-5 w-5" />
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
                  <span className="rounded-full border border-[#E9D5FF] bg-white/80 px-2.5 py-1 text-[11px] font-semibold text-[#A855F7] dark:border-white/10 dark:bg-white/10 dark:text-[#E9D5FF]">
                    {activeSupportingDocumentSummary.type === 'cumulative' && activeSupportingDocumentSummary.fileCount > 1 ? 'Combined' : 'Single'}
                  </span>
                </div>

                <div className="space-y-4">
                  <div className="group rounded-2xl border border-[#E9D5FF] bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-[#1E293B]">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#FAF5FF] text-[#A855F7] dark:bg-[#A855F7]/12 dark:text-[#E9D5FF]">
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
                      ) : (
                        <ArrowUpRight className="h-4 w-4 text-[#D8B4FE] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                      )}
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
                            <div key={field.field_key ?? field.field_label} className="rounded-xl border border-[#F0D9FF] bg-[#FDF7FF] px-3 py-3 dark:border-white/10 dark:bg-white/5">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#64748B] dark:text-slate-300">
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
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#FAF5FF] text-[#A855F7] dark:bg-[#A855F7]/12 dark:text-[#E9D5FF]">
                          <CircleDollarSign className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[#A855F7] dark:text-[#E9D5FF]">Budget Lines</p>
                          <p className="text-xs text-[#64748B] dark:text-slate-300">Extracted financial evidence</p>
                        </div>
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-[#D8B4FE] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                    </div>
                    {activeSupportingDocumentSummary.loading ? (
                      <div className="flex items-center gap-2 rounded-xl border border-dashed border-[#E9D5FF] bg-[#FDF7FF] px-3 py-4 text-sm text-[#A855F7] dark:border-white/10 dark:bg-white/5 dark:text-[#E9D5FF]">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Consolidating budget lines...
                      </div>
                    ) : actionBudgetLines.length > 0 ? (
                      <div className="space-y-2">
                        {actionBudgetLines.slice(0, 3).map((line, index) => (
                          <div key={`${line.line_number ?? index}-${line.description ?? 'budget-line'}`} className="rounded-xl border border-[#F0D9FF] bg-[#FDF7FF] px-3 py-3 dark:border-white/10 dark:bg-white/5">
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
                          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#64748B] dark:text-slate-300">Total extracted amount</p>
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
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#FAF5FF] text-[#A855F7] dark:bg-[#A855F7]/12 dark:text-[#E9D5FF]">
                          <CheckCircle2 className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[#A855F7] dark:text-[#E9D5FF]">Account Code Suggestion</p>
                          <p className="text-xs text-[#64748B] dark:text-slate-300">Best-fit GL recommendation</p>
                        </div>
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-[#D8B4FE] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                    </div>
                    {activeSupportingDocumentSummary.loading ? (
                      <div className="flex items-center gap-2 rounded-xl border border-dashed border-[#E9D5FF] bg-[#FDF7FF] px-3 py-4 text-sm text-[#A855F7] dark:border-white/10 dark:bg-white/5 dark:text-[#E9D5FF]">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Mapping account code recommendation...
                      </div>
                    ) : actionAccountCode ? (
                      <div className="space-y-3">
                        <div className="rounded-xl border border-[#E9D5FF] bg-[linear-gradient(135deg,#FDF7FF_0%,#FAF5FF_100%)] px-3 py-3 dark:border-white/10 dark:bg-[linear-gradient(135deg,#2A123D_0%,#1E293B_100%)]">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#64748B] dark:text-slate-300">Primary account code</p>
                              <p className="mt-1 text-sm font-bold text-[#0F172A] dark:text-white">{actionAccountCode.account_code ?? '-'}</p>
                              {typeof actionAccountCode.requested_budget === 'number' && (
                                <div className="mt-1.5 flex items-center gap-1.5">
                                  <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#64748B] dark:text-slate-300">Requested</p>
                                  <CurrencyAmount amount={actionAccountCode.requested_budget} full className="text-xs font-bold text-[#A855F7] dark:text-[#E9D5FF]" />
                                </div>
                              )}
                            </div>
                            {typeof actionAccountCode.account_code_confidence === 'number' && (
                              <span className="rounded-full bg-white px-2 py-1 text-[11px] font-bold text-[#A855F7] dark:bg-white/10 dark:text-[#E9D5FF]">
                                {actionAccountCode.account_code_confidence}%
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="grid gap-2 sm:grid-cols-3">
                          {(['l1', 'l2', 'l3'] as const).map((level) => (
                            <div key={level} className="rounded-xl border border-[#F0D9FF] bg-[#FDF7FF] px-3 py-2.5 dark:border-white/10 dark:bg-white/5">
                              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#64748B] dark:text-slate-300">{level.toUpperCase()}</p>
                              <p className="mt-1 text-xs font-semibold text-[#0F172A] dark:text-white">
                                {actionAccountCode.classification_path?.[level] ?? '-'}
                              </p>
                            </div>
                          ))}
                        </div>
                        <div className="rounded-xl border border-[#F0D9FF] bg-white px-3 py-3 text-sm text-[#475569] dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
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
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#FAF5FF] text-[#A855F7] dark:bg-[#A855F7]/12 dark:text-[#E9D5FF]">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[#A855F7] dark:text-[#E9D5FF]">Summary</p>
                          <p className="text-xs text-[#64748B] dark:text-slate-300">Cross-document AI readout</p>
                        </div>
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-[#D8B4FE] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                    </div>
                    {activeSupportingDocumentSummary.loading ? (
                      <div className="flex items-center gap-2 rounded-xl border border-dashed border-[#E9D5FF] bg-[#FDF7FF] px-3 py-4 text-sm text-[#A855F7] dark:border-white/10 dark:bg-white/5 dark:text-[#E9D5FF]">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Building the current summary card...
                      </div>
                    ) : actionDocumentSummary || actionEvidenceAssessment ? (
                      <div className="space-y-3">
                        <div className="rounded-xl border border-[#F0D9FF] bg-[#FDF7FF] px-3 py-3 dark:border-white/10 dark:bg-white/5">
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
                              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#64748B] dark:text-slate-300">Evidence snapshot</p>
                              {typeof actionEvidenceAssessment?.evidence_score === 'number' && (
                                <span className="rounded-full bg-[#FAF5FF] px-2 py-1 text-[11px] font-bold text-[#A855F7] dark:bg-[#A855F7]/15 dark:text-[#E9D5FF]">
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
      ) : (
        <div className="sticky top-6 flex h-[calc(100vh-180px)] w-full flex-col overflow-hidden rounded-2xl border border-[#B0DBFF] bg-gradient-to-b from-[#E7F5FF] to-white shadow-md dark:border-white/10 dark:from-[#10213B] dark:to-[#1E293B]">
          <div className="flex items-center justify-between border-b border-[#B0DBFF] bg-gradient-to-r from-[#286CFF]/5 to-transparent px-5 py-4 dark:border-white/10">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#286CFF] to-[#4F98FF] text-white shadow-lg shadow-blue-200 dark:shadow-none">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">Budget Copilot</h3>
                <p className="text-xs text-slate-500 dark:text-slate-300">Interactive AI Assistant</p>
              </div>
            </div>
            <button className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-transparent px-3 text-sm font-medium text-slate-500 transition-colors hover:bg-[#E7F5FF] hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#286CFF] focus-visible:ring-offset-2 dark:text-slate-200 dark:hover:bg-white/10">
              <RefreshCw className="mr-1 h-4 w-4" />
              Clear
            </button>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
            {chatMessages.map((msg, i) => (
              <div key={i} className={cn('flex gap-3', msg.from === 'user' ? 'justify-end' : 'justify-start')}>
                {msg.from === 'ai' && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#286CFF] to-[#4F98FF] text-xs text-white shadow-md">
                    <Zap className="h-4 w-4 text-white" />
                  </div>
                )}
                <div className="max-w-[90%] space-y-3">
                  <div
                    className={cn(
                      'rounded-2xl px-4 py-3 text-sm shadow-sm',
                      msg.from === 'ai'
                        ? 'rounded-tl-none border border-slate-200 bg-white text-slate-800 dark:border-white/10 dark:bg-[#1E293B] dark:text-white'
                        : 'rounded-tr-none bg-[#286CFF] text-white'
                    )}
                  >
                    <p className="whitespace-pre-line">{msg.text}</p>
                  </div>
                  {msg.from === 'ai' && i === 1 && !optionSelected && (
                    <div className="space-y-2">
                      {COPILOT_OPTIONS.map((opt) => {
                        const Icon = opt.icon
                        return (
                          <button
                            key={opt.label}
                            onClick={() => handleOptionSelect(opt.label)}
                            className="group w-full rounded-xl border border-slate-200 bg-white p-4 text-left transition-all hover:border-[#286CFF] hover:bg-blue-50/30 dark:border-white/10 dark:bg-[#1E293B] dark:hover:bg-[#24344E]"
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#E7F5FF] transition-colors group-hover:bg-[#286CFF]">
                                <Icon className="h-5 w-5 text-[#286CFF] group-hover:text-white" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-slate-800 group-hover:text-[#286CFF] dark:text-white">{opt.label}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-300">{opt.sub}</p>
                              </div>
                              <ChevronRight className="h-5 w-5 shrink-0 text-slate-300 group-hover:text-[#286CFF]" />
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="px-5 pb-5">
            <input accept=".pdf,.docx,.xlsx" className="hidden" multiple type="file" />
            <div className="flex gap-2">
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Describe your project or ask a question..."
                className="h-9 min-w-0 flex-1 rounded-xl border border-[#B0DBFF] bg-white px-3 py-1 text-base shadow-sm outline-none transition-[color,box-shadow] placeholder:text-slate-400 focus:border-[#286CFF] focus:ring-2 focus:ring-[#286CFF]/10 dark:border-white/10 dark:bg-[#0F172A]/35 dark:text-white dark:placeholder:text-slate-500 md:text-sm"
              />
              <button
                onClick={handleSend}
                disabled={!chatInput.trim()}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-transparent bg-gradient-to-r from-[#286CFF] to-[#4F98FF] p-0 text-white shadow-md transition-colors hover:opacity-90 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#002DC2] focus-visible:ring-offset-2"
              >
                <Send className="h-4 w-4 text-white" />
              </button>
            </div>
            <p className="mt-2 text-center text-xs text-slate-400 dark:text-slate-300">Try: "Cloud migration project for AED 2M starting Q1 2026"</p>
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
