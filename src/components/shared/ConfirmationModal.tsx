import type { ReactNode } from 'react'
import { ShieldCheck, TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  const isDanger = tone === 'danger'
  const ConfirmIcon = isDanger ? TriangleAlert : ShieldCheck

  const iconBg      = isDanger ? '#EA4F49' : '#286CFF'
  const headerBg    = isDanger ? '#FFF5F5' : '#F0F7FF'
  const headerBorder= isDanger ? '#FECACA' : '#BFDBFE'
  const confirmBg   = isDanger ? '#EA4F49' : '#286CFF'
  const confirmHover= isDanger ? '#D63F39' : '#1A5CE8'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 overflow-hidden max-w-[440px] gap-0 border border-[#E2E8F0] shadow-[0_4px_20px_rgba(15,23,42,0.10)] dark:border-white/10">

        {/* Header */}
        <div
          className="px-6 py-5 border-b dark:border-white/10"
          style={{ background: headerBg, borderBottomColor: headerBorder }}
        >
          <div className="flex items-start gap-4">
            {/* Icon chip */}
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white"
              style={{ backgroundColor: iconBg }}
            >
              <ConfirmIcon className="h-5 w-5" strokeWidth={2} />
            </div>

            {/* Title + meta */}
            <div className="min-w-0 flex-1 pt-0.5">
              <DialogTitle className="text-[15px] font-bold leading-snug text-[#0F172A] dark:text-white">
                {title}
              </DialogTitle>
              {meta && (
                <div className="mt-1 [&_p]:!m-0 [&_p]:!text-[13px] [&_p]:!font-medium [&_p]:!text-[#64748B] dark:[&_p]:!text-slate-300">
                  {meta}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="bg-white px-6 py-5 dark:bg-[#1E293B]">
          <DialogDescription className="text-sm leading-relaxed text-[#475569] dark:text-slate-300">
            {description}
          </DialogDescription>
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-[#E2E8F0] bg-white px-6 py-4 dark:border-white/10 dark:bg-[#1E293B]">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-10 min-w-[112px] rounded-xl border-[#E2E8F0] px-5 text-sm font-medium text-[#64748B] hover:bg-[#F8FAFC] dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/5"
          >
            {cancelLabel}
          </Button>
          <Button
            onClick={onConfirm}
            className="h-10 min-w-[150px] rounded-xl px-5 text-sm font-semibold text-white transition-colors"
            style={{ backgroundColor: confirmBg }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = confirmHover)}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = confirmBg)}
          >
            {confirmLabel}
          </Button>
        </div>

      </DialogContent>
    </Dialog>
  )
}
