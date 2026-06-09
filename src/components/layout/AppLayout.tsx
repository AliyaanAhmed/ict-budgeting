import { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { AppEmptyState } from './AppEmptyState'
import { useRole } from '@/context/RoleContext'
import { useCycle } from '@/context/CycleContext'
import { translatePage } from '@/lib/pageTranslator'

export function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isDark, setIsDark] = useState(false)
  const [isRTL, setIsRTL] = useState(false)
  const [isTranslating, setIsTranslating] = useState(false)
  const {
    activeRole,
    availableRoleOptions,
    hasAnyRole,
    rolesResolved,
    setActiveRoleOption,
  } = useRole()
  const { cyclesResolved, hasCycles } = useCycle()
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
 
    return () => {
      cancelled = true
    }
  }, [location.pathname, isRTL])

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [location.pathname])

  // When role changes, redirect to that role's landing page
  useEffect(() => {
    if (!activeRole) return
    const rolePaths: Record<string, string> = {
      Respondent: '/respondent/dashboard',
      Reviewer: '/reviewer/dashboard',
      Approver: '/approver/dashboard',
      'ICT Admin': '/admin/assessment-cycles',
      'ICT - Strategy Team': '/strategy-team/dashboard',
      'ICT - SME Team': '/sme-team/dashboard',
    }
    const roleBasePaths: Record<string, string> = {
      Respondent: '/respondent',
      Reviewer: '/reviewer',
      Approver: '/approver',
      'ICT Admin': '/admin',
      'ICT - Strategy Team': '/strategy-team',
      'ICT - SME Team': '/sme-team',
    }
    const targetBase = roleBasePaths[activeRole]
    if (!location.pathname.startsWith(targetBase)) {
      navigate(rolePaths[activeRole])
    }
  }, [activeRole]) // eslint-disable-line react-hooks/exhaustive-deps

  const adminOption = availableRoleOptions.find((option) => option.role === 'ICT Admin')

  if (rolesResolved && !hasAnyRole) {
    return (
      <AppEmptyState
        variant="role"
        title="No workspace role is assigned"
        description="Your account is active, but it is not linked to any ADGE or DGE budgeting role for this workspace yet."
        supportingText="Once a role is assigned, your dashboards, queues, and actions will appear automatically the next time the workspace is opened."
      />
    )
  }

  if (rolesResolved && cyclesResolved && hasAnyRole && !hasCycles) {
    return (
      <AppEmptyState
        variant="cycle"
        title="No budgeting cycle is available"
        description="There is currently no active ICT budgeting cycle available for this workspace, so the application cannot open a role dashboard yet."
        supportingText={
          adminOption
            ? 'You can switch to the ICT Admin workspace to create or manage a cycle, then return here once the cycle is available.'
            : 'Please contact the ICT Admin team to create or reopen a cycle for this environment.'
        }
        primaryAction={
          adminOption
            ? {
                label: 'Open ICT Admin Workspace',
                onClick: () => {
                  setActiveRoleOption(adminOption.key)
                  navigate('/admin/assessment-cycles')
                },
              }
            : undefined
        }
      />
    )
  }

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
