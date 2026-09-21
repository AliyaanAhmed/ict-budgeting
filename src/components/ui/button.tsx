import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[10px] text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] shadow-sm',
        destructive: 'bg-[#EA4F49] text-white hover:bg-red-600',
        outline: 'border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--muted)] text-[var(--foreground)] dark:bg-transparent dark:border-white/10 dark:text-white dark:hover:bg-white/5',
        secondary: 'bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--border)] dark:bg-white/10 dark:text-white',
        ghost: 'hover:bg-[var(--muted)] text-[var(--muted-foreground)] dark:hover:bg-white/5 dark:text-slate-100',
        link: 'text-[var(--primary)] underline-offset-4 hover:underline',
        ai: 'bg-[var(--surface)] border border-[var(--border)] text-[var(--ai-accent)] hover:bg-[var(--muted)] dark:bg-transparent dark:border-white/10 dark:text-[var(--ai-text)] dark:hover:bg-white/5',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-[8px] px-3 text-xs',
        lg: 'h-10 rounded-[10px] px-6',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }



