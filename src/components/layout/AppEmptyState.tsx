import { ArrowRight, CalendarRange, ShieldAlert, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AppEmptyStateProps {
  icon: 'role' | 'cycle'
  title: string
  description: string
  hint?: string
  primaryActionLabel?: string
  onPrimaryAction?: () => void
}

export function AppEmptyState({
  icon,
  title,
  description,
  hint,
  primaryActionLabel,
  onPrimaryAction,
}: AppEmptyStateProps) {
  const MainIcon = icon === 'role' ? ShieldAlert : CalendarRange

  const highlights =
    icon === 'role'
      ? [
          'Your account is not mapped to any ADGE, DGE, or ICT Admin workspace yet.',
          'The platform cannot decide which dashboards, queues, or project actions should be available.',
          'Once role mapping is assigned, the correct workspace will appear automatically on next load.',
        ]
      : [
          'No active ICT budgeting cycle is available for this environment.',
          'Dashboards, queues, entity trackers, and review workspaces all depend on a selected cycle.',
          'As soon as a cycle is created or activated, the platform will restore the full journey automatically.',
        ]

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#F4F8FC] dark:bg-[#0F172A]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(40,108,255,0.14),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.10),transparent_28%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(79,152,255,0.18),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.12),transparent_30%)]" />
      <div className="absolute -left-16 top-16 h-64 w-64 animate-pulse rounded-full bg-[#DCEBFF] opacity-60 blur-3xl dark:bg-[#1D4ED8]/18" />
      <div className="absolute right-[-3rem] top-1/3 h-72 w-72 animate-pulse rounded-full bg-[#E7F5FF] opacity-70 blur-3xl [animation-delay:900ms] dark:bg-[#0EA5E9]/12" />
      <div className="absolute bottom-[-4rem] left-1/3 h-80 w-80 animate-pulse rounded-full bg-white/70 opacity-80 blur-3xl [animation-delay:1600ms] dark:bg-white/5" />

      <div className="relative flex min-h-screen items-center justify-center px-6 py-12">
        <div className="w-full max-w-6xl">
          <section className="overflow-hidden rounded-[36px] border border-[#D9E6F5] bg-white/90 shadow-[0_28px_80px_rgba(15,23,42,0.10)] backdrop-blur-sm dark:border-white/10 dark:bg-[#162339]/92">
            <div className="grid gap-0 xl:grid-cols-[1.1fr_0.9fr]">
              <div className="relative overflow-hidden px-8 py-10 sm:px-12 sm:py-14">
                <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(248,251,255,0.95)_0%,rgba(238,245,255,0.88)_100%)] dark:bg-[linear-gradient(135deg,rgba(22,35,57,0.95)_0%,rgba(15,23,42,0.92)_100%)]" />
                <div className="absolute right-0 top-0 h-56 w-56 translate-x-10 -translate-y-10 rounded-full border border-[#DCE8F6] opacity-60 dark:border-white/10" />
                <div className="absolute bottom-0 left-0 h-40 w-40 -translate-x-10 translate-y-10 rounded-full border border-[#DCE8F6] opacity-50 dark:border-white/10" />

                <div className="relative">
                  <div className="flex items-start gap-4">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[22px] bg-[#286CFF] text-white shadow-[0_18px_36px_rgba(40,108,255,0.24)]">
                      <MainIcon className="h-8 w-8" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center rounded-full border border-[#D8E7FF] bg-white px-3 py-1 text-xs font-semibold text-[#286CFF] dark:border-white/10 dark:bg-white/5 dark:text-[#BFDBFE]">
                          Governance Platform
                        </span>
                        <span className="inline-flex items-center rounded-full bg-[#EEF5FF] px-3 py-1 text-xs font-semibold text-[#475569] dark:bg-white/5 dark:text-slate-200">
                          Access Check
                        </span>
                      </div>
                      <h1 className="mt-4 text-3xl font-bold tracking-tight text-[#0F172A] dark:text-white sm:text-4xl">
                        {title}
                      </h1>
                      <p className="mt-4 max-w-2xl text-sm leading-7 text-[#475569] dark:text-slate-200 sm:text-[15px]">
                        {description}
                      </p>
                    </div>
                  </div>

                  <div className="mt-10 grid gap-4 sm:grid-cols-3">
                    {highlights.map((item, index) => (
                      <div
                        key={item}
                        className="rounded-[24px] border border-[#DCE8F6] bg-white/85 p-5 shadow-[0_10px_24px_rgba(15,23,42,0.04)] transition-transform duration-300 hover:-translate-y-0.5 dark:border-white/10 dark:bg-white/5"
                        style={{ animationDelay: `${index * 140}ms` }}
                      >
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-4.5 w-4.5 text-[#286CFF] dark:text-[#93C5FD]" />
                          <span className="text-sm font-semibold text-[#0F172A] dark:text-white">Platform Signal</span>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-[#475569] dark:text-slate-300">{item}</p>
                      </div>
                    ))}
                  </div>

                  {(hint || primaryActionLabel) && (
                    <div className="mt-10 flex flex-col gap-4 rounded-[24px] border border-[#DCE8F6] bg-white/80 p-5 shadow-[0_10px_24px_rgba(15,23,42,0.04)] dark:border-white/10 dark:bg-white/5 sm:flex-row sm:items-center sm:justify-between">
                      <p className="max-w-2xl text-sm leading-6 text-[#475569] dark:text-slate-200">{hint}</p>
                      {primaryActionLabel && onPrimaryAction && (
                        <Button
                          type="button"
                          onClick={onPrimaryAction}
                          className="h-11 rounded-[16px] bg-[#286CFF] px-5 text-sm font-semibold text-white shadow-none hover:bg-[#0C65F5]"
                        >
                          {primaryActionLabel}
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="relative border-t border-[#EAF0F6] bg-[linear-gradient(180deg,#FFFFFF_0%,#F8FBFF_100%)] px-8 py-10 dark:border-white/10 dark:bg-[linear-gradient(180deg,#162339_0%,#101B2E_100%)] xl:border-l xl:border-t-0">
                <div className="absolute inset-0 opacity-70 [background-image:linear-gradient(rgba(40,108,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(40,108,255,0.05)_1px,transparent_1px)] [background-size:26px_26px] dark:[background-image:linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)]" />
                <div className="relative flex h-full flex-col justify-center">
                  <div className="rounded-[30px] border border-[#DCE8F6] bg-white/92 p-7 shadow-[0_18px_40px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-white/5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#EEF5FF] text-[#286CFF] dark:bg-[#286CFF]/15 dark:text-[#BFDBFE]">
                        <MainIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-[#0F172A] dark:text-white">
                          {icon === 'role' ? 'Workspace Access Status' : 'Cycle Readiness Status'}
                        </h2>
                        <p className="text-sm text-[#64748B] dark:text-slate-300">
                          {icon === 'role'
                            ? 'User access is still awaiting configuration.'
                            : 'Workspace is waiting for cycle activation.'}
                        </p>
                      </div>
                    </div>

                    <div className="mt-8 space-y-5">
                      {[
                        {
                          title: icon === 'role' ? 'Identity resolved' : 'Role access resolved',
                          state: 'Complete',
                          tone: 'bg-[#EAF7EE] text-[#16A34A] dark:bg-[#16A34A]/15 dark:text-[#86EFAC]',
                        },
                        {
                          title: icon === 'role' ? 'Role mapping available' : 'Cycle available',
                          state: 'Pending',
                          tone: 'bg-[#FFF7E6] text-[#D97706] dark:bg-[#D97706]/15 dark:text-[#FCD34D]',
                        },
                        {
                          title: icon === 'role' ? 'Workspace activation' : 'Dashboard activation',
                          state: 'Waiting',
                          tone: 'bg-[#EEF5FF] text-[#286CFF] dark:bg-[#286CFF]/15 dark:text-[#BFDBFE]',
                        },
                      ].map((item) => (
                        <div key={item.title} className="flex items-center justify-between gap-4 rounded-[20px] border border-[#EAF0F6] bg-[#F8FBFF] px-4 py-4 dark:border-white/10 dark:bg-[#0F172A]/30">
                          <div>
                            <p className="text-sm font-semibold text-[#0F172A] dark:text-white">{item.title}</p>
                            <p className="mt-1 text-xs text-[#64748B] dark:text-slate-300">
                              {icon === 'role'
                                ? 'The platform is waiting for role-based access to be assigned.'
                                : 'The platform is waiting for a budgeting cycle before it can load workspaces.'}
                            </p>
                          </div>
                          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${item.tone}`}>
                            {item.state}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
