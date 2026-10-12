import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface AppTooltipProps {
  content: ReactNode
  children: ReactNode
  disabled?: boolean
  side?: TooltipPrimitive.TooltipContentProps['side']
  align?: TooltipPrimitive.TooltipContentProps['align']
  className?: string
}

export function AppTooltip({
  content,
  children,
  disabled = false,
  side = 'top',
  align = 'center',
  className,
}: AppTooltipProps) {
  if (disabled || !content) {
    return <>{children}</>
  }

  return (
    <TooltipPrimitive.Provider delayDuration={180} skipDelayDuration={80}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side={side}
            align={align}
            sideOffset={8}
            collisionPadding={12}
            className={cn(
              'z-50 max-w-[280px] rounded-xl border border-[#DDEBFF] bg-white px-3 py-2 text-xs font-medium leading-5 text-[#334155] shadow-[0_14px_34px_rgba(15,23,42,0.16)] animate-in fade-in-0 zoom-in-95 dark:border-white/10 dark:bg-[#0F172A] dark:text-slate-100',
              className
            )}
          >
            {content}
            <TooltipPrimitive.Arrow className="fill-white dark:fill-[#0F172A]" />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  )
}
