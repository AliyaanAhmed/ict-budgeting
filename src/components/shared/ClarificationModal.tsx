import { useMemo, useState } from 'react'
import { HelpCircle, MessageSquareText, Send, WandSparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogFooter,
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

  const handleAutofill = () => {
    const nextSuggestion = SUGGESTIONS.find((suggestion) => suggestion !== message) ?? SUGGESTIONS[0]
    setMessage(nextSuggestion)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="p-0">
        <div className="rounded-t-[28px] border-b border-[var(--border)] bg-[var(--muted)] py-4 pl-6 pr-12">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#286CFF] text-white">
              <HelpCircle className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-[var(--foreground)]">Raise Clarification</h2>
              <p className="text-xs text-[var(--muted-foreground)] truncate">{projectName}</p>
            </div>
          </div>
        </div>

        <div className="px-6 pb-6 pt-4">

          <div className="space-y-5">
           

            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#64748B] dark:text-white">
                  <MessageSquareText className="h-3.5 w-3.5" />
                  Clarification Message
                </label>
                <button
                  type="button"
                  onClick={handleAutofill}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#DDEBFF] bg-[#F8FBFF] text-[#64748B] transition-colors hover:border-[#286CFF] hover:bg-[#E7F5FF] hover:text-[#286CFF] dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
                  title="Autofill clarification"
                  aria-label="Autofill clarification"
                >
                  <WandSparkles className="h-4 w-4" />
                </button>
              </div>
              <Textarea
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe exactly what needs to be clarified..."
                className="rounded-xl border-[var(--border)] text-[14px] leading-6"
              />
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button
              variant="outline"
              onClick={() => handleClose(false)}
              className="h-10 rounded-xl border-[#E2E8F0] px-5 text-[#64748B] dark:border-white/10 dark:text-slate-200"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!isValid}
              className="h-10 rounded-xl px-5 text-white disabled:opacity-50"
              style={{ backgroundColor: '#286CFF' }}
            >
              <Send className="h-4 w-4" />
              Send Clarification
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
