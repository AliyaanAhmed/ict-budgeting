export function CalendarYearSelect({ month, onChange }: { month: Date; onChange: (date: Date) => void }) {
  const year = month.getFullYear()
  const currentYear = new Date().getFullYear()
  const firstYear = Math.min(currentYear - 100, year)
  const lastYear = Math.max(currentYear + 100, year)
  return (
    <select
      aria-label="Select calendar year"
      value={year}
      onChange={(event) => onChange(new Date(Number(event.target.value), month.getMonth(), 1))}
      className="h-8 cursor-pointer rounded-md border border-[#D7E4F4] bg-white px-1 text-sm font-medium text-[#286CFF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#286CFF] dark:border-white/10 dark:bg-[#1E293B] dark:text-white"
    >
      {Array.from({ length: lastYear - firstYear + 1 }, (_, index) => firstYear + index).map((value) => <option key={value} value={value}>{value}</option>)}
    </select>
  )
}
