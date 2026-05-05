import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatAED(amount: number): string {
  const absoluteAmount = Math.abs(amount)

  if (absoluteAmount >= 1_000_000_000) {
    return `${(amount / 1_000_000_000).toFixed(1)}B`
  }

  if (absoluteAmount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(1)}M`
  }

  if (absoluteAmount >= 1_000) {
    return `${(amount / 1_000).toFixed(1)}K`
  }

  return `${amount}`
}

export function formatAEDFull(amount: number): string {
  return amount.toLocaleString('en-AE')
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}
