import { Bot, Sparkles } from 'lucide-react'
import { createPortal } from 'react-dom'
import { useEffect, useId, useRef, useState } from 'react'
import { parseSmeAiRecommendation } from '@/services/smeAiRecommendation'

export function SmeAiRecommendation({ raw, onApply, variant = 'icon' }: { raw?: string | null; variant?: 'icon' | 'panel' | 'static'; onApply?: (value: NonNullable<ReturnType<typeof parseSmeAiRecommendation>>) => void }) {
  const isPanel = Boolean(onApply) || variant === 'panel'
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const popup = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ left: 0, top: 0 })
  const id = useId()
  useEffect(() => {
    if (!open || isPanel) return
    const closeOutside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node) && !popup.current?.contains(event.target as Node)) setOpen(false)
    }
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
        root.current?.querySelector('button')?.focus()
      }
    }
    document.addEventListener('pointerdown', closeOutside)
    document.addEventListener('keydown', escape)
    const reposition = () => {
      const rect = root.current?.getBoundingClientRect()
      if (!rect) return
      const width = Math.min(320, window.innerWidth - 32)
      const height = popup.current?.offsetHeight ?? 240
      setPosition({ left: Math.max(16, Math.min(rect.left, window.innerWidth - width - 16)), top: Math.max(16, rect.bottom + height + 8 < window.innerHeight ? rect.bottom + 8 : rect.top - height - 8) })
    }
    reposition()
    window.addEventListener('resize', reposition)
    window.addEventListener('scroll', reposition, true)
    return () => {
      window.removeEventListener('resize', reposition)
      window.removeEventListener('scroll', reposition, true)
      document.removeEventListener('pointerdown', closeOutside)
      document.removeEventListener('keydown', escape)
    }
  }, [open, isPanel])
  useEffect(() => setOpen(false), [raw])
  const suggestion = parseSmeAiRecommendation(raw)
  if (!suggestion) return null
  if (variant === 'static') return (
    <div className="relative isolate h-full min-w-0 overflow-hidden rounded-2xl border border-[#E9D5FF] bg-gradient-to-b from-[#FDF7FF] to-white p-4 dark:border-white/10 dark:from-[#2A123D] dark:to-[#1E293B]">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden text-[#A855F7]/[0.12] dark:text-[#E9D5FF]/[0.12]">
        <Sparkles className="absolute left-5 top-3 h-4 w-4" />
        <Bot className="absolute bottom-3 left-16 h-5 w-5" />
        <Sparkles className="absolute left-[34%] top-1/2 h-4 w-4" />
        <Bot className="absolute right-16 top-3 h-5 w-5" />
        <Sparkles className="absolute bottom-4 right-8 h-4 w-4" />
      </div>
      <p className="flex items-center gap-2 text-xs font-semibold text-[#9333EA] dark:text-purple-200"><Sparkles className="h-4 w-4" />AI Recommendation</p>
      <span className="mt-2 inline-flex rounded-full bg-[#F3E8FF] px-3 py-1 text-sm font-semibold text-[#9333EA] dark:bg-purple-900/40 dark:text-purple-200">{suggestion.recommended === 2 ? 'Recommended' : 'Not Recommended'}</span>
      <p className="mt-2 whitespace-pre-line break-words text-sm text-[#64748B] dark:text-slate-300">{suggestion.reason || 'No explanation was provided with this AI recommendation.'}</p>
    </div>
  )
  const content = <>
    <p className="text-sm font-semibold text-[#9333EA] dark:text-[#E9D5FF]">{isPanel ? 'Reason' : `AI Recommendation: ${suggestion.recommended === 2 ? 'Recommended' : 'Not Recommended'}`}</p>
    <p className="mt-2 whitespace-pre-line break-words text-sm leading-6 text-[#475569] dark:text-slate-200">{suggestion.reason || 'No explanation was provided with this AI recommendation.'}</p>
    {onApply && <button type="button" onClick={() => onApply(suggestion)} className="mt-3 rounded-full border border-[#D8B4FE] px-3 py-1.5 text-xs font-semibold text-[#9333EA] hover:bg-[#F3E8FF] dark:text-[#E9D5FF] dark:hover:bg-white/10">Apply AI Recommendation</button>}
  </>
  return isPanel ? <div className="relative isolate overflow-hidden rounded-xl border border-[#E9D5FF] bg-white dark:border-white/10 dark:bg-[#1E293B]">
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#FDF7FF] to-white dark:from-[#2A123D] dark:to-[#1E293B]" />
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden text-[#A855F7]/[0.12] dark:text-[#E9D5FF]/[0.12]">
      <Sparkles className="absolute left-5 top-3 h-4 w-4" />
      <Bot className="absolute bottom-3 left-16 h-5 w-5" />
      <Sparkles className="absolute left-[34%] top-1/2 h-4 w-4 -translate-y-1/2 text-[#A855F7]/[0.1] dark:text-[#E9D5FF]/[0.1]" />
      <Bot className="absolute left-1/2 top-3 h-4 w-4 -translate-x-1/2 text-[#A855F7]/[0.1] dark:text-[#E9D5FF]/[0.1]" />
      <Sparkles className="absolute right-24 top-3 h-5 w-5" />
      <Bot className="absolute bottom-3 right-36 h-6 w-6" />
      <Sparkles className="absolute bottom-4 right-8 h-4 w-4" />
    </div>
    <div className="relative flex w-full items-center gap-3 px-4 pt-4 text-left">
      <span className="rounded-xl bg-[#F3E8FF] p-2.5 text-[#9333EA] dark:bg-purple-900/40 dark:text-purple-200"><Sparkles className="h-5 w-5" /></span>
      <span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-[#9333EA] dark:text-purple-200">AI Recommendation</span><span className="mt-1 block text-sm font-medium text-[#0F172A] dark:text-white">{suggestion.recommended === 2 ? 'Recommended' : 'Not Recommended'}</span></span>
    </div>
    <div className="relative p-4">{content}</div>
  </div> :
    <div ref={root} className="relative inline-block">
      <button type="button" aria-label="View AI recommendation" aria-expanded={open} aria-controls={open ? id : undefined} onClick={() => setOpen(!open)} className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#E9D5FF] bg-[#FDF7FF] text-[#A855F7] transition-colors hover:bg-[#FAF5FF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#A855F7] dark:border-white/10 dark:bg-white/5 dark:text-[#E9D5FF]"><Sparkles className="h-3.5 w-3.5" /></button>
      {open && createPortal(<div ref={popup} id={id} role="region" aria-label="AI recommendation" style={position} className="fixed z-[1000] max-h-[min(18rem,calc(100vh-2rem))] w-80 max-w-[calc(100vw-2rem)] overflow-y-auto rounded-2xl border border-[#E9D5FF] bg-white p-4 shadow-lg dark:border-white/10 dark:bg-[#1E293B]">{content}</div>, document.body)}
    </div>
}
