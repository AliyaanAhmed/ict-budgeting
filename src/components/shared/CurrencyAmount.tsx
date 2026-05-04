import { cn, formatAED, formatAEDFull } from '@/lib/utils'
import { DirhamIcon } from './DirhamIcon'

interface CurrencyAmountProps {
  amount: number
  full?: boolean
  className?: string
  iconColor?: string
  iconSize?: number
}

export function CurrencyAmount({ amount, full = false, className, iconColor = '#286CFF', iconSize = 14 }: CurrencyAmountProps) {
  const value = full ? formatAEDFull(amount) : formatAED(amount)

  return (
    <span className={cn('inline-flex items-center gap-1.5 font-semibold tracking-tight', className)}>
      <DirhamIcon width={iconSize} height={iconSize} color={iconColor} />
      <span>{value}</span>
    </span>
  )
}
