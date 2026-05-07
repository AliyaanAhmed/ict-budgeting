import { useState, useEffect, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useLocation, useParams, Link } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowLeft,
  Bot,
  Briefcase,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Download,
  Edit,
  FileCheck2,
  FileText,
  FolderKanban,
  History,
  Layers,
  MessageSquare,
  Package,
  Pencil,
  Save,
  Send,
  ShieldCheck,
  Sparkles,
  Trash2,
  WalletCards,
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
import { StatusBadge, RiskBadge } from '@/components/shared/StatusBadge'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CurrencyAmount } from '@/components/shared/CurrencyAmount'
import { DirhamIcon } from '@/components/shared/DirhamIcon'
import { ClarificationModal } from '@/components/shared/ClarificationModal'
import { ClarificationThread } from '@/components/shared/ClarificationThread'
import { ConfirmationModal } from '@/components/shared/ConfirmationModal'
import { ClassificationPickerModal } from '@/components/shared/ClassificationPickerModal'
import { useToast } from '@/context/ToastContext'
import { cn } from '@/lib/utils'
import { formatAEDFull } from '@/lib/utils'
import type { BudgetItemDraft } from '@/domain/classification'
import {
  createBudgetLineItems,
  deleteBudgetLineItem,
  getBudgetLineItemsByBudgetId,
  toBudgetItemDraft,
  updateBudgetLineItemAmount,
  type BudgetLineItemRecord,
} from '@/services/budgetLineItemService'

// ─── Static helpers ───────────────────────────────────────────────────────────

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="rounded-xl border border-[#EAF0F6] bg-[#F8FBFF] px-3 py-3 dark:border-white/10 dark:bg-white/5">
      <p className="mb-1 text-xs font-semibold text-[#64748B] dark:text-slate-200">{label}</p>
      <p className="text-sm font-medium text-[#0F172A] dark:text-white">{value || '-'}</p>
    </div>
  )
}

function SectionIcon({ icon: Icon }: { icon: React.ElementType }) {
  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#BFD8FF] bg-[#EFF6FF] text-[var(--primary)] dark:border-white/10 dark:bg-white/5">
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
}: {
  id?: string
  title: string
  description?: string
  icon: React.ElementType
  children: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-6 rounded-2xl border border-[#DDEBFF] bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#1E293B] sm:p-6">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-4">
          <SectionIcon icon={icon} />
          <div>
            <h3 className="text-lg font-bold text-[var(--foreground)]">{title}</h3>
            {description && <p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--muted-foreground)]">{description}</p>}
          </div>
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

function EditField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-[#0F172A] dark:text-white">
        {label}{required && <span className="ml-1 text-red-500">*</span>}
      </label>
      {children}
    </div>
  )
}

