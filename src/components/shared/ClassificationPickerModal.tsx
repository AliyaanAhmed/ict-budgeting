import { useEffect, useRef, useState } from 'react'
import {
  Check,
  ChevronRight,
  FolderCheck,
  Layers3,
  Search,
  X,
} from 'lucide-react'
import type { BudgetItemDraft, ClassificationNode } from '@/domain/classification'
import { useClassificationPicker } from '@/hooks/useClassificationPicker'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface ClassificationPickerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  existingItems: BudgetItemDraft[]
  onCreate: (items: BudgetItemDraft[]) => Promise<void> | void
}

function EmptyState({ title }: { title: string }) {
  return (
    <div className="flex min-h-[136px] items-center justify-center rounded-2xl border border-dashed border-[#DDEBFF] bg-[#F8FBFF] px-5 text-center text-sm text-[#64748B] dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
      {title}
    </div>
  )
}

function LevelCard({
  title,
  subtitle,
  items,
  selectedId,
  onSelect,
  placeholder,
}: {
  title: string
  subtitle: string
  items: ClassificationNode[]
  selectedId: string | null
  onSelect: (id: string) => void
  placeholder: string
}) {
  return (
    <div className="rounded-[24px] border border-[#DDEBFF] bg-white/95 p-3.5 shadow-[0_14px_34px_rgba(15,23,42,0.05)] dark:border-white/10 dark:bg-[#1E293B]">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-[#0F172A] dark:text-white">{title}</h3>
          <p className="text-xs text-[#64748B] dark:text-slate-300">{subtitle}</p>
        </div>
        <div className="rounded-full bg-[#E7F5FF] px-2.5 py-1 text-xs font-semibold text-[#286CFF] dark:bg-[#286CFF]/15">
          {items.length}
        </div>
      </div>

      {items.length === 0 ? (
        <EmptyState title={placeholder} />
      ) : (
        <div className="max-h-[220px] space-y-2 overflow-y-auto pr-1">
          {items.map((item) => {
            const isSelected = item.id === selectedId

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelect(item.id)}
                className={cn(
                  'group flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition-all',
                  isSelected
                    ? 'border-[#4A6FFF] bg-[#EEF3FF]'
                    : 'border-[#D9E6F7] bg-white hover:border-[#B0DBFF] hover:bg-[#F8FBFF] dark:border-white/10 dark:bg-[#0F172A]/20 dark:hover:bg-white/5'
                )}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div
                    className={cn(
                      'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors',
                      isSelected
                        ? 'border-[#4A6FFF] bg-[#4A6FFF] text-white'
                        : 'border-[#C7D2FE] bg-white text-transparent dark:bg-transparent'
                    )}
                  >
                    <Check className="h-3.5 w-3.5" />
                  </div>
                  <span className="whitespace-normal break-words text-sm font-medium leading-5 text-[#334155] dark:text-slate-100">{item.name}</span>
                </div>
                <div className="rounded-full bg-[#E2E8F0] px-2 py-0.5 text-xs font-semibold text-[#64748B] dark:bg-white/10 dark:text-slate-200">
                  {item.children.length}
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function ClassificationPickerModal({
  open,
  onOpenChange,
  existingItems,
  onCreate,
}: ClassificationPickerModalProps) {
  const [creating, setCreating] = useState(false)
  const searchContainerRef = useRef<HTMLDivElement | null>(null)
  const {
    loading,
    error,
    searchTerm,
    setSearchTerm,
    level1Items,
    level2Items,
    level3Items,
    budgetAccountItems,
    searchResults,
    pendingItems,
    selectedLevelIds,
    selectedAccountIds,
    selectLevel,
    toggleBudgetAccount,
    removePending,
    applySearchResult,
  } = useClassificationPicker({
    open,
    existingIds: existingItems.map((item) => item.id),
  })

  useEffect(() => {
    if (!open || searchTerm.trim().length < 2) return

    const handlePointerDown = (event: MouseEvent) => {
      if (!searchContainerRef.current) return
      const target = event.target
      if (target instanceof Node && !searchContainerRef.current.contains(target)) {
        setSearchTerm('')
      }
    }

    document.addEventListener('mousedown', handlePointerDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
    }
  }, [open, searchTerm, setSearchTerm])

  const handleCreate = async () => {
    if (pendingItems.length === 0) return
    setCreating(true)
    try {
      await onCreate(pendingItems)
      onOpenChange(false)
    } catch {
      return
    } finally {
      setCreating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[1020px] p-0">
        <div className="overflow-hidden rounded-[28px] bg-[linear-gradient(180deg,#F6F9FF_0%,#FFFFFF_100%)] dark:bg-[#1E293B]">
          <div className="border-b border-[#DDEBFF] px-6 py-4 pr-16 dark:border-white/10 sm:pr-20">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex min-w-0 items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#D5E2F7] bg-[#F8FBFF] text-[#286CFF] dark:border-white/10 dark:bg-white/5">
                  <Layers3 className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <DialogTitle className="text-2xl font-bold text-[#0F172A] dark:text-white">Add Budget Account Code</DialogTitle>
                  <DialogDescription className="text-sm text-[#64748B] dark:text-slate-300">
                    Navigate the hierarchy and queue one or more GL budget accounts for this project.
                  </DialogDescription>
                </div>
              </div>

              <div ref={searchContainerRef} className="relative w-full lg:w-[360px] lg:min-w-[320px]">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748B]" />
                  <Input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Search by account name, EBS code, or Fusion code..."
                    className="h-12 rounded-2xl border-[#D5E2F7] bg-white pl-11 shadow-sm"
                  />

                  {searchTerm.trim().length >= 2 && (
                    <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 overflow-hidden rounded-2xl border border-[#DDEBFF] bg-white shadow-[0_18px_42px_rgba(15,23,42,0.12)] dark:border-white/10 dark:bg-[#1E293B]">
                      {searchResults.length === 0 ? (
                        <div className="px-4 py-3 text-sm text-[#64748B] dark:text-slate-300">No budget accounts matched your search.</div>
                      ) : (
                        <div className="max-h-[280px] overflow-y-auto p-2">
                          {searchResults.map((result) => (
                            <button
                              key={result.id}
                              type="button"
                              onClick={() => applySearchResult(result)}
                              className="flex w-full items-start justify-between rounded-2xl px-3 py-3 text-left transition-colors hover:bg-[#F8FBFF] dark:hover:bg-white/5"
                            >
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-[#0F172A] dark:text-white">{result.accountName}</p>
                                <p className="mt-1 text-xs text-[#64748B] dark:text-slate-300">
                                  {result.pathLabels.l1} <ChevronRight className="mx-1 inline h-3 w-3" />
                                  {result.pathLabels.l2} <ChevronRight className="mx-1 inline h-3 w-3" />
                                  {result.pathLabels.l3}
                                </p>
                                <p className="mt-1 text-xs font-medium text-[#286CFF]">
                                  EBS {result.ebsCode ?? 'N/A'} | Fusion {result.fusionCode ?? 'N/A'}
                                </p>
                              </div>
                              <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-[#94A3B8]" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 px-6 py-4">
            {error && (
              <div className="rounded-2xl border border-[#FFD4D1] bg-[#FFF5F5] px-4 py-3 text-sm text-[#B42318] dark:border-[#EA4F49]/40 dark:bg-[#EA4F49]/10">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 xl:grid-cols-4">
              <LevelCard
                title="Level 1"
                subtitle="Choose the top-level budget family."
                items={level1Items}
                selectedId={selectedLevelIds.l1Id}
                onSelect={(id) => selectLevel(1, id)}
                placeholder={loading ? 'Loading classifications...' : 'No level 1 classifications found.'}
              />
              <LevelCard
                title="Level 2"
                subtitle="Choose the next classification level."
                items={level2Items}
                selectedId={selectedLevelIds.l2Id}
                onSelect={(id) => selectLevel(2, id)}
                placeholder="Select a Level 1 classification first."
              />
              <LevelCard
                title="Level 3"
                subtitle="Choose the final category before GL."
                items={level3Items}
                selectedId={selectedLevelIds.l3Id}
                onSelect={(id) => selectLevel(3, id)}
                placeholder="Select a Level 2 classification first."
              />

              <div className="rounded-[24px] border border-[#DDEBFF] bg-white/95 p-3.5 shadow-[0_14px_34px_rgba(15,23,42,0.05)] dark:border-white/10 dark:bg-[#1E293B]">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-[#0F172A] dark:text-white">Budget Account Code</h3>
                    <p className="text-xs text-[#64748B] dark:text-slate-300">Select one or more GL budget codes.</p>
                  </div>
                  <div className="rounded-full bg-[#E7F5FF] px-2.5 py-1 text-xs font-semibold text-[#286CFF] dark:bg-[#286CFF]/15">
                    {budgetAccountItems.length}
                  </div>
                </div>

                {budgetAccountItems.length === 0 ? (
                  <EmptyState title="Select a Level 3 classification first." />
                ) : (
                  <div className="max-h-[220px] space-y-2 overflow-y-auto pr-1">
                    {budgetAccountItems.map((item) => {
                      const selected = selectedAccountIds.includes(item.id)
                      const existsInGrid = existingItems.some((existingItem) => existingItem.id === item.id)

                      return (
                        <button
                          key={item.id}
                          type="button"
                          disabled={existsInGrid}
                          onClick={() => toggleBudgetAccount(item.id)}
                          className={cn(
                            'w-full rounded-2xl border px-4 py-3 text-left transition-all disabled:cursor-not-allowed disabled:opacity-70',
                            selected
                              ? 'border-[#4A6FFF] bg-[#EEF3FF]'
                              : 'border-[#D9E6F7] bg-white hover:border-[#B0DBFF] hover:bg-[#F8FBFF] dark:border-white/10 dark:bg-[#0F172A]/20 dark:hover:bg-white/5'
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={cn(
                                'mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors',
                                selected
                                  ? 'border-[#4A6FFF] bg-[#4A6FFF] text-white'
                                  : 'border-[#CBD5E1] bg-white text-transparent dark:bg-transparent'
                              )}
                            >
                              <Check className="h-3.5 w-3.5" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-[#334155] dark:text-slate-100">{item.name}</p>
                              <p className="mt-1 text-xs text-[#64748B] dark:text-slate-300">
                                EBS Code {item.ebsCode ?? 'N/A'} | Fusion {item.fusionCode ?? 'N/A'}
                              </p>
                              <div className="mt-2 flex flex-wrap items-center gap-2">
                                {item.expenseTypeLabel && (
                                  <span className="rounded-full bg-[#E7F5FF] px-2 py-0.5 text-[11px] font-semibold text-[#286CFF] dark:bg-[#286CFF]/15">
                                    {item.expenseTypeLabel}
                                  </span>
                                )}
                                {existsInGrid && (
                                  <span className="rounded-full bg-[#FEF3F2] px-2 py-0.5 text-[11px] font-semibold text-[#B42318] dark:bg-[#B42318]/15">
                                    Already in grid
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-[24px] border border-[#DDEBFF] bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#1E293B]">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#D5E2F7] bg-[#F8FBFF] text-[#286CFF] dark:border-white/10 dark:bg-white/5">
                  <FolderCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#0F172A] dark:text-white">Selected Budget Account Codes</h3>
                  <p className="text-sm text-[#64748B] dark:text-slate-300">These will be added to the project grid when you create them.</p>
                </div>
              </div>

              {pendingItems.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#DDEBFF] bg-[#F8FBFF] px-4 py-6 text-center text-sm text-[#64748B] dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                  No budget accounts queued yet.
                </div>
              ) : (
                <div className="max-h-[170px] overflow-y-auto pr-1">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {pendingItems.map((item) => (
                    <div
                      key={item.id}
                      className="group flex min-w-0 items-start gap-3 rounded-2xl border border-[#4A6FFF] bg-[#F7F9FF] px-4 py-3 shadow-[0_8px_18px_rgba(40,108,255,0.10)] dark:border-[#4A6FFF]/70 dark:bg-[#286CFF]/10"
                    >
                      <button
                        type="button"
                        onClick={() => removePending(item.id)}
                        className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#C7D2FE] bg-white text-[#375EFB] shadow-sm transition-colors hover:border-[#375EFB] hover:bg-[#375EFB] hover:text-white dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/15"
                        aria-label={`Remove ${item.accountName}`}
                      >
                        <X className="h-4 w-4" />
                      </button>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[#375EFB]">{item.accountName}</p>
                        <p className="text-xs text-[#375EFB]/90">
                          {item.l1} / {item.l2} / {item.l3}
                        </p>
                        <p className="text-xs text-[#375EFB]/90">
                          EBS {item.ebsCode} | Fusion {item.fusionCode}
                        </p>
                      </div>
                    </div>
                  ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-[#DDEBFF] px-6 py-5 sm:flex-row sm:items-center sm:justify-between dark:border-white/10">
            <p className="text-sm text-[#64748B] dark:text-slate-300">
              {pendingItems.length === 0
                ? 'Select a GL code to enable budget line item creation.'
                : `${pendingItems.length} budget account${pendingItems.length > 1 ? 's' : ''} ready to add.`}
            </p>
            <div className="flex gap-3">
              <Button variant="outline" className="rounded-xl" onClick={() => onOpenChange(false)} disabled={creating}>
                Cancel
              </Button>
              <Button className="rounded-xl px-5" onClick={() => void handleCreate()} disabled={pendingItems.length === 0 || creating}>
                {creating ? 'Creating...' : 'Add Budget Account Codes'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
