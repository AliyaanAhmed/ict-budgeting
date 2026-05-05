import { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { useRole } from '@/context/RoleContext'
import { translatePage } from '@/lib/pageTranslator'

export function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isDark, setIsDark] = useState(false)
  const [isRTL, setIsRTL] = useState(false)
  const [isTranslating, setIsTranslating] = useState(false)
  const { activeRole } = useRole()
  const navigate = useNavigate()
  const location = useLocation()

  const sidebarWidth = sidebarCollapsed ? 72 : 248

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDark])

  useEffect(() => {
    const shouldBlurDuringTransition = isRTL

    if (isRTL) {
      document.documentElement.dir = 'rtl'
      document.documentElement.lang = 'ar'
      document.body.dir = 'rtl'
    } else {
      document.documentElement.dir = 'ltr'
      document.documentElement.lang = 'en'
      document.body.dir = 'ltr'
    }

    let cancelled = false

    setIsTranslating(shouldBlurDuringTransition)

    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          await translatePage(isRTL)
        } finally {
          if (!cancelled && shouldBlurDuringTransition) {
            window.setTimeout(() => {
              if (!cancelled) setIsTranslating(false)
            }, 120)
          } else if (!cancelled) {
            setIsTranslating(false)
          }
        }
      })()
    }, 50)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [isRTL])

  useEffect(() => {
    if (!isRTL) return

    let cancelled = false
    setIsTranslating(true)

    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          await translatePage(true)
        } finally {
          if (!cancelled) {
            window.setTimeout(() => {
              if (!cancelled) setIsTranslating(false)
            }, 120)
          }
        }
      })()
    }, 50)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [location.pathname, isRTL])

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [location.pathname])

  // When role changes, redirect to that role's dashboard
  useEffect(() => {
    const rolePaths: Record<string, string> = {
      Respondent: '/respondent/dashboard',
      Reviewer: '/reviewer/dashboard',
      Approver: '/approver/dashboard',
    }
    const targetBase = `/${activeRole.toLowerCase()}`
    if (!location.pathname.startsWith(targetBase)) {
      navigate(rolePaths[activeRole])
    }
  }, [activeRole]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen bg-[var(--background)]" dir={isRTL ? 'rtl' : 'ltr'}>
      <Sidebar collapsed={sidebarCollapsed} isRTL={isRTL} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <Header
        sidebarWidth={sidebarWidth}
        isDark={isDark}
        onToggleDark={() => setIsDark(!isDark)}
        isRTL={isRTL}
        onToggleRTL={() => setIsRTL(!isRTL)}
        isTranslating={isTranslating}
      />
      <main
        className="pt-16 transition-[padding-left,padding-right] duration-300 ease-in-out will-change-[padding-left,padding-right]"
        style={isRTL ? { paddingRight: sidebarWidth, paddingLeft: 0 } : { paddingLeft: sidebarWidth, paddingRight: 0 }}
      >
        <div
          className="relative p-6 animate-fadeIn transition-[filter,opacity] duration-200 ease-out"
          style={{
            filter: isTranslating ? 'blur(6px)' : 'blur(0px)',
            opacity: isTranslating ? 0.7 : 1,
            pointerEvents: isTranslating ? 'none' : 'auto',
          }}
        >
          <Outlet />
        </div>
      </main>
    </div>
  )
}
