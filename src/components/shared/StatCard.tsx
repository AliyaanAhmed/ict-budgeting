import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: string | number
  icon?: ReactNode
  variant?: 'default' | 'blue' | 'amber' | 'green' | 'red' | 'indigo' | 'purple' | 'dark'
  subtitle?: string
  style?: React.CSSProperties
  className?: string
}

const variantStyles: Record<string, { card: string; value: string; icon: string }> = {
  default: {
    card: 'bg-white border-[#E2E8F0] dark:bg-[#1E293B] dark:border-white/10',
    value: 'text-[#0F172A] dark:text-white',
    icon: 'text-[#475569]',
  },
  blue: {
    card: 'bg-white border-[#E2E8F0] dark:bg-[#1E293B] dark:border-white/10',
    value: 'text-[#286CFF]',
    icon: 'text-[#286CFF]',
  },
  amber: {
    card: 'bg-white border-[#E2E8F0] dark:bg-[#1E293B] dark:border-white/10',
    value: 'text-amber-600',
    icon: 'text-amber-500',
  },
  green: {
    card: 'bg-white border-[#E2E8F0] dark:bg-[#1E293B] dark:border-white/10',
    value: 'text-green-600',
    icon: 'text-green-500',
  },
  red: {
    card: 'bg-white border-[#E2E8F0] dark:bg-[#1E293B] dark:border-white/10',
    value: 'text-red-600',
    icon: 'text-red-500',
  },
  indigo: {
    card: 'bg-white border-[#E2E8F0] dark:bg-[#1E293B] dark:border-white/10',
    value: 'text-indigo-600',
    icon: 'text-indigo-500',
  },
  purple: {
    card: 'bg-white border-[#E2E8F0] dark:bg-[#1E293B] dark:border-white/10',
    value: 'text-purple-600',
    icon: 'text-purple-500',
  },
  dark: {
    card: 'bg-[#0F172A] border-transparent dark:bg-[#0F172A]',
    value: 'text-white',
    icon: 'text-slate-400',
  },
}

export function StatCard({ label, value, icon, variant = 'default', subtitle, style, className }: StatCardProps) {
  const styles = variantStyles[variant]
  return (
    <div
      className={cn('rounded-[12px] border p-5 shadow-sm animate-fadeInUp', styles.card, className)}
      style={style}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-[#475569] dark:text-slate-400 uppercase tracking-wide mb-1">{label}</p>
          <p className={cn('text-2xl font-bold font-mono truncate', styles.value)}>{value}</p>
          {subtitle && <p className="text-xs text-[#475569] dark:text-slate-400 mt-1">{subtitle}</p>}
        </div>
        {icon && (
          <div className={cn('shrink-0 ml-3', styles.icon)}>{icon}</div>
        )}
      </div>
    </div>
  )
}
