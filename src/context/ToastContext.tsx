import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { CheckCircle2, Sparkles, X } from 'lucide-react'

interface ToastItem {
  id: number
  title: string
  description?: string
}

interface ToastContextValue {
  showSuccessToast: (title: string, description?: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const showSuccessToast = useCallback((title: string, description?: string) => {
    const id = Date.now() + Math.floor(Math.random() * 1000)
    setToasts((prev) => [...prev, { id, title, description }])
    window.setTimeout(() => dismissToast(id), 3200)
  }, [dismissToast])

  const value = useMemo(() => ({ showSuccessToast }), [showSuccessToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-20 z-[70] flex w-[calc(100vw-2rem)] max-w-[380px] flex-col gap-3 sm:right-5 sm:top-[84px]">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto overflow-hidden rounded-[18px] border border-[#DCE6F1] bg-white shadow-[0_18px_40px_rgba(15,23,42,0.14)] dark:border-white/10 dark:bg-[#1E293B]"
          >
            <div className="border-b border-[#EEF3F8] bg-[#F8FBFF] px-4 py-3 dark:border-white/10 dark:bg-[#0F172A]/30">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-[#EAF4EC] text-[#4A9D5C] dark:bg-[#4A9D5C]/15 dark:text-[#9BD2A7]">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-[#E7F5FF] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#286CFF] dark:bg-[#286CFF]/15 dark:text-[#B0DBFF]">
                    <Sparkles className="h-3 w-3" />
                    Success
                  </div>
                  <p className="text-sm font-semibold text-[#0F172A] dark:text-white">{toast.title}</p>
                </div>
                <button
                  type="button"
                  onClick={() => dismissToast(toast.id)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[#64748B] transition-colors hover:bg-[#EEF3F8] hover:text-[#0F172A] dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            {toast.description && (
              <div className="px-4 py-3">
                <p className="text-xs leading-5 text-[#64748B] dark:text-slate-300">{toast.description}</p>
              </div>
            )}
            <div className="h-1 w-full bg-[#EAF2FF] dark:bg-white/5">
              <div className="h-full w-full bg-[#286CFF]" />
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}
