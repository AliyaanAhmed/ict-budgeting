import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-[#E7F5FF] text-[#286CFF]',
        secondary: 'bg-[#F1F5F9] text-[#475569] dark:bg-white/10 dark:text-slate-300',
        destructive: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400',
        success: 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400',
        warning: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
        outline: 'border border-current',
        ai: 'bg-[#FDF4FF] text-[#A21CAF] border border-[#F5D0FE]',
        indigo: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }

