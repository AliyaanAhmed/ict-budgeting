import { cn, formatAED, formatAEDFull } from '@/lib/utils'
import { DirhamIcon } from './DirhamIcon'

interface CurrencyAmountProps {
  amount: number
  full?: boolean
  className?: string
  iconColor?: string
  iconSize?: number
  valueClassName?: string
}

export function CurrencyAmount({
  amount,
  full = false,
  className,
  iconColor = '#286CFF',
  iconSize = 14,
  valueClassName,
}: CurrencyAmountProps) {
  const value = full ? formatAEDFull(amount) : formatAED(amount)

  return (
    <span className={cn('inline-flex min-w-0 items-center gap-1.5 font-semibold tracking-tight', className)}>
      <DirhamIcon width={iconSize} height={iconSize} color={iconColor} />
      <span className={cn('min-w-0', valueClassName)}>{value}</span>
    </span>
  )
}
