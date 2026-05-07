import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
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
  FileText,
  FolderKanban,
  Layers,
  Loader2,
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
import { useToast } from '@/context/ToastContext'
import type { BudgetItemDraft } from '@/domain/classification'
import type {
  Dga_ict_budgetsdga_activity_type,
  Dga_ict_budgetsdga_budget_item_type,
} from '@/generated/models/Dga_ict_budgetsModel'
import { DirhamIcon } from '@/components/shared/DirhamIcon'
import { CurrencyAmount } from '@/components/shared/CurrencyAmount'
import {
  createIctBudgetDraft,
  type CreateIctBudgetDraftInput,
} from '@/services/ictBudgetDraftService'
import { createBudgetLineItems } from '@/services/budgetLineItemService'
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

type ActivityType = Dga_ict_budgetsdga_activity_type
type BudgetItemType = Dga_ict_budgetsdga_budget_item_type

interface LookupSelectOption {
  value: string
  label: string
}

interface FormValues {
  initiativeName: string
  strategicPriorityId: string
  strategicPriorityClassificationId: string
  workStreamId: string
  technologyCompanyId: string
  technologyProductIds: string[]
  budgetItemType: BudgetItemType | null
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
  plannedStartDate: '',
  plannedEndDate: '',
  summary: '',
  activityType: null,
  totalBudgetPaidPreviousYear: '',
  totalBudgetPayableFutureYear: '',
  totalBudgetPayableNextYear: '',
  totalBudgetPayableForYearAfterNext: '',
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

function ProductMultiSelect({
  products,
  selectedIds,
  disabled,
  onToggle,
  onCreateRequest,
  invalid,
}: {
  products: TechnologyCompanyOption['products']
  selectedIds: string[]
  disabled?: boolean
  onToggle: (id: string) => void
  onCreateRequest: () => void
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
          <div className="border-t border-[#EAF0F6] p-2 dark:border-white/10">
            <Button variant="outline" className="w-full rounded-xl" onClick={onCreateRequest}>
              <Plus className="h-4 w-4" />
              Create New Product
            </Button>
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
  const [budgetItemsError, setBudgetItemsError] = useState<string | null>(null)
  const [lookupLoading, setLookupLoading] = useState(false)
  const [lookupError, setLookupError] = useState<string | null>(null)
  const [strategicPriorities, setStrategicPriorities] = useState<StrategicPriorityOption[]>([])
  const [workStreams, setWorkStreams] = useState<WorkStreamOption[]>([])
  const [technologyCompanies, setTechnologyCompanies] = useState<TechnologyCompanyOption[]>([])
  const [workStreamModalOpen, setWorkStreamModalOpen] = useState(false)
  const [newWorkStreamName, setNewWorkStreamName] = useState('')
  const [technologyProductModalOpen, setTechnologyProductModalOpen] = useState(false)
  const [newTechnologyProductName, setNewTechnologyProductName] = useState('')
  const [savedBudgetId, setSavedBudgetId] = useState<string | null>(null)
  const { runActionToast, showErrorToast, showSuccessToast } = useToast()

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
      nextErrors.activityType = 'Budget Type is required.'
    }

    visibleBudgetFields.forEach((field) => {
      if (!formValues[field]) {
        nextErrors[field] = `${toCurrencyFieldLabel(field)} is required.`
      }
    })

    if (budgetItems.length === 0) {
      nextErrors.budgetItems = 'Add at least one budget line item before saving the draft.'
    }

    setFieldErrors(nextErrors)
    setBudgetItemsError(nextErrors.budgetItems ?? null)

    if (Object.keys(nextErrors).length > 0) {
      showErrorToast(
        'Complete required fields',
        'Please fill the highlighted fields before saving this draft.'
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
      totalBudgetPaidPreviousYear: parseCurrencyValue(formValues.totalBudgetPaidPreviousYear),
      totalBudgetPayableFutureYear: parseCurrencyValue(formValues.totalBudgetPayableFutureYear),
      totalBudgetPayableNextYear: parseCurrencyValue(formValues.totalBudgetPayableNextYear),
      totalBudgetPayableForYearAfterNext: parseCurrencyValue(
        formValues.totalBudgetPayableForYearAfterNext
      ),
    }

    const createdBudgetId = await runActionToast(
      async () => {
        const budgetId = await createIctBudgetDraft(payload)

        await createBudgetLineItems(budgetId, budgetItems)

        return budgetId
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

    setSavedBudgetId(createdBudgetId)
    showSuccessToast(
      'Dataverse draft ready',
      `Created ICT budget id: ${createdBudgetId}`
    )
  }

  return (
    <div className="mx-auto max-w-[1180px] space-y-6">
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

      {savedBudgetId && (
        <div className="rounded-2xl border border-[#B7E0C2] bg-[#F2FBF5] px-4 py-3 text-sm text-[#166534]">
          Draft created in Dataverse. ICT Budget Id: <span className="font-semibold">{savedBudgetId}</span>
        </div>
      )}

      {mode === 'manual' ? (
        <>
          {lookupError && (
            <div className="rounded-2xl border border-[#FFD4D1] bg-[#FFF5F5] px-4 py-3 text-sm text-[#B42318]">
              {lookupError}
            </div>
          )}

          <div className="space-y-5">
            <FormSection
              title="Budget Item Details"
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
                      variant="outline"
                      className="rounded-xl"
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
                  <ProductMultiSelect
                    products={selectedTechnologyCompany?.products ?? []}
                    selectedIds={formValues.technologyProductIds}
                    disabled={!selectedTechnologyCompany || lookupLoading}
                    onToggle={toggleTechnologyProduct}
                    onCreateRequest={() => setTechnologyProductModalOpen(true)}
                    invalid={Boolean(fieldErrors.technologyProductIds)}
                  />
                </FormField>
              </div>
            </FormSection>

            <FormSection
              title="Budget Item Timelines"
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
              title="Budget Type"
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
              title="Budget Items"
              description="Add account-level amounts and GL classifications for the requested budget."
              icon={CircleDollarSign}
            >
              <BudgetItemsBuilder
                items={budgetItems}
                onChange={(items) => {
                  setBudgetItems(items)
                  if (items.length > 0) {
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
          </div>

          <Card className="overflow-hidden rounded-2xl border-[#DDEBFF] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#1E293B]">
            <CardContent className="p-4 sm:p-6">
              <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#BFD8FF] bg-[#EFF6FF] text-[var(--primary)] dark:border-white/10 dark:bg-white/5">
                    <Upload className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[var(--foreground)]">Documents</h3>
                    <p className="text-sm text-[var(--muted-foreground)]">Attach business cases, cost sheets, quotations, or technical evidence.</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="h-10 rounded-xl border-[#DDEBFF] bg-white shadow-sm">
                  <Upload className="h-4 w-4" />Upload Document
                </Button>
              </div>
              <div className="group rounded-xl border-2 border-dashed border-[#BFD8FF] bg-[#F8FBFF] p-8 text-center transition-colors hover:border-[var(--primary)] dark:bg-white/5">
                <Upload className="mx-auto mb-3 h-9 w-9 text-[var(--primary)] transition-transform group-hover:-translate-y-1" />
                <p className="text-sm font-bold text-[#0F172A] dark:text-white">Drop files here or click to upload</p>
                <p className="mt-1 text-xs text-[#64748B] dark:text-slate-200">PDF, DOCX, XLSX supported</p>
              </div>
            </CardContent>
          </Card>

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
