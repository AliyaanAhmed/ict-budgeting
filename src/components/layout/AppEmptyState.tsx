import type { ReactNode } from 'react'
import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarRange,
  CheckCircle2,
  Orbit,
  ShieldAlert,
  Sparkles,
} from 'lucide-react'

type EmptyStateVariant = 'role' | 'cycle'

interface AppEmptyStateProps {
  variant: EmptyStateVariant
  title: string
  description: string
  supportingText?: string
  primaryAction?: {
    label: string
    onClick: () => void
  }
  secondaryAction?: {
    label: string
    onClick: () => void
  }
}

const variantContent: Record<
  EmptyStateVariant,
  {
    icon: ReactNode
    accent: string
    chip: string
    orb: string
    grid: string
    iconWrap: string
    accentSoft: string
  }
> = {
  role: {
    icon: <ShieldAlert className="h-7 w-7" aria-hidden="true" />,
    accent: 'text-[#286CFF]',
    chip: 'Access Required',
    orb: 'from-[#286CFF]/18 via-[#4F98FF]/12 to-transparent',
    grid: 'border-[#D8E7FF]',
    iconWrap: 'bg-[linear-gradient(135deg,#286CFF_0%,#4F98FF_100%)]',
    accentSoft: 'bg-[#EEF5FF] text-[#286CFF]',
  },
  cycle: {
    icon: <CalendarRange className="h-7 w-7" aria-hidden="true" />,
    accent: 'text-[#0C65F5]',
    chip: 'Cycle Setup',
    orb: 'from-[#7C3AED]/18 via-[#286CFF]/10 to-transparent',
    grid: 'border-[#E2D7FF]',
    iconWrap: 'bg-[linear-gradient(135deg,#7C3AED_0%,#286CFF_100%)]',
    accentSoft: 'bg-[#F5EEFF] text-[#7C3AED]',
  },
}

