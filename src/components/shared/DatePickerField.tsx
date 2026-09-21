import { useEffect, useRef, useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
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
import { cn } from '@/lib/utils'

interface DatePickerFieldProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  invalid?: boolean
  minDate?: string
  id?: string
  label?: string
  required?: boolean
  disabled?: boolean
  className?: string
}

export function DatePickerField({
  value,
  onChange,
  placeholder = 'Pick a date',
  invalid,
  minDate,
  id,
  label,
  required = false,
  disabled = false,
  className,
}: DatePickerFieldProps) {
  const pickerRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [viewMonth, setViewMonth] = useState(() => (value ? new Date(`${value}T00:00:00`) : new Date()))

  const selectedDate = value ? new Date(`${value}T00:00:00`) : null
  const minimumDate = minDate ? new Date(`${minDate}T00:00:00`) : null
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

  useEffect(() => {
    if (!open || !minimumDate) return
    const currentAnchor = selectedDate ?? viewMonth
    if (currentAnchor < startOfMonth(minimumDate)) {
      setViewMonth(minimumDate)
    }
  }, [minimumDate, open, selectedDate, viewMonth])

  const selectDate = (date: Date) => {
    if (disabled || (minimumDate && date < minimumDate)) return
    onChange(format(date, 'yyyy-MM-dd'))
    setViewMonth(date)
    setOpen(false)
  }

  return (
    <div className={cn('space-y-2', className)}>
      {label ? (
        <label className="text-sm font-semibold text-[#0F172A] dark:text-white" htmlFor={id}>
          {label} {required ? <span className="text-[#EA4F49]">*</span> : null}
        </label>
      ) : null}
      <div ref={pickerRef} className="relative">
        <button
          id={id}
          type="button"
          onClick={() => !disabled && setOpen((current) => !current)}
          aria-haspopup="dialog"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            'inline-flex h-12 w-full shrink-0 items-center justify-start gap-2 whitespace-nowrap rounded-xl border bg-white px-4 py-2 text-left text-sm font-normal outline-none transition-colors duration-150 hover:border-[#043DFF] hover:bg-[#E7F5FF] hover:text-[#043DFF] active:bg-[#D3EDFF] focus-visible:ring-2 focus-visible:ring-[#286CFF] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-[#1E293B] dark:text-white dark:hover:bg-white/5',
            invalid ? 'border-[#F04438]' : 'border-slate-200',
            selectedDate ? 'text-[#0F172A] dark:text-white' : 'text-[#64748B]'
          )}
        >
          <CalendarDays className="mr-2 h-4 w-4 shrink-0 text-[#0F172A] dark:text-white" />
          <span>{formattedValue}</span>
        </button>

        {open ? (
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
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-transparent p-0 text-[#286CFF] outline-none transition-colors hover:bg-[#E7F5FF] active:bg-[#D3EDFF] focus-visible:ring-2 focus-visible:ring-[#286CFF] focus-visible:ring-offset-2"
                    aria-label="Go to the previous month"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMonth((month) => addMonths(month, 1))}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-transparent p-0 text-[#286CFF] outline-none transition-colors hover:bg-[#E7F5FF] active:bg-[#D3EDFF] focus-visible:ring-2 focus-visible:ring-[#286CFF] focus-visible:ring-offset-2"
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
                    const disabledDate = Boolean(minimumDate && date < minimumDate)

                    return (
                      <button
                        key={date.toISOString()}
                        type="button"
                        disabled={disabledDate}
                        onClick={() => selectDate(date)}
                        className={cn(
                          'flex h-8 w-8 items-center justify-center rounded-lg p-2 text-sm font-normal leading-none text-[#286CFF] outline-none transition-colors hover:bg-[#E7F5FF] active:bg-[#D3EDFF] focus-visible:ring-2 focus-visible:ring-[#286CFF] focus-visible:ring-offset-2 dark:hover:bg-white/10',
                          !currentMonth && 'text-[#94A3B8]',
                          disabledDate && 'cursor-not-allowed text-[#CBD5E1] hover:bg-transparent dark:text-slate-600',
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
        ) : null}
      </div>
    </div>
  )
}
