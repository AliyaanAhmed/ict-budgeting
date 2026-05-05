import type { ReactNode } from 'react'
import { ShieldCheck, TriangleAlert } from 'lucide-react'
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
  const iconBg = tone === 'danger' ? 'bg-[#EA4F49]' : 'bg-[#286CFF]'
  const ConfirmIcon = tone === 'danger' ? TriangleAlert : ShieldCheck

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0">
        <div className="rounded-t-[28px] border-b border-[var(--border)] px-6 py-4 bg-[var(--muted)]">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconBg} text-white`}>
              <ConfirmIcon className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-[var(--foreground)]">Confirm Action</p>
              {meta}
            </div>
          </div>
        </div>

        <div className="px-6 pb-6 pt-4">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-6">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-10 rounded-xl border-[#E2E8F0] px-5 text-[#64748B] dark:border-white/10 dark:text-slate-200"
            >
              {cancelLabel}
            </Button>
            <Button
              onClick={onConfirm}
              className="h-10 rounded-xl px-5 text-white"
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
