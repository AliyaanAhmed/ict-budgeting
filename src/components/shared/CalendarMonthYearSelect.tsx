import { ChevronDown } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

type PickerMode = 'month' | 'year' | null

/** Compact calendar controls that keep month and year selection inside the date picker. */
export function CalendarMonthYearSelect({ month, onChange }: { month: Date; onChange: (date: Date) => void }) {
  const rootRef = useRef<HTMLDivElement>(null)
  const yearListRef = useRef<HTMLDivElement>(null)
  const [openPicker, setOpenPicker] = useState<PickerMode>(null)
  const year = month.getFullYear()
  const currentYear = new Date().getFullYear()
  const firstYear = Math.min(currentYear - 100, year - 50)
  const lastYear = Math.max(currentYear + 100, year + 50)

  useEffect(() => {
    if (!openPicker) return
    const close = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpenPicker(null)
    }
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [openPicker])

  useEffect(() => {
    if (openPicker !== 'year') return
    const yearList = yearListRef.current
    const selectedYear = yearList?.querySelector<HTMLElement>('[data-selected-year="true"]')
    if (!yearList || !selectedYear) return

    yearList.scrollTop = selectedYear.offsetTop - (yearList.clientHeight - selectedYear.offsetHeight) / 2
  }, [openPicker, year])

  const triggerClass = 'inline-flex h-8 items-center gap-1 rounded-lg border border-[#D7E4F4] bg-white px-2 text-xs font-semibold text-[#286CFF] transition-colors hover:border-[#93C5FD] hover:bg-[#EEF5FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#286CFF] dark:border-white/10 dark:bg-[#162339] dark:text-[#BFDBFE] dark:hover:bg-white/10'

  return (
    <div ref={rootRef} className="relative flex items-center gap-1">
      <button
        type="button"
        className={triggerClass}
        aria-label="Select calendar month"
        aria-haspopup="listbox"
        aria-expanded={openPicker === 'month'}
        onClick={() => setOpenPicker((current) => current === 'month' ? null : 'month')}
      >
        {MONTHS[month.getMonth()].slice(0, 3)} <ChevronDown className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        className={triggerClass}
        aria-label="Select calendar year"
        aria-haspopup="listbox"
        aria-expanded={openPicker === 'year'}
        onClick={() => setOpenPicker((current) => current === 'year' ? null : 'year')}
      >
        {year} <ChevronDown className="h-3.5 w-3.5" />
      </button>

      {openPicker ? (
        <div className="absolute left-1/2 top-[calc(100%+8px)] z-50 w-[276px] -translate-x-1/2 rounded-xl border border-[#D7E4F4] bg-white p-2 shadow-[0_14px_30px_rgba(15,23,42,0.14)] dark:border-white/10 dark:bg-[#162339]">
          {openPicker === 'month' ? (
            <div role="listbox" aria-label="Calendar months" className="grid grid-cols-3 gap-1">
              {MONTHS.map((name, index) => (
                <button
                  key={name}
                  type="button"
                  role="option"
                  aria-selected={index === month.getMonth()}
                  onClick={() => {
                    onChange(new Date(year, index, 1))
                    setOpenPicker(null)
                  }}
                  className={cn(
                    'rounded-lg px-2 py-2 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#286CFF]',
                    index === month.getMonth()
                      ? 'bg-[#286CFF] text-white'
                      : 'text-[#475569] hover:bg-[#EEF5FF] hover:text-[#286CFF] dark:text-slate-200 dark:hover:bg-white/10'
                  )}
                >
                  {name.slice(0, 3)}
                </button>
              ))}
            </div>
          ) : (
            <div ref={yearListRef} role="listbox" aria-label="Calendar years" className="grid max-h-52 grid-cols-4 gap-1 overflow-y-auto pr-1 [scrollbar-width:thin]">
              {Array.from({ length: lastYear - firstYear + 1 }, (_, index) => firstYear + index).map((optionYear) => (
                <button
                  key={optionYear}
                  type="button"
                  role="option"
                  aria-selected={optionYear === year}
                  data-selected-year={optionYear === year ? 'true' : undefined}
                  onClick={() => {
                    onChange(new Date(optionYear, month.getMonth(), 1))
                    setOpenPicker(null)
                  }}
                  className={cn(
                    'rounded-lg px-1.5 py-2 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#286CFF]',
                    optionYear === year
                      ? 'bg-[#286CFF] text-white'
                      : 'text-[#475569] hover:bg-[#EEF5FF] hover:text-[#286CFF] dark:text-slate-200 dark:hover:bg-white/10'
                  )}
                >
                  {optionYear}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}
