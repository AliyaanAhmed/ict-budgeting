export function AppLoadingState() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8FBFF] px-6 dark:bg-[#0F172A]">
      <div className="flex flex-col items-center gap-4 rounded-[28px] border border-[#D9E6F5] bg-white px-8 py-10 shadow-[0_18px_40px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-[#162339]">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#DCE8F6] border-t-[#286CFF] dark:border-white/10 dark:border-t-[#BFDBFE]" />
        <div className="text-center">
          <p className="text-base font-semibold text-[#0F172A] dark:text-white">Preparing workspace</p>
          <p className="mt-1 text-sm text-[#64748B] dark:text-slate-300">
            Loading your role, cycle, and budgeting context.
          </p>
        </div>
      </div>
    </div>
  )
}
