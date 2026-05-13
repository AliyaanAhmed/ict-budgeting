import { useState, useEffect, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useLocation, useParams, Link, useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowLeft,
  Bot,
  Briefcase,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
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
  Plus,
  Save,
  Send,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
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
import { useToast } from '@/context/ToastContext'
import { cn } from '@/lib/utils'
import { formatAEDFull } from '@/lib/utils'
import type { BudgetItemDraft } from '@/domain/classification'
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
import { retrieveSharePointDocumentsByBudget, type WebApiPortalDocument } from '@/services/webApiForPortalService'
import { deleteSharePointDocument } from '@/services/fileDeleteService'
import { SupportingDocuments } from '@/components/shared/SupportingDocuments'

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

function DynamicStatusBadge({ status, fallbackStatus }: { status?: string | null; fallbackStatus: string }) {
  const resolvedStatus = status?.trim() || fallbackStatus
  return <StatusBadge status={resolvedStatus as never} />
}

type WorkflowRole = 'Respondent' | 'Reviewer' | 'Approver'
type WorkflowAction = 'delete-project' | 'submit-reviewer' | 'submit-approver' | 'approve-project'
type PendingClarificationReply = {
  clarificationId: string
  message: string
  files?: File[]
  returnToRole: 'Reviewer' | 'Approver'
}

function getWorkflowOwner(status: string): WorkflowRole | null {
  if (status === 'Draft' || status === 'Clarification Required') return 'Respondent'
  if (status === 'Submitted to Reviewer') return 'Reviewer'
  if (status === 'Submitted to Approver') return 'Approver'
  return null
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

function canRoleEdit(status: string, role: WorkflowRole, project: Project) {
  return getWorkflowOwner(status) === role && isProjectOwnedByCurrentContext(project, role)
}

function workflowActionDetails(action: WorkflowAction, role: WorkflowRole) {
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

  return {
    title: role === 'Approver' ? 'Approve this project?' : 'Complete this action?',
    description:
      'This will mark the project as approved by the approver and close the approval stage.',
    confirmLabel: 'Approve Project',
    tone: 'primary' as const,
  }
}

function SkeletonBlock({ className }: { className: string }) {
  return <div className={cn('animate-pulse rounded-xl bg-gradient-to-r from-[#E8EEF8] via-[#F4F7FB] to-[#E8EEF8] bg-[length:200%_100%] dark:from-white/10 dark:via-white/5 dark:to-white/10', className)} />
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
  const navigate = useNavigate()
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
      aiScore: 84,
      riskLevel: 'Low',
      capex: 0,
      opex: 0,
    }),
    [id]
  )
  const [projectData, setProjectData] = useState<Project | null>(null)
  const [projectLoading, setProjectLoading] = useState(true)
  const [projectError, setProjectError] = useState<string | null>(null)
  const project = projectData ?? projects.find((p) => p.id === id) ?? emptyProject
  const ictBudgetId = project.ictBudgetId ?? (id && GUID_PATTERN.test(id) ? id : null)
  const hasDataverseBudgetProject = Boolean(ictBudgetId && GUID_PATTERN.test(ictBudgetId))

  const isReviewerView = pathname.includes('/reviewer/')
  const isApproverView = pathname.includes('/approver/')
  const isGovernanceView = isReviewerView || isApproverView

  const routeRole: WorkflowRole = isReviewerView ? 'Reviewer' : isApproverView ? 'Approver' : 'Respondent'
  const currentRole = normalizeStoredRole(sessionStorage.getItem(SESSION_CURRENT_ROLE_KEY)) ?? routeRole
  const backHref = isReviewerView ? '/reviewer/review-queue' : isApproverView ? '/approver/approval-queue' : '/respondent/projects'
  const homeHref = isReviewerView ? '/reviewer/dashboard' : isApproverView ? '/approver/dashboard' : '/respondent/dashboard'
  const queueLabel = isReviewerView ? 'Review Queue' : isApproverView ? 'Approval Queue' : 'My Projects'
  const pageTitle = project.name
  const confidence = project.aiScore || 84
  const documentStatus = project.documents.length > 0 ? 'Complete' : 'Missing'
  const confidenceTone = confidence >= 80 ? 'green' : confidence >= 60 ? 'amber' : 'red'
  const riskTone = project.riskLevel === 'High' ? 'red' : project.riskLevel === 'Medium' ? 'amber' : 'green'
  const budgetFit = project.riskLevel === 'High' || confidence < 60 ? 'Needs Review' : confidence < 80 ? 'Review' : 'Aligned'
  const budgetFitTone = budgetFit === 'Aligned' ? 'green' : budgetFit === 'Review' ? 'amber' : 'red'
  const actionContextLabel = isApproverView ? 'Approver decision controls' : 'Reviewer decision controls'
  const workflowOwner = getWorkflowOwner(project.status)
  const isCurrentOwner = isProjectOwnedByCurrentContext(project, currentRole)
  const canCurrentRoleEdit = canRoleEdit(project.status, currentRole, project)
  const canDeleteProject = currentRole === 'Respondent' && isCurrentOwner && project.status === 'Draft'
  const canSubmitToReviewer =
    currentRole === 'Respondent' &&
    isCurrentOwner &&
    (project.status === 'Draft' || project.status === 'Clarification Required')
  const canSubmitToApprover =
    currentRole === 'Reviewer' && isCurrentOwner && project.status === 'Submitted to Reviewer'
  const canApproveProject =
    currentRole === 'Approver' && isCurrentOwner && project.status === 'Submitted to Approver'
  const canRaiseClarification =
    ((currentRole === 'Reviewer' && project.status === 'Submitted to Reviewer') ||
      (currentRole === 'Approver' && project.status === 'Submitted to Approver')) &&
    isCurrentOwner
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
  const [fieldErrors, setFieldErrors] = useState<IctBudgetFieldErrorMap>({})
  const [workStreamModalOpen, setWorkStreamModalOpen] = useState(false)
  const [technologyProductModalOpen, setTechnologyProductModalOpen] = useState(false)
  const [newWorkStreamName, setNewWorkStreamName] = useState('')
  const [newTechnologyProductName, setNewTechnologyProductName] = useState('')
  const [budgetModalOpen, setBudgetModalOpen] = useState(false)
  const [budgetItemsLoading, setBudgetItemsLoading] = useState(false)
  const [budgetItemsError, setBudgetItemsError] = useState<string | null>(null)
  const [budgetLineItems, setBudgetLineItems] = useState<BudgetLineItemRecord[]>([])
  const [savingBudgetLineItemId, setSavingBudgetLineItemId] = useState<string | null>(null)
  const [deletingBudgetLineItemId, setDeletingBudgetLineItemId] = useState<string | null>(null)
  const [lineItemToDelete, setLineItemToDelete] = useState<BudgetLineItemRecord | null>(null)
  const [pendingWorkflowAction, setPendingWorkflowAction] = useState<WorkflowAction | null>(null)

  // ── File Upload (edit mode) ──────────────────────────────────────────────────
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const documentTone = documentStatus === 'Complete' ? 'green' : 'red'

  // ── SharePoint documents ─────────────────────────────────────────────────────
  const [sharepointDocs, setSharepointDocs] = useState<WebApiPortalDocument[]>([])
  const [sharepointDocsLoading, setSharepointDocsLoading] = useState(false)


  const fallbackBudgetItems = useMemo<BudgetLineItemRecord[]>(
    () =>
      project.budgetItems.map((item) => ({
        id: item.id,
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
    setFieldErrors({})
    setUploadedFiles([])
    setIsEditMode(false)
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
          setIctBudgetError(null)
        } else {
          const fallbackFormValues: IctBudgetFormValues = {
            ...INITIAL_ICT_BUDGET_FORM_VALUES,
            initiativeName: project.name,
            plannedStartDate: project.plannedStartDate,
            plannedEndDate: project.plannedEndDate,
            summary: project.summary,
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

  const validateForm = () => {
    const nextErrors: IctBudgetFieldErrorMap = {}

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

    setFieldErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      showErrorToast(
        'Complete required fields',
        'Please fill the highlighted fields before saving your changes.'
      )
      return false
    }

    return true
  }

  const handleSaveEdit = async () => {
    if (!hasDataverseBudgetProject || !ictBudgetId) {
      showErrorToast(
        'ICT budget unavailable',
        'This project is not linked to a Dataverse ICT budget record.'
      )
      return
    }

    if (!validateForm()) {
      return
    }

    setSavingIctBudget(true)
    try {
      await runActionToast(
        async () => {
          await updateIctBudgetDraft(ictBudgetId, formValues)
          setSavedFormValues(formValues)
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

      if (uploadedFiles.length > 0) {
        try {
          await runActionToast(
            () => uploadFilesToRecord(ictBudgetId, uploadedFiles),
            {
              processingTitle: 'Uploading documents',
              processingDescription: `Uploading ${uploadedFiles.length} file(s) to SharePoint...`,
              successTitle: 'Documents uploaded',
              successDescription: 'All files were uploaded successfully.',
              errorTitle: 'Upload failed',
              minDurationMs: 1200,
            }
          )
          setUploadedFiles([])
          void refreshSharepointDocs()
        } catch {
          showErrorToast('Documents not uploaded', 'The changes were saved but document upload failed. Please try again.')
        }
      }

      setIsEditMode(false)
    } finally {
      setSavingIctBudget(false)
    }
  }

  const syncLocalWorkflowState = (nextStatus: Project['status']) => {
    setProjectData((current) =>
      current
        ? {
            ...current,
            status: nextStatus,
            approvalStatus: nextStatus,
            pendingWith: getWorkflowOwner(nextStatus),
          }
        : current
    )
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

      await runActionToast(
        async () => {
          console.log('[ProjectDetail] Submitting ICT budget to reviewer — assigning to Reviewer team, sharing ReadAccess with Respondent team:', {
            ictBudgetId,
            status: ICT_BUDGET_STATUS.underReviewerReview,
            targetOwner: 'Reviewer',
          })
          await updateIctBudgetStatus(ictBudgetId, ICT_BUDGET_STATUS.underReviewerReview, 'Reviewer')
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

    if (pendingWorkflowAction === 'submit-approver') {
      await runActionToast(
        async () => {
          console.log('[ProjectDetail] Submitting ICT budget to approver — assigning to Approver team, sharing ReadAccess with Reviewer team:', {
            ictBudgetId,
            status: ICT_BUDGET_STATUS.underApproverReview,
            targetOwner: 'Approver',
          })
          await updateIctBudgetStatus(ictBudgetId, ICT_BUDGET_STATUS.underApproverReview, 'Approver')
          syncLocalWorkflowState('Submitted to Approver')
          setIsEditMode(false)
        },
        {
          processingTitle: 'Submitting to approver',
          processingDescription: 'Moving the project into approver review...',
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
        console.log('[ProjectDetail] Approving ICT budget without owner reassignment:', {
          ictBudgetId,
          status: ICT_BUDGET_STATUS.approvedByApprover,
        })
        await updateIctBudgetStatus(ictBudgetId, ICT_BUDGET_STATUS.approvedByApprover)
        syncLocalWorkflowState('Approved')
        setIsEditMode(false)
      },
      {
        processingTitle: 'Approving project',
        processingDescription: 'Marking the ICT budget as approved by the approver...',
        successTitle: 'Project approved',
        successDescription: 'The project has been approved successfully.',
        errorTitle: 'Unable to approve project',
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

  // ── Clarification State ──────────────────────────────────────────────────────
  const [localClarifications, setLocalClarifications] = useState<Clarification[]>(project.clarifications)
  const [clarificationsLoading, setClarificationsLoading] = useState(false)
  const [clarificationModalOpen, setClarificationModalOpen] = useState(false)
  const [pendingClarificationReply, setPendingClarificationReply] = useState<PendingClarificationReply | null>(null)

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

  // Build a set of all SharePoint URLs referenced in clarification fileUrl fields
  const clarificationFileUrls = useMemo(() => {
    const urls = new Set<string>()
    for (const c of localClarifications) {
      for (const url of (c.fileUrl ?? '').split(/[,\n]/).map((u) => u.trim()).filter(Boolean)) {
        urls.add(url)
      }
      for (const r of c.replies) {
        for (const url of (r.fileUrl ?? '').split(/[,\n]/).map((u) => u.trim()).filter(Boolean)) {
          urls.add(url)
        }
      }
    }
    return urls
  }, [localClarifications])

  const handleDeleteDocument = async (doc: WebApiPortalDocument) => {
    await deleteSharePointDocument(doc)
    setSharepointDocs((prev) => prev.filter((d) => d.sharepointdocumentid !== doc.sharepointdocumentid))
  }

  const refreshSharepointDocs = async () => {
    if (!ictBudgetId) return
    try {
      const docs = await retrieveSharePointDocumentsByBudget(ictBudgetId)
      setSharepointDocs(docs)
    } catch (err) {
      console.error('[ProjectDetail] Failed to refresh SharePoint docs:', err)
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

          await updateIctBudgetStatus(ictBudgetId, nextStatus, returnToRole)
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
        await updateIctBudgetStatus(ictBudgetId, ICT_BUDGET_STATUS.clarificationPending, 'Respondent')
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
    summary: savedFormValues.summary || project.summary,
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
              <p className="text-sm leading-6 text-[#475569] dark:text-slate-200">{display.name}</p>
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
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleCancelEdit} className="h-9 rounded-xl border-[#286CFF]/30 text-[#475569] dark:border-white/10">
              Cancel
            </Button>
            <Button size="sm" onClick={() => void handleSaveEdit()} disabled={savingIctBudget} className="h-9 gap-1.5 rounded-xl text-white" style={{ backgroundColor: '#286CFF' }}>
              <Save className="h-3.5 w-3.5" />
              {savingIctBudget ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      )}

      {!showLogs && !isEditMode && (
        <div
          className={cn(
            'flex flex-wrap items-start gap-3 rounded-2xl border px-4 py-3 shadow-sm',
            showPendingNotice
              ? 'border-[#F5D0A9] bg-[#FFF7ED] dark:border-[#EA580C]/30 dark:bg-[#431407]/40'
              : 'border-[#BFD8FF] bg-[#EFF6FF] dark:border-[#286CFF]/20 dark:bg-[#10213B]'
          )}
        >
          <div
            className={cn(
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white',
              showPendingNotice ? 'bg-[#F97316]' : 'bg-[#286CFF]'
            )}
          >
            {showPendingNotice ? <History className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
          </div>
          <div className="min-w-0 flex-1">
            <p className={cn('text-sm font-semibold', showPendingNotice ? 'text-[#C2410C] dark:text-orange-300' : 'text-[#286CFF]')}>
              {showPendingNotice
                ? `Pending with ${workflowOwner}`
                : canCurrentRoleEdit
                  ? `${currentRole} actions available`
                  : 'Read-only workflow state'}
            </p>
            <p className="text-xs text-[#64748B] dark:text-slate-300">
              {showPendingNotice
                ? pendingNoticeText
                : canCurrentRoleEdit
                  ? `This project is currently assigned to ${currentRole}. You can edit it and continue the workflow actions from the panel on the right.`
                  : 'This project is currently read-only, but the clarification thread remains available for all roles.'}
            </p>
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
                        value={formValues.initiativeName}
                        onChange={(e) => updateField('initiativeName', e.target.value)}
                        className={cn(
                          'h-10 rounded-xl bg-white focus-visible:ring-[#286CFF]/20 dark:border-white/10 dark:bg-[#1E293B]',
                          fieldErrors.initiativeName ? 'border-[#F04438]' : 'border-[#D9E6F7]'
                        )}
                      />
                    </EditField>
                  </div>
                  <EditField label="Strategic Priorities" required>
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
                  <EditField label="Strategic Priority Classifications" required>
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
                  <EditField label="Work Stream">
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
                        variant="outline"
                        className="rounded-xl"
                        onClick={() => setWorkStreamModalOpen(true)}
                        disabled={lookupLoading || ictBudgetLoading}
                      >
                        <Plus className="h-4 w-4" />
                        Create Work Stream
                      </Button>
                    </div>
                  </EditField>
                  <EditField label="ICT Budget Items Type" required>
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
                  <EditField label="Category">
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
                  <EditField label="Technology (Company)">
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
                  <EditField label="Technology (Product)">
                    <div className="space-y-2">
                      <ProductMultiSelect
                        products={selectedTechnologyCompany?.products ?? []}
                        selectedIds={formValues.technologyProductIds}
                        disabled={!selectedTechnologyCompany || lookupLoading || ictBudgetLoading}
                        onToggle={toggleTechnologyProduct}
                        invalid={Boolean(fieldErrors.technologyProductIds)}
                      />
                      <Button
                        variant="outline"
                        className="rounded-xl"
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

              <DetailSection id="sec-timelines" title="Budget Item Timelines" description="Planned delivery window for review and governance assessment." icon={CalendarDays}>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <EditField label="Planned Start Date" required>
                    <EditDatePickerField
                      value={formValues.plannedStartDate}
                      onChange={(value) => updateField('plannedStartDate', value)}
                    />
                  </EditField>
                  <EditField label="Planned End Date" required>
                    <EditDatePickerField
                      value={formValues.plannedEndDate}
                      onChange={(value) => updateField('plannedEndDate', value)}
                    />
                  </EditField>
                </div>
              </DetailSection>

              <DetailSection id="sec-summary" title="Project Summary" description="Business need, expected outcomes, beneficiaries, and delivery approach." icon={FileText}>
                <EditField label="Summary / Description" required>
                  <Textarea
                    rows={6}
                    value={formValues.summary}
                    onChange={(e) => updateField('summary', e.target.value)}
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
                <div className="mb-6 space-y-4 rounded-2xl border border-[#DDEBFF] bg-[#F8FBFF] p-4 dark:border-white/10 dark:bg-white/5">
                  <EditField label="Budget Type" required>
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

              {/* Documents section in edit mode */}
              <DetailSection
                title="Supporting Documents"
                description="Upload additional supporting files for this budget record."
                icon={FileCheck2}
              >
                <div className="mb-4">
                  <SupportingDocuments
                    docs={sharepointDocs}
                    loading={sharepointDocsLoading}
                    clarificationFileUrls={clarificationFileUrls}
                    onDelete={handleDeleteDocument}
                  />
                </div>
                <FileUploadDropzone files={uploadedFiles} onChange={setUploadedFiles} />
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
                    sharepointDocs={sharepointDocs}
                  />
                </DetailSection>
              )}

              {/* Save bar at the bottom of edit sections */}
              <div className="rounded-2xl border border-[#DDEBFF] bg-white p-4 shadow-[0_14px_34px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-[#1E293B]">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-[#64748B] dark:text-slate-200">Review all changes before saving.</p>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={handleCancelEdit} className="rounded-xl">Discard</Button>
                    <Button onClick={() => void handleSaveEdit()} disabled={savingIctBudget} className="gap-2 rounded-xl text-white" style={{ backgroundColor: '#286CFF' }}>
                      <Save className="h-4 w-4" />
                      {savingIctBudget ? 'Saving...' : 'Save Changes'}
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
                  <Field label="Strategic Priorities" value={display.strategicPriority} />
                  <Field label="Strategic Priority Classifications" value={display.classification} />
                  <Field label="Work Stream" value={display.workStream} />
                  <Field label="ICT Budget Item Type" value={display.budgetType} />
                  <Field label="Category" value={display.category} />
                  <Field label="Technology (Company)" value={display.technologyCompany} />
                  <Field label="Technology (Product)" value={display.technologyProduct} />
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
                <div className="mb-6 grid grid-cols-1 gap-3 rounded-2xl border border-[#DDEBFF] bg-[#F8FBFF] p-4 dark:border-white/10 dark:bg-white/5 md:grid-cols-2">
                  <Field label="Budget Type" value={display.budgetActivityType} />
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
                <SupportingDocuments
                  docs={sharepointDocs}
                  loading={sharepointDocsLoading}
                  clarificationFileUrls={clarificationFileUrls}
                  onDelete={handleDeleteDocument}
                />
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
                    sharepointDocs={sharepointDocs}
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
                    {canCurrentRoleEdit && (
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
                    {canSubmitToApprover && (
                      <Button
                        className="w-full justify-start gap-2"
                        onClick={() => setPendingWorkflowAction('submit-approver')}
                      >
                        <Send className="h-4 w-4" />
                        Submit to Approver
                      </Button>
                    )}
                    {canApproveProject && (
                      <Button
                        className="w-full justify-start gap-2"
                        onClick={() => setPendingWorkflowAction('approve-project')}
                      >
                        <ShieldCheck className="h-4 w-4" />
                        Approve Project
                      </Button>
                    )}
                    {!canCurrentRoleEdit && !canRaiseClarification && !canSubmitToApprover && !canApproveProject && (
                      <p className="text-xs text-[#475569] dark:text-slate-200">
                        This record is currently pending with another role, so workflow actions are locked here.
                      </p>
                    )}
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
                  {(canCurrentRoleEdit || canSubmitToReviewer || canDeleteProject) ? (
                    <>
                      {canCurrentRoleEdit && (
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
                          onClick={() => setPendingWorkflowAction('submit-reviewer')}
                        >
                          <Send className="h-4 w-4" />
                          Submit to Reviewer
                        </Button>
                      )}
                      {canDeleteProject && (
                        <Button
                          variant="destructive"
                          className="w-full justify-start gap-2"
                          onClick={() => setPendingWorkflowAction('delete-project')}
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

              <Card className="rounded-2xl border-[#DDEBFF] shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
                <CardContent className="space-y-3 p-4">
                  <p className="font-semibold text-[#0F172A] dark:text-white">Project Creation Details</p>
                  <Field label="Created By" value={display.createdBy} />
                  <Field label="Created On" value={display.createdOn} />
                  <Field label="Modified On" value={display.modifiedOn} />
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
      <ConfirmationModal
        open={pendingWorkflowAction !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPendingWorkflowAction(null)
          }
        }}
        title={
          pendingWorkflowAction
            ? workflowActionDetails(pendingWorkflowAction, currentRole).title
            : 'Confirm action'
        }
        description={
          pendingWorkflowAction
            ? workflowActionDetails(pendingWorkflowAction, currentRole).description
            : 'Please confirm this workflow action.'
        }
        confirmLabel={
          pendingWorkflowAction
            ? workflowActionDetails(pendingWorkflowAction, currentRole).confirmLabel
            : 'Confirm'
        }
        cancelLabel="Cancel"
        onConfirm={() => void handleConfirmWorkflowAction()}
        tone={
          pendingWorkflowAction
            ? workflowActionDetails(pendingWorkflowAction, currentRole).tone
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
