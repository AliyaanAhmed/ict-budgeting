import { useMemo, useState } from 'react'
import { HelpCircle, MessageSquareText, Send, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { AttachmentIconPicker } from '@/components/shared/AttachmentIconPicker'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog'

interface ClarificationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectName: string
  onSubmit: (payload: { message: string; files?: File[]; target?: string }) => void
  quickPrompts?: string[]
  targetOptions?: Array<{ value: string; label: string }>
}

export function ClarificationModal({
  open,
  onOpenChange,
  projectName,
  onSubmit,
  quickPrompts = [],
  targetOptions = [],
}: ClarificationModalProps) {
  const [message, setMessage] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [target, setTarget] = useState(() => targetOptions[0]?.value ?? '')

  const isValid = useMemo(() => message.trim().length > 0, [message])
  const visibleQuickPrompts = useMemo(
    () => Array.from(new Set(quickPrompts.map((prompt) => prompt.trim()).filter(Boolean))).slice(0, 4),
    [quickPrompts]
  )

  const handleClose = (next: boolean) => {
    onOpenChange(next)
    if (!next) {
      setMessage('')
      setFiles([])
      setTarget(targetOptions[0]?.value ?? '')
    }
  }

  const handleSubmit = () => {
    if (!isValid) return
    onSubmit({ message: message.trim(), files, target })
    handleClose(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[1040px] overflow-hidden rounded-[28px] border border-[#D9E6F5] bg-white p-0 dark:border-white/10 dark:bg-[#162339]">
        <div className="border-b border-[var(--border)] bg-[var(--muted)] py-4 pl-6 pr-12">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#286CFF] text-white">
              <HelpCircle className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-lg font-bold text-[var(--foreground)]">Raise Clarification</DialogTitle>
              <DialogDescription className="text-xs text-[var(--muted-foreground)] truncate">{projectName}</DialogDescription>
            </div>
          </div>
        </div>

        <div className="px-6 pb-6 pt-5">
          <div className="space-y-5">
            <div>
              {targetOptions.length > 0 ? (
                <div className="mb-4 flex flex-wrap gap-2">
                  {targetOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setTarget(option.value)}
                      className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                        target === option.value
                          ? 'border-[#286CFF] bg-[#286CFF] text-white'
                          : 'border-[#D7E4F4] bg-white text-[#0F172A] hover:bg-[#EEF5FF] dark:border-white/10 dark:bg-white/5 dark:text-white'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              ) : null}
              <div className="mb-2 flex items-center justify-between gap-3">
                <label className="inline-flex items-center gap-2 text-sm font-semibold text-[#0F172A] dark:text-white">
                  <MessageSquareText className="h-3.5 w-3.5" />
                  Clarification Message
                </label>
              </div>
              <Textarea
                rows={6}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe exactly what needs to be clarified..."
                className="rounded-2xl border-[var(--border)] text-[14px] leading-6"
              />
            </div>

            {visibleQuickPrompts.length > 0 && (
              <div className="flex flex-wrap gap-2.5">
                {visibleQuickPrompts.map((prompt, index) => (
                  <button
                    key={`${index}-${prompt}`}
                    type="button"
                    onClick={() => setMessage(prompt)}
                    className="inline-flex max-w-full items-center gap-2 rounded-full border border-[#E9D5FF] bg-white px-4 py-2 text-left transition-colors hover:border-[#C084FC] hover:bg-[#FDF8FF] dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                  >
                    <Sparkles className="h-3.5 w-3.5 shrink-0 text-[#A855F7] dark:text-[#E9D5FF]" />
                    <span className="truncate text-sm text-[#475569] dark:text-slate-200">{prompt}</span>
                  </button>
                ))}
              </div>
            )}

            <div className="rounded-2xl border border-[#DDEBFF] bg-[#F8FBFF] px-3 py-2 dark:border-white/10 dark:bg-white/5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="mr-1 text-xs font-semibold text-[#64748B] dark:text-slate-300">
                  Supporting files
                </span>
                <AttachmentIconPicker files={files} onChange={setFiles} maxSizeMB={20} />
              </div>
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
