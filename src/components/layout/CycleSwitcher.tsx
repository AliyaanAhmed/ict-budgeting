import { useState, useRef, useEffect } from 'react'
import {
  ChevronDown,
  CalendarDays,
  ShieldCheck,
  Check,
  Clock,
  History,
  RefreshCw,
  Calendar,
} from 'lucide-react'
import { useCycle } from '@/context/CycleContext'
import type { AppCycle, CyclesSessionData } from '@/services/cycleService'
import { cn } from '@/lib/utils'

function formatDateFull(dateStr: string): string {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatDateShort(dateStr: string): string {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  })
}

function getCycleTag(cycle: AppCycle, data: CyclesSessionData): 'current' | 'previous' | null {
  if (data.currentCycle?.id === cycle.id) return 'current'
  if (data.previousCycle?.id === cycle.id) return 'previous'
  return null
}

export function CycleSwitcher() {
  const { cyclesData, selectedCycle, setSelectedCycle } = useCycle()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const hasCycles = !!(cyclesData && cyclesData.allCycles.length > 0)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  function handleSelect(cycle: AppCycle) {
    setSelectedCycle(cycle)
    setIsOpen(false)
  }

  const cycleName = selectedCycle?.name ?? 'FY2026 Governance Cycle'
  const cycleStart = selectedCycle?.startDate ?? ''
  const cycleEnd = selectedCycle?.endDate ?? ''

  return (
    <div ref={dropdownRef} className="relative">
      {/* Desktop trigger */}
      <button
        onClick={() => hasCycles && setIsOpen(v => !v)}
        className={cn(
          'hidden lg:flex items-center gap-2 rounded-full border px-3 py-1.5 min-w-0 transition-all duration-200',
          hasCycles
            ? 'border-[var(--border)] bg-[var(--muted)] hover:border-[#286CFF]/40 hover:bg-[#E7F5FF] dark:hover:bg-[#286CFF]/10 cursor-pointer'
            : 'border-[var(--border)] bg-[var(--muted)] cursor-default'
        )}
      >
        <ShieldCheck
          className={cn(
            'h-4 w-4 shrink-0 transition-colors duration-150',
            isOpen ? 'text-[#286CFF]' : 'text-[var(--primary)]'
          )}
        />
        <span
          className={cn(
            'text-xs font-semibold tracking-wide uppercase whitespace-nowrap transition-colors duration-150',
            isOpen ? 'text-[#286CFF]' : 'text-[var(--muted-foreground)]'
          )}
        >
          {cycleName}
        </span>
        {selectedCycle && cycleStart && cycleEnd && (
          <>
            <span className="text-[var(--border-strong)]">|</span>
            <CalendarDays className="h-4 w-4 text-[var(--muted-foreground)] shrink-0" />
            <span className="text-xs text-[var(--muted-foreground)] whitespace-nowrap">
              {formatDateShort(cycleStart)} – {formatDateShort(cycleEnd)}
            </span>
          </>
        )}
        {hasCycles && (
          <ChevronDown
            className={cn(
              'h-3.5 w-3.5 text-[#94A3B8] transition-transform duration-200 shrink-0',
              isOpen && 'rotate-180'
            )}
          />
        )}
      </button>

      {/* Mobile / tablet compact trigger */}
      <button
        onClick={() => hasCycles && setIsOpen(v => !v)}
        className={cn(
          'hidden sm:flex lg:hidden items-center gap-2 rounded-full border px-3 py-1.5 transition-all duration-200',
          hasCycles
            ? 'border-[var(--border)] bg-[var(--muted)] hover:border-[#286CFF]/40 hover:bg-[#E7F5FF] dark:hover:bg-[#286CFF]/10 cursor-pointer'
            : 'border-[var(--border)] bg-[var(--muted)] cursor-default'
        )}
      >
        <ShieldCheck
          className={cn(
            'h-4 w-4 shrink-0 transition-colors',
            isOpen ? 'text-[#286CFF]' : 'text-[var(--primary)]'
          )}
        />
        <span className="text-xs font-semibold text-[var(--muted-foreground)] truncate max-w-[120px]">
          {selectedCycle?.name ?? 'FY2026'}
        </span>
        {hasCycles && (
          <ChevronDown
            className={cn(
              'h-3 w-3 text-[#94A3B8] transition-transform duration-200 shrink-0',
              isOpen && 'rotate-180'
            )}
          />
        )}
      </button>

      {/* Dropdown panel */}
      <div
        className={cn(
          'absolute left-0 top-[calc(100%+8px)] z-50 min-w-[340px] transition-all duration-200 origin-top-left',
          isOpen
            ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 scale-95 -translate-y-1 pointer-events-none'
        )}
      >
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[0_20px_60px_rgba(15,23,42,0.14)] overflow-hidden">
          {/* Panel header */}
          <div className="px-4 pt-4 pb-3 border-b border-[var(--border)] bg-gradient-to-r from-[#F8FBFF] to-white dark:from-[#0f172a] dark:to-[#1e293b]">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#286CFF] to-[#4F98FF] shadow-sm">
                <Calendar className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--foreground)]">Switch Cycle</p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  {cyclesData
                    ? `${cyclesData.allCycles.length} cycle${cyclesData.allCycles.length !== 1 ? 's' : ''} available`
                    : 'Loading cycles...'}
                </p>
              </div>
              <RefreshCw className="h-3.5 w-3.5 text-[var(--muted-foreground)] ml-auto opacity-50" />
            </div>
          </div>

          {/* Cycle list */}
          <div className="p-2 flex flex-col gap-1 max-h-[380px] overflow-y-auto">
            {cyclesData?.allCycles.map(cycle => {
              const tag = getCycleTag(cycle, cyclesData)
              const isSelected = selectedCycle?.id === cycle.id

              return (
                <button
                  key={cycle.id}
                  onClick={() => handleSelect(cycle)}
                  className={cn(
                    'w-full text-left rounded-xl px-3 py-2.5 border transition-all duration-150 group/item',
                    isSelected
                      ? 'bg-[#E7F5FF] border-[#B0DBFF] dark:bg-[#286CFF]/15 dark:border-[#4F98FF]/30'
                      : 'bg-transparent border-transparent hover:bg-[#F8FBFF] hover:border-[#DDEBFF] dark:hover:bg-slate-800/60 dark:hover:border-slate-700'
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    {/* Left: icon + info */}
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div
                        className={cn(
                          'mt-0.5 flex h-7 w-7 items-center justify-center rounded-lg shrink-0 transition-all duration-150',
                          isSelected
                            ? 'bg-gradient-to-br from-[#286CFF] to-[#4F98FF] shadow-sm'
                            : 'bg-[var(--muted)] border border-[var(--border)] group-hover/item:border-[#B0DBFF]'
                        )}
                      >
                        {isSelected ? (
                          <Check className="h-3.5 w-3.5 text-white" />
                        ) : (
                          <Clock className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />
                        )}
                      </div>
                      <div className="min-w-0 pt-0.5">
                        <p
                          className={cn(
                            'text-sm font-semibold leading-tight truncate transition-colors',
                            isSelected
                              ? 'text-[#286CFF] dark:text-white'
                              : 'text-[var(--foreground)]'
                          )}
                        >
                          {cycle.name}
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          <CalendarDays className="h-3 w-3 text-[var(--muted-foreground)] shrink-0" />
                          <p className="text-xs text-[var(--muted-foreground)]">
                            {formatDateFull(cycle.startDate)} – {formatDateFull(cycle.endDate)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Right: tags */}
                    <div className="flex flex-col items-end gap-1.5 shrink-0 pt-0.5">
                      {tag === 'current' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#E7F5FF] border border-[#B0DBFF] dark:bg-[#286CFF]/20 dark:border-[#4F98FF]/40 text-[10px] font-semibold text-[#286CFF]">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#286CFF] inline-block animate-pulse" />
                          Current
                        </span>
                      )}
                      {tag === 'previous' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--muted)] border border-[var(--border)] text-[10px] font-semibold text-[var(--muted-foreground)]">
                          <History className="h-2.5 w-2.5" />
                          Previous
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Footer hint */}
          <div className="px-4 py-2.5 border-t border-[var(--border)] bg-[var(--muted)]/40">
            <p className="text-[11px] text-[var(--muted-foreground)] text-center">
              Selecting a cycle filters your budget data accordingly
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
