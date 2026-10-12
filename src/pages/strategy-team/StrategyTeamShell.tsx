import type { ReactNode } from 'react'
import { ArrowRight, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

export function StrategyPageShell({
  title,
  description,
  eyebrow,
  actions,
  children,
}: {
  title?: string
  description?: string
  eyebrow?: string
  actions?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="space-y-6 pb-4">
      {title ? (
        <section className="space-y-2 px-2">
          {eyebrow ? <p className="text-xs font-semibold tracking-[0.18em] text-[#64748B]">{eyebrow}</p> : null}
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <h1 className="text-3xl font-bold tracking-tight text-[#0F172A] dark:text-white sm:text-[34px]">
                {title}
              </h1>
              {description ? <p className="mt-2 text-sm leading-6 text-[#475569] dark:text-slate-100">{description}</p> : null}
            </div>
            {actions ? <div className="flex shrink-0 gap-2">{actions}</div> : null}
          </div>
        </section>
      ) : null}

      {children}
    </div>
  )
}

export function StrategyMetricCard({
  title,
  value,
  note,
  accent,
  icon,
}: {
  title: string
  value: ReactNode
  note: string
  accent: string
  icon: ReactNode
}) {
  return (
    <div className="overflow-hidden rounded-[20px] border border-[#DCE8F6] bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#286CFF] hover:shadow-[0_16px_36px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-[#18263F] sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-base font-semibold tracking-[0.02em] text-[#0F172A] dark:text-white">{title}</p>
          <div className="mt-4 text-2xl font-bold leading-none text-[#0F172A] dark:text-white sm:text-[30px]">
            {value}
          </div>
        </div>
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: `${accent}14`, color: accent }}
        >
          {icon}
        </div>
      </div>
      <p className="mt-4 text-xs leading-5 text-[#64748B] dark:text-slate-300">{note}</p>
    </div>
  )
}

export function StrategySectionCard({
  title,
  description,
  children,
  className,
  rightAction,
  headingIcon,
}: {
  title: string
  description?: string
  children: ReactNode
  className?: string
  rightAction?: ReactNode
  headingIcon?: ReactNode
}) {
  return (
    <section className={cn('flex h-full flex-col overflow-hidden rounded-[22px] border border-[#D9E6F5] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#162339]', className)}>
      <div className="flex items-start justify-between gap-4 border-b border-[#EEF3F8] px-5 py-4 dark:border-white/10">
        <div>
          <div className="flex items-center gap-2">
            {headingIcon}
            <h2 className="text-xl font-bold text-[#0F172A] dark:text-white">{title}</h2>
          </div>
          {description ? <p className="mt-1 text-sm leading-6 text-[#64748B] dark:text-slate-300">{description}</p> : null}
        </div>
        {rightAction ? <div>{rightAction}</div> : null}
      </div>
      <div className="flex flex-1 flex-col p-5">{children}</div>
    </section>
  )
}

export function StrategyPill({
  children,
  tone = 'blue',
  className,
}: {
  children: ReactNode
  tone?: 'blue' | 'teal' | 'violet' | 'amber'
  className?: string
}) {
  const styles = {
    blue: 'bg-[#EEF5FF] text-[#286CFF] dark:bg-[#286CFF]/15 dark:text-[#BFDBFE]',
    teal: 'bg-[#ECFEFF] text-[#0F9D8A] dark:bg-[#0F9D8A]/15 dark:text-[#99F6E4]',
    violet: 'bg-[#F5EEFF] text-[#9333EA] dark:bg-[#9333EA]/15 dark:text-[#E9D5FF]',
    amber: 'bg-[#FFF7E6] text-[#D97706] dark:bg-[#D97706]/15 dark:text-[#FCD34D]',
  }[tone]

  return <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold', styles, className)}>{children}</span>
}

export function StrategyProgressBar({ value, accent }: { value: number; accent: string }) {
  return (
    <div className="h-2.5 overflow-hidden rounded-full bg-[#EEF3F8] dark:bg-white/10">
      <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${value}%`, backgroundColor: accent }} />
    </div>
  )
}

export function StrategyDashboardEmptyState({
  icon,
  title,
  description,
}: {
  icon: ReactNode
  title: string
  description: string
}) {
  return (
    <div className="relative flex min-h-[210px] flex-col items-center justify-center overflow-hidden rounded-[22px] border border-dashed border-[#CFE0F5] bg-[radial-gradient(circle_at_50%_0%,#EEF5FF_0%,#FFFFFF_58%)] px-6 py-10 text-center dark:border-white/10 dark:bg-[radial-gradient(circle_at_50%_0%,rgba(40,108,255,0.18)_0%,rgba(22,35,57,0.92)_62%)]">
      <div className="pointer-events-none absolute -top-16 h-40 w-40 animate-pulse rounded-full border border-[#BFD8FF]/70 dark:border-[#286CFF]/20" />
      <div className="pointer-events-none absolute -bottom-20 h-48 w-48 animate-pulse rounded-full border border-[#D8E7FF]/80 dark:border-white/10" />
      <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EEF5FF] text-[#286CFF] shadow-[0_14px_32px_rgba(40,108,255,0.14)] dark:bg-[#286CFF]/15 dark:text-[#BFDBFE]">
        <span className="absolute h-full w-full animate-ping rounded-2xl bg-[#286CFF]/10" />
        <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl">
          {icon}
        </span>
      </div>
      <p className="mt-4 text-base font-semibold text-[#0F172A] dark:text-white">{title}</p>
      <p className="mt-2 max-w-sm text-sm leading-6 text-[#64748B] dark:text-slate-300">{description}</p>
    </div>
  )
}

export function StrategyAiPanel({
  title = 'AI Copilot',
  children,
}: {
  title?: string
  children: ReactNode
}) {
  return (
    <div className="flex h-full flex-col rounded-[22px] border border-[#E9D5FF] bg-[#FDF8FF] p-5 shadow-[0_12px_30px_rgba(168,85,247,0.08)] dark:border-white/10 dark:bg-[#2A123D]">
      <div className="flex items-center gap-2">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#A855F7] text-white shadow-[0_12px_24px_rgba(168,85,247,0.24)]">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <p className="font-semibold text-[#0F172A] dark:text-white">{title}</p>
          <p className="text-xs text-[#64748B] dark:text-slate-300">AI-guided governance signal</p>
        </div>
      </div>
      <div className="mt-4 flex flex-1 flex-col">{children}</div>
    </div>
  )
}

export function StrategyActionButton({
  label,
  href,
}: {
  label: string
  href: string
}) {
  return (
    <Button asChild className="h-11 rounded-2xl shadow-none">
      <a href={href}>
        {label}
        <ArrowRight className="h-4 w-4" />
      </a>
    </Button>
  )
}
