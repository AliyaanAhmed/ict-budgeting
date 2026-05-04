import type { ReactNode } from 'react'
import { ShieldCheck, Sparkles, TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface ConfirmationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  tone?: 'primary' | 'danger'
  meta?: ReactNode
}

export function ConfirmationModal({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  tone = 'primary',
  meta,
}: ConfirmationModalProps) {
  const heroBg = tone === 'danger'
    ? 'linear-gradient(135deg, rgba(234,79,73,0.22), rgba(118,37,24,0.12))'
    : 'linear-gradient(135deg, rgba(40,108,255,0.18), rgba(176,219,255,0.28))'

  const iconBg = tone === 'danger' ? 'bg-[#EA4F49]' : 'bg-[var(--primary)]'
  const ConfirmIcon = tone === 'danger' ? TriangleAlert : ShieldCheck

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden p-0">
        <div className="relative border-b border-black/5 px-6 pb-5 pt-6 dark:border-white/10" style={{ background: heroBg }}>
          <div className="absolute right-20 top-5 h-28 w-28 rounded-full bg-white/25 blur-2xl dark:bg-white/10" />
          <div className="absolute left-12 top-16 h-20 w-20 rounded-full bg-[var(--primary)]/15 blur-xl" />
          <div className="relative flex items-center gap-4">
            <div className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-[24px] ${iconBg} text-white shadow-lg`}>
              <ConfirmIcon className="h-10 w-10" />
            </div>
            <div className="flex-1">
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#475569] shadow-sm dark:bg-white/10 dark:text-slate-200">
                <Sparkles className="h-3.5 w-3.5" />
                Confirmation
              </div>
              {meta}
            </div>
          </div>
        </div>

        <div className="px-6 pb-6 pt-5">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-8">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-12 rounded-2xl border-[#E2E8F0] px-6 text-[#64748B] dark:border-white/10 dark:text-slate-200"
            >
              {cancelLabel}
            </Button>
            <Button
              onClick={onConfirm}
              className="h-12 rounded-2xl px-6 text-white shadow-[0_14px_28px_rgba(40,108,255,0.22)]"
              style={{ backgroundColor: tone === 'danger' ? '#EA4F49' : '#286CFF' }}
            >
              {confirmLabel}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