export function AppEmptyState({
  variant,
  title,
  description,
  supportingText,
  primaryAction,
  secondaryAction,
}: AppEmptyStateProps) {
  const content = variantContent[variant]

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,#F8FBFF_0%,#EEF5FF_35%,#F8FAFC_100%)] px-6 py-10 dark:bg-[radial-gradient(circle_at_top,#1A2440_0%,#0F172A_45%,#0B1120_100%)]">
      <div
        className={`absolute left-1/2 top-1/2 h-[34rem] w-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br ${content.orb} blur-3xl animate-pulse`}
        aria-hidden="true"
      />
      <div
        className="absolute left-[8%] top-[14%] h-40 w-40 rounded-full border border-white/50 bg-white/25 blur-sm dark:border-white/10 dark:bg-white/5"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-[10%] right-[9%] h-52 w-52 rounded-full border border-white/40 bg-white/20 blur-sm dark:border-white/10 dark:bg-white/5"
        aria-hidden="true"
      />
      <div className="absolute inset-0 opacity-50 dark:opacity-30" aria-hidden="true">
        <div className="absolute inset-x-0 top-[12%] h-px bg-[linear-gradient(90deg,transparent,rgba(40,108,255,0.18),transparent)]" />
        <div className="absolute inset-x-0 bottom-[18%] h-px bg-[linear-gradient(90deg,transparent,rgba(124,58,237,0.14),transparent)]" />
        <div className="absolute left-[14%] top-[24%] h-20 w-20 rounded-full border border-[#DCE8F6] bg-white/40 animate-pulse dark:border-white/10 dark:bg-white/5" />
        <div className="absolute right-[12%] top-[18%] h-28 w-28 rounded-full border border-[#E7D9FF] bg-white/30 animate-pulse dark:border-white/10 dark:bg-white/5" />
        <div className="absolute left-[20%] top-[18%] h-3 w-3 rounded-full bg-[#286CFF]/30 animate-bounce" />
        <div className="absolute right-[24%] top-[30%] h-3 w-3 rounded-full bg-[#7C3AED]/30 animate-bounce [animation-delay:300ms]" />
        <div className="absolute bottom-[22%] left-[28%] h-2.5 w-2.5 rounded-full bg-[#10B981]/30 animate-bounce [animation-delay:600ms]" />
        <div className={`absolute inset-8`} />
      </div>

      <div className="relative z-10 w-full max-w-4xl">
        <div className="mx-auto overflow-hidden rounded-[32px] border border-[#D9E6F5] bg-white/90 shadow-[0_24px_60px_rgba(15,23,42,0.10)] backdrop-blur-xl transition-transform duration-300 hover:-translate-y-0.5 hover:shadow-[0_30px_70px_rgba(15,23,42,0.14)] dark:border-white/10 dark:bg-[#162339]/92">
          <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="border-b border-[#EEF3F8] px-8 py-10 lg:border-b-0 lg:border-r dark:border-white/10">
              <div className="inline-flex items-center gap-3 rounded-full border border-[#E6EEFF] bg-white px-3 py-2 pr-5 text-sm font-semibold text-[#286CFF] shadow-[0_10px_24px_rgba(40,108,255,0.08)] dark:border-white/10 dark:bg-white/5 dark:text-[#BFDBFE]">
                <div className={`relative flex h-12 w-12 items-center justify-center rounded-full ${content.iconWrap} text-white shadow-[0_14px_28px_rgba(40,108,255,0.18)]`}>
                  {content.icon}
                  <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border border-white bg-white text-[#286CFF] shadow-[0_8px_16px_rgba(15,23,42,0.08)] dark:border-[#162339] dark:bg-[#0F172A] dark:text-[#BFDBFE]">
                    <Sparkles className="h-3 w-3" aria-hidden="true" />
                  </div>
                </div>
                <span>{content.chip}</span>
              </div>

              <div className="mt-7 max-w-2xl">
                <h1 className="text-[32px] font-semibold leading-tight text-[#0F172A] dark:text-white">
                  {title}
                </h1>
                <p className="mt-4 text-base leading-7 text-[#475569] dark:text-slate-200">
                  {description}
                </p>
                {supportingText ? (
                  <p className="mt-4 text-sm leading-6 text-[#64748B] dark:text-slate-300">
                    {supportingText}
                  </p>
                ) : null}
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                <div className="rounded-[22px] border border-[#E4EEFB] bg-[linear-gradient(180deg,#FFFFFF_0%,#F8FBFF_100%)] p-4 dark:border-white/10 dark:bg-white/5">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${content.accentSoft}`}>
                    <Orbit className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <p className="mt-4 text-xs font-semibold tracking-[0.08em] text-[#64748B] dark:text-slate-300">
                    Workspace state
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[#0F172A] dark:text-white">
                    {variant === 'role' ? 'Awaiting role mapping' : 'Awaiting cycle activation'}
                  </p>
                </div>
                <div className="rounded-[22px] border border-[#E4EEFB] bg-[linear-gradient(180deg,#FFFFFF_0%,#F8FBFF_100%)] p-4 dark:border-white/10 dark:bg-white/5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#ECFDF3] text-[#16794B] dark:bg-[#16794B]/15 dark:text-[#86EFAC]">
                    <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <p className="mt-4 text-xs font-semibold tracking-[0.08em] text-[#64748B] dark:text-slate-300">
                    User session
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[#0F172A] dark:text-white">
                    Authenticated successfully
                  </p>
                </div>
                <div className="rounded-[22px] border border-[#E4EEFB] bg-[linear-gradient(180deg,#FFFFFF_0%,#F8FBFF_100%)] p-4 dark:border-white/10 dark:bg-white/5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#FFF7E6] text-[#D97706] dark:bg-[#D97706]/15 dark:text-[#FCD34D]">
                    <BriefcaseBusiness className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <p className="mt-4 text-xs font-semibold tracking-[0.08em] text-[#64748B] dark:text-slate-300">
                    Next action
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[#0F172A] dark:text-white">
                    {variant === 'role' ? 'Role assignment required' : 'Cycle setup required'}
                  </p>
                </div>
              </div>

              {(primaryAction || secondaryAction) ? (
                <div className="mt-8 flex flex-wrap items-center gap-3">
                  {primaryAction ? (
                    <button
                      type="button"
                      onClick={primaryAction.onClick}
                      className="inline-flex items-center justify-center gap-2 rounded-[18px] bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_26px_rgba(40,108,255,0.18)] transition-colors hover:bg-[var(--primary-hover)]"
                    >
                      <BriefcaseBusiness className="h-4.5 w-4.5" aria-hidden="true" />
                      <span>{primaryAction.label}</span>
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </button>
                  ) : null}
                  {secondaryAction ? (
                    <button
                      type="button"
                      onClick={secondaryAction.onClick}
                      className="inline-flex items-center justify-center rounded-[18px] border border-[#D7E4F4] bg-white px-5 py-3 text-sm font-semibold text-[#286CFF] transition-colors hover:bg-[#F8FBFF] dark:border-white/10 dark:bg-white/5 dark:text-[#BFDBFE] dark:hover:bg-white/10"
                    >
                      {secondaryAction.label}
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className="flex flex-col justify-center px-8 py-10">
              <div className="rounded-[26px] border border-[#E4EEFB] bg-[linear-gradient(180deg,#FBFDFF_0%,#F4F8FD_100%)] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.04)_0%,rgba(255,255,255,0.02)_100%)]">
                <div className="flex items-center gap-3">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${content.iconWrap} text-white`}>
                    <Sparkles className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#0F172A] dark:text-white">
                      Workspace status
                    </p>
                    <p className="text-xs text-[#64748B] dark:text-slate-300">
                      Governance readiness overview
                    </p>
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  <div className="rounded-[20px] border border-[#E8F0FB] bg-white/80 p-4 transition-transform duration-300 hover:-translate-y-0.5 dark:border-white/10 dark:bg-white/5">
                    <p className="text-xs font-semibold tracking-[0.08em] text-[#64748B] dark:text-slate-300">
                      Access
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[#334155] dark:text-slate-200">
                      {variant === 'role'
                        ? 'Your account is signed in, but no budgeting role is currently mapped for this workspace.'
                        : 'Your access is ready, but there is no active budgeting cycle available to open right now.'}
                    </p>
                  </div>

                  <div className="rounded-[20px] border border-[#E8F0FB] bg-white/80 p-4 transition-transform duration-300 hover:-translate-y-0.5 dark:border-white/10 dark:bg-white/5">
                    <p className="text-xs font-semibold tracking-[0.08em] text-[#64748B] dark:text-slate-300">
                      Next step
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[#334155] dark:text-slate-200">
                      {variant === 'role'
                        ? 'Ask the platform administrator to assign the correct ADGE or DGE role so your dashboard and queues can be unlocked.'
                        : 'Once a cycle is created or reopened, the full workspace will become available automatically for your role.'}
                    </p>
                  </div>
                </div>

                <div className="mt-6 overflow-hidden rounded-[20px] border border-[#E8F0FB] bg-white/75 dark:border-white/10 dark:bg-white/5">
                  <div className="h-1.5 w-full bg-[linear-gradient(90deg,#286CFF_0%,#7C3AED_55%,#10B981_100%)]" />
                  <div className="p-4">
                    <p className="text-xs font-semibold tracking-[0.08em] text-[#64748B] dark:text-slate-300">
                      Environment note
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[#334155] dark:text-slate-200">
                      The workspace is responsive and ready. As soon as the missing governance prerequisite is available, the application will continue with the normal role and cycle experience.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
