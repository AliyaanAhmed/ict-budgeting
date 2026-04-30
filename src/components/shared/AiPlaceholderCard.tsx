import { Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AiPlaceholderCardProps {
  title: string
  description?: string
  children?: React.ReactNode
  className?: string
  compact?: boolean
}

export function AiPlaceholderCard({ title, description, children, className, compact }: AiPlaceholderCardProps) {
  return (
    <div
      className={cn(
        'rounded-[12px] border border-dashed border-[#D946EF] bg-[#FDF4FF] dark:bg-purple-900/10 dark:border-purple-700',
        compact ? 'p-3' : 'p-5',
        className
      )}
    >
      <div className={cn('flex items-center gap-2', compact ? 'mb-2' : 'mb-3')}>
        <Sparkles className="h-4 w-4 text-[#D946EF] shrink-0" />
        <span className={cn('font-semibold text-[#A21CAF] dark:text-purple-300', compact ? 'text-sm' : 'text-base')}>
          {title}
        </span>
        <span className="ml-auto inline-flex items-center rounded-full bg-[#F5D0FE] px-2 py-0.5 text-xs font-medium text-[#A21CAF] dark:bg-purple-800/40">
          Coming Soon
        </span>
      </div>
      {description && (
        <p className={cn('text-[#A21CAF]/70 dark:text-purple-300/70', compact ? 'text-xs' : 'text-sm mb-3')}>
          {description}
        </p>
      )}
      {children}
    </div>
  )
}

interface AiInsightsBannerProps {
  confidence?: number
  issues?: number
  className?: string
}

export function AiInsightsBanner({ confidence, issues, className }: AiInsightsBannerProps) {
  return (
    <div className={cn('flex items-center gap-2 rounded-[8px] bg-[#FDF4FF] border border-[#F5D0FE] px-3 py-2 dark:bg-purple-900/10 dark:border-purple-700', className)}>
      <Sparkles className="h-3.5 w-3.5 text-[#D946EF] shrink-0" />
      <span className="text-xs font-medium text-[#A21CAF] dark:text-purple-300">
        AI Review Insights
      </span>
      {confidence !== undefined && (
        <span className="ml-1 text-xs text-[#A21CAF]/70 dark:text-purple-300/70">
          · {confidence}% Confidence
        </span>
      )}
      {issues !== undefined && (
        <span className="ml-1 text-xs text-[#A21CAF]/70 dark:text-purple-300/70">
          · {issues} {issues === 1 ? 'issue' : 'issues'}
        </span>
      )}
      <span className="ml-auto inline-flex items-center rounded-full bg-[#F5D0FE] px-2 py-0.5 text-xs font-medium text-[#A21CAF]">
        Coming Soon
      </span>
    </div>
  )
}
