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

const variantStyles: Record<string, { card: string; value: string; iconBg: string; iconColor: string }> = {
  default: {
    card: 'bg-white border-[#E2E8F0] dark:bg-[#1E293B] dark:border-white/10',
    value: 'text-[#0F172A] dark:text-white',
    iconBg: 'bg-[#0F172A]/10 dark:bg-[#0F172A]/20',
    iconColor: 'text-[#0F172A]',
  },
  blue: {
    card: 'bg-white border-[#E2E8F0] dark:bg-[#1E293B] dark:border-white/10',
    value: 'text-[#0B32A4]',
    iconBg: 'bg-[#0B32A4]/10 dark:bg-[#0B32A4]/20',
    iconColor: 'text-[#0B32A4]',
  },
  amber: {
    card: 'bg-white border-[#E2E8F0] dark:bg-[#1E293B] dark:border-white/10',
    value: 'text-[#773610]',
    iconBg: 'bg-[#773610]/10 dark:bg-[#773610]/20',
    iconColor: 'text-[#773610]',
  },
  green: {
    card: 'bg-white border-[#E2E8F0] dark:bg-[#1E293B] dark:border-white/10',
    value: 'text-[#0F172A] dark:text-white',
    iconBg: 'bg-[#0F172A]/10 dark:bg-[#0F172A]/20',
    iconColor: 'text-[#0F172A]',
  },
  red: {
    card: 'bg-white border-[#E2E8F0] dark:bg-[#1E293B] dark:border-white/10',
    value: 'text-[#762518]',
    iconBg: 'bg-[#762518]/10 dark:bg-[#762518]/20',
    iconColor: 'text-[#762518]',
  },
  indigo: {
    card: 'bg-white border-[#E2E8F0] dark:bg-[#1E293B] dark:border-white/10',
    value: 'text-[#701A75]',
    iconBg: 'bg-[#701A75]/10 dark:bg-[#701A75]/20',
    iconColor: 'text-[#701A75]',
  },
  purple: {
    card: 'bg-white border-[#E2E8F0] dark:bg-[#1E293B] dark:border-white/10',
    value: 'text-purple-600',
    iconBg: 'bg-purple-50 dark:bg-purple-900/20',
    iconColor: 'text-purple-500',
  },
  dark: {
    card: 'bg-[#0F172A] border-transparent dark:bg-[#0F172A]',
    value: 'text-white',
    iconBg: 'bg-white/10',
    iconColor: 'text-slate-400',
  },
}

export function StatCard({ label, value, icon, variant = 'default', subtitle, style, className }: StatCardProps) {
  const styles = variantStyles[variant]
  return (
    <div
      className={cn('rounded-[12px] border p-5 shadow-sm animate-fadeInUp relative overflow-hidden min-h-[128px]', styles.card, className)}
      style={style}
    >
      <div className="flex h-full items-start justify-between">
        <div className="flex-1 min-w-0 self-stretch grid grid-rows-[32px_1fr_20px]">
          <div className="flex items-start">
            <p className="text-xs font-medium text-[#475569] dark:text-slate-400 uppercase tracking-wide leading-4">{label}</p>
          </div>
          <div className="flex items-center">
            <p className={cn('text-2xl font-bold truncate leading-none', styles.value)}>{value}</p>
          </div>
          <div className="flex items-end">
            {subtitle ? <p className="text-xs text-[#475569] dark:text-slate-400 leading-4">{subtitle}</p> : null}
          </div>
        </div>
        {icon && (
          <div className={cn('shrink-0 ml-3 mt-1 flex items-center justify-center h-9 w-9 rounded-[10px]', styles.iconBg, styles.iconColor)}>
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}
