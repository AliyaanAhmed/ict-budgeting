import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  RefreshCcw,
  Save,
  CheckCircle2,
  RotateCcw,
  XCircle,
  PlusCircle,
  Loader2,
  AlertCircle,
  Search,
  X,
  Users,
  Building2,
  ListChecks,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { DatePickerField } from '@/components/shared/DatePickerField'
import { useToast } from '@/context/ToastContext'
import { getCycleById, updateCycleFields, updateCycleStatus } from '@/api/dataverse/dataverseCyclesApi'
import { ConfirmationModal } from '@/components/shared/ConfirmationModal'
import {
  getInstancesByCycleId,
  getExistingInstanceEntityIds,
  createInstance,
  getModuleConfigurations,
} from '@/api/dataverse/dataverseInstancesApi'
import type { CycleRecord, InstanceRecord, ModuleConfigOption } from '@/domain/cycle'
import { CYCLE_STATUS_DRAFT, CYCLE_STATUS_PUBLISHED, CYCLE_STATUS_COMPLETED } from '@/domain/cycle'

// ─── Status helpers ───────────────────────────────────────────────────────────

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

function InstanceStatusBadge({ statusLabel }: { statusLabel: string | null }) {
  if (!statusLabel) return <span className="text-[#94A3B8] text-xs">—</span>
  const lower = statusLabel.toLowerCase()
  const cls = lower.includes('planning')
    ? 'bg-cyan-50 text-cyan-700 dark:bg-cyan-900/20 dark:text-cyan-300'
    : lower.includes('published')
      ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
      : lower.includes('draft')
        ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300'
        : 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300'
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold', cls)}>
      {statusLabel}
    </span>
  )
}

function formatDate(iso: string | null, formatted: string | null): string {
  if (formatted) return formatted
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-AE', { day: '2-digit', month: 'short', year: 'numeric' })
}

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="mb-2 block text-sm font-semibold text-[#0F172A] dark:text-white">
      {children}
      {required && <span className="ml-1 text-red-500">*</span>}
    </label>
  )
}

function ReadonlyField({ value }: { value: string }) {
  return (
    <div className="flex h-12 items-center rounded-xl border border-slate-200 bg-[#F8FBFF] px-4 text-sm text-[#475569] dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
      {value || '—'}
    </div>
  )
}

// ─── Add ADGE Modal ───────────────────────────────────────────────────────────

interface AddAdgeModalProps {
  cycleId: string
  onClose: () => void
  onInstancesAdded: () => void
}

