import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { RefreshCcw, CalendarDays, Search, Loader2, AlertCircle, PlusCircle, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getAllCycles, getModuleTypes, createCycle } from '@/api/dataverse/dataverseCyclesApi'
import type { CycleRecord, ModuleTypeOption } from '@/domain/cycle'
import { CYCLE_STATUS_DRAFT, CYCLE_STATUS_PUBLISHED, CYCLE_STATUS_COMPLETED } from '@/domain/cycle'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DatePickerField } from '@/components/shared/DatePickerField'
import { useToast } from '@/context/ToastContext'

function CycleStatusBadge({ statusCode, statusLabel }: { statusCode: number; statusLabel: string }) {
  const cls =
    statusCode === CYCLE_STATUS_COMPLETED
      ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700/30'
      : statusCode === CYCLE_STATUS_PUBLISHED
        ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700/30'
        : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-700/30'
  return (
    <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold', cls)}>
      {statusLabel}
    </span>
  )
}

function formatDate(iso: string | null, formatted: string | null): string {
  if (formatted) return formatted
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-AE', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ─── Create Cycle Modal ───────────────────────────────────────────────────────

interface CreateCycleModalProps {
  onClose: () => void
  onCreated: (newId: string) => void
}

function CreateCycleModal({ onClose, onCreated }: CreateCycleModalProps) {
  const { runActionToast } = useToast()
  const backdropRef = useRef<HTMLDivElement>(null)

  const [moduleTypes, setModuleTypes] = useState<ModuleTypeOption[]>([])
  const [loadingTypes, setLoadingTypes] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [moduleTypeId, setModuleTypeId] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    getModuleTypes()
      .then((types) => {
        setModuleTypes(types)
        if (types.length === 1) setModuleTypeId(types[0].id)
      })
      .catch(() => setLoadError('Failed to load module types.'))
      .finally(() => setLoadingTypes(false))
  }, [])

  async function handleSubmit() {
    setFormError(null)
    if (!name.trim()) { setFormError('Cycle Name is required.'); return }
    if (!moduleTypeId) { setFormError('Module Type is required.'); return }
    if (!startDate) { setFormError('Planned Start Date is required.'); return }
    if (!endDate) { setFormError('Planned End Date is required.'); return }
    if (startDate > endDate) { setFormError('Start Date must be before End Date.'); return }

    setSubmitting(true)
    try {
      let newId = ''
      await runActionToast(
        async () => {
          newId = await createCycle(name.trim(), moduleTypeId, startDate, endDate)
        },
        {
          processingTitle: 'Creating cycle...',
          successTitle: 'Cycle created successfully',
          errorTitle: 'Failed to create cycle',
        },
      )
      onCreated(newId)
    } catch {
      setFormError('An error occurred while creating the cycle. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === backdropRef.current) onClose() }}
    >
      <div className="w-full max-w-lg rounded-2xl border border-[#DDEBFF] bg-white shadow-2xl dark:border-white/10 dark:bg-[#1E293B]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#DDEBFF] px-6 py-4 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E7F5FF] dark:bg-[#286CFF]/20">
              <PlusCircle className="h-4 w-4 text-[#286CFF]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#0F172A] dark:text-white">Create Cycle</h2>
              <p className="text-xs text-[#64748B] dark:text-slate-400">Set up a new assessment cycle</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#94A3B8] hover:bg-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {formError && (
            <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 dark:border-red-700/30 dark:bg-red-900/20">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
              <p className="text-sm text-red-600 dark:text-red-400">{formError}</p>
            </div>
          )}

          {/* Cycle Name */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-[#0F172A] dark:text-white">
              Cycle Name <span className="text-red-500">*</span>
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter cycle name"
              className="h-12 rounded-xl border-slate-200 bg-white text-sm shadow-sm dark:bg-[#1E293B]"
            />
          </div>

          {/* Module Type */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-[#0F172A] dark:text-white">
              Module Type <span className="text-red-500">*</span>
            </label>
            {loadingTypes ? (
              <div className="flex h-12 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm text-[#94A3B8]">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading...
              </div>
            ) : loadError ? (
              <div className="flex h-12 items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 text-sm text-red-500">
                <AlertCircle className="h-4 w-4" />
                {loadError}
              </div>
            ) : (
              <Select value={moduleTypeId} onValueChange={setModuleTypeId}>
                <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-white text-sm shadow-sm dark:bg-[#1E293B]">
                  <SelectValue placeholder="Select module type" />
                </SelectTrigger>
                <SelectContent>
                  {moduleTypes.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#0F172A] dark:text-white">
                Planned Start Date <span className="text-red-500">*</span>
              </label>
              <DatePickerField value={startDate} onChange={setStartDate} placeholder="Select start date" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#0F172A] dark:text-white">
                Planned End Date <span className="text-red-500">*</span>
              </label>
              <DatePickerField value={endDate} onChange={setEndDate} placeholder="Select end date" />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t border-[#DDEBFF] px-6 py-4 dark:border-white/10">
          <button
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || loadingTypes}
            className="inline-flex items-center gap-2 rounded-lg bg-[#286CFF] px-5 py-2 text-sm font-semibold text-white hover:bg-[#043DFF] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
            Create Cycle
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AssessmentCycles() {
  const navigate = useNavigate()
  const { showErrorToast } = useToast()
  const [cycles, setCycles] = useState<CycleRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    setLoading(true)
    getAllCycles()
      .then(setCycles)
      .catch(() => setError('Failed to load assessment cycles.'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = cycles.filter(
    (c) =>
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.moduleTypeLabel ?? '').toLowerCase().includes(search.toLowerCase()),
  )

  function handleCreated(newId: string) {
    setShowCreateModal(false)
    if (newId) {
      navigate(`/admin/cycles/${newId}`)
    } else {
      showErrorToast('Cycle was created but could not navigate to it.')
    }
  }

  return (
    <div className="min-h-screen bg-[var(--background)] p-6">
      {/* Page header */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#286CFF] to-[#4F98FF] text-white shadow">
            <RefreshCcw className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[var(--foreground)]">Assessment Cycles</h1>
            <p className="text-sm text-[var(--muted-foreground)]">Manage ICT budgeting cycles and their instances</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--muted)] px-3 py-1.5">
            <CalendarDays className="h-4 w-4 text-[var(--primary)]" />
            <span className="text-xs font-semibold text-[var(--muted-foreground)]">{cycles.length} cycle{cycles.length !== 1 ? 's' : ''}</span>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-[#286CFF] px-4 py-2 text-sm font-semibold text-white hover:bg-[#043DFF] transition-colors shadow-sm"
          >
            <PlusCircle className="h-4 w-4" />
            Create Cycle
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4 flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
          <input
            type="text"
            placeholder="Search cycles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] pl-9 pr-3 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] outline-none focus:border-[#286CFF] focus:ring-2 focus:ring-[#286CFF]/20 transition-colors"
          />
        </div>
      </div>

      {/* Table card */}
      <div className="overflow-hidden rounded-2xl border border-[#DDEBFF] bg-white shadow-[0_10px_26px_rgba(15,23,42,0.05)] dark:border-white/10 dark:bg-[#1E293B]">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-[var(--muted-foreground)]">
            <Loader2 className="h-8 w-8 animate-spin text-[#286CFF]" />
            <span className="text-sm">Loading cycles...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-red-500">
            <AlertCircle className="h-8 w-8" />
            <span className="text-sm">{error}</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-[var(--muted-foreground)]">
            <RefreshCcw className="h-10 w-10 opacity-30" />
            <span className="text-sm">{search ? 'No cycles match your search.' : 'No assessment cycles found.'}</span>
            {!search && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-1 inline-flex items-center gap-2 rounded-xl bg-[#286CFF] px-4 py-2 text-sm font-semibold text-white hover:bg-[#043DFF] transition-colors"
              >
                <PlusCircle className="h-4 w-4" />
                Create Cycle
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#DDEBFF] bg-[#F8FBFF] dark:border-white/10 dark:bg-white/5">
                  <th className="px-5 py-3.5 text-left text-[14px] font-semibold text-[#64748B] dark:text-slate-300">Name</th>
                  <th className="px-5 py-3.5 text-left text-[14px] font-semibold text-[#64748B] dark:text-slate-300">Module Type</th>
                  <th className="px-5 py-3.5 text-left text-[14px] font-semibold text-[#64748B] dark:text-slate-300">Planned Start Date</th>
                  <th className="px-5 py-3.5 text-left text-[14px] font-semibold text-[#64748B] dark:text-slate-300">Planned End Date</th>
                  <th className="px-5 py-3.5 text-left text-[14px] font-semibold text-[#64748B] dark:text-slate-300">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9] dark:divide-white/5">
                {filtered.map((cycle) => (
                  <tr
                    key={cycle.id}
                    className="group transition-colors hover:bg-[#F8FBFF] dark:hover:bg-white/5"
                  >
                    <td className="px-5 py-4">
                      <Link
                        to={`/admin/cycles/${cycle.id}`}
                        className="font-semibold text-[#286CFF] hover:underline hover:text-[#043DFF] transition-colors"
                      >
                        {cycle.name}
                      </Link>
                    </td>
                    <td className="px-5 py-4 text-[#475569] dark:text-slate-300">
                      {cycle.moduleTypeLabel ?? '—'}
                    </td>
                    <td className="px-5 py-4 text-[#475569] dark:text-slate-300">
                      {formatDate(cycle.plannedStartDate, cycle.plannedStartDateFormatted)}
                    </td>
                    <td className="px-5 py-4 text-[#475569] dark:text-slate-300">
                      {formatDate(cycle.plannedEndDate, cycle.plannedEndDateFormatted)}
                    </td>
                    <td className="px-5 py-4">
                      <CycleStatusBadge statusCode={cycle.statusCode} statusLabel={cycle.statusLabel} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreateCycleModal
          onClose={() => setShowCreateModal(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  )
}
