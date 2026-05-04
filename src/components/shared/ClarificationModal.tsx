import { useMemo, useState } from 'react'
import { HelpCircle, MessageSquareText, WandSparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface ClarificationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectName: string
  onSubmit: (payload: { message: string }) => void
}

const SUGGESTIONS = [
  'Please provide a stronger business justification for the requested budget.',
  'Please attach the missing supporting documents and procurement references.',
  'Please clarify the CapEx and OpEx split with supporting assumptions.',
]

export function ClarificationModal({ open, onOpenChange, projectName, onSubmit }: ClarificationModalProps) {
  const [message, setMessage] = useState('')

  const isValid = useMemo(() => message.trim().length >= 12, [message])

  const handleClose = (next: boolean) => {
    onOpenChange(next)
    if (!next) {
      setMessage('')
    }
  }

  const handleSubmit = () => {
    if (!isValid) return
    onSubmit({ message: message.trim() })
    handleClose(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="overflow-hidden p-0">
        <div
          className="border-b border-black/5 px-6 pb-5 pt-6 dark:border-white/10"
          style={{ background: 'linear-gradient(135deg, rgba(40,108,255,0.14), rgba(176,219,255,0.24))' }}
        >
          <div className="flex items-center gap-4">
            <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-[22px] bg-[#286CFF] text-white shadow-lg">
              <HelpCircle className="h-9 w-9" />
            </div>
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#475569] shadow-sm dark:bg-white/10 dark:text-slate-200">
                <WandSparkles className="h-3.5 w-3.5" />
                Clarification Request
              </div>
              <p className="text-[13px] font-medium text-[#0F172A] dark:text-white">{projectName}</p>
              <p className="text-xs text-[#64748B] dark:text-slate-300">Send a precise request back to the project owner.</p>
            </div>
          </div>
        </div>

        <div className="px-6 pb-6 pt-5">
          <DialogHeader>
            <DialogTitle className="text-[18px]">Raise Clarification</DialogTitle>
            <DialogDescription className="text-[14px] leading-6">
              Ask for the missing detail clearly so the next review cycle can move faster.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-5 space-y-5">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#64748B] dark:text-slate-300">Quick prompts</p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setMessage(item)}
                    className="rounded-full border border-[#DCE6F1] bg-[#F8FAFC] px-3 py-1.5 text-[11px] font-medium text-[#475569] transition-colors hover:border-[#286CFF] hover:text-[#286CFF] dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:border-[#4F98FF] dark:hover:text-[#4F98FF]"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#64748B] dark:text-slate-300">
                <MessageSquareText className="h-3.5 w-3.5" />
                Clarification Message
              </label>
              <Textarea
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe exactly what needs to be clarified..."
                className="rounded-2xl border-[var(--border)] text-[14px] leading-6"
              />
              <p className="mt-2 text-[11px] text-[#94A3B8]">Be specific so the next submission cycle can move faster.</p>
            </div>
          </div>

          <DialogFooter className="mt-8">
            <Button
              variant="outline"
              onClick={() => handleClose(false)}
              className="h-11 rounded-2xl border-[#E2E8F0] px-6 text-[#64748B] dark:border-white/10 dark:text-slate-200"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!isValid}
              className="h-11 rounded-2xl px-6 text-white disabled:opacity-50"
              style={{ backgroundColor: '#286CFF' }}
            >
              Send Clarification
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
