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
        'ai-panel',
        compact ? 'p-3' : 'p-5',
        className
      )}
    >
      <div className={cn('flex items-center gap-2', compact ? 'mb-2' : 'mb-3')}>
        <Sparkles className="h-4 w-4 text-[var(--ai-accent)] shrink-0" />
        <span className={cn('font-semibold text-[var(--ai-accent)]', compact ? 'text-sm' : 'text-base')}>
          {title}
        </span>
        <span className="ai-chip ms-auto">
          Coming Soon
        </span>
      </div>
      {description && (
        <p className={cn('ai-panel-body-text', compact ? 'text-xs' : 'text-sm mb-3')}>
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
    <div className={cn('flex items-center gap-2 rounded-[8px] bg-[var(--surface)] border border-[var(--border)] px-3 py-2', className)}>
      <Sparkles className="h-3.5 w-3.5 text-[var(--ai-accent)] shrink-0" />
      <span className="text-xs font-medium text-[var(--ai-accent)]">
        AI Review Insights
      </span>
      {confidence !== undefined && (
        <span className="ml-1 text-xs text-[var(--muted-foreground)]">
          · {confidence}% Confidence
        </span>
      )}
      {issues !== undefined && (
        <span className="ml-1 text-xs text-[var(--muted-foreground)]">
          · {issues} {issues === 1 ? 'issue' : 'issues'}
        </span>
      )}
      <span className="ms-auto inline-flex items-center rounded-full bg-[var(--muted)] px-2 py-0.5 text-xs font-medium text-[var(--muted-foreground)]">
        Coming Soon
      </span>
    </div>
  )
}



