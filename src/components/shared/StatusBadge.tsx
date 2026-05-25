import type { ProjectStatus } from '@/data/db'
import { cn } from '@/lib/utils'

const statusConfig: Record<ProjectStatus, { label: string; className: string }> = {
  Draft: {
    label: 'Draft',
    className:
      'border border-[#CFE0FF] bg-[#E7F5FF] text-[#286CFF] dark:border-[#4D73B8] dark:bg-[#1E3A68] dark:text-[#DBEAFE]',
  },
  'Needs Work': { label: 'Needs Work', className: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-100' },
  'Submitted to Reviewer': { label: 'Submitted to Reviewer', className: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' },
  'Reviewer Review Completed': { label: 'Reviewer Review Completed', className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' },
  'Clarification Required': { label: 'Clarification Required', className: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400' },
  'Submitted to Approver': { label: 'Submitted to Approver', className: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400' },
  Approved: { label: 'Approved', className: 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' },
  'Submitted to DGE': { label: 'Submitted to DGE', className: 'bg-violet-50 text-violet-700 dark:bg-violet-900/20 dark:text-violet-300' },
}

interface StatusBadgeProps {
  status: ProjectStatus
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] ?? { label: status, className: 'bg-slate-100 text-slate-600' }
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap', config.className, className)}>
      {config.label}
    </span>
  )
}

export function RiskBadge({ risk }: { risk?: string | null }) {
  if (!risk) return null

  const config = {
    Low: 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400',
    Medium: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
    High: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400',
  }[risk] ?? 'bg-slate-100 text-slate-600'
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', config)}>
      {risk} Risk
    </span>
  )
}