function EditSelect({
  value,
  onValueChange,
  options,
  placeholder,
  icon: Icon,
}: {
  value: string
  onValueChange: (v: string) => void
  options: string[]
  placeholder?: string
  icon?: React.ElementType
}) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger
        className="h-10 rounded-xl border-[#D9E6F7] bg-white shadow-sm transition-colors hover:border-[var(--primary-light)] focus:ring-[var(--primary)] dark:border-white/10 dark:bg-[#1E293B]"
      >
        <span className={cn('inline-flex w-full min-w-0 items-center gap-5 whitespace-nowrap', value ? 'font-semibold text-[#0F172A] dark:text-white' : 'text-[#64748B]')}>
          {Icon && <Icon className="h-4 w-4 shrink-0 text-[var(--primary)]" />}
          <SelectValue placeholder={placeholder} />
        </span>
      </SelectTrigger>
      <SelectContent className="rounded-xl">
        {options.map((o) => (
          <SelectItem key={o} value={o}>{o}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function EditDatePickerField({
  value,
  onChange,
  placeholder = 'Pick a date',
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
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
          'inline-flex h-10 w-full shrink-0 items-center justify-start gap-2 whitespace-nowrap rounded-xl border border-slate-200 bg-white px-4 py-2 text-left text-sm font-normal shadow-sm transition-colors duration-150 outline-none hover:border-[#043DFF] hover:bg-[#E7F5FF] hover:text-[#043DFF] active:bg-[#D3EDFF] focus-visible:ring-2 focus-visible:ring-[#286CFF] focus-visible:ring-offset-2 dark:border-white/10 dark:bg-[#1E293B] dark:text-white dark:hover:bg-white/5',
          selectedDate ? 'text-[#0F172A] dark:text-white' : 'text-[#64748B]'
        )}
      >
        <CalendarDays className="mr-2 h-4 w-4 shrink-0 text-[var(--primary)]" />
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

function BudgetItemsTable({
  items,
  loading,
  error,
  editable,
  savingId,
  deletingId,
  onSaveBudgetRequested,
  onDelete,
}: {
  items: BudgetLineItemRecord[]
  loading: boolean
  error: string | null
  editable: boolean
  savingId: string | null
  deletingId: string | null
  onSaveBudgetRequested: (lineItemId: string, amount: number) => Promise<void>
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
            const isValidAmount = draftValue.trim().length > 0 && Number.isFinite(parsedAmount) && parsedAmount >= 0
            const hasChanged = isValidAmount && parsedAmount !== item.budgetRequested
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
                        }}
                        placeholder="0"
                        className="h-10 rounded-xl border-[#D9E6F7] bg-white pl-9 pr-3 text-sm font-semibold focus-visible:ring-[#286CFF]/20 dark:border-white/10 dark:bg-[#1E293B]"
                      />
                    </div>
                  ) : (
                    <CurrencyAmount amount={item.budgetRequested} full className="font-semibold text-[#0F172A] dark:text-white" iconSize={14} />
                  )}
                </td>
                <td className="block py-2 md:table-cell md:px-4 md:py-3">
                  <div className="flex items-center gap-2">
                    {editable ? (
                      <>
                        <Button
                          size="sm"
                          className="h-9 w-9 rounded-xl p-0 text-white"
                          style={{ backgroundColor: '#286CFF' }}
                          disabled={!hasChanged || isSaving || isDeleting}
                          onClick={() => void onSaveBudgetRequested(item.id, parsedAmount)}
                          title={isSaving ? 'Saving' : 'Save'}
                          aria-label={isSaving ? `Saving ${item.accountName}` : `Save ${item.accountName}`}
                        >
                          <Save className={cn('h-4 w-4', isSaving && 'animate-pulse')} />
                        </Button>
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
  { id: 'sec-details',        label: 'Budget Item Details', icon: ClipboardCheck },
  { id: 'sec-timelines',      label: 'Timelines',           icon: CalendarDays   },
  { id: 'sec-summary',        label: 'Project Summary',     icon: FileText       },
  { id: 'sec-budget',         label: 'Budget & Amounts',    icon: WalletCards    },
  { id: 'sec-documents',      label: 'Documents',           icon: FileCheck2     },
  { id: 'sec-clarifications', label: 'Clarifications',      icon: MessageSquare  },
]

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

const CHANGE_LOGS = [
  { fieldName: 'Project Summary', oldValue: 'Initial cloud migration scope', newValue: 'Expanded cloud migration scope with analytics readiness', updatedBy: 'Mahmood Al Rashidi', updatedOn: '2026-04-24 10:32' },
  { fieldName: 'Requested Budget', oldValue: 'AED 2,250,000', newValue: 'AED 2,400,000', updatedBy: 'Ahmed Al Mazrouei', updatedOn: '2026-04-23 15:18' },
  { fieldName: 'Planned End Date', oldValue: '2027-02-28', newValue: '2027-03-31', updatedBy: 'Fatima Al Nuaimi', updatedOn: '2026-04-22 09:45' },
  { fieldName: 'Strategic Priority', oldValue: 'Digital Transformation', newValue: 'Digital Infrastructure', updatedBy: 'Hassan Al Blooshi', updatedOn: '2026-04-21 13:05' },
  { fieldName: 'Technology Product', oldValue: 'Azure SQL', newValue: 'Azure', updatedBy: 'Maryam Al Suwaidi', updatedOn: '2026-04-20 11:20' },
]

function ChangeLogTable() {
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
            {CHANGE_LOGS.map((log, index) => (
              <tr key={`${log.fieldName}-${index}`} className="border-b border-[#F1F5F9] transition-colors hover:bg-[#F8FAFC] dark:border-white/5 dark:hover:bg-white/5">
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

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>()
  const { pathname } = useLocation()
  const { runActionToast, showErrorToast, showSuccessToast } = useToast()

  const project = projects.find((p) => p.id === id) ?? projects[0]
  const ictBudgetId = project.ictBudgetId ?? null
  const hasDataverseBudgetProject = Boolean(ictBudgetId && GUID_PATTERN.test(ictBudgetId))

  const isReviewerView = pathname.includes('/reviewer/')
  const isApproverView = pathname.includes('/approver/')
  const isGovernanceView = isReviewerView || isApproverView
  const isDraftOrNeedsWork = project.status === 'Draft' || project.status === 'Needs Work'

  const currentRole = isReviewerView ? 'Reviewer' : isApproverView ? 'Approver' : 'Respondent'
  const backHref = isReviewerView ? '/reviewer/review-queue' : isApproverView ? '/approver/approval-queue' : '/respondent/projects'
  const homeHref = isReviewerView ? '/reviewer/dashboard' : isApproverView ? '/approver/dashboard' : '/respondent/dashboard'
  const queueLabel = isReviewerView ? 'Review Queue' : isApproverView ? 'Approval Queue' : 'My Projects'
  const pageTitle = isGovernanceView ? 'Review Budget Submission' : project.name
  const confidence = project.aiScore || 84
  const documentStatus = project.documents.length > 0 ? 'Complete' : 'Missing'
  const confidenceTone = confidence >= 80 ? 'green' : confidence >= 60 ? 'amber' : 'red'
  const riskTone = project.riskLevel === 'High' ? 'red' : project.riskLevel === 'Medium' ? 'amber' : 'green'
  const documentTone = documentStatus === 'Complete' ? 'green' : 'red'
  const budgetFit = project.riskLevel === 'High' || confidence < 60 ? 'Needs Review' : confidence < 80 ? 'Review' : 'Aligned'
  const budgetFitTone = budgetFit === 'Aligned' ? 'green' : budgetFit === 'Review' ? 'amber' : 'red'
  const actionContextLabel = isApproverView ? 'Approver decision controls' : 'Reviewer decision controls'
  const submitActionLabel = isApproverView ? 'Submit to DGE' : 'Submit to Approver'

  // ── Edit Mode State ──────────────────────────────────────────────────────────
  const [isEditMode, setIsEditMode] = useState(false)
  const [showLogs, setShowLogs] = useState(false)
  const [editForm, setEditForm] = useState({
    name: project.name,
    strategicPriority: project.strategicPriority,
    classification: project.classification,
    workStream: project.workStream,
    budgetType: project.budgetType,
    technologyCompany: project.technology.company,
    technologyProduct: project.technology.product,
    category: project.category,
    plannedStartDate: project.plannedStartDate,
    plannedEndDate: project.plannedEndDate,
    summary: project.summary,
  })
  const [savedForm, setSavedForm] = useState(editForm)
  const [budgetModalOpen, setBudgetModalOpen] = useState(false)
  const [budgetItemsLoading, setBudgetItemsLoading] = useState(false)
  const [budgetItemsError, setBudgetItemsError] = useState<string | null>(null)
  const [budgetLineItems, setBudgetLineItems] = useState<BudgetLineItemRecord[]>([])
  const [savingBudgetLineItemId, setSavingBudgetLineItemId] = useState<string | null>(null)
  const [deletingBudgetLineItemId, setDeletingBudgetLineItemId] = useState<string | null>(null)
  const [lineItemToDelete, setLineItemToDelete] = useState<BudgetLineItemRecord | null>(null)

  const fallbackBudgetItems = useMemo<BudgetLineItemRecord[]>(
    () =>
      project.budgetItems.map((item) => ({
        id: item.id,
        classificationId: item.id,
        accountName: item.accountName,
        l1: item.l1,
        l2: item.l2,
        l3: item.l3,
        expenseTypeLabel: item.classification,
        ebsCode: item.ebsFusionCode,
        fusionCode: item.glCode,
        budgetRequested: item.budgetRequested,
      })),
    [project.budgetItems]
  )

  const handleSaveEdit = () => {
    setSavedForm(editForm)
    setIsEditMode(false)
    showSuccessToast('Changes saved', 'The project details have been updated successfully.')
  }

  const handleCancelEdit = () => {
    setEditForm(savedForm)
    setIsEditMode(false)
  }

  const setField = <K extends keyof typeof editForm>(key: K, value: typeof editForm[K]) =>
    setEditForm((prev) => ({ ...prev, [key]: value }))

  // ── Clarification State ──────────────────────────────────────────────────────
  const [localClarifications, setLocalClarifications] = useState<Clarification[]>(project.clarifications)
  const [clarificationModalOpen, setClarificationModalOpen] = useState(false)

  const handleClarificationReply = (clarificationId: string, message: string) => {
    setLocalClarifications((prev) =>
      prev.map((c) => {
        if (c.id !== clarificationId) return c
        const newReply: ClarificationReply = {
          id: `${clarificationId}-R${c.replies.length + 1}`,
          fromRole: currentRole,
          fromName: currentUser.name,
          message,
          date: new Date().toISOString().split('T')[0],
        }
        return { ...c, replies: [...c.replies, newReply] }
      }),
    )
    showSuccessToast('Reply sent', 'Your response has been added to the clarification thread.')
  }

  const handleClarificationClose = (clarificationId: string) => {
    setLocalClarifications((prev) =>
      prev.map((c) =>
        c.id !== clarificationId
          ? c
          : { ...c, status: 'Closed' as const, closedAt: new Date().toISOString().split('T')[0] },
      ),
    )
    showSuccessToast('Clarification closed', 'This clarification has been closed and the respondent has been notified.')
  }

  const handleRaiseClarification = ({ message }: { message: string }) => {
    const newClarification: Clarification = {
      id: `CLR-${Date.now()}`,
      raisedBy: isApproverView ? 'Approver' : 'Reviewer',
      raisedByName: currentUser.name,
      raisedTo: 'Respondent',
      message,
      status: 'Open',
      date: new Date().toISOString().split('T')[0],
      replies: [],
    }
    setLocalClarifications((prev) => [...prev, newClarification])
    showSuccessToast('Clarification raised', 'The respondent has been notified and will see this in their review form.')
  }

  const showClarificationSection = localClarifications.length > 0 || isGovernanceView

  // ── Section navigation ───────────────────────────────────────────────────────
  const displayedBudgetItems = hasDataverseBudgetProject ? budgetLineItems : fallbackBudgetItems
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
        setBudgetItemsError(null)
      } catch (error) {
        if (cancelled) return
        setBudgetLineItems([])
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

  const handleCreateBudgetItems = async (items: BudgetItemDraft[]) => {
    if (!hasDataverseBudgetProject) {
      showErrorToast('Budget items unavailable', 'This project is not linked to a Dataverse ICT budget record.')
      return
    }

    const createdItems = await runActionToast(
      async () => {
        await createBudgetLineItems(ictBudgetId!, items)
        const refreshedItems = await getBudgetLineItemsByBudgetId(ictBudgetId!)
        setBudgetLineItems(refreshedItems)
        setBudgetItemsError(null)
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
  }

  const handleSaveBudgetRequested = async (lineItemId: string, amount: number) => {
    setSavingBudgetLineItemId(lineItemId)
    try {
      await runActionToast(
        async () => {
          await updateBudgetLineItemAmount(lineItemId, amount)
          setBudgetLineItems((current) =>
            current.map((item) =>
              item.id === lineItemId ? { ...item, budgetRequested: amount } : item
            )
          )
        },
        {
          processingTitle: 'Updating requested budget',
          processingDescription: 'Saving the requested budget amount for this line item.',
          successTitle: 'Requested budget updated',
          successDescription: 'The line item amount was updated successfully.',
          errorTitle: 'Unable to update requested budget',
          minDurationMs: 1800,
        }
      )
    } finally {
      setSavingBudgetLineItemId(null)
    }
  }

  const handleConfirmDeleteBudgetLineItem = async () => {
    if (!lineItemToDelete) return

    const lineItemId = lineItemToDelete.id
    setDeletingBudgetLineItemId(lineItemId)

    try {
      await runActionToast(
        async () => {
          await deleteBudgetLineItem(lineItemId)
          setBudgetLineItems((current) => current.filter((item) => item.id !== lineItemId))
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
  const display = {
    name: savedForm.name,
    strategicPriority: savedForm.strategicPriority,
    classification: savedForm.classification,
    workStream: savedForm.workStream,
    budgetType: savedForm.budgetType,
    technologyCompany: savedForm.technologyCompany,
    technologyProduct: savedForm.technologyProduct,
    category: savedForm.category,
    plannedStartDate: savedForm.plannedStartDate,
    plannedEndDate: savedForm.plannedEndDate,
    summary: savedForm.summary,
  }

  return (
    <div className="mx-auto max-w-[1200px] space-y-5">
      {/* Page Header */}
      <div className="rounded-2xl border border-[#DDEBFF] bg-white px-4 py-5 shadow-[0_10px_26px_rgba(15,23,42,0.05)] dark:border-white/10 dark:bg-[#1E293B] sm:px-6">
        <nav className="mb-4 flex flex-wrap items-center gap-1 text-xs text-[#64748B] dark:text-slate-200">
          <Link to={homeHref} className="hover:text-[#286CFF]">Home</Link>
          <span>/</span>
          <Link to={backHref} className="hover:text-[#286CFF]">{queueLabel}</Link>
          <span>/</span>
          <span className="text-[#0F172A] dark:text-white">{display.name}</span>
        </nav>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <Link to={backHref} className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-[#475569] transition-colors hover:text-[#286CFF] dark:text-slate-200">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-[#0F172A] dark:text-white sm:text-3xl">{pageTitle}</h1>
              <StatusBadge status={project.status} />
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
              <p className="text-sm leading-6 text-[#475569] dark:text-slate-200">{display.name}</p>
              <p className="text-sm font-medium text-[#475569] dark:text-slate-200">
                Created By: <span className="font-semibold text-[#0F172A] dark:text-white">{project.submittedBy}</span>
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
                    'inline-flex h-8 items-center rounded-lg px-3 text-sm font-semibold transition-colors',
                    !showLogs
                      ? 'bg-[#286CFF] text-white shadow-sm'
                      : 'text-[#64748B] hover:bg-[#F8FBFF] hover:text-[#286CFF] dark:text-slate-200 dark:hover:bg-white/5'
                  )}
                >
                  View Form
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
                  View Logs
                </button>
              </div>

              {!isEditMode && !showLogs && (
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
              <div className="rounded-xl bg-[#EFF6FF] px-3 py-3 text-center dark:bg-white/5">
                <p className="text-xs font-semibold text-[#64748B]">AI Confidence</p>
                <p className="text-lg font-bold text-[#286CFF]">{confidence}%</p>
              </div>
              <div className="rounded-xl bg-[#EFF6FF] px-3 py-3 text-center dark:bg-white/5">
                <p className="text-xs font-semibold text-[#64748B]">Documents</p>
                <p className={cn('text-lg font-bold', documentStatus === 'Complete' ? 'text-green-600' : 'text-amber-600')}>{documentStatus}</p>
              </div>
              <div className="rounded-xl bg-[#EFF6FF] px-3 py-3 text-center dark:bg-white/5">
                <p className="text-xs font-semibold text-[#64748B]">Budget</p>
                <CurrencyAmount amount={project.requestedBudget} className="justify-center text-lg font-bold text-[#0F172A] dark:text-white" iconSize={15} />
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
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleCancelEdit} className="h-9 rounded-xl border-[#286CFF]/30 text-[#475569] dark:border-white/10">
              Cancel
            </Button>
            <Button size="sm" onClick={handleSaveEdit} className="h-9 gap-1.5 rounded-xl text-white" style={{ backgroundColor: '#286CFF' }}>
              <Save className="h-3.5 w-3.5" />
              Save Changes
            </Button>
          </div>
        </div>
      )}

      {/* AI readiness banner */}
      {!showLogs && <div className="flex items-center gap-3 rounded-2xl border border-[#DDEBFF] bg-white px-4 py-3 shadow-sm dark:border-white/10 dark:bg-[#1E293B]">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E7F5FF] text-[#286CFF]">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[#0F172A] dark:text-white">
            {isGovernanceView ? 'Reviewer workspace ready' : 'Project submission appears complete and well-documented.'}
          </p>
          <p className="text-xs text-[#64748B] dark:text-slate-200">
            AI detected {localClarifications.filter((c) => c.status === 'Open').length === 0 ? 'no open clarification issues' : `${localClarifications.filter((c) => c.status === 'Open').length} open clarification item(s)`} and estimates {confidence}% review confidence.
          </p>
        </div>
      </div>}

      {!showLogs && <ScrollSpySectionRail
        sections={FORM_SECTIONS.filter((section) => visibleSectionIds.includes(section.id))}
        activeSection={activeSection}
        onNavigate={scrollToSection}
      />}

      {showLogs && <ChangeLogTable />}

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
              <DetailSection id="sec-details" title="Budget Item Details" description="Core submission information and strategic alignment." icon={ClipboardCheck}>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <EditField label="Initiative / Budget Item Name" required>
                      <Input
                        value={editForm.name}
                        onChange={(e) => setField('name', e.target.value)}
                        className="h-10 rounded-xl border-[#D9E6F7] bg-white focus-visible:ring-[#286CFF]/20 dark:border-white/10 dark:bg-[#1E293B]"
                      />
                    </EditField>
                  </div>
                  <EditField label="Strategic Priority">
                    <EditSelect
                      value={editForm.strategicPriority}
                      onValueChange={(v) => setField('strategicPriority', v)}
                      options={['Digital Infrastructure', 'Smart Government', 'Digital Security', 'Operational Excellence', 'Digital Transformation', 'Data & Analytics', 'Government Services Excellence', 'Economic Diversification', 'Smart City Initiatives', 'Sustainability & Environment']}
                      icon={Layers}
                    />
                  </EditField>
                  <EditField label="Strategic Classification">
                    <EditSelect
                      value={editForm.classification}
                      onValueChange={(v) => setField('classification', v)}
                      options={['Cloud & Hosting', 'AI & Automation', 'Security & Compliance', 'Enterprise Systems', 'BI & Reporting', 'Mobile & Apps', 'Network & Connectivity', 'Analytics']}
                      icon={FolderKanban}
                    />
                  </EditField>
                  <EditField label="Work Stream / Program">
                    <EditSelect
                      value={editForm.workStream}
                      onValueChange={(v) => setField('workStream', v)}
                      options={['Digital Transformation', 'Smart Government', 'Data Governance', 'Infrastructure Modernization', 'Digital Security', 'Operational Excellence']}
                      icon={Briefcase}
                    />
                  </EditField>
                  <EditField label="ICT Budget Item Type">
                    <EditSelect
                      value={editForm.budgetType}
                      onValueChange={(v) => setField('budgetType', v as typeof editForm.budgetType)}
                      options={['New', 'Enhancement', 'Continuation', 'Phase 2']}
                      icon={Package}
                    />
                  </EditField>
                  <EditField label="Technology (Company)">
                    <EditSelect
                      value={editForm.technologyCompany}
                      onValueChange={(v) => setField('technologyCompany', v)}
                      options={['Microsoft', 'Google', 'Amazon', 'Oracle', 'Cisco', 'Palo Alto Networks', 'SAP', 'IBM']}
                      icon={Building2}
                    />
                  </EditField>
                  <EditField label="Technology (Product)">
                    <EditSelect
                      value={editForm.technologyProduct}
                      onValueChange={(v) => setField('technologyProduct', v)}
                      options={['Azure', 'Google Cloud', 'AWS', 'Oracle Fusion', 'Prisma', 'Catalyst', 'Intune', 'Power BI', 'Vertex AI']}
                      icon={Package}
                    />
                  </EditField>
                  <EditField label="Category">
                    <EditSelect
                      value={editForm.category}
                      onValueChange={(v) => setField('category', v)}
                      options={['Data Management', 'Citizen Services', 'Cybersecurity', 'Enterprise Applications', 'Infrastructure', 'Analytics', 'Workforce Productivity']}
                      icon={FolderKanban}
                    />
                  </EditField>
                </div>
              </DetailSection>

              <DetailSection id="sec-timelines" title="Budget Item Timelines" description="Planned delivery window for review and governance assessment." icon={CalendarDays}>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <EditField label="Planned Start Date" required>
                    <EditDatePickerField
                      value={editForm.plannedStartDate}
                      onChange={(value) => setField('plannedStartDate', value)}
                    />
                  </EditField>
                  <EditField label="Planned End Date" required>
                    <EditDatePickerField
                      value={editForm.plannedEndDate}
                      onChange={(value) => setField('plannedEndDate', value)}
                    />
                  </EditField>
                </div>
              </DetailSection>

              <DetailSection id="sec-summary" title="Project Summary" description="Business need, expected outcomes, beneficiaries, and delivery approach." icon={FileText}>
                <EditField label="Summary / Description" required>
                  <Textarea
                    rows={6}
                    value={editForm.summary}
                    onChange={(e) => setField('summary', e.target.value)}
                    className="resize-none rounded-xl border-[#D9E6F7] bg-white focus-visible:ring-[#286CFF]/20 dark:border-white/10 dark:bg-[#1E293B]"
                  />
                </EditField>
              </DetailSection>

              {/* Budget line items are editable through the classification picker modal */}
              <DetailSection
                title="Budget Type & Amounts"
                id="sec-budget"
                description="Create and review project budget line items from the classification hierarchy."
                icon={WalletCards}
                action={
                  <div className="rounded-xl bg-[#EFF6FF] px-4 py-2 text-end dark:bg-white/5">
                    <p className="text-xs font-semibold text-[#64748B] dark:text-slate-200">Total Requested Budget</p>
                    <CurrencyAmount amount={budgetTotal} full className="text-xl font-bold text-[#286CFF]" iconSize={18} />
                  </div>
                }
              >
                {hasDataverseBudgetProject && (
                  <div className="mb-4 flex justify-end">
                    <Button onClick={() => setBudgetModalOpen(true)} className="gap-2 rounded-xl text-white" style={{ backgroundColor: '#286CFF' }}>
                      <Layers className="h-4 w-4" />
                      Add Budget Item
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
                  onSaveBudgetRequested={handleSaveBudgetRequested}
                  onDelete={setLineItemToDelete}
                />
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
                  />
                </DetailSection>
              )}

              {/* Save bar at the bottom of edit sections */}
              <div className="rounded-2xl border border-[#DDEBFF] bg-white p-4 shadow-[0_14px_34px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-[#1E293B]">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-[#64748B] dark:text-slate-200">Review all changes before saving.</p>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={handleCancelEdit} className="rounded-xl">Discard</Button>
                    <Button onClick={handleSaveEdit} className="gap-2 rounded-xl text-white" style={{ backgroundColor: '#286CFF' }}>
                      <Save className="h-4 w-4" />
                      Save Changes
                    </Button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* ════ VIEW MODE SECTIONS ═════════════════════════════════════════ */
            <>
              <DetailSection id="sec-details" title="Budget Item Details" description="Core submission information and strategic alignment." icon={ClipboardCheck}>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <Field label="Initiative / Budget Item Name" value={display.name} />
                  <Field label="Strategic Priority" value={display.strategicPriority} />
                  <Field label="Strategic Classification" value={display.classification} />
                  <Field label="Work Stream / Program" value={display.workStream} />
                  <Field label="ICT Budget Item Type" value={display.budgetType} />
                  <Field label="Technology (Company)" value={display.technologyCompany} />
                  <Field label="Technology (Product)" value={display.technologyProduct} />
                  <Field label="Category" value={display.category} />
                </div>
              </DetailSection>

              <DetailSection id="sec-timelines" title="Budget Item Timelines" description="Planned delivery window for review and governance assessment." icon={CalendarDays}>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <Field label="Planned Start Date" value={display.plannedStartDate} />
                  <Field label="Planned End Date" value={display.plannedEndDate} />
                </div>
              </DetailSection>

              <DetailSection id="sec-summary" title="Project Summary" description="Business need, expected outcomes, beneficiaries, and delivery approach." icon={FileText}>
                <p className="rounded-xl border border-[#EAF0F6] bg-[#F8FBFF] p-4 text-sm leading-7 text-[#0F172A] dark:border-white/10 dark:bg-white/5 dark:text-white">{display.summary}</p>
              </DetailSection>

              <DetailSection
                title="Budget Type & Amounts"
                id="sec-budget"
                description="Account-level spend breakdown for review validation."
                icon={WalletCards}
                action={
                  <div className="rounded-xl bg-[#EFF6FF] px-4 py-2 text-end dark:bg-white/5">
                    <p className="text-xs font-semibold text-[#64748B] dark:text-slate-200">Total Requested Budget</p>
                    <CurrencyAmount amount={budgetTotal} full className="text-xl font-bold text-[#286CFF]" iconSize={18} />
                  </div>
                }
              >
                <BudgetItemsTable
                  items={displayedBudgetItems}
                  loading={budgetItemsLoading}
                  error={budgetItemsError}
                  editable={false}
                  savingId={savingBudgetLineItemId}
                  deletingId={deletingBudgetLineItemId}
                  onSaveBudgetRequested={handleSaveBudgetRequested}
                  onDelete={setLineItemToDelete}
                />
              </DetailSection>

              <DetailSection id="sec-documents" title="Supporting Documents" description="Evidence attached to support budget, procurement, and delivery assumptions." icon={FileCheck2}>
                {project.documents.length === 0 ? (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700 dark:border-amber-700/30 dark:bg-amber-900/10 dark:text-amber-300">
                    No documents uploaded. Supporting documents are required before submission.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {project.documents.map((doc) => (
                      <div key={doc.name} className="flex items-center gap-3 rounded-xl border border-[#DDEBFF] bg-[#F8FBFF] p-3 dark:border-white/10 dark:bg-white/5">
                        <FileText className="h-5 w-5 shrink-0 text-[#286CFF]" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-[#0F172A] dark:text-white">{doc.name}</p>
                          <p className="text-xs text-[#475569] dark:text-slate-200">{doc.size} / Uploaded {doc.uploadedDate}</p>
                        </div>
                        <button className="text-[#475569] transition-colors hover:text-[#286CFF]">
                          <Download className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
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
                  />
                </DetailSection>
              )}
            </>
          )}
        </div>

        {/* ── Right aside ─────────────────────────────────────────────────── */}
        <aside className="space-y-5 lg:sticky lg:top-20 lg:self-start">

          {/* ── Section navigator ── */}
          {isGovernanceView ? (
            <>
              <Card className="rounded-2xl border-[#DDEBFF] shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
                <CardContent className="p-4">
                  <div className="mb-4 flex items-center gap-3">
                    <SectionIcon icon={Bot} />
                    <div>
                      <p className="font-semibold text-[#0F172A] dark:text-white">Recommended Actions</p>
                      <p className="text-xs text-[#64748B] dark:text-slate-200">{actionContextLabel}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-2"
                      onClick={() => setClarificationModalOpen(true)}
                    >
                      <MessageSquare className="h-4 w-4" />
                      Raise Clarification
                    </Button>
                    <Button className="w-full justify-start gap-2">
                      <Send className="h-4 w-4" />
                      {submitActionLabel}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <AiCard title="AI Review Insights">
                <div className="grid grid-cols-2 gap-3">
                  <AiSignal label="Confidence" value={`${confidence}%`} tone={confidenceTone} />
                  <AiSignal label="Risk" value={project.riskLevel} tone={riskTone} />
                  <AiSignal label="Documents" value={documentStatus} tone={documentTone} />
                  <AiSignal label="Budget Fit" value={budgetFit} tone={budgetFitTone} />
                </div>
                <div className="mt-4 rounded-xl border border-[#B0DBFF] bg-white/85 p-3 dark:border-white/10 dark:bg-white/5">
                  <p className="text-sm font-semibold text-[#0F172A] dark:text-white">AI Summary</p>
                  <p className="mt-1 text-xs leading-5 text-[#475569] dark:text-slate-200">
                    Scope, timeline, and budget structure are generally aligned. Review document evidence and validate line-item assumptions before forwarding.
                  </p>
                </div>
              </AiCard>

              <AiCard title="AI Review Checklist">
                <div className="space-y-2">
                  {[
                    { label: 'Strategic alignment detected', icon: CheckCircle2, ok: true },
                    { label: 'Budget split requires reviewer confirmation', icon: AlertTriangle, ok: false },
                    { label: 'Supporting documents scanned', icon: FileCheck2, ok: project.documents.length > 0 },
                    { label: 'Duplicate-scope risk appears low', icon: CheckCircle2, ok: true },
                  ].map((item) => {
                    const Icon = item.icon
                    return (
                      <div key={item.label} className="flex items-center gap-3 rounded-xl border border-[#DDEBFF] bg-white/85 px-3 py-2 dark:border-white/10 dark:bg-white/5">
                        <Icon className={cn('h-4 w-4', item.ok ? 'text-green-600' : 'text-amber-600')} />
                        <span className="text-xs font-medium text-[#475569] dark:text-slate-200">{item.label}</span>
                      </div>
                    )
                  })}
                </div>
              </AiCard>
            </>
          ) : (
            <>
              <Card className="rounded-2xl border-[#DDEBFF] shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
                <CardContent className="space-y-2 p-4">
                  <p className="font-semibold text-[#0F172A] dark:text-white">Quick Actions</p>
                  {isDraftOrNeedsWork ? (
                    <>
                      <Button
                        variant="outline"
                        className="w-full justify-start gap-2"
                        onClick={() => setIsEditMode(true)}
                      >
                        <Edit className="h-4 w-4" />
                        Edit Project
                      </Button>
                      <Button variant="destructive" className="w-full justify-start gap-2"><Trash2 className="h-4 w-4" />Delete Project</Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        className="w-full justify-start gap-2"
                        onClick={() => setIsEditMode(true)}
                      >
                        <Pencil className="h-4 w-4" />
                        Edit Details
                      </Button>
                      <p className="text-xs text-[#475569] dark:text-slate-200">Project is currently in the governance workflow.</p>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-[#DDEBFF] shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
                <CardContent className="space-y-3 p-4">
                  <p className="font-semibold text-[#0F172A] dark:text-white">Submission Details</p>
                  <Field label="Submitted By" value={project.submittedBy} />
                  <Field label="Submitted Date" value={project.submittedDate} />
                  <Field label="Last Modified" value={project.lastModified} />
                </CardContent>
              </Card>

              <AiCard title="AI Review Insights">
                <p className="text-sm leading-6 text-[#475569] dark:text-slate-200">
                  AI will analyze this project for completeness, budget alignment, strategic fit, and risk signals once configured.
                </p>
              </AiCard>

              <Card className="rounded-2xl border-[#DDEBFF] shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
                <CardContent className="space-y-2 p-4">
                  <p className="font-semibold text-[#0F172A] dark:text-white">Project Signals</p>
                  <div className="rounded-xl border border-[#EAF0F6] bg-[#F8FBFF] px-3 py-3 dark:border-white/10 dark:bg-white/5">
                    <p className="text-xs font-semibold text-[#64748B] dark:text-slate-200">Status</p>
                    <div className="mt-2"><StatusBadge status={project.status} /></div>
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
      <ClarificationModal
        open={clarificationModalOpen}
        onOpenChange={setClarificationModalOpen}
        projectName={display.name}
        onSubmit={handleRaiseClarification}
      />
    </div>
  )
}