function AddAdgeModal({ cycleId, onClose, onInstancesAdded }: AddAdgeModalProps) {
  const { runActionToast, showErrorToast } = useToast()
  const [configs, setConfigs] = useState<ModuleConfigOption[]>([])
  const [existingEntityIds, setExistingEntityIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [submitting, setSubmitting] = useState(false)
  const backdropRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    Promise.all([getModuleConfigurations(), getExistingInstanceEntityIds(cycleId)])
      .then(([cfgs, ids]) => {
        setConfigs(cfgs)
        setExistingEntityIds(ids)
      })
      .catch(() => setLoadError('Failed to load entities. Please close and try again.'))
      .finally(() => setLoading(false))
  }, [cycleId])

  const filtered = configs.filter(
    (c) =>
      !search ||
      c.accountName.toLowerCase().includes(search.toLowerCase()) ||
      c.name.toLowerCase().includes(search.toLowerCase()),
  )

  function toggle(configId: string, accountId: string) {
    if (existingEntityIds.has(accountId)) return
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(configId) ? next.delete(configId) : next.add(configId)
      return next
    })
  }

  async function handleConfirm() {
    if (selected.size === 0) return
    const toAdd = configs.filter((c) => selected.has(c.id))
    setSubmitting(true)
    try {
      await runActionToast(
        async () => {
          await Promise.all(toAdd.map((c) => createInstance(cycleId, c.accountId, c.id, c.accountName)))
        },
        {
          processingTitle: `Adding ${toAdd.length} instance${toAdd.length > 1 ? 's' : ''}...`,
          successTitle: `${toAdd.length} instance${toAdd.length > 1 ? 's' : ''} added successfully`,
          errorTitle: 'Failed to add instances',
        },
      )
      onInstancesAdded()
      onClose()
    } catch {
      showErrorToast('An unexpected error occurred while adding instances.')
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
      <div className="flex w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-[#DDEBFF] bg-white shadow-2xl dark:border-white/10 dark:bg-[#1E293B]" style={{ maxHeight: '82vh' }}>

        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-[#DDEBFF] px-6 py-4 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#286CFF] dark:bg-[#286CFF]/15">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#0F172A] dark:text-white">Add ADGE</h2>
              <p className="text-xs text-[#64748B] dark:text-slate-400">Select entities to create request instances</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#94A3B8] hover:bg-[#F1F5F9] hover:text-[#0F172A] transition-colors dark:hover:bg-white/10 dark:hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Search */}
        <div className="shrink-0 border-b border-[#F1F5F9] px-6 py-3 dark:border-white/5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
            <input
              type="text"
              placeholder="Search entities..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-full rounded-xl border border-[#DDEBFF] bg-[#F8FBFF] pl-9 pr-3 text-sm text-[#0F172A] placeholder:text-[#94A3B8] outline-none focus:border-[#286CFF] focus:ring-2 focus:ring-[#286CFF]/20 transition-colors dark:border-white/10 dark:bg-white/5 dark:text-white"
            />
          </div>
        </div>

        {/* Scrollable entity list */}
        <div
          className="overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#CBD5E1] [&::-webkit-scrollbar-track]:bg-transparent dark:[&::-webkit-scrollbar-thumb]:bg-slate-600"
          style={{ maxHeight: '200px', scrollbarWidth: 'thin', scrollbarColor: '#CBD5E1 transparent' }}
        >
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-[#64748B]">
              <Loader2 className="h-7 w-7 animate-spin text-[#286CFF]" />
              <span className="text-sm">Loading entities...</span>
            </div>
          ) : loadError ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-red-500">
              <AlertCircle className="h-7 w-7" />
              <span className="text-sm">{loadError}</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-[#64748B]">
              <Building2 className="h-9 w-9 opacity-30" />
              <span className="text-sm">
                {search ? 'No entities match your search.' : 'No module configurations found.'}
              </span>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10">
                <tr className="border-b border-[#DDEBFF] bg-[#F8FBFF] dark:border-white/10 dark:bg-[#0F172A]/80">
                  <th className="w-12 px-5 py-3" />
                  <th className="px-5 py-3 text-left text-[14px] font-semibold text-[#64748B] dark:text-slate-300">Entity Name</th>
                  <th className="px-5 py-3 text-left text-[14px] font-semibold text-[#64748B] dark:text-slate-300">Configuration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9] dark:divide-white/5">
                {filtered.map((config) => {
                  const alreadyAdded = existingEntityIds.has(config.accountId)
                  const isSelected = selected.has(config.id)
                  return (
                    <tr
                      key={config.id}
                      onClick={() => toggle(config.id, config.accountId)}
                      className={cn(
                        'transition-colors',
                        alreadyAdded
                          ? 'opacity-40 cursor-not-allowed'
                          : isSelected
                            ? 'bg-[#E7F5FF] dark:bg-[#286CFF]/10 cursor-pointer'
                            : 'hover:bg-[#F8FBFF] dark:hover:bg-white/5 cursor-pointer',
                      )}
                    >
                      <td className="px-5 py-3.5 text-center">
                        <div className={cn(
                          'mx-auto flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors',
                          alreadyAdded
                            ? 'border-[#94A3B8] bg-[#94A3B8]'
                            : isSelected
                              ? 'border-[#286CFF] bg-[#286CFF]'
                              : 'border-[#CBD5E1] bg-white dark:border-white/20 dark:bg-transparent',
                        )}>
                          {(isSelected || alreadyAdded) && (
                            <svg viewBox="0 0 10 10" className="h-3 w-3 fill-white">
                              <path d="M1.5 5L4 7.5L8.5 2.5" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-medium text-[#0F172A] dark:text-white">{config.accountName}</span>
                        {alreadyAdded && (
                          <span className="ml-2 text-xs text-[#94A3B8]">(already added)</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-[#64748B] dark:text-slate-400">{config.name}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="flex shrink-0 items-center justify-between border-t border-[#DDEBFF] px-6 py-4 dark:border-white/10">
          <span className="text-sm text-[#475569] dark:text-slate-300">
            {selected.size > 0 ? `${selected.size} selected` : 'No entities selected'}
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="rounded-xl border border-[#DDEBFF] px-4 py-2 text-sm font-medium text-[#475569] hover:bg-[#F8FBFF] transition-colors dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={selected.size === 0 || submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-[#286CFF] px-4 py-2 text-sm font-semibold text-white hover:bg-[#043DFF] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
              Add Selected ({selected.size})
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CycleDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { runActionToast, showErrorToast } = useToast()

  const [cycle, setCycle] = useState<CycleRecord | null>(null)
  const [instances, setInstances] = useState<InstanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [instancesLoading, setInstancesLoading] = useState(false)
  const [instancesError, setInstancesError] = useState<string | null>(null)

  const [formName, setFormName] = useState('')
  const [formStartDate, setFormStartDate] = useState('')
  const [formEndDate, setFormEndDate] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [showAdgeModal, setShowAdgeModal] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    title: string
    description: string
    confirmLabel: string
    tone: 'primary' | 'danger'
    onConfirm: () => void
  }>({ open: false, title: '', description: '', confirmLabel: '', tone: 'primary', onConfirm: () => {} })

  function closeConfirm() {
    setConfirmDialog((p) => ({ ...p, open: false }))
  }

  async function loadCycle() {
    if (!id) return
    try {
      const data = await getCycleById(id)
      if (!data) { setLoadError('Cycle record not found. It may have been deleted.'); return }
      setCycle(data)
      setFormName(data.name)
      setFormStartDate(data.plannedStartDate ?? '')
      setFormEndDate(data.plannedEndDate ?? '')
    } catch {
      setLoadError('Failed to load cycle details. Please refresh the page.')
    }
  }

  async function loadInstances() {
    if (!id) return
    setInstancesLoading(true)
    setInstancesError(null)
    try {
      const data = await getInstancesByCycleId(id)
      setInstances(data)
    } catch {
      setInstancesError('Failed to load request instances. Please try again.')
    } finally {
      setInstancesLoading(false)
    }
  }

  useEffect(() => {
    if (!id) return
    setLoading(true)
    Promise.all([loadCycle(), loadInstances()]).finally(() => setLoading(false))
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSave() {
    if (!id || !cycle) return
    setFormError(null)
    if (!formName.trim()) { setFormError('Cycle Name is required.'); return }
    if (!formStartDate) { setFormError('Planned Start Date is required.'); return }
    if (!formEndDate) { setFormError('Planned End Date is required.'); return }
    if (formStartDate > formEndDate) { setFormError('Start Date must be before End Date.'); return }

    setSaving(true)
    try {
      await runActionToast(
        () => updateCycleFields(id, formName.trim(), formStartDate, formEndDate),
        { processingTitle: 'Saving cycle...', successTitle: 'Cycle saved successfully', errorTitle: 'Failed to save cycle' },
      )
      await loadCycle()
    } catch {
      setFormError('An error occurred while saving. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  function confirmStatusChange(
    title: string,
    description: string,
    confirmLabel: string,
    tone: 'primary' | 'danger',
    newStatus: number,
  ) {
    setConfirmDialog({
      open: true, title, description, confirmLabel, tone,
      onConfirm: async () => {
        closeConfirm()
        try {
          await runActionToast(
            () => updateCycleStatus(id!, newStatus),
            { processingTitle: 'Updating status...', successTitle: 'Status updated successfully', errorTitle: 'Failed to update status' },
          )
          await loadCycle()
        } catch {
          showErrorToast('An error occurred while updating the status. Please try again.')
        }
      },
    })
  }

  const isDraft = cycle?.statusCode === CYCLE_STATUS_DRAFT
  const isPublished = cycle?.statusCode === CYCLE_STATUS_PUBLISHED

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#286CFF]" />
      </div>
    )
  }

  if (loadError || !cycle) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 p-6">
        <AlertCircle className="h-10 w-10 text-red-400" />
        <p className="text-center text-sm text-red-500">{loadError ?? 'Cycle not found.'}</p>
        <button
          onClick={() => navigate('/admin/assessment-cycles')}
          className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-[#286CFF] hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Assessment Cycles
        </button>
      </div>
    )
  }

  return (
    <div className="w-full space-y-5">

      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-[#DDEBFF] bg-white px-4 py-5 shadow-[0_10px_26px_rgba(15,23,42,0.05)] dark:border-white/10 dark:bg-[#1E293B] sm:px-6">
        <nav className="mb-4 flex flex-wrap items-center gap-1 text-xs text-[#64748B] dark:text-slate-200">
          <button
            onClick={() => navigate('/admin/assessment-cycles')}
            className="hover:text-[#286CFF] transition-colors"
          >
            Assessment Cycles
          </button>
          <span>/</span>
          <span className="text-[#0F172A] dark:text-white">{cycle.name}</span>
        </nav>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <button
              onClick={() => navigate('/admin/assessment-cycles')}
              className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-[#475569] transition-colors hover:text-[#286CFF] dark:text-slate-200"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-[#0F172A] dark:text-white sm:text-3xl">
                {cycle.name}
              </h1>
              <CycleStatusBadge statusCode={cycle.statusCode} statusLabel={cycle.statusLabel} />
            </div>
            <div className="mt-2 space-y-1">
              <p className="text-sm text-[#475569] dark:text-slate-200">
                {cycle.moduleTypeLabel ?? 'No module type'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {isDraft && (
              <>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl border border-[#DDEBFF] bg-white px-4 py-2.5 text-sm font-semibold text-[#475569] hover:bg-[#F8FBFF] hover:border-[#286CFF] hover:text-[#286CFF] disabled:opacity-60 transition-colors dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save Changes
                </button>
                <button
                  onClick={() =>
                    confirmStatusChange(
                      'Publish Cycle',
                      'Publishing this cycle will lock all fields and make it visible to respondents. Continue?',
                      'Publish',
                      'primary',
                      CYCLE_STATUS_PUBLISHED,
                    )
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-[#286CFF] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#043DFF] transition-colors shadow-sm"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Publish
                </button>
              </>
            )}
            {isPublished && (
              <>
                <button
                  onClick={() =>
                    confirmStatusChange(
                      'Revise Cycle',
                      'This will move the cycle back to Draft, making all fields editable again.',
                      'Revise',
                      'primary',
                      CYCLE_STATUS_DRAFT,
                    )
                  }
                  className="inline-flex items-center gap-2 rounded-xl border border-[#286CFF]/30 bg-[#F0F7FF] px-4 py-2.5 text-sm font-semibold text-[#286CFF] hover:bg-[#DDEBFF] transition-colors dark:border-[#286CFF]/40 dark:bg-[#286CFF]/10 dark:text-[#93C5FD] dark:hover:bg-[#286CFF]/20"
                >
                  <RotateCcw className="h-4 w-4" />
                  Revise
                </button>
                <button
                  onClick={() =>
                    confirmStatusChange(
                      'Mark As Closed',
                      'This will mark the cycle as Completed. This action cannot be undone.',
                      'Mark As Closed',
                      'danger',
                      CYCLE_STATUS_COMPLETED,
                    )
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-[#EA4F49] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#D63F39] transition-colors shadow-sm"
                >
                  <XCircle className="h-4 w-4" />
                  Mark As Closed
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Cycle Details ────────────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-[#DDEBFF] bg-white shadow-[0_10px_26px_rgba(15,23,42,0.05)] dark:border-white/10 dark:bg-[#1E293B]">
        <div className="flex items-center gap-4 border-b border-[#DDEBFF] px-4 py-4 dark:border-white/10 sm:px-6">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#286CFF] dark:bg-[#286CFF]/15">
            <RefreshCcw className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#0F172A] dark:text-white">Cycle Details</h2>
            <p className="text-sm text-[#64748B] dark:text-slate-400">
              {isDraft
                ? 'Edit the cycle name and schedule dates below.'
                : 'This cycle is read-only. Revise to unlock editing.'}
            </p>
          </div>
        </div>

        <div className="px-4 py-5 sm:px-6">
          {formError && (
            <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 dark:border-red-700/30 dark:bg-red-900/20">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
              <p className="text-sm text-red-600 dark:text-red-400">{formError}</p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <FieldLabel required={isDraft}>Cycle Name</FieldLabel>
              {isDraft ? (
                <Input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Enter cycle name"
                  className="h-12 rounded-xl border-slate-200 bg-white text-sm shadow-sm dark:bg-[#1E293B]"
                />
              ) : (
                <ReadonlyField value={cycle.name} />
              )}
            </div>

            <div>
              <FieldLabel>Module Type</FieldLabel>
              <ReadonlyField value={cycle.moduleTypeLabel ?? '—'} />
              <p className="mt-1.5 text-xs text-[#94A3B8]">Set at cycle creation — cannot be changed</p>
            </div>

            <div>
              <FieldLabel required={isDraft}>Planned Start Date</FieldLabel>
              {isDraft ? (
                <DatePickerField value={formStartDate} onChange={setFormStartDate} placeholder="Select start date" />
              ) : (
                <ReadonlyField value={formatDate(cycle.plannedStartDate, cycle.plannedStartDateFormatted)} />
              )}
            </div>

            <div>
              <FieldLabel required={isDraft}>Planned End Date</FieldLabel>
              {isDraft ? (
                <DatePickerField value={formEndDate} onChange={setFormEndDate} placeholder="Select end date" />
              ) : (
                <ReadonlyField value={formatDate(cycle.plannedEndDate, cycle.plannedEndDateFormatted)} />
              )}
            </div>
          </div>

        </div>
      </div>

      {/* ── ICT Budget Instances ─────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-[#DDEBFF] bg-white shadow-[0_10px_26px_rgba(15,23,42,0.05)] dark:border-white/10 dark:bg-[#1E293B]">
        <div className="flex items-center justify-between border-b border-[#DDEBFF] px-4 py-4 dark:border-white/10 sm:px-6">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#286CFF] dark:bg-[#286CFF]/15">
              <ListChecks className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#0F172A] dark:text-white">ICT Budget Instances</h2>
              <p className="text-sm text-[#64748B] dark:text-slate-400">
                {instances.length} instance{instances.length !== 1 ? 's' : ''} linked to this cycle
              </p>
            </div>
          </div>
          {isDraft && (
            <button
              onClick={() => setShowAdgeModal(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-[#286CFF] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#043DFF] transition-colors shadow-sm"
            >
              <PlusCircle className="h-4 w-4" />
              Add ADGE
            </button>
          )}
        </div>

        {instancesLoading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-[#64748B]">
            <Loader2 className="h-7 w-7 animate-spin text-[#286CFF]" />
            <span className="text-sm">Loading instances...</span>
          </div>
        ) : instancesError ? (
          <div className="flex flex-col items-center justify-center gap-3 py-12 text-red-500">
            <AlertCircle className="h-8 w-8" />
            <p className="text-sm">{instancesError}</p>
            <button onClick={loadInstances} className="mt-1 text-xs font-medium text-[#286CFF] hover:underline">
              Try again
            </button>
          </div>
        ) : instances.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-[#64748B]">
            <ListChecks className="h-10 w-10 opacity-20" />
            <p className="text-sm">No request instances linked to this cycle.</p>
            {isDraft && (
              <button
                onClick={() => setShowAdgeModal(true)}
                className="mt-1 inline-flex items-center gap-1.5 rounded-xl bg-[#286CFF] px-4 py-2 text-sm font-semibold text-white hover:bg-[#043DFF] transition-colors"
              >
                <PlusCircle className="h-4 w-4" />
                Add ADGE
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#DDEBFF] bg-[#F8FBFF] dark:border-white/10 dark:bg-white/5">
                  <th className="px-5 py-3.5 text-left text-[14px] font-semibold text-[#64748B] dark:text-slate-300">Instance Name</th>
                  <th className="px-5 py-3.5 text-left text-[14px] font-semibold text-[#64748B] dark:text-slate-300">Entity</th>
                  <th className="px-5 py-3.5 text-left text-[14px] font-semibold text-[#64748B] dark:text-slate-300">Start Date</th>
                  <th className="px-5 py-3.5 text-left text-[14px] font-semibold text-[#64748B] dark:text-slate-300">End Date</th>
                  <th className="px-5 py-3.5 text-left text-[14px] font-semibold text-[#64748B] dark:text-slate-300">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9] dark:divide-white/5">
                {instances.map((inst) => (
                  <tr key={inst.id} className="transition-colors hover:bg-[#F8FBFF] dark:hover:bg-white/5">
                    <td className="px-5 py-4 font-medium text-[#0F172A] dark:text-white">{inst.name}</td>
                    <td className="px-5 py-4 text-[#475569] dark:text-slate-300">
                      {inst.entityName ?? inst.entityAbbr ?? '—'}
                    </td>
                    <td className="px-5 py-4 text-[#475569] dark:text-slate-300">
                      {formatDate(inst.planningStartDate, inst.planningStartDateFormatted)}
                    </td>
                    <td className="px-5 py-4 text-[#475569] dark:text-slate-300">
                      {formatDate(inst.planningEndDate, inst.planningEndDateFormatted)}
                    </td>
                    <td className="px-5 py-4">
                      <InstanceStatusBadge statusLabel={inst.statusLabel} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmationModal
        open={confirmDialog.open}
        onOpenChange={(open) => { if (!open) closeConfirm() }}
        title={confirmDialog.title}
        description={confirmDialog.description}
        confirmLabel={confirmDialog.confirmLabel}
        tone={confirmDialog.tone}
        onConfirm={confirmDialog.onConfirm}
      />

      {showAdgeModal && id && (
        <AddAdgeModal
          cycleId={id}
          onClose={() => setShowAdgeModal(false)}
          onInstancesAdded={loadInstances}
        />
      )}
    </div>
  )
}
