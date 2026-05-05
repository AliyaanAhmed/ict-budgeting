import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import { AlertTriangle, CheckCircle2, Loader2, Sparkles, X } from 'lucide-react'

interface ToastItem {
  id: number
  state: 'processing' | 'success' | 'error'
  title: string
  description?: string
  progress: number
}

interface ToastContextValue {
  showSuccessToast: (title: string, description?: string) => void
  showErrorToast: (title: string, description?: string) => void
  runActionToast: <T>(
    action: () => Promise<T>,
    options: {
      processingTitle: string
      processingDescription?: string
      successTitle: string
      successDescription?: string
      errorTitle?: string
      minDurationMs?: number
    }
  ) => Promise<T>
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const intervalsRef = useRef<Record<number, number>>({})

  const dismissToast = useCallback((id: number) => {
    const activeTimer = intervalsRef.current[id]
    if (activeTimer) {
      window.clearInterval(activeTimer)
      delete intervalsRef.current[id]
    }
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const showStaticToast = useCallback((state: 'success' | 'error', title: string, description?: string) => {
    const id = Date.now() + Math.floor(Math.random() * 1000)
    setToasts((prev) => [...prev, { id, state, title, description, progress: 100 }])
    window.setTimeout(() => dismissToast(id), 3200)
  }, [dismissToast])

  const showSuccessToast = useCallback((title: string, description?: string) => {
    showStaticToast('success', title, description)
  }, [showStaticToast])

  const showErrorToast = useCallback((title: string, description?: string) => {
    showStaticToast('error', title, description)
  }, [showStaticToast])

  const runActionToast = useCallback(async <T,>(
    action: () => Promise<T>,
    options: {
      processingTitle: string
      processingDescription?: string
      successTitle: string
      successDescription?: string
      errorTitle?: string
      minDurationMs?: number
    }
  ) => {
    const id = Date.now() + Math.floor(Math.random() * 1000)
    const minDurationMs = options.minDurationMs ?? 3400
    const startedAt = Date.now()

    setToasts((prev) => [
      ...prev,
      {
        id,
        state: 'processing',
        title: options.processingTitle,
        description: options.processingDescription,
        progress: 5,
      },
    ])

    intervalsRef.current[id] = window.setInterval(() => {
      setToasts((prev) =>
        prev.map((toast) =>
          toast.id === id && toast.state === 'processing'
            ? { ...toast, progress: Math.min(toast.progress + 3, 95) }
            : toast
        )
      )
    }, 120)

    try {
      const result = await action()
      const elapsed = Date.now() - startedAt
      if (elapsed < minDurationMs) {
        await new Promise((resolve) => window.setTimeout(resolve, minDurationMs - elapsed))
      }
      const activeTimer = intervalsRef.current[id]
      if (activeTimer) {
        window.clearInterval(activeTimer)
        delete intervalsRef.current[id]
      }
      setToasts((prev) =>
        prev.map((toast) =>
          toast.id === id
            ? {
                ...toast,
                state: 'success',
                title: options.successTitle,
                description: options.successDescription,
                progress: 100,
              }
            : toast
        )
      )
      window.setTimeout(() => dismissToast(id), 2600)
      return result
    } catch (error) {
      const elapsed = Date.now() - startedAt
      if (elapsed < minDurationMs) {
        await new Promise((resolve) => window.setTimeout(resolve, minDurationMs - elapsed))
      }
      const activeTimer = intervalsRef.current[id]
      if (activeTimer) {
        window.clearInterval(activeTimer)
        delete intervalsRef.current[id]
      }
      const errorDescription = error instanceof Error ? error.message : 'Something went wrong.'
      setToasts((prev) =>
        prev.map((toast) =>
          toast.id === id
            ? {
                ...toast,
                state: 'error',
                title: options.errorTitle || 'Action failed',
                description: errorDescription,
                progress: 100,
              }
            : toast
        )
      )
      window.setTimeout(() => dismissToast(id), 4200)
      throw error
    }
  }, [dismissToast])

  const isProcessing = toasts.some((toast) => toast.state === 'processing')

  const value = useMemo(
    () => ({ showSuccessToast, showErrorToast, runActionToast }),
    [showSuccessToast, showErrorToast, runActionToast]
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      {isProcessing && (
        <div className="pointer-events-none fixed inset-0 z-[65] backdrop-blur-[4px] bg-[#0F172A]/10 dark:bg-black/25" />
      )}
      <div className="pointer-events-none fixed right-4 top-20 z-[70] flex w-[calc(100vw-2rem)] max-w-[380px] flex-col gap-3 sm:right-5 sm:top-[84px]">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto overflow-hidden rounded-[18px] border border-[#DCE6F1] bg-white shadow-[0_18px_40px_rgba(15,23,42,0.14)] dark:border-white/10 dark:bg-[#1E293B]"
          >
            <div className="border-b border-[#EEF3F8] bg-[#F8FBFF] px-4 py-3 dark:border-white/10 dark:bg-[#0F172A]/30">
              <div className="flex items-center gap-3">
                <div
                  className={[
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px]',
                    toast.state === 'processing' && 'bg-[#E7F5FF] text-[#286CFF] dark:bg-[#286CFF]/15 dark:text-[#B0DBFF]',
                    toast.state === 'success' && 'bg-[#EAF4EC] text-[#4A9D5C] dark:bg-[#4A9D5C]/15 dark:text-[#9BD2A7]',
                    toast.state === 'error' && 'bg-[#FDECEC] text-[#EA4F49] dark:bg-[#EA4F49]/15 dark:text-[#FCA5A5]',
                  ].filter(Boolean).join(' ')}
                >
                  {toast.state === 'processing' && <Loader2 className="h-5 w-5 animate-spin" />}
                  {toast.state === 'success' && <CheckCircle2 className="h-5 w-5 animate-toastSuccess" />}
                  {toast.state === 'error' && <AlertTriangle className="h-5 w-5 animate-toastError" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-[#E7F5FF] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#286CFF] dark:bg-[#286CFF]/15 dark:text-[#B0DBFF]">
                    <Sparkles className="h-3 w-3" />
                    {toast.state === 'processing' ? 'Processing' : toast.state === 'success' ? 'Success' : 'Error'}
                  </div>
                  <p className="text-sm font-semibold text-[#0F172A] dark:text-white">{toast.title}</p>
                </div>
                <button
                  type="button"
                  onClick={() => dismissToast(toast.id)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[#64748B] transition-colors hover:bg-[#EEF3F8] hover:text-[#0F172A] dark:text-slate-100 dark:hover:bg-white/10 dark:hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            {toast.description && (
              <div className="px-4 py-3">
                <p className="text-xs leading-5 text-[#64748B] dark:text-slate-100">{toast.description}</p>
              </div>
            )}
            <div className="h-1 w-full bg-[#EAF2FF] dark:bg-white/5">
              <div
                className={[
                  'h-full transition-[width,background-color] duration-200 ease-linear',
                  toast.state === 'processing' && 'bg-[#286CFF]',
                  toast.state === 'success' && 'bg-[#4A9D5C]',
                  toast.state === 'error' && 'bg-[#EA4F49]',
                ].filter(Boolean).join(' ')}
                style={{ width: `${toast.progress}%` }}
              />
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

