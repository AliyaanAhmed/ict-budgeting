import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Bot,
  Briefcase,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  FileText,
  FolderKanban,
  Layers,
  Package,
  Plus,
  RefreshCw,
  Send,
  Sparkles,
  TrendingUp,
  Upload,
  User,
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
import { cn } from '@/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ConfirmationModal } from '@/components/shared/ConfirmationModal'
import { useToast } from '@/context/ToastContext'

function FormField({
  label,
  required,
  hint,
  children,
}: {
  label: string
  required?: boolean
  hint?: string
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
    </div>
  )
}

function ModernSelect({
  placeholder,
  options,
  icon: Icon,
}: {
  placeholder: string
  options: string[]
  icon: React.ElementType
}) {
  const [value, setValue] = useState('')

  return (
    <Select value={value} onValueChange={setValue}>
      <SelectTrigger
        className="h-12 rounded-xl border-[#D9E6F7] bg-white shadow-sm transition-colors hover:border-[var(--primary-light)] focus:ring-[var(--primary)] dark:border-white/10 dark:bg-[#1E293B]"
      >
        <span className={cn('inline-flex w-full min-w-0 items-center gap-5 whitespace-nowrap', value ? 'font-semibold text-[#0F172A] dark:text-white' : 'text-[#64748B]')}>
          <Icon className="h-4 w-4 shrink-0 text-[var(--primary)]" />
          <SelectValue placeholder={placeholder} />
        </span>
      </SelectTrigger>
      <SelectContent className="rounded-xl">
        {options.map((o) => (
          <SelectItem key={o} value={o.toLowerCase().replace(/\s+/g, '-')}>{o}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function DatePickerField({ placeholder = 'Pick a date' }: { placeholder?: string }) {
  const pickerRef = useRef<HTMLDivElement>(null)
  const [value, setValue] = useState('')
  const [open, setOpen] = useState(false)
  const [viewMonth, setViewMonth] = useState(() => new Date())

  const selectedDate = value ? new Date(`${value}T00:00:00`) : null
  const today = new Date()
  const calendarStart = startOfWeek(startOfMonth(viewMonth))
  const calendarEnd = endOfWeek(endOfMonth(viewMonth))
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })
  const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

  const formattedValue = selectedDate ? format(selectedDate, 'MMM d, yyyy') : placeholder

  const selectDate = (date: Date) => {
    setValue(format(date, 'yyyy-MM-dd'))
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
          'inline-flex h-10 w-full shrink-0 items-center justify-start gap-2 whitespace-nowrap rounded-xl border border-slate-200 bg-white px-4 py-2 text-left text-sm font-normal transition-colors duration-150 outline-none hover:border-[#043DFF] hover:bg-[#E7F5FF] hover:text-[#043DFF] active:bg-[#D3EDFF] focus-visible:ring-2 focus-visible:ring-[#286CFF] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-[#1E293B] dark:text-white dark:hover:bg-white/5',
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

const COPILOT_OPTIONS = [
  { icon: Sparkles, label: 'New Project', sub: 'Starting fresh, no prior submissions' },
  { icon: RefreshCw, label: 'Continuation of Existing Project', sub: 'Project already exists, requesting additional budget' },
  { icon: TrendingUp, label: 'Phase 2 or Later', sub: 'Subsequent phase of a multi-phase project' },
]

export default function NewProject() {
  const [mode, setMode] = useState<'manual' | 'ai'>('manual')
  const [submitConfirmOpen, setSubmitConfirmOpen] = useState(false)
  const [chatInput, setChatInput] = useState('')
  const [chatMessages, setChatMessages] = useState<{ from: 'ai' | 'user'; text: string }[]>([
    { from: 'ai', text: 'Welcome to the Budget Copilot!\n\nBefore we begin, I need to understand a few things about your project to help you better.' },
    { from: 'ai', text: "Is this a new project you're starting, or is it a continuation of an existing initiative?" },
  ])
  const [optionSelected, setOptionSelected] = useState(false)
  const { runActionToast } = useToast()

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

  const handleSubmitForReview = () => {
    setSubmitConfirmOpen(false)
    void runActionToast(
      async () => {
        await new Promise((resolve) => window.setTimeout(resolve, 3200))
      },
      {
        processingTitle: 'Submitting to reviewer',
        processingDescription: 'Validating budget details and routing the request...',
        successTitle: 'Submitted for review',
        successDescription: 'Your budget item has been routed to the Reviewer queue successfully.',
        errorTitle: 'Submission failed',
        minDurationMs: 3400,
      }
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
              Capture scope, timeline, budget logic, and supporting documents in a cleaner step-by-step workspace.
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
                <p className="text-xs font-semibold text-[#64748B]">Readiness</p>
                <p className="text-sm font-bold text-[var(--primary)]">0%</p>
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
          <div className="space-y-5">
              <FormSection title="Budget Item Details" description="Define the initiative, strategic alignment, work stream, technology, and category." icon={ClipboardList}>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <FormField label="Initiative / Budget Item Name" required>
                      <Input className="h-12 rounded-xl border-[#D9E6F7] bg-white shadow-sm transition-colors hover:border-[var(--primary-light)] focus-visible:ring-[var(--primary)]" placeholder="Example: Cloud Migration Platform for Citizen Services" />
                    </FormField>
                  </div>

                  <FormField label="Strategic Priorities" required>
                    <ModernSelect icon={Layers} placeholder="Select priority" options={['Government Services Excellence', 'Economic Diversification', 'Smart City Initiatives', 'Sustainability & Environment', 'Digital Infrastructure']} />
                  </FormField>

                  <FormField label="Strategic Priority Classifications" required>
                    <ModernSelect icon={FolderKanban} placeholder="Select classification" options={['Cloud & Hosting', 'AI & Automation', 'Security & Compliance', 'Enterprise Systems', 'Analytics']} />
                  </FormField>

                  <FormField label="Work Stream / Program Name">
                    <ModernSelect icon={Briefcase} placeholder="Select work stream" options={['Digital Transformation', 'Smart Government', 'Data Governance', 'Infrastructure Modernization']} />
                  </FormField>

                  <FormField label="ICT Budget Item Type" required>
                    <ModernSelect icon={Package} placeholder="Select type" options={['New', 'Enhancement', 'Continuation', 'Phase 2']} />
                  </FormField>

                  <FormField label="Technology (Company)">
                    <ModernSelect icon={Building2} placeholder="Select company" options={['Microsoft', 'Google', 'Amazon', 'Oracle', 'Cisco']} />
                  </FormField>

                  <FormField label="Technology (Product)">
                    <ModernSelect icon={Package} placeholder="Select product" options={['Azure', 'Google Cloud', 'AWS', 'Oracle Fusion', 'Prisma']} />
                  </FormField>

                  <FormField label="Category">
                    <ModernSelect icon={FolderKanban} placeholder="Select category" options={['Data Management', 'Citizen Services', 'Cybersecurity', 'Enterprise Applications', 'Infrastructure']} />
                  </FormField>
                </div>
              </FormSection>

              <FormSection title="Budget Item Timelines" description="Set planned delivery dates so reviewers can understand the funding window." icon={CalendarDays}>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField label="Planned Start Date" required>
                    <DatePickerField />
                  </FormField>
                  <FormField label="Planned End Date" required>
                    <DatePickerField />
                  </FormField>
                </div>
              </FormSection>

              <FormSection title="Project Summary" description="Explain the business need, expected outcome, beneficiaries, and delivery approach." icon={FileText}>
                <FormField label="Summary / Description" required>
                  <Textarea rows={6} className="rounded-xl border-[#D9E6F7] bg-white shadow-sm focus-visible:ring-[var(--primary)]" placeholder="Describe the problem, proposed solution, departments impacted, measurable benefits, and any dependencies..." />
                </FormField>
              </FormSection>

              <FormSection title="Budget Type" description="Classify the requested spend so finance and review teams can assess it correctly." icon={CircleDollarSign}>
                <div className="max-w-md">
                  <FormField label="Budget Type" required>
                    <ModernSelect icon={Briefcase} placeholder="Select budget type" options={['CapEx', 'OpEx', 'Mixed']} />
                  </FormField>
                </div>
              </FormSection>

              <FormSection
                title="Budget Items"
                description="Add account-level amounts and codes for the requested project budget."
                icon={CircleDollarSign}
                action={
                  <Button size="sm" className="h-10 rounded-xl shadow-sm">
                    <Plus className="h-4 w-4" />
                    Add Budget Item
                  </Button>
                }
              >
                <div className="overflow-hidden rounded-xl border border-[#DDEBFF] bg-white shadow-inner dark:border-white/10 dark:bg-[#0F172A]/20">
                  <table className="w-full text-sm">
                    <thead className="hidden border-b border-[#EAF0F6] bg-[#F8FAFC] md:table-header-group dark:border-white/10 dark:bg-[#0F172A]/20">
                      <tr>
                        {['Account Name', 'Classification (L1/L2/L3)', 'EBS/Fusion Code / Expense Type', 'Budget Requested'].map((h) => (
                          <th key={h} className="whitespace-nowrap px-4 py-3 text-start text-xs font-bold text-[#64748B] dark:text-slate-200">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td colSpan={4} className="px-4 py-12 text-center">
                          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-[#E9F4FF]">
                            <Plus className="h-6 w-6 text-[var(--primary)]" />
                          </div>
                          <p className="text-sm font-bold text-[#0F172A] dark:text-white">No budget items added yet</p>
                          <p className="mt-1 text-xs text-[#64748B] dark:text-slate-200">Add a row manually or switch to Copilot and let AI draft the line items.</p>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
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
                <span>Draft autosave-ready. Submit when required fields and documents are complete.</span>
              </div>
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
                <Button variant="ghost" asChild className="w-full sm:w-auto"><Link to="/respondent/projects">Cancel</Link></Button>
                <Button variant="outline" className="w-full rounded-xl sm:w-auto">Save Draft</Button>
                <Button className="w-full rounded-xl shadow-sm sm:w-auto" onClick={() => setSubmitConfirmOpen(true)}>Submit for Review</Button>
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
      <ConfirmationModal
        open={submitConfirmOpen}
        onOpenChange={setSubmitConfirmOpen}
        title="Submit this budget item for review?"
        description="This will move the request into the Reviewer queue for assessment of scope, budget logic, documents, and readiness."
        confirmLabel="Submit Now"
        cancelLabel="Keep Editing"
        onConfirm={handleSubmitForReview}
        meta={<p className="text-sm font-medium text-[#475569] dark:text-slate-200">One final check before the next governance step.</p>}
      />
    </div>
  )
}
