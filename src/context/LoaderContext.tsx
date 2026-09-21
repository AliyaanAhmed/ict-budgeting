import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { AppLoader } from '@/components/shared/AppLoader'

interface LoaderContextValue {
  showLoader: (message?: string) => void
  hideLoader: () => void
}

const LoaderContext = createContext<LoaderContextValue | null>(null)

export function LoaderProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [message, setMessage] = useState('Processing request...')

  const showLoader = useCallback((nextMessage?: string) => {
    if (nextMessage) setMessage(nextMessage)
    setIsOpen(true)
  }, [])

  const hideLoader = useCallback(() => {
    setIsOpen(false)
  }, [])

  const value = useMemo(() => ({ showLoader, hideLoader }), [showLoader, hideLoader])

  return (
    <LoaderContext.Provider value={value}>
      {children}
      <AppLoader open={isOpen} message={message} />
    </LoaderContext.Provider>
  )
}

export function useLoader() {
  const context = useContext(LoaderContext)
  if (!context) {
    throw new Error('useLoader must be used within LoaderProvider')
  }
  return context
}

